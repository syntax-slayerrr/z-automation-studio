"""
Cinema-Grade Multi-Layer Maritime Sound Design & Broadcast Mastering (-14.5 LUFS)
for "NusantaraSamudraShort" ("NUSANTARA — PERADABAN YANG MENGARUNGI SAMUDRA").
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
PUBLIC_DIR = ROOT / "public/nusantara-samudra"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
MUSIC_MP3 = AUDIO_DIR / "music_maritime_odyssey.mp3"
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

    # Frame-locked 16-shot maritime foley & transition bed
    sfx_events: list[tuple[float, Path, float, float | None, str]] = [
        # PROLOG (SH01..03)
        (0.02, SFX_ELEVEN / "sfx_01_storm_hull_lightning.mp3", 0.56, 6.2, "SH01 Storm wind, creaking hull, crashing wave & lightning reveal"),
        (sh_t["sh02"] - 0.15, SFX_ELEVEN / "sfx_02_sail_rope_night_sea.mp3", 0.44, 5.8, "SH02 Wet hemp sail rope & deck splash opening to starry sky"),
        (sh_t["sh03"] - 0.15, SFX_ELEVEN / "sfx_03_cloud_ascent_ocean_swell.mp3", 0.42, 5.2, "SH03 Ascending through clouds to reveal globe & Indian Ocean arc"),
        (sh_t["sh04"] - 0.35, SFX_CC0 / "impact/fs-222517-dramatic-hit.ogg", 0.24, 1.8, "Prolog->Babak 1 cut-to-black dramatic breath"),

        # BABAK 1 — MADAGASKAR (SH04..06)
        (sh_t["sh04"] + 0.05, SFX_ELEVEN / "sfx_04_madagascar_coastal_village.mp3", 0.42, 6.2, "SH04 Madagascar coastal village shore waves & palm breeze"),
        (sh_t["sh05"] - 0.08, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.20, 0.85, "SH05 Linguistic comparison card glide"),
        (sh_t["sh06"] - 0.10, SFX_ELEVEN / "sfx_06_outrigger_ship_sailing.mp3", 0.34, 6.0, "SH06 Austronesian outrigger vessels crossing Indian Ocean"),

        # BABAK 2 — BOROBUDUR & SRIWIJAYA (SH07..10)
        (sh_t["sh07"] - 0.20, SFX_ELEVEN / "sfx_05_borobudur_stone_sweep.mp3", 0.48, 5.4, "SH07 Light sweeping across volcanic stone Borobudur ship relief"),
        (sh_t["sh08"] - 0.15, SFX_ELEVEN / "sfx_06_outrigger_ship_sailing.mp3", 0.46, 6.2, "SH08 Relief coming alive — pandanus sails snapping full on outrigger ship"),
        (sh_t["sh09"] - 0.10, SFX_ELEVEN / "sfx_07_ancient_trade_harbors.mp3", 0.38, 6.2, "SH09 Sriwijaya trade hub linking India & China"),
        (sh_t["sh10"] - 0.12, SFX_CC0 / "transition/fs-683096-woosh.ogg", 0.22, 0.85, "SH10 Global parallel montage (Baghdad, Carolingian Europe, SEA)"),
        (sh_t["sh10"] + 0.15, SFX_ELEVEN / "sfx_07_ancient_trade_harbors.mp3", 0.34, 6.0, "SH10 Interconnected medieval global port & city bustle"),

        # BABAK 3 — MAKASSAR, TERIPANG & YOLNGU (SH11..14)
        (sh_t["sh11"] - 0.15, SFX_ELEVEN / "sfx_08_makassar_rigging_harbor.mp3", 0.46, 5.8, "SH11 18th-century Makassar Padewakang harbor ropes & baskets"),
        (sh_t["sh12"] - 0.10, SFX_ELEVEN / "sfx_06_outrigger_ship_sailing.mp3", 0.36, 5.8, "SH12 Padewakang fleet sailing monsoon route south to Australia"),
        (sh_t["sh13"] - 0.10, SFX_ELEVEN / "sfx_09_seabed_to_drying_fire.mp3", 0.44, 5.8, "SH13 Underwater trepang seabed surfacing to coastal boiling/drying fire"),
        (sh_t["sh14"] - 0.12, SFX_ELEVEN / "sfx_10_metal_axe_wood_carving.mp3", 0.46, 6.2, "SH14 Makassar & Yolngu iron axe exchange & dugout canoe woodcraft"),

        # EPILOG — NUSANTARA (SH15..16)
        (sh_t["sh15"] - 0.12, SFX_CC0 / "transition/fs-786514-swoosh-v2.ogg", 0.22, 0.90, "SH15 Triptych synthesis sweep"),
        (sh_t["sh16"] - 0.15, SFX_ELEVEN / "sfx_03_cloud_ascent_ocean_swell.mp3", 0.44, 5.4, "SH16 Ascending aerial archipelago sweep & title lock"),
    ]

    valid_ev = [(i, max(0.0, t_s), p.name, vol, p, max_d, desc) for i, (t_s, p, vol, max_d, desc) in enumerate(sfx_events) if p.exists()]

    t_b1 = sh_t["sh04"]
    t_b2 = sh_t["sh07"]
    t_b3 = sh_t["sh11"]
    t_ep = sh_t["sh15"]

    with tempfile.TemporaryDirectory(prefix="ns-mix-") as td:
        td_p = Path(td)
        music_stem = td_p / "music_stem.wav"
        sfx_stem = td_p / "sfx_stem.wav"
        pre_mix = td_p / "pre_mix.wav"

        # 5-Act Musical Emotional Swell Contour (starts hushed for storm prolog -> builds to sweeping Nusantara finale!)
        vol_expr = (
            f"0.22"
            f"+0.04*between(t,{t_b1:.2f},{t_b2:.2f})"
            f"+0.07*between(t,{t_b2:.2f},{t_b3:.2f})"
            f"+0.09*between(t,{t_b3:.2f},{t_ep:.2f})"
            f"+0.17*between(t,{t_ep:.2f},{total_sec:.2f})"
        )
        music_af = (
            f"aloop=loop=-1:size=2e+09,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=42,lowpass=f=12500,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.6,equalizer=f=1800:t=q:w=1.2:g=-3.6,equalizer=f=3100:t=q:w=1.3:g=-2.5,"
            f"volume='{vol_expr}':eval=frame,"
            f"afade=t=in:st=1.4:d=2.2,afade=t=out:st={max(0.0, total_sec - 2.4):.3f}:d=2.3"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(MUSIC_MP3), "-af", music_af, "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(music_stem)],
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
            fade_out = f",afade=t=out:st={max(0.05, (max_d or 2.0) - 0.4):.3f}:d=0.4" if (max_d and max_d >= 0.9) else ""
            f_lines.append(
                f"[{k}:a]aformat=sample_rates={SR}:channel_layouts=stereo,{trim_part}asetpts=PTS-STARTPTS,"
                f"highpass=f=45,afade=t=in:st=0:d=0.025{fade_out},volume={vol:.3f},"
                f"adelay={delay_ms}|{delay_ms}[s{k}]"
            )
            mix_labels.append(f"[s{k}]")
        f_lines.append(
            f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.88:attack=4:release=45,afade=t=out:st={max(0.0, total_sec - 1.6):.3f}:d=1.5[sfxout]"
        )
        cmd.extend(["-filter_complex", ";".join(f_lines), "-map", "[sfxout]", "-ar", str(SR), "-ac", "2", "-sample_fmt", "s16", str(sfx_stem)])
        subprocess.run(cmd, check=True)

        # Combine VO + Sidechain-Ducked Maritime Score + SFX
        mix_fc = (
            f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={total_sec:.3f},asplit=2[vo_mix][vo_sc];"
            f"[1:a][vo_sc]sidechaincompress=threshold=0.022:ratio=2.8:attack=22:release=280:makeup=1.0[mus_duck];"
            f"[vo_mix]volume=1.06[vo_lv];"
            f"[mus_duck]volume=0.98[mus_lv];"
            f"[2:a]volume=0.92[sfx_lv];"
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
    print(f"\n=== AUDIO MASTER QA (public/nusantara-samudra/audio_master.m4a) ===")
    print(f"  Duration: {total_sec:.2f}s ({align['totalFrames']} frames @ 30fps)")
    print(f"  Stereo  : {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono    : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")


if __name__ == "__main__":
    main()
