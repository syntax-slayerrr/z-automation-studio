import functools
import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from clock_rig import lerp, ease_in_out, lerp_color
from painterly_fx import (
    apply_gouache_mottle,
    blend_screen,
    smooth_closed_curve,
)

_LAYERS_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h\assets\layers"

# Precompute deterministic star coordinates
_RNG = np.random.default_rng(42)
_STARS = [
    (int(_RNG.integers(10, 710)), int(_RNG.integers(15, 1220)), float(_RNG.uniform(0.9, 2.2)), int(_RNG.integers(95, 220)))
    for _ in range(95)
]


@functools.lru_cache(maxsize=16)
def _load_layer(fname):
    p = os.path.join(_LAYERS_DIR, fname)
    if os.path.exists(p):
        return Image.open(p).convert("RGBA")
    return None


def _draw_sparkle(draw, cx, cy, size, col):
    pts = [
        (cx, cy - size),
        (cx + size * 0.22, cy - size * 0.22),
        (cx + size, cy),
        (cx + size * 0.22, cy + size * 0.22),
        (cx, cy + size),
        (cx - size * 0.22, cy + size * 0.22),
        (cx - size, cy),
        (cx - size * 0.22, cy - size * 0.22),
    ]
    draw.polygon(pts, fill=col)


@functools.lru_cache(maxsize=2)
def _build_indigo_backdrop(W, H):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dist = np.sqrt((xx - 360.0) ** 2 + (yy - 580.0) ** 2) / 680.0
    dist = np.clip(dist, 0.0, 1.0)
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    arr[:, :, 0] = (46 * (1.0 - dist) + 21 * dist).astype(np.uint8)
    arr[:, :, 1] = (26 * (1.0 - dist) + 10 * dist).astype(np.uint8)
    arr[:, :, 2] = (64 * (1.0 - dist) + 30 * dist).astype(np.uint8)
    img = apply_gouache_mottle(Image.fromarray(arr, mode="RGB").convert("RGBA"), strength=0.05, seed=11, warm_bias=False)
    draw = ImageDraw.Draw(img, "RGBA")
    # Bottom scalloped dark indigo border with thin lavender rim (y ~ 1185..1280)
    lobes = [(-10, 1272, 82), (98, 1265, 75), (218, 1270, 78), (342, 1262, 86), (482, 1268, 78), (602, 1264, 76), (722, 1270, 82)]
    for lx, ly, lr in lobes:
        draw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(22, 12, 34, 255), outline=(108, 92, 134, 175), width=2)
    return img


def render_starry_indigo_canvas(W, H, f):
    img = _build_indigo_backdrop(W, H).copy()
    draw = ImageDraw.Draw(img, "RGBA")
    for idx, (sx, sy, sr, sa) in enumerate(_STARS):
        tw = int(sa * (0.75 + 0.25 * math.sin(f * 0.08 + idx)))
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(228, 212, 238, tw))
    return img


@functools.lru_cache(maxsize=2)
def _build_daynight_hills(S):
    """Builds gouache-mottled purple hill layers for Sequence 1 viewport."""
    hills = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(hills, "RGBA")
    back_pts = []
    for x_step in range(0, S + 8, 8):
        u = x_step / float(S)
        wy = S * (0.55 - 0.055 * math.sin(u * math.pi * 2.2 - 0.3) - 0.03 * math.cos(u * math.pi * 3.5))
        back_pts.append((x_step, wy))
    back_pts.extend([(S, S), (0, S)])
    draw.polygon(back_pts, fill=(100, 68, 108, 255))

    front_top = []
    for x_step in range(0, S + 8, 8):
        u = x_step / float(S)
        wy = S * (0.64 + 0.045 * math.sin(u * math.pi * 2.4 + 0.6))
        front_top.append((x_step, wy))
    front_pts = list(front_top) + [(S, S), (0, S)]
    draw.polygon(front_pts, fill=(66, 42, 78, 255))
    hills = apply_gouache_mottle(hills, strength=0.07, seed=108, warm_bias=False, octaves=((40, 0.6), (14, 0.4)))
    hdraw = ImageDraw.Draw(hills, "RGBA")
    hdraw.line(front_top, fill=(214, 198, 224, 215), width=max(2, int(S * 0.004)))
    return hills


