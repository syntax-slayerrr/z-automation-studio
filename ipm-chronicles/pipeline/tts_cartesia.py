"""Cartesia TTS adapter for the IPM documentary series.

Follows ipm-premium-documentary-studio sound_and_voice_design.md section 5:
  * generate per segment (not the whole script in one take)
  * 2-3 takes for landing lines, pick by ear
  * identical voice/model settings across the series, every generation logged
  * pauses are built in the edit (gap between segments), not by the engine
  * real word timestamps from Cartesia (no interpolation)

Usage:
  python scripts/ipm/cartesia_tts.py voices                      # list Indonesian-capable voices
  python scripts/ipm/cartesia_tts.py audition <voice_id>...      # same passage, several voices
  python scripts/ipm/cartesia_tts.py episode ep01 [--takes 1]    # build from episodes/ep01/segments.json

segments.json:
  {"voice_id": "...", "model_id": "sonic-3.6", "language": "id",
   "segments": [{"id": "s01", "text": "...", "speed": 0.9, "gap_after": 0.6, "takes": 3}, ...]}
"""
import argparse
import base64
import csv
import json
import os
import sys
import urllib.request
import wave
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SR = 44100
API = "https://api.cartesia.ai"
VERSION = "2024-06-10"


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    if "CARTESIA_API_KEY" not in os.environ:
        sys.exit("CARTESIA_API_KEY missing: put it in .env (never hardcode).")


def headers():
    return {"X-API-Key": os.environ["CARTESIA_API_KEY"], "Cartesia-Version": VERSION,
            "Content-Type": "application/json"}


def list_voices(language="id"):
    req = urllib.request.Request(f"{API}/voices?limit=100&language={language}", headers=headers())
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    return data["data"] if isinstance(data, dict) and "data" in data else data


def synth(text, voice_id, model_id="sonic-3.6", language="id", speed=None):
    """One SSE generation. Returns (pcm_bytes, [{'word','start','end'}]) with times relative to this clip."""
    payload = {
        "model_id": model_id, "transcript": text,
        "voice": {"mode": "id", "id": voice_id},
        "output_format": {"container": "raw", "encoding": "pcm_s16le", "sample_rate": SR},
        "language": language, "add_timestamps": True,
    }
    if speed is not None:
        payload["generation_config"] = {"speed": speed}
    req = urllib.request.Request(f"{API}/tts/sse", data=json.dumps(payload).encode(), headers=headers(), method="POST")
    audio, words = [], []
    with urllib.request.urlopen(req) as resp:
        for raw in resp:
            line = raw.decode("utf-8").strip()
            if not line.startswith("data:"):
                continue
            body = line[5:].strip()
            if not body:
                continue
            msg = json.loads(body)
            t = msg.get("type")
            if t == "chunk" and msg.get("data"):
                audio.append(base64.b64decode(msg["data"]))
            elif t == "timestamps":
                wt = msg.get("word_timestamps", {})
                for w, s, e in zip(wt.get("words", []), wt.get("start", []), wt.get("end", [])):
                    words.append({"word": w, "start": s, "end": e})
            elif t == "done":
                break
    return b"".join(audio), words


def write_wav(path, pcm):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(pcm)


def dur(pcm):
    return len(pcm) / (SR * 2)


AUDITION = ("Pada tanggal 23 sampai 28 Oktober 2008, Muktamar IRM yang keenam belas di Surakarta "
            "memutuskan satu hal. Nama Ikatan Remaja Muhammadiyah kembali menjadi Ikatan Pelajar Muhammadiyah, "
            "atau IPM. Sebelumnya, pada tahun 1958, sebuah konferensi di Garut telah membuka jalan. "
            "Keputusan itu tidak lahir dalam satu hari. Ia tumbuh pelan, dari ruang-ruang kecil. "
            "Dan sekarang, ia hidup di tingkat cabang.")


def cmd_audition(a):
    out = ROOT / "productions/ipm-series/assets/voice_audition"
    for vid in a.voice_ids:
        pcm, words = synth(AUDITION, vid, speed=a.speed)
        p = out / f"{vid[:8]}.wav"
        write_wav(p, pcm)
        print(f"{vid}: {dur(pcm):.1f}s, {len(words)} words -> {p}")


