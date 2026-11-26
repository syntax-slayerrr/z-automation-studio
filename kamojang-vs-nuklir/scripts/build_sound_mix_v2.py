import json
import os
import subprocess
import numpy as np
import cv2
from scipy.io import wavfile
from scipy.signal import butter, filtfilt, spectrogram

ROOT = r"d:\PROJECTS\z-automation-studio"
PROJ = os.path.join(ROOT, "kamojang-vs-nuklir")
AUDIO_DIR = os.path.join(PROJ, "audio_v2")
SFX_V1 = os.path.join(PROJ, "audio", "sfx")
SFX_V2 = os.path.join(AUDIO_DIR, "sfx")
OUT_DIR = os.path.join(PROJ, "out")
PUB_DIR = os.path.join(ROOT, "public", "kamojang-vs-nuklir")

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(PUB_DIR, exist_ok=True)

SR = 48000
with open(os.path.join(AUDIO_DIR, "alignment.json"), "r", encoding="utf-8") as f:
    ALIGN = json.load(f)

DURATION = float(ALIGN["durationSec"])
CUES = ALIGN["cuesSec"]
N = int(round(DURATION * SR))

def load_stereo(path):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(SR), "-"]
    raw = subprocess.check_output(cmd)
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def place_clip(bus, clip, start_sec, gain=1.0, fade_in=0.04, fade_out=0.14, pan=0.0, max_dur=None):
    clip = clip[: int(max_dur * SR)].copy() if max_dur else clip.copy()
    L = len(clip)
    if L == 0:
        return
    fi = min(L // 2, int(fade_in * SR))
    fo = min(L // 2, int(fade_out * SR))
    if fi > 1:
        clip[:fi] *= np.linspace(0.0, 1.0, fi)[:, None]
    if fo > 1:
        clip[-fo:] *= np.linspace(1.0, 0.0, fo)[:, None]
    l_g = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    r_g = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    s0 = max(0, int(start_sec * SR))
    s1 = min(N, s0 + L)
    if s1 <= s0:
        return
    seg = clip[: s1 - s0]
    bus[s0:s1, 0] += seg[:, 0] * l_g
    bus[s0:s1, 1] += seg[:, 1] * r_g

# 1. Load Un-Cut Single-Take VO (gentle 75Hz HPF, ZERO internal cuts!)
vo = load_stereo(os.path.join(AUDIO_DIR, "vo_master.wav"))
vo = np.pad(vo, ((0, max(0, N - len(vo))), (0, 0)))[:N]
b_hp, a_hp = butter(2, 75 / (SR / 2), btype="high")
vo = filtfilt(b_hp, a_hp, vo, axis=0)
vo *= 0.155 / np.sqrt(np.mean(vo ** 2) + 1e-12)

# 2. Bright Modern Curious TikTok Explainer Music (mixkit-587-discover — upbeat, curious, NOT brooding!)
music_candidates = [
    os.path.join(ROOT, "gunung-cikuray", ".audio-cache", "mixkit-587-discover.mp3"),
    os.path.join(ROOT, "membangun-rumah", ".audio-cache", "mixkit-117-curious-acoustic.mp3"),
]
music_src = next(p for p in music_candidates if os.path.exists(p))
print(f"Building V2 TikTok Audio Master ({DURATION:.2f}s) | Music: {os.path.basename(music_src)}")

m_raw = load_stereo(music_src)
xf = int(2.5 * SR)
music = np.zeros((N, 2), dtype=np.float32)
pos = 0
while pos < N:
    chunk = m_raw.copy()
    if pos > 0 and len(chunk) > xf:
        chunk[:xf] *= np.linspace(0, 1, xf)[:, None]
    end = min(N, pos + len(chunk))
    seg = chunk[: end - pos]
    if pos > 0 and pos + xf <= N:
        music[pos : pos + xf] *= np.linspace(1, 0, xf)[:, None]
    music[pos:end] += seg
    pos += max(SR * 5, len(m_raw) - xf)

b_lp, a_lp = butter(2, 4600 / (SR / 2), btype="low")
music_warm = filtfilt(b_lp, a_lp, music, axis=0)
music_warm *= 0.042 / np.sqrt(np.mean(music_warm ** 2) + 1e-12)

# Smooth sidechain ducking under VO
env = np.abs(vo).mean(axis=1)
win = int(0.28 * SR)
smooth_env = np.convolve(env, np.ones(win, dtype=np.float32) / win, mode="same")
speech_mask = np.clip(smooth_env / 0.052, 0.0, 1.0)
duck_gain = 1.0 - 0.56 * speech_mask
close_idx = max(0, N - int(3.0 * SR))
duck_gain[close_idx:] = np.linspace(0.95, 1.25, N - close_idx)
fade_end = int(1.0 * SR)
duck_gain[-fade_end:] *= np.linspace(1.0, 0.0, fade_end)
music_bus = music_warm * duck_gain[:, None]

# 3. Tactile Real Foley Cues (Kettle Boil, Geothermal Steam, Filter, Atom Split, Brake Rods, Turbine, Electricity, H2S!)
sfx_bus = np.zeros((N, 2), dtype=np.float32)
SFX_BANK = {
    "kettle": os.path.join(SFX_V2, "sfx_kettle_boil_steam.mp3"),
    "turbine": os.path.join(SFX_V1, "sfx_turbine_spinup.mp3"),
    "steam": os.path.join(SFX_V1, "sfx_geothermal_steam_valve.mp3"),
    "rods": os.path.join(SFX_V1, "sfx_reactor_rods_hum.mp3"),
    "h2s": os.path.join(SFX_V1, "sfx_h2s_pressure_hiss.mp3"),
    "atomic": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_atomic_shatter.mp3"),
    "shimmer": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_photon_lens_shimmer.mp3"),
    "latch": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_horizon_latch.mp3"),
    "gears": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_astrolabe_gears.mp3"),
}
loaded = {}
for k, p in SFX_BANK.items():
    if os.path.exists(p):
        arr = load_stereo(p)
        loaded[k] = arr / np.sqrt(np.mean(arr ** 2) + 1e-12) * 0.052

CUE_SHEET = [
    ("kettle", max(0.0, CUES["s1_kettle"] - 0.3), 0.92, 0.0, 3.8),
    ("turbine", CUES["s1_pinwheel"] - 0.1, 0.85, 0.0, 3.0),
    ("steam", CUES["s2_kamojang"], 0.65, -0.15, 3.4),
    ("steam", CUES["s2_pipe"] - 0.2, 0.78, 0.0, 3.2),
    ("gears", CUES["s3_filter"] - 0.2, 0.72, 0.0, 3.4),
    ("atomic", CUES["s4_atom"] + 0.6, 1.0, 0.0, 2.8),
    ("rods", CUES["s4_brake"] - 0.1, 0.95, 0.0, 3.6),
    ("kettle", CUES["s4_clean_boil"] - 0.2, 0.75, 0.15, 3.2),
    ("turbine", CUES["s5_turbine"] - 0.2, 0.92, 0.0, 4.2),
    ("shimmer", CUES["s5_magnet"], 0.88, 0.0, 3.2),
    ("latch", CUES["s5_phone"] + 0.1, 0.82, 0.0, 1.8),
    ("h2s", CUES["s6_geo_risk"] - 0.1, 0.85, -0.25, 3.2),
    ("rods", CUES["s6_nuc_layers"] - 0.1, 0.82, 0.25, 3.4),
    ("shimmer", CUES["s6_closing"], 0.65, 0.0, 3.0),
]
wired = 0
for k, ts, g, pan, md in CUE_SHEET:
    if k in loaded:
        place_clip(sfx_bus, loaded[k], ts, gain=g, pan=pan, max_dur=md)
        wired += 1
print(f"  Wired {wired}/{len(CUE_SHEET)} crisp TikTok foley cues.")

mix = vo + music_bus + sfx_bus
pk = np.max(np.abs(mix))
if pk > 0.92:
    mix *= 0.92 / pk
raw_wav = os.path.join(AUDIO_DIR, "master_pre_lufs.wav")
wavfile.write(raw_wav, SR, np.clip(mix, -1.0, 1.0).astype(np.float32))

m4a_out = os.path.join(PUB_DIR, "audio_master_v2.m4a")
pass1 = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", raw_wav, "-af", "loudnorm=I=-14.8:TP=-1.8:LRA=7:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True, check=True,
)
stats = json.loads(pass1.stderr[pass1.stderr.rfind("{"):pass1.stderr.rfind("}") + 1])
af2 = (
    f"loudnorm=I=-14.8:TP=-1.8:LRA=7:linear=true:"
    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
    f"offset={stats['target_offset']}"
)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw_wav, "-af", af2, "-c:a", "aac", "-b:a", "256k", "-ar", str(SR), m4a_out], check=True)
os.remove(raw_wav)

