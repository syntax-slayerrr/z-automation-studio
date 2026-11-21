import cv2
import numpy as np
import json
import math

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"

def get_frame(cap, f_idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, fr = cap.read()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB) if ret else None

cap = cv2.VideoCapture(VIDEO_PATH)

print("=== 1. EXACT CLOCK CIRCLE FIT FROM INNER VIEWPORT / ERA ARC ===")
for fi in [12, 24, 60, 120, 180, 210, 230, 405, 420, 575, 600, 630, 660, 690, 1005, 1030, 1050, 1075, 1095, 1130, 1155, 1175, 1185]:
    rgb = get_frame(cap, fi)
    # Find the brass center pin in the clock (only when full clock visible, i.e., not 1075/1095/1130)
    # Wait: the teal era arc or inner cream ring edge! Let's detect the circle of the inner cream ring vs viewport
    # Actually let's detect the bright cream bevel ring around the viewport (R>220, G>205, B>170) or chapter ring!
    # Even better: let's find the brass center pin peak! Brass pin has warm yellow-gold R>190, G>140, B<105 near center
    if fi not in (1075, 1095, 1130):
        # Search for center hole (dark brown dot surrounded by gold ring) near (360, 615)
        roi = rgb[560:670, 310:410].astype(np.float32)
        # Goldness score = R + 0.5*G - 1.8*B
        gold = roi[:, :, 0] + 0.5 * roi[:, :, 1] - 1.8 * roi[:, :, 2]
        mask_gold = gold > 140
        ys, xs = np.where(mask_gold)
        if len(xs) > 30:
            # Find bounding center of the gold pin
            gx0, gx1 = xs.min(), xs.max()
            gy0, gy1 = ys.min(), ys.max()
            cx_pin = 310 + (gx0 + gx1) / 2.0
            cy_pin = 560 + (gy0 + gy1) / 2.0
        else:
            cx_pin, cy_pin = 360.0, 615.0

        # Measure horizontal radii from (cx_pin, cy_pin) along row cy_pin:
        # Look for the cream chapter ring (R>190, G>175, B>140 and low saturation R-B<75)
        yi = int(round(cy_pin))
        xi = int(round(cx_pin))
        row = rgb[yi, :, :].astype(np.int32)
        is_cream = (row[:, 0] > 195) & (row[:, 1] > 180) & (row[:, 2] > 145) & ((row[:, 0] - row[:, 2]) < 75)
        # Right side of center:
        r_xs = np.where(is_cream[xi:])[0]
        l_xs = np.where(is_cream[:xi])[0]
        r_vp_r = r_xs[0] if len(r_xs) else -1
        r_ch_r = r_xs[-1] if len(r_xs) else -1
        r_vp_l = (xi - l_xs[-1]) if len(l_xs) else -1
        r_ch_l = (xi - l_xs[0]) if len(l_xs) else -1
        # Measure era arc on right side (x > xi + 200) -> teal (G > R + 20) or orange (R > B + 60)
        is_teal = (row[:, 1] > row[:, 0] + 15) & (row[:, 2] > row[:, 0] + 10)
        t_xs = np.where(is_teal[xi:])[0]
        r_era = (t_xs.min(), t_xs.max()) if len(t_xs) else None
        print(f"f={fi:04d}: pin=({cx_pin:.1f},{cy_pin:.1f}) vp_r=({r_vp_l},{r_vp_r}) ch_r=({r_ch_l},{r_ch_r}) era_r={r_era}")
    else:
        # Close-up shots (1075, 1095, 1130): fit circle to the boundary between inner viewport and cream ring!
        # Inner viewport at x=100..620 has R<160, cream bevel above it has R>210, G>195, B>165
        pts = []
        for x in range(60, 660, 20):
            col = rgb[320:850, x, :].astype(np.int32)
            # Find lowest y of cream bevel before dark viewport (transition from cream to dark)
            is_cream = (col[:, 0] > 200) & (col[:, 1] > 185) & (col[:, 2] > 150) & ((col[:, 0] - col[:, 2]) < 75)
            ys = np.where(is_cream)[0]
            if len(ys) > 10:
                y_inner = 320 + ys.max()
                y_outer = 320 + ys.min()
                pts.append((x, y_inner, y_outer))
        # Fit circle to (x, y_inner) using algebraic least squares
        if len(pts) >= 5:
            px = np.array([p[0] for p in pts], dtype=np.float64)
            py = np.array([p[1] for p in pts], dtype=np.float64)
            # Filter out points clipped by clock hand near x=350..410
            A = np.column_stack([2 * px, 2 * py, np.ones_like(px)])
            b = px**2 + py**2
            c, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
            cx_f, cy_f = c[0], c[1]
            r_in = math.sqrt(c[2] + cx_f**2 + cy_f**2)
            print(f"f={fi:04d} CLOSEUP FIT: center=({cx_f:.1f}, {cy_f:.1f}), r_viewport={r_in:.1f}, sample_pts={pts[:4]}")

cap.release()
