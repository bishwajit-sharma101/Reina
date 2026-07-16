"use client";

import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import Cookies from "js-cookie";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { MoreVertical, Phone, Video, Languages, Trash2, ShieldBan, ShieldCheck, Loader2, Sparkles, Orbit, Activity, Zap, Hexagon, ArrowLeft, Check, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==================================================================================
// 1. LANGUAGE OPTIONS
// ==================================================================================
const LANGUAGES = [
    { code: "none", name: "Universal", native: "No Translation" },
    { code: "en", name: "English", native: "English" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "fr", name: "French", native: "Français" },
    { code: "de", name: "German", native: "Deutsch" },
    { code: "ja", name: "Japanese", native: "日本語" },
    { code: "ru", name: "Russian", native: "Русский" },
    { code: "zh", name: "Chinese", native: "中文" },
];

// ==================================================================================
// 2. THE "SYSTEM STANDBY" EMPTY STATE (3D Gyroscope)
// ==================================================================================
const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Center Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 text-center">
            {/* The 3D Gyro Animation */}
            <div className="relative w-72 h-72 mx-auto mb-10 flex items-center justify-center perspective-1000">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-white/5 rounded-full border-dashed opacity-50"/>
                <motion.div animate={{ rotateX: 360, rotateY: 180 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-8 border border-brand-500/20 rounded-full" style={{ transformStyle: "preserve-3d" }}/>
                <motion.div animate={{ rotateX: -360, rotateY: 90 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-16 border border-cyan-500/20 rounded-full" style={{ transformStyle: "preserve-3d" }}/>
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative z-20 flex flex-col items-center justify-center">
                    <Hexagon size={48} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] fill-white/5" />
                </motion.div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter">Astrix<span className="text-brand-500">.Core</span></h1>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span></span>
                <span className="text-[10px] text-brand-300 font-mono tracking-[0.3em] uppercase">System Standby</span>
            </div>
        </div>
    </div>
);

// ==================================================================================
// 3. THE GLASS HEADER (With Language Selector Logic)
// ==================================================================================
const ChatHeader = ({ activeChat, isOnline, targetLang, setTargetLang, onClear, onBlock, onUnblock, onBack, onViewProfile, currentUser }) => {
    const [menu, setMenu] = useState(false);
    const [langMenu, setLangMenu] = useState(false);
    
    return (
        <div className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#050508]/40 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
            
            {/* Left: Info */}
                <div 
                  className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onViewProfile && onViewProfile(activeChat.id || activeChat._id)}
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Fallback to DiceBear if no avatar */}
                        <img 
                            src={activeChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.name}`} 
                            className="w-10 h-10 rounded-full border border-white/10 relative object-cover" 
                            alt="Avatar" 
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#050508] rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-600'}`} />
                    </div>

                    <div>
                        <h2 className="text-white font-bold text-lg tracking-tight leading-none mb-1">{activeChat.name}</h2>
                        <div className="text-[10px] font-mono tracking-[0.15em] uppercase flex items-center gap-2 opacity-70">
                            {isOnline ? (
                                <><Activity size={10} className="text-green-400"/> <span className="text-green-400 font-semibold">Online</span></>
                            ) : (
                                <><Orbit size={10} className="text-slate-500"/> <span className="text-slate-500">Offline</span></>
                            )}
                        </div>
                    </div>
                </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Language Selector */}
                <div className="relative">
                    <button 
                        onClick={() => setLangMenu(!langMenu)} 
                        className={`hidden md:flex h-9 px-4 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all items-center gap-2 ${targetLang !== "none" ? "bg-brand-500/20 border-brand-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"}`}
                    >
                        <Languages size={14} /> 
                        {LANGUAGES.find(l => l.code === targetLang)?.name || "Universal"}
                    </button>

                    <AnimatePresence>
                        {langMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                className="absolute right-0 top-full mt-2 w-56 bg-[#050508]/95 border border-white/10 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-2xl max-h-64 overflow-y-auto custom-scrollbar"
                            >
                                {LANGUAGES.map(l => (
                                    <button 
                                        key={l.code} 
                                        onClick={() => { setTargetLang(l.code); setLangMenu(false); }} 
                                        className={`w-full text-left px-4 py-3 text-xs flex justify-between items-center hover:bg-white/5 transition-colors ${targetLang === l.code ? "text-brand-400 font-bold bg-brand-500/10" : "text-slate-300"}`}
                                    >
                                        <span>{l.name} <span className="opacity-50 ml-1 font-normal">({l.native})</span></span>
                                        {targetLang === l.code && <Check size={12}/>}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="h-6 w-px bg-white/10 hidden md:block" />
                
                <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"><Phone size={18} /></button>
                <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors hidden md:block"><Video size={18} /></button>
                
                <button onClick={() => onViewProfile(currentUser?._id || currentUser?.id)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Settings size={18} />
                </button>

                <div className="relative">
                    <button onClick={() => setMenu(!menu)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    <AnimatePresence>
                        {menu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                className="absolute right-0 top-full mt-2 w-52 bg-[#050508]/95 border border-white/10 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-2xl"
                            >
                                <button onClick={onClear} className="w-full text-left px-5 py-3 text-xs font-medium text-slate-300 hover:bg-white/5 flex gap-3 items-center transition-colors"><Trash2 size={14}/> Clear Chat</button>
                                {activeChat.isBlocked ? (
                                    <button onClick={onUnblock} className="w-full text-left px-5 py-3 text-xs font-medium text-green-400 hover:bg-green-500/10 flex gap-3 items-center transition-colors"><ShieldCheck size={14}/> Unblock User</button>
                                ) : (
                                    <button onClick={onBlock} className="w-full text-left px-5 py-3 text-xs font-medium text-red-400 hover:bg-red-500/10 flex gap-3 items-center transition-colors"><ShieldBan size={14}/> Block User</button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ==================================================================================
// 4. MAIN CHAT WINDOW EXPORT
// ==================================================================================
import { getSocket } from "../../socket";

export default function ChatWindow({ 
    chat, onSend, aiProcessing, currentUser, setCurrentUser,
    onBlock, onUnblock, onClear, isOnline,
    onDeleteMessage, onLoadMoreMessages, hasMoreMessages, loadingMessages, onBack, onViewProfile
}) {
    const [targetLang, setTargetLang] = useState(currentUser?.preferredLanguage || "none"); 
    const scrollRef = useRef(null);
    const prevHeightRef = useRef(0);
    const [isTargetTyping, setIsTargetTyping] = useState(false);
    
    // --- SOCKET TYPING LISTENERS ---
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !chat) return;
        
        setIsTargetTyping(false); // Reset when switching chats

        const handleTypeStart = ({ fromUserId }) => {
            if (fromUserId === chat.id) setIsTargetTyping(true);
        };
        const handleTypeStop = ({ fromUserId }) => {
            if (fromUserId === chat.id) setIsTargetTyping(false);
        };

        socket.on("user-typing", handleTypeStart);
        socket.on("user-stopped-typing", handleTypeStop);

        return () => {
            socket.off("user-typing", handleTypeStart);
            socket.off("user-stopped-typing", handleTypeStop);
        };
    }, [chat?.id]);

    const handleLanguageChange = async (newLang) => {
        setTargetLang(newLang);
        
        // Persist to server
        try {
            const token = Cookies.get("token");
            const res = await fetch("http://localhost:5000/api/v1/users/profile", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ preferredLanguage: newLang })
            });
            const data = await res.json();
            if (data.success && setCurrentUser) {
                // Update global state and cookie
                const updatedUser = { ...currentUser, preferredLanguage: newLang };
                setCurrentUser(updatedUser);
                Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });
            }
        } catch (err) {
            console.error("Failed to persist language preference:", err);
        }
    };

    const handleInputTyping = (isTyping) => {
        const socket = getSocket();
        if(!socket || !chat) return;
        if(isTyping) socket.emit("typing-start", { toUserId: chat.id });
        else socket.emit("typing-stop", { toUserId: chat.id });
    };

    // Infinite Scroll Logic
    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMoreMessages && !loadingMessages) {
            prevHeightRef.current = e.target.scrollHeight; 
            onLoadMoreMessages();
        }
    };

    // Restore scroll position after loading more messages
    useLayoutEffect(() => {
        if (loadingMessages) return; 
        if (prevHeightRef.current > 0 && scrollRef.current) {
            const newHeight = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop = newHeight - prevHeightRef.current; 
            prevHeightRef.current = 0;
        }
    }, [chat?.messages, loadingMessages]);

    // Show Empty State if no chat selected
    if (!chat) return <EmptyState />;

    return (
        <div className="flex flex-col h-full bg-transparent relative">
            
            {/* 1. Header (Internal) */}
            <ChatHeader 
                activeChat={chat} 
                isOnline={isOnline} 
                targetLang={targetLang} 
                setTargetLang={handleLanguageChange} 
                onClear={onClear}
                onBlock={onBlock} 
                onUnblock={onUnblock} 
                onBack={onBack} 
                onViewProfile={onViewProfile}
                currentUser={currentUser}
            />

            {/* 2. Messages Area */}
            <div 
                className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pt-6 pb-2 relative z-0"
                onScroll={handleScroll} 
                ref={scrollRef}
            >
                {/* Background Texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none -z-10 opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/20 to-[#050508]/50 pointer-events-none -z-10" />

                <div className="max-w-5xl mx-auto flex flex-col gap-6 min-h-full justify-end">
                   
                   {/* Load More Spinner */}
                   {loadingMessages && (
                       <div className="flex justify-center py-4">
                           <Loader2 className="animate-spin text-brand-400 opacity-50" size={24} />
                       </div>
                   )}
                   
                   {/* Session Start Label */}
                   <div className="flex justify-center py-8 opacity-60">
                       <div className="px-5 py-1.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase shadow-sm backdrop-blur-sm">
                           Chat started
                       </div>
                   </div>

                   {/* Message List */}
                   <MessageList 
                        messages={chat.messages} 
                        currentUser={currentUser} 
                        targetLang={targetLang} 
                        onDeleteMessage={onDeleteMessage} 
                   />

                   {/* Typing Indicator Bubble */}
                   {isTargetTyping && (
                       <div className="flex w-max max-w-[80%] items-end gap-2 mb-2">
                           {/* Avatar */}
                           <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/5 bg-[#050508]/50">
                                <img src={chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} alt="Avatar" className="w-full h-full object-cover" />
                           </div>
                           <div className="bg-[#050508]/40 backdrop-blur-xl border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg">
                               <div className="flex items-center gap-1.5 h-4">
                                   <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                                   <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                                   <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                               </div>
                           </div>
                       </div>
                   )}
                   
                   {/* AI Processing Indicator */}
                   {aiProcessing && (
                       <div className="ml-4 flex items-center gap-3 text-xs text-brand-400 font-mono animate-pulse">
                           <Sparkles size={14} /> <span>AI is thinking...</span>
                       </div>
                   )}
                </div>
            </div>

            {/* 3. Input Area */}
            <div className="p-4 md:p-6 border-t border-white/5 bg-[#050508]/60 backdrop-blur-md z-20">
               {chat.isBlocked ? (
                   <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400 text-center text-xs font-mono rounded-xl tracking-widest flex items-center justify-center gap-2">
                       <ShieldBan size={16}/> USER BLOCKED
                   </div>
               ) : (
                   <MessageInput 
                        onSend={(msg) => onSend(msg, targetLang)} 
                        targetLangName={targetLang !== 'none' ? LANGUAGES.find(l => l.code === targetLang)?.name : null}
                        onTyping={handleInputTyping}
                   />
               )}
            </div>
        </div>
    );
}