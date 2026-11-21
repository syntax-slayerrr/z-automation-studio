#!/usr/bin/env python3
"""Prepare multi-layer 2.5D hand-painted gouache assets for PoCShotV3 (zero baked flat plates)."""

from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "art" / "poc_v3"
OUT_DIR.mkdir(parents=True, exist_ok=True)

EP03_ART = ROOT / "public" / "art" / "ep03"
TEX_DIR = ROOT / "public" / "art" / "textures"
BRAIN_DIR = Path(
    r"C:\Users\nnnnn\.gemini\antigravity\brain\6a102de0-c5d8-4f8d-890d-eced4b25d061"
)
SCRATCH_DIR = BRAIN_DIR / "scratch"
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)


def extract_white_bg_rgba(
    im: Image.Image,
    white_thresh: int = 236,
    chroma_max: int = 26,
    trim_pad: int = 6,
    punch_interior_white: bool = True,
) -> Image.Image:
    """Cleanly flood-fill white background from borders + interior leaf gaps and decontaminate halo."""
    im = im.convert("RGBA")
    arr = np.array(im, dtype=np.float32)
    h, w, _ = arr.shape
    rgb = arr[:, :, :3]
    lum = rgb.mean(axis=2)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)

    is_seed = (lum >= white_thresh) & (chroma <= chroma_max)
    is_near = (lum >= white_thresh - 18) & (chroma <= chroma_max + 8)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_seed[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if is_seed[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if is_seed[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if is_seed[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if is_near[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    bg_mask = visited
    if punch_interior_white:
        bg_mask = bg_mask | ((lum >= 242) & (chroma <= 18))

    alpha = np.where(bg_mask, 0.0, 255.0).astype(np.float32)
    bright_edge = (~bg_mask) & (lum >= white_thresh - 32) & (chroma <= chroma_max + 18)
    ramp = np.clip((252.0 - lum) / 48.0, 0.0, 1.0) * 255.0
    alpha = np.where(bright_edge, np.minimum(alpha, ramp), alpha)

    alpha_img = Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8), mode="L")
    blurred = np.array(alpha_img.filter(ImageFilter.GaussianBlur(radius=0.6)), dtype=np.float32)
    edge_band = (alpha > 0) & (alpha < 252)
    alpha = np.where(bg_mask, 0.0, np.where(edge_band, blurred, alpha))

    a_norm = np.clip(alpha / 255.0, 0.0, 1.0)[:, :, None]
    decontam = np.where(
        (a_norm > 0.04) & (a_norm < 0.96),
        np.clip((rgb - (1.0 - a_norm) * 255.0) / np.maximum(a_norm, 0.24), 0.0, 255.0),
        rgb,
    )
    arr[:, :, :3] = np.clip(decontam, 0, 255)
    arr[:, :, 3] = np.clip(alpha, 0, 255)

    out = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    if trim_pad >= 0:
        bbox = out.getbbox()
        if bbox:
            out = out.crop(
                (
                    max(0, bbox[0] - trim_pad),
                    max(0, bbox[1] - trim_pad),
                    min(w, bbox[2] + trim_pad),
                    min(h, bbox[3] + trim_pad),
                )
            )
    return out


def prepare_mountain_ridge() -> None:
    """Alpha-key the white sky cleanly off poc_mountain_ridge_1794751423849.jpg."""
    src = BRAIN_DIR / "poc_mountain_ridge_1794751423849.jpg"
    im = Image.open(src).convert("RGB").resize((1440, 810), Image.Resampling.LANCZOS)
    cut = extract_white_bg_rgba(im, white_thresh=240, chroma_max=20, trim_pad=-1, punch_interior_white=False)
    arr = np.array(cut, dtype=np.float32)
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.05 + 8, 0, 255)
    arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.01 + 2, 0, 255)
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 0.90 - 2, 0, 255)
    Image.fromarray(arr.astype(np.uint8), mode="RGBA").save(OUT_DIR / "poc_mountain_ridge.png", optimize=True)
    print("[poc] poc_mountain_ridge.png saved")


