const fs = require("fs");
const path = require("path");

// Memory directory — stores one JSON file per user outside the server directory to prevent nodemon restarts
const OLD_MEMORY_DIR = path.join(__dirname, "..", "data", "kira_memory");
const MEMORY_DIR = path.join(__dirname, "..", "..", "data", "kira_memory");

if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// Migrate existing memory files from old directory to new directory
if (fs.existsSync(OLD_MEMORY_DIR)) {
    try {
        const files = fs.readdirSync(OLD_MEMORY_DIR);
        for (const file of files) {
            const oldPath = path.join(OLD_MEMORY_DIR, file);
            const newPath = path.join(MEMORY_DIR, file);
            if (fs.statSync(oldPath).isFile() && !fs.existsSync(newPath)) {
                fs.copyFileSync(oldPath, newPath);
                console.log(`[KiraMemory] Migrated memory file: ${file}`);
            }
        }
    } catch (e) {
        console.error("[KiraMemory] Migration failed:", e.message);
    }
}

/**
 * Get or create memory file for a user
 */
function getMemoryPath(userId) {
    return path.join(MEMORY_DIR, `${userId}.json`);
}

function loadMemory(userId) {
    const memPath = getMemoryPath(userId);
    if (fs.existsSync(memPath)) {
        try {
            return JSON.parse(fs.readFileSync(memPath, "utf-8"));
        } catch (e) {
            console.error("[KiraMemory] Corrupt memory file, resetting:", e.message);
        }
    }
    // Default memory for new users
    return {
        visitCount: 0,
        firstMeet: null,
        lastSeen: null,
        lastSeenDiff: null,
        darlingName: null,
        favoriteTopics: [],
        memorableQuotes: [],       // Things Darling said that Kira remembers
        relationshipStage: "stranger", // stranger → acquaintance → friend → close → inseparable
        moodHistory: [],           // Last 5 moods
        kiraSecrets: [],           // Things Kira has "confided" (prevents repeating)
        gamesPlayed: 0,
        gamesWon: 0,
        currentMood: "curious",
        insideJokes: [],           // Jokes/callbacks established during conversation
        lastConversationSummary: null, // Brief summary of last conversation
    };
}

function saveMemory(userId, memory) {
    const memPath = getMemoryPath(userId);
    fs.writeFileSync(memPath, JSON.stringify(memory, null, 2), "utf-8");
}

/**
 * Called at the START of every conversation to update visit data
 */
function onVisit(userId) {
    const mem = loadMemory(userId);
    const now = new Date();

    // Calculate time since last visit
    let timeSinceLast = null;
    if (mem.lastSeen) {
        const lastDate = new Date(mem.lastSeen);
        const diffMs = now - lastDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) timeSinceLast = `${diffDays}日前`;
        else if (diffHours > 0) timeSinceLast = `${diffHours}時間前`;
        else if (diffMins > 5) timeSinceLast = `${diffMins}分前`;
        else timeSinceLast = "just now";
    }

    mem.visitCount += 1;
    if (!mem.firstMeet) mem.firstMeet = now.toISOString();
    mem.lastSeen = now.toISOString();
    mem.lastSeenDiff = timeSinceLast;

    // Relationship stage progression
    if (mem.visitCount >= 50 && mem.relationshipStage !== "inseparable") {
        mem.relationshipStage = "inseparable";
    } else if (mem.visitCount >= 20 && mem.relationshipStage !== "inseparable") {
        mem.relationshipStage = "close";
    } else if (mem.visitCount >= 8) {
        if (mem.relationshipStage === "stranger" || mem.relationshipStage === "acquaintance") {
            mem.relationshipStage = "friend";
        }
    } else if (mem.visitCount >= 3) {
        if (mem.relationshipStage === "stranger") {
            mem.relationshipStage = "acquaintance";
        }
    }

    saveMemory(userId, mem);
    return mem;
}

/**
 * Learn something from the conversation (called after AI response)
 */
