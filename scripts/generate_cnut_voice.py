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
# Galang: Calm, serene male voice
VOICE_ID_GALANG = "04b567df-2923-4b0c-896b-4b7df0a07e1a"

SCRIPT_TEXT = (
    "Seorang raja pernah membawa singgasana emasnya ke tepi pantai, "
    "lalu memerintahkan ombak samudra untuk berhenti. "
    "Tahun seribu dua puluh delapan, Raja Cnut dari Inggris muak dengan para menteri istananya. "
    "Setiap hari, para penjilat ini membungkuk dan bersumpah bahwa kekuasaan sang raja begitu mutlak, "
    "sampai-sampai alam semesta pun akan tunduk pada perintahnya. "
    "Bukannya bangga, sang raja justru menyuruh para menterinya menggotong kursi tahtanya langsung ke bibir pantai saat air pasang mulai naik. "
    "Dengan jubah sutra megah, Raja Cnut mengangkat tongkatnya ke arah laut dan berseru lantang: "
    "Wahai ombak, jangan berani-berani menyentuh kakiku! "
    "Tentu saja, hukum fisika tidak peduli gelar kerajaan. "
    "Gulungan ombak besar datang menghantam, membasahi jubah sutra, mahkota emas, "
    "hingga kaus kaki para menteri sampai basah kuyup. "
    "Sambil menggigil kedinginan, sang raja menoleh dan berkata: "
    "Kalian lihat? Penguasa terhebat kalian bahkan tidak sanggup menahan air asin. "
    "Sejak hari itu, sang raja mencopot mahkotanya, dan tidak pernah memakainya lagi."
)

def generate_voice(voice_id=VOICE_ID_ANDI, out_wav_path="public/assets/audio/cnut-voice.wav", out_words_path="public/assets/audio/cnut-words.json"):
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
                        all_timestamps.append({"word": w, "start": round(s, 3), "end": round(e, 3)})
            except Exception as e:
                print(f"Parse error on line: {line_str[:50]}... -> {e}")

    raw_audio = b"".join(audio_chunks)
    total_samples = len(raw_audio) // 2
    duration_s = total_samples / 44100.0
    print(f"Total raw audio bytes: {len(raw_audio)}, Duration: {duration_s:.2f}s")
    print(f"Total words timestamped: {len(all_timestamps)}")

    # Ensure output dirs exist
    Path(out_wav_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_words_path).parent.mkdir(parents=True, exist_ok=True)

    # Write WAV file
    with wave.open(out_wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(raw_audio)
    print(f"Saved WAV to {out_wav_path}")

    # Write JSON words
    with open(out_words_path, "w", encoding="utf-8") as jf:
        json.dump({
            "duration": round(duration_s, 3),
            "script": SCRIPT_TEXT,
            "words": all_timestamps
        }, jf, indent=2, ensure_ascii=False)
    print(f"Saved words to {out_words_path}")

    return duration_s, all_timestamps

if __name__ == "__main__":
    generate_voice()

