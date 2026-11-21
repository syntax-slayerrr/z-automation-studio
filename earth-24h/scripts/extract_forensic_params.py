import cv2
import numpy as np
import json

VIDEO_PATH = r"d:\PROJECTS\z-automation-studio\earth-24h\ref.mp4"
OUT_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\forensic_data"

cap = cv2.VideoCapture(VIDEO_PATH)
frames = {}
needed = [24, 60, 120, 180, 210, 225, 240, 270, 330, 395, 425, 460, 520, 600, 630, 660, 690, 720, 780, 860, 915, 925, 935, 960, 990, 1005, 1035, 1065, 1085, 1110, 1135, 1185]
idx = 0
while True:
    ret, f = cap.read()
    if not ret:
        break
    if idx in needed:
        frames[idx] = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
    idx += 1
cap.release()

def hex_col(rgb):
    return "#{:02x}{:02x}{:02x}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

# 1. Sample exact palette from each key scene
palette = {}
# Scene 1: Standard clock view (f=210)
f210 = frames[210]
palette["indigo_bg_top"] = hex_col(f210[30, 360])
palette["indigo_bg_corner"] = hex_col(f210[20, 680])
palette["indigo_bg_bottom"] = hex_col(f210[1180, 360])
palette["gear_gold_light"] = hex_col(f210[150, 90])
palette["gear_gold_dark"] = hex_col(f210[220, 35])
palette["bezel_gold"] = hex_col(f210[601, 360 + 346])
palette["chapter_cream_inner"] = hex_col(f210[601, 360 + 288])
palette["chapter_cream_outer"] = hex_col(f210[601, 360 + 328])
palette["era_orange"] = hex_col(f210[601 - 245, 360 + 115]) # around 2 o'clock (30 deg)
palette["era_teal"] = hex_col(f210[601, 360 + 270]) # 6 o'clock (90 deg)
palette["sky_yellow_210"] = hex_col(f210[520, 360])
palette["wave_back_210"] = hex_col(f210[650, 260])
palette["wave_front_210"] = hex_col(f210[730, 360])
palette["paper_card_cream"] = hex_col(f210[1010, 360])

# Scene 1 earlier sky colors (f=24, f=60, f=120, f=180)
palette["sky_f024_teal"] = hex_col(frames[24][500, 360])
palette["sky_f060_sage"] = hex_col(frames[60][500, 360])
palette["sky_f120_pink"] = hex_col(frames[120][500, 360])
palette["sky_f180_amber"] = hex_col(frames[180][500, 360])

# Scene 2: Molten Earth (f=270)
f270 = frames[270]
palette["molten_bg_top"] = hex_col(f270[50, 360])
palette["molten_bg_mid"] = hex_col(f270[350, 100])
palette["molten_core_bright"] = hex_col(f270[550, 350])
palette["molten_crust_dark"] = hex_col(f270[450, 250])
palette["molten_cloud_mid"] = hex_col(f270[850, 200])
palette["molten_cloud_front"] = hex_col(f270[1150, 360])

# Scene 3: Primordial Ocean (f=460)
f460 = frames[460]
palette["ocean_top_wave"] = hex_col(f460[50, 360])
palette["ocean_mid_teal"] = hex_col(f460[500, 300])
palette["ocean_ray_bright"] = hex_col(f460[300, 250])
palette["ocean_bottom_wave"] = hex_col(f460[1150, 360])

# Scene 4/5: Dinosaur Purple Night (f=780)
f780 = frames[780]
palette["dino_sky_top"] = hex_col(f780[50, 360])
palette["dino_sky_glow"] = hex_col(f780[520, 360])
palette["dino_moon"] = hex_col(f780[140, 520])
palette["dino_smoke"] = hex_col(f780[280, 200])
palette["dino_body"] = hex_col(f780[620, 200])
palette["dino_ground"] = hex_col(f780[1150, 360])

# Scene 6: Asteroid & Post-Impact Dust (f=925, f=960, f=1085)
f960 = frames[960]
palette["dust_orange_mid"] = hex_col(f960[480, 360])
palette["dust_brown_low"] = hex_col(f960[680, 360])
f1085 = frames[1085]
palette["human_yellow_arc"] = hex_col(f1085[435, 520])
palette["era_purple"] = hex_col(f1085[390, 480])

print("=== EXTRACTED EXACT HEX PALETTE ===")
print(json.dumps(palette, indent=2))

with open(f"{OUT_DIR}/extracted_palette.json", "w", encoding="utf-8") as f:
    json.dump(palette, f, indent=2)
