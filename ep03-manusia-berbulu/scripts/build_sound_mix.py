"""
1:1 Harmonic & Broadcast Sound Design Mixer for `/series-evolusi` Episode 3:
"KENAPA MANUSIA TIDAK BERBULU SEPERTI SIMPANSE, BONOBO & GORILA?" (`ep03-manusia-berbulu`)

Matches the exact 1:1 spectral & musical instrument architecture of `/series-evolusi`:
  - Warm Baritone Documentary VO (`ep03-manusia-berbulu/audio/vo_master.wav`)
  - `< 480 Hz` Dark Felt-Muted Marimba / Kalimba Ostinato + Deep Sub-Bass + Warm Pad in A Natural Minor (86.15 BPM)
  - Music breath dip during key headline contrast ("sepuluh kali lebih banyak daripada simpanse")
  - Harmonic-tuned E7 (2637.8 Hz) medical diagnostic sonar pings, A5+C5 / D5+E5 monitor beds,
    C8-D9 crystalline DNA cascade + switch-off tone, visceral sub-bass LUB-DUB heartbeats,
    and warm Fmaj7/Am finale chord resolve
  - 12 Bespoke ElevenLabs Sound-V3 rainforest, rain, dry savanna wind, footsteps, thermal heat,
    hologram slash, cool sweat evaporation, UV glow, cellular dive, and twilight cold wind foley layers
  - 2-Pass Linear Broadcast Mastering to `-14.3 LUFS`, True Peak <= `-1.5 dBTP` -> `public/ep03-manusia-berbulu/audio_master.m4a`
"""
from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfiltfilt

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
AUDIO_DIR = PROJECT / "audio"
SFX_DIR = AUDIO_DIR / "sfx"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public" / "ep03-manusia-berbulu"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_SPEC_PNG = OUT_DIR / "audio_qa_spec.png"

SR = 44100
BPM = 86.15
STEP_16TH_S = (60.0 / BPM) / 2.0

CHORDS = [
    {"name": "Am", "bass": 108.00, "pad": [220.00, 261.63, 329.63], "arp": [220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 293.66, 329.63]},
    {"name": "F",  "bass": 87.31,  "pad": [174.61, 220.00, 261.63], "arp": [174.61, 220.00, 261.63, 349.23, 261.63, 220.00, 261.63, 329.63]},
    {"name": "G",  "bass": 98.00,  "pad": [196.00, 246.94, 293.66], "arp": [196.00, 246.94, 293.66, 392.00, 293.66, 246.94, 293.66, 329.63]},
    {"name": "Dm", "bass": 73.42,  "pad": [146.83, 220.00, 293.66], "arp": [146.83, 220.00, 293.66, 349.23, 293.66, 220.00, 261.63, 293.66]},
]


def decode_stereo_f32(path: Path, sr: int = SR) -> np.ndarray:
    raw = subprocess.check_output(
        [
            "ffmpeg", "-v", "error", "-i", str(path),
            "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(sr), "pipe:1",
        ]
    )
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def db_to_lin(db: float) -> float:
    return 0.0 if db <= -90.0 else float(10.0 ** (db / 20.0))


def apply_fades(seg: np.ndarray, fade_in_s: float = 0.015, fade_out_s: float = 0.04) -> np.ndarray:
    y = seg.copy()
    n = len(y)
    fi = min(n, int(round(fade_in_s * SR)))
    fo = min(n, int(round(fade_out_s * SR)))
    if fi > 1:
        ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, fi, dtype=np.float32)))
        y[:fi] *= ramp[:, None]
    if fo > 1:
        ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(1.0, 0.0, fo, dtype=np.float32)))
        y[n - fo :] *= ramp[:, None]
    return y


