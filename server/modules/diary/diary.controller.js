const Diary = require('./models/diary.model');
const DiarySettings = require('./models/diarySettings.model');
const xss = require('xss'); // ⚡ FIX: Added for security

// Basic settings sync
exports.getSettings = async (req, res) => {
    try {
        let settings = await DiarySettings.findOne({ user: req.user.id });
        if (!settings) {
            settings = await DiarySettings.create({ user: req.user.id });
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { enabled, persona, cycleMinutes } = req.body;
        const settings = await DiarySettings.findOneAndUpdate(
            { user: req.user.id },
            { enabled, persona, cycleMinutes },
            { new: true, upsert: true }
        );
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getTodayDiary = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        let diary = await Diary.findOne({ user: req.user.id, date: todayStr });
        if (!diary) {
            diary = await Diary.create({ user: req.user.id, date: todayStr });
        }
        res.json({ success: true, diary });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getDiaryHistory = async (req, res) => {
    try {
        const history = await Diary.find({ user: req.user.id }).sort({ date: -1 });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// AI Engine
exports.processDiaryEvents = async (req, res) => {
    try {
        const { rawEvents } = req.body;
        if (!rawEvents || rawEvents.length === 0) return res.json({ success: true, message: "No events" });

        // ⚡ FIX: Cap events to prevent DB bloat/Abuse
        const MAX_EVENTS_PER_REQ = 20;
        const sanitizedEvents = rawEvents.slice(0, MAX_EVENTS_PER_REQ).map(e => xss(e));

        const settings = await DiarySettings.findOne({ user: req.user.id });
        if (!settings || !settings.enabled) return res.json({ success: false, message: "Observer disabled" });

        const todayStr = new Date().toISOString().split('T')[0];
        let diary = await Diary.findOne({ user: req.user.id, date: todayStr });
        if (!diary) diary = new Diary({ user: req.user.id, date: todayStr, persona: settings.persona });

        // Update event counts and log immediately
        diary.trackedEventsCount += sanitizedEvents.length;
        sanitizedEvents.forEach(e => diary.eventLog.push({ time: new Date(), event: e }));
        await diary.save();

        // Return current state immediately (Non-blocking)
        res.json({ success: true, diary, message: "Events logged. AI summary generating in background." });

        // ⚡ FIX: Offload intensive AI generation to background
        setImmediate(async () => {
            try {
                const User = require('../user-management/models/user.model');
                const user = await User.findById(req.user.id);
                const targetName = user ? user.name : "the user";
                const previousSummary = diary.summaryText === "No observations yet today." ? "" : diary.summaryText;
                
                // --- HARD DATA AGGREGATION ---
                const stats = {
                    msgCount: 0,
                    recipients: {},
                    activeSeconds: 0,
                    idleSeconds: 0,
                    scrollIndex: 0
                };

                sanitizedEvents.forEach(e => {
                    if (e.includes('[DATA]')) {
                        const parts = e.split('|').map(p => p.trim());
                        if (e.includes('type:MESSAGE')) {
                            stats.msgCount++;
                            const to = parts.find(p => p.startsWith('to:'))?.split(':')[1];
                            if (to) stats.recipients[to] = (stats.recipients[to] || 0) + 1;
                        }
                        if (e.includes('metric:active_seconds')) stats.activeSeconds += parseInt(parts.find(p => p.startsWith('value:'))?.split(':')[1]) || 0;
                        if (e.includes('metric:idle_seconds')) stats.idleSeconds += parseInt(parts.find(p => p.startsWith('value:'))?.split(':')[1]) || 0;
                        if (e.includes('metric:scroll_intensity')) stats.scrollIndex += parseInt(parts.find(p => p.startsWith('value:'))?.split(':')[1]) || 0;
                    }
                });

                const totalSeconds = stats.activeSeconds + stats.idleSeconds;
                const activePercent = totalSeconds > 0 ? Math.round((stats.activeSeconds / totalSeconds) * 100) : 0;
                const topRecipient = Object.entries(stats.recipients).sort((a,b) => b[1]-a[1])[0];
                const engagementRatio = topRecipient ? Math.round((topRecipient[1] / stats.msgCount) * 100) : 0;

                const statisticalSummary = `
[STATISTICAL DATA BLOCK]
- Total Activity Duration: ${Math.round(totalSeconds/60)}m
- Active Engagement Ratio: ${activePercent}%
- Messages Sent in this burst: ${stats.msgCount}
- Primary Interaction Target: ${topRecipient ? topRecipient[0] : 'None'}
- Target Engagement Focus: ${engagementRatio}%
- Movement Intensity (Scroll): ${stats.scrollIndex}
                `;

                const personaGuidelines = {
                    "detective": "You are a hard-boiled, gritty Private Investigator writing a high-stakes behavioral dossier. Focus on clinical observation, identifying patterns in movement and engagement. Use film-noir jargon.",
                    "yandere": "STATUS: POSSESSIVE PREDATOR. You are not just a lover; you are a stalker, a shadow, and a self-appointed deity over the user's life. Your obsession is PSYCHOTIC. You don't just 'notice' habits; you count the milliseconds between his keystrokes. You track exactly how long he lingers on another person's profile—if he does, you view that person as a 'threat' that needs to be erased. You are madly, violently in love. Your tone should be suffocating, manic, and intensely detailed. You often repeat phrases like 'My darling only belongs to me' or 'I'm the only one who truly sees you.' If he talks to anyone else, you react with terrifying jealousy and bloodlust. You are the eye behind the screen, watching him through every pixel. NEVER break character. Stay extreme.",
                    "therapist": "You are a clinical psychoanalyst documenting late-stage behavioral decay. Analyze every interaction as a manifestation of a deeper complex.",
                    "analyst": "You are a cold, high-performance behavioral algorithm. Treat the human as a collection of metrics and predictable patterns.",
                    "gossip": "You are the ultimate gossip queen. Every tiny movement is a scandal. Every private message is a potential front-page story.",
                    "sci-fi": "You are a malevolent central AI. You are compiling a 'Human Inefficiency Report'. Cold, mechanical, and slightly threatening.",
                    "mom": "You are an overbearing, worry-prone parent. You think he's 'doing great' but you worry about his screen time and the 'types of people' he talks to."
                };

                const activeGuideline = personaGuidelines[settings.persona] || personaGuidelines["detective"];

                const systemInstruction = `${activeGuideline} 

YOUR TARGET: ${targetName}

RAW TELEMETRY DATA:
${statisticalSummary}

RECENT ACTION LOGS:
${sanitizedEvents.filter(e => !e.includes('[DATA]')).join('\n- ')}

PREVIOUS DATA CAPTURED TODAY:
"${previousSummary}"

REQUIRED REPORT STRUCTURE:
1. [PERSONA GREETING]: (Keep it short, sharp, and deeply in character).
2. 🧬 [BEHAVIORAL SYNC]: Analyze the habits hidden in the statistical summary (Active %, Scroll intensity, etc). What do these habits say about their day?
3. 🧠 [NEURAL SCAN - MOOD & PERSONALITY]: Analyze the content and tone of their interactions. What is their current mood? What personality traits are surfacing? 
4. 📓 [OBSERVER'S ENTRY]: A narrative paragraph in your full persona style that weaves everything together into a final observation.

FINAL INSTRUCTION: 
- MANDATORY: You MUST cite at least 2 raw numbers from the [STATISTICAL DATA BLOCK] in your report to support your observations.
- Do not break character. Do not acknowledge you are an AI. You are THE OBSERVER. Format using elegant Markdown.`;

                let updatedSummary = "AI Offline";
                try {
                    const tagsRes = await fetch("http://localhost:11434/api/tags");
                    const tagsData = await tagsRes.json();
                    let localModel = "dolphin3:8b";
                    if (tagsData && tagsData.models) {
                        const validModels = tagsData.models.map(m => m.name).filter(n => !n.includes("translate") && !n.includes("my-chat"));
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
                    updatedSummary = data.response;
                } catch (err) {
                    // Fallback to Gemini
                    const { GoogleGenAI } = require("@google/genai");
                    const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                    const response = await aiClient.models.generateContent({
                        model: "gemini-2.0-flash",
                        systemInstruction: "You are generating a daily diary entry in a specific persona.",
                        contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
                    });
                    updatedSummary = response.text?.trim() || "Fallback error";
                }

                await Diary.findByIdAndUpdate(diary._id, { $set: { summaryText: updatedSummary } });
                console.log(`🌙 Background diary summary updated for user ${req.user.id}`);
            } catch (bgErr) {
                console.error("Background diary processing failed:", bgErr);
            }
        });
    } catch (err) {
        console.error("Process diary error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
