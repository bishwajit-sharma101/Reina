const asyncHandler = require("express-async-handler");
const Message = require("./models/message.model");
const xss = require("xss"); // ⚡ FIX: Added for security

const saveMessage = asyncHandler(async (req, res) => {
  const { from, to, message } = req.body;
  if (!from || !to || !message) return res.status(400).json({ success: false, message: "Missing fields" });

  const saved = await Message.create({ 
    from, to, content: { original: xss(message) } 
  });
  res.status(201).json({ success: true, data: saved });
});

const getChatHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const myId = req.user._id;
  const limit = parseInt(req.query.limit) || 30; 
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { from: myId, to: userId },
      { from: userId, to: myId }
    ]
  })
  .sort({ createdAt: -1 }) 
  .skip(skip)
  .limit(limit)
  .lean(); 

  res.json({ success: true, messages: messages.reverse() });
});

const cacheTranslation = asyncHandler(async (req, res) => {
  const { messageId, languageCode, translatedText } = req.body;
  if (!messageId || !languageCode || !translatedText) return res.status(400).json({ success: false });

  // ⚡ FIX: Verify user is sender or receiver (IDOR Protection)
  const message = await Message.findById(messageId);
  if (!message) {
      res.status(404);
      throw new Error("Message not found");
  }

  if (message.from.toString() !== req.user._id.toString() && message.to.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to cache translation for this message");
  }

  await Message.findByIdAndUpdate(messageId, { 
      $set: { [`content.translations.${languageCode}`]: translatedText } 
  });
  res.json({ success: true });
});

// NEW: Delete a single message
const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
        res.status(404);
        throw new Error("Message not found");
    }

    // Only author can delete
    if (message.from.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized");
    }

    await message.deleteOne();
    res.json({ success: true, message: "Message deleted" });
});

// NEW: Clear entire chat history
const clearChat = asyncHandler(async (req, res) => {
    const { targetId } = req.body;
    const myId = req.user._id;

    await Message.deleteMany({
        $or: [
            { from: myId, to: targetId },
            { from: targetId, to: myId }
        ]
    });

    res.json({ success: true, message: "Chat cleared" });
});

// NEW: Mark messages as read (API fallback for Socket)
const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { senderId } = req.body;
    const myId = req.user._id;

    await Message.updateMany(
        { from: senderId, to: myId, isRead: false },
        { $set: { isRead: true } }
    );
    res.json({ success: true });
});

// NEW: Upload media handler
const uploadMedia = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const mediaUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: mediaUrl, mimeType: req.file.mimetype });
});

module.exports = { 
    saveMessage, 
    getChatHistory, 
    cacheTranslation,
    deleteMessage,
    clearChat,
    markMessagesAsRead,
    uploadMedia
};