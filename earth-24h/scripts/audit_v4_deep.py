import cv2
import numpy as np
import math
import json

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"

def get_frame(cap, f_idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, fr = cap.read()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB) if ret else None

def fit_circle_pts(pts):
    px = np.array([p[0] for p in pts], dtype=np.float64)
    py = np.array([p[1] for p in pts], dtype=np.float64)
    A = np.column_stack([2 * px, 2 * py, np.ones_like(px)])
    b = px**2 + py**2
    c, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy = c[0], c[1]
    r = math.sqrt(max(0.0, c[2] + cx**2 + cy**2))
    return cx, cy, r

cap = cv2.VideoCapture(VIDEO_PATH)

print("=== EXACT CLOCK CENTER & RADII BY LEAST-SQUARES RING FITTING ===")
clock_frames = [
    12, 21, 30, 60, 90, 120, 150, 180, 210, 225, 232, 236, 240,
    394, 400, 405, 415, 425, 432, 438,
    566, 574, 585, 600, 615, 630, 645, 660, 675, 690, 696, 702,
    998, 1005, 1020, 1035, 1050, 1060, 1070, 1080, 1095, 1110, 1130, 1145, 1155, 1165, 1175, 1185, 1193
]

results = []
for fi in clock_frames:
    rgb = get_frame(cap, fi)
    # Detect cream chapter ring pixels in y=200..960
    # Cream ring: high brightness, warm cream color (R>185, G>168, B>132, R>=B, R-B<80)
    # Exclude subtitle region (y > 950)
    sub = rgb[200:950, :, :].astype(np.int32)
    cream = (sub[:, :, 0] > 188) & (sub[:, :, 1] > 170) & (sub[:, :, 2] > 134) & ((sub[:, :, 0] - sub[:, :, 2]) < 78) & (sub[:, :, 0] >= sub[:, :, 2])
    # Also detect the orange/teal era ring inside the cream ring to find the inner/outer radii cleanly!
    # For full clock frames (where both left and right edges of the ring exist inside x=[0..719]):
    # Find outer boundary points along horizontal/vertical rays or contour of largest connected component of `cream`
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(cream.astype(np.uint8))
    if num_labels > 1:
        # Pick largest component
        largest_idx = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        comp_mask = (labels == largest_idx).astype(np.uint8)
        # Find outer contour and inner hole contours
        contours, hierarchy = cv2.findContours(comp_mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
        # Outer contour is largest area
        outer_c = max(contours, key=cv2.contourArea)
        pts_out = outer_c.reshape(-1, 2) + np.array([0, 200])
        # Filter out points clipped at screen borders x<=2 or x>=717 or y<=202 or y>=947
        interior_out = pts_out[(pts_out[:, 0] > 4) & (pts_out[:, 0] < 715) & (pts_out[:, 1] > 205) & (pts_out[:, 1] < 944)]
        if len(interior_out) > 40:
            cx_o, cy_o, r_o = fit_circle_pts(interior_out)
        else:
            cx_o, cy_o, r_o = (0, 0, 0)

        # Look for largest inner hole (the inner viewport circle)
        inner_c = None
        if hierarchy is not None:
            best_a = 0
            for idx_c, h_info in enumerate(hierarchy[0]):
                if h_info[3] != -1:  # has parent -> it's a hole!
                    a = cv2.contourArea(contours[idx_c])
                    if a > best_a:
                        best_a = a
                        inner_c = contours[idx_c]
        if inner_c is not None and len(inner_c) > 40:
            pts_in = inner_c.reshape(-1, 2) + np.array([0, 200])
            interior_in = pts_in[(pts_in[:, 0] > 4) & (pts_in[:, 0] < 715) & (pts_in[:, 1] > 205) & (pts_in[:, 1] < 944)]
            if len(interior_in) > 40:
                cx_i, cy_i, r_i = fit_circle_pts(interior_in)
            else:
                cx_i, cy_i, r_i = (0, 0, 0)
        else:
            cx_i, cy_i, r_i = (0, 0, 0)

        print(f"f={fi:04d}: OUTER=({cx_o:5.1f},{cy_o:5.1f}, r={r_o:5.1f}) | INNER=({cx_i:5.1f},{cy_i:5.1f}, r={r_i:5.1f}) | ratio={(r_o/r_i if r_i>10 else 0):.3f}")
        results.append({"f": fi, "cx_o": cx_o, "cy_o": cy_o, "r_o": r_o, "cx_i": cx_i, "cy_i": cy_i, "r_i": r_i})

cap.release()
with open(r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data\clock_fit_exact.json", "w") as f:
    json.dump(results, f, indent=2)
