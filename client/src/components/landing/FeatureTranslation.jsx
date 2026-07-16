import React from "react";
import { motion } from "framer-motion";
import { Mic, Globe, AudioLines, Sparkles, Activity, Wifi } from "lucide-react";

// --- BRIGHTER AUDIO WAVE ---
const AudioWave = ({ color, delay, count = 20 }) => (
  <div className="flex items-center justify-center gap-[3px] h-12">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        // ⚡ CHANGE: Brighter base color, stronger shadow
        className={`w-1 rounded-full ${color} shadow-[0_0_12px_currentColor]`}
        animate={{ 
            height: [10, 10 + Math.sin(i * 0.8) * 25 + Math.random() * 15, 10],
            opacity: [0.6, 1, 0.6] // ⚡ CHANGE: Minimum opacity raised from 0.3 to 0.6
        }}
        transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: i * 0.05 + delay 
        }}
      />
    ))}
  </div>
);

export default function FeatureTranslation() {
  return (
    <section className="py-40 relative bg-[#020205] overflow-hidden">
      
      {/* --- STRONGER BACKGROUND GLOWS --- */}
      <div className="absolute left-[-10%] top-1/4 w-[800px] h-[800px] bg-brand-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-1/4 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        
        {/* HEADER - Increased brightness */}
        <div className="text-center mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold tracking-[0.3em] uppercase mb-8 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            <Wifi size={14} /> Neural Bridge
          </motion.div>
          
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-6">
            Language is <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
               no longer a barrier.
            </span>
          </h2>
        </div>

        {/* THE UNIT - Brighter Glass */}
        <div className="relative max-w-6xl mx-auto">
            {/* Background Glow Behind Card */}
            <div className="absolute inset-10 bg-gradient-to-r from-brand-600/30 to-cyan-500/30 blur-[80px]" />

            <div className="relative bg-[#0b0b15]/60 border border-white/20 rounded-[40px] p-12 md:p-24 backdrop-blur-3xl shadow-2xl overflow-hidden">
                
                {/* ⚡ GRID TEXTURE (Added for tech feel) */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-0">
                    
                    {/* LEFT: INPUT */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/40 flex items-center justify-center text-brand-400 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <Mic size={32} />
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-brand-500 tracking-[0.2em] uppercase mb-1">Source Input</div>
                            <div className="text-2xl font-bold text-white">HINDI</div>
                        </div>
                        <AudioWave color="bg-brand-400" delay={0} />
                    </div>

                    {/* CENTER: THE REACTOR */}
                    <div className="relative">
                        {/* Connecting Beams */}
                        <div className="hidden lg:block absolute left-[-200px] right-[-200px] top-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        
                        <div className="w-40 h-40 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center relative z-10 shadow-[0_0_60px_rgba(255,255,255,0.1)]">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border-t-2 border-brand-400 rounded-full"
                            />
                            <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-6 border-b-2 border-cyan-400 rounded-full"
                            />
                            
                            {/* ⚡ CENTER BRIGHT CORE */}
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_white]">
                                <AudioLines size={32} className="text-black" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: OUTPUT */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <Globe size={32} />
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-cyan-500 tracking-[0.2em] uppercase mb-1">Target Output</div>
                            <div className="text-2xl font-bold text-white">SPANISH</div>
                        </div>
                        <AudioWave color="bg-cyan-400" delay={0.5} />
                    </div>

                </div>

                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-slate-400">
                        <Activity size={12} className="text-green-400" />
                        <span>PRESERVATION ACCURACY: 99.9%</span>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </section>
  );
}