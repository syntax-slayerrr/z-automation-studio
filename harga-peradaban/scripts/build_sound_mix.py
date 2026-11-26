"""
Cinema-Grade Multi-Layer Sound Design & Broadcast Mastering (-14.5 LUFS)
for "HargaPeradabanShort" ("HARGA SEBUAH PERADABAN").
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
AUDIO_DIR = PROJECT / "audio"
SFX_ELEVEN = AUDIO_DIR / "sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
PUBLIC_DIR = ROOT / "public/harga-peradaban"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
MUSIC_MP3 = AUDIO_DIR / "music_civilization_score.mp3"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
SR = 44100


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


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    shots = align["shotsFrame"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])

    sh_t = {k: v["start"] / fps for k, v in shots.items()}

    # Frame-locked foley & scene transitions across all 6 Acts (25 shots)
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # SCENE 01 — SAVANNA & CAMPFIRE
        (0.02, SFX_ELEVEN / "sfx_01_savanna_wind_footsteps.mp3", 0.50, 5.4, "S01_01 Savanna dry wind & footsteps"),
        (sh_t["s01_02"] + 0.1, SFX_ELEVEN / "sfx_01_savanna_wind_footsteps.mp3", 0.34, 5.2, "S01_02 Tracking deer trails"),
        (sh_t["s01_04"] - 0.15, SFX_ELEVEN / "sfx_02_campfire_night_crackle.mp3", 0.44, 5.4, "S01_04 Campfire night crackle"),

        # SCENE 02 — FERTILE VALLEY & DISCOVERY
        (sh_t["s02_01"] - 0.15, SFX_ELEVEN / "sfx_03_fertile_valley_stream_wheat.mp3", 0.46, 5.4, "S02_01 Lush valley stream & wild wheat"),
        (sh_t["s02_03"] - 0.10, SFX_ELEVEN / "sfx_04_seed_soil_sprout_timelapse.mp3", 0.44, 4.9, "S02_03 Sprouting seed wonder"),
        (sh_t["s02_04"] + 1.5, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.18, 0.85, "S02->S03 seed drop transition"),

        # SCENE 03 — PLANTING, BUILDING & FIRST HARVEST
        (sh_t["s03_01"] - 0.10, SFX_ELEVEN / "sfx_04_seed_soil_sprout_timelapse.mp3", 0.46, 4.9, "S03_01 Hand pressing seed & growth"),
        (sh_t["s03_03"] - 0.10, SFX_ELEVEN / "sfx_05_village_building_harvest.mp3", 0.42, 5.4, "S03_03 Building clay & timber home"),
        (sh_t["s03_04"] - 0.10, SFX_ELEVEN / "sfx_05_village_building_harvest.mp3", 0.46, 5.4, "S03_04 Golden sickle harvest"),

        # SCENE 04 — SCARCITY, FENCES & WATER CONFLICT
        (sh_t["s04_01"] - 0.15, SFX_ELEVEN / "sfx_06_granary_door_creak_hush.mp3", 0.50, 4.9, "S04_01 Dark granary creak & trickling grain"),
        (sh_t["s04_02"] - 0.10, SFX_ELEVEN / "sfx_07_fence_stakes_water_dispute.mp3", 0.44, 5.4, "S04_02 Wooden fence stakes hammered"),
        (sh_t["s04_03"] - 0.10, SFX_ELEVEN / "sfx_07_fence_stakes_water_dispute.mp3", 0.44, 5.4, "S04_03 Drying irrigation canal dispute"),
        (sh_t["s04_04"] - 0.20, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.24, 1.8, "S04_04 Dark dramatic hierarchy beat"),

        # SCENE 05 — MILLENNIA, CUNEIFORM & URUK
        (sh_t["s05_01"] - 0.12, SFX_CC0 / "transition/fs-683096-woosh.ogg", 0.22, 0.90, "S05_01 Generational bracelet match-cut"),
        (sh_t["s05_02"] - 0.10, SFX_ELEVEN / "sfx_09_ancient_uruk_city_bustle.mp3", 0.42, 5.4, "S05_02 Rising Mesopotamian settlements"),
        (sh_t["s05_03"] - 0.12, SFX_ELEVEN / "sfx_08_cuneiform_clay_stylus.mp3", 0.52, 4.9, "S05_03 Reed stylus pressing cuneiform clay"),
        (sh_t["s05_04"] - 0.15, SFX_ELEVEN / "sfx_09_ancient_uruk_city_bustle.mp3", 0.46, 5.4, "S05_04 Sweeping aerial Uruk climax"),

        # SCENE 06 — MODERN HARVEST, GLOBAL SYSTEM & FINAL WHEAT SILENCE
        (sh_t["s06_01"] - 0.15, SFX_ELEVEN / "sfx_10_modern_harvester_freight_city.mp3", 0.46, 5.9, "S06_01 Modern combine harvester roar"),
        (sh_t["s06_02"] - 0.10, SFX_ELEVEN / "sfx_10_modern_harvester_freight_city.mp3", 0.36, 5.9, "S06_02 Global trucks, cargo ship & city hum"),
        (sh_t["s06_04"] - 0.15, SFX_ELEVEN / "sfx_11_golden_wheat_sunset_wind.mp3", 0.52, 5.9, "S06_04 Wind sweeping endless golden wheat"),
        (max(0.0, total_sec - 5.2), SFX_ELEVEN / "sfx_11_golden_wheat_sunset_wind.mp3", 0.44, 5.0, "End card tranquil wheat breeze tail"),
    ]

    valid_ev = [(i, max(0.0, t_s), p.name, vol, p, max_d, desc) for i, (t_s, p, vol, max_d, desc) in enumerate(sfx_events) if p.exists()]

    t_s2 = sh_t["s02_01"]
    t_s3 = sh_t["s03_01"]
    t_s4 = sh_t["s04_01"]
    t_s5 = sh_t["s05_01"]
    t_s5_climax = sh_t["s05_04"]
    t_s6 = sh_t["s06_01"]
    t_s6_end = sh_t["s06_04"]

    with tempfile.TemporaryDirectory(prefix="hp-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # 6-Act Cinematic Dynamic Contour (peaks powerfully on Uruk S05_04, drops poignant & intimate on S06_04!)
        vol_expr = (
            f"0.22"
            f"+0.04*between(t,{t_s2:.2f},{t_s3:.2f})"
            f"+0.08*between(t,{t_s3:.2f},{t_s4:.2f})"
            f"+0.06*between(t,{t_s4:.2f},{t_s5:.2f})"
            f"+0.12*between(t,{t_s5:.2f},{t_s5_climax:.2f})"
            f"+0.20*between(t,{t_s5_climax:.2f},{t_s6:.2f})"
            f"+0.10*between(t,{t_s6:.2f},{t_s6_end:.2f})"
            f"+0.15*between(t,{t_s6_end:.2f},{total_sec:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=40,lowpass=f=12500,"
            f"equalizer=f=300:t=q:w=1.2:g=-2.8,equalizer=f=1800:t=q:w=1.2:g=-3.8,equalizer=f=3200:t=q:w=1.3:g=-2.6,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=0.8:d=2.2,afade=t=out:st={max(0.0, total_sec - 3.0):.3f}:d=2.8"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(MUSIC_MP3), "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem)],
            check=True,
        )

        # Deterministic SFX stem
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        f_lines = []
        mix_labels = ["[0:a]"]
        for k, (_, t_s, _, vol, p, max_d, _) in enumerate(valid_ev, start=1):
            cmd.extend(["-i", str(p)])
            delay_ms = int(round(t_s * 1000))
            trim_part = f"atrim=0:{max_d:.3f}," if max_d else ""
            fade_out = f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.45):.3f}:d=0.45" if (max_d and max_d >= 0.9) else ""
            f_lines.append(
                f"[{k}:a]aformat=sample_rates={SR}:channel_layouts=stereo,{trim_part}asetpts=PTS-STARTPTS,"
                f"highpass=f=45,afade=t=in:st=0:d=0.03{fade_out},volume={vol:.3f},"
                f"adelay={delay_ms}|{delay_ms}[s{k}]"
            )
            mix_labels.append(f"[s{k}]")
        f_lines.append(
            f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 1.8):.3f}:d=1.6[sfxout]"
        )
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        # Combine Dramatic Narrator VO + Sidechain-Ducked Score + Cinema Foley
        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.020:ratio=3.0:attack=20:release=300:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.08[vo_lv];"
            f"[mus_duck]volume=0.96[mus_lv];"
            f"[2:a]volume=0.90[sfx_lv];"
            f"[vo_lv][mus_lv][sfx_lv]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.92:attack=3:release=40[out]"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(VO_WAV), "-i", str(music_stem), "-i", str(sfx_stem), "-filter_complex", mix_fc, "-map", "[out]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(pre_mix)],
            check=True,
        )

        # Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -2.0 dBFS)
        probe = subprocess.run(
            ["ffmpeg", "-y", "-i", str(pre_mix), "-af", "loudnorm=I=-14.5:TP=-2.0:LRA=6.5:print_format=json", "-f", "null", "-"],
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
                    f"loudnorm=I=-14.5:TP=-2.0:LRA=6.5:linear=true:"
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
    print(f"\n=== AUDIO MASTER QA (public/harga-peradaban/audio_master.m4a) ===")
    print(f"  Duration: {total_sec:.2f}s ({align['totalFrames']} frames @ 30fps)")
    print(f"  Stereo  : {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono    : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")


if __name__ == "__main__":
    main()
