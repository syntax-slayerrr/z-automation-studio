import cv2
import numpy as np
import os

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
OUT_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data"

cap = cv2.VideoCapture(VIDEO_PATH)
frames = []
while True:
    ret, f = cap.read()
    if not ret:
        break
    frames.append(f)
cap.release()

def make_strip(f_indices, name, cols=6):
    rows = (len(f_indices) + cols - 1) // cols
    tw, th = 240, 426
    canvas = np.zeros((rows * th, cols * tw, 3), dtype=np.uint8)
    for idx, fi in enumerate(f_indices):
        if fi >= len(frames):
            continue
        r = idx // cols
        c = idx % cols
        im = cv2.resize(frames[fi], (tw, th), interpolation=cv2.INTER_AREA)
        cv2.putText(im, f"f={fi} ({fi/30:.2f}s)", (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 3)
        cv2.putText(im, f"f={fi} ({fi/30:.2f}s)", (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1)
        canvas[r*th:(r+1)*th, c*tw:(c+1)*tw] = im
    out_path = os.path.join(OUT_DIR, name)
    cv2.imwrite(out_path, canvas)
    print("Saved", out_path)

# 1. Intro & Shot 1 clock spin (f=0..240)
make_strip(list(range(0, 36, 3)) + list(range(40, 240, 10)), "strip_1_intro_shot1.jpg", cols=8)

# 2. Shot 1->2 transition & Shot 2->3 transition (f=215..455)
make_strip(list(range(216, 264, 3)) + list(range(384, 456, 3)), "strip_2_molten_ocean.jpg", cols=8)

# 3. Shot 3->4 microbe spin & dinosaur zoom (f=550..725)
make_strip(list(range(552, 726, 6)), "strip_3_microbes_dinos.jpg", cols=8)

# 4. Shot 5->6->7 asteroid, extinction, human 6s, 24:00 (f=840..1193)
make_strip(list(range(840, 1194, 8)), "strip_4_asteroid_human_end.jpg", cols=8)
