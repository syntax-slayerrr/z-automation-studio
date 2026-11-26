"""
Renders a 12-Frame Visual QA Contact Sheet (4x3 grid) for `SejarahKomunikasiShort`
covering all 6 Earth-24h Gouache Silhouette Diorama scenes and transitions.
"""
from __future__ import annotations

import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / "sejarah-komunikasi"
BUNDLE_DIR = PROJECT / ".bundle"
STILLS_DIR = PROJECT / "out" / "qa_stills"
SHEET_PATH = PROJECT / "out" / "qa_contact_sheet_12f.png"

FRAMES = [
    (45, "S1A: ±45.000 SM Lukisan Gua"),
    (260, "S1B: Cap Tangan & Banteng Gua"),
    (460, "S1C: Pesan Terkunci di Batu"),
    (640, "S2A: ±3.400 SM Mesopotamia"),
    (830, "S2B: Simbol Paku Cuneiform"),
    (1040, "S3A: 1440 Mesin Cetak Gutenberg"),
    (1240, "S3B: Ribuan Lembar Beterbangan"),
    (1450, "S4A: 1876 Kabel Samudra"),
    (1610, "S4B: Denyut Sinyal & Telepon"),
    (1790, "S5: 1991 Jaringan Internet Dunia"),
    (1990, "S6A: Hari Ini • Era AI"),
    (2280, "S6B: Cap Tangan di Dalam Cahaya"),
]


def main() -> None:
    STILLS_DIR.mkdir(parents=True, exist_ok=True)
    if not (BUNDLE_DIR / "index.html").exists():
        print(f"Bundling Remotion project -> {BUNDLE_DIR}...")
        subprocess.run(
            ["npx", "remotion", "bundle", str(ROOT / "remotion/index.ts"), "--out-dir", str(BUNDLE_DIR)],
            cwd=str(ROOT),
            shell=True,
            check=True,
        )

    rendered_imgs: list[tuple[Image.Image, int, str]] = []
    for f_num, label in FRAMES:
        out_png = STILLS_DIR / f"f_{f_num:04d}.png"
        if not out_png.exists():
            print(f"  Rendering still frame {f_num} ({label}) -> {out_png.name}...")
            for attempt in range(3):
                res = subprocess.run(
                    [
                        "npx", "remotion", "still",
                        str(BUNDLE_DIR),
                        "SejarahKomunikasiShort",
                        str(out_png),
                        f"--frame={f_num}",
                        "--log=error",
                    ],
                    cwd=str(ROOT),
                    shell=True,
                )
                if res.returncode == 0 and out_png.exists():
                    break
                print(f"    Retry {attempt + 1}/3 for frame {f_num}...")
        else:
            print(f"  [cached] frame {f_num} ({out_png.name})")
        rendered_imgs.append((Image.open(out_png).convert("RGB"), f_num, label))

    cols, rows = 4, 3
    tw, th = 360, 640
    pad = 16
    header_h = 44
    sheet_w = cols * tw + (cols + 1) * pad
    sheet_h = rows * (th + header_h) + (rows + 1) * pad
    sheet = Image.new("RGB", (sheet_w, sheet_h), (18, 12, 26))
    draw = ImageDraw.Draw(sheet)

    for idx, (im, f_num, label) in enumerate(rendered_imgs):
        c = idx % cols
        r = idx // cols
        x0 = pad + c * (tw + pad)
        y0 = pad + r * (th + header_h + pad)
        draw.rectangle([x0, y0, x0 + tw, y0 + header_h], fill=(36, 22, 52))
        draw.text((x0 + 10, y0 + 12), f"f={f_num} | {label}", fill=(252, 228, 168))
        thumb = im.resize((tw, th), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x0, y0 + header_h))

    SHEET_PATH.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(str(SHEET_PATH))
    print(f"=== Contact Sheet Saved -> {SHEET_PATH} ===")


if __name__ == "__main__":
    main()
