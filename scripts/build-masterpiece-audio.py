import os
import math
import wave
import struct
import subprocess
from pathlib import Path

import numpy as np

# Configuration
SR = 48000
DURATION = 16.0
N_SAMPLES = int(SR * DURATION)
BPM = 128.0
BEAT = 60.0 / BPM          # 0.46875s
SIXTEENTH = BEAT / 4.0     # 0.1171875s

STUDIO_DIR = Path(r"d:\PROJECTS\z-automation-studio")
FFMPEG_BIN = STUDIO_DIR / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
SFX_DIR = STUDIO_DIR / ".agents" / "skills" / "sound-effects" / "sfx"
OUT_WAV = STUDIO_DIR / "public" / "assets" / "audio" / "masterpiece-128bpm.wav"
OUT_WAV.parent.mkdir(parents=True, exist_ok=True)


def load_sfx_stereo(rel_path: str, max_dur: float = 4.0) -> np.ndarray:
    """Decode an .ogg/.wav SFX file to 48kHz stereo float32 numpy array via ffmpeg."""
    full_path = SFX_DIR / rel_path
    if not full_path.exists():
        print(f"[WARN] SFX not found: {full_path}")
        return np.zeros((0, 2), dtype=np.float32)
    cmd = [
        str(FFMPEG_BIN), "-y", "-v", "error",
        "-i", str(full_path),
        "-f", "f32le", "-acodec", "pcm_f32le",
        "-ar", str(SR), "-ac", "2",
        "-"
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0 or len(proc.stdout) == 0:
        return np.zeros((0, 2), dtype=np.float32)
    data = np.frombuffer(proc.stdout, dtype=np.float32)
    n_frames = len(data) // 2
    stereo = data[:n_frames * 2].reshape((n_frames, 2)).copy()
    max_frames = int(max_dur * SR)
    if stereo.shape[0] > max_frames:
        stereo = stereo[:max_frames]
    # Normalize peak of loaded SFX to 1.0 so gain staging is predictable
    pk = np.max(np.abs(stereo))
    if pk > 1e-5:
        stereo = stereo / pk
    return stereo


def place_stereo(mix: np.ndarray, clip: np.ndarray, start_sec: float, gain_db: float = 0.0, pan: float = 0.0):
    """Place a stereo clip into the master mix at start_sec with gain_db and stereo pan (-1..+1)."""
    if clip.shape[0] == 0:
        return
    idx = int(round(start_sec * SR))
    if idx >= N_SAMPLES:
        return
    end_idx = min(N_SAMPLES, idx + clip.shape[0])
    seg_len = end_idx - idx
    if seg_len <= 0:
        return
    gain = 10.0 ** (gain_db / 20.0)
    left_pan = math.cos((pan + 1.0) * math.pi / 4.0) * math.sqrt(2.0) * 0.7071
    right_pan = math.sin((pan + 1.0) * math.pi / 4.0) * math.sqrt(2.0) * 0.7071
    mix[idx:end_idx, 0] += clip[:seg_len, 0] * gain * left_pan
    mix[idx:end_idx, 1] += clip[:seg_len, 1] * gain * right_pan


def synth_kick(dur: float = 0.32, punch: float = 1.0) -> np.ndarray:
    """Punchy Apple/Linear electronic kick drum."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    # Pitch envelope: 155 Hz -> 43.65 Hz (F1)
    f_env = 43.65 + 115.0 * np.exp(-t * 36.0)
    phase = 2.0 * np.pi * np.cumsum(f_env) / SR
    amp = np.exp(-t * 9.5) * (1.0 - np.exp(-t * 400.0))
    # Subtle transient click
    click = np.exp(-t * 180.0) * np.sin(2.0 * np.pi * 1200.0 * t) * 0.25 * punch
    sig = np.tanh((np.sin(phase) * amp + click) * 1.35) * 0.85
    return np.column_stack([sig, sig]).astype(np.float32)


def synth_sub_drop(dur: float = 1.4, f_start: float = 95.0, f_end: float = 36.0) -> np.ndarray:
    """Deep cinematic sub-bass drop for transitions and shockwave impact."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    f_env = f_end + (f_start - f_end) * np.exp(-t * 4.5)
    phase = 2.0 * np.pi * np.cumsum(f_env) / SR
    amp = np.exp(-t * 2.2) * np.minimum(1.0, t / 0.012)
    sig = np.tanh(np.sin(phase) * 1.6 + 0.35 * np.sin(2.0 * phase)) * amp * 0.8
    return np.column_stack([sig, sig]).astype(np.float32)


def synth_hihat(dur: float = 0.055, open_hat: bool = False) -> np.ndarray:
    """Crisp metallic stereo hi-hat."""
    if open_hat:
        dur = 0.18
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    rng = np.random.default_rng(42 + int(dur * 1000))
    noise = rng.standard_normal(n).astype(np.float32)
    # Metallic band-pass character via high-frequency ring modulation
    carrier = np.sin(2.0 * np.pi * 6400.0 * t) + 0.6 * np.sin(2.0 * np.pi * 9100.0 * t)
    decay = 16.0 if open_hat else 65.0
    env = np.exp(-t * decay)
    sig_l = noise * carrier * env * 0.35
    sig_r = np.roll(sig_l, 11) * 0.95
    return np.column_stack([sig_l, sig_r]).astype(np.float32)


def synth_clap(dur: float = 0.16) -> np.ndarray:
    """Tight modern snare/clap."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    rng = np.random.default_rng(108)
    noise = rng.standard_normal(n).astype(np.float32)
    # Multi-tap micro-burst envelope at start
    env = (
        0.5 * np.exp(-np.maximum(0.0, t) * 90.0)
        + 0.5 * np.exp(-np.maximum(0.0, t - 0.009) * 80.0)
        + 0.85 * np.exp(-np.maximum(0.0, t - 0.018) * 28.0)
    )
    body = np.sin(2.0 * np.pi * 210.0 * t) * np.exp(-t * 45.0) * 0.45
    sig_l = np.tanh((noise * env * 0.45 + body) * 1.2)
    sig_r = np.tanh((np.roll(noise, 19) * env * 0.45 + body) * 1.2)
    return np.column_stack([sig_l, sig_r]).astype(np.float32)


def synth_reese_bass(freq: float, dur: float, drive: float = 1.4) -> np.ndarray:
    """Dark stereo detuned Reese/cyber bass note."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    # Two detuned saw-like waves + sub fundamental
    f1 = freq * 0.994
    f2 = freq * 1.006
    saw1 = sum(((-1.0) ** k) * np.sin(2.0 * np.pi * k * f1 * t) / k for k in range(1, 7))
    saw2 = sum(((-1.0) ** k) * np.sin(2.0 * np.pi * k * f2 * t) / k for k in range(1, 7))
    sub = np.sin(2.0 * np.pi * freq * t) * 0.9
    # Low-pass filter sweep via envelope
    env = np.minimum(1.0, t / 0.015) * np.exp(-t * 3.2)
    l_ch = np.tanh((sub + saw1 * 0.45) * drive) * env * 0.65
    r_ch = np.tanh((sub + saw2 * 0.45) * drive) * env * 0.65
    return np.column_stack([l_ch, r_ch]).astype(np.float32)


def synth_quantum_pluck(freq: float, dur: float = 0.28) -> np.ndarray:
    """Crystalline FM bell/pluck for Hermes Reasoning & Cream Editorial hits."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    mod_env = np.exp(-t * 28.0) * 2.2
    mod = np.sin(2.0 * np.pi * (freq * 2.0) * t) * mod_env
    car = np.sin(2.0 * np.pi * freq * t + mod)
    shimmer = np.sin(2.0 * np.pi * (freq * 3.0) * t) * np.exp(-t * 35.0) * 0.25
    amp = np.minimum(1.0, t / 0.004) * np.exp(-t * 11.0)
    sig_l = (car + shimmer) * amp * 0.5
    sig_r = np.roll(sig_l, 24) * 0.95
    return np.column_stack([sig_l, sig_r]).astype(np.float32)


def synth_shimmer_chord(freqs: list[float], dur: float = 1.35) -> np.ndarray:
    """Lush metallic light-sweep chord for the z-automation.my.id URL reveal."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    l_ch = np.zeros(n, dtype=np.float32)
    r_ch = np.zeros(n, dtype=np.float32)
    # Smooth attack (light sweep across glass pill) and clean fade before 16.0s loop point
    env = np.sin(np.pi * np.power(t / dur, 0.75)) ** 1.4
    for i, f in enumerate(freqs):
        detune = 1.0 + (i - len(freqs) / 2.0) * 0.0018
        voice_l = np.sin(2.0 * np.pi * f * t) + 0.3 * np.sin(2.0 * np.pi * f * 2.0 * t) * np.exp(-t * 3.0)
        voice_r = np.sin(2.0 * np.pi * (f * detune) * t + 0.4) + 0.3 * np.sin(2.0 * np.pi * f * 2.002 * t) * np.exp(-t * 3.0)
        l_ch += voice_l / len(freqs)
        r_ch += voice_r / len(freqs)
    return np.column_stack([l_ch * env * 0.55, r_ch * env * 0.55]).astype(np.float32)


def main():
    mix = np.zeros((N_SAMPLES, 2), dtype=np.float32)

    # 1. Load Real CC0 SFX from library
    sfx_swoosh_deep = load_sfx_stereo("whoosh/fs-264777-swoosh.ogg")
    sfx_swoosh_quick = load_sfx_stereo("whoosh/fs-683101-quick-woosh.ogg")
    sfx_woosh_trans = load_sfx_stereo("transition/fs-683096-woosh.ogg")
    sfx_swoosh_v2 = load_sfx_stereo("transition/fs-786514-swoosh-v2.ogg")
    sfx_cyber_synapse = load_sfx_stereo("transition/fs-856168-cyberpunk-glitch-hologram-tran.ogg")
    sfx_riser_phaser = load_sfx_stereo("riser/kenney-digital-phaserup2.ogg")
    sfx_glass_ding = load_sfx_stereo("ding/kenney-interface-glass-001.ogg")
    sfx_triangle_shimmer = load_sfx_stereo("ding/fs-349504-triangle-open-04.ogg")
    sfx_click_tick = load_sfx_stereo("click/kenney-interface-tick-001.ogg")
    sfx_click_select = load_sfx_stereo("click/kenney-interface-select-001.ogg")
    sfx_claw_snap = load_sfx_stereo("click/kenney-interface-toggle-001.ogg")
    sfx_data_reveal = load_sfx_stereo("typing/fs-511418-data-reveal-sound.ogg", max_dur=1.2)
    sfx_ui_twotone = load_sfx_stereo("ui-blip/kenney-digital-twotone1.ogg")

    kick = synth_kick(0.32, punch=1.1)
    clap = synth_clap(0.16)
    hat_closed = synth_hihat(0.05, open_hat=False)
    hat_open = synth_hihat(0.16, open_hat=True)

    # =========================================================================
    # SCENE 1: THE IGNITION & HOOK (0.00s - 1.875s | Beats 0..3)
    # =========================================================================
    place_stereo(mix, synth_sub_drop(1.2, 85.0, 41.2), 0.00, gain_db=-2.0)
    place_stereo(mix, sfx_click_tick, 0.01, gain_db=-4.0)
    # Word 1 ("ERA WEB STATIS") mask reveal
    place_stereo(mix, sfx_swoosh_quick, 0.04, gain_db=-7.5, pan=-0.2)
    # Word 2 ("SUDAH Berakhir.") staggered reveal
    place_stereo(mix, sfx_click_select, BEAT * 1.0, gain_db=-6.0, pan=0.2)
    place_stereo(mix, sfx_glass_ding, BEAT * 1.15, gain_db=-8.5, pan=0.25)
    # Subtle 1/8th hi-hat pulse starting Beat 2
    for step in range(4, 8):
        place_stereo(mix, hat_closed, step * (BEAT / 2.0), gain_db=-9.0, pan=(step % 2 - 0.5) * 0.3)
    # Transition 1 -> 2: Z-Axis Zoom-Through "Berakhir." at 1.50s
    place_stereo(mix, sfx_swoosh_deep, 1.44, gain_db=-2.5, pan=0.0)

    # =========================================================================
    # SCENE 2: THE ARCHITECTURAL MONOLITH (1.875s - 3.75s | Beats 4..7)
    # =========================================================================
    place_stereo(mix, kick, 4 * BEAT, gain_db=-1.0)
    place_stereo(mix, synth_reese_bass(43.65, BEAT * 1.8), 4 * BEAT, gain_db=-2.5)
    place_stereo(mix, sfx_data_reveal, 4 * BEAT + 0.02, gain_db=-7.5)
    # Beat 5 (2.344s): "Visi Nyata. Tereksekusi Presisi." lock
    place_stereo(mix, clap, 5 * BEAT, gain_db=-2.5)
    place_stereo(mix, sfx_glass_ding, 5 * BEAT, gain_db=-5.5)
    place_stereo(mix, kick, 6 * BEAT, gain_db=-1.5)
    place_stereo(mix, synth_reese_bass(51.91, BEAT * 1.5), 6 * BEAT, gain_db=-3.0)
    place_stereo(mix, clap, 7 * BEAT, gain_db=-2.5)
    # Transition 2 -> 3: Whip-Pan & Dolly Push-In through Apple Titanium Glass Stage (3.40s)
    place_stereo(mix, sfx_swoosh_v2, 3.38, gain_db=-2.0)

    # =========================================================================
    # SCENE 3: APPLE TITANIUM GLASS STAGE - HERMES REASONING (3.75s - 6.5625s | Beats 8..13)
    # =========================================================================
    # Driving 128 BPM groove + Quantum Arpeggio (F minor: F4, Ab4, C5, Eb5, F5, C5)
    arp_notes = [349.23, 415.30, 523.25, 622.25, 698.46, 523.25, 415.30, 349.23]
    for b in range(8, 14):
        t_beat = b * BEAT
        place_stereo(mix, kick, t_beat, gain_db=-1.0)
        if b % 2 == 1:
            place_stereo(mix, clap, t_beat, gain_db=-2.0)
        # Off-beat open hat
        place_stereo(mix, hat_open, t_beat + BEAT * 0.5, gain_db=-7.5, pan=0.25)
        # Driving off-beat bass
        bass_f = 43.65 if b < 12 else 46.25
        place_stereo(mix, synth_reese_bass(bass_f, BEAT * 0.45), t_beat + BEAT * 0.5, gain_db=-3.5)
        # 16th-note crystalline arpeggio for Hermes orbital rings
        for s in range(4):
            note_f = arp_notes[(b * 4 + s) % len(arp_notes)]
            pan_pos = math.sin((b * 4 + s) * 0.7) * 0.45
            place_stereo(mix, synth_quantum_pluck(note_f, 0.22), t_beat + s * SIXTEENTH, gain_db=-8.5, pan=pan_pos)

    # Beat 9 (4.219s): "HERMES Berpikir." UI lock
    place_stereo(mix, sfx_ui_twotone, 9 * BEAT, gain_db=-5.5, pan=-0.25)

    # =========================================================================
    # SCENE 4: NEURAL SYNAPSE DISPATCH (6.5625s - 8.4375s | Beats 14..17)
    # =========================================================================
    # Lateral Whip-Track following the 26 photon packets from Hermes (Left) to OpenClaw (Right)
    place_stereo(mix, sfx_cyber_synapse, 14 * BEAT, gain_db=-2.5, pan=-0.35)
    place_stereo(mix, sfx_riser_phaser, 14.5 * BEAT, gain_db=-4.0, pan=0.25)
    # Accelerating snare build-up + rising pitch pluck across stereo field
    for step in range(16):
        t_step = 14 * BEAT + step * SIXTEENTH
        pan_sweep = -0.7 + (step / 15.0) * 1.4
        f_rise = 349.23 * (1.0 + step * 0.06)
        place_stereo(mix, synth_quantum_pluck(f_rise, 0.14), t_step, gain_db=-7.0 + step * 0.2, pan=pan_sweep)
        if step % 2 == 0 or step >= 10:
            place_stereo(mix, clap, t_step, gain_db=-5.0 + step * 0.2, pan=pan_sweep * 0.5)

    # =========================================================================
    # SCENE 5: OPENCLAW EXECUTION & 3D SHOCKWAVE (8.4375s - 11.25s | Beats 18..23)
    # =========================================================================
    # Beat 18 (8.4375s): Massive Shockwave Drop + OpenClaw Pincer Snap!
    place_stereo(mix, synth_sub_drop(1.3, 110.0, 38.0), 18 * BEAT, gain_db=0.0)
    place_stereo(mix, sfx_claw_snap, 18 * BEAT, gain_db=-1.5, pan=0.3)
    place_stereo(mix, sfx_claw_snap, 18 * BEAT + 0.14, gain_db=-2.5, pan=0.35)
    # Beat 19 (8.906s): "OPENCLAW Mengeksekusi." Shockwave Ring Expansion
    place_stereo(mix, synth_sub_drop(1.1, 95.0, 43.65), 19 * BEAT, gain_db=-1.0)
    place_stereo(mix, sfx_swoosh_deep, 19 * BEAT, gain_db=-3.0)

    for b in range(18, 24):
        t_beat = b * BEAT
        place_stereo(mix, kick, t_beat, gain_db=-0.5)
        if b % 2 == 1:
            place_stereo(mix, clap, t_beat, gain_db=-1.5)
        place_stereo(mix, hat_open, t_beat + BEAT * 0.5, gain_db=-6.5)
        bass_f = 43.65 if b % 2 == 0 else 58.27
        place_stereo(mix, synth_reese_bass(bass_f, BEAT * 0.85, drive=1.7), t_beat, gain_db=-2.5)

    # Transition 5 -> 6 (10.90s): Z-Axis Zoom-Through Shockwave into Editorial Cream Flip
    place_stereo(mix, sfx_swoosh_quick, 10.88, gain_db=-1.5)

    # =========================================================================
    # SCENE 6: EDITORIAL CREAM FLIP - 3 PILLARS (11.25s - 13.125s | Beats 24..27)
    # =========================================================================
    # High-contrast clean percussion + 3 ascending tonal glass/marimba locks
    pillar_freqs = [523.25, 622.25, 783.99]  # C5, Eb5, G5
    for i, b in enumerate([24, 25, 26]):
        t_hit = b * BEAT
        place_stereo(mix, kick, t_hit, gain_db=-2.0)
        place_stereo(mix, sfx_click_select, t_hit, gain_db=-3.5)
        place_stereo(mix, synth_quantum_pluck(pillar_freqs[i], 0.38), t_hit, gain_db=-3.0)
        place_stereo(mix, sfx_glass_ding, t_hit + 0.02, gain_db=-6.5)

    # Beat 27 (12.656s): Transition Zoom-Through back to Obsidian Void
    place_stereo(mix, sfx_woosh_trans, 12.72, gain_db=-1.5)

    # =========================================================================
    # SCENE 7 & 8: ORBITAL CONVERGENCE & PURE URL LOCK (13.125s - 16.00s | Beats 28..31)
    # =========================================================================
    # Beat 28 (13.125s): Orbital rings converge into Apple Titanium Glass Pill
    place_stereo(mix, synth_sub_drop(1.6, 75.0, 43.65), 28 * BEAT, gain_db=-1.5)
    place_stereo(mix, sfx_swoosh_v2, 28 * BEAT + 0.10, gain_db=-4.5)
    # 13.95s: Glass Pill locks in center
    place_stereo(mix, sfx_click_select, 13.95, gain_db=-3.0)

    # 14.06s - 14.82s: Live typing of "z-automation.my.id" (18 characters)
    url_text = "z-automation.my.id"
    type_start = 14.06
    type_dur = 0.74
    char_step = type_dur / len(url_text)
    for idx_ch in range(len(url_text)):
        t_ch = type_start + idx_ch * char_step
        pan_ch = -0.35 + (idx_ch / len(url_text)) * 0.7
        place_stereo(mix, sfx_click_tick, t_ch, gain_db=-5.5, pan=pan_ch)
        # Subtle ascending harmonic tick per character
        ch_freq = 880.0 + idx_ch * 32.0
        place_stereo(mix, synth_quantum_pluck(ch_freq, 0.045), t_ch, gain_db=-14.0, pan=pan_ch)

    # 14.85s - 16.00s: Metallic Light Sweep across "z-automation.my.id" + Seamless Loop Fade
    shimmer_chord = synth_shimmer_chord([174.61, 261.63, 349.23, 415.30, 523.25, 659.25], dur=1.12)
    place_stereo(mix, shimmer_chord, 14.84, gain_db=-2.0)
    place_stereo(mix, sfx_triangle_shimmer, 14.85, gain_db=-6.0)
    place_stereo(mix, sfx_glass_ding, 14.85, gain_db=-5.0)

    # Apply smooth master fade-in (first 15ms) and loop-ready fade-out (last 60ms)
    fade_in = int(0.015 * SR)
    fade_out = int(0.060 * SR)
    mix[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)[:, None]
    mix[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)[:, None]

    # Soft-clip limiter & calibrate to ~ -16 LUFS integrated with true peak < -3.5 dBFS
    mix = np.tanh(mix * 0.95)
    rms = np.sqrt(np.mean(mix ** 2))
    target_rms = 10.0 ** (-16.0 / 20.0)  # approx -16 dBFS RMS
    if rms > 1e-6:
        mix *= (target_rms / rms)
    # Hard ceiling at -3.5 dBFS (0.668)
    ceiling = 10.0 ** (-3.5 / 20.0)
    peak = np.max(np.abs(mix))
    if peak > ceiling:
        mix *= (ceiling / peak)

    # Write 16-bit PCM WAV
    pcm16 = np.clip(mix * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(OUT_WAV), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm16.tobytes())

    print(f"[OK] Wrote master soundtrack: {OUT_WAV} ({OUT_WAV.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
