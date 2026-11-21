"""
Procedural V6 Museum Astronomy Shadow-Box & Gouache Asset Builder for BlackHoleShort.

Generates 100% procedural painterly PNG layers (zero stock cutouts, zero flat shapes) using
`earth-24h/src/painterly_fx.py` and mirrors them to `public/black-hole/layers/` for Remotion.
Also builds `black-hole/out/assets_qa_sheet.jpg` for visual inspection before layout.
"""
from __future__ import annotations

import math
import os
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "earth-24h/src"))

from clock_rig import FONT_SERIF_BOLD, get_font
from painterly_fx import (
    apply_directional_lighting,
    apply_gouache_mottle,
    blend_screen,
    fbm_noise_2d,
    make_edge_light_wrap,
    render_directional_rim_overlay,
    render_rim_lit_silhouette,
    smooth_closed_curve,
)

LAYERS_DIR = PROJECT / "assets/layers"
PUBLIC_LAYERS = ROOT / "public/black-hole/layers"
OUT_DIR = PROJECT / "out"

LAYERS_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_LAYERS.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _build_gear_v6(r_outer, r_inner, num_teeth, r_hub, num_cutouts=6, style="spokes", is_gold=False, plane="near"):
    S = int((r_outer + 38) * 4)
    cx = cy = S / 2.0
    sc = 2.0
    r_o, r_i, r_h = r_outer * sc, r_inner * sc, r_hub * sc

    if plane == "far":
        body_col = (128, 92, 48, 222) if not is_gold else (144, 106, 56, 224)
        rim_col = (74, 48, 22, 232)
        hi_col = (182, 140, 82, 185)
    else:
        body_col = (186, 138, 66, 252) if is_gold else (164, 118, 56, 250)
        rim_col = (84, 52, 20, 248)
        hi_col = (242, 202, 124, 228)

    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    pts = []
    step = 2.0 * math.pi / num_teeth
    for k in range(num_teeth):
        a0 = k * step
        for a, rr in [
            (a0 - step * 0.28, r_i),
            (a0 - step * 0.16, r_o),
            (a0 + step * 0.16, r_o),
            (a0 + step * 0.28, r_i),
        ]:
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    draw.polygon(pts, fill=body_col, outline=rim_col)
    draw.ellipse([cx - r_i * 0.90, cy - r_i * 0.90, cx + r_i * 0.90, cy + r_i * 0.90], outline=hi_col, width=3)
    draw.ellipse([cx - r_i * 0.84, cy - r_i * 0.84, cx + r_i * 0.84, cy + r_i * 0.84], outline=rim_col, width=2)

    mask = Image.new("L", (S, S), 255)
    mdraw = ImageDraw.Draw(mask)
    if style == "circles":
        rc = (r_i * 0.80 - r_h) * 0.34
        rmid = (r_i * 0.80 + r_h) * 0.52
        for k in range(num_cutouts):
            a = k * (2.0 * math.pi / num_cutouts)
            hx, hy = cx + rmid * math.cos(a), cy + rmid * math.sin(a)
            mdraw.ellipse([hx - rc, hy - rc, hx + rc, hy + rc], fill=0)
            draw.ellipse([hx - rc, hy - rc, hx + rc, hy + rc], outline=rim_col, width=3)
    else:
        for k in range(num_cutouts):
            a0 = k * (2.0 * math.pi / num_cutouts) + 0.16
            a1 = (k + 1) * (2.0 * math.pi / num_cutouts) - 0.16
            poly = []
            for u in range(9):
                ang = a0 + (a1 - a0) * (u / 8.0)
                poly.append((cx + r_i * 0.77 * math.cos(ang), cy + r_i * 0.77 * math.sin(ang)))
            for u in range(8, -1, -1):
                ang = a0 + (a1 - a0) * (u / 8.0)
                poly.append((cx + (r_h + 10) * math.cos(ang), cy + (r_h + 10) * math.sin(ang)))
            mdraw.polygon(poly, fill=0)
            draw.polygon(poly, outline=rim_col)
    mdraw.ellipse([cx - r_h * 0.42, cy - r_h * 0.42, cx + r_h * 0.42, cy + r_h * 0.42], fill=0)
    draw.ellipse([cx - r_h, cy - r_h, cx + r_h, cy + r_h], outline=hi_col, width=3)

    arr = np.array(img, dtype=np.uint8)
    arr[:, :, 3] = np.minimum(arr[:, :, 3], np.array(mask, dtype=np.uint8))
    img = Image.fromarray(arr, mode="RGBA")

    sh_off = (14, 18) if plane == "near" else (8, 10)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh_arr = np.zeros((S, S, 4), dtype=np.uint8)
    sh_arr[:, :, :3] = [10, 6, 18]
    sh_arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * (0.54 if plane == "near" else 0.35)).astype(np.uint8)
    sh.paste(Image.fromarray(sh_arr, mode="RGBA"), sh_off)
    sh = sh.filter(ImageFilter.GaussianBlur(radius=10 if plane == "near" else 6))

    img = apply_gouache_mottle(img, strength=0.09, seed=int(r_outer * 19 + num_teeth), warm_bias=True, octaves=((24, 0.6), (8, 0.4)))
    img = apply_directional_lighting(img, light_dir=(-0.7, -0.7), strength=0.17, warm_shift=True)
    out = Image.alpha_composite(sh, img).resize((S // 2, S // 2), Image.Resampling.LANCZOS)
    if plane == "far":
        out = out.filter(ImageFilter.GaussianBlur(radius=0.8))
    return out


def build_astrolabe_and_gears_v6():
    """
    Victorian Observatory Gravitational Astrolabe Dial (2460x2460 -> 1230x1230):
    - 48 sculpted 3D gold scallops + starburst spikes + directional -45 deg lighting
    - Warm aged parchment chapter ring with engraved Schwarzschild Radius scale (3.0 RS -> 1.5 -> 1.0 -> 0.0)
    - Recessed gravity-zone track (r=258..274) with AO bevels
    - Physical inward diorama cast shadow (r<208) giving genuine shadow-box depth over black hole scenes!
    """
    S = 2460
    sc = 3.0
    cx = cy = S / 2.0

    outer_sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    osh_d = ImageDraw.Draw(outer_sh, "RGBA")
    r_sh = 358.0 * sc
    osh_d.ellipse([cx - r_sh + 14, cy - r_sh + 22, cx + r_sh + 14, cy + r_sh + 22], fill=(10, 6, 20, 165))
    outer_sh = outer_sh.filter(ImageFilter.GaussianBlur(radius=18))

    bezel = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bezel, "RGBA")

    # Dotted celestial azimuth ring (r = 402)
    r_dots = 402.0 * sc
    for i in range(72):
        a = math.radians(i * 5.0)
        dx, dy = cx + r_dots * math.cos(a), cy + r_dots * math.sin(a)
        dr = (3.0 if i % 6 == 0 else 1.9) * sc
        bdraw.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=(208, 178, 126, 200 if i % 6 == 0 else 155))

    # 48 Extended Observatory Sunray Spikes (alternating antique gold & burnished bronze)
    for i in range(48):
        a_mid = math.radians(i * 7.5)
        a_l = math.radians(i * 7.5 - 2.30)
        a_r = math.radians(i * 7.5 + 2.30)
        r_tip = (396.0 if i % 4 == 0 else 388.0) * sc
        p0 = (cx + 344 * sc * math.cos(a_l), cy + 344 * sc * math.sin(a_l))
        p1 = (cx + r_tip * math.cos(a_mid), cy + r_tip * math.sin(a_mid))
        p2 = (cx + 344 * sc * math.cos(a_r), cy + 344 * sc * math.sin(a_r))
        bdraw.polygon([p0, p1, p2], fill=(188, 152, 98, 224) if i % 2 == 0 else (130, 96, 62, 185))

    # 48 Sculpted 3D Gold Scallops with pin rivets
    for i in range(48):
        a = math.radians(i * 7.5)
        lx, ly, lr = cx + 340.0 * sc * math.cos(a), cy + 340.0 * sc * math.sin(a), 21.8 * sc
        bdraw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(112, 70, 24, 255), outline=(70, 40, 12, 245), width=2)
        bdraw.ellipse([lx - lr * 0.88 - 1, ly - lr * 0.88 - 2, lx + lr * 0.88 - 1, ly + lr * 0.88 - 2], fill=(170, 122, 54, 255))
        bdraw.ellipse([lx - lr * 0.62 - 3, ly - lr * 0.62 - 4, lx + lr * 0.62 - 3, ly + lr * 0.62 - 4], fill=(214, 166, 86, 255))
        px, py, pr = cx + 346.5 * sc * math.cos(a), cy + 346.5 * sc * math.sin(a), 2.5 * sc
        bdraw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(72, 42, 14, 240), outline=(232, 190, 114, 195), width=1)

    bezel = apply_directional_lighting(bezel, light_dir=(-0.7, -0.7), strength=0.18, warm_shift=True)
    plate_base = Image.alpha_composite(outer_sh, bezel)

    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / sc
    arr = np.array(plate_base, dtype=np.uint8)

    # Outer brass rim collar
    m_bez = (dist >= 329.5) & (dist <= 336.5)
    arr[m_bez] = [176, 132, 72, 255]

    # Warm parchment observatory chapter ring (r = 208..330)
    m_cr = (dist >= 208.0) & (dist < 330.0)
    u_out = np.clip((dist - 274.0) / (330.0 - 274.0), 0.0, 1.0)
    r_c = np.where(dist >= 274.0, 236 - 30 * (u_out ** 1.6), 242 - 12 * ((274.0 - dist) / 66.0))
    g_c = np.where(dist >= 274.0, 222 - 38 * (u_out ** 1.6), 228 - 15 * ((274.0 - dist) / 66.0))
    b_c = np.where(dist >= 274.0, 194 - 44 * (u_out ** 1.6), 200 - 18 * ((274.0 - dist) / 66.0))
    arr[m_cr, 0] = np.clip(r_c[m_cr], 0, 255).astype(np.uint8)
    arr[m_cr, 1] = np.clip(g_c[m_cr], 0, 255).astype(np.uint8)
    arr[m_cr, 2] = np.clip(b_c[m_cr], 0, 255).astype(np.uint8)
    arr[m_cr, 3] = 255

    # Recessed Gravity-Zone Groove (r = 258..274) with engraved AO
    m_gr = (dist >= 258.0) & (dist <= 274.0)
    u_g = np.clip((dist - 258.0) / 16.0, 0.0, 1.0)
    gr_shade = 1.0 - 0.16 * np.exp(-((1.0 - u_g) * 4.5)) - 0.10 * np.exp(-(u_g * 5.0))
    arr[m_gr, 0] = np.clip(204 * gr_shade[m_gr], 0, 255).astype(np.uint8)
    arr[m_gr, 1] = np.clip(194 * gr_shade[m_gr], 0, 255).astype(np.uint8)
    arr[m_gr, 2] = np.clip(174 * gr_shade[m_gr], 0, 255).astype(np.uint8)
    arr[m_gr, 3] = 255

    arr[dist < 208.0] = [0, 0, 0, 0]

    plate = apply_gouache_mottle(Image.fromarray(arr, mode="RGBA"), strength=0.06, seed=808, warm_bias=True, octaves=((96, 0.55), (36, 0.30), (14, 0.15)))
    plate = apply_directional_lighting(plate, light_dir=(-0.65, -0.75), strength=0.06, warm_shift=True)

    # Baked physical Inward Diorama Cast Shadow inside circular observatory lens (r < 208)
    dist_sh = np.sqrt((xx - (cx + 3.5 * sc)) ** 2 + (yy - (cy + 6.0 * sc)) ** 2) / sc
    p_arr = np.array(plate, dtype=np.uint8)
    m_in = dist < 208.0
    ao_all = np.clip((dist - 190.0) / 18.0, 0.0, 1.0) ** 1.85 * 84.0
    cast_dir = np.clip((dist_sh - 186.0) / 22.0, 0.0, 1.0) ** 1.65 * 96.0
    sh_alpha = np.clip(ao_all + cast_dir, 0.0, 140.0)
    p_arr[m_in, 0] = 16
    p_arr[m_in, 1] = 10
    p_arr[m_in, 2] = 26
    p_arr[m_in, 3] = sh_alpha[m_in].round().astype(np.uint8)
    plate = Image.fromarray(p_arr, mode="RGBA")

    draw = ImageDraw.Draw(plate, "RGBA")
    for r_ring, col, w in [
        (330.0, (112, 78, 38, 245), 2.5),
        (274.5, (142, 126, 102, 235), 2.1),
        (257.5, (248, 238, 214, 235), 1.9),
        (225.0, (152, 132, 102, 235), 2.2),
        (216.0, (252, 244, 222, 255), 2.8),
        (208.0, (118, 94, 68, 255), 3.2),
    ]:
        rr = r_ring * sc
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col, width=max(1, int(round(w * sc))))

    # 120 Fine Astronomical Vernier Ticks (every 3 degrees; major every 30 deg = 0.25 RS)
    for i in range(120):
        a = math.radians(-90.0 + i * 3.0)
        is_maj = (i % 10 == 0)
        is_mid = (i % 5 == 0)
        r_o0 = (311.0 if is_maj else (316.0 if is_mid else 321.0)) * sc
        r_o1 = 329.0 * sc
        draw.line(
            [cx + r_o0 * math.cos(a), cy + r_o0 * math.sin(a), cx + r_o1 * math.cos(a), cy + r_o1 * math.sin(a)],
            fill=(78, 64, 48, 240),
            width=max(1, int(round((2.6 if is_maj else 1.4) * sc))),
        )
        r_i0 = (233.0 if is_maj else 239.0) * sc
        r_i1 = (253.0 if is_maj else 249.0) * sc
        draw.line(
            [cx + r_i0 * math.cos(a), cy + r_i0 * math.sin(a), cx + r_i1 * math.cos(a), cy + r_i1 * math.sin(a)],
            fill=(78, 64, 48, 230),
            width=max(1, int(round((2.4 if is_maj else 1.3) * sc))),
        )

    # Engraved Schwarzschild Radius Scale (clockwise from top 3.0 RS -> 0.0 RS Singularity!)
    # Angles: 0 deg = 3.0 RS (top), 60 = 2.5, 120 = 2.0, 180 = 1.5 (FOTON), 240 = 1.0 (HORIZON), 300 = 0.5, 360 = 0.0
    scale_marks = [
        (0.0, "3.0", True, (76, 62, 46, 250)),
        (30.0, "2.75", False, (96, 82, 66, 220)),
        (60.0, "2.5", False, (76, 62, 46, 245)),
        (90.0, "2.25", False, (96, 82, 66, 220)),
        (120.0, "2.0", False, (76, 62, 46, 245)),
        (150.0, "1.75", False, (96, 82, 66, 220)),
        (180.0, "1.5", True, (176, 88, 32, 255)),   # Photon Sphere (amber-gold emphasis)
        (210.0, "1.25", False, (96, 82, 66, 220)),
        (240.0, "1.0", True, (178, 42, 34, 255)),   # Event Horizon (crimson emphasis!)
        (270.0, "0.75", False, (96, 82, 66, 220)),
        (300.0, "0.5", False, (76, 62, 46, 245)),
        (330.0, "0.25", False, (96, 82, 66, 220)),
    ]
    fnt_hero = get_font(FONT_SERIF_BOLD, 28.0 * sc)
    fnt_reg = get_font(FONT_SERIF_BOLD, 19.5 * sc)
    fnt_sub = get_font(FONT_SERIF_BOLD, 13.5 * sc)
    for deg, txt, is_hero, col in scale_marks:
        a = math.radians(-90.0 + deg)
        r_n = (296.0 if is_hero else 295.0) * sc
        nx, ny = cx + r_n * math.cos(a), cy + r_n * math.sin(a)
        fnt = fnt_hero if is_hero else (fnt_reg if len(txt) <= 3 else fnt_sub)
        bb = draw.textbbox((0, 0), txt, font=fnt)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        tx, ty = nx - tw / 2.0 - bb[0], ny - th / 2.0 - bb[1]
        draw.text((tx + 1.5, ty + 2.0), txt, font=fnt, fill=(252, 244, 224, 160))
        draw.text((tx, ty), txt, font=fnt, fill=col)

    # Engraved jewel pips at 1.5 RS (Photon Sphere, 180 deg) and 1.0 RS (Event Horizon, 240 deg)
    for deg, fill_c in [(180.0, (236, 158, 54, 255)), (240.0, (206, 56, 46, 255))]:
        a = math.radians(-90.0 + deg)
        px, py = cx + 244.0 * sc * math.cos(a), cy + 244.0 * sc * math.sin(a)
        dr = 6.5 * sc
        draw.polygon([(px, py - dr), (px + dr, py), (px, py + dr), (px - dr, py)], fill=fill_c, outline=(72, 42, 20, 245))

    plate.save(LAYERS_DIR / "black_hole_dial_v6_hi.png")
    plate_sm = plate.resize((1230, 1230), Image.Resampling.LANCZOS)
    plate_sm.save(LAYERS_DIR / "black_hole_dial_v6.png")

    _build_gear_v6(128, 110, 30, 24, 6, "spokes", False, plane="far").save(LAYERS_DIR / "gear_tl_lg.png")
    _build_gear_v6(78, 65, 19, 16, 6, "circles", False, plane="near").save(LAYERS_DIR / "gear_tl_md.png")
    _build_gear_v6(76, 64, 18, 14, 5, "circles", False, plane="near").save(LAYERS_DIR / "gear_br_md.png")
    _build_gear_v6(126, 108, 28, 22, 6, "spokes", True, plane="far").save(LAYERS_DIR / "gear_br_lg.png")


