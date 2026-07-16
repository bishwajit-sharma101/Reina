import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, Globe, X } from 'lucide-react';
import Cookies from 'js-cookie';

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'hi', label: 'Hindi' }
];

const PostComposer = ({ onPost }) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetLangs, setTargetLangs] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const currentUser = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;
  const userAvatar = currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsExpanded(true);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    onPost({ 
      content, 
      media: selectedFile,
      targetLanguages: targetLangs
    });

    setContent('');
    clearFile();
    setTargetLangs([]);
    setIsExpanded(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-10">
      <motion.div 
        layout
        className={`bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${isExpanded ? 'ring-2 ring-purple-500/40 bg-zinc-900/90' : 'hover:border-purple-500/30'}`}
      >
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
               <img src={userAvatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" alt="Avatar" />
            </div>
            <div className="flex-1 pt-1.5">
              <textarea
                placeholder="What's going on in the neural network today?"
                className="w-full bg-transparent text-white placeholder-zinc-500 font-medium tracking-wide resize-none focus:outline-none min-h-[40px] leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                rows={isExpanded ? 3 : 1}
              />
            </div>
          </div>

          <AnimatePresence>
            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mt-3 rounded-xl overflow-hidden w-fit max-h-60 ml-14"
              >
                <img src={previewUrl} alt="Preview" className="h-full max-h-60 rounded-xl object-contain border border-white/10" />
                <button type="button" onClick={clearFile} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 ml-14"
              >
                <div className="flex gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,video/*"
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white border border-white/5">
                    <ImageIcon size={18} />
                  </button>
                  <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1.5 px-3 rounded-full border border-white/5">
                    <Globe size={11} className="text-zinc-500" />
                    {AVAILABLE_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setTargetLangs(prev => prev.includes(lang.code) ? prev.filter(l => l !== lang.code) : [...prev, lang.code])}
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all duration-300 ${targetLangs.includes(lang.code) ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                        >
                          {lang.code}
                        </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!content.trim() && !selectedFile}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-full font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-colors"
                >
                  <span>Post</span>
                  <Send size={15} className="mr-[-2px]" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
};

export default PostComposer;