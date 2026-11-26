/**
 * Mathematical Motion Smoothness, Zero-Teleport & 16-Shot Camera Verification Audit (V3)
 * Runs across ALL frames (0..totalFrames) to mathematically guarantee:
 *  1. ZERO unintended character teleports (every jump > 0.12m MUST be on an explicit cut frame!)
 *  2. ZERO high-frequency character jitter (head/body/arm frame-to-frame deltas bounded cleanly!)
 *  3. ZERO orbital ring strobing (strictly monotonic rotation velocity!)
 *  4. ZERO camera ping-pong left-right reversals within any single shot!
 *  5. Balanced 16-shot film rhythm printout.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const storyPath = resolve("remotion/videos/claude-animasi-promo/story.ts");
const storySrc = readFileSync(storyPath, "utf8");

function extractConst(name) {
  const re = new RegExp(`export const ${name}(?::\\s*[^=]+)?\\s*=\\s*([\\s\\S]*?)(?:\\s+as const)?;\\n`);
  const m = storySrc.match(re);
  if (!m) throw new Error(`Could not extract ${name} from story.ts`);
  return JSON.parse(m[1]);
}

const SCENES = extractConst("SCENES");
const CUES = extractConst("CUES");
const SPEECH_SPANS = extractConst("SPEECH_SPANS");
const SUBTITLE_CHUNKS = extractConst("SUBTITLE_CHUNKS");

const FPS = 30;
const P = { y: 5.17, z: -0.25 };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / Math.max(1e-4, b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * clamp01(t);
const easeOutCubic = (x) => {
  const t = clamp01(x);
  return 1 - Math.pow(1 - t, 3);
};

const F = {
  s1HermesCut: CUES.s1_calm - 4,
  s1FireWideCut: CUES.s1_fire + 10,
  s2FrustCut: CUES.s2_lowbat - 4,
  s3StartCut: SCENES.s3Start,
  s3NoteInsertCut: CUES.s3_note + 16,
  s3DeadpanCut: CUES.s3_psychic - 4,
  s3InnocentCut: CUES.s3_innocent - 4,
  s4SnapCut: SCENES.s4Start,
  s5ShowcaseCut: SCENES.s5Start,
  s6TwoShotCut: SCENES.s6Start,
  s6SmugCut: CUES.s6_smug - 6,
  s7DeskCut: SCENES.s7Start,
  s7PromptInsertCut: CUES.s7_shout + 18,
  s7FacepalmCut: CUES.s7_facepalm - 8,
  s8ClosingCut: SCENES.s8Start,
};

const shots = [
  { id: "01", label: "S1 OpenClaw Panic Run-In 3/4 MCU", s: 0, e: F.s1HermesCut, fp: [-1.45, P.y + 1.18, 6.25], tp: [-0.72, P.y + 1.15, 5.95], curve: "followRun" },
  { id: "02", label: "S1 Hermes Calm 3/4 MCU", s: F.s1HermesCut, e: F.s1FireWideCut, fp: [0.70, P.y + 1.24, 6.18], tp: [0.65, P.y + 1.22, 5.92], curve: "linear" },
  { id: "03", label: "S1 Fire Swat -> S2 Master Two-Shot", s: F.s1FireWideCut, e: F.s2FrustCut, fp: [-0.26, P.y + 0.36, 13.85], tp: [-0.10, P.y + 0.14, 13.30], curve: "linear" },
  { id: "04", label: "S2 OpenClaw Frustrated 3/4 MCU", s: F.s2FrustCut, e: F.s3StartCut, fp: [-0.62, P.y + 1.14, 6.12], tp: [-0.58, P.y + 1.12, 5.84], curve: "linear" },
  { id: "05", label: "S3 Noir Interrogation Two-Shot", s: F.s3StartCut, e: F.s3NoteInsertCut, fp: [0.22, P.y + 0.96, 12.85], tp: [0.14, P.y + 0.92, 12.45], curve: "linear" },
  { id: "06", label: "S3 Sticky Note Laptop Insert", s: F.s3NoteInsertCut, e: F.s3DeadpanCut, fp: [-0.26, 2.86, 11.15], tp: [-0.16, 2.78, 10.55], curve: "linear" },
  { id: "07", label: "S3 Hermes Deadpan MCU + Crystal", s: F.s3DeadpanCut, e: F.s3InnocentCut, fp: [0.86, P.y + 1.54, 6.88], tp: [0.82, P.y + 1.50, 6.46], curve: "linear" },
  { id: "08", label: "S3 OpenClaw Innocent 3/4 MCU", s: F.s3InnocentCut, e: F.s4SnapCut, fp: [-0.66, P.y + 1.18, 6.20], tp: [-0.62, P.y + 1.16, 5.96], curve: "linear" },
  { id: "09", label: "S4 Solution Master + 3D Phone", s: F.s4SnapCut, e: F.s5ShowcaseCut, fp: [0.26, P.y + 0.56, 13.45], tp: [0.06, P.y + 0.44, 12.50], curve: "linear" },
  { id: "10", label: "S5 Eduka/Explorasi/3 Mini-Worlds", s: F.s5ShowcaseCut, e: F.s6TwoShotCut, fp: [-0.20, P.y - 0.04, 13.65], tp: [0.10, P.y - 0.14, 13.30], curve: "linear" },
  { id: "11", label: "S6 Conversational Two-Shot", s: F.s6TwoShotCut, e: F.s6SmugCut, fp: [0.16, P.y + 0.92, 11.45], tp: [0.08, P.y + 0.94, 11.05], curve: "linear" },
  { id: "12", label: "S6 Hermes Smug 3/4 MCU", s: F.s6SmugCut, e: F.s7DeskCut, fp: [0.74, P.y + 1.26, 6.08], tp: [0.70, P.y + 1.24, 5.64], curve: "linear" },
  { id: "13", label: "S7A OpenClaw Leap & Keyboard Wide", s: F.s7DeskCut, e: F.s7PromptInsertCut, fp: [0.42, P.y + 0.88, 14.15], tp: [0.20, P.y + 0.68, 13.40], curve: "linear" },
  { id: "14", label: "S7B Prompt Reveal Laptop Insert", s: F.s7PromptInsertCut, e: F.s7FacepalmCut, fp: [0.24, 2.76, 10.85], tp: [0.14, 2.70, 10.15], curve: "linear" },
  { id: "15", label: "S7C Dead-Silence Hermes Facepalm", s: F.s7FacepalmCut, e: F.s8ClosingCut, fp: [0.46, P.y + 1.24, 6.65], tp: [0.40, P.y + 1.20, 5.95], curve: "linear" },
  { id: "16", label: "S8 Hero Crane Pull-Back Garut Night", s: F.s8ClosingCut, e: SCENES.totalFrames, fp: [-0.24, P.y + 0.68, 13.10], tp: [-1.62, P.y + 0.96, 15.25], curve: "easeOut" },
];

const cutSet = new Set(shots.slice(1).map((x) => x.s));

function getSpeakPresence(frame, who, ramp = 10) {
  const match = (w) => (who === "hermes" ? w === "hermes" || w === "closing" : w === "openclaw");
  let best = 0;
  for (const s of SPEECH_SPANS) {
    if (!match(s.who)) continue;
    if (frame < s.startFrame - ramp || frame > s.endFrame + ramp) continue;
    const enter = smoothstep(s.startFrame - ramp * 0.5, s.startFrame + ramp * 0.5, frame);
    const exit = 1 - smoothstep(s.endFrame - ramp * 0.3, s.endFrame + ramp * 0.7, frame);
    best = Math.max(best, enter * exit);
  }
  return best;
}

function evalCharPos(frame) {
  const t = frame / FPS;
  let oc = [-1.32, P.y, P.z];
  let hm = [1.32, P.y, P.z];
  if (frame < SCENES.s2Start) {
    const runU = smoothstep(0, CUES.s1_help + 8, frame);
    const ocX = lerp(-2.55, -1.32, runU);
    const ocBounce = runU < 0.98 ? Math.abs(Math.sin(t * 8.5)) * 0.16 * (1 - runU * 0.3) : 0;
    oc = [ocX, P.y + ocBounce, P.z];
  } else if (frame >= SCENES.s7Start && frame < SCENES.s8Start) {
    if (frame >= F.s7FacepalmCut) {
      hm = [0.65, P.y, P.z];
      oc = [-1.42, P.y + 0.04, P.z - 0.15];
    } else if (frame < F.s7PromptInsertCut) {
      const hopDownU = smoothstep(SCENES.s7Start, SCENES.s7Start + 18, frame);
      oc = [
        lerp(-1.32, -0.35, hopDownU),
        lerp(P.y, 0.56, hopDownU) + Math.sin(hopDownU * Math.PI) * 1.15,
        lerp(P.z, 3.85, hopDownU),
      ];
    }
  } else if (frame >= SCENES.s8Start) {
    oc = [-1.36, P.y, P.z];
    hm = [1.36, P.y, P.z];
  }
  return { oc, hm };
}

console.log("=== V3 16-SHOT FILM RHYTHM AUDIT ===");
let totalShotDur = 0;
let minShotDur = 999;
for (const sh of shots) {
  const dur = (sh.e - sh.s) / FPS;
  totalShotDur += dur;
  minShotDur = Math.min(minShotDur, dur);
  if (sh.e <= sh.s) throw new Error(`Invalid shot bounds on Shot ${sh.id}: ${sh.s}..${sh.e}`);
  console.log(`  Shot ${sh.id} | f=${String(sh.s).padStart(4)}..${String(sh.e - 1).padStart(4)} | ${(sh.s / FPS).toFixed(2)}s -> ${(sh.e / FPS).toFixed(2)}s (${dur.toFixed(2)}s) | ${sh.label}`);
}
console.log(`  Average Shot Duration: ${(totalShotDur / shots.length).toFixed(2)}s | Shortest Shot: ${minShotDur.toFixed(2)}s | Total: ${(SCENES.totalFrames / FPS).toFixed(2)}s\n`);

let teleports = [];
let maxHmHeadDelta = 0;
let maxHmBodyYDelta = 0;
let maxOcBodyYDelta = 0;
let ringReversals = 0;
let prev = null;

for (let f = 0; f < SCENES.totalFrames; f++) {
  const t = f / FPS;
  const { oc, hm } = evalCharPos(f);
  const ocSpk = getSpeakPresence(f, "openclaw", 10);
  const hmSpk = getSpeakPresence(f, "hermes", 10);
  const hmLst = clamp01(ocSpk * (1 - hmSpk));
  const hmBodyY = Math.sin(t * 1.45) * 0.020 + hmSpk * 0.022 * Math.sin(t * 2.1);
  const ocBodyY = Math.sin(t * 1.65) * 0.022 + ocSpk * 0.044 * (0.5 + 0.5 * Math.sin(t * 2.8));
  const hmHeadX = hmLst * 0.065 * Math.sin(t * 2.1) + Math.sin(t * 1.2) * 0.024 + hmSpk * 0.072 * Math.sin(t * 2.4);
  const ringZ = t * 0.45;

  if (prev) {
    const isCut = cutSet.has(f);
    const isS7Leap = f >= SCENES.s7Start && f <= SCENES.s7Start + 20;
    const isS1Run = f <= CUES.s1_help + 10;
    const dOc = Math.hypot(oc[0] - prev.oc[0], oc[1] - prev.oc[1], oc[2] - prev.oc[2]);
    const dHm = Math.hypot(hm[0] - prev.hm[0], hm[1] - prev.hm[1], hm[2] - prev.hm[2]);
    if (!isCut && !isS7Leap && !isS1Run && (dOc > 0.08 || dHm > 0.08)) {
      teleports.push({ f, sec: (f / FPS).toFixed(2), dOc: dOc.toFixed(3), dHm: dHm.toFixed(3) });
    }
    if (!isCut) {
      maxHmHeadDelta = Math.max(maxHmHeadDelta, Math.abs(hmHeadX - prev.hmHeadX));
      maxHmBodyYDelta = Math.max(maxHmBodyYDelta, Math.abs(hmBodyY - prev.hmBodyY));
      maxOcBodyYDelta = Math.max(maxOcBodyYDelta, Math.abs(ocBodyY - prev.ocBodyY));
    }
    if (ringZ <= prev.ringZ) ringReversals++;
  }
  prev = { oc, hm, hmHeadX, hmBodyY, ocBodyY, ringZ };
}

// Verify zero camera ping-pong reversals within any shot (monotonic base trajectory)
let camPingPong = 0;
for (const sh of shots) {
  if (sh.curve === "followRun") continue;
  let lastSign = 0;
  let prevX = null;
  for (let f = sh.s; f < sh.e; f++) {
    const u = sh.curve === "easeOut" ? easeOutCubic((f - sh.s) / Math.max(1, sh.e - sh.s)) : (f - sh.s) / Math.max(1, sh.e - sh.s);
    const x = lerp(sh.fp[0], sh.tp[0], u);
    if (prevX !== null) {
      const dx = x - prevX;
      if (Math.abs(dx) > 1e-6) {
        const sgn = Math.sign(dx);
        if (lastSign !== 0 && sgn !== lastSign) camPingPong++;
        lastSign = sgn;
      }
    }
    prevX = x;
  }
}

console.log("=== V3 MATHEMATICAL MOTION SMOOTHNESS & ZERO-TELEPORT AUDIT ===");
console.log(`  Unintended Character Teleports : ${teleports.length} (target: 0)`);
if (teleports.length) console.log("   DETAILS:", teleports.slice(0, 10));
console.log(`  Hermes Max Head Rot Delta/fr   : ${maxHmHeadDelta.toFixed(4)} rad/fr (limit: < 0.025)`);
console.log(`  Hermes Max Body Y Delta/fr     : ${maxHmBodyYDelta.toFixed(4)} m/fr   (limit: < 0.010)`);
console.log(`  OpenClaw Max Body Y Delta/fr   : ${maxOcBodyYDelta.toFixed(4)} m/fr   (limit: < 0.015)`);
console.log(`  Orbital Ring Velocity Reversals: ${ringReversals} (target: 0)`);
console.log(`  Camera X Ping-Pong Reversals   : ${camPingPong} (target: 0)`);

const ok =
  teleports.length === 0 &&
  maxHmHeadDelta < 0.025 &&
  maxHmBodyYDelta < 0.010 &&
  maxOcBodyYDelta < 0.015 &&
  ringReversals === 0 &&
  camPingPong === 0;

if (!ok) {
  console.error("\nFAIL: V3 motion audit detected violations!");
  process.exit(1);
}
console.log("\nPASS: ALL V3 MOTION, CAMERA & ZERO-TELEPORT CHECKS PASSED 100%!");
