import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, X } from 'lucide-react';
import PostComposer from './PostComposer';
import PublicPost from './PublicPost';
import Loader from '../common/Loader';

const PublicFeed = ({ posts, isLoading, onCreatePost, onDeletePost, onToggleLike, onStartChat, onOpenComments, onViewProfile }) => { 
  const scrollRef = useRef(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleStartChat = (userId, contextTopic) => {
    if (onStartChat) {
      onStartChat(userId, `Regarding your post: ${contextTopic}`);
    }
  };

  const handlePost = (data) => {
      onCreatePost(data);
      setIsComposerOpen(false);
  };

  return (
    <div className="h-full flex-1 flex flex-col relative bg-black/90 overflow-hidden" ref={scrollRef}>
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="p-6 border-b border-white/5 relative z-10 backdrop-blur-sm bg-black/20 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Public Signal</h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">Global neural network feed</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          
          <div className="space-y-4 pb-32">
            {posts.map((post) => (
              <PublicPost 
                key={post.id} 
                post={post} 
                onDelete={onDeletePost}
                onLike={() => onToggleLike(post.id)}
                onStartChat={() => handleStartChat(post.author.id, post.content.original)} 
                onOpenComments={() => onOpenComments(post)}
                onViewProfile={onViewProfile}
              />
            ))}

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader size={40} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button - Pinned to Bottom Right */}
      <button 
        onClick={() => setIsComposerOpen(true)} 
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-500 hover:bg-brand-400 text-white rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-90 z-50 group"
      >
          <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Profile Shortcut */}
      <button 
        onClick={onViewProfile} 
        className="fixed bottom-8 right-28 w-14 h-14 bg-zinc-900/80 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg z-50 hover:bg-zinc-800"
      >
          <User size={24} />
      </button>

      {/* Composer Modal Overlays */}
      <AnimatePresence>
          {isComposerOpen && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto custom-scrollbar"
              >
                   <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="w-full max-w-2xl relative mt-auto mb-auto"
                   >
                        <button onClick={() => setIsComposerOpen(false)} className="absolute -top-12 right-0 p-2 text-white bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md">
                           <X size={20} />
                        </button>
                        <PostComposer onPost={handlePost} />
                   </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default PublicFeed;






























