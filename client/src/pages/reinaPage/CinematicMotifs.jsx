import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CinematicMotifs = ({ activeMotif }) => {
    // If strawberry, render strictly behind the character (zIndex: 2). Other motifs render in front (zIndex: 45).
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: activeMotif === 'strawberry' ? 2 : 45, overflow: 'hidden' }}>
            <AnimatePresence>
                
                {/* STRAWBERRY / SWEET: Beautifully distributed, depth-layered background strawberries */}
                {activeMotif === 'strawberry' && (
                    <motion.div
                        key="strawberry-scene"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,180,200,0.18), rgba(255,100,150,0.08))' }}
                    >
                        {Array.from({ length: 35 }).map((_, i) => {
                            // Well-balanced golden-ratio pseudo-random distribution across the screen
                            const startX = ((i * 17.3 + 3) % 94); // Spread horizontally 3% - 97%
                            const floatY = `${6 + ((i * 23.7 + 5) % 84)}vh`; // Spread vertically 6vh - 90vh
                            
                            // 3 Depth tiers: distant (small), midground, foreground (large)
                            const depthTier = i % 3;
                            let size, opacity, blur, delay;
                            if (depthTier === 0) {
                                // Distant small background
                                size = 18 + ((i * 7) % 12); // 18px - 30px
                                opacity = 0.65;
                                blur = '0.8px';
                                delay = (i % 6) * 0.08;
                            } else if (depthTier === 1) {
                                // Midground
                                size = 32 + ((i * 11) % 18); // 32px - 50px
                                opacity = 0.85;
                                blur = 'none';
                                delay = (i % 7) * 0.07;
                            } else {
                                // Foreground background (still behind character)
                                size = 52 + ((i * 13) % 26); // 52px - 78px
                                opacity = 0.95;
                                blur = 'none';
                                delay = (i % 5) * 0.09;
                            }

                            const bobDuration = 3.2 + (i % 5) * 0.6; // 3.2s - 5.6s gentle desynced float
                            const bobDistance = 8 + (size * 0.15); // proportional gentle bob

                            return (
                                <motion.div
                                    key={`berry-${i}`}
                                    initial={{ 
                                        y: '115vh', 
                                        x: `${startX}vw`,
                                        opacity: 0,
                                        scale: 0.3
                                    }}
                                    animate={{ 
                                        y: floatY, // Arrives at designated location and floats in place
                                        opacity: opacity, 
                                        scale: 1
                                    }}
                                    transition={{ 
                                        duration: 1.4 + ((i % 4) * 0.25), 
                                        ease: [0.25, 0.1, 0.25, 1],
                                        delay: delay
                                    }}
                                    style={{ 
                                        position: 'absolute', 
                                        willChange: 'transform, opacity',
                                        filter: blur !== 'none' ? `blur(${blur})` : 'none'
                                    }}
                                >
                                    <motion.div
                                        animate={{ 
                                            y: [0, -bobDistance, 0], // Soft floating in place, doesn't fly off
                                            rotate: [0, (i % 2 === 0 ? 8 : -8), (i % 2 === 0 ? -6 : 6), 0] // Gentle sway
                                        }}
                                        transition={{
                                            duration: bobDuration,
                                            ease: "easeInOut",
                                            repeat: Infinity,
                                            delay: (i % 4) * 0.5
                                        }}
                                        style={{
                                            fontSize: `${size}px`,
                                            textShadow: '0 0 12px rgba(255,100,150,0.4)',
                                            display: 'inline-block',
                                            willChange: 'transform'
                                        }}
                                    >
                                        {String.fromCodePoint(0x1F353)}
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* UMBRELLA: Atmospheric Rain Effect */}
                {activeMotif === 'umbrella' && (
                    <motion.div
                        key="rain-effect"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    >
                        {Array.from({ length: 50 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 0 }}
                                animate={{ 
                                    y: window.innerHeight + 100, 
                                    x: `calc(${Math.random() * 100}vw - 200px)`,
                                    opacity: [0, 0.6, 0]
                                }}
                                transition={{ 
                                    duration: Math.random() * 0.5 + 0.5,
                                    ease: "linear",
                                    repeat: Infinity,
                                    delay: Math.random() * 1
                                }}
                                style={{ 
                                    position: 'absolute', 
                                    width: '2px', height: '60px', 
                                    background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(150,200,255,0.8))',
                                    transform: 'rotate(15deg)',
                                    filter: 'blur(1px)'
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* TRAIN / CLOCK: Fast passing cinematic light streaks (like looking out a train window) */}
                {(activeMotif === 'train' || activeMotif === 'clock') && (
                    <motion.div
                        key="train-lights"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    >
                        {Array.from({ length: 10 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: window.innerWidth + 500, y: Math.random() * window.innerHeight, opacity: 0 }}
                                animate={{ 
                                    x: -1000, 
                                    opacity: [0, 1, 1, 0]
                                }}
                                transition={{ 
                                    duration: Math.random() * 0.8 + 0.4,
                                    ease: "linear",
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                                style={{ 
                                    position: 'absolute', 
                                    width: `${Math.random() * 300 + 200}px`, height: `${Math.random() * 10 + 2}px`, 
                                    background: Math.random() > 0.5 ? 'rgba(255,220,100,0.8)' : 'rgba(255,255,255,0.5)',
                                    filter: 'blur(4px)',
                                    boxShadow: '0 0 20px rgba(255,200,100,0.5)'
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* WINTER: Slow gentle snowfall across the screen */}
                {activeMotif === 'winter' && (
                    <motion.div
                        key="snow-effect"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    >
                        {Array.from({ length: 60 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 0 }}
                                animate={{ 
                                    y: window.innerHeight + 100, 
                                    x: `calc(${Math.random() * 100}vw + ${Math.random() * 100 - 50}px)`,
                                    opacity: [0, 0.8, 0]
                                }}
                                transition={{ 
                                    duration: Math.random() * 4 + 4,
                                    ease: "linear",
                                    repeat: Infinity,
                                    delay: Math.random() * 3
                                }}
                                style={{ 
                                    position: 'absolute', 
                                    width: `${Math.random() * 6 + 4}px`, height: `${Math.random() * 6 + 4}px`, 
                                    background: '#ffffff',
                                    borderRadius: '50%',
                                    filter: 'blur(2px)',
                                    boxShadow: '0 0 10px #ffffff'
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* SHATTER: Screen glass crack effect using SVG lines across the whole screen */}
                {activeMotif === 'shatter' && (
                    <motion.svg
                        key="shatter-glass"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 100 }}
                        viewBox="0 0 100 100" preserveAspectRatio="none"
                    >
                        <motion.path 
                            d="M 50 0 L 45 30 L 55 50 L 40 70 L 60 100" 
                            stroke="#ffffff" strokeWidth="0.2" fill="none"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' }}
                        />
                        <motion.path 
                            d="M 45 30 L 0 40 M 55 50 L 100 45 M 40 70 L 20 100" 
                            stroke="#ffffff" strokeWidth="0.1" fill="none"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                        />
                    </motion.svg>
                )}

                {/* SPOTLIGHT / DOOR / HAND: Dramatic warm lighting shining down */}
                {(activeMotif === 'spotlight' || activeMotif === 'hand' || activeMotif === 'door') && (
                    <motion.div
                        key="spotlight-beam"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
                    >
                        {/* Main Beam */}
                        <motion.div 
                            initial={{ transform: 'rotate(-30deg) translateY(-50%)' }}
                            animate={{ transform: 'rotate(-20deg) translateY(0)' }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            style={{
                                position: 'absolute', top: '-20%', left: '0%', width: '150%', height: '120%',
                                background: 'linear-gradient(to bottom, rgba(255,220,240,0.3) 0%, rgba(255,200,220,0) 80%)',
                                mixBlendMode: 'plus-lighter'
                            }} 
                        />
                        {/* Inner intense beam */}
                        <motion.div 
                            initial={{ transform: 'rotate(-25deg) translateY(-50%)' }}
                            animate={{ transform: 'rotate(-18deg) translateY(0)' }}
                            transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                            style={{
                                position: 'absolute', top: '-20%', left: '20%', width: '80%', height: '120%',
                                background: 'linear-gradient(to bottom, rgba(255,245,210,0.4) 0%, rgba(255,230,180,0) 70%)',
                                mixBlendMode: 'plus-lighter', filter: 'blur(10px)'
                            }} 
                        />
                    </motion.div>
                )}

                {/* INSANE: Intense pulse overlay and camera vignette */}
                {activeMotif === 'insane' && (
                    <motion.div
                        key="insane-pulse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'radial-gradient(circle at center, transparent 30%, rgba(255,0,100,0.4) 100%)',
                            mixBlendMode: 'color-dodge'
                        }}
                    />
                )}
                
            </AnimatePresence>
        </div>
    );
};

export default CinematicMotifs;

