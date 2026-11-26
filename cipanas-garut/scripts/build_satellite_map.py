"""
Fetches REAL Esri World Imagery (Zoom 14 crisp high-res!) + Esri World Hillshade around
Gunung Guntur (-7.143, 107.840), Cipanas Tarogong Kaler (-7.168, 107.882), and Kota Garut (-7.216, 107.901),
removes satellite mosaic exposure seams via gentle low-frequency illumination leveling,
blends 3D terrain hillshade relief + warm vintage-editorial gouache polish,
and exports exact 720x1280 SVG coordinates + mathematically accurate scale bar!
"""
from __future__ import annotations

import io
import json
import math
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
OUT_IMG = ROOT / "public/cipanas-garut/guntur_cipanas_satellite_polished.jpg"
OUT_TS = ROOT / "remotion/videos/cipanas-garut/satellite_meta.ts"

ZOOM = 14
CENTER_LAT = -7.170
CENTER_LNG = 107.870
# At z14, 1 tile px ≈ 9.5 m. Cropping 1152x2048 raw z14 px spans ~10.9 km x 19.4 km (cloud-free, razor sharp!)
RAW_W, RAW_H = 1152, 2048
OUT_W, OUT_H = 1440, 2560

COORDS = {
    "guntur": (-7.1430, 107.8400),
    "cipanas": (-7.1680, 107.8820),
    "garut": (-7.2160, 107.9010),
    "masigit": (-7.1310, 107.8180),
}


def latlon_to_world_px(lat: float, lon: float, z: int) -> tuple[float, float]:
    n = 2.0 ** z
    x = (lon + 180.0) / 360.0 * n * 256.0
    lat_r = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_r) + 1.0 / math.cos(lat_r)) / math.pi) / 2.0 * n * 256.0
    return x, y


def fetch_tile(url: str) -> Image.Image:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "ZAutomationStudio/1.0 (Educational Documentary Map Renderer)",
            "Accept": "image/jpeg,image/png,*/*",
        },
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return Image.open(io.BytesIO(resp.read())).convert("RGB")


def stitch_layer(url_tpl: str, x0: int, y0: int, x1: int, y1: int) -> Image.Image:
    cols = x1 - x0 + 1
    rows = y1 - y0 + 1
    canvas = Image.new("RGB", (cols * 256, rows * 256))
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            im = fetch_tile(url_tpl.format(z=ZOOM, y=ty, x=tx))
            canvas.paste(im, ((tx - x0) * 256, (ty - y0) * 256))
    return canvas


