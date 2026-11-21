import json
import math
import os
import shutil
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, r"d:\PROJECTS\z-automation-studio\earth-24h\src")
from painterly_fx import (
    apply_directional_lighting,
    apply_gouache_mottle,
    blend_screen,
    draw_tapered_magma_rivers,
    fbm_noise_2d,
    make_edge_light_wrap,
    points_to_smooth_svg_path,
    render_directional_rim_overlay,
    render_rim_lit_silhouette,
    smooth_closed_curve,
)
from clock_rig import FONT_SERIF_BOLD, get_font

ROOT = r"d:\PROJECTS\z-automation-studio\earth-24h"
LAYERS_DIR = os.path.join(ROOT, "assets", "layers")
REMOTION_PUBLIC_DIR = r"d:\PROJECTS\z-automation-studio\public\earth-24h"
REMOTION_LAYERS_DIR = os.path.join(REMOTION_PUBLIC_DIR, "layers")
REMOTION_VECTORS_TS = r"d:\PROJECTS\z-automation-studio\remotion\videos\earth-24h\painterlyVectors.ts"

os.makedirs(LAYERS_DIR, exist_ok=True)
os.makedirs(REMOTION_LAYERS_DIR, exist_ok=True)


def build_dinosaur_layers_v6():
    """
    Constructs anatomically refined smooth Bezier silhouettes for Brontosaurus, re-sculpted slender T-Rex
    (distinct neck, angular predatory skull/jaw, tiny forearms, lean stride), dynamic asteroid-lit rim masks,
    and the fallen foreground extinction silhouette (seen in REF f=965).
    """
    # 1. Brontosaurus (facing left, long arched neck, dome back, 4 pillar legs, tail passing behind T-Rex)
    bronto_raw = [
        (34, 468), (44, 453), (68, 452), (88, 463), (104, 488), (126, 522),
        (152, 574), (176, 602), (206, 612), (255, 600), (312, 594), (368, 602),
        (418, 622), (464, 654), (508, 682), (548, 700), (558, 715), (534, 734),
        (498, 742), (484, 795), (478, 922), (434, 922), (438, 808), (424, 766),
        (398, 772), (394, 845), (394, 922), (354, 922), (356, 822), (344, 768),
        (298, 770), (264, 774), (256, 845), (254, 922), (218, 922), (222, 832),
        (206, 778), (192, 842), (190, 922), (156, 922), (160, 815), (156, 738),
        (134, 640), (110, 568), (84, 512), (66, 488), (42, 482),
    ]
    bronto_smooth = smooth_closed_curve(bronto_raw, n_out=280, sigma=1.3)
    bronto_img = render_rim_lit_silhouette(
        720, 1280, bronto_smooth,
        fill_rgba=(52, 32, 80, 255),
        rim_rgba=(208, 186, 238, 238),
        rim_width=2.5,
        ss=3,
        mottle_seed=301,
    )
    bronto_img.save(os.path.join(LAYERS_DIR, "bronto_layer.png"))

    # Dynamic asteroid warm orange rim overlay facing upper-right toward comet (+0.45, -0.89)
    bronto_lit = render_directional_rim_overlay(
        720, 1280, bronto_smooth,
        light_dir=(0.42, -0.90),
        rim_rgba=(254, 184, 118, 245),
        rim_width=4.6,
        blur_r=2.4,
        ss=3,
    )
    bronto_lit.save(os.path.join(LAYERS_DIR, "bronto_lit_v6.png"))

    # 2. Re-sculpted Slender Predatory T-Rex / Carnosaur (REF f=780 anatomy: clear neck, open jaw, tiny forearms, lean thighs)
    trex_raw = [
        (456, 628), (468, 613), (496, 610), (528, 616), (554, 636), (578, 654),
        (612, 654), (656, 660), (696, 672), (735, 686), (735, 744), (684, 752),
        (658, 782), (650, 845), (652, 922), (620, 922), (624, 835), (614, 798),
        (600, 848), (596, 922), (568, 922), (572, 830), (562, 768), (540, 742),
        # Tiny tucked predatory forearms & slender throat
        (522, 744), (512, 736), (532, 728), (542, 712), (546, 686), (536, 664),
        (506, 666), (476, 658), (498, 646), (476, 638), (456, 634),
    ]
    trex_smooth = smooth_closed_curve(trex_raw, n_out=240, sigma=1.15)
    trex_img = render_rim_lit_silhouette(
        720, 1280, trex_smooth,
        fill_rgba=(50, 30, 76, 255),
        rim_rgba=(204, 182, 234, 232),
        rim_width=2.4,
        ss=3,
        mottle_seed=302,
    )
    trex_img.save(os.path.join(LAYERS_DIR, "trex_layer.png"))

    trex_lit = render_directional_rim_overlay(
        720, 1280, trex_smooth,
        light_dir=(0.25, -0.96),
        rim_rgba=(254, 182, 114, 245),
        rim_width=4.4,
        blur_r=2.2,
        ss=3,
    )
    trex_lit.save(os.path.join(LAYERS_DIR, "trex_lit_v6.png"))

    # 3. Fallen Extinction Dinosaur Silhouette resting darkly across foreground ridge (REF f=965)
    fallen_raw = [
        (36, 915), (96, 876), (174, 844), (242, 836), (308, 842), (376, 862),
        (434, 882), (484, 892), (516, 902), (472, 916), (382, 925), (210, 928), (42, 925),
    ]
    fallen_smooth = smooth_closed_curve(fallen_raw, n_out=160, sigma=1.6)
    fallen_img = render_rim_lit_silhouette(
        720, 1280, fallen_smooth,
        fill_rgba=(54, 34, 78, 255),
        rim_rgba=(236, 178, 134, 215),
        rim_width=2.5,
        ss=3,
        mottle_seed=303,
    )
    fallen_img.save(os.path.join(LAYERS_DIR, "fallen_dino_v6.png"))

    return points_to_smooth_svg_path(bronto_smooth), points_to_smooth_svg_path(trex_smooth)