print(f"\n=== V2 AUDIO MASTER QA ({os.path.relpath(m4a_out, ROOT)}) ===")
for label, af in [("Stereo", "ebur128=peak=true"), ("Mono  ", "pan=mono|c0=0.5*c0+0.5*c1,ebur128=peak=true")]:
    res = subprocess.run(["ffmpeg", "-hide_banner", "-i", m4a_out, "-af", af, "-f", "null", "-"], capture_output=True, text=True)
    iv = [l.strip() for l in res.stderr.splitlines() if l.strip().startswith("I:")][-1]
    pv = [l.strip() for l in res.stderr.splitlines() if l.strip().startswith("Peak:")][-1]
    print(f"  {label}: {iv.replace('I:', '').strip()} | True Peak: {pv.replace('Peak:', '').strip()}")

# Generate Audio QA Sheet
final_arr = load_stereo(m4a_out)
mono = final_arr.mean(axis=1)
W_IMG, H_IMG = 1600, 680
canvas = np.full((H_IMG, W_IMG, 3), (24, 18, 14), dtype=np.uint8)
cv2.putText(canvas, "KAMOJANG VS NUKLIR V2 (SINGLE-TAKE TIKTOK VO) — AUDIO QA (-14.8 LUFS)", (36, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (235, 224, 210), 2, cv2.LINE_AA)
wf_x0, wf_x1, wf_y0, wf_y1 = 40, W_IMG - 40, 75, 320
wf_w, wf_mid, wf_amp = wf_x1 - wf_x0, (wf_y0 + wf_y1) // 2, (wf_y1 - wf_y0) // 2 - 10
cv2.rectangle(canvas, (wf_x0, wf_y0), (wf_x1, wf_y1), (36, 28, 22), -1)
for xi, seg in enumerate(np.array_split(mono, wf_w)):
    mx, rv = float(np.max(np.abs(seg))), float(np.sqrt(np.mean(seg ** 2)))
    x = wf_x0 + xi
    cv2.line(canvas, (x, int(wf_mid - mx * wf_amp)), (x, int(wf_mid + mx * wf_amp)), (110, 185, 245), 1)
    cv2.line(canvas, (x, int(wf_mid - rv * wf_amp * 1.4)), (x, int(wf_mid + rv * wf_amp * 1.4)), (248, 210, 80), 1)
_, _, Sxx = spectrogram(mono[::2], fs=SR // 2, nperseg=512, noverlap=256)
Sdb = 10 * np.log10(Sxx[:160, :] + 1e-10)
Simg = cv2.applyColorMap((np.clip((Sdb - (Sdb.max() - 75)) / 75.0, 0, 1)[::-1] * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
canvas[365:645, wf_x0:wf_x1] = cv2.resize(Simg, (wf_w, 280), interpolation=cv2.INTER_AREA)
cv2.imwrite(os.path.join(OUT_DIR, "audio_qa_sheet_v2.png"), canvas)
print(f"V2 AUDIO MASTER COMPLETE -> {m4a_out}")
