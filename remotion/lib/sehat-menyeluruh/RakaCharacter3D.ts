import * as THREE from "three";
import { clamp, clamp01, lerp, smoothstep, solveTwoBoneIK } from "../zaldy-world/ikSolver3D";
import { createGouacheMaterial } from "./gouachePBR";

// ============================================================================
// RAKA — CONSISTENT SERIES PROTAGONIST RIG (SERI: SEHAT ITU MENYELURUH)
// Reusable across Video 1 & Video 2!
// - 1.78m Metric Internal Scale (default `sceneScale = 1.0`, works in meters!)
// - Painted Gouache Stylized-Realistic 3D aesthetic (Option 1 vibes in 3D!):
//   * Sculpted V-oval craniofacial head + 512x512 cached painterly facial rig
//   * Clean modern textured short Indonesian hair (warm espresso gouache highlights)
//   * Consistent wardrobe palette: Sage-Teal Henley (`#4B7F78`), Cream Tee (`#F2E8D5`),
//     Slate-Navy Tapered Trousers (`#283446`), Cream-Terracotta Sneakers (`#D45638`)
//   * Full 2-Bone Analytical Limb IK + 5-Finger Articulated Hands + 16 Action Poses!
// ============================================================================

export type RakaEmotion =
  | "neutral"
  | "startled"
  | "tired_yawn"
  | "slumped_drowsy"
  | "stressed_overwhelmed"
  | "peaceful_sleep"
  | "refreshed_smile"
  | "happy_walk"
  | "focused"
  | "eating";

export type RakaOutfit = "sleep_tee" | "casual_day" | "active_park";
export type RakaFootwear = "socks" | "sneakers";

export type RakaHandGesture =
  | "relaxed"
  | "grip_cup"
  | "grip_phone"
  | "type_keys"
  | "open_stretch"
  | "temple_stress"
  | "rub_neck"
  | "fist_jog";

export type RakaPosePreset =
  | "wake_startled_bed"
  | "rush_grab_drink"
  | "sit_desk_yawn"
  | "sit_desk_eat_instant"
  | "sit_desk_slouched"
  | "sit_desk_overwhelmed"
  | "stand_abstract_calm"
  | "sit_desk_close_laptop"
  | "lie_bed_sleep"
  | "wake_refreshed_bed"
  | "stand_drink_water"
  | "stand_kitchen_prep"
  | "stand_morning_stretch"
  | "sit_desk_organized"
  | "walk_brisk"
  | "jog_light";

export interface RakaPoseParams {
  t: number;
  pose?: RakaPosePreset;
  prevPose?: RakaPosePreset;
  poseBlend?: number;        // 0..1 smooth pose-to-pose interpolation (ZERO pose teleport!)
  actionProgress?: number;   // 0..1 multi-stage action arc inside a single shot (e.g. lie -> sit -> slap alarm!)
  emotion?: RakaEmotion;
  prevEmotion?: RakaEmotion;
  emotionBlend?: number;     // 0..1 smooth facial morph blend!
  breathRate?: number;       // 1.0 = normal, 1.8 = stressed rapid, 0.72 = calm deep sleep
  outfit?: RakaOutfit;
  footwear?: RakaFootwear;
  rootPos?: [number, number, number];
  facingYaw?: number;
  lookX?: number;
  lookY?: number;
  headTiltZ?: number;
  holdSodaCan?: boolean;
  holdInstantCup?: boolean;
  holdWaterGlass?: boolean;
  holdPhone?: boolean;
  waterLevel?: number; // 0..1 inside held water glass
  customLeftHandLocal?: [number, number, number];
  customRightHandLocal?: [number, number, number];
}

interface FaceMorph {
  browLiftL: number;
  browLiftR: number;
  browAngleL: number;
  browAngleR: number;
  eyeOpenL: number;
  eyeOpenR: number;
  happyArc: number;
  underEyeBag: number; // tired dark circles!
  jawOpen: number;
  mouthWidth: number;
  smileL: number;
  smileR: number;
  showTeeth: number;
}

const EMOTIONS: Record<RakaEmotion, FaceMorph> = {
  neutral: {
    browLiftL: 0, browLiftR: 0, browAngleL: 0.04, browAngleR: 0.04,
    eyeOpenL: 1.0, eyeOpenR: 1.0, happyArc: 0, underEyeBag: 0,
    jawOpen: 0, mouthWidth: 1.0, smileL: 0.14, smileR: 0.14, showTeeth: 0,
  },
  startled: {
    browLiftL: 0.72, browLiftR: 0.72, browAngleL: -0.22, browAngleR: -0.22,
    eyeOpenL: 1.32, eyeOpenR: 1.32, happyArc: 0, underEyeBag: 0.55,
    jawOpen: 0.58, mouthWidth: 0.76, smileL: -0.12, smileR: -0.12, showTeeth: 0.3,
  },
  tired_yawn: {
    browLiftL: -0.14, browLiftR: -0.14, browAngleL: -0.28, browAngleR: -0.28,
    eyeOpenL: 0.22, eyeOpenR: 0.22, happyArc: 0, underEyeBag: 0.85,
    jawOpen: 0.92, mouthWidth: 0.84, smileL: -0.22, smileR: -0.22, showTeeth: 0.2,
  },
  slumped_drowsy: {
    browLiftL: -0.18, browLiftR: -0.18, browAngleL: -0.22, browAngleR: -0.22,
    eyeOpenL: 0.42, eyeOpenR: 0.42, happyArc: 0, underEyeBag: 0.78,
    jawOpen: 0.04, mouthWidth: 0.88, smileL: -0.26, smileR: -0.26, showTeeth: 0,
  },
  stressed_overwhelmed: {
    browLiftL: 0.38, browLiftR: 0.38, browAngleL: -0.56, browAngleR: -0.56,
    eyeOpenL: 1.08, eyeOpenR: 1.08, happyArc: 0, underEyeBag: 0.72,
    jawOpen: 0.18, mouthWidth: 0.92, smileL: -0.52, smileR: -0.52, showTeeth: 0.1,
  },
  peaceful_sleep: {
    browLiftL: 0.06, browLiftR: 0.06, browAngleL: -0.04, browAngleR: -0.04,
    eyeOpenL: 0.0, eyeOpenR: 0.0, happyArc: 0, underEyeBag: 0.08,
    jawOpen: 0.02, mouthWidth: 0.92, smileL: 0.22, smileR: 0.22, showTeeth: 0,
  },
  refreshed_smile: {
    browLiftL: 0.26, browLiftR: 0.26, browAngleL: -0.08, browAngleR: -0.08,
    eyeOpenL: 0.92, eyeOpenR: 0.92, happyArc: 0.35, underEyeBag: 0,
    jawOpen: 0.28, mouthWidth: 1.24, smileL: 0.82, smileR: 0.82, showTeeth: 0.85,
  },
  happy_walk: {
    browLiftL: 0.20, browLiftR: 0.20, browAngleL: -0.06, browAngleR: -0.06,
    eyeOpenL: 1.04, eyeOpenR: 1.04, happyArc: 0, underEyeBag: 0,
    jawOpen: 0.18, mouthWidth: 1.18, smileL: 0.72, smileR: 0.72, showTeeth: 0.65,
  },
  focused: {
    browLiftL: -0.04, browLiftR: -0.04, browAngleL: 0.16, browAngleR: 0.16,
    eyeOpenL: 0.96, eyeOpenR: 0.96, happyArc: 0, underEyeBag: 0.05,
    jawOpen: 0.0, mouthWidth: 0.98, smileL: 0.22, smileR: 0.22, showTeeth: 0,
  },
  eating: {
    browLiftL: 0.06, browLiftR: 0.06, browAngleL: 0.0, browAngleR: 0.0,
    eyeOpenL: 0.86, eyeOpenR: 0.86, happyArc: 0, underEyeBag: 0.35,
    jawOpen: 0.42, mouthWidth: 0.86, smileL: 0.05, smileR: 0.05, showTeeth: 0.2,
  },
};

const UPPER_ARM_LEN = 0.282;
const FOREARM_LEN = 0.252;
const THIGH_LEN = 0.435;
const SHIN_LEN = 0.41;
const ANKLE_H = 0.082;
const SHOULDER_X = 0.150;
const SHOULDER_Y = 0.418;
const HIP_X = 0.092;
const HIP_Y = -0.04;

