import * as THREE from "three";
import { Batch } from "./build";
import { D0 } from "./story";
import {
  buildBastionTower,
  buildCastleKeep,
  buildCurtainWall,
  buildRoyalBannerPole,
} from "./modules/castle";
import {
  buildLongship,
  buildMooringBollard,
  buildBreakwaterGroynes,
  buildCoastalBoulders,
} from "./modules/maritime";
import {
  buildCoastalTerrace,
  buildCeremonialCarpet,
  buildCoastalCliffs,
} from "./modules/terrain";

/**
 * Declarative World Layout Specification
 * Allows 1-click reconfiguration of the 3D world for any animation topic.
 */

export interface TowerDef {
  x: number;
  z: number;
  radius?: number;
  height?: number;
  crenellated?: boolean;
}

export interface WallDef {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  height?: number;
  thickness?: number;
}

export interface ShipDef {
  x: number;
  y: number;
  z: number;
  yaw?: number;
  length?: number;
  beam?: number;
}

export interface WorldSpec {
  name: string;
  towers: TowerDef[];
  walls: WallDef[];
  keep?: { x: number; z: number; w: number; d: number; h: number };
  ships: ShipDef[];
  banners: { x: number; z: number; h: number; col?: string }[];
  bollards: { x: number; z: number; h?: number; r?: number }[];
  groynes: { x0: number; z0: number; x1: number; z1: number; count?: number }[];
  boulderClusters: { x: number; z: number; count?: number; spread?: number }[];
}

/**
 * The 11th-Century Royal Seaside Fortress specification for King Cnut
 */
export const CNUT_SEASIDE_FORTRESS: WorldSpec = {
  name: "King Cnut 11th-Century Royal Seaside Fortress",
  towers: [
    { x: -22, z: -68, radius: 5.2, height: 17, crenellated: true },
    { x: 22, z: -68, radius: 5.2, height: 17, crenellated: true },
    { x: -75, z: -72, radius: 4.8, height: 15, crenellated: true },
    { x: 75, z: -72, radius: 4.8, height: 15, crenellated: true },
  ],
  walls: [
    { x0: -22, z0: -68, x1: -75, z1: -72, height: 12, thickness: 3.0 },
    { x0: 22, z0: -68, x1: 75, z1: -72, height: 12, thickness: 3.0 },
    { x0: -75, z0: -72, x1: -160, z1: -78, height: 11, thickness: 2.8 },
    { x0: 75, z0: -72, x1: 160, z1: -78, height: 11, thickness: 2.8 },
  ],
  keep: { x: 0, z: -86, w: 26, d: 20, h: 22 },
  ships: [
    { x: -32, y: 0.35, z: 42, yaw: 0.36, length: 19, beam: 4.2 },
    { x: 38, y: 0.35, z: 76, yaw: -0.28, length: 22, beam: 4.6 },
  ],
  banners: [
    { x: -3.8, z: -33.2, h: 6.2, col: "#991b1b" },
    { x: 3.8, z: -33.2, h: 6.2, col: "#991b1b" },
    { x: -14.0, z: -44.0, h: 7.0, col: "#1e3a8a" },
    { x: 14.0, z: -44.0, h: 7.0, col: "#1e3a8a" },
  ],
  bollards: [
    { x: -1.8, z: -33.8, h: 0.95, r: 0.24 },
    { x: 1.8, z: -33.8, h: 0.95, r: 0.24 },
    { x: -5.4, z: -31.4, h: 1.1, r: 0.28 },
    { x: 5.4, z: -31.4, h: 1.1, r: 0.28 },
  ],
  groynes: [
    { x0: -18, z0: -27, x1: -18, z1: -14, count: 9 },
    { x0: 18, z0: -27, x1: 18, z1: -14, count: 9 },
  ],
  boulderClusters: [
    { x: -28, z: -27, count: 9, spread: 5.5 },
    { x: 28, z: -27, count: 9, spread: 5.5 },
  ],
};

/**
 * Master modular world generator: takes any WorldSpec and compiles it into the Three.js scene batch
 */
export function buildModularWorld(b: Batch, spec: WorldSpec = CNUT_SEASIDE_FORTRESS) {
  // 1. Terrain & Landscape
  buildCoastalTerrace(b, D0);
  buildCeremonialCarpet(b, D0, -70, -30.4, 3.4);
  buildCoastalCliffs(b, D0);

  // 2. Castle & Fortifications
  for (const t of spec.towers) {
    buildBastionTower(b, t.x, D0, t.z, t.radius ?? 4.8, t.height ?? 16, t.crenellated ?? true);
  }
  for (const w of spec.walls) {
    buildCurtainWall(b, w.x0, w.z0, w.x1, w.z1, D0, w.height ?? 11, w.thickness ?? 2.8);
  }
  if (spec.keep) {
    const k = spec.keep;
    buildCastleKeep(b, k.x, D0, k.z, k.w, k.d, k.h);
  }
  for (const bn of spec.banners) {
    buildRoyalBannerPole(b, bn.x, D0, bn.z, bn.h, bn.col ?? "#991b1b");
  }

  // 3. Maritime Elements (Viking/Saxon Longships in bay, Bollards, Groynes, Rocks)
  for (const s of spec.ships) {
    buildLongship(b, s.x, s.y, s.z, s.yaw ?? 0, s.length ?? 20, s.beam ?? 4.2);
  }
  for (const bl of spec.bollards) {
    buildMooringBollard(b, bl.x, D0, bl.z, bl.h ?? 0.95, bl.r ?? 0.25);
  }
  for (const gr of spec.groynes) {
    buildBreakwaterGroynes(b, gr.x0, gr.z0, gr.x1, gr.z1, D0 - 1.2, gr.count ?? 8);
  }
  for (const bc of spec.boulderClusters) {
    buildCoastalBoulders(b, bc.x, D0 - 0.4, bc.z, bc.count ?? 8, bc.spread ?? 5.0);
  }
}

