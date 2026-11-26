"""
Shared Tactile Gouache & Paper-Cut Shadow-Box Texture Engine (`scripts/painterly_engine/painterly_fx.py`).

Promoted and generalized from `earth-24h/src/painterly_fx.py` so ANY documentary topic in:
  1. Anthropology & Human History
  2. Evolution & Natural History
  3. Biology & Human Science
  4. Environment & Deep-Time Ecology
can synthesize authentic hand-painted gouache mottling (`fbm_noise_2d` + `apply_gouache_mottle`),
multi-tier paper-cut shadow-box depth with physical cast shadows, normal-computed directional rim-lighting,
volumetric Screen-blended light/caustic shafts, and smooth Catmull-Rom Bezier contours.

Dependencies (verified installed): `numpy`, `scipy`, `PIL (Pillow)`.
"""
from __future__ import annotations

import math
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter1d, zoom


# =============================================================================
# 1. CORE FBM GOUACHE TEXTURE & OPTICAL BLENDING PRIMITIVES (FROM EARTH-24H)
# =============================================================================

def fbm_noise_2d(
    H: int,
    W: int,
    seed: int = 42,
    octaves: Sequence[tuple[int, float]] = ((64, 0.52), (24, 0.30), (9, 0.18)),
) -> np.ndarray:
    """
    Generates smooth multi-octave Perlin-like Fractal Brownian Motion (FBM) noise in [-1.0, 1.0].
    Used to synthesize hand-painted gouache paper mottling and pigment variations without static cutouts.
    """
    rng = np.random.default_rng(seed)
    acc = np.zeros((H, W), dtype=np.float32)
    weight_sum = 0.0
    for cell_px, w in octaves:
        gh = max(3, int(math.ceil(H / float(cell_px))) + 2)
        gw = max(3, int(math.ceil(W / float(cell_px))) + 2)
        grid = rng.uniform(-1.0, 1.0, (gh, gw)).astype(np.float32)
        zy = H / float(gh)
        zx = W / float(gw)
        up = zoom(grid, (zy, zx), order=3)
        up = up[:H, :W]
        if up.shape[0] < H or up.shape[1] < W:
            pad = np.zeros((H, W), dtype=np.float32)
            pad[: up.shape[0], : up.shape[1]] = up
            up = pad
        acc += up * float(w)
        weight_sum += float(w)
    if weight_sum > 0:
        acc /= weight_sum
    mx = max(1e-4, float(np.percentile(np.abs(acc), 99)))
    return np.clip(acc / mx, -1.0, 1.0)


def blend_screen(base_pil: Image.Image, glow_pil: Image.Image) -> Image.Image:
    """
    True Photoshop/After-Effects Screen blend mode in RGB while keeping base alpha untouched:
      out = 1 - (1 - base) * (1 - glow * glow_alpha)
    """
    b = np.array(base_pil.convert("RGBA"), dtype=np.float32) / 255.0
    g = np.array(glow_pil.convert("RGBA"), dtype=np.float32) / 255.0
    ga = g[:, :, 3:4]
    g_rgb = g[:, :, :3] * ga
    out_rgb = 1.0 - (1.0 - b[:, :, :3]) * (1.0 - g_rgb)
    out = np.concatenate([np.clip(out_rgb, 0.0, 1.0), b[:, :, 3:4]], axis=2)
    return Image.fromarray((out * 255.0).round().astype(np.uint8), mode="RGBA")


