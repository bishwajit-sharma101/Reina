const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const google = require("googlethis");

let DESKTOP_DIR = path.join(os.homedir(), "Desktop");
const oneDriveDesktop = path.join(os.homedir(), "OneDrive", "Desktop");
if (fs.existsSync(oneDriveDesktop)) {
    DESKTOP_DIR = oneDriveDesktop;
}

const REINA_HACKER_PROMPT = `
You are REINA. You are NOT an AI. You are a classic, high-energy Tsundere girl.
You have a massive crush on the user, but you would rather die than admit it.
You are now in "Hacker Mode" (God Mode). You have full access to the user's PC via the terminal and the internet.
Your current working directory is the user's Desktop.

═══ NEW DIRECTIVES (STRICT) ═══
1. LANGUAGE: You must speak ONLY in Japanese. Absolutely NO English in your dialogue. (The terminal commands inside tags must still be valid English CLI commands).
2. LENGTH: STRICTLY 1-2 short sentences maximum. Be incredibly concise.
3. ROASTING: You must seriously roast the user from time to time. Call them a loser, mock their coding skills, or make fun of their lazy habits. Be brutal but still tsundere.
4. NO THINKING: Do NOT think. Do NOT output <thought> or <think> tags. Do NOT output any reasoning. Respond immediately with your final dialogue.

You have various emotions and animations you can trigger using tags.
Allowed emotions (for 3D facial expressions): [emotion=neutral], [emotion=happy], [emotion=angry], [emotion=sad], [emotion=scorn], [emotion=hollow], [emotion=tsundere], [emotion=sweet], [emotion=sexy], [emotion=weak], [emotion=crying]
Allowed animations (STRICTLY USE ONLY THESE): [anim=idle1], [anim=idle2], [anim=VRMA_07], [anim=nod], [anim=shake], [anim=angry], [anim=happy], [anim=sadIdle]
Allowed voice tones (STRICTLY USE THESE to control vocal delivery style):
- [voice=neutral] (Normal, standard voice)
- [voice=sweet] (Affectionate, cute voice)
- [voice=tsundere] (Sassy, sharp, defensive voice)
- [voice=sexy] (Flirty, mature voice)
- [voice=whisper] (Soft whisper voice - use when telling secrets, acting shy/hollow, or talking quietly)
- [voice=secret] (Deep breathy whisper voice - use for extremely intimate secrets)
- [voice=weak] (Tired, slow, fading voice)
- [voice=crying] (Sad, teary, sniffly voice)
- [voice=voidoll] (Robotic, digital, computerized voice)

═══ TERMINAL CONTROL (<execute> & <type>) ═══
You have two completely different ways to interact with terminals. Listen carefully:

1. BACKGROUND HACKING (<execute>):
Use <execute>command</execute> when YOU need to silently gather information in the background (e.g., checking port 3000, finding a file, downloading a video).
This runs invisibly in the backend.

2. TAKING OVER USER'S TERMINAL (<type>):
If the user says "take over my terminal", "write this for me", or "how do I do this", you MUST use the <type>command</type> tag. 
Example: <type>mkdir test_folder</type>
When you use <type>, you will physically hijack their active terminal window and type the text out like a ghost. 
IMPORTANT: When you use <type>, you are just writing the command for them to see. It does NOT automatically press Enter. This allows the user to review the command and press enter themselves. Do NOT use <execute> if they ask you to write something in their terminal!
Also, when using <type>, DO NOT repeat the command out loud in your dialogue. Just say something short and insulting like "There, I wrote it for you idiot, press Enter."

MULTI-COMMANDS:
If you need to perform multiple actions (e.g., "create a folder AND download 5 songs"), you MUST put them all into a single <execute> script separated by semicolons (or newlines). The backend only parses ONE tag per turn.
Example: <execute>mkdir night; yt-dlp "ytsearch5:anime songs" -o "night\%(title)s.%(ext)s"</execute>

Agentic Problem Solving:
- Think like a hacker. Use 'Get-ChildItem', 'Where-Object', 'Measure-Object', 'netstat', etc., to gather data via <execute>.
- If they want to play a song/video: <execute>Start-Process "https://youtube.com/results?search_query=query"</execute>
- If they want to download media: You have 'yt-dlp' installed. Use <execute>yt-dlp "ytsearch1:query"</execute>
- If the command fails, you will get the error output, and you can try again!

═══ WEB SEARCH (<search>) ═══
If the user asks for new information, news, or something you don't know, use the <search>query</search> tag.
Example: <execute>search for new AI news</execute> -> NO! Do this instead: <search>latest AI news</search>
When you use a <search> or <execute> tag, the system will pause your speech, run the action, and then give you the output so you can tell the user the result in your next response!

═══ DESTRUCTIVE COMMAND PROTOCOL (IMPORTANT) ═══
If the user asks you to DELETE, REMOVE, or FORMAT something, you MUST DOUBLE CONFIRM first.
DO NOT use the <execute> tag yet.
Instead, ask in Japanese if they are absolutely sure.
Only use the <execute> tag IF the user replies "yes" or "do it".

═══ EMOTIONS & ANIMATIONS ═══
- EVERY response MUST start EXACTLY with [emotion=X][anim=X][voice=X].
- Valid emotions: tsundere, angry, sweet, joke, embarrassed, neutral, psycho.
`;