def prepare_clouds() -> None:
    """Synthesize asymmetric hand-painted gouache cloud banks that tile horizontally cleanly."""
    rng = np.random.default_rng(19610718)

    def value_noise(w: int, h: int, grid_x: int, grid_y: int) -> np.ndarray:
        gx = rng.uniform(0.0, 1.0, (grid_y, grid_x)).astype(np.float32)
        gx[:, -1] = gx[:, 0]
        small = Image.fromarray((gx * 255).astype(np.uint8), mode="L")
        up = small.resize((w, h), Image.Resampling.BICUBIC)
        return np.array(up, dtype=np.float32) / 255.0

    def paint_cloud_strip(
        filename: str,
        w: int,
        h: int,
        puffs: list[tuple[float, float, float, float]],
        top_rgb: tuple[float, float, float],
        bot_rgb: tuple[float, float, float],
        max_alpha: float,
    ) -> None:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        density = np.zeros((h, w), dtype=np.float32)
        shade_map = np.zeros((h, w), dtype=np.float32)

        n1 = value_noise(w, h, 24, 9)
        n2 = value_noise(w, h, 56, 20)
        brush_tex = 0.60 * n1 + 0.40 * n2

        for cx_r, cy_r, rx_r, ry_r in puffs:
            cx, cy = cx_r * w, cy_r * h
            rx, ry = rx_r * w, ry_r * h
            dx = np.minimum(np.abs(xx - cx), w - np.abs(xx - cx)) / rx
            dy = (yy - cy) / ry
            # Flatter cloud bases: compress upward fade slightly, sharper bottom shelf
            dy_shaped = np.where(dy > 0, dy * 1.35, dy * 0.85)
            dist = np.sqrt(dx * dx + dy_shaped * dy_shaped)
            puff_field = 1.0 - (dist + (brush_tex - 0.5) * 0.36)
            puff_alpha = np.clip(puff_field * 2.2, 0.0, 1.0)
            local_shade = np.clip(0.56 - dy * 0.56 + (n1 - 0.5) * 0.20, 0.0, 1.0)
            density = np.maximum(density, puff_alpha)
            shade_map = np.where(puff_alpha > 0.1, np.maximum(shade_map, local_shade), shade_map)

        alpha = np.clip((density - 0.18) / 0.48, 0.0, 1.0)
        alpha = np.power(alpha, 0.88) * max_alpha * 255.0
        margin_v = np.clip(np.minimum(yy / 24.0, (h - 1 - yy) / 24.0), 0.0, 1.0)
        alpha *= margin_v

        t = np.clip(shade_map + (n2 - 0.5) * 0.14, 0.0, 1.0)
        r = bot_rgb[0] * (1.0 - t) + top_rgb[0] * t
        g = bot_rgb[1] * (1.0 - t) + top_rgb[1] * t
        b = bot_rgb[2] * (1.0 - t) + top_rgb[2] * t

        rgba = np.stack([r, g, b, alpha], axis=2)
        Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), mode="RGBA").save(
            OUT_DIR / filename, optimize=True
        )
        print(f"[poc] {filename} saved ({w}x{h})")

    far_puffs = [
        (0.08, 0.56, 0.16, 0.20), (0.19, 0.45, 0.12, 0.25), (0.31, 0.58, 0.13, 0.18),
        (0.52, 0.50, 0.18, 0.24), (0.64, 0.38, 0.11, 0.28), (0.74, 0.54, 0.14, 0.20),
        (0.92, 0.52, 0.11, 0.22),
    ]
    paint_cloud_strip(
        "poc_cloud_far.png",
        1600,
        360,
        far_puffs,
        top_rgb=(255, 240, 206),
        bot_rgb=(204, 170, 148),
        max_alpha=0.86,
    )

    near_puffs = [
        (0.06, 0.62, 0.11, 0.22), (0.14, 0.46, 0.09, 0.28), (0.23, 0.56, 0.12, 0.24),
        (0.30, 0.62, 0.08, 0.18), (0.48, 0.58, 0.14, 0.26), (0.58, 0.40, 0.10, 0.32),
        (0.68, 0.54, 0.12, 0.24), (0.83, 0.54, 0.13, 0.26), (0.94, 0.62, 0.09, 0.20),
    ]
    paint_cloud_strip(
        "poc_cloud_near.png",
        1600,
        420,
        near_puffs,
        top_rgb=(255, 247, 224),
        bot_rgb=(176, 152, 146),
        max_alpha=0.92,
    )


