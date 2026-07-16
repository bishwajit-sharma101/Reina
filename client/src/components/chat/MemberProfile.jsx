import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Sparkles, Save, User as UserIcon, Hexagon, X, Plus, 
  Camera, MessageSquare, Zap, Target, Layout, ShieldCheck,
  ChevronLeft, Award, Radio, Activity, Globe, Heart, Share2, Info,
  Fingerprint, Compass, Settings, MoreHorizontal, Mail, MapPin, Link as LinkIcon
} from 'lucide-react';
import PublicPost from './PublicPost';
import Loader from '../common/Loader';

const MemberProfile = ({ currentUser, targetUserId, onStartChat, onOpenComments, onAvatarChange, onBack }) => {
  const profileId = String((typeof targetUserId === 'object' && targetUserId !== null) ? (targetUserId._id || targetUserId.id) : (targetUserId || ''));
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuraScanning, setIsAuraScanning] = useState(false);
  const [auraData, setAuraData] = useState(null);
  const [activeTab, setActiveTab] = useState('signals'); 

  const isOwnProfile = profileId === String(currentUser?._id || currentUser?.id);
  const token = Cookies.get('token');

  // Edit states
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState([]);
  const [editInterest, setEditInterest] = useState('');
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const userRes = await axios.get(`http://localhost:5000/api/v1/users/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.data.success) {
          setProfile(userRes.data.user);
          setEditBio(userRes.data.user.bio || '');
          setEditInterests(userRes.data.user.interests || []);
        }

        const postsRes = await axios.get(`http://localhost:5000/api/v1/posts/user/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (postsRes.data.success) {
            setPosts(postsRes.data.posts.map(p => ({
                ...p,
                id: p._id,
                author: { ...p.author, id: p.author._id },
                timestamp: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })));
        }
      } catch (err) {
        console.error("Failed to fetch profile data", err);
        setProfile({ error: true });
      } finally {
        setIsLoading(false);
      }
    };
    if (profileId && profileId !== 'undefined' && profileId !== 'null') fetchProfile();
  }, [profileId, token]);

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put('http://localhost:5000/api/v1/users/profile', {
        bio: editBio,
        interests: editInterests
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfile(res.data.user);
        setIsEditing(false);
        Cookies.set('user', JSON.stringify({ ...currentUser, bio: editBio, interests: editInterests }));
      }
    } catch(err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleRevealAura = async () => {
     if (isAuraScanning) return;
     setIsAuraScanning(true);
     try {
        const res = await axios.post('http://localhost:5000/api/v1/ai/aura/scan', {
           name: profile.name,
           bio: profile.bio,
           interests: profile.interests,
           targetId: profile._id
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        if (res.data.success) {
           setAuraData(res.data.aura);
           setActiveTab('insights');
        }
     } catch (err) {
        alert(err.response?.data?.message || "Reveal failed.");
     } finally {
        setIsAuraScanning(false);
     }
  };

  const addInterest = () => {
    if (editInterest.trim() && !editInterests.includes(editInterest.trim())) {
      setEditInterests([...editInterests, editInterest.trim()]);
      setEditInterest('');
    }
  };

  const removeInterest = (item) => {
    setEditInterests(editInterests.filter(i => i !== item));
  };

  if (isLoading || !profile || profile.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050508]">
          <Loader size={60} />
          <p className="mt-8 text-[10px] uppercase font-black tracking-[0.4em] text-zinc-600 animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  const auraGradient = auraData?.auraColor || (profile.role === 'primeUser' ? 'from-amber-400 to-rose-600' : 'from-brand-500 to-violet-600');

  return (
    <div className="h-full flex-1 flex flex-col bg-[#050508] relative overflow-y-auto custom-scrollbar select-none">
      
      {/* 🌌 DYNAMIC BACKGROUND MESH */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full opacity-[0.08] blur-[150px] bg-gradient-to-br ${auraGradient}`} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
          
          {/* 🏛️ HEADER: THE INTEGRATED BANNER */}
          <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-white/[0.02] border border-white/5 shadow-2xl">
              {/* Banner Area */}
              <div className={`h-48 md:h-64 w-full bg-gradient-to-br ${auraGradient} opacity-20 relative`}>
                 <div className="absolute inset-0 bg-[#050508]/20 backdrop-blur-[2px]" />
                 <button 
                  onClick={onBack}
                  className="absolute top-6 left-6 p-3 rounded-2xl bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all backdrop-blur-md group"
                 >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
              </div>

              {/* Identity Row */}
              <div className="px-8 md:px-12 pb-10 flex flex-col md:flex-row items-center md:items-end gap-8 -mt-20 md:-mt-24 relative z-10">
                  <div className="relative mb-16 group">
                  <div className={`absolute -inset-10 bg-gradient-to-tr ${auraGradient} rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000`} />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] border-[6px] border-[#050508] overflow-hidden shadow-2xl overflow-hidden"
                  >
                     <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} className="w-full h-full object-cover" alt="avatar" />
                     
                     {/* 📷 AVATAR UPLOAD OVERLAY */}
                     {isOwnProfile && isEditing && (
                        <div 
                           onClick={() => document.getElementById('avatar-upload-input').click()}
                           className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group/upload"
                        >
                           <Camera size={32} className="text-white group-hover/upload:scale-110 transition-transform" />
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white mt-2">Update Core</span>
                           <input 
                              id="avatar-upload-input"
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                 const file = e.target.files[0];
                                 if (file) onAvatarChange(file);
                              }}
                           />
                        </div>
                     )}
                  </motion.div>
                  {profile.isOnline && (
                     <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 rounded-full border-4 border-[#050508] z-20 shadow-lg shadow-emerald-500/20" />
                  )}
              </div>

                  <div className="flex-1 text-center md:text-left pt-4 space-y-2">
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                         <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none">{profile.name}</h1>
                         <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 mb-1">
                            <ShieldCheck size={14} className="text-brand-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                               {profile.role === 'primeUser' ? 'Prime Node' : 'Satellite'}
                            </span>
                         </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-zinc-500 text-[11px] font-medium tracking-wide">
                         <span className="flex items-center gap-1.5"><Fingerprint size={14} /> ID: {profileId.slice(-8)}</span>
                         <span className="hidden md:block w-1 h-1 rounded-full bg-zinc-800" />
                         <span className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500" /> Sync Stable</span>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 pb-2">
                      {isOwnProfile ? (
                         <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-8 py-3.5 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                         >
                            {isEditing ? 'Close System' : 'Edit Profile'}
                         </button>
                      ) : (
                         <>
                            <button 
                               onClick={() => onStartChat(profile._id)}
                               className="px-8 py-3.5 rounded-2xl bg-brand-500 text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-500/20 flex items-center gap-2"
                            >
                               <MessageSquare size={16} /> Establish Link
                            </button>
                            <button className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                               <MoreHorizontal size={20} />
                            </button>
                         </>
                      )}
                  </div>
              </div>
          </div>

          {/* 🏗️ MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* 🗃️ LEFT SIDEBAR: IDENTITY CONTEXT (4 cols) */}
              <aside className="lg:col-span-4 space-y-6">
                  
                  {/* BIO BOX */}
                  <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neural Objective</h3>
                         <Info size={14} className="text-zinc-700" />
                      </div>
                      {isEditing ? (
                         <textarea 
                            value={editBio} 
                            onChange={(e) => setEditBio(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 focus:outline-none min-h-[120px] leading-relaxed resize-none font-serif italic"
                            placeholder="Set your neural directive..."
                         />
                      ) : (
                         <p className="text-lg text-zinc-200 leading-relaxed font-medium font-serif italic select-text">
                            "{profile.bio || "Searching for purpose in the digital void..."}"
                         </p>
                      )}
                  </div>

                  {/* FREQUENCIES (INTERESTS) */}
                  <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Frequencies</h3>
                      <div className="flex flex-wrap gap-2">
                         {isEditing ? (
                            <div className="w-full space-y-4">
                               <div className="flex gap-2">
                                  <input 
                                     value={editInterest} 
                                     onChange={(e) => setEditInterest(e.target.value)} 
                                     onKeyPress={(e) => e.key === 'Enter' && addInterest()} 
                                     className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" 
                                     placeholder="Add Node..." 
                                  />
                                  <button onClick={addInterest} className="px-4 bg-white text-black font-black">+</button>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                  {editInterests.map(i => (
                                     <span key={i} className="px-4 py-2 bg-brand-500/10 rounded-full text-[10px] text-white font-bold flex items-center gap-2 border border-brand-500/20">
                                        {i} <X size={12} className="cursor-pointer text-red-400" onClick={() => removeInterest(i)} />
                                     </span>
                                  ))}
                               </div>
                               <button onClick={handleSaveProfile} className="w-full py-4 bg-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-brand-500 transition-all flex items-center justify-center gap-2">
                                  <Save size={14}/> Commit Neural Data
                               </button>
                            </div>
                         ) : (
                            profile.interests?.length > 0 ? profile.interests.map((tag, i) => (
                               <span key={i} className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-black text-zinc-400 tracking-wider uppercase hover:text-white hover:bg-white/10 transition-all cursor-default">
                                  {tag}
                               </span>
                            )) : <p className="text-[10px] text-zinc-700 italic">No node frequency detected.</p>
                         )}
                      </div>
                  </div>

                  {/* STATS BENTO */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                          <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Signals</p>
                          <p className="text-3xl font-black text-white leading-none">{posts.length}</p>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2 text-right">
                          <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Reliability</p>
                          <p className="text-3xl font-black text-emerald-500 leading-none italic">99<span className="text-xs">%</span></p>
                      </div>
                  </div>

              </aside>

              {/* 🧊 RIGHT COLUMN: INTERACTION CENTER (8 cols) */}
              <main className="lg:col-span-8 space-y-8">
                  
                  {/* Tab Navigation */}
                  <div className="flex items-center justify-between px-2">
                      <nav className="flex items-center gap-8">
                         {[
                           { id: 'signals', label: 'Signals History', icon: Radio },
                           { id: 'insights', label: 'Neural Insights', icon: Sparkles }
                         ].map(tab => (
                            <button
                               key={tab.id}
                               onClick={() => setActiveTab(tab.id)}
                               className={`flex items-center gap-3 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                               <tab.icon size={16} /> {tab.label}
                               {activeTab === tab.id && (
                                  <motion.div layoutId="profile-tab-active" className="absolute -bottom-1 left-0 right-0 h-1 bg-brand-500 rounded-full" />
                               )}
                            </button>
                         ))}
                      </nav>
                      <div className="hidden md:block h-px flex-1 bg-white/5 mx-10" />
                      {!isOwnProfile && activeTab === 'signals' && (
                         <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                            Filter <Target size={14} />
                         </button>
                      )}
                  </div>

                  {/* Tab Content Window */}
                  <AnimatePresence mode="wait">
                     {activeTab === 'signals' ? (
                        <motion.div 
                          key="signals"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-6"
                        >
                           {posts.length === 0 ? (
                              <div className="p-20 text-center rounded-[3rem] bg-white/[0.01] border border-dashed border-white/10 space-y-6">
                                 <Radio size={48} className="mx-auto text-zinc-800 animate-pulse" />
                                 <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No active transmissions detected from this node.</p>
                              </div>
                           ) : (
                              posts.map(post => (
                                 <PublicPost 
                                   key={post.id} 
                                   post={post}
                                   onOpenComments={() => onOpenComments(post)}
                                   onStartChat={() => onStartChat(profile._id, post.content.original)}
                                 />
                              ))
                           )}
                        </motion.div>
                     ) : (
                        <motion.div 
                          key="insights"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-8"
                        >
                           {!isOwnProfile ? (
                              auraData ? (
                                 <div className="space-y-8">
                                    <div className="p-12 rounded-[3.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                       <div className={`absolute top-0 right-0 p-12 opacity-5 blur-2xl bg-gradient-to-br ${auraGradient} w-full h-full pointer-events-none group-hover:opacity-10 transition-opacity`} />
                                       <div className="flex items-center gap-4 mb-10">
                                          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/10 text-purple-400">
                                             <Sparkles size={24} />
                                          </div>
                                          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Soul Revelation Output</h3>
                                       </div>
                                       <blockquote className="text-2xl md:text-3xl font-light text-zinc-100 leading-[1.4] font-serif italic relative z-10">
                                          "{auraData.vibeCheck}"
                                       </blockquote>
                                       <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                          <div className="space-y-4">
                                             <p className="text-7xl font-black text-white italic leading-none">{auraData.compatibility}%</p>
                                             <p className="text-[9px] font-mono text-brand-400 uppercase tracking-[0.4em]">Neural Synergistics</p>
                                          </div>
                                          <div className="flex flex-col justify-end">
                                             <p className="text-sm font-medium text-zinc-400 leading-relaxed italic border-l-2 border-brand-500/20 pl-6">
                                                "{auraData.compReason}"
                                             </p>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                       {auraData.icebreakers.map((starter, i) => (
                                          <motion.button 
                                             whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.04)' }}
                                             key={i} 
                                             onClick={() => onStartChat(profile._id, starter)}
                                             className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 transition-all text-left flex items-center justify-between group"
                                          >
                                             <div className="flex-1">
                                                <p className="text-[9px] uppercase font-black text-zinc-600 mb-2 truncate tracking-[0.2em]">Protocol Sequence #{i+1}</p>
                                                <p className="text-base text-zinc-200 font-medium italic">"{starter}"</p>
                                             </div>
                                             <Plus size={20} className="text-zinc-700 group-hover:text-brand-400 transition-colors" />
                                          </motion.button>
                                       ))}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="p-20 text-center rounded-[3.5rem] bg-white/[0.01] border border-dashed border-white/10 space-y-10">
                                    <div className="relative mx-auto w-24 h-24">
                                       <Zap size={48} className="absolute inset-0 m-auto text-zinc-800" />
                                       <motion.div 
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                          className="absolute inset-0 border-2 border-dashed border-zinc-800 rounded-full"
                                       />
                                    </div>
                                    <div className="space-y-6 max-w-sm mx-auto">
                                       <h4 className="text-white text-xs font-black uppercase tracking-widest">Aura Intelligence Encrypted</h4>
                                       <p className="text-zinc-600 text-[11px] leading-relaxed italic">Initiate a wide-spectrum neural scan to synthesize this node's persona profile.</p>
                                    </div>
                                    <button 
                                       disabled={isAuraScanning}
                                       onClick={handleRevealAura}
                                       className="px-12 py-5 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group mx-auto"
                                    >
                                       <Compass className={`w-5 h-5 ${isAuraScanning ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`} />
                                       {isAuraScanning ? "Decrypting Node..." : "Initiate Reveal"}
                                    </button>
                                    <p className="text-[9px] font-mono text-zinc-800 tracking-[0.4em] uppercase font-bold italic pt-4">Neural Quota Required: 5 Units</p>
                                 </div>
                              )
                           ) : (
                              <div className="p-20 text-center rounded-[3rem] bg-brand-500/5 border border-brand-500/10 space-y-6">
                                 <ShieldCheck size={48} className="mx-auto text-brand-400 opacity-30" />
                                 <p className="text-[10px] font-black text-brand-300 uppercase tracking-widest">Self-Reflexive Aura Scanning is disabled.</p>
                                 <p className="text-[9px] text-zinc-600 font-mono italic max-w-[250px] mx-auto">Neural protocol prevents iterative self-analysis to preserve node stability.</p>
                              </div>
                           )}
                        </motion.div>
                     )}
                  </AnimatePresence>
              </main>

          </div>
      </div>

      <footer className="w-full py-12 text-center opacity-20 mt-12">
          <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.8em]">End of Transmission • Node {profileId.slice(-8)}</p>
      </footer>
    </div>
  );
};

export default MemberProfile;
