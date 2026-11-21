import cv2
import numpy as np
import json
import math

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
cap = cv2.VideoCapture(VIDEO_PATH)

def get_frame(fi):
    cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
    _, fr = cap.read()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)

# 1. Inspect exact Scene 2 (f=270) sphere, clouds, and dark side curtains
f270 = get_frame(270)
# Measure bright hotspots inside sphere (x=150..570, y=350..770)
# Find local maxima of luminance inside sphere
luma270 = f270.mean(axis=2)
yy, xx = np.mgrid[0:1280, 0:720]
sph = ((xx - 360)**2 + (yy - 562)**2) <= 212**2
# Also check exact RGB at top/left/right of sphere to measure sphere shading gradient
print("=== 1. SCENE 2 SPHERE RADIAL SHADING (f=270) ===")
for dy in [-210, -180, -140, -80, 0, 80, 140, 180, 210]:
    print(f"  dy={dy:4d} (y={562+dy}): RGB={f270[562+dy, 360].tolist()}")

# 2. Extract exact Scene 3 (f=480) sunbeams top/bottom X coordinates and microbe centers!
f480 = get_frame(480)
print("\n=== 2. SCENE 3 SUNBEAMS AT y=220 AND y=700 (f=480) ===")
for y_scan in [220, 450, 700]:
    row = f480[y_scan, :, :]
    # Sunbeams are very bright cyan-white (R>180, G>225, B>220)
    bright_x = np.where((row[:, 0] > 175) & (row[:, 1] > 220) & (row[:, 2] > 220))[0]
    # Group contiguous segments
    segs = []
    if len(bright_x):
        s0 = bright_x[0]
        p = bright_x[0]
        for x in bright_x[1:]:
            if x > p + 3:
                segs.append((int(s0), int(p), int((s0+p)/2), int(p-s0+1)))
                s0 = x
            p = x
        segs.append((int(s0), int(p), int((s0+p)/2), int(p-s0+1)))
    print(f"  y={y_scan}: segments (x0, x1, cx, w) = {segs}")

# 3. Inspect f=0780 palm tree trunks & crowns exact positions
f780 = get_frame(780)
print("\n=== 3. SCENE 5 PALM TREE TRUNKS AT y=680 AND CROWN CENTERS (f=780) ===")
# Palm trunks are vertical dark purple bars in y=500..850
row680 = f780[680, :, :].astype(np.int32)
dark_x = np.where((row680[:, 0] < 90) & (row680[:, 2] < 130))[0]
segs = []
if len(dark_x):
    s0 = p = dark_x[0]
    for x in dark_x[1:]:
        if x > p + 3:
            segs.append((int(s0), int(p), int((s0+p)/2), int(p-s0+1)))
            s0 = x
        p = x
    segs.append((int(s0), int(p), int((s0+p)/2), int(p-s0+1)))
print("  y=680 dark vertical bars (trunks/legs):", segs)

# Also check palm tree crown tops in f=960 (against orange dust where palms stand out sharply!)
f960 = get_frame(960)
row520 = f960[520, :, :].astype(np.int32)
# Trunks against orange dust (orange has R>175, palm trunks have R<120)
trunk_x = np.where(row520[:, 0] < 130)[0]
tsegs = []
if len(trunk_x):
    s0 = p = trunk_x[0]
    for x in trunk_x[1:]:
        if x > p + 3:
            tsegs.append((int(s0), int(p), int((s0+p)/2), int(p-s0+1)))
            s0 = x
        p = x
    tsegs.append((int(s0), int(p), int((s0+p)/2), int(p-s0+1)))
print("  f=960 y=520 palm trunks:", tsegs)

# 4. Exact clock hand trajectories in f=0..220 by looking at the darkest pixels on r=175..210
# Wait: earlier we found f=60 had min_hand=352, f=90 had 262, f=120 had 278... let's inspect every 15 frames in f=0..215!
print("\n=== 4. CLOCK ERA PROGRESS IN SEQUENCE 1 (f=0..215) ===")
for fi in range(15, 225, 15):
    rgb = get_frame(fi).astype(np.int32)
    # Sample along the era arc circle r = 272 * scale around (357, 622)
    # Actually let's scan r=250..295 at every 15 degrees (hours 1..24) to see which hours have colored orange/teal arc!
    active_hours = []
    for h in range(24):
        rad = math.radians(-90.0 + (h + 0.5) * 15.0)
        # Check r in 255..285
        has_color = False
        for r in range(255, 286, 3):
            px = int(round(357 + r * math.cos(rad)))
            py = int(round(622 + r * math.sin(rad)))
            if 0 <= px < 720 and 0 <= py < 1280:
                R, G, B = rgb[py, px]
                # Orange (R-B > 70) or Teal (G-R > 20)
                if (R > 180 and R - B > 75) or (G > 130 and G - R > 20):
                    has_color = True
                    break
        if has_color:
            active_hours.append(h)
    print(f"  f={fi:04d}: active_era_hours={active_hours}")

cap.release()
