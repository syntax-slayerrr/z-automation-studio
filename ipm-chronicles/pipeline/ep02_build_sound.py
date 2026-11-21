"""Measured Audio Mixer & Sound Design Pass for Episode 02 ("Nama yang Pernah Hilang").

Rules enforced:
- 100% real recorded CC0 foley (Freesound/Kenney/site-sfx) + licensed Mixkit documentary pulse bed.
- Dialogue-first priority via stereo sidechain ducking.
- Frame-exact SFX placement bound to word cues in `src/episodes/ep02/alignment.json`.
- Broadcast loudness target: -14.5 LUFS integrated, true peak <= -1.5 dBFS.
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
MUSIC_BED = PROJECT / "public/audio/music/mixkit_140_cyberpunk_city.mp3"
VO_WAV = PROJECT / "public/audio/ep02/ep02_vo_galang.wav"
ALIGN_JSON = PROJECT / "src/episodes/ep02/alignment.json"
OUT_WAV = PROJECT / "public/audio/ep02/ep02_master_audio.wav"
CREDITS_TXT = PROJECT / "out/ep02/CREDITS_AUDIO.txt"

END_PAD_SEC = 1.90
SR = 44100


def load_cues() -> tuple[float, dict[str, float]]:
    d = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues = {w["cue"]: float(w["start"]) for w in d["words"] if w.get("cue")}
    total = round(float(d["duration"]) + END_PAD_SEC, 3)
    return total, cues


def main() -> None:
    total_sec, cues = load_cues()
    print(f"Building EP02 sound master ({total_sec:.2f}s) from {len(cues)} aligned cues...")

    sfx_events: list[tuple[str, Path, float, float, float | None]] = [
        # Scene 01 — Yogyakarta 1960 -> Surakarta 1961 Declaration & Twist
        ("s0_1960", SFX_ROOT / "whoosh/fs-683101-quick-woosh.ogg", 0.36, -0.15, 0.8),
        ("s0_1961", SITE_SFX / "cinematic_0.ogg", 0.38, -0.05, 1.3),
        ("s0_ipm", SFX_ROOT / "ding/fs-571513-soft-notifications-bell-ding-d.ogg", 0.28, 0.0, 0.9),
        ("s0_42y", SITE_SFX / "page_0.ogg", 0.34, 0.0, 0.7),
        ("s0_twist", SFX_ROOT / "impact/fs-177242-cinematic-impact.ogg", 0.54, 0.0, 2.0),

        # Scene 02 — 1961-1976 Pembentukan, Peta Nusantara & Logo Construct
        ("s1_1961", SFX_ROOT / "whoosh/fs-683101-quick-woosh.ogg", 0.32, -0.10, 0.6),
        ("s1_conflict", SFX_ROOT / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.36, 0.0, 0.8),
        ("s1_unite", SFX_ROOT / "pop/kenney-interface-drop-001.ogg", 0.38, 0.0, 0.5),
        ("s1_dakwah", SFX_ROOT / "kit/pop.ogg", 0.35, 0.0, 0.4),
        ("s1_1969", SITE_SFX / "page_1.ogg", 0.44, -0.02, 0.7),
        ("s1_khittah", SFX_ROOT / "click/kenney-interface-select-002.ogg", 0.34, 0.0, 0.3),
        ("s1_1976", SFX_ROOT / "impact/kenney-impact-impactpunch-heavy-000.ogg", 0.38, -0.02, 0.7),
        ("s1_spi", SFX_ROOT / "ding/kenney-interface-confirmation-002.ogg", 0.32, 0.0, 0.9),

        # Scene 03 — 1976-1992 Orde Baru OSIS, Pintu Menutup & IPM -> IRM Morph
        ("s2_next", SFX_ROOT / "transition/fs-702773-swipe-wav.ogg", 0.32, -0.06, 0.7),
        ("s2_gov", SFX_ROOT / "impact/kenney-impact-impactsoft-heavy-001.ogg", 0.38, 0.0, 0.8),
        ("s2_osis", SFX_ROOT / "impact/fs-222517-dramatic-hit.ogg", 0.42, -0.02, 1.5),
        ("s2_door", SFX_ROOT / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.34, 0.0, 0.7),
        ("s2_push", SITE_SFX / "glass_broken.ogg", 0.16, 0.0, 0.7),
        ("s2_decide", SFX_ROOT / "riser/fs-685256-riser-sound-effect-short-wav.ogg", 0.24, 0.0, 1.4),
        ("s2_nov18", SITE_SFX / "page_0.ogg", 0.36, -0.04, 0.6),
        ("s2_ketuk", SFX_ROOT / "impact/fs-222517-dramatic-hit.ogg", 0.50, -0.02, 1.7),
        ("s2_berganti", SFX_ROOT / "transition/fs-683096-woosh.ogg", 0.36, -0.04, 0.9),
        ("s2_irm", SITE_SFX / "cinematic_2.ogg", 0.38, -0.02, 1.2),

        # Scene 04 — 1992-2008 Reformasi, Medan XV, Tanwir 2007 & Solo Climax
        ("s3_era", SFX_ROOT / "glitch/fs-339521-vhs-rewind-forward-and-eject.ogg", 0.22, -0.04, 0.9),
        ("s3_change", SFX_ROOT / "typing/fs-416777-digital-typing-wav.ogg", 0.22, 0.0, 1.1),
        ("s3_q", SFX_ROOT / "whoosh/fs-264777-swoosh.ogg", 0.30, -0.04, 0.6),
        ("s3_medan", SFX_ROOT / "pop/fs-824189-pop-in-sfx.ogg", 0.38, -0.02, 0.6),
        ("s3_tanwir", SITE_SFX / "page_0.ogg", 0.42, 0.0, 0.8),
        ("s3_solo", SFX_ROOT / "riser/fs-685256-riser-sound-effect-short-wav.ogg", 0.28, -0.10, 1.6),
        ("s3_return", SITE_SFX / "cinematic_2.ogg", 0.42, 0.0, 1.4),
        ("s3_ipmback", SFX_ROOT / "impact/fs-177242-cinematic-impact.ogg", 0.56, 0.0, 2.2),

        # Scene 05 — Bantul 2010 Gerakan Pelajar Kreatif
        ("s4_twoyr", SFX_ROOT / "whoosh/fs-169867-swoosh.ogg", 0.30, -0.05, 0.7),
        ("s4_mkt17", SFX_ROOT / "ding/fs-349504-triangle-open-04.ogg", 0.26, 0.0, 1.1),
        ("s4_gpk", SFX_ROOT / "ding/kenney-interface-confirmation-003.ogg", 0.30, 0.0, 0.8),
        ("s4_gkt", SITE_SFX / "page_1.ogg", 0.36, 0.0, 0.7),
        ("s4_rumah", SITE_SFX / "cinematic_3.ogg", 0.36, 0.0, 1.4),

        # Scene 06 — Cliffhanger: Sejarah Belum Selesai
        ("s5_montage", SFX_ROOT / "whoosh/fs-683101-quick-woosh.ogg", 0.28, -0.04, 0.6),
        ("s5_slow", SFX_ROOT / "ding/fs-571513-soft-notifications-bell-ding-d.ogg", 0.24, 0.0, 1.0),
        ("s5_endcard", SFX_ROOT / "impact/fs-177242-cinematic-impact.ogg", 0.52, 0.35, 2.3),
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

        # Bed: lowpass documentary pulse + room tone sidechained cleanly under VO
        # Includes a dramatic 0.55s music dip right before 18 Nov 1992 name change ("s2_morph")
        dip_s = max(1.0, cues.get("s2_morph", 50.0) - 0.58)
        dip_e = max(dip_s + 0.15, cues.get("s2_morph", 50.0) - 0.04)
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
                    f"atrim=duration={total_sec:.3f},lowpass=f=2900,volume=0.16,"
                    f"volume=enable='between(t,{dip_s:.3f},{dip_e:.3f})':volume=0.05,"
                    f"afade=t=in:st=0:d=0.65,afade=t=out:st={total_sec-1.8:.3f}:d=1.8[mus];"
                    f"[1:a]aresample={SR},aformat=channel_layouts=stereo,"
                    f"atrim=duration={total_sec:.3f},volume=0.06[amb];"
                    f"[mus][amb]amix=inputs=2:duration=shortest:normalize=0[bg];"
                    f"[2:a]aresample={SR},aformat=channel_layouts=stereo[vo_sc];"
                    f"[bg][vo_sc]sidechaincompress=threshold=0.02:ratio=5.5:attack=12:release=240[bg_fin]"
                ),
                "-map", "[bg_fin]",
                str(bed_wav),
            ],
            check=True,
        )

        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        valid_ev = []
        for _, (cname, path, vol, offset, max_d) in enumerate(sfx_events):
            if cname not in cues or not path.exists():
                print(f"WARN: skipping missing cue/path {cname} -> {path}")
                continue
            t_ms = max(0, int(round((cues[cname] + offset) * 1000)))
            cmd.extend(["-i", str(path)])
            valid_ev.append((len(valid_ev) + 1, cname, path.name, vol, t_ms, max_d))

        filters = []
        mix_labels = ["[0:a]"]
        for in_idx, _, _, vol, t_ms, max_d in valid_ev:
            lbl = f"[s{in_idx}]"
            trim_str = f",atrim=duration={max_d:.2f},afade=t=out:st={max(0.05, max_d-0.18):.2f}:d=0.18" if max_d else ""
            filters.append(
                f"[{in_idx}:a]aresample={SR},aformat=channel_layouts=stereo{trim_str},"
                f"volume={vol:.3f},adelay={t_ms}|{t_ms}{lbl}"
            )
            mix_labels.append(lbl)

        sfx_bus = tmp / "sfx_bus.wav"
        filters.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:normalize=0[sfx_out]")
        subprocess.run(
            cmd + ["-filter_complex", ";".join(filters), "-map", "[sfx_out]", str(sfx_bus)],
            check=True,
        )

        unnorm_master = tmp / "unnorm_master.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(vo_pad),
                "-i", str(bed_wav),
                "-i", str(sfx_bus),
                "-filter_complex",
                "[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.0[vo];"
                "[1:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.0[bd];"
                "[2:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.88[sx];"
                "[vo][bd][sx]amix=inputs=3:duration=first:normalize=0[mix]",
                "-map", "[mix]",
                str(unnorm_master),
            ],
            check=True,
        )

        OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(unnorm_master),
                "-af", "loudnorm=I=-14.5:TP=-1.5:LRA=7",
                "-ar", str(SR), "-ac", "2",
                str(OUT_WAV),
            ],
            check=True,
        )

    rep = subprocess.check_output(
        ["ffmpeg", "-nostats", "-i", str(OUT_WAV), "-af", "ebur128=peak=true", "-f", "null", "-"],
        stderr=subprocess.STDOUT,
    ).decode("utf-8", errors="replace")
    print(f"\nEP02 MASTER AUDIO COMPLETE -> {OUT_WAV}\n" + "\n".join(rep.splitlines()[-12:]))

    CREDITS_TXT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "THE IPM CHRONICLES — EPISODE 02 AUDIO CREDITS & CUES",
        "====================================================",
        "Music Bed: 'Cyberpunk City' by Alejandro Magana (A. M.), Mixkit #140 (Mixkit Stock Music Free License)",
        "Bundled Foley (CC0): Freesound & Kenney packs via .agents/skills/sound-effects/sfx/manifest.json + site-sfx",
        "",
        "Placed Cues:",
    ]
    for _, cname, fname, vol, t_ms, _ in valid_ev:
        lines.append(f"  t={t_ms/1000:6.3f}s | {cname:12s} | vol={vol:.2f} | {fname}")
    CREDITS_TXT.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
