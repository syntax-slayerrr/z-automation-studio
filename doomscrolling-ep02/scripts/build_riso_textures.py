"""
Deterministic Procedural 2D Editorial Risograph & Halftone Zine Texture Forge
for VIDEO 2 — "JEBAKAN SCROLL TANPA AKHIR" (1080x1920 Full HD, ZERO Flicker!).

Bakes static, high-craft print-studio PNG textures into:
  `public/doomscrolling-ep02/textures/`

Assets forged:
  1. `riso_paper_cream.png`     (1080x1920 RGB) — Warm archival newsprint cream stock (#F4ECE0) with
                                 multi-scale cellulose fibers, subtle cotton flecks & press edge warmth.
  2. `riso_paper_night.png`     (1080x1920 RGB) — Deep ink midnight zine stock (#161624) with
                                 subtle mottled risograph ink tooth & soft screen-printed depth.
  3. `riso_grain_overlay.png`   (1080x1920 RGBA) — Neutral-midtone tactile print grain + tiny ink dust
                                 for static non-boiling overlay across all SVG scenes.
  4. `halftone_cyan_glow.png`   (1080x1920 RGBA) — Authentic 45-degree Ben-Day halftone dot screen in
                                 Fluorescent Cyan (#22D3EE) for late-night screen glow & portrait framing.
  5. `halftone_coral_alert.png` (1080x1920 RGBA) — Authentic 30-degree Ben-Day halftone dot screen in
                                 Fluorescent Coral (#F43F5E) for stakes, slot energy & Amygdala stress.
  6. `halftone_warm_dawn.png`   (1080x1920 RGBA) — Warm Sunburst Amber (#F59E0B) + Emerald (#10B981)
                                 duotone halftone wash for Act 3 recovery zine & morning finale.
  7. `paper_tear_edge.png`      (1080x220 RGBA)  — Hand-torn deckle paper strip with organic fibers
                                 for crisp physical Paper-Tear Swipe transitions!
"""
from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/doomscrolling-ep02/textures"

W, H = 1080, 1920


def fbm_noise(h: int, w: int, seed: int, octaves: list[tuple[int, float]]) -> np.ndarray:
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), dtype=np.float32)
    w_sum = 0.0
    for scale, weight in octaves:
        gh = max(4, h // scale)
        gw = max(4, w // scale)
        grid = rng.uniform(0.0, 1.0, (gh, gw)).astype(np.float32)
        im = Image.fromarray((grid * 255.0).astype(np.uint8), mode="L").resize(
            (w, h), resample=Image.Resampling.BICUBIC
        )
        acc += (np.asarray(im, dtype=np.float32) / 255.0) * weight
        w_sum += weight
    return acc / max(1e-6, w_sum)


def build_riso_paper_cream() -> None:
    # Base warm newsprint cream #F4ECE0 = (244, 236, 224)
    base_rgb = np.array([244.0, 236.0, 224.0], dtype=np.float32)
    mottle = fbm_noise(H, W, seed=101, octaves=[(180, 0.55), (60, 0.30), (16, 0.15)])
    fine = fbm_noise(H, W, seed=202, octaves=[(6, 0.65), (2, 0.35)])

    # Directional paper grain (subtle horizontal press fiber lines)
    rng = np.random.default_rng(303)
    row_var = rng.normal(0.0, 1.0, (H, 1)).astype(np.float32)
    row_blur = np.asarray(
        Image.fromarray(np.clip((row_var * 28 + 128), 0, 255).astype(np.uint8), mode="L")
        .resize((W, H), resample=Image.Resampling.BILINEAR)
        .filter(ImageFilter.GaussianBlur(radius=1.2)),
        dtype=np.float32,
    )
    row_tex = (row_blur - 128.0) / 128.0

    # Subtle warm ink-press vignette at edges
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx / W - 0.5) * 2.0
    ny = (yy / H - 0.5) * 2.0
    vig = np.clip((nx * nx * 0.55 + ny * ny * 0.45) ** 1.35, 0.0, 1.0)

    img = np.zeros((H, W, 3), dtype=np.float32)
    for c, ch_shift in enumerate([1.0, 0.94, 0.85]):
        delta = (mottle - 0.5) * 18.0 + (fine - 0.5) * 12.0 + row_tex * 4.5 - vig * 14.0 * ch_shift
        img[:, :, c] = base_rgb[c] + delta

    # Organic cellulose flecks (tiny muted sepia/oat fibers scattered sparsely)
    fleck_mask = rng.random((H, W))
    dark_flecks = fleck_mask < 0.0022
    warm_flecks = (fleck_mask >= 0.0022) & (fleck_mask < 0.0042)
    img[dark_flecks] -= np.array([26.0, 29.0, 32.0], dtype=np.float32)
    img[warm_flecks] -= np.array([8.0, 14.0, 22.0], dtype=np.float32)

    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), mode="RGB")
    out.save(OUT_DIR / "riso_paper_cream.png", optimize=True)
    print("  [1/7] Baked riso_paper_cream.png")


