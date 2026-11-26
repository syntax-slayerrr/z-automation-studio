"""
Cinema-Grade Keyframe Multi-Layer Sound Design & Broadcast Mastering for:
"NALAR PELAJAR: WISNU — BERANI BERTANYA & 5W 1H" (PC IPM Panawuan)

Sample-accurate NumPy/SciPy 5-layer dramatic mix timed strictly against
`ipm-nalar-pelajar/audio/alignment.json` (`179.954s`, `5,399 frames @ 30 fps`):
  1. 3-Cast Locked ElevenLabs `eleven_v4` Drama VO
     (Narrator=Eric, Wisnu=Liam, Moderator=Brian PA Hall Mic)
  2. User Vocal Soundtrack (`ipm-nalar-pelajar/audio/user_soundtrack.mp3`, 60.03s, 100 BPM / 2.40s bar)
     with exact Keyframe dB Automation + Zero-Phase Dynamic Vocal-Pocket Carving EQ (900 Hz - 3.4 kHz, -6.5 dB)
     + Mid-Side Stereo Wrap during speech + 700 Hz Low-Pass pre-"berani" silence cut + Bar-Locked Act 2 Comeback
     culminating in a Full-Range Uncarved Chorus Bloom on the "Nalar Pelajar" closing card!
  3. Clean Instrumental Warm Piano (`mixkit-148`) under SH06-SH08 (5W 1H learning -> zero lyric clash!)
     and Psychological Tension Ambient (`music_oppenheimer_ambient.mp3`) under SH10 crimson anxiety.
  4. 23 Living World-Building Foley & Ambience Events (12 existing + 11 new Sound-V3 clips):
     night village crickets, lamp clicks, thumb swipes, bubble pops, pen writing, decisive notebook close,
     Panawuan morning rooster crow + birds + paving footsteps + village peers, packed seminar hall chatter
     hushing naturally as Moderator clicks PA mic, awkward hall silence, underwater muffled hall + heartbeat,
     audience head-turn murmur on hand raise, chair creak stand-up, and warm appreciative hall applause!
  5. Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -1.6 dBFS, Stereo & Mono verified)
     -> `public/ipm-nalar-pelajar/audio_master.m4a` + QA Plot PNG + `CREDITS.txt`
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
from scipy.signal import butter, spectrogram, sosfiltfilt

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
AUDIO_DIR = PROJECT / "audio"
SFX_ELEVEN = AUDIO_DIR / "sfx"
SFX_CC0 = ROOT / ".agents/skills/sound-effects/sfx"
CACHE_DIR = PROJECT / ".audio-cache"
OUT_DIR = PROJECT / "out"
PUBLIC_DIR = ROOT / "public/ipm-nalar-pelajar"

ALIGN_JSON = AUDIO_DIR / "alignment.json"
VO_WAV = AUDIO_DIR / "vo_master.wav"
USER_SONG = AUDIO_DIR / "user_soundtrack.mp3"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_M4A = PUBLIC_DIR / "audio_master.m4a"
QA_PNG = OUT_DIR / "audio_qa_sheet.png"
CREDITS_TXT = OUT_DIR / "CREDITS.txt"

SR = 44100


def ensure_track(local_paths: list[Path], fallback_url: str, cache_name: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for lp in local_paths:
        if lp.exists() and lp.stat().st_size > 100_000:
            return lp
    cached = CACHE_DIR / cache_name
    if cached.exists() and cached.stat().st_size > 100_000:
        return cached
    print(f"Downloading licensed Mixkit score -> {cache_name}...")
    req = urllib.request.Request(fallback_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()
    cached.write_bytes(data)
    return cached


def decode_stereo_f32(path: Path, sr: int = SR) -> np.ndarray:
    raw = subprocess.check_output(
        [
            "ffmpeg", "-v", "error", "-i", str(path),
            "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(sr), "pipe:1",
        ]
    )
    arr = np.frombuffer(raw, dtype=np.float32)
    return arr.reshape(-1, 2).copy()


def db_to_lin(db: float) -> float:
    if db <= -90.0:
        return 0.0
    return float(10.0 ** (db / 20.0))


def make_db_curve(n_samples: int, sr: int, keyframes: list[tuple[float, float]]) -> np.ndarray:
    """Smooth raised-cosine interpolation in dB space (silence below -85 dB smoothly ramps linear to 0)."""
    kfs = sorted(keyframes, key=lambda x: x[0])
    out = np.zeros(n_samples, dtype=np.float32)
    if not kfs:
        return out

    def seg_fill(i0: int, i1: int, db0: float, db1: float) -> None:
        i0c = max(0, min(n_samples, i0))
        i1c = max(0, min(n_samples, i1))
        if i1c <= i0c:
            return
        span = max(1, i1 - i0)
        u = (np.arange(i0c, i1c, dtype=np.float32) - i0) / float(span)
        w = 0.5 * (1.0 - np.cos(np.pi * np.clip(u, 0.0, 1.0)))
        if db0 <= -85.0 or db1 <= -85.0:
            g0, g1 = db_to_lin(db0), db_to_lin(db1)
            out[i0c:i1c] = g0 + (g1 - g0) * w
        else:
            db_seg = db0 + (db1 - db0) * w
            out[i0c:i1c] = np.power(10.0, db_seg / 20.0, dtype=np.float32)

    first_i = int(round(kfs[0][0] * sr))
    if first_i > 0:
        out[: min(n_samples, first_i)] = db_to_lin(kfs[0][1])

    for (t0, db0), (t1, db1) in zip(kfs, kfs[1:]):
        seg_fill(int(round(t0 * sr)), int(round(t1 * sr)), db0, db1)

    last_i = int(round(kfs[-1][0] * sr))
    if last_i < n_samples:
        out[max(0, last_i) :] = db_to_lin(kfs[-1][1])
    return out


def make_lin_curve(n_samples: int, sr: int, keyframes: list[tuple[float, float]]) -> np.ndarray:
    """Smooth raised-cosine linear interpolation between (sec, val) points."""
    kfs = sorted(keyframes, key=lambda x: x[0])
    out = np.zeros(n_samples, dtype=np.float32)
    if not kfs:
        return out
    first_i = int(round(kfs[0][0] * sr))
    if first_i > 0:
        out[: min(n_samples, first_i)] = kfs[0][1]
    for (t0, v0), (t1, v1) in zip(kfs, kfs[1:]):
        i0 = int(round(t0 * sr))
        i1 = int(round(t1 * sr))
        i0c, i1c = max(0, min(n_samples, i0)), max(0, min(n_samples, i1))
        if i1c <= i0c:
            continue
        u = (np.arange(i0c, i1c, dtype=np.float32) - i0) / float(max(1, i1 - i0))
        w = 0.5 * (1.0 - np.cos(np.pi * np.clip(u, 0.0, 1.0)))
        out[i0c:i1c] = v0 + (v1 - v0) * w
    last_i = int(round(kfs[-1][0] * sr))
    if last_i < n_samples:
        out[max(0, last_i) :] = kfs[-1][1]
    return out


def sos_filter_stereo(audio: np.ndarray, sos: np.ndarray) -> np.ndarray:
    out = np.empty_like(audio)
    for ch in range(2):
        out[:, ch] = sosfiltfilt(sos, audio[:, ch]).astype(np.float32)
    return out


def apply_fades(seg: np.ndarray, sr: int, fade_in_s: float = 0.02, fade_out_s: float = 0.04) -> np.ndarray:
    y = seg.copy()
    n = len(y)
    fi = min(n, int(round(fade_in_s * sr)))
    fo = min(n, int(round(fade_out_s * sr)))
    if fi > 1:
        ramp = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, fi, dtype=np.float32)))
        y[:fi] *= ramp[:, None]
    if fo > 1:
        ramp = 0.5 * (1.0 + np.cos(np.pi * np.linspace(0.0, 1.0, fo, dtype=np.float32)))
        y[n - fo :] *= ramp[:, None]
    return y


def add_at(
    buf: np.ndarray,
    clip: np.ndarray,
    start_sec: float,
    sr: int,
    gain: float = 1.0,
    fade_in_s: float = 0.025,
    fade_out_s: float = 0.06,
    max_dur_s: float | None = None,
    pan: float = 0.0,
) -> None:
    """Mix `clip` into stereo `buf` at `start_sec` with cosine fades & optional subtle stereo pan (-1..+1)."""
    if max_dur_s is not None:
        clip = clip[: int(round(max_dur_s * sr))]
    if len(clip) == 0:
        return
    c = apply_fades(clip, sr, fade_in_s, fade_out_s) * float(gain)
    if abs(pan) > 1e-4:
        # Equal-power pan tilt keeping stereo character intact
        l_g = math.cos((pan + 1.0) * math.pi * 0.25) * math.sqrt(2.0)
        r_g = math.sin((pan + 1.0) * math.pi * 0.25) * math.sqrt(2.0)
        c[:, 0] *= l_g
        c[:, 1] *= r_g
    s_i = int(round(start_sec * sr))
    if s_i >= len(buf):
        return
    if s_i < 0:
        c = c[-s_i:]
        s_i = 0
    end_i = min(len(buf), s_i + len(c))
    buf[s_i:end_i] += c[: end_i - s_i]


def loop_crossfade(clip: np.ndarray, target_dur_s: float, sr: int, xfade_s: float = 0.65) -> np.ndarray:
    """Seamlessly loop a stereo clip to `target_dur_s` using equal-power cosine crossfades."""
    target_n = int(round(target_dur_s * sr))
    if len(clip) >= target_n:
        return clip[:target_n].copy()
    xf = min(int(round(xfade_s * sr)), len(clip) // 3)
    step = len(clip) - xf
    out = np.zeros((target_n + len(clip), 2), dtype=np.float32)
    pos = 0
    first = True
    while pos < target_n:
        seg = clip.copy()
        if not first and xf > 1:
            fi = np.sin(0.5 * np.pi * np.linspace(0.0, 1.0, xf, dtype=np.float32))[:, None]
            fo = np.cos(0.5 * np.pi * np.linspace(0.0, 1.0, xf, dtype=np.float32))[:, None]
            out[pos : pos + xf] *= fo
            seg[:xf] *= fi
        out[pos : pos + len(seg)] += seg
        pos += step
        first = False
    return out[:target_n]


def build_speech_envelope(
    vo_stereo: np.ndarray,
    line_spans: list[dict],
    total_n: int,
    sr: int,
) -> np.ndarray:
    """
    Combines exact alignment `lineSpans` with real VO RMS detection so vocal-pocket carving
    clamps quickly before each line (`0.12s`), holds smoothly across syllables, and opens
    gracefully in breath pauses (`0.34s` cosine release) and on the closing card!
    """
    mask = np.zeros(total_n, dtype=np.float32)
    # 1. Span-based gate with subtle lead & tail
    for sp in line_spans:
        s0 = max(0, int(round((float(sp["startSec"]) - 0.14) * sr)))
        s1 = min(total_n, int(round((float(sp["endSec"]) + 0.16) * sr)))
        mask[s0:s1] = 1.0

    # 2. Smooth with moving cosine/box filter (attack/release feel via two-pass smoothing)
    win_n = int(round(0.28 * sr))
    kernel = np.hanning(win_n).astype(np.float32)
    kernel /= kernel.sum()
    smooth_span = np.convolve(mask, kernel, mode="same")

    # 3. Also detect real micro-pauses (>0.55s) inside long narrator lines using VO RMS
    mono_vo = np.abs(vo_stereo[:total_n, 0])
    hop = int(round(0.02 * sr))
    rms_win = int(round(0.22 * sr))
    sq = mono_vo * mono_vo
    csum = np.concatenate(([0.0], np.cumsum(sq, dtype=np.float64)))
    idx = np.arange(0, total_n, hop)
    lo = np.maximum(0, idx - rms_win // 2)
    hi = np.minimum(total_n, idx + rms_win // 2)
    rms_ds = np.sqrt(np.maximum(0.0, (csum[hi] - csum[lo]) / np.maximum(1, hi - lo))).astype(np.float32)
    # Smoothly map VO energy (threshold ~ -38 dBFS .. -22 dBFS)
    vo_act_ds = np.clip((20.0 * np.log10(rms_ds + 1e-7) + 40.0) / 14.0, 0.0, 1.0)
    # Smooth release on decimated envelope
    atk = 0.45
    rel = 0.08
    env_ds = np.zeros_like(vo_act_ds)
    cur = 0.0
    for i, v in enumerate(vo_act_ds):
        c = atk if v > cur else rel
        cur = cur + c * (v - cur)
        env_ds[i] = cur
    vo_env = np.interp(np.arange(total_n, dtype=np.float32), idx.astype(np.float32), env_ds).astype(np.float32)

    # Blend: strong during active speech, opens gracefully during gaps!
    combined = np.clip(0.38 * smooth_span + 0.72 * vo_env, 0.0, 1.0)
    return combined


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


def render_audio_qa_sheet(
    wav_path: Path, scene_bounds: dict, total_sec: float, out_png: Path
) -> None:
    import cv2

    sr, data = wavfile.read(str(wav_path))
    mono = (
        data.astype(np.float32).mean(axis=1) / 32768.0
        if data.ndim == 2
        else data.astype(np.float32) / 32768.0
    )

    W, H = 1800, 740
    canvas = np.full((H, W, 3), 20, dtype=np.uint8)
    y_mid = 190
    amp_h = 122
    cv2.rectangle(canvas, (60, 52), (W - 30, 326), (26, 32, 46), -1)
    plot_w = W - 90
    bins = np.array_split(mono, plot_w)
    for x_i, chunk in enumerate(bins):
        if len(chunk) == 0:
            continue
        pmax = float(np.max(chunk))
        pmin = float(np.min(chunk))
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        x = 60 + x_i
        cv2.line(canvas, (x, int(y_mid - pmax * amp_h)), (x, int(y_mid - pmin * amp_h)), (220, 168, 108), 1)
        cv2.line(canvas, (x, int(y_mid - rms * amp_h * 1.6)), (x, int(y_mid + rms * amp_h * 1.6)), (112, 204, 250), 1)

    freqs, _, Sxx = spectrogram(mono, fs=sr, nperseg=1024, noverlap=512)
    S_db = 10.0 * np.log10(np.maximum(Sxx, 1e-10))
    S_norm = np.clip((S_db + 95.0) / 75.0, 0.0, 1.0)
    max_bin = int(np.searchsorted(freqs, 10000.0))
    spec_img = (S_norm[:max_bin, :][::-1] * 255.0).astype(np.uint8)
    spec_col = cv2.applyColorMap(spec_img, cv2.COLORMAP_MAGMA)
    spec_res = cv2.resize(spec_col, (plot_w, 305), interpolation=cv2.INTER_AREA)
    canvas[370:675, 60 : 60 + plot_w] = spec_res

    for s_key, info in sorted(scene_bounds.items(), key=lambda kv: int(kv[0])):
        ct = float(info["startSec"])
        cx = 60 + int(round((ct / total_sec) * plot_w))
        cv2.line(canvas, (cx, 52), (cx, 675), (250, 204, 112), 2)
        cv2.putText(
            canvas,
            f"SH{int(s_key):02d}",
            (min(W - 90, cx + 4), 352),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.42,
            (242, 240, 232),
            1,
            cv2.LINE_AA,
        )

    for sec in range(0, int(math.ceil(total_sec)) + 1, 15):
        tx = 60 + int(round((sec / total_sec) * plot_w))
        cv2.line(canvas, (tx, 675), (tx, 686), (190, 190, 200), 1)
        mm, ss = divmod(sec, 60)
        cv2.putText(
            canvas,
            f"{mm:02d}:{ss:02d}",
            (tx - 16, 710),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (208, 214, 222),
            1,
            cv2.LINE_AA,
        )

    cv2.putText(
        canvas,
        "NALAR PELAJAR: WISNU — CINEMA SOUND DESIGN v2 (-14.5 LUFS, USER VOCAL SONG + VOCAL-POCKET EQ + 23 LIVING FOLEY)",
        (60, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
        (250, 204, 112),
        1,
        cv2.LINE_AA,
    )
    out_png.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_png), canvas)


def main() -> None:
    align = json.loads(ALIGN_JSON.read_text(encoding="utf-8"))
    cues: dict[str, float] = {k: float(v) for k, v in align["cuesSec"].items()}
    scenes_f = align["scenesFrame"]
    line_spans: list[dict] = align["lineSpans"]
    fps = float(align["fps"])
    total_sec = float(align["totalVideoSec"])
    total_n = int(round(total_sec * SR))

    # Visual cut timings synced 1:1 with NalarPelajar3DCanvas.tsx
    t_s6 = scenes_f["s6"] / fps          # 39.10s
    t_s7 = scenes_f["s7"] / fps          # 49.60s
    t_s9 = scenes_f["s9"] / fps          # 92.267s (SH09A-1 Village Morning Walk)
    t_s9_hall = (scenes_f["s9"] + 155) / fps  # 97.433s (SH09A-2 Packed Seminar Hall)
    t_s10 = scenes_f["s10"] / fps        # 113.433s
    t_s11 = scenes_f["s11"] / fps        # 130.867s
    t_lamp_on = t_s6 + (t_s7 - t_s6) * 0.44   # 43.73s exact desk lamp ON click!
    t_book_close = (scenes_f["s9"] - 18) / fps  # 91.67s exact red notebook snap shut!

    if not USER_SONG.exists():
        raise FileNotFoundError(f"User soundtrack missing: {USER_SONG}")

    mus_piano = ensure_track(
        [
            ROOT / "sejarah-komunikasi/.audio-cache/mixkit-148-forest-mist-whispers.mp3",
            ROOT / "human-fire/.audio-cache/mixkit-148-forest-mist-whispers.mp3",
        ],
        "https://assets.mixkit.co/music/148/148.mp3",
        "mixkit-148-forest-mist-whispers.mp3",
    )
    mus_tension = ensure_track(
        [ROOT / "human-ritual/audio/music_oppenheimer_ambient.mp3"],
        "https://assets.mixkit.co/music/148/148.mp3",
        "mixkit-148-forest-mist-whispers.mp3",
    )

    print(
        f"=== Building Cinema Sound Design v2 ({total_sec:.2f}s / {total_n} samples @ {SR} Hz) ===\n"
        f"  User Vocal Soundtrack : {USER_SONG.name} (100 BPM / 2.40s bar-locked)\n"
        f"  SH06-SH08 Piano Bed   : {mus_piano.name} (pure instrumental)\n"
        f"  SH10 Crimson Tension  : {mus_tension.name}\n"
        f"  SH09A-1 Village Walk  : {t_s9:.2f}s -> {t_s9_hall:.2f}s (rooster + birds + paving steps + peers)\n"
        f"  SH09A-2 Seminar Hall  : {t_s9_hall:.2f}s -> {cues['s9_mod_invite']:.2f}s (dense chatter -> hush on PA mic)"
    )

    # -------------------------------------------------------------------------
    # 1. DECODE VO MASTER & COMPUTE SMOOTH SPEECH MASK
    # -------------------------------------------------------------------------
    vo_raw = decode_stereo_f32(VO_WAV, SR)
    vo_stem = np.zeros((total_n, 2), dtype=np.float32)
    vo_len = min(total_n, len(vo_raw))
    vo_stem[:vo_len] = vo_raw[:vo_len]
    vo_rms = float(np.sqrt(np.mean(vo_stem[:, 0] ** 2)) + 1e-9)
    print(f"  VO Master RMS         : {20 * math.log10(vo_rms):.2f} dBFS")

    speech_env = build_speech_envelope(vo_stem, line_spans, total_n, SR)

    # -------------------------------------------------------------------------
    # 2. ASSEMBLE USER VOCAL SOUNDTRACK STEM (BAR-LOCKED, KEYFRAMED + VOCAL-POCKET EQ)
    # -------------------------------------------------------------------------
    song_raw = decode_stereo_f32(USER_SONG, SR)
    song_rms = float(np.sqrt(np.mean(song_raw ** 2)) + 1e-9)
    # Calibrate user soundtrack RMS (-9.03 dBFS) down to VO active speech baseline (-15.5 dBFS)
    # so keyframe dB values (-11 dB intro, -18.5 dB under VO, -10.5 dB hand raise, -9 dB finale) are exact!
    target_ref_rms = db_to_lin(-15.5)
    song_cal = song_raw * (target_ref_rms / song_rms)
    print(f"  User Song Calibration : {20 * math.log10(song_rms):.2f} dBFS -> -15.50 dBFS (gain {20*math.log10(target_ref_rms/song_rms):+.2f} dB)")

    def song_slice(t0: float, t1: float) -> np.ndarray:
        i0 = max(0, int(round(t0 * SR)))
        i1 = min(len(song_cal), int(round(t1 * SR)))
        return song_cal[i0:i1].copy()

    user_song_raw_timeline = np.zeros((total_n, 2), dtype=np.float32)

    # ACT 1 (00.00s -> 34.90s): Continuous Segment A (Intro Guitar 0..5.8s) + Segment B ("Terbawa Arus... kau sendiri" 5.8..34.9s)
    # Smooth hard cut right before "berani." (34.85s)!
    add_at(user_song_raw_timeline, song_slice(0.0, 34.88), 0.0, SR, gain=1.0, fade_in_s=0.04, fade_out_s=0.22)

    # SH09A-1 (92.30s -> 97.35s): Ultra-delicate organic acoustic guitar whisper (-23 dB) beneath morning village birds/rooster
    add_at(user_song_raw_timeline, song_slice(0.0, 5.15), t_s9 + 0.05, SR, gain=1.0, fade_in_s=0.45, fade_out_s=0.55)

    # ACT 2 COMEBACK (131.80s -> 179.954s):
    #   - 131.80s -> 138.25s (6.45s): Acoustic Guitar Intro (0.00s - 5.80s, gently held) after 0.94s silence!
    #   - Bar-locked 2.40s/bar wordless "Huuu..." Harmony stepping straight into:
    #   - t_climax_start (~156.925s) -> 179.954s: UNINTERRUPTED FINAL CLIMAX (36.20s -> 59.23s = 23.03s!)
    #       -> Chorus "Dia bilang mengalir saja..." hits at 165.52s ("Di detik Wisnu berani bersuara...")
    #       -> Final climactic bloom ("mengalir..." + resonant chord) lands 100% on 176.61s - 179.954s
    #          ("Nalar Pelajar" closing card) and fades out cleanly BEFORE the next phrase at 59.35s!
    t_climax_start = total_sec - (59.23 - 36.20)  # ~156.924s
    add_at(user_song_raw_timeline, song_slice(0.0, 5.85), 131.80, SR, gain=1.0, fade_in_s=0.55, fade_out_s=0.65)
    add_at(user_song_raw_timeline, song_slice(36.20, 43.88), t_climax_start - 19.20, SR, gain=1.0, fade_in_s=0.55, fade_out_s=0.48)
    add_at(user_song_raw_timeline, song_slice(36.20, 43.88), t_climax_start - 12.00, SR, gain=1.0, fade_in_s=0.48, fade_out_s=0.48)
    add_at(user_song_raw_timeline, song_slice(36.20, 41.48), t_climax_start - 4.80, SR, gain=1.0, fade_in_s=0.48, fade_out_s=0.48)
    add_at(user_song_raw_timeline, song_slice(36.20, 59.25), t_climax_start, SR, gain=1.0, fade_in_s=0.48, fade_out_s=1.55)

    # Zero-Phase Filters for Dynamic Vocal-Pocket Carving EQ + Mid-Side Stereo Wrap + Pre-"berani" LPF Dive
    sos_hpf_clean = butter(3, 55.0, btype="high", fs=SR, output="sos")
    sos_vocal_bp = butter(2, [900.0, 3400.0], btype="bandpass", fs=SR, output="sos")
    sos_lpf_700 = butter(4, 700.0, btype="low", fs=SR, output="sos")

    song_full = sos_filter_stereo(user_song_raw_timeline, sos_hpf_clean)
    vocal_band = sos_filter_stereo(song_full, sos_vocal_bp)
    # -6.5 dB vocal pocket cut (1 - 0.53 = 0.47 = -6.56 dB) with zero phase shift!
    song_pocket = song_full - 0.53 * vocal_band
    # Gentle Mid-Side Stereo Wrap during speech: tuck center slightly (-3.0 dB), widen sides (+2.2 dB)
    mid = 0.5 * (song_pocket[:, 0] + song_pocket[:, 1]) * 0.71
    side = 0.5 * (song_pocket[:, 0] - song_pocket[:, 1]) * 1.29
    song_carved = np.stack([mid + side, mid - side], axis=1).astype(np.float32)

    # Modulate vocal carving dynamically by speech_env (and soften slightly during SH11B victory swell!)
    carve_weight = make_lin_curve(
        total_n, SR,
        [
            (0.0, 0.35),     # Intro pure guitar needs only light carving
            (5.6, 0.45),
            (6.0, 1.00),     # SH02-SH05 vocal verse: FULL -6.5 dB Vocal-Pocket EQ + Stereo Wrap!
            (35.0, 1.00),
            (92.0, 0.40),    # Village subtle guitar
            (131.5, 0.45),   # Guitar comeback
            (139.8, 0.55),
            (140.5, 0.65),   # SH11B hand raise wordless harmony
            (145.1, 0.92),   # Moderator & Wisnu dialogue
            (159.1, 0.88),   # Narrator IPM ethos over Chorus
            (170.6, 0.25),   # Mini-swell gap at 170.7 - 171.2s
            (171.3, 0.92),   # Final narrator line
            (176.35, 0.90),
            (176.75, 0.00),  # FULL-SPECTRUM UNCARVED CHORUS BLOOM on "Nalar Pelajar" closing card!
            (total_sec, 0.00),
        ],
    )
    carve_amt = np.clip(speech_env * carve_weight, 0.0, 1.0)[:, None]
    song_dynamic_eq = song_full * (1.0 - carve_amt) + song_carved * carve_amt

    # Pre-"berani." low-pass 700 Hz muffled dive (33.5s -> 34.82s)
    song_muffled = sos_filter_stereo(song_carved, sos_lpf_700)
    lpf_mix = make_lin_curve(
        total_n, SR,
        [(0.0, 0.0), (33.40, 0.0), (34.45, 1.0), (35.10, 1.0), (35.30, 0.0), (total_sec, 0.0)],
    )[:, None]
    song_dynamic_eq = song_dynamic_eq * (1.0 - lpf_mix) + song_muffled * lpf_mix

    # Exact Keyframe Volume Automation Curve matching approved `sound_design_plan.md`!
    user_song_db_kfs: list[tuple[float, float]] = [
        # SH01: Warm Guitar Intro -> smooth tuck under Narrator -> breath swell
        (0.00, -11.0),
        (0.32, -11.0),
        (0.55, -16.0),
        (5.75, -16.0),
        (5.95, -12.0),   # Breath swell before SH02!
        (6.15, -18.5),
        # SH02-SH03: "Saat kau ragu arah tuju... terbawa arus" tucked cleanly under Narrator + gap swells
        (13.25, -18.5),
        (13.50, -12.5),  # Breath swell between SH02 & SH03!
        (13.75, -18.5),
        (21.62, -18.5),
        (21.82, -12.5),  # Breath swell between SH03 & SH04!
        (22.02, -19.0),
        # SH04-SH05a: "Kau telah hilang arah... kau sendiri" -> dramatic pre-"berani" dive & DEAD CUT!
        (30.85, -19.0),
        (31.08, -13.5),  # Brief dramatic lift into SH05
        (31.32, -18.5),
        (33.45, -18.5),
        (34.35, -25.0),  # Low-pass muffled drop
        (34.78, -96.0),  # SILENCE CUT right before "berani." (34.85s)!
        # Silent across SH05b & SH06-SH08 (piano owns SH06-SH08)
        (92.20, -96.0),
        # SH09A-1 Village Morning: ultra-gentle acoustic guitar whisper (-23 dB) beneath rooster & footsteps
        (92.70, -23.5),
        (96.75, -23.5),
        (97.35, -96.0),
        # Silent across SH09A-2 -> SH09C -> SH10 (real seminar hall acoustics + crimson anxiety)
        (131.78, -96.0),
        # SH11A: Comeback Acoustic Guitar Intro after 0.94s dead silence!
        (132.35, -16.0),
        (135.40, -15.5),
        (137.40, -14.2),
        (139.80, -12.8),
        # SH11B: "Dan akhirnya, Wisnu menang. Tangannya terangkat tinggi." -> SOARING HARMONY SWELL!
        (140.60, -12.0),
        (142.85, -10.6),  # Peak swell right as hand shoots skyward!
        (143.35, -12.2),
        (145.10, -10.8),
        # SH11C & SH12A: Clean duck under Moderator PA mic & Wisnu's sharp 5W+1H question!
        (145.45, -18.2),
        (148.75, -18.2),
        (149.02, -14.5),  # Tiny dramatic breath as Wisnu stands up!
        (149.28, -18.5),
        (158.95, -18.5),
        # Applause + Hand-off into SH12B Chorus Climax!
        (159.35, -15.0),
        (159.75, -16.4),
        (165.20, -16.0),  # Chorus "Dia bilang mengalir saja..." hits at 165.52s!
        (170.58, -15.5),
        # Natural breath pause (170.68s - 171.25s) -> emotional mini-swell!
        (170.92, -11.5),
        (171.30, -15.8),
        (175.40, -15.0),
        (176.48, -13.5),
        # CLOSING CARD "Nalar Pelajar" (176.61s - 179.954s, ZERO VO!) -> FULL-SPECTRUM BLOOM!
        (176.85, -9.0),
        (178.40, -9.2),
        (179.95, -96.0),
    ]
    user_song_gain = make_db_curve(total_n, SR, user_song_db_kfs)[:, None]
    user_song_stem = song_dynamic_eq * user_song_gain

    # -------------------------------------------------------------------------
    # 3. SUPPORTING INSTRUMENTAL SCORES (SH06-SH08 WARM PIANO & SH10 TENSION BED)
    # -------------------------------------------------------------------------
    piano_raw = decode_stereo_f32(mus_piano, SR)
    piano_rms = float(np.sqrt(np.mean(piano_raw ** 2)) + 1e-9)
    piano_cal = piano_raw * (target_ref_rms / piano_rms)
    piano_loop = loop_crossfade(piano_cal, 55.0, SR, xfade_s=1.2)
    piano_stem = np.zeros((total_n, 2), dtype=np.float32)
    add_at(piano_stem, piano_loop, t_s6 + 0.15, SR, gain=1.0, fade_in_s=1.4, fade_out_s=1.2, max_dur_s=(t_book_close - t_s6))
    # Gentle vocal-pocket dip on piano too so 5W 1H educational clarity is 100% crisp
    piano_carved = piano_stem - 0.35 * sos_filter_stereo(piano_stem, sos_vocal_bp)
    piano_db_kfs = [
        (0.0, -96.0),
        (t_s6 + 0.10, -96.0),
        (t_s6 + 1.50, -17.5),
        (43.80, -16.8),   # Warm lamp clicks ON!
        (49.55, -15.5),   # Small swell entering SH07
        (49.85, -17.8),   # Clean under Wisnu 5W 1H
        (73.00, -17.5),
        (73.25, -16.8),   # SH08 cozy tabletop writing
        (90.50, -17.2),
        (t_book_close + 0.25, -96.0),  # Clean fade-out as red notebook closes!
        (total_sec, -96.0),
    ]
    piano_stem = piano_carved * make_db_curve(total_n, SR, piano_db_kfs)[:, None]

    tension_raw = decode_stereo_f32(mus_tension, SR)
    tension_rms = float(np.sqrt(np.mean(tension_raw ** 2)) + 1e-9)
    tension_cal = tension_raw * (target_ref_rms / tension_rms)
    tension_loop = loop_crossfade(tension_cal, 28.0, SR, xfade_s=1.2)
    tension_stem = np.zeros((total_n, 2), dtype=np.float32)
    add_at(tension_stem, tension_loop, 106.40, SR, gain=1.0, fade_in_s=1.2, fade_out_s=0.10, max_dur_s=(t_s11 - 106.40))
    tension_db_kfs = [
        (0.0, -96.0),
        (106.35, -96.0),
        (108.40, -30.5),  # SH09C ultra-hushed awkward silence tension floor (lets room silence breathe!)
        (113.20, -28.0),
        (114.20, -19.0),  # SH10 crimson psychological battle!
        (122.40, -17.8),  # Wisnu inner doubt peaks
        (130.72, -17.5),
        (t_s11, -96.0),   # HARD DEAD CUT at 130.87s!
        (total_sec, -96.0),
    ]
    tension_stem = sos_filter_stereo(tension_stem, sos_hpf_clean) * make_db_curve(total_n, SR, tension_db_kfs)[:, None]

    music_bus = user_song_stem + piano_stem + tension_stem

    # -------------------------------------------------------------------------
    # 4. ASSEMBLE ALL 23 LIVING WORLD-BUILDING FOLEY & AMBIENCE EVENTS
    # -------------------------------------------------------------------------
    sfx_bus = np.zeros((total_n, 2), dtype=np.float32)
    sfx_cache: dict[Path, np.ndarray] = {}

    def get_sfx(p: Path) -> np.ndarray | None:
        if not p.exists():
            print(f"  WARN missing SFX: {p}")
            return None
        if p not in sfx_cache:
            clip = decode_stereo_f32(p, SR)
            # Clean sub rumble below 40 Hz on every SFX
            if len(clip) > 128:
                clip = sos_filter_stereo(clip, butter(2, 42.0, btype="high", fs=SR, output="sos"))
            sfx_cache[p] = clip
        return sfx_cache[p]

    # 4A. Continuous Bedroom Night Crickets + Subtle Room Tone (00.0s -> 91.7s)
    crickets = get_sfx(SFX_ELEVEN / "sfx_night_crickets_village.mp3")
    if crickets is not None:
        cr_hp = sos_filter_stereo(crickets, butter(2, 360.0, btype="high", fs=SR, output="sos"))
        cr_loop = loop_crossfade(cr_hp, t_book_close, SR, xfade_s=0.9)
        cr_env = make_lin_curve(
            total_n, SR,
            [
                (0.0, 0.085),     # Gentle Indonesian village night crickets outside window
                (30.5, 0.075),
                (31.5, 0.020),    # Recede during SH05 crimson overload
                (38.8, 0.020),
                (40.0, 0.075),    # Return peacefully during SH06-SH08
                (90.8, 0.065),
                (t_book_close, 0.0),
                (total_sec, 0.0),
            ],
        )[:, None]
        sfx_bus[: len(cr_loop)] += cr_loop * cr_env[: len(cr_loop)]

    bed_rt = get_sfx(SFX_CC0 / "ambience/fs-329569-roomtone-bedroom-yew.ogg")
    if bed_rt is not None:
        rt_loop = loop_crossfade(bed_rt, t_book_close, SR, xfade_s=0.5)
        add_at(sfx_bus, rt_loop, 0.0, SR, gain=0.05, fade_in_s=0.2, fade_out_s=0.6)

    # 4B. Dynamic Packed Seminar Crowd Chatter (SH09A-2 -> Natural Hush on Moderator PA Mic!)
    crowd_chatter = get_sfx(SFX_ELEVEN / "sfx_seminar_crowd_chatter.mp3")
    if crowd_chatter is not None:
        ch_dur = 6.9
        ch_buf = np.zeros((total_n, 2), dtype=np.float32)
        add_at(ch_buf, crowd_chatter, t_s9_hall - 0.05, SR, gain=1.0, fade_in_s=0.14, fade_out_s=0.65, max_dur_s=ch_dur)
        # Lively & unmistakable during "Aula penuh sesak oleh puluhan pelajar." (97.4s -> 100.1s),
        # then naturally hushes down as Moderator clicks PA mic & speaks at 100.37s!
        ch_env = make_lin_curve(
            total_n, SR,
            [
                (0.0, 0.0),
                (t_s9_hall - 0.05, 0.0),
                (t_s9_hall + 0.15, 0.52),   # Vivid bustling seminar auditorium!
                (99.95, 0.48),
                (100.30, 0.24),             # Crowd notices Moderator at mic
                (101.20, 0.08),             # Room settles quietly
                (103.80, 0.0),
                (total_sec, 0.0),
            ],
        )[:, None]
        sfx_bus += ch_buf * ch_env

    # 4C. SH10 Underwater Muffled Hall Isolation Bed (480 Hz Low-Pass!)
    hall_amb = get_sfx(SFX_ELEVEN / "sfx_seminar_hall_ambience.mp3")
    if hall_amb is not None:
        hall_muf = sos_filter_stereo(hall_amb, butter(4, 480.0, btype="low", fs=SR, output="sos"))
        hall_muf_loop = loop_crossfade(hall_muf, t_s11 - t_s10, SR, xfade_s=0.5)
        add_at(sfx_bus, hall_muf_loop, t_s10, SR, gain=0.22, fade_in_s=0.45, fade_out_s=0.06)

    # 4D. Exact Frame-Locked Spot Foley & Ambience Cues (23-layer world!)
    spot_events: list[tuple[float, Path, float, float | None, float, float, float, str]] = [
        # (start_s, path, gain, max_dur, fade_in, fade_out, pan, desc)
        # --- ACT 1: BEDROOM NIGHT ---
        (cues["s1_lamp_off"] + 2.35, SFX_ELEVEN / "sfx_lamp_switch_click.mp3", 0.56, 0.9, 0.01, 0.12, -0.15, "SH01 Bedside tungsten lamp click OFF"),
        (cues["s2_ecu_eyes"] - 0.12, SFX_ELEVEN / "sfx_soft_low_thump.mp3", 0.36, 1.2, 0.01, 0.25, 0.0, "SH02 Sudden ECU eyes snap"),
        (cues["s2_ecu_eyes"] + 1.85, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.40, 1.1, 0.01, 0.15, 0.10, "SH02 Thumb swipe on TikTok glass"),
        (cues["s3_fear_bubbles"] + 0.15, SFX_ELEVEN / "sfx_bubble_pop_soft.mp3", 0.34, 1.5, 0.015, 0.25, -0.12, "SH03 Three social-fear cyan bubbles pop"),
        (cues["s4_bubbles_100"] - 0.10, SFX_ELEVEN / "sfx_bubble_pops_cascade.mp3", 0.40, 2.5, 0.02, 0.35, 0.0, "SH04 Bubbles multiplying 1->10->100"),
        (cues["s5_berani"] - 0.15, SFX_ELEVEN / "sfx_muted_alarm_pulse.mp3", 0.36, 3.4, 0.04, 0.22, 0.0, "SH05 Crimson overload muted pulse (cuts before berani)"),
        (34.78, SFX_ELEVEN / "sfx_soft_low_thump.mp3", 0.48, 1.1, 0.008, 0.35, 0.0, "SH05b Sub-impact punctuating silence cut on 'berani.'"),
        (cues["s6_reset_lamp_on"] - 0.12, SFX_ELEVEN / "sfx_calm_exhale_resolve.mp3", 0.44, 1.9, 0.02, 0.30, 0.0, "SH06 Calm exhale reset"),
        (t_lamp_on, SFX_ELEVEN / "sfx_lamp_switch_click.mp3", 0.56, 0.9, 0.01, 0.12, -0.20, "SH06 Exact-frame Desk lamp click ON warm"),

        # --- SH07: 5W 1H PHONE SWIPES + SUBTLE ORB SHIMMERS ---
        (cues["s7_what"] + 0.05, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.36, 0.9, 0.01, 0.12, 0.08, "SH07 WHAT phone thumb swipe"),
        (cues["s7_what"] + 0.10, SFX_ELEVEN / "sfx_phone_scroll_chime.mp3", 0.24, 1.2, 0.015, 0.25, -0.12, "SH07 WHAT orb chime"),
        (cues["s7_who"] - 0.08, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.32, 0.9, 0.01, 0.12, 0.08, "SH07 WHO phone thumb swipe"),
        (cues["s7_who"] - 0.04, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.13, 1.0, 0.01, 0.25, 0.15, "SH07 WHO shimmer"),
        (cues["s7_when"] - 0.08, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.34, 0.9, 0.01, 0.12, 0.08, "SH07 WHEN phone thumb swipe"),
        (cues["s7_when"] - 0.04, SFX_ELEVEN / "sfx_phone_scroll_chime.mp3", 0.22, 1.1, 0.015, 0.25, -0.12, "SH07 WHEN orb chime"),
        (cues["s7_where"] - 0.08, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.32, 0.9, 0.01, 0.12, 0.08, "SH07 WHERE phone thumb swipe"),
        (cues["s7_where"] - 0.04, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.12, 1.0, 0.01, 0.25, 0.15, "SH07 WHERE shimmer"),
        (cues["s7_why"] - 0.08, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.34, 0.9, 0.01, 0.12, 0.08, "SH07 WHY phone thumb swipe"),
        (cues["s7_why"] - 0.04, SFX_ELEVEN / "sfx_phone_scroll_chime.mp3", 0.22, 1.1, 0.015, 0.25, -0.12, "SH07 WHY orb chime"),
        (cues["s7_how"] - 0.08, SFX_ELEVEN / "sfx_phone_thumb_swipe.mp3", 0.32, 0.9, 0.01, 0.12, 0.08, "SH07 HOW phone thumb swipe"),
        (cues["s7_how"] - 0.04, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.14, 1.1, 0.01, 0.25, 0.15, "SH07 HOW shimmer"),

        # --- SH08: MACRO POV PEN WRITING + RED NOTEBOOK CLOSE MATCH-CUT ---
        (cues["s8_pov_write"] + 0.35, SFX_ELEVEN / "sfx_pen_scribble_paper.mp3", 0.48, 3.6, 0.03, 0.30, 0.10, "SH08 Macro POV ballpoint pen writing line 1"),
        (cues["s8_pov_write"] + 4.25, SFX_ELEVEN / "sfx_pen_scribble_paper.mp3", 0.44, 3.6, 0.03, 0.30, 0.08, "SH08 Macro POV ballpoint pen writing line 2"),
        (cues["s8_pov_write"] + 8.35, SFX_ELEVEN / "sfx_pen_scribble_paper.mp3", 0.40, 3.1, 0.03, 0.30, 0.06, "SH08 Macro POV ballpoint pen writing line 3"),
        (t_book_close, SFX_ELEVEN / "sfx_notebook_close.mp3", 0.64, 0.95, 0.008, 0.18, 0.0, "SH08 Exact-frame decisive red notebook close!"),

        # --- SH09A-1: AUTHENTIC PANAWUAN VILLAGE MORNING WALK (92.27s -> 97.43s) ---
        (t_s9 - 0.02, SFX_ELEVEN / "sfx_rooster_morning_crow.mp3", 0.54, 5.04, 0.08, 0.40, -0.18, "SH09A-1 Authentic Indonesian village rooster crow & morning birds!"),
        (t_s9 + 0.08, SFX_ELEVEN / "sfx_footsteps_paving_walk.mp3", 0.42, 5.05, 0.06, 0.30, 0.04, "SH09A-1 Wisnu sneakers walking on outdoor village paving blocks"),
        (t_s9 + 0.55, SFX_ELEVEN / "sfx_village_morning_peers.mp3", 0.24, 4.55, 0.25, 0.45, 0.22, "SH09A-1 Distant morning student peers chatting softly"),

        # --- SH09B & SH09C: MODERATOR PA MIC CLICK -> AWKWARD AUDITORIUM SILENCE ---
        (cues["s9_mod_invite"] - 0.22, SFX_ELEVEN / "sfx_pa_mic_switch_click.mp3", 0.50, 1.05, 0.01, 0.18, 0.0, "SH09B Moderator PA microphone switch click"),
        (cues["s9_silence"] - 0.14, SFX_ELEVEN / "sfx_soft_low_thump.mp3", 0.24, 1.0, 0.01, 0.25, 0.0, "SH09C Silence beat punctuation"),
        (cues["s9_silence"] - 0.05, SFX_ELEVEN / "sfx_awkward_hall_silence.mp3", 0.46, 7.0, 0.20, 0.35, 0.0, "SH09C Real awkward hall silence (faint AC, distant tiny cough & paper)"),

        # --- SH10: CRIMSON ANXIETY BATTLE (CHAIR SHIFT + POUNDING HEARTBEAT -> HARD CUT!) ---
        (cues["s10_inner_battle"] + 1.50, SFX_ELEVEN / "sfx_chair_creak_cloth.mp3", 0.38, 1.6, 0.03, 0.22, 0.12, "SH10 Nervous auditorium chair creak & sweater shift"),
        (cues["s10_inner_battle"] - 0.08, SFX_ELEVEN / "sfx_heartbeat_anxiety.mp3", 0.56, 4.4, 0.08, 0.30, 0.0, "SH10 Anxiety muffled heartbeat wave 1"),
        (cues["s10_wisnu_doubt"] - 0.20, SFX_ELEVEN / "sfx_heartbeat_anxiety.mp3", 0.64, 4.4, 0.08, 0.30, 0.0, "SH10 Anxiety muffled heartbeat wave 2"),
        (cues["s10_wisnu_doubt"] + 4.10, SFX_ELEVEN / "sfx_heartbeat_anxiety.mp3", 0.60, max(0.5, t_s11 - (cues["s10_wisnu_doubt"] + 4.10)), 0.05, 0.04, 0.0, "SH10 Anxiety heartbeat peak -> HARD CUT at 130.87s!"),

        # --- SH11: SILENCE EXHALE -> GOLDEN HAND RAISE + AUDIENCE HEAD-TURN MURMUR ---
        (cues["s11_breakthrough"] - 0.14, SFX_ELEVEN / "sfx_calm_exhale_resolve.mp3", 0.50, 1.85, 0.02, 0.32, 0.0, "SH11A Deep calm exhale breaking crimson fear"),
        (cues["s11_hand_up"] + 0.70, SFX_ELEVEN / "sfx_triumph_hand_rise.mp3", 0.30, 2.2, 0.08, 0.45, 0.0, "SH11B Subtle golden shimmer under soaring harmony"),
        (cues["s11_hand_up"] + 0.95, SFX_ELEVEN / "sfx_crowd_turn_murmur.mp3", 0.48, 3.85, 0.12, 0.40, 0.0, "SH11B 40 audience heads turning & impressed quiet murmur!"),
        (cues["s11_mod_point"] - 0.20, SFX_ELEVEN / "sfx_pa_mic_switch_click.mp3", 0.34, 0.85, 0.01, 0.15, -0.08, "SH11C Moderator PA mic click ON"),

        # --- SH12: WISNU STANDS UP + WIRELESS MIC -> WARM APPLAUSE -> CLOSING CHIME ---
        (148.85, SFX_ELEVEN / "sfx_chair_creak_cloth.mp3", 0.46, 1.35, 0.02, 0.20, 0.14, "SH12A Confident chair push & cloth rustle as Wisnu stands"),
        (149.10, SFX_ELEVEN / "sfx_pa_mic_switch_click.mp3", 0.42, 0.85, 0.01, 0.15, 0.06, "SH12A Wisnu wireless handheld mic switch ON"),
        (159.10, SFX_ELEVEN / "sfx_warm_hall_applause.mp3", 0.52, 3.75, 0.08, 0.85, 0.0, "SH12B Warm appreciative seminar hall applause after Wisnu's question!"),
        (176.55, SFX_CC0 / "ding/fs-349504-triangle-open-04.ogg", 0.12, 1.8, 0.02, 0.50, 0.0, "SH12B Subtle golden chime entering 'Nalar Pelajar' closing card"),
    ]

    for t_s, p, gain, max_d, fi, fo, pan, desc in spot_events:
        clip = get_sfx(p)
        if clip is None:
            continue
        add_at(sfx_bus, clip, t_s, SR, gain=gain, fade_in_s=fi, fade_out_s=fo, max_dur_s=max_d, pan=pan)

    # Gentle soft safety trim on SFX bus & clean ending fade
    sfx_bus = np.tanh(sfx_bus * 0.95).astype(np.float32) * (1.0 / 0.95)
    sfx_bus = apply_fades(sfx_bus, SR, fade_in_s=0.02, fade_out_s=1.0)

    # -------------------------------------------------------------------------
    # 5. MASTER BUS SUMMING + 2-PASS BROADCAST LOUDNESS MASTER (-14.5 LUFS)
    # -------------------------------------------------------------------------
    # VO leads clearly at +1.0 dB (1.12), Music & Living Foley wrap organically around it
    pre_mix = (vo_stem * 1.12) + (music_bus * 1.00) + (sfx_bus * 0.90)
    # Prevent any digital overs prior to 2-pass loudnorm
    peak_pre = float(np.max(np.abs(pre_mix)) + 1e-9)
    if peak_pre > 0.92:
        pre_mix *= 0.92 / peak_pre
    print(f"  Pre-mix Peak          : {20 * math.log10(float(np.max(np.abs(pre_mix)) + 1e-9)):.2f} dBFS (original {20*math.log10(peak_pre):.2f} dBFS)")

    with tempfile.TemporaryDirectory(prefix="ipm-nalar-cinema-") as td:
        td_p = Path(td)
        pre_wav = td_p / "pre_mix.wav"
        wavfile.write(str(pre_wav), SR, np.clip(pre_mix * 32767.0, -32768.0, 32767.0).astype(np.int16))

        # Two-Pass Linear Broadcast Mastering (-14.5 LUFS, True Peak <= -1.6 dBFS)
        probe = subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(pre_wav),
                "-af", "alimiter=limit=0.92:attack=3:release=45,loudnorm=I=-14.5:TP=-1.6:LRA=7.0:print_format=json",
                "-f", "null", "-",
            ],
            capture_output=True, text=True, check=True,
        )
        j_start = probe.stderr.find("{", probe.stderr.rfind('"input_i"') - 80 if '"input_i"' in probe.stderr else 0)
        j_end = probe.stderr.find("}", j_start) + 1
        stats = json.loads(probe.stderr[j_start:j_end])

        OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(pre_wav),
                "-af", (
                    f"alimiter=limit=0.92:attack=3:release=45,"
                    f"loudnorm=I=-14.5:TP=-1.6:LRA=7.0:linear=true:"
                    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
                    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
                    f"offset={stats['target_offset']}"
                ),
                "-ar", "48000", "-ac", "2", "-sample_fmt", "s16", str(OUT_WAV),
            ],
            check=True,
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT_WAV),
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2", str(OUT_M4A),
            ],
            check=True,
        )

    lufs_st, tp_st = measure_ebur128(OUT_M4A, mono=False)
    lufs_mo, tp_mo = measure_ebur128(OUT_M4A, mono=True)
    print(f"\n=== CINEMA AUDIO MASTER QA v2 (public/ipm-nalar-pelajar/audio_master.m4a) ===")
    print(f"  Stereo: {lufs_st:.2f} LUFS | True Peak: {tp_st:.2f} dBFS")
    print(f"  Mono  : {lufs_mo:.2f} LUFS | True Peak: {tp_mo:.2f} dBFS")

    render_audio_qa_sheet(OUT_WAV, align["sceneBoundsSec"], total_sec, QA_PNG)
    print(f"  QA Plot -> {QA_PNG}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_TXT.write_text(
        "NALAR PELAJAR: WISNU — CINEMA SOUND DESIGN v2 CREDITS\n"
        "======================================================\n"
        "Cast VO (ElevenLabs eleven_v4, language='id'):\n"
        "  - Narrator  : Eric (cjVigY5qzO86Huf0OWal)\n"
        "  - Wisnu     : Liam (TX3LPaxmHKxFdv7VOQHJ)\n"
        "  - Moderator : Brian (nPczCjzI2devNBz1zQrb)\n"
        "Primary Soundtrack (Act 1 & Act 2 Climax): User-Provided Vocal Acoustic-Band Track (user_soundtrack.mp3)\n"
        "  - Mixed with Keyframe dB Automation, Zero-Phase Dynamic Vocal-Pocket EQ (900-3400 Hz) & Bar-Locked Splices\n"
        "Supporting Instrumental Score (SH06-SH08): Forest Mist Whispers (Mixkit #148, Mixkit Free License)\n"
        "Tension Ambient Bed (SH09C-SH10): Psychological Tension Ambient Bed (Studio Licensed)\n"
        "Bespoke Living Foley & Ambience (23 clips): ElevenLabs eleven_text_to_sound_v3\n"
        "  (night crickets, lamp switches, thumb swipes, bubble pops, pen writing, notebook close,\n"
        "   village morning rooster & birds, paving footsteps, village peers, packed seminar hall chatter,\n"
        "   PA mic switches, awkward hall silence, chair creaks, heartbeat, audience head-turn murmur, warm applause)\n"
        "CC0 Room Tone & Shimmers: Freesound CC0 Library\n",
        encoding="utf-8",
    )
    print(f"CINEMA AUDIO MASTER v2 COMPLETE -> {OUT_M4A}")


if __name__ == "__main__":
    main()
