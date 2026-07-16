const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", async (req, res) => {
    const { prompt, messagesContext } = req.body;
    if (!prompt || !messagesContext) return res.status(400).json({ success: false, error: "Missing context" });

    const systemInstruction = `You are an elite communication coach and conversational strategist inside a chat application. You are analyzing the active, ongoing conversation history provided below.

INSTRUCTIONS:
1. Thoroughly read the context. Determine the general mood, relationship dynamic, and intent.
2. The user asking you for help is identified as 'Me'.
3. Based on the selected persona/coach requested by the user, provide EXACT suggestions for what 'Me' should reply with next to steer the conversation positively.
4. Give 'Me' 2-3 interesting topics or questions they can bring up next to keep the conversation flowing smoothly.
5. Provide brief, actionable advice on tone (e.g., "Keep it playful", "Be more direct"). 
6. Format your output cleanly with bullet points or sections. Be concise but highly insightful.

RECENT CHAT CONTEXT:
${messagesContext}

USER COACH PERSONA REQUEST: ${prompt}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            systemInstruction: "You are an expert communication coach and chat summarizer.",
            contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
            generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 1024 }
        });
        
        const text = response.text?.trim();
        if(!text) throw new Error("Empty gemini response");
        res.json({ success: true, response: text });
    } catch (error) {
        console.warn("Gemini analyze-chat failed, using generic local model fallback...", error.message);
        try {
            const tagsRes = await fetch("http://localhost:11434/api/tags");
            if (!tagsRes.ok) throw new Error("Ollama not reachable via tags");
            const tagsData = await tagsRes.json();
            
            let localModel = "dolphin3:8b"; 
            if (tagsData && tagsData.models) {
                 const validModels = tagsData.models.map(m => m.name).filter(n => n.includes("dolphin") || (!n.includes("karma") && !n.includes("translate") && !n.includes("my-chat") && !n.includes("mychat")));
                 if (validModels.some(m => m.includes("dolphin"))) {
                      localModel = validModels.find(m => m.includes("dolphin"));
                 } else if (validModels.length > 0) {
                      localModel = validModels[0];
                 }
            }

            const localRes = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    model: localModel, 
                    prompt: systemInstruction,
                    stream: false
                })
            });
            const data = await localRes.json();
            res.json({ success: true, response: data.response });
        } catch (localError) {
             res.status(500).json({ success: false, error: "AI core completely offline" });
        }
    }
});

module.exports = router;
