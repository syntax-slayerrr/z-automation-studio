import cv2
import numpy as np
import math

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
cap = cv2.VideoCapture(VIDEO_PATH)

def get_frame(fi):
    cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
    _, fr = cap.read()
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

# 1. Exact circle fit for f=1075, 1085, 1095, 1110, 1130, 1145 using the crisp outer edge of the era band!
print("=== 1. EXACT CLOSE-UP CIRCLE FIT (f=1075..1145) ===")
for fi in [1075, 1085, 1095, 1110, 1130, 1145]:
    rgb = get_frame(fi).astype(np.int32)
    pts_era_out = []
    pts_vp = []
    for x in range(20, 700, 10):
        # Skip the black clock hand region (x in 460..580)
        if 460 <= x <= 580:
            continue
        col = rgb[280:750, x]
        # Colored era arc: either teal (G>130, B>125, R<115), purple (B>175, R>135, G<155), yellow-gold (R>190, G>160, B<120), or orange (R>200, G<120, B<90)
        is_teal = (col[:, 1] > 130) & (col[:, 2] > 125) & (col[:, 0] < 120)
        is_purp = (col[:, 2] > 175) & (col[:, 0] > 135) & (col[:, 1] < 160)
        is_orng = (col[:, 0] > 200) & (col[:, 1] < 125) & (col[:, 2] < 95)
        ys_era = np.where(is_teal | is_purp | is_orng)[0] + 280
        if len(ys_era) >= 4:
            pts_era_out.append((x, float(ys_era.min())))
        # Dark viewport boundary below bevel (y > 420): drop from R>175 to R<155
        bright_bevel = np.where((col[140:, 0] > 175) & (col[140:, 1] > 155))[0] + 420
        if len(bright_bevel) >= 10:
            pts_vp.append((x, float(bright_bevel.max())))
    if len(pts_era_out) >= 8 and len(pts_vp) >= 8:
        cx1, cy1, r_era = fit_circle(pts_era_out)
        cx2, cy2, r_vp = fit_circle(pts_vp)
        print(f"f={fi:04d}: ERA_OUT=({cx1:6.1f},{cy1:6.1f}, r={r_era:6.1f}, s={r_era/282:.3f}) | VP=({cx2:6.1f},{cy2:6.1f}, r={r_vp:6.1f}, s={r_vp/216:.3f})")

# 2. Exact clock scales & centers across Scene 1, 2->3, 4, 6a, 7
print("\n=== 2. EXACT SCALE & CENTER ACROSS ALL CLOCK SCENES ===")
for fi in [5, 10, 15, 21, 30, 60, 120, 180, 210, 225, 232, 405, 420, 574, 585, 630, 675, 690, 1005, 1030, 1050, 1165, 1175, 1185, 1193]:
    rgb = get_frame(fi)
    roi = rgb[570:760, 320:400].astype(np.float32)
    gold = roi[:, :, 0] + 0.4 * roi[:, :, 1] - 1.9 * roi[:, :, 2]
    my, mx = np.unravel_index(np.argmax(gold), gold.shape)
    sub = rgb[max(0, 570+my-18):570+my+18, max(0, 320+mx-18):320+mx+18].mean(axis=2)
    hy, hx = np.unravel_index(np.argmin(sub), sub.shape)
    cx_p = 320 + mx - 18 + hx
    cy_p = 570 + my - 18 + hy
    # Measure outer cream edge along -45 deg (top-left) and +45 deg (top-right) and 0/+180 deg to get exact r_ch_out
    rs = []
    for deg in [0, 30, 150, 180, 210, 240, 300, 330]:
        rad = math.radians(deg)
        ca, sa = math.cos(rad), math.sin(rad)
        last_cr = 0
        for r in range(220, 420):
            px, py = int(round(cx_p + r * ca)), int(round(cy_p + r * sa))
            if 2 <= px < 718 and 2 <= py < 1278:
                R, G, B = int(rgb[py, px, 0]), int(rgb[py, px, 1]), int(rgb[py, px, 2])
                if R > 180 and G > 165 and B > 130 and (R - B) < 75:
                    last_cr = r
        if last_cr > 250:
            rs.append(last_cr)
    r_ch = float(np.median(rs)) if rs else 0.0
    print(f"f={fi:04d}: pin=({cx_p:3d},{cy_p:3d}) r_ch_out={r_ch:5.1f} (scale_rel_338={r_ch/338.0:.3f})")

# 3. Measure Scene 2 molten sphere & cloud line in f=270
rgb270 = get_frame(270)
print("\n=== 3. SCENE 2 CLOUD TOP Y ACROSS X (f=270) ===")
for x in range(40, 700, 60):
    col = rgb270[680:880, x, :].astype(np.int32)
    # Cloud ridge has R<135, G<65, B<65
    ys = np.where((col[:, 0] < 140) & (col[:, 1] < 65) & (col[:, 2] < 60))[0] + 680
    print(f"  x={x:3d}: cloud_top_y={ys.min() if len(ys) else 'none'}")

# 4. Measure Scene 3 exact microbe centers on f=480 using HSV / bright green-cyan mask
rgb480 = get_frame(480)
# Mask out diagonal sunbeams by subtracting a blurred vertical/diagonal line or just inspect centers of blobs in f=495
# Actually let's measure top canopy y and bottom floor y across x in f=480!
print("\n=== 4. SCENE 3 TOP & BOTTOM WAVE CANOPY Y (f=480) ===")
for x in range(40, 700, 80):
    col = rgb480[:, x, :]
    # Top canopy is dark teal R<45, G<125, B<125 in y=50..220
    top_y = np.where((col[50:220, 0] < 48) & (col[50:220, 1] < 128))[0] + 50
    # Bottom ocean floor is dark teal R<35, G<105 in y=860..1020
    bot_y = np.where((col[860:1020, 0] < 38) & (col[860:1020, 1] < 105))[0] + 860
    print(f"  x={x:3d}: top_canopy_max_y={top_y.max() if len(top_y) else 'none'}, bot_floor_min_y={bot_y.min() if len(bot_y) else 'none'}")

cap.release()
