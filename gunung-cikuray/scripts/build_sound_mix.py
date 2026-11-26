"""
Cinema-Grade Multi-Layer Sound Design & Broadcast Mastering for GunungCikurayShort
("GUNUNG CIKURAY: ATAP LANGIT GARUT" — 1:1 Vintage Poster Explainer Style).

Layers combined deterministically against `gunung-cikuray/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Narrator VO (Brian, curious Indonesian documentary cadence, pronunciation-verified)
  2. Bespoke Geological & Weather Foley via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Local Studio & Bundled CC0 Foley (`.agents/skills/sound-effects/sfx/`)
  4. Real Licensed Documentary Score: Mixkit #587 "Discover" (Mixkit Stock Music Free License)
     with 6-Act emotional contour, Vocal Pocket EQ, Stereo Sidechain Ducking, and resolved postcard close.
  5. Two-Pass Linear Broadcast Mastering (-14.6 LUFS, True Peak <= -1.8 dBFS) + Waveform/Spectrogram QA PNG
     + `CREDITS.txt` + `SOUND.md`.
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
SFX_OWN = AUDIO_DIR / "sfx"
SFX_HF = ROOT / "human-fire/audio/sfx"
SFX_GMNI = ROOT / "gmni-history/audio/sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/gunung-cikuray"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"
SOUND_MD = OUT_DIR / "SOUND.md"

LOCAL_DISCOVER = ROOT / "gmni-history/.audio-cache/mixkit-587-discover.mp3"
MIXKIT_URL = "https://assets.mixkit.co/music/587/587.mp3"
MIXKIT_PATH = CACHE_DIR / "mixkit-587-discover.mp3"

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if LOCAL_DISCOVER.exists() and LOCAL_DISCOVER.stat().st_size > 100_000:
        return (
            LOCAL_DISCOVER,
            '"Discover" (Mixkit #587, https://mixkit.co/free-stock-music/documentary/)',
            "Mixkit Stock Music Free License",
        )
    if MIXKIT_PATH.exists() and MIXKIT_PATH.stat().st_size > 100_000:
        return (
            MIXKIT_PATH,
            '"Discover" (Mixkit #587, https://mixkit.co/free-stock-music/documentary/)',
            "Mixkit Stock Music Free License",
        )
    req = urllib.request.Request(MIXKIT_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    MIXKIT_PATH.write_bytes(data)
    return (
        MIXKIT_PATH,
        '"Discover" (Mixkit #587, https://mixkit.co/free-stock-music/documentary/)',
        "Mixkit Stock Music Free License",
    )


def pick_first(*candidates: Path) -> Path:
    for p in candidates:
        if p.exists() and p.stat().st_size > 1000:
            return p
    return candidates[-1]


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

    W, H = 1600, 720
    canvas = np.full((H, W, 3), 24, dtype=np.uint8)

    y_mid = 185
    amp_h = 120
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (34, 28, 26), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (140, 178, 196), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (72, 211, 248), 1)

    freqs, times, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_INFERNO)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[365:670, 60 : 60 + plot_w] = spec_res

    for idx, (cname, ct) in enumerate(sorted(cues.items(), key=lambda kv: kv[1])):
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 50), (cx, 670), (72, 211, 248), 1)
        ly = 340 if idx % 2 == 0 else 356
        cv2.putText(canvas, f"{cname}({ct:.0f}s)", (max(60, min(W - 140, cx - 22)), ly), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (240, 236, 226), 1, cv2.LINE_AA)

    for sec in range(0, int(math.ceil(total_sec)) + 1, 10):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 670), (tx, 680), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (210, 206, 196), 1, cv2.LINE_AA)

    cv2.putText(canvas, "GUNUNG CIKURAY: ATAP LANGIT GARUT — AUDIO MASTER WAVEFORM, SPECTROGRAM & CUE QA", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (120, 215, 248), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building GunungCikurayShort Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_s2 = scenes_f["s2Start"] / fps
    t_s3 = scenes_f["s3Start"] / fps
    t_s4 = scenes_f["s4Start"] / fps
    t_s5 = scenes_f["s5Start"] / fps
    t_s6 = scenes_f["s6Start"] / fps

    rain_sfx = pick_first(SFX_OWN / "sfx_mountain_rain_percolate.mp3", SFX_HF / "sfx_prehistoric_forest_night.mp3")
    dawn_sfx = pick_first(SFX_OWN / "sfx_dawn_cloud_breeze.mp3", SFX_HF / "sfx_prehistoric_forest_night.mp3")
    postcard_sfx = pick_first(SFX_OWN / "sfx_chalk_postcard_shutter.mp3", SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg")

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # S1 — Scenic Poster Hook, Topographic Elevation Scan & Hero Title
        (0.05, dawn_sfx, 0.30, 4.4, "S1 Highland Garut morning breeze & faint birds"),
        (cues["s1_height"] - 0.15, SFX_CC0 / "typing/fs-511418-data-reveal-sound.ogg", 0.24, 1.4, "S1 Elevation 2.821 MDPL scan line"),
        (cues["s1_title"] - 0.08, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.28, 1.7, "S1 GUNUNG CIKURAY 3D slab title lock"),

        # S2 — Aerial Zoom-Out to Vintage Atlas & 4-Peak Elevation Comparison
        (max(0.0, t_s2 - 0.12), SFX_CC0 / "whoosh/fs-264777-swoosh.ogg", 0.24, 0.85, "S1->S2 Aerial climb into West Java Vintage Atlas"),
        (cues["s2_atlas"], SFX_GMNI / "sfx_map_lines_shimmer.mp3", 0.34, 3.6, "S2 West Java atlas graticules & scale bar draw"),
        (cues["s2_guntur"] - 0.04, SFX_CC0 / "tick/fs384187.ogg", 0.28, 0.25, "S2 Guntur pin pop"),
        (cues["s2_galunggung"] - 0.04, SFX_CC0 / "tick/fs384187.ogg", 0.28, 0.25, "S2 Galunggung pin pop"),
        (cues["s2_papandayan"] - 0.04, SFX_CC0 / "tick/fs384187.ogg", 0.28, 0.25, "S2 Papandayan pin pop"),
        (cues["s2_rank"] - 0.10, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.26, 1.5, "S2 Cikuray 2.821m #4 West Java elevation highlight"),

        # S3 — Time-Rewind Era Kuarter, Subduction Cutaway & Stratovolcano Cone Building
        (max(0.0, t_s3 - 0.10), SFX_CC0 / "glitch/fs-339521-vhs-rewind-forward-and-eject.ogg", 0.24, 1.6, "S2->S3 Time-rewind Era Kuarter counter spin"),
        (cues["s3_subduct"] - 0.10, SFX_CC0 / "impact/fs-177242-cinematic-impact.ogg", 0.30, 1.9, "S3 Crane-down tectonic subduction cutaway lock"),
        (cues["s3_subduct"] + 0.15, SFX_HF / "sfx_pottery_kiln_roar.mp3", 0.32, 4.2, "S3 Deep Sunda Arc magma chamber rumble"),
        (cues["s3_build"] - 0.12, SFX_HF / "sfx_molten_metal_pour.mp3", 0.38, 4.5, "S3 Basaltic-andesite lava & pyroclastic cone stacking"),

        # S4 — Magma Cooling, Forest Canopy & Porous Rock Rain Percolation
        (max(0.0, t_s4 - 0.10), SFX_CC0 / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.28, 0.65, "S4 Cooling magma pluton crystal thud"),
        (cues["s4_erode"] - 0.05, SFX_HF / "sfx_prehistoric_forest_night.mp3", 0.26, 3.6, "S4 Erosion & highland moss forest closing summit"),
        (cues["s4_rain"] - 0.15, rain_sfx, 0.44, 4.5, "S4 Mountain rainstorm & porous volcanic rock percolation"),
        (cues["s4_dry"] - 0.05, SFX_CC0 / "tick/fs384187.ogg", 0.25, 0.25, "S4 Dry upper trail / foothill spring callout"),

        # S5 — Cloud-Curtain Wipe -> Dawn Temperature Inversion & Sea of Clouds
        (max(0.0, t_s5 - 0.15), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.26, 0.85, "S4->S5 Lineless daylight CloudCurtainWipe"),
        (cues["s5_dawn"] - 0.05, dawn_sfx, 0.36, 4.5, "S5 High-altitude sunrise wind above Cekungan Garut"),
        (cues["s5_inversion"] - 0.06, SFX_GMNI / "sfx_archipelago_pins_bloom.mp3", 0.28, 3.2, "S5 Temperature inversion atmospheric layers reveal"),
        (cues["s5_clouds"] - 0.08, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.22, 1.8, "S5 Golden sunrise summit breakthrough shimmer"),

        # S6 — Seamless Loop Return, Dashed Ghost Blueprint & Vintage Postcard Pull-Out
        (max(0.0, t_s6 - 0.12), SFX_CC0 / "whoosh/fs-169867-swoosh.ogg", 0.24, 0.90, "S5->S6 Aerial pull-back loop return to opening vista"),
        (cues["s6_loop"], dawn_sfx, 0.32, 4.5, "S6 Calm sunlit Garut tea plantation ambience"),
        (cues["s6_ghost"] - 0.06, postcard_sfx, 0.40, 2.9, "S6 Dashed cream-gold ghost blueprint chalk draw & shutter"),
        (total_sec - 2.35, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.9, "S6 Vintage Travel Postcard final border lock chime"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="cikuray-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        vol_expr = (
            f"0.16"
            f"+0.03*between(t,{t_s2:.2f},{t_s3:.2f})"
            f"+0.05*between(t,{t_s3:.2f},{t_s4:.2f})"
            f"+0.03*between(t,{t_s4:.2f},{t_s5:.2f})"
            f"+0.06*between(t,{t_s5:.2f},{t_s6:.2f})"
            f"+0.08*between(t,{t_s6:.2f},{total_sec - 2.1:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11000,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.5,equalizer=f=1800:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=1.0,afade=t=out:st={max(0.0, total_sec - 2.4):.3f}:d=2.3"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(music_path), "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem)],
            check=True,
        )

        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        f_lines = []
        mix_labels = ["[0:a]"]
        for k, (_, t_s, _, vol, p, max_d, _) in enumerate(valid_ev, start=1):
            cmd.extend(["-i", str(p)])
            delay_ms = int(round(t_s * 1000))
            trim_part = f"atrim=0:{max_d:.3f}," if max_d else ""
            fade_out = f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.35):.3f}:d=0.35" if (max_d and max_d >= 0.8) else ""
            f_lines.append(
                f"[{k}:a]aformat=sample_rates={SR}:channel_layouts=stereo,{trim_part}asetpts=PTS-STARTPTS,"
                f"highpass=f=48,afade=t=in:st=0:d=0.025{fade_out},volume={vol:.3f},"
                f"adelay={delay_ms}|{delay_ms}[s{k}]"
            )
            mix_labels.append(f"[s{k}]")
        f_lines.append(
            f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 1.0):.3f}:d=0.95[sfxout]"
        )
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.020:ratio=3.2:attack=20:release=250:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.08[vo_lv];"
            f"[mus_duck]volume=0.88[mus_lv];"
            f"[2:a]volume=0.92[sfx_lv];"
            f"[vo_lv][mus_lv][sfx_lv]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.92:attack=3:release=40[out]"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(VO_WAV), "-i", str(music_stem), "-i", str(sfx_stem), "-filter_complex", mix_fc, "-map", "[out]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(pre_mix)],
            check=True,
        )

        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.6:TP=-2.0:LRA=6.0:print_format=json", "-f", "null", "-"],
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
                    f"loudnorm=I=-14.6:TP=-2.0:LRA=6.0:linear=true:"
                    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
                    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
                    f"offset={stats['target_offset']}"
                ),
                "-ar", "48000", "-ac", "2", "-sample_fmt", "s16", str(OUT_WAV),
            ],
            check=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", str(OUT_M4A)],
            check=True,
        )

    lufs_st, tp_st = measure_ebur128(OUT_M4A, mono=False)
    lufs_mo, tp_mo = measure_ebur128(OUT_M4A, mono=True)
    print(f"\n=== AUDIO MASTER QA (public/gunung-cikuray/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "GUNUNG CIKURAY: ATAP LANGIT GARUT (GunungCikurayShort) — AUDIO & ASSET CREDITS\n"
        "==============================================================================\n"
        f"Narrator Voiceover: {align['voice']} (language='id', tempo={align.get('tempo', 1.18)}x)\n"
        "Bespoke Geological & Weather Foley: ElevenLabs eleven_text_to_sound_v3\n"
        f"Music Score: {music_source} — {music_license}\n"
        "Map Geography Data: Natural Earth / Indonesia Archipelago GeoJSON (Public Domain)\n"
        "Fonts: Alfa Slab One & Plus Jakarta Sans (SIL Open Font License 1.1)\n"
        "CC0 Sound Effects (bundled, public domain CC0 1.0):\n"
        "  - Swoosh v2 (Freesound #786514, CC0), Click Tick (#384187, CC0)\n"
        "  - Dramatic Hit (#222517, CC0), Cinematic Impact (#177242, CC0) & Triangle Open 04 (#349504, CC0)\n",
        encoding="utf-8",
    )

    cue_table = "\n".join(f"| `{t_s:5.2f}s` | `{fname}` | `{vol:.2f}` | {desc} |" for _, t_s, fname, vol, _, _, desc in valid_ev)
    SOUND_MD.write_text(
        f"# GunungCikurayShort — Sound Design & Mastering Report\n\n"
        f"- **Duration**: `{total_sec:.2f}s` (`{align['totalFrames']}` frames @ `30 fps`)\n"
        f"- **Narrator**: `{align['voice']}` (`atempo={align.get('tempo', 1.18)}`)\n"
        f"- **Music**: {music_source} ({music_license})\n"
        f"- **Master Loudness (AAC 192k)**: Stereo `{lufs_st:.2f} LUFS` / True Peak `{tp_st:.2f} dBFS` | Mono `{lufs_mo:.2f} LUFS` / True Peak `{tp_mo:.2f} dBFS`\n\n"
        f"## Cue Placement Table ({len(valid_ev)} SFX events)\n\n"
        f"| Time | File | Gain | Visual Sync Purpose |\n"
        f"|---|---|---:|---|\n"
        f"{cue_table}\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
