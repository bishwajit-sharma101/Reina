const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../../../modules/chat/models/message.model");

router.post("/", async (req, res) => {
  const { text, target_lang, messageId, context } = req.body;
  
  // 1. Initial Receipt Log
  console.log(`[ashTranslator] 📥 NEW REQUEST: text="${text?.substring(0, 20)}...", lang=${target_lang}, msgId=${messageId}`);

  if (!text || !target_lang) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    // --- Format Context for Prompt ---
    const historyText = context && context.length > 0 
      ? context.map(c => `[${c.role}]: "${c.text}"`).join("\n")
      : "No prior conversation history.";

    console.log(`[ashTranslator] 🚀 Calling Ollama with Context (${context?.length || 0} msgs)...`);
    
    // Explicitly using 127.0.0.1 to avoid localhost IPv6 issues
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "ashTranslator", 
        prompt: `You are a professional translator. Use the conversation history below to understand the intent and tone.
        
Conversation History:
${historyText}

Now, translate this new message to ${target_lang}. Provide ONLY the translated text: 
"${text}"`,
        stream: false,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    const translatedText = data.response?.trim();

    console.log(`[ashTranslator] ✅ SUCCESS in ${endTime - startTime}ms. Trans: "${translatedText?.substring(0, 20)}..."`);

    if (!translatedText) throw new Error("Empty response from Ollama model");

    // Cache logic
    if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
        try {
          await Message.findByIdAndUpdate(
            messageId,
            { $set: { [`content.translations.${target_lang}`]: translatedText } }
          );
        } catch (dbErr) {
          console.error(`[ashTranslator] ❌ DB Cache failed: ${dbErr.message}`);
        }
    }

    res.json({ success: true, translation: translatedText });

  } catch (err) {
    const errorMsg = err.name === 'AbortError' ? 'Ollama request timed out after 60s' : err.message;
    console.error(`[ashTranslator] ❌ FAILED: ${errorMsg}`);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

module.exports = router;
