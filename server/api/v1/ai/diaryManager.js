const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(__dirname, 'reina_core_memory.json');
const DIARY_PATH = path.join(__dirname, 'reina_diary.json');
const PERSONA_PATH = path.join(__dirname, 'reina_persona.json');

function _readFile(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function _writeFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Error writing to", filePath, e);
    }
}

function updateMemory(note) {
    if (!note || typeof note !== 'string') return;
    const memory = _readFile(MEMORY_PATH);
    if (memory.includes(note.trim())) return;
    
    memory.push(note.trim());
    // Unlimited facts (no shift)
    
    _writeFile(MEMORY_PATH, memory);
}

function updateDiary(note) {
    if (!note || typeof note !== 'string') return;
    const diary = _readFile(DIARY_PATH);
    if (diary.includes(note.trim())) return;
    
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
    diary.push(`[${timestamp}] ${note.trim()}`);
    
    if (diary.length > 50) diary.shift(); 
    
    _writeFile(DIARY_PATH, diary);
}

function updatePersona(newPersona) {
    if (!newPersona || typeof newPersona !== 'string') return;
    const personaHistory = _readFile(PERSONA_PATH);
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
    personaHistory.push(`[${timestamp}] ${newPersona.trim()}`);
    _writeFile(PERSONA_PATH, personaHistory);
}

function getMemoryAndDiaryContext() {
    const memory = _readFile(MEMORY_PATH);
    const diary = _readFile(DIARY_PATH);
    const persona = _readFile(PERSONA_PATH);
    
    let contextStr = "";
    
    if (memory.length > 0) {
        contextStr += `\n═══ CORE MEMORY (IMPORTANT FACTS) ═══\nThese are the core facts you know about ダーリン:\n` + memory.map(m => `- ${m}`).join('\n') + `\n(Keep these in mind naturally without immediately bringing them up.)\n`;
    }
    
    if (diary.length > 0) {
        const recentDiary = diary.slice(-5);
        contextStr += `\n═══ REINA's RECENT DIARY ENTRIES ═══\nYour recent private thoughts and feelings:\n` + recentDiary.join('\n') + `\n(Use these to maintain emotional continuity.)\n`;
    }
    
    return contextStr;
}


function getActivePersona() {
    const persona = _readFile(PERSONA_PATH);
    if (persona.length > 0) {
        return persona[persona.length - 1];
    }
    return null;
}

module.exports = {
    getActivePersona,
    updateMemory,
    updateDiary,
    updatePersona,
    getMemory: () => _readFile(MEMORY_PATH),
    getDiary: () => _readFile(DIARY_PATH),
    getPersona: () => _readFile(PERSONA_PATH),
    getDiaryContextString: getMemoryAndDiaryContext 
};