def cmd_voices(a):
    for v in list_voices():
        print(v.get("id"), "|", v.get("name"), "|", v.get("gender", ""), "|", (v.get("description") or "")[:70])


def cmd_episode(a):
    ep = ROOT / "productions/ipm-series/episodes" / a.ep
    cfg = json.loads((ep / "segments.json").read_text(encoding="utf-8"))
    vdir = ep / "voice"
    log_path = vdir / "takes_log.csv"
    new_log = not log_path.exists()
    vdir.mkdir(parents=True, exist_ok=True)
    with open(log_path, "a", newline="", encoding="utf-8") as lf:
        lw = csv.writer(lf)
        if new_log:
            lw.writerow(["time", "segment", "take", "voice_id", "model", "speed", "duration_s", "file", "text"])
        for seg in cfg["segments"]:
            n = a.takes or seg.get("takes", 1)
            for take in range(1, n + 1):
                pcm, words = synth(seg["text"], cfg["voice_id"], cfg.get("model_id", "sonic-3.6"),
                                   cfg.get("language", "id"), seg.get("speed"))
                f = vdir / f"{seg['id']}_t{take}.wav"
                write_wav(f, pcm)
                (vdir / f"{seg['id']}_t{take}.words.json").write_text(
                    json.dumps({"words": words, "duration": dur(pcm)}, ensure_ascii=False, indent=1), encoding="utf-8")
                lw.writerow([datetime.now().isoformat(timespec="seconds"), seg["id"], take, cfg["voice_id"],
                             cfg.get("model_id", "sonic-3.6"), seg.get("speed"), f"{dur(pcm):.2f}", f.name, seg["text"]])
                print(f"{seg['id']} take {take}: {dur(pcm):.2f}s")


def cmd_assemble(a):
    """Concatenate chosen takes with gap_after, merge word timestamps with absolute offsets."""
    ep = ROOT / "productions/ipm-series/episodes" / a.ep
    cfg = json.loads((ep / "segments.json").read_text(encoding="utf-8"))
    chosen = json.loads((ep / "voice/chosen_takes.json").read_text(encoding="utf-8")) if (ep / "voice/chosen_takes.json").exists() else {}
    pcm_all, words_all, cursor, cues = [], [], 0.0, []
    for seg in cfg["segments"]:
        take = chosen.get(seg["id"], 1)
        f = ep / "voice" / f"{seg['id']}_t{take}.wav"
        with wave.open(str(f)) as wf:
            pcm = wf.readframes(wf.getnframes())
        meta = json.loads((ep / "voice" / f"{seg['id']}_t{take}.words.json").read_text(encoding="utf-8"))
        for w in meta["words"]:
            words_all.append({"word": w["word"], "start": round(cursor + w["start"], 3), "end": round(cursor + w["end"], 3), "seg": seg["id"]})
        cues.append({"id": seg["id"], "start": round(cursor, 3), "end": round(cursor + dur(pcm), 3)})
        pcm_all.append(pcm)
        gap = seg.get("gap_after", 0.35)
        pcm_all.append(b"\x00\x00" * int(SR * gap))
        cursor += dur(pcm) + gap
    write_wav(ep / "voice/narration.wav", b"".join(pcm_all))
    (ep / "voice/words.json").write_text(json.dumps({"words": words_all, "segments": cues, "duration": cursor}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"narration.wav {cursor:.2f}s, {len(words_all)} real-timestamp words")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("voices").set_defaults(fn=cmd_voices)
    s = sub.add_parser("audition"); s.add_argument("voice_ids", nargs="+"); s.add_argument("--speed", type=float, default=0.9); s.set_defaults(fn=cmd_audition)
    s = sub.add_parser("episode"); s.add_argument("ep"); s.add_argument("--takes", type=int, default=0); s.set_defaults(fn=cmd_episode)
    s = sub.add_parser("assemble"); s.add_argument("ep"); s.set_defaults(fn=cmd_assemble)
    a = ap.parse_args()
    load_env()
    a.fn(a)