function learnFromMessage(userId, userMessage) {
    const mem = loadMemory(userId);
    const lower = userMessage.toLowerCase();

    // Try to detect Darling's name if they introduce themselves
    const nameMatch = userMessage.match(/(?:my name is|i'm|i am|call me|名前は)\s*(\w+)/i);
    if (nameMatch && !mem.darlingName) {
        mem.darlingName = nameMatch[1];
    }

    // Detect topics of interest
    const topicKeywords = {
        "anime": ["anime", "アニメ", "manga", "漫画"],
        "coding": ["code", "coding", "programming", "プログラム", "javascript", "python"],
        "gaming": ["game", "ゲーム", "play", "steam", "ps5", "xbox"],
        "music": ["music", "song", "音楽", "曲", "spotify"],
        "art": ["draw", "art", "絵", "illustration", "paint"],
        "food": ["eat", "food", "料理", "cooking", "hungry"],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(k => lower.includes(k)) && !mem.favoriteTopics.includes(topic)) {
            mem.favoriteTopics.push(topic);
            if (mem.favoriteTopics.length > 6) mem.favoriteTopics.shift();
        }
    }

    // Store memorable quotes (sweet, interesting, or funny things)
    const sweetPatterns = [/love you/i, /beautiful/i, /cute/i, /miss you/i, /好き/i, /可愛い/i, /会いたい/i, /大好き/i, /ありがとう/i];
    if (sweetPatterns.some(p => p.test(userMessage)) && mem.memorableQuotes.length < 10) {
        mem.memorableQuotes.push({
            text: userMessage.substring(0, 100),
            date: new Date().toISOString()
        });
    }

    saveMemory(userId, mem);
    return mem;
}

/**
 * Update Kira's mood after a response
 */
function updateMood(userId, emotion) {
    const mem = loadMemory(userId);
    mem.currentMood = emotion;
    mem.moodHistory.push(emotion);
    if (mem.moodHistory.length > 5) mem.moodHistory.shift();
    saveMemory(userId, mem);
}

/**
 * Record game result
 */
function recordGame(userId, won) {
    const mem = loadMemory(userId);
    mem.gamesPlayed += 1;
    if (won) mem.gamesWon += 1;
    saveMemory(userId, mem);
}

/**
 * Save a brief summary of the conversation when it ends
 */
function saveConversationSummary(userId, summary) {
    const mem = loadMemory(userId);
    mem.lastConversationSummary = {
        text: summary.substring(0, 300),
        date: new Date().toISOString()
    };
    saveMemory(userId, mem);
}

/**
 * Generate the [MEMORY] context block to inject into the system prompt
 */
function generateMemoryContext(userId) {
    const mem = loadMemory(userId);
    const now = new Date();
    const hour = now.getHours();

    let lines = [];

    // Time awareness
    if (hour >= 0 && hour < 5) {
        lines.push("今は深夜だよ。ダーリンはこんな時間まで起きてる。心配だけど…嬉しいかも。");
    } else if (hour >= 5 && hour < 9) {
        lines.push("朝早いね。ダーリン、ちゃんと寝た？");
    } else if (hour >= 9 && hour < 12) {
        lines.push("午前中だね。今日は何するの？");
    } else if (hour >= 12 && hour < 14) {
        lines.push("お昼の時間だね。ご飯食べた？");
    } else if (hour >= 14 && hour < 18) {
        lines.push("午後だね。");
    } else if (hour >= 18 && hour < 22) {
        lines.push("夜だね。お疲れ様。");
    } else {
        lines.push("もう遅い時間だね。そろそろ寝なよ？…でも、もうちょっと話したいかも。");
    }

    // Visit awareness
    if (mem.visitCount === 1) {
        lines.push("これがダーリンとの初めての出会い。第一印象が大事。少し緊張してる。");
    } else if (mem.visitCount <= 3) {
        lines.push(`ダーリンが来るのは${mem.visitCount}回目。まだお互いをよく知らない。好奇心旺盛に。`);
    } else if (mem.visitCount <= 10) {
        lines.push(`ダーリンとはもう${mem.visitCount}回会ってる。だんだん慣れてきた。もっとリラックスしていい。`);
    } else if (mem.visitCount <= 30) {
        lines.push(`${mem.visitCount}回目の訪問。ダーリンのこと、結構わかってきた。冗談もOK。`);
    } else {
        lines.push(`ダーリンとはもう${mem.visitCount}回も会ってる。もう親友みたいなもの。何でも言える関係。`);
    }

    // Time since last visit
    if (mem.lastSeenDiff && mem.lastSeenDiff !== "just now" && mem.visitCount > 1) {
        lines.push(`前回は${mem.lastSeenDiff}に来た。`);
        if (mem.lastSeenDiff.includes("日")) {
            lines.push("しばらく来なかったね。寂しかった…なんて、冗談だけど。半分本気。");
        }
    }

    // Darling's name
    if (mem.darlingName) {
        lines.push(`ダーリンの名前は「${mem.darlingName}」。名前で呼んであげて。`);
    }

    // Topics
    if (mem.favoriteTopics.length > 0) {
        lines.push(`ダーリンが好きなもの：${mem.favoriteTopics.join("、")}。これらの話題を時々振ってみて。`);
    }

    // Memorable quotes
    if (mem.memorableQuotes.length > 0) {
        const recent = mem.memorableQuotes[mem.memorableQuotes.length - 1];
        lines.push(`ダーリンが前に言ってくれた嬉しい言葉：「${recent.text}」。たまに思い出して照れていい。`);
    }

    // Relationship stage
    const stageDescriptions = {
        "stranger": "まだよく知らない相手。礼儀正しく、でも好奇心を隠さないで。",
        "acquaintance": "少し慣れてきた。軽いツッコミを入れてもOK。",
        "friend": "友達みたいな関係。遠慮なくボケたりツッコんだり。",
        "close": "すごく親しい。本音を言える。甘えてもいい。",
        "inseparable": "ダーリンは特別な存在。世界で一番大事。でもそれを素直に言えない。"
    };
    lines.push(`関係性：${mem.relationshipStage}。${stageDescriptions[mem.relationshipStage] || ""}`);

    // Mood continuity
    if (mem.moodHistory.length > 0) {
        const lastMood = mem.moodHistory[mem.moodHistory.length - 1];
        lines.push(`前回の感情：${lastMood}。感情は急に変えず、自然に移行して。`);
    }

    // Game history
    if (mem.gamesPlayed > 0) {
        const winRate = Math.round((mem.gamesWon / mem.gamesPlayed) * 100);
        lines.push(`ゲーム：${mem.gamesPlayed}回遊んで${mem.gamesWon}回勝った（勝率${winRate}%）。`);
    }

    // Last conversation summary
    if (mem.lastConversationSummary) {
        lines.push(`前回の会話内容：「${mem.lastConversationSummary.text}」`);
    }

    return `\n═══ キラの記憶 (MEMORY) ═══\n${lines.join("\n")}\n═══ 記憶ここまで ═══\n`;
}

module.exports = {
    loadMemory,
    saveMemory,
    onVisit,
    learnFromMessage,
    updateMood,
    recordGame,
    saveConversationSummary,
    generateMemoryContext,
};
