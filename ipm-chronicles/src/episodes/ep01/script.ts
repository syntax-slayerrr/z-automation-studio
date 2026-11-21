import { createScriptTiming, type AlignmentFile } from "../../shared/scriptEngine";
import alignmentRaw from "./alignment.json";

const SCENE_NAMES = [
  "S0_Hook_1961",
  "S1_SiswoProjo_1919",
  "S2_GKPM_1926",
  "S3_Wajo_1950",
  "S4_Misteri_Wadah",
  "S5_Garut_1958",
  "S6_Yogyakarta_1960",
];

const timing = createScriptTiming(alignmentRaw as AlignmentFile, SCENE_NAMES, 30, 2.0);

export const FPS = timing.FPS;
export const END_PAD_SEC = timing.END_PAD_SEC;
export const WORDS = timing.WORDS;
export const VO_DURATION_SEC = timing.VO_DURATION_SEC;
export const TOTAL_SEC = timing.TOTAL_SEC;
export const TOTAL_FRAMES = timing.TOTAL_FRAMES;
export const SCENES = timing.SCENES;
export const CUES = timing.CUES;
export const CUE_ENDS = timing.CUE_ENDS;
export const CAPTION_CHUNKS = timing.CAPTION_CHUNKS;
export const sf = timing.sf;
export const cue = timing.cue;
export const globalCue = timing.globalCue;
