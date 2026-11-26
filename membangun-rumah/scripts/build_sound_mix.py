"""
Broadcast Multi-Layer Sound Design & Mastering for MembangunRumahShort
("Dari Masalah Menjadi Rumah" — 8-Scene 3D Architectural Cutaway Documentary)

Layers combined deterministically against `membangun-rumah/audio/alignment.json`:
  1. Cartesia `sonic-3.6` Native Indonesian Documentary Narrator VO (Andi)
  2. Real Recorded Tactile Foley Bank from Z-Automation Studio Archive + CC0 Foley Library
  3. Real Licensed Warm Inspiring Acoustic Music Score (Mixkit Stock Music Free License)
     with 8-Scene emotional contour, Anti-Masking Vocal Pocket EQ, and Stereo Sidechain Ducking
  4. Two-Pass Linear Broadcast Loudness Mastering (-14.8 LUFS, True Peak <= -1.5 dBFS)
     -> `public/membangun-rumah/audio_master.m4a` + Waveform/Spectrogram QA PNG + `CREDITS.txt`
"""
from __future__ import annotations

import json
import math
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import spectrogram

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
AUDIO_DIR = PROJECT / "audio"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
SFX_SAWAH = ROOT / "sawah-terasering/audio/sfx"
SFX_REL = ROOT / "rel-kereta/audio/sfx"
SFX_GAMBUT = ROOT / "gambut-history/audio/sfx"
SFX_GMNI = ROOT / "gmni-history/audio/sfx"
SFX_PROMO = ROOT / "claude-animasi-promo/audio/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/membangun-rumah"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"

MUSIC_CANDIDATES = [
    (
        "https://assets.mixkit.co/music/148/148.mp3",
        "mixkit-148-forest-mist-whispers.mp3",
        '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148, https://mixkit.co/free-stock-music/)',
    ),
    (
        "https://assets.mixkit.co/music/117/117.mp3",
        "mixkit-117-curious-acoustic.mp3",
        '"Sun and Fun" / Warm Acoustic Curiosity (Mixkit #117, https://mixkit.co/free-stock-music/)',
    ),
]

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for url, fname, credit in MUSIC_CANDIDATES:
        target = CACHE_DIR / fname
        if target.exists() and target.stat().st_size > 100_000:
            return target, credit, "Mixkit Stock Music Free License"
    for url, fname, credit in MUSIC_CANDIDATES:
        target = CACHE_DIR / fname
        try:
            print(f"Downloading licensed Mixkit music -> {target.name}...")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = resp.read()
            if len(data) > 100_000:
                target.write_bytes(data)
                return target, credit, "Mixkit Stock Music Free License"
        except Exception as exc:
            print(f"  WARN {url} failed: {exc}")
    hf_cache = ROOT / "human-fire/.audio-cache/mixkit-148-forest-mist-whispers.mp3"
    if hf_cache.exists():
        return hf_cache, MUSIC_CANDIDATES[1][2], "Mixkit Stock Music Free License"
    raise RuntimeError("Could not obtain licensed Mixkit music track.")


def measure_ebur128(path: Path, mono: bool = False) -> tuple[float, float]:
    cmd = ["ffmpeg", "-nostats", "-i", str(path)]
    if mono:
        cmd.extend(["-ac", "1"])
    cmd.extend(["-filter_complex", "ebur128=peak=true", "-f", "null", "-"])
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    lufs, tp = -99.0, -99.0
    lines = res.stderr.splitlines()
    for i, ln in enumerate(lines):
        if "Integrated loudness:" in ln:
            for sub in lines[i : i + 4]:
                if "I:" in sub and "LUFS" in sub:
                    lufs = float(sub.split("I:")[1].split("LUFS")[0].strip())
        if "True peak:" in ln:
            for sub in lines[i : i + 4]:
                if "Peak:" in sub and "dBFS" in sub:
                    tp = float(sub.split("Peak:")[1].split("dBFS")[0].strip())
    return lufs, tp