def build_accretion_disk_v6():
    """
    Painterly Interstellar-inspired Gargantua Black Hole with:
    - Physical relativistic Doppler beaming (left limb white-gold hot, right limb crimson-redshifted)
    - Upper & lower gravitationally lensed Einstein halo arches wrapping over/under the pitch-black shadow core
    - Razor-sharp glowing photon ring + swirling FBM gouache plasma filaments
    """
    S = 1100
    cx = cy = S / 2.0
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    dx = xx - cx
    dy = yy - cy
    r = np.sqrt(dx * dx + dy * dy)
    ang = np.arctan2(dy, dx)

    # Organic swirling gouache plasma noise warped azimuthally
    n1 = fbm_noise_2d(S, S, octaves=((90, 0.5), (32, 0.3), (12, 0.2)), seed=901)
    swirl = 0.55 + 0.45 * np.sin(r * 0.085 + ang * 3.0 + n1 * 5.2)

    # Relativistic Doppler beaming factor: left side (dx < 0) approaching = blazing bright; right (dx > 0) = deeper crimson
    doppler = np.clip(0.55 - 0.50 * (dx / 360.0), 0.18, 1.25)

    # 1. Upper & Lower Gravitationally Lensed Halo Arches (bent light from far side of disk)
    r_halo_top = np.sqrt((dx * 0.94) ** 2 + ((dy + 18.0) * 1.02) ** 2)
    arch_top = np.exp(-((r_halo_top - 178.0) / 36.0) ** 2) * np.clip((-dy + 30.0) / 90.0, 0.0, 1.0)
    r_halo_bot = np.sqrt((dx * 0.96) ** 2 + ((dy - 14.0) * 1.06) ** 2)
    arch_bot = np.exp(-((r_halo_bot - 172.0) / 28.0) ** 2) * np.clip((dy - 10.0) / 85.0, 0.0, 1.0) * 0.72
    halo_int = (arch_top + arch_bot) * (0.68 + 0.32 * swirl) * (0.55 + 0.55 * doppler)

    # 2. Tilted Main Equatorial Accretion Disk (foreground luminous ribbon crossing the front!)
    tilt = math.radians(-11.0)
    ct, st = math.cos(tilt), math.sin(tilt)
    rx = dx * ct - dy * st
    ry = dx * st + dy * ct
    # Elliptical distance for tilted ring (wide horizontally, flattened vertically)
    r_disk = np.sqrt((rx / 1.0) ** 2 + (ry / 0.25) ** 2)
    disk_radial = np.exp(-((r_disk - 265.0) / 118.0) ** 2) * np.clip((r_disk - 135.0) / 45.0, 0.0, 1.0)
    # Front-crossing luminous band (ry > -14) passes IN FRONT of shadow core!
    front_mask = np.clip((ry + 44.0) / 48.0, 0.0, 1.0)
    disk_int = disk_radial * (0.58 + 0.42 * swirl) * (0.45 + 0.78 * doppler)
    # Hot tight inner plasma band
    hot_ribbon = np.exp(-((ry - 8.0) / 14.0) ** 2) * np.exp(-((rx / 315.0) ** 2)) * (0.52 + 0.72 * doppler)

    # 3. Pitch-Black Event Horizon Shadow Core (r < 142) + Razor-Sharp Golden Photon Ring (r ~ 146)
    shadow_alpha = np.clip((145.0 - r) / 8.0, 0.0, 1.0)
    photon_ring = np.exp(-((r - 147.0) / 4.8) ** 2) * (0.72 + 0.42 * doppler)

    # Combine back halo (occluded by shadow) + shadow + front disk + photon ring
    back_light = np.clip((halo_int + disk_int * (1.0 - front_mask)) * (1.0 - shadow_alpha), 0.0, 1.8)
    front_light = np.clip(disk_int * front_mask * 1.15 + hot_ribbon * 0.95 + photon_ring * 1.15, 0.0, 2.0)
    total_I = np.clip(back_light + front_light, 0.0, 1.95)

    # Painterly thermal color ramp: deep crimson (#9e2418) -> burnt amber (#ea7628) -> warm gold (#fbd074) -> incandescent ivory (#fff9e4)
    # Shift warmer/redder on receding right side (low doppler) and hotter cream-white on approaching left!
    temp = np.clip(total_I * 0.78 + (doppler - 0.5) * 0.22, 0.0, 1.35)
    R = np.clip(np.interp(temp, [0.0, 0.25, 0.60, 0.95, 1.30], [72, 198, 246, 255, 255]), 0, 255)
    G = np.clip(np.interp(temp, [0.0, 0.25, 0.60, 0.95, 1.30], [20, 62, 148, 218, 248]), 0, 255)
    B = np.clip(np.interp(temp, [0.0, 0.25, 0.60, 0.95, 1.30], [34, 32, 58, 128, 224]), 0, 255)

    glow_alpha = np.clip((total_I / 0.68) ** 1.15 * 255.0, 0.0, 255.0)
    # Shadow interior stays pure velvety void (10, 6, 18) except where front disk crosses it
    front_a = np.clip((front_light / 0.72) * 255.0, 0.0, 255.0)
    out_r = np.where(shadow_alpha > 0.01, shadow_alpha * (10.0 * (1.0 - front_a / 255.0) + R * (front_a / 255.0)) + (1.0 - shadow_alpha) * R, R)
    out_g = np.where(shadow_alpha > 0.01, shadow_alpha * (6.0 * (1.0 - front_a / 255.0) + G * (front_a / 255.0)) + (1.0 - shadow_alpha) * G, G)
    out_b = np.where(shadow_alpha > 0.01, shadow_alpha * (18.0 * (1.0 - front_a / 255.0) + B * (front_a / 255.0)) + (1.0 - shadow_alpha) * B, B)
    out_a = np.clip(np.maximum(glow_alpha, shadow_alpha * 255.0), 0.0, 255.0)

    # Outer soft circular fade so sprite never hits square edge
    edge_fade = np.clip((520.0 - r) / 90.0, 0.0, 1.0)
    out_a *= edge_fade

    arr = np.stack([out_r, out_g, out_b, out_a], axis=-1).astype(np.uint8)
    img = Image.fromarray(arr, mode="RGBA")
    img = apply_gouache_mottle(img, strength=0.075, seed=902, warm_bias=True, octaves=((48, 0.6), (16, 0.4)))
    img.save(LAYERS_DIR / "accretion_disk_v6.png")


