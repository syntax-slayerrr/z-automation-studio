import io
import math
import wave
import tempfile
import subprocess
from pathlib import Path

import numpy as np

# ============================================================================
# 1:1 Reference-Timed Audio Engine for Z-Automation Launch (14.84s @ 120 BPM)
# Act 1 (0.00s - 4.00s): 100% Music-Free Intimate Tactile Foley
# Acts 2-4 (4.00s - 14.84s): Warm 120 BPM Rhodes/Juno Synth-Funk + Real Foley
# ============================================================================

SR = 48000
DURATION = 14.84
N_SAMPLES = int(round(SR * DURATION))
BPM = 120.0
BEAT = 60.0 / BPM  # 0.50s exact!

STUDIO_DIR = Path(r"d:\PROJECTS\z-automation-studio")
FFMPEG_BIN = STUDIO_DIR / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
SFX_DIR = STUDIO_DIR / ".agents" / "skills" / "sound-effects" / "sfx"
SITE_SFX_DIR = STUDIO_DIR / "public" / "assets" / "audio" / "site-sfx"
OUT_WAV = STUDIO_DIR / "public" / "assets" / "audio" / "z-launch-1to1.wav"
OUT_WAV.parent.mkdir(parents=True, exist_ok=True)


def decode_audio_file(full_path: Path, max_dur: float = 5.0) -> np.ndarray:
    """Decode any .ogg/.wav/.mp3 file to 48kHz stereo float32 using PCM WAV (supported in Remotion FFmpeg)."""
    if not full_path.exists():
        print(f"[WARN] Missing audio file: {full_path}")
        return np.zeros((0, 2), dtype=np.float32)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        cmd = [
            str(FFMPEG_BIN), "-y", "-v", "error",
            "-i", str(full_path),
            "-acodec", "pcm_s16le",
            "-ar", str(SR),
            "-ac", "2",
            str(tmp_path),
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0 or not tmp_path.exists() or tmp_path.stat().st_size < 64:
            err = proc.stderr.decode("utf-8", errors="ignore").strip()
            print(f"[ERROR] Failed decoding {full_path.name}: {err}")
            return np.zeros((0, 2), dtype=np.float32)

        with wave.open(str(tmp_path), "rb") as wf:
            n_frames = wf.getnframes()
            raw = wf.readframes(n_frames)
        pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        stereo = pcm.reshape((-1, 2)).copy()
        max_frames = int(max_dur * SR)
        if stereo.shape[0] > max_frames:
            stereo = stereo[:max_frames]
        pk = float(np.max(np.abs(stereo))) if stereo.shape[0] > 0 else 0.0
        if pk > 1e-5:
            stereo /= pk
        return stereo
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass


def trim_silence(clip: np.ndarray, threshold: float = 0.03) -> np.ndarray:
    if clip.shape[0] == 0:
        return clip
    env = np.max(np.abs(clip), axis=1)
    idx = np.where(env >= threshold)[0]
    if len(idx) == 0:
        return clip
    start = max(0, int(idx[0]) - int(0.004 * SR))
    end = min(clip.shape[0], int(idx[-1]) + int(0.08 * SR))
    return clip[start:end].copy()


def fade_edges(clip: np.ndarray, fade_in_ms: float = 3.0, fade_out_ms: float = 20.0) -> np.ndarray:
    if clip.shape[0] == 0:
        return clip
    out = clip.copy()
    fi = min(out.shape[0], int(SR * fade_in_ms / 1000.0))
    fo = min(out.shape[0], int(SR * fade_out_ms / 1000.0))
    if fi > 1:
        out[:fi] *= np.linspace(0.0, 1.0, fi, dtype=np.float32)[:, None]
    if fo > 1:
        out[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)[:, None]
    return out


def pitch_shift_resample(clip: np.ndarray, ratio: float) -> np.ndarray:
    """Simple clean linear pitch/speed resample (>1.0 = higher/snappier, <1.0 = deeper)."""
    if clip.shape[0] < 4 or abs(ratio - 1.0) < 1e-3:
        return clip
    new_len = max(2, int(round(clip.shape[0] / ratio)))
    x_old = np.linspace(0.0, 1.0, clip.shape[0], dtype=np.float32)
    x_new = np.linspace(0.0, 1.0, new_len, dtype=np.float32)
    left = np.interp(x_new, x_old, clip[:, 0])
    right = np.interp(x_new, x_old, clip[:, 1])
    return np.column_stack([left, right]).astype(np.float32)


def place(mix: np.ndarray, clip: np.ndarray, start_sec: float, gain_db: float = 0.0, pan: float = 0.0):
    if clip.shape[0] == 0:
        return
    idx = int(round(start_sec * SR))
    if idx < 0:
        clip = clip[-idx:]
        idx = 0
    if idx >= N_SAMPLES or clip.shape[0] == 0:
        return
    end_idx = min(N_SAMPLES, idx + clip.shape[0])
    seg_len = end_idx - idx
    if seg_len <= 0:
        return
    gain = 10.0 ** (gain_db / 20.0)
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    l_gain = math.cos(angle) * 1.4142 * 0.7071 * gain
    r_gain = math.sin(angle) * 1.4142 * 0.7071 * gain
    mix[idx:end_idx, 0] += clip[:seg_len, 0] * l_gain
    mix[idx:end_idx, 1] += clip[:seg_len, 1] * r_gain


# ============================================================================
# Warm Musical Instruments (120 BPM Rhodes / Juno / Funk Bass / Tight Drums)
# ============================================================================

def midi_to_hz(m: float) -> float:
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))


