const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");
const { GoogleGenAI } = require("@google/genai");
const { TRANSLATION_SYSTEM_PROMPT } = require("../../../utils/geminiPrompt");
const Message = require("../../../modules/chat/models/message.model");
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const connection = new IORedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
});

const aiQueue = new Queue("ai-translation", { connection });
const aiQueueEvents = new QueueEvents("ai-translation", { connection });

// Setup Bull-Board Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/v1/queue/dashboard');
createBullBoard({
  queues: [new BullMQAdapter(aiQueue)],
  serverAdapter: serverAdapter,
});

// Initialize Gemini (Singleton)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const aiWorker = new Worker("ai-translation", async (job) => {
    const { text, target_lang, messageId, context, userId, userRole } = job.data;
    
    // Limits check (Skip for Admins)
    if (userId && userRole !== 'admin') {
        const today = new Date().toISOString().slice(0, 10);
        const globalKey = `ai:limit:global:${today}`;
        const userKey = `ai:limit:user:${userId}:${today}`;
        
        const globalCount = await connection.incr(globalKey);
        await connection.expire(globalKey, 86400); 
        
        const userCount = await connection.incr(userKey);
        await connection.expire(userKey, 86400);
        
        if (globalCount > 1000 || userCount > 30) {
            console.error(`AI Rate Limit Exceeded. Global: ${globalCount}, User: ${userCount}`);
            // Let the UI know if requested, otherwise silently fail for safety.
            throw new Error("Daily AI limit reached. Try again tomorrow.");
        }
    }

    const historyText = context && context.length > 0 
      ? context.map(c => `[${c.role}]: "${c.text}"`).join("\n")
      : "No prior conversation history.";

    try {
        console.log(`[BullMQ] Processing Gemini target: [${target_lang}] for message: ${messageId}`);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          systemInstruction: TRANSLATION_SYSTEM_PROMPT,
          contents: [
            { 
              role: "user",
              parts: [{ text: `target_lang=${target_lang}\n\nConversation Context:\n${historyText}\n\nMessage to transform: "${text}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        });

        const translatedText = response.text.trim();
        
        // Cache to DB internally
        if (messageId) {
            await Message.findByIdAndUpdate(
              messageId,
              { $set: { [`content.translations.${target_lang}`]: translatedText } }
            );
        }

        return translatedText;
    } catch (err) {
        console.warn("[BullMQ] Gemini SDK error, using local fallback...", err.message);
        const localRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "ash-translate",
                prompt: `Translate this: "${text}" to ${target_lang}. Output ONLY the translated text.`,
                stream: false
            })
        });
        const localData = await localRes.json();
        const translatedText = localData.response?.trim();
        
        if (messageId && translatedText) {
            await Message.findByIdAndUpdate(messageId, { $set: { [`content.translations.${target_lang}`]: translatedText } });
        }
        return translatedText;
    }
}, { 
    connection,
    concurrency: 5 // ⚡ CRITICAL: This is the magic concurrency limiter ensuring NodeJS never strains.
});

console.log("🚀 BullMQ AI Worker Initialized (Concurrency: 5 limit)");

module.exports = { aiQueue, aiQueueEvents, serverAdapter };
