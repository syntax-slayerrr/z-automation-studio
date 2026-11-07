import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

STUDIO_DIR = Path(r"d:\PROJECTS\z-automation-studio")
FFMPEG_BIN = STUDIO_DIR / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
VIDEO_PATH = STUDIO_DIR / "out" / "reels" / "z-automation-launch.mp4"
QA_DIR = STUDIO_DIR / "out" / "qa"
QA_DIR.mkdir(parents=True, exist_ok=True)

KEYFRAMES = [
    (0.85, "S1_Hook_EraWebStatis"),
    (2.65, "S2_Monolith_VisiNyata"),
    (3.45, "S2_to_S3_TitaniumGlassDolly"),
    (5.20, "S3_Hermes_Reasoning_3D"),
    (7.45, "S4_Synapse_Dispatch_3D"),
    (9.60, "S5_OpenClaw_Execution_3D"),
    (12.35, "S6_Editorial_Cream_Flip"),
    (15.20, "S8_Pure_URL_Lock_GlassPill"),
]

def main():
    if not VIDEO_PATH.exists():
        print(f"[ERROR] Video not found: {VIDEO_PATH}")
        return

    extracted = []
    for t_sec, name in KEYFRAMES:
        out_png = QA_DIR / f"{name}.png"
        cmd = [
            str(FFMPEG_BIN), "-y", "-v", "error",
            "-ss", f"{t_sec:.2f}",
            "-i", str(VIDEO_PATH),
            "-frames:v", "1",
            str(out_png)
        ]
        subprocess.run(cmd, check=True)
        extracted.append((t_sec, name, out_png))

    # Build a 4x2 Contact Sheet (each thumb 450x800 -> 1800x1600 total)
    tw, th = 450, 800
    sheet = Image.new("RGB", (tw * 4, th * 2), (10, 12, 18))
    draw = ImageDraw.Draw(sheet)

    for idx, (t_sec, name, png_path) in enumerate(extracted):
        img = Image.open(png_path).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
        col = idx % 4
        row = idx // 4
        x0, y0 = col * tw, row * th
        sheet.paste(img, (x0, y0))
        draw.rectangle([x0, y0, x0 + tw - 1, y0 + 36], fill=(6, 8, 14))
        draw.text((x0 + 12, y0 + 10), f"t={t_sec:.2f}s | {name}", fill=(0, 245, 212))

    sheet_path = QA_DIR / "contact-sheet-8-scenes.png"
    sheet.save(sheet_path)
    print(f"[OK] Saved contact sheet: {sheet_path}")

    # Measure EBU R128 loudness on the final exported MP4
    ebur_cmd = [
        str(FFMPEG_BIN), "-hide_banner",
        "-i", str(VIDEO_PATH),
        "-filter_complex", "ebur128=peak=true",
        "-f", "null", "-"
    ]
    proc = subprocess.run(ebur_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    for line in proc.stderr.splitlines():
        if any(k in line for k in ["I:", "LRA:", "Peak:", "Threshold:"]):
            print("[AUDIO QA]", line.strip())

if __name__ == "__main__":
    main()

