import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Shield, Globe, ArrowRight, Cpu, Sparkles } from "lucide-react";
// ⚡ IMPORT THE NEW COMPONENT
import FeatureTranslation from "../../components/landing/FeatureTranslation"; 
import FeatureCoach from "../../components/landing/FeatureCoach";
import FeatureVoiceClone from "../../components/landing/FeatureVoiceClone";
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#020205] text-white font-sans selection:bg-brand-500/30 overflow-x-hidden relative">
      
      {/* --- CINEMATIC OVERLAYS --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020205]/50 to-[#020205] z-10" />

      {/* Floating Light Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" 
      />

      {/* --- NAVIGATION --- */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-brand-500/50 transition-colors">
            <Zap size={20} className="text-white fill-white/10" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase">Astrix<span className="text-brand-400">Chat</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          <Link to="/pricing" className="hover:text-white transition-colors">Premium</Link>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Network</a>
        </div>

        <Link to="/signin" className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500">
          Access Node
        </Link>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-20 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-md"
        >
          <Sparkles size={14} className="text-brand-400" />
          <span className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.2em]">Neural Encryption Active</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
        >
          COMMUNICATE <br />
          <span className="italic font-light">BEYOND BORDERS.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-12"
        >
          The world's first AI-assisted multilingual communication platform. 
          Real-time voice translation, neural identity, and total privacy.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-6"
        >
          <Link 
            to="/signup" 
            className="group relative px-10 py-5 bg-white text-black font-bold rounded-2xl overflow-hidden hover:scale-[1.05] transition-transform duration-500 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <span className="group-hover:text-white transition-colors">Initialize Identity</span>
              <ArrowRight size={20} className="group-hover:text-white transition-colors group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link 
            to="/pricing" 
            className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all backdrop-blur-md"
          >
            Explore God Mode
          </Link>
        </motion.div>
      </main>
      <FeatureCoach/>
      {/* ⚡ FEATURE TRANSLATION COMPONENT PLACEMENT */}
      <FeatureTranslation />
     <FeatureVoiceClone />
      {/* --- STATS / FEATURES BAR --- */}
      <div className="relative z-20 border-t border-white/5 bg-white/[0.01] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400">
                <Globe size={24} />
            </div>
            <div>
                <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Global Core</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Instantly bridge 50+ languages with neural voice synthesis.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                <Shield size={24} />
            </div>
            <div>
                <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Vault Privacy</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Quantum-resistant encryption for every packet of data.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                <Cpu size={24} />
            </div>
            <div>
                <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Cortex AI</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Integrated LLMs that understand context, not just words.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;