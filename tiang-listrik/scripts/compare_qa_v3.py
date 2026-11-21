import os
from PIL import Image, ImageDraw, ImageFont

PAIRS = [
    ("Frame 0: Opening Bamboo in Village", "re-ref3/shots/shot_001.jpg", "tiang-listrik/out/qa_stills/frame_0000.jpg"),
    ("Frame 380: Underground Lever Force", "re-ref3/shots/shot_007.jpg", "tiang-listrik/out/qa_stills/frame_0380.jpg"),
    ("Frame 530: 12-Meter Ruler", "re-ref3/shots/shot_009.jpg", "tiang-listrik/out/qa_stills/frame_0530.jpg"),
    ("Frame 1290: Porcelain Insulator Macro", "re-ref3/shots/shot_020.jpg", "tiang-listrik/out/qa_stills/frame_1290.jpg"),
    ("Frame 1380: Sliced Insulator in Rain", "re-ref3/shots/shot_021.jpg", "tiang-listrik/out/qa_stills/frame_1380.jpg"),
    ("Frame 2400: Book Compression Analogy", "re-ref3/shots/shot_031.jpg", "tiang-listrik/out/qa_stills/frame_2400.jpg"),
    ("Frame 2660: 20.000V Power Flow", "re-ref3/shots/shot_034.jpg", "tiang-listrik/out/qa_stills/frame_2660.jpg"),
    ("Frame 2850: Villager Ladder Wave", "re-ref3/shots/shot_036.jpg", "tiang-listrik/out/qa_stills/frame_2850.jpg"),
    ("Frame 2940: Sunset Dusk Finale", "re-ref3/shots/shot_037.jpg", "tiang-listrik/out/qa_stills/frame_2940.jpg"),
    ("Frame 3106: Seamless Visual Loop", "tiang-listrik/out/qa_stills/frame_0000.jpg", "tiang-listrik/out/qa_stills/frame_3106.jpg"),
]

thumb_w = 360
thumb_h = 640
header_h = 50
padding = 16

cols = 2  # Each pair is left (ref) and right (render)
rows = len(PAIRS)

total_w = (thumb_w * 2 + padding * 3)
total_h = rows * (thumb_h + header_h + padding) + padding

canvas = Image.new("RGB", (total_w, total_h), (24, 26, 32))
draw = ImageDraw.Draw(canvas)

try:
    font_title = ImageFont.truetype("arial.ttf", 22)
    font_label = ImageFont.truetype("arial.ttf", 16)
except Exception:
    font_title = font_label = None

for idx, (title, ref_path, render_path) in enumerate(PAIRS):
    y_base = padding + idx * (thumb_h + header_h + padding)
    
    # Title bar
    draw.rectangle([padding, y_base, total_w - padding, y_base + 36], fill=(36, 40, 50))
    draw.text((padding + 12, y_base + 6), f"Shot #{idx+1}: {title}", fill=(255, 215, 64), font=font_title)
    
    # Load Ref Image
    x_ref = padding
    y_img = y_base + header_h
    if os.path.exists(ref_path):
        ref_im = Image.open(ref_path).convert("RGB")
        ref_im = ref_im.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        canvas.paste(ref_im, (x_ref, y_img))
        draw.text((x_ref + 10, y_img + 10), "REFERENCE (@gimanabisaid)", fill=(255, 80, 80), font=font_label)
    else:
        draw.rectangle([x_ref, y_img, x_ref + thumb_w, y_img + thumb_h], fill=(40, 20, 20))
        draw.text((x_ref + 20, y_img + 40), f"Missing: {ref_path}", fill=(255, 100, 100), font=font_label)
        
    # Load Render Image
    x_ren = padding * 2 + thumb_w
    if os.path.exists(render_path):
        ren_im = Image.open(render_path).convert("RGB")
        ren_im = ren_im.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        canvas.paste(ren_im, (x_ren, y_img))
        label_text = "REMOTION V3 RENDER" if idx < 9 else "FRAME 3106 (LOOP RETURN)"
        draw.text((x_ren + 10, y_img + 10), label_text, fill=(80, 255, 120), font=font_label)
    else:
        draw.rectangle([x_ren, y_img, x_ren + thumb_w, y_img + thumb_h], fill=(20, 40, 20))
        draw.text((x_ren + 20, y_img + 40), f"Rendering...", fill=(180, 180, 180), font=font_label)

out_file = "tiang-listrik/out/side_by_side_qa_v3.jpg"
os.makedirs(os.path.dirname(out_file), exist_ok=True)
canvas.save(out_file, quality=90)
print(f"Saved side-by-side QA comparison to {out_file}")
