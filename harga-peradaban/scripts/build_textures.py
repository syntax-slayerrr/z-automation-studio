"""
Bespoke Full-HD (1080x1920) Pure-Code Procedural Painterly Plates for
"HARGA SEBUAH PERADABAN" (Anthropology Explanation v2.6 — Upgraded Directional Lighting & Shadows).

Generates 10 atmospheric gouache backgrounds & optical overlays with deterministic FBM paper mottling,
organic brush stratification, directional sunlight falloff, deep cool umbra shadow gradients, and
zero flat digital color fills.

Run:
    python harga-peradaban/scripts/build_textures.py
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "harga-peradaban" / "textures"
W, H = 1080, 1920


def fbm_noise(h: int, w: int, seed: int, octaves: tuple[tuple[int, float], ...]) -> np.ndarray:
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), dtype=np.float32)
    weight_sum = 0.0
    for scale, weight in octaves:
        gh = max(2, h // scale)
        gw = max(2, w // scale)
        grid = rng.random((gh, gw), dtype=np.float32)
        up = np.array(
            Image.fromarray((grid * 255).astype(np.uint8)).resize((w, h), Image.Resampling.BICUBIC),
            dtype=np.float32,
        ) / 255.0
        acc += up * weight
        weight_sum += weight
    acc /= max(1e-6, weight_sum)
    return np.clip(acc, 0.0, 1.0)


def grad_vertical(stops: list[tuple[float, tuple[int, int, int]]]) -> np.ndarray:
    y = np.linspace(0.0, 1.0, H, dtype=np.float32)[:, None]
    out = np.zeros((H, W, 3), dtype=np.float32)
    for idx in range(len(stops) - 1):
        p0, c0 = stops[idx]
        p1, c1 = stops[idx + 1]
        mask = (y >= p0) & (y <= p1 if idx == len(stops) - 2 else y < p1)
        t = np.clip((y - p0) / max(1e-5, p1 - p0), 0.0, 1.0)
        c0a = np.array(c0, dtype=np.float32)[None, None, :]
        c1a = np.array(c1, dtype=np.float32)[None, None, :]
        out = np.where(mask[:, :, None], c0a * (1.0 - t[:, :, None]) + c1a * t[:, :, None], out)
    return out


def add_directional_sun_bloom(
    img: np.ndarray,
    cx_frac: float,
    cy_frac: float,
    radius_frac: float,
    color: tuple[int, int, int],
    strength: float,
) -> np.ndarray:
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx = (xx - W * cx_frac) / (W * radius_frac)
    dy = (yy - H * cy_frac) / (W * radius_frac)
    dist2 = dx * dx + dy * dy
    bloom = np.exp(-dist2 * 1.15) * strength
    col = np.array(color, dtype=np.float32)[None, None, :]
    # Screen-like luminous sun lift
    return np.clip(img + (255.0 - img) * (bloom[:, :, None] * (col / 255.0)), 0.0, 255.0)


def add_gouache_finish(img: np.ndarray, seed: int, strength: float = 16.0, warm_vignette: float = 0.24) -> np.ndarray:
    mottle = fbm_noise(H, W, seed, ((220, 0.45), (90, 0.30), (32, 0.17), (10, 0.08)))
    tooth = fbm_noise(H, W, seed + 77, ((16, 0.65), (5, 0.35)))
    delta = (mottle - 0.5) * strength * 1.35 + (tooth - 0.5) * (strength * 0.45)
    out = np.clip(img + delta[:, :, None], 0.0, 255.0)

    # Subtle directional edge shadow vignette (keeps edges painterly, never pure black)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx / W - 0.5) * 2.0
    ny = (yy / H - 0.48) * 2.0
    rad = np.sqrt(nx * nx * 0.95 + ny * ny * 0.72)
    vig = np.clip((rad - 0.58) / 0.85, 0.0, 1.0) ** 1.75 * warm_vignette
    shadow_tint = np.array([18.0, 22.0, 32.0], dtype=np.float32)[None, None, :]
    out = out * (1.0 - vig[:, :, None]) + shadow_tint * vig[:, :, None]
    return np.clip(out, 0.0, 255.0)


def add_painted_clouds(
    img: np.ndarray,
    seed: int,
    band_y0: float,
    band_y1: float,
    lit_col: tuple[int, int, int],
    shadow_col: tuple[int, int, int],
    density: float = 0.55,
    light_from: str = "right",
) -> np.ndarray:
    n = fbm_noise(H, W, seed, ((240, 0.52), (110, 0.30), (42, 0.18)))
    yy = np.linspace(0.0, 1.0, H, dtype=np.float32)[:, None]
    band = np.exp(-((yy - (band_y0 + band_y1) * 0.5) / max(0.04, (band_y1 - band_y0) * 0.55)) ** 2)
    cloud_field = n * band
    mask = np.clip((cloud_field - (1.0 - density)) / max(0.05, density * 0.55), 0.0, 1.0)
    mask = gaussian_filter(mask, sigma=4.0)

    # Directional cloud top-rim illumination vs cool shaded cloud belly!
    dx_shift = 16 if light_from == "right" else -16
    shifted = np.roll(np.roll(mask, -18, axis=0), dx_shift, axis=1)
    lit_factor = np.clip(0.5 + (mask - shifted) * 2.2, 0.0, 1.0)

    lit = np.array(lit_col, dtype=np.float32)[None, None, :]
    shd = np.array(shadow_col, dtype=np.float32)[None, None, :]
    cloud_rgb = shd * (1.0 - lit_factor[:, :, None]) + lit * lit_factor[:, :, None]
    alpha = (mask * 0.72)[:, :, None]
    return np.clip(img * (1.0 - alpha) + cloud_rgb * alpha, 0.0, 255.0)


def save_rgb(arr: np.ndarray, name: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGB").save(path, optimize=True)
    print(f"  -> baked {name} ({W}x{H})")


def main() -> None:
    print("=== Baking 10 Bespoke 1080x1920 Shadow-Rich Painterly Plates for HARGA SEBUAH PERADABAN ===")

    # 1. Scene 01: Sun-Baked Ancient Savanna Sky (High golden raking light from right)
    sav = grad_vertical([
        (0.00, (44, 72, 102)),
        (0.28, (96, 134, 152)),
        (0.54, (206, 174, 126)),
        (0.74, (238, 198, 134)),
        (1.00, (162, 114, 68)),
    ])
    sav = add_painted_clouds(sav, 101, 0.14, 0.44, (248, 228, 186), (124, 114, 118), density=0.52, light_from="right")
    sav = add_directional_sun_bloom(sav, 0.80, 0.34, 0.58, (255, 224, 158), 0.48)
    save_rgb(add_gouache_finish(sav, 102, 18.0, 0.22), "sky_savanna_sunlit.png")

    # 2. Scene 01 Shot 04: Deep Campfire Night Sky (Starlit indigo with warm ember bounce low)
    night = grad_vertical([
        (0.00, (11, 18, 32)),
        (0.38, (20, 34, 54)),
        (0.66, (36, 42, 58)),
        (0.84, (74, 48, 36)),
        (1.00, (36, 22, 18)),
    ])
    rng = np.random.default_rng(204)
    for _ in range(190):
        sx = int(rng.integers(24, W - 24))
        sy = int(rng.integers(24, int(H * 0.56)))
        br = float(rng.uniform(0.55, 1.0))
        rad = int(rng.choice([1, 1, 2]))
        night[sy - rad : sy + rad + 1, sx - rad : sx + rad + 1] = np.clip(
            night[sy - rad : sy + rad + 1, sx - rad : sx + rad + 1] + np.array([215, 225, 245]) * br, 0, 255
        )
    night = add_directional_sun_bloom(night, 0.50, 0.72, 0.55, (255, 148, 66), 0.32)
    save_rgb(add_gouache_finish(night, 205, 14.0, 0.30), "sky_campfire_night.png")

    # 3. Scene 02: Fertile Crescent Dawn Valley (Luminous emerald-gold morning mist)
    val = grad_vertical([
        (0.00, (42, 82, 104)),
        (0.26, (92, 146, 154)),
        (0.52, (198, 212, 174)),
        (0.72, (242, 220, 154)),
        (1.00, (132, 134, 82)),
    ])
    val = add_painted_clouds(val, 301, 0.14, 0.42, (252, 242, 208), (118, 144, 148), density=0.56, light_from="right")
    val = add_directional_sun_bloom(val, 0.76, 0.36, 0.62, (255, 236, 172), 0.52)
    save_rgb(add_gouache_finish(val, 302, 16.0, 0.20), "sky_fertile_valley.png")

    # 4. Scene 02/03 Macro: Rich Moist Fertile Soil & Underground Cross-Section
    soil = grad_vertical([
        (0.00, (226, 206, 156)),
        (0.32, (176, 154, 108)),
        (0.42, (98, 68, 44)),
        (0.68, (64, 42, 28)),
        (1.00, (34, 22, 16)),
    ])
    pebbles = fbm_noise(H, W, 405, ((64, 0.42), (24, 0.35), (8, 0.23)))
    soil = np.clip(soil + (pebbles[:, :, None] - 0.5) * 34.0, 0, 255)
    soil = add_directional_sun_bloom(soil, 0.52, 0.24, 0.55, (255, 234, 178), 0.36)
    save_rgb(add_gouache_finish(soil, 406, 18.0, 0.28), "soil_fertile_macro.png")

    # 5. Scene 03: Golden Harvest Sunset (Warm amber sky melting over early farming village)
    harv = grad_vertical([
        (0.00, (48, 42, 74)),
        (0.24, (118, 72, 86)),
        (0.48, (206, 122, 82)),
        (0.70, (246, 184, 102)),
        (1.00, (148, 96, 48)),
    ])
    harv = add_painted_clouds(harv, 501, 0.16, 0.46, (254, 222, 154), (104, 58, 76), density=0.58, light_from="left")
    harv = add_directional_sun_bloom(harv, 0.26, 0.44, 0.64, (255, 212, 130), 0.54)
    save_rgb(add_gouache_finish(harv, 502, 16.0, 0.24), "sky_harvest_sunset.png")

    # 6. Scene 04 Shot 01: Chiaroscuro Dark Clay Granary Interior (Dramatic diagonal doorway beam!)
    gran = grad_vertical([
        (0.00, (22, 18, 17)),
        (0.45, (38, 29, 24)),
        (0.78, (54, 40, 30)),
        (1.00, (28, 20, 16)),
    ])
    plaster = fbm_noise(H, W, 601, ((120, 0.45), (42, 0.35), (14, 0.20)))
    gran = np.clip(gran + (plaster[:, :, None] - 0.5) * 26.0, 0, 255)
    # Diagonal volumetric sunlight shaft piercing from upper right doorway to lower-left floor!
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    beam_dist = np.abs((xx - W * 0.86) * 0.68 + (yy - H * 0.24) * 0.73 - 0.0)
    # Better parametric diagonal line from (0.85W, 0.22H) -> (0.28W, 0.76H)
    px = (xx - W * 0.86)
    py = (yy - H * 0.22)
    vx, vy = -W * 0.58, H * 0.56
    vlen = math.hypot(vx, vy)
    along = (px * vx + py * vy) / (vlen * vlen)
    perp = np.abs(px * (-vy / vlen) + py * (vx / vlen))
    beam_w = 110.0 + np.clip(along, 0.0, 1.3) * 240.0
    shaft = np.exp(-((perp / beam_w) ** 2) * 1.8) * np.clip(along * 4.5, 0.0, 1.0) * np.clip((1.18 - along) * 3.5, 0.0, 1.0)
    gran = np.clip(gran + shaft[:, :, None] * np.array([138, 108, 62], dtype=np.float32)[None, None, :], 0, 255)
    save_rgb(add_gouache_finish(gran, 602, 16.0, 0.38), "interior_granary_dark.png")

    # 7. Scene 04 Shots 02-04: Tense Ochre-Storm Conflict Dusk (Low moody contrast, heavy shadows)
    conf = grad_vertical([
        (0.00, (34, 42, 56)),
        (0.28, (76, 80, 92)),
        (0.54, (164, 126, 94)),
        (0.76, (196, 134, 82)),
        (1.00, (98, 68, 46)),
    ])
    conf = add_painted_clouds(conf, 701, 0.14, 0.48, (216, 178, 138), (58, 60, 74), density=0.62, light_from="left")
    conf = add_directional_sun_bloom(conf, 0.18, 0.46, 0.50, (244, 176, 102), 0.36)
    save_rgb(add_gouache_finish(conf, 702, 18.0, 0.30), "sky_conflict_drought.png")

    # 8. Scene 05: Sun-Baked Mesopotamia & Cuneiform Clay Warmth (Imperial gold-sienna)
    meso = grad_vertical([
        (0.00, (36, 48, 72)),
        (0.24, (98, 84, 92)),
        (0.50, (198, 136, 86)),
        (0.74, (238, 182, 114)),
        (1.00, (132, 86, 52)),
    ])
    meso = add_painted_clouds(meso, 801, 0.12, 0.42, (252, 224, 166), (86, 68, 78), density=0.52, light_from="right")
    meso = add_directional_sun_bloom(meso, 0.78, 0.38, 0.62, (255, 214, 134), 0.52)
    save_rgb(add_gouache_finish(meso, 802, 16.0, 0.24), "sky_mesopotamia_uruk.png")

    # 9. Scene 06: Modern Industrial Twilight & Global Steel-Amber Sky
    mod = grad_vertical([
        (0.00, (18, 30, 48)),
        (0.30, (38, 62, 88)),
        (0.56, (112, 128, 140)),
        (0.76, (212, 166, 114)),
        (1.00, (62, 54, 48)),
    ])
    mod = add_painted_clouds(mod, 901, 0.18, 0.48, (234, 210, 176), (52, 68, 86), density=0.46, light_from="left")
    mod = add_directional_sun_bloom(mod, 0.24, 0.58, 0.58, (252, 198, 128), 0.38)
    save_rgb(add_gouache_finish(mod, 902, 14.0, 0.26), "sky_modern_horizon.png")

    # 10. Fine 35mm Analog Film Grain Overlay (Neutral mid-gray for soft-light/overlay compositing)
    rng_g = np.random.default_rng(1010)
    grain = 128.0 + rng_g.normal(0.0, 18.0, size=(H, W, 1)).astype(np.float32)
    grain_rgb = np.repeat(np.clip(grain, 0, 255), 3, axis=2)
    save_rgb(grain_rgb, "film_grain_overlay.png")

    print("ALL 10 SHADOW-RICH PAINTERLY PLATES BAKED SUCCESSFULLY!")


if __name__ == "__main__":
    main()
