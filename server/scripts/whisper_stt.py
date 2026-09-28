import sys
import json
import os

# Set UTF-8 stdout encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def transcribe(audio_path):
    try:
        from faster_whisper import WhisperModel
        
        # Try CUDA first (RTX 4050 GPU), fallback to CPU
        try:
            model = WhisperModel("tiny", device="cuda", compute_type="float16")
        except Exception:
            model = WhisperModel("tiny", device="cpu", compute_type="int8")

        segments, info = model.transcribe(audio_path, beam_size=5, language=None)
        
        full_text = " ".join([segment.text for segment in segments]).strip()
        
        output = {
            "success": True,
            "text": full_text,
            "language": info.language,
            "duration": info.duration
        }
        print(json.dumps(output, ensure_ascii=False))
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "text": ""
        }
        print(json.dumps(error_output, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No audio file provided", "text": ""}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}", "text": ""}))
        sys.exit(1)
        
    transcribe(file_path)
