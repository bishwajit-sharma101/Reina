import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Bot, Send, Zap, MessageCircle } from "lucide-react";

export default function FeatureCoach() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });

  return (
    <section className="py-32 relative bg-[#020205] z-20 overflow-hidden">
      
      {/* --- BACKGROUND FX --- */}
      <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute left-[-10%] bottom-0 w-[600px] h-[600px] bg-purple-600/05 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
        
        {/* LEFT: THE COPY */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Bot size={14} /> Live Coaching Engine
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[0.95] tracking-tight">
            Speak with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-200 to-brand-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              absolute clarity.
            </span>
          </h2>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-lg border-l-2 border-brand-500/30 pl-6">
            The built-in AI Coach doesn't just correct grammar—it analyzes <span className="text-white font-medium">tone, intent, and impact</span> in real-time. Turn hesitation into confidence before you hit send.
          </p>

          <div className="mt-10 flex gap-4">
              <div className="flex flex-col gap-1">
                  <h4 className="text-2xl font-bold text-white">0.2s</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">Analysis Time</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col gap-1">
                  <h4 className="text-2xl font-bold text-brand-400">3 Modes</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">Casual / Pro / Flirty</span>
              </div>
          </div>
        </motion.div>


        {/* RIGHT: THE HOLOGRAPHIC PHONE */}
        <div ref={ref} className="relative group perspective-1000">
            
            {/* Ambient Glow Behind Phone */}
            <div className="absolute inset-4 bg-gradient-to-tr from-brand-500/20 to-purple-500/20 blur-[60px] rounded-[40px] group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* The Device Frame */}
            <motion.div 
                initial={{ rotateY: 15, rotateX: 5 }}
                whileInView={{ rotateY: 0, rotateX: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
                {/* Screen Reflection */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-b from-white/10 to-transparent skew-x-12 opacity-50 pointer-events-none" />

                {/* Header UI */}
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#09090b] rounded-full" />
                        </div>
                        <div>
                            <div className="font-bold text-white tracking-wide">Sarah</div>
                            <div className="text-[10px] text-brand-400 font-mono uppercase tracking-wider flex items-center gap-1">
                                <Zap size={10} fill="currentColor" /> Neural Link Active
                            </div>
                        </div>
                    </div>
                    <div className="p-3 rounded-full bg-white/5 border border-white/5 text-slate-400">
                        <MessageCircle size={20} />
                    </div>
                </div>

                {/* Chat Area */}
                <div className="space-y-6 mb-10 relative min-h-[160px]">
                    
                    {/* Received Message */}
                    <div className="flex justify-start">
                        <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-sm max-w-[80%] text-slate-200 text-sm backdrop-blur-sm">
                            Are you free tonight? 
                        </div>
                    </div>
                    
                    {/* --- THE TRANSFORMATION --- */}
                    <div className="flex justify-end relative">
                        
                        {/* 1. The "Weak" Draft (Dissolves) */}
                        <motion.div 
                            initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            animate={isInView ? { opacity: 0, scale: 0.9, filter: "blur(10px)" } : {}}
                            transition={{ delay: 2, duration: 0.8 }}
                            className="absolute right-0 top-0 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl rounded-tr-sm text-red-200/50 text-sm line-through decoration-red-500/50"
                        >
                            idk if i can go
                        </motion.div>

                        {/* 2. The "Scanning" Beam */}
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={isInView ? { width: "100%", opacity: 1 } : {}}
                            transition={{ delay: 1.5, duration: 1.5 }}
                            onAnimationComplete={() => console.log("Scan complete")}
                            className="absolute top-1/2 right-0 h-[2px] bg-brand-400 blur-[2px] shadow-[0_0_15px_rgba(139,92,246,1)] z-20"
                        />

                        {/* 3. The "Perfect" Rewrite (Materializes) */}
                        <motion.div 
                             initial={{ opacity: 0, scale: 0.9, y: 10 }}
                             animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                             transition={{ delay: 2.8, duration: 0.6, type: "spring" }}
                             className="relative bg-gradient-to-br from-brand-600 to-violet-600 p-5 rounded-2xl rounded-tr-sm text-white shadow-[0_0_40px_rgba(139,92,246,0.4)] text-sm border border-white/20"
                        >
                             <div className="flex items-start gap-3">
                                <div className="leading-relaxed">
                                    I'm debating if I should go. What do you think?
                                </div>
                                <div className="mt-1">
                                    <Sparkles size={16} className="text-yellow-300 animate-pulse drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                                </div>
                             </div>
                             
                             {/* "Optimized" Tag */}
                             <div className="absolute -bottom-3 -left-2 bg-[#09090b] border border-brand-500/50 text-brand-300 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                <Bot size={10} /> TONE OPTIMIZED
                             </div>
                        </motion.div>
                    </div>
                </div>

                {/* Input Bar Decoration */}
                <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex-1 h-12 bg-white/5 border border-white/10 rounded-full flex items-center px-4 text-xs text-slate-500 font-mono">
                        Type a message...
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <Send size={18} />
                    </div>
                </div>

            </motion.div>
        </div>

      </div>
    </section>
  );
}