def render_day_night_viewport(size, f):
    """
    2x supersampled inner 24-hour clock viewport for Sequence 1 (f = 0..238).
    Matched directly to REF day-night cycle keyframes (f=15, 35, 60, 95, 140, 190) with soft rays & textured hills.
    """
    S = size * 2
    # Cycle 1: 0..52, Cycle 2: 53..214
    if f <= 52:
        cyc_t = f / 52.0
    else:
        cyc_t = min(1.0, (f - 53.0) / 161.0)

    # Interpolated sky stops calibrated to REF f=15(0.29)->35(0.67)->60(0.04)->95(0.26)->140(0.54)->190(0.85)
    if f <= 52:
        sky_stops = [
            (0.00, (170, 196, 186)),
            (0.30, (166, 206, 198)),
            (0.65, (194, 152, 174)),
            (0.88, (216, 162, 100)),
            (1.00, (216, 162, 100)),
        ]
    else:
        sky_stops = [
            (0.00, (216, 162, 100)),  # f=53..55 warm sunset tail into Cycle 2
            (0.045, (162, 184, 160)),  # f=60 muted sage-teal
            (0.14, (192, 204, 194)),
            (0.26, (238, 234, 224)),  # f=95 bright ivory noon
            (0.42, (226, 192, 174)),
            (0.55, (216, 170, 146)),  # f=140 dusty rose-peach
            (0.75, (224, 174, 102)),
            (0.86, (234, 182, 88)),   # f=190 amber-gold twilight
            (1.00, (242, 194, 92)),
        ]
    sky_col = sky_stops[-1][1]
    for i in range(len(sky_stops) - 1):
        t0, c0 = sky_stops[i]
        t1, c1 = sky_stops[i + 1]
        if t0 <= cyc_t <= t1:
            u = (cyc_t - t0) / max(1e-4, t1 - t0)
            sky_col = lerp_color(c0, c1, u)
            break

    img = Image.new("RGBA", (S, S), sky_col + (255,))

    # Compute sun & moon trajectories matching REF f=15(sun left), 35(sun right), 60(moon right, rays fade left), 95(sun high right), 140(moon left), 190(moon center)
    if f <= 52:
        ang = cyc_t * math.pi * 1.45 + 2.65
        sun_x = S * (0.48 + 0.25 * math.cos(ang))
        sun_y = S * (0.48 + 0.16 * math.sin(ang))
        ray_a = 38
    else:
        # Cycle 2: sun rises left-behind-hill after f=64, peaks at f=95 (cyc_t=0.26 -> x=0.58, y=0.36), sets right by cyc_t=0.50
        sun_phase = (cyc_t - 0.08) * math.pi * 1.65
        sun_x = S * (0.50 - 0.22 * math.cos(sun_phase))
        sun_y = S * (0.56 - 0.23 * math.sin(sun_phase))
        ray_a = 28 if cyc_t < 0.45 else int(max(0, 28 * (1.0 - (cyc_t - 0.45) / 0.18)))

    # Soft wide atmospheric sunbeam fan (translucent tapered wedges rendered smoothly, NOT crisp white lines)
    if ray_a > 2:
        ray_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        rdraw = ImageDraw.Draw(ray_layer, "RGBA")
        # Radial glow behind sun center
        rdraw.ellipse([sun_x - S * 0.22, sun_y - S * 0.22, sun_x + S * 0.22, sun_y + S * 0.22], fill=(255, 244, 210, int(ray_a * 1.2)))
        for r_i in range(22):
            a0 = r_i * (2.0 * math.pi / 22.0) + cyc_t * 0.4
            da = 0.065
            p1 = (sun_x + S * 0.65 * math.cos(a0 - da), sun_y + S * 0.65 * math.sin(a0 - da))
            p2 = (sun_x + S * 0.65 * math.cos(a0 + da), sun_y + S * 0.65 * math.sin(a0 + da))
            rdraw.polygon([(sun_x, sun_y), p1, p2], fill=(255, 246, 214, ray_a))
        ray_layer = ray_layer.filter(ImageFilter.GaussianBlur(radius=3.5))
        img = blend_screen(img, ray_layer)

    draw = ImageDraw.Draw(img, "RGBA")
    # Draw sun disc only when above horizon ridge (not glaring on f=60!)
    if sun_y < S * 0.56:
        sun_r = S * 0.056
        draw.ellipse([sun_x - sun_r, sun_y - sun_r, sun_x + sun_r, sun_y + sun_r], fill=(238, 198, 98, 225))

    # Crescent moon matching REF f=60(right), f=140(left), f=190(center)
    moon_vis = 0.0
    if f <= 52 and cyc_t > 0.72:
        moon_x, moon_y = S * 0.62, S * 0.44
        moon_vis = (cyc_t - 0.72) / 0.28
    elif f > 52:
        if cyc_t < 0.24:
            # Early morning receding crescent at right (visible cleanly at f=60!)
            moon_x = S * lerp(0.58, 0.72, cyc_t / 0.24)
            moon_y = S * lerp(0.45, 0.54, cyc_t / 0.24)
            moon_vis = 1.0 - max(0.0, (cyc_t - 0.12) / 0.12)
        elif cyc_t > 0.44:
            # Afternoon -> dusk crescent entering left (f=140 -> 0.36, 0.46) to center (f=190 -> 0.48, 0.40)
            u_m = min(1.0, (cyc_t - 0.44) / 0.42)
            moon_x = S * lerp(0.34, 0.48, u_m)
            moon_y = S * lerp(0.49, 0.40, u_m)
            moon_vis = min(1.0, (cyc_t - 0.44) / 0.12)

    if moon_vis > 0.05:
        mr = S * 0.044
        m_a = int(round(220 * moon_vis))
        draw.ellipse([moon_x - mr, moon_y - mr, moon_x + mr, moon_y + mr], fill=(248, 240, 224, m_a))
        draw.ellipse([moon_x - mr * 0.42, moon_y - mr * 1.12, moon_x + mr * 1.15, moon_y + mr * 0.68], fill=sky_col + (255,))

    # Subtle twinkling sky specks
    if (f <= 52 and cyc_t > 0.7) or (f > 52 and (cyc_t < 0.18 or cyc_t > 0.46)):
        for sx, sy, sr, sa in _STARS[:22]:
            ux, uy = (sx / 720.0) * S, (sy / 1280.0) * S
            if uy < S * 0.54:
                draw.ellipse([ux - 2, uy - 2, ux + 2, uy + 2], fill=(255, 246, 228, 115))

    # Gouache-textured hills
    img = Image.alpha_composite(img, _build_daynight_hills(S))
    draw = ImageDraw.Draw(img, "RGBA")

    # Upward dark rust-red curtain wipe at f = 217..231
    if f >= 217:
        wipe_t = ease_in_out((f - 217.0) / 12.0)
        wipe_y = S * (1.0 - wipe_t)
        draw.rectangle([0, wipe_y, S, S], fill=(122, 46, 28, 255))
        draw.line([0, wipe_y, S, wipe_y], fill=(224, 152, 92, 180), width=4)
        for sx, sy, sr, _ in _STARS[:30]:
            ux, uy = (sx / 720.0) * S, (sy / 1280.0) * S
            if uy >= wipe_y:
                draw.ellipse([ux - 2, uy - 2, ux + 2, uy + 2], fill=(248, 220, 185, 190))

    return img.resize((size, size), Image.Resampling.LANCZOS)