def build_cosmos_and_milkyway_v6():
    """
    1. Velvety deep-indigo gouache observatory backdrop (`cosmos_backdrop_v6.png`, 720x1280)
    2. Sweeping painterly Milky Way golden-lavender dust river (`milkyway_dust_v6.png`, 900x1280)
    """
    W, H = 720, 1280
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dist = np.clip(np.sqrt(((xx - W * 0.5) / 520.0) ** 2 + ((yy - H * 0.45) / 760.0) ** 2), 0.0, 1.0)
    n_neb = fbm_noise_2d(H, W, octaves=((180, 0.55), (70, 0.30), (24, 0.15)), seed=911)

    r_ch = 36 * (1.0 - dist) + 16 * dist + n_neb * 26
    g_ch = 26 * (1.0 - dist) + 12 * dist + n_neb * 16
    b_ch = 64 * (1.0 - dist) + 34 * dist + n_neb * 34
    arr = np.stack([np.clip(r_ch, 0, 255), np.clip(g_ch, 0, 255), np.clip(b_ch, 0, 255), np.full((H, W), 255)], axis=-1).astype(np.uint8)
    base = apply_gouache_mottle(Image.fromarray(arr, mode="RGBA"), strength=0.065, seed=912, warm_bias=False)

    # Crisp antique observatory starfield (dedicated overlay so alpha stays 255)
    rng = np.random.default_rng(913)
    stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stars, "RGBA")
    for _ in range(180):
        sx, sy = float(rng.uniform(10, W - 10)), float(rng.uniform(10, H - 10))
        sr = float(rng.uniform(0.8, 2.2))
        warm = rng.random() > 0.45
        col = (252, 236, 198, int(rng.integers(70, 210))) if warm else (206, 224, 254, int(rng.integers(65, 190)))
        sdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=col)
    # 12 delicate 4-point storybook star glints
    for _ in range(12):
        sx, sy = float(rng.uniform(40, W - 40)), float(rng.uniform(60, H - 160))
        sl = float(rng.uniform(6.0, 12.0))
        sdraw.line([(sx - sl, sy), (sx + sl, sy)], fill=(254, 240, 206, 165), width=1)
        sdraw.line([(sx, sy - sl), (sx, sy + sl)], fill=(254, 240, 206, 165), width=1)
        sdraw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=(255, 248, 224, 230))
    base = Image.alpha_composite(base, stars)
    base.save(LAYERS_DIR / "cosmos_backdrop_v6.png")

    # Milky Way diagonal dusty golden-violet band for S7 Sagittarius A*
    MW, MH = 900, 1280
    my, mx = np.mgrid[0:MH, 0:MW].astype(np.float32)
    # Diagonal axis from bottom-left to top-right passing through center
    u_diag = ((mx - MW * 0.5) * 0.62 + (my - MH * 0.48) * 0.78) / 260.0
    v_along = ((mx - MW * 0.5) * -0.78 + (my - MH * 0.48) * 0.62) / 680.0
    n_mw = fbm_noise_2d(MH, MW, octaves=((120, 0.5), (48, 0.3), (18, 0.2)), seed=920)
    n_dark = fbm_noise_2d(MH, MW, octaves=((80, 0.6), (26, 0.4)), seed=921)
    band = np.exp(-(u_diag ** 2) * 1.45) * np.exp(-(v_along ** 2) * 0.85)
    dust_rift = np.clip(1.0 - 0.55 * np.exp(-((u_diag - 0.12 * n_dark) ** 2) * 14.0), 0.35, 1.0)
    mw_I = np.clip(band * dust_rift * (0.65 + 0.65 * n_mw), 0.0, 1.3)
    mw_r = np.clip(155 + 95 * mw_I, 0, 255)
    mw_g = np.clip(122 + 92 * mw_I, 0, 255)
    mw_b = np.clip(175 + 45 * (1.0 - mw_I * 0.5), 0, 255)
    mw_a = np.clip(mw_I * 185.0, 0, 210)
    mw_img = Image.fromarray(np.stack([mw_r, mw_g, mw_b, mw_a], axis=-1).astype(np.uint8), mode="RGBA")
    # Star knots inside Milky Way band
    mw_st = Image.new("RGBA", (MW, MH), (0, 0, 0, 0))
    msd = ImageDraw.Draw(mw_st, "RGBA")
    rng2 = np.random.default_rng(922)
    for _ in range(260):
        t_pos = float(rng2.uniform(-540, 540))
        off_pos = float(rng2.normal(0, 95))
        px = MW * 0.5 - 0.78 * t_pos + 0.62 * off_pos
        py = MH * 0.48 + 0.62 * t_pos + 0.78 * off_pos
        if 10 < px < MW - 10 and 10 < py < MH - 10:
            sr = float(rng2.uniform(0.9, 2.4))
            msd.ellipse([px - sr, py - sr, px + sr, py + sr], fill=(255, 240, 200, int(rng2.integers(80, 220))))
    mw_img = Image.alpha_composite(mw_img, mw_st)
    mw_img.save(LAYERS_DIR / "milkyway_dust_v6.png")


