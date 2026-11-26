"""
Audio-First Indonesian Documentary VO Generator for "MembangunRumahShort"
("Dari Masalah Menjadi Rumah" — 8-Scene 3D Architectural Cutaway Documentary, ±110-120s)

- Uses Microsoft Neural Indonesian Voice `id-ID-ArdiNeural` via `edge-tts` with exact
  `WordBoundary` millisecond timestamps (fallback when ElevenLabs/Cartesia credits are depleted).
- Produces:
    - `membangun-rumah/audio/vo_master.wav` (broadcast-EQ'd clean mono 44.1kHz VO)
    - `membangun-rumah/audio/alignment.json` (exact word timestamps, 25 cues, 8 scenes)
    - `remotion/videos/membangun-rumah/story.ts` (typed Remotion cues & progressive subtitle chunks)
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import math
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import edge_tts

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
AUDIO_DIR = PROJECT / "audio"
VO_CACHE_DIR = AUDIO_DIR / "vo_cache"
OUT_VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_ALIGN_JSON = AUDIO_DIR / "alignment.json"
OUT_STORY_TS = ROOT / "remotion/videos/membangun-rumah/story.ts"

VOICE_ID = "id-ID-ArdiNeural"
VOICE_LABEL = "Ardi Neural (Warm Indonesian Documentary Storyteller)"
RATE = "-4%"   # Warm, measured documentary cadence targeting ~110-118s!
PITCH = "-2Hz" # Slight warm documentary resonance
SR = 44100
FPS = 30
OPEN_LEAD_SILENCE_S = 0.25
END_TAIL_PAD_S = 3.8  # Closing wide pullback + "Semuanya dimulai dari sebuah kebutuhan."

# 100% VERBATIM 8-Scene User Script with [[cue]] storyboard anchors
BEATS = [
    # SCENE 1 — MASALAH (0–12 detik)
    {
        "scene": 1,
        "pauseAfterS": 0.42,
        "text": "[[s1_rain]]Bayangkan setiap hari kamu harus menghadapi panas terik, [[s1_puddle]]hujan deras, dan tidak punya tempat yang benar-benar bisa melindungimu.",
    },
    {
        "scene": 1,
        "pauseAfterS": 0.42,
        "text": "[[s1_heat]]Tempat untuk beristirahat saja terasa sulit ditemukan.",
    },
    {
        "scene": 1,
        "pauseAfterS": 0.65,
        "text": "[[s1_idea]]Lalu, bagaimana kalau kita membangun tempat tinggal sendiri?",
    },

    # SCENE 2 — MENCARI SOLUSI (12–24 detik)
    {
        "scene": 2,
        "pauseAfterS": 0.38,
        "text": "[[s2_ghost]]Untuk mengatasi masalah itu, kita membutuhkan tempat tinggal yang mampu melindungi dari cuaca, [[s2_blueprint]]memberikan privasi, dan menyediakan ruang untuk beraktivitas.",
    },
    {
        "scene": 2,
        "pauseAfterS": 0.34,
        "text": "[[s2_rooms]]Tapi rumah tidak bisa dibangun begitu saja.",
    },
    {
        "scene": 2,
        "pauseAfterS": 0.65,
        "text": "[[s2_model3d]]Semuanya harus direncanakan.",
    },

    # SCENE 3 — MENYIAPKAN TEMPAT (24–36 detik)
    {
        "scene": 3,
        "pauseAfterS": 0.42,
        "text": "[[s3_aerial]]Pertama, kita perlu menentukan lokasi dan memeriksa kondisi tanah.",
    },
    {
        "scene": 3,
        "pauseAfterS": 0.65,
        "text": "Setelah desain dan perhitungan struktur selesai, [[s3_clear]]lahan dibersihkan, diratakan, [[s3_stakes]]dan diukur sesuai ukuran [[s3_grid]]bangunan.",
    },

    # SCENE 4 — MEMBANGUN DASAR YANG KUAT (36–51 detik)
    {
        "scene": 4,
        "pauseAfterS": 0.40,
        "text": "[[s4_dive]]Namun, sebelum dinding berdiri, ada satu bagian penting yang harus dibuat terlebih dahulu: [[s4_trench]]fondasi.",
    },
    {
        "scene": 4,
        "pauseAfterS": 0.40,
        "text": "Tanah digali, kemudian [[s4_stones]]fondasi dibangun sesuai kondisi tanah dan [[s4_rebar]]desain struktur.",
    },
    {
        "scene": 4,
        "pauseAfterS": 0.65,
        "text": "[[s4_load]]Fondasi inilah yang membantu menyalurkan beban bangunan ke tanah.",
    },

    # SCENE 5 — MEMBANGUN STRUKTUR (51–65 detik)
    {
        "scene": 5,
        "pauseAfterS": 0.38,
        "text": "[[s5_columns]]Setelah fondasi siap, struktur rumah mulai tumbuh.",
    },
    {
        "scene": 5,
        "pauseAfterS": 0.40,
        "text": "Kolom dan [[s5_beams]]balok dibangun untuk membentuk [[s5_frame]]kerangka yang menopang bangunan.",
    },
    {
        "scene": 5,
        "pauseAfterS": 0.65,
        "text": "[[s5_orbit]]Kini, rumah mulai memiliki bentuk.",
    },

    # SCENE 6 — MEMBENTUK RUANG TINGGAL (65–80 detik)
    {
        "scene": 6,
        "pauseAfterS": 0.40,
        "text": "[[s6_bricks]]Berikutnya, dinding disusun untuk membagi ruang dan [[s6_openings]]melindungi bagian dalam rumah.",
    },
    {
        "scene": 6,
        "pauseAfterS": 0.40,
        "text": "[[s6_truss]]Rangka atap dipasang, kemudian ditutup dengan [[s6_tiles]]genteng.",
    },
    {
        "scene": 6,
        "pauseAfterS": 0.65,
        "text": "[[s6_building]]Perlahan, kerangka tadi berubah menjadi sebuah bangunan.",
    },

    # SCENE 7 — MEMBUATNYA LAYAK DIHUNI (80–98 detik)
    {
        "scene": 7,
        "pauseAfterS": 0.36,
        "text": "[[s7_cutaway]]Tapi bangunan saja belum cukup untuk disebut rumah.",
    },
    {
        "scene": 7,
        "pauseAfterS": 0.40,
        "text": "[[s7_utilities]]Instalasi listrik dan air harus dipasang.",
    },
    {
        "scene": 7,
        "pauseAfterS": 0.40,
        "text": "[[s7_plaster]]Dinding diplester dan dicat, [[s7_ceramic]]lantai dipasang, serta [[s7_lights]]pintu dan jendela dilengkapi.",
    },
    {
        "scene": 7,
        "pauseAfterS": 0.65,
        "text": "[[s7_furniture]]Setiap bagian mulai memiliki fungsinya.",
    },

    # SCENE 8 — SOLUSI (98–115 detik)
    {
        "scene": 8,
        "pauseAfterS": 0.42,
        "text": "[[s8_complete]]Dan akhirnya, sebidang tanah kosong telah berubah menjadi tempat tinggal.",
    },
    {
        "scene": 8,
        "pauseAfterS": 0.42,
        "text": "[[s8_rain_safe]]Kini ada atap untuk berlindung dari hujan, dinding untuk melindungi diri, dan [[s8_family]]ruang untuk beristirahat bersama keluarga.",
    },
    {
        "scene": 8,
        "pauseAfterS": 0.36,
        "text": "[[s8_pullback]]Karena pada akhirnya, rumah bukan hanya tentang bangunan.",
    },
    {
        "scene": 8,
        "pauseAfterS": 0.25,
        "text": "[[s8_closing]]Tetapi tentang tempat kita merasa aman.",
    },
]


def prepare_beat(raw_text: str, line_idx: int) -> dict:
    tokens = []
    for tok in raw_text.strip().split():
        m = re.match(r"^(?:\[\[([^\]]+)\]\])?(.*)$", tok)
        cue = m.group(1) if m else None
        disp = m.group(2) if m else tok
        if disp:
            tokens.append({"w": disp, "cue": cue, "line": line_idx})
    plain = " ".join(t["w"] for t in tokens)
    return {"displayTokens": tokens, "plain": plain}


def norm_word(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def align_display_to_runs(display_tokens: list[dict], spoken_runs: list[dict], fallback_dur: float) -> list[dict]:
    if not spoken_runs:
        step = fallback_dur / max(1, len(display_tokens))
        return [{**dt, "start": i * step, "end": (i + 1) * step} for i, dt in enumerate(display_tokens)]
    if len(display_tokens) == len(spoken_runs):
        return [
            {**dt, "start": spoken_runs[i]["start"], "end": spoken_runs[i]["end"]}
            for i, dt in enumerate(display_tokens)
        ]
    out = []
    r_idx = 0
    for dt in display_tokens:
        target = norm_word(dt["w"])
        if r_idx >= len(spoken_runs):
            last = spoken_runs[-1]
            out.append({**dt, "start": last["start"], "end": last["end"]})
            continue
        start_run = spoken_runs[r_idx]
        acc = norm_word(start_run["text"])
        end_run = start_run
        r_idx += 1
        while (
            r_idx < len(spoken_runs)
            and len(acc) < len(target)
            and target.startswith(acc + norm_word(spoken_runs[r_idx]["text"]))
        ):
            acc += norm_word(spoken_runs[r_idx]["text"])
            end_run = spoken_runs[r_idx]
            r_idx += 1
        out.append({**dt, "start": start_run["start"], "end": end_run["end"]})
    return out


async def synth_edge_beat(text: str, out_mp3: Path) -> list[dict]:
    comm = edge_tts.Communicate(text, voice=VOICE_ID, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    words = []
    audio_bytes = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            s = chunk["offset"] / 10_000_000.0
            d = chunk["duration"] / 10_000_000.0
            words.append({"text": chunk["text"], "start": round(s, 4), "end": round(s + d, 4)})
    out_mp3.write_bytes(bytes(audio_bytes))
    return words


def get_duration_sec(file_path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(file_path)],
        text=True,
    ).strip()
    return float(out)


def render_clean_narrator_wav(in_mp3: Path, out_wav: Path) -> None:
    eq = (
        "highpass=f=80,"
        "equalizer=f=150:t=q:w=1.1:g=2.0,"
        "equalizer=f=3000:t=q:w=1.3:g=1.6,"
        "equalizer=f=6800:t=q:w=1.4:g=-1.5"
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(in_mp3),
            "-ar", str(SR), "-ac", "1", "-af", eq, "-sample_fmt", "s16",
            str(out_wav),
        ],
        check=True,
    )


def build_subtitle_chunks(all_words: list[dict]) -> list[dict]:
    by_line: dict[int, list[dict]] = {}
    for w in all_words:
        by_line.setdefault(w["line"], []).append(w)

    chunks = []
    for line_idx in sorted(by_line.keys()):
        line_words = by_line[line_idx]
        cur = []
        for i, w in enumerate(line_words):
            cur.append(w)
            text_len = len(" ".join(x["w"] for x in cur))
            ends_punct = bool(re.search(r"[,.\?!:]$", w["w"]))
            remaining = len(line_words) - 1 - i
            should_break = (
                (ends_punct and len(cur) >= 2 and remaining >= 1)
                or (len(cur) >= 4 and remaining >= 2)
                or (text_len >= 26 and len(cur) >= 3 and remaining >= 1)
            )
            if should_break:
                chunks.append(cur)
                cur = []
        if cur:
            chunks.append(cur)

    out = []
    for idx, chunk in enumerate(chunks):
        start_f = max(0, round(chunk[0]["start"] * FPS) - 1)
        end_f = round(chunk[-1]["end"] * FPS) + 6
        out.append({
            "id": f"sub_{idx + 1:03d}",
            "scene": chunk[0]["scene"],
            "startFrame": start_f,
            "endFrame": end_f,
            "words": [
                {
                    "text": w["w"],
                    "startFrame": max(start_f, round(w["start"] * FPS)),
                    "endFrame": round(w["end"] * FPS),
                }
                for w in chunk
            ],
        })

    for i in range(len(out) - 1):
        if out[i]["endFrame"] >= out[i + 1]["startFrame"]:
            out[i]["endFrame"] = max(out[i]["startFrame"] + 2, out[i + 1]["startFrame"] - 1)
    return out


async def main() -> None:
    VO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_STORY_TS.parent.mkdir(parents=True, exist_ok=True)

    prepared = [{**b, "idx": i, **prepare_beat(b["text"], i)} for i, b in enumerate(BEATS)]
    tmp_dir = Path(tempfile.mkdtemp(prefix="rumah-edge-vo-"))

    try:
        print(f"=== Synthesizing Edge Neural VO ({VOICE_ID}, rate={RATE}, pitch={PITCH}) ===")
        concat_parts: list[Path] = []
        lead_sil = tmp_dir / "sil_lead.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono",
                "-t", str(OPEN_LEAD_SILENCE_S), "-sample_fmt", "s16", str(lead_sil),
            ],
            check=True,
        )
        concat_parts.append(lead_sil)

        cursor_sec = OPEN_LEAD_SILENCE_S
        all_words: list[dict] = []

        for i, beat in enumerate(prepared):
            key_str = json.dumps({"v": VOICE_ID, "r": RATE, "p": PITCH, "t": beat["plain"]}, sort_keys=True)
            key = hashlib.sha1(key_str.encode("utf-8")).hexdigest()[:12]
            mp3_path = VO_CACHE_DIR / f"edge_{i:02d}_{key}.mp3"
            align_path = VO_CACHE_DIR / f"edge_{i:02d}_{key}.json"

            if mp3_path.exists() and align_path.exists():
                print(f"  [{i + 1:02d}/{len(prepared)}] CACHED Scene{beat['scene']}: {beat['plain']}")
                spoken_runs = json.loads(align_path.read_text(encoding="utf-8"))
            else:
                print(f"  [{i + 1:02d}/{len(prepared)}] SYNTH  Scene{beat['scene']}: {beat['plain']}")
                spoken_runs = await synth_edge_beat(beat["plain"], mp3_path)
                align_path.write_text(json.dumps(spoken_runs, indent=2, ensure_ascii=False), encoding="utf-8")

            eq_wav = tmp_dir / f"beat_{i}_eq.wav"
            render_clean_narrator_wav(mp3_path, eq_wav)
            clip_dur = get_duration_sec(eq_wav)
            aligned = align_display_to_runs(beat["displayTokens"], spoken_runs, clip_dur)

            # Generous 0.12s pre-onset margin so initial consonants NEVER clip!
            trim_lead = max(0.0, round(aligned[0]["start"] - 0.12, 3)) if aligned else 0.0
            last_end = aligned[-1]["end"] if aligned else clip_dur
            src_span = max(0.12, min(clip_dur - trim_lead, round(last_end - trim_lead + 0.16, 3)))

            trim_wav = tmp_dir / f"beat_{i}_trim.wav"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-ss", str(trim_lead), "-i", str(eq_wav), "-t", str(src_span),
                    "-af", "afade=t=in:st=0:d=0.008",
                    "-sample_fmt", "s16", str(trim_wav),
                ],
                check=True,
            )
            actual_dur = get_duration_sec(trim_wav)
            fade_wav = tmp_dir / f"beat_{i}_fade.wav"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", str(trim_wav),
                    "-af", f"afade=t=out:st={max(0.0, actual_dur - 0.015):.3f}:d=0.015",
                    "-sample_fmt", "s16", str(fade_wav),
                ],
                check=True,
            )

            for tok in aligned:
                s_rel = max(0.0, tok["start"] - trim_lead)
                e_rel = max(s_rel + 0.02, tok["end"] - trim_lead)
                all_words.append({
                    "w": tok["w"],
                    "cue": tok["cue"],
                    "scene": beat["scene"],
                    "line": tok["line"],
                    "start": round(cursor_sec + s_rel, 3),
                    "end": round(cursor_sec + e_rel, 3),
                })

            concat_parts.append(fade_wav)
            cursor_sec += actual_dur

            sil_wav = tmp_dir / f"sil_{i}.wav"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono",
                    "-t", str(beat["pauseAfterS"]), "-sample_fmt", "s16", str(sil_wav),
                ],
                check=True,
            )
            concat_parts.append(sil_wav)
            cursor_sec += beat["pauseAfterS"]

        concat_list = tmp_dir / "concat.txt"
        concat_list.write_text(
            "\n".join(f"file '{str(p).replace(chr(92), '/')}'" for p in concat_parts),
            encoding="utf-8",
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "concat", "-safe", "0", "-i", str(concat_list),
                "-af", "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true",
                "-ar", str(SR), "-ac", "1", "-sample_fmt", "s16",
                str(OUT_VO_WAV),
            ],
            check=True,
        )

        vo_dur = get_duration_sec(OUT_VO_WAV)
        total_video_sec = round(vo_dur + END_TAIL_PAD_S, 3)
        total_frames = math.ceil(total_video_sec * FPS)

        cue_map_sec: dict[str, float] = {}
        cue_map_frame: dict[str, int] = {}
        scene_starts_sec: dict[int, float] = {}
        for w in all_words:
            if w["cue"]:
                cue_map_sec[w["cue"]] = w["start"]
                cue_map_frame[w["cue"]] = round(w["start"] * FPS)
            if w["scene"] not in scene_starts_sec:
                scene_starts_sec[w["scene"]] = w["start"]

        scenes_frame = {
            "scene1Start": 0,
            "scene2Start": max(0, round((scene_starts_sec[2] - 0.22) * FPS)),
            "scene3Start": max(0, round((scene_starts_sec[3] - 0.22) * FPS)),
            "scene4Start": max(0, round((scene_starts_sec[4] - 0.22) * FPS)),
            "scene5Start": max(0, round((scene_starts_sec[5] - 0.22) * FPS)),
            "scene6Start": max(0, round((scene_starts_sec[6] - 0.22) * FPS)),
            "scene7Start": max(0, round((scene_starts_sec[7] - 0.22) * FPS)),
            "scene8Start": max(0, round((scene_starts_sec[8] - 0.24) * FPS)),
            "closingCardStart": max(0, round((vo_dur + 0.15) * FPS)),
            "totalFrames": total_frames,
        }

        starts = [scenes_frame[f"scene{s}Start"] for s in range(1, 9)] + [total_frames]
        print("\n=== 8-SCENE DOCUMENTARY TIMING BREAKDOWN ===")
        for s in range(1, 9):
            dur_s = (starts[s] - starts[s - 1]) / FPS
            print(
                f"  Scene {s}: f={starts[s - 1]}..{starts[s] - 1} "
                f"({starts[s - 1] / FPS:.2f}s -> {starts[s] / FPS:.2f}s | dur={dur_s:.2f}s)"
            )

        subtitle_chunks = build_subtitle_chunks(all_words)
        align_obj = {
            "voice": f"{VOICE_LABEL} · Microsoft Edge Neural ({VOICE_ID})",
            "model": VOICE_ID,
            "tempo": 1.0,
            "voDurationSec": round(vo_dur, 3),
            "totalVideoSec": total_video_sec,
            "fps": FPS,
            "totalFrames": total_frames,
            "cuesSec": cue_map_sec,
            "cuesFrame": cue_map_frame,
            "scenesFrame": scenes_frame,
            "words": all_words,
        }
        OUT_ALIGN_JSON.write_text(json.dumps(align_obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        story_ts = f"""// AUTO-GENERATED by membangun-rumah/scripts/build_vo_edge.py
