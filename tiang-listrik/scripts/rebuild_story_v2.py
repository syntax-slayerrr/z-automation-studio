import json
import re

with open('d:/PROJECTS/z-automation-studio/re-ref3/packaging/timeline.json', encoding='utf-8') as f:
    tl = json.load(f)

# Forensically calibrated 1:1 camera positions, lookAt targets, and FOVs for ALL 38 SHOTS
# Verified directly against re-ref3/storyboard.jpg and individual shot_001..shot_038 strips!
shots_def = [
    # Shot 1: Villager on right pushing bamboo into soil cutaway (shot_001.jpg)
    (1,  0.00,  2.50, [0.15,  1.25,  4.80], [0.05,  0.70,  0.0], 42, "hook"),
    # Shot 2: Low back-3/4 angle looking up at villager climbing ladder on bamboo pole (shot_002.jpg)
    (2,  2.50,  4.63, [-1.45, 1.95,  3.10], [-0.15, 2.75, -0.1], 42, "hook"),
    # Shot 3: Wide village shot showing full bamboo pole + ladder + houses (storyboard #3)
    (3,  4.63,  6.40, [0.0,   3.00, 11.20], [0.0,   2.60,  0.0], 45, "hook"),
    # Shot 4: Close-up top of bamboo pole swaying in wind against bright blue sky (storyboard #4)
    (4,  6.40,  7.90, [0.15,  4.80,  4.20], [0.0,   5.10,  0.0], 38, "wind"),
    # Shot 5: Wide village shot as wind bends bamboo hard (storyboard #5)
    (5,  7.90,  9.53, [0.0,   3.00, 11.20], [0.0,   2.60,  0.0], 45, "wind"),
    # Shot 6: Wide village shot wind sway + lever physics (storyboard #6)
    (6,  9.53, 11.90, [0.0,   3.20, 12.00], [0.0,   2.80,  0.0], 46, "wind"),
    # Shot 7: Close-up underground bamboo hollow cutaway pivoting with RED force arrows (shot_007.jpg)
    (7, 11.90, 14.37, [0.05, -0.55,  2.85], [0.0,  -0.65,  0.0], 38, "wind"),
    # Shot 8: Medium shot villager digging deep dark trench with wooden shovel + dirt clods (shot_008.jpg)
    (8, 14.37, 16.60, [0.20,  0.75,  4.30], [0.10,  0.05,  0.0], 40, "soil_embed"),
    # Shot 9: Tall wide shot showing full 12-meter bamboo pole + yellow 12 meter ruler (shot_009.jpg)
    (9, 16.60, 18.80, [0.0,   4.10, 15.80], [0.0,   3.80,  0.0], 46, "soil_embed"),
    # Shot 10: Close-up underground 2-meter deep embedded hollow bamboo cutaway (storyboard #10)
    (10, 18.80, 20.87, [0.05, -0.75,  3.20], [0.0,  -0.85,  0.0], 38, "soil_embed"),
    # Shot 11: Wide shot buried bamboo standing tall in village (storyboard #11)
    (11, 20.87, 22.17, [0.0,   2.90, 10.80], [0.0,   2.50,  0.0], 45, "soil_embed"),
    # Shot 12: Rain/weather aging on bamboo pole (storyboard #12)
    (12, 22.17, 23.00, [0.0,   2.90, 10.80], [0.0,   2.50,  0.0], 45, "weather_rot"),
    # Shot 13: Macro close-up mottled brown rot right at soil boundary + hollow cutaway below (shot_013.jpg)
    (13, 23.00, 25.43, [0.02, -0.05,  2.15], [0.0,  -0.12,  0.0], 34, "weather_rot"),
    # Shot 14: Underground close-up rotting hollow bamboo tip (storyboard #14)
    (14, 25.43, 28.73, [0.02, -0.55,  2.60], [0.0,  -0.65,  0.0], 36, "weather_rot"),
    # Shot 15: High 3/4 view villager dipping timber log into concrete preservative tank (shot_015.jpg)
    (15, 28.73, 31.20, [-0.15, 2.55,  3.95], [0.10,  0.25, -0.4], 42, "wood_preservative"),
    # Shot 16: Medium shot dark treated timber pole planted in soil cutaway (storyboard #16)
    (16, 31.20, 34.03, [0.0,   2.20,  6.80], [0.0,   1.80,  0.0], 42, "wood_preservative"),
    # Shot 17: Wide shot dark rain falling on village & treated timber pole (storyboard #17)
    (17, 34.03, 36.20, [0.0,   2.90, 10.50], [0.0,   2.50,  0.0], 45, "rain_leak"),
    # Shot 18: Close-up wet timber pole top with glowing cyan electric leakage orbs (shot_018.jpg)
    (18, 36.20, 38.77, [-0.15, 6.20,  2.65], [0.0,   6.00,  0.0], 36, "rain_leak"),
    # Shot 19: Low 3/4 angle villager climbing ladder mounting white porcelain insulator on cross-arm (shot_019.jpg)
    (19, 38.77, 41.20, [-1.35, 5.45,  3.05], [0.10,  6.20,  0.0], 40, "insulator"),
    # Shot 20: Macro close-up glossy white 3-tier porcelain insulator on tan wooden cross-arm (shot_020.jpg)
    (20, 41.20, 43.67, [0.0,   4.86,  1.88], [0.0,   4.76,  0.0], 34, "insulator"),
    # Shot 21: Macro close-up sliced orange cutaway insulator in rain ("tetap kering") (shot_021.jpg)
    (21, 43.67, 47.47, [0.0,   4.95,  3.45], [0.0,   4.92,  0.0], 34, "insulator"),
    # Shot 22: Wide dual-pole village shot showing overhead cable span (storyboard #22)
    (22, 47.47, 50.77, [0.0,   3.05, 11.40], [0.0,   2.75,  0.0], 45, "catenary_andongan"),
    # Shot 23: Wide dual-pole hot sun expansion (deeper sag) (storyboard #23)
    (23, 50.77, 53.00, [0.0,   3.05, 11.40], [0.0,   2.75,  0.0], 45, "catenary_andongan"),
    # Shot 24: Wide dual-pole cold contraction & SNAP! (shot_024.jpg)
    (24, 53.00, 56.13, [0.0,   3.05, 11.40], [0.0,   2.75,  0.0], 45, "catenary_andongan"),
    # Shot 25: Wide dual-pole white reference line + glowing yellow ANDONGAN curve (shot_025.jpg)
    (25, 56.13, 60.57, [0.0,   3.05, 11.40], [0.0,   2.75,  0.0], 45, "catenary_andongan"),
    # Shot 26: Wide dual-pole heavy multi-cable load bending timber poles (storyboard #26)
    (26, 60.57, 64.67, [0.0,   3.10, 11.40], [0.0,   2.80,  0.0], 45, "heavy_load"),
    # Shot 27: High 3/4 view villager tilting gray bucket pouring concrete into wooden mold (shot_027.jpg)
    (27, 64.67, 66.70, [-0.15, 2.35,  3.80], [0.15,  0.45, -0.35], 40, "concrete_pour"),
    # Shot 28: Medium wide shot ordinary concrete pole cracking under load (storyboard #28)
    (28, 66.70, 70.83, [0.0,   3.10, 10.60], [0.0,   2.80,  0.0], 44, "concrete_failure"),
    # Shot 29: Isometric 3/4 view prestressed formwork mold + taut steel wires + RED arrows + pour (shot_029.jpg)
    (29, 70.83, 75.33, [-1.35, 3.15,  3.55], [0.15,  0.12, -0.35], 40, "prestressed_mold"),
    # Shot 30: Isometric 3/4 view cured concrete mold + BLUE inward compression arrows (shot_030.jpg)
    (30, 75.33, 78.40, [-1.25, 3.05,  3.45], [0.15,  0.12, -0.35], 40, "prestressed_mold"),
    # Shot 31: Front medium shot villager behind wooden table squeezing & lifting 12 colorful books (shot_031.jpg)
    (31, 78.40, 82.57, [0.0,   1.32,  2.95], [0.0,   1.08,  0.35], 38, "book_analogy"),
    # Shot 32: Wide shot prestressed concrete pole standing strong with 3-phase lines (storyboard #32)
    (32, 82.57, 84.80, [0.0,   3.20, 11.40], [0.0,   2.90,  0.0], 45, "concrete_pole"),
    # Shot 33: Medium upward shot hoisting ribbed transformer box onto concrete pole shelf (shot_033.jpg)
    (33, 84.80, 87.60, [-0.95, 4.90,  5.60], [0.25,  5.50,  0.0], 40, "transformer_hoist"),
    # Shot 34: Wide shot concrete pole + transformer + animated 20.000V orange -> 220V green lines (shot_034.jpg)
    (34, 87.60, 91.63, [-0.25, 3.20, 11.40], [-0.10, 2.95,  0.0], 45, "transformer_flow"),
    # Shot 35: Golden sunset dusk wide shot, village house windows glowing warm yellow (shot_035.jpg)
    (35, 91.63, 94.00, [-0.25, 3.50, 12.00], [-0.10, 3.20,  0.0], 45, "finale_dusk"),
    # Shot 36: Medium dusk shot villager climbing down ladder & waving goodbye (shot_036.jpg)
    (36, 94.00, 96.37, [-0.35, 1.65,  4.85], [-0.25, 1.35, -0.2], 42, "finale_wave"),
    # Shot 37: Peaceful sunset wide pull-back finale (storyboard #37)
    (37, 96.37, 99.57, [0.0,   3.40, 12.40], [0.0,   3.10,  0.0], 46, "finale_dusk"),
    # Shot 38: Clean TikTok black end card (storyboard #38)
    (38, 99.57, 103.57,[0.0,   0.00,  5.00], [0.0,   0.00,  0.0], 45, "outro"),
]

