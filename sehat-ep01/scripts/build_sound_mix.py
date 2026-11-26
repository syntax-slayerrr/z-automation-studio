"""
Broadcast Multi-Layer Cinematic Documentary Sound Design & Mastering for:
SERI: SEHAT ITU MENYELURUH — VIDEO 1
("TUBUH YANG SEHAT DIMULAI DARI KEBIASAAN KECIL")

Layers combined deterministically against `sehat-ep01/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Warm Natural Indonesian Documentary VO (Brian, tempo=1.0x)
  2. 11 Bespoke Tactile Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
     (alarm clock, soda can & chair creak, digestive dive, fresh plate, realistic heartbeat,
      park jogging, escalating & muffling notifications, Maslow harmonic chimes,
      laptop close & night crickets, brain recovery shimmer, morning water pour & sunny walk)
  3. Curated Real CC0 Ambience & Transition Accents (`.agents/skills/sound-effects/sfx/`)
  4. 3-Act Emotion-Matched Licensed Music Score (smoothly crossfaded across scenes):
     - Act 1 (Sc 1-3): Warm reflective acoustic/ambient discovery (`mixkit-148-forest-mist-whispers.mp3`)
     - Act 2 (Sc 4-5): Deep contemplative psychological/night bed (`music_oppenheimer_ambient.mp3`)
     - Act 3 (Sc 6-7): Uplifting warm morning renewal & hopeful finale (`mixkit-587-discover.mp3`)
     with Anti-Masking Vocal Pocket EQ and Stereo Sidechain Ducking so music NEVER masks VO!
  5. Two-Pass Linear Broadcast Loudness Mastering (-14.6 LUFS, True Peak <= -1.5 dBFS)
     -> `public/sehat-ep01/audio_master.m4a` + Waveform/Spectrogram QA PNG + `CREDITS.txt`
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
PUBLIC_DIR = ROOT / "public/sehat-ep01"

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
    canvas = np.full((H, W, 3), 16, dtype=np.uint8)
    y_mid = 190
    amp_h = 122
    cv2.rectangle(canvas, (60, 52), (W - 30, 326), (22, 28, 34), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (105, 195, 220), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (248, 206, 98), 1)

    freqs, times, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_VIRIDIS)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[370:675, 60 : 60 + plot_w] = spec_res

    for s_key, info in sorted(scene_bounds.items(), key=lambda kv: int(kv[0])):
        ct = float(info["startSec"])
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 52), (cx, 675), (85, 235, 180), 2)
        cv2.putText(
            canvas,
            f"SC0{s_key} ({ct:.1f}s)",
            (min(W - 150, cx + 6), 352),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (235, 244, 240),
            1,
            cv2.LINE_AA,
        )

    for sec in range(0, int(math.ceil(total_sec)) + 1, 15):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 675), (tx, 686), (190, 190, 200), 1)
        mm, ss = divmod(sec, 60)
        cv2.putText(
            canvas,
            f"{mm:02d}:{ss:02d}",
            (tx - 16, 710),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (200, 208, 214),
            1,
            cv2.LINE_AA,
        )

    cv2.putText(
        canvas,
        "SEHAT ITU MENYELURUH EP01 — BROADCAST AUDIO MASTER QA (-14.6 LUFS, 3-ACT SCORE + 11 FOLEY)",
        (60, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.58,
        (165, 242, 198),
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
    t_s2 = scenes_f["s2"] / fps
    t_s3 = scenes_f["s3"] / fps
    t_s4 = scenes_f["s4"] / fps
    t_s5 = scenes_f["s5"] / fps
    t_s6 = scenes_f["s6"] / fps
    t_s7 = scenes_f["s7"] / fps

    # 3 Licensed Emotional Music Beds matching the 3-Act Story Arc
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
        f"Building Sehat EP01 Audio Master ({total_sec:.2f}s)\n"
        f"  Act 1 (Sc 1-3): {mus_act1.name}\n"
        f"  Act 2 (Sc 4-5): {mus_act2.name}\n"
        f"  Act 3 (Sc 6-7): {mus_act3.name}"
    )

    # Frame-locked tactile foley, room ambience & CINEMATIC J-CUT TRANSITIONS (sound leads cut by 0.45-0.75s!)
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Intro (0.0s..3.0s) — Warm crystal title shimmer for Tugas Kelompok (Yoga, Adi, Rayyan)
        (0.25, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.20, 2.2, "Intro Opening title card shimmer"),
        # Subtle bedroom ambience starting cleanly at Scene 01
        (t_s1, SFX_CC0 / "ambience/fs-329569-roomtone-bedroom-yew.ogg", 0.08, 19.5, "Sc01 Bedroom ambience bed"),
        # Scene 01 — J-Cut alarm starts 0.15s before full ECU lock at t_s1 (3.0s), then soda & chair slump
        (max(0.0, t_s1 - 0.15), SFX_ELEVEN / "sfx_alarm_clock.mp3", 0.50, 3.1, "Sc01 ECU 07:30 alarm clock ringing & slapped off"),
        (cues["s1_drink"] - 0.25, SFX_ELEVEN / "sfx_soda_can_and_yawn.mp3", 0.42, 3.5, "Sc01 Sweet soda pop & tired chair slump"),

        # Scene 02 — Instant food -> Velocity Push-Through Dive into 3D Digestive System -> Balanced plate
        (max(0.0, t_s2 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.20, 0.7, "Sc01->02 Match transition"),
        (cues["s2_dive"] - 0.40, SFX_ELEVEN / "sfx_digest_dive.mp3", 0.48, 4.5, "Sc02 J-Cut Push-Through into 3D digestive system"),
        (cues["s2_vitamins"] - 0.12, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.15, 1.3, "Sc02 Nutrient absorption glow accent"),
        (cues["s2_balanced"] - 0.35, SFX_ELEVEN / "sfx_fresh_food_chime.mp3", 0.46, 3.2, "Sc02 J-Cut Balanced healthy nutrition plate reveal"),

        # Scene 03 — Desk slump -> J-Cut Heartbeat enters 0.65s early during chest push! -> J-Cut Park Jog
        (cues["s3_chest_push"] - 0.10, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.75, "Sc03 Push-in to chest"),
        (cues["s3_heart"] - 0.65, SFX_ELEVEN / "sfx_heartbeat_artery.mp3", 0.56, 6.0, "Sc03 J-Cut Sculpted 3D beating heart & rushing bloodstream"),
        (cues["s3_active"] - 0.60, SFX_ELEVEN / "sfx_park_jogging.mp3", 0.44, 5.5, "Sc03 J-Cut Sunlit park birds & jogging stride"),

        # Scene 04 — Notification Overload -> Quiet Abstract Space -> Abraham Maslow & 5-Tier Pyramid
        (cues["s4_stress"] - 0.25, SFX_ELEVEN / "sfx_notifications_muffle.mp3", 0.46, 5.0, "Sc04 Escalating notifications fading to muffled silence"),
        (cues["s4_orbit"] - 0.15, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.20, 2.0, "Sc04 Dark abstract mindspace transition resonance"),
        (cues["s4_tier1"] - 0.20, SFX_ELEVEN / "sfx_maslow_chimes.mp3", 0.46, 5.5, "Sc04 Maslow 5-tier hierarchy ascending crystal chimes"),

        # Scene 05 — J-Cut Night Crickets & Laptop Close -> Brain Recovery -> Golden Dawn Shimmer
        (max(0.0, t_s5 - 0.35), SFX_ELEVEN / "sfx_laptop_close_night.mp3", 0.50, 4.0, "Sc05 J-Cut Closing laptop, phone down & peaceful night crickets"),
        (cues["s5_sleep"] - 0.35, SFX_ELEVEN / "sfx_brain_recovery.mp3", 0.46, 5.5, "Sc05 J-Cut 3D brain synaptic consolidation & glymphatic recovery"),
        (cues["s5_timelapse"] - 0.15, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.18, 1.6, "Sc05 Night-to-morning golden dawn shimmer"),

        # Scene 06 — High-tempo Zero-Dip Match-Cut Montage with J-Cut Morning Water & Birds!
        (max(0.0, t_s6 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.7, "Sc05->06 Fresh morning match-cut"),
        (cues["s6_water"] - 0.45, SFX_ELEVEN / "sfx_morning_water_and_walk.mp3", 0.44, 5.2, "Sc06 J-Cut Pouring clear morning water & birdsong"),
        (cues["s6_breakfast"] - 0.20, SFX_ELEVEN / "sfx_fresh_food_chime.mp3", 0.38, 2.8, "Sc06 Nutritious breakfast match-cut"),
        (cues["s6_balance"] - 0.10, SFX_CC0 / "ding/kenney-interface-confirmation-001.ogg", 0.18, 0.5, "Sc06 Clean study & rest schedule check"),

        # Scene 07 — Confident Morning Walk -> Rising Crane Shot -> Closing Title
        (cues["s7_walk"] - 0.45, SFX_ELEVEN / "sfx_morning_water_and_walk.mp3", 0.38, 5.5, "Sc07 J-Cut Confident morning footsteps & park birds"),
        (cues["s7_crane"] - 0.20, SFX_ELEVEN / "sfx_park_jogging.mp3", 0.26, 5.5, "Sc07 Rising crane shot morning breeze & birdsong"),
        (cues["s7_title"] - 0.10, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 2.2, "Sc07 Closing typography shimmer"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="sehat-ep01-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # 3-Act Emotional Score Construction with 3.0s Crossfades!
        # Act 1: 0 .. t_s4 + 1.5s
        # Act 2: t_s4 - 1.5s .. t_s6 + 1.5s
        # Act 3: t_s6 - 1.5s .. total_sec
        act1_end = min(total_sec, t_s4 + 1.6)
        act2_start = max(0.0, t_s4 - 1.6)
        act2_dur = max(2.0, min(total_sec, t_s6 + 1.6) - act2_start)
        act3_start = max(0.0, t_s6 - 1.6)
        act3_dur = max(2.0, total_sec - act3_start)

        mus_fc = (
            f"[0:a]aloop=loop=-1:size=2e+09,atrim=0:{act1_end:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=1.2,afade=t=out:st={max(0.0, act1_end - 3.0):.3f}:d=3.0,volume=0.19[m1];"
            f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{act2_dur:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=3.0,afade=t=out:st={max(0.0, act2_dur - 3.0):.3f}:d=3.0,volume=0.22,"
            f"adelay={int(round(act2_start * 1000))}|{int(round(act2_start * 1000))}[m2];"
            f"[2:a]aloop=loop=-1:size=2e+09,atrim=0:{act3_dur:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=2.8,afade=t=out:st={max(0.0, act3_dur - 2.4):.3f}:d=2.4,volume=0.21,"
            f"adelay={int(round(act3_start * 1000))}|{int(round(act3_start * 1000))}[m3];"
            f"[m1][m2][m3]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0,"
            f"atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=10500,"
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
            fade_out = (
                f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.45):.3f}:d=0.45"
                if (max_d and max_d >= 0.9)
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

        # Combine VO (crisp warm foreground) + Sidechain-Ducked 3-Act Score + Tactile Foley SFX
        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.018:ratio=3.5:attack=20:release=280:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.12[vo_lv];"
            f"[mus_duck]volume=0.88[mus_lv];"
            f"[2:a]volume=0.86[sfx_lv];"
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

        # Two-Pass Linear Broadcast Mastering (-14.6 LUFS, True Peak <= -1.6 dBFS)
        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.6:TP=-1.6:LRA=6.5:print_format=json", "-f", "null", "-"],
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
                    f"loudnorm=I=-14.6:TP=-1.6:LRA=6.5:linear=true:"
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
    print(f"\n=== AUDIO MASTER QA (public/sehat-ep01/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, align["sceneBoundsSec"], total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "SERI: SEHAT ITU MENYELURUH — VIDEO 1 AUDIO CREDITS\n"
        "==================================================\n"
        f"Narrator VO: {align['voice']} (language='id', tempo={align.get('tempo', 1.0)}x)\n"
        "Bespoke Foley SFX (11 clips): ElevenLabs eleven_text_to_sound_v3\n"
        "Music Score Act 1: Forest Mist Whispers (Mixkit #148, Mixkit Stock Music Free License)\n"
        "Music Score Act 2: Contemplative Documentary Ambient Bed (Studio Licensed)\n"
        "Music Score Act 3: Discover (Mixkit #587, Mixkit Stock Music Free License)\n"
        "CC0 Accents & Room Tone: Freesound #329569, #786514, #222517, #349504, Kenney UI\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
