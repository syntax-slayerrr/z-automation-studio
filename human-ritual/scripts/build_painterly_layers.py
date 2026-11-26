"""
Builds 7 `earth-24h`-grade Tactile Gouache & Paper-Cut Shadow-Box Backdrop Plates
for "Mengapa Manusia Memiliki Ritual?" (`public/human-ritual/layers/*.png`)
using the shared `scripts/painterly_engine/painterly_fx.py` engine.
"""
from __future__ import annotations

import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "painterly_engine"))

from painterly_fx import (
    build_gouache_atmosphere_backdrop,
    build_shadowbox_lobe_tier,
    save_png,
)

OUT_DIR = ROOT / "public" / "human-ritual" / "layers"
W, H = 720, 1280


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Building 7 Earth-24h Gouache & Shadow-Box Layers -> {OUT_DIR} ...")

    # 1. Scene 1: Warm Stadium Tunnel & Historical Ochre-Plum Gouache + Floodlight Shafts
    s1 = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(36, 22, 54),
        mid_rgb=(78, 42, 68),
        bot_rgb=(44, 24, 42),
        glow_center=(0.5, 0.42),
        glow_rgb=(252, 198, 112),
        glow_alpha=0.42,
        light_shafts=[(255, 22, 120, 920), (360, 28, 360, 950), (465, 22, 600, 920)],
        shaft_rgb=(254, 226, 168),
        mottle_strength=0.11,
        seed=101,
    )
    save_png(s1, OUT_DIR / "bg_s1_tunnel.png")

    # 2. Scene 2: Nusantara Ceremonial Terracotta-Rose Dusk Gouache + Top Scalloped Shadow-Box Canopy
    s2_base = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(46, 26, 62),
        mid_rgb=(112, 56, 78),
        bot_rgb=(194, 108, 68),
        glow_center=(0.5, 0.54),
        glow_rgb=(254, 206, 124),
        glow_alpha=0.45,
        mottle_strength=0.11,
        seed=202,
    )
    s2_canopy = build_shadowbox_lobe_tier(
        W, H,
        lobes=[(45, 92, 78), (175, 84, 84), (315, 94, 86), (455, 86, 84), (595, 84, 82), (710, 92, 78)],
        fill_rgba=(58, 30, 56, 245),
        rim_rgba=(242, 168, 108, 175),
        shadow_rgba=(16, 8, 24, 145),
        anchor="top",
        base_y=86.0,
        shadow_offset_y=14.0,
        seed=203,
    )
    save_png(Image.alpha_composite(s2_base, s2_canopy), OUT_DIR / "bg_s2_ceremony.png")

    # 3. Scene 3: Storm Slate-Teal Gouache + Top Shadow-Box Storm Cloud Bank
    s3_base = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(24, 46, 64),
        mid_rgb=(46, 84, 106),
        bot_rgb=(76, 68, 92),
        glow_center=(0.5, 0.56),
        glow_rgb=(246, 196, 118),
        glow_alpha=0.35,
        mottle_strength=0.115,
        seed=303,
    )
    s3_clouds = build_shadowbox_lobe_tier(
        W, H,
        lobes=[(50, 105, 86), (185, 96, 92), (335, 108, 94), (485, 98, 90), (625, 96, 88), (725, 106, 82)],
        fill_rgba=(32, 58, 78, 245),
        rim_rgba=(156, 206, 232, 165),
        shadow_rgba=(10, 22, 32, 150),
        anchor="top",
        base_y=96.0,
        shadow_offset_y=16.0,
        seed=304,
    )
    save_png(Image.alpha_composite(s3_base, s3_clouds), OUT_DIR / "bg_s3_storm_order.png")

    # 4. Scene 4: Earth-24h f_480 Inspired Deep Bioluminescent Neural/Cellular Teal Gouache + Caustic Shafts!
    s4_base = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(18, 68, 76),
        mid_rgb=(36, 122, 128),
        bot_rgb=(22, 82, 92),
        glow_center=(0.5, 0.46),
        glow_rgb=(162, 248, 234),
        glow_alpha=0.44,
        light_shafts=[
            (185, 18, 40, 860),
            (285, 22, 195, 920),
            (385, 24, 395, 940),
            (495, 20, 585, 910),
            (590, 16, 710, 820),
        ],
        shaft_rgb=(196, 252, 246),
        mottle_strength=0.115,
        seed=404,
    )
    s4_top = build_shadowbox_lobe_tier(
        W, H,
        lobes=[(50, 96, 80), (185, 88, 86), (328, 98, 88), (475, 92, 86), (618, 88, 84), (725, 96, 80)],
        fill_rgba=(22, 88, 94, 248),
        rim_rgba=(118, 206, 208, 170),
        shadow_rgba=(6, 28, 32, 145),
        anchor="top",
        base_y=88.0,
        shadow_offset_y=15.0,
        seed=405,
    )
    save_png(Image.alpha_composite(s4_base, s4_top), OUT_DIR / "bg_s4_neuro_teal.png")

    # 5. Scene 5: Warm Savanna-Sanctuary Ochre & Violet Gouache + Volumetric Overhead Beam
    s5 = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(44, 26, 66),
        mid_rgb=(96, 52, 88),
        bot_rgb=(176, 98, 66),
        glow_center=(0.5, 0.52),
        glow_rgb=(254, 212, 132),
        glow_alpha=0.48,
        light_shafts=[(310, 26, 210, 900), (360, 34, 360, 920), (410, 26, 510, 900)],
        shaft_rgb=(255, 232, 178),
        mottle_strength=0.11,
        seed=505,
    )
    save_png(s5, OUT_DIR / "bg_s5_collective.png")

    # 6. Scene 6: Earth-24h f_780 Velvet Violet & Golden Horizon Gouache
    s6 = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(52, 34, 88),
        mid_rgb=(96, 62, 128),
        bot_rgb=(188, 108, 76),
        glow_center=(0.5, 0.58),
        glow_rgb=(254, 206, 128),
        glow_alpha=0.44,
        mottle_strength=0.11,
        seed=606,
    )
    save_png(s6, OUT_DIR / "bg_s6_generations.png")

    # 7. Scene 7: Deep Sapphirine-Plum & Warm Amber Synthesis Cosmos + Shadow-Box Bottom Mound
    s7_base = build_gouache_atmosphere_backdrop(
        W, H,
        top_rgb=(26, 20, 52),
        mid_rgb=(64, 38, 86),
        bot_rgb=(42, 24, 58),
        glow_center=(0.5, 0.42),
        glow_rgb=(254, 208, 126),
        glow_alpha=0.46,
        mottle_strength=0.105,
        seed=707,
    )
    save_png(s7_base, OUT_DIR / "bg_s7_cosmos.png")
    print("ALL 7 GOUACHE BACKDROP LAYERS GENERATED SUCCESSFULLY!")


if __name__ == "__main__":
    main()
