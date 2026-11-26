"""
Cinema-Grade Multi-Layer Sound Design & Broadcast Mastering for SejarahKomunikasiShort
("5 Lompatan Komunikasi yang Mengubah Dunia" — Earth-24h Gouache Silhouette Style).

Layers combined deterministically against `sejarah-komunikasi/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Narrator VO (`Brian`, natural documentary pacing)
  2. 6 Bespoke Era SFX via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Real CC0 Bundled Foley (`.agents/skills/sound-effects/sfx/`)
  4. Real Licensed Documentary Score: Mixkit #148 "Forest Mist Whispers" by Alejandro Magana (A. M.)
     with 6-Act dynamic filter/level contour, Anti-Masking Vocal Pocket EQ, Stereo Sidechain Ducking
  5. Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -2.0 dBFS) + Waveform/Spectrogram QA PNG.
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
PUBLIC_DIR = ROOT / "public/sejarah-komunikasi"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"

MIXKIT_148_URL = "https://assets.mixkit.co/music/148/148.mp3"
MIXKIT_148_PATH = ROOT / "human-fire/.audio-cache/mixkit-148-forest-mist-whispers.mp3"
LOCAL_CACHE_MUSIC = CACHE_DIR / "mixkit-148-forest-mist-whispers.mp3"

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    if MIXKIT_148_PATH.exists() and MIXKIT_148_PATH.stat().st_size > 100_000:
        return (
            MIXKIT_148_PATH,
            '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148)',
            "Mixkit Stock Music Free License",
        )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if LOCAL_CACHE_MUSIC.exists() and LOCAL_CACHE_MUSIC.stat().st_size > 100_000:
        return (
            LOCAL_CACHE_MUSIC,
            '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148)',
            "Mixkit Stock Music Free License",
        )
    req = urllib.request.Request(MIXKIT_148_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    LOCAL_CACHE_MUSIC.write_bytes(data)
    return (
        LOCAL_CACHE_MUSIC,
        '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148)',
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
    canvas = np.full((H, W, 3), 18, dtype=np.uint8)

    y_mid = 185
    amp_h = 120
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (26, 20, 34), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (110, 168, 215), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (242, 184, 92), 1)

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
        cv2.line(canvas, (cx, 50), (cx, 670), (70, 210, 250), 1)
        y_txt = 340 if idx % 2 == 0 else 356
        col_txt = (235, 232, 240) if idx % 2 == 0 else (245, 215, 165)
        cv2.putText(canvas, f"{cname}({ct:.0f}s)", (max(60, min(W - 140, cx - 22)), y_txt), cv2.FONT_HERSHEY_SIMPLEX, 0.34, col_txt, 1, cv2.LINE_AA)

    for sec in range(0, int(math.ceil(total_sec)) + 1, 10):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 670), (tx, 680), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 210), 1, cv2.LINE_AA)

    cv2.putText(canvas, "5 LOMPATAN KOMUNIKASI MANUSIA — AUDIO MASTER WAVEFORM, SPECTROGRAM & CUE QA", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (248, 224, 150), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building SejarahKomunikasiShort Cinema Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_s2 = scenes_f["s2Start"] / fps
    t_s3 = scenes_f["s3Start"] / fps
    t_s4 = scenes_f["s4Start"] / fps
    t_s5 = scenes_f["s5Start"] / fps
    t_s6 = scenes_f["s6Start"] / fps

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # S1 — Prehistoric Cave Torch & Hand Stencil Echo
        (0.05, SFX_ELEVEN / "sfx_cave_torch_echo.mp3", 0.36, 6.0, "S1 Prehistoric limestone cave torch crackle & handprint echo"),
        (cues.get("s1_beast", 5.5) - 0.15, SFX_ELEVEN / "sfx_cave_torch_echo.mp3", 0.28, 5.5, "S1 Cave ochre painting warm firelight ambience"),

        # S2 — Mesopotamia Clay Stylus Carving
        (max(0.0, t_s2 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.85, "S1->S2 Era transition into Mesopotamia"),
        (cues.get("s2_cuneiform", t_s2 + 4.0) - 0.25, SFX_ELEVEN / "sfx_clay_stylus_carve.mp3", 0.44, 4.5, "S2 Reed stylus carving cuneiform into wet clay"),
        (cues.get("s2_travel", t_s2 + 8.0) - 0.10, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.16, 1.4, "S2 First portable written message chime"),

        # S3 — Gutenberg Wooden Printing Press & Fluttering Pages
        (max(0.0, t_s3 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.85, "S2->S3 Era transition into 1440 Europe"),
        (cues.get("s3_press", t_s3 + 4.5) - 0.20, SFX_ELEVEN / "sfx_gutenberg_press_pages.mp3", 0.46, 5.0, "S3 Gutenberg screw press lever thud & fluttering parchment pages"),

        # S4 — Trans-Oceanic Telegraph & Telephone Signal Pulse
        (max(0.0, t_s4 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.85, "S3->S4 Dive into trans-oceanic cable"),
        (cues.get("s4_pulse", t_s4 + 4.0) - 0.20, SFX_ELEVEN / "sfx_telegraph_ocean_pulse.mp3", 0.45, 5.0, "S4 Undersea telegraph electrical pulse & copper harmonic"),

        # S5 — 1991 Global Internet Network Shimmer
        (max(0.0, t_s5 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.85, "S4->S5 Ascent to planetary network"),
        (cues.get("s5_internet", t_s5 + 0.5), SFX_ELEVEN / "sfx_global_network_shimmer.mp3", 0.40, 5.5, "S5 Global fiber-optic constellation shimmer"),

        # S6 — AI Neural Constellation & Eternal Echo
        (max(0.0, t_s6 - 0.10), SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.22, 2.2, "S5->S6 Neural constellation reveal resonance"),
        (cues.get("s6_ai", t_s6 + 0.4), SFX_ELEVEN / "sfx_neural_awakening_chime.mp3", 0.42, 6.0, "S6 Warm neural awakening chord & synaptic sparks"),
        (cues.get("s6_echo", t_s6 + 7.5), SFX_ELEVEN / "sfx_cave_torch_echo.mp3", 0.24, 4.5, "S6 Final poetic cave-to-starlight echo"),
    ]

    valid_ev = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="kom-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        vol_expr = (
            f"0.16"
            f"+0.03*between(t,{t_s2:.2f},{t_s4:.2f})"
            f"+0.05*between(t,{t_s4:.2f},{t_s5:.2f})"
            f"+0.08*between(t,{t_s5:.2f},{total_sec - 2.2:.2f})"
            f"*max(0.0,(1-max(0,(t-{total_sec - 2.2:.2f})/2.1)))"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11000,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.5,equalizer=f=1800:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=1.6,afade=t=out:st={max(0.0, total_sec - 2.4):.3f}:d=2.3"
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
    print(f"\n=== AUDIO MASTER QA (public/sejarah-komunikasi/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")


if __name__ == "__main__":
    main()
