import * as THREE from "three";
import { Batch, V, boxGeo, lam, quad } from "../build";

/**
 * Modular Maritime Builder (Viking/Saxon Longships, Piers, Mooring Bollards, Groynes)
 * Reusable for naval, coastal, Viking, pirate, or seaside topics.
 */

export const shipWood = () => lam("shipWood", () => ({ color: "#5c3826" }));
export const shipDark = () => lam("shipDark", () => ({ color: "#3d2417" }));
export const shieldRed = () => lam("shieldRed", () => ({ color: "#b91c1c" }));
export const shieldBlue = () => lam("shieldBlue", () => ({ color: "#1d4ed8" }));
export const shieldYellow = () => lam("shieldYellow", () => ({ color: "#eab308" }));
export const ropeMat = () => lam("ropeMat", () => ({ color: "#a88960" }));
export const stoneRock = () => lam("stoneRock", () => ({ color: "#64748b" }));

/**
 * Build a classic Viking / Anglo-Saxon Longship (Drakkar / Knarr)
 */
export function buildLongship(
  b: Batch,
  x: number,
  y: number,
  z: number,
  yaw = 0,
  length = 20,
  beam = 4.2
) {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const sm = shipWood();
  const dm = shipDark();

  // 1. Curved Hull using parametric quad strips
  const segs = 14;
  const hullGroup = new THREE.Group();

  for (let i = 0; i < segs; i++) {
    const u0 = i / segs;
    const u1 = (i + 1) / segs;

    const z0 = (u0 - 0.5) * length;
    const z1 = (u1 - 0.5) * length;

    // Taper width toward stem and stern (cosine arch)
    const w0 = Math.sin(u0 * Math.PI) * (beam / 2);
    const w1 = Math.sin(u1 * Math.PI) * (beam / 2);

    // Sheer line: higher at bow and stern
    const sheer0 = 0.8 + 1.6 * (4 * (u0 - 0.5) ** 2);
    const sheer1 = 0.8 + 1.6 * (4 * (u1 - 0.5) ** 2);

    // Port and Starboard hull quads
    const pL0 = V(-w0, sheer0, z0);
    const pL1 = V(-w1, sheer1, z1);
    const pR0 = V(w0, sheer0, z0);
    const pR1 = V(w1, sheer1, z1);
    const keel0 = V(0, -0.4, z0);
    const keel1 = V(0, -0.4, z1);

    b.add(quad(keel0, keel1, pL1, pL0), sm, m);
    b.add(quad(pR0, pR1, keel1, keel0), sm, m);
  }

  // 2. High curved dragon prow stem and sternposts
  for (const s of [-1, 1]) {
    const pZ = (s * length) / 2;
    const stemH = 3.6;
    const stemGeo = new THREE.BoxGeometry(0.35, stemH, 0.9);
    stemGeo.translate(0, stemH / 2 + 0.6, pZ - s * 0.3);
    b.add(stemGeo, dm, m);

    // Curled dragon spiral or stern tail
    const curlGeo = new THREE.SphereGeometry(0.55, 10, 8);
    curlGeo.translate(0, stemH + 0.7, pZ);
    b.add(curlGeo, dm, m);
  }

  // 3. Central Mast and Yardarm with furled sail
  const mastH = 10.5;
  const mastGeo = new THREE.CylinderGeometry(0.18, 0.24, mastH, 10);
  mastGeo.translate(0, mastH / 2 + 0.5, 0);
  b.add(mastGeo, sm, m);

  const yardW = 7.5;
  const yardGeo = new THREE.CylinderGeometry(0.12, 0.12, yardW, 8).rotateZ(Math.PI / 2);
  yardGeo.translate(0, mastH - 0.8, 0.2);
  b.add(yardGeo, sm, m);

  // Furled cream/wool canvas sail bundled on the yardarm
  const sailGeo = new THREE.CylinderGeometry(0.32, 0.32, yardW * 0.92, 10).rotateZ(Math.PI / 2);
  sailGeo.translate(0, mastH - 1.1, 0.2);
  b.add(sailGeo, lam("furledSail", () => ({ color: "#e2d7c5" })), m);

  // 4. Row of colorful round shields lining the gunwales
  const shieldMats = [shieldRed(), shieldBlue(), shieldYellow()];
  const numShields = 7;
  const shieldR = 0.52;

  for (let i = 0; i < numShields; i++) {
    const u = (i + 1) / (numShields + 1);
    const sZ = (u - 0.5) * (length * 0.68);
    const sW = Math.sin(u * Math.PI) * (beam / 2) + 0.08;
    const sY = 0.8 + 1.6 * (4 * (u - 0.5) ** 2) + 0.12;

    const sMat = shieldMats[i % shieldMats.length];
    const sGeo = new THREE.CylinderGeometry(shieldR, shieldR, 0.08, 14).rotateZ(Math.PI / 2);

    // Port shields
    const mP = new THREE.Matrix4().setPosition(-sW, sY, sZ);
    b.add(sGeo, sMat, m.clone().multiply(mP));

    // Starboard shields
    const mS = new THREE.Matrix4().setPosition(sW, sY, sZ);
    b.add(sGeo, sMat, m.clone().multiply(mS));
  }
}