def mix_add(dst: np.ndarray, src: np.ndarray | None, start_s: float, gain_db: float = 0.0,
            max_dur_s: float | None = None, fade_in_s: float = 0.015, fade_out_s: float = 0.05) -> None:
    if src is None or len(src) == 0:
        return
    seg = src[: int(round(max_dur_s * SR))] if max_dur_s is not None else src
    seg = apply_fades(seg, fade_in_s=fade_in_s, fade_out_s=fade_out_s) * db_to_lin(gain_db)
    i0 = int(round(start_s * SR))
    if i0 < 0:
        seg = seg[-i0:]
        i0 = 0
    if i0 >= len(dst) or len(seg) == 0:
        return
    i1 = min(len(dst), i0 + len(seg))
    dst[i0:i1] += seg[: i1 - i0]


def make_db_curve(n_samples: int, keyframes: list[tuple[float, float]]) -> np.ndarray:
    kfs = sorted(keyframes, key=lambda x: x[0])
    out = np.zeros(n_samples, dtype=np.float32)
    if not kfs:
        return out

    def seg_fill(i0: int, i1: int, db0: float, db1: float) -> None:
        i0c, i1c = max(0, min(n_samples, i0)), max(0, min(n_samples, i1))
        if i1c <= i0c:
            return
        u = (np.arange(i0c, i1c, dtype=np.float32) - i0) / float(max(1, i1 - i0))
        w = 0.5 * (1.0 - np.cos(np.pi * np.clip(u, 0.0, 1.0)))
        if db0 <= -85.0 or db1 <= -85.0:
            g0, g1 = db_to_lin(db0), db_to_lin(db1)
            out[i0c:i1c] = g0 + (g1 - g0) * w
        else:
            out[i0c:i1c] = np.power(10.0, (db0 + (db1 - db0) * w) / 20.0, dtype=np.float32)

    first_i = int(round(kfs[0][0] * SR))
    if first_i > 0:
        out[: min(n_samples, first_i)] = db_to_lin(kfs[0][1])
    for (t0, db0), (t1, db1) in zip(kfs, kfs[1:]):
        seg_fill(int(round(t0 * SR)), int(round(t1 * SR)), db0, db1)
    last_i = int(round(kfs[-1][0] * SR))
    if last_i < n_samples:
        out[max(0, last_i) :] = db_to_lin(kfs[-1][1])
    return out


