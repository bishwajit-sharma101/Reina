import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Sparkles, Send, MessageCircle, Search as SearchIcon, PowerOff } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

// ==================================================================================
// 1. THE CUTE COMPANION: AURA CORE (Interactive Glass Orb)
// ==================================================================================
const CompanionCharacter = ({ state = "idle" }) => {
  const isThinking = state === "thinking";

  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center select-none">
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-[60px]"
        animate={{
          background: isThinking
            ? ["radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)", "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)"]
            : ["radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)"],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <svg viewBox="0 0 200 200" width="220" height="220" className="overflow-visible relative z-10">
        <defs>
          <filter id="glass-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
          <linearGradient id="orb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>

        {/* ===== OUTER ORBITS ===== */}
        <motion.g
          animate={{ rotate: isThinking ? 360 : [0, 90, 180, 270, 360] }}
          transition={{ duration: isThinking ? 2 : 20, repeat: Infinity, ease: "linear" }}
          style={{ originX: "100px", originY: "100px" }}
        >
          {/* Orbit Rings */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" strokeDasharray="10 20" />
          <motion.circle
            cx="100" cy="15" r="4"
            fill="#a78bfa"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="100" cy="185" r="3"
            fill="#22d3ee"
            animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </motion.g>

        {/* ===== MAIN BODY (GLASS ORB) ===== */}
        <motion.g
          animate={{
            y: [0, -10, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner Glow Core */}
          <motion.circle
            cx="100" cy="100" r="45"
            animate={{
              r: isThinking ? [45, 52, 45] : [45, 48, 45],
              fill: isThinking ? "#ec4899" : "#8b5cf6",
              opacity: isThinking ? [0.6, 0.9, 0.6] : [0.4, 0.6, 0.4]
            }}
            transition={{ duration: isThinking ? 1 : 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: 'blur(15px)' }}
          />

          {/* Glass Shell */}
          <circle cx="100" cy="100" r="55" fill="url(#orb-grad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          
          {/* Surface Shine */}
          <ellipse cx="80" cy="75" rx="15" ry="8" fill="white" opacity="0.15" transform="rotate(-30 80 75)" />

          {/* ===== DIGITAL FACE ===== */}
          <motion.g
            animate={{
              x: isThinking ? [0, 5, -5, 0] : [0, 8, -8, 0],
              y: isThinking ? [0, -3, 3, 0] : [0, 2, -2, 0],
            }}
            transition={{ duration: isThinking ? 0.5 : 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "100px", originY: "100px" }}
          >
            {/* Left Eye */}
            <motion.rect
              x="75" y="90" width="12" height="12" rx="6"
              fill="white"
              animate={isThinking 
                ? { height: [12, 6, 12], y: [0, 2, 0] }
                : { height: [12, 12, 12, 12, 0, 12, 12] }
              }
              transition={{ duration: isThinking ? 0.4 : 5, repeat: Infinity, times: [0, 0.1, 0.2, 0.8, 0.85, 0.9, 1] }}
            />
            {/* Right Eye */}
            <motion.rect
              x="113" y="90" width="12" height="12" rx="6"
              fill="white"
              animate={isThinking 
                ? { height: [12, 6, 12], y: [0, 2, 0] }
                : { height: [12, 12, 12, 12, 0, 12, 12] }
              }
              transition={{ duration: isThinking ? 0.4 : 5, repeat: Infinity, times: [0, 0.1, 0.2, 0.8, 0.85, 0.9, 1], delay: 0.1 }}
            />
            
            {/* Mouth */}
            {isThinking ? (
              <motion.path
                d="M 90 120 Q 100 130 110 120"
                fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
                animate={{ d: ["M 90 120 Q 100 130 110 120", "M 90 120 Q 100 110 110 120", "M 90 120 Q 100 130 110 120"] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ) : (
              <motion.circle
                cx="100" cy="118" r="3" fill="white" opacity="0.6"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.g>
        </motion.g>

        {/* ===== SATELLITE PARTICLES ===== */}
        <AnimatePresence>
          {isThinking && [1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              r={2 + Math.random() * 2}
              fill={i % 2 === 0 ? "#ec4899" : "#fcd34d"}
              initial={{ cx: 100, cy: 100, opacity: 0 }}
              animate={{
                cx: [100, 100 + (Math.cos(i * 90) * 80)],
                cy: [100, 100 + (Math.sin(i * 90) * 80)],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* Shadow */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-lg"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

// ==================================================================================
// 2. MAIN COMPONENT: RIGHT DRAWER
// ==================================================================================
export default function RightDrawer({
  visible = true,
  mode = "ai", 
  onClose = () => {},
  chat = null,
  aiReply = "",
  aiProcessing = false,
  activePost = null,
  onAddComment = () => {},
}) {
  const scrollRef = useRef(null);
  
  // States
  const [commentInput, setCommentInput] = useState("");
  const [scanState, setScanState] = useState("idle"); // idle, processing, results
  const [localAiReply, setLocalAiReply] = useState("");
  const [typedReply, setTypedReply] = useState("");

  const isThinking = aiProcessing || scanState === "processing";

  // Watch external AI Reply (from @ash)
  useEffect(() => {
    if (aiProcessing) setScanState("processing");
    else if (aiReply) {
       setLocalAiReply(aiReply);
       setScanState("results");
    }
  }, [aiReply, aiProcessing]);

  // Typewriter
  useEffect(() => {
    if (mode !== 'ai' || !localAiReply) { setTypedReply(""); return; }
    let i = 0;
    setTypedReply("");
    const interval = setInterval(() => {
      setTypedReply(localAiReply.slice(0, i + 1));
      i++;
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (i >= localAiReply.length) clearInterval(interval);
    }, 15); 
    return () => clearInterval(interval);
  }, [localAiReply, mode]);

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activePost) return;
    onAddComment(activePost.id, commentInput);
    setCommentInput("");
  };

  const handleAnalyze = async () => {
      setScanState("processing");
      setLocalAiReply("");

      // Compile Context
      let contextStr = "No chat history available yet. The user hasn't started texting.";
      if (chat && chat.messages && chat.messages.length > 0) {
          const msgs = chat.messages.slice(-25); // Last 25 msgs
          contextStr = msgs.map(m => `[${m.fromMe ? 'Me' : 'Other'}]: ${typeof m.content === 'string' ? m.content : m.content.original}`).join('\n');
      }

      const prompt = `Analyze this conversation and provide a brief, helpful summary. After your analysis, end with a friendly note like "That's what I found! Let me know if you need anything else." Keep it casual and easy to understand. Don't use overly technical language.`;

      try {
          const token = Cookies.get('token');
          const res = await axios.post("http://localhost:5000/api/v1/ai/analyze-chat", {
              prompt,
              messagesContext: contextStr
          }, { headers: { Authorization: `Bearer ${token}` }});
          
          if (res.data.success) {
              setLocalAiReply(res.data.response);
          } else {
              setLocalAiReply("Hmm, something went wrong. Try again in a moment!");
          }
      } catch (err) {
          setLocalAiReply("Couldn't connect to the AI right now. Please try again later.");
      } finally {
          setScanState("results");
      }
  };

  const handleReset = () => {
      setLocalAiReply("");
      setScanState("idle");
  };

  if (!visible) return null;

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className="w-full h-full flex flex-col overflow-hidden bg-[#030305] relative shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5"
    >
      {/* HEADER */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between relative z-10 bg-[#030305]/80 backdrop-blur-xl text-center">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${mode === 'ai' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            {mode === 'ai' ? <Bot size={16} /> : <MessageCircle size={16} />}
          </div>
          <div className="text-left">
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.15em]">{mode === 'ai' ? 'Aura Companion' : 'Comments'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isThinking ? 'bg-pink-400' : 'bg-emerald-500'}`} />
               <span className="text-[9px] font-medium text-slate-500 tracking-wide uppercase">{isThinking ? "Thinking..." : "Present"}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"><X size={18} /></button>
      </div>

      {/* AI MODE */}
      {mode === 'ai' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col p-6" ref={scrollRef}>
          <AnimatePresence mode="wait">
            
            {/* STATE 1: IDLE */}
            {scanState === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                    
                    <CompanionCharacter state="idle" />

                    <div className="text-center mt-6 mb-6 w-full">
                         <h3 className="text-sm font-bold text-white tracking-wide">Ready for a chat? 😊</h3>
                         <p className="text-[11px] text-slate-400 mt-2 max-w-[200px] mx-auto leading-relaxed">
                           I'm here to help you understand the flow of this conversation.
                         </p>
                    </div>

                    <button 
                      onClick={handleAnalyze} 
                      className="relative group px-10 py-4 rounded-full border border-purple-500/20 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 hover:from-purple-500/20 transition-all duration-500 overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.1)] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] active:scale-95"
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                         <span className="text-xs font-bold text-white relative z-10 flex items-center gap-2 uppercase tracking-widest">
                             <Sparkles size={14} className="text-purple-400" /> Analyze Flow
                         </span>
                    </button>
                    
                    <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest opacity-50 font-mono">
                      {chat?.messages?.length || 0} Moments Logged
                    </p>
                </motion.div>
            )}

            {/* STATE 2: PROCESSING */}
            {scanState === "processing" && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px]">
                    
                    <CompanionCharacter state="thinking" />

                    <div className="mt-8 text-center space-y-2">
                        <motion.span 
                          className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2 justify-center uppercase tracking-[0.2em]"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          Synthesizing...
                        </motion.span>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Mapping conversational context</p>
                    </div>
                </motion.div>
            )}

            {/* STATE 3: RESULTS */}
            {scanState === "results" && typedReply && (
               <motion.div key="results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex flex-col items-center mb-4">
                    <CompanionCharacter state="idle" />
                 </div>

                 <div className="group relative">
                   <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-400/20 to-cyan-400/20 rounded-3xl blur-2xl opacity-50"></div>
                   <div className="relative bg-[#08080c]/60 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                       <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/5">
                           <div className="flex items-center gap-2 text-emerald-400">
                               <Sparkles size={14} />
                               <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Insight Generated</span>
                           </div>
                           <button onClick={handleReset} className="text-[10px] font-bold text-red-500/80 hover:text-red-400 uppercase tracking-widest transition-colors">Clear</button>
                       </div>
                       <div className="text-[13px] text-slate-200 leading-[1.8] font-light whitespace-pre-wrap custom-scrollbar">
                           {typedReply}
                           <span className="inline-block w-2 h-4 ml-1 bg-purple-500/60 align-middle animate-[pulse_0.8s_infinite]"/>
                       </div>
                       
                       <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                            <button onClick={handleAnalyze} className="flex-1 py-3 rounded-2xl bg-white/[0.03] text-white border border-white/10 hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-widest flex justify-center items-center gap-2">
                                 <SearchIcon size={12} /> Re-Sync
                            </button>
                       </div>
                   </div>
                 </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

      {/* COMMENTS MODE */}
      {mode === 'comments' && activePost && (
        <div className="flex-1 flex flex-col h-full bg-[#030305]">
          <div className="p-6 bg-[#08080c]/40 backdrop-blur-md border-b border-white/5">
             <div className="flex items-center gap-3 mb-4">
                <img src={activePost.author.avatar} className="w-8 h-8 rounded-full border border-white/10 shadow-lg" alt="OP" />
                <span className="text-xs font-bold text-white tracking-wide">{activePost.author.name}</span>
             </div>
             <div className="pl-4 border-l-2 border-purple-500/30">
                <p className="text-xs text-slate-400 line-clamp-2 italic font-serif leading-relaxed">"{activePost.content.original}"</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             {(!activePost.commentsList || activePost.commentsList.length === 0) ? (
                <div className="text-center py-24 opacity-20">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageCircle size={32} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.3em]">Quiet in here...</p>
                </div>
             ) : (
                activePost.commentsList.map((c, i) => (
                   <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4">
                      <img src={c.avatar || (typeof c.user === 'object' && c.user.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${typeof c.user === 'object' ? c.user.name : c.user}`} className="w-8 h-8 rounded-full mt-1 border border-white/10 shadow-md bg-white/5" alt="user" />
                      <div className="flex-1">
                         <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl rounded-tl-none hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                            <div className="flex justify-between items-baseline mb-2">
                               <span className="text-xs font-bold text-slate-200">{typeof c.user === 'object' ? (c.user.name || "Unknown") : c.user}</span>
                               <span className="text-[9px] font-mono text-slate-600 tracking-wider font-bold">{c.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{c.text}</p>
                         </div>
                      </div>
                   </motion.div>
                ))
             )}
          </div>

          <div className="p-6 border-t border-white/5 bg-[#030305]">
             <form onSubmit={handleSendComment} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl" />
                <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Type a comment..." className="relative w-full bg-[#08080c] border border-white/10 text-white rounded-2xl pl-5 pr-14 py-4 text-xs focus:outline-none placeholder:text-slate-600 transition-all focus:bg-black/40 focus:border-purple-500/40" />
                <button type="submit" disabled={!commentInput.trim()} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-purple-600/90 rounded-xl text-white disabled:opacity-0 disabled:scale-95 transition-all hover:bg-purple-500 shadow-lg"><Send size={14} /></button>
             </form>
          </div>
        </div>
      )}
    </motion.aside>
  );
}