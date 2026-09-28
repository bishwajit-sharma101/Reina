import axios from 'axios';

class WhisperSTTService {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.onVolumeCallback = null;
        this.animationFrameId = null;
    }

    /**
     * Preload / check STT service
     */
    async init(onProgress = () => {}) {
        onProgress({ status: 'ready', message: 'GPU Whisper Ready' });
        return true;
    }

    /**
     * Start microphone recording with live volume detection
     * @param {Function} onVolume - Live volume callback (0-1)
     */
    async startRecording(onVolume = null) {
        if (this.isRecording) {
            return;
        }

        this.onVolumeCallback = onVolume;
        this.recordedChunks = [];

        // Request microphone
        this.audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        // Set up Web Audio API Analyser for volume visualization
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const checkVolume = () => {
            if (!this.isRecording) return;
            if (this.analyser && this.onVolumeCallback) {
                this.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const avgVolume = sum / dataArray.length / 255;
                this.onVolumeCallback(avgVolume);
            }
            this.animationFrameId = requestAnimationFrame(checkVolume);
        };

        // Determine best supported MIME type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg');

        this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.mediaRecorder.start(100); // 100ms slices
        this.isRecording = true;
        checkVolume();
        console.log("🎙️ [WhisperSTT] Hardware microphone recording started.");
    }

    /**
     * Stop recording and send audio to GPU Whisper backend
     * @returns {Promise<{text: string, language?: string}>}
     */
    async stopRecordingAndTranscribe() {
        if (!this.isRecording) {
            return { text: '' };
        }

        this.isRecording = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                this.cleanup();
                return resolve({ text: '' });
            }

            this.mediaRecorder.onstop = async () => {
                try {
                    const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
                    this.cleanup();

                    if (blob.size < 1024) {
                        console.warn("⚠️ [WhisperSTT] Audio too short to transcribe.");
                        return resolve({ text: '' });
                    }

                    console.log(`🚀 [WhisperSTT] Sending ${blob.size} bytes to Faster-Whisper GPU backend...`);
                    const startTime = performance.now();

                    const formData = new FormData();
                    formData.append('audio', blob, 'user_speech.webm');

                    const response = await axios.post('http://localhost:5000/api/v1/ai/stt', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        timeout: 15000
                    });

                    const elapsed = Math.round(performance.now() - startTime);
                    const transcript = (response.data?.text || '').trim();
                    console.log(`✅ [WhisperSTT] GPU Transcription complete (${elapsed}ms): "${transcript}"`);

                    resolve({ text: transcript, language: response.data?.language, elapsedMs: elapsed });
                } catch (err) {
                    console.error("❌ [WhisperSTT] Backend STT error:", err);
                    this.cleanup();
                    resolve({ text: '' });
                }
            };

            try {
                this.mediaRecorder.stop();
            } catch (e) {
                this.cleanup();
                resolve({ text: '' });
            }
        });
    }

    /**
     * Cancel recording
     */
    cancelRecording() {
        this.isRecording = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try { this.mediaRecorder.stop(); } catch (e) {}
        }
        this.cleanup();
    }

    cleanup() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(t => t.stop());
            this.audioStream = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }
}

export const whisperSTT = new WhisperSTTService();