@functools.lru_cache(maxsize=2)
def _build_molten_bg(W, H):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dist = np.sqrt((xx - 360.0) ** 2 + (yy - 562.0) ** 2) / 540.0
    dist = np.clip(dist, 0.0, 1.0)
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    arr[:, :, 0] = (148 * (1.0 - dist) + 64 * dist).astype(np.uint8)
    arr[:, :, 1] = (68 * (1.0 - dist) + 18 * dist).astype(np.uint8)
    arr[:, :, 2] = (40 * (1.0 - dist) + 22 * dist).astype(np.uint8)
    img = apply_gouache_mottle(Image.fromarray(arr, mode="RGB").convert("RGBA"), strength=0.06, seed=21, warm_bias=True)
    draw = ImageDraw.Draw(img, "RGBA")
    for sx, sy, sr, sa in _STARS:
        if sy < 860:
            draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(248, 212, 165, int(sa * 0.85)))
    for spx, spy, sps in [(148, 314, 9), (676, 562, 11), (612, 240, 6), (528, 326, 5)]:
        _draw_sparkle(draw, spx, spy, sps, (252, 226, 178, 215))
    return img


def render_molten_earth_scene(W, H, f, vector_shapes, as_viewport=False):
    """
    Sequence 2: 00.00 BUMI TERBENTUK — Painted basalt proto-Earth + Screen-blended fractal fissures & gouache clouds.
    """
    if as_viewport:
        full = render_molten_earth_scene(720, 1280, f, vector_shapes, as_viewport=False)
        return full.crop((360 - 212, 562 - 212, 360 + 212, 562 + 212)).resize((W, H), Image.Resampling.LANCZOS)

    img = _build_molten_bg(W, H).copy()
    draw = ImageDraw.Draw(img, "RGBA")

    # Spiral dotted galaxy at top-left (around x=205, y=195)
    for t_step in range(42):
        theta = t_step * 0.34 + f * 0.008
        gr = t_step * 1.4
        gx = 205 + gr * math.cos(theta) * 1.55
        gy = 195 + gr * math.sin(theta) * 0.72
        draw.ellipse([gx - 1.3, gy - 1.3, gx + 1.3, gy + 1.3], fill=(238, 198, 158, 155))

    grow_t = ease_in_out((f - 240.0) / 16.0) if f < 256 else 1.0
    r_sphere = 48.0 + (212.0 - 48.0) * grow_t
    cx, cy = 360.0, 562.0

    # Subtle outer segmented geometric frame arcs around sphere (r = 238..247)
    if f >= 250:
        arc_a = int(round(135 * ease_in_out((f - 250.0) / 10.0)))
        r_arc = 238.0
        for deg0, deg1 in [(-148, -110), (-95, -52), (-36, 8), (18, 52), (132, 168), (180, 212)]:
            draw.arc([cx - r_arc, cy - r_arc, cx + r_arc, cy + r_arc], start=deg0, end=deg1, fill=(224, 156, 118, arc_a), width=2)
            r_arc2 = 247.0
            draw.arc([cx - r_arc2, cy - r_arc2, cx + r_arc2, cy + r_arc2], start=deg0 + 4, end=deg1 - 4, fill=(198, 128, 92, int(arc_a * 0.7)), width=1)

    # Outer wide incandescent warm planetary corona (1.42x radius) using Screen blend
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_layer, "RGBA")
    gdraw.ellipse([cx - r_sphere * 1.42, cy - r_sphere * 1.42, cx + r_sphere * 1.42, cy + r_sphere * 1.42], fill=(214, 102, 34, 95))
    gdraw.ellipse([cx - r_sphere * 1.18, cy - r_sphere * 1.18, cx + r_sphere * 1.18, cy + r_sphere * 1.18], fill=(242, 146, 56, 145))
    gdraw.ellipse([cx - r_sphere * 1.03, cy - r_sphere * 1.03, cx + r_sphere * 1.03, cy + r_sphere * 1.03], fill=(252, 186, 94, 155))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=28))
    img = blend_screen(img, glow_layer)

    # Textured V6 Incandescent Subsurface Basalt + Tapered Magma River Proto-Earth Sphere
    sph_src = _load_layer("molten_sphere_v6.png") or _load_layer("molten_sphere_v5.png")
    if sph_src is not None:
        pulse = 1.0 + 0.015 * math.sin(f * 0.14)
        sc_f = (r_sphere / 212.0) * pulse
        tw = max(16, int(round(sph_src.size[0] * sc_f)))
        th = max(16, int(round(sph_src.size[1] * sc_f)))
        sph_scaled = sph_src.resize((tw, th), Image.Resampling.LANCZOS)
        if f >= 244:
            vein_a = ease_in_out((f - 244.0) / 12.0)
            if vein_a < 0.99:
                s_arr = np.array(sph_scaled, dtype=np.float32)
                s_arr[:, :, :3] = s_arr[:, :, :3] * (0.68 + 0.32 * vein_a)
                sph_scaled = Image.fromarray(np.clip(s_arr, 0, 255).astype(np.uint8), mode="RGBA")
        img.alpha_composite(sph_scaled, (int(round(cx - tw / 2.0)), int(round(cy - th / 2.0))))

    # Deterministic rising warm volcanic ember sparks floating past glowing proto-Earth
    ember_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(ember_layer, "RGBA")
    for k in range(22):
        ex = (k * 137 + 55 + 16.0 * math.sin(f * 0.06 + k)) % 680 + 20
        ey = (880 - ((f - 235) * (1.8 + (k % 4) * 0.65) + k * 43)) % 760 + 180
        er = 1.4 + (k % 3) * 0.8
        ea = int(120 + 85 * (0.5 + 0.5 * math.sin(f * 0.15 + k * 1.7)))
        edraw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(254, 214, 138, ea))
    img = blend_screen(img, ember_layer)

    # Proscenium curved framing curtains with bevel highlights & cast shadows
    frame_img = _load_layer("molten_frame_v6.png")
    if frame_img is not None:
        img.alpha_composite(frame_img, (0, 0))

    # 2-Tier Parallax Volcanic Clouds (back tier w/ orange bounced rim + deep shadowed front tier)
    cloud_t = ease_in_out((f - 246.0) / 14.0) if f >= 246 else 0.0
    if cloud_t > 0.01:
        c_back = _load_layer("molten_clouds_v6_back.png")
        c_front = _load_layer("molten_clouds_v6_front.png")
        if c_back is not None and c_front is not None:
            y_back = int(round((1.0 - cloud_t) * 215.0 + 3.0 * math.sin(f * 0.04)))
            y_front = int(round((1.0 - cloud_t) * 285.0 - 2.0 * math.sin(f * 0.04)))
            img.alpha_composite(c_back, (0, y_back))
            img.alpha_composite(c_front, (0, y_front))
        else:
            clouds_img = _load_layer("molten_clouds_v5.png")
            if clouds_img is not None:
                img.alpha_composite(clouds_img, (0, int(round((1.0 - cloud_t) * 260.0))))

    return img


