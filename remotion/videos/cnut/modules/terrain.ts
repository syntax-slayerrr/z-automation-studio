import * as THREE from "three";
import { Batch, V, boxGeo, lam, quad } from "../build";
import { grassHD, cobbleHD, stoneHD } from "../paint";

/**
 * Modular Terrain & Landscape Builder (Seashore, Cliffs, Quays, Royal Carpet)
 * Reusable for beaches, coastlines, ancient plazas, and ceremonial pathways.
 */

export const terrainGrass = () => lam("grassHD", () => ({ map: grassHD() }));
export const terrainCobble = () => lam("cobbleHD", () => ({ map: cobbleHD() }));
export const terrainWall = () => lam("wallHD", () => ({ map: stoneHD("wallHD", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
export const terrainCope = () => lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
export const terrainSand = () => lam("sandDry", () => ({ color: "#dfc696" }));
export const terrainWetSand = () => lam("sandWet", () => ({ color: "#9c8155" }));
export const carpetRed = () => lam("carpetCrimson", () => ({ color: "#881337" }));
export const carpetGold = () => lam("carpetGoldBorder", () => ({ color: "#ca8a04" }));

/**
 * Horizontal quad facing up at height y covering x0..x1, z0..z1
 */
function quadUp(x0: number, x1: number, z0: number, z1: number, y: number, u = 1, v = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}

/**
 * Embankment seawall facing the open ocean (+z or -z)
 */
function seawallQuad(x0: number, x1: number, z: number, y0: number, y1: number, dir = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, dir]).flat(), 3));
  const u = Math.abs(x1 - x0) / 4;
  const v = (y1 - y0) / 4;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}

/**
 * Build complete coastal seashore terrace, stone quay, and sandy beach
 */
export function buildCoastalTerrace(
  b: Batch,
  D0 = 6.0
) {
  const gm = terrainGrass();
  const cm = terrainCobble();
  const sm = terrainSand();
  const wm = terrainWetSand();
  const stoneM = terrainWall();
  const copeM = terrainCope();

  // 1. Inland grassy realm (behind the castle, z < -70)
  b.add(quadUp(-900, 900, -900, -70, D0, 450, 200), gm);

  // 2. Royal stone plaza (between fortress and shore: z = -70 to -35)
  b.add(quadUp(-180, 180, -70, -35, D0 + 0.01, 90, 8.75), cm);

  // 3. Sandy beach terrace (z = -35 to -24)
  b.add(quadUp(-900, 900, -42, -28, D0 - 0.04, 450, 7.0), sm);

  // 4. Glossy wet sand strip where tides lap (z = -30 to -22)
  b.add(quadUp(-400, 400, -30, -20, D0 - 0.12, 200, 5.0), wm);

  // 5. Stone embankment seawall facing open ocean along z = -30
  b.add(seawallQuad(-900, 900, -30, -0.6, D0, 1), stoneM);

  // 6. Stone coping curb on the seawall edge
  for (const [x0, x1] of [[-600, -4.6], [4.6, 600]]) {
    b.add(boxGeo(V(x0, D0, -30.5), V(x1, D0 + 0.75, -30), 2), copeM);
  }
}

/**
 * Build the Royal Crimson Ceremonial Carpet leading to the golden throne
 */
export function buildCeremonialCarpet(
  b: Batch,
  D0 = 6.0,
  startZ = -70,
  endZ = -30.2,
  width = 3.4
) {
  const cM = carpetRed();
  const bM = carpetGold();
  const y = D0 + 0.025;
  const hw = width / 2;
  const borderW = 0.28;

  // Central crimson carpet body
  b.add(quadUp(-hw + borderW, hw - borderW, startZ, endZ, y, 1, Math.abs(endZ - startZ) / 3), cM);

  // Gold embroidery borders on left and right
  b.add(quadUp(-hw, -hw + borderW, startZ, endZ, y + 0.002, 1, Math.abs(endZ - startZ) / 3), bM);
  b.add(quadUp(hw - borderW, hw, startZ, endZ, y + 0.002, 1, Math.abs(endZ - startZ) / 3), bM);

  // End gold fringe facing the water
  b.add(quadUp(-hw, hw, endZ - 0.35, endZ, y + 0.004, 1, 1), bM);
}

/**
 * Build coastal rocky sea cliffs in the background
 */
export function buildCoastalCliffs(
  b: Batch,
  D0 = 6.0
) {
  const hillGeo = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const rockA = lam("cliffA", () => ({ color: "#64748b" }));
  const rockB = lam("cliffB", () => ({ color: "#475569" }));
  const cliffMats = [rockA, rockB];

  // Rugged coastal headlands framing the bay on far left and far right
  const headlands = [
    // Far Left Sea Cliffs
    [-380, 80, 240, 52, 160],
    [-290, -40, 180, 46, 140],
    // Far Right Sea Cliffs
    [360, 60, 220, 58, 150],
    [280, -30, 170, 44, 130],
  ] as const;

  headlands.forEach(([x, z, sx, sy, sz], i) => {
    const m = new THREE.Matrix4().compose(
      V(x, D0 - 4, z),
      new THREE.Quaternion(),
      V(sx, sy, sz)
    );
    b.add(hillGeo, cliffMats[i % 2], m);
  });
}

