"""
Cinema-Grade Multi-Layer Sound Design & Broadcast Mastering for GambutHistoryShort
("GAMBUT: WARISAN RIBUAN TAHUN, API YANG TERSEMBUNYI" — ±92s, 8 scenes).

Layers combined deterministically against `gambut-history/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Narrator VO (Brian, pronunciation-verified via direct audio listen)
  2. 6 Bespoke Geological & Ecological Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Real CC0 Bundled Foley (`.agents/skills/sound-effects/sfx/`) + local map shimmer
  4. Real Licensed Atmospheric Documentary Score: Mixkit #148 "Forest Mist Whispers"
     (Mixkit Stock Music Free License) with 8-Act contour (mysterious -> scientific -> dramatic swell on smouldering -> reflective close),
     Vocal Pocket EQ, Stereo Sidechain Ducking, and resolved ending.
  5. Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -1.9 dBFS) + Waveform/Spectrogram QA PNG
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
SFX_GMNI = ROOT / "gmni-history/audio/sfx"
SFX_HF = ROOT / "human-fire/audio/sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/gambut-history"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"
SOUND_MD = OUT_DIR / "SOUND.md"

LOCAL_MUSIC = ROOT / "human-fire/.audio-cache/mixkit-148-forest-mist-whispers.mp3"
MIXKIT_URL = "https://assets.mixkit.co/music/148/148.mp3"
MIXKIT_PATH = CACHE_DIR / "mixkit-148-forest-mist-whispers.mp3"

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if LOCAL_MUSIC.exists() and LOCAL_MUSIC.stat().st_size > 100_000:
        return (
            LOCAL_MUSIC,
            '"Forest Mist Whispers" (Mixkit #148, https://mixkit.co/free-stock-music/)',
            "Mixkit Stock Music Free License",
        )
    if MIXKIT_PATH.exists() and MIXKIT_PATH.stat().st_size > 100_000:
        return (
            MIXKIT_PATH,
            '"Forest Mist Whispers" (Mixkit #148, https://mixkit.co/free-stock-music/)',
            "Mixkit Stock Music Free License",
        )
    req = urllib.request.Request(MIXKIT_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    MIXKIT_PATH.write_bytes(data)
    return (
        MIXKIT_PATH,
        '"Forest Mist Whispers" (Mixkit #148, https://mixkit.co/free-stock-music/)',
        "Mixkit Stock Music Free License",
    )


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
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (30, 34, 28), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (148, 190, 160), 1)
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
        cv2.putText(canvas, f"{cname}({ct:.0f}s)", (max(60, min(W - 140, cx - 22)), ly), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (240, 236, 226), 1, cv2.LINE_AA)

    for sec in range(0, int(math.ceil(total_sec)) + 1, 10):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 670), (tx, 680), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (210, 206, 196), 1, cv2.LINE_AA)

    cv2.putText(canvas, "GAMBUT: WARISAN RIBUAN TAHUN, API YANG TERSEMBUNYI — AUDIO MASTER WAVEFORM & SPECTROGRAM QA", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (120, 215, 248), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building GambutHistoryShort Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_s2 = scenes_f["s2Start"] / fps
    t_s3 = scenes_f["s3Start"] / fps
    t_s4 = scenes_f["s4Start"] / fps
    t_s5 = scenes_f["s5Start"] / fps
    t_s6 = scenes_f["s6Start"] / fps
    t_s7 = scenes_f["s7Start"] / fps
    t_s8 = scenes_f["s8Start"] / fps

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # S1 — Misty Peat Swamp Forest Flyover -> Geological Cutaway -> Time-Rewind
        (0.05, SFX_OWN / "sfx_swamp_forest_ambience.mp3", 0.44, 4.5, "S1 Low flyover misty peat swamp forest & water reflection"),
        (cues["s1_cutaway"] - 0.12, SFX_OWN / "sfx_earth_cutaway_rumble.mp3", 0.46, 4.2, "S1 Deep earthy rumble diving into geological cutaway"),
        (cues["s1_rewind"] - 0.08, SFX_CC0 / "glitch/fs-339521-vhs-rewind-forward-and-eject.ogg", 0.18, 1.5, "S1 Subtle time-rewind back to ancient organic layers"),

        # S2 — Indonesia Map Zoom Sebangau -> Peat Core Auger 9.5m -> Radiocarbon Lab 26,000 yrs
        (max(0.0, t_s2 - 0.10), SFX_GMNI / "sfx_map_lines_shimmer.mp3", 0.38, 3.6, "S2 Premium Indonesia Atlas zoom to Sebangau"),
        (cues["s2_auger"] - 0.12, SFX_OWN / "sfx_peat_core_auger.mp3", 0.48, 4.4, "S2 Peat corer auger twisting & pulling 9.5m core"),
        (cues["s2_core95"] - 0.05, SFX_CC0 / "tick/fs384187.ogg", 0.24, 0.25, "S2 9,5 METER depth marker tick"),
        (cues["s2_lab26k"] - 0.08, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.5, "S2 Radiocarbon C-14 lock ±26.000 TAHUN LALU"),

        # S3 — Ancient Swamp Reconstruction -> Falling Leaves -> Underwater Low O2 -> Peat Layering
        (max(0.0, t_s3 - 0.12), SFX_CC0 / "whoosh/fs-264777-swoosh.ogg", 0.22, 0.85, "S2->S3 Transition entering organic core structure"),
        (cues["s3_swamp"], SFX_OWN / "sfx_swamp_forest_ambience.mp3", 0.40, 4.5, "S3 Ancient flooded peat swamp forest ambience"),
        (cues["s3_low_o2"] - 0.10, SFX_OWN / "sfx_earth_cutaway_rumble.mp3", 0.36, 4.0, "S3 Underwater cross-section low oxygen slow decay"),
        (cues["s3_layers"] - 0.06, SFX_CC0 / "typing/fs-511418-data-reveal-sound.ogg", 0.22, 2.2, "S3 Time-lapse geological peat layer accumulation"),

        # S4 — Indonesia Atlas Pan Kalimantan -> Central Sumatra Coast -> 6,500 vs 26,000 Compare
        (max(0.0, t_s4 - 0.10), SFX_GMNI / "sfx_archipelago_pins_bloom.mp3", 0.38, 3.8, "S4 Atlas pan from Sebangau to East Sumatra coast"),
        (cues["s4_sumatra"] + 0.20, SFX_CC0 / "tick/fs384187.ogg", 0.22, 0.22, "S4 Core drilling pin 1"),
        (cues["s4_sumatra"] + 0.55, SFX_CC0 / "tick/fs384187.ogg", 0.22, 0.22, "S4 Core drilling pin 2"),
        (cues["s4_sumatra"] + 0.90, SFX_CC0 / "tick/fs384187.ogg", 0.22, 0.22, "S4 Core drilling pin 3"),
        (cues["s4_compare"] - 0.06, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.4, "S4 Age comparison ±6.500 vs ±26.000 tahun"),

        # S5 — Natural Wet Peat -> Drainage Canal -> Water Table Drop -> Drying Cracks
        (max(0.0, t_s5 - 0.10), SFX_OWN / "sfx_swamp_forest_ambience.mp3", 0.36, 3.4, "S5 Natural water-saturated peat forest"),
        (cues["s5_canal"] - 0.12, SFX_OWN / "sfx_canal_drain_crack.mp3", 0.52, 4.5, "S5 Drainage canal rushing water out & dry earth cracking"),
        (cues["s5_waterdrop"] - 0.10, SFX_OWN / "sfx_earth_cutaway_rumble.mp3", 0.36, 3.6, "S5 Cutaway dive showing dropping water table"),
        (cues["s5_dry"] - 0.06, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.24, 1.6, "S5 GAMBUT MENGERING warning lock"),

        # S6 — Surface Ignition -> Subterranean Flameless Smouldering -> Smoke Rising
        (max(0.0, t_s6 - 0.10), SFX_HF / "sfx_campfire_crackling.mp3", 0.34, 3.4, "S6 Dry surface twig ignition spreading downward"),
        (cues["s6_underground"] - 0.15, SFX_OWN / "sfx_earth_cutaway_rumble.mp3", 0.42, 3.2, "S6 Dive into underground peat strata"),
        (cues["s6_underground"] + 0.05, SFX_OWN / "sfx_smouldering_embers.mp3", 0.56, 5.0, "S6 Quiet eerie subterranean smouldering ember crackle & hiss"),
        (cues["s6_smoulder"] - 0.08, SFX_CC0 / "impact/fs-177242-cinematic-impact.ogg", 0.26, 1.8, "S6 SMOULDERING COMBUSTION scientific reveal"),

        # S7 — Sumatra Field Experiment Map -> 4-10 Days Timeline -> 3 Heavy Rainstorms vs Underground Embers
        (max(0.0, t_s7 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.85, "S6->S7 Smoke wipe to Sumatra field map"),
        (cues["s7_map"] + 0.05, SFX_GMNI / "sfx_map_lines_shimmer.mp3", 0.34, 2.8, "S7 Zoom to Sumatra peatland experiment site"),
        (cues["s7_days"] - 0.05, SFX_CC0 / "typing/fs-511418-data-reveal-sound.ogg", 0.24, 2.2, "S7 Day 1 to Day 10 timeline counter"),
        (cues["s7_rain"] - 0.15, SFX_OWN / "sfx_heavy_rain_sizzle.mp3", 0.56, 5.0, "S7 Three heavy tropical rainstorms with muffled underground ember hiss"),
        (cues["s7_persists"] + 0.15, SFX_OWN / "sfx_smouldering_embers.mp3", 0.44, 4.2, "S7 Persistent underground smouldering glow beneath wet soil"),

        # S8 — Carbon Smoke Rising -> Split Restoration -> Lush Wet Peatland Finale
        (max(0.0, t_s8 - 0.10), SFX_CC0 / "whoosh/fs-169867-swoosh.ogg", 0.22, 0.90, "S7->S8 Rising smoke into canopy overview"),
        (cues["s8_carbon"], SFX_OWN / "sfx_smouldering_embers.mp3", 0.34, 3.6, "S8 Hidden embers releasing carbon smoke"),
        (cues["s8_restore"] - 0.10, SFX_OWN / "sfx_swamp_forest_ambience.mp3", 0.48, 4.5, "S8 Restored wet peatland water & peaceful forest breeze"),
        (total_sec - 2.60, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.22, 2.0, "S8 Closing Vintage Documentary Poster resolution chime"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="gambut-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # 8-Act Music Contour: mysterious open -> curious science -> dramatic rise on S6-S7 smouldering -> serene reflective close
        vol_expr = (
            f"0.17"
            f"+0.02*between(t,{t_s2:.2f},{t_s5:.2f})"
            f"+0.06*between(t,{t_s5:.2f},{t_s6:.2f})"
            f"+0.09*between(t,{t_s6:.2f},{t_s8:.2f})"
            f"+0.04*between(t,{t_s8:.2f},{total_sec - 2.4:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=10800,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.4,equalizer=f=1800:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=1.4,afade=t=out:st={max(0.0, total_sec - 3.0):.3f}:d=2.9"
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
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 1.2):.3f}:d=1.15[sfxout]"
        )
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.020:ratio=3.2:attack=20:release=260:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.08[vo_lv];"
            f"[mus_duck]volume=0.90[mus_lv];"
            f"[2:a]volume=0.92[sfx_lv];"
            f"[vo_lv][mus_lv][sfx_lv]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.92:attack=3:release=40[out]"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(VO_WAV), "-i", str(music_stem), "-i", str(sfx_stem), "-filter_complex", mix_fc, "-map", "[out]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(pre_mix)],
            check=True,
        )

        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.5:TP=-2.0:LRA=6.0:print_format=json", "-f", "null", "-"],
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
                    f"loudnorm=I=-14.5:TP=-2.0:LRA=6.0:linear=true:"
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
    print(f"\n=== AUDIO MASTER QA (public/gambut-history/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "GAMBUT: WARISAN RIBUAN TAHUN, API YANG TERSEMBUNYI (GambutHistoryShort) — CREDITS\n"
        "==================================================================================\n"
        f"Narrator Voiceover: {align['voice']} (language='id', tempo={align.get('tempo', 1.16)}x)\n"
        "Bespoke Geological & Ecological Foley SFX (6 clips): ElevenLabs eleven_text_to_sound_v3\n"
        f"Music Score: {music_source} — {music_license}\n"
        "Map Geography Data: Natural Earth / Indonesia Archipelago GeoJSON (Public Domain)\n"
        "Fonts: Alfa Slab One & Plus Jakarta Sans (SIL Open Font License 1.1)\n"
        "CC0 Sound Effects (bundled, public domain CC0 1.0):\n"
        "  - Swoosh v2 (#786514), Click Tick (#384187), Data Reveal (#511418)\n"
        "  - Dramatic Hit (#222517), Cinematic Impact (#177242), Triangle Open 04 (#349504)\n",
        encoding="utf-8",
    )

    cue_table = "\n".join(f"| `{t_s:5.2f}s` | `{fname}` | `{vol:.2f}` | {desc} |" for _, t_s, fname, vol, _, _, desc in valid_ev)
    SOUND_MD.write_text(
        f"# GambutHistoryShort — Sound Design & Mastering Report\n\n"
        f"- **Duration**: `{total_sec:.2f}s` (`{align['totalFrames']}` frames @ `30 fps`)\n"
        f"- **Narrator**: `{align['voice']}` (`atempo={align.get('tempo', 1.16)}`)\n"
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
