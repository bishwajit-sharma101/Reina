import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, CheckCheck, Trash2, Sparkles, Languages, Loader2, Download } from "lucide-react"; 
import Cookies from "js-cookie";

// ==================================================================================
// 1. CUSTOM AUDIO PLAYER
// ==================================================================================
const CustomAudioPlayer = ({ src, isOwn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(curr);
      setProgress(dur > 0 ? (curr / dur) * 100 : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <div className={`
      flex items-center gap-3 p-2.5 rounded-xl min-w-[220px] select-none transition-all duration-300 border backdrop-blur-md
      ${isOwn 
        ? 'bg-white/10 border-white/20 text-white' 
        : 'bg-black/30 border-white/10 text-cyan-400'}
    `}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className={`
          flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg
          ${isOwn 
            ? 'bg-white text-brand-600 hover:bg-slate-100' 
            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'}
        `}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 justify-center mr-1">
        <div className={`relative w-full h-1 rounded-full overflow-hidden ${isOwn ? 'bg-white/20' : 'bg-white/10'}`}>
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${isOwn ? 'bg-white shadow-[0_0_10px_white]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className={`flex justify-between text-[9px] font-mono tracking-widest ${isOwn ? 'opacity-80' : 'opacity-60 text-slate-400'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 2. MAIN COMPONENT: MESSAGE LIST
// ==================================================================================
export default function MessageList({ messages = [], currentUser = null, targetLang = "none", onDeleteMessage }) {
  const endRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);
  const processedIds = useRef(new Set());
  const autoTranslateBlockedIds = useRef(new Set()); 
  const lastSwitchTime = useRef(Date.now());
  const prevLangRef = useRef(targetLang);
  const [contextMenu, setContextMenu] = useState(null);

  // --- HELPER: Save Translation ---
  const saveTranslationToDB = async (messageId, lang, text) => {
    if (typeof messageId === 'string' && messageId.length < 20) return; 
    try {
      const token = Cookies.get("token");
      await fetch("http://localhost:5000/api/v1/chat/messages/cache_translation", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ messageId, languageCode: lang, translatedText: text })
      });
    } catch (err) { console.error("Failed to save translation:", err); }
  };

  // --- HELPER: Base64 to Blob URL ---
  function base64ToUrl(base64, mime = "audio/wav") {
    try {
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      return URL.createObjectURL(new Blob([new Uint8Array(byteNumbers)], { type: mime }));
    } catch (e) { return null; }
  }

  // --- SMART MERGE LOGIC ---
  useEffect(() => {
    // ⚡ FIX: Strict Gating for Old Messages
    // When language changes, we block all current messages from auto-translating.
    // They can still be manually translated, but won't trigger AI automatically.
    if (targetLang !== prevLangRef.current) {
        // Collect all current IDs to block
        const currentIds = messages.map(m => m._id || m.id);
        autoTranslateBlockedIds.current = new Set(currentIds);
        
        lastSwitchTime.current = Date.now(); 
        prevLangRef.current = targetLang;
    } else if (autoTranslateBlockedIds.current.size === 0 && messages.length > 0) {
        // Initial load lock: Block existing history on first mount
        const currentIds = messages.map(m => m._id || m.id);
        autoTranslateBlockedIds.current = new Set(currentIds);
    }

    setLocalMessages((prev) => {
      const prevMap = new Map(prev.map(m => [m._id || m.id, m]));

      return messages.map((newMsg) => {
        const id = newMsg._id || newMsg.id;
        const existing = prevMap.get(id);
        
        let dbTranslation = null;
        if (newMsg.content && newMsg.content.translations && targetLang !== 'none') {
           dbTranslation = newMsg.content.translations[targetLang];
        }

        if (existing) {
          const isSameLang = existing._translatedLang === targetLang;
          return {
            ...newMsg,
            id: id,
            isRead: newMsg.isRead !== undefined ? newMsg.isRead : existing.isRead,
            textTranslated: dbTranslation || (isSameLang ? existing.textTranslated : null),
            audioTranslated: isSameLang ? existing.audioTranslated : null, 
            _translatedLang: dbTranslation ? targetLang : (isSameLang ? existing._translatedLang : null),
            _translatingText: isSameLang ? existing._translatingText : false,
            _translatingAudio: isSameLang ? existing._translatingAudio : false,
            _translationError: isSameLang ? existing._translationError : false,
            audioOriginal: newMsg.audioOriginal || existing.audioOriginal,
            attachmentUrl: newMsg.attachmentUrl || existing.attachmentUrl,
            attachmentType: newMsg.attachmentType || existing.attachmentType
          };
        }
        return {
            ...newMsg,
            id: id,
            textTranslated: dbTranslation || null,
            _translatedLang: dbTranslation ? targetLang : null,
            _translatingText: false,
            _translationError: false
        };
      });
    });
  }, [messages, targetLang]);

  // --- AUTO SCROLL ---
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localMessages]);

  const updateMessageById = (id, patch) => {
    setLocalMessages((prev) => prev.map((m) => {
      const match = (m._id === id || m.id === id);
      return match ? { ...m, ...patch } : m;
    }));
  };

  const triggerTranslation = async (m, index, isManual = false) => {
    if (!targetLang || targetLang === "none") return;
    
    const mId = m._id || m.id;

    // ⚡ FIX: Strict Auto-Translation Gate
    // We ONLY auto-translate if the message is "fresh" (arrived in the last 15 seconds).
    // This prevents history syncs or old messages from triggering AI.
    if (!m.createdAt) return; // Do not auto-translate if timestamp is missing
    
    const msgTime = new Date(m.createdAt).getTime();
    const now = Date.now();
    
    // Safety check: 15 second window
    if (!isManual && (isNaN(msgTime) || msgTime < now - 15000)) return;

    const sessionKey = `${mId}-${targetLang}`;
    if (!isManual && (m._translatedLang === targetLang) && (m.textTranslated || m._translatingText)) return;
    if (!isManual && processedIds.current.has(sessionKey)) return;

    const originalText = m.content?.original || m.textOriginal;
    const isMediaPlaceholder = ["📷 Image", "🎥 Video", "🎤 Voice Message", "📁 Attachment"].includes(originalText);
    
    if (originalText && !isMediaPlaceholder && (!m.textTranslated || isManual) && !m._translatingText) {
      processedIds.current.add(sessionKey);
      updateMessageById(m._id || m.id, { _translatingText: true, _translationError: false });

      try {
        const token = Cookies.get("token");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 65000); 

        const context = localMessages
          .slice(Math.max(0, index - 40), index)
          .filter(msg => msg.content?.original || msg.textOriginal)
          .map(msg => ({
            role: msg.fromMe ? "Me" : "Other",
            text: msg.content?.original || msg.textOriginal
          }));

        const res = await fetch("http://localhost:5000/api/v1/ai/translate_text", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            text: originalText, 
            target_lang: targetLang, 
            messageId: m._id || m.id,
            context: context
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Translation service error");

        const data = await res.json();
        const translatedResult = data.translation || data.translation_text;

        updateMessageById(m._id || m.id, {
          textTranslated: translatedResult || null,
          _translatedLang: targetLang,
          _translatingText: false,
          _translationError: !translatedResult
        });

        if (translatedResult) saveTranslationToDB(m._id || m.id, targetLang, translatedResult);

      } catch (err) {
        console.error("Translation error:", err);
        updateMessageById(m._id || m.id, { _translatingText: false, _translationError: true });
      }
    }
  };

  const translateMessageManual = (m) => {
    const sessionKey = `${m._id || m.id}-${targetLang}`;
    processedIds.current.delete(sessionKey);
    const idx = localMessages.findIndex(msg => (msg._id || msg.id) === (m._id || m.id));
    triggerTranslation(m, idx, true);
  };

  useEffect(() => {
    localMessages.forEach((m, index) => {
      triggerTranslation(m, index);
    });
  }, [localMessages, targetLang]);

  return (
    <div className="flex flex-col gap-4 w-full px-2 pb-4">
      <AnimatePresence initial={false}>
        {localMessages.map((m) => {
          const id = m._id || m.id;
          const own = !!m.fromMe;
          const displayOriginal = m.content?.original || m.textOriginal || "";
          const isMediaPlaceholder = ["📷 Image", "🎥 Video", "🎤 Voice Message", "📁 Attachment"].includes(displayOriginal);
          const showText = !isMediaPlaceholder && displayOriginal;
          const currentTranslation = m.textTranslated;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex w-full group ${own ? 'justify-end' : 'justify-start'}`}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.pageX, y: e.pageY, message: m });
              }}
            >
              <div className={`relative px-5 py-4 rounded-3xl backdrop-blur-xl border transition-all duration-500 shadow-xl
                  ${own ? 'bg-brand-600/20 border-brand-500/30 text-white rounded-tr-sm shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'bg-[#050508]/60 border-white/10 text-slate-200 rounded-tl-sm hover:border-white/20'}
                  ${m.attachmentType ? 'min-w-[260px]' : 'max-w-[75%] md:max-w-[60%]'}
                `}>
                
                {m.attachmentType === 'image' && m.attachmentUrl && (
                    <img src={m.attachmentUrl} className="mb-2 rounded-lg border border-white/10 max-h-[400px] object-cover" alt="attachment" />
                )}
                {m.attachmentType === 'video' && m.attachmentUrl && (
                    <video src={m.attachmentUrl} controls className="mb-2 rounded-lg border border-white/10 max-h-[400px]" />
                )}

                <div className="flex flex-col">
                  {(own || targetLang === "none") ? (
                    showText && <div className="text-[15px] whitespace-pre-wrap">{displayOriginal}</div>
                  ) : (
                    <>
                      {currentTranslation ? (
                        <>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                              <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest text-slate-500">Source</span>
                              <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest font-bold">Translated</span>
                          </div>
                          <div className="text-slate-500 text-xs mb-2 opacity-60 line-through decoration-slate-600/50">{displayOriginal}</div>
                          <div className="text-[15px] font-medium text-white">{currentTranslation}</div>
                        </>
                      ) : (
                        showText && (
                          <div className="flex flex-col gap-2">
                             <div className="text-[15px] opacity-40 blur-[1px] select-none">{displayOriginal}</div>
                             {m._translationError ? (
                                <button onClick={() => translateMessageManual(m)} className="text-[10px] text-red-400 uppercase tracking-widest font-bold hover:text-red-300 transition-colors flex items-center gap-2 font-mono">
                                   <Trash2 size={10}/> SIGNAL LOST | TAP TO RETRY
                                </button>
                             ) : (
                                <div className="flex items-center gap-2 text-[10px] text-cyan-400 animate-pulse uppercase tracking-[0.2rem] font-mono font-bold">
                                   <Loader2 size={10} className="animate-spin"/> Decrypting...
                                </div>
                             )}
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                <div className={`flex items-center gap-2 mt-2 pt-1 border-t ${own ? 'justify-end border-white/10' : 'justify-start border-white/5'}`}>
                  <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">
                    {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {own && <CheckCheck size={12} className={m.isRead ? "text-cyan-400" : "text-slate-600"} />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={endRef} className="h-4" />

      {contextMenu && (
        <div 
          className="fixed z-[9999] bg-[#0c0c14]/95 border border-white/10 rounded-xl shadow-2xl p-1 min-w-[200px] backdrop-blur-2xl animate-in fade-in zoom-in duration-150 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
          onClick={() => setContextMenu(null)}
        >
          <button onClick={() => translateMessageManual(contextMenu.message)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-slate-300 hover:bg-brand-500/20 hover:text-white rounded-lg transition-all font-mono uppercase tracking-widest font-bold">
            <Sparkles size={14} className="text-cyan-400" /> Neural Translation
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button onClick={() => onDeleteMessage(contextMenu.message.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-red-500 hover:bg-red-500/10 rounded-lg transition-all font-mono uppercase tracking-widest font-bold">
            <Trash2 size={14} /> Delete Logic
          </button>
        </div>
      )}
    </div>
  );
}