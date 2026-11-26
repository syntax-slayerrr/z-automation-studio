"""
Human Odyssey Pure-Code Procedural Material, Geology & Multiplane Biome Forge v2.0
(`scripts/anthropology_engine/texture_forge.py`).

100% deterministic procedural generation using ONLY verified local libraries
(`PIL / Pillow`, `numpy`, `scipy`) — ZERO AI-generated images!

v2.0 Cinematic Upgrade:
  - Ridged multifractal alpine massifs with slope-computed directional sunlight,
    faceted shadow gullies, snow couloirs, and exponential valley height-fog!
  - Continuous multi-octave savanna valley hills with shaded relief contours,
    atmospheric treeline silhouettes, and natural meandering sediment-bank river!
  - Domain-warped eroded sandstone cliff ledge with layered geological strata,
    Voronoi fracture crevices, sunlit rim highlights, and grounded flat standing shelf!
  - Shaded-relief bathymetric ocean plate for animated d3-geo migration tracking!
  - Subtle static film-grain/paper weave plate (`film_grain_overlay.png`) that binds
    SVG characters organically into procedural backdrops with ZERO per-frame flicker!
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter, zoom


# =============================================================================
# 1. DETERMINISTIC PROCEDURAL NOISE & COMPOSITING KERNELS
# =============================================================================

def fbm2d(
    H: int,
    W: int,
    seed: int = 42,
    octaves: Sequence[tuple[int, float]] = ((96, 0.50), (36, 0.30), (14, 0.20)),
) -> np.ndarray:
    """Smooth multi-octave cubic-interpolated FBM noise normalized to [-1, 1]."""
    rng = np.random.default_rng(seed)
    acc = np.zeros((H, W), dtype=np.float32)
    wsum = 0.0
    for cell, weight in octaves:
        gh = max(3, int(math.ceil(H / float(cell))) + 2)
        gw = max(3, int(math.ceil(W / float(cell))) + 2)
        grid = rng.uniform(-1.0, 1.0, (gh, gw)).astype(np.float32)
        up = zoom(grid, (H / float(gh), W / float(gw)), order=3)[:H, :W]
        if up.shape[0] < H or up.shape[1] < W:
            pad = np.zeros((H, W), dtype=np.float32)
            pad[: up.shape[0], : up.shape[1]] = up
            up = pad
        acc += up * float(weight)
        wsum += float(weight)
    acc /= max(1e-5, wsum)
    mx = max(1e-4, float(np.percentile(np.abs(acc), 99)))
    return np.clip(acc / mx, -1.0, 1.0)


def fbm1d(W: int, seed: int = 42, octaves: Sequence[tuple[int, float]] = ((260, 0.55), (96, 0.30), (32, 0.15))) -> np.ndarray:
    """Smooth 1D multi-octave noise in [-1, 1] for organic ridgelines and hill contours."""
    rng = np.random.default_rng(seed)
    acc = np.zeros(W, dtype=np.float32)
    wsum = 0.0
    for cell, weight in octaves:
        n = max(4, int(math.ceil(W / float(cell))) + 2)
        g = rng.uniform(-1.0, 1.0, n).astype(np.float32)
        up = zoom(g, W / float(n), order=3)[:W]
        if up.shape[0] < W:
            up = np.pad(up, (0, W - up.shape[0]), mode="edge")
        acc += up * float(weight)
        wsum += float(weight)
    acc /= max(1e-5, wsum)
    mx = max(1e-4, float(np.max(np.abs(acc))))
    return np.clip(acc / mx, -1.0, 1.0)


def voronoi_edge_field(H: int, W: int, n_sites: int = 36, seed: int = 7) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Deterministic Voronoi cell ID, distance-to-center d1, and edge crack metric (d2 - d1)."""
    rng = np.random.default_rng(seed)
    sx = rng.uniform(0, W, n_sites).astype(np.float32)
    sy = rng.uniform(0, H, n_sites).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    d1 = np.full((H, W), 1e9, dtype=np.float32)
    d2 = np.full((H, W), 1e9, dtype=np.float32)
    cid = np.zeros((H, W), dtype=np.int32)

    for i in range(n_sites):
        dist = np.sqrt((xx - sx[i]) ** 2 + (yy - sy[i]) ** 2)
        m1 = dist < d1
        d2 = np.where(m1, d1, np.minimum(d2, dist))
        cid = np.where(m1, i, cid)
        d1 = np.where(m1, dist, d1)

    return cid, d1, d2 - d1


