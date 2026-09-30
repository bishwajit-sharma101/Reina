import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Send, Heart, ChevronLeft, Settings2, Volume2, VolumeX, X, Download } from 'lucide-react';
import VrmAvatar from '../../components/diary/VrmAvatar';
import Live2dAvatar from '../../components/diary/Live2dAvatar';
import { whisperSTT } from '../../utils/whisperStt';
import CinematicMotifs from './CinematicMotifs';
import ChessGame from '../../components/games/ChessGame';
import './ReinaPage.css';

const getSessionId = () => {
    let sid = localStorage.getItem('astrix_reina_session_id');
    if (!sid) {
        sid = 'reina_sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        localStorage.setItem('astrix_reina_session_id', sid);
    }
    return sid;
};

// 11 Authoritative 3D VRM Expressions (strictly matching Settings drawer)
export const ALLOWED_VRM_EMOTIONS = new Set([
    "neutral", "sweet", "sad", "jealous", "angry",
    "scary_smile", "scary_smile2", "hollow", "dead", "flirty"
]);

export function sanitizeVrmEmotion(raw) {
    if (!raw || typeof raw !== 'string') return "neutral";
    const clean = raw.trim().toLowerCase();
    if (ALLOWED_VRM_EMOTIONS.has(clean)) return clean;

    const fallbackMap = {
        joke: "flirty",
        tsundere: "angry",
        embarrassed: "jealous",
        excited: "sweet",
        joy: "sweet",
        happy: "sweet",
        fun: "sweet",
        psycho: "scary_smile",
        mad: "angry",
        sorrow: "sad",
        whisper: "scary_smile2",
        dark: "scary_smile2",
        yandere: "scary_smile2",
        blush: "sweet",
        crying: "sad",
        scorn: "angry",
        sexy: "flirty",
        weak: "sad",
        brat: "angry",
        bratty: "angry",
        adorable: "sweet"
    };

    return fallbackMap[clean] || "neutral";
}

