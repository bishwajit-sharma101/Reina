const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // String representation YYYY-MM-DD
    required: true,
  },
  persona: {
    type: String,
    default: 'detective'
  },
  summaryText: {
    type: String,
    default: "No observations yet today.",
  },
  eventLog: [{
    time: Date,
    event: String
  }],
  trackedEventsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure unique entry per user per day
diarySchema.index({ user: 1, date: 1 }, { unique: true });

const Diary = mongoose.model('Diary', diarySchema);

module.exports = Diary;
