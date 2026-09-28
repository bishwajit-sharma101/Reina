const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { protect } = require("../../../modules/auth/auth.middleware");
const { limiter } = require("../../../middlewares/rateLimit.middleware");

// temp folder
const TMP_DIR = path.join(os.tmpdir(), "astrix_audio");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const uniq = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    cb(null, `raw_${uniq}${path.extname(file.originalname) || ".webm"}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
     if (file.mimetype.startsWith('audio/')) cb(null, true);
     else cb(new Error('Only audio files allowed'), false);
  }
});

// Upload raw audio
router.post("/upload_audio", limiter, upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  return res.json({ filename: req.file.filename });
});

// Serve raw
router.get("/raw/:filename", (req, res) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  
  // ⚡ FIX 3: Stream-based response (Better for memory)
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);

  // Optional: Delete after sending (Aggressive Cleanup)
  // Uncomment this if you want truly ephemeral storage
  /*
  readStream.on('end', () => {
      fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
      });
  });
  */
});

// Import specific routes
const geminiRoutes = require("./gemini.routes");
const localRoutes = require("./local_translation.routes");
const coachRoutes = require("./coach.routes");
const karmaRoutes = require("./karma.routes");
const dolphinRoutes = require("./dolphin.routes");
const voicevoxRoutes = require("./voicevox.routes");
const queen3Routes = require("./queen3.routes");
const reinaGeminiRoutes = require("./reina-gemini.routes");
const reinaHackerRoutes = require("./reina-hacker.routes");
const reinaComRoutes = require("./reina-com.routes");
const ashTranslatorRoutes = require("./ashTranslator.routes");
const auraRoutes = require("./aura.routes");
const kiraRoutes = require("./kira.routes");
const twoD = require("./2d.routes");
const sttRoutes = require("./stt.routes");

// Apply middleware
router.use("/translate_text/ash", limiter, ashTranslatorRoutes);
router.use("/translate_text", limiter, geminiRoutes);
router.use("/translate_text", limiter, localRoutes);
router.use("/analyze-chat", limiter, coachRoutes);
router.use("/karma", limiter, karmaRoutes);
router.use("/dolphin", limiter, dolphinRoutes);
router.use("/voicevox", limiter, voicevoxRoutes);
router.use("/stt", sttRoutes);
router.use("/queen3", queen3Routes);
router.use("/reina-gemini", reinaGeminiRoutes);
router.use("/reina-hacker", limiter, reinaHackerRoutes);
router.use("/reina-com", limiter, reinaComRoutes);
router.use("/ash", ashTranslatorRoutes);
router.use("/aura", auraRoutes);
router.use("/kira", limiter, kiraRoutes);
router.use("/2d", limiter, twoD);

module.exports = router;