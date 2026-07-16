const express = require("express");
const router = express.Router();

/**
 * VOICEVOX TTS Proxy (Zundamon Map)
 * Normal: 3
 * Sweet: 1
 * Tsundere: 7
 * Sexy: 5
 * Whisper: 22
 * Secret Whisper: 38
 * Weak: 75
 * Crying: 76
 */
router.post("/tts", async (req, res) => {
    try {
        const { text, speakerId = 3 } = req.body;
        if (!text) return res.status(400).json({ success: false, error: "Text is required" });

        console.log(`[VOICEVOX] Synthesizing text with speakerId ${speakerId}`);

        // 1. Create Audio Query
        const queryUrl = `http://localhost:50021/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`;
        const queryRes = await fetch(queryUrl, { method: "POST" });
        
        if (!queryRes.ok) {
            const errBody = await queryRes.text();
            throw new Error(`VoiceVox audio_query failed: ${errBody}`);
        }
        const queryJson = await queryRes.json();

        // 2. Synthesize Audio
        const synthesisUrl = `http://localhost:50021/synthesis?speaker=${speakerId}`;
        const synthesisRes = await fetch(synthesisUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(queryJson)
        });

        if (!synthesisRes.ok) {
            const errBody = await synthesisRes.text();
            throw new Error(`VoiceVox synthesis failed: ${errBody}`);
        }

        // Return the binary audio data (WAV)
        const arrayBuffer = await synthesisRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.set({
            "Content-Type": "audio/wav",
            "Content-Length": buffer.length
        });
        res.send(buffer);

    } catch (error) {
        console.error("❌ VOICEVOX Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
