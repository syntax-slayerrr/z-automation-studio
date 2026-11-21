import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter1d, zoom


def fbm_noise_2d(H, W, seed=42, octaves=((64, 0.52), (24, 0.30), (9, 0.18))):
    """
    Generates smooth multi-octave Perlin-like Fractal Brownian Motion (FBM) noise in [-1.0, 1.0].
    Used to synthesize hand-painted gouache paper mottling and brush variations without static cutouts.
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
        # Ensure exact shape match after zoom rounding
        up = up[:H, :W]
        if up.shape[0] < H or up.shape[1] < W:
            pad = np.zeros((H, W), dtype=np.float32)
            pad[: up.shape[0], : up.shape[1]] = up
            up = pad
        acc += up * float(w)
        weight_sum += float(w)
    if weight_sum > 0:
        acc /= weight_sum
    # Normalize softly into [-1, 1]
    mx = max(1e-4, float(np.percentile(np.abs(acc), 99)))
    return np.clip(acc / mx, -1.0, 1.0)


def blend_screen(base_pil, glow_pil):
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


def apply_gouache_mottle(img_pil, strength=0.08, seed=101, warm_bias=True, octaves=((52, 0.55), (18, 0.30), (6, 0.15))):
    """
    Modulates RGB luminance and subtle pigment warmth using FBM noise so surfaces
    look hand-painted on archival tooth paper instead of mathematically flat vectors.
    """
    arr = np.array(img_pil.convert("RGBA"), dtype=np.float32)
    H, W = arr.shape[:2]
    n = fbm_noise_2d(H, W, seed=seed, octaves=octaves)
    # Apply only where alpha > 0
    factor = 1.0 + n[:, :, None] * float(strength)
    arr[:, :, :3] *= factor
    if warm_bias:
        arr[:, :, 0] += n * (strength * 14.0)
        arr[:, :, 2] -= n * (strength * 10.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


def smooth_closed_curve(pts, n_out=260, sigma=3.5):
    """
    Resamples a closed polygon uniformly along arc length and smooths X/Y with periodic Gaussian filtering,
    eliminating OpenCV jagged pixel staircases while preserving overall anatomical contours cleanly.
    """
    arr = np.asarray(pts, dtype=np.float64)
    if len(arr) < 4:
        return arr.tolist()
    # Close loop if open
    if np.linalg.norm(arr[0] - arr[-1]) > 1e-3:
        arr = np.vstack([arr, arr[0]])
    diffs = np.diff(arr, axis=0)
    seg_lens = np.sqrt((diffs ** 2).sum(axis=1))
    cum = np.concatenate([[0.0], np.cumsum(seg_lens)])
    total_len = cum[-1]
    if total_len < 1e-3:
        return arr.tolist()
    s_uni = np.linspace(0.0, total_len, n_out, endpoint=False)
    xs = np.interp(s_uni, cum, arr[:, 0])
    ys = np.interp(s_uni, cum, arr[:, 1])
    if sigma > 0.1:
        xs = gaussian_filter1d(xs, sigma=sigma, mode="wrap")
        ys = gaussian_filter1d(ys, sigma=sigma, mode="wrap")
    return list(zip(xs.tolist(), ys.tolist()))


def points_to_smooth_svg_path(pts, closed=True):
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


def render_rim_lit_silhouette(W, H, pts_smooth, fill_rgba, rim_rgba, rim_width=2.5, ss=3, mottle_seed=77):
    """
    Renders a smooth silhouette filled with subtle painted gouache texture AND directional top-facing
    rim light computed from tangent normals (no wire outlines around belly or lower legs).
    """
    Ws, Hs = W * ss, H * ss
    layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    scaled_pts = [(x * ss, y * ss) for (x, y) in pts_smooth]
    draw.polygon(scaled_pts, fill=fill_rgba)

    # Subtle painterly interior shading via FBM modulation before rim highlight
    layer = apply_gouache_mottle(layer, strength=0.09, seed=mottle_seed, warm_bias=False, octaves=((36 * ss, 0.6), (14 * ss, 0.4)))

    # Directional rim highlight strictly along upper-facing normals (outward ny < -0.15)
    rim_layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rim_layer, "RGBA")
    n = len(scaled_pts)
    # Compute signed area to orient outward normal consistently
    area2 = 0.0
    for i in range(n):
        x0, y0 = scaled_pts[i]
        x1, y1 = scaled_pts[(i + 1) % n]
        area2 += x0 * y1 - x1 * y0
    orient = 1.0 if area2 >= 0 else -1.0  # In Y-down coords: CCW(math)>0 has normal right-hand rotated

    for i in range(n):
        x0, y0 = scaled_pts[i]
        x1, y1 = scaled_pts[(i + 1) % n]
        dx, dy = x1 - x0, y1 - y0
        seg_l = math.hypot(dx, dy)
        if seg_l < 1e-4:
            continue
        # Outward normal depends on winding sign in Y-down screen coordinates
        nx = orient * (dy / seg_l)
        ny = orient * (-dx / seg_l)
        # Rim hits top & upper-left edges cleanly (ny negative => pointing up in screen coords)
        lit = (-ny) * 0.85 + (-nx) * 0.25
        if lit > 0.12 and y0 < (Hs * 0.88):
            alpha_f = min(1.0, (lit - 0.12) / 0.75)
            ra = int(round(rim_rgba[3] * alpha_f))
            if ra > 6:
                rdraw.line([x0, y0, x1, y1], fill=(rim_rgba[0], rim_rgba[1], rim_rgba[2], ra), width=max(2, int(round(rim_width * ss))))

    # Clip rim strictly inside/on silhouette border with gentle softness
    rim_soft = rim_layer.filter(ImageFilter.GaussianBlur(radius=0.8 * ss))
    layer = Image.alpha_composite(layer, rim_soft)
    return layer.resize((W, H), Image.Resampling.LANCZOS)


def midpoint_fractal_line(p0, p1, rng, displacement=14.0, depth=3):
    """Subdivides a segment recursively with organic displacement for natural magma/lightning fissures."""
    pts = [p0, p1]
    disp = displacement
    for _ in range(depth):
        new_pts = [pts[0]]
        for a, b in zip(pts[:-1], pts[1:]):
            mx = 0.5 * (a[0] + b[0])
            my = 0.5 * (a[1] + b[1])
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            if L > 1e-3:
                nx, ny = -dy / L, dx / L
                off = float(rng.uniform(-disp, disp))
                mx += nx * off
                my += ny * off
            new_pts.append((mx, my))
            new_pts.append(b)
        pts = new_pts
        disp *= 0.52
    return pts


def draw_airbrushed_fissure_pass(W, H, cx, cy, r_sphere, hotspots, seed=77, pulse=1.0):
    """
    Renders organic painted magma glow (multi-stage Screen-blended fractal fissures + molten pools)
    strictly clipped inside `r_sphere`. Returns an RGBA layer at (W, H) ready for Screen + Alpha compositing.
    """
    ss = 2
    Ws, Hs = W * ss, H * ss
    scx, scy = cx * ss, cy * ss

    wide_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mid_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    core_layer = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))

    wdraw = ImageDraw.Draw(wide_glow, "RGBA")
    mdraw = ImageDraw.Draw(mid_glow, "RGBA")
    cdraw = ImageDraw.Draw(core_layer, "RGBA")

    rng = np.random.default_rng(seed)
    paths = []
    for _ in range(38):
        a0 = float(rng.uniform(0, 2 * math.pi))
        r0 = float(rng.uniform(10, 118)) * pulse
        p0 = (cx + r0 * math.cos(a0), cy + r0 * math.sin(a0))
        a1 = a0 + float(rng.uniform(-0.95, 0.95))
        r1 = min(204.0, r0 + float(rng.uniform(52, 128))) * pulse
        p1 = (cx + r1 * math.cos(a1), cy + r1 * math.sin(a1))
        w = float(rng.uniform(1.8, 4.6))
        seg = midpoint_fractal_line(p0, p1, rng, displacement=12.0, depth=3)
        paths.append((seg, w))
        # Secondary fork from middle
        if rng.random() < 0.72:
            pm = seg[len(seg) // 2]
            a2 = a1 + float(rng.uniform(-1.05, 1.05))
            r2 = min(206.0, math.hypot(pm[0] - cx, pm[1] - cy) + float(rng.uniform(28, 72))) * pulse
            p2 = (cx + r2 * math.cos(a2), cy + r2 * math.sin(a2))
            paths.append((midpoint_fractal_line(pm, p2, rng, displacement=8.0, depth=2), max(1.3, w * 0.7)))

    for seg, w in paths:
        wdraw.line(seg, fill=(238, 136, 48, 130), width=max(4, int(round(w * 2.8))))
        mdraw.line(seg, fill=(248, 186, 86, 175), width=max(2, int(round(w * 1.4))))
        cdraw.line([(p[0] * ss, p[1] * ss) for p in seg], fill=(254, 232, 168, 225), width=max(2, int(round(w * 0.85 * ss))))

    for hx, hy, hr in hotspots:
        px = cx + (hx - 360.0) * pulse
        py = cy + (hy - 562.0) * pulse
        pr = hr * pulse
        wdraw.ellipse([px - pr * 2.1, py - pr * 2.1, px + pr * 2.1, py + pr * 2.1], fill=(244, 148, 56, 160))
        mdraw.ellipse([px - pr * 1.25, py - pr * 1.25, px + pr * 1.25, py + pr * 1.25], fill=(252, 206, 108, 215))
        cdraw.ellipse([(px - pr * 0.55) * ss, (py - pr * 0.55) * ss, (px + pr * 0.55) * ss, (py + pr * 0.55) * ss], fill=(255, 242, 188, 240))

    wide_blur = wide_glow.filter(ImageFilter.GaussianBlur(radius=18))
    mid_blur = mid_glow.filter(ImageFilter.GaussianBlur(radius=7.5))
    core_down = core_layer.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=2.8))

    # Combine smoothly
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out = Image.alpha_composite(out, wide_blur)
    out = Image.alpha_composite(out, mid_blur)
    out = Image.alpha_composite(out, core_down)

    # Clip tightly to sphere radius
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).ellipse([cx - r_sphere, cy - r_sphere, cx + r_sphere, cy + r_sphere], fill=255)
    out_arr = np.array(out, dtype=np.uint8)
    m_arr = np.array(mask, dtype=np.uint8)
    out_arr[:, :, 3] = ((out_arr[:, :, 3].astype(np.float32) * (m_arr.astype(np.float32) / 255.0))).round().astype(np.uint8)
    return Image.fromarray(out_arr, mode="RGBA")


def apply_directional_lighting(img_pil, light_dir=(-0.707, -0.707), strength=0.16, warm_shift=True):
    """
    Applies smooth directional key-light gradient across an RGBA plate (bright top-left, shadowed bottom-right).
    """
    arr = np.array(img_pil.convert("RGBA"), dtype=np.float32)
    H, W = arr.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx / max(1.0, W - 1.0)) * 2.0 - 1.0
    ny = (yy / max(1.0, H - 1.0)) * 2.0 - 1.0
    proj = nx * float(light_dir[0]) + ny * float(light_dir[1])  # ~[-1.4, +1.4], + along key light
    factor = 1.0 + np.clip(proj, -1.2, 1.2) * float(strength)
    arr[:, :, :3] *= factor[:, :, None]
    if warm_shift:
        # Warm golden tint on lit side, subtle cool-umber deepen on shadow side
        arr[:, :, 0] += np.clip(proj, 0.0, 1.2) * (strength * 24.0)
        arr[:, :, 1] += np.clip(proj, 0.0, 1.2) * (strength * 14.0)
        arr[:, :, 2] -= np.clip(proj, 0.0, 1.2) * (strength * 8.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGBA")


def make_edge_light_wrap(fg_pil, color=(252, 182, 114), radius=6.0, strength=0.72):
    """
    Computes an optical backlight edge-wrap strictly inside fg_pil's alpha boundary:
    erodes/blurs inverted alpha so bright background light wraps naturally around trunks, leaves, and edges.
    """
    fg_arr = np.array(fg_pil.convert("RGBA"), dtype=np.float32)
    alpha = fg_arr[:, :, 3]
    inv_alpha = Image.fromarray((255.0 - alpha).astype(np.uint8), mode="L")
    inv_blur = np.array(inv_alpha.filter(ImageFilter.GaussianBlur(radius=radius)), dtype=np.float32) / 255.0
    # Edge wrap is strong right along silhouette border (where both alpha & blurred outside exist)
    wrap_mask = (alpha / 255.0) * np.clip(inv_blur * 2.1, 0.0, 1.0) * float(strength)
    out = np.zeros_like(fg_arr, dtype=np.uint8)
    out[:, :, 0] = int(color[0])
    out[:, :, 1] = int(color[1])
    out[:, :, 2] = int(color[2])
    out[:, :, 3] = np.clip(wrap_mask * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode="RGBA")


def render_directional_rim_overlay(W, H, pts_smooth, light_dir=(0.55, -0.84), rim_rgba=(254, 184, 120, 235), rim_width=4.0, blur_r=2.0, ss=3):
    """
    Generates a standalone glowing rim-light overlay strictly along outward curve normals facing `light_dir`.
    Used for dynamic motivated lighting (e.g. descending asteroid lighting up dinosaur backs).
    """
    Ws, Hs = W * ss, H * ss
    scaled = [(x * ss, y * ss) for (x, y) in pts_smooth]
    n = len(scaled)
    area2 = sum(scaled[i][0] * scaled[(i + 1) % n][1] - scaled[(i + 1) % n][0] * scaled[i][1] for i in range(n))
    orient = 1.0 if area2 >= 0 else -1.0

    rim = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rim, "RGBA")
    ldx, ldy = float(light_dir[0]), float(light_dir[1])

    for i in range(n):
        x0, y0 = scaled[i]
        x1, y1 = scaled[(i + 1) % n]
        dx, dy = x1 - x0, y1 - y0
        seg_l = math.hypot(dx, dy)
        if seg_l < 1e-4:
            continue
        nx = orient * (dy / seg_l)
        ny = orient * (-dx / seg_l)
        lit = nx * ldx + ny * ldy
        if lit > 0.14 and y0 < Hs * 0.86:
            af = min(1.0, (lit - 0.14) / 0.72)
            ra = int(round(rim_rgba[3] * af))
            if ra > 8:
                rdraw.line([x0, y0, x1, y1], fill=(rim_rgba[0], rim_rgba[1], rim_rgba[2], ra), width=max(2, int(round(rim_width * ss))))

    rim_down = rim.resize((W, H), Image.Resampling.LANCZOS)
    if blur_r > 0.2:
        rim_down = rim_down.filter(ImageFilter.GaussianBlur(radius=blur_r))
    return rim_down


def draw_tapered_magma_rivers(W, H, cx, cy, r_sphere, hotspots, seed=77):
    """
    V6 incandescent planetary magma network: thick glowing amber-orange rivers tapering organically
    from bright central calderas into branching molten veins, composited via multi-stage bloom.
    """
    ss = 2
    Ws, Hs = W * ss, H * ss
    subsurface = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    amber_halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gold_river = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    cream_core = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))

    sdraw = ImageDraw.Draw(subsurface, "RGBA")
    adraw = ImageDraw.Draw(amber_halo, "RGBA")
    gdraw = ImageDraw.Draw(gold_river, "RGBA")
    cdraw = ImageDraw.Draw(cream_core, "RGBA")

    # Warm central molten mantle subsurface glow
    sdraw.ellipse([cx - r_sphere * 0.78, cy - r_sphere * 0.78, cx + r_sphere * 0.78, cy + r_sphere * 0.78], fill=(238, 128, 42, 165))

    rng = np.random.default_rng(seed)

    def stroke_tapered(pts_list, w_start, w_end):
        m = len(pts_list) - 1
        for k in range(m):
            u = k / max(1.0, float(m))
            w = w_start * (1.0 - u) + w_end * u
            a, b = pts_list[k], pts_list[k + 1]
            sdraw.line([a, b], fill=(236, 124, 38, 130), width=max(5, int(round(w * 2.8))))
            adraw.line([a, b], fill=(248, 168, 62, 185), width=max(3, int(round(w * 1.55))))
            gdraw.line([(a[0] * ss, a[1] * ss), (b[0] * ss, b[1] * ss)], fill=(254, 212, 104, 220), width=max(2, int(round(w * 0.95 * ss))))
            if w > 3.2:
                cdraw.line([(a[0] * ss, a[1] * ss), (b[0] * ss, b[1] * ss)], fill=(255, 240, 178, 195), width=max(1, int(round(w * 0.45 * ss))))

    # Connect central hotspots into luminous branching rivers + outer radiating fissures
    for idx in range(len(hotspots)):
        hx0, hy0, hr0 = hotspots[idx]
        # Connect to 2 nearest neighbors for organic interconnected magma lattice
        dists = sorted([(math.hypot(hx0 - hx1, hy0 - hy1), j) for j, (hx1, hy1, _) in enumerate(hotspots) if j != idx])
        for _, j in dists[:2]:
            if j > idx:
                hx1, hy1, _ = hotspots[j]
                seg = midpoint_fractal_line((hx0, hy0), (hx1, hy1), rng, displacement=14.0, depth=3)
                stroke_tapered(seg, float(rng.uniform(5.5, 9.0)), float(rng.uniform(4.0, 6.8)))

        # Radiate 2-3 tapering fissures outward from each caldera toward sphere rim
        for _ in range(3):
            ang = math.atan2(hy0 - cy, hx0 - cx) + float(rng.uniform(-1.15, 1.15))
            r_end = min(r_sphere - 6.0, math.hypot(hx0 - cx, hy0 - cy) + float(rng.uniform(45, 118)))
            p_end = (cx + r_end * math.cos(ang), cy + r_end * math.sin(ang))
            seg = midpoint_fractal_line((hx0, hy0), p_end, rng, displacement=11.0, depth=3)
            stroke_tapered(seg, float(rng.uniform(5.2, 8.2)), 1.6)
            # Small secondary fork
            if rng.random() < 0.7:
                pm = seg[len(seg) // 2]
                ang2 = ang + float(rng.uniform(-0.85, 0.85))
                r_end2 = min(r_sphere - 5.0, math.hypot(pm[0] - cx, pm[1] - cy) + float(rng.uniform(25, 62)))
                seg2 = midpoint_fractal_line(pm, (cx + r_end2 * math.cos(ang2), cy + r_end2 * math.sin(ang2)), rng, displacement=7.0, depth=2)
                stroke_tapered(seg2, 3.8, 1.2)

    # Glowing magma calderas (soft layered amber -> yellow-gold -> warm cream centers)
    for hx, hy, hr in hotspots:
        sdraw.ellipse([hx - hr * 2.3, hy - hr * 2.3, hx + hr * 2.3, hy + hr * 2.3], fill=(242, 138, 44, 155))
        adraw.ellipse([hx - hr * 1.4, hy - hr * 1.4, hx + hr * 1.4, hy + hr * 1.4], fill=(250, 188, 78, 210))
        gdraw.ellipse([(hx - hr * 0.85) * ss, (hy - hr * 0.85) * ss, (hx + hr * 0.85) * ss, (hy + hr * 0.85) * ss], fill=(254, 224, 128, 230))
        cdraw.ellipse([(hx - hr * 0.42) * ss, (hy - hr * 0.42) * ss, (hx + hr * 0.42) * ss, (hy + hr * 0.42) * ss], fill=(255, 245, 198, 220))

    sub_blur = subsurface.filter(ImageFilter.GaussianBlur(radius=24))
    amb_blur = amber_halo.filter(ImageFilter.GaussianBlur(radius=10))
    gold_blur = gold_river.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=3.5))
    core_blur = cream_core.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=1.8))

    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out = Image.alpha_composite(out, sub_blur)
    out = Image.alpha_composite(out, amb_blur)
    out = Image.alpha_composite(out, gold_blur)
    out = Image.alpha_composite(out, core_blur)

    # Soft clip strictly inside sphere radius (2px feather at edge)
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).ellipse([cx - r_sphere, cy - r_sphere, cx + r_sphere, cy + r_sphere], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    out_arr = np.array(out, dtype=np.uint8)
    m_arr = np.array(mask, dtype=np.float32) / 255.0
    out_arr[:, :, 3] = np.clip(out_arr[:, :, 3].astype(np.float32) * m_arr, 0, 255).round().astype(np.uint8)
    return Image.fromarray(out_arr, mode="RGBA")