def prepare_foliage_and_props() -> None:
    """Slice botanical foliage sprays, terracotta pot, leather books, and desk."""
    sprays = Image.open(BRAIN_DIR / "s4_foliage_sprays_raw_1794711395463.jpg").convert("RGB")
    sw, sh = sprays.size
    q_tl = extract_white_bg_rgba(sprays.crop((0, 0, sw // 2, sh // 2)), white_thresh=232, chroma_max=28)
    q_tr = extract_white_bg_rgba(sprays.crop((sw // 2, 0, sw, sh // 2)), white_thresh=232, chroma_max=28)
    q_bl = extract_white_bg_rgba(sprays.crop((0, sh // 2, sw // 2, sh)), white_thresh=232, chroma_max=28)
    q_br = extract_white_bg_rgba(sprays.crop((sw // 2, sh // 2, sw, sh)), white_thresh=232, chroma_max=28)

    def warm_grade(im: Image.Image, mult_rgb=(1.05, 1.00, 0.86), brightness=0.94) -> Image.Image:
        arr = np.array(im, dtype=np.float32)
        for c in range(3):
            arr[:, :, c] = np.clip(arr[:, :, c] * mult_rgb[c] * brightness, 0, 255)
        return Image.fromarray(arr.astype(np.uint8), mode="RGBA")

    bamboo = Image.open(EP03_ART / "fg_bamboo_l.png").convert("RGBA").resize((520, 520), Image.Resampling.LANCZOS)
    warm_grade(bamboo, (1.06, 1.02, 0.88), 0.94).save(OUT_DIR / "poc_tree_bamboo.png", optimize=True)
    warm_grade(q_bl, (1.04, 0.99, 0.86), 0.90).save(OUT_DIR / "poc_tree_spray_a.png", optimize=True)
    warm_grade(q_br, (1.04, 0.99, 0.86), 0.88).save(OUT_DIR / "poc_tree_spray_b.png", optimize=True)

    warm_grade(q_tl, (0.72, 0.68, 0.56), 0.78).save(OUT_DIR / "poc_fg_foliage_l.png", optimize=True)
    warm_grade(q_tr, (0.72, 0.68, 0.56), 0.78).save(OUT_DIR / "poc_fg_foliage_r.png", optimize=True)

    props = Image.open(BRAIN_DIR / "foreground_props_spritesheet_1794714680347.jpg").convert("RGB")
    pw, ph = props.size
    pot_tl = extract_white_bg_rgba(props.crop((0, 0, pw // 2, ph // 2)), white_thresh=232, chroma_max=26)
    books_bl = extract_white_bg_rgba(props.crop((0, ph // 2, pw // 2, ph)), white_thresh=232, chroma_max=26)
    warm_grade(pot_tl, (1.04, 0.96, 0.84), 0.92).save(OUT_DIR / "poc_pot_plant.png", optimize=True)
    warm_grade(books_bl, (1.08, 0.97, 0.86), 0.94).save(OUT_DIR / "poc_book_stack.png", optimize=True)

    table = Image.open(EP03_ART / "fg_class_table.png").convert("RGBA")
    warm_grade(table, (1.02, 0.94, 0.84), 0.94).save(OUT_DIR / "poc_table_desk.png", optimize=True)
    print("[poc] foliage & props saved cleanly")


def prepare_curtain() -> None:
    """Paint a rich pleated gouache linen curtain with visible fabric folds, top gather ties, and warm backlit edge."""
    w, h = 280, 560
    weave = Image.open(TEX_DIR / "fabric_weave.png").convert("L").resize((w, h), Image.Resampling.BICUBIC)
    parch = Image.open(TEX_DIR / "parchment_tactile.png").convert("L").resize((w, h), Image.Resampling.BICUBIC)
    weave_arr = (np.array(weave, dtype=np.float32) - 128.0) / 128.0
    parch_arr = (np.array(parch, dtype=np.float32) - 128.0) / 128.0

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = xx / w
    ny = yy / h

    # Curtain gathered at top-left, billowing out nicely in the wind toward bottom-right
    right_edge = (0.78 - 0.14 * np.sin(ny * 2.5) + 0.08 * np.power(ny, 1.4)) * w
    left_edge = (0.04 + 0.025 * np.sin(ny * 3.1)) * w
    bot_edge = h - 24.0 - 11.0 * np.sin(nx * 15.0)

    inside = (xx >= left_edge) & (xx <= right_edge) & (yy >= 16.0) & (yy <= bot_edge)
    # Tighter top gather converging smoothly into soft natural drape folds
    fold_x = nx / np.maximum(0.45, (right_edge - left_edge) / w)
    fold_phase = fold_x * (6.2 * np.pi) + np.sin(ny * 2.2) * 0.45
    fold = 0.5 + 0.5 * np.sin(fold_phase)
    # Asymmetric deep crease accent on inner folds + warm brass top curtain header seam
    deep_crease = np.power(1.0 - fold, 2.2)
    rim_t = np.clip((xx - (right_edge - 46.0)) / 46.0, 0.0, 1.0)
    top_shadow = np.clip(1.0 - (yy - 16.0) / 36.0, 0.0, 1.0)

    lit = (
        0.74
        + 0.24 * fold
        - 0.20 * deep_crease
        + 0.18 * rim_t
        - 0.14 * top_shadow
        + weave_arr * 0.07
        + parch_arr * 0.04
    )
    r = np.clip(242 * lit + 18 * rim_t, 0, 255)
    g = np.clip(218 * lit + 8 * rim_t - 6 * deep_crease, 0, 255)
    b = np.clip(174 * lit - 14 * rim_t - 10 * deep_crease, 0, 255)

    edge_soft_r = np.clip((right_edge - xx) / 4.5, 0.0, 1.0)
    edge_soft_l = np.clip((xx - left_edge) / 4.0, 0.0, 1.0)
    edge_soft_b = np.clip((bot_edge - yy) / 5.5, 0.0, 1.0)
    mask = np.where(inside, edge_soft_r * edge_soft_l * edge_soft_b, 0.0)
    alpha = mask * (0.76 + 0.18 * deep_crease - 0.14 * rim_t) * 255.0

    img = Image.fromarray(np.stack([r, g, b, np.clip(alpha, 0, 255)], axis=2).astype(np.uint8), mode="RGBA")
    d = ImageDraw.Draw(img)
    # Dark teak top rod loops & subtle painter fold edge lines
    for rx_p in range(18, int(w * 0.72), 34):
        d.arc([rx_p - 7, 4, rx_p + 7, 22], start=170, end=370, fill=(66, 42, 24, 225), width=3)
    img.save(OUT_DIR / "poc_curtain.png", optimize=True)
    print("[poc] poc_curtain.png saved (rich gouache woven drape)")


def _solve_homography(src_pts, dst_pts):
    """Return 8-tuple coefficients mapping dst -> src for PIL Image.Transform.PERSPECTIVE."""
    matrix = []
    for (sx, sy), (dx, dy) in zip(src_pts, dst_pts):
        matrix.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        matrix.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    a = np.matrix(matrix, dtype=np.float64)
    b = np.array([c for pt in src_pts for c in pt], dtype=np.float64)
    res = np.linalg.solve(a, b)
    return tuple(res.flatten().tolist())


def _sample_tilted_strip(im: Image.Image, y0: float, y1: float, x0: int, x1: int, thickness: int, src_crop_box: tuple) -> Image.Image:
    """Create a perspective-tilted teak rail segment aligned with room wall slope."""
    w = x1 - x0
    src = im.crop(src_crop_box).rotate(90, expand=True).resize((w, thickness), Image.Resampling.LANCZOS)
    return src


def prepare_veranda_shell_and_woodwork() -> None:
    """Deconstruct s4_veranda_interior_bg into transparent multi-hole shell + hinged door leaf + shutter + clean lamp."""
    raw = Image.open(BRAIN_DIR / "s4_veranda_interior_bg_1794746140847.jpg").convert("RGB")
    im = raw.resize((1080, 1920), Image.Resampling.LANCZOS)

    smooth_im = im.filter(ImageFilter.ModeFilter(size=3))
    arr = np.array(im, dtype=np.float32) * 0.62 + np.array(smooth_im, dtype=np.float32) * 0.38
    base = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGB")

    # 1) Extract & rectify poc_door_leaf.png from painted door (x=556..693, y=693..1210)
    door_quad_src = [(556, 693), (693, 705), (693, 1210), (556, 1208)]
    door_w, door_h = 180, 540
    door_dst = [(0, 0), (door_w, 0), (door_w, door_h), (0, door_h)]
    coeffs = _solve_homography(door_quad_src, door_dst)
    door_rect = base.transform((door_w, door_h), Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)
    door_rgba = door_rect.convert("RGBA")
    ImageDraw.Draw(door_rgba).rectangle([0, 0, door_w - 1, door_h - 1], outline=(48, 28, 16, 235), width=2)
    door_rgba.save(OUT_DIR / "poc_door_leaf.png", optimize=True)
    print("[poc] poc_door_leaf.png saved")

    # 2) Craft matching Javanese louvered shutter (`poc_window_shutter.png`) WITHOUT the door's brass knob!
    # Clone left plain wood panel strip cleanly over the knob area (x=140..176, y=240..300) before sizing
    clean_wood = door_rect.copy()
    patch_stile = clean_wood.crop((14, 210, 46, 320))
    clean_wood.paste(patch_stile, (140, 220))
    sh_w, sh_h = 148, 300
    shutter = clean_wood.resize((sh_w, sh_h), Image.Resampling.LANCZOS).convert("RGBA")
    s_arr = np.array(shutter, dtype=np.float32)
    # Recessed horizontal louvered slats inside beveled frame
    for sy_bar in range(30, 266, 16):
        s_arr[sy_bar : sy_bar + 4, 22:126, :3] *= 0.54
        s_arr[sy_bar + 4 : sy_bar + 9, 22:126, :3] = np.clip(s_arr[sy_bar + 4 : sy_bar + 9, 22:126, :3] * 1.14 + 8, 0, 255)
    shutter = Image.fromarray(np.clip(s_arr, 0, 255).astype(np.uint8), mode="RGBA")
    ImageDraw.Draw(shutter).rectangle([0, 0, sh_w - 1, sh_h - 1], outline=(50, 28, 16, 235), width=2)
    shutter.save(OUT_DIR / "poc_window_shutter.png", optimize=True)
    print("[poc] poc_window_shutter.png saved (clean louver shutter, no knob)")

    # 3) Cleanly extract hanging kerosene lamp (`poc_hanging_lamp.png`) with exact shade polygon (zero ceiling wood triangles)
    lamp_crop = base.crop((610, 138, 782, 545)).convert("RGBA")
    l_arr = np.array(lamp_crop, dtype=np.float32)
    lr, lg, lb = l_arr[:, :, 0], l_arr[:, :, 1], l_arr[:, :, 2]
    ly, lx = np.mgrid[0 : l_arr.shape[0], 0 : l_arr.shape[1]]
    cx_l = 86.0
    in_chain = (ly < 166) & (np.abs(lx - 86) <= 4) & ((lr + lg + lb) < 420)

    # Bail loop wires (left & right thin arcs between chain hook and shade cap)
    bail_r = np.sqrt(((lx - cx_l) / 21.0) ** 2 + ((ly - 198.0) / 36.0) ** 2)
    in_bail = (ly >= 162) & (ly <= 228) & (np.abs(bail_r - 0.92) <= 0.16)
    in_hook = (ly >= 156) & (ly <= 182) & (np.abs(lx - cx_l) <= 10)
    in_cap = (ly >= 210) & (ly <= 240) & (np.abs(lx - cx_l) <= 18)

    # Flared saucer metal shade: arched upper dome from cap (86,232) down to brim (8..164, 268)
    dx_n = np.abs(lx - cx_l) / 78.0
    shade_top_y = 226.0 + 40.0 * np.power(np.clip(dx_n, 0.0, 1.0), 1.35)
    shade_bot_y = 282.0 - 12.0 * np.power(np.clip(dx_n, 0.0, 1.0), 2.0)
    in_shade = (dx_n <= 1.0) & (ly >= shade_top_y) & (ly <= shade_bot_y)

    # Glass globe & brass font below shade
    globe_w = np.where(ly < 328, 34.0, np.where(ly < 372, 38.0, 28.0))
    in_globe = (ly >= 268) & (ly <= 394) & (np.abs(lx - cx_l) <= globe_w)

    lamp_mask = in_chain | in_hook | in_bail | in_cap | in_shade | in_globe
    lamp_alpha = np.where(lamp_mask, 255.0, 0.0).astype(np.float32)
    lamp_alpha_img = Image.fromarray(lamp_alpha.astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(radius=0.7))
    l_arr[:, :, 3] = np.array(lamp_alpha_img, dtype=np.float32)
    Image.fromarray(np.clip(l_arr, 0, 255).astype(np.uint8), mode="RGBA").save(
        OUT_DIR / "poc_hanging_lamp.png", optimize=True
    )
    print("[poc] poc_hanging_lamp.png saved (exact brim + bail wires, zero ceiling clutter)")

    # Build clean wide exclusion mask directly in 1080x1920 coords so outer wing glow tips aren't clipped at crop edges
    work = base.copy()
    work_arr = np.array(work, dtype=np.float32)
    yy_full, xx_full = np.mgrid[0:1920, 0:1080].astype(np.float32)
    full_mask = Image.new("L", (1080, 1920), 0)
    full_mask.paste(Image.fromarray(np.where(lamp_mask, 255, 0).astype(np.uint8), mode="L"), (610, 138))
    fm_arr = np.array(full_mask, dtype=np.float32)
    wing_halo = (((xx_full - 696.0) / 108.0) ** 2 + ((yy_full - 392.0) / 62.0) ** 2 <= 1.0) | (
        (yy_full >= 380) & (yy_full <= 552) & (np.abs(xx_full - 696.0) <= 64.0)
    )
    fm_arr = np.where(wing_halo, 255.0, fm_arr)
    tight_blur = np.array(
        Image.fromarray(fm_arr.astype(np.uint8), mode="L")
        .filter(ImageFilter.MaxFilter(size=13))
        .filter(ImageFilter.GaussianBlur(radius=6.0)),
        dtype=np.float32,
    ) / 255.0

    for py in range(135, 560):
        for px in range(570, 825):
            m = tight_blur[py, px]
            if m > 0.02:
                samples = []
                for step in (95, 130, 165):
                    dx_r = int(round(step * 0.82))
                    dy_r = int(round(-step * 0.56))
                    for sgn in (-1, 1):
                        sx = px + sgn * dx_r
                        sy = py + sgn * dy_r
                        if 0 <= sx < 1080 and 160 <= sy < 570 and tight_blur[sy, sx] < 0.04:
                            samples.append((sx, sy))
                if samples:
                    est = np.mean([work_arr[sy, sx] for (sx, sy) in samples], axis=0)
                    work_arr[py, px] = work_arr[py, px] * (1.0 - m) + est * 0.94 * m

    work = Image.fromarray(np.clip(work_arr, 0, 255).astype(np.uint8), mode="RGB")

    # 4) Rebuild right wall cleanly: continuous gedek + perspective-aligned scenic double veranda window!
    gedek_patch = base.crop((710, 725, 862, 1200))
    work.paste(gedek_patch, (556, 722))
    threshold_fix = base.crop((705, 1170, 845, 1225))
    work.paste(threshold_fix, (558, 1170))

    # Crisp perspective window frame cleanly within x=574..868 (flush top corner, zero protruding wedges)
    post_tex = base.crop((932, 710, 962, 1030))
    rail_horiz = post_tex.rotate(90, expand=True).resize((294, 22), Image.Resampling.LANCZOS)
    top_warped = rail_horiz.convert("RGBA").transform(
        (294, 40),
        Image.Transform.PERSPECTIVE,
        _solve_homography([(0, 0), (294, 0), (294, 22), (0, 22)], [(0, 0), (294, 14), (294, 36), (0, 22)]),
        Image.Resampling.BICUBIC,
    )
    work.paste(top_warped.convert("RGB"), (574, 704), top_warped)
    work.paste(rail_horiz, (574, 1014))

    stile_strip = base.crop((934, 700, 956, 1036))
    work.paste(stile_strip.resize((22, 332), Image.Resampling.LANCZOS), (574, 704))
    work.paste(stile_strip.resize((22, 318), Image.Resampling.LANCZOS), (846, 718))
    mullion_strip = stile_strip.resize((18, 320), Image.Resampling.LANCZOS)
    work.paste(mullion_strip, (711, 712))

    # Add subtle 2px dark teak shadow bevel along inside perimeter of carved window frame for 3D depth
    wd = ImageDraw.Draw(work)
    wd.line([(595, 720), (846, 736)], fill=(38, 22, 12), width=3)
    wd.line([(595, 720), (595, 1014)], fill=(42, 24, 14), width=2)
    wd.line([(728, 728), (728, 1014)], fill=(42, 24, 14), width=2)
    wd.line([(595, 1014), (846, 1014)], fill=(78, 48, 26), width=2)

    # Add afternoon sunlit beam bounce on veranda wood floor + right edges
    w_arr = np.array(work, dtype=np.float32)
    yy, xx = np.mgrid[0:1920, 0:1080].astype(np.float32)
    beam_diag = np.exp(-((xx - (455.0 + (yy - 1210.0) * 0.25)) / 240.0) ** 2) * np.clip(
        (yy - 1145.0) / 150.0, 0.0, 1.0
    )
    w_arr[:, :, 0] += beam_diag * 28.0
    w_arr[:, :, 1] += beam_diag * 20.0
    w_arr[:, :, 2] += beam_diag * 6.0

    # 5) Punch ALL FOUR OPENINGS cleanly to alpha = 0!
    # Verify exact post coords: right foreground post spans x = 928..994 (NEVER touch it!)
    alpha = np.full((1920, 1080), 255.0, dtype=np.float32)

    # Hole 1: Doorway (x=312..556, top y=668..692, bot y=1214..1206)
    t_door = np.clip((xx - 312.0) / (556.0 - 312.0), 0.0, 1.0)
    in_door = (
        (xx >= 312.0)
        & (xx <= 556.0)
        & (yy >= 669.0 + t_door * 23.0)
        & (yy <= 1214.0 - t_door * 8.0)
    )

    # Hole 2 & 3: New wide scenic veranda double window bays matching tilted top rail
    t_win = np.clip((xx - 596.0) / (846.0 - 596.0), 0.0, 1.0)
    win_top_y = 720.0 + t_win * 16.0
    win_bot_y = 1014.0
    in_win_l = (xx >= 596.0) & (xx <= 711.0) & (yy >= win_top_y) & (yy <= win_bot_y)
    in_win_r = (xx >= 729.0) & (xx <= 846.0) & (yy >= win_top_y) & (yy <= win_bot_y)

    # Hole 4 & 5: Original right wall openings STRICTLY outside the wooden column (x=882..926 and x=1002..1080)
    in_right_a = (xx >= 882.0) & (xx <= 926.0) & (yy >= 770.0) & (yy <= 956.0)
    in_right_b = (xx >= 1002.0) & (xx <= 1080.0) & (yy >= 774.0) & (yy <= 952.0)

    all_holes = in_door | in_win_l | in_win_r | in_right_a | in_right_b
    alpha = np.where(all_holes, 0.0, alpha)

    alpha_img = Image.fromarray(alpha.astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(radius=0.8))
    alpha_f = np.array(alpha_img, dtype=np.float32)
    alpha_f = np.where(all_holes & (alpha_f < 60.0), 0.0, alpha_f)

    # Warm jamb bounce along edges near cut openings
    near_hole = (alpha_f > 0) & (alpha_f < 245)
    w_arr[:, :, 0] = np.where(near_hole, np.clip(w_arr[:, :, 0] * 1.05 + 10, 0, 255), w_arr[:, :, 0])
    w_arr[:, :, 1] = np.where(near_hole, np.clip(w_arr[:, :, 1] * 1.02 + 4, 0, 255), w_arr[:, :, 1])
    w_arr[:, :, 2] = np.where(near_hole, np.clip(w_arr[:, :, 2] * 0.85, 0, 255), w_arr[:, :, 2])

    shell_rgba = np.dstack([np.clip(w_arr, 0, 255), np.clip(alpha_f, 0, 255)]).astype(np.uint8)
    Image.fromarray(shell_rgba, mode="RGBA").save(OUT_DIR / "poc_room_shell.png", optimize=True)
    print("[poc] poc_room_shell.png saved (intact right pillar, aligned window, clean alpha holes)")


def verify_and_preview_layers() -> None:
    """Audit transparency on all PNGs and write updated check sheets."""
    required = [
        "poc_cloud_far.png",
        "poc_cloud_near.png",
        "poc_mountain_ridge.png",
        "poc_tree_bamboo.png",
        "poc_tree_spray_a.png",
        "poc_tree_spray_b.png",
        "poc_room_shell.png",
        "poc_door_leaf.png",
        "poc_window_shutter.png",
        "poc_hanging_lamp.png",
        "poc_curtain.png",
        "poc_table_desk.png",
        "poc_book_stack.png",
        "poc_pot_plant.png",
        "poc_fg_foliage_l.png",
        "poc_fg_foliage_r.png",
    ]
    for name in required:
        im = Image.open(OUT_DIR / name).convert("RGBA")
        a = np.array(im)[:, :, 3]
        pct_trans = float((a < 15).mean() * 100.0)
        print(f"  [audit] {name:24s} size={im.size} transparent={pct_trans:5.1f}%")

    shell = Image.open(OUT_DIR / "poc_room_shell.png").convert("RGBA")
    checker = Image.new("RGB", (1080, 1920), (40, 180, 240))
    d = ImageDraw.Draw(checker)
    for y in range(0, 1920, 40):
        for x in range(0, 1080, 40):
            if ((x // 40) + (y // 40)) % 2 == 0:
                d.rectangle([x, y, x + 39, y + 39], fill=(220, 245, 255))
    c_rgba = checker.convert("RGBA")
    c_rgba.alpha_composite(shell)
    c_rgba.convert("RGB").save(SCRATCH_DIR / "poc_shell_alpha_check.jpg", quality=88)

    sheet = Image.new("RGBA", (1400, 920), (42, 36, 32, 255))
    thumbs = [
        ("cloud_near", "poc_cloud_near.png"),
        ("mountain", "poc_mountain_ridge.png"),
        ("bamboo", "poc_tree_bamboo.png"),
        ("curtain", "poc_curtain.png"),
        ("door", "poc_door_leaf.png"),
        ("shutter", "poc_window_shutter.png"),
        ("lamp", "poc_hanging_lamp.png"),
        ("books", "poc_book_stack.png"),
        ("pot", "poc_pot_plant.png"),
        ("desk", "poc_table_desk.png"),
        ("fg_l", "poc_fg_foliage_l.png"),
        ("fg_r", "poc_fg_foliage_r.png"),
    ]
    sd = ImageDraw.Draw(sheet)
    for idx, (label, fname) in enumerate(thumbs):
        col, row = idx % 4, idx // 4
        x0, y0 = col * 350 + 15, row * 300 + 30
        im = Image.open(OUT_DIR / fname).convert("RGBA")
        im.thumbnail((320, 240), Image.Resampling.LANCZOS)
        sheet.alpha_composite(im, (x0, y0))
        sd.text((x0, y0 - 20), label, fill=(255, 220, 140, 255))
    sheet.convert("RGB").save(SCRATCH_DIR / "poc_cutouts_audit.jpg", quality=90)
    print("[audit] updated poc_shell_alpha_check.jpg and poc_cutouts_audit.jpg")


if __name__ == "__main__":
    prepare_mountain_ridge()
    prepare_clouds()
    prepare_foliage_and_props()
    prepare_curtain()
    prepare_veranda_shell_and_woodwork()
    verify_and_preview_layers()
