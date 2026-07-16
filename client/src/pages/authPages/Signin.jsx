import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom'; 
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, Fingerprint, ChevronLeft, ScanLine, Zap, Globe } from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';

// --- VISUAL SIDE (LEFT PANEL) ---
const VisualSide = () => (
    <div className="hidden lg:flex relative w-1/2 h-screen sticky top-0 items-center justify-center overflow-hidden">
        
        {/* Animated Nebulas (Left Side Specific) */}
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]"
        />

        {/* 3D Abstract Shape */}
        <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative w-80 h-80 mb-12 perspective-1000">
                {/* Outer Ring */}
                <motion.div 
                    animate={{ rotateX: [0, 180, 360], rotateY: [0, 180, 360] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-brand-500/20 rounded-full shadow-[0_0_80px_rgba(139,92,246,0.1)]"
                />
                
                {/* Middle Ring */}
                <motion.div 
                    animate={{ rotateX: [360, 180, 0], rotateY: [360, 180, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-12 border border-cyan-500/20 rounded-full"
                />

                {/* Core Spark */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-20"
                    >
                        <Zap size={64} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
                    </motion.div>
                    {/* Core Glow */}
                    <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
                </div>
            </div>

            <div className="text-center space-y-4 px-12">
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter">
                    Astrix<span className="text-brand-400">.Core</span>
                </h1>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.2em]">System Optimal</span>
                </div>
            </div>
        </div>
    </div>
);

// --- INTERACTION SIDE (RIGHT PANEL) ---
const Signin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setIsLoading(true);
        try {
            await axios.post("http://localhost:5000/api/v1/modules/auth/google", { token: tokenResponse.access_token }, { withCredentials: true });
            navigate("/chat");
        } catch(e) { setIsLoading(false); }
    }
  });

  const handleIdentify = (e) => {
      e.preventDefault();
      if(!formData.email) return;
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setScannedUser({ 
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.email}`, 
            email: formData.email 
          }); 
          setStep(2);
      }, 800);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/v1/auth/login", formData, { withCredentials: true });
      navigate("/chat");
    } catch (error) {
      alert(error.response?.data?.message || "Access Denied");
      setIsLoading(false);
    }
  };

  return (
    // ⚡ UNIFIED PARENT BACKGROUND (Seamless Blend)
    <div className="flex min-h-screen w-full bg-[#020205] font-sans overflow-hidden selection:bg-brand-500/30 relative">
      
      {/* --- GLOBAL ATMOSPHERE --- */}
      {/* 1. Global Noise Texture (covers everything) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50 mix-blend-overlay" />
      
      {/* 2. The "Bridge" Gradient (Connects Left & Right) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050508] via-[#090912] to-[#020205] pointer-events-none" />
      
      {/* 3. Center Glow (Softens the split) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-brand-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* --- CONTENT --- */}
      
      {/* 1. VISUAL PANEL */}
      <VisualSide />

      {/* 2. INTERACTION PANEL */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center p-6 md:p-12 h-screen overflow-y-auto custom-scrollbar z-10">
        
        {/* Mobile Background FX */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-brand-600/20 rounded-full blur-[80px]" />

        <div className="w-full max-w-sm">
            
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2 text-xs font-mono text-brand-500/70 uppercase tracking-widest">
                    <ScanLine size={14} />
                    <span>/ AUTH_PROTOCOL_V4</span>
                </div>
                <div className="flex gap-1.5">
                    <motion.div animate={{ opacity: step === 1 ? 1 : 0.3 }} className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <motion.div animate={{ opacity: step === 2 ? 1 : 0.3 }} className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                </div>
            </div>

            <AnimatePresence mode="wait">
                
                {/* === STEP 1: IDENTIFY === */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ x: 20, opacity: 0, filter: "blur(10px)" }}
                        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ x: -20, opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <div className="mb-10">
                            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Identify Node</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">Enter your designated Neural ID to initiate handshake protocol.</p>
                        </div>

                        <form onSubmit={handleIdentify} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-brand-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-400 transition-colors duration-300">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                        // ⚡ INPUT STYLE: Ultra-minimal, no white background, just sleek borders
                                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-lg rounded-xl py-4 pl-12 pr-4 placeholder:text-slate-700 outline-none focus:border-brand-500/50 focus:bg-brand-500/[0.05] focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300"
                                        placeholder="user@astrix.ai"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] duration-300"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        <span className="text-sm uppercase tracking-widest">Scanning...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Locate Profile</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                         <div className="mt-10 text-center">
                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-white/5"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-600 text-[10px] uppercase tracking-widest">Or Authenticate Via</span>
                                <div className="flex-grow border-t border-white/5"></div>
                            </div>
                            <button onClick={() => googleLogin()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all duration-300 group">
                                <Globe size={16} className="text-slate-500 group-hover:text-brand-400 transition-colors" /> 
                                <span className="text-sm font-medium">Google Identity</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* === STEP 2: AUTHENTICATE === */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ x: 20, opacity: 0, filter: "blur(10px)" }}
                        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ x: -20, opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {/* User Card (Floating Glass) */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-white/[0.05] to-transparent border border-white/[0.08] rounded-2xl mb-10 backdrop-blur-md">
                            <div className="relative">
                                <img src={scannedUser?.avatar} alt="User" className="w-14 h-14 rounded-full border border-white/10" />
                                <div className="absolute -bottom-1 -right-1 bg-[#020205] rounded-full p-0.5">
                                    <div className="w-3 h-3 bg-cyan-500 rounded-full border-2 border-[#020205] animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-base tracking-tight">Identity Verified</div>
                                <div className="text-brand-400 text-xs font-mono">{scannedUser?.email}</div>
                            </div>
                            <button onClick={() => setStep(1)} className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-white font-bold px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                                Switch
                            </button>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Decrypt Session</h2>
                            <p className="text-slate-500 text-sm">Input your private security key to unlock the core.</p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-brand-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-400 transition-colors duration-300">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-lg rounded-xl py-4 pl-12 pr-4 placeholder:text-slate-700 outline-none focus:border-brand-500/50 focus:bg-brand-500/[0.05] focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-4 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-brand-500 to-purple-600 text-white font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] duration-300"
                                >
                                    {isLoading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Fingerprint size={20} />
                                            <span>Authenticate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

            </AnimatePresence>

            <div className="mt-12 pt-6 border-t border-white/5 text-center">
                <Link to="/signup" className="text-slate-600 text-xs hover:text-white transition-colors tracking-wide">
                    NO NEURAL LINK? <span className="text-brand-400 font-bold ml-1 hover:underline underline-offset-4">INITIALIZE HERE</span>
                </Link>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Signin;