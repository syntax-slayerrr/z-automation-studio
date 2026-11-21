"""
Broadcast Multi-Layer Sound Design & Mastering for SawahTeraseringShort
("Kenapa Sawah di Gunung Dibuat Bertingkat (Terasering)?")

Layers combined deterministically against `sawah-terasering/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Conversational Indonesian Narrator VO (Brian)
  2. 9 Bespoke Tactile Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Real CC0 Transition & Impact Accents (`.agents/skills/sound-effects/sfx/`)
  4. Real Licensed Upbeat Curious Acoustic Music Score (Mixkit Stock Music Free License)
     with 7-Sequence dynamic contour, Anti-Masking Vocal Pocket EQ, and Stereo Sidechain Ducking
  5. Two-Pass Linear Broadcast Loudness Mastering (-14.8 LUFS, True Peak <= -1.5 dBFS)
     -> `public/sawah-terasering/audio_master.m4a` + Waveform/Spectrogram QA PNG + `CREDITS.txt`
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
PUBLIC_DIR = ROOT / "public/sawah-terasering"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"

# Upbeat warm curious acoustic/pizzicato Mixkit tracks (try upbeat #117 "A Very Happy Christmas" / #56 / #148 fallback)
MUSIC_CANDIDATES = [
    (
        "https://assets.mixkit.co/music/117/117.mp3",
        "mixkit-117-curious-acoustic.mp3",
        '"Sun and Fun" / Upbeat Curious Acoustic (Mixkit #117, https://mixkit.co/free-stock-music/)',
    ),
    (
        "https://assets.mixkit.co/music/148/148.mp3",
        "mixkit-148-forest-mist-whispers.mp3",
        '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148, https://mixkit.co/free-stock-music/)',
    ),
]

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    # Check local cached music first
    for url, fname, credit in MUSIC_CANDIDATES:
        target = CACHE_DIR / fname
        if target.exists() and target.stat().st_size > 100_000:
            return target, credit, "Mixkit Stock Music Free License"
    # Download first available Mixkit track
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
    # Fallback to already cached human-fire Mixkit track if offline
    hf_cache = ROOT / "human-fire/.audio-cache/mixkit-148-forest-mist-whispers.mp3"
    if hf_cache.exists():
        return (
            hf_cache,
            '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148, https://mixkit.co/free-stock-music/)',
            "Mixkit Stock Music Free License",
        )
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

    W, H = 1600, 720
    canvas = np.full((H, W, 3), 18, dtype=np.uint8)
    y_mid = 185
    amp_h = 120
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (22, 30, 26), -1)
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
    canvas[365:670, 60 : 60 + plot_w] = spec_res

    for idx, (cname, ct) in enumerate(sorted(cues.items(), key=lambda kv: kv[1])):
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 50), (cx, 670), (70, 225, 250), 1)
        y_lbl = 340 if idx % 2 == 0 else 356
        cv2.putText(
            canvas,
            f"{cname}({ct:.1f}s)",
            (max(60, min(W - 140, cx - 20)), y_lbl),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.34,
            (235, 240, 232),
            1,
            cv2.LINE_AA,
        )

    for sec in range(0, int(math.ceil(total_sec)) + 1, 10):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 670), (tx, 680), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 205, 210), 1, cv2.LINE_AA)

    cv2.putText(
        canvas,
        "SAWAH TERASERING — AUDIO MASTER WAVEFORM, SPECTROGRAM & CUE ALIGNMENT QA (-14.8 LUFS)",
        (60, 28),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.60,
        (165, 242, 178),
        1,
        cv2.LINE_AA,
    )
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    seqs_f = align["seqsFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building SawahTerasering Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_s2 = seqs_f["seq2Start"] / fps
    t_s3 = seqs_f["seq3Start"] / fps
    t_s4 = seqs_f["seq4Start"] / fps
    t_s5 = seqs_f["seq5Start"] / fps
    t_s6 = seqs_f["seq6Start"] / fps
    t_s7 = seqs_f["seq7Start"] / fps

    # Exact frame-locked tactile foley & transition SFX ledger
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Seq 1 — Hook: Monsoon rain & washout
        (max(0.0, cues["s1_rain"] - 0.15), SFX_ELEVEN / "sfx_rain_monsoon.mp3", 0.44, 5.4, "Seq 1 Heavy tropical rain hits 30-deg slope"),
        (cues["s1_wash"] - 0.10, SFX_ELEVEN / "sfx_mud_runoff.mp3", 0.46, 4.8, "Seq 1->2 Muddy runoff sweeping rice seedlings & soil"),

        # Seq 2 — Erosion slide & rock stripping
        (cues["s2_slide"] - 0.12, SFX_ELEVEN / "sfx_mud_runoff.mp3", 0.42, 5.0, "Seq 2 Fast erosion rushing down 30-degree slope"),
        (cues["s2_bare"] - 0.10, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.22, 1.8, "Seq 2 Bare rock & hard clay reveal accent"),

        # Seq 3 — Carving 4 terraces + patting clay pematang bund
        (max(0.0, t_s3 - 0.08), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.75, "Seq 2->3 Storm-to-sun camera pull-back"),
        (cues["s3_carve"] - 0.10, SFX_ELEVEN / "sfx_hoe_chop_soil.mp3", 0.56, 4.5, "Seq 3 IK hoe chopping slope into 4 flat steps"),
        (cues["s3_label"] - 0.04, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.18, 1.2, "Seq 3 Terasering badge chime"),
        (cues["s3_bund"] - 0.45, SFX_ELEVEN / "sfx_mud_pat.mp3", 0.50, 3.2, "Seq 3 Compacting wet clay pematang wall"),

        # Seq 4 — Table analogy: pouring clay pitcher onto tilted board vs stepped board
        (max(0.0, t_s4 - 0.10), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.72, "Seq 3->4 Water-sweep match-cut to table"),
        (cues["s4_pour_flat"] - 0.10, SFX_ELEVEN / "sfx_pitcher_pour_wood.mp3", 0.52, 4.8, "Seq 4 Pouring water onto tilted wooden board"),
        (cues["s4_stepped"] - 0.12, SFX_ELEVEN / "sfx_pitcher_pour_wood.mp3", 0.46, 4.6, "Seq 4 Water braking cleanly into stepped wood pools"),

        # Seq 5 — Subsurface Cutaway: blue infiltration + rice root web
        (max(0.0, t_s5 - 0.10), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.80, "Seq 4->5 Pool match-cut & crane below Y=0"),
        (cues["s5_seep"] - 0.20, SFX_ELEVEN / "sfx_water_infiltrate.mp3", 0.48, 4.5, "Seq 5 Subsurface water seeping through mountain soil"),
        (cues["s5_roots"] - 0.15, SFX_ELEVEN / "sfx_water_infiltrate.mp3", 0.36, 4.2, "Seq 5 Fibrous rice roots locking soil grains"),

        # Seq 6 — Bamboo spillway pipe + cascading water from tier 4 -> tier 1
        (cues["s6_pipe"] - 0.25, SFX_ELEVEN / "sfx_bamboo_pipe_set.mp3", 0.54, 2.8, "Seq 6 IK hands setting split bamboo spillway pipe"),
        (cues["s6_cascade"] - 0.20, SFX_ELEVEN / "sfx_bamboo_waterfall.mp3", 0.52, 5.5, "Seq 6 Crystal water cascading down terrace pools"),
        (cues["s6_valley"] - 0.20, SFX_ELEVEN / "sfx_bamboo_waterfall.mp3", 0.36, 4.2, "Seq 6 Continued irrigation cascade down valley"),

        # Seq 7 — Golden Sunset Payoff + Seamless Dawn Loop Breeze
        (max(0.0, t_s7 - 0.08), SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.16, 1.3, "Seq 7 Golden sunset payoff shimmer"),
        (cues["s7_sunset"] - 0.10, SFX_ELEVEN / "sfx_sunset_paddy_breeze.mp3", 0.42, 5.0, "Seq 7 Golden rice stalks rustling in sunset breeze"),
        (cues["s7_dam"] + 0.40, SFX_ELEVEN / "sfx_sunset_paddy_breeze.mp3", 0.34, 4.8, "Seq 7 Seamless dawn glide back to Frame 0"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="sawah-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # 7-Sequence dynamic musical contour (curious hook -> storm tension -> energetic terrace -> playful analogy -> serene cutaway -> cascading payoff -> seamless loop bridge!)
        vol_expr = (
            f"0.16"
            f"+0.03*between(t,{t_s3:.2f},{t_s5:.2f})"
            f"-0.02*between(t,{t_s5:.2f},{t_s6:.2f})"
            f"+0.05*between(t,{t_s6:.2f},{total_sec:.2f})"
        )
        # Note: gentle 0.35s fade-in/fade-out at boundaries so seamless loop audio joins cleanly!
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11000,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.4,equalizer=f=1800:t=q:w=1.2:g=-3.6,equalizer=f=3200:t=q:w=1.3:g=-2.6,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=0.45,afade=t=out:st={max(0.0, total_sec - 0.85):.3f}:d=0.80"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(music_path),
                "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem),
            ],
            check=True,
        )

        # Build deterministic SFX stem
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
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 0.65):.3f}:d=0.60[sfxout]"
        )
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        # Combine VO (crisp foreground) + Sidechain-Ducked Music + Tactile SFX
        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.020:ratio=3.2:attack=18:release=240:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.10[vo_lv];"
            f"[mus_duck]volume=0.86[mus_lv];"
            f"[2:a]volume=0.90[sfx_lv];"
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
    print(f"\n=== AUDIO MASTER QA (public/sawah-terasering/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "KENAPA SAWAH DI GUNUNG DIBUAT BERTINGKAT (TERASERING) — AUDIO CREDITS\n"
        "=====================================================================\n"
        f"Narrator VO: {align['voice']} (language='id', tempo={align.get('tempo', 1.18)}x)\n"
        "Bespoke Foley SFX (9 clips): ElevenLabs eleven_text_to_sound_v3\n"
        f"Music Score: {music_source} — {music_license}\n"
        "CC0 Accents: Freesound #786514 (Swoosh v2), #222517 (Dramatic Hit), #349504 (Triangle Open 04)\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
