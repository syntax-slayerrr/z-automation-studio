"""
Broadcast Comedy & Motion-Graphics Sound Mix for PerkembanganAiBrutal
("KOMEDI PERKEMBANGAN AI YANG BRUTAL")

Combines:
  1. Dual-Voice ElevenLabs `eleven_v4` Dialogue (OpenClaw = Liam, Hermes = Brian)
  2. 14 Bespoke Comedy SFX via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated CC0 Motion-Graphics Accents (whooshes, chimes)
  4. Dynamic Upbeat Licensed Mixkit Music with COMEDIC DEAD-SILENCE DROPS
     on Scene 03 Noir interrogation & Scene 07 record-scratch facepalm punchline!
  5. Two-Pass Broadcast Mastering (-14.5 LUFS, TP <= -1.5 dBFS)
     -> `public/perkembangan-ai-brutal/audio_master.m4a` + `audio_qa_sheet.png` + `CREDITS.txt`
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
SFX_ELEVEN = AUDIO_DIR / "sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/perkembangan-ai-brutal"

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
        (CACHE_DIR / "mixkit-117-curious-acoustic.mp3", '"Sun and Fun" (Mixkit #117, Free Stock Music License)'),
        (ROOT / "claude-animasi-promo/.audio-cache/mixkit-117-curious-acoustic.mp3", '"Sun and Fun" (Mixkit #117, Free Stock Music License)'),
        (ROOT / "sawah-terasering/.audio-cache/mixkit-117-curious-acoustic.mp3", '"Sun and Fun" (Mixkit #117, Free Stock Music License)'),
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

    cv2.putText(canvas, "PERKEMBANGAN AI BRUTAL — DUAL-VOICE & COMEDY SFX AUDIO MASTER (-14.5 LUFS)", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 200, 95), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    sf = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_credit = ensure_music_track()
    print(f"Building PerkembanganAiBrutal Comedy Audio Master ({total_sec:.2f}s)...")

    t_s2 = sf["s2Start"] / fps
    t_s3 = sf["s3Start"] / fps
    t_s4 = sf["s4Start"] / fps
    t_s5 = sf["s5Start"] / fps
    t_s6 = sf["s6Start"] / fps
    t_s7 = sf["s7Start"] / fps
    t_s8 = sf["s8Start"] / fps

    t_record_scratch_s7 = cues["s7_facepalm"] - 0.86

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Scene 01 — Emergency!
        (0.05, SFX_ELEVEN / "sfx_alarm_short.mp3", 0.42, 1.5, "S1 Short emergency alarm"),
        (0.32, SFX_ELEVEN / "sfx_fast_footsteps.mp3", 0.48, 1.7, "S1 OpenClaw running with fossilized certificate"),
        (cues["s1_calm"] - 0.24, SFX_ELEVEN / "sfx_record_scratch.mp3", 0.44, 0.9, "S1 Record scratch on calm Hermes"),
        (cues["s1_fire"] + 0.50, SFX_ELEVEN / "sfx_fire_swat.mp3", 0.52, 1.5, "S1 Tiny fire pops over head + swat"),

        # Scene 02 — Brutal AI Evolution Disaster
        (t_s2, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.30, 0.7, "S2 Screen reveal swoosh"),
        (cues["s2_screen"] + 2.1, SFX_ELEVEN / "sfx_notif_avalanche.mp3", 0.46, 1.9, "S2 Refresh update avalanche!"),
        (cues["s2_lowbat"] - 0.10, SFX_ELEVEN / "sfx_robot_glitch_lowbat.mp3", 0.46, 2.8, "S2 6-finger glitch -> hyper-speed film/app morph"),

        # Scene 03 — The Interrogation
        (t_s3 + 0.05, SFX_ELEVEN / "sfx_spotlight_switch.mp3", 0.56, 1.3, "S3 Noir spotlight clunk ON"),
        (cues["s3_note"] + 1.35, SFX_ELEVEN / "sfx_dramatic_sting.mp3", 0.44, 1.5, "S3 Sleep tracker note sting"),
        (cues["s3_psychic"] + 1.45, SFX_ELEVEN / "sfx_glass_shatter.mp3", 0.54, 1.7, "S3 3 generations crystal ball shatters!"),

        # Scene 04 — The Solution
        (t_s4 + 0.04, SFX_ELEVEN / "sfx_finger_snap_morph.mp3", 0.58, 2.2, "S4 Hermes finger snap + survival pipeline"),
        (cues["s4_card"] + 0.55, SFX_ELEVEN / "sfx_notif_avalanche.mp3", 0.36, 1.5, "S4 3D Phone breaking AI news pings"),

        # Scene 05 — Evolution Chart & 3 Pillars
        (cues["s5_learn"] + 0.90, SFX_ELEVEN / "sfx_portal_hop.mp3", 0.46, 2.1, "S5 Evolution chart hyper-zoom"),
        (cues["s5_discover"] + 0.95, SFX_ELEVEN / "sfx_portal_hop.mp3", 0.48, 2.2, "S5 3 anti-obsolete pillars spotlight hop"),
        (cues["s5_discover"] + 3.20, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.28, 1.1, "S5 3rd pillar shimmer chime"),

        # Scene 06 — The Realization
        (t_s6, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.28, 0.65, "S6 Back to two-shot"),
        (cues["s6_flashback"] + 1.2, SFX_ELEVEN / "sfx_robot_glitch_lowbat.mp3", 0.28, 1.1, "S6 Panic flashback glitch"),
        (cues["s6_smug"] - 0.05, SFX_ELEVEN / "sfx_dramatic_sting.mp3", 0.34, 1.2, "S6 Smug slow-zoom accent"),

        # Scene 07 — Here We Go Again (Desk leap -> Keyboard -> Record Scratch + Deprecated Buzzer -> Dead Silence Facepalm!)
        (cues["s7_run"] + 0.10, SFX_ELEVEN / "sfx_fast_footsteps.mp3", 0.46, 1.4, "S7 Dash to computer desk"),
        (cues["s7_proud"] + 0.15, SFX_ELEVEN / "sfx_keyboard_typing.mp3", 0.54, 2.4, "S7 Chair swivel + frantic keyboard typing"),
        (t_record_scratch_s7, SFX_ELEVEN / "sfx_record_scratch.mp3", 0.64, 1.0, "S7 RECORD SCRATCH on 'versi kemarin!'"),
        (t_record_scratch_s7 + 0.22, SFX_ELEVEN / "sfx_deprecated_buzzer.mp3", 0.56, 1.1, "S7 DEPRECATED 3 SECONDS AGO popup buzzer!"),
        (cues["s7_facepalm"] - 0.10, SFX_ELEVEN / "sfx_facepalm_slap.mp3", 0.60, 1.0, "S7 Iconic Hermes facepalm slap!"),

        # Scene 08 — Closing
        (t_s8 + 0.05, SFX_ELEVEN / "sfx_finger_snap_morph.mp3", 0.48, 1.9, "S8 Closing card morph"),
        (cues["s8_cta"] + 2.00, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.3, "S8 Shooting star closing shimmer"),
    ]

    valid_ev = [(idx, max(0.0, t_s), p.name, vol, p, max_d, desc) for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events) if p.exists()]

    with tempfile.TemporaryDirectory(prefix="ai-brutal-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        vol_expr = (
            f"0.16"
            f"-0.10*between(t,{t_s3:.2f},{t_s4:.2f})"
            f"+0.04*between(t,{t_s4:.2f},{t_s6:.2f})"
            f"-0.16*between(t,{t_record_scratch_s7:.2f},{t_s8:.2f})"
            f"+0.06*between(t,{t_s8:.2f},{total_sec:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11500,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.5,equalizer=f=1900:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=0.35,afade=t=out:st={max(0.0, total_sec - 1.2):.3f}:d=1.15"
        )
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(music_path), "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem)], check=True)

        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        f_lines = []
        mix_labels = ["[0:a]"]
        for k, (_, t_s, _, vol, p, max_d, _) in enumerate(valid_ev, start=1):
            cmd.extend(["-i", str(p)])
            delay_ms = int(round(t_s * 1000))
            trim_part = f"atrim=0:{max_d:.3f}," if max_d else ""
            fade_out = f",afade=t=out:st={max(0.05, (max_d or 1.5) - 0.25):.3f}:d=0.25" if (max_d and max_d >= 0.6) else ""
            f_lines.append(
                f"[{k}:a]aformat=sample_rates={SR}:channel_layouts=stereo,{trim_part}asetpts=PTS-STARTPTS,"
                f"highpass=f=50,afade=t=in:st=0:d=0.015{fade_out},volume={vol:.3f},adelay={delay_ms}|{delay_ms}[s{k}]"
            )
            mix_labels.append(f"[s{k}]")
        f_lines.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.90:attack=3:release=40[sfxout]")
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.018:ratio=3.5:attack=14:release=220:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.12[vo_lv];[mus_duck]volume=0.88[mus_lv];[2:a]volume=0.92[sfx_lv];"
            f"[vo_lv][mus_lv][sfx_lv]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.92:attack=3:release=40[out]"
        )
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(VO_WAV), "-i", str(music_stem), "-i", str(sfx_stem), "-filter_complex", mix_fc, "-map", "[out]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(pre_mix)], check=True)

        probe = subprocess.run(["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.5:TP=-1.6:LRA=6.5:print_format=json", "-f", "null", "-"], capture_output=True, text=True, check=True)
        j_start = probe.stderr.find("{", probe.stderr.rfind('"input_i"') - 80)
        stats = json.loads(probe.stderr[j_start : probe.stderr.find("}", j_start) + 1])

        OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(pre_mix),
            "-af", f"loudnorm=I=-14.5:TP=-1.6:LRA=6.5:linear=true:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}",
            "-ar", "48000", "-ac", "2", "-sample_fmt", "s16", str(OUT_WAV),
        ], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV), "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2", str(OUT_M4A)], check=True)

    lufs_st, tp_st = measure_ebur128(OUT_M4A, mono=False)
    lufs_mo, tp_mo = measure_ebur128(OUT_M4A, mono=True)
    print(f"\n=== AUDIO MASTER QA (public/perkembangan-ai-brutal/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "KOMEDI PERKEMBANGAN AI YANG BRUTAL — AUDIO CREDITS\n"
        "==================================================\n"
        "OpenClaw VO: ElevenLabs eleven_v4 (Liam · language='id')\n"
        "Hermes & Closing VO: ElevenLabs eleven_v4 (Brian · language='id')\n"
        "14 Bespoke Comedy SFX: ElevenLabs eleven_text_to_sound_v3\n"
        f"Music Score: {music_credit}\n"
        "CC0 Accents: Freesound #786514 (Swoosh v2), #349504 (Triangle Open 04)\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