function buildCraniumGeo(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.11, 56, 42);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / 0.11;
    const ny = v.y / 0.11;
    const nz = v.z / 0.11;

    let sx = 0.91;
    let sy = 1.12;
    let sz = 0.98;

    if (ny < 0.15) {
      const jawT = clamp01((0.15 - ny) / 1.15);
      const frontWeight = smoothstep(-0.2, 0.8, nz);
      sx *= 1.0 - jawT * (0.26 + 0.16 * frontWeight);
      if (nz < -0.15) sz *= 1.0 - jawT * 0.18;
    } else {
      const crownT = clamp01((ny - 0.15) / 0.85);
      sx *= 1.0 + Math.sin(crownT * Math.PI) * 0.03;
      sz *= 1.02;
    }

    let x = v.x * sx;
    let y = v.y * sy;
    let z = v.z * sz;

    if (nz > 0.2) {
      const chinMask =
        Math.exp(-Math.pow((ny + 0.80) / 0.26, 2)) * Math.exp(-Math.pow(nx / 0.36, 2));
      z += chinMask * 0.009;

      const cheekMask =
        Math.exp(-Math.pow((ny + 0.08) / 0.26, 2)) *
        Math.exp(-Math.pow((Math.abs(nx) - 0.52) / 0.25, 2));
      x += Math.sign(nx) * cheekMask * 0.004;
      z += cheekMask * 0.004;

      const browMask =
        Math.exp(-Math.pow((ny - 0.22) / 0.12, 2)) * Math.exp(-Math.pow(nx / 0.56, 2));
      z += browMask * 0.004;
    }

    pos.setXYZ(i, x, y, z);
    const azim = Math.atan2(x, z);
    uv.setXY(i, 0.5 + azim / (Math.PI * 2), clamp01(0.5 + y / 0.666));
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * 512x512 Painterly Gouache Facial Rig (warm Indonesian tan skin `#D6956C` + soft gouache blush,
 * expressive almond eyes, under-eye fatigue shading when tired, natural brows & lips).
 */