def render_audio_qa_sheet(wav_path: Path, cues: dict[str, float], total_sec: float, out_png: Path) -> None:
    import cv2

    sr, data = wavfile.read(str(wav_path))
    mono = data.astype(np.float32).mean(axis=1) / 32768.0 if data.ndim == 2 else data.astype(np.float32) / 32768.0

    W, H = 1800, 740
    canvas = np.full((H, W, 3), 18, dtype=np.uint8)
    y_mid = 185
    amp_h = 120
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (22, 28, 32), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (110, 195, 165), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (248, 206, 98), 1)

    freqs, times, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_VIRIDIS)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[375:680, 60 : 60 + plot_w] = spec_res

    for idx, (cname, ct) in enumerate(sorted(cues.items(), key=lambda kv: kv[1])):
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 50), (cx, 680), (70, 225, 250), 1)
        y_lbl = 338 + (idx % 3) * 12
        cv2.putText(
            canvas,
            f"{cname}({ct:.1f}s)",
            (max(60, min(W - 140, cx - 16)), y_lbl),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.31,
            (235, 240, 232),
            1,
            cv2.LINE_AA,
        )

    for sec in range(0, int(math.ceil(total_sec)) + 1, 10):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 680), (tx, 690), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 712), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 205, 210), 1, cv2.LINE_AA)

    cv2.putText(
        canvas,
        "DARI MASALAH MENJADI RUMAH — AUDIO MASTER WAVEFORM & SPECTROGRAM QA (-14.8 LUFS)",
        (60, 28),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.62,
        (255, 224, 150),
        1,
        cv2.LINE_AA,
    )
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    sc_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building MembangunRumah Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_s2 = sc_f["scene2Start"] / fps
    t_s3 = sc_f["scene3Start"] / fps
    t_s4 = sc_f["scene4Start"] / fps
    t_s5 = sc_f["scene5Start"] / fps
    t_s6 = sc_f["scene6Start"] / fps
    t_s7 = sc_f["scene7Start"] / fps
    t_s8 = sc_f["scene8Start"] / fps

    # Frame-locked tactile foley & transition SFX ledger (100% real studio & CC0 recordings!)
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Scene 1 — Heavy rain -> puddles -> hot dry breeze -> glowing house idea chime
        (0.05, SFX_SAWAH / "sfx_rain_monsoon.mp3", 0.44, 5.5, "Scene 1 Heavy rain pouring on cardboard"),
        (cues["s1_puddle"] - 0.10, SFX_REL / "rain_drizzle.mp3", 0.34, 4.2, "Scene 1 Puddles swelling around feet"),
        (cues["s1_heat"] - 0.10, SFX_SAWAH / "sfx_sunset_paddy_breeze.mp3", 0.34, 3.6, "Scene 1 Hot dry sunlit wind"),
        (cues["s1_idea"] + 0.12, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.22, 1.3, "Scene 1 House idea hologram chime"),

        # Scene 2 — Ghost House -> Blueprint drafting -> Room layout -> 3D Model extrusion
        (max(0.0, t_s2 - 0.08), SFX_REL / "camera_whoosh_soft.mp3", 0.28, 1.1, "Scene 1->2 Glide to empty plot"),
        (cues["s2_blueprint"] - 0.15, SFX_GMNI / "sfx_map_lines_shimmer.mp3", 0.38, 3.6, "Scene 2 Architectural blueprint unroll & lines"),
        (cues["s2_rooms"] - 0.05, SFX_CC0 / "click/kenney-interface-select-002.ogg", 0.22, 0.5, "Scene 2 Room zones illuminate"),
        (cues["s2_model3d"] - 0.10, SFX_PROMO / "sfx_finger_snap_morph.mp3", 0.34, 1.8, "Scene 2 Blueprint extrudes to 3D maquette"),

        # Scene 3 — Site clearing, leveling, hammering stakes & string lines
        (max(0.0, t_s3 - 0.08), SFX_REL / "camera_whoosh_soft.mp3", 0.26, 1.0, "Scene 2->3 Crane to aerial plot"),
        (cues["s3_clear"] - 0.15, SFX_SAWAH / "sfx_hoe_chop_soil.mp3", 0.44, 4.2, "Scene 3 Clearing weeds & leveling ground"),
        (cues["s3_stakes"] - 0.15, SFX_SAWAH / "sfx_bamboo_pipe_set.mp3", 0.48, 2.8, "Scene 3 Mallet hammering wooden stakes"),
        (cues["s3_grid"] - 0.08, SFX_CC0 / "ding/fs-571513-soft-notifications-bell-ding-d.ogg", 0.18, 1.0, "Scene 3 Chalk floorplan layout lock"),

        # Scene 4 — Underground Cutaway: Excavation, River Stones, Rebar & Sloof, Load Transfer
        (max(0.0, t_s4 - 0.08), SFX_GAMBUT / "sfx_earth_cutaway_rumble.mp3", 0.40, 3.2, "Scene 3->4 Crane-down below ground"),
        (cues["s4_trench"] - 0.12, SFX_SAWAH / "sfx_hoe_chop_soil.mp3", 0.46, 4.2, "Scene 4 Trench excavation"),
        (cues["s4_stones"] - 0.15, SFX_REL / "gravel_pour_crunch.mp3", 0.46, 4.0, "Scene 4 River stones & gravel bed settling"),
        (cues["s4_rebar"] - 0.15, SFX_REL / "stone_lock_thud.mp3", 0.44, 3.4, "Scene 4 Rebar cage & sloof concrete casting"),
        (cues["s4_load"] - 0.10, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.20, 1.6, "Scene 4 Load transfer into earth"),

        # Scene 5 — Columns rising, Ring Balk locking, Orbit
        (max(0.0, t_s5 - 0.08), SFX_REL / "camera_whoosh_soft.mp3", 0.24, 1.1, "Scene 4->5 Rise from foundation"),
        (cues["s5_columns"] - 0.10, SFX_REL / "stone_lock_thud.mp3", 0.38, 3.2, "Scene 5 Structural columns growing"),
        (cues["s5_beams"] - 0.10, SFX_CC0 / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.28, 0.9, "Scene 5 Horizontal beams locking columns"),
        (cues["s5_frame"] - 0.08, SFX_CC0 / "impact/kenney-impact-impactsoft-heavy-001.ogg", 0.26, 0.9, "Scene 5 Frame bracing completion"),
        (cues["s5_orbit"] - 0.08, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.14, 1.2, "Scene 5 Structural skeleton reveal chime"),

        # Scene 6 — Red Brick Walls, Window/Door Frames, Roof Truss & Genteng Tiles
        (cues["s6_bricks"] - 0.15, SFX_REL / "gravel_pour_crunch.mp3", 0.38, 4.2, "Scene 6 Red bricks stacking course-by-course"),
        (cues["s6_openings"] - 0.10, SFX_SAWAH / "sfx_bamboo_pipe_set.mp3", 0.40, 2.5, "Scene 6 Teak door & window frames fitting"),
        (cues["s6_truss"] - 0.12, SFX_SAWAH / "sfx_bamboo_pipe_set.mp3", 0.44, 2.8, "Scene 6 Timber roof trusses assembling"),
        (cues["s6_tiles"] - 0.15, SFX_REL / "stone_lock_thud.mp3", 0.40, 3.6, "Scene 6 Terracotta genteng tiles sweeping"),

        # Scene 7 — Cutaway Wires & Pipes -> Plaster/Paint -> Ceramic Tiles -> Warm Lights -> Furniture
        (max(0.0, t_s7 - 0.08), SFX_REL / "camera_whoosh_soft.mp3", 0.26, 1.1, "Scene 6->7 Wall cutaway reveal"),
        (cues["s7_utilities"] - 0.12, SFX_SAWAH / "sfx_water_infiltrate.mp3", 0.38, 3.6, "Scene 7 Clean water pipe & electrical flow"),
        (cues["s7_plaster"] - 0.10, SFX_SAWAH / "sfx_mud_pat.mp3", 0.38, 3.0, "Scene 7 Smooth plaster & paint sweep"),
        (cues["s7_ceramic"] - 0.08, SFX_CC0 / "click/kenney-interface-select-001.ogg", 0.26, 0.6, "Scene 7 Glossy ceramic floor tiles clicking in"),
        (cues["s7_lights"] - 0.06, SFX_PROMO / "sfx_spotlight_switch.mp3", 0.40, 2.2, "Scene 7 Interior warm lamps switching ON"),
        (cues["s7_furniture"] - 0.10, SFX_CC0 / "ding/fs-571513-soft-notifications-bell-ding-d.ogg", 0.20, 1.2, "Scene 7 Cozy furniture landing inside"),

        # Scene 8 — Complete Home -> Safe Rain Indoors -> Family -> Warm Sunset Pullback
        (max(0.0, t_s8 - 0.08), SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.20, 1.4, "Scene 8 Completed house hero reveal"),
        (cues["s8_rain_safe"] - 0.15, SFX_REL / "rain_drizzle.mp3", 0.32, 5.2, "Scene 8 Gentle protective rain outside roof"),
        (cues["s8_family"] - 0.10, SFX_CC0 / "ambience/fs-329533-room-tone-in-an-apartment-livi.ogg", 0.22, 4.5, "Scene 8 Warm cozy living room ambience"),
        (cues["s8_pullback"] - 0.12, SFX_SAWAH / "sfx_sunset_paddy_breeze.mp3", 0.36, 5.0, "Scene 8 Peaceful dusk neighborhood breeze"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    print(f"  Wired {len(valid_ev)}/{len(sfx_events)} real tactile SFX cues.")

    with tempfile.TemporaryDirectory(prefix="rumah-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        vol_expr = (
            f"0.14"
            f"+0.02*between(t,{t_s2:.2f},{t_s4:.2f})"
            f"+0.04*between(t,{t_s4:.2f},{t_s7:.2f})"
            f"+0.06*between(t,{t_s7:.2f},{total_sec:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11000,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.4,equalizer=f=1800:t=q:w=1.2:g=-3.6,equalizer=f=3200:t=q:w=1.3:g=-2.6,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=0.6,afade=t=out:st={max(0.0, total_sec - 2.4):.3f}:d=2.3"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(music_path),
                "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem),
            ],
            check=True,
        )

        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}",
        ]
        f_lines = []
        mix_labels = ["[0:a]"]
        for k, (_, t_s, _, vol, p, max_d, _) in enumerate(valid_ev, start=1):
            cmd.extend(["-i", str(p)])
            delay_ms = int(round(t_s * 1000))
            trim_part = f"atrim=0:{max_d:.3f}," if max_d else ""
            fade_out = f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.35):.3f}:d=0.35" if (max_d and max_d >= 0.8) else ""
            f_lines.append(
                f"[{k}:a]aformat=sample_rates={SR}:channel_layouts=stereo,{trim_part}asetpts=PTS-STARTPTS,"
                f"highpass=f=50,afade=t=in:st=0:d=0.025{fade_out},volume={vol:.3f},"
                f"adelay={delay_ms}|{delay_ms}[s{k}]"
            )
            mix_labels.append(f"[s{k}]")
        f_lines.append(
            f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 1.2):.3f}:d=1.1[sfxout]"
        )
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.020:ratio=3.2:attack=18:release=240:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.10[vo_lv];"
            f"[mus_duck]volume=0.84[mus_lv];"
            f"[2:a]volume=0.88[sfx_lv];"
            f"[vo_lv][mus_lv][sfx_lv]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.92:attack=3:release=40[out]"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(VO_WAV), "-i", str(music_stem), "-i", str(sfx_stem),
                "-filter_complex", mix_fc, "-map", "[out]",
                "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(pre_mix),
            ],
            check=True,
        )

        # Two-Pass Linear Broadcast Mastering (-14.8 LUFS, True Peak <= -1.5 dBFS)
        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.8:TP=-1.8:LRA=6.0:print_format=json", "-f", "null", "-"],
            capture_output=True, text=True, check=True,
        )
        j_start = probe.stderr.find("{", probe.stderr.rfind('"input_i"') - 80 if '"input_i"' in probe.stderr else 0)
        j_end = probe.stderr.find("}", j_start) + 1
        stats = json.loads(probe.stderr[j_start:j_end])

        OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(pre_mix),
                "-af", (
                    f"loudnorm=I=-14.8:TP=-1.8:LRA=6.0:linear=true:"
                    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
                    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
                    f"offset={stats['target_offset']}"
                ),
                "-ar", "48000", "-ac", "2", "-sample_fmt", "s16", str(OUT_WAV),
            ],
            check=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV), "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2", str(OUT_M4A)],
            check=True,
        )

    lufs_st, tp_st = measure_ebur128(OUT_M4A, mono=False)
    lufs_mo, tp_mo = measure_ebur128(OUT_M4A, mono=True)
    print(f"\n=== AUDIO MASTER QA (public/membangun-rumah/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "DARI MASALAH MENJADI RUMAH — AUDIO CREDITS\n"
        "===========================================\n"
        f"Narrator VO: {align['voice']} (language='id', tempo={align.get('tempo', 1.0)}x)\n"
        "Tactile Foley SFX: Z-Automation Studio Archive + Freesound / Kenney CC0 Foley Library\n"
        f"Music Score: {music_source} — {music_license}\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