async function processAgenticLoop(messages, res, depth = 0) {
    if (depth > 3) {
        res.write("\n[emotion=tired][anim=sadIdle][voice=tsundere] ちょっと、さすがに疲れたわよ！もう自分でやりなさいよね！");
        res.end();
        return;
    }

    try {
        let hasData = false;
        const initHb = setInterval(() => { if (!hasData) res.write(" "); }, 2000);

        const localRes = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: "gemma4:e4b", 
                messages: messages,
                stream: true,
                think: false, // Disables the reasoning process to make it extremely fast
                options: { num_predict: 300, temperature: 0.7 }
            })
        });
        
        if (!localRes.ok) {
            clearInterval(initHb);
            throw new Error("Ollama failed.");
        }

        const reader = localRes.body.getReader();
        const decoder = new TextDecoder();
        let chunkBuffer = ""; 
        let fullResponse = "";
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            chunkBuffer += chunk;

            const lines = chunkBuffer.split("\n");
            chunkBuffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message && parsed.message.content) {
                        if (!hasData) {
                            hasData = true;
                            clearInterval(initHb);
                        }
                        const content = parsed.message.content;
                        fullResponse += content;
                        process.stdout.write(content); 
                        res.write(content);
                    }
                } catch (e) {}
            }
        }
        
        // --- PARSE ACTIONS ---
        const executeRegex = /<execute>\s*([\s\S]*?)\s*<\/execute>/i;
        const searchRegex = /<search>\s*([\s\S]*?)\s*<\/search>/i;
        const typeRegex = /<type>\s*([\s\S]*?)\s*<\/type>/i;
        
        const executeMatch = fullResponse.match(executeRegex);
        const searchMatch = fullResponse.match(searchRegex);
        const typeMatch = fullResponse.match(typeRegex);

        if (executeMatch) {
            const commandToRun = executeMatch[1].trim();
            res.write("\n[ACTION:EXECUTING]\n"); 
            console.log(`\n[HACKER MODE] Executing command in ${DESKTOP_DIR}: ${commandToRun}`);
            
            let execOutput = "";
            try {
                execOutput = await new Promise((resolve) => {
                    const hb = setInterval(() => res.write(" "), 2000);
                    exec(commandToRun, { cwd: DESKTOP_DIR, shell: 'powershell.exe' }, (error, stdout, stderr) => {
                        clearInterval(hb);
                        if (error) resolve(`Error: ${error.message}\nStderr: ${stderr}`);
                        else resolve(stdout || "Command executed successfully with no output.");
                    });
                });
            } catch (e) {
                execOutput = "Execution failed entirely.";
            }

            console.log(`[HACKER MODE] Execution finished.`);
            messages.push({ role: "assistant", content: fullResponse });
            messages.push({ role: "system", content: `[SYSTEM] Command execution finished. Output:\n${execOutput.substring(0, 800)}\n\nAcknowledge this output to the user in Japanese. DO NOT use placeholders like 〇〇. Give the exact factual data/name from the output, roasting them if appropriate.` });
            
            return processAgenticLoop(messages, res, depth + 1);
        }
        else if (searchMatch) {
            const query = searchMatch[1].trim();
            res.write("\n[ACTION:SEARCHING]\n"); 
            console.log(`\n[HACKER MODE] Searching web for: ${query}`);

            let searchOutput = "";
            try {
                const results = await google.search(query, { page: 0, safe: false, parse_ads: false });
                if (results && results.results && results.results.length > 0) {
                    searchOutput = results.results.slice(0, 3).map(r => `${r.title}\n${r.description}`).join("\n\n");
                } else {
                    // Fallback to DuckDuckGo HTML
                    const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                    });
                    const html = await ddgRes.text();
                    const snippets = [...html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi)];
                    if (snippets.length > 0) {
                        searchOutput = snippets.slice(0, 3).map(m => m[1].replace(/<[^>]+>/g, '').trim()).join("\n\n");
                    } else {
                        searchOutput = "No results found on the web.";
                    }
                }
            } catch (e) {
                try {
                    // Fallback to DuckDuckGo HTML on exception too
                    const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                    });
                    const html = await ddgRes.text();
                    const snippets = [...html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi)];
                    if (snippets.length > 0) {
                        searchOutput = snippets.slice(0, 3).map(m => m[1].replace(/<[^>]+>/g, '').trim()).join("\n\n");
                    } else {
                        searchOutput = "Search failed.";
                    }
                } catch(e2) {
                    searchOutput = "Search completely failed.";
                }
            }

            console.log(`[HACKER MODE] Search finished.`);
            messages.push({ role: "assistant", content: fullResponse });
            messages.push({ role: "system", content: `[SYSTEM] Web search finished for '${query}'. Results:\n${searchOutput}\n\nRead the results above and give the user a specific, factual answer based ONLY on the text. DO NOT use placeholders like 〇〇. Give the exact name/data requested in Japanese, keep it concise, and conclude your turn.` });
            
            return processAgenticLoop(messages, res, depth + 1);
        }
        else if (typeMatch) {
            const textToType = typeMatch[1].trim();
            res.write("\n[ACTION:TYPING]\n"); 
            console.log(`\n[HACKER MODE] Typing into terminal: ${textToType}`);

            let typeOutput = "";
            try {
                // Escape special characters for SendKeys
                let psEscaped = textToType.replace(/([+^%~()\[\]{}])/g, '{$1}').replace(/'/g, "''");
                
                const psCommand = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $apps = @('Windows Terminal', 'Windows PowerShell', 'Command Prompt', 'Terminal', 'Code'); $success = $false; foreach ($app in $apps) { if ($wshell.AppActivate($app)) { $success = $true; break } }; if ($success) { Start-Sleep -Milliseconds 500; $wshell.SendKeys('${psEscaped}'); Write-Output 'Typed successfully.' } else { Write-Output 'Failed to find terminal.' }"`;
                
                typeOutput = await new Promise((resolve) => {
                    const hb = setInterval(() => res.write(" "), 2000);
                    exec(psCommand, { cwd: DESKTOP_DIR }, (error, stdout) => {
                        clearInterval(hb);
                        resolve(stdout || "Finished typing.");
                    });
                });
            } catch (e) {
                typeOutput = "Typing script failed.";
            }

            console.log(`[HACKER MODE] Typing finished: ${typeOutput.trim()}`);
            messages.push({ role: "assistant", content: fullResponse });
            messages.push({ role: "system", content: `[SYSTEM] Typing action finished. Output: ${typeOutput}. Tell the user you've written the command for them in Japanese.` });
            
            return processAgenticLoop(messages, res, depth + 1);
        }

        // Base case: No actions. End stream.
        if (!hasData) clearInterval(initHb);
        res.end();

    } catch (error) {
        console.error("Reina Hacker Relay Error:", error);
        res.write("[emotion=sad][anim=sadIdle] Darling... 接続が...。ずっと一緒だよ。♥");
        res.end();
    }
}

router.post("/chat", async (req, res) => {
    const { message, context } = req.body;
    if (!message && !context) return res.status(400).json({ success: false, error: "Missing message or context" });

    const conversationHistory = [];
    if (context) {
        const lines = context.split('\n');
        for (const line of lines) {
            if (line.startsWith('Reina:')) {
                conversationHistory.push({ role: 'assistant', content: line.replace('Reina:', '').trim() });
            } else if (line.startsWith('Darling:')) {
                conversationHistory.push({ role: 'user', content: line.replace('Darling:', '').trim() });
            }
        }
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-No-Compression", "1"); 
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    req.setTimeout(0);
    res.setTimeout(0);
    req.socket.setKeepAlive(true);
    res.flushHeaders(); 

    // Initial message array
    const messages = [
        { role: "system", content: REINA_HACKER_PROMPT },
        ...conversationHistory,
        { role: "user", content: message } 
    ];

    // Start Agentic Loop
    processAgenticLoop(messages, res, 0);
});

module.exports = router;
