const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const postController = require('./post.controller');
const { protect } = require('../auth/auth.middleware');

// Ensure uploads directory exists (same dir as app.js uses)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer Config for Post Media
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'post-media-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB for video support
});

router.route('/')
  .get(protect, postController.getPosts)
  .post(protect, upload.single('media'), postController.createPost);

router.route('/user/:userId')
  .get(protect, postController.getUserPosts);

router.route('/:postId')
  .delete(protect, postController.deletePost);

router.post('/:postId/like', protect, postController.toggleLike);
router.post('/:postId/comment', protect, postController.addComment);

module.exports = router;
