/**
 * contextManager.js - Smart Conversation Context & Memory Management
 * 
 * Provides:
 * 1. In-memory session context cache (sliding window of conversational turns).
 * 2. Smart tag cleaning (strips VRMA animations, emotions, Fish Audio tags from history
 *    so the LLM context isn't polluted with raw machine syntax).
 * 3. Rolling conversation summarization / topic memory for long-running chats.
 * 4. Resilient multi-line context parser (fixes bug where newlines dropped messages).
 * 5. Automatic session eviction for inactive sessions (> 24 hours).
 */

class ContextManager {
    constructor() {
        // Map<sessionId, SessionData>
        this.sessions = new Map();
        
        // Configuration
        this.MAX_VERBATIM_TURNS = 20; // Keep last 20 messages in full fidelity
        this.SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
        
        // Periodic cleanup of stale sessions every hour
        setInterval(() => this.cleanupStaleSessions(), 60 * 60 * 1000);
    }

    /**
     * Get or create a session object.
     * Fallback to 'default' if no sessionId is provided.
     */
    getSession(sessionId = 'default') {
        const id = sessionId || 'default';
        let session = this.sessions.get(id);
        if (!session) {
            session = {
                id,
                messages: [], // Array<{ role: 'user' | 'assistant', content: string, timestamp: number }>
                summary: null, // High-level memory capsule of earlier topics
                lastActive: Date.now()
            };
            this.sessions.set(id, session);
        } else {
            session.lastActive = Date.now();
        }
        return session;
    }

    /**
     * Clean raw assistant response of machine tags, animations, and voice tags
     * so that previous turns in the LLM's history are clean, natural conversation.
     */
    cleanForHistory(text, role = 'assistant') {
        if (!text || typeof text !== 'string') return '';
        
        let cleaned = text;

        if (role === 'assistant') {
            // Strip VRMA animation tags: [anim=...] or [motion=...]
            cleaned = cleaned.replace(/\[(?:anim|motion)=[^\]]+\]/gi, '');
            
            // Strip emotion tags: [emotion=...] or [exp=...]
            cleaned = cleaned.replace(/\[(?:emotion|exp)=[^\]]+\]/gi, '');
            
