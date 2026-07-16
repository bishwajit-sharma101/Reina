import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useActivityTracker } from '../contexts/ActivityTrackerContext';

export const usePublicFeed = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { trackEvent } = useActivityTracker();

  // Discovery Data for Sidebar
  const [discoveryData] = useState({
    publicRooms: [
      { id: 'g1', name: 'Global Tech', members: 128, active: true },
      { id: 'g2', name: 'Art & Design', members: 45, active: false },
      { id: 'g3', name: 'Neural Research', members: 89, active: true },
    ],
    publicChats: [
      { id: 'c1', user: 'Sato Kenji', topic: 'Modern Architecture', status: 'Live' },
      { id: 'c2', user: 'Elena Rossi', topic: 'Neural Networks', status: 'Active' },
    ]
  });

  const createPost = async (newPostData) => {
    try {
      const token = Cookies.get('token');
      
      const formData = new FormData();
      formData.append('content', newPostData.content);
      if (newPostData.media) {
        formData.append('media', newPostData.media);
      }
      if (newPostData.targetLanguages) {
        newPostData.targetLanguages.forEach(lang => formData.append('targetLanguages', lang));
      }

      trackEvent(`Created a new public post: "${newPostData.content.substring(0, 50)}..."`);
      const res = await axios.post('http://localhost:5000/api/v1/posts', formData, {
        headers: { 
            Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        const p = res.data.post;
        const mappedPost = {
          ...p,
          id: p._id,
          author: { ...p.author, id: p.author._id },
          timestamp: 'Just now',
        };
        setPosts(prev => [mappedPost, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create post", err);
    }
  };

  const addComment = async (postId, commentText) => {
    try {
      const token = Cookies.get('token');
      const res = await axios.post(`http://localhost:5000/api/v1/posts/${postId}/comment`, 
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        trackEvent(`Commented on a post: "${commentText.substring(0, 30)}..."`);
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return { 
              ...post, 
              comments: (post.comments || 0) + 1,
              commentsList: [...(post.commentsList || []), res.data.comment] 
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const token = Cookies.get('token');
      // Optimistic update
      const currentUser = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;
      if (!currentUser) return;
      const currentUserId = currentUser.id || currentUser._id;

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likedBy?.includes(currentUserId);
          if (!isLiked) {
            trackEvent(`Liked a post. Post ID: ${postId}`);
          } else {
            trackEvent(`Unliked a post. Post ID: ${postId}`);
          }
          const newLikedBy = isLiked 
            ? (post.likedBy || []).filter(id => id !== currentUserId)
            : [...(post.likedBy || []), currentUserId];
          return {
             ...post,
             likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
             likedBy: newLikedBy
          };
        }
        return post;
      }));

      // Background sync
      await axios.post(`http://localhost:5000/api/v1/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to toggle like", err);
      // If error, we might fetchMorePosts() to re-sync, but optimistic UI is enough here
    }
  };

  const fetchMorePosts = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await axios.get('http://localhost:5000/api/v1/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPosts(res.data.posts.map(p => ({
          ...p,
          id: p._id,
          author: { ...p.author, id: p.author._id },
          timestamp: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
    setIsLoading(false);
  };

  const deletePost = async (postId) => {
    try {
      const token = Cookies.get('token');
      const res = await axios.delete(`http://localhost:5000/api/v1/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  useEffect(() => { fetchMorePosts(); }, []);

  return { posts, isLoading, discoveryData, fetchMorePosts, createPost, addComment, deletePost, toggleLike };
};