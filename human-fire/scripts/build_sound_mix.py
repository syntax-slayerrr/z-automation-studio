"""
Cinema-Grade Multi-Layer Sound Design & Broadcast Mastering for HumanFireShort ("Ketika Manusia Mengenal Api").

Layers combined deterministically against `human-fire/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Narrator VO (`Brian`, natural documentary pacing, 202 words, 28 storyboard cues)
  2. 9 Bespoke Fire/Era SFX via ElevenLabs `eleven_text_to_sound_v3`
  3. Curated Real CC0 Bundled Foley (`.agents/skills/sound-effects/sfx/`)
  4. Real Licensed Documentary Score: Mixkit #148 "Forest Mist Whispers" by Alejandro Magana (A. M.)
     (Mixkit Stock Music Free License) with 7-Act dynamic filter/level contour,
     Anti-Masking Vocal Pocket EQ, Stereo Sidechain Ducking, and warm serene tail on final title card.
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
PUBLIC_DIR = ROOT / "public/human-fire"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"
SOUND_MD = OUT_DIR / "SOUND.md"

MIXKIT_148_URL = "https://assets.mixkit.co/music/148/148.mp3"
MIXKIT_148_PATH = CACHE_DIR / "mixkit-148-forest-mist-whispers.mp3"

SR = 44100


def ensure_music_track() -> tuple[Path, str, str]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if MIXKIT_148_PATH.exists() and MIXKIT_148_PATH.stat().st_size > 100_000:
        return (
            MIXKIT_148_PATH,
            '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148, https://mixkit.co/free-stock-music/)',
            "Mixkit Stock Music Free License",
        )
    print(f"Downloading Mixkit #148 ('Forest Mist Whispers' by Alejandro Magana) -> {MIXKIT_148_PATH}...")
    req = urllib.request.Request(MIXKIT_148_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    if len(data) < 100_000:
        raise RuntimeError(f"Mixkit #148 download too small ({len(data)} bytes)")
    MIXKIT_148_PATH.write_bytes(data)
    return (
        MIXKIT_148_PATH,
        '"Forest Mist Whispers" by Alejandro Magana (A. M.) (Mixkit #148, https://mixkit.co/free-stock-music/)',
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
        if idx % 2 == 0:
            cv2.putText(canvas, f"{cname}({ct:.0f}s)", (max(60, min(W - 140, cx - 22)), 340), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (235, 232, 240), 1, cv2.LINE_AA)
        else:
            cv2.putText(canvas, f"{cname}({ct:.0f}s)", (max(60, min(W - 140, cx - 22)), 356), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (245, 215, 165), 1, cv2.LINE_AA)

    for sec in range(0, int(math.ceil(total_sec)) + 1, 10):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 670), (tx, 680), (190, 190, 200), 1)
        cv2.putText(canvas, f"{sec}s", (tx - 10, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 210), 1, cv2.LINE_AA)

    cv2.putText(canvas, "KETIKA MANUSIA MENGENAL API — AUDIO MASTER WAVEFORM, SPECTROGRAM & CUE ALIGNMENT QA", (60, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (248, 224, 150), 1, cv2.LINE_AA)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    music_path, music_source, music_license = ensure_music_track()
    print(f"Building HumanFireShort Cinema Audio Master ({total_sec:.2f}s) | Music: {music_path.name}")

    t_s2 = scenes_f["s2Start"] / fps
    t_s3 = scenes_f["s3Start"] / fps
    t_s4 = scenes_f["s4Start"] / fps
    t_s5 = scenes_f["s5Start"] / fps
    t_s6 = scenes_f["s6Start"] / fps
    t_s7 = scenes_f["s7Start"] / fps

    # Frame-locked 22-event documentary SFX bed + bespoke ElevenLabs Sound-V3 foley
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # S1 — Prehistoric Forest Day -> Cold Night Wind & Distant Predator
        (0.05, SFX_ELEVEN / "sfx_prehistoric_forest_night.mp3", 0.34, 6.0, "S1 Prehistoric twilight wind transitioning to eerie night & distant wolf howl"),
        (cues["s1_sunset"] - 0.15, SFX_ELEVEN / "sfx_prehistoric_forest_night.mp3", 0.30, 5.8, "S1 Nightfall forest rustle & cold cave shelter atmosphere"),

        # S2 — Storm Clouds, Dramatic Lightning Tree Strike & Cautious Discovery
        (max(0.0, t_s2 - 0.10), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.85, "S1->S2 Storm cloud rise transition"),
        (cues["s2_lightning"] - 0.28, SFX_ELEVEN / "sfx_lightning_tree_ignite.mp3", 0.56, 4.5, "S2 Thunderclap, sharp lightning strike & tree bursting into flames"),
        (cues["s2_observe"] + 0.10, SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.28, 6.5, "S2 Burning tree crackle & glowing firelight warmth as Aru approaches"),
        (cues["s2_approach"] - 0.05, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.16, 1.4, "S2 Warm discovery sparkle as Aru feels heat"),

        # S3 — Controlled Hearth & Roasting Meat Sizzle
        (max(0.0, t_s3 - 0.08), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.75, "S2->S3 Flame match-cut into hearth campfire"),
        (cues["s3_hunt"], SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.26, 5.5, "S3 Controlled hearth wood crackle bed"),
        (cues["s3_roast"] - 0.12, SFX_ELEVEN / "sfx_meat_sizzle_fire.mp3", 0.44, 5.0, "S3 Meat placed over glowing embers sizzling appetizingly"),
        (cues["s3_cooked"] - 0.10, SFX_ELEVEN / "sfx_meat_sizzle_fire.mp3", 0.32, 4.6, "S3 Continued warm roast sizzle & steam"),

        # S4 — Safe Night Campfire Glow & Wild Predator Retreat
        (max(0.0, t_s4 - 0.08), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.20, 0.80, "S3->S4 Pull-back to cave entrance hearth"),
        (cues["s4_campfire"], SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.34, 6.8, "S4 Strong welcoming campfire crackling outside cave"),
        (cues["s4_retreat"] - 0.35, SFX_ELEVEN / "sfx_predator_retreat.mp3", 0.44, 3.5, "S4 Wild beast startled by firelight retreating into dark woods"),
        (cues["s4_warm"] - 0.10, SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.28, 4.5, "S4 Cozy safe hearth warmth"),

        # S5 — Social Circle Storytelling & Stone Tool Knapping
        (cues["s5_gather"], SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.28, 6.5, "S5 Community gathering campfire warmth bed"),
        (cues["s5_teach"] - 0.30, SFX_ELEVEN / "sfx_stone_knapping_social.mp3", 0.46, 4.5, "S5 Elder teaching child flint stone tool knapping beside campfire"),
        (cues["s5_wide"] - 0.10, SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.25, 4.5, "S5 Night stars community pull-out fire crackle"),

        # S6 — Pottery Wheel, Kiln Furnace & Molten Bronze Pour
        (max(0.0, t_s6 - 0.12), SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.24, 0.85, "S5->S6 Rising ember morph into craftsmanship era"),
        (cues["s6_clay"] + 0.15, SFX_ELEVEN / "sfx_pottery_kiln_roar.mp3", 0.42, 4.5, "S6 Clay shaping transitioning into roaring terracotta kiln"),
        (cues["s6_metal"] - 0.20, SFX_ELEVEN / "sfx_molten_metal_pour.mp3", 0.50, 4.8, "S6 Glowing molten metal pour, steam hiss & resonant blacksmith anvil"),
        (cues["s6_industry"] - 0.10, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.24, 2.2, "S6 Industrial civilization rise low resonance"),

        # S7 — Fire Across Ages -> Modern City & Serene Final Ember Hold
        (cues["s7_closeup"] - 0.05, SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.32, 6.5, "S7 Intimate prehistoric ember close-up"),
        (cues["s7_forge"] - 0.10, SFX_ELEVEN / "sfx_molten_metal_pour.mp3", 0.28, 4.0, "S7 Traditional forge metallic warmth"),
        (cues["s7_city"] - 0.45, SFX_ELEVEN / "sfx_era_transition_city.mp3", 0.44, 5.0, "S7 Seamless swell into glowing modern city skyline"),
        (cues["s7_title"] + 0.25, SFX_ELEVEN / "sfx_campfire_crackling.mp3", 0.22, 4.5, "S7 Quiet serene ember crackle fading out on final title card"),
    ]

    valid_ev: list[tuple[int, float, str, float, Path, float | None, str]] = []
    for idx, (t_s, p, vol, max_d, desc) in enumerate(sfx_events):
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            continue
        valid_ev.append((idx, max(0.0, t_s), p.name, vol, p, max_d, desc))

    with tempfile.TemporaryDirectory(prefix="hf-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # 7-Act Musical Volume Contour (calm wonder S1 -> lightning tension S2 -> warm intimacy S3-S5 -> civilization swell S6-S7 -> serene end fade)
        vol_expr = (
            f"0.15"
            f"+0.04*between(t,{t_s2:.2f},{t_s3:.2f})"
            f"+0.03*between(t,{t_s3:.2f},{t_s5:.2f})"
            f"+0.05*between(t,{t_s5:.2f},{t_s6:.2f})"
            f"+0.07*between(t,{t_s6:.2f},{t_s7:.2f})"
            f"+0.09*between(t,{t_s7:.2f},{total_sec - 2.8:.2f})"
            f"*max(0.0,(1-max(0,(t-{total_sec - 2.8:.2f})/2.7)))"
        )
        # Ensure clean final fade to silence on music stem
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11000,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.5,equalizer=f=1800:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.8,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0:d=1.8,afade=t=out:st={max(0.0, total_sec - 3.0):.3f}:d=2.9"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(music_path), "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem)],
            check=True,
        )

        # Build deterministic SFX stem
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

        # Combine VO (center crisp) + Sidechain-Ducked Music + SFX
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

        # Two-pass linear broadcast loudness mastering (-14.5 LUFS, True Peak <= -2.0 dBFS)
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
    print(f"\n=== AUDIO MASTER QA (public/human-fire/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, cues, total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "KETIKA MANUSIA MENGENAL API (HumanFireShort) — AUDIO & SOUND DESIGN CREDITS\n"
        "===========================================================================\n"
        f"Narrator Voiceover: {align['voice']} (language='id', tempo={align.get('tempo', 1.14)}x)\n"
        "Bespoke Documentary Fire & Era SFX (9 clips): ElevenLabs eleven_text_to_sound_v3\n"
        f"Music Score: {music_source} — {music_license}\n"
        "CC0 Sound Effects (bundled, public domain CC0 1.0):\n"
        "  - Whoosh by qubodup (https://freesound.org/people/qubodup/sounds/60013/)\n"
        "  - Swoosh v2 (Freesound #786514, CC0)\n"
        "  - Dramatic Hit (#222517, CC0) & Triangle Open 04 (#349504, CC0)\n",
        encoding="utf-8",
    )

    cue_table = "\n".join(f"| `{t_s:5.2f}s` | `{fname}` | `{vol:.2f}` | {desc} |" for _, t_s, fname, vol, _, _, desc in valid_ev)
    SOUND_MD.write_text(
        f"# HumanFireShort — Sound Design & Mastering Report\n\n"
        f"- **Duration**: `{total_sec:.2f}s` (`{align['totalFrames']}` frames @ `30 fps`)\n"
        f"- **Narrator**: `{align['voice']}` (`atempo={align.get('tempo', 1.14)}` natural documentary cadence)\n"
        f"- **Music**: {music_source} ({music_license})\n"
        f"- **Master Loudness (AAC 192k)**: Stereo `{lufs_st:.2f} LUFS` / True Peak `{tp_st:.2f} dBFS` | Mono `{lufs_mo:.2f} LUFS` / True Peak `{tp_mo:.2f} dBFS`\n\n"
        f"## 5 Headphone Spot-Check Timestamps\n"
        f"1. **`{cues['s1_sunset']:.2f}s`** — S1 twilight wind shifting into dark night forest & distant wolf howl.\n"
        f"2. **`{cues['s2_lightning']:.2f}s`** — S2 thunderclap, sharp lightning strike, and tree bursting into flames.\n"
        f"3. **`{cues['s3_roast']:.2f}s`** — S3 appetizing meat sizzle over glowing wood embers.\n"
        f"4. **`{cues['s4_retreat']:.2f}s`** — S4 wild predator startled by firelight retreating into dark woods.\n"
        f"5. **`{cues['s6_metal']:.2f}s → {cues['s7_city']:.2f}s`** — S6 molten metal pour & anvil strike evolving into S7 modern city shimmer.\n\n"
        f"## Cue Placement Table ({len(valid_ev)} SFX events)\n\n"
        f"| Time | File | Gain | Visual Sync Purpose |\n"
        f"|---|---|---:|---|\n"
        f"{cue_table}\n",
        encoding="utf-8",
    )
    print(f"AUDIO MASTER COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
