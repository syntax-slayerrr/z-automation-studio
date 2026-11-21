"""Build a 4x3 contact sheet from 12 pre-flight stills for RelKeretaShort V2 QA."""
import subprocess, sys, os

STILLS_DIR = os.path.join(os.path.dirname(__file__), "..", "out", "preflight_stills")
OUT = os.path.join(os.path.dirname(__file__), "..", "out", "preflight_qa_12frames.jpg")

frames = [0, 120, 350, 520, 880, 980, 1260, 1440, 1620, 1960, 2350, 2532]

# Check all stills exist
missing = [f for f in frames if not os.path.exists(os.path.join(STILLS_DIR, f"f{f}.jpg"))]
if missing:
    print(f"ERROR: Missing stills for frames: {missing}")
    sys.exit(1)

# Build montage with labels using ffmpeg tile filter
inputs = []
filter_parts = []
for i, f in enumerate(frames):
    path = os.path.join(STILLS_DIR, f"f{f}.jpg")
    inputs.extend(["-i", path])
    filter_parts.append(f"[{i}:v]scale=360:640,drawtext=text='F{f}':fontsize=28:fontcolor=white:borderw=2:bordercolor=black:x=8:y=8[t{i}]")

# Use xstack for 4x3 grid
layout_parts = []
for row in range(3):
    for col in range(4):
        idx = row * 4 + col
        x = col * 360
        y = row * 640
        layout_parts.append(f"{x}_{y}")

filter_str = ";".join(filter_parts)
tile_inputs = "".join(f"[t{i}]" for i in range(12))
filter_str += f";{tile_inputs}xstack=inputs=12:layout={'|'.join(layout_parts)}[out]"

cmd = [
    "ffmpeg", "-y",
    *inputs,
    "-filter_complex", filter_str,
    "-map", "[out]",
    "-q:v", "2",
    OUT
]

print(f"Building 4x3 contact sheet -> {OUT}")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print("STDERR:", result.stderr[-800:] if result.stderr else "none")
    sys.exit(1)

size = os.path.getsize(OUT)
print(f"OK: {OUT} ({size/1024:.0f} KB)")