# Sanitize OCR overlay text: strip ALL TikTok watermark noise and OCR artifacts!
BAD_PATTERNS = [
    r'tiktok', r'tok$', r'^tok', r'gimanabisa', r'@gimanabisa', r'gimana\s*bisa',
    r'^12\s*meter$', r'^hampir\s*2\s*meter$', r'^20\.?000\s*v', r'^220\s*v',
    r'^isolator$', r'^tetap\s*kering$', r'^andongan$', r'^tiang\s*listrik$'
]

def is_garbage_or_handled_callout(text: str, kind: str) -> bool:
    t = text.strip().lower()
    if len(t) <= 1:
        return True
    for pat in BAD_PATTERNS:
        if re.search(pat, t):
            return True
    if kind != 'subtitle':
        return True
    return False

def clean_subtitle_text(text: str) -> str:
    t = text.strip()
    # Fix known OCR glitches from timeline.json
    replacements = {
        "hampir2meter/hampir dua meter.": "hampir dua meter.",
        "diatasnya,": "di atasnya,",
        "diatasnya": "di atasnya",
        "tetep kering.": "tetep kering.",
        "12meter": "12 meter",
        "duapuluh": "dua puluh",
        "duaratus": "dua ratus",
    }
    for k, v in replacements.items():
        if k in t:
            t = t.replace(k, v)
    # Remove any stray slash-merged OCR artifact like "foo/bar"
    if '/' in t:
        t = t.split('/')[-1].strip()
    return t

