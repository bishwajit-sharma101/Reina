const Message = require("../modules/chat/models/message.model.js");
const User = require("../modules/user-management/models/user.model.js");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const mongoose = require("mongoose");
const crypto = require("crypto"); 
const xss = require("xss");

const onlineUsers = new Map();
const messageRateLimits = new Map(); 

const { aiQueue } = require("../api/v1/ai/aiQueue.js");

// HELPER: AI Pipeline via BullMQ
const aiPipelineQueue = async (messageId, text, targetLang, userId, userRole) => {
    try {
        await aiQueue.add("translate", {
            messageId,
            text,
            target_lang: targetLang,
            userId,
            userRole,
            context: [] // We'll skip complex context for inline messages to save RAM
        });
    } catch(e) {
        console.error("Failed to enqueue AI:", e);
    }
};

module.exports = function initSocket(server) {
  const io = new Server(server, {
    pingTimeout: 5000,
    pingInterval: 10000, 
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    }
  });

  io.use((socket, next) => {
    try {
      let token = null;
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token) return next(new Error("Authentication error: No token provided"));

      const secret = (process.env.JWT_SECRET || "").trim();
      const decoded = jwt.verify(token, secret);
      
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
          return next(new Error("Authentication error: Token expired"));
      }
      
      socket.userId = decoded.id; 
      socket.tokenExp = decoded.exp; // Track for revalidation
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  // ⚡ FIX: Auth Revalidation Cron (Security Layer)
  // Forcibly disconnects users if their JWT expires while connected
  setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      io.sockets.sockets.forEach((s) => {
          if (s.tokenExp && s.tokenExp < now) {
              console.log(`🔴 Forcing disconnect logic. Token expired for user ${s.userId}`);
              s.emit("session-expired");
              s.disconnect(true);
          }
      });
  }, 60000); // Check every minute

  io.on("connection", async (socket) => {
    console.log("⚡ User connected:", socket.userId);

    onlineUsers.set(socket.userId, socket.id);
    // Overwrite lastSeen when online
    await User.findByIdAndUpdate(socket.userId, { lastSeen: null });
    io.emit("online-users", Array.from(onlineUsers.keys()));

    // --- PHASE 2: OFFLINE MESSAGE DELIVERY ---
    try {
        const pendingMsgs = await Message.find({ to: socket.userId, deliveryStatus: 'sent' }).lean();
        if (pendingMsgs.length > 0) {
            console.log(`📩 Delivering ${pendingMsgs.length} offline messages to ${socket.userId}`);
            socket.emit("offline-messages", pendingMsgs);
            
            // Mark as delivered in DB
            const pendingIds = pendingMsgs.map(m => m._id);
            await Message.updateMany(
                { _id: { $in: pendingIds } },
                { $set: { deliveryStatus: 'delivered' } }
            );

            // Notify original senders
            for (const msg of pendingMsgs) {
                const senderSocket = onlineUsers.get(msg.from.toString());
                if (senderSocket) {
                    io.to(senderSocket).emit("message-delivered", { uuid: msg.uuid, messageId: msg._id });
                }
            }
        }
    } catch (err) {
        console.error("Offline sync error", err);
    }

    socket.on("register-user", (userId) => {
        if (userId !== socket.userId) return;
        onlineUsers.set(userId, socket.id);
        io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // --- PHASE 5: TYPING INDICATORS ---
    socket.on("typing-start", ({ toUserId }) => {
        const targetSocketId = onlineUsers.get(toUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit("user-typing", { fromUserId: socket.userId });
        }
    });

    socket.on("typing-stop", ({ toUserId }) => {
        const targetSocketId = onlineUsers.get(toUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit("user-stopped-typing", { fromUserId: socket.userId });
        }
    });

    // --- PHASE 1: MESSAGE RELIABILITY & ACKs ---
    // Added callback for ACK
    socket.on("private-message", async (payload, ackCallback) => {
      try {
        const userId = socket.userId;
        const { toUserId, message, uuid, media, targetLang } = payload;

        // Fetch Sender to check for Admin status (Skip limits)
        const sender = await User.findById(userId).select("role");
        const isAdmin = sender && sender.role === 'admin';
        
        // Ensure UUID is present or generate one
        const messageUuid = uuid || crypto.randomUUID();

        if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
            if (typeof ackCallback === 'function') ackCallback({ success: false, error: "Invalid Recipient" });
            return;
        }
        if (userId === toUserId) return; // Prevent self-messaging loop

        // Per-User Message Spam Limiter (Task 7)
        const now = Date.now();
        let record = messageRateLimits.get(userId);
        if (!record || now - record.lastReset > 60000) {
          record = { count: 0, lastReset: now };
          messageRateLimits.set(userId, record);
        }
        if (record.count >= 70 && !isAdmin) { 
          if (typeof ackCallback === 'function') ackCallback({ success: false, error: "Rate limit exceeded. 70 msgs/min allowed." });
          socket.emit("message-failed", { error: "You are sending messages too fast." });
          return; 
        }
        record.count++;

        // Prevent XSS 
        const cleanMessage = xss(message);

        // ⚡ FIX: Update Interactivity / Sorting Logic
        const updateInteraction = async (ownerId, peerId) => {
            try {
                // Upsert logic: Update timestamp if exists, otherwise push new contact
                const updated = await User.findOneAndUpdate(
                    { _id: ownerId, "contacts.user": peerId },
                    { $set: { "contacts.$.lastMessageAt": now } },
                    { new: true }
                );
                if (!updated) {
                    await User.findByIdAndUpdate(ownerId, {
                        $push: { contacts: { user: peerId, lastMessageAt: now } }
                    });
                }
            } catch (e) { console.error("History sort update failed", e); }
        };

        // Update for both participants
        await Promise.all([
            updateInteraction(userId, toUserId),
            updateInteraction(toUserId, userId)
        ]);

        // Blocking & Recipient Data Check
        const recipient = await User.findById(toUserId).select("blockedUsers preferredLanguage");
        if (recipient && recipient.blockedUsers.includes(userId)) {
            if (typeof ackCallback === 'function') ackCallback({ success: false, error: "Blocked" });
            socket.emit("message-failed", { error: "You cannot message this user." });
            return; 
        }

        // Save Message (Base64 Killer integrated)
        const isRecipientOnline = onlineUsers.has(toUserId);
        
        // --- 🔴 IDEMPOTENCY / UNIQUE DB CHECK ---
        let savedMessage;
        try {
            savedMessage = await Message.create({
                uuid: messageUuid,
                from: userId,
                to: toUserId,
                deliveryStatus: isRecipientOnline ? 'delivered' : 'sent',
                content: { original: cleanMessage || "Attachment", translations: {} },
                media: media || null 
            });
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                // Duplicate UUID detected (Idempotency trigger)
                console.warn(`Idempotency: Ignored duplicate message UUID ${messageUuid}`);
                if (typeof ackCallback === 'function') ackCallback({ success: true, uuid: messageUuid, deliveryStatus: 'sent' });
                return;
            }
            throw dbErr; // Rethrow if it's a different DB issue
        }

        // Offline / Queue Trigger
        if (recipient && recipient.preferredLanguage && recipient.preferredLanguage !== 'en') {
             aiPipelineQueue(savedMessage._id, cleanMessage, recipient.preferredLanguage, userId, sender?.role);
        }

        const enrichedPayload = {
          ...payload,
          uuid: messageUuid,
          _id: savedMessage._id,
          createdAt: savedMessage.createdAt,
          fromUserId: userId, 
          message: cleanMessage,             
          content: savedMessage.content,
          deliveryStatus: savedMessage.deliveryStatus,
          media: savedMessage.media,
          isRead: false
        };

        // Emit to target
        if (isRecipientOnline) {
          io.to(onlineUsers.get(toUserId)).emit("private-message", enrichedPayload);
          // Auto-delivered
        }

        // ACK back to sender immediately!
        if (typeof ackCallback === 'function') {
            ackCallback({ 
                success: true, 
                messageId: savedMessage._id, 
                uuid: messageUuid, 
                deliveryStatus: savedMessage.deliveryStatus 
            });
        }

      } catch (err) {
        console.error("❌ Message save error:", err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, error: "Server Error" });
        socket.emit("message-failed", { error: "Message failed" });
      }
    });

    // Client actively confirms they received a message
    socket.on("message-delivered", async ({ uuid, messageId, senderId }) => {
        try {
            await Message.updateOne({ _id: messageId }, { $set: { deliveryStatus: 'delivered' } });
            const senderSocket = onlineUsers.get(senderId);
            if (senderSocket) {
                io.to(senderSocket).emit("message-delivered", { uuid, messageId });
            }
        } catch(e) {}
    });

    socket.on("delete-message", async ({ messageId, toUserId }) => {
        try {
            if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;
            const message = await Message.findById(messageId);
            if (!message || message.from.toString() !== socket.userId) return;

            if (toUserId && mongoose.Types.ObjectId.isValid(toUserId)) {
                const targetSocketId = onlineUsers.get(toUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit("message-deleted", { messageId });
                }
            }
        } catch (e) {}
    });

    socket.on("mark-read", async ({ senderId }) => {
        try {
            if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) return;
            await Message.updateMany(
                { from: senderId, to: socket.userId, $or: [{ isRead: false }, { deliveryStatus: { $ne: 'seen' } }] },
                { $set: { isRead: true, deliveryStatus: 'seen' } }
            );
            const senderSocket = onlineUsers.get(senderId);
            if (senderSocket) {
                io.to(senderSocket).emit("messages-read", { byUserId: socket.userId });
            }
        } catch (e) {
            console.error("Read receipt error", e);
        }
    });

    socket.on("disconnect", async () => {
      console.log("🔴 Socket disconnected:", socket.id);
      if (socket.userId) {
          onlineUsers.delete(socket.userId);
          messageRateLimits.delete(socket.userId);
          // Update Last Seen
          await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
      }
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });
};