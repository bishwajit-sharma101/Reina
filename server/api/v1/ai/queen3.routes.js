const express = require("express");
const router = express.Router();

/**
 * Queen3 TTS Proxy (POST)
 * Used for standard API calls.
 */
router.post("/tts", async (req, res) => {
    try {
        const { text, voice } = req.body;
        if (!text) return res.status(400).json({ success: false, error: "Text is required" });

        const DEFAULT_VOICE = "A high-pitched, youthful Japanese anime girl voice. Sharp and expressive.";
        const voiceDescription = voice || DEFAULT_VOICE;

        console.log(`[QUEEN3-POST] Synthesizing: ${text.substring(0, 30)}...`);

        // ✅ FIX: Allow cross-origin media loading 
        res.set({
            "Cross-Origin-Resource-Policy": "cross-origin",
            "x-no-compression": "true" 
        });

        const response = await fetch("http://127.0.0.1:8000/v1/audio/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                input: text,
                voice: voiceDescription
            })
        });

        if (!response.ok) throw new Error(`TTS server error: ${response.status}`);

        res.set({
            "Content-Type": "audio/wav",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const canContinue = res.write(Buffer.from(value));
            if (!canContinue) await new Promise(resolve => res.once("drain", resolve));
        }
        res.end();
    } catch (error) {
        console.error("❌ QUEEN3-POST Error:", error.message);
        if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Natural Streaming Route (GET)
 * Used by browser's native <audio> tag for instant, reliable playback.
 * ⚠️ Note: 'protect' removed because <audio> tags do not send Authorization headers.
 */
router.get("/stream-tts", async (req, res) => {
    try {
        const { text, voice } = req.query;
        if (!text) return res.status(400).send("Text is required");

        const DEFAULT_VOICE = "A high-pitched, youthful Japanese anime girl voice. Sharp and expressive.";
        const voiceDescription = voice || DEFAULT_VOICE;

        console.log(`[QUEEN3-GET] Streaming: ${text.substring(0, 30)}...`);

        // ✅ FIX: Allow cross-origin media loading 
        res.set({
            "Cross-Origin-Resource-Policy": "cross-origin",
            "x-no-compression": "true"
        });

        const response = await fetch("http://127.0.0.1:8000/v1/audio/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                input: text,
                voice: voiceDescription
            })
        });

        if (!response.ok) throw new Error(`TTS server error: ${response.status}`);

        res.set({
            "Content-Type": "audio/wav",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const canContinue = res.write(Buffer.from(value));
            if (!canContinue) await new Promise(resolve => res.once("drain", resolve));
        }
        res.end();
    } catch (error) {
        console.error("❌ QUEEN3-GET Error:", error.message);
        if (!res.headersSent) res.status(500).send(error.message);
    }
});

module.exports = router;