def painter_mottle(img: Image.Image, strength: float = 0.08, seed: int = 11, warm_bias: bool = True) -> Image.Image:
    """Adds subtle tactile painted-gouache pigment tooth (deterministic, zero flicker)."""
    arr = np.array(img.convert("RGBA"), dtype=np.float32)
    H, W = arr.shape[:2]
    n = fbm2d(H, W, seed=seed, octaves=((64, 0.50), (22, 0.32), (8, 0.18)))
    arr[:, :, :3] *= 1.0 + n[:, :, None] * strength
    if warm_bias:
        arr[:, :, 0] += n * (strength * 14.0)
        arr[:, :, 2] -= n * (strength * 8.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


def screen_blend(base: Image.Image, glow: Image.Image) -> Image.Image:
    b = np.array(base.convert("RGBA"), dtype=np.float32) / 255.0
    g = np.array(glow.convert("RGBA"), dtype=np.float32) / 255.0
    g_rgb = g[:, :, :3] * g[:, :, 3:4]
    out_rgb = 1.0 - (1.0 - b[:, :, :3]) * (1.0 - g_rgb)
    out = np.concatenate([np.clip(out_rgb, 0.0, 1.0), b[:, :, 3:4]], axis=2)
    return Image.fromarray((out * 255.0).round().astype(np.uint8), mode="RGBA")


def gradient_3stop(
    W: int,
    H: int,
    top: tuple[int, int, int],
    mid: tuple[int, int, int],
    bot: tuple[int, int, int],
    mid_y: float = 0.55,
) -> Image.Image:
    yy = np.linspace(0.0, 1.0, H, dtype=np.float32)[:, None]
    t1 = np.clip(yy / mid_y, 0.0, 1.0)
    t2 = np.clip((yy - mid_y) / max(1e-4, 1.0 - mid_y), 0.0, 1.0)
    arr = np.zeros((H, W, 4), dtype=np.float32)
    for c in range(3):
        u = top[c] * (1.0 - t1) + mid[c] * t1
        l = mid[c] * (1.0 - t2) + bot[c] * t2
        arr[:, :, c] = np.where(yy <= mid_y, u, l)
    arr[:, :, 3] = 255.0
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


# =============================================================================
# 2. HUMAN ODYSSEY ATMOSPHERIC SKIES & CLOUDS
# =============================================================================

def paint_volumetric_clouds(
    W: int,
    H: int,
    lit_rgba: tuple[int, int, int, int],
    mid_rgba: tuple[int, int, int, int],
    shadow_rgba: tuple[int, int, int, int],
    clusters: Sequence[tuple[float, float, float]],
    seed: int = 33,
) -> Image.Image:
    """Painterly multi-lobe volumetric clouds with soft atmospheric blending."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    rng = np.random.default_rng(seed)

    for cx, cy, r in clusters:
        for _ in range(7):
            ox = float(rng.uniform(-r * 0.9, r * 0.9))
            oy = float(rng.uniform(r * 0.04, r * 0.34))
            pr = r * float(rng.uniform(0.42, 0.76))
            draw.ellipse([cx + ox - pr, cy + oy - pr * 0.62, cx + ox + pr, cy + oy + pr * 0.62], fill=shadow_rgba)

    for cx, cy, r in clusters:
        for _ in range(8):
            ox = float(rng.uniform(-r * 0.95, r * 0.95))
            oy = float(rng.uniform(-r * 0.24, r * 0.14))
            pr = r * float(rng.uniform(0.38, 0.72))
            draw.ellipse([cx + ox - pr, cy + oy - pr * 0.68, cx + ox + pr, cy + oy + pr * 0.68], fill=mid_rgba)

    for cx, cy, r in clusters:
        for _ in range(6):
            ox = float(rng.uniform(-r * 0.65, r * 0.75))
            oy = float(rng.uniform(-r * 0.44, -r * 0.08))
            pr = r * float(rng.uniform(0.28, 0.54))
            draw.ellipse([cx + ox - pr, cy + oy - pr * 0.66, cx + ox + pr, cy + oy + pr * 0.66], fill=lit_rgba)

    layer = painter_mottle(layer, strength=0.065, seed=seed + 5, warm_bias=True)
    return layer.filter(ImageFilter.GaussianBlur(radius=4.5))


def build_sky_savanna_golden(W: int = 1080, H: int = 1920, seed: int = 101) -> Image.Image:
    """Luminous cerulean-to-warm-ochre-horizon sky with soft painterly clouds & sun scattering."""
    is_portrait = H > W
    base = gradient_3stop(W, H, (38, 86, 142), (138, 174, 198), (242, 200, 144), mid_y=0.38 if is_portrait else 0.45)
    base = painter_mottle(base, strength=0.05, seed=seed, warm_bias=True)

    r_unit = min(W, H) * (0.16 if is_portrait else 0.18)
    clusters = (
        [
            (W * 0.14, H * 0.25, r_unit * 0.88),
            (W * 0.36, H * 0.21, r_unit * 0.65),
            (W * 0.58, H * 0.31, r_unit * 0.56),
            (W * 0.84, H * 0.26, r_unit * 0.92),
            (W * 0.92, H * 0.35, r_unit * 0.72),
        ]
        if is_portrait
        else [
            (W * 0.16, H * 0.28, W * 0.11),
            (W * 0.34, H * 0.23, W * 0.08),
            (W * 0.52, H * 0.34, W * 0.07),
            (W * 0.84, H * 0.27, W * 0.12),
        ]
    )
    clouds = paint_volumetric_clouds(
        W, H,
        lit_rgba=(252, 240, 212, 215),
        mid_rgba=(232, 204, 174, 185),
        shadow_rgba=(144, 142, 166, 145),
        clusters=clusters,
        seed=seed + 2,
    )
    comp = Image.alpha_composite(base, clouds)

    # Atmospheric Mie scattering sun bloom (upper-right)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sx, sy = (W * 0.76, H * 0.27) if is_portrait else (W * 0.72, H * 0.27)
    dist = np.clip(np.sqrt((xx - sx) ** 2 + (yy - sy) ** 2) / (min(W, H) * 0.78), 0.0, 1.0)
    glow_a = ((1.0 - dist) ** 2.2) * 0.58
    g_arr = np.zeros((H, W, 4), dtype=np.uint8)
    g_arr[:, :, 0] = 252
    g_arr[:, :, 1] = 222
    g_arr[:, :, 2] = 152
    g_arr[:, :, 3] = np.clip(glow_a * 255.0, 0, 255).astype(np.uint8)
    return screen_blend(comp, Image.fromarray(g_arr, mode="RGBA"))


def build_sky_sunset(W: int = 1080, H: int = 1920, seed: int = 102) -> Image.Image:
    base = gradient_3stop(W, H, (42, 34, 78), (172, 84, 82), (244, 174, 88), mid_y=0.46)
    base = painter_mottle(base, strength=0.06, seed=seed, warm_bias=True)
    clouds = paint_volumetric_clouds(
        W, H,
        lit_rgba=(252, 210, 132, 215),
        mid_rgba=(208, 110, 88, 185),
        shadow_rgba=(88, 52, 84, 165),
        clusters=[(W * 0.22, H * 0.30, min(W, H) * 0.14), (W * 0.62, H * 0.24, min(W, H) * 0.12), (W * 0.85, H * 0.35, min(W, H) * 0.15)],
        seed=seed + 3,
    )
    return Image.alpha_composite(base, clouds)


def build_sky_night_aurora(W: int = 1080, H: int = 1920, seed: int = 103, with_aurora: bool = False) -> Image.Image:
    """Deep cinematic indigo night sky with organic northern lights and restrained stars."""
    base = gradient_3stop(W, H, (12, 18, 38), (22, 36, 68), (34, 52, 84), mid_y=0.56)
    base = painter_mottle(base, strength=0.055, seed=seed, warm_bias=False)

    if with_aurora:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        wave1 = np.sin(xx / (W * 0.16) + 0.5) * (H * 0.065) + np.cos(xx / (W * 0.09)) * (H * 0.025)
        band1 = np.exp(-((yy - (H * 0.26 + wave1)) / (H * 0.095)) ** 2)
        wave2 = np.cos(xx / (W * 0.19) + 1.4) * (H * 0.05)
        band2 = np.exp(-((yy - (H * 0.36 + wave2)) / (H * 0.08)) ** 2)
        warp = fbm2d(H, W, seed=seed + 9, octaves=((96, 0.7), (32, 0.3)))
        curtain = 0.50 + 0.50 * np.sin(xx / 26.0 + warp * 3.8)
        a = np.clip((band1 * 0.48 + band2 * 0.34) * curtain, 0.0, 0.54)
        aur = np.zeros((H, W, 4), dtype=np.uint8)
        aur[:, :, 0] = 68
        aur[:, :, 1] = 204
        aur[:, :, 2] = 166
        aur[:, :, 3] = np.clip(a * 255.0, 0, 255).astype(np.uint8)
        base = screen_blend(base, Image.fromarray(aur, mode="RGBA").filter(ImageFilter.GaussianBlur(radius=9)))

    rng = np.random.default_rng(seed + 19)
    draw = ImageDraw.Draw(base, "RGBA")
    for _ in range(210):
        sx = float(rng.uniform(12, W - 12))
        sy = float(rng.uniform(12, H * 0.66))
        sr = float(rng.choice([0.9, 1.3, 2.0], p=[0.65, 0.27, 0.08]))
        al = int(rng.integers(85, 225))
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(242, 236, 218, al))
    return base


# =============================================================================
# 3. v2.0 RIDGED MULTIFRACTAL MOUNTAINS, PAINTERLY RIVER VALLEY & ERODED CLIFF
# =============================================================================

def _paint_ridged_mountain_band(
    W: int,
    H: int,
    ridge_y: np.ndarray,
    lit_rgb: tuple[float, float, float],
    sh_rgb: tuple[float, float, float],
    snow_rgb: tuple[float, float, float] | None,
    snow_thresh_y: float,
    haze_rgb: tuple[float, float, float],
    haze_start_y: float,
    seed: int,
) -> Image.Image:
    """
    Renders a genuinely painterly eroded alpine massif from a continuous ridgeline:
    uses 2D ridged FBM normal slope estimation so right-facing ridges catch golden sun
    while left-facing crags fall into cool atmospheric shadow, fading into valley height-fog!
    """
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    ry = ridge_y[None, :]
    mask = yy >= ry

    # Surface elevation height field with ridged gullies descending from crest
    depth_below = np.maximum(0.0, yy - ry)
    rock_n = fbm2d(H, W, seed=seed, octaves=((88, 0.50), (30, 0.32), (11, 0.18)))
    ridged = 1.0 - np.abs(rock_n)

    # Estimate directional sunlight on alpine facets (smooth painterly gouache planes, zero harsh vertical striping!)
    ridge_grad = gaussian_filter(np.gradient(ridge_y), sigma=6.0)
    crag_grad = np.gradient(gaussian_filter(ridged, sigma=4.5), axis=1) * 11.0
    sun_dot = np.clip(0.46 + (ridge_grad[None, :] * 0.28 + crag_grad * 0.30), 0.0, 1.0)
    sun_dot = gaussian_filter(sun_dot, sigma=4.2)

    arr = np.zeros((H, W, 4), dtype=np.float32)
    for c in range(3):
        col = sh_rgb[c] * (1.0 - sun_dot) + lit_rgb[c] * sun_dot
        # Subtle stratified crag texture
        col *= (0.90 + 0.18 * ridged)
        arr[:, :, c] = col

    # Optional natural snow dusting clinging to upper ridges & sunlit couloirs
    if snow_rgb is not None:
        snow_alt = np.clip((snow_thresh_y - yy) / max(1.0, H * 0.095), 0.0, 1.0)
        snow_mask = np.clip((snow_alt + rock_n * 0.26 - 0.18) * 2.4, 0.0, 1.0) * (0.55 + 0.45 * sun_dot)
        for c in range(3):
            arr[:, :, c] = arr[:, :, c] * (1.0 - snow_mask) + snow_rgb[c] * snow_mask

    # Exponential valley atmospheric height-fog near foothills (kills pasted-cutout look!)
    fog = np.clip((yy - haze_start_y) / max(1.0, H * 0.18), 0.0, 0.72)
    for c in range(3):
        arr[:, :, c] = arr[:, :, c] * (1.0 - fog) + haze_rgb[c] * fog

    # Anti-aliased soft mountain crest edge
    alpha = np.clip((yy - ry + 1.2) / 2.2, 0.0, 1.0) * 255.0
    arr[:, :, 3] = np.where(mask | (alpha > 0), alpha, 0.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


def build_hero_valley_layers(out_dir: Path, W: int = 1080, H: int = 1920, seed: int = 200) -> None:
    """
    Synthesizes 3 cinematic painterly parallax plates for the Rift Valley establishing shot:
      1. `valley_far_mountains.png` — 3 receding ridged-multifractal alpine ranges + golden height fog
      2. `valley_mid_river.png`     — continuous organic savanna valley hills + naturalistic sediment-bank river
      3. `valley_near_cliff.png`    — domain-warped eroded sandstone cliff plateau + deep rock crevices
    """
    is_portrait = H > W
    xs = np.linspace(0.0, 1.0, W, dtype=np.float32)

    # --- PLANE 1: FAR RECEDING ALPINE RANGES (ZERO flat geometric triangles!) ---
    # Back hazy silhouette range
    r1_noise = 1.0 - np.abs(fbm1d(W, seed=seed + 1, octaves=((240, 0.55), (84, 0.30), (28, 0.15))))
    r1_base = H * (0.56 if is_portrait else 0.57) - r1_noise * (H * 0.11) - np.exp(-((xs - 0.18) / 0.18) ** 2) * (H * 0.055)
    band1 = _paint_ridged_mountain_band(
        W, H, r1_base,
        lit_rgb=(176, 174, 178), sh_rgb=(112, 130, 156), snow_rgb=None,
        snow_thresh_y=H * 0.30, haze_rgb=(236, 214, 178), haze_start_y=H * 0.48, seed=seed + 11,
    )

    # Hero right-third eroded massif with realistic ridged peak & sunlit right flank
    r2_noise = 1.0 - np.abs(fbm1d(W, seed=seed + 2, octaves=((210, 0.52), (72, 0.30), (22, 0.18))))
    peak_gauss = np.exp(-((xs - 0.74) / 0.16) ** 2) * (H * (0.21 if is_portrait else 0.25))
    sub_peak = np.exp(-((xs - 0.93) / 0.13) ** 2) * (H * 0.12)
    left_shoulder = np.exp(-((xs - 0.49) / 0.16) ** 2) * (H * 0.07)
    r2_base = H * (0.575 if is_portrait else 0.59) - peak_gauss - sub_peak - left_shoulder - r2_noise * (H * 0.055)
    band2 = _paint_ridged_mountain_band(
        W, H, r2_base,
        lit_rgb=(218, 178, 138), sh_rgb=(66, 86, 118), snow_rgb=(248, 238, 218),
        snow_thresh_y=H * (0.37 if is_portrait else 0.34), haze_rgb=(238, 216, 178), haze_start_y=H * 0.49, seed=seed + 12,
    )
    far = Image.alpha_composite(band1, band2)

    # Extra sunlit atmospheric valley mist veil right along mountain base
    mist = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md_m = ImageDraw.Draw(mist, "RGBA")
    md_m.ellipse([-W * 0.15, H * 0.49, W * 1.15, H * 0.65], fill=(242, 220, 182, 115))
    mist = mist.filter(ImageFilter.GaussianBlur(radius=42))
    far = Image.alpha_composite(far, mist)
    far.save(out_dir / "valley_far_mountains.png")

    # --- PLANE 2: PAINTERLY SAVANNA VALLEY HILLS & NATURAL MEANDERING RIVER ---
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    hill_noise = fbm1d(W, seed=seed + 21, octaves=((320, 0.60), (110, 0.28), (38, 0.12)))
    horizon_y = H * (0.565 if is_portrait else 0.575) + np.sin(xs * math.pi * 2.2) * (H * 0.018) + hill_noise * (H * 0.022)
    # Valley bowl gently dips along river axis around x=0.68 -> 0.58
    valley_dip = np.exp(-((xs - 0.65) / 0.22) ** 2) * (H * 0.026)
    horizon_y = horizon_y + valley_dip

    terr_n = fbm2d(H, W, seed=seed + 22, octaves=((120, 0.50), (42, 0.32), (14, 0.18)))
    grass_grain = fbm2d(H, W, seed=seed + 23, octaves=((24, 0.65), (9, 0.35)))

    mid_arr = np.zeros((H, W, 4), dtype=np.float32)
    depth_t = np.clip((yy - horizon_y[None, :]) / max(1.0, H * 0.44), 0.0, 1.0)

    # Atmospheric perspective: distant hills warmer/mistier, closer valley richer olive-ochre
    lit_field = np.clip(0.55 + 0.35 * np.sin((xx / W) * 4.5 - 0.6) + 0.22 * terr_n, 0.0, 1.0)
    # Right-lower forested hillside darker emerald-olive
    right_wood = np.clip(((xx / W) - 0.66) * 2.8 + ((yy / H) - 0.68) * 1.8, 0.0, 1.0) * (1.0 - np.clip(((xx / W) - 0.58) * -4.0, 0.0, 1.0))

    base_r = 128 * (1 - depth_t) + (78 + 72 * lit_field) * depth_t - right_wood * 36
    base_g = 140 * (1 - depth_t) + (98 + 52 * lit_field) * depth_t - right_wood * 26
    base_b = 98 * (1 - depth_t) + (50 + 26 * lit_field) * depth_t - right_wood * 14

    # Sunlit warm horizon aerial haze blending hills smoothly into distant mountain fog
    haze_t = np.exp(-depth_t * 6.5) * 0.55
    mid_arr[:, :, 0] = (base_r * (1 - haze_t) + 228 * haze_t) * (1.0 + grass_grain * 0.07)
    mid_arr[:, :, 1] = (base_g * (1 - haze_t) + 206 * haze_t) * (1.0 + grass_grain * 0.06)
    mid_arr[:, :, 2] = (base_b * (1 - haze_t) + 168 * haze_t) * (1.0 + grass_grain * 0.05)
    mid_arr[:, :, 3] = np.clip((yy - horizon_y[None, :] + 1.5) / 2.5, 0.0, 1.0) * 255.0

    # Naturalistic S-curve valley river computed pixel-smooth (feathered headwaters emerging from valley mist!)
    t_riv = np.clip((yy - H * 0.576) / max(1.0, H * 0.444), 0.0, 1.0)
    river_active = yy >= H * 0.576
    head_fade = np.clip(t_riv / 0.10, 0.0, 1.0)
    riv_cx = W * (0.68 - 0.08 * t_riv + 0.115 * np.sin(t_riv * math.pi * 2.35 + 0.4) * (0.28 + 0.72 * t_riv))
    riv_hw = W * (0.0015 + 0.064 * (t_riv ** 1.56))
    dist_riv = np.abs(xx - riv_cx)
    signed_riv = (xx - riv_cx) / np.maximum(1.0, riv_hw)

    # Eroded sandy/ochre bank blending seamlessly into savanna grass
    bank_mask = np.where(river_active, np.clip(1.0 - (dist_riv - riv_hw) / (riv_hw * 0.48 + 6.0), 0.0, 1.0) * head_fade, 0.0)
    water_mask = np.where(river_active, np.clip(1.0 - (dist_riv - riv_hw * 0.88) / (riv_hw * 0.18 + 2.2), 0.0, 1.0) * head_fade, 0.0)

    # Apply bank color (darker shadowed left cutbank, warm sunlit right sandbar)
    bank_lit = np.clip(0.5 + signed_riv * 0.45, 0.0, 1.0)
    bank_r = 128 + 68 * bank_lit
    bank_g = 110 + 54 * bank_lit
    bank_b = 76 + 38 * bank_lit
    for c, bc in enumerate((bank_r, bank_g, bank_b)):
        mid_arr[:, :, c] = mid_arr[:, :, c] * (1.0 - bank_mask * 0.88) + bc * (bank_mask * 0.88)

    # Painterly water shading: sky-blue reflection + subtle golden sun shimmer along right curve + ripples
    ripple = 0.5 + 0.5 * np.sin(yy * 0.24 + terr_n * 5.5)
    sheen = np.exp(-((signed_riv - 0.22) / 0.42) ** 2) * (0.42 + 0.26 * ripple)
    wat_r = 66 + 48 * (1 - t_riv) + 158 * sheen
    wat_g = 122 + 44 * (1 - t_riv) + 114 * sheen
    wat_b = 152 + 34 * (1 - t_riv) + 52 * sheen
    for c, wc in enumerate((wat_r, wat_g, wat_b)):
        mid_arr[:, :, c] = mid_arr[:, :, c] * (1.0 - water_mask) + wc * water_mask

    mid_img = Image.fromarray(np.clip(mid_arr, 0, 255).astype(np.uint8), mode="RGBA")
    mid_img.save(out_dir / "valley_mid_river.png")

    # --- PLANE 3: ERODED DOMAIN-WARPED SANDSTONE CLIFF LEDGE ---
    near_arr = np.zeros((H, W, 4), dtype=np.float32)
    cy_top = 0.652 if is_portrait else 0.685
    cx_end = 0.63 if is_portrait else 0.54

    # Organic eroded cliff top plateau contour (gently sloping flat standing shelf at x=0.22..0.46)
    plateau_n = fbm1d(W, seed=seed + 31, octaves=((180, 0.6), (48, 0.4)))
    shelf_y = H * (cy_top + 0.016 * np.clip(xs / cx_end, 0.0, 1.0)) + plateau_n * (H * 0.0055)
    # Steep fractured right cliff face descending organically from cx_end
    cliff_edge_n = fbm1d(H, seed=seed + 32, octaves=((180, 0.6), (55, 0.4)))
    t_drop = np.clip((yy - H * cy_top) / max(1.0, H * (1.0 - cy_top)), 0.0, 1.0)
    cliff_right_x = W * (cx_end - 0.045 * np.sin(t_drop * 3.1) + 0.03 * t_drop) + cliff_edge_n[:, None] * (W * 0.022)

    inside_cliff = (yy >= shelf_y[None, :]) & (xx <= cliff_right_x)
    # Top sunlit plateau bevel band (depth ~55-75px below top lip)
    bevel_depth = H * (0.042 if is_portrait else 0.056) + plateau_n[None, :] * 14.0
    is_top_plane = inside_cliff & (yy < shelf_y[None, :] + bevel_depth)

    # Geological strata + Voronoi rock fracture blocks
    strata_warp = fbm2d(H, W, seed=seed + 33, octaves=((96, 0.6), (28, 0.4)))
    strata_band = 0.5 + 0.5 * np.sin((yy * 0.045 + strata_warp * 2.8) * 1.6)
    cid, _, v_edge = voronoi_edge_field(H // 2, W // 2, n_sites=34, seed=seed + 34)
    cid_up = zoom(cid.astype(np.float32), (2.0, 2.0), order=0)[:H, :W].astype(np.int32)
    edge_up = zoom(v_edge, (2.0, 2.0), order=1)[:H, :W]
    rng_f = np.random.default_rng(seed + 35)
    # Per-facet illumination response (3 geological light angles!)
    facet_lit = rng_f.uniform(0.18, 0.92, 34).astype(np.float32)[np.clip(cid_up, 0, 33)]
    # Make rightmost vertical edge brighter (catching afternoon sun) and deep underside darker (AO)
    edge_sun = np.clip((xx - (cliff_right_x - W * 0.14)) / max(1.0, W * 0.14), 0.0, 1.0)
    vert_ao = np.clip(1.0 - t_drop * 0.42, 0.52, 1.0)
    crack = np.clip((4.2 - edge_up) / 4.2, 0.0, 1.0)

    # Vertical cliff rock face RGB
    face_l = np.clip(facet_lit * 0.62 + edge_sun * 0.45 + strata_band * 0.16, 0.0, 1.0) * vert_ao
    rock_r = (66 + 132 * face_l) * (1.0 - crack * 0.55)
    rock_g = (38 + 82 * face_l) * (1.0 - crack * 0.55)
    rock_b = (30 + 48 * face_l) * (1.0 - crack * 0.52)

    # Top sunlit sandstone plateau RGB (warm golden ochre catching directional sunlight!)
    top_grad = np.clip(0.45 + (xs[None, :] / max(0.01, cx_end)) * 0.55 + strata_warp * 0.18, 0.0, 1.0)
    top_r = (168 + 74 * top_grad) * (1.0 - crack * 0.22)
    top_g = (112 + 72 * top_grad) * (1.0 - crack * 0.22)
    top_b = (72 + 50 * top_grad) * (1.0 - crack * 0.20)

    # Sharp overhang rim shadow right beneath top plateau lip
    lip_shadow = np.exp(-np.abs(yy - (shelf_y[None, :] + bevel_depth)) / 8.0) * 0.45
    near_arr[:, :, 0] = np.where(is_top_plane, top_r, rock_r * (1.0 - lip_shadow))
    near_arr[:, :, 1] = np.where(is_top_plane, top_g, rock_g * (1.0 - lip_shadow))
    near_arr[:, :, 2] = np.where(is_top_plane, top_b, rock_b * (1.0 - lip_shadow))

    # Crisp anti-aliased cliff alpha mask
    a_top = np.clip((yy - shelf_y[None, :] + 1.2) / 2.2, 0.0, 1.0)
    a_right = np.clip((cliff_right_x - xx + 1.2) / 2.2, 0.0, 1.0)
    near_arr[:, :, 3] = a_top * a_right * 255.0

    near_img = painter_mottle(Image.fromarray(np.clip(near_arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.075, seed=seed + 36, warm_bias=True)
    near_img.save(out_dir / "valley_near_cliff.png")


# =============================================================================
# 4. CARTOGRAPHY, BIOLOGY, FILM GRAIN & REUSABLE MATERIAL TILES
# =============================================================================

def build_topographic_ocean_plate(W: int = 1080, H: int = 1920, seed: int = 301) -> Image.Image:
    """Shaded-relief bathymetric ocean plate with crisp subtle contour isolines."""
    base = gradient_3stop(W, H, (18, 42, 62), (28, 64, 88), (15, 36, 54), mid_y=0.48)
    arr = np.array(base, dtype=np.float32)
    field = fbm2d(H, W, seed=seed, octaves=((200, 0.65), (72, 0.35)))
    # Subtle shaded bathymetry depth + crisp fine isolines
    arr[:, :, 0] += field * 10.0
    arr[:, :, 1] += field * 18.0
    arr[:, :, 2] += field * 22.0
    iso = np.abs(np.sin(field * 15.0))
    line_mask = np.clip((0.055 - iso) / 0.055, 0.0, 1.0)
    arr[:, :, 0] += line_mask * 26.0
    arr[:, :, 1] += line_mask * 44.0
    arr[:, :, 2] += line_mask * 54.0
    return painter_mottle(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.065, seed=seed + 4, warm_bias=False)


def build_bio_backdrop_plate(W: int = 1080, H: int = 1920, seed: int = 401) -> Image.Image:
    """Restrained deep studio marine-slate backdrop with subtle organic cellular bokeh."""
    base = gradient_3stop(W, H, (14, 28, 42), (22, 50, 66), (14, 30, 44), mid_y=0.46)
    arr = np.array(base, dtype=np.float32)
    _, _, edge = voronoi_edge_field(H // 2, W // 2, n_sites=38, seed=seed)
    edge_up = zoom(edge, (2.0, 2.0), order=1)[:H, :W]
    mem = np.clip((5.0 - edge_up) / 5.0, 0.0, 1.0) * 0.16
    arr[:, :, 0] += mem * 48.0
    arr[:, :, 1] += mem * 116.0
    arr[:, :, 2] += mem * 136.0
    return painter_mottle(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.07, seed=seed + 7, warm_bias=False)


def build_film_grain_overlay(W: int = 1080, H: int = 1920, seed: int = 909) -> Image.Image:
    """Static deterministic fine gouache paper tooth + subtle organic fiber weave (zero flicker!)."""
    rng = np.random.default_rng(seed)
    fine = rng.normal(0.0, 1.0, (H // 2, W // 2)).astype(np.float32)
    fine_up = zoom(fine, (2.0, 2.0), order=1)[:H, :W]
    coarse = fbm2d(H, W, seed=seed + 1, octaves=((64, 0.6), (20, 0.4)))
    val = np.clip(128.0 + fine_up * 22.0 + coarse * 18.0, 0, 255).astype(np.uint8)
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[:, :, 0] = val
    arr[:, :, 1] = np.clip(val.astype(np.int16) - 3, 0, 255).astype(np.uint8)
    arr[:, :, 2] = np.clip(val.astype(np.int16) - 8, 0, 255).astype(np.uint8)
    arr[:, :, 3] = 255
    return Image.fromarray(arr, mode="RGBA")


def build_material_swatch_rock(size: int = 256, palette: str = "sandstone", seed: int = 501) -> Image.Image:
    pal_map = {
        "sandstone": ((214, 152, 98), (168, 106, 64), (92, 54, 38)),
        "granite":   ((156, 158, 166), (108, 112, 122), (56, 60, 72)),
        "basalt":    ((88, 94, 112), (54, 58, 74), (30, 32, 44)),
    }
    hi, mid, lo = pal_map.get(palette, pal_map["sandstone"])
    cid, _, edge = voronoi_edge_field(size, size, n_sites=16, seed=seed)
    rng = np.random.default_rng(seed + 1)
    cell_tones = rng.choice([0, 1, 2], size=16, p=[0.32, 0.42, 0.26])
    arr = np.zeros((size, size, 4), dtype=np.float32)
    tones = np.array([hi, mid, lo], dtype=np.float32)
    for c in range(3):
        arr[:, :, c] = tones[cell_tones[cid], c]
    crack = np.clip((3.2 - edge) / 3.2, 0.0, 1.0)
    arr[:, :, :3] *= (1.0 - crack[:, :, None] * 0.58)
    arr[:, :, 3] = 255.0
    return painter_mottle(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.10, seed=seed + 3, warm_bias=(palette != "basalt"))


def build_material_swatch_tribal(size: int = 256, seed: int = 601) -> Image.Image:
    img = Image.new("RGBA", (size, size), (146, 86, 46, 255))
    d = ImageDraw.Draw(img, "RGBA")
    row_h = size // 4
    for r in range(4):
        y0 = r * row_h
        d.rectangle([0, y0, size, y0 + 6], fill=(82, 44, 24, 255))
        d.rectangle([0, y0 + 6, size, y0 + 10], fill=(236, 184, 108, 220))
        step = size // 8
        pts = [(i * step, y0 + (18 if i % 2 == 0 else row_h - 14)) for i in range(9)]
        d.line(pts, fill=(242, 198, 122, 240), width=7)
        d.line([(x, y + 8) for x, y in pts], fill=(78, 40, 22, 210), width=4)
    return painter_mottle(img, strength=0.09, seed=seed, warm_bias=True)


def build_material_swatch_wood(size: int = 256, seed: int = 602) -> Image.Image:
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    warp = fbm2d(size, size, seed=seed, octaves=((64, 0.65), (20, 0.35))) * 18.0
    rings = 0.5 + 0.5 * np.sin((xx * 0.22 + warp) * 1.4)
    arr = np.zeros((size, size, 4), dtype=np.float32)
    arr[:, :, 0] = 112 + rings * 58
    arr[:, :, 1] = 66 + rings * 38
    arr[:, :, 2] = 38 + rings * 22
    arr[:, :, 3] = 255.0
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    for px in (size // 3, (2 * size) // 3):
        d.line([(px, 0), (px, size)], fill=(54, 30, 18, 210), width=3)
    return painter_mottle(img, strength=0.07, seed=seed + 2, warm_bias=True)


def build_material_swatch_bio(size: int = 256, kind: str = "muscle", seed: int = 603) -> Image.Image:
    if kind == "bone":
        _, d1, _ = voronoi_edge_field(size, size, n_sites=52, seed=seed)
        pore = np.clip((d1 - 7.0) / 13.0, 0.0, 1.0)
        arr = np.zeros((size, size, 4), dtype=np.float32)
        arr[:, :, 0] = 132 + pore * 106
        arr[:, :, 1] = 112 + pore * 104
        arr[:, :, 2] = 90 + pore * 92
        arr[:, :, 3] = 255.0
        return painter_mottle(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.08, seed=seed + 1)

    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    warp = fbm2d(size, size, seed=seed, octaves=((52, 0.6), (18, 0.4))) * 14.0
    fibers = 0.5 + 0.5 * np.sin((xx * 0.45 + yy * 0.12 + warp) * 1.3)
    arr = np.zeros((size, size, 4), dtype=np.float32)
    arr[:, :, 0] = 152 + fibers * 76
    arr[:, :, 1] = 48 + fibers * 54
    arr[:, :, 2] = 44 + fibers * 42
    arr[:, :, 3] = 255.0
    return painter_mottle(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"), strength=0.075, seed=seed + 2)


def forge_full_pack(out_dir: Path, W: int = 1080, H: int = 1920, seed: int = 1024) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Forging Human Odyssey v2.0 Cinematic Procedural Plates ({W}x{H}, seed={seed}) -> {out_dir}")

    build_sky_savanna_golden(W, H, seed=seed + 1).save(out_dir / "sky_savanna_golden.png")
    build_sky_sunset(W, H, seed=seed + 2).save(out_dir / "sky_sunset.png")
    build_sky_night_aurora(W, H, seed=seed + 3, with_aurora=False).save(out_dir / "sky_night.png")
    build_sky_night_aurora(W, H, seed=seed + 4, with_aurora=True).save(out_dir / "sky_aurora.png")
    build_hero_valley_layers(out_dir, W=W, H=H, seed=seed + 10)
    build_topographic_ocean_plate(W, H, seed=seed + 20).save(out_dir / "topo_ocean.png")
    build_bio_backdrop_plate(W, H, seed=seed + 30).save(out_dir / "bio_backdrop.png")
    build_film_grain_overlay(W, H, seed=seed + 90).save(out_dir / "film_grain_overlay.png")

    build_material_swatch_rock(256, "sandstone", seed=seed + 41).save(out_dir / "mat_sandstone.png")
    build_material_swatch_rock(256, "granite", seed=seed + 42).save(out_dir / "mat_granite.png")
    build_material_swatch_rock(256, "basalt", seed=seed + 43).save(out_dir / "mat_basalt.png")
    build_material_swatch_tribal(256, seed=seed + 44).save(out_dir / "mat_tribal.png")
    build_material_swatch_wood(256, seed=seed + 45).save(out_dir / "mat_wood.png")
    build_material_swatch_bio(256, "muscle", seed=seed + 46).save(out_dir / "mat_muscle.png")
    build_material_swatch_bio(256, "bone", seed=seed + 47).save(out_dir / "mat_bone.png")

    print("HUMAN ODYSSEY v2.0 PROCEDURAL PACK COMPLETE (17 deterministic pure-code PNG plates)!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Forge Human Odyssey v2.0 pure-code procedural textures (default 9:16 TikTok 1080x1920).")
    parser.add_argument("--out", default="public/anthropology-showcase/textures", help="Output directory")
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1920)
    parser.add_argument("--seed", type=int, default=1024)
    args = parser.parse_args()
    forge_full_pack(Path(args.out), W=args.width, H=args.height, seed=args.seed)
