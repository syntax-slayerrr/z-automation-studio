import sys, os, glob
from PIL import Image, ImageDraw

def make_sheet(pattern, out_path, cols=5, tile_w=320, tile_h=568):
    files = sorted(glob.glob(pattern))
    if not files:
        print(f"No files matched: {pattern}")
        sys.exit(1)
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tile_w, rows * tile_h), (26, 22, 22))
    draw = ImageDraw.Draw(sheet)
    for idx, f in enumerate(files):
        im = Image.open(f).convert("RGB").resize((tile_w, tile_h), Image.Resampling.LANCZOS)
        r = idx // cols
        c = idx % cols
        x0, y0 = c * tile_w, r * tile_h
        sheet.paste(im, (x0, y0))
        label = os.path.splitext(os.path.basename(f))[0]
        draw.rectangle([x0 + 6, y0 + 6, x0 + 146, y0 + 30], fill=(26, 22, 22))
        draw.text((x0 + 12, y0 + 11), label, fill=(248, 211, 72))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    sheet.save(out_path, quality=92)
    print(f"Saved {len(files)} tiles ({cols}x{rows}) -> {out_path}")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "preflight"
    if mode == "preflight":
        make_sheet(
            r"d:\PROJECTS\z-automation-studio\cipanas-garut\.tmp\pf_*.jpg",
            r"d:\PROJECTS\z-automation-studio\cipanas-garut\.tmp\qa_preflight.jpg",
            cols=5, tile_w=320, tile_h=568
        )
    elif mode == "final":
        make_sheet(
            r"d:\PROJECTS\z-automation-studio\cipanas-garut\.tmp\dec_*.jpg",
            r"d:\PROJECTS\z-automation-studio\cipanas-garut\out\qa_contact_sheet.jpg",
            cols=5, tile_w=320, tile_h=568
        )
