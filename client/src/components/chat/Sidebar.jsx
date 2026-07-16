import React, { useRef, useState } from "react";
import { Search, Sparkles, Zap, Globe, MessageSquare, Check, CheckCheck, Loader2, Trash2, ShieldBan, Camera, Settings, Eye, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ObserverEye from "./ObserverEye";

export default function Sidebar({
    chats = [], 
    onSelectChat = () => {},
    activeChatId = null,
    onlineUsers = [],
    viewMode = "chat", 
    onViewChange = () => {},
    searchTerm = "",
    onSearchChange = () => {},
    lastMessages = {},
    // Logic & Pagination
    onLoadMoreUsers = () => {},
    hasMoreUsers = false,
    loadingUsers = false,
    currentUser = null,
    onAvatarChange = () => {},
    onBlockUser = () => {}, 
    onDeleteChat = () => {},
    onViewProfile = () => {}
}) {
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const scrollContainerRef = useRef(null); // Ref for the scrollable container
    const [contextMenu, setContextMenu] = useState(null);
    const [userPage, setUserPage] = useState(1);

    // --- SCROLL HANDLER (Infinite Scroll) ---
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        
        // Check if user is near the bottom (50px threshold)
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (hasMoreUsers && !loadingUsers) {
                onLoadMoreUsers();
            }
        }
    };

    // --- CONTEXT MENU HANDLER ---
    const handleContextMenu = (e, userId) => {
        e.preventDefault();
        // Adjust position if too close to edge (basic check)
        const x = e.clientX > window.innerWidth - 200 ? e.clientX - 150 : e.clientX;
        const y = e.clientY > window.innerHeight - 200 ? e.clientY - 100 : e.clientY;
        setContextMenu({ x, y, userId });
    };

    // --- AVATAR UPLOAD HANDLERS ---
    const handleAvatarClick = (e) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            onAvatarChange(e.target.files[0]);
        }
    };

    return (
        <aside 
            className="w-full h-full flex flex-col bg-transparent relative" 
            onClick={() => setContextMenu(null)}
        >
            {/* ==================== 
                1. SIDEBAR HEADER 
               ==================== */}
            <div className="p-6 border-b border-white/5 flex-shrink-0">
                
                {/* PROFILE SECTION */}
                <div className="flex items-center gap-4 mb-8">
                    <div 
                        className="relative group cursor-pointer" 
                        onClick={handleAvatarClick}
                    >
                        {/* Outer Glow for Profile */}
                        <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative w-14 h-14 rounded-full border border-white/10 bg-[#050510] overflow-hidden flex items-center justify-center transition-colors group-hover:border-brand-500/30">
                            {/* Fallback Image Logic */}
                            <img 
                                src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`} 
                                className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-40" 
                                alt="Profile" 
                            />
                            
                            {/* Upload Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Camera size={20} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                        
                        {/* Hidden File Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <h1 className="font-bold text-lg tracking-tight text-white truncate leading-tight">
                                {currentUser?.name || "Neural Node"}
                            </h1>
                             <button onClick={() => onViewProfile(currentUser?._id || currentUser?.id)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <Settings size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] text-brand-300 font-mono tracking-[0.2em] uppercase opacity-80 truncate">
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                {/* MODE TABS (Direct / Matrix / Observer) */}
                <div className="flex p-1 mb-6 bg-white/[0.03] rounded-xl border border-white/5 backdrop-blur-sm">
                    <button 
                        onClick={() => onViewChange("chat")} 
                        className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === "chat" ? "bg-white/10 text-white shadow-lg border border-white/5" : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"}`}
                    >
                        <MessageSquare size={12} /> Direct
                    </button>
                    <button 
                        onClick={() => onViewChange("global")} 
                        className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === "global" ? "bg-white/10 text-white shadow-lg border border-white/5" : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"}`}
                    >
                        <Globe size={12} /> Matrix
                    </button>
                    <button 
                        onClick={() => navigate('/diary')} 
                        className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 text-slate-500 hover:text-white hover:bg-brand-500/10 border border-transparent`}
                    >
                        <Eye size={12} /> Observer
                    </button>
                </div>
                
                {/* Observer Neural Sync Indicator */}
                <div className="mb-6">
                    <ObserverEye />
                </div>

                {/* SEARCH BAR */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors duration-300">
                        <Search size={16} />
                    </div>
                    <input 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-brand-500/50 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)] outline-none transition-all duration-300" 
                        placeholder="Search contacts..." 
                        value={searchTerm} 
                        onChange={(e) => onSearchChange(e.target.value)} 
                    />
                </div>
            </div>

            {/* ==================== 
                2. SCROLLABLE LIST 
               ==================== */}
            {viewMode === "chat" ? (
                <div 
                    className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar"
                    ref={scrollContainerRef} // Attached Ref Here
                    onScroll={handleScroll} 
                >
                    {/* Empty State for Search/List */}
                    {chats.length === 0 && !loadingUsers && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-600 space-y-3">
                            <div className="p-3 rounded-full bg-white/5 border border-white/5">
                                <Search size={20} />
                            </div>
                            <p className="text-xs uppercase tracking-widest font-mono">No contacts found</p>
                        </div>
                    )}

                    {/* Chat Items */}
                    {chats.map((u) => {
                        const isOnline = onlineUsers.includes(u._id || u.id);
                        const isActive = activeChatId === (u._id || u.id);
                        const lastMsg = lastMessages[u._id || u.id];

                        return (
                            <motion.button
                                key={u._id || u.id}
                                layoutId={`chat-item-${u._id || u.id}`}
                                onClick={() => onSelectChat(u)}
                                onContextMenu={(e) => handleContextMenu(e, u._id)} 
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                whileTap={{ scale: 0.99 }}
                                className={`relative w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border text-left group overflow-hidden ${isActive ? "bg-white/[0.06] border-white/10 shadow-lg" : "border-transparent bg-transparent"}`}
                            >
                                {/* Active Selection Indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-brand-400 rounded-r-full shadow-[0_0_15px_#a855f7]" />
                                )}

                                {/* User Avatar */}
                                <div className="relative flex-shrink-0">
                                    <img 
                                        className={`w-12 h-12 rounded-full object-cover border-2 transition-colors duration-300 ${isActive ? 'border-brand-500/40' : 'border-white/5 group-hover:border-white/20'}`} 
                                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} 
                                        alt={u.name} 
                                    />
                                    {isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0b0b15] rounded-full shadow-[0_0_8px_#22c55e]" />
                                    )}
                                </div>
                                
                                {/* Info & Last Message */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm font-bold truncate transition-colors ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                                            {u.name}
                                        </span>
                                        {lastMsg && (
                                            <span className={`text-[10px] font-mono whitespace-nowrap ml-2 ${isActive ? "text-brand-300" : "text-slate-600"}`}>
                                                {lastMsg.time}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="text-xs truncate flex items-center gap-1.5 h-4">
                                        {lastMsg ? (
                                            <>
                                                {lastMsg.isOwn && (
                                                    <span className={lastMsg.isRead ? "text-blue-400" : "text-slate-600"}>
                                                        {lastMsg.isRead ? <CheckCheck size={13} /> : <Check size={13} />}
                                                    </span>
                                                )}
                                                <span className={`${isActive ? "text-slate-300" : "text-slate-500"} truncate transition-colors`}>
                                                    {lastMsg.text}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="italic opacity-40 text-slate-500 flex items-center gap-1">
                                                <Sparkles size={10} /> Start a conversation...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                    
                    {/* Infinite Scroll Loader */}
                    {loadingUsers && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="animate-spin text-brand-400 opacity-60" size={20} />
                        </div>
                    )}
                </div>
            ) : ( 
                // Placeholder for Matrix Mode
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                        <Globe size={32} className="text-slate-500" />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-mono">Global Matrix Offline</p>
                </div> 
            )}
            
            {/* ==================== 
                3. CONTEXT MENU 
               ==================== */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 5 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 5 }} 
                        transition={{ duration: 0.15 }}
                        className="fixed z-[100] bg-[#050508]/95 border border-white/10 rounded-xl shadow-2xl py-1 w-48 backdrop-blur-xl overflow-hidden" 
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteChat(contextMenu.userId); setContextMenu(null); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-red-400 hover:bg-red-500/10 flex gap-3 items-center transition-colors"
                        >
                            <Trash2 size={14}/> Delete Chat
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onViewProfile(contextMenu.userId); setContextMenu(null); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-slate-300 hover:bg-white/5 flex gap-3 items-center transition-colors"
                        >
                            <UserIcon size={14}/> View Profile
                        </button>
                        <div className="h-px bg-white/5" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); onBlockUser(contextMenu.userId); setContextMenu(null); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-slate-300 hover:bg-white/5 flex gap-3 items-center transition-colors"
                        >
                            <ShieldBan size={14}/> Block User
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}