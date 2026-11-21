import os
import json
import base64
import urllib.request
import wave
from pathlib import Path

API_KEY = os.environ["CARTESIA_API_KEY"]
URL = "https://api.cartesia.ai/tts/sse"

VOICE_ID_ANDI = "a053f6bc-7df4-40de-96d4-de026bc47ce8"

SCRIPT_TEXT = (
    "Tahun seribu delapan ratus tiga belas. "
    "Rombongan bupati sedang mencari lokasi ibu kota baru pengganti Limbangan di sekitar Sungai Cimanuk. "
    "Saat sedang membuka jalan di tengah semak belukar lebat, salah satu anggota tim tiba-tiba berteriak: "
    "Aduh, kakarut! Jempol saya tergores duri! "
    "Orang Belanda yang mendampingi justru salah dengar. "
    "Dengan logat kakunya dia mencatat: Aha! Garoet? Tempat ini kita namakan Garoet! "
    "Dan begitulah asal-usulnya. "
    "Dari jempol yang kakarut atau kecakar duri, lahirlah nama Garut yang kita kenal hingga hari ini."
)

def generate_voice():
    headers = {
        "X-API-Key": API_KEY,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
    }

    payload = {
        "model_id": "sonic-3.6",
        "transcript": SCRIPT_TEXT,
        "voice": {
            "mode": "id",
            "id": VOICE_ID_ANDI
        },
        "output_format": {
            "container": "raw",
            "encoding": "pcm_s16le",
            "sample_rate": 44100
        },
        "language": "id",
        "add_timestamps": True
    }

    print("Connecting to Cartesia SSE for voice: " + VOICE_ID_ANDI)
    req = urllib.request.Request(URL, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    audio_chunks = []
    all_timestamps = []

    with urllib.request.urlopen(req) as resp:
        for line in resp:
            line_str = line.decode("utf-8").strip()
            if not line_str.startswith("data:"):
                continue
            data_content = line_str[len("data:"):].strip()
            if not data_content:
                continue
            try:
                msg = json.loads(data_content)
                msg_type = msg.get("type")
                if msg_type == "chunk":
                    raw_b64 = msg.get("data")
                    if raw_b64:
                        audio_chunks.append(base64.b64decode(raw_b64))
                elif msg_type == "timestamps":
                    wt = msg.get("word_timestamps", {})
                    words = wt.get("words", [])
                    starts = wt.get("start", [])
                    ends = wt.get("end", [])
                    for w, s, e in zip(words, starts, ends):
                        all_timestamps.append({"word": w, "start": s, "end": e})
                elif msg_type == "done":
                    print("Stream done.")
                    break
            except Exception as e:
                print("Error:", e)

    out_wav = "D:/PROJECTS/z-automation-studio/public/assets/audio/garut-kakarut-voice.wav"
    out_words = "D:/PROJECTS/z-automation-studio/public/assets/audio/garut-kakarut-words.json"
    Path(out_wav).parent.mkdir(parents=True, exist_ok=True)

    full_audio = b"".join(audio_chunks)
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(full_audio)

    duration = len(full_audio) / (44100 * 2)
    print(f"Audio saved to {out_wav} (Duration: {duration:.2f}s)")

    with open(out_words, "w", encoding="utf-8") as f:
        json.dump({"words": all_timestamps, "duration": duration}, f, indent=2, ensure_ascii=False)
    print(f"Timestamps ({len(all_timestamps)} words) saved to {out_words}")

if __name__ == "__main__":
    generate_voice()
