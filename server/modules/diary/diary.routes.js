const express = require('express');
const router = express.Router();
const diaryController = require('./diary.controller');
const { protect } = require('../auth/auth.middleware');

router.use(protect);

router.get('/settings', diaryController.getSettings);
router.post('/settings', diaryController.updateSettings);

router.get('/today', diaryController.getTodayDiary);
router.get('/history', diaryController.getDiaryHistory);

router.post('/update', diaryController.processDiaryEvents);

module.exports = router;