def build_astronaut_and_watch_v6():
    """
    1. Detailed vintage storybook floating Astronaut (`astronaut_v6.png`, 480x680)
       with distinct spherical helmet, brass neck collar, PLSS backpack + antenna, articulated joints,
       weighted space boots, and reflective gold visor + Motivated fiery orange rim mask (`astronaut_lit_v6.png`).
    2. Antique Victorian Brass Pocket Watch (`pocket_watch_v6.png`, 440x520) for Scene 2 normal-time wrist clock!
    """
    W, H = 480, 680
    ss = 3
    Ws, Hs = W * ss, H * ss
    suit_dark = (42, 32, 74, 255)
    suit_mid = (66, 52, 108, 255)
    suit_hi = (118, 102, 166, 255)
    rim_lav = (224, 208, 252, 245)
    brass_c = (206, 160, 82, 255)
    brass_d = (118, 82, 36, 255)

    a_hi = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    ad = ImageDraw.Draw(a_hi, "RGBA")

    def S(x, y):
        return (x * ss, y * ss)

    def poly_s(pts, fill, outline=None, w=2):
        p = [S(x, y) for x, y in pts]
        ad.polygon(p, fill=fill)
        if outline:
            ad.line(p + [p[0]], fill=outline, width=w * ss, joint="curve")

    # 1. Trailing curved tether cable floating off backpack (storybook detail!)
    tether = []
    for k in range(28):
        u = k / 27.0
        tx = 152 - u * 110 + 18 * math.sin(u * math.pi * 2.2)
        ty = 250 - u * 165 + 22 * math.cos(u * math.pi * 1.5)
        tether.append(S(tx, ty))
    ad.line(tether, fill=(186, 170, 224, 175), width=int(2.2 * ss))

    # 2. Life-support PLSS backpack (behind upper torso) + brass antenna rod
    ad.line([S(172, 146), S(156, 84)], fill=(208, 176, 118, 240), width=int(2.4 * ss))
    ad.ellipse([152 * ss, 78 * ss, 160 * ss, 86 * ss], fill=(252, 224, 152, 255))
    ad.rounded_rectangle([148 * ss, 144 * ss, 208 * ss, 286 * ss], radius=14 * ss, fill=(36, 26, 64, 255), outline=rim_lav, width=2 * ss)
    ad.rounded_rectangle([158 * ss, 160 * ss, 196 * ss, 210 * ss], radius=6 * ss, fill=(54, 42, 92, 255), outline=(162, 146, 206, 190), width=int(1.5 * ss))

    # 3. Back arm (left balancing arm reaching gently left-down)
    poly_s([(188, 198), (144, 218), (112, 246), (92, 248), (82, 264), (96, 276), (122, 268), (156, 246), (194, 232)], suit_dark, rim_lav, 2)
    # Brass wrist cuff
    ad.line([S(110, 246), S(124, 268)], fill=brass_c, width=int(4.5 * ss))

    # 4. Left trailing leg (extended lower toward black hole gravity!)
    poly_s([(202, 326), (186, 420), (176, 514), (210, 520), (222, 426), (240, 344)], suit_dark, rim_lav, 2)
    # Knee ribs
    for ky in (418, 426, 434):
        ad.line([S(186, ky), S(220, ky + 4)], fill=suit_hi, width=int(1.8 * ss))
    # Weighted space boot (left)
    poly_s([(174, 512), (212, 518), (226, 548), (218, 566), (168, 560), (162, 540)], (32, 24, 56, 255), rim_lav, 2)
    ad.line([S(168, 554), S(218, 560)], fill=brass_c, width=int(4 * ss))

    # 5. Right bent leg (foreground dynamic floating pose)
    poly_s([(244, 330), (282, 396), (314, 480), (344, 466), (314, 384), (282, 318)], suit_mid, rim_lav, 2)
    for ky in (388, 396, 404):
        ad.line([S(278, ky + 6), S(312, ky - 8)], fill=suit_hi, width=int(1.8 * ss))
    # Weighted space boot (right)
    poly_s([(312, 478), (346, 464), (370, 488), (366, 512), (324, 522), (308, 504)], (34, 26, 60, 255), rim_lav, 2)
    ad.line([S(324, 514), S(366, 504)], fill=brass_c, width=int(4 * ss))

    # 6. Sculpted Torso Suit + Waist Harness + Chest Control Unit
    poly_s([(194, 178), (278, 176), (294, 244), (286, 336), (200, 340), (186, 248)], suit_mid, rim_lav, 2)
    # Waist belt & brass buckle
    ad.line([S(194, 294), S(288, 292)], fill=brass_d, width=int(12 * ss))
    ad.line([S(194, 292), S(288, 290)], fill=brass_c, width=int(5 * ss))
    ad.rounded_rectangle([232 * ss, 282 * ss, 254 * ss, 302 * ss], radius=3 * ss, fill=(238, 198, 114, 255), outline=brass_d, width=2 * ss)
    # Chest control module
    ad.rounded_rectangle([222 * ss, 212 * ss, 268 * ss, 256 * ss], radius=7 * ss, fill=(48, 36, 84, 255), outline=(196, 178, 236, 225), width=2 * ss)
    ad.ellipse([230 * ss, 222 * ss, 240 * ss, 232 * ss], fill=(248, 126, 76, 245))
    ad.ellipse([246 * ss, 222 * ss, 256 * ss, 232 * ss], fill=(122, 224, 214, 235))

    # 7. Front right arm reaching up toward light
    poly_s([(272, 184), (324, 168), (364, 142), (382, 140), (392, 152), (378, 168), (356, 174), (322, 204), (278, 224)], suit_mid, rim_lav, 2)
    ad.line([S(350, 148), S(364, 172)], fill=brass_c, width=int(4.5 * ss))

    # 8. Brass Neck Ring + Crisp Spherical Glass Helmet + Reflective Golden Visor
    ad.ellipse([204 * ss, 164 * ss, 276 * ss, 188 * ss], fill=brass_c, outline=brass_d, width=2 * ss)
    # Helmet dome
    ad.ellipse([196 * ss, 88 * ss, 286 * ss, 178 * ss], fill=(56, 44, 96, 255), outline=rim_lav, width=3 * ss)
    # Reflective antique gold dome visor facing right-forward
    ad.ellipse([222 * ss, 102 * ss, 280 * ss, 160 * ss], fill=(192, 138, 62, 255), outline=(252, 232, 176, 250), width=2 * ss)
    ad.ellipse([228 * ss, 106 * ss, 272 * ss, 148 * ss], fill=(236, 184, 96, 225))
    # Specular curved catchlight on visor glass
    ad.ellipse([234 * ss, 110 * ss, 258 * ss, 128 * ss], fill=(255, 248, 226, 200))
    ad.ellipse([260 * ss, 134 * ss, 268 * ss, 142 * ss], fill=(255, 240, 200, 150))

    astro = a_hi.resize((W, H), Image.Resampling.LANCZOS)
    astro = apply_gouache_mottle(astro, strength=0.075, seed=931, warm_bias=False)
    astro = apply_directional_lighting(astro, light_dir=(-0.6, -0.8), strength=0.14, warm_shift=False)
    astro.save(LAYERS_DIR / "astronaut_v6.png")

    # Motivated fiery orange under-glow rim mask strictly clipped to astronaut silhouette!
    wrap_orange = make_edge_light_wrap(astro, color=(255, 166, 72), radius=5.5, strength=0.88)
    # Weight intensity strongest toward bottom legs/boots (closest to black hole!)
    w_arr = np.array(wrap_orange, dtype=np.float32)
    yy_w = np.linspace(0.32, 1.0, H, dtype=np.float32)[:, None]
    w_arr[:, :, 3] = np.clip(w_arr[:, :, 3] * yy_w * 1.35, 0, 255)
    astro_lit = Image.fromarray(w_arr.astype(np.uint8), mode="RGBA")
    astro_lit.save(LAYERS_DIR / "astronaut_lit_v6.png")

    # 2. Victorian Antique Brass Pocket Watch (440x520) for Scene 2 Wrist-Time Contrast
    PW, PH = 440, 520
    ss = 2
    pw_s, ph_s = PW * ss, PH * ss
    wcx, wcy = pw_s / 2.0, ph_s * 0.56
    w_img = Image.new("RGBA", (pw_s, ph_s), (0, 0, 0, 0))
    wd = ImageDraw.Draw(w_img, "RGBA")

    # Top crown & suspension bow
    wd.ellipse([wcx - 56, wcy - 285, wcx + 56, wcy - 175], outline=(196, 150, 74, 255), width=16)
    wd.ellipse([wcx - 56, wcy - 285, wcx + 56, wcy - 175], outline=(104, 68, 24, 240), width=4)
    wd.rounded_rectangle([wcx - 28, wcy - 208, wcx + 28, wcy - 156], radius=10, fill=(182, 134, 60, 255), outline=(88, 56, 20, 255), width=4)

    # Outer brass case shadow + 3D bezel rings
    sh_w = Image.new("RGBA", (pw_s, ph_s), (0, 0, 0, 0))
    sh_wd = ImageDraw.Draw(sh_w, "RGBA")
    sh_wd.ellipse([wcx - 174 + 12, wcy - 174 + 18, wcx + 174 + 12, wcy + 174 + 18], fill=(10, 6, 20, 155))
    sh_w = sh_w.filter(ImageFilter.GaussianBlur(radius=16))

    wd.ellipse([wcx - 174, wcy - 174, wcx + 174, wcy + 174], fill=(134, 88, 34, 255), outline=(76, 46, 14, 255), width=5)
    wd.ellipse([wcx - 164, wcy - 164, wcx + 164, wcy + 164], fill=(204, 158, 82, 255))
    wd.ellipse([wcx - 148, wcy - 148, wcx + 148, wcy + 148], fill=(116, 78, 32, 255))
    # Cream enamel dial face
    wd.ellipse([wcx - 140, wcy - 140, wcx + 140, wcy + 140], fill=(244, 232, 204, 255), outline=(146, 118, 82, 255), width=4)
    wd.ellipse([wcx - 122, wcy - 122, wcx + 122, wcy + 122], outline=(170, 146, 112, 210), width=2)

    # 60 crisp watch ticks + Roman numerals XII, III, VI, IX
    for i in range(60):
        a = math.radians(-90.0 + i * 6.0)
        maj = (i % 5 == 0)
        r0 = 114 if maj else 122
        r1 = 134
        wd.line([wcx + r0 * math.cos(a), wcy + r0 * math.sin(a), wcx + r1 * math.cos(a), wcy + r1 * math.sin(a)], fill=(68, 52, 38, 240), width=4 if maj else 2)

    fnt_rom = get_font(FONT_SERIF_BOLD, 34)
    for deg, lbl in [(0, "XII"), (90, "III"), (180, "VI"), (270, "IX")]:
        a = math.radians(-90.0 + deg)
        nx, ny = wcx + 90 * math.cos(a), wcy + 90 * math.sin(a)
        bb = wd.textbbox((0, 0), lbl, font=fnt_rom)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        wd.text((nx - tw / 2 - bb[0], ny - th / 2 - bb[1]), lbl, font=fnt_rom, fill=(64, 48, 34, 248))

    w_img = apply_gouache_mottle(w_img, strength=0.06, seed=941, warm_bias=True)
    w_img = apply_directional_lighting(w_img, light_dir=(-0.7, -0.7), strength=0.16, warm_shift=True)
    # Soft glass catchlight crescent on upper-left of dial
    gl = Image.new("RGBA", (pw_s, ph_s), (0, 0, 0, 0))
    gld = ImageDraw.Draw(gl, "RGBA")
    gld.pieslice([wcx - 134, wcy - 134, wcx + 134, wcy + 134], start=195, end=295, fill=(255, 250, 236, 48))
    w_img = Image.alpha_composite(Image.alpha_composite(sh_w, w_img), gl)
    w_img.resize((PW, PH), Image.Resampling.LANCZOS).save(LAYERS_DIR / "pocket_watch_v6.png")


