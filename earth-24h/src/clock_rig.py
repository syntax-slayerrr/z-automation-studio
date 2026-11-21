import functools
import math
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from painterly_fx import apply_gouache_mottle

_LAYERS_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\assets\layers"

FONT_SERIF_BOLD = r"C:\Windows\Fonts\timesbd.ttf"
FONT_SERIF_REG = r"C:\Windows\Fonts\times.ttf"
FONT_SANS_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SANS_REG = r"C:\Windows\Fonts\segoeui.ttf"


@functools.lru_cache(maxsize=128)
def _load_ttf(path, size_int):
    return ImageFont.truetype(path, size_int)


def get_font(path, size):
    try:
        return _load_ttf(path, max(8, int(round(size))))
    except Exception:
        return ImageFont.load_default()


def lerp(a, b, t):
    t = max(0.0, min(1.0, float(t)))
    return a + (b - a) * t


def ease_in_out(t):
    t = max(0.0, min(1.0, float(t)))
    return t * t * (3.0 - 2.0 * t)


def lerp_color(c1, c2, t):
    t = max(0.0, min(1.0, float(t)))
    return (
        int(round(c1[0] + (c2[0] - c1[0]) * t)),
        int(round(c1[1] + (c2[1] - c1[1]) * t)),
        int(round(c1[2] + (c2[2] - c1[2]) * t)),
    )


