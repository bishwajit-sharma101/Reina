import React from 'react';
import { Users, Radio, ShieldCheck, Zap } from 'lucide-react';

const SidebarDiscovery = ({ rooms = [], publicChats = [] }) => {
  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-xl p-4 overflow-y-auto">
      {/* AI Moderator Badge */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <ShieldCheck size={14} className="text-purple-400" />
        <span className="text-[10px] text-purple-300 font-mono font-bold uppercase tracking-widest">
          AI-Guardian Active
        </span>
      </div>

      {/* Public Groups Section */}
      <div className="mb-8">
        <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-4 px-1 font-bold">
          Public Nodes
        </h4>
        <div className="space-y-1">
          {rooms.map(room => (
            <button key={room.id} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-brand-500/20 transition-colors">
                  <Users size={14} className="text-zinc-400 group-hover:text-brand-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{room.name}</p>
                  <p className="text-[10px] text-zinc-600">{room.members} members</p>
                </div>
              </div>
              {room.active && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Public 1-1 Streams Section */}
      <div>
        <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-4 px-1 font-bold">
          Live 1-1 Streams
        </h4>
        <div className="space-y-3">
          {publicChats.map(chat => (
            <div key={chat.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-brand-500/30 cursor-pointer transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white">{chat.user}</span>
                <div className="flex items-center gap-1.5">
                   <span className="text-[9px] text-red-500 font-bold animate-pulse">LIVE</span>
                   <Radio size={12} className="text-red-500" />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 truncate italic mb-3">"{chat.topic}"</p>
              <button className="w-full py-1.5 bg-brand-500/10 rounded-lg text-[10px] text-brand-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Zap size={10} fill="currentColor" />
                JOIN STREAM
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarDiscovery;