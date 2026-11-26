import * as THREE from "three";
import {
  BedroomWorldHandle,
  BedroomWorldOptions,
  buildBedroomWorld,
  roundRectPath,
} from "../../videos/claude-animasi-promo/components/ThreeStudioWorld";
import { TIME_PRESETS, TimeOfDayState } from "../../videos/claude-animasi-promo/world/TimeOfDay";
import {
  buildFloorCornerLamp3D,
  buildLampGlowAddon3D,
  buildPendantLamp3D,
  PracticalLampHandle,
} from "../cinematic-3d-kit/PracticalLampKit";

// ============================================================================
// ZALDY FULL 360° CREATOR STUDIO BEDROOM (`1 unit = 5 cm`)
//  - Floor at `y = -15.0` (76 cm below desk surface `y = +0.2`)
//  - Ceiling at `y = +41.0` (2.80 m room height)
//  - Bounds: `x = -35..+35` (3.50 m wide), `z = -9..+66` (3.75 m deep)
//  - Zones:
//    1. North (`z = -9..+12`): Gunung Guntur Window + Full-Legged Creator Desk + Ergonomic Human Chair
//    2. South-West (`x = -34..-9, z = +30..+64`): Cozy Walnut Bed + Pillows/Duvet + Nightstand & Warm Lamp
//    3. West (`x = -34.5, z = -4..+28`): Bookshelf + Gold/Silver Trophies + Framed Organization Certificates + Neat Sajadah, Peci & Mushaf
//    4. East (`x = +34.5, z = +6..+60`): Two-Tone Walnut Wardrobe + Modern Bedroom Door with Hallway Light Slit
//    5. Auto Camera-Safe Wall Culling so 360° wide cameras NEVER clip behind walls!
// ============================================================================

export const ROOM_BOUNDS = {
  floorY: -15.0,
  deskTopY: 0.2,
  ceilY: 41.0,
  westX: -35.0,
  eastX: 35.0,
  northZ: -9.0,
  southZ: 66.0,
  /** Chair default world position (`y = floorY`) */
  chairDefaultPos: [0.0, -15.0, 11.4] as [number, number, number],
  /** Zaldy's rootPos when seated on the creator chair (`y = floorY`, since Zaldy `sit_desk_*` puts hip at `+0.50m = +10u -> y = -5.0`) */
  zaldyDeskSeatRoot: [0.0, -15.0, 10.8] as [number, number, number],
  /** Zaldy's rootPos when sitting/reclining on the bed (`x = -21.5`, `z = 48.0`, facing `-Z` toward desk = `Math.PI`!) */
  zaldyBedSeatRoot: [-21.5, -15.0, 54.5] as [number, number, number],
  /** Center standing zone on the cozy woven rug */
  zaldyRugStandRoot: [4.5, -15.0, 28.0] as [number, number, number],
} as const;

/**
 * Ready-to-use `FilmicSafetyBounds` for Zaldy's 360° Bedroom:
 * Prevents orbital arcs, splines, or crane pullouts from clipping through walls, ceiling, floor,
 * desk slab, or the overhead ceiling pendant lamp!
 */
export const ZALDY_BEDROOM_CAMERA_SAFE_BOUNDS = {
  minX: ROOM_BOUNDS.westX + 3.2,   // -31.8 (clears bookshelf & wall!)
  maxX: ROOM_BOUNDS.eastX - 3.2,   // +31.8 (clears wardrobe/door wall!)
  minY: ROOM_BOUNDS.floorY + 3.0,  // -12.0 (clears floor & rug!)
  maxY: ROOM_BOUNDS.ceilY - 3.0,   // +38.0 (clears ceiling!)
  minZ: ROOM_BOUNDS.northZ + 2.5,  // -6.5  (NEVER clips behind window glass!)
  maxZ: ROOM_BOUNDS.southZ - 3.0,  // +63.0 (clears headboard/south wall!)
  deskKeepOut: {
    minX: -20.5,
    maxX: 20.5,
    maxZ: 8.8,
    minY: ROOM_BOUNDS.deskTopY + 1.8, // +2.0 (clears walnut desk top cleanly!)
  },
  keepOutSpheres: [
    // Ceiling pendant shade & bulb (`[0, 26.8, 3.8]`, radius 3.6u)
    { center: [0.0, 26.8, 3.8] as [number, number, number], radius: 3.6 },
    // Corner floor lamp shade (`[-30.5, 11.8, 24.0]`)
    { center: [-30.5, 11.8, 24.0] as [number, number, number], radius: 3.2 },
  ],
  softMargin: 2.2,
};

function makeTex(
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

export interface ZaldyFullBedroomHandle {
  group: THREE.Group;
  baseWorld: BedroomWorldHandle;
  humanChair: THREE.Group;
  bedGroup: THREE.Group;
  bedLampLight: THREE.PointLight;
  ceilLight: THREE.PointLight;
  pendantLamp: PracticalLampHandle;
  floorLamp: PracticalLampHandle;
  updateFullRoom: (params: {
    t: number;
    frame: number;
    tod: TimeOfDayState;
    cameraPos: THREE.Vector3;
    chairYaw?: number;
    chairOffsetX?: number;
    chairOffsetZ?: number;
    bedLampOn?: boolean;
    pendantLampOn?: boolean;
    floorLampOn?: boolean;
    deskLampOn?: boolean;
    ceilLightDim?: number;
    screenGlowColor?: string;
    screenGlowIntensity?: number;
    balighoLit?: number;
    starProgress?: number;
  }) => void;
}

export function buildZaldyFullBedroom3D(
  baseOptions?: BedroomWorldOptions
): ZaldyFullBedroomHandle {
  const group = new THREE.Group();
  group.name = "ZaldyFullBedroom360";

  // 1. Instantiate Upgraded North Window + Creator Workstation + Garut Exterior
  const baseWorld = buildBedroomWorld({
    ...baseOptions,
    roomPalette: {
      wallColor: "#212E40",      // Warm Modern Creator Slate feature wall
      wallEmissive: "#0F1722",
      revealColor: "#2F4056",
      curtainA: "#2E4057",
      curtainB: "#1F2D3F",
      deskWood: "#4A3324",       // Rich Warm Walnut Creator Desk
      deskLedColor: "#F59E0B",
      fairyLightColor: "#FFE0A3",
      showFairyLights: true,
      ...baseOptions?.roomPalette,
    },
    props: {
      showServerRack: true,
      showDeskLamp: true,
      showPlant: true,
      showCactus: false,
      showBooks: true,
      showLidMug: false,
      showLidDuck: false,
      ...baseOptions?.props,
    },
  });

  // Resize original oversized floating desk slab (`40x24`) visually by adding real desk apron & legs underneath!
  group.add(baseWorld.group);

  const FY = ROOM_BOUNDS.floorY; // -15.0
  const CY = ROOM_BOUNDS.ceilY;  // +41.0
  const WX = ROOM_BOUNDS.westX;  // -35.0
  const EX = ROOM_BOUNDS.eastX;  // +35.0
  const NZ = ROOM_BOUNDS.northZ; // -9.0
  const SZ = ROOM_BOUNDS.southZ; // +66.0
  const ROOM_W = EX - WX;        // 70.0 (3.50m)
  const ROOM_D = SZ - NZ;        // 75.0 (3.75m)
  const ROOM_H = CY - FY;        // 56.0 (2.80m)
  const MID_Z = (NZ + SZ) * 0.5; // +28.5
  const MID_Y = (FY + CY) * 0.5; // +13.0

  // =========================================================================
  // 2. WARM HONEY-OAK PARQUET FLOOR + SKIRTING BOARDS + COZY WOVEN CENTER RUG
  // =========================================================================
  const parquetTex = makeTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#6F4E35";
    g.fillRect(0, 0, w, h);
    const cols = 8;
    const rows = 24;
    const cw = w / cols;
    const rh = h / rows;
    let seed = 1337;
    const R = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let r = 0; r < rows; r++) {
      const xOff = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const px = c * cw + xOff;
        const py = r * rh;
        const tone = Math.round((R() - 0.5) * 22);
        g.fillStyle = `rgb(${116 + tone}, ${81 + Math.round(tone * 0.7)}, ${54 + Math.round(tone * 0.5)})`;
        g.fillRect(px + 1, py + 1, cw - 2, rh - 2);
        // Subtle wood grain streaks
        g.strokeStyle = "rgba(42, 24, 12, 0.16)";
        g.lineWidth = 1.2;
        for (let k = 0; k < 4; k++) {
          const gy = py + 5 + k * (rh / 4.5);
          g.beginPath();
          g.moveTo(px + 2, gy);
          g.lineTo(px + cw - 2, gy + (R() - 0.5) * 3);
          g.stroke();
        }
      }
    }
  });
  parquetTex.wrapS = parquetTex.wrapT = THREE.RepeatWrapping;
  parquetTex.repeat.set(3, 3);

  const floorMat = new THREE.MeshStandardMaterial({
    map: parquetTex,
    roughness: 0.56,
    metalness: 0.04,
  });
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W + 2, ROOM_D + 2), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, FY, MID_Z);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Cozy Woven Cream-Sand Center Rug (`x = -10..+20, z = +16..+48`)
  const rugTex = makeTex(512, 512, (g, w, h) => {
    g.fillStyle = "#DFD5C2";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#B6A184";
    g.lineWidth = 18;
    g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = "#29465B";
    g.lineWidth = 6;
    g.strokeRect(44, 44, w - 88, h - 88);
    // Subtle woven crosshatch
    g.fillStyle = "rgba(90, 72, 52, 0.045)";
    for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
  });
  const rugMesh = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.16, 32),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.92 })
  );
  rugMesh.position.set(3.5, FY + 0.08, 31.0);
  rugMesh.receiveShadow = true;
  group.add(rugMesh);

  // =========================================================================
  // 3. ARCHITECTURAL 4 WALLS + CEILING + LED COVE (WITH AUTO CAMERA CULLING)
  // =========================================================================
  const creamWallTex = makeTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#EFE7DA");
    gr.addColorStop(0.78, "#E5DBCB");
    gr.addColorStop(1, "#D8CCB8");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  const creamWallMat = new THREE.MeshStandardMaterial({
    map: creamWallTex,
    roughness: 0.88,
    emissive: "#241D15",
    emissiveIntensity: 0.065, // Low self-emissive lets practical room lamps sculpt genuine warm radial pools!
  });
  const slateLowerMat = new THREE.MeshStandardMaterial({
    color: "#212E40",
    roughness: 0.90,
    emissive: "#0D1520",
    emissiveIntensity: 0.16,
  });
  const baseboardMat = new THREE.MeshStandardMaterial({ color: "#F3EFE6", roughness: 0.65 });
  const walnutMat = new THREE.MeshStandardMaterial({ color: "#4D3525", roughness: 0.58 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: "#1E242E", roughness: 0.45, metalness: 0.6 });
  const brassMat = new THREE.MeshPhysicalMaterial({ color: "#E5B85B", roughness: 0.25, metalness: 0.82, clearcoat: 0.5 });
  const silverMat = new THREE.MeshPhysicalMaterial({ color: "#CBD5E1", roughness: 0.24, metalness: 0.85, clearcoat: 0.5 });

  // Close the gap below North Window Wall (`y = -15..0` at `z = -9`) AND seal left/right North wall corners (`x = ±30..±36`)!
  const northUnderDeskWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + 4, 16, 1.4), slateLowerMat);
  northUnderDeskWall.position.set(0, -7.5, NZ);
  northUnderDeskWall.receiveShadow = true;
  const northCornerW = new THREE.Mesh(new THREE.BoxGeometry(7.0, ROOM_H + 4, 1.4), slateLowerMat);
  northCornerW.position.set(-32.5, MID_Y, NZ);
  const northCornerE = northCornerW.clone();
  northCornerE.position.set(32.5, MID_Y, NZ);
  group.add(northUnderDeskWall, northCornerW, northCornerE);

  // Proportion desk width cleanly (`32` units = 1.60m creator desk) so generous walking aisles exist on both sides!
  const origDesk = baseWorld.group.children.find(
    (ch) => ch instanceof THREE.Mesh && Math.abs(ch.position.z - 2) < 0.05 && ch.position.y === 0
  );
  if (origDesk) {
    origDesk.scale.set(0.80, 1.0, 0.62); // 32u wide (1.6m) x 14.9u deep (0.75m) -> realistic bedroom desk!
    origDesk.position.set(0, 0, 2.2);
  }

  // West Wall Group (`x = -35`)
  const westWallGroup = new THREE.Group();
  const westWallMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, ROOM_H, ROOM_D + 2), creamWallMat);
  westWallMesh.position.set(WX - 0.6, MID_Y, MID_Z);
  westWallMesh.receiveShadow = true;
  const westBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.6, ROOM_D), baseboardMat);
  westBaseboard.position.set(WX + 0.12, FY + 0.8, MID_Z);
  westWallGroup.add(westWallMesh, westBaseboard);
  group.add(westWallGroup);

  // East Wall Group (`x = +35`)
  const eastWallGroup = new THREE.Group();
  const eastWallMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, ROOM_H, ROOM_D + 2), creamWallMat);
  eastWallMesh.position.set(EX + 0.6, MID_Y, MID_Z);
  eastWallMesh.receiveShadow = true;
  const eastBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.6, ROOM_D), baseboardMat);
  eastBaseboard.position.set(EX - 0.12, FY + 0.8, MID_Z);
  eastWallGroup.add(eastWallMesh, eastBaseboard);
  group.add(eastWallGroup);

  // South / Back Wall Group (`z = +66`)
  const southWallGroup = new THREE.Group();
  const southWallMesh = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + 2, ROOM_H, 1.2), creamWallMat);
  southWallMesh.position.set(0, MID_Y, SZ + 0.6);
  southWallMesh.receiveShadow = true;
  const southBaseboard = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 1.6, 0.25), baseboardMat);
  southBaseboard.position.set(0, FY + 0.8, SZ - 0.12);
  // Warm Acoustic Wood Slat Accent Panel behind Bed Headboard (`x = -33..-9`)
  for (let s = 0; s < 14; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 34, 0.35), walnutMat);
    slat.position.set(-32.0 + s * 1.72, FY + 21, SZ - 0.18);
    slat.castShadow = true;
    southWallGroup.add(slat);
  }
  southWallGroup.add(southWallMesh, southBaseboard);
  group.add(southWallGroup);

  // Ceiling + Warm Recessed LED Cove (`y = +41.0`)
  const ceilingGroup = new THREE.Group();
  const ceilMesh = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W + 2, 1.0, ROOM_D + 2),
    new THREE.MeshStandardMaterial({ color: "#F6F2EA", roughness: 0.92 })
  );
  ceilMesh.position.set(0, CY + 0.5, MID_Z);
  const coveMat = new THREE.MeshBasicMaterial({ color: "#FFD9A0", toneMapped: false });
  const coveW = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, ROOM_D - 4), coveMat);
  coveW.position.set(WX + 1.2, CY - 0.3, MID_Z);
  const coveE = coveW.clone();
  coveE.position.set(EX - 1.2, CY - 0.3, MID_Z);
  const coveS = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W - 4, 0.22, 0.35), coveMat);
  coveS.position.set(0, CY - 0.3, SZ - 1.2);
  ceilingGroup.add(ceilMesh, coveW, coveE, coveS);
  group.add(ceilingGroup);

  const ceilLight = new THREE.PointLight("#FFEAD0", 0.95, 90, 1.65);
  ceilLight.position.set(0, CY - 4.0, 28.0);
  group.add(ceilLight);

  // =========================================================================
  // 3B. VOXELVERSE-GRADE 4-LAYER PRACTICAL ROOM LAMPS (Pendant + Corner Floor + Desk Glow!)
  // =========================================================================
  // 1) Warm Studio Ceiling Pendant Lamp hanging cleanly over the Creator Desk (`y = 26.8`)
  const pendantLamp = buildPendantLamp3D({
    rodLength: CY - 26.8,
    shadeRadiusTop: 2.4,
    shadeRadiusBot: 3.3,
    shadeHeight: 2.9,
    coneRadius: 14.5,
    coneHeight: 23.0,
    lightColor: "#FFB45C",
    baseLightIntensity: 64.0,
    lightDistance: 72.0,
    haloScale: 14.0,
    baseConeOpacity: 0.15,
  });
  pendantLamp.group.position.set(0.0, 26.8, 3.8);
  group.add(pendantLamp.group);

  // 2) Tall Modern Corner Floor Lamp (`x = -30.5, z = +24.0`) standing cleanly on parquet floor between Bookshelf/Certificates & Bed!
  const floorLamp = buildFloorCornerLamp3D({
    height: 30.0,
    lightColor: "#FFBA68",
    baseLightIntensity: 58.0,
    lightDistance: 64.0,
    haloScale: 15.0,
  });
  floorLamp.group.position.set(WX + 4.5, FY, 24.0);
  group.add(floorLamp.group);

  // 3) Warm Foreground Desk Lamp Glow + Volumetric Cone (casts Voxelverse warm tungsten key-rim on Zaldy's face & desk!)
  const deskLampGlow = buildLampGlowAddon3D({
    lightColor: "#FFA042",
    innerHex: "#FFF8DE",
    midHex: "#FFA84A",
    outerHex: "#EA580C",
    haloScale: 8.4,
    coneTopR: 0.9,
    coneBotR: 6.8,
    coneHeight: 8.6,
    baseConeOpacity: 0.16,
    baseLightIntensity: 48.0,
    lightDistance: 46.0,
    coneTiltZ: 0.34,
    coneTiltX: 0.12,
  });
  deskLampGlow.group.position.set(6.0, 7.45, 1.8);
  group.add(deskLampGlow.group);

  // =========================================================================
  // 4. DESK UNDER-STRUCTURE + PC TOWER + HUMAN-SCALE ERGONOMIC CREATOR CHAIR
  // =========================================================================
  const deskSupportGroup = new THREE.Group();
  // Left steel legs (`x = -14.8`)
  for (const lz of [-3.8, 8.2]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 15.0, 0.8), darkSteelMat);
    leg.position.set(-14.8, -7.5, lz);
    leg.castShadow = true;
    deskSupportGroup.add(leg);
  }
  const leftCrossbar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 12.4), darkSteelMat);
  leftCrossbar.position.set(-14.8, FY + 1.2, 2.2);
  deskSupportGroup.add(leftCrossbar);

  // Right 3-Drawer Walnut Storage Pedestal (`x = +12.2`)
  const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(6.8, 14.8, 11.2), walnutMat);
  drawerUnit.position.set(12.2, -7.6, 2.2);
  drawerUnit.castShadow = drawerUnit.receiveShadow = true;
  deskSupportGroup.add(drawerUnit);
  for (let d = 0; d < 3; d++) {
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 4.2, 0.22),
      new THREE.MeshStandardMaterial({ color: "#3D291C", roughness: 0.55 })
    );
    face.position.set(12.2, -3.0 - d * 4.6, 7.88);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.25), brassMat);
    pull.position.set(12.2, -3.0 - d * 4.6, 8.08);
    deskSupportGroup.add(face, pull);
  }

  // Tempered-Glass Creator PC Tower beside Right Desk Pedestal (`x = +19.5`)
  const pcGroup = new THREE.Group();
  pcGroup.position.set(19.5, FY, 2.2);
  const pcCase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 9.6, 9.2), darkSteelMat);
  pcCase.position.y = 4.8;
  pcCase.castShadow = true;
  const pcFrontFan1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.14, 10, 24),
    new THREE.MeshBasicMaterial({ color: "#38BDF8", toneMapped: false })
  );
  pcFrontFan1.position.set(0, 6.8, 4.65);
  const pcFrontFan2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.14, 10, 24),
    new THREE.MeshBasicMaterial({ color: "#F59E0B", toneMapped: false })
  );
  pcFrontFan2.position.set(0, 3.2, 4.65);
  pcGroup.add(pcCase, pcFrontFan1, pcFrontFan2);
  deskSupportGroup.add(pcGroup);
  group.add(deskSupportGroup);

  // Full-Scale Ergonomic Creator Swivel Chair (`y = -15.0`, seat surface at `y = -5.4` = 48cm!)
  const humanChair = new THREE.Group();
  humanChair.position.set(...ROOM_BOUNDS.chairDefaultPos);
  const chairFabricMat = new THREE.MeshStandardMaterial({ color: "#232E3F", roughness: 0.68 });
  const chairAccentMat = new THREE.MeshStandardMaterial({ color: "#1D4259", roughness: 0.62 });

  // 5-Star Caster Base + Wheels
  const hubCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 5.8, 18), darkSteelMat);
  hubCyl.position.y = 3.8;
  humanChair.add(hubCyl);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const legArm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 5.6), darkSteelMat);
    legArm.position.set(Math.sin(a) * 2.7, 1.1, Math.cos(a) * 2.7);
    legArm.rotation.y = a;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 14), darkSteelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.sin(a) * 5.2, 0.55, Math.cos(a) * 5.2);
    humanChair.add(legArm, wheel);
  }

  // Swivel Upper Seat + Contoured Backrest + Headrest + T-Armrests
  const chairSwivel = new THREE.Group();
  chairSwivel.position.y = 8.8; // -15 + 8.8 = -6.2 center, top at -5.4
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.5, 9.0), chairFabricMat);
  seatPad.castShadow = seatPad.receiveShadow = true;
  chairSwivel.add(seatPad);

  // Backrest placed on `+Z` side when chair faces `-Z` (desk!)
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(8.4, 13.5, 1.4), chairFabricMat);
  backrest.position.set(0, 7.2, 4.2);
  backrest.rotation.x = 0.08;
  backrest.castShadow = true;
  const backrestStripe = new THREE.Mesh(new THREE.BoxGeometry(5.2, 11.2, 1.52), chairAccentMat);
  backrestStripe.position.set(0, 7.2, 4.2);
  backrestStripe.rotation.x = 0.08;
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.2, 1.5), chairFabricMat);
  headrest.position.set(0, 15.2, 4.6);
  chairSwivel.add(backrest, backrestStripe, headrest);

  for (const sx of [-1, 1]) {
    const armPost = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 0.7), darkSteelMat);
    armPost.position.set(sx * 4.8, 2.1, 0.5);
    const armPad = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 4.8), chairFabricMat);
    armPad.position.set(sx * 4.8, 4.3, 0.5);
    chairSwivel.add(armPost, armPad);
  }
  humanChair.add(chairSwivel);
  group.add(humanChair);

  // =========================================================================
  // 5. SOUTH-WEST ZONE: MODERN WALNUT BED (`KASUR`) + PILLOWS/DUVET + NIGHTSTAND & LAMP
  // =========================================================================
  const bedGroup = new THREE.Group();
  // Centered at `x = -21.5, z = +46.5`, foot facing `-Z` (desk), headboard at `z = +64.5`!
  bedGroup.position.set(-21.5, FY, 46.5);

  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(24.8, 4.4, 36.8), walnutMat);
  bedFrame.position.y = 3.2;
  bedFrame.castShadow = bedFrame.receiveShadow = true;
  bedGroup.add(bedFrame);

  // 4 short tapered walnut legs
  for (const lx of [-11.4, 11.4]) {
    for (const lz of [-17.2, 17.2]) {
      const bLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 1.2, 12), walnutMat);
      bLeg.position.set(lx, 0.6, lz);
      bedGroup.add(bLeg);
    }
  }

  // Tall Upholstered & Walnut Headboard at `+Z` (`z = +17.8` local -> `+64.3` world)
  const headboardWood = new THREE.Mesh(new THREE.BoxGeometry(25.4, 17.5, 1.6), walnutMat);
  headboardWood.position.set(0, 9.2, 17.8);
  headboardWood.castShadow = true;
  const headboardPad = new THREE.Mesh(
    new THREE.BoxGeometry(22.6, 10.5, 1.2),
    new THREE.MeshStandardMaterial({ color: "#3A4759", roughness: 0.82 })
  );
  headboardPad.position.set(0, 10.5, 16.9);
  bedGroup.add(headboardWood, headboardPad);

  // Plush White Mattress (`top at y = 9.2` local -> `-5.8` world = 46cm above floor!)
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(23.4, 4.2, 35.2),
    new THREE.MeshStandardMaterial({ color: "#F6F4EE", roughness: 0.85 })
  );
  mattress.position.set(0, 7.1, -0.2);
  mattress.castShadow = mattress.receiveShadow = true;
  bedGroup.add(mattress);

  // Cozy Teal-Navy Duvet Blanket (`#23465E`) with folded crisp white top sheet collar!
  const duvet = new THREE.Mesh(
    new THREE.BoxGeometry(23.8, 1.6, 23.5),
    new THREE.MeshStandardMaterial({ color: "#23465E", roughness: 0.82 })
  );
  duvet.position.set(0, 8.7, -5.8);
  duvet.castShadow = duvet.receiveShadow = true;
  const sheetFold = new THREE.Mesh(
    new THREE.BoxGeometry(23.9, 1.75, 3.4),
    new THREE.MeshStandardMaterial({ color: "#EAECEF", roughness: 0.8 })
  );
  sheetFold.position.set(0, 8.78, 4.8);
  bedGroup.add(duvet, sheetFold);

  // Two Plump Pillows against Headboard
  for (const px of [-5.6, 5.6]) {
    const pillow = new THREE.Mesh(
      new THREE.SphereGeometry(4.8, 20, 16),
      new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.82 })
    );
    pillow.scale.set(1.08, 0.42, 0.68);
    pillow.position.set(px, 10.4, 12.8);
    pillow.rotation.x = 0.28;
    pillow.castShadow = true;
    bedGroup.add(pillow);
  }
  group.add(bedGroup);

  // Bedside Nightstand (`Nakas` at `x = -5.2, z = +60.5`) + Warm Fabric Bedside Lamp!
  const nightstand = new THREE.Group();
  nightstand.position.set(-5.2, FY, 60.5);
  const nsBody = new THREE.Mesh(new THREE.BoxGeometry(7.2, 8.6, 6.8), walnutMat);
  nsBody.position.y = 4.3;
  nsBody.castShadow = nsBody.receiveShadow = true;
  const nsDrawer = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 3.2, 0.2),
    new THREE.MeshStandardMaterial({ color: "#3A271B", roughness: 0.6 })
  );
  nsDrawer.position.set(0, 5.8, -3.45);
  const nsKnob = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), brassMat);
  nsKnob.position.set(0, 5.8, -3.65);

  // Bedside Lamp
  const bLampBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 2.2, 18), brassMat);
  bLampBase.position.y = 9.7;
  const bLampShadeMat = new THREE.MeshStandardMaterial({
    color: "#FFF5E1",
    emissive: "#FFB86C",
    emissiveIntensity: 0.95,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  const bLampShade = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.3, 3.2, 24, 1, true), bLampShadeMat);
  bLampShade.position.y = 12.2;
  nightstand.add(nsBody, nsDrawer, nsKnob, bLampBase, bLampShade);
  group.add(nightstand);

  const bedLampGlow = buildLampGlowAddon3D({
    lightColor: "#FFBA66",
    innerHex: "#FFF7DE",
    midHex: "#FFB860",
    outerHex: "#EA580C",
    haloScale: 11.2,
    coneTopR: 1.8,
    coneBotR: 8.8,
    coneHeight: 12.2,
    baseConeOpacity: 0.14,
    baseLightIntensity: 38.0,
    lightDistance: 50.0,
  });
  bedLampGlow.group.position.set(-5.2, FY + 11.8, 60.0);
  group.add(bedLampGlow.group);
  const bedLampLight = bedLampGlow.light;

  // =========================================================================
  // 6. WEST WALL IDENTITY ZONE: BOOKSHELF + TROPHIES + CERTIFICATES + SAJADAH & PECI!
  // =========================================================================
  const westIdentityGroup = new THREE.Group();

  // A) 4-Tier Modern Walnut & Steel Bookshelf (`x = -32.2, z = +7.5, y = -15..+17`)
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(WX + 2.8, FY, 7.5);
  for (const sz of [-7.8, 7.8]) {
    const postF = new THREE.Mesh(new THREE.BoxGeometry(0.55, 32, 0.55), darkSteelMat);
    postF.position.set(2.1, 16, sz);
    const postB = postF.clone();
    postB.position.set(-2.1, 16, sz);
    shelfGroup.add(postF, postB);
  }
  const shelfHeights = [1.8, 9.6, 17.4, 25.2, 31.8];
  shelfHeights.forEach((sy) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.65, 16.4), walnutMat);
    board.position.set(0, sy, 0);
    board.castShadow = board.receiveShadow = true;
    shelfGroup.add(board);
  });

  // Row 1 & 2 Books (`y = 2.15` & `y = 9.95`)
  const bookPalette = ["#1D4259", "#B91C1C", "#047857", "#D97706", "#334155", "#7C3AED", "#E2E8F0"];
  for (let b = 0; b < 11; b++) {
    const bh = 5.4 + (b % 3) * 0.75;
    const bk = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, bh, 0.92),
      new THREE.MeshStandardMaterial({ color: bookPalette[b % bookPalette.length], roughness: 0.72 })
    );
    bk.position.set(0.1, 2.15 + bh / 2, -6.5 + b * 1.15);
    bk.castShadow = true;
    shelfGroup.add(bk);
  }
  for (let b = 0; b < 7; b++) {
    const bh = 5.2 + ((b + 1) % 3) * 0.7;
    const bk = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, bh, 0.95),
      new THREE.MeshStandardMaterial({ color: bookPalette[(b + 2) % bookPalette.length], roughness: 0.72 })
    );
    bk.position.set(0.1, 9.95 + bh / 2, -6.4 + b * 1.12);
    shelfGroup.add(bk);
  }

  // Row 2 Right Side (`y = 9.95`): Respectful Neat Islamic Worship Shelf — Black Peci + Gold-Embossed Mushaf Al-Qur'an!
  const mushaf = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.1, 4.4),
    new THREE.MeshStandardMaterial({ color: "#064E3B", roughness: 0.55 })
  );
  mushaf.position.set(0.2, 10.55, 4.2);
  const mushafGoldRim = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.25, 4.45), brassMat);
  mushafGoldRim.position.set(0.2, 10.55, 4.2);
  // Iconic Indonesian Black Velvet Peci / Songkok Nasional resting neatly atop/beside!
  const peciMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.55, 1.95, 24),
    new THREE.MeshStandardMaterial({ color: "#121316", roughness: 0.92 })
  );
  peciMesh.scale.set(0.76, 1.0, 1.25); // Oval songkok silhouette!
  peciMesh.position.set(0.3, 12.05, 4.2);
  shelfGroup.add(mushaf, mushafGoldRim, peciMesh);

  // Row 3 (`y = 17.75`): GOLD & SILVER ORGANIZATION / CREATOR TROPHIES (`Piala Organisasi`)!
  const buildTrophy = (mat: THREE.Material, zPos: number, hScale: number) => {
    const tg = new THREE.Group();
    tg.position.set(0.2, 17.75, zPos);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 2.2), darkSteelMat);
    ped.position.y = 0.65;
    const pedPlaque = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), brassMat);
    pedPlaque.rotation.y = Math.PI / 2;
    pedPlaque.position.set(1.12, 0.65, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 1.8 * hScale, 16), mat);
    stem.position.y = 1.3 + 0.9 * hScale;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.45, 2.6 * hScale, 20), mat);
    cup.position.y = 1.3 + 2.8 * hScale;
    const handles = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.14, 10, 24), mat);
    handles.rotation.y = Math.PI / 2;
    handles.position.y = 1.3 + 2.9 * hScale;
    tg.add(ped, pedPlaque, stem, cup, handles);
    tg.castShadow = true;
    return tg;
  };
  shelfGroup.add(
    buildTrophy(brassMat, -3.6, 1.08),  // 1st Place Gold Trophy
    buildTrophy(silverMat, 0.8, 0.92),  // Silver Organization Leadership Award
    buildTrophy(brassMat, 4.8, 0.84)    // Best Creator Award
  );
  westIdentityGroup.add(shelfGroup);

  // B) 2 Framed Organization & Achievement Certificates mounted cleanly on West Wall (`z = +19..+29`)!
  const makeCertificateMesh = (title: string, org: string, sealCol: string) => {
    const tex = makeTex(384, 280, (g, w, h) => {
      g.fillStyle = "#FAF6EC";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#C59B47";
      g.lineWidth = 10;
      g.strokeRect(16, 16, w - 32, h - 32);
      g.strokeStyle = "#1D4259";
      g.lineWidth = 3;
      g.strokeRect(28, 28, w - 56, h - 56);

      g.textAlign = "center";
      g.fillStyle = "#1D4259";
      g.font = "900 22px Georgia, serif";
      g.fillText(title, w / 2, 74);
      g.fillStyle = "#64748B";
      g.font = "600 14px 'Segoe UI', sans-serif";
      g.fillText("Diberikan Kepada:", w / 2, 108);
      g.fillStyle = "#0F172A";
      g.font = "900 30px Georgia, serif";
      g.fillText("ZALDY", w / 2, 148);
      g.fillStyle = "#334155";
      g.font = "700 15px Consolas, monospace";
      g.fillText(org, w / 2, 184);

      // Official Ribbon Seal
      g.fillStyle = sealCol;
      g.beginPath();
      g.arc(w / 2, 224, 18, 0, Math.PI * 2);
      g.fill();
    });
    const frameGrp = new THREE.Group();
    const woodBack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.2, 8.4), walnutMat);
    const certPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 5.4),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 })
    );
    certPlane.rotation.y = Math.PI / 2;
    certPlane.position.x = 0.19;
    frameGrp.add(woodBack, certPlane);
    return frameGrp;
  };

  const cert1 = makeCertificateMesh("PIAGAM PENGHARGAAN", "KEPEMIMPINAN ORGANISASI", "#D97706");
  cert1.position.set(WX + 0.25, FY + 24.5, 22.0);
  const cert2 = makeCertificateMesh("BEST AI CREATOR", "Z-AUTOMATION STUDIO", "#1D4259");
  cert2.position.set(WX + 0.25, FY + 16.8, 22.0);
  westIdentityGroup.add(cert1, cert2);

  // C) Neat Woven Indonesian Prayer Mat (`Sajadah`) laid cleanly on the parquet floor (`x = -25.5, z = +21.5`)!
  const sajadahTex = makeTex(256, 440, (g, w, h) => {
    g.fillStyle = "#064E3B"; // Deep Emerald Green
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#D4AF37"; // Gold woven border
    g.lineWidth = 14;
    g.strokeRect(18, 26, w - 36, h - 52);

    // Traditional Mihrab pointed dome arch at top!
    g.fillStyle = "#04392A";
    g.beginPath();
    g.moveTo(42, h - 52);
    g.lineTo(42, 130);
    g.quadraticCurveTo(w / 2, 48, w - 42, 130);
    g.lineTo(w - 42, h - 52);
    g.closePath();
    g.fill();
    g.strokeStyle = "#EAB308";
    g.lineWidth = 5;
    g.stroke();

    // Cream fringe tassels at top & bottom edges
    g.fillStyle = "#F5F0E1";
    for (let tx = 8; tx < w - 8; tx += 8) {
      g.fillRect(tx, 0, 4, 14);
      g.fillRect(tx, h - 14, 4, 14);
    }
  });
  const sajadahMesh = new THREE.Mesh(
    new THREE.BoxGeometry(11.5, 0.14, 19.5),
    new THREE.MeshStandardMaterial({ map: sajadahTex, roughness: 0.88 })
  );
  sajadahMesh.position.set(-24.8, FY + 0.07, 21.5);
  sajadahMesh.receiveShadow = true;
  westIdentityGroup.add(sajadahMesh);

  group.add(westIdentityGroup);

  // =========================================================================
  // 7. EAST WALL ZONE: TWO-TONE WALNUT WARDROBE (`LEMARI`) + MODERN BEDROOM DOOR
  // =========================================================================
  const eastFurnitureGroup = new THREE.Group();

  // A) Modern Two-Door Walnut & Warm-Cream Wardrobe (`x = +30.5, z = +20.0, y = -15..+23`)
  const wardrobe = new THREE.Group();
  wardrobe.position.set(EX - 4.6, FY, 20.0);
  const wbCarcass = new THREE.Mesh(new THREE.BoxGeometry(8.8, 38.0, 21.0), walnutMat);
  wbCarcass.position.y = 19.0;
  wbCarcass.castShadow = wbCarcass.receiveShadow = true;
  wardrobe.add(wbCarcass);

  const wbDoorMat = new THREE.MeshStandardMaterial({ color: "#EFE9DC", roughness: 0.62 });
  for (const dz of [-5.0, 5.0]) {
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 36.2, 9.6), wbDoorMat);
    doorPanel.position.set(-4.52, 19.0, dz);
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.5, 0.35), brassMat);
    handleBar.position.set(-4.82, 18.5, dz > 0 ? -3.8 : 3.8);
    wardrobe.add(doorPanel, handleBar);
  }
  eastFurnitureGroup.add(wardrobe);

  // B) Modern Recessed-Panel Wooden Bedroom Door (`x = +34.6, z = +49.0, y = -15..+24`)
  const doorGroup = new THREE.Group();
  doorGroup.position.set(EX - 0.2, FY, 49.0);
  // Architrave frame
  const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 39.5, 17.6), walnutMat);
  dFrame.position.y = 19.75;
  // Door leaf
  const dLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 38.2, 15.8),
    new THREE.MeshStandardMaterial({ color: "#5C3F2B", roughness: 0.56 })
  );
  dLeaf.position.y = 19.3;
  // Brushed silver lever handle
  const dLever = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 2.4), silverMat);
  dLever.position.set(-0.75, 18.2, -5.8);
  // Warm hallway light slit glowing softly under door at night!
  const doorLightSlit = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.28, 15.4),
    new THREE.MeshBasicMaterial({ color: "#FFD699", toneMapped: false })
  );
  doorLightSlit.position.set(-0.2, 0.14, 0);
  doorGroup.add(dFrame, dLeaf, dLever, doorLightSlit);
  eastFurnitureGroup.add(doorGroup);

  group.add(eastFurnitureGroup);

  // =========================================================================
  // 8. UNIFIED PER-FRAME ROOM LIGHTING & AUTO CAMERA-SAFE WALL CULLING
  // =========================================================================
  function updateFullRoom(params: {
    t: number;
    frame: number;
    tod: TimeOfDayState;
    cameraPos: THREE.Vector3;
    chairYaw?: number;
    chairOffsetX?: number;
    chairOffsetZ?: number;
    bedLampOn?: boolean;
    pendantLampOn?: boolean;
    floorLampOn?: boolean;
    deskLampOn?: boolean;
    ceilLightDim?: number;
    screenGlowColor?: string;
    screenGlowIntensity?: number;
    balighoLit?: number;
    starProgress?: number;
  }) {
    const {
      t,
      frame,
      tod = TIME_PRESETS.golden_morning,
      cameraPos,
      chairYaw = 0,
      chairOffsetX = 0,
      chairOffsetZ = 0,
      bedLampOn = true,
      pendantLampOn = true,
      floorLampOn = true,
      deskLampOn = true,
      ceilLightDim = 1.0,
      screenGlowColor = "#60A5FA",
      screenGlowIntensity = 3.8,
      balighoLit,
      starProgress = 0,
    } = params;

    const autoBaligho = balighoLit ?? (tod.villageLightFactor > 0.35 ? 1.0 : -1);

    baseWorld.updateWorld(t, {
      noirIntensity: 0,
      lampDim: deskLampOn ? 1.0 : 0.15,
      neonAge: autoBaligho,
      starProgress,
      phoneProgress: 0,
      screenGlowColor,
      screenGlowIntensity,
      screenBrightness: 1.06,
      holoWorldsReveal: 0,
      activeWorld: 0,
      chairSpinRad: 0,
      frame,
      tod,
    });

    // Chair swivel & subtle roll-back offset
    humanChair.position.set(
      ROOM_BOUNDS.chairDefaultPos[0] + chairOffsetX,
      ROOM_BOUNDS.chairDefaultPos[1],
      ROOM_BOUNDS.chairDefaultPos[2] + chairOffsetZ
    );
    chairSwivel.rotation.y = chairYaw;

    // 4-Layer Practical Room Lamps adapt dynamically to Time-of-Day:
    //  - Night / Twilight / Sunset (`nightWarmth ~ 0.8..1.0`): Rich tungsten practical glow carves dramatic depth!
    //  - Golden Morning / Midday (`nightWarmth ~ 0.25..0.45`): Subtle cozy warm accents without washing out sun!
    const nightWarmth = Math.max(0.28, tod.saungBulbFactor);
    const bedLevel = bedLampOn ? 0.32 + nightWarmth * 0.88 : 0.0;
    const pendantLevel = pendantLampOn ? 0.26 + nightWarmth * 0.85 : 0.0;
    const floorLevel = floorLampOn ? 0.28 + nightWarmth * 0.88 : 0.0;
    const deskLevel = deskLampOn ? 0.30 + nightWarmth * 0.90 : 0.0;

    bedLampGlow.setIntensity(bedLevel, t);
    bLampShadeMat.emissiveIntensity = bedLampOn ? 0.25 + 1.15 * nightWarmth : 0.05;
    pendantLamp.setIntensity(pendantLevel, t);
    floorLamp.setIntensity(floorLevel, t);
    deskLampGlow.setIntensity(deskLevel, t);
    // Keep soft ceiling bounce lower at night so practical lamps dominate the mood (Voxelverse lighting secret!)
    ceilLight.intensity = (0.35 + 0.72 * (1 - nightWarmth * 0.55)) * ceilLightDim;

    // Auto Camera-Side Wall Culling: if a wide camera backs outside a wall boundary,
    // transparently hide ONLY that blocking boundary wall so the interior stays 100% unobstructed!
    westWallGroup.visible = cameraPos.x > WX + 2.0;
    eastWallGroup.visible = cameraPos.x < EX - 2.0;
    southWallGroup.visible = cameraPos.z < SZ - 2.0;
    ceilingGroup.visible = cameraPos.y < CY - 1.5;
    eastFurnitureGroup.visible = cameraPos.x < EX + 8.0;
  }

  return {
    group,
    baseWorld,
    humanChair,
    bedGroup,
    bedLampLight,
    ceilLight,
    pendantLamp,
    floorLamp,
    updateFullRoom,
  };
}
