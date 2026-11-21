import cv2
import numpy as np
import json
import os

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
OUT_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data"
os.makedirs(OUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

frames_meta = []
prev_gray = None

# Sample key frames at high resolution for exact geometric & color measurements
key_frame_indices = [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 220, 225, 230, 235, 240,
    250, 260, 270, 285, 300, 330, 360, 385, 395, 405, 415, 425, 430, 435, 445,
    460, 495, 525, 555, 565, 575, 585, 600, 630, 660, 675, 685, 690, 695, 705,
    715, 725, 750, 780, 810, 840, 855, 885, 900, 910, 920, 925, 930, 935, 945,
    960, 975, 990, 998, 1005, 1015, 1030, 1050, 1065, 1080, 1095, 1110, 1125,
    1130, 1140, 1155, 1170, 1185, 1193
]
key_frames_dir = os.path.join(OUT_DIR, "keyframes")
os.makedirs(key_frames_dir, exist_ok=True)

frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    diff = float(np.mean(np.abs(gray.astype(np.float32) - prev_gray.astype(np.float32)))) if prev_gray is not None else 0.0
    prev_gray = gray

    # Measure mean RGB in key regions:
    # 1. Background top-left corner (10..60, 10..60)
    # 2. Header region (y: 120..260, x: 150..570)
    # 3. Clock center region (y: 550..750, x: 260..460)
    # 4. Clock chapter ring top (y: 310..360, x: 330..390)
    # 5. Subtitle paper strip region (y: 960..1070, x: 120..600)
    bg_rgb = cv2.cvtColor(frame[10:60, 650:710], cv2.COLOR_BGR2RGB).mean(axis=(0, 1)).round(1).tolist()
    center_rgb = cv2.cvtColor(frame[550:750, 260:460], cv2.COLOR_BGR2RGB).mean(axis=(0, 1)).round(1).tolist()
    ring_rgb = cv2.cvtColor(frame[315:355, 340:380], cv2.COLOR_BGR2RGB).mean(axis=(0, 1)).round(1).tolist()
    sub_region = frame[950:1090, 80:640]
    # Check if cream paper subtitle box is present (high brightness pixels > 200)
    cream_mask = (sub_region[:, :, 2] > 200) & (sub_region[:, :, 1] > 195) & (sub_region[:, :, 0] > 175)
    cream_pixels = int(np.sum(cream_mask))
    sub_bbox = None
    if cream_pixels > 1500:
        ys, xs = np.where(cream_mask)
        sub_bbox = [int(xs.min() + 80), int(ys.min() + 950), int(xs.max() + 80), int(ys.max() + 950)]

    frames_meta.append({
        "f": frame_idx,
        "t": round(frame_idx / fps, 4),
        "diff": round(diff, 3),
        "mean_luma": round(float(gray.mean()), 2),
        "bg_rgb": bg_rgb,
        "center_rgb": center_rgb,
        "ring_rgb": ring_rgb,
        "cream_pixels": cream_pixels,
        "sub_bbox": sub_bbox
    })

    if frame_idx in key_frame_indices:
        cv2.imwrite(os.path.join(key_frames_dir, f"frame_{frame_idx:04d}.png"), frame)

    frame_idx += 1

cap.release()

with open(os.path.join(OUT_DIR, "frames_meta.json"), "w", encoding="utf-8") as f:
    json.dump({
        "total_frames": frame_idx,
        "fps": fps,
        "width": width,
        "height": height,
        "frames": frames_meta
    }, f, indent=2)

print(f"Processed {frame_idx} frames. Saved metadata and {len(key_frame_indices)} keyframes.")