/**
 * Heavy weathered oak dock bollard wrapped with coiled hemp rope
 */
export function buildMooringBollard(
  b: Batch,
  x: number,
  y: number,
  z: number,
  height = 0.95,
  radius = 0.26
) {
  const woodM = shipDark();
  const ropeM = ropeMat();

  // Bollard wooden post
  const postGeo = new THREE.CylinderGeometry(radius * 0.9, radius, height, 12);
  postGeo.translate(x, y + height / 2, z);
  b.add(postGeo, woodM);

  // Rounded top cap
  const capGeo = new THREE.SphereGeometry(radius * 0.92, 12, 8);
  capGeo.translate(x, y + height, z);
  b.add(capGeo, woodM);

  // Coiled hemp rope donut at the base
  const ropeTorus = new THREE.TorusGeometry(radius * 1.35, 0.11, 8, 16);
  ropeTorus.rotateX(Math.PI / 2);
  ropeTorus.translate(x, y + 0.14, z);
  b.add(ropeTorus, ropeM);
}

/**
 * Wooden coastal breakwater groynes (sea pilings driven into the surf)
 */
export function buildBreakwaterGroynes(
  b: Batch,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  baseY: number,
  count = 12
) {
  const woodM = shipDark();
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const px = startX + (endX - startX) * t;
    const pz = startZ + (endZ - startZ) * t;
    const h = 2.4 + 0.4 * Math.sin(i * 3.7);
    const r = 0.14 + 0.03 * Math.cos(i * 2.1);

    const postGeo = new THREE.CylinderGeometry(r * 0.85, r, h, 8);
    postGeo.translate(px, baseY + h / 2 - 0.4, pz);
    b.add(postGeo, woodM);
  }
}

/**
 * Naturally clustered coastal beach boulders & reefs
 */
export function buildCoastalBoulders(
  b: Batch,
  centerX: number,
  centerY: number,
  centerZ: number,
  count = 8,
  spread = 6.0
) {
  const rockM = stoneRock();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.sin(i * 1.5);
    const dist = (0.3 + 0.7 * ((i * 17) % 10) / 10) * spread;
    const bx = centerX + Math.cos(angle) * dist;
    const bz = centerZ + Math.sin(angle) * dist;
    const r = 0.4 + 0.6 * ((i * 23) % 10) / 10;

    const rockGeo = new THREE.DodecahedronGeometry(r, 1);
    rockGeo.scale(1.2, 0.75, 1.0);
    rockGeo.translate(bx, centerY + r * 0.6, bz);
    b.add(rockGeo, rockM);
  }
}

