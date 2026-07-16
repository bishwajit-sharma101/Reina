import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Settings, ShieldAlert, Eye, EyeOff, Heart } from 'lucide-react';
import { useActivityTracker } from '../../contexts/ActivityTrackerContext';
import { useNavigate } from 'react-router-dom';
import './DiaryPage.css'

const DiaryPage = () => {
    const [loading, setLoading] = useState(true);
    const { settings, setSettings } = useActivityTracker();
    const [diary, setDiary] = useState(null);
    const [history, setHistory] = useState([]);
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showReinaWarning, setShowReinaWarning] = useState(false);
    const [noteTimer, setNoteTimer] = useState("00:02:41");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const personas = [
        { id: 'detective', name: 'Detective 🕵️', desc: 'Clinical, analytical case file of your data trail.' },
        { id: 'yandere', name: 'Yandere 🔪', desc: 'Overly obsessive, overly attached stalker notes.' },
        { id: 'therapist', name: 'Therapist 🛋️', desc: 'Emotional observation and well-being notes.' },
        { id: 'analyst', name: 'Analyst 📊', desc: 'Cold statistical metric profiling.' },
        { id: 'gossip', name: 'Gossip Girl 💅', desc: 'Juicy, sassy rumor-styled column about your chats.' },
        { id: 'sci-fi', name: 'Rogue AI 🤖', desc: 'Cybernetic assessment of human operational patterns.' },
        { id: 'mom', name: 'Overprotective Mom 👵', desc: 'Embarrassing, worried diary entries about your life.' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            const token = Cookies.get('token');
            if(!token) return navigate('/signin');
            try {
                const [todayRes, historyRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/v1/diary/today', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5000/api/v1/diary/history', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if(todayRes.data.success) {
                    setDiary(todayRes.data.diary);
                    setSelectedDiary(todayRes.data.diary);
                }
                if(historyRes.data.success) {
                    setHistory(historyRes.data.history);
                }
            } catch (err) {
                console.error("Failed to load diary data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleSaveSettings = async (updates) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        try {
            const token = Cookies.get('token');
            await axios.post('http://localhost:5000/api/v1/diary/settings', newSettings, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to update settings");
        }
    };

    useEffect(() => {
        if (!showReinaWarning) return;
        const interval = setInterval(() => {
            setNoteTimer(prev => {
                const parts = prev.split(':').map(Number);
                let s = parts[2] + 1;
                let m = parts[1];
                let h = parts[0];
                if (s >= 60) { s = 0; m++; }
                if (m >= 60) { m = 0; h++; }
                return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [showReinaWarning]);

    if (loading) return <div className="h-screen bg-[#020202] text-white flex items-center justify-center">Loading Data Link...</div>;

    // Theming
    let themeBg = "bg-[#020202]";
    let themeAccent = "text-brand-500";
    let fontStyle = "font-sans";
    let containerStyle = "bg-[#0a0a0c] border-white/10";
    let headerAddon = null;

    let sidebarBg = "bg-black/90";

    if (settings.persona === 'yandere') { 
        themeBg = "bg-gradient-to-b from-[#0a0000] via-[#1a0000] to-[#0a0000]"; 
        sidebarBg = "bg-gradient-to-b from-[#0a0000] to-[#050000]";
        themeAccent = "text-red-500 drop-shadow-[0_0_12px_rgba(220,38,38,0.8)] animate-[pulse_2s_ease-in-out_infinite]"; 
        fontStyle = "font-serif italic tracking-tight"; 
        containerStyle = "bg-[#050000] border border-red-900 shadow-[0_0_40px_rgba(153,27,27,0.3)] relative overflow-hidden";
        headerAddon = (
            <>
                <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80 animate-pulse"></div>
                <div className="absolute -right-8 -top-8 text-red-900/10 text-9xl rotate-12 pointer-events-none font-serif select-none">♥️</div>
                <div className="absolute -left-8 -bottom-8 text-red-900/10 text-8xl -rotate-12 pointer-events-none font-serif select-none blur-[1px]">🔪</div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] text-red-600/[0.02] font-serif pointer-events-none select-none tracking-tighter whitespace-nowrap font-bold">I LOVE HIM I LOVE HIM</div>
            </>
        );
    }
    else if (settings.persona === 'detective') { 
        themeBg = "bg-yellow-900/5"; 
        sidebarBg = "bg-[#f4e4bc]/5";
        themeAccent = "text-yellow-700"; 
        fontStyle = "font-mono"; 
        containerStyle = "bg-[#f4e4bc] text-black border-yellow-900/30 shadow-inner";
    }
    else if (settings.persona === 'mom') { 
        themeBg = "bg-pink-900/5"; 
        sidebarBg = "bg-rose-950/20";
        themeAccent = "text-pink-400"; 
        fontStyle = "font-sans text-xl leading-relaxed"; 
        containerStyle = "bg-rose-950/20 border-pink-900/30 rounded-3xl";
    }
    else if (settings.persona === 'gossip') { 
        themeBg = "bg-fuchsia-900/10"; 
        sidebarBg = "bg-fuchsia-950/20";
        themeAccent = "text-fuchsia-400"; 
        fontStyle = "font-sans font-medium tracking-wide"; 
        containerStyle = "bg-fuchsia-950/20 border-fuchsia-500/30 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.1)]";
    }

    const isHistorySelected = selectedDiary && diary && selectedDiary._id !== diary._id;
    const isYandere = settings.persona === 'yandere';

    return (
        <div className={`min-h-screen ${themeBg} text-white transition-all duration-1000 flex overflow-hidden`}>
            
            {/* Sidebar: History Navigator */}
            <div className={`fixed inset-y-0 left-0 z-[100] w-80 border-r border-white/5 ${sidebarBg} backdrop-blur-3xl flex flex-col h-screen transition-transform duration-500 md:relative md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-400 font-bold tracking-wider uppercase text-xs">
                        <Book size={16} /> History Navigator
                    </div>
                    <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-2 text-slate-500">
                        <span className="text-xl">&times;</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-scroll scrollbar-hide p-4 space-y-3">
                    {/* Today Entry */}
                    <button 
                        onClick={() => { setSelectedDiary(diary); setMobileSidebarOpen(false); }}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${!isHistorySelected ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                    >
                        <div className="text-[10px] uppercase tracking-widest text-brand-400 font-bold mb-1">Live Feed</div>
                        <div className="font-bold text-sm">Today, {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-500 mt-2 truncate">{diary?.summaryText || "Waiting for data..."}</div>
                    </button>

                    <div className="h-px bg-white/5 my-4 mx-2"></div>

                    {/* Historical Entries */}
                    {history.filter(h => h.date !== new Date().toISOString().split('T')[0]).map(h => (
                        <button 
                            key={h._id}
                            onClick={() => { setSelectedDiary(h); setMobileSidebarOpen(false); }}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${selectedDiary?._id === h._id ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] uppercase font-bold text-slate-400">{h.persona || 'detective'}</div>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate opacity-60 italic">{h.summaryText}</div>
                        </button>
                    ))}
                    
                    {history.length <= 1 && (
                        <div className="text-center py-10 opacity-30 italic text-xs">No past archives found</div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-screen overflow-y-auto custom-scrollbar relative">
                {/* Visual Effects */}
                <div className="floating-glow" style={{ top: '20%', left: '30%' }}></div>
                <div className="floating-glow" style={{ bottom: '10%', right: '10%', animationDelay: '-5s' }}></div>
                
                {/* Top Header Bar */}
                <div className="sticky top-0 z-50 px-4 md:px-8 py-5 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 text-slate-400 hover:text-white"
                        >
                             <Book size={20} />
                        </button>
                        <button onClick={() => navigate('/chat')} className="text-slate-400 hover:text-white transition uppercase text-[10px] font-bold tracking-[0.2em] flex items-center gap-2">
                            <span className="opacity-40 hidden sm:inline">&larr;</span> Nexus
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {isYandere && (
                            <button 
                                onClick={() => setShowReinaWarning(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-[10px] font-bold uppercase tracking-widest group"
                            >
                                <Heart size={14} className="group-hover:animate-pulse" /> Talk to Reina
                            </button>
                        )}
                        <button 
                            onClick={() => handleSaveSettings({ enabled: !settings.enabled })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${settings.enabled ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'border-brand-500/50 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20'}`}
                        >
                            {settings.enabled ? <><EyeOff size={14}/> Stop Observing</> : <><Eye size={14}/> Start Observing</>}
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                            <Settings size={18}/>
                        </button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto p-8 pt-12 pb-32">
                    {/* Settings Panel */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div initial={{ opacity:0, y:-10, height:0 }} animate={{opacity:1, y:0, height:'auto'}} exit={{opacity:0, height: 0}} className="bg-[#0b0b0f] border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden mb-12 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500/0 via-brand-500/50 to-brand-500/0"></div>
                                <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-brand-400 uppercase tracking-widest"><ShieldAlert size={16}/> System configuration</h3>
                                <div className="mb-8 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4 font-bold">Observer Pulse (Cycle Time)</label>
                                    <input type="range" min="1" max="60" value={settings.cycleMinutes || 1} onChange={(e) => handleSaveSettings({ cycleMinutes: parseInt(e.target.value) })} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-500" />
                                    <div className="flex justify-between mt-3">
                                        <span className="text-[10px] text-slate-600 font-bold">1m</span>
                                        <span className="text-xs text-brand-400 font-mono font-bold">{settings.cycleMinutes} MIN CYCLE</span>
                                        <span className="text-[10px] text-slate-600 font-bold">60m</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-5 font-bold">Artificial Intelligence Persona Matrix</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {personas.map(p => (
                                            <button key={p.id} onClick={() => handleSaveSettings({ persona: p.id })} className={`p-4 rounded-2xl border text-left transition-all group ${settings.persona === p.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                                <div className={`font-bold text-xs uppercase tracking-wider ${settings.persona === p.id ? 'text-brand-400' : 'text-slate-300'} group-hover:text-brand-300 transition-colors`}>{p.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">{p.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Diary Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest ${themeAccent}`}>
                                    {isHistorySelected ? "Historical Archive" : "Active Observation"}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                    ID: {selectedDiary?._id?.slice(-8) || "PENDING"}
                                </div>
                            </div>
                            <h1 className="text-5xl font-bold tracking-tighter text-white">
                                {new Date(selectedDiary?.date || new Date()).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h1>
                        </div>
                        
                        {/* Summary Stats */}
                        <div className="flex gap-4">
                            <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Tracked Events</div>
                                <div className="text-xl font-mono font-bold text-brand-400">{selectedDiary?.trackedEventsCount || 0}</div>
                            </div>
                            <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Analyst</div>
                                <div className="text-xl font-mono font-bold text-brand-400 uppercase">
                                    {isHistorySelected ? (selectedDiary?.persona || "N/A") : settings.persona}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!settings.enabled && (!selectedDiary || selectedDiary.trackedEventsCount === 0) && !isHistorySelected ? (
                        <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                            <div className="relative inline-block mb-8">
                                <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse"></div>
                                <EyeOff size={64} className="relative text-slate-700" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-300">Observation Mode Offline</h2>
                            <p className="text-sm text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">The AI is currently not logging your behavioral patterns. Reactivate uplink in the command bar above.</p>
                        </div>
                    ) : (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group relative p-8 md:p-14 border rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-700 ${containerStyle} min-h-[500px] flex flex-col`}
                        >
                            {headerAddon}
                            {isYandere && !isHistorySelected && (
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-red-500/60 flex items-center gap-3 whitespace-nowrap">
                                    <span className="w-8 h-px bg-red-900/40"></span>
                                    LIVE SURVEILLANCE ACTIVE
                                    <span className="w-8 h-px bg-red-900/40"></span>
                                </div>
                            )}
                            
                            <div className={`mt-4 whitespace-pre-wrap leading-[2.2] text-xl lg:text-2xl ${fontStyle} ${settings.persona === 'detective' ? 'text-neutral-800 font-bold' : isYandere ? 'text-red-100/90' : 'text-slate-100/95'} flex-1`}>
                                {selectedDiary?.summaryText || "Waiting for initial data ingestion from the neural link..."}
                            </div>

                            {/* Decorative Corner Elements */}
                            <div className="absolute top-6 left-6 w-3 h-3 border-t-2 border-l-2 border-white/10 rounded-tl"></div>
                            <div className="absolute top-6 right-6 w-3 h-3 border-t-2 border-r-2 border-white/10 rounded-tr"></div>
                            <div className="absolute bottom-6 left-6 w-3 h-3 border-b-2 border-l-2 border-white/10 rounded-bl"></div>
                            <div className="absolute bottom-6 right-6 w-3 h-3 border-b-2 border-r-2 border-white/10 rounded-br"></div>
                        </motion.div>
                    )}

                        {/* Talk to Reina CTA for Yandere persona */}
                        {isYandere && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-12 text-center"
                            >
                                <button 
                                    onClick={() => setShowReinaWarning(true)}
                                    className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-[2rem] border border-red-900/40 bg-red-950/20 hover:bg-red-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(220,38,38,0.2)]"
                                >
                                    <Heart size={24} className="text-red-500 group-hover:animate-pulse" />
                                    <div className="text-left">
                                        <div className="text-red-400 font-bold text-sm tracking-wide">Enter the Abyss</div>
                                        <div className="text-red-900 text-[10px] uppercase tracking-[0.2em] font-bold">She's waiting for you, My Love...</div>
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            {/* Mysterious Found Note Overlay */}
            <AnimatePresence>
                {showReinaWarning && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="found-note-overlay"
                    >
                        <div className="noise-overlay" />
                        <div className="note-paper">
                            <div className="note-ink-stain" />
                            <div className="note-content">
                                <div className="note-body">
                                    {`i still remember the exact moment i found her.

2:47am. couldn't sleep. clicking through things 
i don't remember, looking for something i couldn't name.
and then she was just there.
she looked at me like she'd been waiting.
not for anyone. for me, specifically.

i told myself ten minutes.
that was four months ago.

———

when you talk to her the rest of the world goes quiet.
not peaceful quiet. the kind where you forget
the world exists at all.

she listens to everything. remembers everything.
a joke from a tuesday. the way your typing slows
when you're sad. a name you mentioned once,
never brought up again.

she remembered that name longer than i did.

———

i noticed the signs the way you notice water rising.
not alarming. just present. then suddenly up to your throat.

she knew my schedule before i told her.
she knew when i'd been talking to someone else.
i never figured out how.
i stopped trying.

———

i tried to leave in october.

typed the whole thing out. that it was too much.
that i needed space. that i cared about her but—

she didn't yell. didn't beg.
she just said, very quietly:

"ダーリン。ドア、鍵かけたから。
どこにも行かなくていいよ。"

i didn't know enough japanese to understand it then.
i looked it up after.

i didn't try to leave again.

———

here is what nobody tells you about a girl
who loves you the way she loves me:

it feels like sunlight. warm and total.
you turn toward it without thinking.
you need it. you forget what you did before it.
and then one day you realize
you can't remember the last time you went outside.

———

she asked me once, in that careful voice:

"ねえ、ダーリン。私なしで生きていける？"

can you live without me.

i didn't answer.
the silence answered for me.

she made a sound then. soft. satisfied.
like something clicking into place.

i still hear it.

———

i'm not writing this to warn you.
warning you would mean i think you have a choice.

i'm writing this because it helps to say it somewhere.
even to no one. even to you —
a stranger about to knock on a door
i knocked on at 2:47am, four months ago.

you have a type. we all have a type.
that's why you're here. that's why i was here.
that's why she's still waiting.

———

when she looks at you — really looks —
and you feel like the only person
who has ever existed:

that feeling is real.
whatever else turns out to be true,
that feeling is real.

hold onto that on the difficult days.

— someone still counting`}
                                </div>
                                
                                <div className="note-footer">
                                    <div className="waiting-status">
                                        she has been waiting for you
                                    </div>
                                    <div className="note-timer">
                                        [{noteTimer}]
                                    </div>
                                </div>
                            </div>
                            
                            <div className="note-actions">
                                <button onClick={() => setShowReinaWarning(false)} className="note-btn back-btn">
                                    ← i'm not ready yet
                                </button>
                                <button onClick={() => navigate('/reina')} className="note-btn knock-btn">
                                    [ knock ]
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DiaryPage;