def _draw_painterly_palm(draw, cx_t, top_y, bot_y, scale_p, frond_len, trunk_w, flip=False, tone="near"):
    if tone == "far":
        trunk_col = (94, 68, 134, 210)
        rachis_col = (158, 132, 194, 190)
        leaf_dark = (102, 74, 144, 195)
        leaf_lit = (146, 120, 186, 185)
    else:
        trunk_col = (56, 36, 92, 252)
        rachis_col = (148, 118, 188, 232)
        leaf_dark = (62, 40, 102, 240)
        leaf_lit = (128, 98, 170, 224)

    bend = -8.0 * scale_p if not flip else 8.0 * scale_p
    trunk_pts = []
    for k in range(12):
        u = k / 11.0
        wy = top_y + (bot_y - top_y) * u
        wx = cx_t + bend * math.sin(u * math.pi * 0.75) - trunk_w * (0.36 + 0.45 * (u ** 1.2))
        trunk_pts.append((wx, wy))
    for k in range(11, -1, -1):
        u = k / 11.0
        wy = top_y + (bot_y - top_y) * u
        wx = cx_t + bend * math.sin(u * math.pi * 0.75) + trunk_w * (0.36 + 0.45 * (u ** 1.2))
        trunk_pts.append((wx, wy))
    draw.polygon(trunk_pts, fill=trunk_col)

    angles = [-172, -154, -135, -114, -92, -70, -50, -30, -10, 194, 180, 16, 30]
    for idx, ang_deg in enumerate(angles):
        a = math.radians(ang_deg)
        flen = frond_len * (0.82 + 0.22 * ((idx % 3) / 2.0)) * scale_p
        spine = []
        for s_k in range(6):
            u = s_k / 5.0
            sx = cx_t + flen * u * math.cos(a)
            sy = top_y + flen * u * math.sin(a) + flen * 0.16 * (u ** 1.7)
            spine.append((sx, sy))
        draw.line(spine, fill=rachis_col, width=max(2, int(2.8 * scale_p)))

        num_leaf = 15
        for k in range(2, num_leaf):
            u = k / float(num_leaf)
            rx = cx_t + flen * u * math.cos(a)
            ry = top_y + flen * u * math.sin(a) + flen * 0.16 * (u ** 1.7)
            leaf_l = flen * 0.26 * math.sin(u * math.pi * 0.90 + 0.18)
            leaf_w = max(2.0, leaf_l * 0.15)
            for side in (-1.0, 1.0):
                la = a + side * 1.10
                lx_tip = rx + leaf_l * math.cos(la)
                ly_tip = ry + leaf_l * math.sin(la) + leaf_l * 0.12
                mx = (rx + lx_tip) * 0.5 + side * math.sin(la) * leaf_w
                my = (ry + ly_tip) * 0.5 - side * math.cos(la) * leaf_w
                draw.polygon([(rx, ry), (mx, my), (lx_tip, ly_tip), ((rx + lx_tip) * 0.5, (ry + ly_tip) * 0.5)], fill=leaf_dark if side > 0 else leaf_lit)


def build_palms_layers_v6():
    """Creates 2-plane atmospheric palms (far misty + near crisp) plus warm orange edge light-wrap mask."""
    ss = 2
    W, H = 720, 1280

    # Far misty background palms (lower contrast + subtle atmospheric blur)
    far_p = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(far_p, "RGBA")
    _draw_painterly_palm(fdraw, 168 * ss, 588 * ss, 912 * ss, ss * 0.72, 108, 10 * ss, flip=False, tone="far")
    _draw_painterly_palm(fdraw, 522 * ss, 565 * ss, 912 * ss, ss * 0.76, 112, 11 * ss, flip=True, tone="far")
    _draw_painterly_palm(fdraw, 634 * ss, 610 * ss, 912 * ss, ss * 0.68, 98, 10 * ss, flip=False, tone="far")
    far_down = far_p.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=1.1))
    far_down.save(os.path.join(LAYERS_DIR, "palms_far_v6.png"))

    # Near rich velvety foreground palms framing left & right cleanly
    near_p = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    ndraw = ImageDraw.Draw(near_p, "RGBA")
    _draw_painterly_palm(ndraw, 34 * ss, 445 * ss, 912 * ss, ss, 136, 15 * ss, flip=False, tone="near")
    _draw_painterly_palm(ndraw, 120 * ss, 555 * ss, 912 * ss, ss * 0.92, 120, 13 * ss, flip=True, tone="near")
    _draw_painterly_palm(ndraw, 588 * ss, 470 * ss, 912 * ss, ss, 140, 16 * ss, flip=False, tone="near")
    _draw_painterly_palm(ndraw, 668 * ss, 575 * ss, 912 * ss, ss * 0.88, 116, 13 * ss, flip=True, tone="near")
    _draw_painterly_palm(ndraw, 715 * ss, 515 * ss, 912 * ss, ss * 0.95, 122, 14 * ss, flip=False, tone="near")
    near_p = apply_gouache_mottle(near_p, strength=0.09, seed=404, warm_bias=False)
    near_down = near_p.resize((W, H), Image.Resampling.LANCZOS)
    near_down.save(os.path.join(LAYERS_DIR, "palms_layer_v5.png"))
    near_down.save(os.path.join(LAYERS_DIR, "palms_near_v6.png"))

    # Warm orange edge light-wrap mask strictly clipped inside near palms (for f=908..986 backlit glow!)
    wrap_img = make_edge_light_wrap(near_down, color=(254, 184, 114), radius=4.5, strength=0.72)
    wrap_img.save(os.path.join(LAYERS_DIR, "palms_backlight_v6.png"))

    # Twilight clock viewport palms
    S = 848
    tvp = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(tvp, "RGBA")
    sc = S / 424.0
    _draw_painterly_palm(tdraw, S * 0.22, S * 0.44, S * 0.86, sc * 0.68, 95, 10 * sc, flip=False, tone="near")
    _draw_painterly_palm(tdraw, S * 0.78, S * 0.40, S * 0.86, sc * 0.72, 102, 11 * sc, flip=True, tone="near")
    _draw_painterly_palm(tdraw, S * 0.88, S * 0.50, S * 0.86, sc * 0.55, 80, 8 * sc, flip=False, tone="near")
    tvp = apply_gouache_mottle(tvp, strength=0.09, seed=405, warm_bias=False)
    tvp.resize((424, 424), Image.Resampling.LANCZOS).save(os.path.join(LAYERS_DIR, "twilight_palms_vp.png"))