def main() -> None:
    cx_w, cy_w = latlon_to_world_px(CENTER_LAT, CENTER_LNG, ZOOM)
    left_w = cx_w - RAW_W / 2.0
    top_w = cy_w - RAW_H / 2.0
    right_w = cx_w + RAW_W / 2.0
    bot_w = cy_w + RAW_H / 2.0

    tx0 = int(math.floor(left_w / 256.0))
    ty0 = int(math.floor(top_w / 256.0))
    tx1 = int(math.floor(right_w / 256.0))
    ty1 = int(math.floor(bot_w / 256.0))
    print(f"Fetching HIGH-RES Esri Satellite + Hillshade z={ZOOM}, x={tx0}..{tx1}, y={ty0}..{ty1} ({(tx1-tx0+1)*(ty1-ty0+1)} tiles)...")

    sat_full = stitch_layer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        tx0, ty0, tx1, ty1,
    )
    try:
        hill_full = stitch_layer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
            tx0, ty0, tx1, ty1,
        )
    except Exception as e:
        print(f"  Hillshade fallback ({e})")
        hill_full = None

    box = (
        int(round(left_w - tx0 * 256)),
        int(round(top_w - ty0 * 256)),
        int(round(right_w - tx0 * 256)),
        int(round(bot_w - ty0 * 256)),
    )
    sat_crop = sat_full.crop(box).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
    img = cv2.cvtColor(np.array(sat_crop), cv2.COLOR_RGB2BGR).astype(np.float32)

    # 1. Subtle low-frequency Retinex luminance leveling to soften any Esri satellite capture-date exposure seams
    lab = cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    l_ch = lab[:, :, 0]
    l_blur = cv2.GaussianBlur(l_ch, (0, 0), sigmaX=120, sigmaY=120)
    l_mean = float(np.mean(l_ch))
    l_leveled = np.clip(l_ch * (l_mean / np.maximum(l_blur, 35.0)), 0, 255)
    lab[:, :, 0] = l_ch * 0.52 + l_leveled * 0.48
    img = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)

    # 2. Sculpted 3D Terrain Relief via Real Esri World Hillshade (makes Guntur's crater & ridges pop!)
    if hill_full is not None:
        hill_crop = hill_full.crop(box).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        hill_gray = cv2.cvtColor(np.array(hill_crop), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
        hill_gray = cv2.GaussianBlur(hill_gray, (5, 5), 0)
        relief_gain = 0.62 + hill_gray[:, :, None] * 0.72
        img = np.clip(img * relief_gain, 0, 255)

    # 3. Gentle Painterly Bilateral Polish ("satelit riil, tapi dipoles sedikit" — crisp roads/ridges, silky editorial texture)
    img_u8 = np.clip(img, 0, 255).astype(np.uint8)
    bilat = cv2.bilateralFilter(img_u8, d=7, sigmaColor=30, sigmaSpace=30).astype(np.float32)
    img = bilat * 0.68 + img * 0.32

    # 4. Crisp local micro-contrast (CLAHE) + Warm Vintage National-Geographic Color Grade
    lab2 = cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB)
    l2, a2, b2 = cv2.split(lab2)
    clahe = cv2.createCLAHE(clipLimit=1.9, tileGridSize=(8, 8))
    l2_eq = clahe.apply(l2)
    img = cv2.cvtColor(cv2.merge([cv2.addWeighted(l2, 0.55, l2_eq, 0.45, 0), a2, b2]), cv2.COLOR_LAB2BGR).astype(np.float32)

    hsv = cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 0.88, 0, 255)
    img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)

    # Warm cream-ochre sunlit highlights harmonizing seamlessly with Vintage Travel Poster style!
    tint = np.array([0.90, 0.99, 1.09], dtype=np.float32)
    img = np.clip(img * tint + np.array([6.0, 10.0, 14.0], dtype=np.float32), 0, 255)

    # Subtle radial vignette framing the Guntur -> Cipanas basin
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
    dist = np.sqrt(((xx - OUT_W * 0.5) / (OUT_W * 0.64)) ** 2 + ((yy - OUT_H * 0.48) / (OUT_H * 0.64)) ** 2)
    vig = np.clip(1.0 - np.maximum(0.0, dist - 0.56) * 0.38, 0.72, 1.0)
    img = np.clip(img * vig[:, :, None], 0, 255).astype(np.uint8)

    OUT_IMG.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT_IMG), img, [int(cv2.IMWRITE_JPEG_QUALITY), 94])

    # Exact coordinates in 720x1280 design space!
    scale_to_720 = 720.0 / RAW_W
    pts_720: dict[str, list[float]] = {}
    for name, (lat, lon) in COORDS.items():
        wx, wy = latlon_to_world_px(lat, lon, ZOOM)
        pts_720[name] = [round((wx - left_w) * scale_to_720, 1), round((wy - top_w) * scale_to_720, 1)]

    meters_per_raw_px = 156543.03392 * math.cos(math.radians(CENTER_LAT)) / (2.0 ** ZOOM)
    meters_per_720_px = meters_per_raw_px / scale_to_720
    km3_width_px = round(3000.0 / meters_per_720_px, 1)
    km5_width_px = round(5000.0 / meters_per_720_px, 1)

    ts_code = (
        "// AUTO-GENERATED by cipanas-garut/scripts/build_satellite_map.py\n"
        "// Exact Web-Mercator (Zoom 14) pixel projections aligned 1:1 to public/cipanas-garut/guntur_cipanas_satellite_polished.jpg\n\n"
        f"export const SAT_METERS_PER_PX = {meters_per_720_px:.4f};\n"
        f"export const SAT_3KM_WIDTH_PX = {km3_width_px};\n"
        f"export const SAT_5KM_WIDTH_PX = {km5_width_px};\n"
        f"export const SAT_PTS = {json.dumps(pts_720, indent=2)} as const;\n"
    )
    OUT_TS.write_text(ts_code, encoding="utf-8")
    print(f"SAVED HIGH-RES Z14 POLISHED SATELLITE MAP -> {OUT_IMG} ({OUT_W}x{OUT_H})")
    print(f"EXACT 720x1280 PTS -> {pts_720} | 3km={km3_width_px}px, 5km={km5_width_px}px")


if __name__ == "__main__":
    main()
