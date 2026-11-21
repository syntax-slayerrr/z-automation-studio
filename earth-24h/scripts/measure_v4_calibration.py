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

print("=== 1. EXACT BRASS CENTER PIN & OUTER BEZEL FIT FOR ALL FULL CLOCK FRAMES ===")
full_clock_frames = [12, 21, 30, 45, 60, 90, 120, 150, 180, 210, 225, 232,
                     400, 405, 415, 425, 432,
                     570, 576, 585, 600, 615, 630, 645, 660, 675, 690, 696,
                     1002, 1010, 1020, 1035, 1050,
                     1155, 1165, 1175, 1185, 1193]

for fi in full_clock_frames:
    rgb = get_frame(fi)
    # Find dark hole inside brass center pin (search around x=330..390, y=580..740)
    # The brass pin ring has bright gold (R>180, G>135, B<105) surrounding a tiny dark dot
    roi = rgb[570:750, 320:400].astype(np.float32)
    gold_score = roi[:, :, 0] + 0.4 * roi[:, :, 1] - 1.9 * roi[:, :, 2]
    # Find peak gold circle centroid
    ys, xs = np.where(gold_score > 140)
    # Filter to tight cluster around median
    if len(xs) > 20:
        mx, my = np.median(xs), np.median(ys)
        in_pin = (np.abs(xs - mx) < 22) & (np.abs(ys - my) < 22)
        cx_pin = 320 + np.mean(xs[in_pin])
        cy_pin = 570 + np.mean(ys[in_pin])
    else:
        cx_pin, cy_pin = 360.0, 620.0

    # Measure radius of outer cream chapter ring (boundary between cream and gold bezel)
    # Along +Y (top) and -Y (bottom) at x = cx_pin, and along diagonal rays (+-45 deg) to avoid screen edges!
    pts_outer = []
    pts_inner = []
    for deg in range(0, 360, 10):
        # Skip bottom subtitle zone (angles 65..115 deg if fi < 1160)
        if fi < 1160 and 65 <= deg <= 115:
            continue
        rad = math.radians(deg)
        ca, sa = math.cos(rad), math.sin(rad)
        cream_rs = []
        for r in range(150, 390):
            px = int(round(cx_pin + r * ca))
            py = int(round(cy_pin + r * sa))
            if 2 <= px < 718 and 2 <= py < 1278:
                R, G, B = int(rgb[py, px, 0]), int(rgb[py, px, 1]), int(rgb[py, px, 2])
                if R > 192 and G > 175 and B > 140 and (R - B) < 75:
                    cream_rs.append(r)
        if len(cream_rs) > 40:
            pts_inner.append((cx_pin + cream_rs[0] * ca, cy_pin + cream_rs[0] * sa))
            pts_outer.append((cx_pin + cream_rs[-1] * ca, cy_pin + cream_rs[-1] * sa))

    if len(pts_outer) >= 8:
        cx_o, cy_o, r_o = fit_circle(pts_outer)
        cx_i, cy_i, r_i = fit_circle(pts_inner)
        scale_est = r_o / 330.0
        print(f"f={fi:04d}: pin=({cx_pin:5.1f},{cy_pin:5.1f}) | OUT=({cx_o:5.1f},{cy_o:5.1f}) r_out={r_o:5.1f} | IN r_in={r_i:5.1f} | scale={scale_est:.3f}")
    else:
        print(f"f={fi:04d}: pin=({cx_pin:5.1f},{cy_pin:5.1f}) | pts_outer={len(pts_outer)}")

