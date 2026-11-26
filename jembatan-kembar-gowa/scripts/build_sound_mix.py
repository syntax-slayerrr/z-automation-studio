"""
Broadcast Multi-Layer Engineering & Traffic-Physics Sound Design & Mastering for:
VIDEO 4 — "SATU DETIK BERHENTI, KILOMETER TERKUNCI: KEMACETAN DI JEMBATAN KEMBAR GOWA"
Anggota: Mina, Ice, Raina, Salsa, Haerul, Fadel, Shifa (Karakter: Dzaki)

Layers combined deterministically against `jembatan-kembar-gowa/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Crisp Analytical Male VO (Chris, language='id')
  2. 10 Bespoke Traffic, River & Engineering Foley SFX via `eleven_text_to_sound_v3`
  3. Curated CC0 Subtle Impacts & Confirmations (`.agents/skills/sound-effects/sfx/`)
  4. 3-Act Curious Engineering & Mobility Licensed Score (distinct Mixkit tracks!):
     - Act 1 (Intro + Sc 1-2): Crisp modern curious groove (`mixkit-47-tech-house-vibes.mp3` or `mixkit-123-driving-ambition.mp3` -> let's use warm analytical `mixkit-109-deep-urban.mp3`!)
     - Act 2 (Sc 3-4): Investigative tension & physics pulse (`mixkit-59-secret-sauce.mp3`)
     - Act 3 (Sc 5-7): Bright hopeful smooth-flow acoustic/modern resolve (`mixkit-10-life-is-a-dream.mp3`)
     with Anti-Masking Vocal Pocket EQ & Smooth Stereo Sidechain Ducking
  5. Two-Pass Linear Broadcast Mastering (-14.6 LUFS, True Peak <= -1.5 dBFS)
     -> `public/jembatan-kembar-gowa/audio_master.m4a` + QA Plot + `CREDITS.txt`
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
PUBLIC_DIR = ROOT / "public/jembatan-kembar-gowa"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"

SR = 44100


def ensure_track(local_paths: list[Path], fallback_urls: list[str], cache_name: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for lp in local_paths:
        if lp.exists() and lp.stat().st_size > 100_000:
            return lp
    cached = CACHE_DIR / cache_name
    if cached.exists() and cached.stat().st_size > 100_000:
        return cached
    for url in fallback_urls:
        try:
            print(f"Downloading licensed Mixkit score ({url}) -> {cache_name}...")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = resp.read()
            if len(data) > 100_000:
                cached.write_bytes(data)
                return cached
        except Exception as e:
            print(f"  WARN download failed ({url}): {e}")
    raise RuntimeError(f"Could not resolve music track {cache_name}")


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
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (80, 120, 235), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (96, 226, 250), 1)

    freqs, times, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_INFERNO)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[370:675, 60 : 60 + plot_w] = spec_res

    for s_key, info in sorted(scene_bounds.items(), key=lambda kv: int(kv[0])):
        ct = float(info["startSec"])
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 52), (cx, 675), (96, 230, 255), 2)
        cv2.putText(
            canvas,
            f"SC0{s_key}",
            (min(W - 90, cx + 5), 352),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.46,
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
        "VIDEO 4 (JEMBATAN KEMBAR GOWA — 3D CUTAWAY TRAFFIC PHYSICS) — MASTER QA (-14.6 LUFS, CHRIS VO + 10 FOLEY)",
        (60, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.52,
        (96, 230, 255),
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

    t_s3 = scenes_f["s3"] / fps
    t_s5 = scenes_f["s5"] / fps

    mus_act1 = ensure_track(
        [
            ROOT / "sawah-terasering/.audio-cache/mixkit-123-driving-ambition.mp3",
            ROOT / "rel-kereta/.audio-cache/mixkit-123-driving-ambition.mp3",
            ROOT / "tiang-listrik/.audio-cache/mixkit-123-driving-ambition.mp3",
        ],
        [
            "https://assets.mixkit.co/music/123/123.mp3",
            "https://assets.mixkit.co/music/109/109.mp3",
        ],
        "mixkit-123-driving-ambition.mp3",
    )
    mus_act2 = ensure_track(
        [
            ROOT / "sumur-bor/.audio-cache/mixkit-59-secret-sauce.mp3",
            ROOT / "kamojang-vs-nuklir/.audio-cache/mixkit-59-secret-sauce.mp3",
        ],
        [
            "https://assets.mixkit.co/music/59/59.mp3",
            "https://assets.mixkit.co/music/123/123.mp3",
        ],
        "mixkit-59-secret-sauce.mp3",
    )
    mus_act3 = ensure_track(
        [
            ROOT / "sawah-terasering/.audio-cache/mixkit-10-life-is-a-dream.mp3",
            ROOT / "membangun-rumah/.audio-cache/mixkit-10-life-is-a-dream.mp3",
        ],
        [
            "https://assets.mixkit.co/music/10/10.mp3",
            "https://assets.mixkit.co/music/587/587.mp3",
        ],
        "mixkit-10-life-is-a-dream.mp3",
    )

    print(
        f"Building Jembatan Kembar Gowa Audio Master ({total_sec:.2f}s)\n"
        f"  Act 1 (Intro+Sc1-2): {mus_act1.name}\n"
        f"  Act 2 (Sc 3-4):      {mus_act2.name}\n"
        f"  Act 3 (Sc 5-7):      {mus_act3.name}"
    )

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Intro + Scene 01
        (0.25, SFX_ELEVEN / "sfx_river_morning_traffic.mp3", 0.44, 4.0, "Intro river & morning Gowa bridge traffic"),
        (cues["s1_dzaki_ride"] - 0.15, SFX_ELEVEN / "sfx_river_morning_traffic.mp3", 0.32, 3.8, "Sc01 Dzaki riding smoothly across bridge"),
        (cues["s1_incident"] - 0.15, SFX_ELEVEN / "sfx_moto_skid_emergency.mp3", 0.48, 3.4, "Sc01 Emergency sharp brake on bridge"),
        (cues["s1_sar_boat"] - 0.15, SFX_ELEVEN / "sfx_sar_boat_river_siren.mp3", 0.46, 4.2, "Sc01 SAR boat & distant police siren on Jeneberang"),
        (cues["s1_jam_wide"] - 0.15, SFX_ELEVEN / "sfx_traffic_horns_buildup.mp3", 0.42, 3.8, "Sc01 Long traffic jam horns buildup"),

        # Scene 02 — Rubbernecking & Bottleneck
        (cues["s2_rubberneck"] - 0.10, SFX_ELEVEN / "sfx_traffic_horns_buildup.mp3", 0.36, 3.5, "Sc02 Commuters stopping & rubbernecking"),
        (cues["s2_bottleneck"] - 0.15, SFX_ELEVEN / "sfx_bottleneck_whoosh.mp3", 0.46, 2.5, "Sc02 Cutaway bottleneck diagram whoosh"),
        (cues["s2_speed_drop"] - 0.10, SFX_ELEVEN / "sfx_moto_skid_emergency.mp3", 0.34, 2.6, "Sc02 Speed drop 50 -> 0 km/h"),

        # Scene 03 — Shockwave Physics & Structural Volume
        (cues["s3_shockwave_intro"] - 0.15, SFX_ELEVEN / "sfx_bottleneck_whoosh.mp3", 0.40, 2.4, "Sc03 Transition to circular shockwave simulator"),
        (cues["s3_sugiyama"] + 0.35, SFX_ELEVEN / "sfx_shockwave_brake_clicks.mp3", 0.50, 4.0, "Sc03 Sugiyama phantom jam brake domino clicks"),
        (cues["s3_domino_wave"] - 0.10, SFX_ELEVEN / "sfx_shockwave_brake_clicks.mp3", 0.44, 3.8, "Sc03 Red wave propagating backward"),
        (cues["s3_structural"] - 0.15, SFX_ELEVEN / "sfx_traffic_horns_buildup.mp3", 0.38, 3.6, "Sc03 Structural traffic volume Poros Gowa"),

        # Scene 04 — 4 Impacts
        (cues["s4_ambulance"] - 0.20, SFX_ELEVEN / "sfx_ambulance_trapped_siren.mp3", 0.48, 4.2, "Sc04 Ambulance trapped on bridge"),
        (cues["s4_economy"] - 0.15, SFX_ELEVEN / "sfx_idling_engine_stopwatch.mp3", 0.46, 3.8, "Sc04 Idling fuel waste & ticking stopwatch"),
        (cues["s4_pollution"] - 0.15, SFX_ELEVEN / "sfx_idling_engine_stopwatch.mp3", 0.34, 3.2, "Sc04 Exhaust fumes idling"),
        (cues["s4_stress"] - 0.15, SFX_ELEVEN / "sfx_traffic_horns_buildup.mp3", 0.42, 3.6, "Sc04 Loud stressful horns"),

        # Scene 05 — Solutions 1 & 2
        (cues["s5_sol1_rail"] - 0.15, SFX_ELEVEN / "sfx_bridge_upgrade_whistle.mp3", 0.46, 2.6, "Sc05 Upgraded safety railing lock & CCTV"),
        (cues["s5_sol2_contraflow"] - 0.15, SFX_ELEVEN / "sfx_bridge_upgrade_whistle.mp3", 0.48, 3.8, "Sc05 Satlantas whistle & contraflow clearance"),
        (cues["s5_sol2_contraflow"] + 2.8, SFX_CC0 / "ding/kenney-interface-confirmation-001.ogg", 0.22, 0.5, "Sc05 Ambulance clear corridor chime"),

        # Scene 06 — Solutions 3 & 4
        (cues["s6_sol3_discipline"] - 0.15, SFX_ELEVEN / "sfx_river_morning_traffic.mp3", 0.34, 3.6, "Sc06 Smooth disciplined commuters passing"),
        (cues["s6_sol4_transit"] - 0.15, SFX_ELEVEN / "sfx_smooth_bus_morning_flow.mp3", 0.46, 4.2, "Sc06 Trans Mamminasata bus gliding smoothly"),
        (cues["s6_penalosa"] - 0.10, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.22, 1.8, "Sc06 Enrique Penalosa insight chime"),

        # Scene 07 — Smooth Loop Finale
        (cues["s7_dzaki_smooth"] - 0.15, SFX_ELEVEN / "sfx_smooth_bus_morning_flow.mp3", 0.40, 4.0, "Sc07 Dzaki & flowing traffic finale"),
        (cues["s7_endcard"] - 0.10, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 2.0, "Sc07 Closing resolve shimmer"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="gowa-traffic-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        act1_end = min(total_sec, t_s3 + 1.8)
        act2_start = max(0.0, t_s3 - 1.8)
        act2_dur = max(2.0, min(total_sec, t_s5 + 1.8) - act2_start)
        act3_start = max(0.0, t_s5 - 1.8)
        act3_dur = max(2.0, total_sec - act3_start)

        mus_fc = (
            f"[0:a]aloop=loop=-1:size=2e+09,atrim=0:{act1_end:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=1.2,afade=t=out:st={max(0.0, act1_end - 3.0):.3f}:d=3.0,volume=0.17[m1];"
            f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{act2_dur:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=2.8,afade=t=out:st={max(0.0, act2_dur - 2.8):.3f}:d=2.8,volume=0.18,"
            f"adelay={int(round(act2_start * 1000))}|{int(round(act2_start * 1000))}[m2];"
            f"[2:a]aloop=loop=-1:size=2e+09,atrim=0:{act3_dur:.3f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates={SR}:channel_layouts=stereo,"
            f"afade=t=in:st=0:d=2.6,afade=t=out:st={max(0.0, act3_dur - 2.4):.3f}:d=2.4,volume=0.19,"
            f"adelay={int(round(act3_start * 1000))}|{int(round(act3_start * 1000))}[m3];"
            f"[m1][m2][m3]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0,"
            f"atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=10800,"
            f"equalizer=f=300:t=q:w=1.2:g=-2.5,equalizer=f=1900:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8[mout]"
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
                f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.38):.3f}:d=0.38"
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
            f"[1:a][vo_sc]sidechaincompress=threshold=0.018:ratio=3.6:attack=20:release=260:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.16[vo_lv];"
            f"[mus_duck]volume=0.84[mus_lv];"
            f"[2:a]volume=0.82[sfx_lv];"
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

        # Two-Pass Linear Broadcast Mastering (-14.6 LUFS, True Peak <= -1.5 dBFS)
        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.6:TP=-1.5:LRA=6.5:print_format=json", "-f", "null", "-"],
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
                    f"loudnorm=I=-14.6:TP=-1.5:LRA=6.5:linear=true:"
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
    print(f"\n=== AUDIO MASTER QA (public/jembatan-kembar-gowa/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, align["sceneBoundsSec"], total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "VIDEO 4 — KEMACETAN DI JEMBATAN KEMBAR GOWA AUDIO CREDITS\n"
        "=========================================================\n"
        f"Anggota: {align.get('groupCredits', 'Mina, Ice, Raina, Salsa, Haerul, Fadel, Shifa')}\n"
        f"Narrator VO: {align['voice']} (language='id', tempo={align.get('tempo', 1.18)}x)\n"
        "Bespoke Traffic, River & Engineering SFX (10 clips): ElevenLabs eleven_text_to_sound_v3\n"
        "Music Score Act 1: Driving Ambition (Mixkit #123, Mixkit Stock Music Free License)\n"
        "Music Score Act 2: Secret Sauce (Mixkit #59, Mixkit Stock Music Free License)\n"
        "Music Score Act 3: Life is a Dream (Mixkit #10, Mixkit Stock Music Free License)\n"
        "CC0 UI Accents: Freesound & Kenney Interface CC0 Library\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
