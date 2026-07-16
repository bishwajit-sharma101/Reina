import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, ArrowRight, Zap, Globe, Check, ChevronLeft, Cpu, Hexagon, Layers } from "lucide-react";

// --- VISUAL SIDE (LEFT PANEL - THE CONSTRUCT) ---
const VisualSide = () => (
    <div className="hidden lg:flex relative w-1/2 h-screen sticky top-0 items-center justify-center overflow-hidden">
        
        {/* Animated Nebulas (Creation Palette: Cyan/Teal/Purple) */}
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] right-[10%] w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[120px]"
        />
        <motion.div 
            animate={{ scale: [1, 1.4, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-purple-600/10 rounded-full blur-[120px]"
        />

        {/* 3D Abstract Shape: THE HYPERCUBE (Symbolizing Structure/Creation) */}
        <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative w-72 h-72 mb-12 perspective-1000">
                
                {/* Outer Frame (Rotating) */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-cyan-500/20 rounded-3xl transform rotate-45 shadow-[0_0_60px_rgba(34,211,238,0.15)]"
                />
                
                {/* Inner Frame (Counter-Rotating) */}
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-8 border border-brand-500/30 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.2)] bg-black/10 backdrop-blur-sm"
                />

                {/* The Core Construct */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-20"
                    >
                        <Layers size={56} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]" />
                    </motion.div>
                </div>
                
                {/* Floating Particles */}
                <motion.div 
                    animate={{ y: [-10, 10, -10], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-12 -right-4 w-4 h-4 bg-cyan-400 rounded-full blur-md"
                />
                <motion.div 
                    animate={{ y: [10, -10, 10], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-8 -left-4 w-3 h-3 bg-brand-400 rounded-full blur-md"
                />
            </div>

            <div className="text-center space-y-4 px-12">
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter">
                    Initialize<span className="text-cyan-400">.Node</span>
                </h1>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.2em]">Fabrication Ready</span>
                </div>
            </div>
        </div>
    </div>
);

// --- STEPS COMPONENTS (Right Panel) ---

// Step 1: Identity
const StepIdentity = ({ formData, handleChange, nextStep }) => (
  <motion.div
    initial={{ x: 20, opacity: 0, filter: "blur(10px)" }}
    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
    exit={{ x: -20, opacity: 0, filter: "blur(10px)" }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    <div className="mb-10">
       <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Create Identity</h2>
       <p className="text-slate-500 text-sm">Begin the initialization sequence.</p>
    </div>

    {/* NAME */}
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest ml-1">Designation (Name)</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors duration-300">
                <User size={18} />
            </div>
            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoFocus
                placeholder="Ex. John Doe"
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-lg rounded-xl py-4 pl-12 pr-4 placeholder:text-slate-700 outline-none focus:border-cyan-500/50 focus:bg-cyan-500/[0.05] focus:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-300"
            />
        </div>
    </div>

    {/* EMAIL */}
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest ml-1">Neural Address (Email)</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors duration-300">
                <Mail size={18} />
            </div>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="node@astrix.ai"
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-lg rounded-xl py-4 pl-12 pr-4 placeholder:text-slate-700 outline-none focus:border-cyan-500/50 focus:bg-cyan-500/[0.05] focus:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-300"
            />
        </div>
    </div>

    <button
      onClick={nextStep}
      disabled={!formData.name || !formData.email}
      className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
    >
      <span>Proceed to Security</span>
      <ArrowRight size={20} />
    </button>
  </motion.div>
);

// Step 2: Security
const StepSecurity = ({ formData, handleChange, nextStep, prevStep }) => (
  <motion.div
    initial={{ x: 20, opacity: 0, filter: "blur(10px)" }}
    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
    exit={{ x: -20, opacity: 0, filter: "blur(10px)" }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    <div className="mb-10">
       <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Establish Protocol</h2>
       <p className="text-slate-500 text-sm">Secure your new neural uplink.</p>
    </div>

    <div className="space-y-2">
        <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest ml-1">Encryption Key (Password)</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors duration-300">
                <Lock size={18} />
            </div>
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoFocus
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-lg rounded-xl py-4 pl-12 pr-4 placeholder:text-slate-700 outline-none focus:border-cyan-500/50 focus:bg-cyan-500/[0.05] focus:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-300"
            />
        </div>
    </div>

    <div className="flex gap-4 pt-4">
        <button
            onClick={prevStep}
            className="px-6 py-4 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
            <ChevronLeft size={24} />
        </button>
        <button
            onClick={nextStep}
            disabled={!formData.password || formData.password.length < 6}
            className="flex-1 bg-white text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
            <span>Configure Node</span>
            <ArrowRight size={20} />
        </button>
    </div>
  </motion.div>
);

// Step 3: Calibration
const StepCalibration = ({ formData, setFormData, submitForm, prevStep, isLoading }) => {
    const languages = [
        { code: "en", label: "English", native: "English" },
        { code: "es", label: "Spanish", native: "Español" },
        { code: "hi", label: "Hindi", native: "हिन्दी" },
        { code: "ja", label: "Japanese", native: "日本語" },
        { code: "fr", label: "French", native: "Français" },
        { code: "zh", label: "Chinese", native: "中文" },
    ];

    return (
        <motion.div
            initial={{ x: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ x: -20, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Neural Calibration</h2>
                <p className="text-slate-500 text-sm">Select primary communication frequency.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setFormData(prev => ({ ...prev, language: lang.code }))}
                        className={`relative p-4 rounded-xl border text-left transition-all duration-300 group ${
                            formData.language === lang.code 
                            ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]" 
                            : "bg-white/[0.03] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                    >
                        <div className={`text-sm font-medium transition-colors ${formData.language === lang.code ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'}`}>{lang.label}</div>
                        <div className="text-xs text-slate-500">{lang.native}</div>
                        {formData.language === lang.code && (
                            <div className="absolute top-3 right-3 text-cyan-400">
                                <Check size={16} />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    onClick={prevStep}
                    disabled={isLoading}
                    className="px-6 py-4 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={submitForm}
                    disabled={isLoading || !formData.language}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] duration-300"
                >
                    {isLoading ? <span className="animate-spin w-5 h-5 border-2 border-black/50 border-t-black rounded-full"/> : (
                        <>
                            <span>Initialize System</span>
                            <Zap size={20} fill="currentColor" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

// Step 4: Boot Sequence (Typewriter Effect)
const StepBoot = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-10"
    >
        <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-cyan-500/10 rounded-full animate-pulse blur-xl"></div>
            <Cpu className="absolute inset-0 m-auto text-cyan-300 animate-pulse" size={48} />
        </div>
        <div className="text-center space-y-4 w-full">
            <h3 className="text-3xl font-bold text-white tracking-widest animate-pulse">INITIALIZING</h3>
            <div className="flex flex-col gap-1.5 text-xs font-mono text-cyan-400/80 bg-black/40 p-4 rounded-lg border border-white/5 w-full text-left">
                <Typewriter text={["> Allocating memory blocks...", "> Generating unique identifier...", "> Encrypting neural handshake...", "> Establishing uplink...", "> NODE ONLINE."]} />
            </div>
        </div>
    </motion.div>
);

const Typewriter = ({ text }) => {
    const [lines, setLines] = useState([]);
    useEffect(() => {
        let delay = 0;
        text.forEach((line) => {
            setTimeout(() => setLines(prev => [...prev, line]), delay);
            delay += 600;
        });
    }, []);
    return <>{lines.map((l, i) => <div key={i}>{l}</div>)}</>;
};

// --- MAIN PAGE COMPONENT ---
const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", language: "en" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setStep(4); // Trigger boot
    try {
        await axios.post("http://localhost:5000/api/v1/auth/register", formData, { withCredentials: true });
        setTimeout(() => navigate("/login"), 3500); // Wait for boot animation
    } catch (error) {
        setStep(3);
        alert("Registration failed.");
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#020205] font-sans overflow-hidden selection:bg-cyan-500/30 relative">
      
      {/* GLOBAL ATMOSPHERE */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#050508] via-[#090912] to-[#020205] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* 1. VISUAL PANEL */}
      <VisualSide />

      {/* 2. INTERACTION PANEL */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center p-6 md:p-12 h-screen overflow-y-auto custom-scrollbar z-10">
        
        {/* Mobile FX */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-cyan-600/20 rounded-full blur-[80px]" />

        <div className="w-full max-w-md">
            
            {/* Header Steps (Hidden on Boot) */}
            {step < 4 && (
                <div className="flex items-center justify-between mb-12 opacity-60">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 uppercase tracking-widest">
                        <Hexagon size={14} />
                        <span>/ NODE_CREATION_V1</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${step >= 1 ? 'bg-cyan-400' : 'bg-white/20'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${step >= 2 ? 'bg-cyan-400' : 'bg-white/20'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${step >= 3 ? 'bg-cyan-400' : 'bg-white/20'}`} />
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <StepIdentity key="step1" formData={formData} handleChange={handleChange} nextStep={() => setStep(2)} />
                )}
                {step === 2 && (
                    <StepSecurity key="step2" formData={formData} handleChange={handleChange} nextStep={() => setStep(3)} prevStep={() => setStep(1)} />
                )}
                {step === 3 && (
                    <StepCalibration key="step3" formData={formData} setFormData={setFormData} submitForm={handleSubmit} prevStep={() => setStep(2)} isLoading={isLoading} />
                )}
                {step === 4 && (
                    <StepBoot key="step4" />
                )}
            </AnimatePresence>

            {step < 4 && (
                <div className="mt-12 pt-6 border-t border-white/5 text-center">
                    <Link to="/signin" className="text-slate-600 text-xs hover:text-white transition-colors tracking-wide">
                        ALREADY ACTIVE? <span className="text-cyan-400 font-bold ml-1 hover:underline underline-offset-4">ACCESS NODE</span>
                    </Link>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Signup;