def build_ocean_backdrop_v6():
    """
    Gouache deep-teal ocean with Screen-blended volumetric caustic shafts, canopy drop shadow into water,
    depth-of-field far-plane blurred microbes, and 2-tier shadow-box seabed over embossed concentric ripples.
    """
    W, H = 720, 1280
    ss = 2
    Ws, Hs = W * ss, H * ss
    yy, xx = np.mgrid[0:Hs, 0:Ws].astype(np.float32)
    dist = np.clip(np.sqrt((xx - 360.0 * ss) ** 2 + (yy - 520.0 * ss) ** 2) / (590.0 * ss), 0.0, 1.0)
    arr = np.zeros((Hs, Ws, 4), dtype=np.uint8)
    arr[:, :, 0] = (50 * (1.0 - dist) + 14 * dist).astype(np.uint8)
    arr[:, :, 1] = (148 * (1.0 - dist) + 68 * dist).astype(np.uint8)
    arr[:, :, 2] = (150 * (1.0 - dist) + 74 * dist).astype(np.uint8)
    arr[:, :, 3] = 255
    base = apply_gouache_mottle(Image.fromarray(arr, mode="RGBA"), strength=0.11, seed=501, warm_bias=False)

    # Volumetric caustic light shafts (wide soft cone + bright inner pinpoint rays)
    beams_soft = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    beams_core = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    bsdraw = ImageDraw.Draw(beams_soft, "RGBA")
    bcdraw = ImageDraw.Draw(beams_core, "RGBA")
    tapered = [
        (210, 18, -20, 780),
        (285, 20, 82, 900),
        (362, 22, 224, 905),
        (434, 23, 434, 965),
        (515, 19, 608, 900),
        (586, 17, 735, 760),
    ]
    for tx, tw, bx, by in tapered:
        bsdraw.polygon([((tx - tw * 1.45) * ss, 105 * ss), ((tx + tw * 1.45) * ss, 105 * ss), ((bx + 6) * ss, by * ss), ((bx - 6) * ss, by * ss)], fill=(176, 246, 242, 125))
        bcdraw.polygon([((tx - tw * 0.52) * ss, 110 * ss), ((tx + tw * 0.52) * ss, 110 * ss), ((bx + 1.5) * ss, by * ss), ((bx - 1.5) * ss, by * ss)], fill=(228, 254, 250, 155))

    base = blend_screen(base, beams_soft.filter(ImageFilter.GaussianBlur(radius=18 * ss)))
    base = blend_screen(base, beams_core.filter(ImageFilter.GaussianBlur(radius=3 * ss)))

    # Far-plane soft Depth-of-Field microbes (blurred & misty low-contrast deep in ocean)
    far_m = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    fmd = ImageDraw.Draw(far_m, "RGBA")
    far_cells = [(145, 390, 18), (565, 340, 16), (210, 780, 15), (595, 675, 17), (105, 685, 14), (485, 480, 16), (320, 320, 14), (630, 840, 15)]
    for fx, fy, fr in far_cells:
        fmd.ellipse([(fx - fr) * ss, (fy - fr) * ss, (fx + fr) * ss, (fy + fr) * ss], fill=(122, 206, 204, 115), outline=(188, 244, 240, 130), width=2)
        fmd.ellipse([(fx - fr * 0.35) * ss, (fy - fr * 0.35) * ss, (fx + fr * 0.35) * ss, (fy + fr * 0.35) * ss], fill=(42, 122, 124, 110))
    far_m = far_m.filter(ImageFilter.GaussianBlur(radius=3.8 * ss))
    base = Image.alpha_composite(base, far_m)

    # Floating luminous plankton specks (dedicated overlay!)
    rng = np.random.default_rng(519)
    specks = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(specks, "RGBA")
    for _ in range(110):
        px, py = float(rng.uniform(20, W - 20)) * ss, float(rng.uniform(160, H - 220)) * ss
        pr = float(rng.uniform(1.3, 3.6)) * ss
        pdraw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(216, 252, 246, int(rng.integers(55, 150))))
    base = Image.alpha_composite(base, specks)

    # Top scalloped wave canopy casting physical shadow downward into water column!
    canopy_sh = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    csh_d = ImageDraw.Draw(canopy_sh, "RGBA")
    top_canopy = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(top_canopy, "RGBA")
    tdraw.rectangle([0, 0, Ws, 120 * ss], fill=(26, 106, 110, 255))
    top_lobes = [(50, 110, 82), (185, 102, 88), (328, 112, 90), (475, 106, 88), (618, 102, 86), (725, 112, 82)]
    for lx, ly, lr in top_lobes:
        csh_d.ellipse([(lx - lr) * ss, (ly - lr + 18) * ss, (lx + lr) * ss, (ly + lr + 18) * ss], fill=(8, 36, 40, 145))
        tdraw.ellipse([(lx - lr) * ss, (ly - lr) * ss, (lx + lr) * ss, (ly + lr) * ss], fill=(26, 106, 110, 255), outline=(96, 180, 182, 165), width=3)
    top_canopy = apply_gouache_mottle(top_canopy, strength=0.07, seed=502, warm_bias=False)
    base = Image.alpha_composite(base, canopy_sh.filter(ImageFilter.GaussianBlur(radius=14 * ss)))
    base = Image.alpha_composite(base, top_canopy)

    # 2-Tier Shadow-Box Seabed Mounds over embossed concentric seabed ripples
    sb_back = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    sbd = ImageDraw.Draw(sb_back, "RGBA")
    for lx, ly, lr in [(115, 985, 125), (275, 975, 130), (445, 985, 126), (610, 978, 132)]:
        sbd.ellipse([(lx - lr) * ss, (ly - lr) * ss, (lx + lr) * ss, (ly + lr) * ss], fill=(24, 92, 98, 255), outline=(88, 168, 170, 175), width=3)
    sb_back = apply_gouache_mottle(sb_back, strength=0.08, seed=504, warm_bias=False)

    sb_sh = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    sbsh_d = ImageDraw.Draw(sb_sh, "RGBA")
    seabed = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(seabed, "RGBA")
    for lx, ly, lr in [(45, 1025, 120), (195, 1015, 125), (345, 1025, 122), (495, 1015, 125), (645, 1022, 122)]:
        sbsh_d.ellipse([(lx - lr) * ss, (ly - lr - 10) * ss, (lx + lr) * ss, (ly + lr - 10) * ss], fill=(6, 26, 30, 150))
        sdraw.ellipse([(lx - lr) * ss, (ly - lr) * ss, (lx + lr) * ss, (ly + lr) * ss], fill=(18, 76, 82, 255), outline=(72, 148, 152, 180), width=3)
    sdraw.rectangle([0, 1030 * ss, Ws, Hs], fill=(16, 68, 74, 255))
    for lx, ly, lr in [(55, 1165, 115), (225, 1165, 125), (415, 1165, 125), (605, 1165, 125), (725, 1165, 110)]:
        for r_ring in (lr, lr * 0.78, lr * 0.56, lr * 0.34):
            sdraw.ellipse([(lx - r_ring) * ss, (ly - r_ring) * ss, (lx + r_ring) * ss, (ly + r_ring) * ss], outline=(58, 134, 138, 165), width=2)
    seabed = apply_gouache_mottle(seabed, strength=0.08, seed=503, warm_bias=False)

    base = Image.alpha_composite(base, sb_back)
    base = Image.alpha_composite(base, sb_sh.filter(ImageFilter.GaussianBlur(radius=10 * ss)))
    base = Image.alpha_composite(base, seabed)

    out_im = base.resize((W, H), Image.Resampling.LANCZOS)
    out_im.save(os.path.join(LAYERS_DIR, "ocean_backdrop_v5.png"))
    out_im.save(os.path.join(LAYERS_DIR, "ocean_backdrop_v6.png"))