function drawRakaFaceCanvas(
  g: CanvasRenderingContext2D,
  m: FaceMorph,
  lookX: number,
  lookY: number,
  autoBlink: number
) {
  const W = 512;
  const H = 512;

  // Painterly warm gouache skin wash
  const baseGr = g.createLinearGradient(0, 0, 0, H);
  baseGr.addColorStop(0, "#CE8D66");
  baseGr.addColorStop(0.48, "#D89A72");
  baseGr.addColorStop(1, "#C4825C");
  g.fillStyle = baseGr;
  g.fillRect(0, 0, W, H);

  const softGlow = (cx: number, cy: number, rx: number, ry: number, col: string) => {
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, col);
    gr.addColorStop(1, "rgba(216,154,114,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, rx, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };

  // Warm gouache cheek & nose subsurface flush (Option 1 warmth!)
  softGlow(224, 265, 22, 16, "rgba(224, 114, 98, 0.25)");
  softGlow(288, 265, 22, 16, "rgba(224, 114, 98, 0.25)");
  softGlow(256, 314, 26, 15, "rgba(176, 112, 82, 0.20)");

  const eyeY = 246;
  const eyeDX = 28;

  const drawEye = (sx: -1 | 1, rawOpen: number, browLift: number, browAngle: number) => {
    const ex = 256 + sx * eyeDX;
    const ey = eyeY;
    const ew = 24;
    const open = clamp(rawOpen * (1 - autoBlink * 0.96), 0.0, 1.38);
    const eh = 13.8 * open;

    // Fatigue under-eye shading (Scene 01 tired / Scene 04 stressed!)
    if (m.underEyeBag > 0.05) {
      softGlow(ex, ey + 9, 14, 6, `rgba(92, 68, 86, ${0.34 * m.underEyeBag})`);
    }

    if (open <= 0.06) {
      // Peaceful closed eyelid curve (sleep / blink)
      g.strokeStyle = "#241916";
      g.lineWidth = 2.6;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(ex - ew * 0.5, ey + 1.5);
      g.quadraticCurveTo(ex, ey + 4.8, ex + ew * 0.5, ey + 1.5);
      g.stroke();
    } else if (m.happyArc > 0.6) {
      g.strokeStyle = "#241916";
      g.lineWidth = 2.9;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(ex - ew * 0.5, ey + 3);
      g.quadraticCurveTo(ex, ey - 7, ex + ew * 0.5, ey + 3);
      g.stroke();
    } else {
      // Soft double-eyelid crease
      g.strokeStyle = "rgba(136, 82, 58, 0.55)";
      g.lineWidth = 1.3;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(ex - ew * 0.48, ey - eh * 0.35 - 2.4);
      g.quadraticCurveTo(ex - sx, ey - eh * 0.72 - 2.8, ex + ew * 0.48, ey - eh * 0.25 - 2.4);
      g.stroke();

      g.save();
      g.beginPath();
      g.moveTo(ex - ew * 0.52, ey + sx * 0.8);
      g.quadraticCurveTo(ex - sx, ey - eh * 0.74, ex + ew * 0.52, ey - sx * 0.5);
      g.quadraticCurveTo(ex + sx, ey + eh * 0.64, ex - ew * 0.52, ey + sx * 0.8);
      g.closePath();

      // Warm parchment-cream sclera (NEVER harsh #FFFFFF!)
      const scl = g.createLinearGradient(ex, ey - eh * 0.65, ex, ey + eh * 0.55);
      scl.addColorStop(0, "#D5D4D8");
      scl.addColorStop(0.32, "#F6F1E7");
      scl.addColorStop(1, "#ECE4D8");
      g.fillStyle = scl;
      g.fill();
      g.clip();

      const ix = ex + clamp(lookX * 4.4, -4.5, 4.5);
      const iy = ey - clamp(lookY * 3.0, -3.5, 3.5) - 0.3;
      const ir = 7.0;

      const irG = g.createRadialGradient(ix, iy + 1.5, ir * 0.15, ix, iy, ir);
      irG.addColorStop(0, "#6E432C");
      irG.addColorStop(0.55, "#3E2317");
      irG.addColorStop(1, "#1C100B");
      g.fillStyle = irG;
      g.beginPath();
      g.arc(ix, iy, ir, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = "#120B09";
      g.beginPath();
      g.arc(ix, iy, ir * 0.44, 0, Math.PI * 2);
      g.fill();

      // Warm cream Pixar/Kurzgesagt catchlights
      g.fillStyle = "#FFF8EB";
      g.beginPath();
      g.arc(ix - 2.1, iy - 2.1, 1.8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,244,224,0.82)";
      g.beginPath();
      g.arc(ix + 2.0, iy + 1.9, 0.95, 0, Math.PI * 2);
      g.fill();
      g.restore();

      g.strokeStyle = "#221714";
      g.lineWidth = 2.2;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(ex - ew * 0.52, ey + sx * 0.8);
      g.quadraticCurveTo(ex - sx, ey - eh * 0.74, ex + ew * 0.53, ey - sx * 0.5);
      g.stroke();
    }

    // Feathered expressive eyebrow
    const by = ey - 13.0 - browLift * 5.6;
    g.save();
    g.translate(ex, by);
    g.rotate(sx * -browAngle * 0.42);
    g.fillStyle = "#261B17";
    g.beginPath();
    const inX = -sx * 12;
    const outX = sx * 13.5;
    g.moveTo(inX, 2.0);
    g.quadraticCurveTo(0, -3.4, outX, -0.5);
    g.quadraticCurveTo(sx * 3, 1.5, inX, 3.2);
    g.closePath();
    g.fill();
    g.restore();
  };

  drawEye(-1, m.eyeOpenL, m.browLiftL, m.browAngleL);
  drawEye(1, m.eyeOpenR, m.browLiftR, m.browAngleR);

  // Mouth
  const my = 290;
  const openAmt = clamp01(m.jawOpen);
  const mw = 14.5 * m.mouthWidth;
  const cornerLY = my - m.smileL * 4.8 + openAmt * 1.0;
  const cornerRY = my - m.smileR * 4.8 + openAmt * 1.0;

  if (openAmt > 0.08) {
    const openH = 3.2 + openAmt * 15.0;
    g.save();
    g.beginPath();
    g.moveTo(256 - mw, cornerLY);
    g.quadraticCurveTo(256, my - openH * 0.38, 256 + mw, cornerRY);
    g.quadraticCurveTo(256, my + openH * 0.90, 256 - mw, cornerLY);
    g.closePath();
    g.fillStyle = "#48191D";
    g.fill();
    g.clip();

    if (m.showTeeth > 0.18 || openAmt > 0.35) {
      g.fillStyle = "#F6EFE2";
      g.fillRect(256 - mw * 0.82, my - openH * 0.42, mw * 1.64, openH * 0.44);
    }
    g.fillStyle = "#CC6B68";
    g.beginPath();
    g.ellipse(256, my + openH * 0.68, mw * 0.62, openH * 0.42, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.strokeStyle = "#A66352";
    g.lineWidth = 1.9;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(256 - mw, cornerLY);
    g.quadraticCurveTo(256, my - openH * 0.38, 256 + mw, cornerRY);
    g.stroke();
  } else {
    const midY = my + 0.5 - (m.smileL + m.smileR) * 0.8;
    g.fillStyle = "rgba(176, 102, 86, 0.72)";
    g.beginPath();
    g.moveTo(256 - mw, cornerLY);
    g.quadraticCurveTo(256 - mw * 0.35, midY - 3.3, 256, midY - 2.3);
    g.quadraticCurveTo(256 + mw * 0.35, midY - 3.3, 256 + mw, cornerRY);
    g.quadraticCurveTo(256, midY + 0.6, 256 - mw, cornerLY);
    g.closePath();
    g.fill();

    g.fillStyle = "rgba(198, 124, 104, 0.66)";
    g.beginPath();
    g.moveTo(256 - mw * 0.88, cornerLY + 0.3);
    g.quadraticCurveTo(256, midY + 5.2, 256 + mw * 0.88, cornerRY + 0.3);
    g.quadraticCurveTo(256, midY + 0.6, 256 - mw * 0.88, cornerLY + 0.3);
    g.closePath();
    g.fill();

    g.strokeStyle = "#6E3A30";
    g.lineWidth = 1.5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(256 - mw, cornerLY);
    g.quadraticCurveTo(256, midY + 0.6, 256 + mw, cornerRY);
    g.stroke();
  }
}

function buildLockGeo(
  pts: [number, number, number][],
  width: number,
  thickness: number
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const segs = 12;
  const frames = curve.computeFrenetFrames(segs, false);
  const ring = 8;
  const verts: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u);
    const prof = u < 0.16 ? lerp(0.82, 1, u / 0.16) : u < 0.68 ? 1 : Math.pow(Math.max(0.16, 1 - (u - 0.68) / 0.32), 0.72);
    const w = width * prof;
    const th = thickness * prof;
    const radial = p.clone().sub(new THREE.Vector3(0, 0.01, -0.01)).normalize();
    const tangent = frames.tangents[i].clone().normalize();
    const side = new THREE.Vector3().crossVectors(tangent, radial);
    if (side.lengthSq() < 1e-5) side.set(1, 0, 0);
    side.normalize();
    const out = new THREE.Vector3().crossVectors(side, tangent).normalize();

    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      verts.push(
        p.x + side.x * Math.cos(a) * w + out.x * Math.sin(a) * th,
        p.y + side.y * Math.cos(a) * w + out.y * Math.sin(a) * th,
        p.z + side.z * Math.cos(a) * w + out.z * Math.sin(a) * th
      );
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < ring; j++) {
      const jn = (j + 1) % ring;
      const a = i * ring + j;
      const b = i * ring + jn;
      const c = (i + 1) * ring + jn;
      const d = (i + 1) * ring + j;
      indices.push(a, b, c, a, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Clean Modern Short-Textured Casual Indonesian Hairstyle for Raka:
 * - Sculpted natural cranial cap strictly tucked under textured locks (ZERO swim-cap band!)
 * - Clean rear occipital taper strictly behind ears (ZERO dark cheek overhang!)
 * - Soft layered side-swept fringe framing forehead warmly.
 */
function buildRakaHairGroup(): { group: THREE.Group; fringeGroup: THREE.Group } {
  const group = new THREE.Group();
  const fringeGroup = new THREE.Group();

  const hairDark = createGouacheMaterial({
    baseHex: "#241B18",
    lightHex: "#3C2D26",
    darkHex: "#18110F",
    seed: 201,
    roughness: 0.84,
    sheen: 0.36,
    sheenColor: "#5C4438",
    normalScale: 0.35,
  });
  const hairMid = createGouacheMaterial({
    baseHex: "#30241F",
    lightHex: "#4D3930",
    darkHex: "#1F1613",
    seed: 202,
    roughness: 0.78,
    sheen: 0.44,
    sheenColor: "#6B4F40",
    normalScale: 0.35,
  });

  // Fitted upper cranial cap tucked cleanly above brow line (`thetaLength = 0.44*PI`)
  const topCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.112, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.44),
    hairDark
  );
  topCap.scale.set(0.95, 1.13, 1.05);
  topCap.position.set(0, 0.036, -0.014);
  topCap.rotation.x = -0.24;
  group.add(topCap);

  // Soft textured crown volume cushion
  const crownFill = new THREE.Mesh(new THREE.SphereGeometry(0.088, 22, 16), hairMid);
  crownFill.scale.set(1.14, 0.52, 1.16);
  crownFill.position.set(0, 0.130, -0.010);
  group.add(crownFill);

  // Clean centered rear occipital hair cap (`phi = 1.15*PI .. 1.85*PI` = EXACT `-Z` back of head in Three.js SphereGeometry!)
  const backCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.111, 28, 22, Math.PI * 1.15, Math.PI * 0.70, Math.PI * 0.14, Math.PI * 0.64),
    hairDark
  );
  backCap.scale.set(0.95, 1.12, 1.04);
  backCap.position.set(0, 0.004, -0.014);
  group.add(backCap);

  // Soft overlapping textured crown locks radiating neatly (full coverage, zero scalp gaps!)
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2;
    const sx = Math.sin(ang);
    const cz = Math.cos(ang);
    const lock = new THREE.Mesh(
      buildLockGeo(
        [
          [0.0, 0.146, -0.010],
          [sx * 0.056, 0.156, cz * 0.058 - 0.008],
          [sx * 0.095, 0.124, cz * 0.096 - 0.008],
          [sx * 0.102, 0.078, cz * 0.100 - 0.010],
        ],
        0.038,
        0.019
      ),
      i % 2 === 0 ? hairMid : hairDark
    );
    group.add(lock);
  }

  // Neat short tapered sideburns strictly above ears
  for (const s of [-1, 1]) {
    const sb = new THREE.Mesh(
      buildLockGeo(
        [
          [s * 0.088, 0.084, 0.022],
          [s * 0.096, 0.050, 0.018],
          [s * 0.094, 0.020, 0.010],
        ],
        0.014,
        0.008
      ),
      hairDark
    );
    group.add(sb);
  }

  // Soft organic feathered fringe locks curving smoothly across forehead (zero stiff band!)
  const fringeSpecs: [number, number, number][][] = [
    [
      [-0.025, 0.142, 0.030],
      [-0.062, 0.118, 0.084],
      [-0.084, 0.082, 0.088],
      [-0.092, 0.048, 0.064],
    ],
    [
      [-0.016, 0.146, 0.036],
      [-0.038, 0.124, 0.098],
      [-0.048, 0.088, 0.112],
      [-0.042, 0.058, 0.108],
    ],
    [
      [-0.002, 0.146, 0.040],
      [-0.006, 0.124, 0.104],
      [-0.008, 0.088, 0.116],
      [-0.002, 0.056, 0.112],
    ],
    [
      [0.012, 0.146, 0.038],
      [0.028, 0.126, 0.100],
      [0.042, 0.090, 0.112],
      [0.050, 0.058, 0.105],
    ],
    [
      [0.024, 0.144, 0.030],
      [0.060, 0.120, 0.086],
      [0.082, 0.084, 0.090],
      [0.092, 0.048, 0.064],
    ],
  ];
  fringeSpecs.forEach((pts, idx) => {
    fringeGroup.add(new THREE.Mesh(buildLockGeo(pts, 0.032, 0.015), idx % 2 === 0 ? hairMid : hairDark));
  });
  group.add(fringeGroup);
  return { group, fringeGroup };
}

