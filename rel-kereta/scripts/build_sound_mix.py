"""
Broadcast-Grade Multi-Layer Sound Mix & Mastering for RelKeretaShort
("Kenapa Rel Kereta Pakai Batu Kerikil (Balast) & Celah?")

Layers synced deterministically to `rel-kereta/audio/alignment.json`:
  1. ElevenLabs `eleven_v4` Conversational Indonesian VO (`rel-kereta/audio/vo_master.wav`)
  2. 9 Bespoke Railway & Mechanical SFX (`eleven_text_to_sound_v3` in `rel-kereta/audio/sfx/`)
  3. Curated CC0 crisp UI/impact accents (`.agents/skills/sound-effects/sfx/`)
  4. Licensed Curious Upbeat Score: Mixkit #587 "Discover" (Mixkit Stock Music Free License)
     with anti-masking vocal pocket EQ + stereo sidechain ducking
  5. Two-Pass Linear Broadcast Mastering -> `-14.8 LUFS`, `TP <= -1.5 dBFS`, 48kHz Stereo AAC 256k
     -> `public/rel-kereta/audio_master.m4a` + Stereo/Mono ebur128 QA + `CREDITS.txt` + `SOUND.md`.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
import urllib.request
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
AUDIO_DIR = PROJECT / "audio"
SFX_ELEVEN = AUDIO_DIR / "sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/rel-kereta"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"
SOUND_MD = OUT_DIR / "SOUND.md"

LOCAL_MIXKIT_587 = ROOT / "gmni-history/.audio-cache/mixkit-587-discover.mp3"
MIXKIT_587_URL = "https://assets.mixkit.co/music/587/587.mp3"
CACHE_MUSIC = PROJECT / ".audio-cache/mixkit-587-discover.mp3"


def ensure_music() -> Path:
    if LOCAL_MIXKIT_587.exists() and LOCAL_MIXKIT_587.stat().st_size > 100_000:
        return LOCAL_MIXKIT_587
    CACHE_MUSIC.parent.mkdir(parents=True, exist_ok=True)
    if CACHE_MUSIC.exists() and CACHE_MUSIC.stat().st_size > 100_000:
        return CACHE_MUSIC
    req = urllib.request.Request(MIXKIT_587_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        CACHE_MUSIC.write_bytes(resp.read())
    return CACHE_MUSIC


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
    total_sec = float(align["totalSec"])
    cues: dict[str, float] = align["cuesSec"]

    music_path = ensure_music()
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Frame-locked tactile foley events tied directly to ElevenLabs [[cue]] timestamps!
    sfx_events: list[tuple[Path, float, float, str]] = [
        # (path, start_sec, gain_db, label)
        (SFX_ELEVEN / "train_pass_heavy.mp3", max(0.0, cues.get("b1_hook", 0.2) - 0.15), -11.5, "Hook Train Pass"),
        (SFX_ELEVEN / "camera_whoosh_soft.mp3", max(0.0, cues.get("b2_naive", 7.0) - 0.15), -14.0, "Glide to Naive Track"),
        (SFX_ELEVEN / "train_pass_heavy.mp3", cues.get("b2_train_heavy", 10.0), -12.0, "Heavy Train Hits Bare Dirt"),
        (SFX_ELEVEN / "mud_sink_squelch.mp3", cues.get("b3_sink", 14.0), -9.5, "Sleeper Sinking Into Earth"),
        (SFX_ELEVEN / "rain_drizzle.mp3", cues.get("b3_rain", 18.0), -13.5, "Rain Turns Earth to Mud"),
        (SFX_ELEVEN / "gravel_pour_crunch.mp3", cues.get("b4_pour", 24.0), -8.5, "Pouring Crushed Granite Ballast"),
        (SFX_ELEVEN / "stone_lock_thud.mp3", cues.get("b4_lock", 33.0), -9.0, "Angular Stones Interlocking"),
        (SFX_ELEVEN / "camera_whoosh_soft.mp3", max(0.0, cues.get("b5_table", 41.0) - 0.15), -14.0, "Cut to Wooden Table Analogy"),
        (SFX_ELEVEN / "marbles_scatter.mp3", cues.get("b5_marbles", 43.0), -8.5, "Round Marbles Scattering"),
        (SFX_ELEVEN / "stone_lock_thud.mp3", cues.get("b5_stones", 48.0), -9.5, "Sharp Gravel Locked Solid"),
        (SFX_ELEVEN / "camera_whoosh_soft.mp3", max(0.0, cues.get("b6_heat", 53.0) - 0.15), -14.0, "Heat Wave Transition"),
        (SFX_ELEVEN / "steel_heat_buckle.mp3", cues.get("b6_buckle", 60.0), -8.5, "60C Sun Kink Rail Buckling"),
        (SFX_ELEVEN / "camera_whoosh_soft.mp3", max(0.0, cues.get("b7_gap", 64.0) - 0.15), -14.0, "Macro Rack-Focus to 10mm Gap"),
        (SFX_ELEVEN / "rail_clack_clack.mp3", cues.get("b7_clack", 69.0), -8.0, "Crisp Jeglek-Jeglek Expansion Clack"),
        (SFX_ELEVEN / "train_pass_heavy.mp3", max(0.0, cues.get("b8_loop", total_sec - 4.2)), -12.0, "Loop Return Train Glide"),
    ]

    # Add subtle CC0 pop accents if bundled files exist
    cc0_pop = SFX_CC0 / "kenney-interface-confirmation-002.ogg"
    if cc0_pop.exists():
        sfx_events.append((cc0_pop, cues.get("b4_ballast", 26.0), -16.0, "Ballast Label Pop"))
        sfx_events.append((cc0_pop, cues.get("b7_gap", 64.0) + 0.8, -16.0, "10mm Gap Label Pop"))

    valid_sfx = [ev for ev in sfx_events if ev[0].exists()]
    missing = [ev[0].name for ev in sfx_events if not ev[0].exists()]
    if missing:
        print("WARN missing SFX:", missing)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        premaster_wav = tmp / "premaster.wav"

        cmd = ["ffmpeg", "-y", "-i", str(VO_WAV), "-stream_loop", "-1", "-i", str(music_path)]
        for p, _, _, _ in valid_sfx:
            cmd.extend(["-i", str(p)])

        filters = []
        # VO stereo bus + split for sidechain key
        filters.append(f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur={total_sec:.3f},atrim=0:{total_sec:.3f},asplit=2[vo_mix][vo_key]")
        # Upbeat curious score with anti-masking vocal pocket EQ + clean loop fade
        filters.append(
            f"[1:a]aresample=48000,atrim=0:{total_sec:.3f},asetpts=PTS-STARTPTS,"
            f"highpass=f=45,lowpass=f=11000,"
            f"equalizer=f=320:t=q:w=1.2:g=-2.4,equalizer=f=1800:t=q:w=1.4:g=-3.8,equalizer=f=3200:t=q:w=1.4:g=-2.8,"
            f"volume=-14.5dB,afade=t=in:st=0:d=0.35,afade=t=out:st={max(0, total_sec - 0.45):.3f}:d=0.45[mus_raw]"
        )
        filters.append(
            "[mus_raw][vo_key]sidechaincompress=threshold=0.025:ratio=4.5:attack=18:release=220:makeup=1[mus_duck]"
        )

        mix_inputs = ["[vo_mix]", "[mus_duck]"]
        for idx, (_, start_s, gain_db, _) in enumerate(valid_sfx):
            inp_idx = idx + 2
            delay_ms = max(0, int(round(start_s * 1000)))
            tag = f"sfx_{idx}"
            filters.append(
                f"[{inp_idx}:a]aresample=48000,aformat=channel_layouts=stereo,"
                f"highpass=f=40,volume={gain_db}dB,adelay={delay_ms}|{delay_ms},"
                f"apad=whole_dur={total_sec:.3f},atrim=0:{total_sec:.3f}[{tag}]"
            )
            mix_inputs.append(f"[{tag}]")

        filters.append(
            f"{''.join(mix_inputs)}amix=inputs={len(mix_inputs)}:duration=first:dropout_transition=0:normalize=0,"
            f"alimiter=limit=0.90:attack=5:release=60[pre]"
        )

        cmd.extend(["-filter_complex", ";".join(filters), "-map", "[pre]", "-ar", "48000", "-ac", "2", str(premaster_wav)])
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

        # Two-pass linear EBU R128 broadcast loudnorm -> -14.8 LUFS, TP <= -1.5 dBFS
        pass1 = subprocess.run(
            [
                "ffmpeg", "-i", str(premaster_wav),
                "-af", "loudnorm=I=-14.8:TP=-1.5:LRA=4.5:print_format=json",
                "-f", "null", "-",
            ],
            capture_output=True, text=True, check=True,
        )
        stderr = pass1.stderr
        j_start = stderr.rfind("{")
        j_end = stderr.rfind("}") + 1
        stats = json.loads(stderr[j_start:j_end])

        norm_filter = (
            f"loudnorm=I=-14.8:TP=-1.5:LRA=4.5:linear=true:"
            f"measured_I={stats['input_i']}:measured_LRA={stats['input_lra']}:"
            f"measured_TP={stats['input_tp']}:measured_thresh={stats['input_thresh']}:"
            f"offset={stats['target_offset']}"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(premaster_wav),
                "-af", norm_filter,
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
                str(OUT_M4A),
            ],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
        )

    st_lufs, st_tp = measure_ebur128(OUT_M4A, mono=False)
    mo_lufs, mo_tp = measure_ebur128(OUT_M4A, mono=True)
    print(f"=== Broadcast Master Complete: {OUT_M4A} ===")
    print(f"Stereo: {st_lufs:.2f} LUFS | True Peak: {st_tp:.2f} dBFS")
    print(f"Mono:   {mo_lufs:.2f} LUFS | True Peak: {mo_tp:.2f} dBFS")

    CREDITS_TXT.write_text(
        "AUDIO CREDITS — RelKeretaShort ('Kenapa Rel Kereta Pakai Batu Kerikil & Celah?')\n"
        "- Narration: ElevenLabs eleven_v4 (Brian, Indonesian)\n"
        "- Bespoke Mechanical Foley: ElevenLabs eleven_text_to_sound_v3 (9 custom clips)\n"
        "- Music Score: 'Discover' (Mixkit #587, Mixkit Stock Music Free License)\n"
        "- UI/Transition Accents: Kenney CC0 Sound Pack\n",
        encoding="utf-8",
    )
    SOUND_MD.write_text(
        f"# Sound QA — RelKeretaShort\n\n"
        f"- Duration: {total_sec:.3f}s\n"
        f"- Stereo Loudness: `{st_lufs:.2f} LUFS`, True Peak `{st_tp:.2f} dBFS`\n"
        f"- Mono Downmix: `{mo_lufs:.2f} LUFS`, True Peak `{mo_tp:.2f} dBFS`\n\n"
        f"## 5 Spot-Check Timestamps\n"
        + "\n".join(
            f"- `{t:.2f}s` — {lbl}" for _, t, _, lbl in valid_sfx[:5]
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
