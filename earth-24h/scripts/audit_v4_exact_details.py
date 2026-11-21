import cv2
import numpy as np
import math

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
cap = cv2.VideoCapture(VIDEO_PATH)

def get_frame(f_idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, fr = cap.read()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)

def fit_circle(pts):
    px = np.array([p[0] for p in pts], dtype=np.float64)
    py = np.array([p[1] for p in pts], dtype=np.float64)
    A = np.column_stack([2 * px, 2 * py, np.ones_like(px)])
    b = px**2 + py**2
    c, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy = c[0], c[1]
    r = math.sqrt(max(0.0, c[2] + cx**2 + cy**2))
    return cx, cy, r

print("=== 1. PRECISE CLOCK CARDINAL BOUNDS (NO SUBTITLE MASK INTERFERENCE) ===")
for fi in [12, 21, 30, 60, 120, 180, 210, 225, 405, 420, 575, 600, 630, 660, 690, 1005, 1030, 1050, 1165, 1175, 1185, 1193]:
    rgb = get_frame(fi)
    # Find cream ring along column x=360 (top and bottom of ring) and along row y=cy
    # Cream ring has R>195, G>180, B>145, R-B<75
    col = rgb[200:1150, 360, :].astype(np.int32)
    is_cream_c = (col[:, 0] > 195) & (col[:, 1] > 178) & (col[:, 2] > 142) & ((col[:, 0] - col[:, 2]) < 75)
    # Ignore subtitle card (y=960..1090) unless fi >= 1160 where subtitle card is gone!
    if fi < 1160:
        is_cream_c[960-200:1095-200] = False
    ys = np.where(is_cream_c)[0] + 200
    top_ys = ys[ys < 560]
    bot_ys = ys[ys > 680]
    y_out_top = int(top_ys.min()) if len(top_ys) else -1
    y_in_top = int(top_ys.max()) if len(top_ys) else -1
    y_in_bot = int(bot_ys.min()) if len(bot_ys) else -1
    y_out_bot = int(bot_ys.max()) if len(bot_ys) else -1
    cy_est = (y_out_top + y_out_bot) / 2.0 if (y_out_top > 0 and y_out_bot > 0) else 620.0
    r_out_y = (y_out_bot - y_out_top) / 2.0 if (y_out_top > 0 and y_out_bot > 0) else 0.0
    r_in_y = (y_in_bot - y_in_top) / 2.0 if (y_in_top > 0 and y_in_bot > 0) else 0.0

    # Along row y=int(cy_est)
    row = rgb[int(round(cy_est)), :, :].astype(np.int32)
    is_cream_r = (row[:, 0] > 195) & (row[:, 1] > 178) & (row[:, 2] > 142) & ((row[:, 0] - row[:, 2]) < 75)
    xs = np.where(is_cream_r)[0]
    l_xs = xs[xs < 340]
    r_xs = xs[xs > 380]
    x_out_l = int(l_xs.min()) if len(l_xs) else -1
    x_in_l = int(l_xs.max()) if len(l_xs) else -1
    x_in_r = int(r_xs.min()) if len(r_xs) else -1
    x_out_r = int(r_xs.max()) if len(r_xs) else -1
    cx_est = (x_out_l + x_out_r) / 2.0 if (x_out_l >= 0 and x_out_r >= 0) else 360.0
    r_out_x = (x_out_r - x_out_l) / 2.0 if (x_out_l >= 0 and x_out_r >= 0) else 0.0
    r_in_x = (x_in_r - x_in_l) / 2.0 if (x_in_l >= 0 and x_in_r >= 0) else 0.0
    print(f"f={fi:04d}: center=({cx_est:5.1f},{cy_est:5.1f}) r_out=(x:{r_out_x:5.1f}, y:{r_out_y:5.1f}) r_in=(x:{r_in_x:5.1f}, y:{r_in_y:5.1f})")

print("\n=== 2. CLOSE-UP f=1075..1145 EXACT ARC POINTS ===")
for fi in [1075, 1095, 1115, 1130, 1145]:
    rgb = get_frame(fi)
    # Find the colored era arc (orange/teal/purple/yellow) and inner viewport arc across x = [60..660]
    pts_era = []
    pts_vp = []
    for x in range(40, 680, 15):
        col = rgb[280:650, x, :].astype(np.int32)
        # Cream bevel right above the dark inner viewport (y between 350 and 650)
        # In the top-left close-up, the dark viewport starts below the cream bevel!
        # Let's detect where R drops below 165 going downward from the cream ring (R>200)
        cream_idx = np.where((col[:, 0] > 205) & (col[:, 1] > 190) & (col[:, 2] > 155) & ((col[:, 0] - col[:, 2]) < 75))[0]
        if len(cream_idx) > 15:
            y_bot = 280 + cream_idx.max()
            # Exclude clock hand at center (x=360..420)
            if not (350 <= x <= 430):
                pts_vp.append((x, y_bot))
        # Also detect top edge of cream ring (where bezel gold transitions to cream)
        if len(cream_idx) > 15 and not (350 <= x <= 430):
            pts_era.append((x, 280 + cream_idx.min()))
    if len(pts_vp) >= 6:
        cx_v, cy_v, r_v = fit_circle(pts_vp)
        cx_e, cy_e, r_e = fit_circle(pts_era) if len(pts_era) >= 6 else (0,0,0)
        print(f"f={fi:04d}: VP_ARC center=({cx_v:5.1f},{cy_v:5.1f}) r_vp={r_v:5.1f} | OUTER_CREAM center=({cx_e:5.1f},{cy_e:5.1f}) r_out={r_e:5.1f}")

print("\n=== 3. SCENE 2 MOLTEN EARTH EXACT BOUNDS (f=270, 330) ===")
rgb270 = get_frame(270)
# Find molten sphere bright boundary along x=360 and y=562
for y in range(280, 780, 40):
    print(f"y={y:3d} x=360: RGB={rgb270[y, 360].tolist()}")
print("Horizontal at y=550:")
for x in range(100, 620, 40):
    print(f"x={x:3d} y=550: RGB={rgb270[550, x].tolist()}")

print("\n=== 4. SCENE 3 OCEAN MICROBES EXACT BOUNDING BOXES (f=480) ===")
rgb480 = get_frame(480)
# Find all bright microbe / bubble clusters in y=240..920
mask_mic = (rgb480[:, :, 1] > 175) & (rgb480[:, :, 2] > 140)
mask_mic[:230, :] = False
mask_mic[920:, :] = False
num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(mask_mic.astype(np.uint8))
print(f"Detected {num_l-1} bright elements in ocean f=480 (area >= 20):")
for i in range(1, num_l):
    area = stats[i, cv2.CC_STAT_AREA]
    x, y, w, h = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP], stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
    if area >= 25 and w < 180:  # exclude long diagonal sunbeams
        print(f"  elem {i:2d}: center=({centroids[i][0]:5.1f},{centroids[i][1]:5.1f}) bbox=[{x},{y},{w},{h}] area={area}")

cap.release()
