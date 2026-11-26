"""
Generates 2x-supersampled tactile FBM gouache & paper-cut shadow-box PNG layers
for `SejarahKomunikasiShort` ("5 Lompatan Komunikasi yang Mengubah Dunia")
using the exact `earth-24h` painterly engine (`earth-24h/src/painterly_fx.py` + `scripts/painterly_engine/painterly_fx.py`).

Output directory: `public/sejarah-komunikasi/layers/*.png` (720x1280 @ 30fps).
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "earth-24h" / "src"))
sys.path.insert(0, str(ROOT / "scripts" / "painterly_engine"))

from painterly_fx import (  # type: ignore
    apply_directional_lighting,
    apply_gouache_mottle,
    blend_screen,
    build_gouache_atmosphere_backdrop,
    build_shadowbox_lobe_tier,
    fbm_noise_2d,
    make_edge_light_wrap,
    render_rim_lit_silhouette,
    save_png,
    smooth_closed_curve,
)


def midpoint_fractal_line(p0, p1, rng, displacement=14.0, depth=3):
    """Subdivides a segment recursively with organic displacement for natural fissures/synapses."""
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

OUT_DIR = ROOT / "public" / "sejarah-komunikasi" / "layers"
W, H = 720, 1280


def draw_handprint_stencil(
    canvas: Image.Image,
    cx: float,
    cy: float,
    scale: float = 1.0,
    rot_deg: float = -8.0,
    halo_rgb: tuple[int, int, int] = (246, 152, 62),
    palm_rgb: tuple[int, int, int, int] = (72, 24, 18, 235),
) -> Image.Image:
    """
    Renders an authentic Sulawesi/Lascaux style prehistoric blown-ochre negative hand stencil:
    warm airbrushed ochre pigment halo surrounding a negative gouache hand silhouette + glowing rim.
    """
    ss = 2
    Ws, Hs = W * ss, H * ss
    scx, scy = cx * ss, cy * ss
    sc = scale * ss

    halo = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo, "RGBA")
    r_outer = int(88 * sc)
    r_mid = int(62 * sc)
    hdraw.ellipse([scx - r_outer, scy - r_outer, scx + r_outer, scy + r_outer], fill=(halo_rgb[0], halo_rgb[1], halo_rgb[2], 125))
    hdraw.ellipse([scx - r_mid, scy - r_mid, scx + r_mid, scy + r_mid], fill=(min(255, halo_rgb[0] + 15), min(255, halo_rgb[1] + 38), min(255, halo_rgb[2] + 45), 185))
    halo_blur = halo.filter(ImageFilter.GaussianBlur(radius=18 * ss))
    halo_mottled = apply_gouache_mottle(halo_blur, strength=0.14, seed=int(cx + cy), warm_bias=True)

    # Hand polygon in local coords before rotation
    raw_hand = [
        (-16, 38), (-22, 18), (-26, 4),
        # Thumb
        (-44, -4), (-52, -16), (-45, -23), (-28, -10),
        # Index
        (-24, -48), (-21, -64), (-13, -64), (-13, -24),
        # Middle
        (-8, -62), (-4, -76), (5, -75), (4, -25),
        # Ring
        (10, -58), (16, -70), (24, -67), (17, -21),
        # Pinky
        (24, -42), (32, -52), (38, -47), (26, -8),
        # Right palm & wrist
        (24, 16), (18, 38),
    ]
    ang = math.radians(rot_deg)
    ca, sa = math.cos(ang), math.sin(ang)
    pts = []
    for px, py in raw_hand:
        rx = (px * ca - py * sa) * sc + scx
        ry = (px * sa + py * ca) * sc + scy
        pts.append((rx / ss, ry / ss))

    pts_smooth = smooth_closed_curve(pts, n_out=180, sigma=1.6)
    hand_sil = render_rim_lit_silhouette(
        W, H, pts_smooth,
        fill_rgba=palm_rgb,
        rim_rgba=(255, 224, 152, 235),
        rim_width=2.2,
        ss=2,
        mottle_seed=int(cx * 3 + cy),
        light_dir=(-0.4, -0.8),
    )

    out = blend_screen(canvas, halo_mottled.resize((W, H), Image.Resampling.LANCZOS))
    out = Image.alpha_composite(out, hand_sil)
    return out


def build_full_bleed_backdrop(
    W: int,
    H: int,
    top_rgb: tuple[int, int, int],
    mid_rgb: tuple[int, int, int],
    bot_rgb: tuple[int, int, int],
    glow_center: tuple[float, float] = (0.5, 0.45),
    glow_rgb: tuple[int, int, int] = (248, 198, 118),
    glow_alpha: float = 0.34,
    light_shafts: list[tuple[float, float, float, float]] | None = None,
    shaft_rgb: tuple[int, int, int] = (228, 250, 244),
    mottle_strength: float = 0.105,
    seed: int = 501,
) -> Image.Image:
    """
    Same as build_gouache_atmosphere_backdrop, except volumetric light shafts extend from y=-90
    (offscreen above the top canvas edge) so there is zero horizontal cutoff at y=70px.
    """
    base = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=top_rgb,
        mid_rgb=mid_rgb,
        bot_rgb=bot_rgb,
        glow_center=glow_center,
        glow_rgb=glow_rgb,
        glow_alpha=glow_alpha,
        light_shafts=None,
        shaft_rgb=shaft_rgb,
        mottle_strength=mottle_strength,
        seed=seed,
    )
    if light_shafts:
        ss = 2
        Ws, Hs = W * ss, H * ss
        beams_soft = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
        beams_core = Image.new("RGBA", (Ws, Hs), (0, 0, 0, 0))
        bsdraw = ImageDraw.Draw(beams_soft, "RGBA")
        bcdraw = ImageDraw.Draw(beams_core, "RGBA")
        for tx, tw, bx, by in light_shafts:
            bsdraw.polygon(
                [
                    ((tx - tw * 1.45) * ss, -90 * ss),
                    ((tx + tw * 1.45) * ss, -90 * ss),
                    ((bx + tw * 0.45) * ss, by * ss),
                    ((bx - tw * 0.45) * ss, by * ss),
                ],
                fill=(shaft_rgb[0], shaft_rgb[1], shaft_rgb[2], 88),
            )
            bcdraw.polygon(
                [
                    ((tx - tw * 0.5) * ss, -90 * ss),
                    ((tx + tw * 0.5) * ss, -90 * ss),
                    ((bx + tw * 0.14) * ss, by * ss),
                    ((bx - tw * 0.14) * ss, by * ss),
                ],
                fill=(min(255, shaft_rgb[0] + 20), min(255, shaft_rgb[1] + 15), min(255, shaft_rgb[2] + 15), 115),
            )
        soft_down = beams_soft.filter(ImageFilter.GaussianBlur(radius=18 * ss)).resize((W, H), Image.Resampling.LANCZOS)
        core_down = beams_core.filter(ImageFilter.GaussianBlur(radius=4 * ss)).resize((W, H), Image.Resampling.LANCZOS)
        base = blend_screen(base, soft_down)
        base = blend_screen(base, core_down)
    return base


def build_scene1_cave_layers() -> None:
    print("  [Scene 1] Building ±45.000 SM Prehistoric Cave Gouache Layers (Earth-24h f_270 palette)...")
    # 1. Deep Molten Ochre-Crimson Cave Backdrop
    bg = build_full_bleed_backdrop(
        W, H,
        top_rgb=(92, 32, 24),
        mid_rgb=(138, 58, 34),
        bot_rgb=(58, 18, 20),
        glow_center=(0.50, 0.48),
        glow_rgb=(248, 168, 78),
        glow_alpha=0.42,
        light_shafts=[
            (220, 75, 340, 880),
            (460, 62, 540, 860),
        ],
        shaft_rgb=(252, 188, 108),
        mottle_strength=0.115,
        seed=101,
    )
    # Add subtle ancient rock crevices across cave wall
    rng = np.random.default_rng(105)
    crevice = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(crevice, "RGBA")
    for _ in range(24):
        x0 = float(rng.uniform(40, 680))
        y0 = float(rng.uniform(220, 860))
        x1 = x0 + float(rng.uniform(-140, 140))
        y1 = y0 + float(rng.uniform(-90, 90))
        seg = midpoint_fractal_line((x0, y0), (x1, y1), rng, displacement=11.0, depth=3)
        cdraw.line(seg, fill=(38, 12, 14, 110), width=2)
        cdraw.line([(p[0] + 1.5, p[1] + 1.5) for p in seg], fill=(232, 138, 74, 55), width=1)
    bg = Image.alpha_composite(bg, crevice.filter(ImageFilter.GaussianBlur(radius=1.2)))
    save_png(bg, OUT_DIR / "s1_cave_bg.png")

    # 2. Glowing Prehistoric Cave Art Layer (3 Hand Stencils + Prehistoric Bull Silhouette)
    art = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    art = draw_handprint_stencil(art, 235, 485, scale=1.18, rot_deg=-12.0)
    art = draw_handprint_stencil(art, 415, 420, scale=0.96, rot_deg=8.0)
    art = draw_handprint_stencil(art, 175, 650, scale=0.88, rot_deg=-22.0)

    # Prehistoric Sulawesi Banteng / Bull ochre painting in center-left cave wall
    bull_pts = smooth_closed_curve([
        (250, 595), (275, 572), (315, 566), (358, 572), (386, 560),
        (405, 542), (418, 526), (422, 544), (412, 562), (426, 574),
        (414, 592), (394, 598), (382, 622), (386, 658), (376, 658),
        (368, 622), (336, 620), (312, 624), (306, 660), (294, 660),
        (296, 622), (272, 616), (254, 648), (244, 646), (254, 608),
    ], n_out=160, sigma=1.8)
    bull_layer = render_rim_lit_silhouette(
        W, H, bull_pts,
        fill_rgba=(186, 84, 38, 195),
        rim_rgba=(254, 214, 132, 220),
        rim_width=2.4,
        ss=2,
        mottle_seed=112,
        light_dir=(0.45, -0.75),
    )
    art = Image.alpha_composite(art, bull_layer)
    save_png(art, OUT_DIR / "s1_cave_wall_art.png")

    # 3. Foreground Prehistoric Human Painter Silhouette (raising left hand to wall, holding torch in right)
    painter_pts = smooth_closed_curve([
        (435, 920), (442, 825), (434, 735), (415, 655),
        # Raised left arm reaching toward hand stencil
        (365, 590), (322, 535), (298, 495), (312, 484), (342, 518), (388, 568), (432, 612),
        # Head & neck
        (436, 565), (448, 538), (476, 534), (498, 548), (502, 576), (492, 602),
        # Right shoulder & arm holding torch high
        (526, 622), (566, 592), (595, 548), (612, 548), (604, 578), (574, 622), (532, 656),
        # Torso & legs
        (524, 755), (534, 845), (542, 920), (498, 920), (488, 825), (474, 825), (468, 920),
    ], n_out=220, sigma=2.0)
    painter_sil = render_rim_lit_silhouette(
        W, H, painter_pts,
        fill_rgba=(44, 16, 18, 255),
        rim_rgba=(254, 196, 118, 240),
        rim_width=2.8,
        ss=2,
        mottle_seed=119,
        light_dir=(-0.65, -0.65),
    )
    painter_wrap = make_edge_light_wrap(painter_sil, color=(254, 182, 98), radius=6.0, strength=0.75)
    save_png(painter_sil, OUT_DIR / "s1_human_painter.png")
    save_png(painter_wrap, OUT_DIR / "s1_human_rim.png")

    # 4. 2-Tier Shadow-Box Cave Rock & Cloud Framing (exact Earth-24h f_270 style)
    back_lobes = [
        (40, 855, 115), (185, 835, 112), (330, 868, 98),
        (485, 832, 118), (645, 840, 122),
    ]
    front_lobes = [
        (-10, 935, 128), (130, 910, 118), (290, 902, 126),
        (455, 912, 120), (595, 895, 115), (730, 925, 124),
    ]
    arch_back = build_shadowbox_lobe_tier(
        W, H, back_lobes,
        fill_rgba=(118, 42, 42, 255),
        rim_rgba=(218, 124, 96, 210),
        shadow_rgba=(24, 6, 10, 165),
        anchor="bottom",
        base_y=850.0,
        shadow_offset_y=-14.0,
        seed=131,
    )
    arch_front = build_shadowbox_lobe_tier(
        W, H, front_lobes,
        fill_rgba=(68, 18, 24, 255),
        rim_rgba=(164, 74, 68, 185),
        shadow_rgba=(18, 4, 8, 185),
        anchor="bottom",
        base_y=915.0,
        shadow_offset_y=-16.0,
        seed=132,
    )
    save_png(arch_back, OUT_DIR / "s1_cave_arch_back.png")
    save_png(arch_front, OUT_DIR / "s1_cave_arch_front.png")


def build_scene2_mesopotamia_layers() -> None:
    print("  [Scene 2] Building ±3.400 SM Mesopotamia Cuneiform Gouache Layers...")
    # 1. Warm Bronze-Terracotta Twilight Backdrop with Volumetric Sun/Dust Shafts
    bg = build_full_bleed_backdrop(
        W, H,
        top_rgb=(76, 44, 32),
        mid_rgb=(134, 82, 46),
        bot_rgb=(54, 28, 20),
        glow_center=(0.48, 0.44),
        glow_rgb=(252, 198, 112),
        glow_alpha=0.40,
        light_shafts=[
            (165, 58, 250, 880),
            (355, 72, 440, 890),
            (545, 54, 625, 870),
        ],
        shaft_rgb=(254, 224, 158),
        mottle_strength=0.105,
        seed=201,
    )
    save_png(bg, OUT_DIR / "s2_mesopotamia_bg.png")

    # 2. Far Atmospheric Ziggurat & Date Palms Silhouette
    zig_pts = [
        (0, 845), (55, 838),
        # Stepped Ziggurat at left-center horizon (x=70..310)
        (75, 838), (92, 772), (118, 772), (130, 722), (154, 722),
        (164, 678), (226, 678), (236, 722), (260, 722), (272, 772),
        (298, 772), (315, 836),
        (465, 842), (595, 832), (720, 840), (720, 1280), (0, 1280),
    ]
    far_layer = render_rim_lit_silhouette(
        W, H, zig_pts,
        fill_rgba=(78, 42, 28, 235),
        rim_rgba=(236, 178, 112, 195),
        rim_width=2.0,
        ss=2,
        mottle_seed=205,
        light_dir=(0.25, -0.9),
    )
    save_png(far_layer, OUT_DIR / "s2_ziggurat_far.png")

    # 3. Monumental Sculpted Clay Tablet in Upper-Center (x=210..510, y=340..710)
    tab_pts = smooth_closed_curve([
        (225, 355), (360, 344), (495, 355),
        (512, 460), (508, 600), (492, 695),
        (360, 706), (228, 695), (212, 600), (208, 460),
    ], n_out=180, sigma=2.2)
    tab_sil = render_rim_lit_silhouette(
        W, H, tab_pts,
        fill_rgba=(112, 62, 38, 248),
        rim_rgba=(254, 212, 138, 240),
        rim_width=3.0,
        ss=2,
        mottle_seed=210,
        light_dir=(-0.55, -0.75),
    )
    tab_lit = apply_directional_lighting(tab_sil, light_dir=(-0.7, -0.7), strength=0.16, warm_shift=True)
    # Horizontal ruled clay scribe lines
    tdraw = ImageDraw.Draw(tab_lit, "RGBA")
    for row_i in range(5):
        ry = 412 + row_i * 58
        tdraw.line([(242, ry), (478, ry)], fill=(64, 30, 18, 165), width=2)
        tdraw.line([(242, ry + 2), (478, ry + 2)], fill=(238, 178, 108, 95), width=1)
    save_png(tab_lit, OUT_DIR / "s2_tablet_stone.png")

    # 4. Foreground Scribe Silhouette & Dunes
    dunes_back = build_shadowbox_lobe_tier(
        W, H,
        [(60, 875, 130), (235, 858, 125), (420, 872, 135), (610, 852, 140)],
        fill_rgba=(84, 44, 28, 255),
        rim_rgba=(228, 162, 98, 210),
        shadow_rgba=(26, 10, 8, 160),
        anchor="bottom",
        base_y=870.0,
        shadow_offset_y=-12.0,
        seed=221,
    )
    dunes_front = build_shadowbox_lobe_tier(
        W, H,
        [(-15, 938, 135), (155, 916, 128), (345, 908, 136), (525, 918, 126), (705, 928, 132)],
        fill_rgba=(48, 24, 16, 255),
        rim_rgba=(186, 118, 72, 190),
        shadow_rgba=(16, 6, 4, 185),
        anchor="bottom",
        base_y=922.0,
        shadow_offset_y=-15.0,
        seed=222,
    )
    save_png(dunes_back, OUT_DIR / "s2_dunes_back.png")
    save_png(dunes_front, OUT_DIR / "s2_dunes_front.png")


def build_scene3_gutenberg_layers() -> None:
    print("  [Scene 3] Building 1440 Gutenberg Printing Press Gouache Layers...")
    # 1. Archival Burgundy-Plum & Warm Candlelight Shafts Backdrop
    bg = build_full_bleed_backdrop(
        W, H,
        top_rgb=(58, 28, 48),
        mid_rgb=(112, 56, 82),
        bot_rgb=(38, 18, 34),
        glow_center=(0.50, 0.48),
        glow_rgb=(254, 206, 124),
        glow_alpha=0.42,
        light_shafts=[
            (180, 66, 290, 880),
            (370, 84, 470, 900),
            (560, 60, 640, 860),
        ],
        shaft_rgb=(255, 228, 168),
        mottle_strength=0.105,
        seed=301,
    )
    save_png(bg, OUT_DIR / "s3_press_bg.png")

    # 2. Far Medieval European Spires & Rooftops Silhouette
    city_pts = [
        (0, 848), (42, 848), (42, 775), (68, 738), (94, 775), (94, 838),
        (132, 838), (132, 745), (154, 650), (165, 575), (176, 650), (198, 745), (198, 842),
        (518, 842), (518, 760), (545, 695), (558, 615), (571, 695), (598, 760), (598, 836),
        (635, 836), (662, 792), (690, 836), (720, 836), (720, 1280), (0, 1280),
    ]
    city_far = render_rim_lit_silhouette(
        W, H, city_pts,
        fill_rgba=(68, 34, 56, 230),
        rim_rgba=(226, 174, 152, 185),
        rim_width=1.8,
        ss=2,
        mottle_seed=305,
        light_dir=(-0.3, -0.85),
    )
    save_png(city_far, OUT_DIR / "s3_city_far.png")

    # 3. Foreground Gutenberg Wooden Screw Printing Press Silhouette (Left & Right Timber Columns, Top Crossbeam, Bed)
    ss = 2
    press_img = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(press_img, "RGBA")
    fill_c = (44, 20, 36, 255)
    # Left & right vertical timber posts
    pdraw.rounded_rectangle([222 * ss, 365 * ss, 258 * ss, 895 * ss], radius=6 * ss, fill=fill_c)
    pdraw.rounded_rectangle([462 * ss, 365 * ss, 498 * ss, 895 * ss], radius=6 * ss, fill=fill_c)
    # Heavy top crown beam & mid nut beam
    pdraw.rounded_rectangle([196 * ss, 342 * ss, 524 * ss, 382 * ss], radius=8 * ss, fill=fill_c)
    pdraw.rounded_rectangle([206 * ss, 438 * ss, 514 * ss, 474 * ss], radius=6 * ss, fill=fill_c)
    # Press bed table & lower supports
    pdraw.rounded_rectangle([188 * ss, 692 * ss, 532 * ss, 734 * ss], radius=7 * ss, fill=fill_c)
    pdraw.polygon([(222 * ss, 734 * ss), (178 * ss, 895 * ss), (214 * ss, 895 * ss), (256 * ss, 734 * ss)], fill=fill_c)
    pdraw.polygon([(498 * ss, 734 * ss), (542 * ss, 895 * ss), (506 * ss, 895 * ss), (464 * ss, 734 * ss)], fill=fill_c)

    press_mottled = apply_gouache_mottle(press_img, strength=0.095, seed=312, warm_bias=True).resize((W, H), Image.Resampling.LANCZOS)
    press_wrap = make_edge_light_wrap(press_mottled, color=(254, 212, 136), radius=5.5, strength=0.78)
    save_png(press_mottled, OUT_DIR / "s3_press_near.png")
    save_png(press_wrap, OUT_DIR / "s3_press_rim.png")

    # 4. Bottom Shadow-Box Cloud/Arch Framing
    arch_front = build_shadowbox_lobe_tier(
        W, H,
        [(-10, 922, 130), (145, 902, 122), (335, 892, 132), (515, 904, 124), (695, 918, 128)],
        fill_rgba=(36, 16, 32, 255),
        rim_rgba=(198, 132, 148, 195),
        shadow_rgba=(14, 4, 12, 185),
        anchor="bottom",
        base_y=908.0,
        shadow_offset_y=-15.0,
        seed=320,
    )
    save_png(arch_front, OUT_DIR / "s3_arch_front.png")


def build_scene4_ocean_telegraph_layers() -> None:
    print("  [Scene 4] Building 1876 Trans-Oceanic Telegraph & Telephone Gouache Layers (Earth-24h f_480 palette)...")
    # 1. Exact Earth-24h f_480 Bioluminescent Deep Ocean-Teal Backdrop with Caustic Light Shafts!
    bg = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(32, 118, 124),
        mid_rgb=(20, 88, 94),
        bot_rgb=(8, 44, 50),
        glow_center=(0.52, 0.46),
        glow_rgb=(142, 246, 232),
        glow_alpha=0.38,
        light_shafts=[
            (130, 48, 60, 880),
            (255, 58, 215, 900),
            (395, 65, 435, 910),
            (535, 52, 625, 890),
            (640, 42, 710, 860),
        ],
        shaft_rgb=(220, 254, 248),
        mottle_strength=0.11,
        seed=401,
    )
    save_png(bg, OUT_DIR / "s4_ocean_bg.png")

    # 2. Top & Bottom Scalloped Shadow-Box Canopy & Seabed (1:1 with f_480.png!)
    top_lobes = [
        (35, 78, 112), (175, 68, 108), (318, 74, 114),
        (468, 64, 110), (618, 72, 112), (735, 80, 102),
    ]
    top_canopy = build_shadowbox_lobe_tier(
        W, H, top_lobes,
        fill_rgba=(22, 92, 98, 245),
        rim_rgba=(138, 224, 224, 190),
        shadow_rgba=(4, 26, 30, 155),
        anchor="top",
        base_y=72.0,
        shadow_offset_y=14.0,
        seed=405,
    )
    bot_lobes = [
        (30, 920, 125), (195, 895, 118), (375, 912, 128),
        (545, 888, 122), (705, 915, 126),
    ]
    seabed = build_shadowbox_lobe_tier(
        W, H, bot_lobes,
        fill_rgba=(12, 58, 64, 255),
        rim_rgba=(118, 212, 214, 195),
        shadow_rgba=(2, 18, 22, 180),
        anchor="bottom",
        base_y=905.0,
        shadow_offset_y=-14.0,
        seed=406,
    )
    save_png(top_canopy, OUT_DIR / "s4_top_canopy.png")
    save_png(seabed, OUT_DIR / "s4_seabed_front.png")

    # 3. Left & Right Continental Cliffs + Telegraph Poles Silhouette
    ss = 2
    cliffs = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(cliffs, "RGBA")
    c_fill = (10, 44, 50, 255)
    # Left cliff & telegraph pole
    cdraw.polygon([(0, 560 * ss), (95 * ss, 575 * ss), (128 * ss, 685 * ss), (148 * ss, 920 * ss), (0, 920 * ss)], fill=c_fill)
    cdraw.rectangle([62 * ss, 395 * ss, 72 * ss, 575 * ss], fill=c_fill)
    cdraw.rectangle([38 * ss, 418 * ss, 96 * ss, 426 * ss], fill=c_fill)
    cdraw.rectangle([44 * ss, 452 * ss, 90 * ss, 460 * ss], fill=c_fill)
    # Right cliff & telegraph pole
    cdraw.polygon([(720 * ss, 545 * ss), (622 * ss, 562 * ss), (588 * ss, 678 * ss), (566 * ss, 920 * ss), (720 * ss, 920 * ss)], fill=c_fill)
    cdraw.rectangle([646 * ss, 382 * ss, 656 * ss, 562 * ss], fill=c_fill)
    cdraw.rectangle([622 * ss, 405 * ss, 680 * ss, 413 * ss], fill=c_fill)
    cdraw.rectangle([628 * ss, 439 * ss, 674 * ss, 447 * ss], fill=c_fill)

    cliffs_mottled = apply_gouache_mottle(cliffs, strength=0.09, seed=412, warm_bias=False).resize((W, H), Image.Resampling.LANCZOS)
    cliffs_wrap = make_edge_light_wrap(cliffs_mottled, color=(156, 248, 240), radius=5.0, strength=0.76)
    cliffs_comp = blend_screen(cliffs_mottled, cliffs_wrap)
    save_png(cliffs_comp, OUT_DIR / "s4_cliffs_poles.png")


def build_scene5_and_6_network_ai_layers() -> None:
    print("  [Scene 5 & 6] Building 1991 Internet & Era AI Gouache Layers (Earth-24h f_780 + f_270 Neural Sphere)...")
    # 1. Exact Earth-24h f_780 Royal Twilight Purple Gouache Sky
    bg = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(74, 46, 104),
        mid_rgb=(138, 88, 164),
        bot_rgb=(46, 28, 78),
        glow_center=(0.50, 0.44),
        glow_rgb=(238, 188, 248),
        glow_alpha=0.35,
        light_shafts=None,
        mottle_strength=0.10,
        seed=501,
    )
    save_png(bg, OUT_DIR / "s5_purple_sky.png")

    # 2. Far Misty Palms / Trees & Twilight Cloud Tiers (matching f_780.png atmospheric depth)
    clouds_back = build_shadowbox_lobe_tier(
        W, H,
        [(45, 868, 126), (205, 846, 122), (370, 862, 118), (535, 842, 128), (685, 858, 120)],
        fill_rgba=(78, 46, 108, 245),
        rim_rgba=(198, 156, 228, 200),
        shadow_rgba=(22, 10, 38, 155),
        anchor="bottom",
        base_y=860.0,
        shadow_offset_y=-13.0,
        seed=505,
    )
    clouds_front = build_shadowbox_lobe_tier(
        W, H,
        [(-10, 926, 132), (155, 906, 124), (335, 898, 134), (515, 908, 126), (695, 918, 130)],
        fill_rgba=(48, 28, 76, 255),
        rim_rgba=(168, 128, 206, 195),
        shadow_rgba=(14, 6, 26, 185),
        anchor="bottom",
        base_y=912.0,
        shadow_offset_y=-15.0,
        seed=506,
    )
    save_png(clouds_back, OUT_DIR / "s5_clouds_back.png")
    save_png(clouds_front, OUT_DIR / "s5_clouds_front.png")

    # 3. Scene 5 Painted Planet Earth Sphere (r=196 at cx=360, cy=548)
    cx, cy, r_sph = 360, 548, 196
    globe = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(globe, "RGBA")
    gdraw.ellipse([cx - r_sph, cy - r_sph, cx + r_sph, cy + r_sph], fill=(56, 36, 92, 255))
    # Stylized gouache continental landmass silhouettes
    continents = [
        [(240, 460), (295, 435), (325, 470), (310, 535), (275, 560), (235, 515)],
        [(365, 430), (445, 420), (495, 465), (485, 540), (425, 575), (385, 520), (355, 480)],
        [(310, 585), (355, 580), (370, 645), (330, 685), (295, 635)],
        [(445, 595), (505, 590), (520, 645), (475, 675)],
    ]
    for cont in continents:
        c_pts = smooth_closed_curve(cont, n_out=90, sigma=1.8)
        gdraw.polygon(c_pts, fill=(88, 58, 132, 255), outline=(186, 148, 224, 180))
    globe = apply_gouache_mottle(globe, strength=0.095, seed=512, warm_bias=False)
    globe = apply_directional_lighting(globe, light_dir=(-0.65, -0.65), strength=0.18, warm_shift=True)
    # Clip strictly to sphere circle + soft golden-lavender atmospheric rim
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).ellipse([cx - r_sph, cy - r_sph, cx + r_sph, cy + r_sph], fill=255)
    g_arr = np.array(globe, dtype=np.uint8)
    g_arr[:, :, 3] = np.minimum(g_arr[:, :, 3], np.array(mask, dtype=np.uint8))
    globe = Image.fromarray(g_arr, mode="RGBA")
    rim_d = ImageDraw.Draw(globe, "RGBA")
    rim_d.ellipse([cx - r_sph, cy - r_sph, cx + r_sph, cy + r_sph], outline=(232, 196, 252, 220), width=3)
    save_png(globe, OUT_DIR / "s5_earth_globe.png")

    # 4. Scene 6 Incandescent AI Neural Constellation Sphere (Earth-24h f_270 magma river technique in Gold-Violet-Cyan!)
    ss = 2
    r_ai = 210
    base_sph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(base_sph, "RGBA")
    bdraw.ellipse([cx - r_ai, cy - r_ai, cx + r_ai, cy + r_ai], fill=(54, 26, 78, 255))
    base_sph = apply_gouache_mottle(base_sph, strength=0.11, seed=601, warm_bias=True)
    base_sph = apply_directional_lighting(base_sph, light_dir=(-0.6, -0.7), strength=0.16, warm_shift=True)

    subsurface = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    amber_halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gold_river = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    cream_core = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))

    sdraw = ImageDraw.Draw(subsurface, "RGBA")
    adraw = ImageDraw.Draw(amber_halo, "RGBA")
    gdraw2 = ImageDraw.Draw(gold_river, "RGBA")
    cdraw2 = ImageDraw.Draw(cream_core, "RGBA")

    sdraw.ellipse([cx - int(r_ai * 0.78), cy - int(r_ai * 0.78), cx + int(r_ai * 0.78), cy + int(r_ai * 0.78)], fill=(196, 98, 224, 155))

    hotspots = [
        (360, 540, 22), (310, 485, 16), (415, 480, 17),
        (285, 555, 15), (435, 560, 16), (335, 610, 15),
        (395, 615, 15), (360, 435, 14), (245, 495, 12),
        (475, 505, 12), (265, 625, 12), (455, 625, 12),
    ]
    rng = np.random.default_rng(607)

    def stroke_synapse(pts_list, w_start, w_end):
        m = len(pts_list) - 1
        for k in range(m):
            u = k / max(1.0, float(m))
            w = w_start * (1.0 - u) + w_end * u
            a, b = pts_list[k], pts_list[k + 1]
            sdraw.line([a, b], fill=(214, 108, 236, 135), width=max(5, int(round(w * 2.8))))
            adraw.line([a, b], fill=(248, 172, 86, 185), width=max(3, int(round(w * 1.55))))
            gdraw2.line([(a[0] * ss, a[1] * ss), (b[0] * ss, b[1] * ss)], fill=(254, 222, 132, 225), width=max(2, int(round(w * 0.95 * ss))))
            if w > 3.0:
                cdraw2.line([(a[0] * ss, a[1] * ss), (b[0] * ss, b[1] * ss)], fill=(255, 248, 212, 210), width=max(1, int(round(w * 0.45 * ss))))

    for idx in range(len(hotspots)):
        hx0, hy0, _ = hotspots[idx]
        dists = sorted([(math.hypot(hx0 - hx1, hy0 - hy1), j) for j, (hx1, hy1, _) in enumerate(hotspots) if j != idx])
        for _, j in dists[:3]:
            if j > idx:
                hx1, hy1, _ = hotspots[j]
                seg = midpoint_fractal_line((hx0, hy0), (hx1, hy1), rng, displacement=13.0, depth=3)
                stroke_synapse(seg, float(rng.uniform(5.2, 8.4)), float(rng.uniform(3.8, 6.2)))
        for _ in range(3):
            ang = math.atan2(hy0 - cy, hx0 - cx) + float(rng.uniform(-1.1, 1.1))
            r_end = min(r_ai - 6.0, math.hypot(hx0 - cx, hy0 - cy) + float(rng.uniform(48, 115)))
            p_end = (cx + r_end * math.cos(ang), cy + r_end * math.sin(ang))
            seg = midpoint_fractal_line((hx0, hy0), p_end, rng, displacement=10.5, depth=3)
            stroke_synapse(seg, float(rng.uniform(4.8, 7.6)), 1.5)

    for hx, hy, hr in hotspots:
        sdraw.ellipse([hx - hr * 2.2, hy - hr * 2.2, hx + hr * 2.2, hy + hr * 2.2], fill=(224, 118, 238, 155))
        adraw.ellipse([hx - hr * 1.35, hy - hr * 1.35, hx + hr * 1.35, hy + hr * 1.35], fill=(252, 188, 92, 210))
        gdraw2.ellipse([(hx - hr * 0.8) * ss, (hy - hr * 0.8) * ss, (hx + hr * 0.8) * ss, (hy + hr * 0.8) * ss], fill=(254, 228, 138, 235))
        cdraw2.ellipse([(hx - hr * 0.4) * ss, (hy - hr * 0.4) * ss, (hx + hr * 0.4) * ss, (hy + hr * 0.4) * ss], fill=(255, 250, 218, 235))

    veins = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    veins = Image.alpha_composite(veins, subsurface.filter(ImageFilter.GaussianBlur(radius=22)))
    veins = Image.alpha_composite(veins, amber_halo.filter(ImageFilter.GaussianBlur(radius=9.5)))
    veins = Image.alpha_composite(veins, gold_river.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=3.2)))
    veins = Image.alpha_composite(veins, cream_core.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=1.6)))

    mask_ai = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask_ai).ellipse([cx - r_ai, cy - r_ai, cx + r_ai, cy + r_ai], fill=255)
    mask_ai = mask_ai.filter(ImageFilter.GaussianBlur(radius=1.5))
    v_arr = np.array(veins, dtype=np.uint8)
    m_arr = np.array(mask_ai, dtype=np.float32) / 255.0
    v_arr[:, :, 3] = np.clip(v_arr[:, :, 3].astype(np.float32) * m_arr, 0, 255).round().astype(np.uint8)
    veins_clipped = Image.fromarray(v_arr, mode="RGBA")

    neural_sphere = blend_screen(base_sph, veins_clipped)
    # Embed subtle glowing golden handprint echo at center of AI neural sphere (linking 45.000 SM -> Today!)
    neural_sphere = draw_handprint_stencil(
        neural_sphere,
        cx=360,
        cy=542,
        scale=0.95,
        rot_deg=-6.0,
        halo_rgb=(254, 198, 96),
        palm_rgb=(58, 28, 84, 215),
    )
    save_png(neural_sphere, OUT_DIR / "s6_neural_sphere.png")

    # 5. Scene 6 Foreground Human Silhouette Standing on Twilight Ridge Reaching Up Toward Neural Sphere
    human_pts = smooth_closed_curve([
        (332, 912), (336, 842), (332, 782),
        # Left arm at side
        (314, 795), (304, 788), (318, 742), (332, 718),
        # Head looking up
        (336, 686), (348, 668), (368, 668), (380, 684), (376, 710),
        # Right arm raised toward glowing neural sphere
        (398, 704), (426, 668), (446, 634), (456, 640), (438, 680), (408, 720), (386, 738),
        # Right torso & leg
        (384, 792), (390, 852), (394, 912), (370, 912), (364, 838), (354, 838), (350, 912),
    ], n_out=180, sigma=1.8)
    human_sil = render_rim_lit_silhouette(
        W, H, human_pts,
        fill_rgba=(36, 18, 62, 255),
        rim_rgba=(254, 218, 148, 240),
        rim_width=2.6,
        ss=2,
        mottle_seed=615,
        light_dir=(0.0, -1.0),
    )
    save_png(human_sil, OUT_DIR / "s6_human_silhouette.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"=== Forging Earth-24h Painterly Gouache Layers -> {OUT_DIR} ===")
    build_scene1_cave_layers()
    build_scene2_mesopotamia_layers()
    build_scene3_gutenberg_layers()
    build_scene4_ocean_telegraph_layers()
    build_scene5_and_6_network_ai_layers()
    print("=== All Earth-24h Gouache Layers Generated Successfully! ===")


if __name__ == "__main__":
    main()
