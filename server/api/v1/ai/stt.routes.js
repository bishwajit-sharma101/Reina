const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("child_process");
const readline = require("readline");

// Temp upload folder for STT
const STT_TMP_DIR = path.join(os.tmpdir(), "astrix_stt");
if (!fs.existsSync(STT_TMP_DIR)) {
    fs.mkdirSync(STT_TMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, STT_TMP_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ".webm";
        const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cb(null, `stt_${unique}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// ─── PERSISTENT GPU WHISPER WORKER MANAGER ───
let pythonProcess = null;
let rl = null;
let isReady = false;
const queue = [];
let isProcessing = false;

function initWhisperWorker() {
    if (pythonProcess) return;

    const scriptPath = path.join(__dirname, "../../../scripts/whisper_worker.py");
    console.log("🚀 [Whisper STT] Launching persistent GPU Whisper worker...");

    pythonProcess = spawn("python", [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, PYTHONIOENCODING: "utf-8" }
    });

    rl = readline.createInterface({
        input: pythonProcess.stdout,
        terminal: false
    });

    rl.on("line", (line) => {
        line = line.trim();
        if (!line) return;

        try {
            const data = JSON.parse(line);
            if (data.ready !== undefined) {
                if (data.ready) {
                    isReady = true;
                    console.log("✅ [Whisper STT] Persistent GPU Whisper worker is READY in VRAM!");
                    processNextQueueItem();
                } else {
                    console.error("❌ [Whisper STT] Worker init failed:", data.error);
                }
                return;
            }

            // Current processing task callback
            if (queue.length > 0) {
                const currentTask = queue.shift();
                currentTask.resolve(data);
            }
        } catch (e) {
            console.error("❌ [Whisper STT] JSON parse error from worker output:", line, e);
            if (queue.length > 0) {
                const currentTask = queue.shift();
                currentTask.reject(e);
            }
        } finally {
            isProcessing = false;
            processNextQueueItem();
        }
    });

    pythonProcess.stderr.on("data", (chunk) => {
        const msg = chunk.toString();
        // Ignore standard huggingface symlink warnings
        if (!msg.includes("UserWarning") && !msg.includes("symlinks")) {
            console.warn(`⚠️ [Whisper STT PyStderr] ${msg}`);
        }
    });

    pythonProcess.on("exit", (code) => {
        console.warn(`⚠️ [Whisper STT] Worker exited with code ${code}. Restarting...`);
        pythonProcess = null;
        isReady = false;
        rl = null;
        setTimeout(initWhisperWorker, 2000);
    });
}

function processNextQueueItem() {
    if (isProcessing || queue.length === 0 || !isReady || !pythonProcess) return;

    isProcessing = true;
    const task = queue[0];
    try {
        const payload = JSON.stringify({ path: task.filePath }) + "\n";
        pythonProcess.stdin.write(payload);
    } catch (err) {
        isProcessing = false;
        queue.shift();
        task.reject(err);
        processNextQueueItem();
    }
}

function transcribeAudioFile(filePath) {
    return new Promise((resolve, reject) => {
        queue.push({ filePath, resolve, reject });
        if (!pythonProcess) {
            initWhisperWorker();
        } else {
            processNextQueueItem();
        }
    });
}

// Start worker immediately on server startup
initWhisperWorker();

// Transcribe endpoint
router.post("/", upload.single("audio"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded", text: "" });
    }

    const filePath = req.file.path;
    console.log(`🎙️ [Whisper STT] Request received: ${req.file.filename} (${req.file.size} bytes)`);

    try {
        const startTime = Date.now();
        const result = await transcribeAudioFile(filePath);
        const duration = Date.now() - startTime;

        // Clean up temp audio file
        fs.unlink(filePath, (err) => {
            if (err) console.warn("Failed to delete temp file:", err.message);
        });

        console.log(`⚡ [Whisper STT Result] "${result.text}" (Lang: ${result.language || 'auto'}, Time: ${duration}ms)`);
        return res.json({
            text: result.text || "",
            language: result.language,
            durationMs: duration,
            success: result.success
        });
    } catch (err) {
        fs.unlink(filePath, () => {});
        console.error("❌ [Whisper STT] Processing error:", err);
        return res.status(500).json({ error: "Transcription failed", text: "" });
    }
});

module.exports = router;