@functools.lru_cache(maxsize=8)
def _build_gear_sprite(r_outer, r_inner, r_hub, num_teeth, num_holes, hole_mode, has_rivets):
    """
    Pre-renders a 2x supersampled antique brass gear sprite centered in a square RGBA image.
    """
    ss = 2
    S = int(math.ceil((r_outer + 12) * 2 * ss))
    cx = cy = S / 2.0
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    ro, ri, rh = r_outer * ss, r_inner * ss, r_hub * ss
    pts = []
    for i in range(num_teeth * 4):
        sub = i % 4
        base_a = (i // 4) * (360.0 / num_teeth)
        step = 360.0 / (num_teeth * 4.0)
        if sub == 0:
            a, r = math.radians(base_a), ri
        elif sub == 1:
            a, r = math.radians(base_a + step * 0.65), ro
        elif sub == 2:
            a, r = math.radians(base_a + step * 1.95), ro
        else:
            a, r = math.radians(base_a + step * 2.60), ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))

    # Soft shadow behind gear
    sh_pts = [(p[0] + 4, p[1] + 6) for p in pts]
    draw.polygon(sh_pts, fill=(8, 4, 14, 110))
    # Main brass fill + warm highlight rim
    draw.polygon(pts, fill=(122, 88, 38, 255), outline=(172, 132, 68, 240))
    draw.ellipse([cx - ri * 0.94, cy - ri * 0.94, cx + ri * 0.94, cy + ri * 0.94], outline=(152, 114, 54, 180), width=2)

    # Cutouts: either circular ring holes or radial spoke sectors
    if hole_mode == "circles":
        r_ring = (ri * 0.78 + rh * 1.35) * 0.5
        r_hole_cut = (ri * 0.78 - rh * 1.35) * 0.36
        for k in range(num_holes):
            a = math.radians(k * (360.0 / num_holes))
            hx = cx + r_ring * math.cos(a)
            hy = cy + r_ring * math.sin(a)
            draw.ellipse([hx - r_hole_cut, hy - r_hole_cut, hx + r_hole_cut, hy + r_hole_cut], fill=(0, 0, 0, 0), outline=(172, 132, 68, 220), width=2)
    else:
        r_cut_out = ri * 0.78
        r_cut_in = rh * 1.35
        for s in range(num_holes):
            a0 = math.radians(s * (360.0 / num_holes) + 11.0)
            a1 = math.radians((s + 1) * (360.0 / num_holes) - 11.0)
            arc_pts = []
            for k in range(13):
                ak = a0 + (a1 - a0) * (k / 12.0)
                arc_pts.append((cx + r_cut_out * math.cos(ak), cy + r_cut_out * math.sin(ak)))
            for k in range(12, -1, -1):
                ak = a0 + (a1 - a0) * (k / 12.0)
                arc_pts.append((cx + r_cut_in * math.cos(ak), cy + r_cut_in * math.sin(ak)))
            draw.polygon(arc_pts, fill=(0, 0, 0, 0), outline=(168, 128, 64, 220))

    if has_rivets:
        r_riv = ri * 0.88
        for k in range(num_teeth):
            a = math.radians(k * (360.0 / num_teeth) + 4.0)
            rx = cx + r_riv * math.cos(a)
            ry = cy + r_riv * math.sin(a)
            draw.ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=(78, 52, 20, 220))

    # Center hub & axle hole
    r_hole = rh * 0.54
    draw.ellipse([cx - rh, cy - rh, cx + rh, cy + rh], fill=(138, 100, 44, 255), outline=(182, 142, 76, 240), width=2)
    draw.ellipse([cx - r_hole, cy - r_hole, cx + r_hole, cy + r_hole], fill=(0, 0, 0, 0), outline=(168, 128, 64, 230), width=2)

    img = apply_gouache_mottle(img, strength=0.09, seed=int(r_outer * 13 + num_teeth), warm_bias=True, octaves=((24, 0.6), (8, 0.4)))
    return img.resize((S // 2, S // 2), Image.Resampling.LANCZOS)


@functools.lru_cache(maxsize=1)
def _build_master_clock_plate():
    """
    Loads pre-built painterly 2460x2460 V6 clock dial plate (directional 3D scallops, groove AO & inward cast shadow),
    falling back cleanly to V5 or procedural build if asset is absent.
    """
    for fname in ("clock_plate_v6.png", "clock_plate_v5.png"):
        plate_path = os.path.join(_LAYERS_DIR, fname)
        if os.path.exists(plate_path):
            return Image.open(plate_path).convert("RGBA")
    S = 2460
    sc = 3.0
    cx = cy = S / 2.0

    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # 1. Outer dotted astronomical perimeter ring (r = 398)
    r_dots = 398.0 * sc
    for i in range(72):
        a = math.radians(i * 5.0)
        dx = cx + r_dots * math.cos(a)
        dy = cy + r_dots * math.sin(a)
        dr = 2.0 * sc
        draw.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=(158, 136, 105, 165))

    # 2. 48 Alternating Sunray Spikes (r = 344..385)
    for i in range(48):
        a_mid = math.radians(i * 7.5)
        a_l = math.radians(i * 7.5 - 2.35)
        a_r = math.radians(i * 7.5 + 2.35)
        p0 = (cx + 344 * sc * math.cos(a_l), cy + 344 * sc * math.sin(a_l))
        p1 = (cx + 385 * sc * math.cos(a_mid), cy + 385 * sc * math.sin(a_mid))
        p2 = (cx + 344 * sc * math.cos(a_r), cy + 344 * sc * math.sin(a_r))
        col = (165, 136, 98, 200) if i % 2 == 0 else (122, 96, 66, 170)
        draw.polygon([p0, p1, p2], fill=col)

    # 3. 48 Sculpted 3D Scalloped Gold Bezel Lobes (r_ring = 340, lobe_r = 21.5)
    for i in range(48):
        a = math.radians(i * 7.5)
        lx = cx + 340.0 * sc * math.cos(a)
        ly = cy + 340.0 * sc * math.sin(a)
        lr = 21.5 * sc
        # Outer dark gold rim
        draw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(138, 94, 40, 255), outline=(95, 60, 22, 240), width=2)
        # Inner lighter gold highlight
        lr_in = lr * 0.84
        draw.ellipse([lx - lr_in, ly - lr_in - 1.5, lx + lr_in, ly + lr_in - 1.5], fill=(176, 128, 62, 255))
        # Centered dark pin rivet
        px = cx + 346.5 * sc * math.cos(a)
        py = cy + 346.5 * sc * math.sin(a)
        pr = 2.6 * sc
        draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(90, 56, 20, 235), outline=(212, 168, 98, 160), width=1)

    # 4. Main Gold Bezel Body & Cream Chapter Ring with Radial Shading (numpy vectorized)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / sc

    plate_arr = np.array(img, dtype=np.uint8)
    # Bezel band (r in 330..336)
    m_bez = (dist >= 329.5) & (dist <= 336.5)
    plate_arr[m_bez] = [164, 124, 72, 255]

    # Cream chapter ring (r in 208..330) with subtle warm radial shading
    m_cr = (dist >= 208.0) & (dist < 330.0)
    # Outer chapter ring (274..330): #eee0c4 -> #cbb38b at outer edge
    u_out = np.clip((dist - 274.0) / (330.0 - 274.0), 0.0, 1.0)
    r_c = np.where(dist >= 274.0, 236 - 30 * (u_out ** 1.6), 243 - 10 * ((274.0 - dist) / 66.0))
    g_c = np.where(dist >= 274.0, 221 - 37 * (u_out ** 1.6), 229 - 14 * ((274.0 - dist) / 66.0))
    b_c = np.where(dist >= 274.0, 192 - 44 * (u_out ** 1.6), 199 - 18 * ((274.0 - dist) / 66.0))
    plate_arr[m_cr, 0] = np.clip(r_c[m_cr], 0, 255).astype(np.uint8)
    plate_arr[m_cr, 1] = np.clip(g_c[m_cr], 0, 255).astype(np.uint8)
    plate_arr[m_cr, 2] = np.clip(b_c[m_cr], 0, 255).astype(np.uint8)
    plate_arr[m_cr, 3] = 255

    # Recessed Era Groove Track (r in 258..274)
    m_groove = (dist >= 258.0) & (dist <= 274.0)
    plate_arr[m_groove] = [208, 198, 178, 255]

    # Clear inside inner viewport (r < 208.0)
    plate_arr[dist < 208.0] = [0, 0, 0, 0]

    img = Image.fromarray(plate_arr, mode="RGBA")
    draw = ImageDraw.Draw(img, "RGBA")

    # Fine concentric bevel rings & subtle shadows
    for r_ring, col, w in [
        (330.0, (132, 98, 56, 230), 2.0),
        (274.0, (176, 162, 138, 210), 1.5),
        (258.0, (176, 162, 138, 210), 1.5),
        (225.0, (172, 152, 122, 230), 2.0),
        (216.0, (250, 240, 216, 255), 2.5),
        (208.0, (148, 126, 98, 255), 2.5),
    ]:
        rr = r_ring * sc
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col, width=max(1, int(round(w * sc))))

    # 96 Ticks: Outer Chapter Ring (r = 313..329) & Inner Sub-Ring (r = 236..252)
    for i in range(96):
        a = math.radians(-90.0 + i * (360.0 / 96.0))
        is_hr = (i % 4 == 0)
        # Outer chapter ticks
        r_o0 = (312.0 if is_hr else 320.0) * sc
        r_o1 = 329.0 * sc
        w_o = (2.4 if is_hr else 1.4) * sc
        draw.line(
            [cx + r_o0 * math.cos(a), cy + r_o0 * math.sin(a), cx + r_o1 * math.cos(a), cy + r_o1 * math.sin(a)],
            fill=(96, 82, 62, 230),
            width=max(1, int(round(w_o))),
        )
        # Inner tick ring marks
        r_i0 = (234.0 if is_hr else 238.0) * sc
        r_i1 = (253.0 if is_hr else 250.0) * sc
        w_i = (2.3 if is_hr else 1.4) * sc
        draw.line(
            [cx + r_i0 * math.cos(a), cy + r_i0 * math.sin(a), cx + r_i1 * math.cos(a), cy + r_i1 * math.sin(a)],
            fill=(96, 82, 62, 225),
            width=max(1, int(round(w_i))),
        )

    # Upright Serif Numerals 1..24
    fnt_reg = get_font(FONT_SERIF_REG, 22 * sc)
    fnt_24 = get_font(FONT_SERIF_BOLD, 33 * sc)
    for h_num in range(1, 25):
        a = math.radians(-90.0 + (h_num % 24) * 15.0)
        r_n = (302.0 if h_num == 24 else 296.0) * sc
        nx = cx + r_n * math.cos(a)
        ny = cy + r_n * math.sin(a)
        fnt = fnt_24 if h_num == 24 else fnt_reg
        txt = str(h_num)
        bb = draw.textbbox((0, 0), txt, font=fnt)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        draw.text((nx - tw / 2.0 - bb[0], ny - th / 2.0 - bb[1]), txt, font=fnt, fill=(92, 80, 66, 248))

    return img