shots_ts = []
for sid, t0, t1, pos, look, fov, act in shots_def:
    f0 = round(t0 * 30)
    f1 = round(t1 * 30)
    dur = f1 - f0
    shots_ts.append(f"""  {{
    id: {sid},
    startFrame: {f0},
    endFrame: {f1},
    durationInFrames: {dur},
    startTime: {t0},
    endTime: {t1},
    act: '{act}',
    camera: {{
      position: [{pos[0]}, {pos[1]}, {pos[2]}],
      lookAt: [{look[0]}, {look[1]}, {look[2]}],
      fov: {fov}
    }}
  }}""")

texts_ts = []
seen = set()
for idx, item in enumerate(tl.get('text', [])):
    raw_txt = item.get('text', '').strip()
    kind = item.get('kind', 'subtitle')
    if is_garbage_or_handled_callout(raw_txt, kind):
        continue
    clean_txt = clean_subtitle_text(raw_txt)
    t0 = item.get('t0', 0)
    t1 = item.get('t1', 0)
    if t0 >= 99.4:
        continue
    f0 = round(t0 * 30)
    f1 = max(f0 + 6, round(t1 * 30))
    key = (f0, clean_txt)
    if key in seen:
        continue
    seen.add(key)
    safe_txt = clean_txt.replace('"', '\\"')
    bbox = item.get('bbox', [0.15, 0.75, 0.7, 0.04])
    texts_ts.append(f"""  {{
    id: "sub_{idx:03d}",
    text: "{safe_txt}",
    kind: "subtitle",
    startFrame: {f0},
    endFrame: {f1},
    startTime: {t0},
    endTime: {t1},
    bbox: [{bbox[0]:.4f}, {bbox[1]:.4f}, {bbox[2]:.4f}, {bbox[3]:.4f}],
    fill: "#FAF7F0",
    stroke: "#1B140E"
  }}""")

out_code = f"""// V2 FORENSIC 1:1 STORYBOARD LEDGER (Sanitized Subtitles & Calibrated 38-Shot Cameras)
// Reference: media_1795169370817_98cacc47.mp4 (103.567s, 3107 frames, 30fps)

export interface CameraConfig {{
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}}

export interface ShotDefinition {{
  id: number;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  startTime: number;
  endTime: number;
  act: string;
  camera: CameraConfig;
}}

export interface OverlayText {{
  id: string;
  text: string;
  kind: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  bbox: [number, number, number, number];
  fill: string;
  stroke: string;
}}

export const COMPOSITION_CONFIG = {{
  id: "TiangListrikShort",
  width: 720,
  height: 1280,
  fps: 30,
  durationInFrames: 3107,
  audioDurationSec: 103.567,
  audioMasterPath: "tiang-listrik/audio_master.m4a"
}};

export const SHOTS: ShotDefinition[] = [
{",\n".join(shots_ts)}
];

export const OVERLAYS: OverlayText[] = [
{",\n".join(texts_ts)}
];
"""

with open('d:/PROJECTS/z-automation-studio/remotion/videos/tiang-listrik/story.ts', 'w', encoding='utf-8') as f:
    f.write(out_code)

print(f"Rebuilt story.ts V2: 38 calibrated shots + {len(texts_ts)} clean sanitized subtitles!")
