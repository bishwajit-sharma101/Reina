import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function FooterCTA() {
  return (
    <section className="relative py-40 bg-[#030014] overflow-hidden flex flex-col items-center text-center">
      
      {/* 1. The Warp Gate Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl px-6">
        <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8"
        >
            Ready to <br />
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">Transmit?</span>
        </motion.h2>

        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto"
        >
            Join the neural network. Experience communication without limits.
        </motion.p>

        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
        >
            <Link 
                to="/chat"
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-xl hover:scale-105 transition-transform overflow-hidden"
            >
                <span className="relative z-10">Initialize App</span>
                <Sparkles size={20} className="relative z-10" />
                
                {/* Button Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-200 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
        </motion.div>

        {/* Footer Links */}
        <div className="mt-32 pt-10 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-6">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-brand-500/20 flex items-center justify-center">
                    <Sparkles size={12} className="text-brand-400" />
                </div>
                <span>AstrixChat © 2025</span>
            </div>
            <div className="flex gap-8">
                <a href="#" className="hover:text-white transition">Protocol</a>
                <a href="#" className="hover:text-white transition">Security</a>
                <a href="#" className="hover:text-white transition">Twitter</a>
            </div>
        </div>
      </div>
    </section>
  );
}