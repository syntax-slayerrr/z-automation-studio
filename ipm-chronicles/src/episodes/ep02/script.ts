import alignmentData from "./alignment.json";
import { createScriptTiming, type AlignmentFile } from "../../shared/scriptEngine";

export const EP02_SCENE_NAMES = [
  "S0_YogyakartaSurakarta1961",
  "S1_Konsolidasi1976",
  "S2_OrdeBaru1992",
  "S3_Kembali2008",
  "S4_Bantul2010",
  "S5_Cliffhanger",
];

const timing = createScriptTiming(
  alignmentData as AlignmentFile,
  EP02_SCENE_NAMES,
  30,
  1.90
);

export const FPS = timing.FPS;
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