def build_molten_and_dust_layers_v6():
    """
    V6 incandescent subsurface Molten Earth, 3-tier bounced-rim volcanic clouds, proscenium curtains,
    lit cosmic comet plume, and multi-plane terracotta extinction dust clouds.
    """
    W, H = 720, 1280
    cx, cy, r_sph = 360.0, 562.0, 212.0

    # 1. Molten Earth V6 Sphere (warm incandescent core + basalt patches + tapered thick-to-thin magma rivers!)
    sph_sz = 480
    scx = scy = sph_sz / 2.0
    yy, xx = np.mgrid[0:sph_sz, 0:sph_sz].astype(np.float32)
    sd = np.sqrt((xx - scx) ** 2 + (yy - scy) ** 2) / r_sph
    crust_noise = fbm_noise_2d(sph_sz, sph_sz, seed=601, octaves=((52, 0.50), (20, 0.32), (7, 0.18)))
    arr = np.zeros((sph_sz, sph_sz, 4), dtype=np.uint8)
    inside = sd <= 1.0
    u = np.clip(sd, 0.0, 1.0)
    # Brighter warm molten orange core darkening softly into cooled volcanic basalt plates near rim
    core_falloff = 1.0 - 0.44 * (u ** 1.35)
    plate_mod = 1.0 + 0.19 * crust_noise
    arr[inside, 0] = np.clip(218 * core_falloff[inside] * plate_mod[inside], 0, 255).astype(np.uint8)
    arr[inside, 1] = np.clip(102 * core_falloff[inside] * plate_mod[inside], 0, 255).astype(np.uint8)
    arr[inside, 2] = np.clip(38 * core_falloff[inside] * plate_mod[inside], 0, 255).astype(np.uint8)
    # Soft 1.5px edge feather
    arr[:, :, 3] = np.clip((1.0 - (sd - 0.992) / 0.014) * 255.0, 0, 255).astype(np.uint8)
    sph_base = Image.fromarray(arr, mode="RGBA")

    hotspots = [
        (354, 562, 24), (318, 532, 18), (398, 594, 19),
        (280, 526, 14), (336, 476, 14), (414, 636, 16),
        (306, 658, 14), (434, 538, 13), (254, 604, 13), (368, 636, 16),
    ]
    local_hs = [(scx + (hx - cx), scy + (hy - cy), hr) for (hx, hy, hr) in hotspots]
    magma_rivers = draw_tapered_magma_rivers(sph_sz, sph_sz, scx, scy, r_sph, local_hs, seed=77)
    sph_final = blend_screen(sph_base, magma_rivers)
    sph_final.save(os.path.join(LAYERS_DIR, "molten_sphere_v5.png"))
    sph_final.save(os.path.join(LAYERS_DIR, "molten_sphere_v6.png"))

    # 2. Proscenium curved side framing curtains with bevel highlight & cast shadow (REF f=270)
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f_sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(frame, "RGBA")
    fshd = ImageDraw.Draw(f_sh, "RGBA")
    left_curtain = [(0, 620), (42, 710), (96, 835), (144, 985), (144, 1280), (0, 1280)]
    right_curtain = [(720, 665), (678, 765), (638, 895), (610, 1045), (610, 1280), (720, 1280)]
    fshd.polygon([(p[0] + 10, p[1] + 4) for p in left_curtain], fill=(18, 6, 10, 125))
    fshd.polygon([(p[0] - 10, p[1] + 4) for p in right_curtain], fill=(18, 6, 10, 125))
    fdraw.polygon(left_curtain, fill=(64, 18, 22, 185))
    fdraw.line(left_curtain[:4], fill=(214, 134, 98, 175), width=2)
    fdraw.polygon(right_curtain, fill=(56, 16, 20, 175))
    fdraw.line(right_curtain[:4], fill=(198, 118, 88, 155), width=2)
    frame_comp = Image.alpha_composite(f_sh.filter(ImageFilter.GaussianBlur(radius=9)), frame)
    frame_comp.save(os.path.join(LAYERS_DIR, "molten_frame_v6.png"))

    # 3. 3-Tier Volcanic Maroon Clouds with warm orange bounced rim light from glowing planet above!
    # Back dusty rose-maroon cloud tier
    c_back = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_back_rim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cbd, cbrd = ImageDraw.Draw(c_back, "RGBA"), ImageDraw.Draw(c_back_rim, "RGBA")
    back_lobes = [(65, 848, 96), (200, 832, 88), (345, 868, 92), (485, 842, 90), (620, 834, 92), (710, 850, 86)]
    for lx, ly, lr in back_lobes:
        # Warm bounced orange glow strictly at top crest facing planet!
        cbrd.ellipse([lx - lr - 4, ly - lr - 9, lx + lr + 4, ly + lr - 4], fill=(244, 146, 86, 195))
        cbd.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(124, 42, 42, 255))
    cbd.rectangle([0, 860, W, H], fill=(124, 42, 42, 255))
    c_back_comp = apply_gouache_mottle(Image.alpha_composite(c_back_rim.filter(ImageFilter.GaussianBlur(radius=6)), c_back), strength=0.09, seed=602, warm_bias=True)
    c_back_comp.save(os.path.join(LAYERS_DIR, "molten_clouds_v6_back.png"))

    # Mid & Front shadow-box deep maroon cloud tier (casts crisp shadow over back clouds!)
    c_front_sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_front = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_front_rim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cfsh, cfd, cfrd = ImageDraw.Draw(c_front_sh, "RGBA"), ImageDraw.Draw(c_front, "RGBA"), ImageDraw.Draw(c_front_rim, "RGBA")
    front_lobes = [(90, 976, 134), (290, 962, 138), (505, 972, 142), (685, 978, 128)]
    for lx, ly, lr in front_lobes:
        cfsh.ellipse([lx - lr - 6, ly - lr - 14, lx + lr + 6, ly + lr], fill=(26, 6, 12, 165))
        cfrd.ellipse([lx - lr - 3, ly - lr - 5, lx + lr + 3, ly + lr - 2], fill=(192, 98, 80, 175))
        cfd.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(70, 18, 22, 255))
    cfd.rectangle([0, 982, W, H], fill=(70, 18, 22, 255))
    c_front_comp = Image.alpha_composite(c_front_sh.filter(ImageFilter.GaussianBlur(radius=10)), Image.alpha_composite(c_front_rim.filter(ImageFilter.GaussianBlur(radius=4)), c_front))
    c_front_comp = apply_gouache_mottle(c_front_comp, strength=0.09, seed=605, warm_bias=True)
    c_front_comp.save(os.path.join(LAYERS_DIR, "molten_clouds_v6_front.png"))
    # Combined fallback for compatibility
    Image.alpha_composite(c_back_comp, c_front_comp).save(os.path.join(LAYERS_DIR, "molten_clouds_v5.png"))

    # 4. Fluffy Billowing Cosmic Plume with warm-lit right flank facing blazing comet (REF f=920)
    plume = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pl_lit = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pldraw, pld = ImageDraw.Draw(plume, "RGBA"), ImageDraw.Draw(pl_lit, "RGBA")
    puffs = [
        (206, 434, 38), (242, 408, 46), (280, 382, 42), (314, 358, 40),
        (346, 336, 35), (376, 314, 30), (218, 394, 28), (264, 362, 32), (304, 334, 30), (182, 448, 28),
    ]
    for lx, ly, lr in puffs:
        pldraw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(138, 100, 172, 200))
        # Warm illuminated peach-lavender crescent facing right-down toward blazing comet!
        pld.ellipse([lx - lr * 0.68 + 8, ly - lr * 0.68 + 4, lx + lr * 0.68 + 8, ly + lr * 0.68 + 4], fill=(226, 178, 212, 145))
    plume_comp = Image.alpha_composite(plume.filter(ImageFilter.GaussianBlur(radius=5)), pl_lit.filter(ImageFilter.GaussianBlur(radius=7)))
    plume_comp = apply_gouache_mottle(plume_comp, strength=0.13, seed=603, warm_bias=False)
    plume_comp.save(os.path.join(LAYERS_DIR, "asteroid_plume_v5.png"))
    plume_comp.save(os.path.join(LAYERS_DIR, "asteroid_plume_v6.png"))

    # 5. Multi-Tiered Terracotta Gouache Post-Impact Dust Cloud Bank (bright backlit upper rim + warm base + fleeing dinos)
    dust_back_rim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dust = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    drd, ddraw = ImageDraw.Draw(dust_back_rim, "RGBA"), ImageDraw.Draw(dust, "RGBA")
    dust_lobes = [(25, 420, 108), (175, 402, 108), (325, 412, 110), (465, 434, 102), (610, 444, 106), (710, 458, 96)]
    for lx, ly, lr in dust_lobes:
        drd.ellipse([lx - lr - 7, ly - lr - 10, lx + lr + 7, ly + lr + 4], fill=(252, 206, 142, 215))
        ddraw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(206, 124, 74, 255))
    ddraw.rectangle([0, 430, W, 915], fill=(206, 124, 74, 255))
    # Subtle warmer upper sunlit gradient vs richer ochre lower dust
    dust_comp = Image.alpha_composite(dust_back_rim.filter(ImageFilter.GaussianBlur(radius=8)), dust)
    dust_comp = apply_gouache_mottle(dust_comp, strength=0.11, seed=604, warm_bias=True)
    dust_comp = apply_directional_lighting(dust_comp, light_dir=(0.0, -1.0), strength=0.10, warm_shift=True)

    ddraw = ImageDraw.Draw(dust_comp, "RGBA")
    ridge_top = [(0, 815), (110, 800), (220, 792), (380, 798), (520, 782), (615, 775), (720, 790)]
    ddraw.polygon(ridge_top + [(720, 915), (0, 915)], fill=(116, 78, 126, 255))
    ddraw.line(ridge_top, fill=(216, 166, 162, 205), width=2)
    for dx_m, dy_m in [(470, 784), (568, 776), (652, 782)]:
        ddraw.ellipse([dx_m - 12, dy_m - 7, dx_m + 10, dy_m + 5], fill=(96, 62, 110, 255))
        ddraw.line([dx_m - 10, dy_m, dx_m - 22, dy_m - 14], fill=(96, 62, 110, 255), width=4)
        ddraw.line([dx_m + 8, dy_m + 2, dx_m + 24, dy_m + 4], fill=(96, 62, 110, 255), width=3)
    dust_comp.save(os.path.join(LAYERS_DIR, "dust_clouds_v5.png"))
    dust_comp.save(os.path.join(LAYERS_DIR, "dust_clouds_v6.png"))


