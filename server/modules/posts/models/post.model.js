const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  time: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    original: { type: String, required: true },
    translations: {
      type: Map,
      of: String,
      default: {}
    }
  },
  targetLanguages: [{ type: String }],
  mediaUrl: String,
  mediaType: { type: String, enum: ['image', 'video', 'text', 'file'], default: 'text' },
  originLanguage: { type: String, default: 'en' },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: Number, default: 0 },
  commentsList: [commentSchema]
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });


const Post = mongoose.model("Post", postSchema);
module.exports = Post;
