import * as THREE from "three";
import { clamp, clamp01, lerp, smoothstep, solveTwoBoneIK } from "./ikSolver3D";
import {
  asymmetricTime,
  computeNaturalBlink,
  computeNaturalSaccade,
  computeWeightShift,
  evalHumanStretchRelax,
  evalHumanTalkEmphasis,
  evalHumanTypingFlow,
  evalVisemeMouth,
  organicWave,
} from "../cinematic-3d-kit/NaturalActorEngine";

// ============================================================================
// ZALDY 3D CHARACTER RIG v2.0 (1.80m Metric Internal, Default Scale 20x = 36.0 Units)
// Studio-Grade Stylized 3D Film Look matching Zaldy's Official Character Sheet:
//  - Sculpted 3D Craniofacial Mesh (jawline, chin, cheekbones, 3D nose bridge, 3D ears)
//  - 1024x1024 Live Conformal Facial Rig Texture (almond eyes, warm iris gradients,
//    dual catchlights, natural brows, masculine blended lips, 8 sheet expressions + lip-sync)
//    -> ZERO intersecting sphere eyelids, ZERO black eye-socket gaps!
//  - Fluffy Matte-Velvet Parted Curtain Hair (#2A201C) with smooth S-curve locks
//  - Sleek Tailored Teal-Navy Almamater Blazer (#1D4259, ZERO robot shoulder balls!) + 'Z' Crest
//  - Modular Casual Room Rolled-Sleeve Outfit + 3 Footwear Modes (Socks, Slippers, Sneakers)
//  - 2-Bone Analytical Limb IK + 5-Finger Articulated Hands + 9 Preset Poses
// ============================================================================

export type ZaldyEmotion3D =
  | "neutral"
  | "happy_grin"
  | "shocked"
  | "angry"
  | "smirk"
  | "sleepy_bored"
  | "hyped_shout"
  | "worried";

export type ZaldyOutfitMode = "almamater" | "casual_room";
export type ZaldyFootwearMode = "socks" | "slippers" | "sneakers";

export type ZaldyHandGesture =
  | "relaxed"
  | "fist"
  | "point"
  | "pocket"
  | "chin_rest"
  | "phone_grip"
  | "type_keys"
  | "scratch_head"
  | "open_wave";

export type ZaldyPosePreset =
  | "stand_casual"
  | "stand_hands_pocket"
  | "stand_point_forward"
  | "crouch_chin_rest"
  | "stand_scratch_head"
  | "jump_cheer"
  | "sit_desk_typing"
  | "sit_desk_stretch"
  | "sit_desk_chin_rest"
  | "sit_bed_phone";

export interface ZaldyPoseParams {
  t: number;
  /** Optional local clip clock (seconds) for multi-beat acting clips like `sit_desk_stretch` */
  clipTime?: number;
  pose?: ZaldyPosePreset;
  emotion?: ZaldyEmotion3D;
  prevEmotion?: ZaldyEmotion3D;
  emotionBlend?: number;
  outfit?: ZaldyOutfitMode;
  footwear?: ZaldyFootwearMode;
  mouthTalk?: number;
  speakPresence?: number;
  listenPresence?: number;
  rootPos?: [number, number, number];
  facingYaw?: number;
  lookX?: number;
  lookY?: number;
  headTiltZ?: number;
  holdPhone?: boolean;
  customLeftHandLocal?: [number, number, number];
  customRightHandLocal?: [number, number, number];
  leftHandGesture?: ZaldyHandGesture;
  rightHandGesture?: ZaldyHandGesture;
}

interface MorphRecipe {
  browLiftL: number;
  browLiftR: number;
  browAngleL: number; // + = angry V tilt down inward, - = worried sad tilt up inward
  browAngleR: number;
  eyeOpenL: number;   // 1.0 = normal, 1.28 = wide shocked, 0.35 = sleepy, 0.0 = happy squint/blink
  eyeOpenR: number;
  happyArc: number;   // 1.0 = happy crescent ^ ^ squint!
  irisScale: number;
  jawOpen: number;
  mouthWidth: number;
  smileL: number;     // + = corner up, - = corner down
  smileR: number;
  showTeeth: number;
}

const EMOTION_RECIPES: Record<ZaldyEmotion3D, MorphRecipe> = {
  neutral: {
    browLiftL: 0.0,
    browLiftR: 0.0,
    browAngleL: 0.06,
    browAngleR: 0.06,
    eyeOpenL: 1.0,
    eyeOpenR: 1.0,
    happyArc: 0.0,
    irisScale: 1.0,
    jawOpen: 0.0,
    mouthWidth: 1.0,
    smileL: 0.12,
    smileR: 0.12,
    showTeeth: 0.0,
  },
  happy_grin: {
    browLiftL: 0.28,
    browLiftR: 0.28,
    browAngleL: -0.08,
    browAngleR: -0.08,
    eyeOpenL: 0.06,
    eyeOpenR: 0.06,
    happyArc: 1.0,
    irisScale: 1.0,
    jawOpen: 0.42,
    mouthWidth: 1.32,
    smileL: 0.95,
    smileR: 0.95,
    showTeeth: 1.0,
  },
  shocked: {
    browLiftL: 0.68,
    browLiftR: 0.68,
    browAngleL: -0.16,
    browAngleR: -0.16,
    eyeOpenL: 1.32,
    eyeOpenR: 1.32,
    happyArc: 0.0,
    irisScale: 0.84,
    jawOpen: 0.82,
    mouthWidth: 0.72,
    smileL: -0.08,
    smileR: -0.08,
    showTeeth: 0.35,
  },
  angry: {
    browLiftL: -0.35,
    browLiftR: -0.35,
    browAngleL: 0.58,
    browAngleR: 0.58,
    eyeOpenL: 0.76,
    eyeOpenR: 0.76,
    happyArc: 0.0,
    irisScale: 0.95,
    jawOpen: 0.04,
    mouthWidth: 0.92,
    smileL: -0.52,
    smileR: -0.52,
    showTeeth: 0.0,
  },
  smirk: {
    browLiftL: 0.34,
    browLiftR: -0.10,
    browAngleL: -0.08,
    browAngleR: 0.18,
    eyeOpenL: 0.88,
    eyeOpenR: 0.82,
    happyArc: 0.0,
    irisScale: 1.0,
    jawOpen: 0.02,
    mouthWidth: 1.08,
    smileL: 0.78,
    smileR: 0.05,
    showTeeth: 0.0,
  },
  sleepy_bored: {
    browLiftL: -0.10,
    browLiftR: -0.10,
    browAngleL: -0.16,
    browAngleR: -0.16,
    eyeOpenL: 0.34,
    eyeOpenR: 0.34,
    happyArc: 0.0,
    irisScale: 0.98,
    jawOpen: 0.06,
    mouthWidth: 0.84,
    smileL: -0.18,
    smileR: -0.18,
    showTeeth: 0.0,
  },
  hyped_shout: {
    browLiftL: -0.16,
    browLiftR: -0.16,
    browAngleL: 0.45,
    browAngleR: 0.45,
    eyeOpenL: 1.16,
    eyeOpenR: 1.16,
    happyArc: 0.0,
    irisScale: 0.92,
    jawOpen: 0.95,
    mouthWidth: 1.22,
    smileL: 0.28,
    smileR: 0.28,
    showTeeth: 1.0,
  },
  worried: {
    browLiftL: 0.38,
    browLiftR: 0.38,
    browAngleL: -0.48,
    browAngleR: -0.48,
    eyeOpenL: 1.08,
    eyeOpenR: 1.08,
    happyArc: 0.0,
    irisScale: 1.06,
    jawOpen: 0.10,
    mouthWidth: 0.88,
    smileL: -0.42,
    smileR: -0.42,
    showTeeth: 0.0,
  },
};

function lerpMorph(a: MorphRecipe, b: MorphRecipe, t: number): MorphRecipe {
  return {
    browLiftL: lerp(a.browLiftL, b.browLiftL, t),
    browLiftR: lerp(a.browLiftR, b.browLiftR, t),
    browAngleL: lerp(a.browAngleL, b.browAngleL, t),
    browAngleR: lerp(a.browAngleR, b.browAngleR, t),
    eyeOpenL: lerp(a.eyeOpenL, b.eyeOpenL, t),
    eyeOpenR: lerp(a.eyeOpenR, b.eyeOpenR, t),
    happyArc: lerp(a.happyArc, b.happyArc, t),
    irisScale: lerp(a.irisScale, b.irisScale, t),
    jawOpen: lerp(a.jawOpen, b.jawOpen, t),
    mouthWidth: lerp(a.mouthWidth, b.mouthWidth, t),
    smileL: lerp(a.smileL, b.smileL, t),
    smileR: lerp(a.smileR, b.smileR, t),
    showTeeth: lerp(a.showTeeth, b.showTeeth, t),
  };
}

// Tailored Metric Proportions (`1.80 m` Total Height, Sleek Natural Shoulders!)
const UPPER_ARM_LEN = 0.285;
const FOREARM_LEN = 0.255;
const THIGH_LEN = 0.44;
const SHIN_LEN = 0.415;
const ANKLE_H = 0.085;
const SHOULDER_X = 0.160; // Snug tailored shoulder seam — ZERO robot shoulder balls!
const SHOULDER_Y = 0.425;
const HIP_X = 0.092;
const HIP_Y = -0.04;

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Clean Smooth Stylized Pixar/Anime-Teen Head Mesh (`64x48`):
 *  - Handsome youthful teen oval (`±0.090m` wide, `±0.114m` tall, `±0.096m` deep = `18.0 × 22.8 × 19.2 cm`)
 *  - Clean, balanced, athletic jawline & soft rounded chin (neither baby-round nor alien-pinched!)
 *  - Silky smooth vertex normals so room lamps wrap cleanly from EVERY angle!
 */
