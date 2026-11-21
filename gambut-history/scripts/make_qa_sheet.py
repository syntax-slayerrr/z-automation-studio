import glob
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path("d:/PROJECTS/z-automation-studio/gambut-history")

def build_sheet(pattern: str, out_path: Path, cols: int, tile_w: int = 360) -> None:
    files = sorted(glob.glob(pattern))
    if not files:
        print(f"No files matched: {pattern}")
        sys.exit(1)
    imgs = [Image.open(f).convert("RGB") for f in files]
    tw = tile_w
    th = int(round(imgs[0].height * (tw / imgs[0].width)))
    rows = (len(imgs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * th), (20, 22, 24))
    draw = ImageDraw.Draw(sheet)
    for idx, (im, fp) in enumerate(zip(imgs, files)):
        r, c = divmod(idx, cols)
        rs = im.resize((tw, th), Image.Resampling.LANCZOS)
        sheet.paste(rs, (c * tw, r * th))
        lbl = Path(fp).stem
        draw.rectangle([c * tw + 6, r * th + 6, c * tw + 150, r * th + 28], fill=(18, 22, 26))
        draw.text((c * tw + 12, r * th + 10), lbl, fill=(248, 211, 72))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=92)
    print(f"Saved {len(imgs)} tiles ({cols}x{rows}) -> {out_path}")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "preflight"
    if mode == "preflight":
        build_sheet(str(ROOT / ".tmp/pf_*.jpg"), ROOT / ".tmp/qa_preflight.jpg", cols=7, tile_w=300)
    else:
        build_sheet(str(ROOT / ".tmp/dec_*.jpg"), ROOT / "out/qa_contact_sheet.jpg", cols=5, tile_w=320)