def warm_kick(dur: float = 0.26) -> np.ndarray:
    """Round, warm, punchy indie-electronic / French-touch kick."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    f_env = 49.0 + 98.0 * np.exp(-t * 42.0)
    phase = 2.0 * np.pi * np.cumsum(f_env) / SR
    body = np.sin(phase) * np.exp(-t * 11.5) * (1.0 - np.exp(-t * 500.0))
    transient = np.sin(2.0 * np.pi * 920.0 * t) * np.exp(-t * 220.0) * 0.16
    sig = np.tanh((body + transient) * 1.25) * 0.85
    return np.column_stack([sig, sig]).astype(np.float32)


def crisp_clap_snare(dur: float = 0.14, seed: int = 7) -> np.ndarray:
    """Tight dry neo-soul/electronic snare-clap."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    # Micro multi-tap clap flam (0ms, 9ms, 17ms)
    env = (
        0.55 * np.exp(-np.maximum(0.0, t) * 90.0)
        + 0.65 * (t >= 0.008) * np.exp(-np.maximum(0.0, t - 0.008) * 80.0)
        + 0.85 * (t >= 0.016) * np.exp(-np.maximum(0.0, t - 0.016) * 34.0)
    )
    noise_l = rng.standard_normal(n).astype(np.float32)
    noise_r = rng.standard_normal(n).astype(np.float32)
    # Band-shape via difference + moving average
    noise_l = np.convolve(noise_l - np.roll(noise_l, 1), np.ones(4) / 4.0, mode="same")
    noise_r = np.convolve(noise_r - np.roll(noise_r, 1), np.ones(4) / 4.0, mode="same")
    wood = np.sin(2.0 * np.pi * (215.0 + 80.0 * np.exp(-t * 80.0)) * t) * np.exp(-t * 55.0) * 0.35
    l = (noise_l * env * 0.65 + wood) * 0.75
    r = (noise_r * env * 0.65 + wood) * 0.75
    return np.column_stack([l, r]).astype(np.float32)


