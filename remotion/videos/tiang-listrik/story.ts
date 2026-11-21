// V3 FORENSIC 1:1 STORYBOARD LEDGER (100% Calibrated 38-Shot Cameras + Typo-Free Clean Subtitles)
// Reference: media_1795169370817_98cacc47.mp4 (103.567s, 3107 frames, 30fps)

export interface CameraConfig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export interface ShotDefinition {
  id: number;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  startTime: number;
  endTime: number;
  act: string;
  camera: CameraConfig;
}

export interface OverlayText {
  id: string;
  text: string;
  kind: "subtitle";
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
}

export const COMPOSITION_CONFIG = {
  id: "TiangListrikShort",
  width: 720,
  height: 1280,
  fps: 30,
  durationInFrames: 3107,
  audioDurationSec: 103.567,
  audioMasterPath: "tiang-listrik/audio_master.m4a",
};

export const SHOTS: ShotDefinition[] = [
  // Shot 1: Villager on right driving bamboo into soil cutaway; blue bucket & tire on left; center house behind (shot_001.jpg)
  { id: 1, startFrame: 0, endFrame: 75, durationInFrames: 75, startTime: 0.0, endTime: 2.5, act: "hook", camera: { position: [0.12, 1.08, 5.55], lookAt: [0.08, 0.56, 0.0], fov: 42 } },
  // Shot 2: Low 3/4 back angle looking up at villager climbing wooden ladder on bamboo pole (shot_002.jpg)
  { id: 2, startFrame: 75, endFrame: 139, durationInFrames: 64, startTime: 2.5, endTime: 4.63, act: "hook", camera: { position: [-1.22, 2.02, 2.92], lookAt: [-0.08, 2.82, -0.05], fov: 42 } },
  // Shot 3: Wide village establishing shot showing full bamboo pole + ladder + villager + center house (shot_003.jpg)
  { id: 3, startFrame: 139, endFrame: 192, durationInFrames: 53, startTime: 4.63, endTime: 6.4, act: "hook", camera: { position: [0.0, 2.95, 11.4], lookAt: [0.0, 2.6, 0.0], fov: 45 } },
  // Shot 4: Low-angle close-up looking up at bamboo pole top swaying in wind + banana fronds at bottom (shot_004.jpg)
  { id: 4, startFrame: 192, endFrame: 237, durationInFrames: 45, startTime: 6.4, endTime: 7.9, act: "wind", camera: { position: [0.15, 4.45, 4.1], lookAt: [0.0, 5.38, 0.0], fov: 40 } },
  // Shot 5: Wide village shot as bamboo pole collapses flat onto right yard + villager panics (shot_005.jpg)
  { id: 5, startFrame: 237, endFrame: 286, durationInFrames: 49, startTime: 7.9, endTime: 9.53, act: "wind", camera: { position: [0.0, 2.95, 11.4], lookAt: [0.0, 2.6, 0.0], fov: 45 } },
  // Shot 6: Wide village shot as bamboo pole grows taller under white wind arrow (tiles_10_20_1.jpg)
  { id: 6, startFrame: 286, endFrame: 357, durationInFrames: 71, startTime: 9.53, endTime: 11.9, act: "wind", camera: { position: [0.0, 3.3, 12.6], lookAt: [0.0, 2.9, 0.0], fov: 46 } },
  // Shot 7: Tight underground cutaway close-up of bamboo pivoting with RED opposing lever arrows (shot_007.jpg)
  { id: 7, startFrame: 357, endFrame: 431, durationInFrames: 74, startTime: 11.9, endTime: 14.37, act: "wind", camera: { position: [0.04, -0.58, 2.75], lookAt: [0.0, -0.68, 0.0], fov: 38 } },
  // Shot 8: Medium shot villager digging deep dark trench with long wooden spade + mound left (shot_008.jpg)
  { id: 8, startFrame: 431, endFrame: 498, durationInFrames: 67, startTime: 14.37, endTime: 16.6, act: "soil_embed", camera: { position: [0.16, 0.85, 5.05], lookAt: [0.12, 0.14, 0.0], fov: 42 } },
  // Shot 9: Tall wide shot showing full 12-meter bamboo pole + yellow 12 meter ruler (shot_009.jpg)
  { id: 9, startFrame: 498, endFrame: 564, durationInFrames: 66, startTime: 16.6, endTime: 18.8, act: "soil_embed", camera: { position: [0.0, 4.2, 16.2], lookAt: [0.0, 3.85, 0.0], fov: 46 } },
  // Shot 10: Underground close-up 2-meter deep embedded hollow bamboo cutaway + yellow 2m ruler (tiles_20_30_1.jpg)
  { id: 10, startFrame: 564, endFrame: 626, durationInFrames: 62, startTime: 18.8, endTime: 20.87, act: "soil_embed", camera: { position: [0.05, -0.82, 3.45], lookAt: [0.0, -0.92, 0.0], fov: 38 } },
  // Shot 11: Wide weather timelapse — sunny -> rain cycle begins (tiles_20_30_1.jpg)
  { id: 11, startFrame: 626, endFrame: 665, durationInFrames: 39, startTime: 20.87, endTime: 22.17, act: "soil_embed", camera: { position: [0.0, 2.95, 11.2], lookAt: [0.0, 2.55, 0.0], fov: 45 } },
  // Shot 12: Wide weather timelapse — rapid rain/sun decay cycle (tiles_20_30_1.jpg)
  { id: 12, startFrame: 665, endFrame: 690, durationInFrames: 25, startTime: 22.17, endTime: 23.0, act: "weather_rot", camera: { position: [0.0, 2.95, 11.2], lookAt: [0.0, 2.55, 0.0], fov: 45 } },
  // Shot 13: Macro close-up mottled brown fungal rot right at soil boundary + hollow cutaway below (shot_013.jpg)
  { id: 13, startFrame: 690, endFrame: 763, durationInFrames: 73, startTime: 23.0, endTime: 25.43, act: "weather_rot", camera: { position: [0.02, -0.02, 2.25], lookAt: [0.0, -0.08, 0.0], fov: 35 } },
  // Shot 14: Underground close-up rotting hollow bamboo spear tip (storyboard #14)
  { id: 14, startFrame: 763, endFrame: 862, durationInFrames: 99, startTime: 25.43, endTime: 28.73, act: "weather_rot", camera: { position: [0.02, -0.62, 2.7], lookAt: [0.0, -0.72, 0.0], fov: 36 } },
  // Shot 15: High 3/4 view villager on left dipping timber log into concrete preservative tank (shot_015.jpg)
  { id: 15, startFrame: 862, endFrame: 936, durationInFrames: 74, startTime: 28.73, endTime: 31.2, act: "wood_preservative", camera: { position: [-0.28, 2.75, 4.45], lookAt: [0.02, 0.35, -0.62], fov: 44 } },
  // Shot 16: Medium shot dark treated creosote timber pole planted in soil + villager admiring on right (shot_016.jpg)
  { id: 16, startFrame: 936, endFrame: 1021, durationInFrames: 85, startTime: 31.2, endTime: 34.03, act: "wood_preservative", camera: { position: [0.08, 2.1, 6.7], lookAt: [0.08, 1.72, 0.0], fov: 42 } },
  // Shot 17: Wide shot dark pouring rain falling on village & wet timber pole (storyboard #17)
  { id: 17, startFrame: 1021, endFrame: 1086, durationInFrames: 65, startTime: 34.03, endTime: 36.2, act: "rain_leak", camera: { position: [0.0, 2.95, 10.8], lookAt: [0.0, 2.55, 0.0], fov: 45 } },
  // Shot 18: Macro close-up wet dark timber pole top with soft glowing cyan bokeh leakage orbs (shot_018.jpg)
  { id: 18, startFrame: 1086, endFrame: 1163, durationInFrames: 77, startTime: 36.2, endTime: 38.77, act: "rain_leak", camera: { position: [-0.14, 6.22, 2.55], lookAt: [0.0, 6.02, 0.0], fov: 36 } },
  // Shot 19: Low 3/4 angle villager climbing ladder mounting white porcelain insulator on cross-arm (tiles_40_50_1.jpg)
  { id: 19, startFrame: 1163, endFrame: 1236, durationInFrames: 73, startTime: 38.77, endTime: 41.2, act: "insulator", camera: { position: [-1.25, 5.45, 2.95], lookAt: [0.12, 6.22, 0.0], fov: 40 } },
  // Shot 20: Macro close-up glossy white 3-tier porcelain insulator on angled wooden cross-arm + DOF bokeh (shot_020.jpg)
  { id: 20, startFrame: 1236, endFrame: 1310, durationInFrames: 74, startTime: 41.2, endTime: 43.67, act: "insulator", camera: { position: [0.0, 4.86, 1.85], lookAt: [0.0, 4.76, 0.0], fov: 34 } },
  // Shot 21: Macro close-up sliced orange cutaway insulator in rain + white droplets + "tetap kering" (shot_021.jpg)
  { id: 21, startFrame: 1310, endFrame: 1424, durationInFrames: 114, startTime: 43.67, endTime: 47.47, act: "insulator", camera: { position: [0.0, 5.05, 3.85], lookAt: [0.0, 4.98, 0.0], fov: 35 } },
  // Shot 22: Wide dual-pole village shot showing villager pulling overhead cable taut (tiles_50_60_1.jpg)
  { id: 22, startFrame: 1424, endFrame: 1523, durationInFrames: 99, startTime: 47.47, endTime: 50.77, act: "catenary_andongan", camera: { position: [0.0, 3.05, 11.4], lookAt: [0.0, 2.75, 0.0], fov: 45 } },
  // Shot 23: Tight close-up on taut overhead wire + RED->BLUE Thermometer + Dual RED Contraction Arrows (tiles_50_60_1.jpg!)
  { id: 23, startFrame: 1523, endFrame: 1590, durationInFrames: 67, startTime: 50.77, endTime: 53.0, act: "catenary_andongan", camera: { position: [0.0, 5.95, 3.85], lookAt: [0.0, 5.95, 0.0], fov: 38 } },
  // Shot 24: Wide dual-pole cold contraction & violent cable SNAP (shot_024.jpg)
  { id: 24, startFrame: 1590, endFrame: 1684, durationInFrames: 94, startTime: 53.0, endTime: 56.13, act: "catenary_andongan", camera: { position: [0.0, 3.05, 11.4], lookAt: [0.0, 2.75, 0.0], fov: 45 } },
  // Shot 25: Wide dual-pole white reference line + glowing yellow ANDONGAN curve + sky title (tiles_60_70_1.jpg)
  { id: 25, startFrame: 1684, endFrame: 1817, durationInFrames: 133, startTime: 56.13, endTime: 60.57, act: "catenary_andongan", camera: { position: [0.0, 3.05, 11.4], lookAt: [0.0, 2.75, 0.0], fov: 45 } },
  // Shot 26: Single timber pole medium-wide shot as multiple cables populate and pole visibly BENDS! (tiles_60_70_1.jpg)
  { id: 26, startFrame: 1817, endFrame: 1940, durationInFrames: 123, startTime: 60.57, endTime: 64.67, act: "heavy_load", camera: { position: [0.35, 3.1, 10.2], lookAt: [0.35, 2.85, 0.0], fov: 44 } },
  // Shot 27: High 3/4 view villager behind formwork pouring vertical concrete column from silver bucket (shot_027.jpg)
  { id: 27, startFrame: 1940, endFrame: 2001, durationInFrames: 61, startTime: 64.67, endTime: 66.7, act: "concrete_pour", camera: { position: [-0.08, 2.15, 3.45], lookAt: [0.12, 0.48, -0.35], fov: 42 } },
  // Shot 28: Medium wide shot ordinary concrete pole flexing under RED top arrow & cracking open (tiles_70_80_1.jpg)
  { id: 28, startFrame: 2001, endFrame: 2125, durationInFrames: 124, startTime: 66.7, endTime: 70.83, act: "concrete_failure", camera: { position: [0.0, 3.15, 10.6], lookAt: [0.0, 2.85, 0.0], fov: 44 } },
  // Shot 29: Diagonal close-up prestressed formwork mold + 4 steel wires + stakes + RED tension arrows + pour (shot_029.jpg!)
  { id: 29, startFrame: 2125, endFrame: 2260, durationInFrames: 135, startTime: 70.83, endTime: 75.33, act: "prestressed_mold", camera: { position: [-1.72, 2.52, 3.92], lookAt: [0.06, 0.18, -0.45], fov: 44 } },
  // Shot 30: Diagonal close-up cured concrete mold + BLUE inward compression arrows (shot_030.jpg!)
  { id: 30, startFrame: 2260, endFrame: 2352, durationInFrames: 92, startTime: 75.33, endTime: 78.4, act: "prestressed_mold", camera: { position: [-1.58, 2.42, 3.72], lookAt: [0.06, 0.18, -0.45], fov: 44 } },
  // Shot 31: Front medium shot villager behind wooden table clamping & lifting 12 colorful books HIGH (shot_031.jpg!)
  { id: 31, startFrame: 2352, endFrame: 2477, durationInFrames: 125, startTime: 78.4, endTime: 82.57, act: "book_analogy", camera: { position: [0.0, 1.15, 3.16], lookAt: [0.0, 0.92, 0.32], fov: 39 } },
  // Shot 32: Wide shot prestressed concrete pole standing strong + "Beton pratekan" upper title (storyboard #32)
  { id: 32, startFrame: 2477, endFrame: 2544, durationInFrames: 67, startTime: 82.57, endTime: 84.8, act: "concrete_pole", camera: { position: [0.0, 3.2, 11.4], lookAt: [0.0, 2.9, 0.0], fov: 45 } },
  // Shot 33: Upward tracking shot hoisting ribbed transformer box onto concrete pole shelf (shot_033.jpg)
  { id: 33, startFrame: 2544, endFrame: 2628, durationInFrames: 84, startTime: 84.8, endTime: 87.6, act: "transformer_hoist", camera: { position: [-0.88, 4.9, 5.5], lookAt: [0.22, 5.5, 0.0], fov: 40 } },
  // Shot 34: Wide shot concrete pole + transformer + animated 20.000V orange -> 220V green lines -> windows ON! (shot_034.jpg)
  { id: 34, startFrame: 2628, endFrame: 2749, durationInFrames: 121, startTime: 87.6, endTime: 91.63, act: "transformer_flow", camera: { position: [-0.35, 3.2, 11.4], lookAt: [-0.25, 2.95, 0.0], fov: 45 } },
  // Shot 35: Warm pastel peach-violet dusk wide shot, village house windows glowing golden yellow (shot_035.jpg)
  { id: 35, startFrame: 2749, endFrame: 2820, durationInFrames: 71, startTime: 91.63, endTime: 94.0, act: "finale_dusk", camera: { position: [-0.25, 3.45, 12.0], lookAt: [-0.15, 3.15, 0.0], fov: 45 } },
  // Shot 36: Medium dusk shot villager climbing down ladder & turning to wave goodbye (shot_036.jpg)
  { id: 36, startFrame: 2820, endFrame: 2891, durationInFrames: 71, startTime: 94.0, endTime: 96.37, act: "finale_wave", camera: { position: [-0.38, 1.55, 4.75], lookAt: [-0.28, 1.25, -0.2], fov: 42 } },
  // Shot 37: Peaceful sunset wide pull-back finale (storyboard #37)
  { id: 37, startFrame: 2891, endFrame: 2987, durationInFrames: 96, startTime: 96.37, endTime: 99.57, act: "finale_dusk", camera: { position: [0.0, 3.4, 12.2], lookAt: [0.0, 3.1, 0.0], fov: 46 } },
  // Shot 38: Seamless Visual Loop glide returning smoothly from dusk back to exact Frame 0 morning shot!
  { id: 38, startFrame: 2987, endFrame: 3107, durationInFrames: 120, startTime: 99.57, endTime: 103.57, act: "outro", camera: { position: [0.12, 1.08, 5.55], lookAt: [0.08, 0.56, 0.0], fov: 42 } },
];

