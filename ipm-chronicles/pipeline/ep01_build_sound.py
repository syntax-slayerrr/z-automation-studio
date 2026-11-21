"""Measured Audio Mixer & Sound Design Pass for Episode 01 (Motionformat x ipm-flat-ep2).

Rules enforced (from sound-effects & real-sound skills):
- ZERO synthetic waveform/oscillator beeps: 100% real recorded CC0 foley (Freesound/Kenney/site-sfx)
  + Mixkit Free License documentary pulse bed (#140 Cyberpunk City, clean vocal-free).
- Dialogue-first priority: VO > SFX > Music Bed. Sidechain ducking ensures crystal clarity.
- Frame-exact SFX placement directly read from `remotion/videos/ipm-doc/episodes/ep01/alignment.json`.
- Target integrated loudness ~ -14.5 LUFS, true peak <= -1.5 dBFS.
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
VO_WAV = PROJECT / "public/audio/ep01/ep01_vo_galang.wav"
ALIGN_JSON = PROJECT / "src/episodes/ep01/alignment.json"
OUT_WAV = PROJECT / "public/audio/ep01/ep01_v5_master.wav"
CREDITS_TXT = PROJECT / "out/ep01/CREDITS_AUDIO.txt"

END_PAD_SEC = 2.2
SR = 44100


def load_cues() -> tuple[float, dict[str, float]]:
    d = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues = {w["cue"]: float(w["start"]) for w in d["words"] if w.get("cue")}
    total = round(float(d["duration"]) + END_PAD_SEC, 3)
    return total, cues


def main() -> None:
    total_sec, cues = load_cues()
    print(f"Building EP01 sound master ({total_sec:.2f}s) from {len(cues)} aligned word cues...")

    # Cue -> (file path, volume linear relative to mixed bus, optional trim/fade args, lead offset sec)
    sfx_events: list[tuple[str, Path, float, float, float | None]] = [
        # (cue_name, path, vol, offset_sec, max_dur_sec)
        ("s0_hook", SFX_ROOT / "kit/impact.ogg", 0.42, -0.02, 1.4),
        ("s0_born", SFX_ROOT / "pop/kenney-interface-drop-001.ogg", 0.45, 0.0, 0.5),
        ("s0_solo", SFX_ROOT / "kit/pop.ogg", 0.40, 0.0, 0.4),
        ("s0_slash", SFX_ROOT / "transition/fs-683096-woosh.ogg", 0.36, -0.05, 0.7),
        ("s0_twist", SFX_ROOT / "riser/fs-174363-rewind.ogg", 0.28, 0.0, 1.15),
        ("s0_42y", SFX_ROOT / "ding/fs-571513-soft-notifications-bell-ding-d.ogg", 0.25, 0.0, 0.8),
        ("s1_yr", SFX_ROOT / "pop/fs-824189-pop-in-sfx.ogg", 0.38, -0.03, 0.5),
        ("s1_door", SITE_SFX / "page_0.ogg", 0.42, -0.04, 0.8),
        ("s1_name", SITE_SFX / "page_1.ogg", 0.40, 0.0, 0.8),
        ("s1_ink", SFX_ROOT / "kit/tick.ogg", 0.26, 0.0, 0.3),
        ("s2_gap", SFX_ROOT / "whoosh/fs-683101-quick-woosh.ogg", 0.32, -0.06, 0.6),
        ("s2_1926", SFX_ROOT / "pop/kenney-interface-drop-002.ogg", 0.36, 0.0, 0.4),
        ("s2_mlg", SFX_ROOT / "kit/pop.ogg", 0.38, 0.0, 0.4),
        ("s2_slo", SFX_ROOT / "click/kenney-interface-select-002.ogg", 0.34, 0.0, 0.3),
        ("s2_diff", SFX_ROOT / "click/kenney-interface-toggle-001.ogg", 0.30, 0.0, 0.3),
        ("s3_jump", SFX_ROOT / "transition/fs-702773-swipe-wav.ogg", 0.30, -0.05, 0.8),
        ("s3_fly", SFX_ROOT / "transition/fs-816262-broomstick-whoosh-3-quiet-okm1.ogg", 0.34, -0.06, 1.0),
        ("s3_wajo", SFX_ROOT / "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.42, 0.0, 0.8),
        ("s3_crack", SITE_SFX / "glass_broken.ogg", 0.14, 0.0, 0.7),
        ("s4_wait", SFX_ROOT / "whoosh/fs-683101-quick-woosh.ogg", 0.30, -0.05, 0.5),
        ("s4_all", SFX_ROOT / "tick/fs528561.ogg", 0.24, 0.0, 0.4),
        ("s4_why", SFX_ROOT / "impact/fs-222517-dramatic-hit.ogg", 0.38, -0.03, 1.6),
        ("s5_1958", SFX_ROOT / "ding/fs-349504-triangle-open-04.ogg", 0.24, 0.0, 1.2),
        ("s5_conf", SITE_SFX / "page_0.ogg", 0.40, -0.05, 0.8),
        ("s5_sys", SFX_ROOT / "ding/kenney-interface-confirmation-002.ogg", 0.28, 0.0, 0.8),
        ("s6_notend", SFX_ROOT / "riser/fs-685256-riser-sound-effect-short-wav.ogg", 0.22, 0.0, 1.8),
        ("s6_twoyr", SFX_ROOT / "whoosh/fs-264777-swoosh.ogg", 0.32, -0.04, 0.7),
        ("s6_ch2", SFX_ROOT / "impact/fs-177242-cinematic-impact.ogg", 0.50, 0.02, 2.5),
    ]

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        # 1. Pad VO to total_sec
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

        # 2. Render music bed + subtle room tone ducked gently under VO
        bed_wav = tmp / "bed_ducked.wav"
        amb_path = SFX_ROOT / "ambience/fs-329533-room-tone-in-an-apartment-livi.ogg"
        # Sidechain compress music bed cleanly with VO, lowpass 2800Hz so consonants stay razor clear
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-stream_loop", "-1", "-i", str(MUSIC_BED),
                "-stream_loop", "-1", "-i", str(amb_path),
                "-i", str(vo_pad),
                "-filter_complex",
                (
                    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,"
                    f"atrim=duration={total_sec:.3f},lowpass=f=2800,volume=0.14,"
                    f"afade=t=in:st=0:d=0.6,afade=t=out:st={total_sec-1.6:.3f}:d=1.6[mus];"
                    f"[1:a]aresample={SR},aformat=channel_layouts=stereo,"
                    f"atrim=duration={total_sec:.3f},volume=0.05[amb];"
                    f"[mus][amb]amix=inputs=2:duration=shortest:normalize=0[bg];"
                    f"[2:a]aresample={SR},aformat=channel_layouts=stereo[vo_sc];"
                    f"[bg][vo_sc]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=260[bg_fin]"
                ),
                "-map", "[bg_fin]",
                str(bed_wav),
            ],
            check=True,
        )

        # 3. Render frame-accurate SFX bus on silent bed of exact total_sec
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo:d={total_sec:.3f}"]
        valid_ev = []
        for idx, (cname, path, vol, offset, max_d) in enumerate(sfx_events):
            if cname not in cues or not path.exists():
                print(f"WARN: skipping missing cue/path {cname} -> {path}")
                continue
            t_ms = max(0, int(round((cues[cname] + offset) * 1000)))
            cmd.extend(["-i", str(path)])
            valid_ev.append((len(valid_ev) + 1, cname, path.name, vol, t_ms, max_d))

        filters = []
        mix_labels = ["[0:a]"]
        for in_idx, cname, _, vol, t_ms, max_d in valid_ev:
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

        # 4. Master mix VO + Bed + SFX with strict loudness target (-14.5 LUFS, TP <= -1.5 dBFS)
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
                "[2:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.85[sx];"
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

    # Measure integrated LUFS and True Peak cleanly
    rep = subprocess.check_output(
        ["ffmpeg", "-nostats", "-i", str(OUT_WAV), "-af", "ebur128=peak=true", "-f", "null", "-"],
        stderr=subprocess.STDOUT,
    ).decode("utf-8", errors="replace")
    tail = "\n".join(rep.splitlines()[-12:])
    print(f"\nMASTER MIX COMPLETE -> {OUT_WAV}\n{tail}")

    # Log audio credits cleanly
    CREDITS_TXT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "THE IPM CHRONICLES — EPISODE 01 AUDIO CREDITS & CUES",
        "====================================================",
        "Music Bed: 'Cyberpunk City' by Alejandro Magana (A. M.), Mixkit #140 (Mixkit Stock Music Free License - YouTube/Social allowed)",
        "Bundled Foley (CC0): Freesound & Kenney packs via .agents/skills/sound-effects/sfx/manifest.json + local site-sfx",
        "",
        "Sample Cues Placed:",
    ]
    for _, cname, fname, vol, t_ms, _ in valid_ev:
        lines.append(f"  t={t_ms/1000:6.3f}s | {cname:12s} | vol={vol:.2f} | {fname}")
    CREDITS_TXT.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
