import cv2
import numpy as np
import math

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
cap = cv2.VideoCapture(VIDEO_PATH)

def get_frame(fi):
    cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
    _, fr = cap.read()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)

print("=== 1. EXACT RED SECOND HAND & BLACK HAND INTERSECTION IN f=1075..1140 ===")
for fi in [1075, 1095, 1110, 1130]:
    rgb = get_frame(fi).astype(np.int32)
    # Red second hand: R > 180, R - B > 90, R - G > 75 in y = 400..1200 (exclude subtitle y=950..1050)
    red_mask = (rgb[:, :, 0] > 175) & ((rgb[:, :, 0] - rgb[:, :, 2]) > 85) & ((rgb[:, :, 0] - rgb[:, :, 1]) > 70)
    red_mask[:400, :] = False
    red_mask[950:1050, :] = False
    # Exclude orange era arc (right side x > 480, y < 520)
    red_mask[:520, 480:] = False
    ry, rx = np.where(red_mask)
    if len(rx) > 20:
        # Fit line x = m*y + b
        m_r, b_r = np.polyfit(ry, rx, 1)
    else:
        m_r, b_r = 0, 0

    # Black minute/hour hand (x in 450..600, y in 420..940)
    dark_mask = (rgb[:, :, 0] < 75) & (rgb[:, :, 1] < 65) & (rgb[:, :, 2] < 60)
    dark_mask[:420, :] = False
    dark_mask[950:, :] = False
    dark_mask[:, :440] = False
    dark_mask[:, 620:] = False
    dy, dx = np.where(dark_mask)
    if len(dx) > 50:
        m_d, b_d = np.polyfit(dy, dx, 1)
    else:
        m_d, b_d = 0, 0

    # Intersection of red line and black hand gives the EXACT clock center (cx, cy)!
    if abs(m_r - m_d) > 1e-3:
        cy_int = (b_d - b_r) / (m_r - m_d)
        cx_int = m_d * cy_int + b_d
    else:
        cx_int, cy_int = 525.0, 1150.0

    # Also measure radius from (cx_int, cy_int) to the tip of the red hand (minimum ry) and outer bezel!
    tip_r_y = ry.min() if len(ry) else 420
    tip_r_x = m_r * tip_r_y + b_r
    r_tip = math.hypot(tip_r_x - cx_int, tip_r_y - cy_int)
    sec_angle_deg = math.degrees(math.atan2(tip_r_y - cy_int, tip_r_x - cx_int)) + 90.0

    tip_d_y = dy.min() if len(dy) else 410
    tip_d_x = m_d * tip_d_y + b_d
    r_black_tip = math.hypot(tip_d_x - cx_int, tip_d_y - cy_int)
    hand_angle_deg = math.degrees(math.atan2(tip_d_y - cy_int, tip_d_x - cx_int)) + 90.0

    print(f"f={fi:04d}: INT_CENTER=({cx_int:6.1f},{cy_int:6.1f}) | r_red_tip={r_tip:5.1f} (scale~{r_tip/248:.3f}) sec_ang={sec_angle_deg:5.1f}° | r_blk_tip={r_black_tip:5.1f} (scale~{r_black_tip/226:.3f}) blk_ang={hand_angle_deg:5.1f}°")

print("\n=== 2. EXACT MINUTE & HOUR HAND MOTION IN f=0..220 (EVERY 10 FRAMES) ===")
for fi in range(0, 230, 10):
    rgb = get_frame(fi)
    roi = rgb[570:680, 320:400].astype(np.float32)
    gold = roi[:, :, 0] + 0.4 * roi[:, :, 1] - 1.9 * roi[:, :, 2]
    ys, xs = np.where(gold > 130)
    cx_p = 320 + np.median(xs) if len(xs) > 10 else 357.0
    cy_p = 570 + np.median(ys) if len(ys) > 10 else 622.0
    # Find darkest angle at r=165..195 (minute hand) and r=90..120 (hour hand)
    # Exclude the dark wave at bottom (angles 115..245 at lower half? No, hands are darker R<65!)
    ang_scores_m = []
    ang_scores_h = []
    for deg in range(0, 360, 2):
        rad = math.radians(deg - 90.0)
        ca, sa = math.cos(rad), math.sin(rad)
        # Measure fraction of pixels along ray with R < 80
        dark_m = sum(1 for r in range(150, 205, 3) if rgb[int(cy_p + r * sa), int(cx_p + r * ca), 0] < 95)
        dark_h = sum(1 for r in range(60, 130, 3) if rgb[int(cy_p + r * sa), int(cx_p + r * ca), 0] < 85)
        ang_scores_m.append((dark_m, -rgb[int(cy_p + 175 * sa), int(cx_p + 175 * ca), 0], deg))
        ang_scores_h.append((dark_h, -rgb[int(cy_p + 95 * sa), int(cx_p + 95 * ca), 0], deg))
    ang_scores_m.sort(reverse=True)
    ang_scores_h.sort(reverse=True)
    m_deg = ang_scores_m[0][2]
    # Pick hour hand candidate at least 25 deg away from m_deg if possible
    h_deg = next((a[2] for a in ang_scores_h if min(abs(a[2]-m_deg), 360-abs(a[2]-m_deg)) > 22), ang_scores_h[0][2])
    print(f"f={fi:04d}: min_deg={m_deg:3d}° | hour_deg={h_deg:3d}°")

cap.release()