// 100% CLEAN TYPO-FREE INDONESIAN SUBTITLES (Zero OCR garbles, synced tightly to audio_master.m4a)
const RAW_SUBTITLES: [number, number, string][] = [
  [0.38, 1.48, "Kalau kamu tancepin"],
  [1.50, 2.48, "bambu ke tanah,"],
  [2.52, 3.46, "terus gantung kabel"],
  [3.50, 4.62, "di atasnya,"],
  [4.70, 5.58, "kamu udah punya"],
  [5.60, 6.42, "tiang listrik."],
  [6.48, 7.38, "Tapi pas angin"],
  [7.40, 7.98, "kenceng,"],
  [8.02, 9.42, "bambunya rubuh."],
  [9.50, 10.72, "Soalnya makin tinggi"],
  [10.76, 11.46, "tiangnya,"],
  [11.50, 12.82, "makin kuat angin"],
  [12.86, 14.32, "ngungkit pangkalnya."],
  [14.38, 15.42, "Jadi kamu tanam"],
  [15.46, 16.62, "lebih dalam."],
  [16.75, 17.44, "Buat tiang dua"],
  [17.48, 18.38, "belas meter,"],
  [18.46, 19.44, "yang masuk tanah"],
  [19.48, 20.92, "hampir dua meter."],
  [21.02, 22.44, "Tapi bambunya makin"],
  [22.48, 23.86, "lama makin keropos,"],
  [23.90, 24.94, "persis di batas tanah."],
  [25.00, 26.42, "Di situ selalu"],
  [26.46, 27.48, "lembap,"],
  [27.54, 28.68, "jamurnya betah."],
  [28.72, 29.88, "Jadi kamu ganti"],
  [29.92, 30.48, "kayu,"],
  [30.52, 31.84, "terus kamu rendam"],
  [31.88, 33.32, "pengawet biar jamurnya"],
  [33.36, 34.30, "nggak doyan."],
  [34.55, 35.42, "Tapi pas hujan,"],
  [35.48, 36.74, "kayunya basah,"],
  [36.80, 38.28, "listriknya bocor lewat"],
  [38.32, 38.80, "tiang."],
  [38.84, 39.96, "Jadi kabelnya kamu"],
  [40.00, 40.84, "dudukin di keramik"],
  [40.88, 41.92, "bersirip,"],
  [41.98, 43.68, "namanya isolator."],
  [43.76, 45.42, "Siripnya kayak payung,"],
  [45.48, 46.78, "bagian bawahnya tetep"],
  [46.82, 47.46, "kering."],
  [47.52, 48.94, "Terus kabelnya kamu"],
  [48.98, 49.96, "tarik kenceng biar"],
  [50.00, 51.12, "rapi."],
  [51.20, 52.32, "Tapi logam itu"],
  [52.36, 53.44, "nyusut pas dingin."],
  [53.48, 54.44, "Tarikannya nambah,"],
  [54.48, 55.94, "kabelnya bisa putus."],
  [56.02, 58.52, "Jadi kabelnya dibiarin kendor dikit,"],
  [58.58, 60.52, "namanya andongan."],
  [60.62, 61.48, "Tapi kabelnya"],
  [61.52, 62.72, "banyak,"],
  [62.78, 63.84, "tiang kayu mulai"],
  [63.88, 64.68, "nggak kuat."],
  [64.76, 66.64, "Jadi kamu cor pakai beton."],
  [66.72, 67.92, "Tapi beton itu"],
  [67.96, 68.92, "kuat ditekan,"],
  [68.98, 69.84, "gampang retak kalau"],
  [69.88, 70.78, "ditekuk."],
  [70.82, 71.92, "Jadi di dalamnya"],
  [71.98, 72.92, "ada kawat baja"],
  [72.98, 74.22, "yang ditarik dulu"],
  [74.26, 75.28, "sebelum dicor."],
  [75.34, 76.32, "Pas dilepas,"],
  [76.38, 77.34, "kawatnya nyusut"],
  [77.40, 78.64, "nekan betonnya dari dalam,"],
  [78.80, 80.32, "kayak tumpukan buku"],
  [80.38, 81.42, "yang kamu jepit"],
  [81.48, 82.58, "biar bisa diangkat."],
  [82.68, 84.78, "Namanya beton pratekan."],
  [84.86, 85.72, "Terakhir,"],
  [85.78, 86.92, "kamu pasang trafo,"],
  [86.98, 87.88, "biar dua puluh"],
  [87.92, 88.84, "ribu volt turun"],
  [88.88, 90.32, "jadi dua ratus dua puluh"],
  [90.38, 91.42, "buat rumahmu."],
  [91.50, 92.42, "Beres,"],
  [92.48, 94.06, "tiang listrikmu jadi."],
  [94.16, 95.32, "Yang beneran jangan"],
  [95.38, 96.34, "dipanjat, ya."],
  [96.48, 97.78, "Besok enaknya"],
  [97.86, 99.45, "belah apa lagi?"],
];

export const OVERLAYS: OverlayText[] = RAW_SUBTITLES.map(([t0, t1, text], idx) => ({
  id: `sub_${String(idx + 1).padStart(3, "0")}`,
  text,
  kind: "subtitle",
  startFrame: Math.round(t0 * 30),
  endFrame: Math.round(t1 * 30),
  startTime: t0,
  endTime: t1,
}));