def silky_hat(dur: float = 0.055, open_hat: bool = False, seed: int = 19) -> np.ndarray:
    rng = np.random.default_rng(seed)
    actual_dur = 0.18 if open_hat else dur
    n = int(actual_dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    decay = 16.0 if open_hat else 68.0
    n_l = rng.standard_normal(n).astype(np.float32)
    n_r = rng.standard_normal(n).astype(np.float32)
    hp_l = n_l - np.roll(n_l, 1)
    hp_r = n_r - np.roll(n_r, 1)
    env = np.exp(-t * decay) * (1.0 - np.exp(-t * 800.0))
    return np.column_stack([hp_l * env * 0.25, hp_r * env * 0.25]).astype(np.float32)


def rhodes_chord(midi_notes: list[int], dur: float) -> np.ndarray:
    """Warm Fender Rhodes / Juno chorus electric piano chord."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    left = np.zeros(n, dtype=np.float32)
    right = np.zeros(n, dtype=np.float32)

    env = (1.0 - np.exp(-t * 65.0)) * np.exp(-t * 1.45)
    # Gentle stereo tremolo/chorus like real Rhodes Suitcase
    trem_l = 0.88 + 0.12 * np.sin(2.0 * np.pi * 4.2 * t)
    trem_r = 0.88 + 0.12 * np.cos(2.0 * np.pi * 4.2 * t)

    for idx, m in enumerate(midi_notes):
        f = midi_to_hz(m)
        # Tine bell FM + warm fundamental
        mod = 0.42 * np.exp(-t * 9.0) * np.sin(2.0 * np.pi * (f * 2.0) * t)
        bell = 0.08 * np.exp(-t * 18.0) * np.sin(2.0 * np.pi * (f * 7.0) * t)
        voice_l = np.sin(2.0 * np.pi * f * t + mod) + bell
        voice_r = np.sin(2.0 * np.pi * (f * 1.0018) * t + mod) + bell
        pan_w = -0.22 + 0.44 * (idx / max(1, len(midi_notes) - 1))
        left += voice_l * (0.5 - pan_w * 0.3)
        right += voice_r * (0.5 + pan_w * 0.3)

    norm = max(1.0, len(midi_notes) * 0.55)
    out = np.column_stack([left * env * trem_l / norm, right * env * trem_r / norm]).astype(np.float32)
    return fade_edges(out, 5.0, 45.0)


def funk_bass_note(midi_note: int, dur: float) -> np.ndarray:
    """Bouncy warm sub + filtered saw-pluck electric bass."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    f = midi_to_hz(midi_note)
    env = (1.0 - np.exp(-t * 180.0)) * np.exp(-t * 3.8)
    filt_env = np.exp(-t * 14.0)
    sig = (
        0.72 * np.sin(2.0 * np.pi * f * t)
        + 0.28 * filt_env * np.sin(2.0 * np.pi * (f * 2.0) * t)
        + 0.12 * (filt_env ** 2) * np.sin(2.0 * np.pi * (f * 3.0) * t)
    )
    sig = np.tanh(sig * env * 1.35) * 0.8
    out = np.column_stack([sig, sig]).astype(np.float32)
    return fade_edges(out, 3.0, 22.0)


def sparkle_arp_note(midi_note: int, dur: float = 0.28) -> np.ndarray:
    """Delicate glassy marimba/celesta sparkle note."""
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float32) / SR
    f = midi_to_hz(midi_note)
    env = (1.0 - np.exp(-t * 250.0)) * np.exp(-t * 9.5)
    sig_l = (np.sin(2.0 * np.pi * f * t) + 0.22 * np.exp(-t * 24.0) * np.sin(2.0 * np.pi * f * 3.0 * t)) * env
    sig_r = (np.sin(2.0 * np.pi * f * 1.002 * t) + 0.22 * np.exp(-t * 24.0) * np.sin(2.0 * np.pi * f * 3.0 * t)) * env
    return np.column_stack([sig_l * 0.45, sig_r * 0.45]).astype(np.float32)


def extract_keystrokes(typing_clip: np.ndarray, count: int = 20) -> list[np.ndarray]:
    """Slice individual crisp mechanical keystrokes from a real recorded typing file."""
    if typing_clip.shape[0] == 0:
        return []
    env = np.max(np.abs(typing_clip), axis=1)
    win = int(0.015 * SR)
    peaks: list[int] = []
    i = int(0.02 * SR)
    while i < len(env) - int(0.09 * SR):
        if env[i] > 0.18 and env[i] >= np.max(env[max(0, i - win):min(len(env), i + win)]):
            peaks.append(i)
            i += int(0.095 * SR)
        else:
            i += int(0.003 * SR)

    strokes: list[np.ndarray] = []
    for p in peaks:
        s = max(0, p - int(0.005 * SR))
        e = min(typing_clip.shape[0], p + int(0.075 * SR))
        seg = fade_edges(typing_clip[s:e], 2.0, 22.0)
        pk = float(np.max(np.abs(seg)))
        if pk > 0.05:
            strokes.append(seg / pk)
    if not strokes:
        strokes.append(fade_edges(typing_clip[:int(0.08 * SR)], 2.0, 22.0))
    return [strokes[k % len(strokes)] for k in range(count)]


