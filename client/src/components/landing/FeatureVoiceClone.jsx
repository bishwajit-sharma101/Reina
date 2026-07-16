import React from "react";
import { motion } from "framer-motion";
import { Fingerprint, Mic, Lock, Zap, AudioWaveform, Dna } from "lucide-react";

const ScanningLine = () => (
    <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-20"
    />
);

const VoiceBar = ({ height, delay }) => (
    <motion.div 
        animate={{ height: [10, height, 10] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: delay, ease: "easeInOut" }}
        className="w-1.5 bg-gradient-to-t from-amber-600 to-amber-300 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.4)]"
        style={{ height: 10 }}
    />
);

export default function FeatureVoiceClone() {
  return (
    <section className="py-40 relative bg-[#020205] overflow-hidden">
      
      {/* --- GOLDEN ATMOSPHERE --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      {/* Top Center Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-8 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Dna size={14} /> Biometric Audio Synthesis
          </motion.div>
          
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none mb-6">
            Keep your voice. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-500/50">
               Lose the accent.
            </span>
          </h2>
          
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Our neural engine captures your unique vocal fingerprint. 
            When you speak Japanese, it sounds like <b>you</b> born in Tokyo.
          </p>
        </div>

        {/* --- THE CLONING LAB --- */}
        <div className="relative max-w-5xl mx-auto">
            
            {/* Background Grid */}
            <div className="absolute inset-0 border border-white/5 rounded-[40px] bg-[#0b0b15]/40 backdrop-blur-3xl" />
            
            <div className="relative z-10 grid md:grid-cols-3 gap-8 p-8 md:p-16 items-center">

                {/* LEFT: SOURCE (YOU) */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 rounded-2xl bg-black/50 border border-amber-500/30 flex items-center justify-center text-amber-400 relative overflow-hidden">
                            <ScanningLine />
                            <Fingerprint size={40} />
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-amber-500 tracking-[0.2em] uppercase mb-2">Source Identity</div>
                        <div className="flex items-end gap-1 h-12">
                            {[40, 60, 30, 70, 50, 80, 40].map((h, i) => (
                                <VoiceBar key={i} height={h} delay={i * 0.1} />
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* CENTER: THE CLONING CORE */}
                <div className="flex flex-col items-center justify-center relative">
                    {/* Connection Lines */}
                    <div className="absolute top-1/2 left-[-50%] right-[-50%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent md:block hidden" />

                    <div className="w-48 h-48 relative flex items-center justify-center">
                        {/* Rotating Rings */}
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border border-amber-500/20 rounded-full border-dashed"
                        />
                        <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 border border-white/10 rounded-full"
                        />

                        {/* Central Chip */}
                        <div className="w-28 h-28 bg-[#050508] rounded-xl border border-amber-500/40 flex items-col items-center justify-center relative shadow-[0_0_40px_rgba(245,158,11,0.2)] z-10">
                            <motion.div 
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-amber-500/5"
                            />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">99.8%</div>
                                <div className="text-[9px] text-amber-500 tracking-widest uppercase">Match</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: TARGET (CLONE) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/10 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 rounded-2xl bg-black/50 border border-white/20 flex items-center justify-center text-white relative overflow-hidden">
                             {/* Cloning overlay */}
                             <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay" />
                             <AudioWaveform size={40} />
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mb-2">Synthesized Output</div>
                        <div className="flex items-end gap-1 h-12">
                            {/* Same Pattern as Left, proving it's a clone */}
                            {[40, 60, 30, 70, 50, 80, 40].map((h, i) => (
                                <VoiceBar key={i} height={h} delay={i * 0.1} />
                            ))}
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* SECURITY BADGE */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 border border-amber-500/20 rounded-full backdrop-blur-md">
                <Lock size={12} className="text-amber-500" />
                <span className="text-[10px] text-amber-200/70 font-mono uppercase tracking-widest">
                    Available in God Mode
                </span>
            </div>

        </div>

      </div>
    </section>
  );
}