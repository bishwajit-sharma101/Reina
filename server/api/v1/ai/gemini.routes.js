const express = require("express");
const router = express.Router();
const { aiQueue, aiQueueEvents } = require("./aiQueue");

router.post("/", async (req, res) => {
  const { text, target_lang, messageId, context } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({ success: false, error: "text and target_lang are required" });
  }

  try {
    // Enqueue the job for the worker (Concurrency limit 5)
    console.log(`[HTTP] Enqueueing AI request to BullMQ: ${target_lang}`);
    const job = await aiQueue.add('translate', { text, target_lang, messageId, context });
    
    // Wait for the background worker to finish it gracefully
    const translatedText = await job.waitUntilFinished(aiQueueEvents, 25000);

    res.json({ success: true, translation: translatedText });
  } catch (err) {
    console.error("❌ BullMQ Gemini Timeout / Error:", err.message);
    res.status(500).json({ success: false, error: "AI Processing Queue Failed or Timed out" });
  }
});

module.exports = router;