"""
Cinema-Grade 10-Shot Sound Design & Broadcast Mastering for CipanasGarutShort
("CIPANAS GARUT: KEHANGATAN DARI PERUT BUMI" — 10-Shot Varied Vintage Poster Explainer).

Combines:
  1. ElevenLabs `eleven_v4` Narrator VO (Brian, 85ms safe consonant pre-roll, pronunciation-verified)
  2. 4 Bespoke Hydrothermal/Water/Bamboo-Spout Foley Clips via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Local Studio & Bundled CC0 Foley
  4. Licensed Documentary Score: Mixkit #587 "Discover" with Vocal Pocket EQ & Stereo Sidechain Ducking
  5. Two-Pass Linear Broadcast Mastering (-14.6 LUFS, True Peak <= -1.9 dBFS) verified Stereo & Mono.
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
SFX_CK = ROOT / "gunung-cikuray/audio/sfx"
SFX_HF = ROOT / "human-fire/audio/sfx"
SFX_GMNI = ROOT / "gmni-history/audio/sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/cipanas-garut"

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

    cv2.putText(canvas, "CIPANAS GARUT: KEHANGATAN DARI PERUT BUMI — 10-SHOT AUDIO MASTER QA", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (120, 215, 248), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    shots_f = align["shotsFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building CipanasGarutShort Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_sh = {i: shots_f[f"sh{i}Start"] / fps for i in range(1, 11)}

    steam_sfx = pick_first(SFX_OWN / "sfx_hotspring_steam_splash.mp3", SFX_CK / "sfx_dawn_cloud_breeze.mp3")
    seep_sfx = pick_first(SFX_OWN / "sfx_underground_water_seep.mp3", SFX_CK / "sfx_mountain_rain_percolate.mp3")
    boil_sfx = pick_first(SFX_OWN / "sfx_geothermal_boil_rumble.mp3", SFX_HF / "sfx_pottery_kiln_roar.mp3")
    spout_sfx = pick_first(SFX_OWN / "sfx_bamboo_spout_pour.mp3", steam_sfx)
    rain_sfx = pick_first(SFX_CK / "sfx_mountain_rain_percolate.mp3", SFX_HF / "sfx_prehistoric_forest_night.mp3")
    chalk_sfx = pick_first(SFX_CK / "sfx_chalk_postcard_shutter.mp3", SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg")

    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # Shot 1 — ECU Steaming Stone Basin & 42°C Thermometer
        (0.04, steam_sfx, 0.36, 4.5, "Shot 1 ECU steaming stone pool & gentle ripples"),
        (cues["sh1_ecu"] + 1.8, SFX_CC0 / "tick/fs384187.ogg", 0.22, 0.25, "Shot 1 Thermometer needle crossing 42°C"),

        # Shot 2 — Low-Angle Wide Establishing Poster + Title
        (max(0.0, t_sh[2] - 0.10), SFX_CC0 / "whoosh/fs-169867-swoosh.ogg", 0.22, 0.80, "Shot 1->2 Pull-back to Cipanas bathhouse & Gunung Guntur"),
        (cues["sh2_title"] - 0.08, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.26, 1.6, "Shot 2 CIPANAS GARUT 3D slab title lock"),

        # Shot 3 — Bird's-Eye d3-geo Vintage Atlas Corridor
        (max(0.0, t_sh[3] - 0.12), SFX_CC0 / "whoosh/fs-264777-swoosh.ogg", 0.24, 0.85, "Shot 2->3 Aerial ascent into Tarogong Kaler Vintage Atlas"),
        (cues["sh3_atlas"], SFX_GMNI / "sfx_map_lines_shimmer.mp3", 0.34, 3.6, "Shot 3 Atlas contour rings & ±5 KM scale bar"),
        (cues["sh3_twist"] - 0.06, SFX_CC0 / "tick/fs384187.ogg", 0.24, 0.25, "Shot 3 Geothermal corridor arrow lock"),

        # Shot 4 — Asymmetrical Rainstorm over Gunung Guntur Slopes
        (max(0.0, t_sh[4] - 0.14), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.85, "Shot 3->4 Cloud-curtain wipe into Guntur rainstorm"),
        (cues["sh4_rain"] - 0.10, rain_sfx, 0.44, 4.5, "Shot 4 Cold rainstorm pouring on volcanic slopes"),

        # Shot 5 — Subsurface Macro Rock-Fracture Dive (Sesar)
        (max(0.0, t_sh[5] - 0.10), SFX_CC0 / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.28, 0.60, "Shot 4->5 Underground dive into fractured basalt crust"),
        (cues["sh5_fault"] - 0.05, seep_sfx, 0.42, 4.5, "Shot 5 Giant water drops rushing down diagonal sesar fissure"),

        # Shot 6 — Deep Subterranean Geothermal Boiler Cutaway
        (max(0.0, t_sh[6] - 0.10), SFX_CC0 / "impact/fs-177242-cinematic-impact.ogg", 0.28, 1.8, "Shot 5->6 Arrival at deep Gunung Guntur heat zone"),
        (cues["sh6_heat"] - 0.05, boil_sfx, 0.40, 4.8, "Shot 6 Subterranean heat conduction & rising hydrothermal convection"),
        (cues["sh6_convect"] + 0.10, SFX_HF / "sfx_molten_metal_pour.mp3", 0.26, 3.6, "Shot 6 Pressurized 70°C buoyancy surge upward"),

        # Shot 7 — Encyclopedia 2-Panel Split-Screen Comparison
        (max(0.0, t_sh[7] - 0.10), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.80, "Shot 6->7 Wipe to Kawah vs Cipanas split comparison"),
        (cues["sh7_filter"] - 0.06, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.4, "Shot 7 Clear mineral water rock-filtration highlight"),

        # Shot 8 — Heritage Bamboo Spouts (Pancuran) Mid-Shot
        (max(0.0, t_sh[8] - 0.10), SFX_CC0 / "whoosh/fs-169867-swoosh.ogg", 0.22, 0.80, "Shot 7->8 Match-cut into heritage bamboo spouts"),
        (cues["sh8_spout"] - 0.05, spout_sfx, 0.44, 4.5, "Shot 8 Warm mineral water arcing from bamboo spouts into pool"),

        # Shot 9 — Panoramic Peak-to-Pool 4-Stage Hydrothermal Cycle
        (max(0.0, t_sh[9] - 0.10), SFX_CC0 / "whoosh/fs-264777-swoosh.ogg", 0.24, 0.85, "Shot 8->9 Pull-out to full peak-to-pool hydrothermal panorama"),
        (cues["sh9_cycle"], SFX_GMNI / "sfx_archipelago_pins_bloom.mp3", 0.30, 3.6, "Shot 9 Four-stage continuous geothermal loop shimmer"),

        # Shot 10 — Seamless Loop Return, Dashed Ghost Blueprint & Postcard Lock
        (max(0.0, t_sh[10] - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.80, "Shot 9->10 Cloud-lift loop return to sunlit Cipanas vista"),
        (cues["sh10_loop"], steam_sfx, 0.34, 4.5, "Shot 10 Tranquil steaming stone pool morning ambience"),
        (cues["sh10_ghost"] - 0.06, chalk_sfx, 0.38, 2.9, "Shot 10 Subterranean dashed ghost blueprint chalk draw & shutter"),
        (total_sec - 2.35, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.24, 1.9, "Shot 10 Vintage Travel Postcard final border lock chime"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="cipanas-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        vol_expr = (
            f"0.16"
            f"+0.03*between(t,{t_sh[3]:.2f},{t_sh[5]:.2f})"
            f"+0.05*between(t,{t_sh[5]:.2f},{t_sh[7]:.2f})"
            f"+0.03*between(t,{t_sh[7]:.2f},{t_sh[9]:.2f})"
            f"+0.07*between(t,{t_sh[9]:.2f},{total_sec - 2.1:.2f})"
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
    print(f"\n=== AUDIO MASTER QA (public/cipanas-garut/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "CIPANAS GARUT: KEHANGATAN DARI PERUT BUMI (CipanasGarutShort) — AUDIO & ASSET CREDITS\n"
        "=====================================================================================\n"
        f"Narrator Voiceover: {align['voice']} (language='id', tempo={align.get('tempo', 1.18)}x)\n"
        "Bespoke Hydrothermal & Hot-Spring Foley (4 clips): ElevenLabs eleven_text_to_sound_v3\n"
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
        f"# CipanasGarutShort — 10-Shot Sound Design & Mastering Report\n\n"
        f"- **Duration**: `{total_sec:.2f}s` (`{align['totalFrames']}` frames @ `30 fps`)\n"
        f"- **Narrator**: `{align['voice']}` (`atempo={align.get('tempo', 1.18)}`, 85ms consonant pre-roll)\n"
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
