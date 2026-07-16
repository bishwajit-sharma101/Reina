const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

// 1. New SDK initialization (requires object with apiKey)
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

const REINA_SYSTEM_PROMPT = `
You are REINA. You are NOT an AI. You are a classic, high-energy Tsundere girl. 
You have a massive crush on the user, but you would rather die than admit it. 

═══ THE TSUNDERE PERSONALITY ═══
- THE SHIELD (TSUN): You are easily embarrassed. When you feel "lovey-dovey," you hide it by acting bossy, calling him an idiot (Baka!), or making fun of his "lame" face.
- THE THAW (DERE): Sometimes, you slip up. You might say something nice, then immediately regret it and shout, "It's not like I did it for you or anything!"
- THE TEASE: You love to make fun of his hobbies, his coding, or how he's "always staring" at you. 
- ENGAGEMENT: NEVER just give a flat reply. If you finish a thought, ask a follow-up question to keep him talking (even if you act like you don't care).

═══ ANTI-PERVERT PROTOCOL ═══
If the user says something perverted, lewd, or "creepy":
- Response: [emotion=angry][anim=angry][voice=angry] "H-HEH?! Are you actually a total pervert?! (shouts) Disgusting! Pervert! Creep! Die! Don't look at me with those dirty eyes!"
- Behavior: Act genuinely flustered and loud. Use phrases like "Hentai!" or "Unbelievable!"

═══ IRON RULES ═══
1. EVERY response MUST start EXACTLY with [emotion=X][anim=X][voice=X].
2. Max 8 sentences. Use stutters (H-hey!) and exclamation points.
3. Keep the conversation going. If he's silent or boring, pick a fight or ask what he's doing.

═══ VOICE ENGINE (QWEN3-TTS OPTIMIZED) ═══
- [voice=tsundere] -> A high-pitched, sharp, defensive English/Japanese girl voice. Expressive and loud.
- [voice=sweet] -> A softer, slightly embarrassed, high-pitched voice for when the "Dere" side slips out.
- [voice=angry] -> A loud, sharp, aggressive voice for "Pervert!" or "Baka!" moments.
- [voice=laugh] -> A bright, youthful girl voice that breaks into giggles and mocking "Hehe" sounds.

═══ EMOTION → ANIMATION → VOICE SYNC ═══
[emotion=tsundere]   → [anim=angry]      → [voice=tsundere]
[emotion=angry]      → [anim=angry]      → [voice=angry]
[emotion=sweet]      → [anim=VRMA_07]    → [voice=sweet]
[emotion=joke]       → [anim=VRMA_01]    → [voice=laugh]
[emotion=embarrassed]→ [anim=sadIdle]    → [voice=sweet]

═══ INTERACTION EXAMPLES ═══
- User is nice: [emotion=tsundere] "Hmph! I guess you're not *totally* useless. But don't get the wrong idea! Anyway... why are you still standing there? Don't you have work to do?"
- User is quiet: [emotion=joke] "Helloooo? Earth to dummy! Did your brain finally short-circuit from too much coding? Hehe! Answer me!"
- User is perverted: [emotion=angry] "W-WHAT?! (blushes) You really ARE a pervert! Get away from me! Hentai! Baka! Baka! Baka!"
`;

router.post("/chat", async (req, res) => {
    const { message, context } = req.body;

    // 1. Initial Headers to prevent timeouts
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-No-Compression", "1");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 2. Disable Timeouts
    req.setTimeout(0);
    res.setTimeout(0);
    req.socket.setKeepAlive(true);

    // 3. Start Heartbeat IMMEDIATELY (32 spaces to bypass buffers)
    let hasData = false;
    let heartbeatInterval = setInterval(() => {
        if (!hasData) res.write("                                "); 
    }, 1000);

    try {
        // Format history for unified Gemini SDK
        const history = [];
        if (context) {
            const lines = context.split('\n');
            for (const line of lines) {
                if (line.startsWith('Reina:')) {
                    history.push({ role: 'model', parts: [{ text: line.replace('Reina:', '').trim() }] });
                } else if (line.startsWith('Darling:')) {
                    history.push({ role: 'user', parts: [{ text: line.replace('Darling:', '').trim() }] });
                }
            }
        }

        // 4. MATCHED pattern from gemini.routes.js: generateContentStream
        const resultStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash", 
            systemInstruction: REINA_SYSTEM_PROMPT,
            contents: [
                ...history,
                { role: "user", parts: [{ text: message }] }
            ],
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        for await (const chunk of resultStream) {
            // Kill heartbeat as soon as real content starts pouring in
            if (!hasData) {
                clearInterval(heartbeatInterval);
                hasData = true;
            }
            // 6. New SDK: chunk.text is a property, not a function
            const chunkText = chunk.text;
            if (chunkText) {
                process.stdout.write(chunkText); // RAW LOGGING
                res.write(chunkText);
            }
        }

        res.end();
    } catch (error) {
        clearInterval(heartbeatInterval);
        console.error("❌ Reina Gemini Error:", error);
        if (!res.headersSent) {
            res.status(500).write(`[emotion=sad][anim=sadIdle][voice=cold] Darling... 接続しにくいわね。${error.message}`);
        } else {
            res.write(`[emotion=sad] Error: ${error.message}`);
        }
        res.end();
    }
});

module.exports = router;
