import cv2
import numpy as np
import json
import os

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
ASSET_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\assets"
os.makedirs(ASSET_DIR, exist_ok=True)

def get_frame(f_idx):
    cap = cv2.VideoCapture(VIDEO_PATH)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, fr = cap.read()
    cap.release()
    return cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)

def trace_mask(mask, epsilon=1.5, min_area=25):
    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys = []
    for c in contours:
        if cv2.contourArea(c) >= min_area:
            approx = cv2.approxPolyDP(c, epsilon, True)
            pts = approx.reshape(-1, 2).tolist()
            if len(pts) >= 3:
                polys.append(pts)
    return polys

shapes = {}

# 1. Molten Earth magma veins (frame 270)
f270 = get_frame(270)
yy, xx = np.mgrid[0:1280, 0:720]
sphere_mask = ((xx - 360)**2 + (yy - 562)**2) <= 210**2
# Three tiers of magma veins: base orange fissures, mid golden veins, bright core
vein_low_mask = sphere_mask & (f270[:, :, 0] > 182) & (f270[:, :, 1] > 92)
vein_mid_mask = sphere_mask & (f270[:, :, 0] > 205) & (f270[:, :, 1] > 118)
vein_bright_mask = sphere_mask & (f270[:, :, 0] > 228) & (f270[:, :, 1] > 158)
shapes["molten_veins_low"] = trace_mask(vein_low_mask, epsilon=1.0, min_area=10)
shapes["molten_veins_mid"] = trace_mask(vein_mid_mask, epsilon=1.0, min_area=10)
shapes["molten_veins_bright"] = trace_mask(vein_bright_mask, epsilon=1.0, min_area=8)

# Bottom maroon cloud ridge in f270 (y in 700..1280)
cloud_front_mask = (yy > 720) & (f270[:, :, 0] < 95) & (f270[:, :, 1] < 35)
shapes["molten_cloud_front"] = trace_mask(cloud_front_mask, epsilon=2.0, min_area=200)

# 2. Primordial Ocean microbes & rays (frame 495)
f495 = get_frame(495)
ocean_roi = (yy >= 180) & (yy <= 930)
bright_ocean = ocean_roi & (f495[:, :, 1] > 175) & (f495[:, :, 2] > 140)
shapes["ocean_bright_elements"] = trace_mask(bright_ocean, epsilon=1.2, min_area=12)

# 3. Dinosaur Night Scene (frame 780)
f780 = get_frame(780)
dino_mask = (yy >= 340) & (yy <= 920) & (f780[:, :, 0] < 72) & (f780[:, :, 1] < 48) & (f780[:, :, 2] < 98)
shapes["dino_silhouettes"] = trace_mask(dino_mask, epsilon=1.2, min_area=80)

moon_mask = (xx >= 460) & (xx <= 640) & (yy >= 80) & (yy <= 220) & (f780[:, :, 0] > 155)
shapes["dino_moon_2247"] = trace_mask(moon_mask, epsilon=1.0, min_area=30)

smoke_mask = (xx >= 60) & (xx <= 420) & (yy >= 180) & (yy <= 480) & (f780[:, :, 0] > 112) & (f780[:, :, 2] > 145)
shapes["dino_smoke"] = trace_mask(smoke_mask, epsilon=2.0, min_area=100)

# 4. Asteroid in frame 920 (unclipped rock head + tail)
f920 = get_frame(920)
ast_orange = (yy <= 620) & (xx >= 240) & (f920[:, :, 0] > 185) & (f920[:, :, 1] > 98) & (f920[:, :, 0] > f920[:, :, 2] + 35)
ast_white = (yy <= 620) & (xx >= 240) & (f920[:, :, 0] > 228) & (f920[:, :, 1] > 195) & (f920[:, :, 2] > 155)
ast_rock = (yy >= 400) & (yy <= 580) & (xx >= 280) & (xx <= 450) & (f920[:, :, 0] < 120) & (f920[:, :, 1] < 85) & (f920[:, :, 2] < 85)
shapes["asteroid_orange_tail"] = trace_mask(ast_orange, epsilon=1.2, min_area=25)
shapes["asteroid_white_core"] = trace_mask(ast_white, epsilon=1.2, min_area=15)
shapes["asteroid_rock_head"] = trace_mask(ast_rock, epsilon=1.0, min_area=30)

# 5. Post-impact orange dust cloud & Prehistoric palm trees (frame 960)
f960 = get_frame(960)
dust_mask = (yy >= 200) & (yy <= 780) & (f960[:, :, 0] > 155) & (f960[:, :, 1] > 85) & (f960[:, :, 2] < 110)
shapes["impact_dust_cloud"] = trace_mask(dust_mask, epsilon=2.0, min_area=100)

# Prehistoric palm/cycad trees stand out against the orange cloud in f968 (after dinosaurs fall)
f968 = get_frame(968)
palm_mask = (yy >= 230) & (yy <= 900) & (f968[:, :, 0] < 150) & (f968[:, :, 2] > f968[:, :, 1] + 8)
shapes["prehistoric_palms"] = trace_mask(palm_mask, epsilon=1.2, min_area=30)

# 6. Human silhouette on 6 DETIK band (frame 1095)
f1095 = get_frame(1095)
human_mask = (xx >= 220) & (xx <= 330) & (yy >= 400) & (yy <= 510) & (f1095[:, :, 0] < 145) & (f1095[:, :, 1] < 130) & (f1095[:, :, 2] < 95)
shapes["human_silhouette"] = trace_mask(human_mask, epsilon=0.8, min_area=15)

with open(os.path.join(ASSET_DIR, "vector_shapes.json"), "w", encoding="utf-8") as f:
    json.dump(shapes, f)

for k, v in shapes.items():
    print(f"{k}: {len(v)} polygons")
