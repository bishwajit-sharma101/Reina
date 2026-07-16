const express = require("express");
const router = express.Router();
const { protect } = require("../../modules/auth/auth.middleware"); // CHANGED: Import
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists (same dir as app.js uses)
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-media-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

const { saveMessage, getChatHistory, cacheTranslation,deleteMessage,clearChat,markMessagesAsRead, uploadMedia } = require("./message.controller");

// CHANGED: Added 'protect' middleware to all routes
router.post("/save", protect, saveMessage);
router.get("/history/:userId", protect, getChatHistory);
router.post("/cache_translation", protect, cacheTranslation);

router.delete("/:messageId", protect, deleteMessage);
router.post("/clear", protect, clearChat);
router.post("/read", protect, markMessagesAsRead);

// NEW: Upload attachments via HTTP
router.post("/upload", protect, upload.single("media"), uploadMedia);

module.exports = router;