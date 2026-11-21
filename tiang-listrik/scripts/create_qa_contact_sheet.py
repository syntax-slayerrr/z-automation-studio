import os
from PIL import Image, ImageDraw, ImageFont

ref_dir = r"d:\PROJECTS\z-automation-studio\re-ref3\shots"
out_dir = r"d:\PROJECTS\z-automation-studio\tiang-listrik\out"

test_shots = [
    ("Shot 01 (Intro Hollow Bamboo)", "v2_still_30.jpg", "shot_001.jpg"),
    ("Shot 07 (Red Force Arrows)", "v2_still_400.jpg", "shot_007.jpg"),
    ("Shot 09 (12 Meter Pole)", "v2_still_540.jpg", "shot_009.jpg"),
    ("Shot 13 (Bamboo Rot Cutaway)", "v2_still_735.jpg", "shot_013.jpg"),
    ("Shot 20 (Porcelain Insulator)", "v2_still_1280.jpg", "shot_020.jpg"),
    ("Shot 21 (Cutaway Rain Shield)", "v2_still_1385.jpg", "shot_021.jpg"),
    ("Shot 25 (Dual-Pole Andongan)", "v2_still_1780.jpg", "shot_025.jpg"),
    ("Shot 29 (Prestressed Mold)", "v2_still_2175.jpg", "shot_029.jpg"),
    ("Shot 31 (12 Books Compression)", "v2_still_2430.jpg", "shot_031.jpg"),
    ("Shot 34 (20kV -> 220V Flow)", "v2_still_2710.jpg", "shot_034.jpg"),
]

thumb_w, thumb_h = 340, 604
header_h = 42
pair_w = thumb_w * 2 + 24
cols = 2  # 2 pairs per row -> 5 rows total (compact high-res inspection!)
rows = (len(test_shots) + cols - 1) // cols

sheet_w = cols * pair_w + (cols + 1) * 30
sheet_h = rows * (thumb_h + header_h + 24) + 30

sheet = Image.new("RGB", (sheet_w, sheet_h), color=(18, 20, 26))
draw = ImageDraw.Draw(sheet)

try:
    font = ImageFont.truetype("arialbd.ttf", 20)
    sub_font = ImageFont.truetype("arial.ttf", 16)
except:
    font = ImageFont.load_default()
    sub_font = font

for idx, (title, recon_name, ref_name) in enumerate(test_shots):
    r = idx // cols
    c = idx % cols
    x0 = 30 + c * (pair_w + 30)
    y0 = 20 + r * (thumb_h + header_h + 24)

    draw.text((x0, y0), f"#{idx+1} {title}", fill=(255, 215, 79), font=font)
    draw.text((x0, y0 + 22), "V2 RECONSTRUCTION", fill=(100, 215, 255), font=sub_font)
    draw.text((x0 + thumb_w + 24, y0 + 22), "REFERENCE (@gimanabisaid)", fill=(255, 130, 110), font=sub_font)

    y_img = y0 + header_h
    recon_path = os.path.join(out_dir, recon_name)
    ref_path = os.path.join(ref_dir, ref_name)

    if os.path.exists(recon_path):
        im = Image.open(recon_path).convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(im, (x0, y_img))
    if os.path.exists(ref_path):
        im = Image.open(ref_path).convert("RGB")
        w, h = im.size
        if w > h:
            num_tiles = max(1, round(w / (h * 9 / 16)))
            tile_w = w // num_tiles
            mid = min(num_tiles - 1, max(0, int(num_tiles * 0.6)))
            im = im.crop((mid * tile_w, 0, (mid + 1) * tile_w, h))
        im = im.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(im, (x0 + thumb_w + 24, y_img))

out_path = os.path.join(out_dir, "qa_side_by_side_v2.jpg")
sheet.save(out_path, quality=92)
print("Saved V2 QA Contact Sheet:", out_path)