function buildHandRig(side: -1 | 1, skinMat: THREE.Material) {
  const group = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.070, 0.024), skinMat);
  palm.position.set(0, -0.035, 0);
  const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 10), skinMat);
  wrist.scale.set(1.04, 0.74, 0.72);
  group.add(palm, wrist);

  const specs = [
    { x: -side * 0.021, len: 0.058, r: 0.0072 },
    { x: -side * 0.007, len: 0.064, r: 0.0074 },
    { x: side * 0.008, len: 0.059, r: 0.0070 },
    { x: side * 0.021, len: 0.048, r: 0.0062 },
  ];
  const fingers = specs.map((fs) => {
    const knuckle = new THREE.Group();
    knuckle.position.set(fs.x, -0.068, 0);
    const s1 = new THREE.Mesh(new THREE.CapsuleGeometry(fs.r, fs.len * 0.44, 5, 8), skinMat);
    s1.position.y = -fs.len * 0.25;
    const mid = new THREE.Group();
    mid.position.y = -fs.len * 0.50;
    const s2 = new THREE.Mesh(new THREE.CapsuleGeometry(fs.r * 0.88, fs.len * 0.36, 5, 8), skinMat);
    s2.position.y = -fs.len * 0.21;
    mid.add(s2);
    knuckle.add(s1, mid);
    group.add(knuckle);
    return { knuckle, mid };
  });

  const thumb = new THREE.Group();
  thumb.position.set(-side * 0.029, -0.029, 0.008);
  thumb.rotation.z = side * 0.54;
  const ts = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.035, 5, 8), skinMat);
  ts.position.y = -0.021;
  thumb.add(ts);
  group.add(thumb);

  const setGesture = (g: RakaHandGesture, t: number) => {
    let curls = [0.24, 0.30, 0.36, 0.42];
    let th = 0.22;
    if (g === "grip_cup" || g === "grip_phone") {
      curls = [1.08, 1.14, 1.18, 1.20];
      th = 0.88;
    } else if (g === "fist_jog") {
      curls = [1.35, 1.42, 1.45, 1.48];
      th = 0.95;
    } else if (g === "open_stretch") {
      curls = [0.06, 0.05, 0.06, 0.10];
      th = 0.10;
    } else if (g === "type_keys") {
      curls = [
        0.52 + Math.sin(t * 12) * 0.22,
        0.56 + Math.sin(t * 12 + 1.8) * 0.22,
        0.60 + Math.sin(t * 12 + 3.4) * 0.2,
        0.66,
      ];
      th = 0.4;
    } else if (g === "temple_stress" || g === "rub_neck") {
      curls = [0.42, 0.46, 0.52, 0.58];
      th = 0.35;
    }
    fingers.forEach((f, i) => {
      f.knuckle.rotation.x = curls[i] * 0.58;
      f.mid.rotation.x = curls[i] * 0.68;
    });
    thumb.rotation.x = th * 0.65;
  };
  return { group, setGesture };
}

export interface RakaCharacterHandle {
  group: THREE.Group;
  headWorldPos: THREE.Vector3;
  chestWorldPos: THREE.Vector3;
  poseAt: (params: RakaPoseParams) => void;
}