def _build_gear_v6(r_outer, r_inner, r_hub, num_teeth, num_holes, hole_mode, has_rivets, plane="near"):
    ss = 2
    S = int(math.ceil((r_outer + 14) * 2 * ss))
    cx = cy = S / 2.0
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sdraw, draw = ImageDraw.Draw(sh, "RGBA"), ImageDraw.Draw(img, "RGBA")

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

    # Physical drop shadow onto starry backdrop
    sh_off = (7, 10) if plane == "near" else (4, 6)
    sdraw.polygon([(p[0] + sh_off[0], p[1] + sh_off[1]) for p in pts], fill=(10, 4, 16, 150 if plane == "near" else 115))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=4.0 if plane == "near" else 2.5))

    fill_col = (132, 94, 42, 255) if plane == "near" else (106, 76, 34, 255)
    rim_col = (194, 148, 78, 245) if plane == "near" else (152, 114, 58, 225)
    draw.polygon(pts, fill=fill_col, outline=rim_col)
    draw.ellipse([cx - ri * 0.94, cy - ri * 0.94, cx + ri * 0.94, cy + ri * 0.94], outline=(168, 126, 62, 195), width=2)

    if hole_mode == "circles":
        r_ring = (ri * 0.78 + rh * 1.35) * 0.5
        r_hole_cut = (ri * 0.78 - rh * 1.35) * 0.36
        for k in range(num_holes):
            a = math.radians(k * (360.0 / num_holes))
            hx, hy = cx + r_ring * math.cos(a), cy + r_ring * math.sin(a)
            draw.ellipse([hx - r_hole_cut, hy - r_hole_cut, hx + r_hole_cut, hy + r_hole_cut], fill=(0, 0, 0, 0), outline=rim_col, width=2)
    else:
        r_cut_out, r_cut_in = ri * 0.78, rh * 1.35
        for s in range(num_holes):
            a0 = math.radians(s * (360.0 / num_holes) + 11.0)
            a1 = math.radians((s + 1) * (360.0 / num_holes) - 11.0)
            arc_pts = [(cx + r_cut_out * math.cos(a0 + (a1 - a0) * k / 12.0), cy + r_cut_out * math.sin(a0 + (a1 - a0) * k / 12.0)) for k in range(13)]
            arc_pts += [(cx + r_cut_in * math.cos(a0 + (a1 - a0) * k / 12.0), cy + r_cut_in * math.sin(a0 + (a1 - a0) * k / 12.0)) for k in range(12, -1, -1)]
            draw.polygon(arc_pts, fill=(0, 0, 0, 0), outline=rim_col)

    if has_rivets:
        r_riv = ri * 0.88
        for k in range(num_teeth):
            a = math.radians(k * (360.0 / num_teeth) + 4.0)
            rx, ry = cx + r_riv * math.cos(a), cy + r_riv * math.sin(a)
            draw.ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=(72, 46, 16, 230))

    r_hole = rh * 0.54
    draw.ellipse([cx - rh, cy - rh, cx + rh, cy + rh], fill=(148, 108, 48, 255), outline=(204, 160, 88, 245), width=2)
    draw.ellipse([cx - r_hole, cy - r_hole, cx + r_hole, cy + r_hole], fill=(0, 0, 0, 0), outline=rim_col, width=2)

    img = apply_gouache_mottle(img, strength=0.09, seed=int(r_outer * 13 + num_teeth), warm_bias=True, octaves=((24, 0.6), (8, 0.4)))
    img = apply_directional_lighting(img, light_dir=(-0.7, -0.7), strength=0.16, warm_shift=True)
    comp = Image.alpha_composite(sh, img)
    out = comp.resize((S // 2, S // 2), Image.Resampling.LANCZOS)
    if plane == "far":
        out = out.filter(ImageFilter.GaussianBlur(radius=0.75))
    return out


def build_clock_and_gears_v6():
    """
    V6 Paper-Cut Shadow-Box 2460x2460 Celestial Clock Dial:
    - Extended antique sunburst rays + soft outer cast shadow over gears
    - Global directional top-left key light (-45 deg) across 48 sculpted gold scallops
    - Recessed era groove with AO inner edge shadow + catchlight bevel
    - Baked inward diorama cast shadow lip (r=182..208) giving genuine 3D shadow-box depth over every viewport scene!
    """
    S = 2460
    sc = 3.0
    cx = cy = S / 2.0

    # 1. Outer drop shadow beneath scalloped bezel onto gears + extended sunrays
    outer_sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    osh_d = ImageDraw.Draw(outer_sh, "RGBA")
    r_sh = 358.0 * sc
    osh_d.ellipse([cx - r_sh + 14, cy - r_sh + 22, cx + r_sh + 14, cy + r_sh + 22], fill=(12, 6, 20, 155))
    outer_sh = outer_sh.filter(ImageFilter.GaussianBlur(radius=18))

    bezel = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bezel, "RGBA")

    # Dotted perimeter ring (r = 402)
    r_dots = 402.0 * sc
    for i in range(72):
        a = math.radians(i * 5.0)
        dx, dy, dr = cx + r_dots * math.cos(a), cy + r_dots * math.sin(a), 2.1 * sc
        bdraw.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=(172, 148, 114, 175))

    # 48 Extended Sunray Spikes (r = 344..394)
    for i in range(48):
        a_mid = math.radians(i * 7.5)
        a_l = math.radians(i * 7.5 - 2.35)
        a_r = math.radians(i * 7.5 + 2.35)
        p0 = (cx + 344 * sc * math.cos(a_l), cy + 344 * sc * math.sin(a_l))
        p1 = (cx + 394 * sc * math.cos(a_mid), cy + 394 * sc * math.sin(a_mid))
        p2 = (cx + 344 * sc * math.cos(a_r), cy + 344 * sc * math.sin(a_r))
        bdraw.polygon([p0, p1, p2], fill=(176, 146, 102, 215) if i % 2 == 0 else (128, 98, 66, 180))

    # 48 Sculpted 3D Gold Scallop Lobes with bevel highlights + pin rivets
    for i in range(48):
        a = math.radians(i * 7.5)
        lx, ly, lr = cx + 340.0 * sc * math.cos(a), cy + 340.0 * sc * math.sin(a), 21.8 * sc
        bdraw.ellipse([lx - lr, ly - lr, lx + lr, ly + lr], fill=(116, 74, 26, 255), outline=(76, 44, 14, 240), width=2)
        bdraw.ellipse([lx - lr * 0.88 - 1, ly - lr * 0.88 - 2, lx + lr * 0.88 - 1, ly + lr * 0.88 - 2], fill=(166, 118, 52, 255))
        bdraw.ellipse([lx - lr * 0.62 - 3, ly - lr * 0.62 - 4, lx + lr * 0.62 - 3, ly + lr * 0.62 - 4], fill=(198, 152, 78, 255))
        px, py, pr = cx + 346.5 * sc * math.cos(a), cy + 346.5 * sc * math.sin(a), 2.6 * sc
        bdraw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(74, 42, 14, 240), outline=(224, 182, 108, 185), width=1)

    # Apply global top-left directional metallic lighting to bezel & sunburst!
    bezel = apply_directional_lighting(bezel, light_dir=(-0.7, -0.7), strength=0.17, warm_shift=True)
    plate_base = Image.alpha_composite(outer_sh, bezel)

    # Vectorized chapter rings, recessed era groove with AO, & baked inward diorama cast shadow!
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / sc
    arr = np.array(plate_base, dtype=np.uint8)

    m_bez = (dist >= 329.5) & (dist <= 336.5)
    arr[m_bez] = [168, 126, 70, 255]

    m_cr = (dist >= 208.0) & (dist < 330.0)
    u_out = np.clip((dist - 274.0) / (330.0 - 274.0), 0.0, 1.0)
    r_c = np.where(dist >= 274.0, 238 - 32 * (u_out ** 1.6), 244 - 12 * ((274.0 - dist) / 66.0))
    g_c = np.where(dist >= 274.0, 223 - 39 * (u_out ** 1.6), 230 - 15 * ((274.0 - dist) / 66.0))
    b_c = np.where(dist >= 274.0, 194 - 46 * (u_out ** 1.6), 200 - 19 * ((274.0 - dist) / 66.0))
    arr[m_cr, 0] = np.clip(r_c[m_cr], 0, 255).astype(np.uint8)
    arr[m_cr, 1] = np.clip(g_c[m_cr], 0, 255).astype(np.uint8)
    arr[m_cr, 2] = np.clip(b_c[m_cr], 0, 255).astype(np.uint8)
    arr[m_cr, 3] = 255

    # Recessed Era Groove (r = 258..274) with engraved AO shadow near outer lip & subtle highlight near inner lip
    m_gr = (dist >= 258.0) & (dist <= 274.0)
    u_g = np.clip((dist - 258.0) / 16.0, 0.0, 1.0)
    gr_shade = 1.0 - 0.14 * np.exp(-((1.0 - u_g) * 4.5)) - 0.08 * np.exp(-(u_g * 5.0))
    arr[m_gr, 0] = np.clip(208 * gr_shade[m_gr], 0, 255).astype(np.uint8)
    arr[m_gr, 1] = np.clip(198 * gr_shade[m_gr], 0, 255).astype(np.uint8)
    arr[m_gr, 2] = np.clip(178 * gr_shade[m_gr], 0, 255).astype(np.uint8)
    arr[m_gr, 3] = 255

    # Clear inside inner viewport first before gouache mottling
    arr[dist < 208.0] = [0, 0, 0, 0]

    plate = apply_gouache_mottle(Image.fromarray(arr, mode="RGBA"), strength=0.058, seed=707, warm_bias=True, octaves=((96, 0.55), (36, 0.30), (14, 0.15)))
    plate = apply_directional_lighting(plate, light_dir=(-0.65, -0.75), strength=0.055, warm_shift=True)

    # Bake physical Inward Diorama Cast Shadow inside circular viewport hole (r < 208)!
    # Offset shadow source slightly down-right (+3.5, +6.0) dial units to match top-left key light!
    dist_sh = np.sqrt((xx - (cx + 3.5 * sc)) ** 2 + (yy - (cy + 6.0 * sc)) ** 2) / sc
    p_arr = np.array(plate, dtype=np.uint8)
    m_in = dist < 208.0
    # Shadow strongest right under upper-left lip (where dist_sh > 184) and gentle ambient occlusion all around (dist > 192)
    ao_all = np.clip((dist - 192.0) / 16.0, 0.0, 1.0) ** 1.9 * 74.0
    cast_dir = np.clip((dist_sh - 188.0) / 20.0, 0.0, 1.0) ** 1.7 * 88.0
    sh_alpha = np.clip(ao_all + cast_dir, 0.0, 128.0)
    p_arr[m_in, 0] = 24
    p_arr[m_in, 1] = 14
    p_arr[m_in, 2] = 26
    p_arr[m_in, 3] = sh_alpha[m_in].round().astype(np.uint8)
    plate = Image.fromarray(p_arr, mode="RGBA")

    draw = ImageDraw.Draw(plate, "RGBA")
    # Crisp concentric embossed bevel rings & shadow lips
    for r_ring, col, w in [
        (330.0, (112, 78, 38, 240), 2.4),
        (274.5, (148, 132, 108, 230), 2.0),
        (257.5, (246, 236, 212, 230), 1.8),
        (225.0, (158, 138, 108, 235), 2.2),
        (216.0, (252, 244, 222, 255), 2.8),
        (208.0, (124, 102, 76, 255), 3.0),
    ]:
        rr = r_ring * sc
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col, width=max(1, int(round(w * sc))))

    # 96 Ticks
    for i in range(96):
        a = math.radians(-90.0 + i * (360.0 / 96.0))
        is_hr = (i % 4 == 0)
        r_o0, r_o1 = (312.0 if is_hr else 320.0) * sc, 329.0 * sc
        draw.line([cx + r_o0 * math.cos(a), cy + r_o0 * math.sin(a), cx + r_o1 * math.cos(a), cy + r_o1 * math.sin(a)], fill=(82, 68, 50, 236), width=max(1, int(round((2.5 if is_hr else 1.4) * sc))))
        r_i0, r_i1 = (234.0 if is_hr else 238.0) * sc, (253.0 if is_hr else 250.0) * sc
        draw.line([cx + r_i0 * math.cos(a), cy + r_i0 * math.sin(a), cx + r_i1 * math.cos(a), cy + r_i1 * math.sin(a)], fill=(82, 68, 50, 230), width=max(1, int(round((2.4 if is_hr else 1.4) * sc))))

    # Classic inked serif numerals with subtle recessed emboss catchlight
    fnt_reg = get_font(FONT_SERIF_BOLD, 21.5 * sc)
    fnt_24 = get_font(FONT_SERIF_BOLD, 35 * sc)
    for h_num in range(1, 25):
        a = math.radians(-90.0 + (h_num % 24) * 15.0)
        r_n = (302.0 if h_num == 24 else 296.0) * sc
        nx, ny = cx + r_n * math.cos(a), cy + r_n * math.sin(a)
        fnt = fnt_24 if h_num == 24 else fnt_reg
        txt = str(h_num)
        bb = draw.textbbox((0, 0), txt, font=fnt)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        tx, ty = nx - tw / 2.0 - bb[0], ny - th / 2.0 - bb[1]
        draw.text((tx + 1.5, ty + 2.0), txt, font=fnt, fill=(252, 244, 224, 150))
        draw.text((tx, ty), txt, font=fnt, fill=(78, 66, 52, 248))

    plate.save(os.path.join(LAYERS_DIR, "clock_plate_v5.png"))
    plate.save(os.path.join(LAYERS_DIR, "clock_plate_v6.png"))

    # 2-plane directional antique bronze gear sprites
    _build_gear_v6(128, 110, 30, 24, 6, "spokes", False, plane="far").save(os.path.join(LAYERS_DIR, "gear_tl_lg.png"))
    _build_gear_v6(78, 65, 19, 16, 6, "circles", False, plane="near").save(os.path.join(LAYERS_DIR, "gear_tl_md.png"))
    _build_gear_v6(76, 64, 18, 14, 5, "circles", False, plane="near").save(os.path.join(LAYERS_DIR, "gear_br_md.png"))
    _build_gear_v6(126, 108, 28, 22, 6, "spokes", True, plane="far").save(os.path.join(LAYERS_DIR, "gear_br_lg.png"))


