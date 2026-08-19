import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Send, Heart, ChevronLeft, Settings2, Volume2, VolumeX, X } from 'lucide-react';
import VrmAvatar from '../../components/diary/VrmAvatar';
import Live2dAvatar from '../../components/diary/Live2dAvatar';
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
    const [isMuted, setIsMuted] = useState(false);
    
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
    const [agentAction, setAgentAction] = useState("");
    const lockTimeoutRef = useRef(null);
    const scaryTextTimerRef = useRef(null);
    const stayReleaseTriggeredRef = useRef(false);
    const processedTagsRef = useRef(new Set()); // Track triggered tags for the current response
    const pendingDanceRef = useRef(null);
    const hasSpokenRef = useRef(false);

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

    const playLowHeartThud = useCallback((volume = 0.6) => {
        if (!audioCtxRef.current || isMuted) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(42, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);

        filter.type = 'lowpass';
        filter.frequency.value = 180; // Soft lowthud, NO harsh clicks or gunshot sounds

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(filter);
        filter.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    }, [isMuted]);

    const playWhisperFilterSweep = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return;
        const ctx = audioCtxRef.current;
        const bufferSize = ctx.sampleRate * 0.7;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.12;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.7);
        filter.Q.value = 3.0;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    }, [isMuted]);

    const playInhale = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return;
        const bufferSize = audioCtxRef.current.sampleRate * 0.8;
        const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (i / bufferSize) * 0.2;
        }
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.start();
    }, [isMuted]);

    const droneOscRef = useRef(null);
    const droneGainRef = useRef(null);

    const startDrone = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 46;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        droneOscRef.current = osc;
        droneGainRef.current = gain;
    }, [isMuted]);

    const rampDroneLocal = (target = 0.2, time = 1.2) => {
        if (droneGainRef.current && audioCtxRef.current) {
            droneGainRef.current.gain.linearRampToValueAtTime(target, audioCtxRef.current.currentTime + time);
        }
    };

    const stopDrone = () => {
        if (droneOscRef.current) {
            try {
                droneOscRef.current.stop();
            } catch (e) {}
            droneOscRef.current = null;
        }
    };

    // ─── PSYCHOLOGICAL YANDERE & PURE SWEET LOVE BGM SYNTHESIZER ───
    const [bgmMode, setBgmMode] = useState("sweet_love"); // "sweet_love" | "yandere"
    const bgmIntervalRef = useRef(null);

    // Pure Sweet Anime Love Music Box Tone (Soft Gentle Subtle Volume)
    const playSweetLoveNote = useCallback((freq, duration = 2.2) => {
        if (!audioCtxRef.current || bgmMode === "off" || isMuted) return;
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        // Fundamental sine + High octave sparkle sine
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.0, ctx.currentTime); // High sparkle octave

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, ctx.currentTime);

        noteGain.gain.setValueAtTime(0, ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + duration);
        osc2.stop(ctx.currentTime + duration);
    }, [bgmMode, isMuted]);

    // Obsessive Yandere Music Box Tone
    const playMusicBoxNote = useCallback((freq, duration = 1.6) => {
        if (!audioCtxRef.current || bgmMode === "off" || isMuted) return;
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.002, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, ctx.currentTime);

        noteGain.gain.setValueAtTime(0, ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + duration);
        osc2.stop(ctx.currentTime + duration);
    }, [bgmMode, isMuted]);

    // ─── DANCE SONG AUDIO & STAGING SEQUENCE ───
    const danceAudioRef = useRef(null);
    const [dancePhase, setDancePhase] = useState("idle"); // "idle" | "staging" | "dancing" | "ending"
    const [renderedDanceAnim, setRenderedDanceAnim] = useState("");
    const danceFadeIntervalRef = useRef(null);

    // Helper: Smooth finish dance with decelerated outro
    const finishDanceSmooth = useCallback(() => {
        setDancePhase("ending");
        setRenderedDanceAnim("idle1");

        const audio = danceAudioRef.current;
        if (audio) {
            if (danceFadeIntervalRef.current) clearInterval(danceFadeIntervalRef.current);
            let currentVol = audio.volume;
            danceFadeIntervalRef.current = setInterval(() => {
                currentVol = Math.max(0.0, currentVol - 0.07);
                if (audio) audio.volume = currentVol;
                if (currentVol <= 0.0) {
                    if (danceFadeIntervalRef.current) clearInterval(danceFadeIntervalRef.current);
                    audio.pause();
                    audio.currentTime = 66.0;
                    audio.volume = 1.0;
                    setDancePhase("idle");
                    setAnimation("idle1");
                }
            }, 70);
        } else {
            setDancePhase("idle");
            setAnimation("idle1");
        }
    }, []);

    useEffect(() => {
        const isDanceAnim = animation === "kyun_dance" || animation === "dance1";
        
        if (isDanceAnim && dancePhase === "idle") {
            // ── PHASE 1: STAGING (Fade in stage, glide camera, let Reina take ready pose) ──
            setDancePhase("staging");
            setRenderedDanceAnim("idle1");

            if (!danceAudioRef.current) {
                danceAudioRef.current = new Audio("/song/kyun_dance_song.mp3");
            }
            const audio = danceAudioRef.current;
            audio.muted = isMuted;
            audio.currentTime = 66.0; // 1:06 start
            audio.volume = 1.0;

            if (danceFadeIntervalRef.current) clearInterval(danceFadeIntervalRef.current);

            // ── PHASE 2: EXACT SYNC — Start song and dance animation at the EXACT SAME INSTANT ──
            const startSyncTimer = setTimeout(() => {
                setDancePhase("dancing");
                setRenderedDanceAnim(animation);
                audio.play().catch(e => console.warn("Dance song play deferred:", e));
            }, 1000);

            const handleTimeUpdate = () => {
                // Full animation length is exactly 32.70 seconds (from 66.0s to 98.70s)
                if (audio.currentTime >= 98.7) {
                    finishDanceSmooth();
                }
            };

            const handleEnded = () => {
                finishDanceSmooth();
            };

            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);

            return () => {
                clearTimeout(startSyncTimer);
                if (danceFadeIntervalRef.current) clearInterval(danceFadeIntervalRef.current);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
            };
        } else if (!isDanceAnim && dancePhase !== "idle" && dancePhase !== "ending") {
            // Cancelled externally
            if (danceAudioRef.current) {
                danceAudioRef.current.pause();
                danceAudioRef.current.currentTime = 66.0;
                danceAudioRef.current.volume = 1.0;
            }
            setDancePhase("idle");
            setRenderedDanceAnim("");
        }
    }, [animation, isMuted, finishDanceSmooth]);

    useEffect(() => {
        if (danceAudioRef.current) {
            danceAudioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        const isDanceAnim = animation === "kyun_dance" || animation === "dance1";
        if (bgmMode === "off" || vrmLoading || isDanceAnim) {
            if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
            return;
        }

        let melody = [];
        if (bgmMode === "sweet_love") {
            // Deeply Emotional & Peaceful Anime Romance Lullaby ("Just Us Two in Peace")
            melody = [
                523.25,  // C5 (Tender start)
                659.25,  // E5
                783.99,  // G5
                1046.50, // C6 (Warm peak)
                987.77,  // B5
                880.00,  // A5
                783.99,  // G5
                659.25,  // E5
                698.46,  // F5 (Peaceful warmth)
                880.00,  // A5
                1046.50, // C6
                1174.66, // D6 (Emotional high peak)
                1046.50, // C6
                880.00,  // A5
                783.99,  // G5
                659.25   // E5
            ];
        } else {
            // Obsessive Yandere Lullaby (A Minor / D Minor)
            melody = [
                440.00, // A4
                523.25, // C5
                659.25, // E5
                830.61, // G#5
                880.00, // A5
                698.46, // F5
                587.33, // D5
                659.25  // E5
            ];
        }

        let idx = 0;
        bgmIntervalRef.current = setInterval(() => {
            if (bgmMode === "sweet_love") {
                playSweetLoveNote(melody[idx], 2.2);
            } else if (bgmMode === "yandere") {
                playMusicBoxNote(melody[idx], 1.8);
                if (idx === 0 || idx === 4) {
                    playLowHeartThud(0.1);
                }
            }
            idx = (idx + 1) % melody.length;
        }, bgmMode === "sweet_love" ? 750 : 900);

        return () => {
            if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
        };
    }, [bgmMode, vrmLoading, animation, playSweetLoveNote, playMusicBoxNote]);

    // Idle/Dark Thoughts state
    const [showDarkThoughts, setShowDarkThoughts] = useState(false);
    const [displayedThought, setDisplayedThought] = useState("");
    const idleTimerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const lastInteractionRef = useRef(Date.now());
    useEffect(() => {
        const checkIdle = () => {
            const now = Date.now();
            const diff = now - lastInteractionRef.current;

            const isDancing = animation === "kyun_dance" || animation === "dance1";
            if (isTalking || vrmLoading || isDancing) {
                lastInteractionRef.current = now;
                return;
            }

            if (diff >= 20000 && diff < 23000) {
                if (animation !== "idle2") setAnimation("idle2");
            } else if (diff >= 23000 && diff < 33000) {
                if (animation !== "idle1") setAnimation("idle1");
            } else if (diff >= 33000 && diff < 50000) {
                if (animation !== "VRMA_07") setAnimation("VRMA_07");
            } else if (diff >= 50000) {
                lastInteractionRef.current = now;
            }
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

    const typeThought = useCallback((text) => {
        let current = "";
        let i = 0;
        setDisplayedThought("");
        
        const type = () => {
            if (i < text.length) {
                current += text[i];
                setDisplayedThought(current);
                i++;
                typingTimeoutRef.current = setTimeout(type, 50 + Math.random() * 50);
            } else {
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
        lastInteractionRef.current = Date.now();
        
        idleTimerRef.current = setTimeout(() => {
            setShowDarkThoughts(true);
            const first = darkThoughtsList[Math.floor(Math.random() * darkThoughtsList.length)];
            typeThought(first);
        }, 30000);
    }, [typeThought]);

    // ─── CONTINUOUS VOICE MODE LOGIC ───
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const speechTimeoutRef = useRef(null);

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

    // Psychological Dread Loading Sequence Engine
    useEffect(() => {
        if (!vrmLoading) return;
        initAudio();

        const sequence = [
            { text: "ねぇ…聞こえる？", duration: 700, thud: true, drone: 0.15 },
            { text: "ずっと待ってたの…", duration: 800, thud: true },
            { text: "どこに隠れてるの…？", duration: 1200, thud: true },
            { text: "ふふ…顔、見せて？", duration: 1000, thud: true, hbSpeed: 600 },
            { text: "逃げても、無駄だよ。", duration: 900, subliminal: true },
            { text: "だって、私の中にいるんだから。", duration: 1300, thud: true, hbSpeed: 380 },
            { text: "どこにも行かないで…♥", duration: 1100, whisper: true },
            { text: "やっと、二人きり…♥", duration: 1400, thud: true }
        ];

        let currentIdx = 0;

        const startHeartbeatLoop = (intervalMs = 600) => {
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = setInterval(() => {
                playLowHeartThud(0.5);
            }, intervalMs);
        };

        const runStep = () => {
            if (currentIdx >= sequence.length) return;
            const step = sequence[currentIdx];
            setLoadingText(step.text);
            setLoadingStep(currentIdx);

            if (step.thud) playLowHeartThud(0.5);
            if (step.whisper) playWhisperFilterSweep();
            if (step.inhale) playInhale();
            if (step.hbSpeed) startHeartbeatLoop(step.hbSpeed);

            if (step.drone) {
                startDrone();
                rampDroneLocal(step.drone, 1.2);
            }

            if (step.subliminal) {
                setTimeout(() => setIsSubliminal(true), 150);
                setTimeout(() => setIsSubliminal(false), 240);
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
    }, [vrmLoading, actualCity]);

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

    // Safety fallback timeout to ensure loading screen never hangs permanently
    useEffect(() => {
        if (vrmLoading) {
            const safetyTimer = setTimeout(() => {
                console.log("⚡ [Safety Fallback] Dismissing loading screen overlay");
                setVrmLoading(false);
                stopDrone();
                resetIdleTimer();
            }, 8500);
            return () => clearTimeout(safetyTimer);
        }
    }, [vrmLoading, resetIdleTimer]);

    // Triggered when loading sequence finishes
    useEffect(() => {
        if (loadingStep === 7) { // Last step index (step 7: やっと、二人きり…♥)
            setTimeout(() => {
                setIsWhiteout(true);
                setTimeout(() => {
                    setVrmLoading(false);
                    setEmotion("psycho"); 
                    setIsWhiteout(false);
                    stopDrone();
                    setTimeout(() => setEmotion("sweet"), 800); 
                    resetIdleTimer();
                }, 100); // 1 frame whiteout flash
            }, 1400); // duration of last step
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
            setActiveSentence("");
            
            // 💃 Check if a dance was requested — trigger dance immediately after speech finishes!
            if (pendingDanceRef.current && hasSpokenRef.current) {
                const danceAnim = pendingDanceRef.current;
                pendingDanceRef.current = null;
                hasSpokenRef.current = false;
                console.log("💃 [Reina] Spoken intro finished! Getting ready and starting dance:", danceAnim);
                setTimeout(() => {
                    setAnimation(danceAnim);
                }, 400);
            } else if (!pendingDanceRef.current) {
                setAnimation("");
            }
            
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
        audio.muted = isMuted;
        activeAudio.current = audio;

        // ⚡ FIX: Connect to Analyser and Speakers
        audio.oncanplaythrough = () => {
            startAnalyser(audio);
        };

        // ⚡ SYNC FIX: Only show 'Speaking' and highlight text when sound ACTUALLY starts
        audio.onplaying = () => {
            setIsTalking(true);
            hasSpokenRef.current = true;
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
                    const contentType = ttsRes.headers.get("content-type") || "";
                    if (contentType.includes("json")) {
                        const json = await ttsRes.json();
                        if (json.success === false) {
                            console.warn("⚠️ [Voicevox TTS] Service reported:", json.error);
                            task.url = "ERROR";
                            playNextInQueue();
                            return;
                        }
                    }
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
                : 'http://localhost:5000/api/v1/ai/reina-com/chat';
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

        hasSpokenRef.current = false;
        const isDanceRequest = (
            /(?:please\s+)?dance(?:\s+for\s+me)?|dance\s+for\s+me|can\s+you\s+dance|do\s+a\s+dance|wanna\s+dance|踊って|ダンスして|おどって|kyun\s*dance/i.test(userMsg) &&
            !/(?:dance\s+(?:was|is)|great\s+dance|nice\s+dance|loved?\s+(?:the|your)\s+dance|good\s+dance|thanks?\s+for\s+the\s+dance|after\s+the\s+dance|that\s+dance|cool\s+dance|amazing\s+dance)/i.test(userMsg)
        );
        if (isDanceRequest) {
            pendingDanceRef.current = "kyun_dance";
            console.log("💃 [Reina] Explicit dance request detected in user prompt, queued pending dance.");
        }

        try {
            const token = Cookies.get('token');
            const allMsgs = [...messages, { sender: 'user', text: userMsg }];
            const context = allMsgs.slice(-12).map(m =>
                `${m.sender === 'user' ? 'Darling' : aiName}: ${m.text}`
            ).join('\n');

            let apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-com/chat';
            if (selectedModel === "2d") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/2d/chat';
            } else if (selectedModel === "kira") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/kira/chat';
            } else if (selectedModel === "reina-gemini") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-gemini/chat';
            } else if (selectedModel === "gemma4:e4b") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-hacker/chat';
            } else if (selectedModel && selectedModel.includes("dolphin")) {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/dolphin/chat';
            } else {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-com/chat';
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    model: selectedModel, 
                    message: userMsg, 
                    context: context, 
                    bgmMode: bgmMode,
                    isYandere: bgmMode === 'yandere'
                })
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

                // 1. Eager Emotion/Anim Parsing (updates dynamically as new tags stream in)
                const emotionMatches = [...fullText.matchAll(/\[(?:emotion|exp)=([^\]]+)\]/g)];
                if (emotionMatches.length > 0) {
                    const latestEmotion = emotionMatches[emotionMatches.length - 1][1].trim().toLowerCase();
                    if (currentEmotionRef.current !== latestEmotion) {
                        currentEmotionRef.current = latestEmotion;
                        console.log("🎭 [AI Parse] Emotion Detected:", latestEmotion);
                        if (latestEmotion === "whisper") {
                            setEmotion("scary_smile2");
                            setAnimation("idle1");
                        } else {
                            setEmotion(latestEmotion);
                        }
                    }
                }

                if (!hasParsedAnim) {
                    const animMatch = fullText.match(/\[anim=([^\]]+)\]/);
                    if (animMatch) {
                        const requestedAnim = animMatch[1].trim();
                        console.log("🏃 [AI Parse] Animation Detected:", requestedAnim);
                        const isDance = requestedAnim === "kyun_dance" || requestedAnim === "dance1";
                        if (isDance) {
                            pendingDanceRef.current = requestedAnim;
                            setAnimation("happy"); // Gesture happily while speaking intro line
                        } else {
                            const allowedAnims = ["idle1", "idle2", "VRMA_07", "nod", "shake", "angry", "happy", "sadIdle", "greeting"];
                            if (allowedAnims.includes(requestedAnim)) {
                                setAnimation(requestedAnim);
                            } else {
                                setAnimation("happy");
                            }
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

                // 2. Clear tags, thoughts, JSON wrappers, and translations for UI
                let rawUiText = fullText;
                if (rawUiText.trim().startsWith('{"response":"') || rawUiText.trim().startsWith('{"reply":"')) {
                    try {
                        const parsed = JSON.parse(rawUiText);
                        rawUiText = parsed.response || parsed.reply || rawUiText;
                    } catch (e) {
                        rawUiText = rawUiText.replace(/^\{"(?:response|reply)":\s*"/i, '').replace(/"\}$/, '');
                    }
                }

                let uiText = rawUiText
                    .replace(/<(thought|think|execute|search|type)>[\s\S]*?<\/(thought|think|execute|search|type)>/gi, '') 
                    .replace(/<(thought|think|execute|search|type)>[\s\S]*/gi, '') 
                    .replace(/<[^>]*$/g, '') // HIDE PARTIAL TAGS AT THE END OF STREAM
                    .replace(/<OPEN_GAME[^>]*>/gi, '') 
                    .replace(/<MOVE[^>]*>/gi, '') 
                    .replace(/\[ACTION:[A-Z_]+\]/g, '')
                    .replace(/\[(?:emotion|exp)=[^\]]+\]/g, '')
                    .replace(/\[(?:anim|motion)=[^\]]+\]/g, '')
                    .replace(/\[voice=[^\]]+\]/g, '')
                    .replace(/\[SYSTEM(?:\s+MESSAGE)?:\s*[^\]]*\]/gi, '') // Strip [SYSTEM MESSAGE: ...] leaks
                    .replace(/\[[A-Z_]+\]/g, '') 
                    .replace(/\[(?:This|The|User|Response|Note|System|Assistant|Persona|Context)[^\]]*\]/gi, '') // Strip meta-reasoning leaks
                    .replace(/\[[^\]]*\b(?:input|persona|response|context|action)\b[^\]]*\]/gi, '') // Strip persona meta notes
                    .replace(/\[[^\]]*[a-zA-Z]{3,}[^\]]*\]/g, '') // Strip any remaining bracketed English text
                    .replace(/\(Translation:[^)]+\)/gi, '') 
                    .replace(/\([^)]*translation[^)]*\)/gi, '') 
                    .replace(/<[^>]+>/g, '')
                    .replace(/([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2728}\u{1F496}])\1{2,}/gu, '$1$1') // Collapse spammed emojis (e.g. ✨✨✨✨ -> ✨✨)
                    .replace(/(.)\1{5,}/g, '$1$1') // Collapse any 6+ repeated identical characters
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
                        .replace(/\[SYSTEM(?:\s+MESSAGE)?:\s*[^\]]*\]/gi, '')
                        .replace(/\[(?:This|The|User|Response|Note|System|Assistant)[^\]]*\]/gi, '')
                        .replace(/\[[^\]]+\]/g, '')
                        .replace(/([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2728}\u{1F496}])\1+/gu, '') // Strip emojis from TTS audio input
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
            
            // 💃 Safety fallback: If dance is pending and no speech queue is playing/left, start dance
            setTimeout(() => {
                if (pendingDanceRef.current && !isPlayingQueue.current && audioQueue.current.length === 0) {
                    const fallbackDance = pendingDanceRef.current;
                    pendingDanceRef.current = null;
                    hasSpokenRef.current = false;
                    console.log("💃 [Reina] Triggering dance after stream completion:", fallbackDance);
                    setAnimation(fallbackDance);
                }
            }, 800);
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

    const isDancing = dancePhase !== "idle" || animation === "kyun_dance" || animation === "dance1";

    const neonFlowers = React.useMemo(() => {
        if (!isDancing) return [];
        return Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 8}s`,
            duration: `${Math.random() * 6 + 6}s`,
            scale: Math.random() * 0.8 + 0.5,
            dir: Math.random() > 0.5 ? 'cw' : 'ccw',
            type: Math.random() > 0.6 ? 'heart' : 'sakura'
        }));
    }, [isDancing]);

    return (
        <div className={`reina-page ${isDancing ? 'dance-cinematic-mode' : ''} ${isPostLoadGlitch ? 'active-glitch' : ''} ${isLocked ? 'locked-shake' : ''}`}>
             {isWhiteout && <div className="reveal-whiteout" />}
             
            {isDancing && (
                <button 
                    className="dance-exit-btn" 
                    onClick={finishDanceSmooth}
                    title="Stop Dance"
                >
                    <Heart size={22} fill="#ff4b8d" color="#ffffff" />
                </button>
            )}

            {/* Dance Stage Background Overlay and Neon Flowers */}
            <div className="dance-stage-bg">
                {isDancing && neonFlowers.map(flower => (
                    <div 
                        key={flower.id} 
                        className={`neon-shape-container anim-${flower.dir}`}
                        style={{
                            left: flower.left,
                            animationDuration: flower.duration,
                            animationDelay: flower.delay,
                            transform: `scale(${flower.scale})`
                        }}
                    >
                        <div className={`neon-shape shape-${flower.type}`}></div>
                    </div>
                ))}
            </div>

            {/* Top bar — minimal */}
            {/* Closeness Meter */}
            {!isDancing && (
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
            )}

            {!isDancing && (
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
            )}

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

                {modelName === "March 7th" ? (
                    <Live2dAvatar
                        emotion={emotion}
                        isTalking={isTalking}
                        peak={peak}
                        modelPath="/models/March 7th/march 7th.model3.json"
                        onLoad={handleVrmLoaded}
                        onInteraction={handleAvatarInteraction}
                    />
                ) : (
                    <VrmAvatar
                        emotion={emotion}
                        animation={dancePhase !== "idle" ? renderedDanceAnim : animation}
                        isDancing={dancePhase !== "idle" || animation === "kyun_dance" || animation === "dance1"}
                        isTalking={isTalking}
                        peak={peak} 
                        modelUrl={`/models/${modelName}.vrm`}
                        closeness={closeness}
                        onLoad={handleVrmLoaded}
                        onInteraction={handleAvatarInteraction}
                    />
                )}

            </div>

            {/* Mode & Prompt Toggle Button (Sweet Love vs Yandere) */}
            {/* Mode & Action Buttons */}
            {!isDancing && (
                <>
                    <button
                        className={`reina-bgm-btn mode-${bgmMode}`}
                        style={{ zIndex: 1000 }}
                        onClick={() => {
                            initAudio();
                            setBgmMode(prev => {
                                const nextMode = prev === 'yandere' ? 'sweet_love' : 'yandere';
                                if (nextMode === 'yandere') {
                                    setEmotion("scary_smile2");
                                    setAnimation("VRMA_07");
                                } else {
                                    setEmotion("sweet");
                                    setAnimation("idle1");
                                }
                                return nextMode;
                            });
                        }}
                        title="Toggle Persona & System Prompt (Sweet Love vs Yandere Mode)"
                    >
                        {bgmMode === 'yandere' ? '🥀 YANDERE MODE' : '💕 SWEET MODE'}
                    </button>

                    {/* Standalone Mute Button */}
                    <button
                        className={`reina-mute-btn ${isMuted ? 'muted' : ''}`}
                        style={{ zIndex: 1000 }}
                        onClick={() => {
                            initAudio();
                            setIsMuted(prev => {
                                const nextMuted = !prev;
                                if (activeAudio.current) {
                                    activeAudio.current.muted = nextMuted;
                                }
                                return nextMuted;
                            });
                        }}
                        title={isMuted ? "Unmute Audio" : "Mute Audio"}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    {/* Animation Settings — Moved outside wrapper for better stacking */}
                    <button
                        className={`reina-anim-toggle ${showAnimSettings ? 'active' : ''}`}
                        style={{ zIndex: 1000 }}
                        onClick={() => setShowAnimSettings(!showAnimSettings)}
                        title="Animation Settings"
                    >
                        <Settings2 size={18} />
                    </button>
                </>
            )}

            {showAnimSettings && (
                <div className="reina-anim-picker" style={{ zIndex: 1001 }}>
                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Choose Model</span>
                        </div>
                        <div className="picker-grid models">
                            {["Reina", "Ayano", "March 7th"].map(m => (
                                <button
                                    key={m}
                                    className={`anim-btn ${modelName === m ? 'active' : ''}`}
                                    onClick={() => {
                                        setModelName(m);
                                        resetIdleTimer();
                                    }}
                                >
                                    {m === "March 7th" ? "March 7th (2D)" : m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Brain Model</span>
                        </div>
                        <div className="picker-grid models">
                            {["2d", "kira", "reina", "reina-gemini", "reina-com", "reinaT", "reinaTD", "reinaJ", "reinaE", "gemma4:e4b", "dolphin3:8b"].map(m => (
                                <button
                                    key={m}
                                    className={`anim-btn ${selectedModel === m ? 'active' : ''}`}
                                    onClick={() => setSelectedModel(m)}
                                >
                                    {m === "2d" ? "🌸 2D (Gemma 4)" : (m === "kira" ? "★ KIRA" : (m === "reina-gemini" ? "REINA (Gemini)" : (m === "reina-com" ? "Companion" : m)))}
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
                            <span>2D Live2D Expressions</span>
                            <button onClick={() => {
                                setEmotion("blush");
                                resetIdleTimer();
                            }}>Reset</button>
                        </div>
                        <div className="picker-grid models">
                            {[
                                { id: "blush", label: "🌸 Blush" },
                                { id: "dark", label: "🥀 Dark Yandere" },
                                { id: "peace", label: "✌️ Peace" },
                                { id: "star", label: "⭐ Star Eyes" },
                                { id: "shy", label: "🙈 Shy Cover" },
                                { id: "camera", label: "📷 Camera Pose" },
                                { id: "crying", label: "😭 Crying" },
                                { id: "sweat", label: "💦 Sweat Drop" }
                            ].map(exp => (
                                <button
                                    key={exp.id}
                                    className={`anim-btn ${emotion === exp.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setEmotion(exp.id);
                                        resetIdleTimer();
                                    }}
                                >
                                    {exp.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Faces (3D VRM)</span>
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
                                { id: "kyun_dance", label: "💃 Kyun Kyun Dance" },
                                { id: "dance1", label: "💃 Dance 1" },
                                { id: "greeting", label: "👋 Greeting" },
                                { id: "VRMA_01", label: "VRMA 01" },
                                { id: "VRMA_02", label: "VRMA 02" },
                                { id: "VRMA_03", label: "VRMA 03" },
                                { id: "VRMA_04", label: "VRMA 04" },
                                { id: "VRMA_05", label: "VRMA 05" },
                                { id: "VRMA_06", label: "VRMA 06" },
                                { id: "VRMA_07", label: "VRMA 07 (Yandere)" },
                                { id: "idle1", label: "Idle 1" },
                                { id: "idle2", label: "Idle 2" },
                                { id: "Talking", label: "Talking" },
                                { id: "sadIdle", label: "Sad Idle" },
                                { id: "angry", label: "Angry" },
                                { id: "pose_friendy", label: "Pose Friendly" },
                                { id: "pose_lillian", label: "Pose Lillian" },
                                { id: "pose_nyammy", label: "Pose Nyammy" },
                                { id: "pose_wonderful", label: "Pose Wonderful" }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`anim-btn ${animation === item.id ? 'active' : ''}`}
                                    onClick={() => {
                                        initAudio();
                                        if (animation === item.id) {
                                            setAnimation("");
                                            setTimeout(() => setAnimation(item.id), 50);
                                        } else {
                                            setAnimation(item.id);
                                        }
                                        lastInteractionRef.current = Date.now(); // ⚡ RESET IDLE TIMER for manual selection
                                        resetIdleTimer();
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom centered input — glassmorphism */}
            {!isDancing && (
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
            )}
            {/* Cursed Eye Awakening Yandere Loading Overlay */}
            {vrmLoading && (
                <div 
                    className="scary-loader-overlay awakening-mode" 
                    onClick={() => {
                        console.log("⚡ [User Click] Dismissing loading screen overlay");
                        setVrmLoading(false);
                        stopDrone();
                        resetIdleTimer();
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click anywhere to enter"
                >
                    <div className="dark-vignette-overlay" />
                    <div className="drifting-mist-layer" />
                    <div className="shadow-claws-layer" />
                    
                    {/* FLOATING CORRUPTED HORROR KANJI IN EMPTY SCREEN SPACES */}
                    <div className="floating-kanji-bg">
                        <span className="kanji-particle p1">愛</span>
                        <span className="kanji-particle p2">死</span>
                        <span className="kanji-particle p3">逃</span>
                        <span className="kanji-particle p4">視</span>
                        <span className="kanji-particle p5">呪</span>
                        <span className="kanji-particle p6">囚</span>
                        <span className="kanji-particle p7">闇</span>
                        <span className="kanji-particle p8">妄</span>
                    </div>

                    <div className="scary-loader-content awakening-content">
                        {/* TWO ANIME EYES — CLOSED SLIT IN STEP 0, PEELS OPEN AT STEP 1 */}
                        <div className="awakened-eyes-viewport" style={{
                            transform: `scale(${0.9 + (loadingStep * 0.03)})`
                        }}>
                            <div className={`anime-eyes-pair ${loadingStep >= 1 ? 'eyes-peeled-open' : 'eyes-closed-slit'}`}>
                                <div className="anime-eye-socket left">
                                    <div className="scary-twitch-pupil corner-hold" />
                                    {loadingStep >= 2 && (
                                        <svg className="eye-blood-tear-svg" viewBox="0 0 40 160">
                                            <path d="M20,0 Q23,40 17,80 T22,140 Q24,152 20,160 Q16,152 18,140 T23,80 Q17,40 20,0 Z" fill="#cc0022" />
                                            <circle cx="20" cy="148" r="4" fill="#ff0033" className="blood-drop-dot" />
                                        </svg>
                                    )}
                                </div>
                                <div className="anime-eye-socket right">
                                    <div className="scary-twitch-pupil corner-hold" />
                                    {loadingStep >= 2 && (
                                        <svg className="eye-blood-tear-svg" viewBox="0 0 40 160">
                                            <path d="M20,0 Q24,45 16,85 T21,140 Q25,152 20,160 Q15,152 19,140 T24,85 Q16,45 20,0 Z" fill="#cc0022" />
                                            <circle cx="20" cy="148" r="4" fill="#ff0033" className="blood-drop-dot" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <h2 
                            key={loadingStep}
                            className="scary-horror-jp-text lower-text-position" 
                            style={{ fontSize: '38px', marginTop: '45px', position: 'relative', zIndex: 10020 }}
                        >
                            {loadingText}
                        </h2>

                        {/* 100% Japanese Subliminal Text Flash */}
                        {isSubliminal && (
                            <div className="subliminal-overlay">
                                <div className="subliminal-content horror-distorted">
                                    <div className="subliminal-text" style={{ fontSize: '80px', color: '#ff0033' }}>
                                        {loadingStep % 2 === 0 ? "「逃がさない」" : "「ずっと一緒♥」"}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReinaPage;
