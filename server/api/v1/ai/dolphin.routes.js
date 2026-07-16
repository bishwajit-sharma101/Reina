const express = require("express");
const router = express.Router();

router.post("/chat", async (req, res) => {
    const { model = "reina", message, context } = req.body;
    if (!message && !context) return res.status(400).json({ success: false, error: "Missing message or context" });

    // Format context into messages array
    const conversationHistory = [];
    if (context) {
        // Split context into lines (Reina: ..., Darling: ...)
        const lines = context.split('\n');
        for (const line of lines) {
            if (line.startsWith('Reina:')) {
                conversationHistory.push({ role: 'assistant', content: line.replace('Reina:', '').trim() });
            } else if (line.startsWith('Darling:')) {
                conversationHistory.push({ role: 'user', content: line.replace('Darling:', '').trim() });
            }
        }
    }

    // 1. Set headers IMMEDIATELY to prevent proxy/browser timeouts
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-No-Compression", "1"); 
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 2. Disable Timeouts
    req.setTimeout(0);
    res.setTimeout(0);
    req.socket.setKeepAlive(true);
    res.flushHeaders(); 

    // 3. Start Heartbeat IMMEDIATELY (32 spaces to bypass buffers)
    let hasData = false;
    let heartbeatInterval = setInterval(() => {
        if (!hasData) res.write("                                "); 
    }, 1000);

    try {
        const localRes = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model, 
                messages: [
                    ...conversationHistory,
                    { role: "user", content: message } 
                ],
                stream: true,
                options: {
                    num_predict: 350, 
                    temperature: 0.7,
                    repeat_penalty: 1.2
                }
            })
        });
        
        if (!localRes.ok) throw new Error("Ollama failed.");

        const reader = localRes.body.getReader();
        const decoder = new TextDecoder();
        let chunkBuffer = ""; 
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Kill heartbeat as soon as real content starts pouring in
            if (!hasData) {
                clearInterval(heartbeatInterval);
                hasData = true;
            }

            const chunk = decoder.decode(value, { stream: true });
            chunkBuffer += chunk;

            const lines = chunkBuffer.split("\n");
            chunkBuffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    
                    // Support BOTH standard content and Reasoning blocks (DeepSeek-R1)
                    if (parsed.message) {
                        if (parsed.message.reasoning_content) {
                            // Relay thinking process wrapped in tags for the frontend
                            const thinking = parsed.message.reasoning_content;
                            res.write(`<think>${thinking}</think>`);
                        }
                        
                        if (parsed.message.content) {
                            const content = parsed.message.content;
                            // RAW LOGGING - See exactly what Ollama is thinking
                            process.stdout.write(content); 
                            res.write(content);
                        }
                    }
                } catch (e) {
                    console.warn("Parse error:", line);
                }
            }
        }
        res.end();

    } catch (error) {
        clearInterval(heartbeatInterval);
        console.error("Dolphin AI Relay Error:", error);
        res.write("[emotion=sad][anim=sadIdle] Darling... 接続が...。ずっと一緒だよ。♥");
        res.end();
    }
});

module.exports = router;
