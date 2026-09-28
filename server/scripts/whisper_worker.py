import sys
import json
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stdin.reconfigure(encoding='utf-8')

def main():
    try:
        from faster_whisper import WhisperModel
        
        # Load 'base' model on GPU (RTX 4050)
        try:
            model = WhisperModel("base", device="cuda", compute_type="float16")
        except Exception:
            model = WhisperModel("base", device="cpu", compute_type="int8")

        # Ready signal
        print(json.dumps({"ready": True}), flush=True)

        # Listen for file paths on stdin in a persistent loop
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            if line == "EXIT":
                break

            try:
                data = json.loads(line)
                audio_path = data.get("path", "")
                target_lang = data.get("language", None) # None = auto
            except Exception:
                audio_path = line
                target_lang = None

            if not os.path.exists(audio_path):
                print(json.dumps({"success": False, "error": f"File not found: {audio_path}", "text": ""}), flush=True)
                continue

            try:
                # Transcribe with VAD filtering and context prompt to prevent hallucinations
                segments, info = model.transcribe(
                    audio_path,
                    beam_size=5,
                    language=target_lang,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                    initial_prompt="Darling, Reina, anime, sweet, Japanese, English, conversation."
                )

                # Filter and join segments
                text_list = []
                for s in segments:
                    if s.text:
                        text_list.append(s.text.strip())

                full_text = " ".join(text_list).strip()

                output = {
                    "success": True,
                    "text": full_text,
                    "language": info.language,
                    "duration": info.duration
                }
                print(json.dumps(output, ensure_ascii=False), flush=True)
            except Exception as e:
                print(json.dumps({"success": False, "error": str(e), "text": ""}), flush=True)

    except Exception as init_err:
        print(json.dumps({"ready": False, "error": str(init_err)}), flush=True)

if __name__ == "__main__":
    main()