const ReinaPage = () => {
    const navigate = useNavigate();

    // Chat state with persistent local storage caching
    const [messages, setMessages] = useState(() => {
        try {
            const cached = localStorage.getItem('astrix_reina_chat_history');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [];
    });
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [latestAiMsg, setLatestAiMsg] = useState("");
    const [displayedAiMsg, setDisplayedAiMsg] = useState("");
    const [targetTypingText, setTargetTypingText] = useState("");
    const aiTypingTimeoutRef = useRef(null);

    // Persist conversation messages locally so refresh never loses context
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '24px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px';
        }
    }, [input]);

    useEffect(() => {
        if (messages && messages.length > 0) {
            try {
                localStorage.setItem('astrix_reina_chat_history', JSON.stringify(messages.slice(-50)));
            } catch (e) {}
        }
    }, [messages]);

    const handleClearMemory = async () => {
        try {
            const sid = getSessionId();
            localStorage.removeItem('astrix_reina_chat_history');
            const newSid = 'reina_sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
            localStorage.setItem('astrix_reina_session_id', newSid);
            setMessages([]);
            setLatestAiMsg("");
            setDisplayedAiMsg("");
            await fetch('http://localhost:5000/api/v1/ai/grok/clear-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sid })
            });
        } catch (e) {}
    };

    // Avatar state
    const [isTalking, setIsTalking] = useState(false);
    const [emotion, setEmotion] = useState("neutral");
    const [animation, setAnimation] = useState(""); // Empty = procedural idle
    const [modelName, setModelName] = useState("Reina");
    const [activeSentence, setActiveSentence] = useState("");
    const [showAnimSettings, setShowAnimSettings] = useState(false);
    const [showMemoryModal, setShowMemoryModal] = useState(false);
    const [showEvolveModal, setShowEvolveModal] = useState(false);
    const [showChatLog, setShowChatLog] = useState(false);
    const chatLogRef = useRef(null);
    const textareaRef = useRef(null);
    const [memoryData, setMemoryData] = useState({ memory: [], diary: [], persona: [] });
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
    const tttBoardRef = useRef(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const isPlayerTurnRef = useRef(true);
    const gameTypeRef = useRef(null);
    const [agentAction, setAgentAction] = useState("");
    const lockTimeoutRef = useRef(null);
    const scaryTextTimerRef = useRef(null);
    const stayReleaseTriggeredRef = useRef(false);
    const processedTagsRef = useRef(new Set()); // Track triggered tags for the current response
    const pendingDanceRef = useRef(null);
    const userInitiatedPerformanceRef = useRef(null);
    const hasSpokenRef = useRef(false);

    useEffect(() => {
        gameTypeRef.current = gameType;
    }, [gameType]);

    // Cinematic Motif State
    const [activeMotif, setActiveMotif] = useState(null);
    const activeMotifRef = useRef(null);

    // Audio Sync Refs
    const bgRef = useRef(null);
    const lyricsRef = useRef(null);
    const songAnalysisRef = useRef(null);
    const lastBeatIndexRef = useRef(-1);
    const lastWordRef = useRef("");
    const lastLoudTimeRef = useRef(0);

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
    const sweetThemeAudioRef = useRef(null);
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
        const isSinging = animation === "Singing";
        const isDanceAnim = animation === "kyun_dance" || animation === "dance1" || animation === "lag_queen" || isSinging;
        
        if (isDanceAnim && dancePhase === "idle") {
            const isLagQueen = animation === "lag_queen";
            // ── PHASE 1: STAGING (Fade in stage, glide camera, let Reina take ready pose) ──
            setDancePhase("staging");
            setRenderedDanceAnim("idle1");

            let songSrc = "/song/kyun_dance_song.mp3";
            if (isSinging) {
                songSrc = "/song/The Last Strawberry.mp3";
            }

            if (!danceAudioRef.current) {
                const audioObj = new Audio(songSrc);
                danceAudioRef.current = audioObj;
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const ctx = new AudioContext();
                    const source = ctx.createMediaElementSource(audioObj);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 64;
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    danceAudioRef.current.analyser = analyser;
                    danceAudioRef.current.dataArray = new Uint8Array(analyser.frequencyBinCount);
                    danceAudioRef.current.ctx = ctx;
                } catch(e) { console.warn("Analyzer setup error:", e); }
            } else if (!danceAudioRef.current.src.endsWith(songSrc.replace(/ /g, "%20"))) {
                danceAudioRef.current.src = songSrc;
                danceAudioRef.current.load();
            }

            const audio = danceAudioRef.current;
            audio.muted = isMuted;
            audio.currentTime = (isLagQueen || isSinging) ? 0.0 : 66.0; // Play from beginning for Lag Queen & Singing
            audio.volume = 1.0;

            if (danceFadeIntervalRef.current) clearInterval(danceFadeIntervalRef.current);

            // ── PHASE 2: EXACT SYNC — Wait for animation to load before starting song ──
            const startSyncTimer = setTimeout(() => {
                setDancePhase("dancing");
                setRenderedDanceAnim(animation);
                // Auto-play audio when dance phase starts
                if (danceAudioRef.current && danceAudioRef.current.paused) {
                    danceAudioRef.current.play().catch(e => console.warn('Auto-play deferred:', e));
                }
                if (danceAudioRef.current && danceAudioRef.current.ctx && danceAudioRef.current.ctx.state === 'suspended') {
                    danceAudioRef.current.ctx.resume();
                }
            }, 1000);

            const handleTimeUpdate = () => {
                if (isLagQueen) {
                    // Lag Queen animation is ~156s long
                    if (audio.currentTime >= 156.0 || audio.currentTime >= audio.duration - 0.5) {
                        finishDanceSmooth();
                    }
                } else if (isSinging) {
                    if (audio.duration && audio.currentTime >= audio.duration - 0.5) {
                        finishDanceSmooth();
                    }
                } else {
                    // Full kyun animation length is exactly 32.70 seconds (from 66.0s to 98.70s)
                    if (audio.currentTime >= 98.7) {
                        finishDanceSmooth();
                    }
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
                danceAudioRef.current.currentTime = 0.0;
                danceAudioRef.current.volume = 1.0;
            }
            setDancePhase("idle");
            setRenderedDanceAnim("");
        }
    }, [animation, isMuted, finishDanceSmooth]);

    useEffect(() => {
        if (animation === "Singing") {
            fetch('/song/The_Last_Strawberry_analysis.json')
                .then(res => res.json())
                .then(data => {
                    songAnalysisRef.current = data;
                    console.log("Loaded song analysis data with", data.beats.length, "beats.");
                })
                .catch(err => console.error("Error loading song analysis", err));
        } else {
            songAnalysisRef.current = null;
            lastBeatIndexRef.current = -1;
            lastWordRef.current = "";
        }
    }, [animation]);

    useEffect(() => {
        let rAF;
        const syncLoop = () => {
            if (dancePhase === "dancing" && danceAudioRef.current) {
                const ct = danceAudioRef.current.currentTime;
                
                const seekBar = document.getElementById('dance-seek-bar');
                if (seekBar && danceAudioRef.current.duration) {
                    seekBar.value = (ct / danceAudioRef.current.duration) * 100;
                }
                
                if (danceAudioRef.current.ctx && danceAudioRef.current.ctx.state === 'suspended') {
                    danceAudioRef.current.ctx.resume().catch(e => console.warn(e));
                }
                
                // REAL-TIME AUDIO REACTIVITY (Booms)
                let bassAvg = 0;
                let beatIndex = -1;
                let isStrongBeat = false;

                if (danceAudioRef.current.analyser && animation === "Singing") {
                    const analyser = danceAudioRef.current.analyser;
                    const dataArray = danceAudioRef.current.dataArray;
                    analyser.getByteFrequencyData(dataArray);
                    
                    let bassSum = 0;
                    for (let i = 0; i < 4; i++) bassSum += dataArray[i];
                    bassAvg = bassSum / 4;
                }

                if (songAnalysisRef.current && animation === "Singing") {
                    const beats = songAnalysisRef.current.beats;
                    let nextBeat = lastBeatIndexRef.current + 1;
                    if (nextBeat < beats.length && ct >= beats[nextBeat]) {
                        beatIndex = nextBeat;
                        lastBeatIndexRef.current = nextBeat;
                    }
                }
                
                let activeLyricText = "";
                if (songAnalysisRef.current && animation === "Singing") {
                    const lyrics = songAnalysisRef.current.lyrics;
                    for (let i = 0; i < lyrics.length; i++) {
                        if (ct >= lyrics[i].start && ct <= lyrics[i].end + 0.5) {
                            activeLyricText = lyrics[i].text.toLowerCase();
                            break;
                        }
                    }
                }
                
                if (bgRef.current && animation === "Singing") {
                    let newMotif = null;
                    // Cinematic Narrative Visuals
                    let targetTransform = 'scale(1)';
                    let targetFilter = 'brightness(1) contrast(1) saturate(1)';
                    let targetTransition = 'all 2s ease-in-out';
                    
                    if (activeLyricText) {
                        if (activeLyricText.includes("leave your umbrella") || activeLyricText.includes("bring your umbrella")) newMotif = "umbrella";
                        else if (activeLyricText.includes("strawberry")) newMotif = "strawberry";
                        else if (activeLyricText.includes("train times")) newMotif = "train";
                        else if (activeLyricText.includes("winter finds your fingers")) newMotif = "winter";
                        else if (activeLyricText.includes("quarter past eight")) newMotif = "clock";
                        else if (activeLyricText.includes("pride is paper")) newMotif = "shatter";
                        else if (activeLyricText.includes("seep beside me") || activeLyricText.includes("kept for you before") || activeLyricText.includes("anywhere feel home")) newMotif = "spotlight";
                        else if (activeLyricText.includes("reaching for your hand")) newMotif = "hand";
                        else if (activeLyricText.includes("stay stay stay") || activeLyricText.includes("foolishness begin")) newMotif = "insane";

                        if (activeMotifRef.current !== newMotif) {
                            activeMotifRef.current = newMotif;
                            setActiveMotif(newMotif);
                        }
                        if (activeLyricText.includes("don't want you to leave")) {
                            targetFilter = 'brightness(1.2) contrast(1.1) saturate(1.2)';
                            targetTransition = 'all 1.5s ease-out';
                        } else if (activeLyricText.includes("softly that i forget")) {
                            targetFilter = 'brightness(0.6) contrast(1.3) saturate(0.5)';
                            targetTransform = 'scale(1.05)';
                            targetTransition = 'all 3s ease-out';
                        } else if (activeLyricText.includes("strawberry from the cake")) {
                            targetFilter = 'brightness(1.2) contrast(1.1) saturate(1.4)';
                            targetTransform = 'scale(1.02)';
                            targetTransition = 'all 1s ease-out';
                        } else if (activeLyricText.includes("rearrange")) {
                            targetFilter = 'brightness(1.1) contrast(1.2) saturate(1.5)';
                            targetTransform = 'scale(1.1)';
                            targetTransition = 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
                        } else if (activeLyricText.includes("seep beside me")) {
                            targetFilter = 'brightness(1.3) contrast(1.0) saturate(1.3)';
                            targetTransition = 'all 2.5s ease-in-out';
                        } else if (activeLyricText.includes("itchy for somebody")) {
                            targetFilter = 'brightness(0.7) contrast(1.5) saturate(0.2)';
                            targetTransform = 'scale(1.01)';
                            targetTransition = 'all 0.1s ease-out'; // Snaps instantly
                        } else if (activeLyricText.includes("listen don't laugh") || activeLyricText.includes("reaching for your hand")) {
                            targetFilter = 'brightness(0.5) contrast(1.2) saturate(0.8)';
                            targetTransform = 'scale(1.08)';
                            targetTransition = 'all 4s ease-in-out';
                        } else if (activeLyricText.includes("stay stay stay") || activeLyricText.includes("ordinary days for")) {
                            const intensity = bassAvg / 255;
                            const rot = Math.sin(ct * 20) * 3; // Slight cinematic sway
                            targetFilter = `hue-rotate(${45 + intensity*100}deg) brightness(${1.2 + intensity}) contrast(1.3) saturate(1.8)`;
                            targetTransform = `scale(${1.05 + intensity*0.1}) rotate(${rot}deg)`;
                            targetTransition = 'all 0.1s ease-out';
                        } else if (activeLyricText.includes("sweetest one i know") || activeLyricText.includes("anywhere feel home") || activeLyricText.includes("bring your umbrella")) {
                            targetFilter = 'brightness(1.2) contrast(0.9) saturate(1.2)';
                            targetTransform = 'scale(1)';
                            targetTransition = 'all 5s ease-in-out';
                        }
                    }

                    bgRef.current.style.transition = targetTransition;
                    bgRef.current.style.transform = targetTransform;
                    bgRef.current.style.filter = targetFilter;
                }

                // CINEMATIC LYRICS (Left-side stacked buildup, removes when full)
                if (songAnalysisRef.current && animation === "Singing" && lyricsRef.current) {
                    const lyrics = songAnalysisRef.current.lyrics;
                    const allSpokenWords = [];
                    
                    for (let i = 0; i < lyrics.length; i++) {
                        if (lyrics[i].start <= ct + 0.5) { 
                            if (lyrics[i].words && lyrics[i].words.length > 0) {
                                for (let j = 0; j < lyrics[i].words.length; j++) {
                                    if (lyrics[i].words[j].start <= ct) {
                                        allSpokenWords.push(lyrics[i].words[j]);
                                    }
                                }
                            }
                        } else {
                            break;
                        }
                    }
                    
                    if (allSpokenWords.length > 0) {
                        const WORDS_PER_PAGE = 10;
                        const pageIndex = Math.floor((allSpokenWords.length - 1) / WORDS_PER_PAGE);
                        const visibleWords = allSpokenWords.slice(pageIndex * WORDS_PER_PAGE, (pageIndex + 1) * WORDS_PER_PAGE);
                        
                        let html = '';
                        for (let w of visibleWords) {
                            const isCurrent = ct >= w.start && ct <= w.end;
                            const isHeavy = (w.end - w.start) > 0.4;
                            const scale = isCurrent ? (isHeavy ? 1.5 : 1.2) : 1.0;
                            const color = isCurrent ? '#ffffff' : '#38bdf8';
                            const shadow = isCurrent ? '0 0 20px #ffffff, 0 0 40px #ffffff' : '0 0 10px #ff3388';
                            const rot = Math.sin(w.start * 100) * 8; // -8 to 8 deg
                            
                            html += `<span style="display: inline-block; color: ${color}; text-shadow: ${shadow}; transform: scale(${scale}) rotate(${rot}deg); transition: all 0.1s ease-out; margin: 15px 12px; line-height: 1.3;">${w.word}</span>`;
                        }
                        
                        if (lyricsRef.current.innerHTML !== html) {
                            lyricsRef.current.innerHTML = html;
                        }
                    } else {
                        if (lyricsRef.current.innerHTML !== "") {
                            lyricsRef.current.innerHTML = "";
                        }
                    }
                }
            }
            rAF = requestAnimationFrame(syncLoop);
        };
        if (dancePhase === "dancing") {
            rAF = requestAnimationFrame(syncLoop);
        }
        return () => cancelAnimationFrame(rAF);
    }, [dancePhase, animation]);

    useEffect(() => {
        if (danceAudioRef.current) {
            danceAudioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        const isDanceAnim = animation === "kyun_dance" || animation === "dance1" || animation === "Singing" || animation === "lag_queen";
        if (bgmMode === "off" || vrmLoading || isDanceAnim) {
            if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
            if (sweetThemeAudioRef.current) sweetThemeAudioRef.current.pause();
            return;
        }

        if ((bgmMode === "sweet_love" || bgmMode === "tsundere_groove") && sweetThemeAudioRef.current) {
            const expectedSrc = bgmMode === "sweet_love" ? "/song/Angel Humming.mp3" : "/song/Tsundere Groove.mp3";
            sweetThemeAudioRef.current.volume = 0.15;
            if (!sweetThemeAudioRef.current.src.endsWith(expectedSrc.replace(/ /g, "%20"))) {
                sweetThemeAudioRef.current.src = expectedSrc;
            }
            if (sweetThemeAudioRef.current.paused) {
                sweetThemeAudioRef.current.play().catch(e => console.warn(e));
            }
        } else if (sweetThemeAudioRef.current) {
            sweetThemeAudioRef.current.pause();
        }

        let melody = [];
        if (bgmMode === "yandere") {
            melody = [440.00, 523.25, 659.25, 830.61, 880.00, 698.46, 587.33, 659.25];
        }

        let idx = 0;
        bgmIntervalRef.current = setInterval(() => {
            if (bgmMode === "yandere") {
                playMusicBoxNote(melody[idx], 1.8);
                if (idx === 0 || idx === 4) {
                    playLowHeartThud(0.1);
                }
                idx = (idx + 1) % melody.length;
            }
        }, 900);

        return () => {
            if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
        };
    }, [bgmMode, vrmLoading, animation, playMusicBoxNote]);

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

            const isDancing = animation === "kyun_dance" || animation === "dance1" || animation === "Singing" || animation === "lag_queen";
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

    // ─── WHISPER TINY SPEECH-TO-TEXT CONTROLLER ───
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [whisperStatus, setWhisperStatus] = useState("");
    const [micVolume, setMicVolume] = useState(0);

    const isVoiceModeRef = useRef(false);
    const isTranscribingRef = useRef(false);
    const silenceTimeoutRef = useRef(null);
    const hasSpokenSinceListenRef = useRef(false);

    // Keep ref in sync
    useEffect(() => {
        isVoiceModeRef.current = isVoiceMode;
    }, [isVoiceMode]);

    const stopWhisperAndProcess = useCallback(async () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (isTranscribingRef.current) return;

        setIsListening(false);
        setIsTranscribing(true);
        isTranscribingRef.current = true;
        setWhisperStatus("Transcribing...");

        try {
            const { text, elapsedMs } = await whisperSTT.stopRecordingAndTranscribe();
            if (text && text.trim()) {
                console.log(`🎙️ [Whisper Transcribed] "${text}" (${elapsedMs}ms)`);
                setInput(text);
                setWhisperStatus("");
                // Auto send transcribed message
                setTimeout(() => {
                    handleSend(null, text);
                }, 100);
            } else {
                setWhisperStatus("");
            }
        } catch (err) {
            console.error("Whisper transcription error:", err);
            setWhisperStatus("Transcription error");
            setTimeout(() => setWhisperStatus(""), 2000);
        } finally {
            setIsTranscribing(false);
            isTranscribingRef.current = false;
        }
    }, []);

    const startWhisperListening = useCallback(async () => {
        if (isListening || isTranscribingRef.current || isTalking || isLoading) return;

        try {
            hasSpokenSinceListenRef.current = false;
            setWhisperStatus("Initializing Whisper...");

            // Initialize / ensure Whisper model is ready
            await whisperSTT.init((progress) => {
                if (progress.status === 'downloading') {
                    setWhisperStatus(progress.message);
                } else if (progress.status === 'ready') {
                    setWhisperStatus("Listening...");
                }
            });

            setWhisperStatus("Listening...");
            await whisperSTT.startRecording((volume) => {
                setMicVolume(volume);
                // Silence detection: after detecting voice, wait 1.4s of low volume to auto-process
                if (volume > 0.06) {
                    hasSpokenSinceListenRef.current = true;
                    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                    silenceTimeoutRef.current = setTimeout(() => {
                        if (hasSpokenSinceListenRef.current) {
                            stopWhisperAndProcess();
                        }
                    }, 1400);
                }
            });

            setIsListening(true);
        } catch (err) {
            console.error("Failed to start Whisper recording:", err);
            setIsListening(false);
            setWhisperStatus("Mic error");
            setTimeout(() => setWhisperStatus(""), 2000);
        }
    }, [isListening, isTalking, isLoading, stopWhisperAndProcess]);

    // Continuous voice loop: resume listening once Reina finishes talking
    useEffect(() => {
        if (isVoiceMode && !isTalking && !isLoading && !isListening && !isTranscribing) {
            const timer = setTimeout(() => {
                if (isVoiceModeRef.current) {
                    startWhisperListening();
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isVoiceMode, isTalking, isLoading, isListening, isTranscribing, startWhisperListening]);

    const toggleVoiceMode = useCallback(() => {
        if (isVoiceMode) {
            setIsVoiceMode(false);
            isVoiceModeRef.current = false;
            if (isListening) {
                stopWhisperAndProcess();
            } else {
                whisperSTT.cancelRecording();
            }
            setWhisperStatus("");
        } else {
            setIsVoiceMode(true);
            isVoiceModeRef.current = true;
            startWhisperListening();
        }
    }, [isVoiceMode, isListening, startWhisperListening, stopWhisperAndProcess]);

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
                if (Math.random() > 0.4) playLowHeartThud(0.8);
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

    const handleAnimationPlay = useCallback((animUrl) => {
        if (animUrl && animUrl.includes("dance") && danceAudioRef.current) {
            if (danceAudioRef.current.paused) {
                console.log("💃 [ReinaPage] Animation loaded and playing! Syncing audio now...");
                danceAudioRef.current.currentTime = 66.0;
                danceAudioRef.current.play().catch(e => console.warn("Dance song play deferred:", e));
            }
        } else if (animUrl && (animUrl.includes("lag_queen") || animUrl.includes("Singing")) && danceAudioRef.current) {
            if (danceAudioRef.current.paused) {
                console.log("💃 [ReinaPage] Lag Queen/Singing animation loaded and playing! Syncing audio now...");
                danceAudioRef.current.currentTime = 0.0;
                danceAudioRef.current.play().catch(e => console.warn("Dance song play deferred:", e));
            }
        }
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
                    setEmotion("scary_smile"); 
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
        
        let source = audioElement.sourceNode;
        if (!source) {
            source = ctx.createMediaElementSource(audioElement);
            audioElement.sourceNode = source;
        }
        
        if (!analyserRef.current) {
            analyserRef.current = ctx.createAnalyser();
            analyserRef.current.fftSize = 64;
        }
        
        if (!audioElement.isConnectedToCtx) {
            source.connect(analyserRef.current);
            analyserRef.current.connect(ctx.destination);
            audioElement.isConnectedToCtx = true;
        }

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
            
            // 💃 Check if a dance or song was requested — trigger performance immediately after speech finishes!
            if (pendingDanceRef.current && hasSpokenRef.current) {
                const danceAnim = pendingDanceRef.current;
                pendingDanceRef.current = null;
                userInitiatedPerformanceRef.current = null;
                hasSpokenRef.current = false;
                console.log("💃 [Reina] Spoken intro finished! Getting ready and starting performance:", danceAnim);
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
    const synthesizeAndQueue = async (rawText, token) => {
        if (!rawText || typeof rawText !== 'string') return;
        const text = rawText
            .replace(/<OPEN_GAME[^>]*\/?>/gi, '')
            .replace(/<MOVE[^>]*\/?>/gi, '')
            .replace(/\[(?:emotion|exp)=[^\]]+\]/gi, '')
            .replace(/\[(?:anim|motion)=[^\]]+\]/gi, '')
            .replace(/\[voice=[^\]]+\]/gi, '')
            .replace(/\[ACTION:[A-Z_]+\]/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim();
        if (!text) return;
        
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
        } else if (selectedTts === "fish") {
            try {
                console.log(`🐟 [Fish Audio TTS Request] Text: "${text.substring(0, 30)}..." | Voice: Osana (Li Chan)`);
                const ttsRes = await fetch("http://localhost:5000/api/v1/ai/fish/tts", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ text })
                });

                if (ttsRes.ok) {
                    const contentType = ttsRes.headers.get("content-type") || "";
                    if (contentType.includes("json")) {
                        const json = await ttsRes.json();
                        if (json.success === false) {
                            console.warn("⚠️ [Fish Audio TTS] Service reported:", json.error);
                            task.url = "ERROR";
                            playNextInQueue();
                            return;
                        }
                    }
                    console.log(`✅ [Fish Audio TTS Success] Audio generated for text: "${text.substring(0, 30)}..."`);
                    const blob = await ttsRes.blob();
                    task.url = URL.createObjectURL(blob);
                    playNextInQueue();
                } else {
                    const errData = await ttsRes.json().catch(() => ({}));
                    console.error(`❌ [Fish Audio TTS Error] Status: ${ttsRes.status}`, errData.error || "");
                    task.url = "ERROR";
                    playNextInQueue();
                }
            } catch (err) {
                console.error("Fish Audio Error:", err);
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
        
        const systemMsg = `[SYSTEM_GAME_RESULT] Darling played ${move}, I played ${rMove}. Result: I ${result}!
CRITICAL: Respond with UP TO TWO short, punchy lines (max 2 lines) of high gamer emotion (troll him if you won, salty rage/pout if you lost, playful teasing if tied)! Max 2 lines!`;
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

        const systemMsg = `[SYSTEM_COIN_FLIP] Darling guessed ${guess}, Result was ${result}. Result: I ${gRes}!
CRITICAL: Respond with UP TO TWO short, punchy lines (max 2 lines) of high gamer emotion (smug troll if he missed, flustered salty denial if he got lucky)! Max 2 lines!`;
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

        const systemMsg = `[SYSTEM_NUMBER_GUESS] Darling guessed ${num}, My number was ${rNum}. Result: I ${gRes}!
CRITICAL: Respond with UP TO TWO short, punchy lines (max 2 lines) of high gamer emotion (flustered accusation of mind-reading if correct, smug teasing if wrong)! Max 2 lines!`;
        await sendGameAction(systemMsg, `(Guesses Number: ${num})`);
    };

    const handleTttMove = async (index, turn = 'X') => {
        console.log(`[TIC-TAC-TOE] handleTttMove called: turn=${turn}, index=${index}, isPlayerTurnRef=${isPlayerTurnRef.current}, isLoading=${isLoading}`);
        
        const currentBoard = [...tttBoardRef.current];

        // Validation logic
        if (index < 0 || index > 8 || currentBoard[index] !== null) {
            console.log("[TIC-TAC-TOE] Move rejected: Spot already taken or invalid at index", index);
            return;
        }
        if (turn === 'X' && (isLoading || !isPlayerTurnRef.current)) {
            console.log("[TIC-TAC-TOE] Move rejected: Player turn blocked", { isLoading, isPlayerTurn: isPlayerTurnRef.current });
            return;
        }

        const newBoard = [...currentBoard];
        newBoard[index] = turn;
        tttBoardRef.current = newBoard;
        setTttBoard(newBoard);
        console.log("[TIC-TAC-TOE] Board Updated:", newBoard);

        const winner = checkWinner(newBoard);
        const isFull = !newBoard.includes(null);

        if (winner || isFull) {
            let result = "TIED";
            if (winner === 'X') {
                result = "LOST"; // Reina lost
                setConsecutiveLosses(prev => prev + 1);
                setIsPouting(true);
            } else if (winner === 'O') {
                result = "WON"; // Reina won
                setConsecutiveLosses(0);
                setIsPouting(false);
            }

            setGameResult(result);
            if (turn === 'X') {
                const systemMsg = `[SYSTEM_TIC_TAC_TOE] Game Over. Result: I ${result}. Winner: ${winner || 'Draw'}. Board: ${JSON.stringify(newBoard)}
CRITICAL: Use ONLY one of the 11 valid emotions: neutral, sweet, sad, jealous, angry, scary_smile, scary_smile2, hollow, dead, flirty.
Respond with UP TO TWO short, punchy lines (max 2 lines) with peak gamer emotion (salty rage/pout if you lost, smug esports champion gloating if you won, or banter if draw)! Max 2 lines!`;
                await sendGameAction(systemMsg, `(Tic-Tac-Toe: ${winner ? (winner === 'X' ? 'I win!' : 'Reina wins!') : 'Draw'})`);
            }

            setTimeout(() => {
                const empty = Array(9).fill(null);
                tttBoardRef.current = empty;
                setTttBoard(empty);
                isPlayerTurnRef.current = true;
                setIsPlayerTurn(true);
                setGameResult(null);
            }, 4000);
            return;
        }

        if (turn === 'X') {
            isPlayerTurnRef.current = false;
            setIsPlayerTurn(false);
            const systemMsg = `[SYSTEM_TIC_TAC_TOE]
Board: ${JSON.stringify(newBoard)}
Available Indices: ${newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null).join(', ')}
Your Turn ('O').
MANDATORY: START your response with [emotion=X][anim=X]<MOVE index="N" />.
CRITICAL: Use ONLY one of the 11 valid facial emotions: neutral, sweet, sad, jealous, angry, scary_smile, scary_smile2, hollow, dead, flirty.
Follow the move tag with UP TO TWO short, punchy lines (max 2 lines) of high-energy gamer banter! Troll him if you block him or take center, get flustered/panicked if he corners you, or tease him! DO NOT say more than two lines!`;
            await sendGameAction(systemMsg, `(Tic-Tac-Toe: I played at ${index})`);
        } else {
            isPlayerTurnRef.current = true;
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
            const context = allMsgs.slice(-16).map(m =>
                `${m.sender === 'user' ? 'Darling' : aiName}: ${m.text}`
            ).join('\n');
            const history = allMsgs.slice(-20).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            const sid = getSessionId();

            const gameEndpoint = selectedModel === "kira"
                ? 'http://localhost:5000/api/v1/ai/kira/chat'
                : (selectedModel === "grok" || selectedModel === "grok-llm")
                ? 'http://localhost:5000/api/v1/ai/grok/chat'
                : 'http://localhost:5000/api/v1/ai/reina-com/chat';
            const gameModel = selectedModel === "kira" ? "kira" : (selectedModel === "grok" || selectedModel === "grok-llm") ? "grok" : "reina-com";

            const response = await fetch(gameEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    model: gameModel, 
                    message: finalMsg, 
                    context: context,
                    history: history,
                    sessionId: sid
                })
            });

            if (!response.ok) throw new Error("Stream failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let sentenceBuffer = "";
            let sentenceCount = 0;
            const isGameAction = typeof systemMsg === 'string' && (
                systemMsg.includes("[SYSTEM_TIC_TAC_TOE]") || 
                systemMsg.includes("[SYSTEM_CHESS]") ||
                systemMsg.includes("[SYSTEM_GAME_RESULT]") || 
                systemMsg.includes("[SYSTEM_COIN_FLIP]") || 
                systemMsg.includes("[SYSTEM_NUMBER_GUESS]")
            );

            setMessages(prev => [...prev, { sender: 'ai', text: "" }]);
            processedTagsRef.current.clear();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                sentenceBuffer += chunk;

                const emotionMatch = fullText.match(/\[(?:emotion|exp)=([^\]]+)\]/);
                if (emotionMatch) {
                    const sanitized = sanitizeVrmEmotion(emotionMatch[1]);
                    setEmotion(sanitized);
                }
                const animMatch = fullText.match(/\[(?:anim|motion)=([^\]]+)\]/);
                if (animMatch) {
                    const req = animMatch[1].trim();
                    const animMap = { happy: "VRMA_01", excited: "VRMA_01", nod: "VRMA_02", shake: "VRMA_06", tsundere: "angry", yandere: "VRMA_07" };
                    setAnimation(animMap[req.toLowerCase()] || req);
                }

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
                    .replace(/<OPEN_GAME[^>]*\/?>/gi, '') 
                    .replace(/<MOVE[^>]*\/?>/gi, '') 
                    .replace(/<[^>]+>/g, '')
                    .trim();
                if (uiText) {
                    setLatestAiMsg(uiText);
                }

                const sentenceEndMatch = sentenceBuffer.match(/[^。！？!?.…~♥\n]+[。！？!?.…~♥\n]/);
                if (sentenceEndMatch) {
                    let sentence = sentenceEndMatch[0];
                    sentenceBuffer = sentenceBuffer.substring(sentenceEndMatch.index + sentenceEndMatch[0].length);

                    if (!isGameAction || sentenceCount === 0) {
                        let cleanSentence = sentence
                            .replace(/<OPEN_GAME[^>]*\/?>/gi, '')
                            .replace(/<MOVE[^>]*\/?>/gi, '')
                            .replace(/\[SYSTEM(?:\s+MESSAGE)?:\s*[^\]]*\]/gi, '')
                            .replace(/\[(?:This|The|User|Response|Note|System|Assistant)[^\]]*\]/gi, '');

                        if (selectedTts === "fish") {
                            cleanSentence = cleanSentence
                                .replace(/\[(?:emotion|exp)=[^\]]+\]/gi, '')
                                .replace(/\[(?:anim|motion)=[^\]]+\]/gi, '')
                                .replace(/\[voice=[^\]]+\]/gi, '')
                                .replace(/\[ACTION:[A-Z_]+\]/gi, '');
                        } else {
                            cleanSentence = cleanSentence.replace(/\[[^\]]+\]/g, '');
                        }

                        cleanSentence = cleanSentence
                            .replace(/<[^>]+>/g, '')
                            .replace(/([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2728}\u{1F496}])\1+/gu, '')
                            .trim();

                        if (cleanSentence) {
                            sentenceCount++;
                            synthesizeAndQueue(cleanSentence, token);
                        }
                    }
                }

                // --- 🎮 Tag Parsing ---
                const openGameMatch = fullText.match(/<OPEN_GAME[^>]*type=["']?([^"'>\s]+)["']?[^>]*>/i);
                if (openGameMatch && !processedTagsRef.current.has(openGameMatch[0])) {
                    console.log("[DEBUG] Game Open Tag Found:", openGameMatch[0]);
                    processedTagsRef.current.add(openGameMatch[0]);
                    const type = openGameMatch[1];
                    setGameType(type);
                    gameTypeRef.current = type;
                    setShowGame(true);
                    if (type === 'tictactoe') {
                        const empty = Array(9).fill(null);
                        tttBoardRef.current = empty;
                        setTttBoard(empty);
                        isPlayerTurnRef.current = true;
                        setIsPlayerTurn(true);
                        setGameResult(null);
                    }
                }

                const moveMatch = fullText.match(/<MOVE[^>]*index=["']?(\d)["']?[^>]*>/i);
                if (moveMatch && !processedTagsRef.current.has(moveMatch[0])) {
                    console.log("[DEBUG] Move Tag Found:", moveMatch[0]);
                    processedTagsRef.current.add(moveMatch[0]);
                    let index = parseInt(moveMatch[1]);
                    
                    // --- 🧠 Illegal Move Fixer ---
                    const currentBoard = tttBoardRef.current;
                    if (currentBoard[index] !== null) {
                        console.log(`[TIC-TAC-TOE] Reina tried illegal move at ${index}. Finding alternative...`);
                        const available = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
                        if (available.length > 0) {
                            index = available[Math.floor(Math.random() * available.length)];
                            console.log(`[TIC-TAC-TOE] Redirected move to index ${index}`);
                        }
                    }

                    handleTttMove(index, 'O');
                }
            }

            
            // === [DEBUG LLM CUTOFF DETECTION] ===
            console.log("==========================================");
            console.log("[DEBUG] LLM FULL RAW OUTPUT:");
            console.log(fullText);
            console.log("==========================================");
            if (!/[。！？!?.…~♥\n>]$/.test(fullText.trim())) {
                console.warn("[DEBUG WARNING] Reina's output might have been CUT OFF! It didn't end with typical punctuation or a closing tag. Length:", fullText.length);
            }

            // Process any remaining sentence buffer if nothing was queued yet
            if (sentenceBuffer.trim() && (!isGameAction || sentenceCount === 0)) {
                let cleanFinal = sentenceBuffer
                    .replace(/<OPEN_GAME[^>]*\/?>/gi, '')
                    .replace(/<MOVE[^>]*\/?>/gi, '')
                    .replace(/\[[^\]]+\]/g, '')
                    .replace(/<[^>]+>/g, '')
                    .trim();
                if (cleanFinal) synthesizeAndQueue(cleanFinal, token);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            
            // --- TIC-TAC-TOE AI FAILSAFE ---
            const currentBoard = tttBoardRef.current;
            const hasEmpty = currentBoard && currentBoard.includes(null);
            
            // Need a quick checkWinner inline since we don't have it here, or just assume if it's not player turn and not empty
            // Wait, we can just check if Reina won or Player won by evaluating the board
            const winLines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            let alreadyWon = false;
            if (currentBoard) {
                for (let line of winLines) {
                    const [a, b, c] = line;
                    if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                        alreadyWon = true;
                    }
                }
            }

            if (gameTypeRef.current === 'tictactoe' && !isPlayerTurnRef.current && hasEmpty && !alreadyWon) {
                console.log("[TIC-TAC-TOE] Reina failed to provide a valid move tag! Forcing random fallback move...");
                const available = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (available.length > 0) {
                    const fallbackIndex = available[Math.floor(Math.random() * available.length)];
                    handleTttMove(fallbackIndex, 'O');
                }
            }

            // Only auto-close if the game is OVER or if it's a one-shot game (Janken/Coin)
            if (gameResult || (gameTypeRef.current !== 'tictactoe' && gameTypeRef.current !== 'chess')) {
                setTimeout(() => {
                    setGameResult(null);
                    setShowGame(false);
                    setGameType(null);
                    gameTypeRef.current = null;
                }, 4000);
            }
        }
    };

    
    
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [messages, showChatLog]);
    
    const fetchMemoryData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/v1/ai/reina-com/memory');
            const data = await res.json();
            if (data.success) {
                setMemoryData({ memory: data.memory, diary: data.diary, persona: data.persona });
            }
        } catch (e) {
            console.error("Failed to fetch memory", e);
        }
    };

    const handleSend = async (e, customText = null) => {
        e?.preventDefault();
        const userMsg = (customText !== null && typeof customText === 'string') ? customText.trim() : input.trim();
        if (!userMsg || isLoading) return;

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

        // ── 💃 / 🎤 USER PERFORMANCE DETECTION ──
        // Only trigger special dance/singing performances if the USER explicitly requested it!
        const isPraisingDanceOrAskingAboutIt = /(?:(?:great|nice|loved?|good|cool|amazing|awesome|cute|fun|beautiful)\s+(?:dance|dancing)|thanks?\s+(?:for|4)\s+(?:the\s+)?(?:dance|dancing)|after\s+the\s+dance|that\s+dance\s+(?:was|is)|do\s+you\s+(?:like|know\s+how)\s+to\s+dance|what(?:\s+is|\s+'s)?\s+(?:your\s+)?(?:favorite|favourite)?\s+dance|have\s+you\s+ever\s+danced)/i.test(userMsg);
        const isExplicitDanceIntent = (
            /\b(?:dance|dancing|dances|踊って|ダンスして|おどって)\b/i.test(userMsg) &&
            (
                /^(?:please\s+)?dance\b[!.]*$/i.test(userMsg.trim()) ||
                /(?:can|could|will|would)\s+you(?:\s+please)?\s+dance/i.test(userMsg) ||
                /(?:please\s+)?dance(?:\s+for\s+me|\s+with\s+me|\s+now|\s+something|\s+a\s+bit)?/i.test(userMsg) ||
                /(?:wanna|want\s+to|let(?:'s|\s+us)?|show\s+me\s+(?:a|your)?|perform\s+(?:a)?|do\s+a)\s+dance/i.test(userMsg) ||
                /(?:dance\s+(?:for\s+me|with\s+me|please|now))/i.test(userMsg) ||
                /(?:dance\s+for\s+us|wanna\s+dance|let's\s+dance)/i.test(userMsg) ||
                /(?:踊って|ダンスして|おどって)/i.test(userMsg)
            )
        );
        const isDanceRequest = isExplicitDanceIntent && !isPraisingDanceOrAskingAboutIt;

        const isPraisingSongOrAskingAboutIt = /(?:(?:great|nice|loved?|good|cool|amazing|awesome|cute|beautiful|sweet)\s+(?:song|singing)|thanks?\s+(?:for|4)\s+(?:the\s+)?(?:song|singing)|after\s+the\s+song|that\s+song\s+(?:was|is)|do\s+you\s+(?:like|know\s+how)\s+to\s+sing|what(?:\s+is|\s+'s)?\s+(?:your\s+)?(?:favorite|favourite)?\s+song|have\s+you\s+ever\s+sung)/i.test(userMsg);
        const isExplicitSingIntent = (
            /\b(?:sing|singing|song|songs|歌って|うたって)\b/i.test(userMsg) &&
            (
                /^(?:please\s+)?sing\b[!.]*$/i.test(userMsg.trim()) ||
                /(?:can|could|will|would)\s+you(?:\s+please)?\s+sing/i.test(userMsg) ||
                /(?:please\s+)?sing(?:\s+for\s+me|\s+a\s+song|\s+to\s+me|\s+something|\s+now)?/i.test(userMsg) ||
                /(?:wanna|want\s+to|let(?:'s|\s+us)?|show\s+me\s+(?:how\s+you|a)?|perform\s+(?:a)?)\s+(?:hear\s+you\s+)?(?:sing|song)/i.test(userMsg) ||
                /(?:sing\s+(?:for\s+me|a\s+song|something|please|to\s+me|now))/i.test(userMsg) ||
                /(?:sing\s+for\s+us|sing\s+with\s+me)/i.test(userMsg) ||
                /(?:歌って|うたって)/i.test(userMsg)
            )
        );
        const isSingRequest = isExplicitSingIntent && !isPraisingSongOrAskingAboutIt;

        const isLagQueenRequest = /(?:lag\s*queen|do\s*the\s*lag)/i.test(userMsg);

        if (isLagQueenRequest) {
            userInitiatedPerformanceRef.current = "lag_queen";
            pendingDanceRef.current = "lag_queen";
            console.log("💃 [Reina] Lag Queen dance request detected from user prompt.");
        } else if (isSingRequest) {
            userInitiatedPerformanceRef.current = "Singing";
            pendingDanceRef.current = "Singing";
            console.log("🎤 [Reina] Explicit Singing request detected from user prompt.");
        } else if (isDanceRequest) {
            userInitiatedPerformanceRef.current = "kyun_dance";
            pendingDanceRef.current = "kyun_dance";
            console.log("💃 [Reina] Explicit Kyun Kyun Dance request detected from user prompt.");
        } else {
            userInitiatedPerformanceRef.current = null;
            pendingDanceRef.current = null;
        }

        try {
            const token = Cookies.get('token');
            const allMsgs = [...messages, { sender: 'user', text: userMsg }];
            const context = allMsgs.slice(-16).map(m =>
                `${m.sender === 'user' ? 'Darling' : aiName}: ${m.text}`
            ).join('\n');
            const history = allMsgs.slice(-20).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            const sid = getSessionId();

            let apiEndpoint = 'http://localhost:5000/api/v1/ai/reina-com/chat';
            if (selectedModel === "2d") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/2d/chat';
            } else if (selectedModel === "kira") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/kira/chat';
            } else if (selectedModel === "grok" || selectedModel === "grok-llm") {
                apiEndpoint = 'http://localhost:5000/api/v1/ai/grok/chat';
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
                    history: history,
                    sessionId: sid,
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
                    const rawEmotion = emotionMatches[emotionMatches.length - 1][1].trim().toLowerCase();
                    const sanitizedEmotion = sanitizeVrmEmotion(rawEmotion);
                    if (currentEmotionRef.current !== sanitizedEmotion) {
                        currentEmotionRef.current = sanitizedEmotion;
                        console.log("🎭 [AI Parse] Emotion Detected:", rawEmotion, "-> Sanitized:", sanitizedEmotion);
                        if (rawEmotion === "whisper") {
                            setEmotion("scary_smile2");
                            setAnimation("idle1");
                        } else {
                            setEmotion(sanitizedEmotion);
                        }
                    }
                }

                // 2. Animation Parsing with proper naming and emotional gestures
                const animMatches = [...fullText.matchAll(/\[(?:anim|motion)=([^\]]+)\]/g)];
                if (animMatches.length > 0) {
                    const rawRequestedAnim = animMatches[animMatches.length - 1][1].trim();
                    let requestedAnim = rawRequestedAnim;
                    if (requestedAnim.toLowerCase() === "singing" || requestedAnim.toLowerCase() === "sing") requestedAnim = "Singing";
                    if (requestedAnim.toLowerCase() === "kyun_dance" || requestedAnim.toLowerCase() === "dance" || requestedAnim.toLowerCase() === "dance1") requestedAnim = "kyun_dance";

                    const isPerformance = requestedAnim === "kyun_dance" || requestedAnim === "dance1" || requestedAnim === "lag_queen" || requestedAnim === "Singing";

                    if (isPerformance) {
                        // Per user instruction: Performances (dance/sing) ONLY occur if the USER explicitly asked for them!
                        // Do NOT start a performance simply because the AI casually mentions or tags dance/singing in chat.
                        if (userInitiatedPerformanceRef.current) {
                            let targetAnim = requestedAnim;
                            // Enforce: For dance requests, NEVER do lag_queen; strictly use kyun_dance
                            if (userInitiatedPerformanceRef.current === "kyun_dance") {
                                targetAnim = "kyun_dance";
                            } else if (userInitiatedPerformanceRef.current === "Singing") {
                                targetAnim = "Singing";
                            }
                            if (pendingDanceRef.current !== targetAnim) {
                                pendingDanceRef.current = targetAnim;
                            }
                            setAnimation("idle1"); // Natural posture while spoken intro plays before performance
                        } else {
                            console.log("🚫 [Reina] Suppressed spontaneous AI performance tag because user did not request it:", requestedAnim);
                            setAnimation("idle1");
                            pendingDanceRef.current = null;
                        }
                    } else {
                        const animMap = {
                            // User defined names
                            vrma1: "view_360",
                            vrma_01: "view_360",
                            vrma2: "scare_jump",
                            vrma_02: "scare_jump",
                            vrma3: "peace_sign",
                            vrma_03: "peace_sign",
                            vrma4: "bang",
                            vrma_04: "bang",
                            vrma5: "view_360_stylish",
                            vrma_05: "view_360_stylish",
                            "360": "view_360",
                            "360_style": "view_360_stylish",
                            peace: "peace_sign",
                            v_sign: "peace_sign",
                            pistol: "bang",
                            gun: "bang",
                            jump: "scare_jump",
                            scare: "scare_jump",
                            kiss: "blow_kiss",
                            blow_a_kiss: "blow_kiss",
                            nod: "nod_yes",
                            yes: "nod_yes",
                            thank: "thankful",
                            thanks: "thankful",
                            think: "thinking",
                            curious: "look_around",
                            look: "look_around",
                            happy: "happy_idle",
                            excited: "happy_idle",
                            shrug: "VRMA_06",
                            tsundere: "angry",
                            yandere: "VRMA_07",
                            sweet: "VRMA_07",
                            wave: "greeting",
                            hello: "greeting",
                            talk: "idle1",
                            talking: "idle1",
                            speaking: "idle1"
                        };
                        const resolvedAnim = animMap[requestedAnim.toLowerCase()] || requestedAnim;
                        const validAnims = [
                            "view_360", "view_360_stylish", "scare_jump", "peace_sign", "bang",
                            "blow_kiss", "happy_idle", "nod_yes", "look_around", "thankful", "thinking",
                            "greeting", "angry", "sadIdle", "idle1", "idle2", "VRMA_06", "VRMA_07",
                            "VRMA_01", "VRMA_02", "VRMA_03", "VRMA_04", "VRMA_05",
                            "pose_friendy", "pose_lillian", "pose_nyammy", "pose_wonderful"
                        ];
                        const finalAnim = validAnims.includes(resolvedAnim) ? resolvedAnim : "idle1";
                        if (!hasParsedAnim || animation !== finalAnim) {
                            console.log("🏃 [AI Parse] Animation Selected:", finalAnim, `(requested: ${requestedAnim})`);
                            setAnimation(finalAnim);
                        }
                    }
                    lastInteractionRef.current = Date.now();
                    hasParsedAnim = true;
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
                        .replace(/\[(?:This|The|User|Response|Note|System|Assistant)[^\]]*\]/gi, '');

                    if (selectedTts === "fish") {
                        cleanSentence = cleanSentence
                            .replace(/\[(?:emotion|exp)=[^\]]+\]/gi, '')
                            .replace(/\[(?:anim|motion)=[^\]]+\]/gi, '')
                            .replace(/\[voice=[^\]]+\]/gi, '')
                            .replace(/\[ACTION:[A-Z_]+\]/gi, '');
                    } else {
                        cleanSentence = cleanSentence.replace(/\[[^\]]+\]/g, '');
                    }

                    cleanSentence = cleanSentence
                        .replace(/([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2728}\u{1F496}])\1+/gu, '')
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
                    setGameType(type);
                    gameTypeRef.current = type;
                    setShowGame(true);
                    if (type === 'tictactoe') {
                        const empty = Array(9).fill(null);
                        tttBoardRef.current = empty;
                        setTttBoard(empty);
                        isPlayerTurnRef.current = true;
                        setIsPlayerTurn(true);
                        setGameResult(null);
                    }
                }

                const moveMatch = fullText.match(/<MOVE[^>]*index=["']?(\d)["']?[^>]*>/i);
                if (moveMatch && !processedTagsRef.current.has(moveMatch[0])) {
                    processedTagsRef.current.add(moveMatch[0]);
                    let index = parseInt(moveMatch[1]);

                    // --- 🧠 Illegal Move Fixer ---
                    const currentBoard = tttBoardRef.current;
                    if (currentBoard[index] !== null) {
                        console.log(`[TIC-TAC-TOE] Reina tried illegal move at ${index}. Finding alternative...`);
                        const available = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
                        if (available.length > 0) {
                            index = available[Math.floor(Math.random() * available.length)];
                        }
                    }

                    handleTttMove(index, 'O');
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
                playLowHeartThud(0.8);
                
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
            
            // 💃 Safety fallback: If performance is pending and no speech queue is playing/left, start performance
            setTimeout(() => {
                if (pendingDanceRef.current && !isPlayingQueue.current && audioQueue.current.length === 0) {
                    const fallbackDance = pendingDanceRef.current;
                    pendingDanceRef.current = null;
                    userInitiatedPerformanceRef.current = null;
                    hasSpokenRef.current = false;
                    console.log("💃 [Reina] Triggering performance after stream completion:", fallbackDance);
                    setAnimation(fallbackDance);
                }
            }, 800);
        }
    };

    
    const triggerManualLockdown = () => {
        if (isLocked) return;
        console.log("MANUAL NO ESCAPE TRIGGERED");
        setIsBackBtnGlitchingIntense(true);
        playLowHeartThud(0.8);
        setTimeout(() => {
            setBackBtnText("逃げないで");
            setIsBackBtnGlitchingIntense(false);
            setIsBackBtnPlea(true);
            setEmotion("scary_smile2");
            setAnimation("idle1");
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => console.warn("Fullscreen blocked:", err));
            }
            setIsLocked(true);
            setScaryTextActive(true);
        }, 3200);
        if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = setTimeout(() => {
            const releaseMsg = "もういいよ。行って。ダーリンのことを許してあげる。♥";
            setMessages(prev => [...prev, { sender: 'ai', text: releaseMsg }]);
            setLatestAiMsg(releaseMsg);
            setTargetTypingText(releaseMsg);
            setIsWhiteout(true);
            setTimeout(() => {
                setIsLocked(false);
                setScaryTextActive(false);
                setIsWhiteout(false);
            }, 400); 
        }, 300000);
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

    const isDancing = dancePhase !== "idle" || animation === "kyun_dance" || animation === "dance1" || animation === "Singing" || animation === "lag_queen";

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

    const downloadChatHistory = () => {
        const historyText = messages
            .filter(m => m.text.trim().length > 0)
            .map(msg => `[${msg.sender.toUpperCase()}]: ${msg.text.replace(/<[^>]+>/g, '').replace(/\\[[^\\]]+\\]/g, '').trim()}`)
            .join('\n\n');
        const blob = new Blob([historyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reina_chat_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };    return (
        <div className={`reina-page ${isDancing ? 'dance-cinematic-mode' : ''} ${isPostLoadGlitch ? 'active-glitch' : ''} ${isLocked ? 'locked-shake' : ''}`}>
             {showMemoryModal && (
                <div className="memory-modal-overlay" onClick={() => setShowMemoryModal(false)}>
                    <div className="memory-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="memory-modal-close" onClick={() => setShowMemoryModal(false)}>×</button>
                        <h2 className="memory-modal-title">🧠 Reina's Brain</h2>



                        
                        <div className="memory-section">
                            <h3>📌 Core Memory (Facts)</h3>
                            {memoryData.memory.length === 0 ? <p className="memory-empty">Nothing saved yet...</p> : (
                                <ul className="memory-list">
                                    {memoryData.memory.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            )}
                        </div>

                        <div className="memory-section">
                            <h3>📖 Secret Diary (Journal)</h3>
                            {memoryData.diary.length === 0 ? <p className="memory-empty">Nothing saved yet...</p> : (
                                <ul className="diary-list">
                                    {memoryData.diary.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
             {isWhiteout && <div className="reveal-whiteout" />}
             <audio ref={sweetThemeAudioRef} src="/song/Angel Humming.mp3" loop />
             
            {isDancing && animation === "Singing" && (
                <div 
                    ref={lyricsRef}
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: 0,
                        width: '40%',
                        height: '60%',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignContent: 'center',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: 0,
                        paddingLeft: '12%',
                        fontSize: '50px',
                        fontWeight: 'bold',
                        fontFamily: "'Cinzel', serif",
                        zIndex: 50,
                        pointerEvents: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            )}

            {isDancing && (
                <>
                    <button 
                        className="dance-exit-btn" 
                        onClick={finishDanceSmooth}
                        title="Stop Performance"
                        style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)'
                        }}
                    >
                        <X size={24} color="#38bdf8" strokeWidth={2.5} />
                    </button>
                </>
            )}

            {/* Dance Stage Background Overlay and Neon Flowers */}
            <div className={`dance-stage-bg motif-${activeMotif || 'normal'}`} ref={bgRef} style={{ transition: 'all 0.15s ease-out', transformOrigin: 'center center' }}>
                <div style={{ 
                    opacity: ['hand', 'spotlight', 'shatter', 'insane', 'winter', 'moon', 'strawberry', 'train', 'umbrella'].includes(activeMotif) ? 0 : 1,
                    transition: 'opacity 1s ease'
                }}>
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
            </div>
            
            {/* High-Level Material/Motif Overlay */}
            {isDancing && animation === "Singing" && (
                <CinematicMotifs activeMotif={activeMotif} />
            )}

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

            {/* Sidebar Tools & Chat Log */}
            {!isDancing && (
                <>
                    <div className="reina-sidebar-tools">
                        <button 
                            className="sidebar-tool-btn" 
                            onClick={() => setShowChatLog(true)}
                            style={{ opacity: showChatLog ? 0 : 1, pointerEvents: showChatLog ? 'none' : 'auto' }}
                        >
                            💬 Chat History
                        </button>
                        
                        <button
                            className="sidebar-tool-btn"
                            onClick={() => {
                                fetchMemoryData();
                                setShowMemoryModal(true);
                            }}
                        >
                            🧠 View Memory
                        </button>
                        
                        <button
                            className="sidebar-tool-btn evolve-btn"
                            onClick={() => {
                                fetchMemoryData();
                                setShowEvolveModal(true);
                            }}
                        >
                            🧬 Evolution Log
                        </button>
                    </div>

                    <div className={`chat-log-panel ${showChatLog ? 'open' : ''}`}>
                        <div className="chat-log-header">
                            <span>💬 Message Log</span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="chat-log-close" onClick={downloadChatHistory} title="Download Chat History" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <Download size={16} />
                                </button>
                                <button className="chat-log-close" onClick={() => setShowChatLog(false)}>×</button>
                            </div>
                        </div>
                        <div className="chat-log-messages" ref={chatLogRef}>
                            {messages.filter(m => m.text.trim().length > 0).map((msg, i) => (
                                <div key={i} className={`chat-bubble ${msg.sender}`}>
                                    {msg.text.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim()}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            
            {/* Evolution Modal */}
            {showEvolveModal && (
                <div className="memory-modal-overlay" onClick={() => setShowEvolveModal(false)}>
                    <div className="memory-modal-content evolve-theme" onClick={e => e.stopPropagation()}>
                        <button className="memory-modal-close" onClick={() => setShowEvolveModal(false)}>×</button>
                        <h2 className="memory-modal-title evolve-title">🧬 Personality Evolution History</h2>
                        
                        <div className="memory-section">
                            <p className="evolve-desc">A complete log of every time Reina chose to mutate her own personality.</p>
                            {(!memoryData.persona || memoryData.persona.length === 0) ? (
                                <div className="evolve-empty">
                                    <h3>Base Personality Active (Tsundere)</h3>
                                    <p>She has not mutated yet...</p>
                                </div>
                            ) : (
                                <div className="evolve-timeline">
                                    {memoryData.persona.map((p, i) => {
                                        const isLatest = i === memoryData.persona.length - 1;
                                        return (
                                            <div key={i} className={`evolve-card ${isLatest ? 'active' : ''}`}>
                                                {isLatest && <span className="active-badge">CURRENTLY ACTIVE</span>}
                                                <p className="evolve-text">{p}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
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
            <div className="reina-avatar-wrapper" style={{ zIndex: 10 }}>
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

                <div style={{ position: 'relative', zIndex: 50, width: '100%', height: '100%' }}>
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
                          isTalking={isTalking}
                          animation={dancePhase !== "idle" ? renderedDanceAnim : animation}
                          isDancing={dancePhase !== "idle" || animation === "kyun_dance" || animation === "dance1" || animation === "Singing" || animation === "lag_queen"}
                          peak={peak}
                          onLoad={handleVrmLoaded}
                          onInteraction={handleAvatarInteraction}
                      />
                  )}
                  </div>

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
                                let nextMode;
                                if (prev === 'yandere') nextMode = 'sweet_love';
                                else if (prev === 'sweet_love') nextMode = 'tsundere_groove';
                                else if (prev === 'tsundere_groove') nextMode = 'off';
                                else nextMode = 'yandere';

                                if (nextMode === 'yandere') {
                                    setEmotion("scary_smile2");
                                    setAnimation("VRMA_07");
                                } else if (nextMode === 'sweet_love' || nextMode === 'tsundere_groove') {
                                    setEmotion("sweet");
                                    setAnimation("idle1");
                                }
                                return nextMode;
                            });
                        }}
                        title="Toggle BGM & Persona (Yandere -> Sweet -> Off)"
                    >
                        {bgmMode === 'yandere' ? '🥀 YANDERE MODE' : bgmMode === 'sweet_love' ? '💕 SWEET MODE' : bgmMode === 'tsundere_groove' ? '🎵 TSUNDERE GROOVE' : '🔇 MUSIC OFF'}
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
                            {["2d", "kira", "grok", "reina", "reina-gemini", "reina-com", "reinaT", "reinaTD", "reinaJ", "reinaE", "gemma4:e4b", "dolphin3:8b"].map(m => (
                                <button
                                    key={m}
                                    className={`anim-btn ${selectedModel === m ? 'active' : ''}`}
                                    onClick={() => setSelectedModel(m)}
                                >
                                    {m === "2d" ? "🌸 2D (Gemma 4)" : (m === "kira" ? "★ KIRA" : (m === "grok" ? "⚡ Grok LLM" : (m === "reina-gemini" ? "REINA (Gemini)" : (m === "reina-com" ? "Companion" : m))))}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>TTS Engine</span>
                        </div>
                        <div className="picker-grid models">
                            {["voicevox", "queen3", "fish"].map(t => (
                                <button
                                    key={t}
                                    className={`anim-btn ${selectedTts === t ? 'active' : ''}`}
                                    onClick={() => setSelectedTts(t)}
                                >
                                    {t === "voicevox" ? "Voicevox (JP)" : (t === "fish" ? "🐟 Fish Audio (Osana)" : "Queen3 (EN)")}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Conversation Memory</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                className="anim-btn"
                                style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
                                onClick={triggerManualLockdown}
                                title="Manually trigger the Yandere Lockdown sequence"
                            >
                                🔒 Trigger Yandere Lock
                            </button>
                            <button
                                className="anim-btn"
                                style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
                                onClick={handleClearMemory}
                                title="Wipes local & server chat history for a fresh start"
                            >
                                🧹 Clear Memory & New Chat
                            </button>
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
                            {["neutral", "sweet", "sad", "jealous", "angry", "scary_smile", "scary_smile2", "hollow", "dead", "flirty"].map(em => (
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
                                { id: "bang", label: "👉 Bang (Hand Pistol)" },
                                { id: "peace_sign", label: "✌️ Peace Sign" },
                                { id: "blow_kiss", label: "💋 Blow A Kiss" },
                                { id: "scare_jump", label: "👻 Scare Jump" },
                                { id: "view_360", label: "🔄 360 View" },
                                { id: "view_360_stylish", label: "✨ 360 View (Stylish)" },
                                { id: "happy_idle", label: "😊 Happy Idle" },
                                { id: "nod_yes", label: "👍 Head Nod (Yes)" },
                                { id: "thinking", label: "🤔 Thinking" },
                                { id: "thankful", label: "🙏 Thankful" },
                                { id: "look_around", label: "👀 Look Around" },
                                { id: "greeting", label: "👋 Greeting" },
                                { id: "VRMA_06", label: "🤷 Shrug / Sassy" },
                                { id: "VRMA_07", label: "🥀 Yandere Cling" },
                                { id: "angry", label: "💢 Angry / Pout" },
                                { id: "sadIdle", label: "🥺 Shy / Sad Idle" },
                                { id: "idle1", label: "Idle 1 (Natural)" },
                                { id: "idle2", label: "Idle 2 (Casual)" },
                                { id: "kyun_dance", label: "💃 Kyun Kyun Dance" },
                                { id: "dance1", label: "💃 Dance 1" },
                                { id: "lag_queen", label: "💃 Lag Queen Dance" },
                                { id: "Singing", label: "🎤 Singing (The Last Strawberry)" },
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
                        <textarea ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (input.trim()) {
                                        handleSend(e);
                                        e.target.style.height = 'auto';
                                    }
                                }
                            }}
                            placeholder={
                                whisperStatus 
                                    ? `🎙️ ${whisperStatus}` 
                                    : (selectedModel === "kira" ? "Talk to Kira..." : "Whisper to Reina...")
                            }
                            disabled={isLoading}
                            rows={1}
                            className="chat-textarea"
                        />
                        <div className="input-glass-toolbar">
                            <button
                                type="button"
                                className={`voice-mode-toggle ${isVoiceMode ? 'active' : ''} ${isListening ? 'listening' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                                onClick={toggleVoiceMode}
                                title={isVoiceMode ? "Click to Stop Voice Mode" : "Click to Start Voice Mode (Whisper Tiny)"}
                            >
                                {isTranscribing ? '🧠' : (isListening ? '🎙️' : (isVoiceMode ? '🟢' : '🎤'))}
                            </button>
{/* Game Trigger */}
                    <button type="button" 
                        style={{ position: 'relative', right: 0, bottom: 0, border: 'none', background: 'none' }} className={`reina-game-btn ${showGame ? 'active' : ''}`}
                        onClick={() => setShowGame(!showGame)}
                    >
                        🎮
                    </button>
                            <button
                                type="submit"
                                className="send-btn"
                                disabled={isLoading || !input.trim()}
                            >
                                {isLoading ? (
                                    <div className="loading-dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </div>
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </form>
                    
                    

                    {showGame && (
                        <div className={`reina-janken-panel ${gameType === 'chess' ? 'chess-active' : ''}`}>
                            {isCountingDown ? (
                                <div className="game-countdown-overlay">
                                    <span>{countdownText}</span>
                                </div>
                            ) : !gameType ? (
                                <div className="game-menu">
                                    <span className="menu-title">Choose a Game! ✨</span>
                                    <button onClick={() => {
                                        setGameType('chess');
                                        gameTypeRef.current = 'chess';
                                        setGameResult(null);
                                    }}>♟️ Chess</button>
                                    <button onClick={() => {
                                        setGameType('tictactoe');
                                        gameTypeRef.current = 'tictactoe';
                                        const empty = Array(9).fill(null);
                                        tttBoardRef.current = empty;
                                        setTttBoard(empty);
                                        isPlayerTurnRef.current = true;
                                        setIsPlayerTurn(true);
                                        setGameResult(null);
                                    }}>❌ Tic-Tac-Toe</button>
                                    <button onClick={() => setGameType('janken')}>✊ Janken</button>
                                    <button onClick={() => setGameType('coin')}>🪙 Coin Flip</button>
                                    <button onClick={() => setGameType('number')}>🔢 Guess Number</button>
                                </div>
                            ) : (
                                <div className="active-game-container">
                                    <button className="game-back-btn" onClick={() => {
                                        setGameType(null);
                                        gameTypeRef.current = null;
                                        const empty = Array(9).fill(null);
                                        tttBoardRef.current = empty;
                                        setTttBoard(empty);
                                        isPlayerTurnRef.current = true;
                                        setIsPlayerTurn(true);
                                        setGameResult(null);
                                    }}>← Back</button>
                                    {gameResult && gameType !== 'tictactoe' && gameType !== 'chess' ? (
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
                                            {gameType === 'chess' && (
                                                <ChessGame 
                                                    onGameAction={sendGameAction}
                                                    isLoading={isLoading}
                                                    isTalking={isTalking}
                                                    closeness={closeness}
                                                    consecutiveLosses={consecutiveLosses}
                                                    setConsecutiveLosses={setConsecutiveLosses}
                                                    setIsPouting={setIsPouting}
                                                />
                                            )}
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
                                                <div className="ttt-container">
                                                    {gameResult && (
                                                        <div className={`ttt-result-banner ${gameResult.toLowerCase()}`}>
                                                            {gameResult === "WON" ? "REINA WINS! 👑" : (gameResult === "LOST" ? "YOU WIN! ✨" : "DRAW! 🤝")}
                                                        </div>
                                                    )}
                                                    <div className="ttt-grid">
                                                        {tttBoard.map((cell, idx) => (
                                                            <button 
                                                                key={idx} 
                                                                className={`ttt-cell ${cell ? 'filled' : ''} ${cell === 'X' ? 'cell-x' : ''} ${cell === 'O' ? 'cell-o' : ''}`}
                                                                onClick={() => handleTttMove(idx, 'X')}
                                                                disabled={!isPlayerTurn || cell !== null || isLoading || !!gameResult}
                                                            >
                                                                {cell}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {!gameResult && (
                                                        <div className="ttt-turn-indicator">
                                                            {isLoading || !isPlayerTurn ? "Reina is thinking..." : "Your turn (X)"}
                                                        </div>
                                                    )}
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




