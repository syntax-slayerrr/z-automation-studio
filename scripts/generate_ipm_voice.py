import os
import json
import base64
import urllib.request
import wave
from pathlib import Path

API_KEY = os.environ["CARTESIA_API_KEY"]
URL = "https://api.cartesia.ai/tts/sse"

# Andi: Expressive adult male voice
VOICE_ID_ANDI = "a053f6bc-7df4-40de-96d4-de026bc47ce8"

SCRIPT_TEXT = (
    "Tanggal 18 Juli 1961, sebuah sejarah besar bagi pergerakan pelajar Islam di Indonesia resmi dimulai. "
    "Lahirlah Ikatan Pelajar Muhammadiyah. "
    "Namun akarnya terbentang jauh ke belakang. "
    "Sejak tahun 1919 di Yogyakarta, para pelajar madrasah telah berhimpun dalam wadah bernama Siswo Projo. "
    "Momen krusial terjadi pada tahun 1958 di Garut. "
    "Pemuda Muhammadiyah bersepakat bahwa pelajar harus memiliki wadah otonom sendiri untuk membentengi aqidah dan keilmuan generasi muda. "
    "Dari kesepakatan di Garut, gagasan ini dimatangkan di Yogyakarta, "
    "hingga dideklarasikan secara nasional pada Konferensi di Surakarta. "
    "Diikat oleh semboyan suci: Nuun, demi pena dan apa yang mereka tuliskan. "
    "Enam dekade berlalu, api perjuangan IPM tak pernah padam."
)

def generate_voice(
    voice_id=VOICE_ID_ANDI,
    out_wav_path="public/assets/audio/ipm-voice.wav",
    out_words_path="public/assets/audio/ipm-words.json"
):
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
            "id": voice_id
        },
        "output_format": {
            "container": "raw",
            "encoding": "pcm_s16le",
            "sample_rate": 44100
        },
        "language": "id",
        "add_timestamps": True
    }

    print(f"Connecting to Cartesia SSE for voice: {voice_id}...")
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
                print("Error parsing event:", e)

    Path(out_wav_path).parent.mkdir(parents=True, exist_ok=True)
    full_audio = b"".join(audio_chunks)

    with wave.open(out_wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(full_audio)

    duration = len(full_audio) / (44100 * 2)
    print(f"WAV saved to {out_wav_path} (Duration: {duration:.2f}s, size: {len(full_audio)} bytes)")

    with open(out_words_path, "w", encoding="utf-8") as f:
        json.dump({"words": all_timestamps, "duration": duration}, f, indent=2, ensure_ascii=False)
    print(f"Word timestamps ({len(all_timestamps)} words) saved to {out_words_path}")

    return duration

if __name__ == "__main__":
    generate_voice()
