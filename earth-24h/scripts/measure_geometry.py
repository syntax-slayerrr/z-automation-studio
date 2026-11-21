import cv2
import numpy as np
import json

with open(r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data\frames_meta.json", "r", encoding="utf-8") as f:
    data = json.load(f)

frames = data["frames"]

# 1. Find subtitle card intervals where cream_pixels > 1500
sub_intervals = []
in_sub = False
start_f = 0
boxes = []
for fr in frames:
    if fr["cream_pixels"] > 1500:
        if not in_sub:
            in_sub = True
            start_f = fr["f"]
            boxes = [fr["sub_bbox"]]
        else:
            boxes.append(fr["sub_bbox"])
    else:
        if in_sub:
            in_sub = False
            arr = np.array(boxes)
            med_box = np.median(arr, axis=0).astype(int).tolist()
            sub_intervals.append({
                "start_f": start_f,
                "end_f": fr["f"] - 1,
                "start_t": round(start_f / 30.0, 3),
                "end_t": round((fr["f"] - 1) / 30.0, 3),
                "median_bbox": med_box
            })
if in_sub:
    arr = np.array(boxes)
    med_box = np.median(arr, axis=0).astype(int).tolist()
    sub_intervals.append({
        "start_f": start_f,
        "end_f": frames[-1]["f"],
        "start_t": round(start_f / 30.0, 3),
        "end_t": round(frames[-1]["f"] / 30.0, 3),
        "median_bbox": med_box
    })

print("=== SUBTITLE CARD INTERVALS (cream_pixels > 1500) ===")
for idx, s in enumerate(sub_intervals):
    print(f"Card {idx+1:02d}: f={s['start_f']:04d}..{s['end_f']:04d} ({s['start_t']:.2f}s - {s['end_t']:.2f}s) bbox={s['median_bbox']}")

# 2. Measure Clock Center and Radial Profile on frame_0120.png (t=4.00s) and frame_0210.png (t=7.00s)
img210 = cv2.imread(r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data\keyframes\frame_0210.png")
rgb210 = cv2.cvtColor(img210, cv2.COLOR_BGR2RGB)

# Find the brass center pin in [580:660, 320:400]
# The center pin has a dark center hole surrounded by a bright gold ring
roi = rgb210[580:660, 320:400]
# Let's find the gold ring center or dark hole center
gray_roi = cv2.cvtColor(img210[580:660, 320:400], cv2.COLOR_BGR2GRAY)
# Let's print the horizontal and vertical profiles around the center of the clock
# Or find circles using HoughCircles on frame_0210
gray210 = cv2.cvtColor(img210, cv2.COLOR_BGR2GRAY)
circles = cv2.HoughCircles(gray210, cv2.HOUGH_GRADIENT, dp=1, minDist=100, param1=100, param2=50, minRadius=150, maxRadius=360)
if circles is not None:
    print("\n=== HOUGH CIRCLES ON FRAME 210 ===")
    for c in circles[0]:
        print(f"center=({c[0]:.1f}, {c[1]:.1f}), r={c[2]:.1f}")

# Let's refine center by finding the exact symmetry center of the cream dial ring
# Cream dial ring has R>200, G>190, B>165
dial_mask = (rgb210[:, :, 0] > 205) & (rgb210[:, :, 1] > 195) & (rgb210[:, :, 2] > 170)
# Restrict to y in [250..960]
dial_mask[:250, :] = False
dial_mask[960:, :] = False
ys, xs = np.where(dial_mask)
cx = float(np.mean(xs))
cy = float(np.mean(ys))
print(f"\nCream dial centroid: cx={cx:.2f}, cy={cy:.2f}, x_range=[{xs.min()}, {xs.max()}], y_range=[{ys.min()}, {ys.max()}]")
print(f"Cream dial midpoint: cx={(xs.min()+xs.max())/2:.1f}, cy={(ys.min()+ys.max())/2:.1f}, rx={(xs.max()-xs.min())/2:.1f}, ry={(ys.max()-ys.min())/2:.1f}")

# Sample radial color profile from (360, 616) going right (+x), left (-x), up (-y), down (+y)
cx_i, cy_i = int(round((xs.min()+xs.max())/2)), int(round((ys.min()+ys.max())/2))
print(f"\n=== RADIAL PROFILE FROM ({cx_i}, {cy_i}) ALONG +X (r=0..355) ===")
for r in range(0, 358, 4):
    if cx_i + r < 720:
        px = rgb210[cy_i, cx_i + r].tolist()
        print(f"r={r:3d}: RGB={px} #{px[0]:02x}{px[1]:02x}{px[2]:02x}")
