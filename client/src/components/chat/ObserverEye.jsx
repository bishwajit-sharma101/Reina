import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import { useActivityTracker } from '../../contexts/ActivityTrackerContext';

const ObserverEye = () => {
    const { settings } = useActivityTracker();
    const [pulseSpeed, setPulseSpeed] = useState(3);
    const [eyeColor, setEyeColor] = useState('text-brand-500');

    // Simulate real-time reaction to activity (simplified for UI)
    useEffect(() => {
        if (!settings.enabled) return;

        const interval = setInterval(() => {
            // Randomly shift between states for visual feedback
            const states = [
                { color: 'text-brand-500', speed: 4 }, // Focused
                { color: 'text-emerald-500', speed: 6 }, // Calm
                { color: 'text-pink-500', speed: 2 },   // Intense
                { color: 'text-amber-500', speed: 8 },  // Idle
            ];
            const randomState = states[Math.floor(Math.random() * states.length)];
            setPulseSpeed(randomState.speed);
            setEyeColor(randomState.color);
        }, 5000);

        return () => clearInterval(interval);
    }, [settings.enabled]);

    if (!settings.enabled) return null;

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
            <div className="relative flex items-center justify-center">
                {/* Orbital Rings */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-8 h-8 rounded-full border border-dashed border-white/10"
                />
                
                {/* The Eye */}
                <motion.div
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                        duration: pulseSpeed, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className={`relative z-10 ${eyeColor}`}
                >
                    <Eye size={18} strokeWidth={2.5} />
                </motion.div>

                {/* Pupil Glow */}
                <div className={`absolute inset-0 blur-[8px] ${eyeColor.replace('text', 'bg')}/40 rounded-full`} />
            </div>

            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest leading-none">Neural Sync</span>
                <span className="text-[8px] font-mono text-zinc-500 leading-none mt-1 uppercase">Active Monitoring</span>
            </div>
        </div>
    );
};

export default ObserverEye;