def build_asset_qa_sheet():
    """Creates a crisp visual review contact sheet of all procedural V6 Black Hole assets."""
    names = [
        ("black_hole_dial_v6.png", "Astrolabe Dial V6"),
        ("accretion_disk_v6.png", "Doppler Accretion Disk"),
        ("cosmos_backdrop_v6.png", "Gouache Cosmos Backdrop"),
        ("milkyway_dust_v6.png", "Milky Way Dust River"),
        ("astronaut_v6.png", "Astronaut Silhouette"),
        ("astronaut_lit_v6.png", "Astronaut Motivated Rim"),
        ("pocket_watch_v6.png", "Victorian Pocket Watch"),
        ("gear_tl_lg.png", "Antique Brass Gear"),
    ]
    tw, th = 320, 320
    sheet = Image.new("RGB", (tw * 4, th * 2), (20, 15, 34))
    sdraw = ImageDraw.Draw(sheet)
    for idx, (fname, title) in enumerate(names):
        col_i = idx % 4
        row_i = idx // 4
        ox, oy = col_i * tw, row_i * th
        # Dark velvet checker panel
        sdraw.rectangle([ox + 4, oy + 4, ox + tw - 4, oy + th - 4], fill=(24, 18, 42), outline=(88, 72, 118), width=1)
        im = Image.open(LAYERS_DIR / fname).convert("RGBA")
        im.thumbnail((tw - 24, th - 44), Image.Resampling.LANCZOS)
        px = ox + (tw - im.width) // 2
        py = oy + 32 + (th - 40 - im.height) // 2
        sheet.paste(im, (px, py), im)
        sdraw.rectangle([ox + 4, oy + 4, ox + tw - 4, oy + 28], fill=(12, 8, 22))
        sdraw.text((ox + 12, oy + 9), title, fill=(248, 222, 146))
    sheet.save(OUT_DIR / "assets_qa_sheet.jpg", quality=92)


def main():
    print("Building V6 Museum Astronomy Shadow-Box Painterly Assets for BlackHoleShort...")
    build_astrolabe_and_gears_v6()
    build_accretion_disk_v6()
    build_cosmos_and_milkyway_v6()
    build_astronaut_and_watch_v6()
    build_asset_qa_sheet()

    # Mirror lightweight Remotion layers to public/black-hole/layers/
    for p in LAYERS_DIR.glob("*.png"):
        if p.name.endswith("_hi.png"):
            continue
        shutil.copy2(p, PUBLIC_LAYERS / p.name)
    print(f"All V6 Black Hole assets generated & synced -> {PUBLIC_LAYERS}")
    print(f"Asset QA Sheet -> {OUT_DIR / 'assets_qa_sheet.jpg'}")


if __name__ == "__main__":
    main()