def _paste_gear(canvas_pil, sprite, gx, gy, target_r_out, angle_deg, alpha=1.0):
    if alpha < 0.02:
        return
    # Base sprite was built for specific r_outer; resize cleanly to target size
    w_s, h_s = sprite.size
    # Estimate scale factor via width relative to original build
    rot_sp = sprite.rotate(-angle_deg, resample=Image.Resampling.BICUBIC, expand=False)
    tw = max(4, int(round(target_r_out * 2.25)))
    rot_sp = rot_sp.resize((tw, tw), Image.Resampling.LANCZOS)
    if alpha < 0.99:
        r, g, b, a = rot_sp.split()
        a = a.point(lambda p: int(p * alpha))
        rot_sp = Image.merge("RGBA", (r, g, b, a))
    canvas_pil.alpha_composite(rot_sp, (int(round(gx - tw / 2.0)), int(round(gy - tw / 2.0))))


def _draw_hands_overlay(W, H, cx, cy, scale, clock_state):
    """
    Renders ornate spade hands (with hollow eye/teardrop cutouts), red second hand, soft drop shadows,
    and 3D brass center pin at 2x supersampling for crisp anti-aliased silhouettes.
    """
    ss = 2
    layer = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    sh_layer = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    sdraw = ImageDraw.Draw(sh_layer, "RGBA")

    sc = scale * ss
    cxx, cyy = cx * ss, cy * ss

    def draw_ornate_hand(d_tgt, angle_deg, length, tail_len, w_base, hand_kind, col, dx=0.0, dy=0.0):
        a = math.radians(angle_deg - 90.0)
        pa = a + math.pi / 2.0
        ca, sa = math.cos(a), math.sin(a)
        pca, psa = math.cos(pa), math.sin(pa)
        ox, oy = cxx + dx, cyy + dy

        def pt(r_ax, r_lat):
            return (ox + r_ax * sc * ca + r_lat * sc * pca, oy + r_ax * sc * sa + r_lat * sc * psa)

        if hand_kind == "hour":
            poly = [
                pt(-tail_len, -w_base * 0.9),
                pt(-tail_len, w_base * 0.9),
                pt(length * 0.45, w_base * 0.72),
                pt(length * 0.68, w_base * 2.35),
                pt(length, 0.0),
                pt(length * 0.68, -w_base * 2.35),
                pt(length * 0.45, -w_base * 0.72),
            ]
            d_tgt.polygon(poly, fill=col)
            # Subtle warm bronze bevel center ridge + hollow eye cutout
            if col[3] > 200:
                d_tgt.line([pt(-tail_len * 0.6, -w_base * 0.15), pt(length * 0.56, -w_base * 0.1)], fill=(96, 72, 50, 130), width=max(1, int(round(1.6 * sc))))
                hx, hy = pt(length * 0.69, 0.0)
                hr = 4.5 * sc
                d_tgt.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(0, 0, 0, 0))
        else:
            # Minute hand with mid-shaft diamond swell + hollow spearhead tip + center metallic ridge
            poly = [
                pt(-tail_len, -w_base * 0.8),
                pt(-tail_len, w_base * 0.8),
                pt(length * 0.34, w_base * 0.62),
                pt(length * 0.45, w_base * 2.3),
                pt(length * 0.56, w_base * 0.62),
                pt(length * 0.74, w_base * 0.55),
                pt(length * 0.84, w_base * 1.85),
                pt(length, 0.0),
                pt(length * 0.84, -w_base * 1.85),
                pt(length * 0.74, -w_base * 0.55),
                pt(length * 0.56, -w_base * 0.62),
                pt(length * 0.45, -w_base * 2.3),
                pt(length * 0.34, -w_base * 0.62),
            ]
            d_tgt.polygon(poly, fill=col)
            if col[3] > 200:
                d_tgt.line([pt(-tail_len * 0.6, -w_base * 0.12), pt(length * 0.74, -w_base * 0.08)], fill=(96, 72, 50, 125), width=max(1, int(round(1.3 * sc))))
                cut = [pt(length * 0.79, 0.0), pt(length * 0.85, w_base * 0.85), pt(length * 0.93, 0.0), pt(length * 0.85, -w_base * 0.85)]
                d_tgt.polygon(cut, fill=(0, 0, 0, 0))

    hour_deg = clock_state.get("hour_deg", 0.0)
    min_deg = clock_state.get("min_deg", 0.0)
    min_blur_span = clock_state.get("min_blur_span", 0.0)

    # Motion blur fan for fast-spinning minute hand
    if min_blur_span > 2.0:
        num_g = 7
        for g in range(1, num_g + 1):
            ga = min_deg - (g / num_g) * min_blur_span
            draw_ornate_hand(draw, ga, 226, 34, 4.0, "minute", (46, 33, 24, int(round(78 * (1.0 - g / (num_g + 1))))))

    # Deeper directional hand drop shadows matching top-left key light
    draw_ornate_hand(sdraw, hour_deg, 150, 26, 5.4, "hour", (20, 12, 14, 140), dx=4.0 * ss, dy=6.5 * ss)
    draw_ornate_hand(sdraw, min_deg, 226, 34, 4.0, "minute", (20, 12, 14, 140), dx=4.2 * ss, dy=7.0 * ss)

    # Crisp hands
    draw_ornate_hand(draw, hour_deg, 150, 26, 5.4, "hour", (42, 29, 21, 250))
    draw_ornate_hand(draw, min_deg, 226, 34, 4.0, "minute", (42, 29, 21, 250))

    # Red second hand
    sec_deg = clock_state.get("sec_deg", None)
    if sec_deg is not None:
        sa = math.radians(sec_deg - 90.0)
        ca, sa_sin = math.cos(sa), math.sin(sa)
        sx0, sy0 = cxx - 52 * sc * ca, cyy - 52 * sc * sa_sin
        sx1, sy1 = cxx + 248 * sc * ca, cyy + 248 * sc * sa_sin
        sdraw.line([sx0 + 3 * ss, sy0 + 5 * ss, sx1 + 3 * ss, sy1 + 5 * ss], fill=(20, 12, 14, 115), width=max(2, int(round(2.6 * sc))))
        draw.line([sx0, sy0, sx1, sy1], fill=(214, 76, 52, 250), width=max(2, int(round(2.4 * sc))))
        cr = 6.5 * sc
        draw.ellipse([sx0 - cr, sy0 - cr, sx0 + cr, sy0 + cr], outline=(214, 76, 52, 250), width=max(2, int(round(2.5 * sc))))

    # Blur shadows slightly and composite
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(radius=4.2))
    sh_down = sh_layer.resize((W, H), Image.Resampling.BILINEAR)
    hd_down = layer.resize((W, H), Image.Resampling.LANCZOS)

    # 3D Beveled Brass center pin cap with off-center specular catchlight
    pin_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pin_layer, "RGBA")
    rp = 17.5 * scale
    rp_in = 12.2 * scale
    rp_hi = 4.6 * scale
    rp_hole = 5.0 * scale
    pdraw.ellipse([cx - rp + 2.5, cy - rp + 5.0, cx + rp + 2.5, cy + rp + 5.0], fill=(18, 10, 12, 145))
    pdraw.ellipse([cx - rp, cy - rp, cx + rp, cy + rp], fill=(192, 142, 70, 255), outline=(108, 70, 24, 255), width=max(1, int(round(1.6 * scale))))
    pdraw.ellipse([cx - rp_in - 0.8 * scale, cy - rp_in - 0.8 * scale, cx + rp_in - 0.8 * scale, cy + rp_in - 0.8 * scale], fill=(230, 184, 108, 255))
    hx_p, hy_p = cx - 4.2 * scale, cy - 4.5 * scale
    pdraw.ellipse([hx_p - rp_hi, hy_p - rp_hi, hx_p + rp_hi, hy_p + rp_hi], fill=(254, 236, 182, 195))
    pdraw.ellipse([cx - rp_hole, cy - rp_hole, cx + rp_hole, cy + rp_hole], fill=(64, 36, 14, 255))

    return sh_down, hd_down, pin_layer


