"""Measured Audio Mixer & Sound Design Pass for Episode 03 ("Ketika Gagasan Turun ke Kelas").

Rules enforced:
- Real recorded CC0 foley (Freesound/Kenney/site-sfx) + dedicated ElevenLabs physical historical foley
  (folder close on oak, hinged wooden door open, chalk writing on blackboard) + Mixkit documentary pulse bed.
- Multi-section tonal music contour inspired by reference video (muffled intimate archive -> school inquiry
  -> structured cadence -> Priangan brass pulse -> quiet window tail fade).
- Dialogue-first stereo sidechain ducking + frame-exact SFX synced to `src/episodes/ep03/alignment.json`.
- Target broadcast loudness: -14.5 LUFS integrated (±0.5 LU), True Peak <= -1.5 dBFS.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
ROOT = Path(__file__).resolve().parents[2]
SFX_ROOT = ROOT / ".agents/skills/sound-effects/sfx"
SITE_SFX = PROJECT / "public/audio/sfx/site-sfx"
EP03_AUD = PROJECT / "public/audio/ep03"
MUSIC_BED = PROJECT / "public/audio/music/mixkit_140_cyberpunk_city.mp3"
VO_WAV = EP03_AUD / "ep03_vo.wav"
ALIGN_JSON = PROJECT / "src/episodes/ep03/alignment.json"
OUT_WAV = EP03_AUD / "ep03_master_audio.wav"
CREDITS_TXT = PROJECT / "out/ep03/CREDITS_AUDIO.txt"

END_PAD_SEC = 2.40
SR = 44100


def load_cues() -> tuple[float, dict[str, float]]:
    d = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues = {w["cue"]: float(w["start"]) for w in d["words"] if w.get("cue")}
    total = round(float(d["duration"]) + END_PAD_SEC, 3)
    return total, cues


def main() -> None:
    total_sec, cues = load_cues()
    print(f"Building EP03 sound master ({total_sec:.2f}s) from {len(cues)} aligned cues...")

    # Cue -> (path, linear_vol, offset_sec, max_dur_sec)
    sfx_events: list[tuple[str, Path, float, float, float | None]] = [
        # S0 — Muktamar desk folder close -> oak door opening into corridor
        ("s0_desk", SITE_SFX / "page_0.ogg", 0.30, -0.05, 0.7),
        ("s0_close", EP03_AUD / "foley_folder_close.mp3", 0.44, -0.02, 1.3),
        ("s0_door", EP03_AUD / "foley_door_open.mp3", 0.36, 0.02, 1.9),
        ("s0_hall", SFX_ROOT / "whoosh/fs-683101-quick-woosh.ogg", 0.24, 0.45, 0.65),

        # S1 — Afternoon classroom silence, Andi notebook question B-roll, & PP -> PW -> PD -> PC -> PR hierarchy diagram
        ("s1_class", SFX_ROOT / "ding/fs-571513-soft-notifications-bell-ding-d.ogg", 0.20, -0.25, 0.9),
        ("s1_class", SITE_SFX / "page_1.ogg", 0.22, 2.20, 0.55),
        ("s1_flow", EP03_AUD / "foley_chalk_write.mp3", 0.38, -0.05, 2.0),
        ("s1_ranting", SFX_ROOT / "pop/kenney-interface-drop-001.ogg", 0.32, 0.0, 0.45),
        ("s1_basis", SFX_ROOT / "click/kenney-interface-select-002.ogg", 0.28, 0.15, 0.35),

        # S2 — Optical dissolve to SPI Handbook, FORTASI + orientation easel B-roll, Taruna Melati, Anisa RUMAH PELAJAR
        ("s2_spi", SFX_ROOT / "transition/fs-683096-woosh.ogg", 0.30, -0.22, 0.8),
        ("s2_ipm", SITE_SFX / "page_1.ogg", 0.36, -0.05, 0.7),
        ("s2_fortasi", SFX_ROOT / "ding/kenney-interface-confirmation-002.ogg", 0.26, 0.0, 0.85),
        ("s2_fortasi", SFX_ROOT / "click/kenney-interface-select-002.ogg", 0.20, 1.85, 0.35),
        ("s2_tm", SITE_SFX / "cinematic_0.ogg", 0.28, -0.05, 1.2),
        ("s2_sched", SITE_SFX / "page_0.ogg", 0.30, -0.04, 0.65),

        # S3 — Match zoom to 3D Archipelago Map -> Garut 1923 (3-beat pulse) & 1958
        ("s3_map", SFX_ROOT / "transition/fs-702773-swipe-wav.ogg", 0.30, -0.25, 0.75),
        ("s3_1923", SFX_ROOT / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.38, -0.02, 0.8),
        ("s3_1923", SFX_ROOT / "pop/fs-824189-pop-in-sfx.ogg", 0.30, 0.65, 0.5),
        ("s3_1923", SFX_ROOT / "pop/kenney-interface-drop-002.ogg", 0.30, 1.25, 0.5),
        ("s3_1958", SFX_ROOT / "ding/fs-349504-triangle-open-04.ogg", 0.24, 0.0, 1.1),

        # S4 — PC IPM Panawuan dusk branch, animated rail node chime, & L03 quiet contemplation closing
        ("s4_pause", SFX_ROOT / "impact/fs-222517-dramatic-hit.ogg", 0.28, -0.35, 1.5),
        ("s4_panawuan", SFX_ROOT / "whoosh/fs-264777-swoosh.ogg", 0.26, -0.08, 0.6),
        ("s4_panawuan", SFX_ROOT / "ding/kenney-interface-confirmation-002.ogg", 0.18, 2.40, 0.65),
        ("s4_pcipm", SITE_SFX / "cinematic_2.ogg", 0.30, 0.0, 1.2),
        ("s4_bridge", SFX_ROOT / "riser/fs-685256-riser-sound-effect-short-wav.ogg", 0.16, -0.40, 1.3),
        ("s4_endcard", SFX_ROOT / "impact/fs-177242-cinematic-impact.ogg", 0.44, 0.85, 2.3),
    ]

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        vo_pad = tmp / "vo_pad.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(VO_WAV),
                "-af", f"apad=whole_dur={total_sec:.3f}",
                "-ar", str(SR), "-ac", "1",
                str(vo_pad),
            ],
            check=True,
        )

        # Dynamic music contour + warm room tone sidechained smoothly under dialogue
        dip_panawuan_s = max(1.0, cues.get("s4_pause", 69.5) - 0.65)
        dip_panawuan_e = max(dip_panawuan_s + 0.2, cues.get("s4_pause", 69.5) + 0.15)
        dip_l03_s = max(1.0, cues.get("s4_bridge", 86.5) - 0.35)
        dip_l03_e = total_sec - 2.0

        bed_wav = tmp / "bed_ducked.wav"
        amb_path = SFX_ROOT / "ambience/fs-329533-room-tone-in-an-apartment-livi.ogg"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-stream_loop", "-1", "-i", str(MUSIC_BED),
                "-stream_loop", "-1", "-i", str(amb_path),
                "-i", str(vo_pad),
                "-filter_complex",
                (
                    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,"
                    f"atrim=duration={total_sec:.3f},lowpass=f=2650,"
                    f"volume=0.16,"
                    f"volume=enable='between(t,{dip_panawuan_s:.3f},{dip_panawuan_e:.3f})':volume=0.35,"
                    f"volume=enable='between(t,{dip_l03_s:.3f},{dip_l03_e:.3f})':volume=0.65,"
                    f"afade=t=in:st=0:d=0.65,afade=t=out:st={total_sec - 2.1:.3f}:d=2.1[mus];"
                    f"[1:a]aresample={SR},aformat=channel_layouts=stereo,"
                    f"atrim=duration={total_sec:.3f},volume=0.065[amb];"
                    f"[mus][amb]amix=inputs=2:duration=shortest:normalize=0[bg];"
                    f"[2:a]aresample={SR},aformat=channel_layouts=stereo[vo_sc];"
                    f"[bg][vo_sc]sidechaincompress=threshold=0.018:ratio=5.2:attack=12:release=260[bg_fin]"
                ),
                "-map", "[bg_fin]",
                str(bed_wav),
            ],
            check=True,
        )

        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        valid_ev = []
        for cname, path, vol, offset, max_d in sfx_events:
            if cname not in cues or not path.exists():
                print(f"WARN: skipping missing cue/path {cname} -> {path}")
                continue
            t_ms = max(0, int(round((cues[cname] + offset) * 1000)))
            cmd.extend(["-i", str(path)])
            valid_ev.append((len(valid_ev) + 1, cname, path.name, vol, t_ms, max_d))

        filters = []
        mix_labels = ["[0:a]"]
        for in_idx, _, _, vol, t_ms, max_d in valid_ev:
            trim_part = f"atrim=duration={max_d:.2f}," if max_d else ""
            fade_part = f"afade=t=out:st={max(0.08, (max_d or 1.0) - 0.08):.2f}:d=0.08," if max_d else ""
            filters.append(
                f"[{in_idx}:a]aresample={SR},aformat=channel_layouts=stereo,"
                f"{trim_part}{fade_part}volume={vol:.3f},adelay={t_ms}|{t_ms}[s{in_idx}]"
            )
            mix_labels.append(f"[s{in_idx}]")

        sfx_bus = tmp / "sfx_bus.wav"
        filters.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:normalize=0[sfx]")
        cmd.extend(["-filter_complex", ";".join(filters), "-map", "[sfx]", str(sfx_bus)])
        subprocess.run(cmd, check=True)

        # First-pass mix -> measure -> two-pass exact -14.5 LUFS, TP <= -1.5 dBFS
        pre_mix = tmp / "pre_mix.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(vo_pad),
                "-i", str(bed_wav),
                "-i", str(sfx_bus),
                "-filter_complex",
                (
                    "[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.08[vo];"
                    "[1:a]aresample=44100,aformat=channel_layouts=stereo[bg];"
                    "[2:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.88[sx];"
                    "[vo][bg][sx]amix=inputs=3:duration=first:normalize=0[out]"
                ),
                "-map", "[out]",
                "-sample_fmt", "s16",
                str(pre_mix),
            ],
            check=True,
        )

        # Loudnorm pass 1 stats
        probe = subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(pre_mix),
                "-af", "loudnorm=I=-14.5:TP=-1.5:LRA=5.5:print_format=json",
                "-f", "null", "-",
            ],
            capture_output=True, text=True, check=True,
        )
        j_start = probe.stderr.find("{", probe.stderr.rfind('"input_i"') - 80 if '"input_i"' in probe.stderr else 0)
        j_end = probe.stderr.find("}", j_start) + 1
        stats = json.loads(probe.stderr[j_start:j_end])

        OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(pre_mix),
                "-af", (
                    f"loudnorm=I=-14.5:TP=-1.5:LRA=5.5:linear=true:"
                    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
                    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
                    f"offset={stats['target_offset']}"
                ),
                "-ar", "48000", "-ac", "2", "-sample_fmt", "s16",
                str(OUT_WAV),
            ],
            check=True,
        )

    # Verify loudness & peak
    chk = subprocess.run(
        ["ffmpeg", "-i", str(OUT_WAV), "-filter_complex", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    print("\n--- EP03 MASTER LOUDNESS VERIFICATION ---")
    for ln in chk.stderr.splitlines()[-12:]:
        if ln.strip():
            print(ln)

    CREDITS_TXT.parent.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "IPM CHRONICLES EP03 AUDIO CREDITS\n"
        "VO Narrator (Galang-match): Chris (ElevenLabs eleven_v4, id='id')\n"
        "VO Kader Putra: Will (ElevenLabs eleven_v4, id='id')\n"
        "VO Kader Putri: Bella (ElevenLabs eleven_v4, id='id')\n"
        "Physical Foley: ElevenLabs eleven_text_to_sound_v3 (folder close, oak door, blackboard chalk)\n"
        "CC0 SFX: Freesound / Kenney / site-sfx bundled library\n"
        "Music Bed: Mixkit #140 Cyberpunk City (filtered warm historical pulse)\n",
        encoding="utf-8",
    )
    print(f"EP03 MASTER AUDIO COMPLETE -> {OUT_WAV}")


if __name__ == "__main__":
    main()