def apply_gouache_mottle(
    img_pil: Image.Image,
    strength: float = 0.09,
    seed: int = 101,
    warm_bias: bool = True,
    octaves: Sequence[tuple[int, float]] = ((52, 0.55), (18, 0.30), (6, 0.15)),
) -> Image.Image:
    """
    Modulates RGB luminance and subtle pigment warmth using FBM noise so surfaces
    look hand-painted on archival tooth paper instead of mathematically flat vectors.
    """
    arr = np.array(img_pil.convert("RGBA"), dtype=np.float32)
    H, W = arr.shape[:2]
    n = fbm_noise_2d(H, W, seed=seed, octaves=octaves)
    factor = 1.0 + n[:, :, None] * float(strength)
    arr[:, :, :3] *= factor
    if warm_bias:
        arr[:, :, 0] += n * (strength * 14.0)
        arr[:, :, 2] -= n * (strength * 10.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


def apply_directional_lighting(
    img_pil: Image.Image,
    light_dir: tuple[float, float] = (-0.707, -0.707),
    strength: float = 0.15,
    warm_shift: bool = True,
) -> Image.Image:
    """
    Applies smooth directional key-light gradient across an RGBA plate.
    """
    arr = np.array(img_pil.convert("RGBA"), dtype=np.float32)
    H, W = arr.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx / max(1.0, W - 1.0)) * 2.0 - 1.0
    ny = (yy / max(1.0, H - 1.0)) * 2.0 - 1.0
    proj = nx * float(light_dir[0]) + ny * float(light_dir[1])
    factor = 1.0 + np.clip(proj, -1.2, 1.2) * float(strength)
    arr[:, :, :3] *= factor[:, :, None]
    if warm_shift:
        arr[:, :, 0] += np.clip(proj, 0.0, 1.2) * (strength * 24.0)
        arr[:, :, 1] += np.clip(proj, 0.0, 1.2) * (strength * 14.0)
        arr[:, :, 2] -= np.clip(proj, 0.0, 1.2) * (strength * 8.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


def make_edge_light_wrap(
    fg_pil: Image.Image,
    color: tuple[int, int, int] = (252, 192, 120),
    radius: float = 5.5,
    strength: float = 0.72,
) -> Image.Image:
    """
    Computes an optical backlight edge-wrap strictly inside fg_pil's alpha boundary.
    """
    fg_arr = np.array(fg_pil.convert("RGBA"), dtype=np.float32)
    alpha = fg_arr[:, :, 3]
    inv_alpha = Image.fromarray((255.0 - alpha).astype(np.uint8), mode="L")
    inv_blur = np.array(inv_alpha.filter(ImageFilter.GaussianBlur(radius=radius)), dtype=np.float32) / 255.0
    wrap_mask = (alpha / 255.0) * np.clip(inv_blur * 2.1, 0.0, 1.0) * float(strength)
    out = np.zeros_like(fg_arr, dtype=np.uint8)
    out[:, :, 0] = int(color[0])
    out[:, :, 1] = int(color[1])
    out[:, :, 2] = int(color[2])
    out[:, :, 3] = np.clip(wrap_mask * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode="RGBA")


def smooth_closed_curve(
    pts: Sequence[tuple[float, float]],
    n_out: int = 240,
    sigma: float = 2.2,
) -> list[tuple[float, float]]:
    """
    Resamples a closed polygon uniformly along arc length and smooths X/Y with periodic Gaussian filtering.
    """
    arr = np.asarray(pts, dtype=np.float64)
    if len(arr) < 4:
        return [(float(p[0]), float(p[1])) for p in arr]
    if np.linalg.norm(arr[0] - arr[-1]) > 1e-3:
        arr = np.vstack([arr, arr[0]])
    diffs = np.diff(arr, axis=0)
    seg_lens = np.sqrt((diffs ** 2).sum(axis=1))
    cum = np.concatenate([[0.0], np.cumsum(seg_lens)])
    total_len = cum[-1]
    if total_len < 1e-3:
        return [(float(p[0]), float(p[1])) for p in arr]
    s_uni = np.linspace(0.0, total_len, n_out, endpoint=False)
    xs = np.interp(s_uni, cum, arr[:, 0])
    ys = np.interp(s_uni, cum, arr[:, 1])
    if sigma > 0.1:
        xs = gaussian_filter1d(xs, sigma=sigma, mode="wrap")
        ys = gaussian_filter1d(ys, sigma=sigma, mode="wrap")
    return list(zip(xs.tolist(), ys.tolist()))


def points_to_smooth_svg_path(pts: Sequence[tuple[float, float]], closed: bool = True) -> str:
    """
    Converts ordered smooth points into a compact cubic Catmull-Rom -> SVG Bezier path string.
    """
    p = list(pts)
    n = len(p)
    if n < 3:
        return ""
    step = max(1, n // 48)
    sub = p[::step]
    m = len(sub)
    if m < 3:
        return ""
    parts = [f"M {sub[0][0]:.1f} {sub[0][1]:.1f}"]
    for i in range(m):
        p0 = sub[(i - 1) % m]
        p1 = sub[i]
        p2 = sub[(i + 1) % m]
        p3 = sub[(i + 2) % m]
        if not closed and i == m - 1:
            break
        c1x = p1[0] + (p2[0] - p0[0]) / 6.0
        c1y = p1[1] + (p2[1] - p0[1]) / 6.0
        c2x = p2[0] - (p3[0] - p1[0]) / 6.0
        c2y = p2[1] - (p3[1] - p1[1]) / 6.0
        parts.append(f"C {c1x:.1f} {c1y:.1f}, {c2x:.1f} {c2y:.1f}, {p2[0]:.1f} {p2[1]:.1f}")
    if closed:
        parts.append("Z")
    return " ".join(parts)


def render_rim_lit_silhouette(
    W: int,
    H: int,
    pts_smooth: Sequence[tuple[float, float]],
    fill_rgba: tuple[int, int, int, int],
    rim_rgba: tuple[int, int, int, int],
    rim_width: float = 2.5,
    ss: int = 2,
    mottle_seed: int = 77,
    light_dir: tuple[float, float] = (-0.35, -0.85),
) -> Image.Image:
    """
    Renders a smooth organic form filled with tactile painted gouache texture AND directional
    rim-light computed from curve normals (never a uniform cartoon wire outline!).
    """
    Ws, Hs = W * ss, H * ss
    layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    scaled_pts = [(x * ss, y * ss) for (x, y) in pts_smooth]
    draw.polygon(scaled_pts, fill=fill_rgba)

    layer = apply_gouache_mottle(
        layer,
        strength=0.095,
        seed=mottle_seed,
        warm_bias=False,
        octaves=((36 * ss, 0.6), (14 * ss, 0.4)),
    )

    rim_layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rim_layer, "RGBA")
    n = len(scaled_pts)
    area2 = sum(
        scaled_pts[i][0] * scaled_pts[(i + 1) % n][1] - scaled_pts[(i + 1) % n][0] * scaled_pts[i][1]
        for i in range(n)
    )
    orient = 1.0 if area2 >= 0 else -1.0
    ldx, ldy = float(light_dir[0]), float(light_dir[1])

    for i in range(n):
        x0, y0 = scaled_pts[i]
        x1, y1 = scaled_pts[(i + 1) % n]
        dx, dy = x1 - x0, y1 - y0
        seg_l = math.hypot(dx, dy)
        if seg_l < 1e-4:
            continue
        nx = orient * (dy / seg_l)
        ny = orient * (-dx / seg_l)
        lit = nx * ldx + ny * ldy
        if lit > 0.12 and y0 < (Hs * 0.92):
            alpha_f = min(1.0, (lit - 0.12) / 0.75)
            ra = int(round(rim_rgba[3] * alpha_f))
            if ra > 6:
                rdraw.line(
                    [x0, y0, x1, y1],
                    fill=(rim_rgba[0], rim_rgba[1], rim_rgba[2], ra),
                    width=max(2, int(round(rim_width * ss))),
                )

    rim_soft = rim_layer.filter(ImageFilter.GaussianBlur(radius=0.8 * ss))
    layer = Image.alpha_composite(layer, rim_soft)
    return layer.resize((W, H), Image.Resampling.LANCZOS)


# =============================================================================
# 2. HIGH-LEVEL DOMAIN PAINTERLY BACKDROP & SHADOW-BOX GENERATORS
# =============================================================================

def build_gouache_atmosphere_backdrop(
    W: int,
    H: int,
    top_rgb: tuple[int, int, int],
    mid_rgb: tuple[int, int, int],
    bot_rgb: tuple[int, int, int],
    glow_center: tuple[float, float] = (0.5, 0.45),
    glow_rgb: tuple[int, int, int] = (248, 198, 118),
    glow_alpha: float = 0.34,
    light_shafts: Sequence[tuple[float, float, float, float]] | None = None,
    shaft_rgb: tuple[int, int, int] = (228, 250, 244),
    mottle_strength: float = 0.105,
    seed: int = 501,
) -> Image.Image:
    """
    Builds a rich, tactile hand-painted gouache backdrop plate (like `earth-24h` f_480 & f_270):
      - Smooth 3-stop vertical + radial atmospheric gradient
      - Multi-octave FBM gouache paper mottling
      - Optional volumetric Screen-blended light/caustic shafts (dual soft + core blur passes)
    """
    ss = 2
    Ws, Hs = W * ss, H * ss
    yy, xx = np.mgrid[0:Hs, 0:Ws].astype(np.float32)
    uy = yy / max(1.0, float(Hs - 1))

    # 3-stop vertical interpolation
    t1 = np.clip(uy / 0.54, 0.0, 1.0)
    t2 = np.clip((uy - 0.54) / 0.46, 0.0, 1.0)
    arr = np.zeros((Hs, Ws, 4), dtype=np.float32)
    for c in range(3):
        upper = top_rgb[c] * (1.0 - t1) + mid_rgb[c] * t1
        lower = mid_rgb[c] * (1.0 - t2) + bot_rgb[c] * t2
        arr[:, :, c] = np.where(uy <= 0.54, upper, lower)
    arr[:, :, 3] = 255.0

    base = apply_gouache_mottle(
        Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA"),
        strength=mottle_strength,
        seed=seed,
        warm_bias=True,
    )

    # Radial key-light glow pool
    if glow_alpha > 0.01:
        gx, gy = glow_center[0] * Ws, glow_center[1] * Hs
        rad = max(Ws, Hs) * 0.56
        dist = np.clip(np.sqrt((xx - gx) ** 2 + (yy - gy) ** 2) / rad, 0.0, 1.0)
        falloff = ((1.0 - dist) ** 1.85) * float(glow_alpha)
        g_arr = np.zeros((Hs, Ws, 4), dtype=np.uint8)
        g_arr[:, :, 0] = glow_rgb[0]
        g_arr[:, :, 1] = glow_rgb[1]
        g_arr[:, :, 2] = glow_rgb[2]
        g_arr[:, :, 3] = np.clip(falloff * 255.0, 0, 255).astype(np.uint8)
        base = blend_screen(base, Image.fromarray(g_arr, mode="RGBA"))

    # Optional volumetric light shafts (like OceanScene f_480.png!)
    if light_shafts:
        beams_soft = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
        beams_core = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
        bsdraw = ImageDraw.Draw(beams_soft, "RGBA")
        bcdraw = ImageDraw.Draw(beams_core, "RGBA")
        for tx, tw, bx, by in light_shafts:
            bsdraw.polygon(
                [
                    ((tx - tw * 1.45) * ss, 70 * ss),
                    ((tx + tw * 1.45) * ss, 70 * ss),
                    ((bx + tw * 0.45) * ss, by * ss),
                    ((bx - tw * 0.45) * ss, by * ss),
                ],
                fill=(shaft_rgb[0], shaft_rgb[1], shaft_rgb[2], 95),
            )
            bcdraw.polygon(
                [
                    ((tx - tw * 0.5) * ss, 75 * ss),
                    ((tx + tw * 0.5) * ss, 75 * ss),
                    ((bx + tw * 0.14) * ss, by * ss),
                    ((bx - tw * 0.14) * ss, by * ss),
                ],
                fill=(min(255, shaft_rgb[0] + 20), min(255, shaft_rgb[1] + 15), min(255, shaft_rgb[2] + 15), 125),
            )
        base = blend_screen(base, beams_soft.filter(ImageFilter.GaussianBlur(radius=16 * ss)))
        base = blend_screen(base, beams_core.filter(ImageFilter.GaussianBlur(radius=3 * ss)))

    return base.resize((W, H), Image.Resampling.LANCZOS)


def build_shadowbox_lobe_tier(
    W: int,
    H: int,
    lobes: Sequence[tuple[float, float, float]],
    fill_rgba: tuple[int, int, int, int],
    rim_rgba: tuple[int, int, int, int],
    shadow_rgba: tuple[int, int, int, int] = (10, 6, 18, 155),
    anchor: str = "bottom",
    base_y: float = 980.0,
    shadow_offset_y: float = -12.0,
    seed: int = 602,
) -> Image.Image:
    """
    Generates a tactile `earth-24h` style paper-cut shadow-box tier (clouds, seabed mounds,
    foliage canopy, or geological strata) with:
      1. Soft blurred cast shadow onto the plane behind it
      2. Warm/cool bounced rim-light along the crest
      3. Hand-painted FBM gouache mottle across the body
    """
    ss = 2
    Ws, Hs = W * ss, H * ss
    sh_layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    rim_layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    body_layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))

    sh_d = ImageDraw.Draw(sh_layer, "RGBA")
    rim_d = ImageDraw.Draw(rim_layer, "RGBA")
    bd_d = ImageDraw.Draw(body_layer, "RGBA")

    if anchor == "top":
        bd_d.rectangle([0, 0, Ws, int(base_y * ss)], fill=fill_rgba)
    else:
        bd_d.rectangle([0, int(base_y * ss), Ws, Hs], fill=fill_rgba)

    rim_dy = 5.0 if anchor == "top" else -6.0
    for lx, ly, lr in lobes:
        sh_d.ellipse(
            [(lx - lr - 4) * ss, (ly - lr + shadow_offset_y) * ss, (lx + lr + 4) * ss, (ly + lr + shadow_offset_y) * ss],
            fill=shadow_rgba,
        )
        rim_d.ellipse(
            [(lx - lr - 3) * ss, (ly - lr + rim_dy) * ss, (lx + lr + 3) * ss, (ly + lr + rim_dy * 0.4) * ss],
            fill=rim_rgba,
        )
        bd_d.ellipse(
            [(lx - lr) * ss, (ly - lr) * ss, (lx + lr) * ss, (ly + lr) * ss],
            fill=fill_rgba,
        )

    body_mottled = apply_gouache_mottle(body_layer, strength=0.09, seed=seed, warm_bias=True)
    comp = Image.alpha_composite(
        sh_layer.filter(ImageFilter.GaussianBlur(radius=11 * ss)),
        Image.alpha_composite(rim_layer.filter(ImageFilter.GaussianBlur(radius=4 * ss)), body_mottled),
    )
    return comp.resize((W, H), Image.Resampling.LANCZOS)


def save_png(img: Image.Image, out_path: str | Path) -> Path:
    p = Path(out_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(p))
    return p