export function buildRakaCharacter3D(options?: { sceneScale?: number }): RakaCharacterHandle {
  const sceneScale = options?.sceneScale ?? 1.0;
  const root = new THREE.Group();
  root.name = "RakaSeriesProtagonist3D";
  const metricRoot = new THREE.Group();
  metricRoot.scale.setScalar(sceneScale);
  root.add(metricRoot);

  // Live cached 512x512 painted gouache face canvas
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  const faceCtx = faceCanvas.getContext("2d")!;
  drawRakaFaceCanvas(faceCtx, EMOTIONS.neutral, 0, 0, 0);
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = 4;
  let lastFaceKey = "";

  const headSkinMat = new THREE.MeshPhysicalMaterial({
    map: faceTex,
    roughness: 0.64,
    metalness: 0.0,
    sheen: 0.34,
    sheenColor: "#F2BE96",
    sheenRoughness: 0.68,
  });

  const bodySkinMat = createGouacheMaterial({
    baseHex: "#D6956C",
    lightHex: "#EEB790",
    darkHex: "#B0724E",
    seed: 210,
    roughness: 0.66,
    sheen: 0.32,
    sheenColor: "#F4C29E",
    normalScale: 0.22,
  });

  // Series-Signature Gouache Wardrobe Materials
  const sageHenleyMat = createGouacheMaterial({
    baseHex: "#4B7F78",
    lightHex: "#6CA29A",
    darkHex: "#315853",
    seed: 211,
    roughness: 0.80,
    sheen: 0.28,
    sheenColor: "#8CC2B8",
    normalScale: 0.45,
  });
  const sleepOatmealMat = createGouacheMaterial({
    baseHex: "#DFD4C0",
    lightHex: "#F2E9DA",
    darkHex: "#BEB09A",
    seed: 212,
    roughness: 0.86,
    sheen: 0.22,
    sheenColor: "#FAF2E4",
    normalScale: 0.4,
  });
  const creamInnerMat = createGouacheMaterial({
    baseHex: "#F2E8D5",
    lightHex: "#FAF4E8",
    darkHex: "#D5C8B0",
    seed: 213,
    roughness: 0.82,
    normalScale: 0.3,
  });
  const trousersMat = createGouacheMaterial({
    baseHex: "#2B384B",
    lightHex: "#3E4F68",
    darkHex: "#1D2634",
    seed: 214,
    roughness: 0.82,
    normalScale: 0.42,
  });
  const beltMat = new THREE.MeshStandardMaterial({ color: "#523828", roughness: 0.55 });
  const sockMat = new THREE.MeshStandardMaterial({ color: "#E5DCCB", roughness: 0.88 });
  const sneakerBodyMat = new THREE.MeshStandardMaterial({ color: "#EFE6D6", roughness: 0.56 });
  const sneakerAccentMat = new THREE.MeshStandardMaterial({ color: "#D45638", roughness: 0.58 });
  const sneakerSoleMat = new THREE.MeshStandardMaterial({ color: "#F6EFE2", roughness: 0.64 });

  // Pelvis & Torso
  const pelvisGroup = new THREE.Group();
  metricRoot.add(pelvisGroup);
  const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.144, 0.15, 22), trousersMat);
  pelvisMesh.position.y = -0.04;
  pelvisMesh.scale.set(1, 1, 0.70);
  pelvisMesh.castShadow = true;
  const hipCap = new THREE.Mesh(new THREE.SphereGeometry(0.142, 18, 12), trousersMat);
  hipCap.scale.set(1, 0.55, 0.70);
  hipCap.position.y = -0.095;
  pelvisGroup.add(pelvisMesh, hipCap);

  const torsoGroup = new THREE.Group();
  metricRoot.add(torsoGroup);

  const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.147, 0.147, 0.032, 24), beltMat);
  beltMesh.scale.set(1.01, 1, 0.725);
  beltMesh.position.y = 0.015;
  torsoGroup.add(beltMesh);

  const clavicleSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.062, 0.095, 20), bodySkinMat);
  clavicleSkin.scale.set(1, 1, 0.74);
  clavicleSkin.position.set(0, 0.448, 0.0);
  torsoGroup.add(clavicleSkin);

  const shirtPts = [
    new THREE.Vector2(0.140, 0.015),
    new THREE.Vector2(0.146, 0.14),
    new THREE.Vector2(0.158, 0.28),
    new THREE.Vector2(0.170, 0.39),
    new THREE.Vector2(0.144, 0.455),
    new THREE.Vector2(0.068, 0.474),
  ];
  const shirtGeo = new THREE.LatheGeometry(shirtPts, 26);
  const shirtTorso = new THREE.Mesh(shirtGeo, sageHenleyMat);
  shirtTorso.scale.set(1, 1, 0.69);
  shirtTorso.castShadow = shirtTorso.receiveShadow = true;
  torsoGroup.add(shirtTorso);

  // Henley placket & buttons (for casual_day & active_park)
  const henleyPlacket = new THREE.Group();
  const placketStrip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.135, 0.008), creamInnerMat);
  placketStrip.position.set(0, 0.385, 0.114);
  placketStrip.rotation.x = -0.14;
  henleyPlacket.add(placketStrip);
  for (const by of [0.415, 0.375, 0.335]) {
    const b = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.006, 10),
      new THREE.MeshStandardMaterial({ color: "#4D372A", roughness: 0.5 })
    );
    b.rotation.x = Math.PI / 2;
    b.position.set(0, by, 0.119);
    henleyPlacket.add(b);
  }
  const crewNeckRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.010, 10, 22), creamInnerMat);
  crewNeckRing.rotation.x = Math.PI / 2 + 0.15;
  crewNeckRing.scale.set(1.0, 0.78, 1.0);
  crewNeckRing.position.set(0, 0.466, 0.008);
  torsoGroup.add(henleyPlacket, crewNeckRing);

  // Neck, Head, Nose, Ears & Modern Hair
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.112, 20), bodySkinMat);
  neckMesh.position.set(0, 0.512, -0.004);
  neckMesh.castShadow = true;
  torsoGroup.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.638, 0.004);
  torsoGroup.add(headGroup);

  const headMesh = new THREE.Mesh(buildCraniumGeo(), headSkinMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = false;
  headGroup.add(headMesh);

  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, -0.005, 0.104);
  const nBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.0065, 0.023, 6, 10), bodySkinMat);
  nBridge.position.set(0, 0.011, -0.002);
  nBridge.rotation.x = -0.22;
  const nTip = new THREE.Mesh(new THREE.SphereGeometry(0.0094, 14, 12), bodySkinMat);
  nTip.scale.set(1.04, 0.86, 0.90);
  nTip.position.set(0, -0.006, 0.004);
  noseGroup.add(nBridge, nTip);
  headGroup.add(noseGroup);

  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), bodySkinMat);
    ear.scale.set(0.35, 1.12, 0.68);
    ear.position.set(sx * 0.095, -0.004, -0.008);
    ear.rotation.set(0.05, sx * -0.22, sx * -0.06);
    headGroup.add(ear);
  }

  const hairRig = buildRakaHairGroup();
  headGroup.add(hairRig.group);

  // Single Continuous Rounded Capsule-Lathe Limbs (ZERO overlapping shoulder/elbow spheres -> ZERO z-fighting!)
  const makeLimbGeo = (rTop: number, rBot: number, len: number) =>
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, -len - rBot * 0.45),
        new THREE.Vector2(rBot * 0.85, -len - rBot * 0.20),
        new THREE.Vector2(rBot, -len * 0.94),
        new THREE.Vector2(lerp(rTop, rBot, 0.62), -len * 0.68),
        new THREE.Vector2(rTop * 0.98, -len * 0.30),
        new THREE.Vector2(rTop, -0.010),
        new THREE.Vector2(rTop * 0.94, 0.016),
        new THREE.Vector2(rTop * 0.68, 0.034),
        new THREE.Vector2(0.0, 0.044),
      ],
      22
    );

  const upperSleeveGeo = makeLimbGeo(0.044, 0.039, UPPER_ARM_LEN);
  const foreSkinGeo = makeLimbGeo(0.035, 0.027, FOREARM_LEN);
  const thighGeo = makeLimbGeo(0.067, 0.052, THIGH_LEN);
  const shinGeo = makeLimbGeo(0.051, 0.039, SHIN_LEN);

  const buildArm = (sx: -1 | 1) => {
    const shoulderNode = new THREE.Group();
    const upperMesh = new THREE.Mesh(upperSleeveGeo, sageHenleyMat);
    upperMesh.castShadow = true;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.0395, 0.006, 8, 18), creamInnerMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -UPPER_ARM_LEN + 0.016;
    shoulderNode.add(upperMesh, cuff);

    const elbowNode = new THREE.Group();
    elbowNode.position.y = -UPPER_ARM_LEN;
    const foreMesh = new THREE.Mesh(foreSkinGeo, bodySkinMat);
    foreMesh.castShadow = true;

    const handNode = new THREE.Group();
    handNode.position.y = -FOREARM_LEN;
    const handRig = buildHandRig(sx, bodySkinMat);
    handNode.add(handRig.group);

    elbowNode.add(foreMesh, handNode);
    shoulderNode.add(elbowNode);
    metricRoot.add(shoulderNode);
    return { shoulderNode, elbowNode, handNode, handRig, upperMesh, cuff };
  };

  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Mathematically Exact Exterior C-Grip Prop Holder attached inside `armR.handNode`!
  // Under worldGripBasis `eX=(0,-1,0), eY=(1,0,0), eZ=(0,0,1)`, `rotation.z = +PI/2` maps
  // cylinder `+Y` -> handNode `-X` -> EXACT WORLD UP (+Y), sitting strictly in front of palm (`+Z`)
  // with ZERO glass/can penetration into the palm, wrist, or fingers!
  const uprightPropNode = new THREE.Group();
  uprightPropNode.rotation.z = Math.PI / 2;
  armR.handNode.add(uprightPropNode);

  // 1. Sugary Neon Soda Can (Scene 01)
  const sodaCan = new THREE.Group();
  const canBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.118, 20),
    new THREE.MeshPhysicalMaterial({ color: "#E24A5A", roughness: 0.28, metalness: 0.45, clearcoat: 0.6 })
  );
  const canStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0326, 0.0326, 0.038, 20),
    new THREE.MeshStandardMaterial({ color: "#FFD75E", roughness: 0.35 })
  );
  const canTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.029, 0.032, 0.008, 20),
    new THREE.MeshStandardMaterial({ color: "#CBD5E1", roughness: 0.25, metalness: 0.8 })
  );
  canTop.position.y = 0.062;
  sodaCan.add(canBody, canStripe, canTop);
  sodaCan.visible = false;
  uprightPropNode.add(sodaCan);

  // 2. Instant Cup Noodles (Scene 02)
  const instantCup = new THREE.Group();
  const cupBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.034, 0.105, 20),
    new THREE.MeshStandardMaterial({ color: "#F4E8D4", roughness: 0.65 })
  );
  const cupBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.040, 0.042, 20),
    new THREE.MeshStandardMaterial({ color: "#D94A38", roughness: 0.55 })
  );
  cupBand.position.y = 0.012;
  const noodlesTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.012, 16),
    new THREE.MeshStandardMaterial({ color: "#E6B44C", roughness: 0.72 })
  );
  noodlesTop.position.y = 0.048;
  instantCup.add(cupBody, cupBand, noodlesTop);
  instantCup.visible = false;
  uprightPropNode.add(instantCup);

  // 3. Sparkling Crystal Water Glass (Scene 06)
  const waterGlass = new THREE.Group();
  const glassWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.037, 0.030, 0.125, 22, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: "#DDF6FF",
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
    })
  );
  const waterFill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.033, 0.028, 0.092, 20),
    new THREE.MeshPhysicalMaterial({
      color: "#6BD4EC",
      roughness: 0.15,
      transparent: true,
      opacity: 0.78,
    })
  );
  waterFill.position.y = -0.014;
  waterGlass.add(glassWall, waterFill);
  waterGlass.visible = false;
  uprightPropNode.add(waterGlass);

  // 4. Smartphone (Scene 05)
  const phoneGrp = new THREE.Group();
  phoneGrp.position.set(0.01, -0.048, 0.026);
  phoneGrp.rotation.set(-0.3, 0.15, 0);
  const pBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.144, 0.009),
    new THREE.MeshStandardMaterial({ color: "#1E2534", roughness: 0.3, metalness: 0.6 })
  );
  const pScr = new THREE.Mesh(
    new THREE.PlaneGeometry(0.064, 0.132),
    new THREE.MeshBasicMaterial({ color: "#7CC4FA" })
  );
  pScr.position.z = 0.005;
  phoneGrp.add(pBody, pScr);
  phoneGrp.visible = false;
  armL.handNode.add(phoneGrp);

  // Legs & Footwear
  const buildLeg = () => {
    const hipNode = new THREE.Group();
    const thigh = new THREE.Mesh(thighGeo, trousersMat);
    thigh.castShadow = true;
    hipNode.add(thigh);

    const kneeNode = new THREE.Group();
    kneeNode.position.y = -THIGH_LEN;
    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), trousersMat);
    const shin = new THREE.Mesh(shinGeo, trousersMat);
    shin.castShadow = true;

    const ankleNode = new THREE.Group();
    ankleNode.position.y = -SHIN_LEN;

    const sockGrp = new THREE.Group();
    const sAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.035, 0.062, 14), sockMat);
    sAnkle.position.y = -0.02;
    const sFoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.11, 6, 12), sockMat);
    sFoot.rotation.x = Math.PI / 2;
    sFoot.scale.set(1, 1, 0.72);
    sFoot.position.set(0, -0.056, 0.046);
    sockGrp.add(sAnkle, sFoot);

    const sneakerGrp = new THREE.Group();
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.025, 0.238), sneakerSoleMat);
    sole.position.set(0, -0.070, 0.052);
    sole.castShadow = true;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.050, 0.188), sneakerBodyMat);
    upper.position.set(0, -0.036, 0.040);
    upper.castShadow = true;
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), sneakerBodyMat);
    toe.scale.set(0.98, 0.62, 1.15);
    toe.position.set(0, -0.046, 0.128);
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.024, 0.045), sneakerAccentMat);
    accent.position.set(0, -0.036, -0.022);
    sneakerGrp.add(sole, upper, toe, accent);

    ankleNode.add(sockGrp, sneakerGrp);
    kneeNode.add(kneeCap, shin, ankleNode);
    hipNode.add(kneeNode);
    metricRoot.add(hipNode);
    return { hipNode, kneeNode, ankleNode, sockGrp, sneakerGrp };
  };

  const legL = buildLeg();
  const legR = buildLeg();

  const headWorldPos = new THREE.Vector3();
  const chestWorldPos = new THREE.Vector3();

  function evalSinglePose(
    poseName: RakaPosePreset,
    t: number,
    breath: number,
    ap: number
  ) {
    let hipPos = new THREE.Vector3(0, 0.94 + breath, 0);
    let torsoLeanX = 0;
    let torsoLeanZ = 0;
    let torsoTwistY = 0;
    let rootPitchX = 0;
    let footL = new THREE.Vector3(-0.10, 0, 0);
    let footR = new THREE.Vector3(0.10, 0, 0);
    let footPitchL = 0;
    let footPitchR = 0;
    let handL = new THREE.Vector3(-0.21, 0.85, 0.05);
    let handR = new THREE.Vector3(0.21, 0.85, 0.05);
    let gestL: RakaHandGesture = "relaxed";
    let gestR: RakaHandGesture = "relaxed";
    let headPitchAdd = 0;
    let headYawAdd = 0;
    let headRollAdd = 0;

    if (poseName === "wake_startled_bed") {
      // Multi-stage action arc (`ap = 0..1`):
      // 0.00..0.35: shooting bolt upright from bed; 0.35..0.68: reaching & slapping alarm clock; 0.68..1.0: rubbing groggy face!
      const riseU = smoothstep(0.0, 0.36, ap);
      const slapU = smoothstep(0.32, 0.56, ap) * (1 - smoothstep(0.60, 0.78, ap));
      const rubU = smoothstep(0.68, 0.92, ap);
      hipPos.set(0, 0.50, 0);
      torsoLeanX = lerp(-0.55, 0.16, riseU) + slapU * 0.10 + Math.sin(t * 2.8) * 0.015;
      torsoTwistY = -0.24 * riseU + slapU * -0.14;
      footL.set(-0.14, 0.44, 0.68);
      footR.set(0.14, 0.44, 0.68);
      handL.set(-0.26, 0.52, 0.14);
      const restR = new THREE.Vector3(0.24, 0.68, 0.18);
      const slapR = new THREE.Vector3(0.42, 0.74 + Math.sin(t * 14) * 0.025, 0.30);
      const rubR = new THREE.Vector3(0.09, 1.08 + Math.sin(t * 4.5) * 0.012, 0.24);
      handR.copy(restR).lerp(slapR, slapU).lerp(rubR, rubU);
      gestR = rubU > 0.4 ? "rub_neck" : "open_stretch";
      headYawAdd = -0.26 * riseU * (1 - rubU * 0.5);
      headPitchAdd = 0.08 + rubU * 0.08;
    } else if (poseName === "rush_grab_drink") {
      const liftU = smoothstep(0.0, 0.4, ap);
      hipPos.set(0, 0.94 + breath, 0);
      torsoLeanX = 0.06;
      torsoTwistY = lerp(-0.08, 0.12, liftU);
      footL.set(-0.12, 0, 0.12);
      footR.set(0.12, 0, -0.10);
      handL.set(-0.22, 0.88, 0.10);
      handR.set(0.12, lerp(1.06, 1.32, liftU) + Math.sin(t * 2.6) * 0.012, 0.25);
      gestR = "grip_cup";
    } else if (poseName === "sit_desk_yawn") {
      const yawnPeak = Math.sin(clamp01(ap) * Math.PI);
      hipPos.set(0, 0.48 + breath * 0.5, 0);
      torsoLeanX = 0.14 + (1 - yawnPeak) * 0.08;
      torsoLeanZ = -0.04;
      footL.set(-0.13, 0, 0.28);
      footR.set(0.13, 0, 0.26);
      handL.set(-0.16, 0.82, 0.36);
      handR.set(0.10, lerp(0.84, 1.08, yawnPeak), lerp(0.36, 0.25, yawnPeak));
      gestR = "rub_neck";
      headPitchAdd = -0.06 - yawnPeak * 0.08;
      headRollAdd = -0.08 * yawnPeak;
    } else if (poseName === "sit_desk_eat_instant") {
      const biteU = smoothstep(0.18, 0.85, ap);
      hipPos.set(0, 0.48 + breath * 0.5, 0);
      torsoLeanX = 0.16;
      footL.set(-0.13, 0, 0.28);
      footR.set(0.13, 0, 0.26);
      handL.set(-0.18, 0.83, 0.36);
      handR.set(lerp(0.16, 0.08, biteU), lerp(0.92, 1.09, biteU), lerp(0.36, 0.28, biteU));
      gestR = "grip_cup";
      headPitchAdd = lerp(0.18, 0.06, biteU);
    } else if (poseName === "sit_desk_slouched") {
      hipPos.set(0, 0.48 + breath * 0.4, 0);
      torsoLeanX = 0.28 + Math.sin(t * 1.1) * 0.02;
      footL.set(-0.13, 0, 0.26);
      footR.set(0.13, 0, 0.24);
      handL.set(-0.13, 0.82 + Math.sin(t * 9) * 0.008, 0.42);
      handR.set(0.13, 0.82 + Math.cos(t * 9) * 0.008, 0.42);
      gestL = "type_keys";
      gestR = "type_keys";
      headPitchAdd = 0.20;
    } else if (poseName === "sit_desk_overwhelmed") {
      const gripU = smoothstep(0.0, 0.45, ap);
      hipPos.set(0, 0.48 + breath * 0.8, 0);
      torsoLeanX = lerp(0.18, 0.28, gripU);
      footL.set(-0.14, 0, 0.28);
      footR.set(0.14, 0, 0.26);
      handL.set(lerp(-0.16, -0.145, gripU), lerp(0.84, 1.16, gripU), lerp(0.40, 0.18, gripU));
      handR.set(lerp(0.16, 0.145, gripU), lerp(0.84, 1.16, gripU), lerp(0.40, 0.18, gripU));
      gestL = "temple_stress";
      gestR = "temple_stress";
      headPitchAdd = lerp(0.12, 0.25, gripU);
      headYawAdd = Math.sin(t * 3.8) * 0.08 * gripU; // Subtle overwhelmed head shake!
    } else if (poseName === "stand_abstract_calm") {
      hipPos.set(0, 0.95 + breath, 0);
      torsoLeanX = -0.02;
      footL.set(-0.12, 0, 0.04);
      footR.set(0.12, 0, -0.04);
      handL.set(-0.22, 0.86 + Math.sin(t * 1.4) * 0.015, 0.06);
      handR.set(0.22, 0.86 - Math.sin(t * 1.4) * 0.015, 0.06);
      headPitchAdd = -0.14;
    } else if (poseName === "sit_desk_close_laptop") {
      const closeU = smoothstep(0.1, 0.78, ap);
      hipPos.set(0, 0.48 + breath * 0.5, 0);
      torsoLeanX = lerp(0.14, 0.06, closeU);
      footL.set(-0.13, 0, 0.28);
      footR.set(0.13, 0, 0.26);
      handL.set(-0.24, lerp(0.92, 0.82, closeU), 0.30); // Lowering phone gently onto desk!
      handR.set(0.06, lerp(1.02, 0.82, closeU), 0.44);  // Gently closing laptop lid down!
      gestL = "grip_phone";
      gestR = "open_stretch";
      headPitchAdd = 0.14;
    } else if (poseName === "lie_bed_sleep") {
      rootPitchX = -Math.PI / 2;
      hipPos.set(0, 0.94 + breath * 0.4, 0);
      footL.set(-0.12, 0, 0.02);
      footR.set(0.13, 0, 0.02);
      handL.set(-0.18, 0.90, 0.02); // Tucked comfortably beneath duvet!
      handR.set(0.18, 0.90, 0.02);
      headRollAdd = 0.10;
    } else if (poseName === "wake_refreshed_bed") {
      const stretchU = smoothstep(0.0, 0.65, ap);
      hipPos.set(0, 0.50 + breath, 0);
      torsoLeanX = lerp(0.06, -0.10, stretchU);
      footL.set(-0.14, 0.44, 0.68);
      footR.set(0.14, 0.44, 0.68);
      const lift = lerp(0.86, 1.38, stretchU) + Math.sin(t * 2.2) * 0.02;
      handL.set(-0.28, lift, 0.08);
      handR.set(0.28, lift, 0.08);
      gestL = "open_stretch";
      gestR = "open_stretch";
      headPitchAdd = -0.12 * stretchU;
    } else if (poseName === "stand_drink_water") {
      hipPos.set(0, 0.95 + breath, 0);
      torsoLeanX = -0.03;
      footL.set(-0.11, 0, 0.04);
      footR.set(0.11, 0, -0.03);
      handL.set(-0.21, 0.88, 0.06);
      const sip = smoothstep(0.05, 0.72, ap) * (1 - smoothstep(0.80, 1.0, ap) * 0.35);
      handR.set(0.10, lerp(1.24, 1.43, sip), lerp(0.28, 0.23, sip));
      gestR = "grip_cup";
      headPitchAdd = -0.10 * sip;
    } else if (poseName === "stand_kitchen_prep") {
      hipPos.set(0, 0.95 + breath, 0);
      torsoLeanX = 0.12;
      footL.set(-0.13, 0, 0.02);
      footR.set(0.13, 0, -0.02);
      handL.set(-0.18, 0.98, 0.36);
      handR.set(0.16 + Math.sin(t * 4.5) * 0.05, 1.02 + Math.cos(t * 4.5) * 0.025, 0.36);
      headPitchAdd = 0.24;
    } else if (poseName === "stand_morning_stretch") {
      hipPos.set(0, 0.96 + breath, 0);
      const sway = Math.sin(t * 2.4);
      torsoLeanX = -0.08;
      torsoLeanZ = sway * 0.15;
      footL.set(-0.18, 0, 0);
      footR.set(0.18, 0, 0);
      handL.set(-0.24 + sway * 0.13, 1.82, 0.06);
      handR.set(0.24 + sway * 0.13, 1.82, 0.06);
      gestL = "open_stretch";
      gestR = "open_stretch";
      headPitchAdd = -0.12;
    } else if (poseName === "sit_desk_organized") {
      hipPos.set(0, 0.50 + breath * 0.5, 0);
      torsoLeanX = 0.04;
      footL.set(-0.13, 0, 0.28);
      footR.set(0.13, 0, 0.26);
      handL.set(-0.18, 0.82, 0.38);
      handR.set(0.15 + Math.sin(t * 3.8) * 0.035, 0.83, 0.38);
      gestR = "type_keys";
      headPitchAdd = 0.08;
    } else if (poseName === "walk_brisk") {
      const ph = t * 5.2;
      const sL = Math.sin(ph);
      const sR = Math.sin(ph + Math.PI);
      const liftL = Math.max(0, Math.cos(ph)) * 0.095;
      const liftR = Math.max(0, Math.cos(ph + Math.PI)) * 0.095;
      const bob = Math.abs(Math.sin(ph)) * 0.034;
      hipPos.set(0, 0.935 + bob, 0);
      torsoLeanX = 0.05;
      torsoTwistY = -sL * 0.10;
      footL.set(-0.105, liftL, sL * 0.32);
      footR.set(0.105, liftR, sR * 0.32);
      footPitchL = -sL * 0.22;
      footPitchR = -sR * 0.22;
      handL.set(-0.21, 0.90 + Math.max(0, sR) * 0.08, sR * 0.26);
      handR.set(0.21, 0.90 + Math.max(0, sL) * 0.08, sL * 0.26);
    } else if (poseName === "jog_light") {
      const ph = t * 8.2;
      const sL = Math.sin(ph);
      const sR = Math.sin(ph + Math.PI);
      const liftL = Math.max(0, Math.cos(ph)) * 0.19;
      const liftR = Math.max(0, Math.cos(ph + Math.PI)) * 0.19;
      const bob = Math.abs(Math.sin(ph)) * 0.068;
      hipPos.set(0, 0.91 + bob, 0);
      torsoLeanX = 0.15;
      torsoTwistY = -sL * 0.15;
      footL.set(-0.11, liftL, sL * 0.42);
      footR.set(0.11, liftR, sR * 0.42);
      footPitchL = -sL * 0.32;
      footPitchR = -sR * 0.32;
      handL.set(-0.22, 1.06 + sR * 0.08, 0.22 + sR * 0.22);
      handR.set(0.22, 1.06 + sL * 0.08, 0.22 + sL * 0.22);
      gestL = "fist_jog";
      gestR = "fist_jog";
    }
    return {
      hipPos, torsoLeanX, torsoLeanZ, torsoTwistY, rootPitchX,
      footL, footR, footPitchL, footPitchR, handL, handR,
      gestL, gestR, headPitchAdd, headYawAdd, headRollAdd,
    };
  }

  function poseAt(params: RakaPoseParams) {
    const {
      t,
      pose = "walk_brisk",
      prevPose,
      poseBlend = 1,
      actionProgress = 0.5,
      emotion = "neutral",
      prevEmotion,
      emotionBlend = 1,
      breathRate = 1.0,
      outfit = "casual_day",
      footwear = "sneakers",
      rootPos = [0, 0, 0],
      facingYaw = 0,
      lookX = 0,
      lookY = 0,
      headTiltZ = 0,
      holdSodaCan = false,
      holdInstantCup = false,
      holdWaterGlass = false,
      holdPhone = false,
      waterLevel = 0.85,
      customLeftHandLocal,
      customRightHandLocal,
    } = params;

    root.position.set(...rootPos);
    root.rotation.set(0, facingYaw, 0);

    // Wardrobe switch while locking core identity
    const activeTopMat = outfit === "sleep_tee" ? sleepOatmealMat : sageHenleyMat;
    shirtTorso.material = activeTopMat;
    armL.upperMesh.material = activeTopMat;
    armR.upperMesh.material = activeTopMat;
    henleyPlacket.visible = outfit !== "sleep_tee";
    armL.cuff.visible = armR.cuff.visible = outfit === "casual_day";

    [legL, legR].forEach((lg) => {
      lg.sockGrp.visible = footwear === "socks";
      lg.sneakerGrp.visible = footwear === "sneakers";
    });

    sodaCan.visible = holdSodaCan;
    instantCup.visible = holdInstantCup;
    waterGlass.visible = holdWaterGlass;
    waterFill.scale.y = clamp(waterLevel, 0.1, 1.0);
    waterFill.position.y = -0.060 + 0.046 * clamp(waterLevel, 0.1, 1.0);
    phoneGrp.visible = holdPhone;

    const breath = Math.sin(t * 2.1 * breathRate) * (0.005 + (breathRate > 1.3 ? 0.003 : 0));
    const cur = evalSinglePose(pose, t, breath, actionProgress);
    const pb = smoothstep(0, 1, poseBlend);
    const prv = prevPose && pb < 0.999 ? evalSinglePose(prevPose, t, breath, 1.0) : cur;

    const hipPos = prv.hipPos.clone().lerp(cur.hipPos, pb);
    const torsoLeanX = lerp(prv.torsoLeanX, cur.torsoLeanX, pb);
    const torsoLeanZ = lerp(prv.torsoLeanZ, cur.torsoLeanZ, pb);
    const torsoTwistY = lerp(prv.torsoTwistY, cur.torsoTwistY, pb);
    const rootPitchX = lerp(prv.rootPitchX, cur.rootPitchX, pb);
    const footL = prv.footL.clone().lerp(cur.footL, pb);
    const footR = prv.footR.clone().lerp(cur.footR, pb);
    const footPitchL = lerp(prv.footPitchL, cur.footPitchL, pb);
    const footPitchR = lerp(prv.footPitchR, cur.footPitchR, pb);
    const handL = prv.handL.clone().lerp(cur.handL, pb);
    const handR = prv.handR.clone().lerp(cur.handR, pb);
    const gestL: RakaHandGesture = pb > 0.35 ? cur.gestL : prv.gestL;
    const gestR: RakaHandGesture = pb > 0.35 ? cur.gestR : prv.gestR;
    const headPitchAdd = lerp(prv.headPitchAdd, cur.headPitchAdd, pb);
    const headYawAdd = lerp(prv.headYawAdd, cur.headYawAdd, pb);
    const headRollAdd = lerp(prv.headRollAdd, cur.headRollAdd, pb);

    // Subtle natural eye saccades & micro-nods so Raka feels truly alive!
    const saccadeX = emotion === "peaceful_sleep" ? 0 : Math.sin(t * 0.9) * 0.18 + Math.sin(t * 2.3) * 0.06;
    const saccadeY = emotion === "peaceful_sleep" ? 0 : Math.cos(t * 0.7) * 0.08;
    const finalLookX = clamp(lookX + saccadeX, -0.8, 0.8);
    const finalLookY = clamp(lookY + saccadeY, -0.6, 0.6);

    if (customLeftHandLocal) handL.set(...customLeftHandLocal);
    if (customRightHandLocal) handR.set(...customRightHandLocal);

    metricRoot.rotation.x = rootPitchX;

    const spineQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(torsoLeanX, torsoTwistY, torsoLeanZ, "YXZ")
    );
    const spineBase = hipPos.clone().add(new THREE.Vector3(0, 0.02, 0));
    pelvisGroup.position.copy(hipPos);
    pelvisGroup.quaternion.setFromEuler(
      new THREE.Euler(torsoLeanX * 0.25, torsoTwistY * 0.35, torsoLeanZ * 0.25)
    );
    torsoGroup.position.copy(spineBase);
    torsoGroup.quaternion.copy(spineQuat);

    const hYaw = clamp(lookX * 0.48 + headYawAdd, -0.68, 0.68);
    const hPitch = clamp(-lookY * 0.32 + headPitchAdd, -0.45, 0.48);
    const hRoll = clamp(headTiltZ + headRollAdd, -0.35, 0.35);
    headGroup.rotation.set(hPitch, hYaw, hRoll, "YXZ");
    hairRig.fringeGroup.rotation.z = -hRoll * 0.18 + Math.sin(t * 2.1) * 0.01;

    // 2-Bone Analytical Arm IK
    const shoulderLW = spineBase
      .clone()
      .add(new THREE.Vector3(-SHOULDER_X, SHOULDER_Y, 0).applyQuaternion(spineQuat));
    const shoulderRW = spineBase
      .clone()
      .add(new THREE.Vector3(SHOULDER_X, SHOULDER_Y, 0).applyQuaternion(spineQuat));

    const poleL = new THREE.Vector3(-0.72, -0.45, -0.55).applyQuaternion(spineQuat).normalize();
    const poleR = new THREE.Vector3(0.72, -0.45, -0.55).applyQuaternion(spineQuat).normalize();

    const ikAL = solveTwoBoneIK(shoulderLW, handL, UPPER_ARM_LEN, FOREARM_LEN, poleL);
    const ikAR = solveTwoBoneIK(shoulderRW, handR, UPPER_ARM_LEN, FOREARM_LEN, poleR);

    armL.shoulderNode.position.copy(shoulderLW);
    armL.shoulderNode.quaternion.copy(ikAL.upperQuat);
    armL.elbowNode.quaternion.copy(ikAL.lowerQuat);
    armL.handRig.setGesture(gestL, t);
    armL.handNode.rotation.set(gestL === "type_keys" ? -0.25 : 0, gestL === "type_keys" ? Math.PI : 0, 0);

    armR.shoulderNode.position.copy(shoulderRW);
    armR.shoulderNode.quaternion.copy(ikAR.upperQuat);
    armR.elbowNode.quaternion.copy(ikAR.lowerQuat);
    armR.handRig.setGesture(gestR, t);

    // ZERO-CLIPPING MATHEMATICAL EXTERIOR C-GRIP:
    // Local hand basis: eX = (0,-1,0) [thumb at TOP +Y], eY = (+1,0,0) [fingers extend inward -X], eZ = (0,0,+1) [palm front +Z]!
    if (gestR === "grip_cup" && (holdSodaCan || holdInstantCup || holdWaterGlass)) {
      const cupRadius = holdInstantCup ? 0.047 : holdWaterGlass ? 0.038 : 0.033;
      const gripBasis = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 1)
      );
      const worldGripQuat = new THREE.Quaternion().setFromRotationMatrix(gripBasis);
      armR.handNode.quaternion.copy(ikAR.lowerWorldQuat.clone().invert().multiply(worldGripQuat));

      // Palm sits at handNode z in [-0.012, +0.012]; place cylinder strictly flush outside palm front at z = cupRadius + 0.014!
      uprightPropNode.position.set(0.0, -0.046, cupRadius + 0.014);
      uprightPropNode.rotation.set(0, 0, Math.PI / 2);
    } else {
      armR.handNode.rotation.set(gestR === "type_keys" ? -0.25 : 0, gestR === "type_keys" ? Math.PI : 0, 0);
    }

    // 2-Bone Analytical Leg IK
    const hipLW = hipPos.clone().add(new THREE.Vector3(-HIP_X, HIP_Y, 0));
    const hipRW = hipPos.clone().add(new THREE.Vector3(HIP_X, HIP_Y, 0));
    const ankL = new THREE.Vector3(footL.x, footL.y + ANKLE_H, footL.z);
    const ankR = new THREE.Vector3(footR.x, footR.y + ANKLE_H, footR.z);
    const kPoleL = new THREE.Vector3(-0.08, 0.14, 1.0).normalize();
    const kPoleR = new THREE.Vector3(0.08, 0.14, 1.0).normalize();

    const ikLL = solveTwoBoneIK(hipLW, ankL, THIGH_LEN, SHIN_LEN, kPoleL);
    const ikLR = solveTwoBoneIK(hipRW, ankR, THIGH_LEN, SHIN_LEN, kPoleR);

    legL.hipNode.position.copy(hipLW);
    legL.hipNode.quaternion.copy(ikLL.upperQuat);
    legL.kneeNode.quaternion.copy(ikLL.lowerQuat);
    legL.ankleNode.quaternion.copy(
      ikLL.lowerWorldQuat.clone().invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(footPitchL, 0, 0)))
    );

    legR.hipNode.position.copy(hipRW);
    legR.hipNode.quaternion.copy(ikLR.upperQuat);
    legR.kneeNode.quaternion.copy(ikLR.lowerQuat);
    legR.ankleNode.quaternion.copy(
      ikLR.lowerWorldQuat.clone().invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(footPitchR, 0, 0)))
    );

    // Smooth Emotion Morph + Saccades + Cached Face Texture Update
    const blinkSpd = emotion === "slumped_drowsy" || emotion === "tired_yawn" ? 0.18 : 0.30;
    const blinkCyc = (t * blinkSpd + 0.35) % 1.0;
    const autoBlink =
      emotion === "peaceful_sleep"
        ? 1
        : blinkCyc > 0.955
        ? Math.sin(((blinkCyc - 0.955) / 0.045) * Math.PI)
        : 0;
    const eb = smoothstep(0, 1, emotionBlend);
    const eA = prevEmotion && eb < 0.999 ? EMOTIONS[prevEmotion] : EMOTIONS[emotion];
    const eB = EMOTIONS[emotion];
    const blendedMorph: FaceMorph = {
      browLiftL: lerp(eA.browLiftL, eB.browLiftL, eb),
      browLiftR: lerp(eA.browLiftR, eB.browLiftR, eb),
      browAngleL: lerp(eA.browAngleL, eB.browAngleL, eb),
      browAngleR: lerp(eA.browAngleR, eB.browAngleR, eb),
      eyeOpenL: lerp(eA.eyeOpenL, eB.eyeOpenL, eb),
      eyeOpenR: lerp(eA.eyeOpenR, eB.eyeOpenR, eb),
      happyArc: lerp(eA.happyArc, eB.happyArc, eb),
      underEyeBag: lerp(eA.underEyeBag, eB.underEyeBag, eb),
      jawOpen: lerp(eA.jawOpen, eB.jawOpen, eb),
      mouthWidth: lerp(eA.mouthWidth, eB.mouthWidth, eb),
      smileL: lerp(eA.smileL, eB.smileL, eb),
      smileR: lerp(eA.smileR, eB.smileR, eb),
      showTeeth: lerp(eA.showTeeth, eB.showTeeth, eb),
    };
    const faceKey = `${prevEmotion ?? ""}|${emotion}|${Math.round(eb * 8)}|${Math.round(finalLookX * 8)}|${Math.round(finalLookY * 8)}|${Math.round(autoBlink * 6)}`;
    if (faceKey !== lastFaceKey) {
      lastFaceKey = faceKey;
      drawRakaFaceCanvas(faceCtx, blendedMorph, finalLookX, finalLookY, autoBlink);
      faceTex.needsUpdate = true;
    }

    root.updateMatrixWorld(true);
    headGroup.getWorldPosition(headWorldPos);
    torsoGroup.getWorldPosition(chestWorldPos);
    chestWorldPos.y += 0.30 * sceneScale;
  }

  return { group: root, headWorldPos, chestWorldPos, poseAt };
}
