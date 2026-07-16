import React from "react";
import { motion } from "framer-motion";
import { Satellite, Scan, Users, ArrowUpRight } from "lucide-react";

// A single "User Node" in space
const StarNode = ({ x, y, delay, label }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="absolute flex flex-col items-center gap-2"
    style={{ left: x, top: y }}
  >
    <div className="relative group cursor-pointer">
        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] group-hover:bg-brand-400 transition-colors" />
        <div className="absolute inset-0 bg-brand-500/30 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
        
        {/* Connection Line (Fake) */}
        <div className="absolute top-1/2 left-1/2 w-[100px] h-[1px] bg-gradient-to-r from-brand-500/50 to-transparent origin-left rotate-[45deg] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
    <div className="text-[10px] font-mono text-slate-500 bg-black/50 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm">
        {label}
    </div>
  </motion.div>
);

export default function FeatureDiscovery() {
  return (
    <section className="py-32 relative bg-[#030014] overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid lg:grid-cols-2 gap-20 items-center">
            
            {/* LEFT: The Radar Visual */}
            <div className="relative h-[500px] w-full flex items-center justify-center">
                
                {/* 1. The Orbit Rings */}
                <div className="absolute inset-0 border border-white/5 rounded-full" />
                <div className="absolute inset-[15%] border border-white/5 rounded-full" />
                <div className="absolute inset-[35%] border border-white/5 rounded-full" />

                {/* 2. The Radar Sweep */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left bg-gradient-to-t from-brand-500/0 via-brand-500/10 to-transparent rounded-tr-full blur-sm"
                    style={{ left: '50%', top: '0%' }}
                />

                {/* 3. The Core */}
                <div className="absolute w-20 h-20 bg-brand-900/20 backdrop-blur-md rounded-full border border-brand-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.2)]">
                    <Scan size={32} className="text-brand-400" />
                </div>

                {/* 4. The Stars (Users) */}
                <StarNode x="20%" y="20%" delay={0.5} label="DESIGN" />
                <StarNode x="70%" y="30%" delay={1.2} label="TECH" />
                <StarNode x="80%" y="70%" delay={2.5} label="MUSIC" />
                <StarNode x="30%" y="80%" delay={3.8} label="STARTUP" />
                
                {/* Floating "Match Found" Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="absolute top-[20%] right-[10%] bg-black/60 backdrop-blur-xl border border-brand-500/30 p-4 rounded-xl flex items-center gap-3 shadow-2xl"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
                    <div>
                        <div className="text-white text-sm font-medium">Frequency Match</div>
                        <div className="text-xs text-green-400 flex items-center gap-1">
                            <Satellite size={10} /> 98% Compatibility
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* RIGHT: The Copy */}
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-mono mb-6">
                        <Users size={14} /> CONSTELLATION DISCOVERY
                    </div>
                    
                    <h2 className="text-5xl md:text-7xl font-bold mb-6">
                        Find your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                            Frequency.
                        </span>
                    </h2>
                    
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        Stop doom-scrolling feeds. Start exploring intent. 
                        Astrix maps users by curiosity and conversation style, 
                        connecting you with the people you were meant to meet.
                    </p>

                    <button className="group flex items-center gap-2 text-white border-b border-white/20 pb-1 hover:border-white transition-colors">
                        Enter Public Mode <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </motion.div>
            </div>

        </div>
      </div>
    </section>
  );
}