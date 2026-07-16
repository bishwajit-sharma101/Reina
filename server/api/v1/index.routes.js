const express = require('express');
const router = express.Router();

const authRoutes = require('../../modules/auth/auth.routes');
const chatRoutes = require('../../modules/chat/message.routes');
const aiRoutes = require('./ai/ai.routes');
const userRoutes = require('./users/users.routes');
const reportRoutes = require('./report/report.routes'); // NEW
const postRoutes = require('../../modules/posts/post.routes'); // NEW Posts
const diaryRoutes = require('../../modules/diary/diary.routes'); // Observer Diary

router.use('/auth', authRoutes);
router.use('/messages', chatRoutes); // Or however you mounted chat
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes); // NEW
router.use('/posts', postRoutes); // NEW Posts
router.use('/diary', diaryRoutes); // Observer Diary

module.exports = router;