            // Strip voice/vocal inflection tags
            cleaned = cleaned.replace(/\[voice=[^\]]+\]/gi, '');
            cleaned = cleaned.replace(/\[(?:laughing|chuckling|sighing|clear throat|panting|groaning|pause|long pause|angry|sad|embarrassed|emphasis|whispering|soft|breathy|excited)\]/gi, '');
            
            // Strip action tags: [ACTION:...]
            cleaned = cleaned.replace(/\[ACTION:[A-Z_]+\]/gi, '');
            
            // Strip game tags: <MOVE...>, <OPEN_GAME...>, <CHESS_MOVE...>
            cleaned = cleaned.replace(/<OPEN_GAME[^>]*\/?>/gi, '');
            cleaned = cleaned.replace(/<MOVE[^>]*\/?>/gi, '');
            cleaned = cleaned.replace(/<CHESS_MOVE[^>]*\/?>/gi, '');
            cleaned = cleaned.replace(/<[^>]+>/g, '');
            
            // Strip system score / closeness tags
            cleaned = cleaned.replace(/\[(?:SYSTEM|CLOSENESS|SYSTEM_SCORE|SYSTEM_CHESS|SYSTEM_TIC_TAC_TOE)[^\]]*\]/gi, '');
        } else {
            // User message: if it was a system game action like "[SYSTEM_CHESS]...", extract user visible summary
            if (cleaned.includes('[SYSTEM_CHESS]') || cleaned.includes('[SYSTEM_TIC_TAC_TOE]')) {
                const visibleMatch = cleaned.match(/\((Chess|Tic-Tac-Toe):[^)]+\)/i);
                if (visibleMatch) {
                    cleaned = `[Game move played: ${visibleMatch[0]}]`;
                } else {
                    cleaned = cleaned.replace(/\[(?:SYSTEM|SYSTEM_SCORE|CLOSENESS|SYSTEM_CHESS|SYSTEM_TIC_TAC_TOE)[^\]]*\][^\n]*/gi, '').trim();
                }
            }
        }

        // Clean extra whitespace and redundant newlines
        return cleaned.replace(/\n{3,}/g, '\n\n').trim();
    }

    /**
     * Parse legacy multi-line context string cleanly without dropping lines.
     * Handles: "Darling: hello\nhow are you?\nReina: I'm good!\nReally!"
     */
    parseContextString(contextStr) {
        if (!contextStr || typeof contextStr !== 'string') return [];
        const result = [];
        
        // Match blocks starting with speaker label
        const speakerRegex = /(?:^|\n)(Darling|Reina|User|Assistant|Kira):\s*/gi;
        const matches = [...contextStr.matchAll(speakerRegex)];
        
        if (matches.length === 0) {
            return [];
        }

        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const speaker = currentMatch[1].toLowerCase();
            const startIndex = currentMatch.index + currentMatch[0].length;
            const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : contextStr.length;
            
            const rawContent = contextStr.slice(startIndex, endIndex).trim();
            if (rawContent) {
                const role = (speaker === 'darling' || speaker === 'user') ? 'user' : 'assistant';
                const clean = this.cleanForHistory(rawContent, role);
                if (clean) {
                    result.push({ role, content: clean });
                }
            }
        }

        return result;
    }

    /**
     * Update session history with incoming client history or context.
     * Prevents duplicates while ensuring all turns are recorded.
     */
    syncClientHistory(session, clientHistory, contextStr) {
        let incomingMessages = [];

        // 1. If structured history array was passed:
        if (Array.isArray(clientHistory) && clientHistory.length > 0) {
            incomingMessages = clientHistory.map(m => ({
                role: (m.role === 'assistant' || m.sender === 'ai') ? 'assistant' : 'user',
                content: this.cleanForHistory(m.content || m.text, (m.role === 'assistant' || m.sender === 'ai') ? 'assistant' : 'user')
            })).filter(m => !!m.content);
        } 
        // 2. Otherwise parse context string
        else if (contextStr) {
            incomingMessages = this.parseContextString(contextStr);
        }

        if (incomingMessages.length === 0) return;

        // If session was empty, initialize with incoming messages
        if (session.messages.length === 0) {
            session.messages = incomingMessages.map(m => ({ ...m, timestamp: Date.now() }));
            return;
        }

        // Merge intelligently: append any messages not already present at the tail
        const lastSessionMsg = session.messages[session.messages.length - 1];
        const lastIncoming = incomingMessages[incomingMessages.length - 1];

        // If the client has newer messages not yet in session:
        if (lastIncoming && (!lastSessionMsg || lastSessionMsg.content !== lastIncoming.content)) {
            // Find where they diverge and append
            const lastStoredContent = lastSessionMsg ? lastSessionMsg.content : null;
            const matchIndex = lastStoredContent 
                ? incomingMessages.map(m => m.content).lastIndexOf(lastStoredContent)
                : -1;

            const newItems = (matchIndex >= 0) 
                ? incomingMessages.slice(matchIndex + 1)
                : incomingMessages.slice(-4); // Take latest 4 if divergent

            for (const item of newItems) {
                if (item.content && (!lastSessionMsg || item.content !== lastSessionMsg.content)) {
                    session.messages.push({ ...item, timestamp: Date.now() });
                }
            }
        }
    }

    /**
     * Generate or update a rolling topic summary when conversation exceeds MAX_VERBATIM_TURNS.
     * This keeps the context window lean while retaining memory of past topics.
     */
    updateRollingSummary(session) {
        if (session.messages.length <= this.MAX_VERBATIM_TURNS) return;

        // Take older messages to distill
        const overflowCount = session.messages.length - this.MAX_VERBATIM_TURNS;
        const archivedMessages = session.messages.slice(0, overflowCount);
        
        // Extract key topics/phrases from archived messages
        const userTopics = archivedMessages
            .filter(m => m.role === 'user')
            .map(m => m.content.slice(0, 60))
            .filter(t => t.length > 5);

        if (userTopics.length > 0) {
            const topicSnippets = userTopics.slice(-4).join('; ');
            session.summary = `Previous topics discussed earlier: "${topicSnippets}".`;
        }

        // Keep only the most recent MAX_VERBATIM_TURNS in the active buffer
        session.messages = session.messages.slice(-this.MAX_VERBATIM_TURNS);
    }

    /**
     * Build the complete messages array for the LLM API request.
     * Combines:
     * - System prompt
     * - Long-term topic memory capsule (if any)
     * - Cleaned conversation turns
     * - Current user message
     */
    buildMessages({ sessionId, message, context, history, systemPrompt }) {
        const session = this.getSession(sessionId);

        // Sync incoming history
        this.syncClientHistory(session, history, context);

        // Update summary if needed
        this.updateRollingSummary(session);

        const cleanUserMessage = this.cleanForHistory(message, 'user');

        // Build final array
        const finalMessages = [
            { role: 'system', content: systemPrompt }
        ];

        // If a topic memory capsule exists, inject it right after system prompt
        if (session.summary) {
            finalMessages.push({
                role: 'system',
                content: `[CONVERSATION CONTEXT & TOPIC MEMORY]\n${session.summary}\n(You remember these previous topics naturally if Darling refers back to them.)`
            });
        }

        // Add recent conversation turns
        for (const msg of session.messages) {
            if (msg.content) {
                finalMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }

        // Add current user message
        finalMessages.push({
            role: 'user',
            content: message // Keep raw message for system tag detection
        });

        // Record user message in session cache
        if (cleanUserMessage) {
            session.messages.push({
                role: 'user',
                content: cleanUserMessage,
                timestamp: Date.now()
            });
        }

        return {
            messages: finalMessages,
            session
        };
    }

    /**
     * Record the assistant's reply into session memory after streaming finishes.
     */
    recordAssistantReply(sessionId, fullReplyText) {
        if (!fullReplyText || typeof fullReplyText !== 'string') return;
        const session = this.getSession(sessionId);
        const cleanContent = this.cleanForHistory(fullReplyText, 'assistant');
        
        if (cleanContent) {
            // Avoid duplicate consecutive assistant messages
            const last = session.messages[session.messages.length - 1];
            if (!last || last.role !== 'assistant' || last.content !== cleanContent) {
                session.messages.push({
                    role: 'assistant',
                    content: cleanContent,
                    timestamp: Date.now()
                });
            }
        }

        session.lastActive = Date.now();
    }

    /**
     * Clear session memory for a given sessionId.
     */
    clearSession(sessionId) {
        const id = sessionId || 'default';
        this.sessions.delete(id);
    }

    /**
     * Periodic cleanup of sessions inactive for more than 24h.
     */
    cleanupStaleSessions() {
        const now = Date.now();
        for (const [id, session] of this.sessions.entries()) {
            if (now - session.lastActive > this.SESSION_TTL_MS) {
                this.sessions.delete(id);
            }
        }
    }
}

// Export singleton instance
const contextManager = new ContextManager();
module.exports = contextManager;