print("\n=== 2. EXACT CLOCK HAND ANGLES IN SEQUENCE 1 & SEQUENCE 4 ===")
# Sample along radius r=180..215 from pin center to detect the dark minute hand angle!
for fi in [12, 21, 30, 45, 60, 75, 90, 120, 150, 180, 210, 585, 600, 615, 630, 645, 660, 675, 690]:
    rgb = get_frame(fi)
    roi = rgb[570:680, 320:400].astype(np.float32)
    gold_score = roi[:, :, 0] + 0.4 * roi[:, :, 1] - 1.9 * roi[:, :, 2]
    ys, xs = np.where(gold_score > 140)
    cx_pin = 320 + np.median(xs) if len(xs) > 15 else 360.0
    cy_pin = 570 + np.median(ys) if len(ys) > 15 else 620.0
    # Find darkest ray at r = 165..195 (minute hand) and r = 90..120 (hour hand)
    min_scores = []
    hour_scores = []
    for deg in range(0, 360, 2):
        rad = math.radians(deg - 90.0) # 0 deg = 24 (top)
        ca, sa = math.cos(rad), math.sin(rad)
        luma_m = np.mean([rgb[int(cy_pin + r * sa), int(cx_pin + r * ca)].mean() for r in range(160, 200, 4)])
        luma_h = np.mean([rgb[int(cy_pin + r * sa), int(cx_pin + r * ca)].mean() for r in range(85, 130, 4)])
        min_scores.append((luma_m, deg))
        hour_scores.append((luma_h, deg))
    min_scores.sort()
    hour_scores.sort()
    print(f"f={fi:04d}: darkest min_hand_deg={min_scores[0][1]:3d}° (luma={min_scores[0][0]:4.1f}) | darkest hour_or_min_deg={hour_scores[0][1]:3d}° / 2nd={hour_scores[10][1]:3d}°")

print("\n=== 3. EXACT CLOSE-UP f=1075..1145 CIRCLE FIT FROM TOP ERA ARC ===")
for fi in [1075, 1085, 1095, 1110, 1130, 1145]:
    rgb = get_frame(fi)
    # Detect the outer edge of the cream chapter ring (boundary with scalloped gold bezel) at top y=220..520 across x=40..680
    # Bezel gold has lower B (<120) and higher R-B (>65), cream chapter ring has B>155 and R-B<60
    pts_top_cream = []
    pts_vp_edge = []
    for x in range(20, 700, 10):
        col = rgb[220:750, x, :].astype(np.int32)
        cream = (col[:, 0] > 195) & (col[:, 1] > 180) & (col[:, 2] > 145) & ((col[:, 0] - col[:, 2]) < 65)
        ys = np.where(cream)[0] + 220
        if len(ys) > 20:
            pts_top_cream.append((x, int(ys.min())))
            if not (390 <= x <= 480): # avoid clock hand
                pts_vp_edge.append((x, int(ys.max())))
    if len(pts_top_cream) >= 10:
        cx_c, cy_c, r_c = fit_circle(pts_top_cream)
        cx_v, cy_v, r_v = fit_circle(pts_vp_edge) if len(pts_vp_edge) >= 10 else (0,0,0)
        print(f"f={fi:04d}: TOP_CREAM=({cx_c:5.1f},{cy_c:5.1f}, r={r_c:5.1f}, scale={r_c/330:.3f}) | VP_EDGE=({cx_v:5.1f},{cy_v:5.1f}, r={r_v:5.1f}, scale={r_v/212:.3f})")

print("\n=== 4. SUBTITLE CARD CENTERS ===")
for fi in [60, 210, 270, 480, 630, 780, 920, 960, 1095]:
    rgb = get_frame(fi)
    sub = (rgb[950:1095, 40:680, 0] > 210) & (rgb[950:1095, 40:680, 1] > 200) & (rgb[950:1095, 40:680, 2] > 180)
    ys, xs = np.where(sub)
    if len(xs):
        x0, x1 = xs.min() + 40, xs.max() + 40
        y0, y1 = ys.min() + 950, ys.max() + 950
        print(f"f={fi:04d}: x=[{x0}..{x1}] cx={(x0+x1)/2:.1f} w={x1-x0} | y=[{y0}..{y1}] cy={(y0+y1)/2:.1f} h={y1-y0}")

cap.release()
