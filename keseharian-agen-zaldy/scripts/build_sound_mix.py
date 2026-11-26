"""
Broadcast Comedy & Motion-Graphics Sound Mix for KeseharianAgenZaldy
("Shift 24 Jam: Keseharian Hermes & OpenClaw Jadi AI Agent Zaldy")

Combines:
  1. Dual-Voice ElevenLabs `eleven_v4` Dialogue (Hermes = Brian, OpenClaw = Liam)
  2. 10 Bespoke Comedy SFX via ElevenLabs `eleven_text_to_sound_v3` + CC0 accents
  3. Dynamic Mixkit Comedy Track with TOTAL DEAD-SILENCE DROP on 23:58 Twist (`s5_ping`)!
  4. Two-Pass Broadcast Mastering (-14.50 LUFS, TP <= -1.5 dBFS)
     -> `public/keseharian-agen-zaldy/audio_master.m4a` + `audio_qa_sheet.png` + `CREDITS.txt`
"""
from __future__ import annotations

import json
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
SFX_DIR = AUDIO_DIR / "sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/keseharian-agen-zaldy"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"

SR = 44100


def ensure_music_track() -> tuple[Path, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    local_candidates = [
        (ROOT / "claude-animasi-promo/.audio-cache/mixkit-117-curious-acoustic.mp3", '"Sun and Fun" (Mixkit #117, Free Stock Music License)'),
        (ROOT / "sawah-terasering/.audio-cache/mixkit-117-curious-acoustic.mp3", '"Sun and Fun" (Mixkit #117, Free Stock Music License)'),
        (CACHE_DIR / "mixkit-117-curious-acoustic.mp3", '"Sun and Fun" (Mixkit #117, Free Stock Music License)'),
    ]
    for p, credit in local_candidates:
        if p.exists() and p.stat().st_size > 100_000:
            return p, credit

    target = CACHE_DIR / "mixkit-117-curious-acoustic.mp3"
    req = urllib.request.Request("https://assets.mixkit.co/music/117/117.mp3", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        target.write_bytes(resp.read())
    return target, '"Sun and Fun" (Mixkit #117, Free Stock Music License)'


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


def render_qa_sheet(wav_path: Path, cues: dict[str, float], total_sec: float, out_png: Path) -> None:
    import cv2

    sr, data = wavfile.read(str(wav_path))
    mono = data.astype(np.float32).mean(axis=1) / 32768.0 if data.ndim == 2 else data.astype(np.float32) / 32768.0
    W, H = 1600, 720
    canvas = np.full((H, W, 3), 16, dtype=np.uint8)
    plot_w = W - 90
    cv2.rectangle(canvas, (60, 50), (W - 30, 320), (20, 24, 34), -1)
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax, pmin = float(np.max(chunk)), float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(185 - pmax * 120)), (x, int(185 - pmin * 120)), (90, 210, 255), 1)
        cv2.line(canvas, (x, int(185 - rms * 185)), (x, int(185 + rms * 185)), (250, 175, 65), 1)

    freqs, _, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_norm = np.clip((10.0 * np.log10(np.maximum(Sxx, 1e-10)) + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_col = cv2.applyColorMap((S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8), cv2.COLORMAP_INFERNO)
    canvas[365:670, 60 : 60 + plot_w] = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)

    for idx, (cname, ct) in enumerate(sorted(cues.items(), key=lambda kv: kv[1])):
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 50), (cx, 670), (110, 235, 195), 1)
        cv2.putText(canvas, f"{cname}({ct:.1f}s)", (max(60, min(W - 140, cx - 18)), 340 if idx % 2 == 0 else 356), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (240, 244, 248), 1, cv2.LINE_AA)

    cv2.putText(canvas, "KESEHARIAN AGEN ZALDY — DUAL-VOICE & COMEDY SFX MASTER (-14.50 LUFS)", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 200, 95), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes: dict[str, float] = {k: float(v) for k, v in align["scenesSec"].items()}
    vo_dur = float(align["voDurationSec"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_credit = ensure_music_track()
    print(f"Building KeseharianAgenZaldy Audio Master ({total_sec:.2f}s)...")

    t_s1 = scenes.get("s1", 0.22)
    t_s2 = scenes.get("s2", 15.0)
    t_s3 = scenes.get("s3", 30.0)
    t_s4 = scenes.get("s4", 45.0)
    t_s5 = scenes.get("s5", 60.0)

    # Exact 23:58 Twist Dead-Silence Window (`s5_ping` -> `s5_kopi` + 0.9s)!
    t_twist_ping = cues["s5_ping"] - 0.12
    t_kopi_sting = cues["s5_kopi"] + 0.95

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # SCENE 1: 02:14 MALAM
        (0.08, SFX_DIR / "sfx_late_night_ping.mp3", 0.44, 1.5, "S1 Cold open 02:14 chat ping"),
        (cues["s1_oc_chill"] - 0.08, SFX_DIR / "sfx_coffee_sip.mp3", 0.48, 1.6, "S1 OpenClaw chill coffee sip"),
        (cues["s1_brief"] + 0.18, SFX_DIR / "sfx_late_night_ping.mp3", 0.36, 1.2, "S1 Zaldy chat bubble pop"),
        (t_s2 - 0.35, SFX_DIR / "sfx_clock_timelapse.mp3", 0.48, 2.0, "S1->S2 Clock timelapse spin"),

        # SCENE 2: 05:30 SUBUH
        (cues.get("s2_folders", cues["s2_proud"] + 1.5), SFX_DIR / "sfx_folder_pop.mp3", 0.44, 1.8, "S2 47 folders cascade pop"),
        (cues["s2_zero"] + 0.65, SFX_DIR / "sfx_cricket_deadpan.mp3", 0.52, 1.4, "S2 0% render awkward deadpan tap"),

        # SCENE 3: 11:00 SIANG
        (t_s3 - 0.08, SFX_DIR / "sfx_late_night_ping.mp3", 0.50, 1.4, "S3 11:00 daytime notif ping"),
        (cues["s3_list"] + 0.35, SFX_DIR / "sfx_revisi_stack.mp3", 0.54, 2.3, "S3 3D Task Tower stacking cards"),
        (cues["s3_gorengan"] + 1.10, SFX_DIR / "sfx_sizzle_overheat.mp3", 0.52, 1.9, "S3 CPU overheat gorengan sizzle"),

        # SCENE 4: 17:45 SENJA
        (t_s4 + 0.04, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.30, 0.7, "S4 Sunset crane sweep swoosh"),
        (cues["s4_deal"] + 0.10, SFX_DIR / "sfx_lockin_chime.mp3", 0.52, 1.9, "S4 Flow state lock-in chime"),
        (cues["s4_ready"] + 1.20, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.32, 1.3, "S4 Golden SIAP ACC ZALDY medal shimmer"),

        # SCENE 5: 23:58 MALAM & TWIST
        (t_twist_ping, SFX_DIR / "sfx_twist_ping_drop.mp3", 0.66, 2.1, "S5 23:58 TWIST PING & RECORD HALT!"),
        (t_kopi_sting, SFX_DIR / "sfx_comedy_button_sting.mp3", 0.62, 2.4, "S5 Outro sitcom comedy button sting"),
    ]

    valid_ev = [(idx, max(0.0, t_s), p.name, vol, p, max_d, desc) for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events) if p.exists()]
    print(f"Loaded {len(valid_ev)}/{len(sfx_events)} SFX cues.")

    with tempfile.TemporaryDirectory(prefix="keseharian-mix-") as td:
        td_p = Path(td)
        vo_pad = td_p / "vo_pad.wav"
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # Pad VO cleanly to exact total_sec so amix duration=first never truncates outro hold!
        pad_dur = max(0.05, total_sec - vo_dur)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(VO_WAV),
                "-af", f"apad=pad_dur={pad_dur:.3f},atrim=0:{total_sec:.3f}",
                "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16",
                str(vo_pad),
            ],
            check=True,
        )

        # Dynamic music contour:
        # - S1 (02:14): subtle nocturnal groove (0.14)
        # - S2 (05:30): bouncy subuh groove (0.17, dips slightly on s2_folder_roast deadpan!)
        # - S3 (11:00): rhythmic revision groove (0.15)
        # - S4 (17:45): warm triumphant flow-state swell (0.20)
        # - S5 (23:58): gentle lullaby calm (0.12) -> TOTAL DEAD SILENCE at `t_twist_ping` -> outro swell after `t_kopi_sting`!
        t_deadpan_s2 = cues["s2_folder_roast"] - 0.15
        vol_expr = (
            f"0.14"
            f"+0.03*between(t,{t_s2:.2f},{t_deadpan_s2:.2f})"
            f"-0.08*between(t,{t_deadpan_s2:.2f},{t_s3:.2f})"
            f"+0.01*between(t,{t_s3:.2f},{t_s4:.2f})"
            f"+0.06*between(t,{t_s4:.2f},{t_s5:.2f})"
            f"-0.02*between(t,{t_s5:.2f},{t_twist_ping:.2f})"
            f"-0.14*between(t,{t_twist_ping:.2f},{t_kopi_sting:.2f})"
            f"+0.05*between(t,{t_kopi_sting:.2f},{total_sec:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=50,lowpass=f=11500,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.5,equalizer=f=1900:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=0.35,afade=t=out:st={max(0.0, total_sec - 1.15):.3f}:d=1.10"
        )
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(music_path), "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem)], check=True)

        # Build SFX stem (normalize=0 so amix doesn't divide volumes by N!)
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        f_lines = []
        mix_labels = ["[0:a]"]
        for k, (_, t_s, _, vol, p, max_d, _) in enumerate(valid_ev, start=1):
            cmd.extend(["-i", str(p)])
            delay_ms = int(round(t_s * 1000))
            trim_part = f"atrim=0:{max_d:.3f}," if max_d else ""
            fade_out = f",afade=t=out:st={max(0.05, (max_d or 1.5) - 0.25):.3f}:d=0.25" if (max_d and max_d >= 0.6) else ""
            f_lines.append(f"[{k}:a]{trim_part}volume={vol:.2f}{fade_out},adelay={delay_ms}|{delay_ms},apad[sfx{k}]")
            mix_labels.append(f"[sfx{k}]")

        f_lines.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.88[sfxout]")
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        # Combine VO + Music + SFX with normalize=0 so speech sits clearly on top!
        cmd_pre = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(vo_pad),
            "-i", str(music_stem),
            "-i", str(sfx_stem),
            "-filter_complex",
            "[0:a]volume=1.00[vo];[1:a]volume=1.00[mus];[2:a]volume=1.00[sfx];"
            "[vo][mus][sfx]amix=inputs=3:duration=first:dropout_transition=0:normalize=0[out]",
            "-map", "[out]",
            "-ar", str(SR),
            "-ac", "2",
            str(pre_mix),
        ]
        subprocess.run(cmd_pre, check=True)

        # Two-Pass EBU R128 Broadcast Mastering (-14.50 LUFS, TP <= -1.5 dBFS)
        p1 = subprocess.run(
            ["ffmpeg", "-nostats", "-i", str(pre_mix), "-af", "loudnorm=I=-14.50:LRA=9.0:TP=-1.5:print_format=json", "-f", "null", "-"],
            capture_output=True, text=True, check=True,
        )
        s_idx = p1.stderr.rfind("{")
        e_idx = p1.stderr.rfind("}") + 1
        stats = json.loads(p1.stderr[s_idx:e_idx])

        OUT_DIR.mkdir(parents=True, exist_ok=True)
        PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

        pass2_af = (
            f"loudnorm=I=-14.50:LRA=9.0:TP=-1.5:"
            f"measured_I={stats['input_i']}:"
            f"measured_LRA={stats['input_lra']}:"
            f"measured_TP={stats['input_tp']}:"
            f"measured_thresh={stats['input_thresh']}:"
            f"offset={stats['target_offset']}:linear=true"
        )

        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(pre_mix), "-af", pass2_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(OUT_WAV)], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV), "-c:a", "aac", "-b:a", "256k", str(OUT_M4A)], check=True)

    lufs_st, tp_st = measure_ebur128(OUT_M4A, mono=False)
    lufs_mo, tp_mo = measure_ebur128(OUT_M4A, mono=True)
    render_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)

    CREDITS_TXT.write_text(
        f"Title: Shift 24 Jam: Keseharian Hermes & OpenClaw Jadi AI Agent Zaldy\n"
        f"Voices: ElevenLabs eleven_v4 — Brian (Hermes) & Liam (OpenClaw)\n"
        f"SFX: ElevenLabs eleven_text_to_sound_v3 + CC0 Freesound/Kenney Studio Library\n"
        f"Music: {music_credit}\n"
        f"Master Loudness: {lufs_st:.2f} LUFS Stereo ({tp_st:.2f} dBTP) | {lufs_mo:.2f} LUFS Mono\n",
        encoding="utf-8",
    )

    print(f"=== AUDIO MASTER COMPLETE ===")
    print(f"  Stereo : {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono   : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")
    print(f"  Output : {OUT_M4A}")


if __name__ == "__main__":
    main()
