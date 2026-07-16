import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, MoreHorizontal, Zap, Play, Trash2 } from 'lucide-react';
import Cookies from 'js-cookie';

const PublicPost = ({ post, onStartChat, onOpenComments, onDelete, onLike, onViewProfile }) => {
  const currentUser = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;
  const preferredLang = currentUser?.preferredLanguage || 'en';

  const currentUserId = currentUser && (currentUser.id || currentUser._id);
  const isAuthor = String(currentUserId) === String(post.author.id || post.author._id);
  const isLiked = post.likedBy?.includes(currentUserId);

  let displayContent = post.content?.original || '';
  let showTranslationTag = false;

  const translations = post.content?.translations || {};
  if (translations[preferredLang] || translations.get?.(preferredLang)) {
    displayContent = translations[preferredLang] || translations.get(preferredLang);
    showTranslationTag = true;
  } else if (post.content?.translated && preferredLang !== post.originLanguage) {
     displayContent = post.content.translated;
     showTranslationTag = true;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-8 mb-8 border-b border-white/5 transition-colors group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div 
          onClick={() => onViewProfile && onViewProfile(post.author.id || post.author._id)}
          className="flex gap-4 items-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="relative flex-shrink-0 w-11 h-11">
            <img 
              src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`} 
              className="w-full h-full rounded-full object-cover ring-1 ring-white/10"
              alt="avatar"
            />
            {post.author.isOnline && <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#050508] rounded-full" />}
          </div>
          <div>
            <h3 className="text-white font-bold text-[15px]">{post.author.name}</h3>
            <p className="text-zinc-600 text-[11px] font-medium tracking-tight mt-0.5">
              {post.timestamp} • {post.originLanguage}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
             {isAuthor && onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} 
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Post"
                >
                    <Trash2 size={18} />
                </button>
             )}
            <button className="p-2 text-zinc-600 hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-5 space-y-4">
        <p className="text-[17px] leading-relaxed text-zinc-100 font-normal">
          {displayContent}
        </p>

        {showTranslationTag && (
          <div className="pl-4 border-l border-brand-500/20">
            <p className="text-zinc-500 text-[13px] font-normal leading-relaxed italic opacity-80">Original: "{post.content.original}"</p>
          </div>
        )}

        {post.mediaType === 'image' && (
          <div className="relative rounded-xl overflow-hidden border border-white/5 bg-[#020205] aspect-[16/10] group/media shadow-2xl">
            <img 
              src={post.mediaUrl} 
              alt="post media" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover/media:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-500" />
          </div>
        )}

        {post.mediaType === 'video' && (
          <div className="relative rounded-xl overflow-hidden border border-white/5 bg-black aspect-[16/10] flex items-center justify-center group/media shadow-2xl">
            <video src={post.mediaUrl} className="w-full h-full object-cover" controls muted />
            <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-full backdrop-blur-md opacity-0 group-hover/media:opacity-100 transition-all duration-300">
              <Play size={16} className="text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-8">
          <button 
            onClick={(e) => { e.stopPropagation(); if (onLike) onLike(); }} 
            className={`flex items-center gap-2 group/action transition-all ${isLiked ? 'text-pink-500 scale-110' : 'text-zinc-500 hover:text-pink-400'}`}
          >
            <div className="p-2 rounded-full group-hover/action:bg-pink-500/10 transition-colors">
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </div>
            <span className="text-sm font-medium">{post.likes || 0}</span>
          </button>
          
          <button 
            onClick={onOpenComments}
            className="flex items-center gap-2 group/action text-zinc-500 hover:text-blue-400 transition-all"
          >
            <div className="p-2 rounded-full group-hover/action:bg-blue-500/10 transition-colors">
              <MessageCircle size={20} />
            </div>
            <span className="text-sm font-medium">{post.comments}</span>
          </button>
        </div>

        <button 
          onClick={() => onStartChat(post.author.id || post.author._id, post.content.original)}
          className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-brand-500/5 border border-white/10 hover:border-brand-500/40 rounded-xl text-xs font-bold text-zinc-400 hover:text-brand-300 transition-all active:scale-95"
        >
          <Zap size={14} className={isLiked ? "fill-brand-400" : "fill-none"} />
          <span>Neural Link</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PublicPost;