@functools.lru_cache(maxsize=8)
def _load_gear_v6(fname, fallback_args):
    p = os.path.join(_LAYERS_DIR, fname)
    if os.path.exists(p):
        return Image.open(p).convert("RGBA")
    return _build_gear_sprite(*fallback_args)


def draw_clock_frame(canvas_pil, f, cx, cy, scale, clock_state, inner_viewport_img=None):
    """
    Composites the full 24-hour celestial clock centered at (cx, cy) with scale `scale`.
    """
    W, H = canvas_pil.size

    # 1. 2-Plane Corner Mechanical Brass Gears (far plane first, near plane on top)
    gear_alpha = max(0.0, min(1.0, (2.6 - scale) / 1.1))
    if gear_alpha > 0.02:
        rot = f * 0.25
        g_tl_lg = _load_gear_v6("gear_tl_lg.png", (128, 110, 30, 24, 6, "spokes", False))
        g_tl_md = _load_gear_v6("gear_tl_md.png", (78, 65, 19, 16, 6, "circles", False))
        g_br_md = _load_gear_v6("gear_br_md.png", (76, 64, 18, 14, 5, "circles", False))
        g_br_lg = _load_gear_v6("gear_br_lg.png", (126, 108, 28, 22, 6, "spokes", True))

        _paste_gear(canvas_pil, g_tl_lg, cx - 315 * scale, cy - 370 * scale, 128 * scale, rot, gear_alpha)
        _paste_gear(canvas_pil, g_br_lg, cx + 312 * scale, cy + 372 * scale, 126 * scale, -rot * 0.9, gear_alpha)
        _paste_gear(canvas_pil, g_tl_md, cx - 202 * scale, cy - 472 * scale, 78 * scale, -rot * 1.35, gear_alpha)
        _paste_gear(canvas_pil, g_br_md, cx + 215 * scale, cy + 255 * scale, 76 * scale, rot * 1.25, gear_alpha)

    # 2. Inner Circular Viewport (r = 208 * scale) placed BEFORE clock plate so plate rim frames it cleanly
    r_vp = 208.0 * scale
    if inner_viewport_img is not None:
        ir = int(round(r_vp + 2))
        if ir > 4:
            vp_resized = inner_viewport_img.resize((ir * 2, ir * 2), Image.Resampling.LANCZOS)
            mask = Image.new("L", (ir * 2, ir * 2), 0)
            mdraw = ImageDraw.Draw(mask)
            mdraw.ellipse([0, 0, ir * 2 - 1, ir * 2 - 1], fill=255)
            canvas_pil.paste(vp_resized, (int(round(cx - ir)), int(round(cy - ir))), mask)

    # 3. Master Clock Dial Plate (cropped & scaled cleanly to screen region!)
    master = _build_master_clock_plate()
    mS = master.size[0]
    mc = mS / 2.0
    m_sc = 3.0
    # Compute source rectangle in master plate that maps to screen [0..W, 0..H]
    sx0 = mc + (0.0 - cx) * (m_sc / scale)
    sy0 = mc + (0.0 - cy) * (m_sc / scale)
    sx1 = mc + (W - cx) * (m_sc / scale)
    sy1 = mc + (H - cy) * (m_sc / scale)
    # PIL transform AFFINE or QUAD maps exact subpixel source rect -> (W, H) cleanly!
    plate_view = master.transform(
        (W, H),
        Image.Transform.EXTENT,
        (sx0, sy0, sx1, sy1),
        resample=Image.Resampling.BICUBIC,
    )
    canvas_pil.alpha_composite(plate_view, (0, 0))

    # 4. Dynamic Arcs (Yellow 6 DETIK band + Colored Era Arcs) at 2x supersampling
    arc_ss = 2
    arc_layer = Image.new("RGBA", (W * arc_ss, H * arc_ss), (0, 0, 0, 0))
    adraw = ImageDraw.Draw(arc_layer, "RGBA")
    acx, acy = cx * arc_ss, cy * arc_ss
    asc = scale * arc_ss

    # Yellow "6 DETIK" highlight band inside inner tick ring with soft warm radiance bloom
    human_band_alpha = clock_state.get("human_band_alpha", 0.0)
    if human_band_alpha > 0.01:
        hb_a = int(round(225 * human_band_alpha))
        r_hb = 258.0 * asc
        hb_w = max(4, int(round(33.0 * asc)))
        hb_glow = Image.new("RGBA", (W * arc_ss, H * arc_ss), (0, 0, 0, 0))
        hbg_d = ImageDraw.Draw(hb_glow, "RGBA")
        hbg_d.arc([acx - r_hb, acy - r_hb, acx + r_hb, acy + r_hb], start=242.0, end=271.5, fill=(252, 236, 118, int(round(135 * human_band_alpha))), width=int(round(hb_w * 1.35)))
        arc_layer = Image.alpha_composite(arc_layer, hb_glow.filter(ImageFilter.GaussianBlur(radius=9 * arc_ss)))
        adraw = ImageDraw.Draw(arc_layer, "RGBA")
        adraw.arc([acx - r_hb, acy - r_hb, acx + r_hb, acy + r_hb], start=243.75, end=270.0, fill=(248, 238, 128, hb_a), width=hb_w)

    # Colored Geological Era Arcs (r = 258..274)
    r_era_out = 274.0 * asc
    era_w = max(2, int(round(16.0 * asc)))
    bbox_era = [acx - r_era_out, acy - r_era_out, acx + r_era_out, acy + r_era_out]
    era_h = clock_state.get("era_hours", 24.0)
    if era_h > 0.0:
        eh1 = min(4.2, era_h)
        adraw.arc(bbox_era, start=-90.0, end=-90.0 + (eh1 / 24.0) * 360.0, fill=(222, 92, 56, 255), width=era_w)
    if era_h > 4.2:
        eh2 = min(22.78, era_h)
        adraw.arc(bbox_era, start=-90.0 + (4.2 / 24.0) * 360.0, end=-90.0 + (eh2 / 24.0) * 360.0, fill=(46, 158, 150, 255), width=era_w)
    if era_h > 22.78:
        eh3 = min(23.65, era_h)
        adraw.arc(bbox_era, start=-90.0 + (22.78 / 24.0) * 360.0, end=-90.0 + (eh3 / 24.0) * 360.0, fill=(138, 104, 192, 255), width=era_w)
    if era_h > 23.65:
        eh4 = min(24.0, era_h)
        adraw.arc(bbox_era, start=264.75, end=-90.0 + (eh4 / 24.0) * 360.0, fill=(224, 182, 84, 255), width=era_w)

    # "6 DETIK" curved text + radially upright human silhouette
    if human_band_alpha > 0.01:
        hb_a = int(round(255 * human_band_alpha))
        # Radial angle for human: 22.95h -> -90 + (22.95/24)*360 = 254.25 deg
        a_hum_deg = 254.25
        a_hum = math.radians(a_hum_deg)
        hx = acx + (241.0 * asc) * math.cos(a_hum)
        hy = acy + (241.0 * asc) * math.sin(a_hum)
        # Rotate frame around (hx, hy) by (a_hum_deg + 90) so figure stands radially along dial!
        tilt = math.radians(a_hum_deg + 90.0)
        ct, st = math.cos(tilt), math.sin(tilt)
        hs = asc * 0.92 * min(1.0, human_band_alpha * 1.25)

        def hpt(lx, ly):
            return (hx + (lx * ct - ly * st) * hs, hy + (lx * st + ly * ct) * hs)

        # Head
        hc = hpt(-1.0, -14.0)
        hr = 4.0 * hs
        adraw.ellipse([hc[0] - hr, hc[1] - hr, hc[0] + hr, hc[1] + hr], fill=(32, 26, 22, hb_a))
        # Body, legs, left arm down, right arm raised
        bpts = [
            hpt(-4.2, -8.5), hpt(-9.0, 1.0), hpt(-6.8, 2.2), hpt(-3.2, -4.0),
            hpt(-2.5, 13.0), hpt(0.5, 13.0), hpt(0.8, 3.0), hpt(3.8, 12.0),
            hpt(6.8, 11.2), hpt(3.5, -5.0), hpt(6.2, -19.0), hpt(3.4, -19.8), hpt(0.5, -9.0)
        ]
        adraw.polygon(bpts, fill=(32, 26, 22, hb_a))

        # "6 DETIK" dark umber inked text clearly legible just below yellow band (matching REF f=1095)
        a_lbl = math.radians(254.8)
        lx = cx + (219.5 * scale) * math.cos(a_lbl)
        ly = cy + (219.5 * scale) * math.sin(a_lbl)
        txt_sp = Image.new("RGBA", (int(130 * scale), int(46 * scale)), (0, 0, 0, 0))
        tdraw = ImageDraw.Draw(txt_sp, "RGBA")
        fnt_6 = get_font(FONT_SANS_BOLD, max(9, 13.5 * scale))
        tdraw.text((10 * scale, 5 * scale), "6 DETIK", font=fnt_6, fill=(70, 56, 44, hb_a))
        txt_rot = txt_sp.rotate(15.2, resample=Image.Resampling.BICUBIC, expand=True)
        canvas_pil.alpha_composite(arc_layer.resize((W, H), Image.Resampling.LANCZOS), (0, 0))
        canvas_pil.alpha_composite(txt_rot, (int(round(lx - txt_rot.size[0] / 2.0)), int(round(ly - txt_rot.size[1] / 2.0))))
    else:
        canvas_pil.alpha_composite(arc_layer.resize((W, H), Image.Resampling.LANCZOS), (0, 0))

    # 5. Ornate Clock Hands + Drop Shadows + Brass Pin
    sh_down, hd_down, pin_layer = _draw_hands_overlay(W, H, cx, cy, scale, clock_state)
    canvas_pil.alpha_composite(sh_down, (0, 0))
    canvas_pil.alpha_composite(hd_down, (0, 0))
    canvas_pil.alpha_composite(pin_layer, (0, 0))
