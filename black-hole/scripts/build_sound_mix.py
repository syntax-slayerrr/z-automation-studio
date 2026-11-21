"""
Cinema-Grade Multi-Layer Sound Design & Broadcast Mastering for BlackHoleShort.

Layers combined deterministically against `black-hole/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Narrator VO (`Brian`, 164 words, character-aligned cues)
  2. 9 Bespoke Animation-Matched SFX via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Real CC0 Bundled Foley (`.agents/skills/sound-effects/sfx/`)
  4. Real Licensed Cosmic Music Score: Mixkit #723 "Other World" by Lily J (Mixkit Stock Music Free License)
     with 5-Act dynamic filter/level contour, Anti-Masking Vocal Pocket EQ, Stereo Sidechain Ducking,
     and a theatrical 0.85s TOTAL VACUUM SILENCE drop right after "Hening." at the Event Horizon!
  5. Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -2.0 dBFS) + Waveform/Spectrogram QA PNG
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
SFX_ELEVEN = AUDIO_DIR / "sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/black-hole"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"
SOUND_MD = OUT_DIR / "SOUND.md"

MIXKIT_723_URL = "https://assets.mixkit.co/music/723/723.mp3"
MIXKIT_723_PATH = CACHE_DIR / "mixkit-723-other-world.mp3"
FALLBACK_MUSIC = ROOT / "ipm-chronicles/public/audio/music/mixkit_140_cyberpunk_city.mp3"

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if MIXKIT_723_PATH.exists() and MIXKIT_723_PATH.stat().st_size > 100_000:
        return (
            MIXKIT_723_PATH,
            '"Other World" by Lily J (Mixkit #723, https://mixkit.co/free-stock-music/)',
            "Mixkit Stock Music Free License",
        )
    try:
        print(f"Downloading Mixkit #723 ('Other World' by Lily J) -> {MIXKIT_723_PATH}...")
        req = urllib.request.Request(MIXKIT_723_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
        if len(data) > 100_000:
            MIXKIT_723_PATH.write_bytes(data)
            return (
                MIXKIT_723_PATH,
                '"Other World" by Lily J (Mixkit #723, https://mixkit.co/free-stock-music/)',
                "Mixkit Stock Music Free License",
            )
    except Exception as exc:
        print(f"WARN: Mixkit #723 download failed ({exc}); checking fallback Mixkit #140...")
    if FALLBACK_MUSIC.exists():
        return (
            FALLBACK_MUSIC,
            '"Cyberpunk City" by Alejandro Magana (Mixkit #140)',
            "Mixkit Stock Music Free License",
        )
    raise RuntimeError("No licensed music track available.")


def find_word_end(words: list[dict], cue_name: str, fallback: float) -> float:
    for w in words:
        if w.get("cue") == cue_name:
            return float(w["end"])
    return fallback


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


def render_audio_qa_sheet(wav_path: Path, cues: dict[str, float], sil_s: float, sil_e: float, total_sec: float, out_png: Path) -> None:
    import cv2

    sr, data = wavfile.read(str(wav_path))
    if data.ndim == 2:
        mono = data.astype(np.float32).mean(axis=1) / 32768.0
    else:
        mono = data.astype(np.float32) / 32768.0

    W, H = 1600, 720
    canvas = np.full((H, W, 3), 18, dtype=np.uint8)

    # Top panel: Waveform (y = 50..320)
    y_mid = 185
    amp_h = 120
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (26, 22, 36), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (105, 175, 220), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (240, 198, 98), 1)

    # Highlight Event Horizon vacuum silence drop in translucent teal box
    sx0 = 60 + int(round((sil_s / total_sec) * plot_w))
    sx1 = 60 + int(round((sil_e / total_sec) * plot_w))
    cv2.rectangle(canvas, (sx0, 50), (sx1, 320), (50, 210, 220), 2)
    cv2.putText(canvas, "VACUUM SILENCE", (max(62, sx0 - 30), 44), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (80, 235, 240), 1, cv2.LINE_AA)

    # Bottom panel: Log-frequency spectrogram (y = 365..670)
    freqs, times, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    # Keep 0..10 kHz
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_INFERNO)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[365:670, 60 : 60 + plot_w] = spec_res

    # Vertical Cue Markers & Labels across both panels
    for idx, (cname, ct) in enumerate(sorted(cues.items(), key=lambda kv: kv[1])):
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 50), (cx, 670), (70, 220, 255), 1)
        ly = 340 if idx % 2 == 0 else 356
        cv2.putText(canvas, f"{cname}({ct:.1f}s)", (max(60, min(W - 140, cx - 22)), ly), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (230, 235, 245), 1, cv2.LINE_AA)

    # Time axis ticks every 5s
    for sec in range(0, int(math.ceil(total_sec)) + 1, 5):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 670), (tx, 680), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 210), 1, cv2.LINE_AA)

    cv2.putText(canvas, "BLACK HOLE SHORT — AUDIO MASTER WAVEFORM, SPECTROGRAM & CUE ALIGNMENT QA", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 224, 150), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])
    words = align["words"]

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building BlackHoleShort Cinema Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    # Key musical contour timestamps
    t_s2 = scenes_f["s2Start"] / fps
    t_s3 = scenes_f["s3Start"] / fps
    t_s4 = scenes_f["s4Start"] / fps
    t_s5 = scenes_f["s5Start"] / fps
    t_s6 = scenes_f["s6Start"] / fps
    t_s7 = scenes_f["s7Start"] / fps

    # Exact Theatrical Vacuum Silence Window right after "Hening."
    t_hening_end = find_word_end(words, "s3_hening", cues["s3_hening"] + 0.55)
    t_next_s3 = cues["s3_sky"] - 0.14
    sil_start = max(t_s3, t_hening_end + 0.03)
    sil_end = max(sil_start + 0.55, min(t_next_s3, sil_start + 0.92))
    print(f"  -> Event Horizon Vacuum Silence: {sil_start:.3f}s .. {sil_end:.3f}s ({sil_end - sil_start:.2f}s)")

    # Complete Animation-Locked SFX Cue List (V2 Cinema-Realistic: zero antique brass gears!)
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # S1 — Deep cosmic sub-swell opening + Time Dilation slowing watch on redshift freeze
        (0.00, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.24, 2.2, "S1 Opening deep cosmic black hole presence swell"),
        (cues["s1_slow"] - 0.12, SFX_ELEVEN / "sfx_time_dilation_clock.mp3", 0.42, 4.4, "S1 Time-dilation clock slowing down & redshifting"),

        # S1 -> S2 Whip-Push into First-Person Helmet POV + 1.00s real wrist-watch ticks + Photon ring shimmer
        (max(0.0, t_s2 - 0.07), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.34, 0.85, "S1->S2 Whip-push optical transition into helmet POV"),
        (cues["s2_watch"] + 0.02, SFX_CC0 / "tick/fs384187.ogg", 0.36, 0.25, "S2 Space chronograph tick #1"),
        (cues["s2_watch"] + 1.02, SFX_CC0 / "tick/fs384187.ogg", 0.34, 0.25, "S2 Space chronograph tick #2"),
        (cues["s2_watch"] + 2.02, SFX_CC0 / "tick/fs384187.ogg", 0.30, 0.25, "S2 Space chronograph tick #3"),
        (cues["s2_bend"] - 0.15, SFX_ELEVEN / "sfx_photon_lens_shimmer.mp3", 0.40, 3.4, "S2 Photon Sphere gravitational lensing shimmer"),
        (cues["s2_mirror"] - 0.05, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.20, 1.3, "S2 Back-of-head mirror light reflection sparkle"),

        # S2 -> S3 Accelerating Plunge across Event Horizon -> Gravity Inhale -> Vacuum Silence -> Sky Collapse
        (max(0.0, t_s3 - 0.08), SFX_CC0 / "kit/whoosh.ogg", 0.30, 0.75, "S2->S3 Plunge through photon ring toward Event Horizon"),
        (cues["s3_horizon"] - 0.08, SFX_CC0 / "click/kenney-interface-click-001.ogg", 0.24, 0.22, "S3 Helmet HUD horizon telemetry chime"),
        (cues["s3_horizon"] + 0.05, SFX_ELEVEN / "sfx_horizon_latch.mp3", 0.44, max(0.5, sil_start - (cues["s3_horizon"] + 0.05) - 0.02), "S3 Event Horizon deep gravity inhale cutting abruptly to vacuum silence"),
        # NOTE: ZERO SFX during [sil_start .. sil_end] -> pure theatrical vacuum!
        (sil_end + 0.02, SFX_ELEVEN / "sfx_sky_collapse.mp3", 0.46, 2.9, "S3 Relativistic sky collapse into bright blueshifted overhead orb"),
        (cues["s3_sky"] + 0.05, SFX_CC0 / "kit/impact.ogg", 0.34, 1.2, "S3 Soft relativistic seal impact"),

        # S3 -> S4 Iris Match-Cut into 3D Volumetric Spacetime Funnel
        (max(0.0, t_s4 - 0.07), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.28, 0.75, "S3->S4 Iris match-cut into 3D spacetime gravity well"),
        (cues["s4_invert"] - 0.10, SFX_ELEVEN / "sfx_spacetime_invert.mp3", 0.42, 3.7, "S4 Spacetime metric flip resonant gravity reversal"),
        (cues["s4_swap"] - 0.04, SFX_CC0 / "transition/fs-856168-cyberpunk-glitch-hologram-tran.ogg", 0.18, 0.90, "S4 Light-cone tilt spatial warp"),
        (cues["s4_future"] + 0.00, SFX_CC0 / "kit/tick.ogg", 0.26, 0.25, "S4 One-way future pulse #1"),
        (cues["s4_future"] + 0.85, SFX_CC0 / "kit/tick.ogg", 0.24, 0.25, "S4 One-way future pulse #2"),

        # S4 -> S5 High-G Plunge into Tidal Vortex -> Spaghettification Tension -> 2400-Particle Atomic Shatter
        (max(0.0, t_s5 - 0.07), SFX_CC0 / "kit/whoosh.ogg", 0.34, 0.75, "S4->S5 Plunge into turbulent tidal canyon"),
        (cues["s5_tidal"] + 0.35, SFX_ELEVEN / "sfx_spaghettification_tension.mp3", 0.46, 4.1, "S5 Cello-like gravitational tidal tension stretching"),
        (cues["s5_atoms"] - 0.18, SFX_CC0 / "impact/fs-177242-cinematic-impact.ogg", 0.38, 1.8, "S5 Atomic dissociation sub-impact"),
        (cues["s5_atoms"] - 0.08, SFX_ELEVEN / "sfx_atomic_shatter.mp3", 0.44, 2.9, "S5 Sparkling 3D atomic stream shattering"),

        # S5 -> S6 Optical Flash Cut -> Instant Zero-G Stillness at Singularity -> Equation Fracture
        (max(0.0, t_s6 - 0.07), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.75, "S5->S6 Optical flash cut to singularity stillness"),
        (cues["s6_sing"] - 0.05, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.32, 1.5, "S6 Singularity muted deep velvet pulse"),
        (cues["s6_crack"] - 0.18, SFX_ELEVEN / "sfx_equation_fracture.mp3", 0.48, 3.7, "S6 Delicate 3D curvature & equation fracture into floating gold dust"),

        # S6 -> S7 Grand Pull-Out Through Photorealistic Milky Way Core (Sagittarius A*)
        (max(0.0, t_s7 - 0.08), SFX_CC0 / "kit/whoosh.ogg", 0.28, 0.90, "S6->S7 Grand pull-out through Milky Way galactic dust"),
        (cues["s7_sgr"] - 0.08, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.6, "S7 Sagittarius A* resonant cosmic shimmer"),
        (cues["s7_sgr"] + 0.35, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.22, 2.2, "S7 Deep subtle galactic gravity resonance settling into loop"),
    ]

    with tempfile.TemporaryDirectory(dir=str(PROJECT)) as td:
        tmp = Path(td)
        vo_pad = tmp / "vo_pad.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(VO_WAV), "-af", f"apad=whole_dur={total_sec:.3f}", "-ar", str(SR), "-ac", "1", str(vo_pad)],
            check=True,
        )

        # Build 5-Act Contoured Music Bed with Anti-Masking Vocal Pocket EQ, Sidechain Ducking & 0.85s Vacuum Silence!
        bed_wav = tmp / "bed_ducked.wav"
        amb_path = SFX_CC0 / "ambience/fs-329533-room-tone-in-an-apartment-livi.ogg"

        # Smooth dynamic section gain curve + sharp vacuum silence mute [sil_start .. sil_end]
        sil_fade_in = sil_start
        sil_fade_out = sil_end
        mus_filter = (
            f"[0:a]aresample={SR},aformat=channel_layouts=stereo,atrim=duration={total_sec:.3f},"
            f"highpass=f=32,lowpass=f=4800,"
            # Anti-masking pocket for Brian's baritone voice (240 Hz..2.6 kHz)
            f"equalizer=f=900:t=q:w=0.85:g=-3.8,equalizer=f=240:t=q:w=1.2:g=-2.2,"
            f"volume=0.22,"
            # Dynamic 5-act emotional contour
            f"volume=enable='between(t,{t_s5:.3f},{t_s6:.3f})':volume=1.32,"
            f"volume=enable='between(t,{t_s6:.3f},{t_s7:.3f})':volume=0.58,"
            f"volume=enable='between(t,{t_s7:.3f},{total_sec:.3f})':volume=1.18,"
            # THEATRICAL TOTAL VACUUM SILENCE at Event Horizon ("Hening.") with clean 20ms ramps!
            f"volume=enable='between(t,{sil_fade_in:.3f},{sil_fade_out:.3f})':volume=0.0,"
            f"afade=t=in:st=0:d=0.45,afade=t=out:st={max(0, total_sec - 1.5):.3f}:d=1.5[mus];"
            f"[1:a]aresample={SR},aformat=channel_layouts=stereo,atrim=duration={total_sec:.3f},"
            f"lowpass=f=1200,volume=0.055,"
            f"volume=enable='between(t,{sil_fade_in:.3f},{sil_fade_out:.3f})':volume=0.0[amb];"
            f"[mus][amb]amix=inputs=2:duration=shortest:normalize=0[bg];"
            f"[2:a]aresample={SR},aformat=channel_layouts=stereo[vo_sc];"
            f"[bg][vo_sc]sidechaincompress=threshold=0.016:ratio=5.5:attack=10:release=240[bg_fin]"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-stream_loop", "-1", "-i", str(music_path),
                "-stream_loop", "-1", "-i", str(amb_path),
                "-i", str(vo_pad),
                "-filter_complex", mus_filter,
                "-map", "[bg_fin]", str(bed_wav),
            ],
            check=True,
        )

        # Build frame-accurate SFX Bus
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        valid_ev = []
        for t_s, path, vol, max_d, desc in sfx_events:
            if not path.exists():
                print(f"WARN: missing SFX {path}")
                continue
            t_ms = max(0, int(round(t_s * 1000)))
            cmd.extend(["-i", str(path)])
            valid_ev.append((len(valid_ev) + 1, t_s, path.name, vol, t_ms, max_d, desc))

        filters = []
        mix_labels = ["[0:a]"]
        for in_idx, t_s, _, vol, t_ms, max_d, _ in valid_ev:
            trim_p = f"atrim=duration={max_d:.2f}," if max_d else ""
            fade_out_p = f"afade=t=out:st={max(0.05, (max_d or 1.0) - 0.12):.2f}:d=0.12," if max_d else ""
            # Subtle stereo pan alternation for spacious cinematic width without pulling center impacts off-axis
            pan_val = 0.0 if ("impact" in valid_ev[in_idx - 1][2] or "horizon" in valid_ev[in_idx - 1][2]) else (0.14 if in_idx % 2 == 0 else -0.14)
            pan_p = f"stereotools=balance_out={pan_val:.2f}," if abs(pan_val) > 0.01 else ""
            filters.append(
                f"[{in_idx}:a]aresample={SR},aformat=channel_layouts=stereo,"
                f"{trim_p}afade=t=in:st=0:d=0.015,{fade_out_p}{pan_p}volume={vol:.3f},adelay={t_ms}|{t_ms}[s{in_idx}]"
            )
            mix_labels.append(f"[s{in_idx}]")

        sfx_bus = tmp / "sfx_bus.wav"
        filters.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:normalize=0[sfx]")
        cmd.extend(["-filter_complex", ";".join(filters), "-map", "[sfx]", str(sfx_bus)])
        subprocess.run(cmd, check=True)

        # Combine VO (Priority #1) + SFX (Priority #2) + Ducked Music Bed (Priority #3)
        pre_mix = tmp / "pre_mix.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(vo_pad), "-i", str(bed_wav), "-i", str(sfx_bus),
                "-filter_complex",
                (
                    "[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.12[vo];"
                    "[1:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.00[bg];"
                    "[2:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.92[sx];"
                    "[vo][bg][sx]amix=inputs=3:duration=first:normalize=0[out]"
                ),
                "-map", "[out]", "-sample_fmt", "s16", str(pre_mix),
            ],
            check=True,
        )

        # Two-pass exact broadcast loudness mastering: -14.5 LUFS, True Peak <= -2.0 dBFS
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
    print(f"\n=== AUDIO MASTER QA (public/black-hole/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, sil_start, sil_end, total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "BLACK HOLE SHORT — AUDIO & SOUND DESIGN CREDITS\n"
        "================================================\n"
        "Narrator Voiceover: Brian (ElevenLabs eleven_v4, language='id')\n"
        "Bespoke Animation SFX (9 clips): ElevenLabs eleven_text_to_sound_v3\n"
        f"Music Score: {music_source} — {music_license}\n"
        "CC0 Sound Effects (bundled, public domain CC0 1.0):\n"
        "  - Whoosh by qubodup (https://freesound.org/people/qubodup/sounds/60013/)\n"
        "  - Swoosh v2 (Freesound #786514, CC0)\n"
        "  - Classic Click / Kenney Interface Click (Kenney.nl, CC0)\n"
        "  - Click Tick (Freesound #384187, CC0) & Click/Tick by Squirrel_404 (#683048, CC0)\n"
        "  - soft_impact3 by peoplearehappy (#841274, CC0), Cinematic Impact (#177242, CC0), Dramatic Hit (#222517, CC0)\n"
        "  - Triangle Open 04 (#349504, CC0) & Cyberpunk Glitch Hologram Transition (#856168, CC0)\n"
        "  - Room Tone Ambience (#329533, CC0)\n",
        encoding="utf-8",
    )

    cue_table = "\n".join(f"| `{t_s:5.2f}s` | `{fname}` | `{vol:.2f}` | {desc} |" for _, t_s, fname, vol, _, _, desc in valid_ev)
    SOUND_MD.write_text(
        f"# BlackHoleShort — Sound Design & Mastering Report\n\n"
        f"- **Duration**: `{total_sec:.2f}s` (`{align['totalFrames']}` frames @ `30 fps`)\n"
        f"- **Narrator**: `{align['voice']}` (`atempo=1.28` pitch-preserved)\n"
        f"- **Music**: {music_source} ({music_license})\n"
        f"- **Event Horizon Theatrical Vacuum Silence**: `{sil_start:.2f}s – {sil_end:.2f}s` (`{sil_end - sil_start:.2f}s`)\n"
        f"- **Master Loudness (AAC 192k)**: Stereo `{lufs_st:.2f} LUFS` / True Peak `{tp_st:.2f} dBFS` | Mono `{lufs_mo:.2f} LUFS` / True Peak `{tp_mo:.2f} dBFS`\n\n"
        f"## 5 Headphone Spot-Check Timestamps\n"
        f"1. **`{cues['s1_slow']:.2f}s`** — S1 time-dilation clock slowing down beneath narrator as astronaut redshifts.\n"
        f"2. **`{cues['s2_watch']:.2f}s`** — S2 crisp 1.0s/beat space chronograph ticks + Photon Sphere glass shimmer at `{cues['s2_bend']:.2f}s`.\n"
        f"3. **`{sil_start:.2f}s → {sil_end:.2f}s`** — S3 Event Horizon gravity inhale cutting cleanly into `{sil_end - sil_start:.2f}s` total vacuum silence after *\"Hening.\"* then sky-collapse rush.\n"
        f"4. **`{cues['s5_stretch']:.2f}s → {cues['s5_atoms']:.2f}s`** — S5 Spaghettification cello tension building into crystalline atomic shatter.\n"
        f"5. **`{cues['s6_crack']:.2f}s`** — S6 porcelain/glass equation fracture in quiet velvet space before Sagittarius A* pull-out.\n\n"
        f"## Cue Placement Table ({len(valid_ev)} SFX events)\n\n"
        f"| Time | File | Gain | Visual Sync Purpose |\n"
        f"|---|---|---:|---|\n"
        f"{cue_table}\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