def build_riso_paper_night() -> None:
    # Base deep risograph midnight ink #161624 = (22, 22, 36) -> mottled indigo tooth
    base_rgb = np.array([23.0, 23.0, 38.0], dtype=np.float32)
    mottle = fbm_noise(H, W, seed=404, octaves=[(200, 0.55), (64, 0.30), (14, 0.15)])
    fine = fbm_noise(H, W, seed=505, octaves=[(5, 0.6), (2, 0.4)])

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx / W - 0.5) * 2.0
    ny = (yy / H - 0.45) * 2.0
    glow_center = np.exp(-(nx * nx * 1.4 + ny * ny * 1.1))

    img = np.zeros((H, W, 3), dtype=np.float32)
    img[:, :, 0] = base_rgb[0] + (mottle - 0.5) * 14.0 + (fine - 0.5) * 9.0 + glow_center * 6.0
    img[:, :, 1] = base_rgb[1] + (mottle - 0.5) * 15.0 + (fine - 0.5) * 9.0 + glow_center * 14.0
    img[:, :, 2] = base_rgb[2] + (mottle - 0.5) * 22.0 + (fine - 0.5) * 11.0 + glow_center * 24.0

    # Faint riso paper speckles
    rng = np.random.default_rng(606)
    speck = rng.random((H, W)) < 0.0025
    img[speck] += np.array([22.0, 24.0, 30.0], dtype=np.float32)

    out = Image.fromarray(np.clip(img, 10, 255).astype(np.uint8), mode="RGB")
    out.save(OUT_DIR / "riso_paper_night.png", optimize=True)
    print("  [2/7] Baked riso_paper_night.png")


def build_riso_grain_overlay() -> None:
    # Neutral mid-gray static riso tooth overlay (for CSS overlay/soft-light without boiling!)
    rng = np.random.default_rng(707)
    fine_grain = rng.normal(128.0, 26.0, (H, W)).astype(np.float32)
    cloud = fbm_noise(H, W, seed=808, octaves=[(90, 0.6), (24, 0.4)])
    val = np.clip(fine_grain * 0.72 + (cloud * 255.0) * 0.28, 0, 255).astype(np.uint8)
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 0] = val
    rgba[:, :, 1] = val
    rgba[:, :, 2] = np.clip(val.astype(np.int32) - 4, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = 92  # Gentle calibrated tactile print tooth
    Image.fromarray(rgba, mode="RGBA").save(OUT_DIR / "riso_grain_overlay.png", optimize=True)
    print("  [3/7] Baked riso_grain_overlay.png")


def build_halftone_screen(
    filename: str,
    rgb: tuple[int, int, int],
    angle_deg: float,
    cell_px: float,
    mode: str,
    seed: int,
) -> None:
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rad = np.deg2rad(angle_deg)
    ca, sa = np.cos(rad), np.sin(rad)

    rx = xx * ca + yy * sa
    ry = -xx * sa + yy * ca

    # Distance to nearest halftone dot center in rotated grid
    gx = (np.mod(rx, cell_px) / cell_px) - 0.5
    gy = (np.mod(ry, cell_px) / cell_px) - 0.5
    dist = np.sqrt(gx * gx + gy * gy)

    nx = xx / W
    ny = yy / H

    if mode == "cyan_bottom_glow":
        # Intense radial halftone radiating from bottom phone light & top edge corner
        d1 = np.sqrt(((nx - 0.5) * 1.15) ** 2 + ((ny - 0.88) * 1.35) ** 2)
        d2 = np.sqrt(((nx - 0.92) * 1.4) ** 2 + ((ny - 0.08) * 1.6) ** 2)
        density = np.clip(1.0 - d1 * 1.25, 0.0, 0.92) * 0.75 + np.clip(1.0 - d2 * 1.6, 0.0, 0.75) * 0.45
    elif mode == "coral_diagonal_alert":
        # Strong editorial top-right & bottom-left Risograph ink sweep
        d1 = np.sqrt(((nx - 0.86) * 1.2) ** 2 + ((ny - 0.14) * 1.35) ** 2)
        d2 = np.sqrt(((nx - 0.14) * 1.3) ** 2 + ((ny - 0.84) * 1.35) ** 2)
        density = np.clip(1.0 - d1 * 1.35, 0.0, 0.88) * 0.72 + np.clip(1.0 - d2 * 1.45, 0.0, 0.82) * 0.62
    else:
        # Warm morning top-left & diagonal sunburst wash
        d1 = np.sqrt(((nx - 0.18) * 1.1) ** 2 + ((ny - 0.12) * 1.2) ** 2)
        d2 = np.sqrt(((nx - 0.85) * 1.2) ** 2 + ((ny - 0.88) * 1.3) ** 2)
        density = np.clip(1.0 - d1 * 1.2, 0.0, 0.85) * 0.78 + np.clip(1.0 - d2 * 1.35, 0.0, 0.7) * 0.42

    # Slight organic ink variance so dots look hand-screenprinted
    mottle = fbm_noise(H, W, seed=seed, octaves=[(120, 0.7), (28, 0.3)])
    dot_radius = np.clip(density * (0.48 + (mottle - 0.5) * 0.08), 0.0, 0.48)

    # Anti-aliased halftone dot alpha
    edge_soft = 0.055
    alpha = np.clip((dot_radius - dist) / edge_soft + 0.5, 0.0, 1.0)
    alpha *= np.clip(density * 1.5, 0.0, 1.0)

    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 0] = rgb[0]
    rgba[:, :, 1] = rgb[1]
    rgba[:, :, 2] = rgb[2]
    rgba[:, :, 3] = np.clip(alpha * 205.0, 0, 255).astype(np.uint8)
    Image.fromarray(rgba, mode="RGBA").save(OUT_DIR / filename, optimize=True)


