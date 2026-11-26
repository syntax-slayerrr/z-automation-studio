"""
100% Pure-Code Procedural Maritime, Volcanic Relief & Archipelago Texture Forge
for "Nusantara: Peradaban yang Mengarungi Samudra" (9:16 TikTok 1080x1920).

Imports core deterministic noise/mottle kernels from `scripts/anthropology_engine/texture_forge.py`
and synthesizes bespoke plates for all 5 Acts (Storm Ocean, Starry Celestial Navigation,
Madagascar Lagoon Coast, Volcanic Andesite Borobudur Stone, Golden Monsoon Sunset,
Turquoise Trepang Seabed with Caustics, Shaded-Relief Indian Ocean Atlas, & Aerial Archipelago Sky).
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "anthropology_engine"))
from texture_forge import (  # noqa: E402
    build_film_grain_overlay,
    build_sky_sunset,
    build_topographic_ocean_plate,
    fbm2d,
    gradient_3stop,
    paint_volumetric_clouds,
    painter_mottle,
    screen_blend,
    voronoi_edge_field,
)

OUT_DIR = ROOT / "public" / "nusantara-samudra" / "textures"
W, H = 1080, 1920


def build_storm_ocean_sky(seed: int = 1101) -> Image.Image:
    base = gradient_3stop(W, H, (10, 16, 28), (22, 36, 54), (16, 28, 42), mid_y=0.52)
    clouds = paint_volumetric_clouds(
        W, H,
        lit_rgba=(92, 114, 142, 175),
        mid_rgba=(44, 58, 80, 215),
        shadow_rgba=(18, 25, 38, 235),
        clusters=[
            (W * 0.18, H * 0.18, 230),
            (W * 0.56, H * 0.15, 260),
            (W * 0.88, H * 0.24, 240),
            (W * 0.36, H * 0.32, 220),
            (W * 0.78, H * 0.38, 210),
        ],
        seed=seed,
    )
    return painter_mottle(Image.alpha_composite(base, clouds), strength=0.06, seed=seed + 1, warm_bias=False)


def build_celestial_night_sky(seed: int = 1102) -> Image.Image:
    base = gradient_3stop(W, H, (8, 14, 30), (16, 30, 56), (26, 48, 76), mid_y=0.58)
    # Subtle diagonal Milky Way celestial dust ribbon
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    diag = np.abs((xx / W) * 0.85 - (yy / H) * 0.55 - 0.08)
    mw = np.exp(-((diag / 0.16) ** 2)) * (0.45 + 0.55 * fbm2d(H, W, seed=seed + 2, octaves=((96, 0.6), (32, 0.4))))
    mw = np.clip(mw * 0.36, 0.0, 0.42)
    glow = np.zeros((H, W, 4), dtype=np.uint8)
    glow[:, :, 0] = 158
    glow[:, :, 1] = 196
    glow[:, :, 2] = 236
    glow[:, :, 3] = np.clip(mw * 255.0, 0, 255).astype(np.uint8)
    comp = screen_blend(base, Image.fromarray(glow, mode="RGBA").filter(ImageFilter.GaussianBlur(radius=12)))

    rng = np.random.default_rng(seed + 5)
    d = ImageDraw.Draw(comp, "RGBA")
    for _ in range(320):
        sx = float(rng.uniform(10, W - 10))
        sy = float(rng.uniform(10, H * 0.82))
        sr = float(rng.choice([0.9, 1.4, 2.3], p=[0.66, 0.25, 0.09]))
        al = int(rng.integers(90, 245))
        d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(248, 242, 224, al))
    return painter_mottle(comp, strength=0.05, seed=seed + 8, warm_bias=False)


def build_madagascar_coastal_sky(seed: int = 1103) -> Image.Image:
    base = gradient_3stop(W, H, (38, 86, 128), (118, 168, 188), (242, 204, 148), mid_y=0.45)
    clouds = paint_volumetric_clouds(
        W, H,
        lit_rgba=(252, 238, 208, 220),
        mid_rgba=(226, 198, 168, 185),
        shadow_rgba=(132, 138, 162, 145),
        clusters=[(W * 0.20, H * 0.20, 175), (W * 0.72, H * 0.24, 195), (W * 0.48, H * 0.30, 145)],
        seed=seed,
    )
    return painter_mottle(Image.alpha_composite(base, clouds), strength=0.055, seed=seed + 2, warm_bias=True)


def build_borobudur_andesite_plate(seed: int = 1104) -> Image.Image:
    """Authentic porous volcanic andesite stone wall with weathered ashlar masonry blocks & mossy dust."""
    arr = np.zeros((H, W, 4), dtype=np.float32)
    coarse = fbm2d(H, W, seed=seed, octaves=((120, 0.5), (36, 0.3), (10, 0.2)))
    _, d1, edge = voronoi_edge_field(H // 4, W // 4, n_sites=110, seed=seed + 3)
    from scipy.ndimage import zoom
    pores = np.clip((zoom(d1, (4.0, 4.0), order=1)[:H, :W] - 4.5) / 14.0, 0.0, 1.0)
    # Warm weathered gray-brown volcanic andesite base
    arr[:, :, 0] = (92 + coarse * 26) * (0.86 + 0.16 * pores)
    arr[:, :, 1] = (86 + coarse * 24) * (0.86 + 0.16 * pores)
    arr[:, :, 2] = (78 + coarse * 20) * (0.86 + 0.16 * pores)
    arr[:, :, 3] = 255.0
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")

    # Subtle carved volcanic ashlar block joints
    d = ImageDraw.Draw(img, "RGBA")
    row_h = 192
    for r in range(H // row_h + 1):
        y = r * row_h
        d.line([(0, y), (W, y)], fill=(38, 34, 30, 150), width=4)
        d.line([(0, y + 4), (W, y + 4)], fill=(156, 144, 126, 75), width=2)
        off = 140 if r % 2 == 0 else 0
        for x in range(off, W, 320):
            d.line([(x, y), (x, y + row_h)], fill=(38, 34, 30, 130), width=3)

    return painter_mottle(img, strength=0.09, seed=seed + 7, warm_bias=True)


def build_trepang_seabed_plate(seed: int = 1105) -> Image.Image:
    """Luminous shallow turquoise-indigo tropical reef water & sunlit underwater caustic webs."""
    base = gradient_3stop(W, H, (22, 108, 126), (18, 72, 96), (14, 42, 62), mid_y=0.45)
    arr = np.array(base, dtype=np.float32)
    _, _, edge = voronoi_edge_field(H // 3, W // 3, n_sites=64, seed=seed)
    from scipy.ndimage import zoom
    edge_up = zoom(edge, (3.0, 3.0), order=1)[:H, :W]
    caustic = np.clip((4.8 - edge_up) / 4.8, 0.0, 1.0) ** 1.6
    yy = np.linspace(0.0, 1.0, H, dtype=np.float32)[:, None]
    fade = np.clip(1.15 - yy * 0.65, 0.25, 1.0)
    arr[:, :, 0] += caustic * fade * 92.0
    arr[:, :, 1] += caustic * fade * 138.0
    arr[:, :, 2] += caustic * fade * 132.0
    return painter_mottle(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.07, seed=seed + 4, warm_bias=False)


def build_epilog_archipelago_sky(seed: int = 1106) -> Image.Image:
    base = gradient_3stop(W, H, (20, 56, 94), (56, 120, 152), (242, 206, 146), mid_y=0.50)
    clouds = paint_volumetric_clouds(
        W, H,
        lit_rgba=(254, 244, 218, 210),
        mid_rgba=(226, 204, 178, 175),
        shadow_rgba=(122, 138, 164, 130),
        clusters=[(W * 0.16, H * 0.16, 180), (W * 0.84, H * 0.22, 195), (W * 0.50, H * 0.12, 155)],
        seed=seed,
    )
    return painter_mottle(Image.alpha_composite(base, clouds), strength=0.055, seed=seed + 1, warm_bias=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Forging Nusantara Maritime Pure-Code Plates ({W}x{H}) -> {OUT_DIR}")

    build_storm_ocean_sky(1101).save(OUT_DIR / "sky_storm_ocean.png")
    build_celestial_night_sky(1102).save(OUT_DIR / "sky_starry_navigation.png")
    build_madagascar_coastal_sky(1103).save(OUT_DIR / "sky_madagascar_coast.png")
    build_sky_sunset(W, H, seed=1104).save(OUT_DIR / "sky_trade_sunset.png")
    build_borobudur_andesite_plate(1105).save(OUT_DIR / "stone_borobudur_andesite.png")
    build_trepang_seabed_plate(1106).save(OUT_DIR / "water_seabed_trepang.png")
    build_topographic_ocean_plate(W, H, seed=1107).save(OUT_DIR / "topo_indian_ocean.png")
    build_epilog_archipelago_sky(1108).save(OUT_DIR / "sky_nusantara_epilog.png")
    build_film_grain_overlay(W, H, seed=1109).save(OUT_DIR / "film_grain_overlay.png")

    print("NUSANTARA MARITIME TEXTURE PACK COMPLETE (9 full-HD 9:16 plates)!")


if __name__ == "__main__":
    main()