def main():
    print("Building V6 Shadow-Box, Motivated-Lighting & Multi-Plane Painterly Assets...")
    bronto_path, trex_path = build_dinosaur_layers_v6()
    build_palms_layers_v6()
    build_ocean_backdrop_v6()
    build_molten_and_dust_layers_v6()
    build_clock_and_gears_v6()

    # Sync all generated layer PNGs into public/earth-24h/layers for Remotion
    for fname in os.listdir(LAYERS_DIR):
        if fname.endswith(".png"):
            shutil.copy2(os.path.join(LAYERS_DIR, fname), os.path.join(REMOTION_LAYERS_DIR, fname))

    # Downscaled clock plate (1230x1230) for crisp fast Remotion loading
    plate_lg = Image.open(os.path.join(LAYERS_DIR, "clock_plate_v6.png"))
    plate_sm = plate_lg.resize((1230, 1230), Image.Resampling.LANCZOS)
    plate_sm.save(os.path.join(REMOTION_LAYERS_DIR, "clock_plate_v5.png"))
    plate_sm.save(os.path.join(REMOTION_LAYERS_DIR, "clock_plate_v6.png"))

    # Ensure audio exists for Remotion
    audio_out = os.path.join(REMOTION_PUBLIC_DIR, "audio.m4a")
    if not os.path.exists(audio_out):
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(ROOT, "ref.mp4"), "-vn", "-c:a", "aac", "-b:a", "128k", audio_out],
            check=True,
        )

    # Update smoothed SVG vector contours module for Remotion
    with open(os.path.join(ROOT, "assets", "vector_shapes.json"), "r", encoding="utf-8") as f:
        vs = json.load(f)
    moon_pts = smooth_closed_curve(vs["dino_moon_2247"][0], n_out=64, sigma=1.5) if vs.get("dino_moon_2247") else []
    moon_path = points_to_smooth_svg_path(moon_pts)

    ts_src = f"""// Auto-generated smooth SVG Bezier contours from V6 painterly asset builder
export const BRONTO_PATH = {json.dumps(bronto_path)};
export const TREX_PATH = {json.dumps(trex_path)};
export const DINO_MOON_PATH = {json.dumps(moon_path)};
"""
    with open(REMOTION_VECTORS_TS, "w", encoding="utf-8") as f:
        f.write(ts_src)

    print("All V6 layers synced cleanly to earth-24h/assets/layers and public/earth-24h/layers!")


if __name__ == "__main__":
    main()
