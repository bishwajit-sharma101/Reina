import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, X, FileText, Image as ImageIcon, Film, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";

export default function MessageInput({ onSend, targetLangName, onTyping }) {
    // --- STATE ---
    const [message, setMessage] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [attachment, setAttachment] = useState(null); // { file, previewUrl, type }
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    
    // --- REFS ---
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // --- EFFECT: AUTO-RESIZE TEXTAREA ---
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    // --- HANDLER: TYPING ---
    const handleTyping = (e) => {
        setMessage(e.target.value);
        if (onTyping) {
            onTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 1500);
        }
    };

    // --- HELPER: FORMAT TIME ---
    const formatDuration = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' + s : s}`;
    };

    // --- HANDLER: SEND ---
    const handleSend = (e) => {
        e?.preventDefault();
        
        // 1. Send Attachment (if exists)
        if (attachment) {
            onSend(attachment.file); // Pass raw File object
            // Cleanup preview URL
            URL.revokeObjectURL(attachment.previewUrl);
            setAttachment(null);
        }
        
        // 2. Send Text (if exists)
        if (message.trim()) {
            onSend(message); 
        }
        
        // Reset UI
        setMessage("");
        setShowEmoji(false);
        if (inputRef.current) inputRef.current.style.height = "auto";
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- HANDLER: FILE SELECTION ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let type = "file";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";

        const previewUrl = URL.createObjectURL(file);
        setAttachment({ file, previewUrl, type });
        e.target.value = ""; 
    };

    const removeAttachment = () => {
        if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
        setAttachment(null);
    };

    const onEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
    };

    // --- 🎙️ RECORDING LOGIC (FIXED) ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Determine supported mime type
            let mimeType = "audio/webm";
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                mimeType = "audio/mp4";
            }

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                audioChunksRef.current = []; // Clear buffer
                
                // Stop tracks to release mic
                stream.getTracks().forEach(track => track.stop());

                // Automatically Send Audio
                if (audioBlob.size > 0) {
                    onSend(audioBlob);
                }
                
                // Reset Timer
                clearInterval(timerRef.current);
                setRecordingTime(0);
            };

            recorder.start();
            setIsRecording(true);
            
            // Start Timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone Access Error:", err);
            alert("Could not access microphone.");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    // --- CLEANUP ---
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
        };
    }, []);

    return (
        <div className="relative w-full">
            
            {/* 1. ATTACHMENT PREVIEW CARD */}
            <AnimatePresence>
                {attachment && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute bottom-full left-0 mb-4 p-3 bg-[#050508]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4 shadow-2xl z-50 max-w-[300px]"
                    >
                        <div className="relative w-16 h-16 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 group">
                            {attachment.type === 'image' ? (
                                <img src={attachment.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                            ) : attachment.type === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    <Film size={20} className="text-white/50" />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <FileText size={24} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate font-medium">{attachment.file.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="w-1 h-1 rounded-full bg-brand-500" />
                                <span className="text-[10px] text-brand-400 uppercase tracking-wider font-mono">
                                    {attachment.type}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={removeAttachment}
                            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. EMOJI PICKER */}
            <AnimatePresence>
                {showEmoji && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="absolute bottom-full right-0 mb-4 z-50 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden border border-white/10 ring-1 ring-white/5"
                    >
                        <EmojiPicker 
                            theme="dark" 
                            onEmojiClick={onEmojiClick}
                            lazyLoadEmojis={true}
                            width={350}
                            height={400}
                            skinTonesDisabled
                            searchDisabled={false}
                            previewConfig={{ showPreview: false }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. INPUT BAR */}
            <div className={`
                flex items-end gap-2 bg-[#0a0a10] border border-white/10 rounded-[26px] p-1.5 pl-4 relative z-10 transition-all duration-300 
                ${isRecording ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'focus-within:border-brand-500/30 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)]'}
            `}>
                
                {/* Left: Attach File */}
                <div className="flex items-center gap-1 mb-1.5">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRecording}
                        className={`p-2 rounded-full transition-all active:scale-95 ${isRecording ? 'opacity-30 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        title="Attach File"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Center: Text Input OR Recording Status */}
                {isRecording ? (
                    <div className="flex-1 h-[44px] flex items-center gap-3 px-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                        <span className="text-sm text-red-400 font-mono tracking-widest animate-pulse">
                            RECORDING {formatDuration(recordingTime)}
                        </span>
                        <div className="flex-1 h-px bg-red-500/20" />
                    </div>
                ) : (
                    <textarea
                        ref={inputRef}
                        value={message}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        placeholder={targetLangName ? `Message (Translating to ${targetLangName})...` : "Type a message..."}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none py-3 px-2 max-h-32 min-h-[44px] resize-none custom-scrollbar leading-relaxed"
                        rows={1}
                    />
                )}

                {/* Right: Emoji + Action Button */}
                <div className="flex items-center gap-1 mb-1.5 mr-1">
                    {!isRecording && (
                        <button 
                            onClick={() => setShowEmoji(!showEmoji)}
                            className={`p-2 rounded-full transition-all active:scale-95 ${showEmoji ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-400 hover:text-yellow-400 hover:bg-white/5'}`}
                        >
                            <Smile size={20} />
                        </button>
                    )}

                    {/* Button Logic: If text/attachment exists -> SEND. Else -> MIC. */}
                    {(message.trim() || attachment) && !isRecording ? (
                        <button 
                            onClick={handleSend}
                            className="group p-2.5 bg-brand-600 rounded-full text-white shadow-lg hover:bg-brand-500 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send size={18} className="translate-x-0.5 translate-y-0.5 group-hover:-translate-y-0.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button 
                            onClick={toggleRecording}
                            className={`p-2.5 rounded-full transition-all active:scale-95 duration-200 ${isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_#ef4444] animate-pulse scale-110' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}