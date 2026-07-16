const mongoose = require('mongoose');

const diarySettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  persona: {
    type: String,
    default: 'detective'
  },
  cycleMinutes: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

const DiarySettings = mongoose.model('DiarySettings', diarySettingsSchema);

module.exports = DiarySettings;
