import React from "react";
import { Check, Zap, Globe, Shield, Mic, Cpu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import NebulaLayout from "../../layouts/NebulaLayout"; // Assuming you want the same background

const Pricing = () => {
  const plans = [
    {
      id: 1,
      name: "Neural Starter",
      price: "$3.99",
      period: "/month",
      desc: "Essential neural links for casual explorers.",
      features: [
        "Unlimited Text Messages",
        "5 Language Translations",
        "Standard AI Response Speed",
        "Basic Encryption (E2EE)",
        "7-Day Message History"
      ],
      icon: <Globe size={24} className="text-blue-400" />,
      color: "from-blue-500 to-cyan-400",
      border: "border-blue-500/20",
      buttonStyle: "bg-white/5 hover:bg-white/10 text-blue-300"
    },
    {
      id: 2,
      name: "Cortex Pro",
      price: "$6.99",
      period: "/month",
      popular: true,
      desc: "High-bandwidth connection for power users.",
      features: [
        "Everything in Starter",
        "Real-Time Voice Translation",
        "All 50+ Languages Unlocked",
        "Fast AI Response (Turbo)",
        "Priority Support Channel",
        "Unlimited History"
      ],
      icon: <Zap size={24} className="text-brand-400" />,
      color: "from-brand-500 to-purple-600",
      border: "border-brand-500/50",
      buttonStyle: "bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-500/25"
    },
    {
      id: 3,
      name: "Omni God Mode",
      price: "$9.99",
      period: "/month",
      desc: "Unrestricted access to the Astrix Core.",
      features: [
        "Everything in Pro",
        "Zero-Latency Translation",
        "AI Voice Cloning (Beta)",
        "Custom AI Personas",
        "Developer API Access",
        "Encrypted Vault Storage"
      ],
      icon: <Cpu size={24} className="text-amber-400" />,
      color: "from-amber-400 to-orange-500",
      border: "border-amber-500/20",
      buttonStyle: "bg-white/5 hover:bg-white/10 text-amber-300"
    }
  ];

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-brand-500/30 overflow-y-auto custom-scrollbar relative">
      
      {/* Background FX */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <Link to="/chat" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={18} /> Back to Neural Stream
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight mb-4">
            Upgrade Your Frequency
          </h1>
          <p className="text-slate-400 text-lg">
            Unlock the full potential of AstrixChat. Real-time voice translation, cloning, and unlimited power await.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`
                relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 group
                ${plan.popular ? "bg-white/[0.03] scale-105 shadow-2xl shadow-brand-500/10 z-10" : "bg-black/20 hover:bg-white/[0.02]"}
                ${plan.border}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Icon & Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-8 min-h-[40px]">{plan.desc}</p>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={16} className={`mt-0.5 shrink-0 ${plan.id === 2 ? "text-brand-400" : "text-slate-500"}`} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${plan.buttonStyle}`}>
                Initialize Upgrade
              </button>

            </div>
          ))}
        </div>

        {/* FAQ / Trust Section */}
        <div className="mt-20 border-t border-white/5 pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <Shield className="mb-4 text-slate-400" size={24} />
                <h4 className="font-bold text-white mb-2">E2E Encrypted</h4>
                <p className="text-xs text-slate-500">Your payments and chats are secured by quantum-resistant protocols.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <Mic className="mb-4 text-slate-400" size={24} />
                <h4 className="font-bold text-white mb-2">Voice First</h4>
                <p className="text-xs text-slate-500">Optimized for high-fidelity audio streams and instant translation.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <Zap className="mb-4 text-slate-400" size={24} />
                <h4 className="font-bold text-white mb-2">Instant Cancel</h4>
                <p className="text-xs text-slate-500">Disconnect from the premium neural link anytime. No questions asked.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;