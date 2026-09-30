const express = require("express");
const router = express.Router();

// Osana (Tsundere girl by Li Chan) model ID on Fish Audio
const DEFAULT_OSANA_MODEL_ID = "458ed5679faf49e9ac8417533deb2a2b";
// Fish Audio Free Tier Fair Use model ($0 cost)
const DEFAULT_TTS_MODEL = "s2.1-pro-free";

router.post("/tts", async (req, res) => {
    try {
        const { text, reference_id, model } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: "Text is required" });
        }

        const apiKey = (process.env.REINA_FISH_VOICE || process.env.FISH_AUDIO_API_KEY || "").trim();
        if (!apiKey) {
            console.error("❌ [Fish Audio] Missing REINA_FISH_VOICE API key in .env");
            return res.status(500).json({ success: false, error: "REINA_FISH_VOICE is not configured in .env" });
        }

        const voiceId = reference_id || process.env.REINA_FISH_VOICE_ID || DEFAULT_OSANA_MODEL_ID;
        const ttsModel = model || process.env.FISH_AUDIO_MODEL || DEFAULT_TTS_MODEL;

        console.log(`🐟 [Fish Audio TTS] Synthesizing: "${text.substring(0, 30)}..." | Voice: ${voiceId} | Model: ${ttsModel}`);

        const response = await fetch("https://api.fish.audio/v1/tts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "model": ttsModel
            },
            body: JSON.stringify({
                text: text,
                reference_id: voiceId,
                model: ttsModel,
                format: "mp3",
                latency: "normal"
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn(`⚠️ [Fish Audio] API Error ${response.status}: ${errText}`);
            return res.status(response.status).json({ 
                success: false, 
                error: errText,
                status: response.status 
            });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save audio to disk
        const fs = require('fs');
        const path = require('path');
        const audioDir = path.join(__dirname, '../../../saved_audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Clean text for filename (max 20 chars, alphanumeric)
        const cleanText = text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const filename = `reina_${Date.now()}_${cleanText}.mp3`;
        const filePath = path.join(audioDir, filename);
        
        fs.writeFileSync(filePath, buffer);
        console.log(`💾 [Fish Audio] Saved audio to: ${filePath}`);

        res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": buffer.length,
            "Cache-Control": "no-cache",
            "Cross-Origin-Resource-Policy": "cross-origin"
        });

        res.send(buffer);
    } catch (error) {
        console.error("❌ [Fish Audio] Server Error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

router.get("/stream-tts", async (req, res) => {
    try {
        const { text, reference_id, model } = req.query;
        if (!text) return res.status(400).send("Text is required");

        const apiKey = (process.env.REINA_FISH_VOICE || process.env.FISH_AUDIO_API_KEY || "").trim();
        if (!apiKey) return res.status(500).send("REINA_FISH_VOICE is not configured");

        const voiceId = reference_id || process.env.REINA_FISH_VOICE_ID || DEFAULT_OSANA_MODEL_ID;
        const ttsModel = model || process.env.FISH_AUDIO_MODEL || DEFAULT_TTS_MODEL;

        const response = await fetch("https://api.fish.audio/v1/tts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "model": ttsModel
            },
            body: JSON.stringify({
                text: text,
                reference_id: voiceId,
                model: ttsModel,
                format: "mp3"
            })
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).send(err);
        }

        res.set({
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache",
            "Cross-Origin-Resource-Policy": "cross-origin"
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
        console.error("❌ [Fish Audio] Stream Error:", error.message);
        if (!res.headersSent) res.status(500).send(error.message);
    }
});

module.exports = router;
