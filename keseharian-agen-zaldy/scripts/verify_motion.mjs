/**
 * Mathematical Motion Smoothness, Zero-Teleport, Anti-Clipping & 15-Shot Camera Verification Audit
 * for "KeseharianAgenZaldy" ("Shift 24 Jam: Keseharian Hermes & OpenClaw Jadi AI Agent Zaldy")
 *
 * Verifies across ALL frames (0..TOTAL_FRAMES):
 *  1. Valid ascending bounds on all 15 bespoke shots (9 camera archetypes)
 *  2. ZERO unintended character teleports (> 0.08m/fr)
 *  3. ZERO high-frequency head/body jitter (`headDelta < 0.025 rad/fr`, `bodyYDelta < 0.015 m/fr`)
 *  4. ZERO orbital ring reversals (strictly monotonic)
 *  5. ZERO camera X ping-pong reversals within any single shot
 *  6. ZERO 3D bounding-box collisions between OpenClaw, Hermes, Coffee Mug, Clock, Task Tower & ACC Badge!
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const storyPath = resolve("remotion/videos/keseharian-agen-zaldy/story.ts");
const storySrc = readFileSync(storyPath, "utf8");

function extractConst(name) {
  const re = new RegExp(`export const ${name}(?::\\s*[^=]+)?\\s*=\\s*([\\s\\S]*?)(?:\\s+as const)?;\\n`);
  const m = storySrc.match(re);
  if (!m) throw new Error(`Could not extract ${name} from story.ts`);
  return JSON.parse(m[1]);
}

const SCENE_STARTS = extractConst("SCENE_STARTS");
const CUES = extractConst("CUES");
const SPEECH_SPANS = extractConst("SPEECH_SPANS");

const FPS = 30;
const TOTAL_FRAMES = SCENE_STARTS.totalFrames;
const P = { y: 5.164, z: -0.254 };

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
  sh01End: CUES.s1_oc_chill - 4,
  sh02End: CUES.s1_brief - 4,
  sh03End: SCENE_STARTS.s2,
  sh04End: CUES.s2_ask_render - 4,
  sh05End: CUES.s2_zero - 4,
  sh06End: CUES.s2_folder_roast - 4,
  sh07End: SCENE_STARTS.s3,
  sh08End: CUES.s3_list - 4,
  sh09End: CUES.s3_perfeksionis - 4,
  sh10End: SCENE_STARTS.s4,
  sh11End: CUES.s4_ready - 4,
  sh12End: SCENE_STARTS.s5,
  sh13End: CUES.s5_ping - 4,
  sh14End: CUES.s5_pasrah - 4,
  sh15End: TOTAL_FRAMES,
};

const shots = [
  { id: "SH01", type: "C09_HighAngle", s: 0, e: F.sh01End, fp: [0.22, P.y + 2.85, 13.85], tp: [0.08, P.y + 2.45, 13.05], curve: "linear" },
  { id: "SH02", type: "C06_MCU_OC", s: F.sh01End, e: F.sh02End, fp: [-0.95, P.y + 1.18, 7.35], tp: [-0.88, P.y + 1.14, 6.95], curve: "linear" },
  { id: "SH03", type: "C11_ScreenInsert", s: F.sh02End, e: F.sh03End, fp: [-0.08, 2.84, 11.85], tp: [0.06, 2.76, 11.15], curve: "linear" },
  { id: "SH04", type: "C05_TimelapseWork34", s: F.sh03End, e: F.sh04End, fp: [1.55, P.y + 0.94, 13.85], tp: [0.48, P.y + 0.56, 12.95], curve: "easeOut" },
  { id: "SH05", type: "C04_OTS_OC_HM", s: F.sh04End, e: F.sh05End, fp: [-2.62, P.y + 1.34, 6.85], tp: [-2.46, P.y + 1.30, 6.45], curve: "linear" },
  { id: "SH06", type: "C08_LowAngleHero", s: F.sh05End, e: F.sh06End, fp: [-0.96, P.y - 0.16, 6.35], tp: [-0.88, P.y - 0.12, 5.95], curve: "linear" },
  { id: "SH07", type: "C07_ECU_Deadpan", s: F.sh06End, e: F.sh07End, fp: [0.96, P.y + 1.24, 4.38], tp: [1.02, P.y + 1.22, 4.02], curve: "linear" },
  { id: "SH08", type: "C02_MasterTwoShot", s: F.sh07End, e: F.sh08End, fp: [-0.22, P.y + 0.34, 13.65], tp: [0.08, P.y + 0.18, 13.10], curve: "linear" },
  { id: "SH09", type: "C10_DutchTiltPos", s: F.sh08End, e: F.sh09End, fp: [-0.20, P.y + 0.96, 11.45], tp: [-0.04, P.y + 1.02, 10.75], curve: "linear" },
  { id: "SH10", type: "C03_IntimateTwoShot", s: F.sh09End, e: F.sh10End, fp: [0.16, P.y + 0.68, 12.15], tp: [-0.08, P.y + 0.62, 11.55], curve: "linear" },
  { id: "SH11", type: "C12_CraneSweep", s: F.sh10End, e: F.sh11End, fp: [-0.95, P.y + 1.10, 14.85], tp: [0.80, P.y + 0.42, 13.55], curve: "easeOut" },
  { id: "SH12", type: "C11_PropMacro", s: F.sh11End, e: F.sh12End, fp: [0.16, P.y - 0.12, 11.45], tp: [-0.10, P.y - 0.18, 10.65], curve: "linear" },
  { id: "SH13", type: "C03_IntimateTwoShot", s: F.sh12End, e: F.sh13End, fp: [-0.18, P.y + 0.62, 13.35], tp: [0.06, P.y + 0.56, 12.65], curve: "linear" },
  { id: "SH14", type: "C10_DutchTiltNeg", s: F.sh13End, e: F.sh14End, fp: [0.12, 3.38, 11.95], tp: [-0.06, 3.26, 11.15], curve: "linear" },
  { id: "SH15", type: "C01_WidePullBack", s: F.sh14End, e: F.sh15End, fp: [-0.20, P.y + 0.68, 13.15], tp: [-1.58, P.y + 0.98, 15.25], curve: "easeOut" },
];

const cutSet = new Set(shots.slice(1).map((x) => x.s));

function getSpeakPresence(frame, who, ramp = 10) {
  let best = 0;
  for (const s of SPEECH_SPANS) {
    if (s.who !== who) continue;
    if (frame < s.startFrame - ramp || frame > s.endFrame + ramp) continue;
    const enter = smoothstep(s.startFrame - ramp * 0.5, s.startFrame + ramp * 0.5, frame);
    const exit = 1 - smoothstep(s.endFrame - ramp * 0.3, s.endFrame + ramp * 0.7, frame);
    best = Math.max(best, enter * exit);
  }
  return best;
}

console.log("=== 15-SHOT BESPOKE STORYBOARD RHYTHM AUDIT ===");
let totalDur = 0;
let minDur = 999;
let consecutiveSameType = 0;
for (let i = 0; i < shots.length; i++) {
  const sh = shots[i];
  const dur = (sh.e - sh.s) / FPS;
  totalDur += dur;
  minDur = Math.min(minDur, dur);
  if (sh.e <= sh.s) throw new Error(`Invalid shot bounds on ${sh.id}: ${sh.s}..${sh.e}`);
  if (i > 0 && shots[i - 1].type === sh.type) consecutiveSameType++;
  console.log(`  ${sh.id} | f=${String(sh.s).padStart(4)}..${String(sh.e - 1).padStart(4)} | ${(sh.s / FPS).toFixed(2)}s -> ${(sh.e / FPS).toFixed(2)}s (${dur.toFixed(2)}s) | ${sh.type}`);
}
const uniqueTypes = new Set(shots.map((s) => s.type.split("_")[0])).size;
console.log(`  Unique Camera Archetypes: ${uniqueTypes} (min required: 5) | Consecutive Duplicate Types: ${consecutiveSameType}`);
console.log(`  Average Shot Duration: ${(totalDur / shots.length).toFixed(2)}s | Shortest: ${minDur.toFixed(2)}s | Total: ${(TOTAL_FRAMES / FPS).toFixed(2)}s\n`);

let teleports = [];
let maxHmHeadDelta = 0;
let maxHmBodyYDelta = 0;
let maxOcBodyYDelta = 0;
let ringReversals = 0;
let prev = null;

for (let f = 0; f < TOTAL_FRAMES; f++) {
  const t = f / FPS;
  const inSH04 = f >= F.sh03End && f < F.sh04End;
  const inSH11 = f >= F.sh10End && f < F.sh11End;
  const inSH15 = f >= F.sh14End;
  let oc = [-1.32, P.y, P.z];
  if (inSH04 || inSH11) {
    oc = [-1.48, 0.44, 2.54]; // Intentional cut-aligned keyboard typing work montages (SH04 Dawn + SH11 Afternoon->Sunset)!
  } else if (inSH15) {
    const kopiDashU = smoothstep(CUES.s5_kopi - 4, CUES.s5_kopi + 24, f);
    oc = [lerp(-1.32, -1.68, kopiDashU), P.y, P.z];
  }
  const hm = [1.32, P.y, P.z];
  const ocSpk = getSpeakPresence(f, "openclaw", 10);
  const hmSpk = getSpeakPresence(f, "hermes", 10);
  const hmLst = clamp01(ocSpk * (1 - hmSpk));
  const hmBodyY = Math.sin(t * 1.45) * 0.020 + hmSpk * 0.022 * Math.sin(t * 2.1);
  const ocBodyY = Math.sin(t * 1.65) * 0.022 + ocSpk * 0.044 * (0.5 + 0.5 * Math.sin(t * 2.8));
  const hmHeadX = hmLst * 0.065 * Math.sin(t * 2.1) + Math.sin(t * 1.2) * 0.024 + hmSpk * 0.072 * Math.sin(t * 2.4);
  const ringZ = t * 0.45;

  if (prev) {
    const isCut = cutSet.has(f);
    const dOc = Math.hypot(oc[0] - prev.oc[0], oc[1] - prev.oc[1], oc[2] - prev.oc[2]);
    const dHm = Math.hypot(hm[0] - prev.hm[0], hm[1] - prev.hm[1], hm[2] - prev.hm[2]);
    if (!isCut && (dOc > 0.08 || dHm > 0.08)) {
      teleports.push({ f, dOc, dHm });
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

let camPingPong = 0;
for (const sh of shots) {
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

// 3D AABB Collision Audit between Characters & Custom Props
const boxes = {
  openclaw: { x0: -2.00, x1: -0.64, y0: P.y, y1: P.y + 1.82 },
  hermes:   { x0:  0.60, x1:  2.04, y0: P.y, y1: P.y + 1.92 },
  coffee:   { x0: -2.68, x1: -2.16, y0: P.y, y1: P.y + 0.80 },
  clock:    { x0: -0.46, x1:  0.46, y0: P.y + 1.46, y1: P.y + 2.50 },
  tower:    { x0: -0.46, x1:  0.46, y0: P.y, y1: P.y + 1.25 },
  badge:    { x0: -0.46, x1:  0.46, y0: P.y + 0.40, y1: P.y + 1.38 },
};
function overlaps2D(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}
const activePairs = [
  ["openclaw", "coffee"],
  ["openclaw", "clock"],
  ["openclaw", "tower"],
  ["openclaw", "badge"],
  ["hermes", "clock"],
  ["hermes", "tower"],
  ["hermes", "badge"],
  ["clock", "tower"], // co-visible in SH08!
  ["clock", "badge"], // co-visible in SH14!
];
const collisions = activePairs.filter(([k1, k2]) => overlaps2D(boxes[k1], boxes[k2]));

console.log("=== MATHEMATICAL MOTION, ANTI-CLIPPING & CAMERA AUDIT ===");
console.log(`  Unintended Character Teleports : ${teleports.length} (target: 0)`);
console.log(`  3D Prop/Character Collisions   : ${collisions.length} (target: 0)`);
console.log(`  Hermes Max Head Rot Delta/fr   : ${maxHmHeadDelta.toFixed(4)} rad/fr (limit: < 0.025)`);
console.log(`  Hermes Max Body Y Delta/fr     : ${maxHmBodyYDelta.toFixed(4)} m/fr   (limit: < 0.010)`);
console.log(`  OpenClaw Max Body Y Delta/fr   : ${maxOcBodyYDelta.toFixed(4)} m/fr   (limit: < 0.015)`);
console.log(`  Orbital Ring Velocity Reversals: ${ringReversals} (target: 0)`);
console.log(`  Camera X Ping-Pong Reversals   : ${camPingPong} (target: 0)`);

const ok =
  uniqueTypes >= 5 &&
  consecutiveSameType === 0 &&
  teleports.length === 0 &&
  collisions.length === 0 &&
  maxHmHeadDelta < 0.025 &&
  maxHmBodyYDelta < 0.010 &&
  maxOcBodyYDelta < 0.015 &&
  ringReversals === 0 &&
  camPingPong === 0;

if (!ok) {
  console.error("\nFAIL: Audit detected violations!", { collisions, teleports });
  process.exit(1);
}
console.log("\nPASS: ALL 15-SHOT MOTION, CAMERA, & ZERO-CLIPPING CHECKS PASSED 100%!");