def render_primordial_ocean_scene(W, H, f, vector_shapes, as_viewport=False):
    """
    Sequence 3 & 4: ±04.00 KEHIDUPAN PERTAMA — V6 3-Plane DoF seabed, canopy shadow, Screen caustics & glossy microbes.
    """
    if as_viewport:
        full = render_primordial_ocean_scene(720, 1280, f, vector_shapes, as_viewport=False)
        return full.crop((360 - 212, 562 - 212, 360 + 212, 562 + 212)).resize((W, H), Image.Resampling.LANCZOS)

    bg_v6 = _load_layer("ocean_backdrop_v6.png") or _load_layer("ocean_backdrop_v5.png")
    img = bg_v6.copy() if bg_v6 is not None else Image.new("RGBA", (W, H), (28, 108, 112, 255))

    # Screen-blended luminous cyan bioluminescent aura + gentle breathing underwater pulse
    b_pulse = 0.92 + 0.08 * math.sin((f - 440) * 0.08)
    aura = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    adraw = ImageDraw.Draw(aura, "RGBA")
    adraw.ellipse([442 - 160, 578 - 160, 442 + 160, 578 + 160], fill=(142, 244, 226, int(115 * b_pulse)))
    adraw.ellipse([284 - 92, 444 - 92, 284 + 92, 444 + 92], fill=(130, 236, 220, int(68 * b_pulse)))
    # Ascending shimmering micro-bubbles drifting upward along caustic shafts
    for b_i in range(18):
        bx_u = (b_i * 179 + 64 + 8.0 * math.sin(f * 0.05 + b_i)) % 640 + 40
        by_u = (940 - ((f - 430) * (1.2 + (b_i % 3) * 0.5) + b_i * 49)) % 760 + 165
        br_u = 1.6 + (b_i % 3) * 1.0
        adraw.ellipse([bx_u - br_u, by_u - br_u, bx_u + br_u, by_u + br_u], fill=(224, 254, 250, 125))
    aura = aura.filter(ImageFilter.GaussianBlur(radius=34))
    img = blend_screen(img, aura)

    # Render microbes + shadows at 2x supersampling with subtle translucent glow & specular sheen
    ss = 2
    sh_layer = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    m_layer = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sh_layer, "RGBA")
    mdraw = ImageDraw.Draw(m_layer, "RGBA")

    dx = 4.5 * math.sin((f - 450) * 0.04)
    dy = 4.0 * math.cos((f - 450) * 0.035)

    rods = [
        (97, 296, 56, 15, -36),
        (473, 354, 58, 14, 88),
        (663, 493, 56, 14, -64),
        (16, 571, 54, 14, 34),
        (373, 627, 68, 16, -34),
        (387, 781, 52, 13, 76),
    ]
    for idx, (rx, ry, rlen, rrad, rang) in enumerate(rods):
        ox = (rx + dx * (1.0 if idx % 2 == 0 else -0.8)) * ss
        oy = (ry + dy * (0.8 if idx % 3 == 0 else -0.7)) * ss
        a = math.radians(rang)
        hx, hy = (rlen * 0.5 * ss) * math.cos(a), (rlen * 0.5 * ss) * math.sin(a)
        rr = rrad * ss
        p0, p1 = (ox - hx, oy - hy), (ox + hx, oy + hy)
        sp0, sp1 = (p0[0] + 4 * ss, p0[1] + 6 * ss), (p1[0] + 4 * ss, p1[1] + 6 * ss)
        sdraw.line([sp0, sp1], fill=(8, 36, 40, 135), width=int(rr * 2))
        sdraw.ellipse([sp0[0] - rr, sp0[1] - rr, sp0[0] + rr, sp0[1] + rr], fill=(8, 36, 40, 135))
        sdraw.ellipse([sp1[0] - rr, sp1[1] - rr, sp1[0] + rr, sp1[1] + rr], fill=(8, 36, 40, 135))
        mdraw.line([p0, p1], fill=(186, 238, 148, 240), width=int(rr * 2))
        mdraw.ellipse([p0[0] - rr, p0[1] - rr, p0[0] + rr, p0[1] + rr], fill=(186, 238, 148, 240))
        mdraw.ellipse([p1[0] - rr, p1[1] - rr, p1[0] + rr, p1[1] + rr], fill=(186, 238, 148, 240))
        # Subtle membrane highlight + twin nuclei
        mdraw.line([p0, p1], fill=(228, 254, 198, 110), width=max(3, int(rr * 0.55)))
        for ds in (-0.25, 0.25):
            dot_x = ox + (rlen * ds * ss) * math.cos(a)
            dot_y = oy + (rlen * ds * ss) * math.sin(a)
            dr = max(3, rr * 0.24)
            mdraw.ellipse([dot_x - dr, dot_y - dr, dot_x + dr, dot_y + dr], fill=(54, 120, 74, 235))

    chains = [
        (96, 542, 20, 11, 84),
        (128, 835, 22, 13, 24),
        (518, 636, 24, 14, 62),
        (656, 756, 19, 10, 36),
        (520, 908, 21, 12, 42),
        (698, 558, 19, 10, 68),
    ]
    for cx0, cy0, cstep, cbrad, cang in chains:
        a = math.radians(cang)
        for k in (-1, 0, 1):
            bx = (cx0 + k * cstep * math.cos(a) + dx * 0.5) * ss
            by = (cy0 + k * cstep * math.sin(a) + dy * 0.5) * ss
            br = cbrad * ss
            sdraw.ellipse([bx - br + 3 * ss, by - br + 5 * ss, bx + br + 3 * ss, by + br + 5 * ss], fill=(8, 36, 40, 125))
            mdraw.ellipse([bx - br, by - br, bx + br, by + br], fill=(166, 228, 234, 235), outline=(232, 254, 255, 245), width=2)
            ir = br * 0.36
            mdraw.ellipse([bx - ir, by - ir, bx + ir, by + ir], fill=(42, 120, 128, 235))

    cells = [
        (442, 578, 48),
        (284, 444, 30),
        (284, 679, 28),
        (628, 434, 28),
        (648, 444, 23),
        (2, 650, 26),
    ]
    for idx, (ccx, ccy, cr) in enumerate(cells):
        ox = (ccx + dx * (-0.7 if idx % 2 == 0 else 0.9)) * ss
        oy = (ccy + dy * (0.9 if idx % 2 == 0 else -0.6)) * ss
        r1 = cr * ss
        sdraw.ellipse([ox - r1 + 4 * ss, oy - r1 + 6 * ss, ox + r1 + 4 * ss, oy + r1 + 6 * ss], fill=(8, 36, 40, 140))
        mdraw.ellipse([ox - r1, oy - r1, ox + r1, oy + r1], fill=(168, 232, 224, 235), outline=(232, 255, 252, 245), width=3)
        r2 = r1 * 0.72
        mdraw.ellipse([ox - r2, oy - r2, ox + r2, oy + r2], fill=(204, 248, 240, 245), outline=(142, 212, 204, 220), width=2)
        # Translucent top-left glass crescent highlight
        mdraw.arc([ox - r1 * 0.85, oy - r1 * 0.85, ox + r1 * 0.85, oy + r1 * 0.85], start=198, end=275, fill=(252, 255, 255, 195), width=max(3, int(r1 * 0.08)))
        px, py, r3 = ox + r1 * 0.24, oy - r1 * 0.08, r1 * 0.25
        mdraw.ellipse([px - r3, py - r3, px + r3, py + r3], fill=(56, 128, 128, 240))

    bubbles = [(296, 610, 8), (382, 535, 7), (288, 755, 7), (555, 580, 6), (112, 560, 7), (435, 380, 7), (618, 346, 10), (156, 868, 8)]
    for bx, by, br in bubbles:
        bxx, byy, brr = bx * ss, (by + dy) * ss, br * ss
        mdraw.ellipse([bxx - brr, byy - brr, bxx + brr, byy + brr], outline=(218, 250, 250, 220), width=3)

    sh_down = sh_layer.filter(ImageFilter.GaussianBlur(radius=4.5)).resize((W, H), Image.Resampling.BILINEAR)
    m_down = m_layer.resize((W, H), Image.Resampling.LANCZOS)
    img = Image.alpha_composite(img, sh_down)
    img = Image.alpha_composite(img, m_down)
    return img


