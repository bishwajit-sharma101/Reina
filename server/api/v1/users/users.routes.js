const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../../../modules/auth/auth.middleware");
const { 
  getAllUsers, 
  blockUser, 
  unblockUser, 
  deleteAccount, 
  updateProfile, 
  getPublicProfile, 
  uploadAvatar 
} = require("./users.controller");

// Ensure uploads directory exists (same dir as app.js uses)
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer Config for Avatars
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for avatars
});

// Routes
router.get("/", protect, getAllUsers);
router.post("/block", protect, blockUser);
router.post("/unblock", protect, unblockUser);
router.delete("/delete", protect, deleteAccount);
router.put("/profile", protect, updateProfile);

// NEW: Avatar Upload (must be BEFORE /:id to avoid route conflict)
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

router.get("/:id", protect, getPublicProfile);

module.exports = router;