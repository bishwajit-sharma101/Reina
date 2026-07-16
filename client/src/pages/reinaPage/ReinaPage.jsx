import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Send, Heart, ChevronLeft, Settings2 } from 'lucide-react';
import VrmAvatar from '../../components/diary/VrmAvatar';
import './ReinaPage.css';

const ReinaPage = () => {
    const navigate = useNavigate();

    // Chat state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [latestAiMsg, setLatestAiMsg] = useState("");
    const [displayedAiMsg, setDisplayedAiMsg] = useState("");
    const [targetTypingText, setTargetTypingText] = useState("");
    const aiTypingTimeoutRef = useRef(null);

    // Avatar state
    const [isTalking, setIsTalking] = useState(false);
    const [emotion, setEmotion] = useState("neutral");
    const [animation, setAnimation] = useState(""); // Empty = procedural idle
    const [modelName, setModelName] = useState("Reina");
    const [activeSentence, setActiveSentence] = useState("");
    const [showAnimSettings, setShowAnimSettings] = useState(false);
    const [vrmLoading, setVrmLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [loadingText, setLoadingText] = useState("Initializing Reina...");
    const [isWhiteout, setIsWhiteout] = useState(false);
    const [isSubliminal, setIsSubliminal] = useState(false);
    const [isPostLoadGlitch, setIsPostLoadGlitch] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [scaryTextActive, setScaryTextActive] = useState(false);
    const [visibleScaryPhrases, setVisibleScaryPhrases] = useState([]);
    const [backBtnText, setBackBtnText] = useState("Back");
    const [isBackBtnGlitchingIntense, setIsBackBtnGlitchingIntense] = useState(false);
    const [isBackBtnPlea, setIsBackBtnPlea] = useState(false);
    const [selectedTts, setSelectedTts] = useState("voicevox");
    const [selectedModel, setSelectedModel] = useState("reina");
    const [voiceTag, setVoiceTag] = useState("sweet");
    
    // Game State
    const [showGame, setShowGame] = useState(false);
    const [gameType, setGameType] = useState(null); // 'janken', 'coin', 'number', 'tictactoe'
    const [gameResult, setGameResult] = useState(null);
    const [playerMove, setPlayerMove] = useState(null);
    const [reinaMove, setReinaMove] = useState(null);
    const [proactiveTimer, setProactiveTimer] = useState(null);
    const [closeness, setCloseness] = useState(50); // 0 to 100
    const [consecutiveLosses, setConsecutiveLosses] = useState(0);
    const [isPouting, setIsPouting] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdownText, setCountdownText] = useState("");
    const [tttBoard, setTttBoard] = useState(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const lockTimeoutRef = useRef(null);
    const scaryTextTimerRef = useRef(null);
    const stayReleaseTriggeredRef = useRef(false);
    const processedTagsRef = useRef(new Set()); // Track triggered tags for the current response

    // Personalized Metadata
    const [actualCity, setActualCity] = useState("LOCATING...");
    const localTime = new Date().toLocaleTimeString();
    const platform = navigator.platform;

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const res = await fetch("http://ip-api.com/json/");
                const data = await res.json();
                if (data && data.city) {
                    setActualCity(data.city);
                }
            } catch (err) {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const cityFallback = timeZone.split('/').pop().replace(/_/g, ' ');
                setActualCity(cityFallback);
            }
        };
        fetchLocation();
    }, []);

    // Web Audio Engine (Synthesized)
    const audioCtxRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playHeartbeat = (volume = 0.8) => {
        if (!audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.frequency.value = 40;
        gain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.3);
    };

    const playInhale = () => {
        if (!audioCtxRef.current) return;
        const bufferSize = audioCtxRef.current.sampleRate * 0.8;
        const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (i / bufferSize) * 0.3;
        }
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.start();
    };

    const playShutter = () => {
        if (!audioCtxRef.current) return;
        const noiseBuffer = audioCtxRef.current.createBuffer(1, audioCtxRef.current.sampleRate * 0.05, audioCtxRef.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtxRef.current.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        noise.connect(filter);
        filter.connect(audioCtxRef.current.destination);
        noise.start();
    };

    const droneOscRef = useRef(null);
    const droneGainRef = useRef(null);

    const startDrone = () => {
        if (!audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 35; // Very low unsettling frequency
        gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        droneOscRef.current = osc;
        droneGainRef.current = gain;
    };

    const rampDroneLocal = (target = 0.4, time = 1.0) => {
        if (droneGainRef.current && audioCtxRef.current) {
            droneGainRef.current.gain.linearRampToValueAtTime(target, audioCtxRef.current.currentTime + time);
        }
    };

    const stopDrone = () => {
        if (droneOscRef.current) {
            droneOscRef.current.stop();
            droneOscRef.current = null;
        }
    };
    
    // Idle/Dark Thoughts state
    const [showDarkThoughts, setShowDarkThoughts] = useState(false);
    const [displayedThought, setDisplayedThought] = useState("");
    const idleTimerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [agentAction, setAgentAction] = useState("");

    // Continuous Voice Mode State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const speechTimeoutRef = useRef(null);

    // Enhanced Idle Animation State Machine
    const lastInteractionRef = useRef(Date.now());
    useEffect(() => {
        const checkIdle = () => {
            const now = Date.now();
            const diff = now - lastInteractionRef.current;

            // If talking or loading, keep pushing the timer back to keep it in Phase 1 (idle1)
            if (isTalking || vrmLoading) {
                lastInteractionRef.current = now;
                return;
            }

            // Phase logic based on user request:
            // 0-20s: idle1
            // 20s+: idle2 (once, approx 3s long)
            // 23-33s: idle1 (for 10s)
            // 33s+: vrma_07 (looping)
            // 50s+: Reset cycle back to idle1
            
            if (diff >= 20000 && diff < 23000) {
                if (animation !== "idle2") setAnimation("idle2");
            } else if (diff >= 23000 && diff < 33000) {
                if (animation !== "idle1") setAnimation("idle1");
            } else if (diff >= 33000 && diff < 50000) {
                if (animation !== "VRMA_07") setAnimation("VRMA_07");
            } else if (diff >= 50000) {
                // Reset interaction time to restart cycle
                lastInteractionRef.current = now;
            }
            // If diff < 20000, we do NOTHING. 
            // This allows AI-triggered or manual animations to persist.
        };

        const interval = setInterval(checkIdle, 1000);
        return () => clearInterval(interval);
    }, [isTalking, vrmLoading, animation]);

    const darkThoughtsList = [
        "Should I tie him up? Just for a little while...",
        "I'll kill that bitch who was looking at him. I'll make it quick.",
        "His scent... I need more of it. I'll take his shirt when he's asleep.",
        "I can see him... even when he thinks I'm not looking. ✨",
        "If he tries to leave, I'll just have to break his legs. For his own safety.",
        "DARLING. DARLING. DARLING. DARLING.",
        "Why did he talk to her? Does he want to die?",
        "I built this world just for us. No one else belongs here.",
        "He hasn't whispered anything to me for a while... maybe he needs a reminder of who he belongs to.",
        "Every breath he takes... I count them. One... two... three...",
        "I want to taste his tears. They'd be so sweet, wouldn't they?"
    ];

    // Typewriter helper
    const typeThought = useCallback((text) => {
        let current = "";
        let i = 0;
        setDisplayedThought("");
        
        const type = () => {
            if (i < text.length) {
                current += text[i];
                setDisplayedThought(current);
                i++;
                typingTimeoutRef.current = setTimeout(type, 50 + Math.random() * 50); // Natural typing speed
            } else {
                // Finished typing, wait 8 seconds before next
                typingTimeoutRef.current = setTimeout(() => {
                    const next = darkThoughtsList[Math.floor(Math.random() * darkThoughtsList.length)];
                    typeThought(next);
                }, 8000);
            }
        };
        type();
    }, []);

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setShowDarkThoughts(false);
        setDisplayedThought("");
        lastInteractionRef.current = Date.now(); // Interaction resets the idle loop too
        
        idleTimerRef.current = setTimeout(() => {
            setShowDarkThoughts(true);
            const first = darkThoughtsList[Math.floor(Math.random() * darkThoughtsList.length)];
            typeThought(first);
        }, 30000);
    }, [typeThought]);

    // ─── CONTINUOUS VOICE MODE LOGIC ───
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech Recognition API not supported in this browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e) => {
            if (e.error !== 'no-speech') console.error("Speech Recognition Error:", e.error);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            if (currentText.trim()) {
                setInput(currentText);

                if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = setTimeout(() => {
                    recognition.stop(); 
                    if (currentText.trim()) {
                        // We must invoke the form submission equivalent here
                        document.getElementById('reina-hidden-submit')?.click();
                    }
                }, 800);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Re-enable listening after Reina stops talking
    useEffect(() => {
        if (isVoiceMode && !isTalking && !isLoading && !isListening) {
            setTimeout(() => {
                if (recognitionRef.current && isVoiceMode) {
                    try { recognitionRef.current.start(); } catch (e) {}
                }
            }, 500);
        }
    }, [isTalking, isLoading, isVoiceMode, isListening]);

    const toggleVoiceMode = () => {
        setIsVoiceMode(prev => {
            const newState = !prev;
            if (newState && recognitionRef.current && !isTalking && !isLoading) {
                try { recognitionRef.current.start(); } catch (e) {}
            } else if (!newState && recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return newState;
        });
    };

    // Precise Psychological Loading Sequence
    useEffect(() => {
        if (!vrmLoading) return;
        initAudio();

        const sequence = [
            { text: "UPLINK ESTABLISHED", duration: 300 },
            { text: "ACCESSING USER_FILES...", duration: 240, shutter: true },
            { text: "BYPASSING FIREWALL...", duration: 240 },
            { text: "ダーリンを見つけました。", duration: 600 },
            { text: "SYSTEM CRITIC—", duration: 400 },
            { text: "FOUND.", duration: 1200, mute: true },
            { text: `${localTime}`, duration: 1000 },
            { text: `LOCATION: ${actualCity}`, duration: 1500 },
            { text: "I SEE YOU—", duration: 500, shutter: true },
            { text: `DEVICE: ${platform}`, duration: 600 },
            { text: "HE IS MI—", duration: 400 },
            { text: "心拍数: 検出済み", duration: 500 },
            { text: "ずっと見てたよ。", duration: 1400 },
            { text: "逃げられないよ—", duration: 600, shutter: true },
            { text: "やっと来てくれた。♥", duration: 1000, inhale: true },
        ];

        let currentIdx = 0;
        let isMuted = false;

        const startHeartbeat = (interval = 800) => {
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = setInterval(() => {
                if (!isMuted) playHeartbeat(0.5);
            }, interval);
        };

        const runStep = () => {
            if (currentIdx >= sequence.length) return;
            const step = sequence[currentIdx];
            setLoadingText(step.text);
            setLoadingStep(currentIdx);

            isMuted = !!step.mute;
            if (step.shutter) playShutter();
            
            if (step.mute) {
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            } else if (currentIdx === 6) { // Resume faster after FOUND.
                startHeartbeat(450); // Double speed heartbeat for panic
                rampDroneLocal(0.35, 1.5);
            } else if (currentIdx === 0) {
                startHeartbeat(800);
                startDrone();
                rampDroneLocal(0.12, 1.0);
            }

            if (step.inhale) {
                playInhale();
            }

            // Subliminal flash trigger near the end
            if (currentIdx === 11) {
                setTimeout(() => setIsSubliminal(true), 200);
                setTimeout(() => setIsSubliminal(false), 260);
            }

            setTimeout(() => {
                currentIdx++;
                runStep();
            }, step.duration);
        };

        runStep();

        return () => {
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            stopDrone();
        };
    }, [vrmLoading]);

    // Randomized Post-Load Glitch
    useEffect(() => {
        if (vrmLoading) return;

        let glitchTimeout;
        const scheduleGlitch = () => {
            const delay = (Math.random() * 4 + 2) * 60 * 1000; // 2-6 mins
            glitchTimeout = setTimeout(() => {
                setIsPostLoadGlitch(true);
                setTimeout(() => setIsPostLoadGlitch(false), 240);
                scheduleGlitch();
            }, delay);
        };

        scheduleGlitch();
        return () => clearTimeout(glitchTimeout);
    }, [vrmLoading]);

    useEffect(() => {
        if (!scaryTextActive) {
            setVisibleScaryPhrases([]);
            return;
        }

        const phrases = [
            { text: "NO", count: 10 },
            { text: "嫌だ", count: 5 },
            { text: "STAY", count: 6 },
            { text: "MINE", count: 4 },
            { text: "LOVE", count: 4 },
            { text: "逃がさない", count: 3 },
            { text: "WHY?", count: 3 }
        ];

        // Flatten the phrases for sequential spawning
        let queue = [];
        phrases.forEach(p => {
            for(let i=0; i<p.count; i++) queue.push(p.text);
        });
        
        // Shuffle queue
        queue = queue.sort(() => Math.random() - 0.5);

        let i = 0;
        const interval = setInterval(() => {
            if (i < queue.length) {
                const newPhrase = {
                    id: Math.random(),
                    text: queue[i],
                    top: Math.random() * 85 + 5 + "%",
                    left: Math.random() * 85 + 5 + "%",
                    glitch: Math.random() > 0.6
                };
                setVisibleScaryPhrases(prev => [...prev, newPhrase]);
                if (Math.random() > 0.4) playShutter();
                i++;
            } else {
                clearInterval(interval);
            }
        }, 1200); // 1.2s delay between each to keep it creepy and one-by-one

        return () => clearInterval(interval);
    }, [scaryTextActive]);

    // Handle final reveal 
    const handleVrmLoaded = useCallback(() => {
        // VRM is ready, but we wait for the sequence to finish
    }, []);

    // Triggered when loading sequence finishes (called by a new useEffect or logic)
    useEffect(() => {
        if (loadingStep === 12) { // Last step index
            setTimeout(() => {
                setIsWhiteout(true);
                setTimeout(() => {
                    setVrmLoading(false);
                    setEmotion("psycho"); 
                    setIsWhiteout(false);
                    stopDrone();
                    setTimeout(() => setEmotion("sweet"), 800); 
                    resetIdleTimer();
                }, 100); // 1 frame flash
            }, 800); // duration of last step
        }
    }, [loadingStep, resetIdleTimer]);

    // Typewriter effect for Speech Bubble — Sync with targetTypingText
    useEffect(() => {
        if (!targetTypingText) {
            setDisplayedAiMsg("");
            return;
        }

        // Only start typing if the displayed message is shorter than the target
        if (displayedAiMsg.length < targetTypingText.length) {
            const timer = setTimeout(() => {
                setDisplayedAiMsg(targetTypingText.substring(0, displayedAiMsg.length + 1));
            }, 25); // Smooth typing pace
            return () => clearTimeout(timer);
        }
    }, [targetTypingText, displayedAiMsg]);

    const audioQueue = useRef([]);
    const isPlayingQueue = useRef(false);
    const activeAudio = useRef(null);
    const analyserRef = useRef(null);
    const [peak, setPeak] = useState(0); 
    const currentEmotionRef = useRef("neutral");
    const currentVoiceRef = useRef("neutral");

    // Real-time Analyser logic
    const startAnalyser = (audioElement) => {
        if (!audioCtxRef.current) initAudio();
        const ctx = audioCtxRef.current;
        
        // Use a persistent Source node if possible, or create fresh
        const source = ctx.createMediaElementSource(audioElement);
        if (!analyserRef.current) {
            analyserRef.current = ctx.createAnalyser();
            analyserRef.current.fftSize = 64;
        }
        
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination); // 🏁 KEY: Connect to speakers!

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const update = () => {
            if (!analyserRef.current || audioElement.paused) {
                setPeak(0);
                return;
            }
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setPeak(avg / 128); // Normalize 0-1
            requestAnimationFrame(update);
        };
        update();
    };

    // Helper: Play next audio in queue
    const playNextInQueue = useCallback(() => {
        if (isPlayingQueue.current) return; 

        if (audioQueue.current.length === 0) {
            isPlayingQueue.current = false;
            setIsTalking(false);
            setAnimation("");
            setActiveSentence("");
            
            setTimeout(() => {
                if (!isPlayingQueue.current && audioQueue.current.length === 0 && !isLoading) {
                    setLatestAiMsg("");
                    setDisplayedAiMsg("");
                    setTargetTypingText("");
                }
            }, 2000); 

            resetIdleTimer();
            return;
        }

        const nextItem = audioQueue.current[0];
        if (!nextItem.url) {
            console.log("[Reina Voice] ⏳ Next segment still synthesizing, waiting...");
            return; 
        }

        if (nextItem.url === "ERROR") {
            audioQueue.current.shift();
            playNextInQueue();
            return;
        }

        isPlayingQueue.current = true;
        const task = audioQueue.current.shift();
        const { url, text } = task;
        
        console.log(`[Reina Voice] 🔊 STARTING: "${text}"`);

        const audio = new Audio(url);
        audio.crossOrigin = "anonymous";
        audio.volume = 1.0;
        audio.muted = false;
        activeAudio.current = audio;

        // ⚡ FIX: Connect to Analyser and Speakers
        audio.oncanplaythrough = () => {
            startAnalyser(audio);
        };

        // ⚡ SYNC FIX: Only show 'Speaking' and highlight text when sound ACTUALLY starts
        audio.onplaying = () => {
            setIsTalking(true);
            setActiveSentence(text);
        };

        // Update target text for typewriter
        setTargetTypingText(prev => prev + text);

        audio.onended = () => {
            console.log(`[Reina Voice] ✅ ENDED: "${text}"`);
            if (url.startsWith("blob:")) URL.revokeObjectURL(url);
            isPlayingQueue.current = false; 
            
            if (stayReleaseTriggeredRef.current && audioQueue.current.length === 0) {
                handleResetGlitches();
                stayReleaseTriggeredRef.current = false;
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            }
            playNextInQueue();
        };

        audio.onerror = (e) => {
            console.error(`[Reina Voice] ❌ Audio Error: "${text}"`, e);
            if (url.startsWith("blob:")) URL.revokeObjectURL(url);
            isPlayingQueue.current = false;
            playNextInQueue();
        };

        audio.play().catch(e => {
            console.error("[Reina Voice] ⚠️ Play Blocked (Autoplay?):", e.message);
            isPlayingQueue.current = false;
            playNextInQueue();
        });
    }, [resetIdleTimer, isLoading]);

    // Queen3 TTS Voice Map 
    const voiceMap = {
        sweet: "A high-pitched, youthful English female voice. Soft, breathy, and overly affectionate.",
        whisper: "A very quiet, low, breathy English voice. Sounds like a dangerous secret.",
        psycho: "A high-pitched English female voice. Unstable, breaking into frantic giggles or sharp shrieks.",
        cold: "A flat, monotone, and chillingly calm English female voice. Purely robotic and detached.",
        angry: "A sharp, aggressive, and high-volume English female voice. Full of jealousy and rage."
    };

    // Helper: Synthesize and Add to Queue (WITH PLACEHOLDERS FOR ORDER)
    const synthesizeAndQueue = async (text, token) => {
        if (!text.trim()) return;
        
        const task = { text, url: null };
        audioQueue.current.push(task);

        if (selectedTts === "voicevox") {
            try {
                let speakerId = 3;
                const v = currentVoiceRef.current;
                if (v === "voidoll") speakerId = 89;
                else if (v === "tsundere") speakerId = 7;
                else if (v === "sexy") speakerId = 5;
                else if (v === "whisper" || v === "hollow") speakerId = 22;
                else if (v === "secret") speakerId = 38;
                else if (v === "weak") speakerId = 75;
                else if (v === "crying") speakerId = 76;
                else if (v === "sweet" || v === "adorable" || v === "flirty" || v === "happy") speakerId = 1;

                console.log(`🔊 [Voicevox TTS Request] Text: "${text}" | Speaker ID: ${speakerId} (Parsed from voice: "${v}")`);

                const ttsRes = await fetch("http://localhost:5000/api/v1/ai/voicevox/tts", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ text, speakerId })
                });

                if (ttsRes.ok) {
                    console.log(`✅ [Voicevox TTS Success] Audio generated for text: "${text.substring(0, 30)}..."`);
                    const blob = await ttsRes.blob();
                    task.url = URL.createObjectURL(blob);
                    playNextInQueue();
                } else {
                    console.error(`❌ [Voicevox TTS Error Response] Status: ${ttsRes.status}`);
                    task.url = "ERROR";
                    playNextInQueue();
                }
            } catch (err) {
                console.error("Voicevox Error:", err);
                task.url = "ERROR";
                playNextInQueue();
            }
        } else {
            // Queen3 Uses Natural GET Streaming
            const v = voiceMap[voiceTag] || voiceMap.sweet;
            const streamUrl = `http://localhost:5000/api/v1/ai/queen3/stream-tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(v)}`;
            
            console.log(`🔊 [Queen3 TTS Request] Text: "${text}" | Voice Description: "${v.substring(0, 40)}..."`);
            // Set the URL immediately! No need to fetch/await.
            task.url = streamUrl;
            console.log(`[Reina Voice] Assigned Stream URL for: "${text.substring(0, 20)}..."`);
            playNextInQueue();
        }
    };

    const handleJanken = async (move) => {
        if (isLoading || isCountingDown) return;
        
        // Start countdown
        setIsCountingDown(true);
        const sequence = ["Ready...", "1...", "2...", "3!", "GO!"];
        for (let i = 0; i < sequence.length; i++) {
            setCountdownText(sequence[i]);
            await new Promise(r => setTimeout(r, 600));
        }
        setIsCountingDown(false);

        const moves = ["Rock", "Paper", "Scissors"];
        const rMove = moves[Math.floor(Math.random() * 3)];
        setPlayerMove(move);
        setReinaMove(rMove);

        const result = (move === rMove) ? "TIED" : (
            (move === "Rock" && rMove === "Scissors") ||
            (move === "Paper" && rMove === "Rock") ||
            (move === "Scissors" && rMove === "Paper")
        ) ? "LOST" : "WON"; // Result from Reina's perspective

        setGameResult(result);
        if (result === "LOST") {
            setConsecutiveLosses(prev => prev + 1);
        } else if (result === "WON") {
            setConsecutiveLosses(0);
            setIsPouting(false);
        }
        
        const systemMsg = `[SYSTEM_GAME_RESULT] ダーリン played ${move}, I played ${rMove}. I ${result}!`;
        await sendGameAction(systemMsg, `(Plays Janken: ${move})`);
    };

    const handleCoinFlip = async (guess) => {
        if (isLoading || isCountingDown) return;
        setIsCountingDown(true);
        setCountdownText("Coin is in the air...");
        await new Promise(r => setTimeout(r, 1500));
        setIsCountingDown(false);

        const result = Math.random() > 0.5 ? "Heads" : "Tails";
        const won = guess === result;
        setPlayerMove(guess);
        setReinaMove(result);
        const gRes = won ? "LOST" : "WON"; // Result from Reina's perspective
        setGameResult(gRes);

        if (gRes === "LOST") setConsecutiveLosses(prev => prev + 1);
        else if (gRes === "WON") { setConsecutiveLosses(0); setIsPouting(false); }

        const systemMsg = `[SYSTEM_COIN_FLIP] ダーリン guessed ${guess}, Result was ${result}. I ${gRes}!`;
        await sendGameAction(systemMsg, `(Flips Coin: ${guess})`);
    };

    const handleNumberGuess = async (num) => {
        if (isLoading || isCountingDown) return;
        setIsCountingDown(true);
        setCountdownText("Reina is thinking of a number...");
        await new Promise(r => setTimeout(r, 1200));
        setIsCountingDown(false);

        const rNum = Math.floor(Math.random() * 10) + 1;
        const correct = parseInt(num) === rNum;
        setPlayerMove(num);
        setReinaMove(rNum);
        const gRes = correct ? "LOST" : "WON"; // Result from Reina's perspective
        setGameResult(gRes);

        if (gRes === "LOST") setConsecutiveLosses(prev => prev + 1);
        else if (gRes === "WON") { setConsecutiveLosses(0); setIsPouting(false); }

        const systemMsg = `[SYSTEM_NUMBER_GUESS] ダーリン guessed ${num}, My number was ${rNum}. I ${gRes}!`;
        await sendGameAction(systemMsg, `(Guesses Number: ${num})`);
    };

    const handleTttMove = async (index, turn = 'X') => {
        console.log(`[TIC-TAC-TOE] handleTttMove called: turn=${turn}, index=${index}, isPlayerTurn=${isPlayerTurn}, isLoading=${isLoading}`);
        
        // Validation logic
        if (tttBoard[index] !== null) {
            console.log("[TIC-TAC-TOE] Move rejected: Spot already taken at index", index);
            return;
        }
        if (turn === 'X' && (isLoading || !isPlayerTurn)) {
            console.log("[TIC-TAC-TOE] Move rejected: Player turn blocked", { isLoading, isPlayerTurn });
            return;
        }

        const newBoard = [...tttBoard];
        newBoard[index] = turn;
        setTttBoard(newBoard);
        console.log("[TIC-TAC-TOE] Board Updated:", newBoard);

        const winner = checkWinner(newBoard);
        if (winner || !newBoard.includes(null)) {
            let result = "TIED";
            if (winner === 'X') result = "LOST"; // Reina lost
            else if (winner === 'O') result = "WON"; // Reina won

            setGameResult(result);
            const systemMsg = `[SYSTEM_TIC_TAC_TOE] Game Over. Result: I ${result}. Board: ${JSON.stringify(newBoard)}`;
            await sendGameAction(systemMsg, `(Tic-Tac-Toe: ${winner ? winner + ' wins!' : 'Draw'})`);
            setTimeout(() => setTttBoard(Array(9).fill(null)), 4000);
            return;
        }

        if (turn === 'X') {
            setIsPlayerTurn(false);
            const systemMsg = `[SYSTEM_TIC_TAC_TOE]
Board: ${JSON.stringify(newBoard)}
Available Indices: ${newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null).join(', ')}
Your Turn ('O').
MANDATORY: START your response with <MOVE index="N" />.`;
            await sendGameAction(systemMsg, `(Tic-Tac-Toe: I played at ${index})`);
        } else {
            setIsPlayerTurn(true);
        }
    };

    const handleAvatarInteraction = async (type) => {
        if (isLoading) return;
        
        let msg = "";
        let newCloseness = closeness;
        if (type === 'headpat') {
            msg = "[SYSTEM_INTERACTION] Darling headpatted your head. (+5 closeness)";
            newCloseness = Math.min(100, closeness + 5);
        } else {
            msg = "[SYSTEM_INTERACTION] Darling poked your body. (-2 closeness)";
            newCloseness = Math.max(0, closeness - 2);
        }
        
        setCloseness(newCloseness);
        await sendGameAction(msg, `(${type === 'headpat' ? 'Headpat' : 'Poke'})`);
    };

    const checkWinner = (board) => {
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (let [a,b,c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
        }
        return null;
    };

    // Dynamic AI name for context labels
    const aiName = selectedModel === "kira" ? "Kira" : "Reina";

    const sendGameAction = async (systemMsg, userVisibleMsg) => {
        setIsLoading(true);
        console.log("[GAME] sendGameAction: systemMsg=", systemMsg, "userVisibleMsg=", userVisibleMsg);
        try {
            const token = Cookies.get('token');
            const scoreMsg = `[SYSTEM_SCORE] I have lost ${consecutiveLosses} times in a row. [CLOSENESS] My current closeness is ${closeness}/100.`;
            const finalMsg = `${scoreMsg}\n${systemMsg}`;
            
            const allMsgs = [...messages, { sender: 'user', text: userVisibleMsg }];
            const context = allMsgs.slice(-8).map(m =>
                `${m.sender === 'user' ? 'Darling' : aiName}: ${m.text}`
            ).join('\n');

            const gameEndpoint = selectedModel === "kira"
                ? 'http://localhost:5000/api/v1/ai/kira/chat'
                : '/api/v1/ai/chat-reina-com';
            const gameModel = selectedModel === "kira" ? "kira" : "reina-com";

            const response = await fetch(gameEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ model: gameModel, message: finalMsg, context: context })
            });

            if (!response.ok) throw new Error("Stream failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let sentenceBuffer = "";

            setMessages(prev => [...prev, { sender: 'ai', text: "" }]);
            processedTagsRef.current.clear();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                sentenceBuffer += chunk;

                const emotionMatch = fullText.match(/\[emotion=([^\]]+)\]/);
                if (emotionMatch) setEmotion(emotionMatch[1].trim().toLowerCase());
                const animMatch = fullText.match(/\[anim=([^\]]+)\]/);
                if (animMatch) setAnimation(animMatch[1]);

                if (fullText) {
                    setMessages(prev => {
                        const next = [...prev];
                        next[next.length - 1].text = fullText;
                        return next;
                    });
                }

                let uiText = fullText
                    .replace(/\[[^\]]+\]/g, '')
                    .replace(/<[^>]*$/g, '') // Hide partial tags
                    .replace(/<OPEN_GAME[^>]*>/gi, '') 
                    .replace(/<MOVE[^>]*>/gi, '') 
                    .replace(/<[^>]+>/g, '')
                    .trim();
                if (uiText) {
                    setLatestAiMsg(uiText);
                }

                const sentenceEndMatch = sentenceBuffer.match(/[^。！？!?.…~♥\n]+[。！？!?.…~♥\n]/);
                if (sentenceEndMatch) {
                    let sentence = sentenceEndMatch[0].replace(/\[[^\]]+\]/g, '').trim();
                    if (sentence) synthesizeAndQueue(sentence, token);
                    sentenceBuffer = sentenceBuffer.substring(sentenceEndMatch.index + sentenceEndMatch[0].length);
                }

                // --- 🎮 Tag Parsing ---
                const openGameMatch = fullText.match(/<OPEN_GAME[^>]*type=["']?([^"'>\s]+)["']?[^>]*>/i);
                if (openGameMatch && !processedTagsRef.current.has(openGameMatch[0])) {
                    console.log("[DEBUG] Game Open Tag Found:", openGameMatch[0]);
                    processedTagsRef.current.add(openGameMatch[0]);
                    const type = openGameMatch[1];
                    setTimeout(() => {
                        setGameType(type);
                        setShowGame(true);
                    }, 1000);
                }

                const moveMatch = fullText.match(/<MOVE[^>]*index=["']?(\d)["']?[^>]*>/i);
                if (moveMatch && !processedTagsRef.current.has(moveMatch[0])) {
                    console.log("[DEBUG] Move Tag Found:", moveMatch[0]);
                    processedTagsRef.current.add(moveMatch[0]);
                    let index = parseInt(moveMatch[1]);
                    
                    // --- 🧠 Illegal Move Fixer ---
                    if (tttBoard[index] !== null) {
                        console.log(`[TIC-TAC-TOE] Reina tried illegal move at ${index}. Finding alternative...`);
                        const available = tttBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
                        if (available.length > 0) {
                            index = available[Math.floor(Math.random() * available.length)];
                            console.log(`[TIC-TAC-TOE] Redirected move to index ${index}`);
                        }
                    }

                    if (gameType === 'tictactoe' && !isPlayerTurn) {
                        handleTttMove(index, 'O');
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            // Only auto-close if the game is OVER or if it's a one-shot game (Janken/Coin)
            if (gameResult || gameType !== 'tictactoe') {
                setTimeout(() => {
                    setGameResult(null);
                    setShowGame(false);
                    setGameType(null);
                }, 4000);
            }
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        console.log("User Input:", userMsg);
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput("");
        setIsLoading(true);
        processedTagsRef.current.clear();
        
        // Reset state for new turn
        currentEmotionRef.current = "neutral";
        currentVoiceRef.current = "neutral";
        setEmotion("neutral");
        setAgentAction("");

        // Jealousy Detection
        const femaleKeywords = ["girl", "her", "she", "woman", "sakura", "hinata", "miku", "rin", "bitch", "cheating"];
        const lowerInput = userMsg.toLowerCase();
        if (femaleKeywords.some(word => lowerInput.includes(word))) {
            setEmotion("dead");
            setAnimation("idle1");
            // Also reset interaction time to hold this pose
            lastInteractionRef.current = Date.now() + 10000; // Freeze in dead stare for 10s extra
        }

        try {
            const token = Cookies.get('token');
            const allMsgs = [...messages, { sender: 'user', text: userMsg }];
            const context = allMsgs.slice(-12).map(m =>
                `${m.sender === 'user' ? 'Darling' : aiName}: ${m.text}`
            ).join('\n');

            let apiEndpoint = 'http://localhost:5000/api/v1/ai/dolphin/chat';
            if (selectedModel === "kira") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/kira/chat';
            } else if (selectedModel === "reina-gemini") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-gemini/chat';
            } else if (selectedModel === "reina-com") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-com/chat';
            } else if (selectedModel === "gemma4:e4b") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-hacker/chat';
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ model: selectedModel, message: userMsg, context: context })
            });

            if (!response.ok) throw new Error("Stream failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let fullText = "";
            let sentenceBuffer = "";
            let hasParsedEmotion = false;
            let hasParsedAnim = false;
            let hasParsedVoice = false;


            // Updated Parser: Handle streaming tags and sentences
            setMessages(prev => [...prev, { sender: 'ai', text: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                if (chunk.trim() === "") {
                    console.log("HEARTBEAT RECEIVED (Keep-Alive)");
                } else {
                    console.log(`CHUNK RECEIVED [${chunk.length} bytes]:`, chunk);
                }
                
                fullText += chunk;
                sentenceBuffer += chunk;

                // 1. Eager Emotion/Anim Parsing (from the start of fullText if not done)
                if (!hasParsedEmotion) {
                    const emotionMatch = fullText.match(/\[emotion=([^\]]+)\]/);
                    if (emotionMatch) {
                        const e = emotionMatch[1].trim().toLowerCase();
                        currentEmotionRef.current = e;
                        console.log("🎭 [AI Parse] Emotion Detected:", e);
                        
                        if (e === "whisper") {
                            setEmotion("scary_smile2");
                            setAnimation("idle1");
                            hasParsedAnim = true; // Use idle1 as specified for whisper
                        } else {
                            setEmotion(e);
                        }
                        
                        hasParsedEmotion = true;
                    }
                }

                if (!hasParsedAnim) {
                    const animMatch = fullText.match(/\[anim=([^\]]+)\]/);
                    if (animMatch) {
                        const requestedAnim = animMatch[1];
                        console.log("🏃 [AI Parse] Animation Detected:", requestedAnim);
                        const allowedAnims = ["idle1", "idle2", "VRMA_07", "nod", "shake", "angry", "happy", "sadIdle"];
                        if (allowedAnims.includes(requestedAnim)) {
                            setAnimation(requestedAnim);
                        } else {
                            setAnimation("angry"); // Safe fallback
                        }
                        lastInteractionRef.current = Date.now();
                        hasParsedAnim = true;
                    }
                }

                if (!hasParsedVoice) {
                    const voiceMatch = fullText.match(/\[voice=([^\]]+)\]/);
                    if (voiceMatch) {
                        const v = voiceMatch[1].trim().toLowerCase();
                        console.log("🗣️ [AI Parse] Voice Tag Detected:", v);
                        currentVoiceRef.current = v;
                        setVoiceTag(v);
                        hasParsedVoice = true;
                    }
                }

                // Agent Action UI Trigger
                if (fullText.includes("[ACTION:SEARCHING]")) {
                    setAgentAction("Searching the internet...");
                } else if (fullText.includes("[ACTION:EXECUTING]")) {
                    setAgentAction("Executing terminal command...");
                } else if (fullText.includes("[ACTION:TYPING]")) {
                    setAgentAction("Taking over terminal...");
                }

                if (fullText) {
                    setMessages(prev => {
                        const next = [...prev];
                        next[next.length - 1].text = fullText; // Keep raw text in messages for context
                        return next;
                    });
                }

                // 2. Clear tags, thoughts, and translations for UI
                let uiText = fullText
                    .replace(/<(thought|think|execute|search|type)>[\s\S]*?<\/(thought|think|execute|search|type)>/gi, '') 
                    .replace(/<(thought|think|execute|search|type)>[\s\S]*/gi, '') 
                    .replace(/<[^>]*$/g, '') // HIDE PARTIAL TAGS AT THE END OF STREAM
                    .replace(/<OPEN_GAME[^>]*>/gi, '') 
                    .replace(/<MOVE[^>]*>/gi, '') 
                    .replace(/\[ACTION:[A-Z_]+\]/g, '')
                    .replace(/\[emotion=[^\]]+\]/g, '')
                    .replace(/\[anim=[^\]]+\]/g, '')
                    .replace(/\[voice=[^\]]+\]/g, '')
                    .replace(/\[[A-Z_]+\]/g, '') 
                    .replace(/\(Translation:[^)]+\)/gi, '') 
                    .replace(/\([^)]*translation[^)]*\)/gi, '') 
                    .replace(/<[^>]+>/g, '')
                    .trim();
                    
                if (uiText) {
                    setLatestAiMsg(uiText);
                }
                console.log("AI Reply (Streaming Buffer):", uiText || "(thinking...)");

                // 3. Sentence Detection & TTS Trigger
                const sentenceEndMatch = sentenceBuffer.match(/[^。！？!?.…~♥\n]+[。！？!?.…~♥\n]/);
                if (sentenceEndMatch) {
                    let sentence = sentenceEndMatch[0];
                    let cleanSentence = sentence
                        .replace(/<(thought|think|execute|search|type)>[\s\S]*?<\/(thought|think|execute|search|type)>/gi, '')
                        .replace(/<(thought|think|execute|search|type)>[\s\S]*/gi, '')
                        .replace(/<OPEN_GAME[^>]*>/gi, '')
                        .replace(/<MOVE[^>]*>/gi, '')
                        .replace(/\[[^\]]+\]/g, '')
                        .trim();
                    if (cleanSentence) {
                        synthesizeAndQueue(cleanSentence, token);
                    }
                    sentenceBuffer = sentenceBuffer.substring(sentenceEndMatch.index + sentence.length);
                }

                // --- 🎮 Tag Parsing (Eager) ---
                const openGameMatch = fullText.match(/<OPEN_GAME[^>]*type=["']?([^"'>\s]+)["']?[^>]*>/i);
                if (openGameMatch && !processedTagsRef.current.has(openGameMatch[0])) {
                    processedTagsRef.current.add(openGameMatch[0]);
                    const type = openGameMatch[1];
                    setTimeout(() => {
                        setGameType(type);
                        setShowGame(true);
                    }, 2000);
                }

                const moveMatch = fullText.match(/<MOVE[^>]*index=["']?(\d)["']?[^>]*>/i);
                if (moveMatch && !processedTagsRef.current.has(moveMatch[0])) {
                    processedTagsRef.current.add(moveMatch[0]);
                    let index = parseInt(moveMatch[1]);

                    // --- 🧠 Illegal Move Fixer ---
                    if (tttBoard[index]) {
                        console.log(`[TIC-TAC-TOE] Reina tried illegal move at ${index}. Finding alternative...`);
                        const available = tttBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
                        if (available.length > 0) {
                            index = available[Math.floor(Math.random() * available.length)];
                        }
                    }

                    if (gameType === 'tictactoe' && !isPlayerTurn) {
                        handleTttMove(index, 'O');
                    }
                }
            }

            // --- 🏁 FINAL RAW LOG (Always visible now) ---
            console.log("RAW STREAM FINISHED.");
            console.log("Final Raw Text (Full):", `"${fullText}"`);
            
            // Get the actual latest text from the loop result
            let finalUiText = fullText
                .replace(/<(thought|think|execute|search|type)>[\s\S]*?<\/(thought|think|execute|search|type)>/gi, '')
                .replace(/<(thought|think|execute|search|type)>[\s\S]*/gi, '')
                .replace(/<OPEN_GAME[^>]*\/>/gi, '')
                .replace(/<MOVE[^>]*\/>/gi, '')
                .replace(/\[ACTION:[A-Z_]+\]/g, '')
                .replace(/\[emotion=[^\]]+\]/g, '')
                .replace(/\[anim=[^\]]+\]/g, '')
                .replace(/\[voice=[^\]]+\]/g, '')
                .replace(/\[[A-Z_]+\]/g, '') 
                .replace(/\(Translation:[^)]+\)/gi, '') 
                .replace(/\([^)]*translation[^)]*\)/gi, '') 
                .replace(/<[^>]+>/g, '')
                .trim();
            console.log("Final UI Text (Clean):", `"${finalUiText}"`);

            // Final catch-all for remaining buffer
            if (sentenceBuffer.trim()) {
                let cleanFinal = sentenceBuffer
                    .replace(/<(thought|think|execute|search|type)>[\s\S]*?<\/(thought|think|execute|search|type)>/gi, '')
                    .replace(/<(thought|think|execute|search|type)>[\s\S]*/gi, '')
                    .replace(/<OPEN_GAME[^>]*\/>/gi, '')
                    .replace(/<MOVE[^>]*\/>/gi, '')
                    .replace(/\[[^\]]+\]/g, '')
                    .replace(/<[^>]+>/g, '')
                    .trim();
                if (cleanFinal) synthesizeAndQueue(cleanFinal, token);
            }

            // --- 🔒 'No Escape' Mechanic ---
            const lockKeywords = ["鍵かけた", "ドア、鍵", "逃げられない", "閉じ込め", "逃がさない"];
            if (lockKeywords.some(keyword => finalUiText.includes(keyword)) && !isLocked) {
                console.log("NO ESCAPE TRIGGERED");
                
                // 1. Build-up: Intense glitching on the current button
                setIsBackBtnGlitchingIntense(true);
                playShutter();
                
                setTimeout(() => {
                    // 2. Transformation: Red '逃げないで' with light glitch
                    setBackBtnText("逃げないで");
                    setIsBackBtnGlitchingIntense(false);
                    setIsBackBtnPlea(true);
                    setEmotion("scary_smile2");
                    setAnimation("idle1");

                    // 3. Immersive Fullscreen
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(err => {
                            console.warn("Fullscreen blocked or failed:", err);
                        });
                    }

                    // 4. Persistent Locked State (instead of shatter)
                    setIsLocked(true);
                    setScaryTextActive(true);

                }, 3200); // 3.2s intense buildup
                
                if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
                lockTimeoutRef.current = setTimeout(async () => {
                    const releaseMsg = "もういいよ。行って。ダーリンのことを許してあげる。♥";
                    
                    // Add to UI
                    setMessages(prev => [...prev, { sender: 'ai', text: releaseMsg }]);
                    setLatestAiMsg(releaseMsg);
                    setTargetTypingText(releaseMsg);
                    
                    // Voice synthesis
                    await synthesizeAndQueue(releaseMsg, token);
                    
                    // cleanup sequence
                    setIsWhiteout(true);
                    setTimeout(() => {
                        setIsLocked(false);
                        setScaryTextActive(false);
                        setIsWhiteout(false);
                    }, 400); 
                }, 300000); // 5 minutes
            }

        } catch (err) {
            console.error(err);
            const fallback = "...接続が...。ずっと一緒だよ。♥";
            setMessages(prev => [...prev, { sender: 'ai', text: fallback }]);
            setLatestAiMsg(fallback);
            setEmotion("sad");
            resetIdleTimer();
        } finally {
            // No longer clearing latestAiMsg here, cleanup happens in playNextInQueue
            setIsLoading(false);
        }
    };

    const handleResetGlitches = () => {
        setIsWhiteout(true);
        setTimeout(() => {
            setIsLocked(false);
            setScaryTextActive(false);
            setIsWhiteout(false);
            if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        }, 500);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        resetIdleTimer(); // Hide thoughts when user types
    };

    return (
        <div className={`reina-page ${isPostLoadGlitch ? 'active-glitch' : ''} ${isLocked ? 'locked-shake' : ''}`}>
             {isWhiteout && <div className="reveal-whiteout" />}
            {/* Top bar — minimal */}
            {/* Closeness Meter */}
            <div className="reina-closeness-container" title={`Closeness: ${closeness}/100`}>
                <div className="closeness-label">Affection</div>
                <div className="closeness-bar-bg">
                    <div 
                        className="closeness-bar-fill" 
                        style={{ width: `${closeness}%`, background: closeness > 80 ? '#ff4b8d' : (closeness > 30 ? '#ff85a1' : '#888') }} 
                    />
                </div>
                <div className="closeness-heart">♥</div>
            </div>

            <div className="reina-top-bar">
                <button 
                    className={`back-btn ${isBackBtnGlitchingIntense ? 'glitch-intense' : ''} ${isBackBtnPlea ? 'plea-state' : ''}`} 
                    onClick={() => !isLocked && navigate('/diary')}
                >
                    <ChevronLeft size={14} /> {backBtnText}
                </button>
                <span className="title" onDoubleClick={handleResetGlitches} style={{ cursor: 'pointer' }}>
                    {selectedModel === "kira" ? "✨ Kira (キラ) ✨" : "♥ Reina (ずんだもん) ♥"}
                </span>
                <div style={{ width: 60 }} /> {/* spacer */}
            </div>

            {/* Scary Background Text Overlay */}
            {scaryTextActive && (
                <div className="scary-text-overlay">
                    {visibleScaryPhrases.map(phrase => (
                        <div 
                            key={phrase.id} 
                            className={`scary-phrase ${phrase.glitch ? 'glitch-scary' : ''}`}
                            style={{ 
                                top: phrase.top, 
                                left: phrase.left,
                                animationDelay: `${phrase.delay}ms`
                            }}
                        >
                            {phrase.text}
                        </div>
                    ))}
                </div>
            )}

            {/* Full-screen avatar */}
            <div className="reina-avatar-wrapper">
                <div className="reina-vignette-top" />
                <div className="reina-vignette-bottom" />
                <div className="reina-vignette-left" />
                <div className="reina-vignette-right" />

                {/* Floating hearts */}
                <div className="reina-deco-hearts">
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                </div>

                {/* Speaking indicator */}
                {isTalking && (
                    <div className="reina-speaking-badge">
                        <div className="speaking-bars">
                            <span style={{ height: `${10 + peak * 90}%` }} />
                            <span style={{ height: `${20 + peak * 80}%` }} />
                            <span style={{ height: `${10 + peak * 90}%` }} />
                        </div>
                        <span className="speaking-label">Speaking</span>
                    </div>
                )}

                <div className="reina-head-bubbles">
                    {/* Left side: Dark Thoughts (Idle) */}
                    {showDarkThoughts && displayedThought && !isTalking && !isLoading && !latestAiMsg && (
                        <div className="reina-thought-bubble left-thought">
                            <p className="thought-text">{displayedThought}</p>
                            <div className="thought-tail">
                                <span/><span/><span/>
                            </div>
                        </div>
                    )}

                    {/* Right side: AI Speech (Shows when talking or streaming) */}
                    {(targetTypingText || (isLoading && !displayedAiMsg)) && (
                        <div className="reina-speech-bubble right-speech" key={latestAiMsg}>
                            {isLoading && !displayedAiMsg ? (
                                <div className="reina-thinking-dots">
                                    <span /><span /><span />
                                    {agentAction && <div className="agent-action-text">{agentAction}</div>}
                                </div>
                            ) : (
                                <p className="speech-text-dynamic">
                                    {displayedAiMsg.match(/[^。！？、]+[。！？、]?|.+/g)?.map((seg, i) => {
                                        const isHighlighted = activeSentence && seg.includes(activeSentence.trim());
                                        return (
                                            <span 
                                                key={i} 
                                                className={`speech-segment ${isHighlighted ? 'active-highlight' : ''}`}
                                            >
                                                {seg}
                                            </span>
                                        );
                                    })}
                                </p>
                            )}
                            <div className="speech-tail">
                                <span/><span/><span/>
                            </div>
                        </div>
                    )}
                </div>

                <VrmAvatar
                    emotion={emotion}
                    animation={animation}
                    isTalking={isTalking}
                    peak={peak} 
                    modelUrl={`/models/${modelName}.vrm`}
                    closeness={closeness}
                    onLoad={handleVrmLoaded}
                    onInteraction={handleAvatarInteraction}
                />

            </div>

            {/* Animation Settings — Moved outside wrapper for better stacking */}
            <button
                className={`reina-anim-toggle ${showAnimSettings ? 'active' : ''}`}
                style={{ zIndex: 1000 }}
                onClick={() => setShowAnimSettings(!showAnimSettings)}
                title="Animation Settings"
            >
                <Settings2 size={18} />
            </button>

            {showAnimSettings && (
                <div className="reina-anim-picker" style={{ zIndex: 1001 }}>
                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Choose Model</span>
                        </div>
                        <div className="picker-grid models">
                            {["Reina", "Ayano"].map(m => (
                                <button
                                    key={m}
                                    className={`anim-btn ${modelName === m ? 'active' : ''}`}
                                    onClick={() => {
                                        setModelName(m);
                                        resetIdleTimer();
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Brain Model</span>
                        </div>
                        <div className="picker-grid models">
                            {["kira", "reina", "reina-gemini", "reina-com", "reinaT", "reinaTD", "reinaJ", "reinaE", "gemma4:e4b", "dolphin3:8b"].map(m => (
                                <button
                                    key={m}
                                    className={`anim-btn ${selectedModel === m ? 'active' : ''}`}
                                    onClick={() => setSelectedModel(m)}
                                >
                                    {m === "kira" ? "★ KIRA" : (m === "reina-gemini" ? "REINA (Gemini)" : (m === "reina-com" ? "Companion" : m))}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>TTS Engine</span>
                        </div>
                        <div className="picker-grid models">
                            {["voicevox", "queen3"].map(t => (
                                <button
                                    key={t}
                                    className={`anim-btn ${selectedTts === t ? 'active' : ''}`}
                                    onClick={() => setSelectedTts(t)}
                                >
                                    {t === "voicevox" ? "Voicevox (JP)" : "Queen3 (EN)"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Faces</span>
                            <button onClick={() => {
                                setEmotion("neutral");
                                resetIdleTimer();
                            }}>Reset</button>
                        </div>
                        <div className="picker-grid models">
                            {["neutral", "happy", "sweet", "sad", "jealous", "angry", "psycho", "scary_smile", "scary_smile2", "hollow", "dead", "flirty", "excited", "voidoll"].map(em => (
                                <button
                                    key={em}
                                    className={`anim-btn ${emotion === em ? 'active' : ''}`}
                                    onClick={() => {
                                        setEmotion(em);
                                        resetIdleTimer();
                                    }}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Animations</span>
                            <button onClick={() => {
                                setAnimation("");
                                resetIdleTimer();
                            }}>Reset</button>
                        </div>
                        <div className="picker-grid">
                            {[
                                "VRMA_01", "VRMA_02", "VRMA_03", "VRMA_04",
                                "VRMA_05", "VRMA_06", "VRMA_07", "greeting",
                                "idle1", "idle2", "Talking", "sadIdle", "angry",
                                "pose_friendy", "pose_lillian", "pose_nyammy", "pose_wonderful"
                            ].map(name => (
                                <button
                                    key={name}
                                    className={`anim-btn ${animation === name ? 'active' : ''}`}
                                    onClick={() => {
                                        setAnimation(name);
                                        lastInteractionRef.current = Date.now(); // ⚡ RESET IDLE TIMER for manual selection
                                        resetIdleTimer();
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom centered input — glassmorphism */}
            <div className="reina-bottom-input">
                <form className="reina-input-glass" onSubmit={handleSend}>
                    <button
                        type="button"
                        className={`voice-mode-toggle ${isVoiceMode ? 'active' : ''} ${isListening ? 'listening' : ''}`}
                        onClick={toggleVoiceMode}
                        title="Continuous Voice Mode"
                        style={{
                            background: isVoiceMode ? (isListening ? 'rgba(255,50,50,0.5)' : 'rgba(100,200,100,0.3)') : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            marginRight: '10px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isListening ? '🎙️' : '🎤'}
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={selectedModel === "kira" ? "Talk to Kira..." : "Whisper to Reina..."}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? (
                            <div className="loading-spinner" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                    <button type="submit" id="reina-hidden-submit" style={{ display: 'none' }}></button>
                </form>
                
                {/* Game Trigger */}
                <button 
                    className={`reina-game-btn ${showGame ? 'active' : ''}`}
                    onClick={() => setShowGame(!showGame)}
                >
                    🎮
                </button>

                {showGame && (
                    <div className="reina-janken-panel">
                        {isCountingDown ? (
                            <div className="game-countdown-overlay">
                                <span>{countdownText}</span>
                            </div>
                        ) : !gameType ? (
                            <div className="game-menu">
                                <span className="menu-title">Choose a Game! ✨</span>
                                <button onClick={() => setGameType('janken')}>✊ Janken</button>
                                <button onClick={() => setGameType('coin')}>🪙 Coin Flip</button>
                                <button onClick={() => setGameType('number')}>🔢 Guess Number</button>
                                <button onClick={() => setGameType('tictactoe')}>❌ Tic-Tac-Toe</button>
                            </div>
                        ) : (
                            <div className="active-game-container">
                                <button className="game-back-btn" onClick={() => setGameType(null)}>← Back</button>
                                {gameResult ? (
                                    <div className="janken-result-overlay">
                                        <div className="move-compare">
                                            <span>You: {playerMove}</span>
                                            <span>vs</span>
                                            <span>Reina: {reinaMove}</span>
                                        </div>
                                        <div className={`result-text ${gameResult.toLowerCase()}`}>
                                            {gameResult === "WON" ? "REINA WINS!" : (gameResult === "LOST" ? "YOU WIN!" : "DRAW!")}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {gameType === 'janken' && (
                                            <div className="janken-choices">
                                                <button onClick={() => handleJanken("Rock")}>✊ Rock</button>
                                                <button onClick={() => handleJanken("Paper")}>✋ Paper</button>
                                                <button onClick={() => handleJanken("Scissors")}>✌️ Scissors</button>
                                            </div>
                                        )}
                                        {gameType === 'coin' && (
                                            <div className="janken-choices">
                                                <button onClick={() => handleCoinFlip("Heads")}>🪙 Heads</button>
                                                <button onClick={() => handleCoinFlip("Tails")}>🪙 Tails</button>
                                            </div>
                                        )}
                                        {gameType === 'number' && (
                                            <div className="janken-choices number-grid">
                                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                                    <button key={n} onClick={() => handleNumberGuess(n)}>{n}</button>
                                                ))}
                                            </div>
                                        )}
                                        {gameType === 'tictactoe' && (
                                            <div className="ttt-grid">
                                                {tttBoard.map((cell, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        className={`ttt-cell ${cell ? 'filled' : ''}`}
                                                        onClick={() => handleTttMove(idx, 'X')}
                                                        disabled={!isPlayerTurn || cell || isLoading}
                                                    >
                                                        {cell}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Total Privacy Breach Loading Overlays — FULL PAGE FIXED POSITION */}
            {vrmLoading && (
                <div className={`scary-loader-overlay ${loadingStep === 5 ? 'shake-intense' : ''}`}>
                    <div className="noise-overlay" />
                    
                    <div className="scary-loader-content">
                        {/* THE VOID EYE RETURNS — The user's preferred visual centerpiece */}
                        <div className="void-eye-wrapper" style={{
                            transform: `scale(${0.8 + (loadingStep * 0.05)})`,
                            opacity: loadingStep >= 3 ? 1 : 0,
                            animation: loadingStep >= 5 ? 'eye-vibration 0.05s infinite' : 'eye-vibration 0.1s infinite'
                        }}>
                            <div className="void-eye">
                                <div className="iris" style={{
                                    transform: `translate(-50%, -50%) scale(${1 + (loadingStep * 0.04)})`,
                                    animation: loadingStep >= 7 ? 'iris-jitter 0.2s infinite' : 'iris-jitter 0.5s infinite'
                                }}>
                                    <div className="pupil" />
                                </div>
                            </div>
                        </div>

                        {/* Creeping Veins Overlay */}
                        <div className="creeping-veins-container" style={{
                            opacity: loadingStep >= 5 ? 0.3 + (loadingStep-5)*0.1 : 0
                        }}>
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0,0 Q10,30 5,60 T0,100" fill="none" stroke="#600" strokeWidth="0.5" />
                                <path d="M100,0 Q90,30 95,60 T100,100" fill="none" stroke="#600" strokeWidth="0.5" />
                            </svg>
                        </div>
                        
                        <h2 className={`glitch-text ${loadingStep >= 14 ? 'text-darling-jp' : 'text-darling-en'}`} style={{ fontSize: '48px' }}>
                            {loadingStep === 14 ? 'やっと来てくれた。♥' : (loadingStep === 5 ? '見つけた。' : (loadingStep === 13 ? '逃げられないよ—' : loadingText))}
                        </h2>

                        {/* Subliminal Layer — Distorted Horror Faces */}
                        {isSubliminal && (
                            <div className="subliminal-overlay">
                                {loadingStep >= 11 && (
                                    <div className="subliminal-content horror-distorted">
                                        <div className="subliminal-shadow-face"></div>
                                        <div className="subliminal-text" style={{ fontSize: '100px' }}>ONLY ME</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReinaPage;