def render_dark_aminor_score(total_s: float, dip_window: tuple[float, float], finale_start_s: float) -> np.ndarray:
    n = int(round(total_s * SR))
    left = np.zeros(n, dtype=np.float32)
    right = np.zeros(n, dtype=np.float32)

    step = 0
    t = 0.04
    while t < total_s - 1.6:
        chord = CHORDS[(step // 8) % len(CHORDS)]
        in_dip = dip_window[0] <= t <= dip_window[1]
        in_finale = t >= finale_start_s

        if not in_dip and not in_finale:
            freq = chord["arp"][step % 8]
            ln = min(int(0.42 * SR), n - int(t * SR))
            if ln > 64:
                tt = np.arange(ln, dtype=np.float32) / SR
                env = (1.0 - np.exp(-tt / 0.009)) * np.exp(-tt / 0.15)
                accent = 1.18 if (step % 4 == 0) else 0.90
                tone = (
                    np.sin(2.0 * np.pi * freq * tt)
                    + 0.24 * np.sin(2.0 * np.pi * (freq * 2.0) * tt) * np.exp(-tt / 0.05)
                    + 0.08 * np.sin(2.0 * np.pi * (freq * 0.5) * tt)
                ) * env * 0.16 * accent
                pan = 0.5 + 0.22 * math.sin(step * 0.85)
                s0 = int(t * SR)
                left[s0 : s0 + ln] += tone * math.sqrt(1.0 - pan)
                right[s0 : s0 + ln] += tone * math.sqrt(pan)

        if step % 4 == 0 and not in_finale:
            bln = min(int(1.36 * SR), n - int(t * SR))
            if bln > 64:
                btt = np.arange(bln, dtype=np.float32) / SR
                benv = (1.0 - np.exp(-btt / 0.030)) * np.exp(-btt / 0.62)
                sub_gain = 0.16 if in_dip else 0.26
                sub = (
                    np.sin(2.0 * np.pi * chord["bass"] * btt)
                    + 0.18 * np.sin(2.0 * np.pi * (chord["bass"] * 2.0) * btt)
                ) * benv * sub_gain
                s0 = int(t * SR)
                left[s0 : s0 + bln] += sub
                right[s0 : s0 + bln] += sub

        if step % 8 == 0 and not in_finale:
            pln = min(int(3.10 * SR), n - int(t * SR))
            if pln > 64:
                ptt = np.arange(pln, dtype=np.float32) / SR
                penv = np.sin(np.pi * np.clip(ptt / (pln / SR), 0.0, 1.0)) ** 1.3
                pad_l = np.zeros(pln, dtype=np.float32)
                pad_r = np.zeros(pln, dtype=np.float32)
                for p_idx, pf in enumerate(chord["pad"]):
                    pad_l += np.sin(2.0 * np.pi * (pf * 0.9992) * ptt + p_idx) * 0.032
                    pad_r += np.sin(2.0 * np.pi * (pf * 1.0008) * ptt + p_idx * 1.7) * 0.032
                s0 = int(t * SR)
                left[s0 : s0 + pln] += pad_l * penv
                right[s0 : s0 + pln] += pad_r * penv

        t += STEP_16TH_S
        step += 1

    sos_lp = butter(4, 480.0 / (SR * 0.5), btype="low", output="sos")
    bed = np.stack([left, right], axis=1)
    bed[:, 0] = sosfiltfilt(sos_lp, bed[:, 0]).astype(np.float32)
    bed[:, 1] = sosfiltfilt(sos_lp, bed[:, 1]).astype(np.float32)

    fin_dur = max(1.8, total_s - finale_start_s - 0.12)
    fln = min(int(fin_dur * SR), n - int(finale_start_s * SR))
    if fln > 128:
        ftt = np.arange(fln, dtype=np.float32) / SR
        fenv = (1.0 - np.exp(-ftt / 0.14)) * np.exp(-ftt / max(0.85, fin_dur * 0.44))
        chord_sig_l = np.zeros(fln, dtype=np.float32)
        chord_sig_r = np.zeros(fln, dtype=np.float32)
        for hz, amp in [(108.0, 0.22), (221.8, 0.10), (263.6, 0.085), (348.2, 0.08), (443.2, 0.065), (884.5, 0.028)]:
            chord_sig_l += np.sin(2.0 * np.pi * hz * 0.9995 * ftt) * amp
            chord_sig_r += np.sin(2.0 * np.pi * hz * 1.0005 * ftt) * amp
        s0 = int(finale_start_s * SR)
        bed[s0 : s0 + fln, 0] += chord_sig_l * fenv
        bed[s0 : s0 + fln, 1] += chord_sig_r * fenv

    return bed


def synth_sonar_ping_e7() -> np.ndarray:
    ln = int(0.32 * SR)
    tt = np.arange(ln, dtype=np.float32) / SR
    env = (1.0 - np.exp(-tt / 0.003)) * np.exp(-tt / 0.072)
    sig = (
        np.sin(2.0 * np.pi * 2637.8 * tt)
        + 0.20 * np.sin(2.0 * np.pi * 1798.9 * tt) * np.exp(-tt / 0.04)
    ) * env * 0.11
    return np.stack([sig, sig], axis=1)


def synth_diagnostic_monitor_bed(dur_s: float, mode: str = "monitor") -> np.ndarray:
    ln = int(round(dur_s * SR))
    tt = np.arange(ln, dtype=np.float32) / SR
    pulse_hz = 1.435
    pulse = 0.55 + 0.45 * np.sin(2.0 * np.pi * pulse_hz * tt) ** 2
    if mode == "monitor":
        sig = (np.sin(2.0 * np.pi * 886.3 * tt) * 0.022 + np.sin(2.0 * np.pi * 519.7 * tt) * 0.018) * pulse
    else:
        sig = (
            np.sin(2.0 * np.pi * 592.7 * tt) * 0.022
            + np.sin(2.0 * np.pi * 659.2 * tt) * 0.020
            + np.sin(2.0 * np.pi * 1185.4 * tt) * 0.008
        ) * pulse
    return apply_fades(np.stack([sig, sig], axis=1), fade_in_s=0.25, fade_out_s=0.35)


def synth_dna_chime_cascade() -> np.ndarray:
    freqs = [4187.3, 4698.0, 5869.3, 7044.0, 8216.7, 9399.3]
    ln = int(2.2 * SR)
    out_l = np.zeros(ln, dtype=np.float32)
    out_r = np.zeros(ln, dtype=np.float32)
    for idx, f in enumerate(freqs):
        onset = int(idx * 0.12 * SR)
        rem = ln - onset
        tt = np.arange(rem, dtype=np.float32) / SR
        env = (1.0 - np.exp(-tt / 0.004)) * np.exp(-tt / 0.44)
        bell = np.sin(2.0 * np.pi * f * tt) * env * 0.036
        if idx % 2 == 0:
            out_l[onset:] += bell
            out_r[onset:] += bell * 0.65
        else:
            out_l[onset:] += bell * 0.65
            out_r[onset:] += bell
    return np.stack([out_l, out_r], axis=1)


def synth_sub_heartbeat_lubdub() -> np.ndarray:
    ln = int(1.15 * SR)
    tt = np.arange(ln, dtype=np.float32) / SR
    sig = np.zeros(ln, dtype=np.float32)
    for onset_s, f0, amp in [(0.02, 54.0, 0.55), (0.31, 44.0, 0.44)]:
        i0 = int(onset_s * SR)
        rem = ln - i0
        t2 = np.arange(rem, dtype=np.float32) / SR
        freq_sweep = f0 * (1.0 + 0.45 * np.exp(-t2 / 0.045))
        phase = 2.0 * np.pi * np.cumsum(freq_sweep) / SR
        env = (1.0 - np.exp(-t2 / 0.008)) * np.exp(-t2 / 0.12)
        sig[i0:] += np.sin(phase) * env * amp
    return np.stack([sig, sig], axis=1)


def load_sfx(name: str) -> np.ndarray | None:
    p = SFX_DIR / name
    if p.exists() and p.stat().st_size > 1000:
        return decode_stereo_f32(p)
    return None


def measure_loudness(path: Path, mono: bool = False) -> tuple[float, float, float]:
    af = "pan=mono|c0=0.5*c0+0.5*c1,ebur128=peak=true" if mono else "ebur128=peak=true"
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", af, "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    I_val, LRA_val, TP_val = -99.0, 0.0, 0.0
    lines = proc.stderr.splitlines()
    for i, ln in enumerate(lines):
        if "Integrated loudness:" in ln and i + 1 < len(lines):
            for sub in lines[i + 1 : i + 5]:
                if "I:" in sub:
                    I_val = float(sub.split("I:")[1].strip().split()[0])
                if "LRA:" in sub:
                    LRA_val = float(sub.split("LRA:")[1].strip().split()[0])
        if "True peak:" in ln and i + 1 < len(lines):
            for sub in lines[i + 1 : i + 3]:
                if "Peak:" in sub:
                    TP_val = float(sub.split("Peak:")[1].strip().split()[0])
    return I_val, LRA_val, TP_val


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    total_s = float(align["totalVideoSec"])
    cues = align["cuesSec"]
    scenes = align["scenesSec"]
    n_samples = int(round(total_s * SR))

    vo = decode_stereo_f32(VO_WAV)
    mix = np.zeros((n_samples, 2), dtype=np.float32)
    mix_add(mix, vo, 0.0, gain_db=0.5, fade_in_s=0.005, fade_out_s=0.02)

    # Cue timestamps
    t_s2 = float(scenes.get("s2", 8.0))
    t_s3 = float(scenes.get("s3", 25.0))
    t_s4 = float(scenes.get("s4", 35.0))
    t_s5 = float(scenes.get("s5", 50.0))
    t_s6 = float(scenes.get("s6", 60.0))

    t_iklim = float(cues.get("c2_iklim", t_s2 + 6.5))
    t_keluar = float(cues.get("c2_keluar", t_s3 - 3.0))
    t_jaket_bulu = float(cues.get("c3_jaket_bulu", t_s3 + 5.0))
    t_otak = float(cues.get("c3_otak", t_s4 - 2.5))
    t_dilepas = float(cues.get("c4_dilepas", t_s4 + 1.5))
    t_10x = float(cues.get("c4_10x", t_s4 + 4.0))
    t_olahraga = float(cues.get("c4_olahraga", t_s4 + 6.8))
    t_pendingin = float(cues.get("c4_pendingin", t_s4 + 10.0))
    t_rambut = float(cues.get("c4_rambut", t_s5 - 4.0))
    t_terbuka = float(cues.get("c5_terbuka", t_s5 + 2.0))
    t_baju = float(cues.get("c5_baju", t_s6 - 2.6))
    t_dna = float(cues.get("c6_dna", t_s6 + 1.5))
    t_sakelar = float(cues.get("c6_sakelar", t_dna + 3.2))
    t_angin = float(cues.get("c6_angin", t_sakelar + 2.4))
    t_finale = float(cues.get("c6_berubah", total_s - 3.8))

    # 2. <480Hz Dark A-Minor Musical Score (with dramatic breath dip on "sepuluh kali lebih banyak")
    score = render_dark_aminor_score(
        total_s=total_s,
        dip_window=(t_10x - 0.15, t_10x + 1.55),
        finale_start_s=t_finale,
    )
    score_env = make_db_curve(
        n_samples,
        [
            (0.0, -8.5),
            (t_s2, -8.0),
            (t_s3, -8.8),
            (t_s4, -9.8),
            (t_olahraga, -8.6),
            (t_s5, -9.0),
            (t_dna, -8.2),
            (t_finale, -6.5),
            (total_s - 0.12, -45.0),
        ],
    )
    mix += score * score_env[:, None]

    # 3. Harmonic-Tuned Scientific & Molecular Instruments (A Minor)
    ping = synth_sonar_ping_e7()
    mix_add(mix, ping, t_jaket_bulu, gain_db=-4.2, fade_in_s=0.002, fade_out_s=0.04)
    mix_add(mix, ping, t_dilepas + 0.6, gain_db=-4.0, fade_in_s=0.002, fade_out_s=0.04)
    mix_add(mix, ping, t_rambut, gain_db=-5.0, fade_in_s=0.002, fade_out_s=0.04)

    mon_dur = max(1.2, (t_olahraga - 0.5) - (t_dilepas + 0.4))
    mix_add(mix, synth_diagnostic_monitor_bed(mon_dur, "monitor"), t_dilepas + 0.4, gain_db=-5.2)
    mix_add(mix, synth_diagnostic_monitor_bed(2.4, "morph"), t_10x + 0.3, gain_db=-4.8)

    # C8-D9 Crystalline DNA Molecular Shimmer
    mix_add(mix, synth_dna_chime_cascade(), t_dna - 0.25, gain_db=-3.5, fade_in_s=0.02, fade_out_s=0.25)

    # Sub-bass LUB-DUB heartbeats on Brain Overheat & DNA Switch OFF
    lubdub = synth_sub_heartbeat_lubdub()
    mix_add(mix, lubdub, t_otak - 0.3, gain_db=-7.2, fade_in_s=0.005, fade_out_s=0.08)
    mix_add(mix, lubdub, t_sakelar - 0.1, gain_db=-7.5, fade_in_s=0.005, fade_out_s=0.08)

    # 4. 12 Diegetic ElevenLabs Sound-V3 Rainforest, Savanna & Bio Foley Placements
    sfx_placements = [
        ("sfx_rainforest_mist_bed.mp3", 0.0, -18.5, t_s2 + 1.0, 0.20, 0.60),
        ("sfx_forest_rain_gentle.mp3", t_s2 + 0.4, -18.0, max(2.0, t_iklim - t_s2), 0.30, 0.70),
        ("sfx_climate_dry_wind.mp3", t_iklim - 0.2, -17.5, max(3.0, t_s3 - t_iklim + 1.0), 0.40, 0.60),
        ("sfx_cloud_whoosh.mp3", t_keluar + 1.2, -13.0, 1.0, 0.04, 0.15),
        ("sfx_savanna_run_footsteps.mp3", t_s3 + 0.2, -15.5, max(2.5, t_jaket_bulu - t_s3 + 0.5), 0.15, 0.40),
        ("sfx_heat_overheat_pulse.mp3", t_jaket_bulu - 0.2, -14.5, max(2.0, t_s4 - t_jaket_bulu + 0.3), 0.15, 0.45),
        ("sfx_hologram_xout.mp3", t_dilepas + 0.1, -13.5, 1.1, 0.01, 0.08),
        ("sfx_whip_pan_snap.mp3", t_olahraga - 0.45, -11.8, 0.5, 0.005, 0.08),
        ("sfx_cool_sweat_evap.mp3", t_pendingin - 0.4, -13.5, 3.6, 0.15, 0.45),
        ("sfx_uv_sizzle_pulse.mp3", t_terbuka - 0.2, -16.5, max(2.0, t_baju - t_terbuka + 0.6), 0.20, 0.50),
        ("sfx_hologram_xout.mp3", t_baju + 0.15, -13.5, 1.1, 0.01, 0.08),
        ("sfx_cellular_dive_whoosh.mp3", t_s6 - 0.25, -12.5, 1.1, 0.03, 0.18),
        ("sfx_whip_pan_snap.mp3", t_angin - 0.4, -12.0, 0.5, 0.005, 0.08),
        ("sfx_cold_wind_goosebumps.mp3", t_angin - 0.1, -16.0, max(2.5, t_finale - t_angin + 0.5), 0.20, 0.60),
        ("sfx_rainforest_mist_bed.mp3", t_finale - 0.8, -20.5, max(2.0, total_s - t_finale + 0.6), 0.40, 0.90),
    ]
    for fname, st, gdb, maxd, fi, fo in sfx_placements:
        clip = load_sfx(fname)
        if clip is not None:
            mix_add(mix, clip, st, gain_db=gdb, max_dur_s=maxd, fade_in_s=fi, fade_out_s=fo)

    peak = float(np.max(np.abs(mix)))
    if peak > 0.92:
        mix *= 0.90 / peak

    raw_wav = AUDIO_DIR / "master_mix_raw.wav"
    wavfile.write(str(raw_wav), SR, np.clip(mix, -1.0, 1.0))

    p1 = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-i", str(raw_wav),
            "-af", "loudnorm=I=-14.3:TP=-1.6:LRA=6:print_format=json",
            "-f", "null", "-",
        ],
        capture_output=True, text=True, check=True,
    )
    stats = json.loads(p1.stderr[p1.stderr.rfind("{") : p1.stderr.rfind("}") + 1])

    ln_filter = (
        f"loudnorm=I=-14.3:TP=-1.6:LRA=6:linear=true:"
        f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_wav), "-af", ln_filter, "-ar", str(SR), "-ac", "2", str(OUT_WAV)],
        check=True,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV),
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", str(OUT_M4A),
        ],
        check=True,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV),
            "-lavfi", "showspectrumpic=s=1600x480:scale=log:fscale=log:legend=1:color=intensity",
            str(QA_SPEC_PNG),
        ],
        check=True,
    )

    st_i, st_lra, st_tp = measure_loudness(OUT_M4A, mono=False)
    mo_i, mo_lra, mo_tp = measure_loudness(OUT_M4A, mono=True)
    print(f"=== BROADCAST MASTER VERIFIED ({OUT_M4A.name}) ===")
    print(f"  STEREO : I = {st_i:.2f} LUFS | LRA = {st_lra:.2f} LU | True Peak = {st_tp:.2f} dBTP")
    print(f"  MONO   : I = {mo_i:.2f} LUFS | LRA = {mo_lra:.2f} LU | True Peak = {mo_tp:.2f} dBTP")
    print(f"  SPEC QA: {QA_SPEC_PNG}")


if __name__ == "__main__":
    main()