def build_paper_tear_edge() -> None:
    # 1080 x 220 horizontal hand-torn deckle paper strip (cream top, jagged torn bottom with fibrous edge)
    th = 220
    rng = np.random.default_rng(909)
    x = np.linspace(0, 1, W, dtype=np.float32)

    # Multi-frequency organic tear contour
    contour = (
        125.0
        + 18.0 * np.sin(x * 2 * np.pi * 2.3 + 0.4)
        + 11.0 * np.sin(x * 2 * np.pi * 6.7 + 1.9)
        + 6.5 * np.sin(x * 2 * np.pi * 17.5 + 0.8)
        + 3.5 * np.sin(x * 2 * np.pi * 43.0 + 2.2)
    )
    # Add fine jagged paper fiber teeth
    teeth = rng.normal(0.0, 3.2, W).astype(np.float32)
    teeth = np.convolve(teeth, np.ones(5, dtype=np.float32) / 5.0, mode="same")
    tear_y = contour + teeth

    yy, xx = np.mgrid[0:th, 0:W].astype(np.float32)
    dist_below = yy - tear_y[None, :]

    # Upper cream stock + thin exposed white-cream torn fiber rim (8-16px) + transparent below
    alpha = np.clip(1.0 - dist_below / 4.0, 0.0, 1.0)
    fiber_band = np.exp(-((dist_below + 5.0) / 6.5) ** 2)

    rgba = np.zeros((th, W, 4), dtype=np.float32)
    # Cream paper (#F4ECE0) transitioning to brighter fibrous deckle edge (#FCF8F1)
    rgba[:, :, 0] = 244.0 + fiber_band * 10.0
    rgba[:, :, 1] = 236.0 + fiber_band * 14.0
    rgba[:, :, 2] = 224.0 + fiber_band * 20.0
    rgba[:, :, 3] = alpha * 255.0

    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), mode="RGBA").save(
        OUT_DIR / "paper_tear_edge.png", optimize=True
    )
    print("  [7/7] Baked paper_tear_edge.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Forging 7 static Risograph & Halftone Zine textures -> {OUT_DIR}")
    build_riso_paper_cream()
    build_riso_paper_night()
    build_riso_grain_overlay()
    build_halftone_screen("halftone_cyan_glow.png", (34, 211, 238), 45.0, 15.0, "cyan_bottom_glow", 711)
    print("  [4/7] Baked halftone_cyan_glow.png")
    build_halftone_screen("halftone_coral_alert.png", (244, 63, 94), 30.0, 16.0, "coral_diagonal_alert", 722)
    print("  [5/7] Baked halftone_coral_alert.png")
    build_halftone_screen("halftone_warm_dawn.png", (245, 158, 11), 22.0, 18.0, "warm_dawn", 733)
    print("  [6/7] Baked halftone_warm_dawn.png")
    build_paper_tear_edge()
    print("=== ALL RISOGRAPH TEXTURES FORGED SUCCESSFULLY ===")


if __name__ == "__main__":
    main()