function buildCleanStylizedHeadGeo(): THREE.BufferGeometry {
  const R = 0.100;
  const geo = new THREE.SphereGeometry(R, 64, 48);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ny = v.y / R;
    const nz = v.z / R;

    let sx = 0.90;
    const sy = 1.14;
    let sz = 0.96;

    if (ny < 0.0) {
      // Smooth youthful teen jawline taper into a clean rounded masculine chin
      const lowerT = clamp01(-ny);
      const smoothJaw = lowerT * lowerT * (3 - 2 * lowerT);
      sx *= 1.0 - smoothJaw * 0.18;
      if (nz < 0.0) {
        sz *= 1.0 - smoothJaw * 0.16;
      }
      if (nz > 0.15) {
        sz *= 1.0 + Math.sin(lowerT * Math.PI) * 0.036;
      }
    } else {
      const upperT = clamp01(ny);
      sx *= 1.0 + Math.sin(upperT * Math.PI) * 0.025;
      sz *= 1.0 + Math.sin(upperT * Math.PI) * 0.02;
    }

    pos.setXYZ(i, v.x * sx, v.y * sy, v.z * sz);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a sleek, refined stylized 3D Pixar-teen nose (clean slender bridge + soft subtle tip in matching skinMat):
 * Handsome from Front, 3/4, Side Profile, AND Top-Down view — ZERO round button-doll knob!
 */
function buildStylizedNoseGeo(): THREE.BufferGeometry {
  const R = 0.010;
  const geo = new THREE.SphereGeometry(R, 28, 22);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / R;
    const ny = v.y / R; // +1 top bridge -> -1 bottom tip
    const nz = v.z / R;

    const bridgeT = clamp01((1.0 - ny) * 0.5);
    const widthScale =
      lerp(0.42, 0.72, smoothstep(0.0, 0.74, bridgeT)) *
      (ny < -0.58 ? lerp(1.0, 0.72, (-0.58 - ny) / 0.42) : 1.0);
    const projZ =
      lerp(0.38, 1.24, smoothstep(0.04, 0.76, bridgeT)) *
      (ny < -0.54 ? lerp(1.0, 0.48, (-0.54 - ny) / 0.46) : 1.0);

    const x = nx * R * widthScale;
    const y = ny * 0.0165;
    const z = nz > 0 ? nz * R * projZ : nz * R * 0.48;
    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a clean glossy warm-espresso iris texture for Zaldy's 3D physical eyes
 * (rich dark-chocolate limbal ring + warm honey-chestnut lower crescent glow + crisp obsidian pupil).
 */
function buildZaldyIrisTexture(): THREE.CanvasTexture {
  return makeCanvasTex(256, 256, (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.48;

    // Outer deep espresso limbal ring & rich warm chestnut body
    const baseGr = g.createRadialGradient(cx, cy + 16, r * 0.15, cx, cy, r);
    baseGr.addColorStop(0.0, "#6E432C");
    baseGr.addColorStop(0.45, "#422417");
    baseGr.addColorStop(0.80, "#23120B");
    baseGr.addColorStop(1.0, "#120907");
    g.fillStyle = baseGr;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();

    // Warm lower iris bounce crescent (classic Pixar soulful eye depth!)
    const crescentGr = g.createRadialGradient(cx, cy + r * 0.42, 4, cx, cy + r * 0.38, r * 0.55);
    crescentGr.addColorStop(0.0, "rgba(182, 118, 76, 0.78)");
    crescentGr.addColorStop(0.55, "rgba(128, 76, 46, 0.35)");
    crescentGr.addColorStop(1.0, "rgba(66, 36, 23, 0)");
    g.fillStyle = crescentGr;
    g.beginPath();
    g.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
    g.fill();

    // Crisp deep obsidian center pupil
    g.fillStyle = "#090606";
    g.beginPath();
    g.arc(cx, cy, r * 0.46, 0, Math.PI * 2);
    g.fill();
  });
}

/**
 * Builds a smooth, plump, soft-tipped Pixar sculpted 3D hair ribbon (ZERO razor needle spikes!).
 */
function buildHairLockGeo(
  pts: [number, number, number][],
  width: number,
  thickness: number,
  rootScale = 0.90
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const segs = 18;
  const frames = curve.computeFrenetFrames(segs, false);
  const ringPts = 12;

  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u);
    // Soft plush Pixar hair clump profile: full body tapering softly to a gentle rounded-feather tip!
    const profile =
      u < 0.16
        ? lerp(rootScale, 1.0, u / 0.16)
        : u < 0.66
        ? 1.0
        : Math.pow(Math.max(0.0, 1.0 - (u - 0.66) / 0.34), 0.56);

    const w = width * Math.max(0.05, profile);
    const th = thickness * Math.max(0.05, profile);

    const radial = p.clone().sub(new THREE.Vector3(0, 0.015, -0.01)).normalize();
    const tangent = frames.tangents[i].clone().normalize();
    const side = new THREE.Vector3().crossVectors(tangent, radial);
    if (side.lengthSq() < 1e-5) side.set(1, 0, 0);
    side.normalize();
    const out = new THREE.Vector3().crossVectors(side, tangent).normalize();

    for (let j = 0; j < ringPts; j++) {
      const ang = (j / ringPts) * Math.PI * 2;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      verts.push(
        p.x + side.x * ca * w + out.x * sa * th,
        p.y + side.y * ca * w + out.y * sa * th,
        p.z + side.z * ca * w + out.z * sa * th
      );
      uvs.push(j / ringPts, u);
    }
  }

  const tipPt = curve.getPointAt(1.0);
  const tipIdx = (segs + 1) * ringPts;
  verts.push(tipPt.x, tipPt.y, tipPt.z);
  uvs.push(0.5, 1.0);

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < ringPts; j++) {
      const jNext = (j + 1) % ringPts;
      const a = i * ringPts + j;
      const b = i * ringPts + jNext;
      const c = (i + 1) * ringPts + jNext;
      const d = (i + 1) * ringPts + j;
      indices.push(a, b, c, a, c, d);
    }
  }
  const lastRing = segs * ringPts;
  for (let j = 0; j < ringPts; j++) {
    const jNext = (j + 1) % ringPts;
    indices.push(lastRing + j, lastRing + jNext, tipIdx);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sleek Sculpted Pixar Hair Volume Dome fitted seamlessly to the `0.090 × 0.114 × 0.096` Teen Head:
 *  - Cohesive smooth sculpted hair mass (ZERO artichoke/pineapple crown petals!)
 *  - Gentle stylized flow ridges + clean hairline arch above forehead (`+0.052m`) & ears (`+0.028m`)!
 */
function buildSculptedHairMassGeo(): THREE.BufferGeometry {
  const R = 0.102;
  const geo = new THREE.SphereGeometry(R, 72, 54);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / R;
    const ny = v.y / R;
    const nz = v.z / R;

    // Smooth sleek sculpted crown volume hugging the `0.090 × 0.114 × 0.096` head cleanly
    let x = v.x * 0.99;
    let y = v.y * 1.18 + 0.014;
    let z = v.z * 1.06 - 0.008;

    // Subtle organic Blender-sculpted wave flow along hair direction (no noisy bumps!)
    const azim = Math.atan2(nx, nz);
    const flowRipple = Math.sin(azim * 7.0 + ny * 2.4) * 0.0022;
    const backWeight = smoothstep(0.06, -0.45, nz);
    const topWeight = smoothstep(0.20, 0.80, ny);

    x += Math.sign(x) * (topWeight * 0.005 + backWeight * 0.004) + nx * flowRipple;
    y += topWeight * 0.010 + ny * flowRipple * 0.4;
    z -= backWeight * 0.010 - nz * flowRipple;

    // Clean hairline & above-ear arch carve-out (tucks smoothly behind bangs with ZERO dark forehead gap!)
    const frontFactor = smoothstep(-0.20, 0.22, nz);
    const sideEarFactor = smoothstep(0.38, 0.78, Math.abs(nx)) * smoothstep(-0.26, 0.14, nz);
    const minY = lerp(
      -0.068,
      lerp(0.052, 0.028, sideEarFactor),
      frontFactor
    );

    if (y < minY) {
      const over = minY - y;
      y = minY;
      const tuck = clamp01(over / 0.08);
      x *= lerp(1.0, 0.80, tuck);
      z = lerp(z, -0.020, tuck * frontFactor);
    }

    pos.setXYZ(i, x, y, z);
    uv.setXY(i, (azim / (Math.PI * 2)) + 0.5, clamp01((y + 0.12) / 0.28));
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpts Zaldy's Clean Modern Pixar Stylized Two-Block Wolf-Mullet Hair:
 *  - Cohesive soft-matte deep espresso-charcoal Indonesian hair (ZERO spiky pineapple crown, ZERO reddish stripe noise!)
 *  - Sleek swooping 60/40 parted curtain/comma bangs hugging the forehead cleanly ABOVE the 3D eyebrows
 *  - Clean tapered two-block sides & short sideburns exposing sculpted 3D ears
 *  - Lush, smooth layered wolf-mullet nape tail with stylish outward flick!
 */
function buildZaldyHairGroup(): {
  group: THREE.Group;
  bangsGroup: THREE.Group;
  mulletTailGroup: THREE.Group;
} {
  const group = new THREE.Group();
  const bangsGroup = new THREE.Group();
  const mulletTailGroup = new THREE.Group();

  // Subtle cohesive dark-espresso silk hair strand texture (rich soft sheen, never flat black & never harsh brown stripes!)
  const hairStrandTex = makeCanvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#261E1B";
    g.fillRect(0, 0, w, h);
    let s = 9187;
    const R = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let x = 0; x < w; x += 2) {
      const v = R();
      g.fillStyle =
        v > 0.72
          ? "rgba(62, 49, 43, 0.34)"
          : v > 0.36
          ? "rgba(44, 34, 30, 0.30)"
          : "rgba(22, 16, 14, 0.35)";
      g.fillRect(x, 0, 2, h);
    }
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(18, 13, 11, 0.24)");
    gr.addColorStop(0.55, "rgba(66, 52, 46, 0.14)");
    gr.addColorStop(1, "rgba(24, 18, 15, 0.20)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  hairStrandTex.wrapS = hairStrandTex.wrapT = THREE.RepeatWrapping;

  const hairDeepRootMat = new THREE.MeshPhysicalMaterial({
    map: hairStrandTex,
    color: "#B4A69E",
    emissive: "#16100E",
    emissiveIntensity: 0.16,
    roughness: 0.68,
    metalness: 0.0,
    sheen: 0.42,
    sheenColor: "#6B564B",
    sheenRoughness: 0.58,
  });

  const hairBaseMat = new THREE.MeshPhysicalMaterial({
    map: hairStrandTex,
    color: "#C4B5AC",
    emissive: "#1A1310",
    emissiveIntensity: 0.18,
    roughness: 0.65,
    metalness: 0.0,
    sheen: 0.48,
    sheenColor: "#786154",
    sheenRoughness: 0.55,
  });

  const hairSoftHighlightMat = new THREE.MeshPhysicalMaterial({
    map: hairStrandTex,
    color: "#CEC0B7",
    emissive: "#1D1512",
    emissiveIntensity: 0.19,
    roughness: 0.62,
    metalness: 0.0,
    sheen: 0.52,
    sheenColor: "#856B5D",
    sheenRoughness: 0.52,
  });

  // 1. Cohesive Smooth Sculpted Hair Volume Dome (ZERO spiky pineapple petals on top!)
  const massMesh = new THREE.Mesh(buildSculptedHairMassGeo(), hairBaseMat);
  massMesh.castShadow = false;
  group.add(massMesh);

  // Subtle sleek sculpted crown sweeps hugging smoothly over top of dome (clean volume flow, ZERO protruding spikes!)
  const sleekTopSweeps: { pts: [number, number, number][]; w: number; th: number }[] = [
    {
      pts: [
        [-0.012, 0.132, 0.018],
        [-0.048, 0.130, -0.016],
        [-0.080, 0.104, -0.052],
        [-0.092, 0.054, -0.072],
      ],
      w: 0.036,
      th: 0.012,
    },
    {
      pts: [
        [0.010, 0.132, 0.018],
        [0.048, 0.130, -0.016],
        [0.080, 0.104, -0.052],
        [0.092, 0.054, -0.072],
      ],
      w: 0.036,
      th: 0.012,
    },
    {
      pts: [
        [0.0, 0.134, 0.004],
        [0.0, 0.134, -0.048],
        [0.0, 0.106, -0.092],
        [0.0, 0.056, -0.108],
      ],
      w: 0.042,
      th: 0.012,
    },
  ];
  sleekTopSweeps.forEach((sw, idx) => {
    group.add(new THREE.Mesh(buildHairLockGeo(sw.pts, sw.w, sw.th, 0.92), idx === 2 ? hairSoftHighlightMat : hairBaseMat));
  });

  // 2. Clean Two-Block Tapered Temple Sides + Neat Short Sideburns (exposing sculpted 3D ears cleanly at ±0.088m!)
  for (const side of [-1, 1]) {
    const templeSweep = buildHairLockGeo(
      [
        [side * 0.044, 0.126, 0.016],
        [side * 0.088, 0.102, 0.014],
        [side * 0.098, 0.066, 0.008],
        [side * 0.092, 0.030, -0.006],
      ],
      0.032,
      0.011
    );
    group.add(new THREE.Mesh(templeSweep, hairBaseMat));

    // Crisp tapered sideburn cleanly in front of the ear
    const sbGeo = buildHairLockGeo(
      [
        [side * 0.084, 0.062, 0.024],
        [side * 0.090, 0.034, 0.018],
        [side * 0.088, 0.006, 0.010],
        [side * 0.084, -0.012, 0.005],
      ],
      0.012,
      0.006
    );
    group.add(new THREE.Mesh(sbGeo, hairDeepRootMat));
  }

  // 3. LUSH SLEEK LAYERED WOLF-MULLET NAPE TAIL & NECK-FRAMING WINGS (`mulletTailGroup`)!
  // Smooth upper-nape overlapping curtain layer (`y = +0.08 -> -0.078m`)
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const theta = lerp(Math.PI * 0.68, Math.PI * 1.32, u);
    const sx = Math.sin(theta);
    const cz = Math.cos(theta);
    const flare = (u - 0.5) * 0.020;
    const stepGeo = buildHairLockGeo(
      [
        [sx * 0.056, 0.096, cz * 0.074 - 0.010],
        [sx * 0.092, 0.054, cz * 0.104 - 0.010],
        [sx * 0.096, 0.004, cz * 0.110 - 0.012],
        [sx * 0.090 + flare * 0.5, -0.044, cz * 0.104 - 0.014],
        [sx * 0.096 + flare, -0.082, cz * 0.112 - 0.016],
      ],
      0.034,
      0.013
    );
    mulletTailGroup.add(new THREE.Mesh(stepGeo, i % 2 === 0 ? hairSoftHighlightMat : hairBaseMat));
  }

  // Graceful collar-grazing feathered mullet tail (`y = +0.03 -> -0.142m` with soft stylish outward flick!)
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const theta = lerp(Math.PI * 0.72, Math.PI * 1.28, u);
    const sx = Math.sin(theta);
    const cz = Math.cos(theta);
    const centerDist = Math.abs(u - 0.5) * 2;
    const tipY = lerp(-0.142, -0.118, centerDist);
    const outFlickZ = lerp(-0.022, -0.012, centerDist);
    const outFlickX = (u - 0.5) * 0.034;

    const tailGeo = buildHairLockGeo(
      [
        [sx * 0.068, 0.038, cz * 0.090 - 0.012],
        [sx * 0.080, -0.016, cz * 0.098 - 0.012],
        [sx * 0.076, -0.066, cz * 0.096 - 0.014],
        [sx * 0.080 + outFlickX * 0.55, -0.106, cz * 0.104 + outFlickZ * 0.6 - 0.014],
        [sx * 0.086 + outFlickX, tipY, cz * 0.110 + outFlickZ - 0.014],
      ],
      0.030,
      0.012,
      0.88
    );
    mulletTailGroup.add(new THREE.Mesh(tailGeo, i % 2 === 0 ? hairBaseMat : hairDeepRootMat));
  }

  // Soft Post-Auricular Mullet Wings framing neck cleanly behind exposed ears
  for (const side of [-1, 1]) {
    const wingSpecs: { pts: [number, number, number][]; w: number; th: number; hi?: boolean }[] = [
      {
        pts: [
          [side * 0.080, 0.022, -0.036],
          [side * 0.082, -0.024, -0.048],
          [side * 0.088, -0.070, -0.056],
          [side * 0.096, -0.108, -0.062],
        ],
        w: 0.022,
        th: 0.010,
        hi: true,
      },
      {
        pts: [
          [side * 0.074, 0.012, -0.052],
          [side * 0.076, -0.038, -0.064],
          [side * 0.082, -0.086, -0.072],
          [side * 0.090, -0.128, -0.078],
        ],
        w: 0.024,
        th: 0.011,
      },
    ];
    wingSpecs.forEach((ws) => {
      mulletTailGroup.add(
        new THREE.Mesh(
          buildHairLockGeo(ws.pts, ws.w, ws.th, 0.86),
          ws.hi ? hairSoftHighlightMat : hairBaseMat
        )
      );
    });
  }

  group.add(mulletTailGroup);

  // 4. SLEEK SWOOPING 60/40 PARTED PIXAR CURTAIN BANGS (hugging forehead smoothly — ZERO hollow shadow gap!)
  const curtainSpecs: { pts: [number, number, number][]; w: number; th: number; hi?: boolean }[] = [
    // Left Inner Comma Sweep (originates smoothly from top part `x = -0.014`, hugs forehead curve cleanly!)
    {
      pts: [
        [-0.014, 0.126, 0.028],
        [-0.032, 0.106, 0.082],
        [-0.046, 0.072, 0.098],
        [-0.038, 0.039, 0.096],
      ],
      w: 0.032,
      th: 0.013,
      hi: true,
    },
    // Left Main Curtain Frame
    {
      pts: [
        [-0.022, 0.124, 0.022],
        [-0.058, 0.102, 0.074],
        [-0.078, 0.068, 0.086],
        [-0.080, 0.034, 0.074],
      ],
      w: 0.032,
      th: 0.013,
    },
    // Left Temple Blend
    {
      pts: [
        [-0.034, 0.120, 0.014],
        [-0.076, 0.096, 0.058],
        [-0.090, 0.062, 0.056],
        [-0.092, 0.030, 0.040],
      ],
      w: 0.026,
      th: 0.011,
    },
    // Right Hero Sweeping Curtain (wider 60% side — stylish modern Korean/Indonesian comma sweep!)
    {
      pts: [
        [-0.008, 0.126, 0.032],
        [0.020, 0.108, 0.086],
        [0.038, 0.074, 0.100],
        [0.028, 0.040, 0.097],
      ],
      w: 0.034,
      th: 0.013,
      hi: true,
    },
    // Right Main Curtain Sweep
    {
      pts: [
        [0.014, 0.124, 0.024],
        [0.054, 0.102, 0.076],
        [0.076, 0.068, 0.088],
        [0.078, 0.034, 0.076],
      ],
      w: 0.034,
      th: 0.013,
    },
    // Right Temple Blend
    {
      pts: [
        [0.032, 0.120, 0.014],
        [0.076, 0.096, 0.058],
        [0.090, 0.062, 0.056],
        [0.092, 0.030, 0.040],
      ],
      w: 0.026,
      th: 0.011,
    },
  ];

  curtainSpecs.forEach((cs) => {
    const m = new THREE.Mesh(
      buildHairLockGeo(cs.pts, cs.w, cs.th, 0.92),
      cs.hi ? hairSoftHighlightMat : hairBaseMat
    );
    m.castShadow = false;
    bangsGroup.add(m);
  });

  group.add(bangsGroup);
  return { group, bangsGroup, mulletTailGroup };
}

