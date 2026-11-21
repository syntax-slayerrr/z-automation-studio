import cv2
import numpy as np
import json

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"

def get_frame(f_idx):
    cap = cv2.VideoCapture(VIDEO_PATH)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, fr = cap.read()
    cap.release()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)

for fi in [60, 210, 415, 630, 1030, 1185]:
    fr = get_frame(fi)
    # Find the dark hole in the brass center pin!
    # The brass center pin is near x in [330..390], y in [580..680]
    roi = fr[580:680, 330:390]
    # The brass ring has high R (>180), G (>130), B (<110)
    brass_mask = (roi[:, :, 0] > 175) & (roi[:, :, 1] > 125) & (roi[:, :, 2] < 115)
    ys, xs = np.where(brass_mask)
    if len(xs) > 0:
        bcx = 330 + np.mean(xs)
        bcy = 580 + np.mean(ys)
        # Also measure where the inner viewport ends along +X and -X from (bcx, bcy)
        yi = int(round(bcy))
        xi = int(round(bcx))
        # Cream bevel ring has R>215, G>195, B>160
        right_cream = np.where((fr[yi, xi:719, 0] > 210) & (fr[yi, xi:719, 1] > 190) & (fr[yi, xi:719, 2] > 155))[0]
        r_vp = right_cream[0] if len(right_cream) > 0 else -1
        r_ch_out = right_cream[-1] if len(right_cream) > 0 else -1
        print(f"f={fi:04d}: brass_center=({bcx:.1f}, {bcy:.1f}), r_viewport={r_vp}, r_chapter_out={r_ch_out}")

# Also measure f=1095 (zoomed into top of clock)
f1095 = get_frame(1095)
# Find where the red second hand line is and where the inner viewport arc is
# Cream chapter ring in f1095:
cream_1095 = (f1095[:, :, 0] > 205) & (f1095[:, :, 1] > 190) & (f1095[:, :, 2] > 160)
# Along x=450, find y range of cream chapter ring
y_cream_450 = np.where(cream_1095[:900, 450])[0]
y_cream_200 = np.where(cream_1095[:900, 200])[0]
print(f"f=1095 cream y at x=450: [{y_cream_450.min()}, {y_cream_450.max()}], at x=200: [{y_cream_200.min()}, {y_cream_200.max()}]")
