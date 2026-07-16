import React, { useState, useEffect, useRef, useCallback } from "react";
import NebulaLayout from "../../layouts/NebulaLayout";
import Sidebar from "../../components/chat/Sidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import RightDrawer from "../../components/chat/RightDrawer";
import PublicFeed from "../../components/chat/PublicFeed"; 
import MemberProfile from "../../components/chat/MemberProfile";
import { getSocket } from "../../socket";
import Cookies from "js-cookie";
import { usePublicFeed } from "../../hooks/usePublicFeed";
import { useActivityTracker } from '../../contexts/ActivityTrackerContext';
import axios from "axios"; 
import { motion, AnimatePresence } from "framer-motion";

// --- HELPERS ---
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

const base64ToBlob = (base64, mimeType = "audio/webm") => {
    try {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    } catch (e) { return null; }
};

export default function Chat() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
      const cookieUser = Cookies.get("user");
      return cookieUser ? JSON.parse(cookieUser) : null;
  });
  const token = Cookies.get("token");
  
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [lastMessages, setLastMessages] = useState({}); 
  
  const [viewMode, setViewMode] = useState("chat"); 
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false); 
  const [rightDrawerMode, setRightDrawerMode] = useState("ai"); 
  const [activePostForComments, setActivePostForComments] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [profileUserId, setProfileUserId] = useState(null);
  
  // Pagination
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  // Hook Destructuring
  const { posts, isLoading, createPost, deletePost, toggleLike, addComment = () => {} } = usePublicFeed();
  const { trackEvent } = useActivityTracker();
  
  const activeChatIdRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => { activeChatIdRef.current = activeChat?.id; }, [activeChat]);

  // --- 1. FETCH USERS ---
  const fetchUsers = useCallback(async (page = 1, reset = false) => {
    if (isFetchingUsers) return; 
    setIsFetchingUsers(true);
    try {
        if (!token) return; // Prevent 401 if token is missing
        
        const url = searchTerm
  ? `http://localhost:5000/api/v1/users?search=${searchTerm}&page=${page}&limit=20`
  : `http://localhost:5000/api/v1/users?page=${page}&limit=20`;


        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        
        if (data.success) {
            if (data.users.length < 20 && !searchTerm) setHasMoreUsers(false);
            setUsers(prev => {
                if(searchTerm || reset) return data.users;
                const newUsers = data.users.filter(u => !prev.some(p => p._id === u._id));
                return [...prev, ...newUsers];
            });
        }
    } catch (err) { console.error(err); }
    setIsFetchingUsers(false);
  }, [token, searchTerm]);

  useEffect(() => {
  setUserPage(1);
  setHasMoreUsers(true);
  setUsers([]);           // ✅ IMPORTANT
  fetchUsers(1, true);    // ✅ load first page immediately
}, [searchTerm]);



  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    if (socket && currentUser) {
        socket.emit("register-user", currentUser._id || currentUser.id);
    }
    
    const onlineHandler = (list) => setOnlineUsers(list);
    
    if (socket) {
        socket.on("online-users", onlineHandler);
    }

    return () => {
        if (socket) {
            socket.off("online-users", onlineHandler);
        }
    };
  }, [currentUser]); 

  const handleLoadMoreUsers = () => {
    if (hasMoreUsers && !isFetchingUsers && !searchTerm) {
        const nextPage = userPage + 1;
        fetchUsers(nextPage);
        setUserPage(nextPage);
    }
};

  // --- ⚡ FIX: Instant Reordering ---
  const moveUserToTop = useCallback((userId) => {
    setUsers(prev => {
        const index = prev.findIndex(u => (u._id || u.id) === userId);
        if (index === -1) return prev; // Not in current loaded list, let it be
        const updated = [...prev];
        const [target] = updated.splice(index, 1);
        return [target, ...updated];
    });
  }, []);


  // --- 2. MESSAGE MAPPER ---
  const mapMessage = (m, myId) => {
    const mime = m.mimeType || "audio/webm";

    // Audio Reconstruction
    let reconstructedUrl = m.audioOriginal || null;
    let reconstructedBlob = m.audioOriginalBlob || null;
    if (!reconstructedUrl && m.originalAudioBase64) {
        reconstructedBlob = base64ToBlob(m.originalAudioBase64, mime);
        if (reconstructedBlob) reconstructedUrl = URL.createObjectURL(reconstructedBlob);
    }

    // Attachment Reconstruction
    let attachmentUrl = m.attachmentUrl || null;
    if (!attachmentUrl && m.attachmentBase64) {
        let fileMime = m.mimeType || 'application/octet-stream';
        if (!m.mimeType) {
             if (m.attachmentType === 'image') fileMime = 'image/png'; 
             if (m.attachmentType === 'video') fileMime = 'video/mp4';
        }
        attachmentUrl = `data:${fileMime};base64,${m.attachmentBase64}`;
    }

    let senderId = m.fromUserId || m.from;
    if (typeof senderId === 'object' && senderId !== null) {
        senderId = senderId._id || senderId.id;
    }
    const isMe = String(senderId) === String(myId);

    return {
        id: m._id || m.id || Date.now(),
        uuid: m.uuid,
        textOriginal: m.content?.original || m.message || "", 
        content: m.content || { original: m.message, translations: {} }, 
        
        audioOriginal: reconstructedUrl, 
        audioOriginalBlob: reconstructedBlob,
        attachmentUrl: attachmentUrl || m.media?.url,
        attachmentType: m.attachmentType || m.media?.fileType,
        
        deliveryStatus: m.deliveryStatus || (m.isRead ? 'seen' : 'sent'),

        fromMe: (m.fromMe === true) ? true : isMe, 
        isRead: m.isRead || false,
        ts: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt || new Date(),
        metadata: m.metadata || {},
    };
  };

  // --- 3. ACTIONS ---
  const handleSelectChat = async (user) => {
    setViewMode("chat");
    setRightDrawerMode("ai"); 
    setMsgPage(1); 
    setHasMoreMessages(true);
    
    if (window.innerWidth > 1024) setRightDrawerOpen(true); else setRightDrawerOpen(false);
    
    const myId = currentUser._id || currentUser.id;
    setActiveChat({
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      messages: [],
      isBlocked: user.isBlocked || false
    });

    socketRef.current?.emit("mark-read", { senderId: user._id });

    try {
        const res = await fetch(
            `http://localhost:5000/api/v1/messages/history/${user._id}?myId=${myId}&page=1&limit=30`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        const data = await res.json();
        const history = data.success ? data.messages.map(m => mapMessage(m, myId)) : [];
        if (data.messages.length < 30) setHasMoreMessages(false);
        setActiveChat(prev => ({ ...prev, messages: history }));
    } catch (e) { console.error(e); }
  };

  const loadMoreMessages = async () => {
    if (!activeChat || !hasMoreMessages || isFetchingMessages) return;
    setIsFetchingMessages(true);
    const nextPage = msgPage + 1;
    try {
        const myId = currentUser._id || currentUser.id;
        const res = await fetch(
            `http://localhost:5000/api/v1/messages/history/${activeChat.id}?myId=${myId}&page=${nextPage}&limit=30`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
            if (data.messages.length < 30) setHasMoreMessages(false);
            const newMessages = data.messages.map(m => mapMessage(m, myId));
            setActiveChat(prev => ({ ...prev, messages: [...newMessages, ...prev.messages] }));
            setMsgPage(nextPage);
        }
    } catch (e) { console.error(e); }
    setIsFetchingMessages(false);
  };

  // --- 4. SEND MESSAGE (FIXED DB ERROR) ---
  // --- 4. SEND MESSAGE (FIXED) ---
  const sendMessage = async (msgOrFile, targetLang) => {
    if (!activeChat) return;
    
    // @ASH Logic
    if (!(msgOrFile instanceof Blob) && typeof msgOrFile === 'string' && msgOrFile.trim().toLowerCase().startsWith("@ash")) {
        const prompt = msgOrFile.replace(/@ash/i, "").trim();
        setRightDrawerMode("ai");
        setRightDrawerOpen(true);
        setAiProcessing(true);
        setAiReply("");

        try {
            const res = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "karma", prompt: prompt, stream: false })
            });
            const data = await res.json();
            setAiReply(data.response || "Neural Link Error.");
        } catch (err) { setAiReply("Ash core offline."); } 
        finally { setAiProcessing(false); }
        return; 
    }

    const socket = getSocket();
    const currentUserId = currentUser?._id || currentUser?.id;
    // Generate UUID for Message Reliability Layer
    const messageUuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // File Handling via HTTP Upload instead of Base64
    const isFile = msgOrFile instanceof Blob || msgOrFile instanceof File;
    let fileType = null;
    let previewUrl = null;
    let uploadedMediaData = null;

    if (isFile) {
        previewUrl = URL.createObjectURL(msgOrFile);
        if (msgOrFile.type.startsWith("image/")) fileType = "image";
        else if (msgOrFile.type.startsWith("video/")) fileType = "video";
        else if (msgOrFile.type.startsWith("audio/")) fileType = "audio";
        else fileType = "file";
        
        // Optimistic UI text
        const formData = new FormData();
        formData.append("media", msgOrFile);
        try {
            const res = await axios.post("http://localhost:5000/api/v1/messages/upload", formData, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                uploadedMediaData = { url: res.data.url, mimeType: res.data.mimeType, fileType };
            }
        } catch(e) {
            console.error("Media upload failed", e);
            alert("Media upload failed!");
            return;
        }
    }

    let textPayload = isFile ? (fileType === 'image' ? "📷 Image" : fileType === 'audio' ? "🎤 Voice Message" : "📁 Attachment") : msgOrFile;

    trackEvent(`[DATA] type:MESSAGE | to:${activeChat.name} | len:${textPayload.length} | preview:"${textPayload.substring(0, 20)}..."`);

    const newMsgObj = {
        id: messageUuid, _id: messageUuid, uuid: messageUuid,
        textOriginal: textPayload,
        content: { original: textPayload, translations: {} },
        fromMe: true, fromUserId: currentUserId, toUserId: activeChat.id,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(),
        
        audioOriginal: fileType === 'audio' ? previewUrl : null,
        attachmentUrl: (fileType === 'image' || fileType === 'video') ? previewUrl : null,
        attachmentType: fileType,
        
        deliveryStatus: 'sending', // Reliability Layer
        isRead: false
    };

    setActiveChat((prev) => ({ ...prev, messages: [...prev.messages, newMsgObj] }));
    moveUserToTop(activeChat.id);
    
    if (socket) {
      socket.emit("private-message", {
        uuid: messageUuid,
        toUserId: activeChat.id, 
        message: textPayload, 
        targetLang: targetLang, 
        media: uploadedMediaData,
      }, (ack) => {
          // ACK Received from server
          setActiveChat(prev => {
              if(!prev || prev.id !== activeChat.id) return prev;
              const msgs = prev.messages.map(m => m.uuid === messageUuid ? { ...m, deliveryStatus: ack.success ? ack.deliveryStatus : 'failed', id: ack.messageId || m.id } : m);
              return { ...prev, messages: msgs };
          });
      });
    }
  };

  useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;

      const msgHandler = (payload) => {
          const { fromUserId, toUserId, message } = payload;
          const myId = currentUser._id || currentUser.id;
          const otherId = String(fromUserId) === String(myId) ? toUserId : fromUserId;

          let autoRead = false;
          if (activeChatIdRef.current === fromUserId) {
              socket.emit("mark-read", { senderId: fromUserId });
              autoRead = true;
          }

          // Acknowledge receipt to server instantly
          socket.emit("message-delivered", { uuid: payload.uuid, messageId: payload._id, senderId: fromUserId });

          setLastMessages(prev => ({
            ...prev,
            [otherId]: {
                text: message || "Attachment", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead: false, isOwn: String(fromUserId) === String(myId)
            }
          }));
          moveUserToTop(otherId);

          setActiveChat(prev => {
              if(!prev || !((prev.id === fromUserId) || (String(fromUserId) === String(myId) && prev.id === toUserId))) return prev;
              
              const isDuplicate = prev.messages.some(m => (payload.uuid && m.uuid === payload.uuid) || (payload._id && m.id === payload._id));
              if (isDuplicate) return prev;
              
              const mapped = mapMessage(payload, myId);
              if (autoRead) mapped.isRead = true; 
              mapped.deliveryStatus = 'delivered'; // Since we just received it

              // STRICT SORTING: Always apply Server-Timestamp sorting prior to render
              const strictlySortedMsgs = [...prev.messages, mapped].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              return { ...prev, messages: strictlySortedMsgs };
          });
      };

      const readHandler = ({ byUserId }) => {
          if (activeChatIdRef.current === byUserId) {
              setActiveChat(prev => {
                  if(!prev) return prev;
                  return { ...prev, messages: prev.messages.map(m => m.fromMe ? { ...m, isRead: true, deliveryStatus: 'seen' } : m) };
              });
          }
      };

      const deliveryHandler = ({ uuid }) => {
          setActiveChat(prev => {
              if(!prev) return prev;
              return { ...prev, messages: prev.messages.map(m => m.uuid === uuid ? { ...m, deliveryStatus: 'delivered' } : m) };
          });
      };

      const offlineSyncHandler = (msgs) => {
          const myId = currentUser._id || currentUser.id;
          msgs.forEach(payload => {
              // Mark visually as delivered immediately upon sync
              payload.deliveryStatus = 'delivered'; 
              setActiveChat(prev => {
                  if(!prev || prev.id !== payload.from) return prev;
                  const isDuplicate = prev.messages.some(m => m.uuid === payload.uuid || m.id === payload._id);
                  if (isDuplicate) return prev;
                  
                  // STRICT SORTING: Guarantee offline message floods don't jumble
                  const strictlySortedMsgs = [...prev.messages, mapMessage(payload, myId)].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  return { ...prev, messages: strictlySortedMsgs };
              });
              socket.emit("message-delivered", { uuid: payload.uuid, messageId: payload._id, senderId: payload.from });
          });
      };

      socket.on("private-message", msgHandler);
      socket.on("messages-read", readHandler);
      socket.on("message-delivered", deliveryHandler);
      socket.on("offline-messages", offlineSyncHandler);
      
      return () => {
          socket.off("private-message", msgHandler);
          socket.off("messages-read", readHandler);
          socket.off("message-delivered", deliveryHandler);
          socket.off("offline-messages", offlineSyncHandler);
      };
  }, [currentUser]);

  const handleAvatarChange = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
        const previewUrl = URL.createObjectURL(file);
        const tempUser = { ...currentUser, avatar: previewUrl };
        setCurrentUser(tempUser); 
        const res = await axios.post("http://localhost:5000/api/v1/users/avatar", formData, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.data.success) {
            const finalUser = { ...currentUser, avatar: res.data.avatarUrl };
            setCurrentUser(finalUser);
            Cookies.set("user", JSON.stringify(finalUser), { expires: 7 });
        }
    } catch (err) { alert("Failed to upload image."); }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!activeChat) return;
    const updatedMessages = activeChat.messages.filter(m => m.id !== messageId);
    setActiveChat(prev => ({ ...prev, messages: updatedMessages }));
    try { await axios.delete(`http://localhost:5000/api/v1/messages/${messageId}`, { headers: { "Authorization": `Bearer ${token}` } }); } catch (err) { console.error("Delete failed", err); }
  };

  const handleDeleteChat = async (targetUserId) => {
    if(!window.confirm("Delete conversation?")) return;
    setUsers(prev => prev.filter(u => u._id !== targetUserId));
    if (activeChat?.id === targetUserId) setActiveChat(null);
    try { await axios.post("http://localhost:5000/api/v1/messages/clear", { targetId: targetUserId }, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
  };

  const handleBlockUser = async () => {};
  const handleUnblockUser = async () => {};
  const handleClearChat = () => { if(activeChat) handleDeleteChat(activeChat.id); };
  const handleStartChatFromFeed = async (id) => {};
  const handleOpenComments = (post) => { 
      setActivePostForComments(post);
      setRightDrawerMode("comments");
      setRightDrawerOpen(true);
  };

  const handleViewProfile = (userId) => {
      const cleanId = (typeof userId === 'object' && userId !== null) ? (userId._id || userId.id) : userId;
      setProfileUserId(String(cleanId || (currentUser?._id || currentUser?.id)));
      setViewMode("profile");
  };

  const handleAddCommentWrapper = async (postId, text) => {
      await addComment(postId, text);
      setActivePostForComments(prev => {
          if (!prev || prev.id !== postId) return prev;
          const newComment = {
              user: currentUser.name || "You",
              avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`,
              text,
              time: 'Just now'
          };
          return {
              ...prev,
              comments: (prev.comments || 0) + 1,
              commentsList: [...(prev.commentsList || []), newComment]
          };
      });
  };

  if (!token || !currentUser) return null;

  return (
    <NebulaLayout>
      <div className="absolute inset-0 bg-[#000000] -z-20 overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(168, 85, 247, 0.2) 41px, rgba(168, 85, 247, 0.2) 42px), repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(168, 85, 247, 0.2) 41px, rgba(168, 85, 247, 0.2) 42px)` }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_130%)] opacity-90" />
          <div className="absolute bottom-[-30%] left-0 right-0 h-[800px] bg-purple-900/20 blur-[150px] pointer-events-none mix-blend-screen" />
      </div>

      <div className="flex h-screen w-full relative z-10 bg-transparent overflow-hidden">
            <div className={`${activeChat ? 'hidden lg:flex' : 'flex w-full'} lg:w-[380px] h-full border-r border-white/5 flex-col flex-shrink-0 bg-[#050508]/40 backdrop-blur-2xl relative z-20`}>
                <Sidebar
                    chats={users}
                    activeChatId={activeChat?.id}
                    onSelectChat={handleSelectChat}
                    onlineUsers={onlineUsers}
                    viewMode={viewMode}
                    onViewChange={setViewMode}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    lastMessages={lastMessages} 
                    onLoadMoreUsers={handleLoadMoreUsers}
                    hasMoreUsers={hasMoreUsers}
                    loadingUsers={isFetchingUsers}
                    currentUser={currentUser}
                    onAvatarChange={handleAvatarChange}
                    onDeleteChat={handleDeleteChat}
                    onBlockUser={handleBlockUser}
                    onViewProfile={handleViewProfile}
                />
            </div>
            
            <div className={`${!activeChat ? 'hidden lg:flex' : 'flex'} flex-1 h-full relative z-10 bg-transparent min-w-0 flex-col`}>
                {viewMode === "chat" ? (
                    <ChatWindow 
                        chat={activeChat} 
                        onSend={sendMessage} 
                        aiProcessing={aiProcessing} 
                        currentUser={currentUser} 
                        onBlock={() => handleBlockUser(activeChat.id)}
                        onUnblock={() => handleUnblockUser(activeChat.id)}
                        onClear={handleClearChat}
                        onDeleteMessage={handleDeleteMessage} 
                        isOnline={onlineUsers.includes(activeChat?.id)}
                        onLoadMoreMessages={loadMoreMessages}
                        hasMoreMessages={hasMoreMessages}
                        loadingMessages={isFetchingMessages}
                        onBack={() => setActiveChat(null)} 
                        setCurrentUser={setCurrentUser}
                        onViewProfile={handleViewProfile}
                    />
                ) : viewMode === "profile" ? (
                    <MemberProfile 
                        currentUser={currentUser}
                        targetUserId={profileUserId || currentUser?._id || currentUser?.id}
                        onStartChat={(id) => {
                             const user = users.find(u => (u._id || u.id) === id);
                             if(user) handleSelectChat(user);
                        }} 
                        onOpenComments={handleOpenComments} 
                        onAvatarChange={handleAvatarChange}
                        onBack={() => setViewMode(profileUserId === (currentUser?._id || currentUser?.id) ? "chat" : "feed")}
                    />
                ) : (
                    <PublicFeed 
                        posts={posts} 
                        isLoading={isLoading} 
                        onCreatePost={createPost} 
                        onDeletePost={deletePost}
                        onToggleLike={toggleLike}
                        onStartChat={handleStartChatFromFeed} 
                        onOpenComments={handleOpenComments} 
                        onViewProfile={(id) => handleViewProfile(id || currentUser?._id || currentUser?.id)}
                    />
                )}
            </div>

            <AnimatePresence>
                {rightDrawerOpen && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 360, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute right-0 top-0 bottom-0 z-50 lg:relative lg:z-0 h-full border-l border-white/5 flex-shrink-0 bg-[#050508]/90 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <RightDrawer 
                            visible={true} 
                            onClose={() => setRightDrawerOpen(false)} 
                            mode={rightDrawerMode} 
                            chat={activeChat} 
                            aiReply={aiReply} 
                            aiProcessing={aiProcessing} 
                            activePost={activePostForComments} 
                            onAddComment={handleAddCommentWrapper} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
      </div>
    </NebulaLayout>
  );
}