function buildArticulatedHand(
  side: -1 | 1,
  skinMat: THREE.Material
): {
  group: THREE.Group;
  setGesture: (g: ZaldyHandGesture, t: number) => void;
} {
  const group = new THREE.Group();

  // Smooth sculpted Pixar rounded palm (ZERO sharp boxy rectangle when hand passes camera!)
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.037, 18, 14), skinMat);
  palm.scale.set(0.92, 1.08, 0.36);
  palm.position.set(0, -0.036, 0);
  palm.castShadow = true;
  const wristRound = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 12), skinMat);
  wristRound.scale.set(1.02, 0.78, 0.68);
  group.add(palm, wristRound);

  const fingerSpecs = [
    { x: -side * 0.022, len: 0.060, r: 0.0074 },
    { x: -side * 0.007, len: 0.066, r: 0.0076 },
    { x: side * 0.008, len: 0.061, r: 0.0072 },
    { x: side * 0.022, len: 0.050, r: 0.0064 },
  ];

  const fingers = fingerSpecs.map((fs) => {
    const knuckle = new THREE.Group();
    knuckle.position.set(fs.x, -0.070, 0);
    const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(fs.r, fs.len * 0.45, 6, 8), skinMat);
    seg1.position.y = -fs.len * 0.26;
    const midJoint = new THREE.Group();
    midJoint.position.y = -fs.len * 0.52;
    const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(fs.r * 0.88, fs.len * 0.38, 6, 8), skinMat);
    seg2.position.y = -fs.len * 0.22;
    midJoint.add(seg2);
    knuckle.add(seg1, midJoint);
    group.add(knuckle);
    return { knuckle, midJoint };
  });

  const thumbRoot = new THREE.Group();
  thumbRoot.position.set(-side * 0.030, -0.030, 0.008);
  thumbRoot.rotation.z = side * 0.55;
  const thumbSeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0082, 0.036, 6, 8), skinMat);
  thumbSeg.position.y = -0.022;
  thumbRoot.add(thumbSeg);
  group.add(thumbRoot);

  const setGesture = (gesture: ZaldyHandGesture, t: number) => {
    // Natural softly cupped relaxed fingers (authentic Pixar hand silhouette — zero stiff flat paddles!)
    let curls = [0.66, 0.74, 0.84, 0.92];
    let thumbCurl = 0.42;

    if (gesture === "fist") {
      curls = [1.45, 1.50, 1.52, 1.55];
      thumbCurl = 1.05;
    } else if (gesture === "point") {
      curls = [0.06, 1.45, 1.50, 1.52];
      thumbCurl = 0.95;
    } else if (gesture === "pocket") {
      curls = [0.65, 0.72, 0.78, 0.84];
      thumbCurl = 0.45;
    } else if (gesture === "chin_rest") {
      curls = [0.58, 0.64, 0.72, 0.78];
      thumbCurl = 0.40;
    } else if (gesture === "phone_grip") {
      curls = [0.95, 1.05, 1.12, 1.15];
      thumbCurl = 0.65 + Math.sin(t * 9.5) * 0.18;
    } else if (gesture === "type_keys") {
      curls = [
        0.58 + Math.sin(t * 16.0) * 0.24,
        0.62 + Math.sin(t * 16.0 + 1.8) * 0.24,
        0.66 + Math.sin(t * 16.0 + 3.4) * 0.22,
        0.72 + Math.sin(t * 16.0 + 4.9) * 0.18,
      ];
      thumbCurl = 0.42;
    } else if (gesture === "scratch_head") {
      curls = [
        0.82 + Math.sin(t * 11.0) * 0.20,
        0.88 + Math.cos(t * 11.0) * 0.20,
        0.96,
        1.06,
      ];
      thumbCurl = 0.52;
    } else if (gesture === "open_wave") {
      curls = [0.22, 0.20, 0.24, 0.30];
      thumbCurl = 0.22;
    }

    fingers.forEach((f, idx) => {
      const c = curls[idx];
      f.knuckle.rotation.x = c * 0.66;
      f.midJoint.rotation.x = c * 0.78;
    });
    thumbRoot.rotation.x = thumbCurl * 0.65;
  };

  return { group, setGesture };
}

export interface ZaldyCharacterHandle {
  group: THREE.Group;
  eyeWorldPos: THREE.Vector3;
  handLeftWorldPos: THREE.Vector3;
  handRightWorldPos: THREE.Vector3;
  poseAt: (params: ZaldyPoseParams) => void;
}

