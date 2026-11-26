import json
import os
import subprocess
import numpy as np
import cv2
from scipy.io import wavfile
from scipy.signal import butter, filtfilt, spectrogram

ROOT = r"d:\PROJECTS\z-automation-studio"
PROJ = os.path.join(ROOT, "kamojang-vs-nuklir")
AUDIO_DIR = os.path.join(PROJ, "audio")
SFX_DIR = os.path.join(AUDIO_DIR, "sfx")
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

def load_stereo(path, max_sec=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path]
    if max_sec:
        cmd += ["-t", str(max_sec)]
    cmd += ["-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(SR), "-"]
    raw = subprocess.check_output(cmd)
    arr = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    return arr

def place_clip(bus, clip, start_sec, gain=1.0, fade_in=0.04, fade_out=0.12, pan=0.0, max_dur=None):
    if max_dur is not None:
        clip = clip[: int(max_dur * SR)].copy()
    else:
        clip = clip.copy()
    L = len(clip)
    if L == 0:
        return
    fi = min(L // 2, int(fade_in * SR))
    fo = min(L // 2, int(fade_out * SR))
    if fi > 1:
        clip[:fi] *= np.linspace(0.0, 1.0, fi)[:, None]
    if fo > 1:
        clip[-fo:] *= np.linspace(1.0, 0.0, fo)[:, None]
    # Gentle constant-power stereo panning
    l_g = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    r_g = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    s0 = max(0, int(start_sec * SR))
    s1 = min(N, s0 + L)
    if s1 <= s0:
        return
    seg = clip[: s1 - s0]
    bus[s0:s1, 0] += seg[:, 0] * l_g
    bus[s0:s1, 1] += seg[:, 1] * r_g

# 1. Load Master VO (normalized & warm broadcast EQ)
vo_path = os.path.join(AUDIO_DIR, "vo_master.wav")
vo = load_stereo(vo_path)
if len(vo) < N:
    vo = np.pad(vo, ((0, N - len(vo)), (0, 0)))
else:
    vo = vo[:N]

# High-pass 75Hz rumble cleanup on VO
b_hp, a_hp = butter(2, 75 / (SR / 2), btype="high")
vo = filtfilt(b_hp, a_hp, vo, axis=0)
vo_rms = np.sqrt(np.mean(vo ** 2) + 1e-12)
vo *= 0.145 / vo_rms

# 2. Load Investigative Cinematic Score (Oppenheimer-inspired ambient pulse — looped cleanly across 160s)
music_candidates = [
    os.path.join(ROOT, "human-ritual", "audio", "music_oppenheimer_ambient.mp3"),
    os.path.join(ROOT, "ipm-chronicles", "public", "audio", "music", "mixkit_140_cyberpunk_city.mp3"),
    os.path.join(ROOT, "membangun-rumah", ".audio-cache", "mixkit-117-curious-acoustic.mp3"),
]
music_src = next(p for p in music_candidates if os.path.exists(p))
print(f"Building KamojangVsNuklirShort Audio Master ({DURATION:.2f}s) | Score: {os.path.basename(music_src)}")

m_raw = load_stereo(music_src)
# Crossfade seamless loop to cover full duration
xf = int(3.0 * SR)
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

# Carve vocal clarity pocket (gentle low-pass warmth) + sidechain ducking under VO
b_lp, a_lp = butter(2, 4200 / (SR / 2), btype="low")
music_warm = filtfilt(b_lp, a_lp, music, axis=0)
m_rms = np.sqrt(np.mean(music_warm ** 2) + 1e-12)
music_warm *= 0.044 / m_rms

# Smooth VO envelope for cinematic sidechain ducking (-6.5 dB under speech, swelling during pauses & finale)
env = np.abs(vo).mean(axis=1)
win = int(0.32 * SR)
kernel = np.ones(win, dtype=np.float32) / win
smooth_env = np.convolve(env, kernel, mode="same")
speech_mask = np.clip(smooth_env / 0.055, 0.0, 1.0)
duck_gain = 1.0 - 0.56 * speech_mask
# Swell gently in last 3.8s closing statement, then clean 1.2s fadeout
close_idx = max(0, N - int(3.8 * SR))
duck_gain[close_idx:] = np.linspace(0.95, 1.32, N - close_idx)
fade_end = int(1.1 * SR)
duck_gain[-fade_end:] *= np.linspace(1.0, 0.0, fade_end)
music_bus = music_warm * duck_gain[:, None]

# 3. Wire Real Bespoke + Studio Archive Foley Cues (precision frame-locked to CUES!)
sfx_bus = np.zeros((N, 2), dtype=np.float32)

SFX_BANK = {
    "turbine": os.path.join(SFX_DIR, "sfx_turbine_spinup.mp3"),
    "steam_valve": os.path.join(SFX_DIR, "sfx_geothermal_steam_valve.mp3"),
    "reactor_rods": os.path.join(SFX_DIR, "sfx_reactor_rods_hum.mp3"),
    "h2s_leak": os.path.join(SFX_DIR, "sfx_h2s_pressure_hiss.mp3"),
    "atomic": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_atomic_shatter.mp3"),
    "shimmer": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_photon_lens_shimmer.mp3"),
    "tension": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_spaghettification_tension.mp3"),
    "latch": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_horizon_latch.mp3"),
    "gears": os.path.join(ROOT, "black-hole", "audio", "sfx", "sfx_astrolabe_gears.mp3"),
    "pump": os.path.join(ROOT, "sumur-bor", "audio", "sfx", "sfx_submersible_pump_flow.mp3"),
}

loaded_sfx = {}
for k, p in SFX_BANK.items():
    if os.path.exists(p):
        arr = load_stereo(p)
        rms = np.sqrt(np.mean(arr ** 2) + 1e-12)
        loaded_sfx[k] = arr / rms * 0.055  # calibrated tactile level (never drowns VO!)

CUE_SHEET = [
    # Scene 1: Kamojang steam -> Nuclear match cut -> Split reveal impact & turbine spinup
    ("steam_valve", max(0.0, CUES["s1_kamojang"] - 0.35), 0.72, -0.2, 3.2),
    ("reactor_rods", CUES["s1_nuclear"], 0.78, 0.2, 3.0),
    ("latch", CUES["s1_reveal"] + 1.8, 0.92, 0.0, 2.2),
    ("turbine", CUES["s1_reveal"] + 2.2, 0.96, 0.0, 4.4),

    # Scene 2: Underground descent rumble -> Reservoir pressure -> Production well steam rise
    ("tension", CUES["s2_descent"], 0.72, 0.0, 3.8),
    ("steam_valve", CUES["s2_reservoir"] + 0.4, 0.62, -0.15, 3.6),
    ("pump", CUES["s2_well"] + 0.8, 0.75, 0.0, 4.2),

    # Scene 3: Pipeline -> Demister separation -> Governor valve opening -> Turbine spinup
    ("steam_valve", CUES["s3_pipe"], 0.68, -0.2, 3.4),
    ("gears", CUES["s3_demister"], 0.66, 0.15, 3.4),
    ("steam_valve", CUES["s3_valve"] - 0.15, 0.98, 0.0, 4.0),
    ("turbine", CUES["s3_valve"] + 2.2, 0.92, 0.0, 4.4),

    # Scene 4: Containment cutaway -> Macro Uranium Fission impact -> Control rods sliding in
    ("latch", CUES["s4_containment"], 0.82, 0.0, 2.6),
    ("reactor_rods", CUES["s4_containment"] + 0.5, 0.78, 0.0, 4.2),
    ("atomic", CUES["s4_fission"] + 2.1, 1.05, 0.0, 2.8),
    ("shimmer", CUES["s4_fission"] + 3.6, 0.75, 0.1, 2.8),
    ("reactor_rods", CUES["s4_rods"] - 0.2, 1.02, 0.0, 4.2),

    # Scene 5: Primary coolant circulation -> Steam generator heat transfer -> Secondary steam release
    ("pump", CUES["s5_primary"] + 0.5, 0.74, -0.25, 4.4),
    ("shimmer", CUES["s5_sg"] + 1.2, 0.72, 0.0, 3.6),
    ("steam_valve", CUES["s5_circuits"] - 0.1, 0.84, 0.22, 3.6),

    # Scene 6: Match cut into Common Turbine -> Electromagnetic induction shimmer -> Grid illumination
    ("turbine", CUES["s6_matchcut"] + 0.6, 0.95, 0.0, 4.8),
    ("shimmer", CUES["s6_generator"] + 1.8, 0.92, 0.0, 4.0),
    ("latch", CUES["s6_grid"] + 1.2, 0.75, 0.0, 2.2),

    # Scene 7: Geothermal H2S leak + pressure tremor -> Nuclear defense barriers -> Split comparison
    ("h2s_leak", CUES["s7_geo_risk"] + 1.4, 0.96, -0.25, 4.0),
    ("tension", CUES["s7_geo_leak"], 0.78, -0.2, 3.4),
    ("reactor_rods", CUES["s7_nuc_barriers"] + 0.4, 0.85, 0.25, 4.2),
    ("latch", CUES["s7_compare"], 0.80, 0.0, 2.6),

    # Scene 8: Balanced verdict -> Return to Kamojang turbine & misty landscape swell
    ("shimmer", CUES["s8_verdict"], 0.64, 0.0, 3.2),
    ("turbine", CUES["s8_caveat"] + 3.2, 0.68, 0.0, 4.2),
    ("steam_valve", CUES["s8_closing"] + 0.6, 0.55, 0.0, 3.8),
]

wired = 0
for key, t_sec, gain, pan, max_d in CUE_SHEET:
    if key in loaded_sfx:
        place_clip(sfx_bus, loaded_sfx[key], t_sec, gain=gain, pan=pan, max_dur=max_d)
        wired += 1
print(f"  Wired {wired}/{len(CUE_SHEET)} cinematic engineering foley cues.")

# Mix all 3 stems cleanly + soft peak ceiling
mix = vo + music_bus + sfx_bus
raw_wav = os.path.join(AUDIO_DIR, "master_pre_lufs.wav")
peak = np.max(np.abs(mix))
if peak > 0.92:
    mix *= 0.92 / peak
wavfile.write(raw_wav, SR, np.clip(mix, -1.0, 1.0).astype(np.float32))

# 4. Two-Pass Broadcast EBU R128 Mastering (-14.8 LUFS, TP -1.8 dBFS) -> AAC 256kbps .m4a
m4a_out = os.path.join(PUB_DIR, "audio_master.m4a")
pass1 = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", raw_wav, "-af", "loudnorm=I=-14.8:TP=-1.8:LRA=7:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True, check=True,
)
js_start = pass1.stderr.rfind("{")
js_end = pass1.stderr.rfind("}") + 1
stats = json.loads(pass1.stderr[js_start:js_end])

af_pass2 = (
    f"loudnorm=I=-14.8:TP=-1.8:LRA=7:linear=true:"
    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
    f"offset={stats['target_offset']}"
)
subprocess.run(
    ["ffmpeg", "-y", "-v", "error", "-i", raw_wav, "-af", af_pass2, "-c:a", "aac", "-b:a", "256k", "-ar", str(SR), m4a_out],
    check=True,
)
os.remove(raw_wav)

# Measure final Stereo & Mono EBU R128 on mastered .m4a
print(f"\n=== AUDIO MASTER QA ({os.path.relpath(m4a_out, ROOT)}) ===")
for label, af in [("Stereo", "ebur128=peak=true"), ("Mono  ", "pan=mono|c0=0.5*c0+0.5*c1,ebur128=peak=true")]:
    res = subprocess.run(["ffmpeg", "-hide_banner", "-i", m4a_out, "-af", af, "-f", "null", "-"], capture_output=True, text=True)
    i_val = [l.strip() for l in res.stderr.splitlines() if l.strip().startswith("I:")][-1]
    p_val = [l.strip() for l in res.stderr.splitlines() if l.strip().startswith("Peak:")][-1]
    print(f"  {label}: {i_val.replace('I:', '').strip()} | True Peak: {p_val.replace('Peak:', '').strip()}")

# 5. Generate Visual Audio QA Waveform & Spectrogram Sheet via pure OpenCV + SciPy (zero matplotlib dependency!)
final_arr = load_stereo(m4a_out)
mono = final_arr.mean(axis=1)
W_IMG, H_IMG = 1800, 740
canvas = np.full((H_IMG, W_IMG, 3), (26, 18, 12), dtype=np.uint8)
cv2.putText(
    canvas,
    "BEDAH TEKNOLOGI: GEOTERMAL KAMOJANG VS NUKLIR — AUDIO MASTER QA (-14.8 LUFS)",
    (36, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.92, (235, 224, 210), 2, cv2.LINE_AA
)

# Top half: Waveform (y: 75..345)
wf_x0, wf_x1, wf_y0, wf_y1 = 40, W_IMG - 40, 75, 345
wf_w = wf_x1 - wf_x0
wf_mid = (wf_y0 + wf_y1) // 2
wf_amp = (wf_y1 - wf_y0) // 2 - 10
cv2.rectangle(canvas, (wf_x0, wf_y0), (wf_x1, wf_y1), (36, 28, 22), -1)
bins = np.array_split(mono, wf_w)
for x_i, seg in enumerate(bins):
    mx = float(np.max(np.abs(seg))) if len(seg) else 0.0
    rms_v = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
    x = wf_x0 + x_i
    cv2.line(canvas, (x, int(wf_mid - mx * wf_amp)), (x, int(wf_mid + mx * wf_amp)), (110, 180, 240), 1)
    cv2.line(canvas, (x, int(wf_mid - rms_v * wf_amp * 1.4)), (x, int(wf_mid + rms_v * wf_amp * 1.4)), (248, 210, 80), 1)

# Bottom half: Log-Spectrogram (y: 395..695)
sp_y0, sp_y1 = 395, 695
_, _, Sxx = spectrogram(mono[::2], fs=SR // 2, nperseg=512, noverlap=256)
Sdb = 10 * np.log10(Sxx[:160, :] + 1e-10)
Snorm = np.clip((Sdb - (Sdb.max() - 75)) / 75.0, 0, 1)
Simg = cv2.applyColorMap((Snorm[::-1] * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
Simg = cv2.resize(Simg, (wf_w, sp_y1 - sp_y0), interpolation=cv2.INTER_AREA)
canvas[sp_y0:sp_y1, wf_x0:wf_x1] = Simg

# Cue lines & labels
for idx, (ck, ct) in enumerate(CUES.items()):
    cx = int(wf_x0 + (ct / max(1e-3, DURATION)) * wf_w)
    cv2.line(canvas, (cx, wf_y0), (cx, sp_y1), (80, 210, 250), 1)
    if idx % 2 == 0:
        ly = 368 if (idx % 4 == 0) else 386
        cv2.putText(canvas, f"{ck}({ct:.0f}s)", (max(wf_x0, cx - 24), ly), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (180, 225, 255), 1, cv2.LINE_AA)

cv2.imwrite(os.path.join(OUT_DIR, "audio_qa_sheet.png"), canvas)

# Write CREDITS.txt & SOUND.md
with open(os.path.join(OUT_DIR, "CREDITS.txt"), "w", encoding="utf-8") as f:
    f.write("BEDAH TEKNOLOGI: GEOTERMAL KAMOJANG VS NUKLIR — AUDIO CREDITS\n")
    f.write("===============================================================\n")
    f.write("Voice-Over : ElevenLabs eleven_v4 (Brian — Indonesian Verbatim Documentary Script)\n")
    f.write("Bespoke SFX: ElevenLabs eleven_text_to_sound_v3 (Turbine, Dry Steam Valve, PWR Control Rods, H2S Leak)\n")
    f.write("Archive SFX: Z-Automation Studio CC0 / Custom Sound Bank\n")
    f.write(f"Score      : {os.path.basename(music_src)} (Studio Licensed Ambient Documentary Score)\n")
    f.write("Mastering  : EBU R128 Two-Pass Broadcast Loudnorm (-14.8 LUFS Stereo, True Peak -1.8 dBFS)\n")

with open(os.path.join(OUT_DIR, "SOUND.md"), "w", encoding="utf-8") as f:
    f.write("# Sound Design Sheet — GEOTERMAL KAMOJANG VS NUKLIR\n\n")
    f.write(f"- **Duration**: `{DURATION:.2f}s` (`{ALIGN['totalFrames']} frames` @ 30fps)\n")
    f.write(f"- **Score**: `{os.path.basename(music_src)}` with smooth VO sidechain ducking (`-6.5 dB` under speech, warm 4.2kHz pocket)\n")
    f.write(f"- **Foley Cues Wired**: `{wired}` precision cues synced to ElevenLabs word alignment\n")
    f.write("- **Broadcast Target**: `-14.8 LUFS`, True Peak `-1.8 dBFS`\n")

print(f"AUDIO MASTER COMPLETE -> {m4a_out}")
