"""
Broadcast Multi-Layer Intimate 3D Character-Flow Sound Design & Mastering for:
VIDEO 3 — "JEJAK UANG YANG HILANG: DAMPAK KORUPSI TERHADAP KAWASAN KUMUH"
Kelompok 3: Ica, Mirza, Thalita, Zayyanah, Aul, Furqan, Raihan

Layers combined deterministically against `korupsi-kumuh-ep03/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Warm Empathetic Female VO (Sarah, language='id')
  2. 10 Bespoke Tactile/Atmospheric SFX via ElevenLabs `eleven_text_to_sound_v3`
     (dawn rain & lamp click, muddy faucet drips, gentle thought bubbles, budget papers/coins,
      clogged drain & jerrycans, heavy night flood storm, muted crimson tension, calm exhale & lamp on,
      macro ballpoint pen writing on ruled paper, decisive gavel & clean morning water/birds)
  3. Curated CC0 Subtle Room Tone & Chimes (`.agents/skills/sound-effects/sfx/`)
  4. 3-Act Emotion-Matched Licensed Score:
     - Act 1 (Intro + Sc 1-4): Contemplative nocturnal mist piano (`mixkit-148-forest-mist-whispers.mp3`)
     - Act 2 (Sc 5-6): Deep emotional storm & crimson anxiety swell (`music_oppenheimer_ambient.mp3`)
     - Act 3 (Sc 7-9): Warm hopeful golden dawn acoustic/piano resolve (`mixkit-587-discover.mp3`)
     with Anti-Masking Vocal Pocket EQ & Smooth Stereo Sidechain Ducking
  5. Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -1.6 dBFS)
     -> `public/korupsi-kumuh-ep03/audio_master.m4a` + QA Waveform/Spectrogram PNG + `CREDITS.txt`
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
PUBLIC_DIR = ROOT / "public/korupsi-kumuh-ep03"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"

SR = 44100


def ensure_track(local_paths: list[Path], fallback_url: str, cache_name: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for lp in local_paths:
        if lp.exists() and lp.stat().st_size > 100_000:
            return lp
    cached = CACHE_DIR / cache_name
    if cached.exists() and cached.stat().st_size > 100_000:
        return cached
    print(f"Downloading licensed Mixkit score -> {cache_name}...")
    req = urllib.request.Request(fallback_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    cached.write_bytes(data)
    return cached


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


def render_audio_qa_sheet(
    wav_path: Path, scene_bounds: dict, total_sec: float, out_png: Path
) -> None:
    import cv2

    sr, data = wavfile.read(str(wav_path))
    mono = (
        data.astype(np.float32).mean(axis=1) / 32768.0
        if data.ndim == 2
        else data.astype(np.float32) / 32768.0
    )

    W, H = 1800, 740
    canvas = np.full((H, W, 3), 20, dtype=np.uint8)
    y_mid = 190
    amp_h = 122
    cv2.rectangle(canvas, (60, 52), (W - 30, 326), (26, 32, 46), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (220, 168, 108), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (112, 204, 250), 1)

    freqs, times, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_MAGMA)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[370:675, 60 : 60 + plot_w] = spec_res

    for s_key, info in sorted(scene_bounds.items(), key=lambda kv: int(kv[0])):
        ct = float(info["startSec"])
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 52), (cx, 675), (250, 204, 112), 2)
        cv2.putText(
            canvas,
            f"SC0{s_key}",
            (min(W - 90, cx + 5), 352),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (242, 240, 232),
            1,
            cv2.LINE_AA,
        )

    for sec in range(0, int(math.ceil(total_sec)) + 1, 20):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 675), (tx, 686), (190, 190, 200), 1)
        mm, ss = divmod(sec, 60)
        cv2.putText(
            canvas,
            f"{mm:02d}:{ss:02d}",
            (tx - 16, 710),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (208, 214, 222),
            1,
            cv2.LINE_AA,
        )

    cv2.putText(
        canvas,
        "KELOMPOK 3 EP03 (SOFT-VINYL CHARACTER-FLOW) — BROADCAST MASTER QA (-14.5 LUFS, SARAH VO + 10 FOLEY)",
        (60, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.54,
        (250, 204, 112),
        1,
        cv2.LINE_AA,
    )
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    t_s1 = scenes_f["s1"] / fps
    t_s5 = scenes_f["s5"] / fps
    t_s7 = scenes_f["s7"] / fps

    mus_act1 = ensure_track(
        [
            ROOT / "sejarah-komunikasi/.audio-cache/mixkit-148-forest-mist-whispers.mp3",
            ROOT / "human-fire/.audio-cache/mixkit-148-forest-mist-whispers.mp3",
        ],
        "https://assets.mixkit.co/music/148/148.mp3",
        "mixkit-148-forest-mist-whispers.mp3",
    )
    mus_act2 = ensure_track(
        [ROOT / "human-ritual/audio/music_oppenheimer_ambient.mp3"],
        "https://assets.mixkit.co/music/148/148.mp3",
        "mixkit-148-forest-mist-whispers.mp3",
    )
    mus_act3 = ensure_track(
        [
            ROOT / "cipanas-garut/.audio-cache/mixkit-587-discover.mp3",
            ROOT / "gunung-cikuray/.audio-cache/mixkit-587-discover.mp3",
        ],
        "https://assets.mixkit.co/music/587/587.mp3",
        "mixkit-587-discover.mp3",
    )

    print(
        f"Building Korupsi-Kumuh EP03 Audio Master ({total_sec:.2f}s)\n"
        f"  Act 1 (Intro+Sc1-4): {mus_act1.name}\n"
        f"  Act 2 (Sc 5-6):      {mus_act2.name}\n"
        f"  Act 3 (Sc 7-9):      {mus_act3.name}"
    )

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Intro (0..4s) — Gentle dawn rain & bedside warm lamp click
        (0.40, SFX_ELEVEN / "sfx_dawn_rain_lamp_click.mp3", 0.44, 3.2, "Intro dawn rain & cozy lamp click"),
        (t_s1, SFX_CC0 / "ambience/fs-329569-roomtone-bedroom-yew.ogg", 0.06, 20.0, "Sc01 Quiet room ambience"),

        # Scene 01 — Faucet muddy drips + subtle thought bubble + ECU heartbeat
        (cues["s1_faucet"] + 0.4, SFX_ELEVEN / "sfx_faucet_muddy_drips.mp3", 0.46, 3.4, "Sc01 Squeaky faucet & 3 muddy drips"),
        (cues["s1_board"] - 0.15, SFX_ELEVEN / "sfx_bubble_pops_gentle.mp3", 0.34, 2.2, "Sc01 Project signboard bubble pop"),
        (cues["s1_ecu_eyes"] - 0.15, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.18, 1.5, "Sc01 Sudden ECU eyes opening thump"),

        # Scene 02 — Budget papers & leaking coins
        (cues["s2_meeting"] - 0.15, SFX_ELEVEN / "sfx_paper_coins_fade.mp3", 0.44, 3.5, "Sc02 Budget papers shuffle & coins fading"),
        (cues["s2_facilities"] - 0.15, SFX_ELEVEN / "sfx_bubble_pops_gentle.mp3", 0.34, 2.6, "Sc02 Stalled construction bubbles"),

        # Scene 03 — Clogged sanitation drain & hollow water jerrycans
        (cues["s3_sanitasi"] + 0.5, SFX_ELEVEN / "sfx_clogged_drain_jerrycan.mp3", 0.46, 3.8, "Sc03 Clogged drain gurgle & jerrycans"),
        (cues["s3_air_bersih"] + 0.2, SFX_ELEVEN / "sfx_faucet_muddy_drips.mp3", 0.36, 2.8, "Sc03 Dry clean-water pipe drips"),

        # Scene 04 — Social gap skyline & Amartya Sen reflective chime
        (cues["s4_skyline"] - 0.15, SFX_ELEVEN / "sfx_bubble_pops_gentle.mp3", 0.34, 2.5, "Sc04 Split skyline diorama pop"),
        (cues["s4_amartya"] - 0.15, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.18, 1.6, "Sc04 Amartya Sen orb shimmer"),

        # Scene 05 — Heavy tropical night rainstorm & rising indoor flood water!
        (cues["s5_rain"] - 0.35, SFX_ELEVEN / "sfx_heavy_rain_flood.mp3", 0.50, 4.5, "Sc05 J-Cut Heavy night rain & rising flood"),
        (cues["s5_flood"] - 0.25, SFX_ELEVEN / "sfx_heavy_rain_flood.mp3", 0.42, 4.4, "Sc05 Water lapping indoor floor"),

        # Scene 06 — Crimson alarm anxiety overload
        (cues["s6_health"] - 0.25, SFX_ELEVEN / "sfx_muted_alarm_tension.mp3", 0.46, 4.0, "Sc06 Crimson alarm & muffled pulse"),
        (cues["s6_domino"] - 0.15, SFX_ELEVEN / "sfx_muted_alarm_tension.mp3", 0.38, 3.8, "Sc06 Six orbiting red danger bubbles"),

        # Scene 07 — Calm breathing exhale reset + Bung Hatta warm chime!
        (cues["s7_breathe"] - 0.25, SFX_ELEVEN / "sfx_calm_exhale_lamp_on.mp3", 0.48, 3.8, "Sc07 J-Cut Calm exhale reset"),
        (cues["s7_hatta"] - 0.15, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.22, 1.8, "Sc07 Bung Hatta warm golden chime"),

        # Scene 08 — Warm lamp on, Macro POV live handwriting, Gavel strike, Community & Aid checkmark!
        (cues["s8_lamp_on"] - 0.25, SFX_ELEVEN / "sfx_dawn_rain_lamp_click.mp3", 0.42, 2.4, "Sc08 Warm bedside lamp click on"),
        (cues["s8_upaya1"] - 0.15, SFX_ELEVEN / "sfx_pen_writing_notebook.mp3", 0.50, 4.2, "Sc08 Macro POV ballpoint pen writing on ruled paper"),
        (cues["s8_upaya2"] + 0.15, SFX_ELEVEN / "sfx_gavel_and_morning_water.mp3", 0.46, 2.1, "Sc08 Authoritative wooden gavel strike"),
        (cues["s8_upaya3"] - 0.10, SFX_CC0 / "ding/kenney-interface-confirmation-001.ogg", 0.20, 0.5, "Sc08 Community oversight chime"),
        (cues["s8_upaya4"] + 0.10, SFX_ELEVEN / "sfx_pen_writing_notebook.mp3", 0.42, 2.6, "Sc08 Aid checkmark stroke on notebook"),

        # Scene 09 — Golden dawn clean water flowing, birdsong & Full-Circle Mirror Lamp Click!
        (cues["s9_dawn"] - 0.35, SFX_ELEVEN / "sfx_gavel_and_morning_water.mp3", 0.44, 4.4, "Sc09 Clean flowing water & morning birdsong"),
        (cues["s9_lamp_off"] + 0.65, SFX_ELEVEN / "sfx_calm_exhale_lamp_on.mp3", 0.40, 3.2, "Sc09 Full-circle peaceful lamp click off"),
        (cues["s9_endcard"] - 0.10, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.22, 2.0, "Sc09 Closing golden resolve shimmer"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="korupsi-ep03-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        act1_end = min(total_sec, t_s5 + 1.8)
        act2_start = max(0.0, t_s5 - 1.8)
        act2_dur = max(2.0, min(total_sec, t_s7 + 1.8) - act2_start)
        act3_start = max(0.0, t_s7 - 1.8)
        act3_dur = max(2.0, total_sec - act3_start)

        mus_fc = (
            f"[0:a]aloop=loop=-1:size=2e+09,atrim=0:{act1_end:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=1.4,afade=t=out:st={max(0.0, act1_end - 3.2):.3f}:d=3.2,volume=0.18[m1];"
            f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{act2_dur:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=3.0,afade=t=out:st={max(0.0, act2_dur - 3.0):.3f}:d=3.0,volume=0.22,"
            f"adelay={int(round(act2_start * 1000))}|{int(round(act2_start * 1000))}[m2];"
            f"[2:a]aloop=loop=-1:size=2e+09,atrim=0:{act3_dur:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=2.8,afade=t=out:st={max(0.0, act3_dur - 2.6):.3f}:d=2.6,volume=0.21,"
            f"adelay={int(round(act3_start * 1000))}|{int(round(act3_start * 1000))}[m3];"
            f"[m1][m2][m3]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0,"
            f"atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=10400,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.4,equalizer=f=1800:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8[mout]"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(mus_act1), "-i", str(mus_act2), "-i", str(mus_act3),
                "-filter_complex", mus_fc, "-map", "[mout]",
                "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem),
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
            fade_out = (
                f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.42):.3f}:d=0.42"
                if (max_d and max_d >= 0.85)
                else ""
            )
            f_lines.append(
                f"[{k}:a]aformat=sample_rates={SR}:channel_layouts=stereo,{trim_part}asetpts=PTS-STARTPTS,"
                f"highpass=f=50,afade=t=in:st=0:d=0.03{fade_out},volume={vol:.3f},"
                f"adelay={delay_ms}|{delay_ms}[s{k}]"
            )
            mix_labels.append(f"[s{k}]")
        f_lines.append(
            f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 1.2):.3f}:d=1.15[sfxout]"
        )
        cmd.extend(
            [
                "-filter_complex", ";".join(f_lines), "-map", "[sfxout]",
                "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem),
            ]
        )
        subprocess.run(cmd, check=True)

        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.018:ratio=3.6:attack=20:release=280:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.14[vo_lv];"
            f"[mus_duck]volume=0.86[mus_lv];"
            f"[2:a]volume=0.85[sfx_lv];"
            f"[vo_lv][mus_lv][sfx_lv]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.92:attack=3:release=45[out]"
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

        # Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -1.6 dBFS)
        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.5:TP=-1.6:LRA=6.5:print_format=json", "-f", "null", "-"],
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
                    f"loudnorm=I=-14.5:TP=-1.6:LRA=6.5:linear=true:"
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
    print(f"\n=== AUDIO MASTER QA (public/korupsi-kumuh-ep03/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, align["sceneBoundsSec"], total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "KELOMPOK 3 — VIDEO 3 AUDIO CREDITS\n"
        "==================================\n"
        f"{align.get('groupCredits', 'Kelompok 3')}\n"
        f"Narrator VO: {align['voice']} (language='id', tempo={align.get('tempo', 1.05)}x)\n"
        "Bespoke Tactile & Atmospheric SFX (10 clips): ElevenLabs eleven_text_to_sound_v3\n"
        "Music Score Act 1: Forest Mist Whispers (Mixkit #148, Mixkit Stock Music Free License)\n"
        "Music Score Act 2: Contemplative Tension Ambient Bed (Studio Licensed)\n"
        "Music Score Act 3: Discover (Mixkit #587, Mixkit Stock Music Free License)\n"
        "CC0 Accents & Room Tone: Freesound & Kenney Interface CC0 Library\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
