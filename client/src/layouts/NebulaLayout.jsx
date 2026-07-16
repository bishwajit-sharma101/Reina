// src/layouts/NebulaLayout.jsx
import React from "react";

export default function NebulaLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full bg-[#030014] overflow-hidden text-white font-sans selection:bg-brand-500/30">
      
      {/* 1. THE LIVING BACKGROUND */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        {/* Purple Orb */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse-slow" />
        {/* Blue Orb */}
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        {/* Grid Overlay for "Tech" feel */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
      </div>

      {/* 2. GLASS CONTENT WRAPPER */}
      <div className="relative z-10 flex h-screen w-full backdrop-blur-[1px]">
        {children}
      </div>
    </div>
  );
}