@functools.lru_cache(maxsize=2)
def _build_dino_sky_v5(W, H):
    """Smooth continuous radial twilight purple sky with organic gouache mottling (zero clip box artifacts)."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dist = np.clip(np.sqrt((xx - 360.0) ** 2 + (yy - 540.0) ** 2) / 530.0, 0.0, 1.0)
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    arr[:, :, 0] = (144 * (1.0 - dist) + 52 * dist).astype(np.uint8)
    arr[:, :, 1] = (92 * (1.0 - dist) + 34 * dist).astype(np.uint8)
    arr[:, :, 2] = (168 * (1.0 - dist) + 88 * dist).astype(np.uint8)
    sky = apply_gouache_mottle(Image.fromarray(arr, mode="RGB").convert("RGBA"), strength=0.075, seed=710, warm_bias=False)
    sdraw = ImageDraw.Draw(sky, "RGBA")
    for sx, sy, sr, sa in _STARS[:65]:
        if sy < 700:
            sdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(235, 215, 245, int(sa * 0.72)))
    return sky


def render_prehistoric_dinos_scene(W, H, f, vector_shapes, as_viewport=False):
    """
    Sequence 4, 5 & 6: 22.47 DINOSAURUS DATANG -> 23.39 ASTEROID • PUNAH.
    Uses smooth Bezier rim-lit dinosaurs, velvety gouache palms, cosmic cumulus smoke, & Screen-blended comet flame.
    """
    if as_viewport:
        full = render_prehistoric_dinos_scene(720, 1280, f, vector_shapes, as_viewport=False)
        return full.crop((360 - 212, 562 - 212, 360 + 212, 562 + 212)).resize((W, H), Image.Resampling.LANCZOS)

    img = _build_dino_sky_v5(W, H).copy()
    draw = ImageDraw.Draw(img, "RGBA")

    # 1. Smoothed Moon Crescent (shifts smoothly f=840..858)
    moon_shift = ease_in_out((f - 840.0) / 18.0) if f >= 840 else 0.0
    mx_off, my_off = -32.0 * moon_shift, 52.0 * moon_shift
    for poly in vector_shapes.get("dino_moon_2247", []):
        pts_m = smooth_closed_curve([(p[0] + mx_off, p[1] + my_off) for p in poly], n_out=60, sigma=1.4)
        if len(pts_m) >= 3:
            draw.polygon(pts_m, fill=(228, 186, 184, 248))

    # Faint gliding pterosaur silhouette (f = 710..900)
    if 710 <= f <= 900:
        px_p = 470 + 18 * math.sin((f - 710) * 0.03)
        py_p = 248 + 4 * math.cos((f - 710) * 0.04)
        draw.polygon([(px_p - 42, py_p + 2), (px_p - 6, py_p - 6), (px_p + 38, py_p + 1), (px_p, py_p + 3)], fill=(66, 42, 98, 175))

    # 2. Far Misty Prehistoric Palms (atmospheric perspective BEHIND plumes & dust)
    far_palms = _load_layer("palms_far_v6.png")
    if far_palms is not None and f < 952:
        fp_alpha = 1.0 if f < 936 else max(0.0, 1.0 - (f - 936.0) / 14.0)
        if fp_alpha < 0.99:
            r, g, b, a = far_palms.split()
            a = a.point(lambda p: int(p * fp_alpha))
            far_palms = Image.merge("RGBA", (r, g, b, a))
        img.alpha_composite(far_palms, (0, 0))

    # 2b. Billowing Cosmic Lavender Plume with comet-lit flank (f = 900..935)
    if 900 <= f <= 935:
        plume_img = _load_layer("asteroid_plume_v6.png") or _load_layer("asteroid_plume_v5.png")
        if plume_img is not None:
            pl_a = ease_in_out((f - 900.0) / 10.0)
            if pl_a < 0.99:
                r, g, b, a = plume_img.split()
                a = a.point(lambda p: int(p * pl_a))
                plume_img = Image.merge("RGBA", (r, g, b, a))
            img.alpha_composite(plume_img, (0, 0))

    # 3. Billowing Terracotta Gouache Post-Impact Dust Cloud (f >= 936) - STRICTLY BEHIND NEAR PALMS!
    dust_t = ease_in_out((f - 936.0) / 18.0) if f >= 936 else 0.0
    if f >= 936:
        dust_img = _load_layer("dust_clouds_v6.png") or _load_layer("dust_clouds_v5.png")
        if dust_img is not None:
            dust_y_off = int(round((1.0 - dust_t) * 200.0))
            alpha_d = min(1.0, dust_t * 1.2)
            if alpha_d < 0.99:
                r, g, b, a = dust_img.split()
                a = a.point(lambda p: int(p * alpha_d))
                dust_img = Image.merge("RGBA", (r, g, b, a))
            img.alpha_composite(dust_img, (0, dust_y_off))

    # 3b. Soft Valley Ground Mist separating background palms from foreground dinosaurs (f < 942)
    if f < 946:
        mist_a = 1.0 if f < 936 else max(0.0, 1.0 - (f - 936.0) / 10.0)
        mist = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        mdraw = ImageDraw.Draw(mist, "RGBA")
        mdraw.ellipse([-60, 740, 780, 960], fill=(164, 126, 196, int(round(88 * mist_a))))
        img = Image.alpha_composite(img, mist.filter(ImageFilter.GaussianBlur(radius=32)))

    # 4. Velvety Painterly Foreground Cycad Palms IN FRONT OF Orange Dust + Warm Orange Backlight Edge-Wrap!
    palms_img = _load_layer("palms_near_v6.png") or _load_layer("palms_layer_v5.png")
    if palms_img is not None:
        img.alpha_composite(palms_img, (0, 0))
    comet_heat = min(1.0, max(0.0, (f - 908.0) / 16.0)) if 908 <= f <= 935 else 0.0
    wrap_strength = max(comet_heat * 0.65, dust_t * 0.85 if f >= 936 else 0.0)
    if wrap_strength > 0.02:
        wrap_img = _load_layer("palms_backlight_v6.png")
        if wrap_img is not None:
            r, g, b, a = wrap_img.split()
            a = a.point(lambda p: int(p * wrap_strength))
            img = blend_screen(img, Image.merge("RGBA", (r, g, b, a)))

    draw = ImageDraw.Draw(img, "RGBA")
    # 5. Foreground Ground Hills (smooth spline crest + deep indigo earth)
    hill_top = [(0, 902), (140, 886), (265, 884), (390, 898), (540, 908), (720, 892)]
    hill_poly = hill_top + [(720, H), (0, H)]
    draw.polygon(hill_poly, fill=(50, 32, 82, 255))
    draw.line(hill_top, fill=(176, 146, 208, 210), width=2)

    # 5b. Fallen Extinction Dinosaur resting on foreground ridge (f >= 944, matching REF f=965!)
    if f >= 944:
        fallen_img = _load_layer("fallen_dino_v6.png")
        if fallen_img is not None:
            fl_in = ease_in_out((f - 944.0) / 16.0)
            if fl_in < 0.99:
                r, g, b, a = fallen_img.split()
                a = a.point(lambda p: int(p * fl_in))
                fallen_img = Image.merge("RGBA", (r, g, b, a))
            img.alpha_composite(fallen_img, (0, int(round((1.0 - fl_in) * 28.0))))
        # Floating glowing ash/ember specks drifting after impact
        ash_l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ash_d = ImageDraw.Draw(ash_l, "RGBA")
        for k in range(24):
            ax = (k * 167 + (f - 944) * (1.2 + (k % 3) * 0.4)) % 700 + 10
            ay = (k * 119 + 290 + (f - 944) * (0.9 + (k % 4) * 0.35)) % 620 + 260
            ar = 1.3 + (k % 3) * 0.7
            ash_d.ellipse([ax - ar, ay - ar, ax + ar, ay + ar], fill=(252, 206, 138, int(130 * dust_t)))
        img = blend_screen(img, ash_l)

    # 6. Smooth Rim-Lit Gouache Dinosaur Silhouettes + Grounded Contact Shadows + Dynamic Asteroid Re-Lighting!
    enter_t = ease_in_out((f - 702.0) / 26.0) if f < 730 else 1.0
    fall_t = ease_in_out((f - 942.0) / 23.0) if f >= 942 else 0.0
    if fall_t < 0.99:
        idle_bob = 1.6 * math.sin((f - 730) * 0.09) if 730 <= f < 942 else 0.0
        # Soft grounded dark contact shadow beneath feet on foreground hill
        if enter_t > 0.5 and fall_t < 0.3:
            cs_a = int(round(120 * (1.0 - fall_t / 0.3) * min(1.0, (enter_t - 0.5) * 2.0)))
            cs = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            csd = ImageDraw.Draw(cs, "RGBA")
            csd.ellipse([135, 895, 495, 938], fill=(22, 10, 36, cs_a))
            csd.ellipse([545, 900, 690, 940], fill=(22, 10, 36, cs_a))
            img = Image.alpha_composite(img, cs.filter(ImageFilter.GaussianBlur(radius=9)))

        bronto_img = _load_layer("bronto_layer.png")
        trex_img = _load_layer("trex_layer.png")
        bx = int(round((1.0 - enter_t) * (-80.0) + fall_t * (-55.0)))
        by = int(round((1.0 - enter_t) * 36.0 + fall_t * 430.0 + idle_bob))
        tx = int(round((1.0 - enter_t) * 140.0 + fall_t * 45.0))
        ty = int(round((1.0 - enter_t) * 14.0 + fall_t * 430.0 - idle_bob * 0.7))
        if bronto_img is not None:
            img.alpha_composite(bronto_img, (bx, by))
        if trex_img is not None:
            img.alpha_composite(trex_img, (tx, ty))
        # Dynamic motivated warm orange re-lighting spilling from descending comet onto dino backs!
        if comet_heat > 0.02:
            for lit_name, ox, oy in [("bronto_lit_v6.png", bx, by), ("trex_lit_v6.png", tx, ty)]:
                lit_im = _load_layer(lit_name)
                if lit_im is not None:
                    r, g, b, a = lit_im.split()
                    a = a.point(lambda p: int(p * comet_heat * 0.85))
                    shifted = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                    shifted.paste(Image.merge("RGBA", (r, g, b, a)), (ox, oy))
                    img = blend_screen(img, shifted)

    # 7. Streaking Blazing Asteroid (f = 900..934) with Screen-blended shockwave, corona, trailing sparks & heated bow shock
    if 900 <= f <= 934:
        df = f - 920.0
        hx = 367.0 + df * (-7.4)
        hy = 478.0 + df * (18.8)
        tx_far = hx + 315.0
        ty_far = hy - 500.0

        # Screen-blended fiery shockwave horizon glow + comet corona
        aglow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        agdraw = ImageDraw.Draw(aglow, "RGBA")
        if f >= 912:
            shock_t = min(1.0, (f - 912.0) / 14.0)
            agdraw.ellipse([70, 445, 650, 730], fill=(246, 166, 118, int(round(145 * shock_t))))
        agdraw.ellipse([hx - 155, hy - 135, hx + 155, hy + 175], fill=(254, 186, 134, 155))
        agdraw.polygon([(hx - 58, hy - 30), (hx + 58, hy + 30), (tx_far + 38, ty_far), (tx_far - 26, ty_far)], fill=(238, 128, 60, 155))
        aglow = aglow.filter(ImageFilter.GaussianBlur(radius=30))
        img = blend_screen(img, aglow)

        # Mid glowing soft fiery spear + cream core + trailing luminous ember sparks
        flame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        fdraw = ImageDraw.Draw(flame, "RGBA")
        fdraw.polygon([(hx - 36, hy - 18), (hx + 36, hy + 20), (tx_far + 20, ty_far), (tx_far - 14, ty_far)], fill=(236, 128, 56, 232))
        fdraw.polygon([(hx - 20, hy - 11), (hx + 20, hy + 11), (tx_far - 22, ty_far + 45)], fill=(255, 242, 212, 246))
        for sp_i in range(14):
            u_s = (sp_i + 0.5) / 14.0
            sx = hx + (tx_far - hx) * u_s + math.sin(sp_i * 3.7 + f * 0.25) * (24.0 + 18.0 * u_s)
            sy = hy + (ty_far - hy) * u_s + math.cos(sp_i * 2.9 + f * 0.22) * (18.0 + 14.0 * u_s)
            sr = 2.0 + (sp_i % 3) * 1.3
            fdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 224, 162, 215))
        flame = flame.filter(ImageFilter.GaussianBlur(radius=2.6))
        img = blend_screen(img, flame)

        draw = ImageDraw.Draw(img, "RGBA")
        # Gouache Asteroid Rock Head with heated incandescent bow-shock leading rim & 4 shaded tan craters
        rock_raw = [
            (hx - 46, hy + 10), (hx - 38, hy - 16), (hx - 14, hy - 42),
            (hx + 16, hy - 36), (hx + 38, hy - 12), (hx + 42, hy + 22),
            (hx + 18, hy + 46), (hx - 20, hy + 48), (hx - 44, hy + 30),
        ]
        rock_pts = smooth_closed_curve(rock_raw, n_out=72, sigma=1.4)
        draw.polygon(rock_pts, fill=(80, 48, 42, 255), outline=(248, 178, 96, 235))
        # White-hot bow-shock rim along lower-left impact face
        bow_pts = [p for p in rock_pts if p[1] > hy - 6 and p[0] < hx + 26]
        if len(bow_pts) >= 2:
            draw.line(bow_pts, fill=(255, 234, 186, 235), width=3)
        for cx_c, cy_c, cr_c in [(-14, -10, 7.5), (14, -14, 5.5), (-4, 22, 9.5), (20, 12, 4.5)]:
            draw.ellipse([hx + cx_c - cr_c, hy + cy_c - cr_c, hx + cx_c + cr_c, hy + cy_c + cr_c], fill=(176, 146, 126, 235), outline=(58, 34, 28, 160), width=1)

    # 8. White-Cream Impact Flash (f = 926..952)
    if 926 <= f <= 952:
        fl_a = ease_in_out((f - 926.0) / 10.0) if f <= 936 else (1.0 - ease_in_out((f - 936.0) / 16.0))
        alpha_i = int(round(248 * fl_a))
        if alpha_i > 0:
            flash_overlay = Image.new("RGBA", (W, H), (248, 242, 228, alpha_i))
            img = Image.alpha_composite(img, flash_overlay)

    return img


def render_post_impact_twilight_viewport(size, f, vector_shapes):
    """
    2x supersampled inner clock viewport for Sequences 6 & 7 (f >= 993) with painterly palms & gouache hills.
    """
    S = size * 2
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    u_y = yy / float(S)
    arr = np.zeros((S, S, 3), dtype=np.uint8)
    arr[:, :, 0] = (128 * (1.0 - u_y) + 84 * u_y).astype(np.uint8)
    arr[:, :, 1] = (84 * (1.0 - u_y) + 54 * u_y).astype(np.uint8)
    arr[:, :, 2] = (88 * (1.0 - u_y) + 76 * u_y).astype(np.uint8)
    img = apply_gouache_mottle(Image.fromarray(arr, mode="RGB").convert("RGBA"), strength=0.07, seed=808, warm_bias=True)

    palms_vp = _load_layer("twilight_palms_vp.png")
    if palms_vp is not None:
        img.alpha_composite(palms_vp.resize((S, S), Image.Resampling.LANCZOS), (0, 0))

    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse([-S * 0.1, S * 0.64, S * 0.65, S * 1.05], fill=(68, 44, 72, 255), outline=(148, 108, 128, 175), width=2)
    draw.ellipse([S * 0.35, S * 0.66, S * 1.1, S * 1.05], fill=(62, 40, 68, 255), outline=(148, 108, 128, 175), width=2)
    draw.polygon([(0, S * 0.76), (S * 0.5, S * 0.73), (S, S * 0.77), (S, S), (0, S)], fill=(44, 28, 82, 255))

    return img.resize((size, size), Image.Resampling.LANCZOS)