// Source: Microsoft Neural Indonesian VO ({VOICE_ID}) WordBoundary timestamps ({len(all_words)} words, {len(cue_map_frame)} cues)

export interface SubtitleWord {{
  text: string;
  startFrame: number;
  endFrame: number;
}}

export interface SubtitleChunk {{
  id: string;
  scene: number;
  startFrame: number;
  endFrame: number;
  words: SubtitleWord[];
}}

export const COMPOSITION_CONFIG = {{
  id: "MembangunRumahShort",
  width: 1080,
  height: 1920,
  fps: {FPS},
  durationInFrames: {total_frames},
  durationSec: {total_video_sec},
  audioMasterPath: "membangun-rumah/audio_master.m4a",
}} as const;

export const SCENES = {json.dumps(scenes_frame, indent=2)} as const;

export const CUES = {json.dumps(cue_map_frame, indent=2)} as const;

export const CUES_SEC = {json.dumps(cue_map_sec, indent=2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = {json.dumps(subtitle_chunks, indent=2, ensure_ascii=False)};
"""
        OUT_STORY_TS.write_text(story_ts, encoding="utf-8")
        print(
            f"\nVO COMPLETE -> {OUT_VO_WAV} ({vo_dur:.2f}s VO | {total_video_sec:.2f}s video / {total_frames} frames | {len(all_words)} words | {len(subtitle_chunks)} subtitle chunks)"
        )
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    asyncio.run(main())
