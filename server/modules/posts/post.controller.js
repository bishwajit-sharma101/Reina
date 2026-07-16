const Post = require('./models/post.model');
const User = require('../user-management/models/user.model');
const { GoogleGenAI } = require("@google/genai");
const { TRANSLATION_SYSTEM_PROMPT } = require("../../utils/geminiPrompt");
const xss = require('xss'); // ⚡ FIX: Added for security

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar isOnline email')
      .populate('commentsList.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'name avatar isOnline email')
      .populate('commentsList.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user posts" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, targetLanguages } = req.body;
    let { mediaUrl, mediaType } = req.body;
    const authorId = req.user._id;
    const cleanContent = xss(content || "");

    // Handle File Upload from Multer
    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      mediaUrl = `${req.protocol}://${req.get("host")}${relativePath}`;
      
      // Auto-detect type
      if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
      else if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
      else mediaType = 'file';
    }

    const post = new Post({
      author: authorId,
      content: { original: cleanContent, translations: {} },
      targetLanguages: targetLanguages ? (Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages]) : [],
      mediaUrl,
      mediaType: mediaType || 'text',
      originLanguage: 'en'
    });

    // Save immediately and return response to user (Non-blocking)
    await post.save();
    const populatedPost = await post.populate('author', 'name avatar isOnline');
    res.status(201).json({ success: true, post: populatedPost });

    // ⚡ FIX: Offload translation to background (Resilience & Scalability)
    if (post.targetLanguages && post.targetLanguages.length > 0 && cleanContent) {
        setImmediate(async () => {
            const promises = post.targetLanguages.map(async (lang) => {
                try {
                    const response = await ai.models.generateContent({
                        model: "gemini-2.0-flash",
                        systemInstruction: TRANSLATION_SYSTEM_PROMPT,
                        contents: [{ role: "user", parts: [{ text: `Translate this: "${cleanContent}" to ${lang}` }] }],
                        generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 1024 }
                    });
                    const translatedText = response.text?.trim();
                    if (translatedText) {
                        await Post.findByIdAndUpdate(post._id, {
                            $set: { [`content.translations.${lang}`]: translatedText }
                        });
                    }
                } catch (err) {
                    console.warn(`Background translation failed for ${lang}. Error:`, err.message);
                }
            });
            await Promise.all(promises);
            console.log(`🌙 Background translation completed for post ${post._id}`);
        });
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, error: "Failed to create post" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Check if the user attempting to delete is the author of the post
    if (post.author.toString() !== req.user.id) {
       return res.status(401).json({ success: false, error: "User not authorized to delete this post" });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, error: "Failed to delete post" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const userId = req.user.id;
    const isLiked = post.likedBy.includes(userId);
    
    if (isLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }
    
    await post.save();
    res.status(200).json({ success: true, likes: post.likes, likedBy: post.likedBy });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, error: "Failed to toggle like" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const currentUser = await User.findById(req.user.id);

    const newComment = {
      user: req.user.id,
      text: xss(text || ""), // ⚡ FIX: Sanitize comments
      time: new Date()
    };
    
    post.commentsList.push(newComment);
    post.comments += 1;
    await post.save();
    
    res.status(200).json({ 
      success: true, 
      comment: {
        id: post.commentsList[post.commentsList.length - 1]._id,
        user: currentUser.name,
        avatar: currentUser.avatar,
        text,
        time: 'Just now'
      }
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: "Failed to add comment" });
  }
};
