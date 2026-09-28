import librosa
from faster_whisper import WhisperModel
import json
import os
import warnings
warnings.filterwarnings("ignore")

song_path = r"client\public\song\The Last Strawberry.mp3"
output_path = r"client\public\song\The_Last_Strawberry_analysis.json"

print("Loading audio for librosa...")
try:
    y, sr = librosa.load(song_path)

    print("Detecting beats (booms)...")
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    
    # Calculate RMS energy to find strong beats
    rms = librosa.feature.rms(y=y)[0]
    rms_times = librosa.frames_to_time(range(len(rms)), sr=sr)
    
    import numpy as np
    max_rms = np.max(rms)
    strong_beats = []
    
    for bt in beat_times:
        idx = np.argmin(np.abs(rms_times - bt))
        if rms[idx] > max_rms * 0.45: # Only beats during loud sections
            strong_beats.append(bt)
            
    print(f"Filtered {len(beat_times)} tempo beats down to {len(strong_beats)} strong booms.")
    beat_times = strong_beats
except Exception as e:
    print("Librosa error:", e)
    beat_times = []

print("Loading WhisperModel...")
try:
    model = WhisperModel("base", device="cuda", compute_type="float16")
except Exception:
    model = WhisperModel("base", device="cpu", compute_type="int8")

print("Transcribing...")
segments, info = model.transcribe(song_path, word_timestamps=True)

lyrics_data = []
for segment in segments:
    words = []
    if segment.words:
        for word in segment.words:
            words.append({
                "word": word.word,
                "start": word.start,
                "end": word.end
            })
    lyrics_data.append({
        "start": segment.start,
        "end": segment.end,
        "text": segment.text,
        "words": words
    })

output_data = {
    "beats": list(beat_times) if hasattr(beat_times, 'tolist') else beat_times,
    "lyrics": lyrics_data
}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"Analysis saved to {output_path}")
