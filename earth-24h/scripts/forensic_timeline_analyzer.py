import cv2
import numpy as np
import json
import os

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
OUT_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data"

cap = cv2.VideoCapture(VIDEO_PATH)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Let's sample every 10 frames or key transition frames and save a comprehensive summary
# More importantly, let's measure:
# 1. Exact fade-in curve at start (f=0..25)
# 2. Exact white flash curve at asteroid impact (f=915..955)
# 3. Exact camera zoom transitions by tracking the cream clock ring radius in frames where the clock is visible!

ring_radii = []
for f_idx in range(total_frames):
    ret, frame = cap.read()
    if not ret:
        break
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    # Check vertical line x=360 from y=0 to y=1280 for the cream chapter ring (R>200, G>190, B>155)
    col = rgb[:, 360, :]
    cream_y = np.where((col[:, 0] > 195) & (col[:, 1] > 180) & (col[:, 2] > 145))[0]
    # Filter out subtitle region (y > 950) and top header text (y < 230 unless zoomed in)
    ring_radii.append({
        "f": f_idx,
        "t": round(f_idx / 30.0, 3),
        "mean_rgb": rgb.mean(axis=(0, 1)).round(1).tolist(),
        "center_rgb": rgb[580:620, 340:380].mean(axis=(0, 1)).round(1).tolist(),
        "top_header_rgb": rgb[110:200, 200:520].mean(axis=(0, 1)).round(1).tolist()
    })

cap.release()

with open(os.path.join(OUT_DIR, "timeline_curves.json"), "w", encoding="utf-8") as f:
    json.dump(ring_radii, f, indent=2)

# Print key transition windows where mean_rgb or center_rgb changes rapidly
print("=== KEY TRANSITION WINDOWS ===")
for i in range(1, len(ring_radii)):
    c0 = np.array(ring_radii[i-1]["center_rgb"])
    c1 = np.array(ring_radii[i]["center_rgb"])
    m0 = np.array(ring_radii[i-1]["mean_rgb"])
    m1 = np.array(ring_radii[i]["mean_rgb"])
    if np.linalg.norm(c1 - c0) > 8.0 or np.linalg.norm(m1 - m0) > 5.0:
        print(f"f={i:04d} ({i/30.0:6.3f}s): d_center={np.linalg.norm(c1-c0):5.1f} d_mean={np.linalg.norm(m1-m0):5.1f} center={ring_radii[i]['center_rgb']} mean={ring_radii[i]['mean_rgb']}")