export function buildZaldyCharacter3D(options?: {
  sceneScale?: number;
}): ZaldyCharacterHandle {
  const sceneScale = options?.sceneScale ?? 20.0;
  const root = new THREE.Group();
  root.name = "ZaldyCharacter3D";

  const metricRoot = new THREE.Group();
  metricRoot.scale.setScalar(sceneScale);
  root.add(metricRoot);

  // =========================================================================
  // 1. FILM-GRADE STYLIZED 3D MATERIALS (SEAMLESS WARM SKIN, ZERO MUDDY SHADOW!)
  // =========================================================================
  // Unified warm Pixar stylized skin material shared by head, nose, eyelids, ears, neck & hands!
  const bodySkinMat = new THREE.MeshPhysicalMaterial({
    color: "#E8AC88",
    emissive: "#462517",
    emissiveIntensity: 0.16,
    roughness: 0.54,
    metalness: 0.0,
    sheen: 0.32,
    sheenColor: "#FFD7BE",
    sheenRoughness: 0.58,
  });

  const earInnerMat = new THREE.MeshStandardMaterial({
    color: "#C47D5B",
    emissive: "#32180E",
    emissiveIntensity: 0.12,
    roughness: 0.65,
  });

  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: "#F8FAFC",
    emissive: "#283244",
    emissiveIntensity: 0.14,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
  });

  const irisTex = buildZaldyIrisTexture();
  const irisMat = new THREE.MeshBasicMaterial({ map: irisTex });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: "#FFFFFF" });
  const lashBrowMat = new THREE.MeshStandardMaterial({
    color: "#1E1410",
    emissive: "#0D0806",
    emissiveIntensity: 0.12,
    roughness: 0.58,
  });
  const lipLineMat = new THREE.MeshStandardMaterial({
    color: "#88493A",
    emissive: "#2A120D",
    emissiveIntensity: 0.10,
    roughness: 0.50,
  });
  const mouthInteriorMat = new THREE.MeshStandardMaterial({
    color: "#3F1218",
    roughness: 0.72,
  });
  const teethMat = new THREE.MeshStandardMaterial({
    color: "#F8FAFC",
    emissive: "#222834",
    emissiveIntensity: 0.10,
    roughness: 0.28,
  });
  const tongueMat = new THREE.MeshStandardMaterial({
    color: "#DF6F7B",
    roughness: 0.54,
  });
  const cheekBlushMat = new THREE.MeshStandardMaterial({
    color: "#EE8D78",
    roughness: 0.68,
    transparent: true,
    opacity: 0.20,
    depthWrite: false,
  });

  const blazerTex = makeCanvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#1D4259";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,0.032)";
    g.lineWidth = 1;
    for (let i = -h; i < w + h; i += 5) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + h, h);
      g.stroke();
    }
  });
  blazerTex.wrapS = blazerTex.wrapT = THREE.RepeatWrapping;
  blazerTex.repeat.set(4, 4);

  const blazerMat = new THREE.MeshPhysicalMaterial({
    map: blazerTex,
    roughness: 0.72,
    metalness: 0.02,
    sheen: 0.22,
    sheenColor: "#5084A6",
    sheenRoughness: 0.72,
  });

  const blazerLapelMat = new THREE.MeshPhysicalMaterial({
    color: "#163549",
    roughness: 0.66,
    metalness: 0.03,
    sheen: 0.24,
    sheenColor: "#5084A6",
  });

  const whiteShirtMat = new THREE.MeshPhysicalMaterial({
    color: "#F3F5F8",
    roughness: 0.66,
    metalness: 0.0,
    sheen: 0.16,
    sheenColor: "#FFFFFF",
  });

  const trousersMat = new THREE.MeshStandardMaterial({
    color: "#2A2A2C",
    roughness: 0.76,
    metalness: 0.04,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: "#18191C",
    roughness: 0.42,
    metalness: 0.25,
  });

  // Left-Chest Circular Silver-White 'Z' / Z-Automation Almamater Crest!
  const crestTex = makeCanvasTex(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = "#163347";
    g.beginPath();
    g.arc(128, 128, 116, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#CBD5E1";
    g.lineWidth = 15;
    g.beginPath();
    g.arc(128, 128, 108, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#94A3B8";
    g.lineWidth = 5;
    g.setLineDash([10, 8]);
    g.beginPath();
    g.arc(128, 128, 86, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "#F8FAFC";
    g.font = "900 112px 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("Z", 128, 134);
  });
  const crestMat = new THREE.MeshStandardMaterial({
    map: crestTex,
    transparent: true,
    roughness: 0.40,
    metalness: 0.22,
  });

  const shadowTex = makeCanvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 8, 64, 64, 60);
    gr.addColorStop(0, "rgba(4,6,12,0.68)");
    gr.addColorStop(0.6, "rgba(4,6,12,0.26)");
    gr.addColorStop(1, "rgba(4,6,12,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
  const contactShadowL = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.34),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  contactShadowL.rotation.x = -Math.PI / 2;
  const contactShadowR = contactShadowL.clone();
  metricRoot.add(contactShadowL, contactShadowR);

  // =========================================================================
  // 2. PELVIS, BELT & SLEEK TAILORED TORSO (ZERO Z-FIGHTING / CLEAN COLLAR!)
  // =========================================================================
  const pelvisGroup = new THREE.Group();
  metricRoot.add(pelvisGroup);

  const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.144, 0.15, 24), trousersMat);
  pelvisMesh.position.y = -0.04;
  pelvisMesh.scale.set(1.0, 1.0, 0.70);
  pelvisMesh.castShadow = pelvisMesh.receiveShadow = true;
  const hipCap = new THREE.Mesh(new THREE.SphereGeometry(0.142, 20, 14), trousersMat);
  hipCap.scale.set(1.0, 0.55, 0.70);
  hipCap.position.y = -0.095;
  pelvisGroup.add(pelvisMesh, hipCap);

  const torsoGroup = new THREE.Group();
  metricRoot.add(torsoGroup);

  // Neat tailored leather belt at waist (`y = 0.012`)
  const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.141, 0.141, 0.032, 26), beltMat);
  beltMesh.scale.set(1.01, 1.0, 0.71);
  beltMesh.position.y = 0.012;
  const buckleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.034, 0.012),
    new THREE.MeshStandardMaterial({ color: "#94A3B8", roughness: 0.3, metalness: 0.75 })
  );
  buckleMesh.position.set(0, 0.012, 0.101);
  torsoGroup.add(beltMesh, buckleMesh);

  // Smooth sculpted inner throat/clavicle base sitting cleanly inside the collar
  const clavicleSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.072, 0.09, 22), bodySkinMat);
  clavicleSkin.scale.set(1.0, 1.0, 0.78);
  clavicleSkin.position.set(0, 0.452, 0.002);
  torsoGroup.add(clavicleSkin);

  // Clean Fitted White Dress Shirt (`y = 0.02 .. 0.468m` — cleanly tucked inside blazer so ZERO shoulder speckles!)
  const shirtLowerGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.136, 0.02),
      new THREE.Vector2(0.140, 0.14),
      new THREE.Vector2(0.148, 0.28),
      new THREE.Vector2(0.154, 0.39),
      new THREE.Vector2(0.128, 0.448),
      new THREE.Vector2(0.058, 0.470),
    ],
    28
  );
  const whiteShirtTorso = new THREE.Mesh(shirtLowerGeo, whiteShirtMat);
  whiteShirtTorso.scale.set(0.96, 1.0, 0.66);
  whiteShirtTorso.castShadow = whiteShirtTorso.receiveShadow = true;
  torsoGroup.add(whiteShirtTorso);

  // Clean Sculpted Soft-Rolled White Shirt Collar (snug torus roll around neck — ZERO flat floating boxes!)
  const collarRoll = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.014, 14, 32),
    whiteShirtMat
  );
  collarRoll.rotation.x = Math.PI / 2 + 0.12;
  collarRoll.scale.set(1.02, 0.90, 1.05);
  collarRoll.position.set(0, 0.468, 0.002);
  torsoGroup.add(collarRoll);

  // Clean pearl shirt buttons down center placket (adds crisp tailored realism!)
  const shirtBtnMat = new THREE.MeshStandardMaterial({ color: "#CBD5E1", roughness: 0.35, metalness: 0.15 });
  for (const by of [0.39, 0.31, 0.23]) {
    const sBtn = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 10, 8), shirtBtnMat);
    sBtn.scale.set(1.0, 1.0, 0.45);
    sBtn.position.set(0, by, 0.098);
    torsoGroup.add(sBtn);
  }

  // --- ALMAMATER BLAZER SHELL GROUP (`outfit === "almamater"`) ---
  const almamaterGroup = new THREE.Group();
  torsoGroup.add(almamaterGroup);

  // Generous radial clearance over `whiteShirtTorso` (+2.2cm everywhere -> MATHEMATICALLY ZERO Z-FIGHTING!)
  const jacketShellPts = [
    new THREE.Vector2(0.154, -0.125),
    new THREE.Vector2(0.152, 0.04),
    new THREE.Vector2(0.162, 0.19),
    new THREE.Vector2(0.180, 0.38),
    new THREE.Vector2(0.164, 0.442),
    new THREE.Vector2(0.072, 0.472),
  ];
  const jacketShellGeo = new THREE.LatheGeometry(
    jacketShellPts,
    32,
    0.34,
    Math.PI * 2 - 0.68
  );
  const jacketShell = new THREE.Mesh(jacketShellGeo, blazerMat);
  jacketShell.scale.set(1.03, 1.0, 0.74);
  jacketShell.castShadow = jacketShell.receiveShadow = true;
  almamaterGroup.add(jacketShell);

  // Sleek Sculpted Teal Blazer Back Collar hugging behind the white shirt collar
  const blazerCollarRoll = new THREE.Mesh(
    new THREE.TorusGeometry(0.070, 0.015, 14, 32, Math.PI * 1.44),
    blazerLapelMat
  );
  blazerCollarRoll.rotation.x = Math.PI / 2 + 0.10;
  blazerCollarRoll.rotation.z = Math.PI * 0.78;
  blazerCollarRoll.scale.set(1.05, 0.90, 1.0);
  blazerCollarRoll.position.set(0, 0.468, -0.004);
  almamaterGroup.add(blazerCollarRoll);

  // Clean Continuous Tailored Blazer Lapels + Pocket Welts (zero jagged notch step!)
  for (const sx of [-1, 1]) {
    const lapelFull = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.38, 0.010), blazerLapelMat);
    lapelFull.position.set(sx * 0.056, 0.275, 0.114);
    lapelFull.rotation.set(-0.04, sx * 0.16, sx * 0.06);

    const pocketWelt = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.014, 0.008), blazerLapelMat);
    pocketWelt.position.set(sx * 0.102, 0.02, 0.102);
    pocketWelt.rotation.y = sx * 0.36;

    almamaterGroup.add(lapelFull, pocketWelt);
  }

  const btnMat = new THREE.MeshStandardMaterial({ color: "#0F1E2B", roughness: 0.35, metalness: 0.3 });
  for (const by of [0.16, 0.06]) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.005, 14), btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(-0.050, by, 0.123);
    almamaterGroup.add(btn);
  }

  // Signature Circular Silver-White 'Z' Crest clearly visible on Left Chest!
  const crestMesh = new THREE.Mesh(new THREE.CircleGeometry(0.026, 28), crestMat);
  crestMesh.position.set(0.086, 0.315, 0.119);
  crestMesh.rotation.set(-0.06, 0.22, 0);
  almamaterGroup.add(crestMesh);

  // =========================================================================
  // 3. NATURAL NECK, CLEAN PIXAR STYLIZED 3D HEAD, TRUE 3D FACE & WOLF-MULLET
  // =========================================================================
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.096, 24), bodySkinMat);
  neckMesh.position.set(0, 0.500, -0.002);
  neckMesh.castShadow = true;
  torsoGroup.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.598, 0.006); // Natural athletic teen neck (`chin at 0.483` cleanly above collar!)
  torsoGroup.add(headGroup);

  // Silky-Smooth Clean Pixar Stylized Oval Head (ZERO lumpy cheeks, ZERO pinched alien chin!)
  const headMesh = new THREE.Mesh(buildCleanStylizedHeadGeo(), bodySkinMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = false; // Keeps face warmly lit & spotless under night room lamps!
  headGroup.add(headMesh);

  // Clean Subtle 3D Stylized Nose in matching `bodySkinMat` (slender bridge + refined tip!)
  const noseMesh = new THREE.Mesh(buildStylizedNoseGeo(), bodySkinMat);
  noseMesh.position.set(0, -0.018, 0.094);
  noseMesh.rotation.x = -0.06;
  headGroup.add(noseMesh);

  // Soft Warm Stylized Cheek Blush ovals conformal to `±0.090m` cheek curve
  const zaldyBlushes = [-1, 1].map((dir) => {
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.015, 16, 12), cheekBlushMat);
    bl.scale.set(1.15, 0.58, 0.22);
    bl.position.set(dir * 0.052, -0.026, 0.074);
    bl.rotation.set(0.10, dir * 0.56, 0);
    headGroup.add(bl);
    return bl;
  });

  // TRUE 3D Handsome Almond-Pixar Eyes (Wider confident teen proportion — NOT baby-round doll!)
  const zaldyEyes = [-1, 1].map((dir) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(dir * 0.0345, -0.003, 0.0865);
    eyeGroup.rotation.y = dir * 0.34;
    headGroup.add(eyeGroup);

    const openEyeContent = new THREE.Group();
    eyeGroup.add(openEyeContent);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0168, 24, 20), scleraMat);
    sclera.scale.set(1.20, 0.80, 0.34);
    openEyeContent.add(sclera);

    // Crisp confident dark curved upper eyelash contour hugging almond sclera
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.0205, 0.002, 0.0032),
      new THREE.Vector3(-0.006, 0.0125, 0.0068),
      new THREE.Vector3(0.006, 0.0125, 0.0068),
      new THREE.Vector3(0.0205, 0.002, 0.0032),
    ]);
    openEyeContent.add(
      new THREE.Mesh(new THREE.TubeGeometry(lashCurve, 18, 0.0023, 8, false), lashBrowMat)
    );

    // Glossy 3D Espresso Iris + Black Pupil + Crisp Dual Specular Catchlights
    const pupilGroup = new THREE.Group();
    pupilGroup.position.set(0, -0.0005, 0.0062);
    openEyeContent.add(pupilGroup);

    const irisDisc = new THREE.Mesh(new THREE.CircleGeometry(0.0102, 28), irisMat);
    pupilGroup.add(irisDisc);

    const catch1 = new THREE.Mesh(new THREE.CircleGeometry(0.0032, 16), catchlightMat);
    catch1.position.set(-0.0032, 0.0034, 0.0008);
    const catch2 = new THREE.Mesh(new THREE.CircleGeometry(0.0015, 12), catchlightMat);
    catch2.position.set(0.0032, -0.0030, 0.0008);
    pupilGroup.add(catch1, catch2);

    // Smooth Curved 3D Skin-Toned Upper Eyelid Dome
    const upperLid = new THREE.Group();
    upperLid.position.set(0, 0.0142, 0.0038);
    const upperLidShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.0196, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      bodySkinMat
    );
    upperLidShell.scale.set(1.18, 0.86, 0.40);
    upperLidShell.rotation.x = Math.PI;
    const upperLidRim = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.020, 0, 0.002),
          new THREE.Vector3(0, -0.0016, 0.0052),
          new THREE.Vector3(0.020, 0, 0.002),
        ]),
        14,
        0.0018,
        8,
        false
      ),
      lashBrowMat
    );
    upperLid.add(upperLidShell, upperLidRim);
    upperLid.visible = false;
    openEyeContent.add(upperLid);

    // Smooth Curved 3D Lower Eyelid Dome
    const lowerLid = new THREE.Group();
    lowerLid.position.set(0, -0.0140, 0.0038);
    const lowerLidShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.0196, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      bodySkinMat
    );
    lowerLidShell.scale.set(1.18, 0.80, 0.40);
    lowerLid.add(lowerLidShell);
    lowerLid.visible = false;
    openEyeContent.add(lowerLid);

    // Expressive Happy `^ ^` Eye Arc for `happy_grin`!
    const happyArcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.0185, -0.003, 0.005),
      new THREE.Vector3(0, 0.009, 0.0085),
      new THREE.Vector3(0.0185, -0.003, 0.005),
    ]);
    const happyArcMesh = new THREE.Mesh(
      new THREE.TubeGeometry(happyArcCurve, 18, 0.0028, 8, false),
      lashBrowMat
    );
    happyArcMesh.visible = false;
    eyeGroup.add(happyArcMesh);

    return { dir, eyeGroup, openEyeContent, pupilGroup, upperLid, lowerLid, happyArcMesh };
  });

  // Confident Masculine 3D Curved Eyebrows (straighter handsome arch, clean espresso thickness!)
  const zaldyBrows = [-1, 1].map((dir) => {
    const browPivot = new THREE.Group();
    browPivot.position.set(dir * 0.0345, 0.0215, 0.0888);
    browPivot.rotation.set(-0.12, dir * 0.34, 0);
    headGroup.add(browPivot);

    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-dir * 0.0195, -0.0012, -0.001),
      new THREE.Vector3(dir * 0.004, 0.0026, 0.0024),
      new THREE.Vector3(dir * 0.0205, -0.0016, -0.0018),
    ]);
    const browGeo = new THREE.TubeGeometry(browCurve, 18, 0.0036, 10, false);
    browGeo.scale(1.0, 0.88, 0.52);
    const browMesh = new THREE.Mesh(browGeo, lashBrowMat);
    browPivot.add(browMesh);

    return { dir, browPivot, baseY: 0.0215 };
  });

  // TRUE Articulated 3D Talking Mouth (Continuous Upper + Lower Lip Frame + Jaw-Drop Cavity + Anchored Teeth + Tongue!)
  // ZERO binary pop/snap between closed & open — articulates AA / EE / OO / OH / M-B-P smoothly!
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.052, 0.0865);
  mouthGroup.rotation.x = 0.18;
  headGroup.add(mouthGroup);

  const zUpperLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.0205, 0.0028, -0.0032),
    new THREE.Vector3(0.0, -0.0028, 0.0032),
    new THREE.Vector3(0.0205, 0.0028, -0.0032),
  ]);
  const upperLipLine = new THREE.Mesh(
    new THREE.TubeGeometry(zUpperLipCurve, 18, 0.0022, 8, false),
    lipLineMat
  );
  mouthGroup.add(upperLipLine);

  const zLowerLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.0185, 0.0020, -0.0028),
    new THREE.Vector3(0.0, -0.0032, 0.0028),
    new THREE.Vector3(0.0185, 0.0020, -0.0028),
  ]);
  const lowerLipLine = new THREE.Mesh(
    new THREE.TubeGeometry(zLowerLipCurve, 18, 0.0020, 8, false),
    lipLineMat
  );
  mouthGroup.add(lowerLipLine);

  // Open mouth cavity pivots cleanly DOWNWARD from upper lip (`y = 0` at top -> lower jaw drops!)
  const openMouthGroup = new THREE.Group();
  openMouthGroup.position.set(0, -0.001, -0.0005);
  const openMouthMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0148, 22, 16), mouthInteriorMat);
  openMouthMesh.scale.set(1.18, 0.94, 0.26);
  openMouthMesh.position.set(0, -0.0125, 0); // Top at +0.0014, bottom at -0.0264
  // Rounded curved upper teeth bar tucked strictly INSIDE the maroon cavity (ZERO protruding box corners!)
  const zaldyTeeth = new THREE.Mesh(new THREE.CapsuleGeometry(0.0024, 0.0135, 8, 12), teethMat);
  zaldyTeeth.rotation.z = Math.PI / 2;
  zaldyTeeth.scale.set(1.0, 1.0, 0.55);
  zaldyTeeth.position.set(0, -0.0048, 0.0019);
  // Soft pink tongue tucked cleanly INSIDE lower cavity (NEVER pokes past lower lip!)
  const zaldyTongue = new THREE.Mesh(new THREE.SphereGeometry(0.0086, 14, 12), tongueMat);
  zaldyTongue.scale.set(0.95, 0.44, 0.34);
  zaldyTongue.position.set(0, -0.0175, 0.0015);
  openMouthGroup.add(openMouthMesh, zaldyTeeth, zaldyTongue);
  openMouthGroup.visible = false;
  mouthGroup.add(openMouthGroup);

  // Clean Sculpted 3D Stylized Ears matching `±0.088m` head width
  for (const sx of [-1, 1]) {
    const earGrp = new THREE.Group();
    earGrp.position.set(sx * 0.088, -0.008, -0.006);
    earGrp.rotation.set(0.04, sx * -0.24, sx * -0.06);
    const earOuter = new THREE.Mesh(new THREE.SphereGeometry(0.021, 18, 14), bodySkinMat);
    earOuter.scale.set(0.38, 1.12, 0.72);
    const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 14, 10), earInnerMat);
    earInner.scale.set(0.28, 0.88, 0.52);
    earInner.position.set(sx * 0.003, -0.002, 0.003);
    earGrp.add(earOuter, earInner);
    headGroup.add(earGrp);
  }

  const hairRig = buildZaldyHairGroup();
  headGroup.add(hairRig.group);

  // =========================================================================
  // 4. SLEEK SEAMLESS LIMBS (ZERO BULKY BALL JOINTS!) + 3 FOOTWEAR MODES
  // =========================================================================
  const makeTaperedLimbGeo = (rTop: number, rBot: number, len: number) => {
    // Bottom-to-top profile order guarantees outward-facing normals in Three.js LatheGeometry!
    const pts = [
      new THREE.Vector2(rBot * 0.88, -len),
      new THREE.Vector2(rBot, -len * 0.96),
      new THREE.Vector2(lerp(rTop, rBot, 0.65), -len * 0.72),
      new THREE.Vector2(rTop * 0.96, -len * 0.36),
      new THREE.Vector2(rTop, -0.018),
      new THREE.Vector2(rTop * 0.92, 0.012),
      new THREE.Vector2(0.0, 0.02),
    ];
    return new THREE.LatheGeometry(pts, 22);
  };

  const upperArmBlazerGeo = makeTaperedLimbGeo(0.046, 0.041, UPPER_ARM_LEN);
  const forearmBlazerGeo = makeTaperedLimbGeo(0.040, 0.035, FOREARM_LEN);
  const upperArmCasualGeo = makeTaperedLimbGeo(0.044, 0.039, UPPER_ARM_LEN);
  const forearmSkinGeo = makeTaperedLimbGeo(0.036, 0.028, FOREARM_LEN);

  const thighGeo = makeTaperedLimbGeo(0.068, 0.053, THIGH_LEN);
  const shinGeo = makeTaperedLimbGeo(0.052, 0.040, SHIN_LEN);

  const buildArmRig = (sx: -1 | 1) => {
    const shoulderNode = new THREE.Group();
    // Full seamless shoulder cap bridging cleanly into jacket even at 160° overhead stretch (ZERO shoulder crease!)
    const shoulderCapBlazer = new THREE.Mesh(new THREE.SphereGeometry(0.049, 18, 14), blazerMat);
    shoulderCapBlazer.scale.set(0.98, 1.04, 0.96);
    const shoulderCapCasual = new THREE.Mesh(new THREE.SphereGeometry(0.046, 18, 14), whiteShirtMat);
    shoulderCapCasual.scale.set(0.98, 1.04, 0.96);

    const upperBlazer = new THREE.Mesh(upperArmBlazerGeo, blazerMat);
    const upperCasual = new THREE.Mesh(upperArmCasualGeo, whiteShirtMat);
    upperBlazer.castShadow = upperCasual.castShadow = true;

    const rolledCuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.039, 0.007, 10, 20),
      whiteShirtMat
    );
    rolledCuff.rotation.x = Math.PI / 2;
    rolledCuff.position.y = -UPPER_ARM_LEN + 0.016;
    upperCasual.add(rolledCuff);

    shoulderNode.add(shoulderCapBlazer, shoulderCapCasual, upperBlazer, upperCasual);

    const elbowNode = new THREE.Group();
    elbowNode.position.y = -UPPER_ARM_LEN;
    // Matched exact sleeve radius (`0.041`) so elbows NEVER show a notch gap when bent or stretched overhead!
    const elbowJointBlazer = new THREE.Mesh(new THREE.SphereGeometry(0.0415, 16, 12), blazerMat);
    const elbowJointSkin = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), bodySkinMat);
    const foreBlazer = new THREE.Mesh(forearmBlazerGeo, blazerMat);
    const foreSkin = new THREE.Mesh(forearmSkinGeo, bodySkinMat);
    foreBlazer.castShadow = foreSkin.castShadow = true;

    const wristShirtCuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.020, 18),
      whiteShirtMat
    );
    wristShirtCuff.position.y = -FOREARM_LEN + 0.006;
    foreBlazer.add(wristShirtCuff);

    if (sx === 1) {
      const watchBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.030, 0.030, 0.015, 18),
        new THREE.MeshStandardMaterial({ color: "#1E293B", roughness: 0.4, metalness: 0.5 })
      );
      watchBand.position.y = -FOREARM_LEN + 0.026;
      foreSkin.add(watchBand);
    }

    const handNode = new THREE.Group();
    handNode.position.y = -FOREARM_LEN;
    const handRig = buildArticulatedHand(sx, bodySkinMat);
    handNode.add(handRig.group);

    elbowNode.add(elbowJointBlazer, elbowJointSkin, foreBlazer, foreSkin, handNode);
    shoulderNode.add(elbowNode);
    metricRoot.add(shoulderNode);

    return {
      shoulderNode,
      elbowNode,
      handNode,
      handRig,
      blazerParts: [shoulderCapBlazer, upperBlazer, elbowJointBlazer, foreBlazer],
      casualParts: [shoulderCapCasual, upperCasual, elbowJointSkin, foreSkin],
    };
  };

  const armL = buildArmRig(-1);
  const armR = buildArmRig(1);

  const heldPhoneGrp = new THREE.Group();
  heldPhoneGrp.position.set(0.012, -0.050, 0.026);
  heldPhoneGrp.rotation.set(-0.35, 0.18, -0.12);
  const hpBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.144, 0.009),
    new THREE.MeshPhysicalMaterial({ color: "#0F172A", roughness: 0.25, metalness: 0.75, clearcoat: 0.85 })
  );
  const hpScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.064, 0.132),
    new THREE.MeshBasicMaterial({ color: "#60A5FA", toneMapped: false })
  );
  hpScreen.position.z = 0.005;
  const hpLight = new THREE.PointLight("#7DD3FC", 2.2, 22.0, 1.5);
  hpLight.position.set(0, 0.02, 0.09);
  heldPhoneGrp.add(hpBody, hpScreen, hpLight);
  heldPhoneGrp.visible = false;
  armL.handNode.add(heldPhoneGrp);

  const sockMat = new THREE.MeshStandardMaterial({ color: "#D1D5DB", roughness: 0.85 });
  const slipperMat = new THREE.MeshStandardMaterial({ color: "#1E293B", roughness: 0.65 });
  const sneakerUpperMat = new THREE.MeshStandardMaterial({ color: "#ECEEF2", roughness: 0.48 });
  const sneakerSuedeMat = new THREE.MeshStandardMaterial({ color: "#A3A6AD", roughness: 0.72 });
  const sneakerStripeMat = new THREE.MeshStandardMaterial({ color: "#1F2328", roughness: 0.42 });
  const sneakerSoleMat = new THREE.MeshStandardMaterial({ color: "#F8FAFC", roughness: 0.58 });

  const buildLegRig = (sx: -1 | 1) => {
    const hipNode = new THREE.Group();
    const thighMesh = new THREE.Mesh(thighGeo, trousersMat);
    thighMesh.castShadow = thighMesh.receiveShadow = true;
    hipNode.add(thighMesh);

    const kneeNode = new THREE.Group();
    kneeNode.position.y = -THIGH_LEN;
    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.049, 16, 12), trousersMat);
    const shinMesh = new THREE.Mesh(shinGeo, trousersMat);
    shinMesh.castShadow = shinMesh.receiveShadow = true;
    const trouserHem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.046, 0.026, 18),
      trousersMat
    );
    trouserHem.position.y = -SHIN_LEN + 0.022;
    shinMesh.add(trouserHem);

    const ankleNode = new THREE.Group();
    ankleNode.position.y = -SHIN_LEN;

    const sockGrp = new THREE.Group();
    const sockAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.065, 16), sockMat);
    sockAnkle.position.y = -0.022;
    const sockFoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.112, 8, 14), sockMat);
    sockFoot.rotation.x = Math.PI / 2;
    sockFoot.scale.set(1.0, 1.0, 0.72);
    sockFoot.position.set(0, -0.058, 0.046);
    sockFoot.castShadow = true;
    sockGrp.add(sockAnkle, sockFoot);

    const slipperGrp = new THREE.Group();
    const slipSole = new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.022, 0.232), slipperMat);
    slipSole.position.set(0, -0.074, 0.050);
    const slipStrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.047, 0.080, 16, 1, true, -Math.PI * 0.5, Math.PI),
      slipperMat
    );
    slipStrap.rotation.z = Math.PI / 2;
    slipStrap.rotation.y = Math.PI / 2;
    slipStrap.position.set(0, -0.048, 0.060);
    slipperGrp.add(slipSole, slipStrap);

    const sneakerGrp = new THREE.Group();
    const snkSole = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.026, 0.242), sneakerSoleMat);
    snkSole.position.set(0, -0.072, 0.052);
    snkSole.castShadow = true;
    const snkUpper = new THREE.Mesh(new THREE.BoxGeometry(0.090, 0.052, 0.192), sneakerUpperMat);
    snkUpper.position.set(0, -0.038, 0.040);
    snkUpper.castShadow = true;
    const snkToe = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 12), sneakerSuedeMat);
    snkToe.scale.set(0.98, 0.62, 1.15);
    snkToe.position.set(0, -0.048, 0.130);
    for (const sideS of [-1, 1]) {
      for (const zOff of [0.024, 0.050]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.044, 0.012), sneakerStripeMat);
        stripe.position.set(sideS * 0.046, -0.038, zOff);
        stripe.rotation.x = -0.38;
        sneakerGrp.add(stripe);
      }
    }
    sneakerGrp.add(snkSole, snkUpper, snkToe);

    ankleNode.add(sockGrp, slipperGrp, sneakerGrp);
    kneeNode.add(kneeCap, shinMesh, ankleNode);
    hipNode.add(kneeNode);
    metricRoot.add(hipNode);

    return { hipNode, kneeNode, ankleNode, sockGrp, slipperGrp, sneakerGrp, sx };
  };

  const legL = buildLegRig(-1);
  const legR = buildLegRig(1);

  const eyeWorldPos = new THREE.Vector3();
  const handLeftWorldPos = new THREE.Vector3();
  const handRightWorldPos = new THREE.Vector3();

  // =========================================================================
  // 5. DETERMINISTIC PER-FRAME POSE, HD FACE CANVAS & 2-BONE IK EVALUATOR
  // =========================================================================
  function poseAt(params: ZaldyPoseParams) {
    const {
      t,
      clipTime,
      pose = "stand_casual",
      emotion = "neutral",
      prevEmotion,
      emotionBlend = 1,
      outfit = "almamater",
      footwear = "socks",
      mouthTalk = 0,
      speakPresence = 0,
      listenPresence = 0,
      rootPos = [0, 0, 0],
      facingYaw = 0,
      lookX = 0,
      lookY = 0,
      headTiltZ = 0,
      holdPhone = false,
      customLeftHandLocal,
      customRightHandLocal,
      leftHandGesture,
      rightHandGesture,
    } = params;

    root.position.set(...rootPos);
    root.rotation.set(0, facingYaw, 0);

    const isAlmamater = outfit === "almamater";
    almamaterGroup.visible = isAlmamater;
    // Snug inside blazer (zero shoulder z-fighting!) vs full crisp fit in casual white-shirt mode
    whiteShirtTorso.scale.set(isAlmamater ? 0.96 : 1.07, 1.0, isAlmamater ? 0.66 : 0.71);
    armL.blazerParts.forEach((m) => (m.visible = isAlmamater));
    armR.blazerParts.forEach((m) => (m.visible = isAlmamater));
    armL.casualParts.forEach((m) => (m.visible = !isAlmamater));
    armR.casualParts.forEach((m) => (m.visible = !isAlmamater));

    [legL, legR].forEach((lg) => {
      lg.sockGrp.visible = footwear === "socks" || footwear === "slippers";
      lg.slipperGrp.visible = footwear === "slippers";
      lg.sneakerGrp.visible = footwear === "sneakers";
    });

    heldPhoneGrp.visible = holdPhone || pose === "sit_bed_phone";

    // Organic Whole-Body Weight Shift, Spine-Lead Talking Emphasis, & Eye Saccades (ZERO stiff statue frames!)
    const ws = computeWeightShift(t, 4.3, 0.4);
    const talk = evalHumanTalkEmphasis(t, speakPresence);
    const listenNod = listenPresence * 0.055 * Math.sin(t * 2.15);
    const breath = ws.hipY;

    let hipPos = new THREE.Vector3(ws.hipX, 0.96 + breath, 0);
    let torsoLeanX = talk.torsoPitchAdd;
    let torsoLeanZ = ws.spineZ;
    let torsoTwistY = ws.spineY + talk.torsoTwistAdd;
    let footL = new THREE.Vector3(-0.10, 0, 0.0);
    let footR = new THREE.Vector3(0.10, 0, 0.0);
    let footPitchL = 0;
    let footPitchR = 0;
    let handL = new THREE.Vector3(-0.205, 0.86, 0.04);
    let handR = new THREE.Vector3(0.205, 0.86, 0.04);
    let gestL: ZaldyHandGesture = "relaxed";
    let gestR: ZaldyHandGesture = "relaxed";
    let headPitchAdd = talk.headNodAdd + listenNod;
    let headYawAdd = 0;
    let headRollAdd = ws.headCounterZ + talk.headTiltAdd;
    let showFloorShadows = true;
    let extraMouthOpen = 0;
    let extraBrowLift = talk.browPulse;
    let extraLookX = 0;
    let extraBlinkPulse = 0;

    if (pose === "stand_hands_pocket") {
      hipPos.set(-0.022 + ws.hipX * 1.15, 0.955 + breath, 0);
      torsoLeanX = -0.025 + talk.torsoPitchAdd * 0.85;
      torsoLeanZ = 0.042 + ws.spineZ * 1.1;
      torsoTwistY = 0.10 + ws.spineY + talk.torsoTwistAdd;
      footL.set(-0.13, 0, 0.04);
      footR.set(0.11, 0, -0.04);
      // Right hand can gesture casually out when speaking warmly, left stays relaxed in pocket!
      const gestureOut = smoothstep(0.35, 0.85, speakPresence);
      handL.set(-0.148 + ws.hipX * 0.6, 0.93 + breath * 0.5, 0.082);
      handR.set(
        lerp(0.148, 0.23, gestureOut),
        lerp(0.92, 1.06 + talk.handLiftR, gestureOut),
        lerp(0.082, 0.24 + talk.handFwdR, gestureOut)
      );
      gestL = "pocket";
      gestR = gestureOut > 0.45 ? "open_wave" : "pocket";
      headRollAdd += -0.04;
    } else if (pose === "stand_point_forward") {
      const pointT = asymmetricTime(t, -1, 0.08);
      hipPos.set(0.015 + ws.hipX, 0.95 + breath, 0.02);
      torsoLeanX = 0.05 + talk.torsoPitchAdd * 0.9;
      torsoLeanZ = ws.spineZ * 0.85;
      torsoTwistY = 0.16 + ws.spineY * 0.8 + talk.torsoTwistAdd;
      footL.set(-0.13, 0, 0.08);
      footR.set(0.13, 0, -0.07);
      handL.set(
        -0.14 + organicWave(pointT, 1.8, 0.4) * 0.022,
        1.33 + organicWave(pointT, 2.6, 0.9) * 0.024 + talk.handLiftL * 0.35,
        0.50 + organicWave(pointT, 2.2, 1.3) * 0.025
      );
      handR.set(0.205, 0.88 + talk.handLiftR * 0.55, 0.05 + talk.handFwdR * 0.5);
      gestL = "point";
      gestR = "relaxed";
    } else if (pose === "crouch_chin_rest") {
      hipPos.set(ws.hipX * 0.5, 0.54 + breath * 0.5, -0.06);
      torsoLeanX = 0.28 + Math.sin(t * 1.4) * 0.015;
      torsoLeanZ = -0.04 + ws.spineZ * 0.6;
      footL.set(-0.18, 0, 0.16);
      footR.set(0.17, 0, 0.12);
      // Positioned cleanly beneath left outer jaw/cheek (ZERO cheek/face clipping!)
      handL.set(-0.105, 0.99 + breath * 0.5, 0.165);
      handR.set(0.16, 0.66, 0.23);
      gestL = "chin_rest";
      gestR = "relaxed";
      headRollAdd += -0.10;
    } else if (pose === "stand_scratch_head") {
      hipPos.set(0.02 + ws.hipX, 0.955 + breath, 0);
      torsoLeanZ = -0.04 + ws.spineZ;
      torsoTwistY = -0.10 + ws.spineY;
      footL.set(-0.105, 0, -0.02);
      footR.set(0.115, 0, 0.04);
      handL.set(-0.145, 0.935, 0.085);
      // Cleanly brushes outer right crown surface (`x = 0.155`) -> ZERO hair/skull clipping!
      handR.set(0.155 + Math.sin(t * 6.5) * 0.010, 1.655 + Math.cos(t * 6.5) * 0.008, 0.02);
      gestL = "pocket";
      gestR = "scratch_head";
      headRollAdd += 0.07;
    } else if (pose === "jump_cheer") {
      const bounce = Math.abs(Math.sin(t * 4.5)) * 0.075;
      hipPos.set(0, 1.01 + bounce, 0);
      torsoLeanX = -0.07;
      footL.set(-0.17, bounce * 0.85, 0.04);
      footR.set(0.18, bounce * 0.65, -0.03);
      footPitchL = 0.22;
      footPitchR = 0.28;
      handL.set(-0.25, 1.84 + bounce, 0.08);
      handR.set(0.25, 1.86 + bounce * 0.92, 0.08);
      gestL = "fist";
      gestR = "fist";
    } else if (pose === "sit_desk_typing") {
      // Upgraded Voxelverse-grade active typing with realistic mouse-reach weight shift & head tilt!
      const flow = evalHumanTypingFlow(clipTime ?? t);
      hipPos.set(ws.hipX * 0.35, 0.50 + breath * 0.5, 0.0);
      torsoLeanX = flow.torsoLeanX;
      torsoLeanZ = flow.torsoLeanZ;
      torsoTwistY = flow.torsoTwistY;
      footL.set(-0.13, 0.0, 0.28);
      footR.set(0.13, 0.0, 0.26);
      handL.set(...flow.handL);
      handR.set(...flow.handR);
      gestL = "type_keys";
      gestR = flow.isMouseReach ? "relaxed" : "type_keys";
      headPitchAdd += flow.headPitch;
      headYawAdd += flow.headYaw;
      headRollAdd += flow.headRoll;
    } else if (pose === "sit_desk_stretch") {
      // Signature Voxelverse 12-Principles Multi-Beat Stretch + Asymmetric Face/Glasses Recovery!
      const st = evalHumanStretchRelax(clipTime ?? t);
      hipPos.set(ws.hipX * 0.3, 0.50 + breath * 0.5, 0.0);
      torsoLeanX = st.torsoLeanX;
      torsoLeanZ = st.torsoLeanZ;
      torsoTwistY = st.torsoTwistY;
      footL.set(-0.13, 0.0, 0.28);
      footR.set(0.13, 0.0, 0.26);
      handL.set(...st.handL);
      handR.set(...st.handR);
      gestL = "relaxed";
      gestR = "relaxed";
      headPitchAdd = st.headPitch;
      headYawAdd = st.headYaw;
      headRollAdd = st.headRoll;
      extraMouthOpen = st.mouthStretchOpen;
      extraBrowLift += st.browLiftAdd;
      extraLookX = st.lookXAdd;
      extraBlinkPulse = st.blinkPulse;
    } else if (pose === "sit_desk_chin_rest") {
      hipPos.set(ws.hipX * 0.35, 0.50 + breath * 0.5, 0.02);
      torsoLeanX = 0.20 + organicWave(t, 1.1, 0.5) * 0.020 + talk.torsoPitchAdd * 0.45;
      torsoLeanZ = -0.03 + ws.spineZ * 0.60;
      torsoTwistY = ws.spineY * 0.60 + talk.torsoTwistAdd * 0.55;
      footL.set(-0.14, 0.0, 0.26);
      footR.set(0.14, 0.0, 0.24);
      // Positioned cleanly beneath left jawline (`x = -0.108, y = 0.96, z = 0.175`) -> ZERO cheek/temple penetration!
      handL.set(-0.108, 0.96 + breath * 0.5, 0.175);
      // Right hand rests/gestures cleanly ABOVE desk surface (`y = 0.812` -> ZERO desk clipping!)
      handR.set(
        0.18 + talk.handFwdR * 0.35,
        0.812 + talk.handLiftR * 0.75,
        0.35 + talk.handFwdR * 0.45
      );
      gestL = "chin_rest";
      gestR = speakPresence > 0.4 ? "open_wave" : "relaxed";
      headRollAdd += -0.08;
      headPitchAdd += 0.08;
    } else if (pose === "sit_bed_phone") {
      showFloorShadows = false;
      hipPos.set(ws.hipX * 0.4, 0.48 + breath * 0.4, 0.0);
      torsoLeanX = -0.20 + organicWave(t, 0.9, 0.3) * 0.025 + talk.torsoPitchAdd * 0.6;
      torsoLeanZ = ws.spineZ * 0.5;
      torsoTwistY = ws.spineY * 0.6 + talk.torsoTwistAdd * 0.7;
      footL.set(-0.11, 0.46, 0.74);
      footR.set(0.12, 0.46, 0.72);
      footPitchL = -0.35 + Math.sin(t * 1.4) * 0.06;
      footPitchR = -0.28 + Math.cos(t * 1.3) * 0.06;
      handL.set(-0.05 + organicWave(t, 1.2, 0.7) * 0.015, 0.90 + organicWave(t, 1.8, 0.2) * 0.014, 0.30);
      handR.set(0.17 + talk.handFwdR * 0.3, 0.56 + talk.handLiftR * 1.4, 0.22 + talk.handFwdR * 0.8);
      gestL = "phone_grip";
      gestR = speakPresence > 0.35 ? "open_wave" : "relaxed";
      headPitchAdd += 0.20;
      headYawAdd += 0.06;
    } else {
      hipPos.set(ws.hipX, 0.96 + breath, 0);
      handL.set(-0.205, 0.86 + talk.handLiftL, 0.04 + talk.handFwdL);
      handR.set(0.205, 0.86 + talk.handLiftR, 0.04 + talk.handFwdR);
      gestL = speakPresence > 0.35 ? "open_wave" : "relaxed";
      gestR = speakPresence > 0.55 ? "open_wave" : "relaxed";
    }

    if (customLeftHandLocal) handL.set(...customLeftHandLocal);
    if (customRightHandLocal) handR.set(...customRightHandLocal);
    if (leftHandGesture) gestL = leftHandGesture;
    if (rightHandGesture) gestR = rightHandGesture;

    const spineQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(torsoLeanX, torsoTwistY, torsoLeanZ, "YXZ")
    );
    const spineBase = hipPos.clone().add(new THREE.Vector3(0, 0.02, 0));

    pelvisGroup.position.copy(hipPos);
    pelvisGroup.quaternion.setFromEuler(new THREE.Euler(torsoLeanX * 0.25, torsoTwistY * 0.35, torsoLeanZ * 0.25));

    torsoGroup.position.copy(spineBase);
    torsoGroup.quaternion.copy(spineQuat);

    // Organic eye saccades + natural irregular blink (with auto-blink on crisp eye darts/head turns!)
    const sacc = computeNaturalSaccade(t, lookX + extraLookX, lookY, 2.9, 0.14);
    const hYaw = clamp(sacc.lookX * 0.46 + headYawAdd, -0.68, 0.68);
    const hPitch = clamp(-sacc.lookY * 0.32 + headPitchAdd, -0.45, 0.48);
    const hRoll = clamp(headTiltZ + headRollAdd, -0.35, 0.35);
    headGroup.rotation.set(hPitch, hYaw, hRoll, "YXZ");

    hairRig.bangsGroup.rotation.z = -hRoll * 0.22 + organicWave(t - 0.08, 2.0, 0.5) * 0.012;
    hairRig.bangsGroup.rotation.x = organicWave(t - 0.08, 1.7, 1.2) * 0.010;
    // Mullet tail secondary sway + generous automatic collar-clearance lift when looking up (`hPitch < 0`)!
    hairRig.mulletTailGroup.rotation.x = Math.max(0, -hPitch * 0.65) + 0.04 + organicWave(t - 0.12, 1.9, 0.8) * 0.015;
    hairRig.mulletTailGroup.rotation.y = -hYaw * 0.16;

    const shoulderLW = spineBase
      .clone()
      .add(new THREE.Vector3(-SHOULDER_X, SHOULDER_Y, 0).applyQuaternion(spineQuat));
    const shoulderRW = spineBase
      .clone()
      .add(new THREE.Vector3(SHOULDER_X, SHOULDER_Y, 0).applyQuaternion(spineQuat));

    const elbowPoleL = (
      gestL === "chin_rest"
        ? new THREE.Vector3(-0.48, -0.92, 0.52)
        : gestL === "type_keys"
        ? new THREE.Vector3(-0.68, -0.82, -0.22)
        : pose === "sit_desk_stretch"
        ? new THREE.Vector3(-0.82, 0.18, 0.45) // Natural outward-bent overhead stretch elbows (like Voxelverse!)
        : new THREE.Vector3(-0.72, -0.35, -0.62)
    )
      .applyQuaternion(spineQuat)
      .normalize();

    const elbowPoleR = (
      gestR === "type_keys"
        ? new THREE.Vector3(0.68, -0.82, -0.22)
        : gestR === "scratch_head"
        ? new THREE.Vector3(0.88, 0.15, 0.35)
        : pose === "sit_desk_stretch"
        ? new THREE.Vector3(0.82, 0.18, 0.45) // Natural outward-bent overhead stretch elbows!
        : new THREE.Vector3(0.72, -0.35, -0.62)
    )
      .applyQuaternion(spineQuat)
      .normalize();

    const ikArmL = solveTwoBoneIK(shoulderLW, handL, UPPER_ARM_LEN, FOREARM_LEN, elbowPoleL);
    const ikArmR = solveTwoBoneIK(shoulderRW, handR, UPPER_ARM_LEN, FOREARM_LEN, elbowPoleR);

    armL.shoulderNode.position.copy(shoulderLW);
    armL.shoulderNode.quaternion.copy(ikArmL.upperQuat);
    armL.elbowNode.quaternion.copy(ikArmL.lowerQuat);
    armL.handRig.setGesture(gestL, t);

    armR.shoulderNode.position.copy(shoulderRW);
    armR.shoulderNode.quaternion.copy(ikArmR.upperQuat);
    armR.elbowNode.quaternion.copy(ikArmR.lowerQuat);
    armR.handRig.setGesture(gestR, t);

    // Natural pronated/cupped wrist orientations (anatomically smooth at wrist cuff — ZERO sharp kink!)
    if (gestL === "type_keys") {
      armL.handNode.rotation.set(-Math.PI * 0.40, Math.PI, 0.08);
    } else if (gestL === "chin_rest") {
      armL.handNode.rotation.set(0.28, Math.PI * 0.38, -0.32);
    } else if (gestL === "point") {
      armL.handNode.rotation.set(-Math.PI * 0.46, 0.12, -0.18);
    } else if (pose === "sit_desk_stretch") {
      armL.handNode.rotation.set(0.18, -0.32, 0.16);
    } else {
      armL.handNode.rotation.set(
        0.08,
        gestL === "pocket" ? -0.30 : -0.18,
        0.06
      );
    }

    if (gestR === "type_keys") {
      armR.handNode.rotation.set(-Math.PI * 0.40, Math.PI, -0.08);
    } else if (gestR === "scratch_head") {
      armR.handNode.rotation.set(0.22, -Math.PI * 0.48, 0.30);
    } else if (pose === "sit_desk_stretch") {
      armR.handNode.rotation.set(0.18, 0.32, -0.16);
    } else {
      armR.handNode.rotation.set(
        0.08,
        gestR === "pocket" ? 0.30 : 0.18,
        -0.06
      );
    }

    const hipLW = hipPos.clone().add(new THREE.Vector3(-HIP_X, HIP_Y, 0));
    const hipRW = hipPos.clone().add(new THREE.Vector3(HIP_X, HIP_Y, 0));
    const ankleTargetL = new THREE.Vector3(footL.x, footL.y + ANKLE_H, footL.z);
    const ankleTargetR = new THREE.Vector3(footR.x, footR.y + ANKLE_H, footR.z);

    const kneePoleL = new THREE.Vector3(-0.10, 0.15, 1.0).normalize();
    const kneePoleR = new THREE.Vector3(0.10, 0.15, 1.0).normalize();

    const ikLegL = solveTwoBoneIK(hipLW, ankleTargetL, THIGH_LEN, SHIN_LEN, kneePoleL);
    const ikLegR = solveTwoBoneIK(hipRW, ankleTargetR, THIGH_LEN, SHIN_LEN, kneePoleR);

    legL.hipNode.position.copy(hipLW);
    legL.hipNode.quaternion.copy(ikLegL.upperQuat);
    legL.kneeNode.quaternion.copy(ikLegL.lowerQuat);
    const worldFootQuatL = new THREE.Quaternion().setFromEuler(new THREE.Euler(footPitchL, 0, 0));
    legL.ankleNode.quaternion.copy(ikLegL.lowerWorldQuat.clone().invert().multiply(worldFootQuatL));

    legR.hipNode.position.copy(hipRW);
    legR.hipNode.quaternion.copy(ikLegR.upperQuat);
    legR.kneeNode.quaternion.copy(ikLegR.lowerQuat);
    const worldFootQuatR = new THREE.Quaternion().setFromEuler(new THREE.Euler(footPitchR, 0, 0));
    legR.ankleNode.quaternion.copy(ikLegR.lowerWorldQuat.clone().invert().multiply(worldFootQuatR));

    contactShadowL.visible = showFloorShadows && footL.y < 0.06;
    contactShadowR.visible = showFloorShadows && footR.y < 0.06;
    contactShadowL.position.set(footL.x, 0.003, footL.z + 0.04);
    contactShadowR.position.set(footR.x, 0.003, footR.z + 0.04);

    // Update TRUE 3D Expressive Stylized Facial Rig (Eyes, 3D Eyelids, Happy ^ ^ Arcs, 3D Brows, 3D Mouth!)
    const currRec = EMOTION_RECIPES[emotion];
    const prevRec = prevEmotion ? EMOTION_RECIPES[prevEmotion] : currRec;
    const baseM = lerpMorph(prevRec, currRec, clamp01(emotionBlend));
    const m: MorphRecipe = {
      ...baseM,
      browLiftL: clamp(baseM.browLiftL + extraBrowLift, -0.6, 0.9),
      browLiftR: clamp(baseM.browLiftR + extraBrowLift * 0.88, -0.6, 0.9),
      jawOpen: clamp(Math.max(baseM.jawOpen, extraMouthOpen), 0, 1),
    };

    const autoBlink = computeNaturalBlink(t, 0.41, Math.max(sacc.dartBlink, extraBlinkPulse));
    const showHappyArcs = m.happyArc > 0.45 && autoBlink < 0.7;

    // Warm cheek blush boosts smoothly on happy_grin / smirk!
    cheekBlushMat.opacity = m.happyArc > 0.4 ? 0.34 : (m.smileL + m.smileR) > 0.6 ? 0.24 : 0.16;
    zaldyBlushes.forEach((bl) => {
      bl.position.y = -0.026 + m.happyArc * 0.004;
    });

    // 3D Physical Eyes, Curved Eyelids & Natural Saccades
    for (const e of zaldyEyes) {
      const rawOpen = e.dir < 0 ? m.eyeOpenL : m.eyeOpenR;
      const bAngle = e.dir < 0 ? m.browAngleL : m.browAngleR;
      const effOpen = clamp(rawOpen * (1 - autoBlink * 0.96), 0.0, 1.32);

      e.happyArcMesh.visible = showHappyArcs;
      e.openEyeContent.visible = !showHappyArcs;

      if (!showHappyArcs) {
        const eyeScale = rawOpen > 1.12 ? lerp(1.0, 1.14, clamp01((rawOpen - 1.0) / 0.32)) : 1.0;
        e.eyeGroup.scale.setScalar(eyeScale);

        e.pupilGroup.scale.setScalar(m.irisScale);
        e.pupilGroup.position.x = clamp(sacc.lookX, -1, 1) * 0.0052;
        e.pupilGroup.position.y = -0.0005 + clamp(sacc.lookY, -1, 1) * 0.0036;

        // Upper lid smoothly lowers for natural blink, sleepy_bored, angry glare (`dir * +bAngle`!), and smirk
        const topClose = clamp01(1.0 - effOpen);
        e.upperLid.visible = topClose > 0.06;
        e.upperLid.scale.set(1.0, Math.max(0.01, topClose * 1.62), 1.0);
        e.upperLid.rotation.z = e.dir * bAngle * 0.36;

        // Subtle lower cheek-raise lid on warm smile/smirk
        const avgSm = (m.smileL + m.smileR) * 0.5;
        const botRaise = clamp01((avgSm - 0.3) * 0.45);
        e.lowerLid.visible = botRaise > 0.12;
        e.lowerLid.scale.set(1.0, Math.max(0.01, botRaise * 1.15), 1.0);
      } else {
        e.eyeGroup.scale.setScalar(1.0);
      }
    }

    // 3D Sculpted Eyebrows (`bAngle > 0` -> Angry V-frown `\ /`, `bAngle < 0` -> Worried `/ \`!)
    for (const b of zaldyBrows) {
      const bLift = b.dir < 0 ? m.browLiftL : m.browLiftR;
      const bAngle = b.dir < 0 ? m.browAngleL : m.browAngleR;
      b.browPivot.position.y = b.baseY + bLift * 0.0078;
      b.browPivot.rotation.z = b.dir * bAngle * 0.44;
    }

    // TRUE Continuous 3D Viseme Lip-Sync Articulation (AA / EE / OO / OH / M-B-P — ZERO binary pop/snap!)
    const avgSmile = (m.smileL + m.smileR) * 0.5;
    const asymSmirk = m.smileL - m.smileR;
    const vis = evalVisemeMouth({
      t,
      mouthTalk: Math.max(mouthTalk, extraMouthOpen),
      emotionJawOpen: m.jawOpen,
      emotionSmile: avgSmile,
      emotionWide: m.mouthWidth,
      showTeethBias: m.showTeeth,
      seed: 0.7,
    });

    // Subtle conversational jaw-pitch resonance on head when speaking
    headGroup.rotation.x += vis.talkJawMicroPitch;

    const smileCurveY =
      Math.abs(vis.cornerCurve) < 0.10 ? 0.20 : clamp(vis.cornerCurve * 1.32, -1.20, 1.40);
    const lipWidth = vis.widthX * 0.98;
    const cavScaleY = Math.max(0.06, vis.openY * 0.88);
    // Exact mathematical bottom rim of `openMouthMesh` (`-0.0264 * cavScaleY`) so lower lip ALWAYS seals cavity!
    const exactJawDrop = 0.0245 * cavScaleY;

    // Upper lip stays anchored near philtrum and arches softly on wide vowels / smiles!
    upperLipLine.visible = true;
    upperLipLine.position.set(0, vis.upperLipLift * 0.0035, vis.puckerZ * 0.0022);
    upperLipLine.scale.set(
      lipWidth,
      lerp(smileCurveY, -0.55 - vis.puckerZ * 0.30, vis.cavityWeight * 0.85),
      1.0 + vis.puckerZ * 0.22
    );
    upperLipLine.rotation.z = -asymSmirk * 0.22 * (1 - vis.cavityWeight * 0.6);

    // Lower lip mathematically locked to bottom rim of cavity (ZERO tongue poke-out, ZERO bare edge!)
    lowerLipLine.visible = vis.cavityWeight > 0.04;
    lowerLipLine.position.set(0, vis.upperLipLift * 0.003 - exactJawDrop, vis.puckerZ * 0.0020 - vis.openY * 0.0012);
    lowerLipLine.scale.set(
      lipWidth * lerp(0.90, 0.80, vis.puckerZ),
      lerp(0.45, 1.15 + vis.puckerZ * 0.30, vis.cavityWeight),
      1.0 + vis.puckerZ * 0.18
    );

    // Recessed cavity drops downward from upper lip so rounded teeth & tongue stay 100% inside mouth!
    openMouthGroup.visible = vis.cavityWeight > 0.02;
    openMouthGroup.position.set(0, vis.upperLipLift * 0.003 - 0.0005, vis.puckerZ * 0.0018 - 0.0006);
    openMouthGroup.scale.set(
      vis.widthX * lerp(0.68, 1.0, vis.cavityWeight),
      cavScaleY,
      0.95
    );
    zaldyTeeth.visible = vis.teethWeight > 0.18;
    zaldyTeeth.scale.set(lerp(0.84, 1.0, vis.teethWeight), 1.0, 0.55);
    zaldyTongue.visible = vis.tongueWeight > 0.20;
    zaldyTongue.scale.set(0.95, 0.44 * lerp(0.65, 1.0, vis.tongueWeight), 0.34);

    root.updateMatrixWorld(true);
    headGroup.getWorldPosition(eyeWorldPos);
    eyeWorldPos.y += 0.004 * sceneScale;
    armL.handNode.getWorldPosition(handLeftWorldPos);
    armR.handNode.getWorldPosition(handRightWorldPos);
  }

  return {
    group: root,
    eyeWorldPos,
    handLeftWorldPos,
    handRightWorldPos,
    poseAt,
  };
}
