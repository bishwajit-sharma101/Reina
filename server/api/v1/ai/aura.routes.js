const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../../../modules/auth/auth.middleware');
const User = require('../../../modules/user-management/models/user.model');

router.post('/scan', protect, async (req, res) => {
    try {
        const { bio, interests, name, targetId } = req.body;

        // ⚡ QUOTA CHECK
        const requester = await User.findById(req.user._id);
        if (!requester || requester.neuralQuota < 5) {
            return res.status(403).json({ success: false, message: "Insufficient Neural Quota (5 required)." });
        }
        
        // Fetch target user context if needed or just use passed data
        let promptStr = `Analyze this user's profile and generate their 'Neural Aura'.
Name: ${name || 'Unknown'}
Bio: ${bio || 'No bio available.'}
Interests: ${(interests || []).join(', ') || 'No interests listed.'}

Compare them with the requester:
Requester Interests: ${(requester.interests || []).join(', ')}

You must return EXACTLY valid JSON, with nothing else before or after.
Format:
{
  "auraColor": "A CSS gradient description, e.g., 'from-cyan-500 to-purple-500'. Tailwind classes only.",
  "hexColors": ["#00ffff", "#800080"],
  "vibeCheck": "A stylish, edges, 2-sentence analysis. Max 40 words.",
  "compatibility": 85,
  "compReason": "A 10-word reason why they match or clash.",
  "icebreakers": ["Starter 1", "Starter 2"]
}
`;

        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "karma", 
            prompt: promptStr,
            stream: false
        });

        const rawText = response.data.response;
        
        let auraData;
        try {
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}') + 1;
            if(jsonStart !== -1 && jsonEnd !== -1) {
                 auraData = JSON.parse(rawText.slice(jsonStart, jsonEnd));
            } else {
                 throw new Error("No JSON found");
            }
        } catch (parseError) {
            auraData = {
                auraColor: "from-brand-500 to-purple-500",
                hexColors: ["#8b5cf6", "#a855f7"],
                vibeCheck: "A mysterious entity traversing the neural web with unpredictable patterns.",
                compatibility: 50,
                compReason: "Vibe patterns are too complex to map instantly.",
                icebreakers: ["So, what brings you to this node?", "Share your latest transmission?"]
            };
        }

        // ⚡ SUBTRACT QUOTA
        requester.neuralQuota -= 5;
        await requester.save();

        res.json({ success: true, aura: auraData, remainingQuota: requester.neuralQuota });
    } catch (error) {
        console.error("Aura Scan Error:", error);
        res.status(500).json({ success: false, message: "Aura scan failed." });
    }
});

module.exports = router;