def apply_warm_reverb_bus(stereo: np.ndarray, wet: float = 0.14) -> np.ndarray:
    """Subtle lush stereo room tail so Foley & Rhodes sit in the same acoustic space."""
    out = stereo.copy()
    taps = [
        (0.023, 0.34, True),
        (0.041, 0.26, False),
        (0.067, 0.19, True),
        (0.103, 0.13, False),
        (0.149, 0.08, True),
    ]
    rev = np.zeros_like(stereo)
    for delay_s, gain, swap in taps:
        d = int(delay_s * SR)
        if d < stereo.shape[0]:
            src = stereo[:-d, ::-1] if swap else stereo[:-d]
            rev[d:] += src * gain
    # Gentle low-pass on reverb tail
    kernel = np.array([0.15, 0.25, 0.2, 0.25, 0.15], dtype=np.float32)
    rev[:, 0] = np.convolve(rev[:, 0], kernel, mode="same")
    rev[:, 1] = np.convolve(rev[:, 1], kernel, mode="same")
    return out + rev * wet


def main():
    print("=== Building 1:1 Z-Automation Reference Audio (14.84s @ 48kHz) ===")

    # 1. Load Real Recorded Foley & Website UI SFX
    sfx_typing_mech = decode_audio_file(SFX_DIR / "typing" / "fs-447909-keyboard-typing.ogg", 5.0)
    sfx_typing_alt = decode_audio_file(SFX_DIR / "typing" / "fs-79388-keyboard-typing-wav.ogg", 5.0)
    sfx_mouse_click = trim_silence(decode_audio_file(SFX_DIR / "click" / "fs788933.ogg", 1.5))
    sfx_ui_btn = trim_silence(decode_audio_file(SFX_DIR / "pop" / "fs-467951-ui-button-click.ogg", 1.5))
    sfx_swoosh_pan = trim_silence(decode_audio_file(SFX_DIR / "transition" / "fs-786514-swoosh-v2.ogg", 2.0))
    sfx_swoosh_soft = trim_silence(decode_audio_file(SFX_DIR / "whoosh" / "fs-169867-swoosh.ogg", 2.0))
    sfx_swoosh_deep = trim_silence(decode_audio_file(SFX_DIR / "whoosh" / "fs-264777-swoosh.ogg", 2.0))
    sfx_swoosh_quick = trim_silence(decode_audio_file(SFX_DIR / "whoosh" / "fs-683101-quick-woosh.ogg", 1.5))
    sfx_swipe = trim_silence(decode_audio_file(SFX_DIR / "transition" / "fs-702773-swipe-wav.ogg", 2.0))
    sfx_riser = decode_audio_file(SFX_DIR / "riser" / "fs-685256-riser-sound-effect-short-wav.ogg", 2.5)
    sfx_pop_in = trim_silence(decode_audio_file(SFX_DIR / "pop" / "fs-824189-pop-in-sfx.ogg", 1.0))
    sfx_plop = trim_silence(decode_audio_file(SFX_DIR / "pop" / "fs-447910-plop.ogg", 1.0))
    sfx_pluck1 = trim_silence(decode_audio_file(SFX_DIR / "pop" / "kenney-interface-pluck-001.ogg", 1.0))
    sfx_pluck2 = trim_silence(decode_audio_file(SFX_DIR / "pop" / "kenney-interface-pluck-002.ogg", 1.0))
    sfx_glass = trim_silence(decode_audio_file(SFX_DIR / "ding" / "kenney-interface-glass-001.ogg", 1.5))
    sfx_bell = trim_silence(decode_audio_file(SFX_DIR / "ding" / "fs-571513-soft-notifications-bell-ding-d.ogg", 2.5))
    sfx_confirm = trim_silence(decode_audio_file(SFX_DIR / "ding" / "kenney-interface-confirmation-002.ogg", 1.5))

    # Real Z-Automation Website UI Sounds
    site_click0 = trim_silence(decode_audio_file(SITE_SFX_DIR / "click_0.ogg", 1.0))
    site_click1 = trim_silence(decode_audio_file(SITE_SFX_DIR / "click_1.ogg", 1.0))
    site_focus0 = trim_silence(decode_audio_file(SITE_SFX_DIR / "focus_0.ogg", 1.5))
    site_focus1 = trim_silence(decode_audio_file(SITE_SFX_DIR / "focus_1.ogg", 1.5))
    site_hover0 = trim_silence(decode_audio_file(SITE_SFX_DIR / "hover_0.ogg", 1.0))
    site_page0 = trim_silence(decode_audio_file(SITE_SFX_DIR / "page_0.ogg", 1.5))
    site_cine2 = trim_silence(decode_audio_file(SITE_SFX_DIR / "cinematic_2.ogg", 3.0))

    print(
        f"Decoded Foley samples -> typing:{sfx_typing_mech.shape[0]}, click:{sfx_mouse_click.shape[0]}, "
        f"swoosh:{sfx_swoosh_pan.shape[0]}, pop:{sfx_pop_in.shape[0]}, site_click:{site_click0.shape[0]}"
    )

    foley_bus = np.zeros((N_SAMPLES, 2), dtype=np.float32)
    music_bus = np.zeros((N_SAMPLES, 2), dtype=np.float32)

    # ========================================================================
    # ACT 1 (0.00s - 4.00s): PURE INTIMATE FOLEY (NO MUSIC!)
    # ========================================================================
    # 0.03s: Liquid glass pill scale-in & rack focus
    place(foley_bus, fade_edges(sfx_swoosh_soft, 8.0, 80.0), 0.03, gain_db=-10.5, pan=0.0)
    place(foley_bus, site_focus0, 0.08, gain_db=-11.0, pan=0.0)

    # 0.70s - 1.84s: Typing "z-automation.my.id" (18 characters)
    strokes_a = extract_keystrokes(sfx_typing_mech, 18)
    strokes_b = extract_keystrokes(sfx_typing_alt, 18)
    typed_text = "z-automation.my.id"
    # Natural human typing cadence (faster bursts on familiar syllables, slight pause on '-' and '.')
    char_times = [
        0.70, 0.76,  # z -
        0.83, 0.88, 0.93, 0.98, 1.04, 1.09, 1.15, 1.20, 1.25, 1.31,  # automation
        1.39,  # .
        1.46, 1.52,  # my
        1.60,  # .
        1.67, 1.74,  # id
    ]
    for idx, t_char in enumerate(char_times):
        ch = typed_text[idx]
        base_clip = strokes_a[idx] if idx % 3 != 2 else strokes_b[idx]
        ratio = 1.0 + ((idx * 7) % 5 - 2) * 0.035
        if ch in "-.":
            ratio = 0.93
        stroke = pitch_shift_resample(base_clip, ratio)
        pan_pos = -0.22 + (idx / 18.0) * 0.16
        gain = -7.5 + ((idx * 3) % 4) * 0.6
        place(foley_bus, stroke, t_char, gain_db=gain, pan=pan_pos)

    # 2.00s - 2.33s: Smooth whip-pan from left of pill to right button ("Mulai Otomasi")
    place(foley_bus, fade_edges(sfx_swoosh_pan, 10.0, 90.0), 1.98, gain_db=-8.5, pan=0.12)
    place(foley_bus, site_page0, 2.03, gain_db=-12.0, pan=0.22)

    # 2.70s: 3D Frosted Glass Cursor enters from top-left
    place(foley_bus, site_hover0, 2.72, gain_db=-13.0, pan=-0.25)
    place(foley_bus, pitch_shift_resample(sfx_swoosh_quick, 1.25), 2.75, gain_db=-14.5, pan=-0.1)

    # 3.15s (Frame 189 @ 60fps / Ref F095): Tactile 3D Glass Cursor Click + Shock-Ripple!
    place(foley_bus, sfx_mouse_click, 3.14, gain_db=-3.5, pan=0.05)
    place(foley_bus, site_click0, 3.15, gain_db=-5.5, pan=0.05)
    place(foley_bus, sfx_ui_btn, 3.155, gain_db=-8.0, pan=0.05)
    place(foley_bus, pitch_shift_resample(sfx_glass, 1.15), 3.19, gain_db=-12.5, pan=0.08)

    # 3.50s - 4.00s: Button luminous flood & exponential portal zoom riser into Act 2!
    if sfx_riser.shape[0] > 0:
        # Align peak of riser right at 4.00s
        riser_seg = sfx_riser[-min(sfx_riser.shape[0], int(0.58 * SR)):]
        riser_seg = fade_edges(riser_seg, 35.0, 8.0)
        place(foley_bus, riser_seg, 4.01 - riser_seg.shape[0] / SR, gain_db=-8.5, pan=0.0)
    place(foley_bus, fade_edges(sfx_swoosh_deep, 15.0, 60.0), 3.84, gain_db=-6.5, pan=0.0)

    # ========================================================================
    # ACTS 2, 3, 4 FOLEY CUES (4.00s - 13.50s)
    # ========================================================================
    # 4.00s: Portal burst + Red OpenClaw foreground fly-by whoosh (bottom-right -> top-left)
    place(foley_bus, site_cine2, 3.98, gain_db=-9.5, pan=0.0)
    place(foley_bus, pitch_shift_resample(sfx_swoosh_pan, 0.92), 4.02, gain_db=-7.5, pan=-0.25)

    # 4.40s: Hermes floats forward into bottom-left foreground
    place(foley_bus, fade_edges(sfx_swoosh_soft, 20.0, 90.0), 4.38, gain_db=-12.5, pan=-0.30)

    # 4.83s, 5.00s, 5.17s, 5.33s: "Bangun" / "Sistem" / "Otomasi" / "sekarang" pop-ins
    place(foley_bus, pitch_shift_resample(sfx_pop_in, 1.05), 4.83, gain_db=-10.5, pan=-0.08)
    place(foley_bus, pitch_shift_resample(sfx_pop_in, 1.15), 5.00, gain_db=-10.5, pan=0.08)
    place(foley_bus, pitch_shift_resample(sfx_plop, 1.08), 5.17, gain_db=-8.5, pan=0.0)
    place(foley_bus, pitch_shift_resample(sfx_pop_in, 1.22), 5.33, gain_db=-11.0, pan=0.0)

    # 5.75s: Warm iridescent shimmer across "Otomasi"
    place(foley_bus, fade_edges(sfx_bell, 5.0, 180.0), 5.72, gain_db=-13.5, pan=0.1)

    # 7.00s: 3D iPhone drops in from top-right & Hermes exits downward
    place(foley_bus, sfx_swipe, 6.98, gain_db=-6.8, pan=0.18)
    place(foley_bus, sfx_swoosh_deep, 7.04, gain_db=-8.5, pan=0.10)
    place(foley_bus, site_focus1, 7.52, gain_db=-11.5, pan=0.0)

    # 8.50s: iPhone zooms out & docks to right third
    place(foley_bus, sfx_swoosh_quick, 8.50, gain_db=-8.5, pan=0.28)

    # 8.67s, 8.83s, 8.97s, 9.15s: Rubber-band scaleX word snaps ("lewat" "Web 3D" "dan" "Agen AI")
    place(foley_bus, pitch_shift_resample(sfx_pluck1, 1.00), 8.67, gain_db=-9.5, pan=-0.28)
    place(foley_bus, pitch_shift_resample(sfx_pluck2, 1.12), 8.83, gain_db=-8.5, pan=-0.20)
    place(foley_bus, pitch_shift_resample(sfx_pluck1, 1.18), 8.97, gain_db=-10.0, pan=-0.28)
    place(foley_bus, pitch_shift_resample(sfx_pluck2, 1.28), 9.15, gain_db=-8.0, pan=-0.16)
    place(foley_bus, fade_edges(sfx_glass, 3.0, 120.0), 9.18, gain_db=-13.5, pan=-0.15)

    # 10.52s: 3D Y-axis whip-spin blur transition into center mascot!
    place(foley_bus, pitch_shift_resample(sfx_swoosh_pan, 1.12), 10.51, gain_db=-6.2, pan=0.0)
    place(foley_bus, sfx_swipe, 10.56, gain_db=-8.5, pan=-0.1)
    place(foley_bus, pitch_shift_resample(sfx_pop_in, 0.92), 10.85, gain_db=-9.5, pan=0.0)

    # 11.40s - 11.95s: Mascot squash-and-stretch anticipation lean & happy bounce!
    place(foley_bus, pitch_shift_resample(sfx_plop, 0.95), 11.40, gain_db=-8.5, pan=-0.05)
    place(foley_bus, pitch_shift_resample(sfx_pop_in, 1.25), 11.68, gain_db=-9.0, pan=0.05)

    # 11.96s: Emblem snaps left + "Z-Automation" wordmark stretches & locks cleanly!
    place(foley_bus, site_click1, 11.96, gain_db=-6.5, pan=-0.08)
    place(foley_bus, sfx_confirm, 11.98, gain_db=-8.5, pan=0.06)

    # ========================================================================
    # ACTS 2-4 MUSIC GROOVE (4.00s - 14.20s @ 120.0 BPM, Beat = 0.50s)
    # Bright, uplifting Neo-Soul / French-Touch Synth-Funk (Zero dark techno!)
    # ========================================================================
    t0 = 4.00  # Beat 0 of music drop!
    kick_clip = warm_kick()
    snare_clip = crisp_clap_snare()
    hat_closed = silky_hat(open_hat=False)
    hat_open = silky_hat(open_hat=True)

    # 4-bar chord progression (16 beats = 8.0s, plus warm final resolution chord at beat 16 = 12.00s!)
    # Bar 1 (4.00s - 6.00s): Fmaj9   [F3, A3, C4, E4, G4]
    # Bar 2 (6.00s - 8.00s): Em7     [E3, G3, B3, D4, G4]
    # Bar 3 (8.00s - 10.00s): Dm9    [D3, F3, A3, C4, E4]
    # Bar 4 (10.00s - 12.00s): G13   [G3, F4, A4, B4, E5]
    # Bar 5 (12.00s - 14.30s): Cmaj9 [C3, G3, B3, D4, E4, G4] (Brand Lockup resolution right on 12.00s!)
    chord_schedule = [
        # Bar 1 (4.0s)
        (0.0, 1.5, [53, 57, 60, 64, 67], -8.5),
        (1.5, 2.5, [53, 57, 60, 64, 69], -9.0),
        # Bar 2 (6.0s)
        (4.0, 1.5, [52, 55, 59, 62, 67], -8.5),
        (5.5, 2.5, [52, 55, 59, 64, 67], -9.0),
        # Bar 3 (8.0s)
        (8.0, 1.5, [50, 53, 57, 60, 64], -8.5),
        (9.5, 2.5, [50, 53, 57, 60, 65], -9.0),
        # Bar 4 (10.0s)
        (12.0, 1.5, [55, 59, 62, 65, 69], -8.5),
        (13.5, 2.5, [55, 60, 64, 65, 69], -8.8),
        # Bar 5 Resolution right on "Z-Automation" wordmark snap at 12.00s (beat 16.0)!
        (16.0, 4.6, [48, 55, 59, 62, 64, 67, 71], -7.5),
    ]
    for b_start, b_dur, notes, g_db in chord_schedule:
        place(music_bus, rhodes_chord(notes, b_dur * BEAT), t0 + b_start * BEAT, gain_db=g_db, pan=0.0)

    # Bouncy Syncopated Funk Bassline (Beats 0..16, then warm sustain at Beat 16 = 12.00s)
    bass_notes = [
        # Bar 1: F2
        (0.0, 0.75, 41), (0.75, 0.5, 41), (1.5, 1.0, 45), (2.5, 0.75, 48), (3.25, 0.75, 45),
        # Bar 2: E2
        (4.0, 0.75, 40), (4.75, 0.5, 40), (5.5, 1.0, 43), (6.5, 0.75, 47), (7.25, 0.75, 43),
        # Bar 3: D2
        (8.0, 0.75, 38), (8.75, 0.5, 38), (9.5, 1.0, 41), (10.5, 0.75, 45), (11.25, 0.75, 43),
        # Bar 4: G2 -> C2
        (12.0, 0.75, 43), (12.75, 0.5, 43), (13.5, 1.0, 45), (14.5, 0.75, 47), (15.25, 0.75, 43),
        # Bar 5 (12.00s): Warm root C2 sustain
        (16.0, 4.2, 36),
    ]
    for b_start, b_dur, m_note in bass_notes:
        place(music_bus, funk_bass_note(m_note, b_dur * BEAT), t0 + b_start * BEAT, gain_db=-6.2, pan=0.0)

    # Playful Sparkle Synth Arpeggio Motifs on Key Visual Moments
    sparkle_notes = [
        # 4.0s portal burst upward sparkle
        (0.0, 72), (0.25, 76), (0.5, 79), (0.75, 84),
        # 5.5s "Otomasi" shimmer
        (3.5, 76), (3.75, 79), (4.0, 83),
        # 7.0s iPhone entrance sparkle
        (6.0, 74), (6.25, 79), (6.5, 83),
        # 9.15s "Agen AI" shimmer
        (10.25, 76), (10.5, 81), (10.75, 84),
        # 12.0s "Z-Automation" lockup resolution bell-arp
        (16.0, 72), (16.25, 76), (16.5, 79), (16.75, 83), (17.0, 84),
    ]
    for idx, (b_start, m_note) in enumerate(sparkle_notes):
        pan_p = -0.3 + 0.6 * ((idx * 3) % 5) / 4.0
        place(music_bus, sparkle_arp_note(m_note, 0.42), t0 + b_start * BEAT, gain_db=-10.5, pan=pan_p)

    # Crisp 120 BPM Drum Groove from Beat 0 (4.00s) through Beat 16 (12.00s)
    for beat_idx in range(17):
        bt_sec = t0 + beat_idx * BEAT
        if beat_idx == 16:
            # Final soft downbeat kick on 12.00s wordmark lockup, then drums rest so chord rings out cleanly!
            place(music_bus, kick_clip, bt_sec, gain_db=-5.5, pan=0.0)
            place(music_bus, hat_open, bt_sec, gain_db=-11.5, pan=0.18)
            break

        # Kick on every quarter beat + funky syncopated ghost kicks before bar turns
        place(music_bus, kick_clip, bt_sec, gain_db=-4.2, pan=0.0)
        if beat_idx % 4 == 2:
            place(music_bus, kick_clip, bt_sec + 0.75 * BEAT, gain_db=-7.8, pan=0.0)

        # Snappy clap/snare on backbeats (Beats 1, 3, 5, 7...)
        if beat_idx % 2 == 1:
            place(music_bus, snare_clip, bt_sec, gain_db=-5.8, pan=0.04)

        # Silky 8th-note hi-hats with 16th swing
        place(music_bus, hat_closed, bt_sec, gain_db=-12.0, pan=-0.16)
        is_open = (beat_idx % 4 == 3)
        place(
            music_bus,
            hat_open if is_open else hat_closed,
            bt_sec + 0.52 * BEAT,
            gain_db=-10.2 if is_open else -10.8,
            pan=0.16,
        )
        if beat_idx % 2 == 0:
            place(music_bus, hat_closed, bt_sec + 0.77 * BEAT, gain_db=-14.5, pan=-0.12)

    # Smooth Fade-to-Black Master Music Envelope matching F401-F436 (13.33s -> 14.50s)
    t_axis = np.arange(N_SAMPLES, dtype=np.float32) / SR
    fade_env = np.ones(N_SAMPLES, dtype=np.float32)
    fade_mask = t_axis >= 13.20
    fade_env[fade_mask] = np.clip(1.0 - (t_axis[fade_mask] - 13.20) / (14.48 - 13.20), 0.0, 1.0) ** 1.6
    music_bus *= fade_env[:, None]

    # Combine Foley + Music with gentle acoustic room glue
    master = apply_warm_reverb_bus(music_bus, wet=0.15) + apply_warm_reverb_bus(foley_bus, wet=0.09)
    master *= fade_env[:, None]

    # Loudness & True-Peak Mastering (-15.5 LUFS target, ceiling -2.5 dBFS / 0.75 linear)
    rms = float(np.sqrt(np.mean(master[int(4.0 * SR):int(13.0 * SR)] ** 2)))
    target_rms = 0.165
    if rms > 1e-5:
        master *= (target_rms / rms)

    # Soft transparent limiter so peaks never clip above 0.78 (-2.1 dBFS)
    master = np.tanh(master * 1.08) * 0.76

    pcm16 = np.clip(master * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(OUT_WAV), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm16.tobytes())

    act1_pk = float(np.max(np.abs(master[:int(3.95 * SR)])))
    act2_pk = float(np.max(np.abs(master[int(4.0 * SR):])))
    print(f"[SUCCESS] Wrote {OUT_WAV} ({DURATION:.2f}s)")
    print(f"Act 1 Foley Peak: {20*math.log10(max(1e-6, act1_pk)):.1f} dBFS | Acts 2-4 Mix Peak: {20*math.log10(max(1e-6, act2_pk)):.1f} dBFS")


if __name__ == "__main__":
    main()

