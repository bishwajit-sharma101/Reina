const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // 1. ADDED: Required for ID validation
const Message = require("../../../modules/chat/models/message.model"); 

// 2. CHANGED: Changed from "/local" to "/" so it matches your mount point in ai.routes.js
router.post("/local", async (req, res) => {
  const { text, target_lang, messageId } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    // 1. TALK TO YOUR LOCAL MODEL
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "ash-translate", 
        prompt: `Translate the following text to ${target_lang}. Output ONLY the translated text, no explanations: "${text}"`,
        stream: false,
      }),
    });

    const data = await response.json();
    const translatedText = data.response?.trim();

    if (!translatedText) throw new Error("Empty local model response");

    // 2. THE CACHE LOGIC
    if (messageId && translatedText) {
      // 3. THE FIX: Only attempt DB update if the messageId is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(messageId)) {
        try {
          await Message.findByIdAndUpdate(
            messageId,
            { $set: { [`content.translations.${target_lang}`]: translatedText } }
          );
          console.log(`🏠 Local Cache [${target_lang}] for message: ${messageId}`);
        } catch (dbErr) {
          console.error("❌ Local Cache failed:", dbErr.message);
        }
      } else {
        // This is where those temporary "176932..." timestamp IDs will go
        console.log(`⏳ Skipping cache: ${messageId} is a temporary frontend ID.`);
      }
    }

    res.json({ success: true, translation: translatedText });

  } catch (err) {
    console.error("❌ Local AI error:", err.message);
    res.status(500).json({ success: false, error: "Local translation failed" });
  }
});

module.exports = router;