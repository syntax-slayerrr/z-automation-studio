import * as THREE from 'three';

/**
 * Seamless Sculpted 3D Anatomical Human & Ridged-Multifractal Terrain Geometry Builders
 * Built specifically to match the cinema-grade organic silhouette proportions of `/series-evolusi`
 * (ZERO robotic overlapping cylinders, ZERO sphere ball-joints, ZERO cartoon pyramid cones!).
 */

/**
 * 1. Continuous Lofted Anatomical Human Torso + Pelvis + Neck + Head (`createAnatomicalTorsoGeo`)
 * Generates ONE unified, smooth BufferGeometry with real human S-curve posture:
 * - Pelvic/gluteal fullness (`y = -0.82..-0.45`)
 * - Pinched anatomical waist + lumbar curve (`y = -0.25..-0.10`)
 * - Sculpted thoracic ribcage, chest/pectoral forward projection & dorsal shoulder blades (`y = 0.0..0.44`)
 * - Natural trapezius slope → cylindrical neck → subtle chin/jaw/nose profile & cranium (`y = 0.50..1.04`)
 */
export function createAnatomicalTorsoGeo(includeHead = true): THREE.BufferGeometry {
  // Each slice: [y, rx (half-width), rzFront, rzBack, zCenterShift]
  const bodySlices: Array<[number, number, number, number, number]> = [
    [-0.84, 0.02, 0.02, 0.02, -0.02],
    [-0.78, 0.175, 0.13, 0.145, -0.015],
    [-0.68, 0.235, 0.148, 0.168, -0.02], // sleek athletic pelvis curve
    [-0.56, 0.248, 0.152, 0.172, -0.018],
    [-0.42, 0.228, 0.144, 0.155, -0.008], // iliac crest
    [-0.28, 0.212, 0.140, 0.148, 0.010], // anatomical waist pinch + lumbar lordosis!
    [-0.14, 0.206, 0.142, 0.142, 0.018],
    [0.00, 0.236, 0.162, 0.155, 0.015],  // lower ribcage
    [0.14, 0.268, 0.188, 0.168, 0.010],  // mid-chest
    [0.28, 0.296, 0.208, 0.176, 0.002],  // full pectoral / thoracic volume (matches ref_06_mech.png!)
    [0.39, 0.312, 0.186, 0.168, -0.006], // upper chest / deltoid root
    [0.48, 0.258, 0.145, 0.148, -0.012], // clavicle / trapezius slope
    [0.55, 0.152, 0.105, 0.112, -0.010], // base of neck
    [0.64, 0.098, 0.092, 0.098, -0.004], // neck column
    [0.72, 0.094, 0.092, 0.096, 0.002],
  ];

  const headSlices: Array<[number, number, number, number, number]> = includeHead
    ? [
        [0.76, 0.108, 0.125, 0.108, 0.015], // jawline / chin overhang!
        [0.82, 0.126, 0.142, 0.125, 0.016], // mouth / lower face
        [0.89, 0.132, 0.152, 0.138, 0.012], // nose bridge / cheekbones
        [0.96, 0.134, 0.142, 0.148, 0.002], // forehead / occiput
        [1.03, 0.114, 0.118, 0.128, -0.004], // upper cranium
        [1.08, 0.068, 0.072, 0.078, -0.004],
        [1.10, 0.008, 0.008, 0.008, -0.004], // crown cap
      ]
    : [
        [0.76, 0.088, 0.086, 0.088, 0.002],
        [0.79, 0.010, 0.010, 0.010, 0.002],
      ];

  const slices = [...bodySlices, ...headSlices];
  const radialSegs = 36;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < slices.length; i++) {
    const [y, rx, rzF, rzB, zShift] = slices[i];
    const v = i / (slices.length - 1);
    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Subtle spinal groove along the center back (sinT < 0) and gentle sternum contour in front
      const isFront = sinT >= 0;
      let rz = isFront ? rzF : rzB;
      if (!isFront && y > -0.45 && y < 0.45) {
        const backCenter = Math.pow(Math.max(0, -sinT), 6);
        rz *= 1 - 0.08 * backCenter;
      }

      const x = cosT * rx;
      const z = zShift + sinT * rz;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < slices.length - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 2. Continuous Seamless Lofted Anatomical Limb (`createLoftedLimbGeo`)
 * Builds ONE single uninterrupted sculpted mesh along a 3D joint path (e.g. Shoulder -> Elbow -> Wrist -> Hand
 * or Hip -> Knee -> Calf -> Ankle -> Boot) with custom organic muscle radii at every station —
 * ZERO segmented pipes, ZERO elbow/knee ball joints, ZERO internal Fresnel seam rings!
 */
export function createLoftedLimbGeo(
  controlPoints: Array<[number, number, number]>,
  radiusProfile: (t: number) => number,
  tubularSegs = 36,
  radialSegs = 18,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'catmullrom',
    0.45,
  );

  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const pts = curve.getPoints(tubularSegs);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Add smoothly rounded start & end hemispherical domes (+2 rings each end!)
  const ringData: Array<{ center: THREE.Vector3; N: THREE.Vector3; B: THREE.Vector3; r: number; v: number }> = [];

  // Start cap dome
  const rStart = radiusProfile(0);
  const T0 = frames.tangents[0];
  ringData.push({
    center: pts[0].clone().addScaledVector(T0, -rStart * 0.85),
    N: frames.normals[0],
    B: frames.binormals[0],
    r: 0.002,
    v: 0,
  });
  ringData.push({
    center: pts[0].clone().addScaledVector(T0, -rStart * 0.48),
    N: frames.normals[0],
    B: frames.binormals[0],
    r: rStart * 0.72,
    v: 0.02,
  });

  // Main anatomical limb body
  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    ringData.push({
      center: pts[i],
      N: frames.normals[i],
      B: frames.binormals[i],
      r: Math.max(0.004, radiusProfile(t)),
      v: 0.04 + t * 0.92,
    });
  }

  // End cap dome
  const rEnd = radiusProfile(1);
  const Tend = frames.tangents[tubularSegs];
  ringData.push({
    center: pts[tubularSegs].clone().addScaledVector(Tend, rEnd * 0.48),
    N: frames.normals[tubularSegs],
    B: frames.binormals[tubularSegs],
    r: rEnd * 0.72,
    v: 0.98,
  });
  ringData.push({
    center: pts[tubularSegs].clone().addScaledVector(Tend, rEnd * 0.88),
    N: frames.normals[tubularSegs],
    B: frames.binormals[tubularSegs],
    r: 0.002,
    v: 1,
  });

  for (let i = 0; i < ringData.length; i++) {
    const { center, N, B, r, v } = ringData[i];
    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const ang = u * Math.PI * 2;
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const vx = center.x + (cosA * N.x + sinA * B.x) * r;
      const vy = center.y + (cosA * N.y + sinA * B.y) * r;
      const vz = center.z + (cosA * N.z + sinA * B.z) * r;
      positions.push(vx, vy, vz);
      uvs.push(u, v);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < ringData.length - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Smooth anatomical arm radius curve (deltoid -> bicep -> elbow -> forearm -> wrist -> gloved hand) */
export function armRadiusProfile(scale = 1): (t: number) => number {
  return (t: number) => {
    const base =
      0.084 * Math.exp(-Math.pow(t / 0.16, 2)) +
      0.068 * Math.exp(-Math.pow((t - 0.28) / 0.24, 2)) +
      0.056 * Math.exp(-Math.pow((t - 0.62) / 0.26, 2)) +
      0.044 * Math.exp(-Math.pow((t - 0.96) / 0.14, 2));
    return Math.max(0.042, base) * scale;
  };
}

/** Smooth anatomical leg radius curve (hip/glute -> thigh -> knee -> calf -> ankle -> mountaineering boot) */
export function legRadiusProfile(scale = 1): (t: number) => number {
  return (t: number) => {
    const base =
      0.114 * Math.exp(-Math.pow((t - 0.08) / 0.26, 2)) +
      0.080 * Math.exp(-Math.pow((t - 0.48) / 0.22, 2)) +
      0.074 * Math.exp(-Math.pow((t - 0.72) / 0.18, 2)) +
      0.066 * Math.exp(-Math.pow((t - 0.97) / 0.11, 2));
    return Math.max(0.052, base) * scale;
  };
}

/** Deterministic 2D hash & smooth ridged-multifractal noise for authentic Himalayan mountain massifs! */
function hash2(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

function vNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function ridgedFbm(x: number, y: number, seed: number, octaves = 5): number {
  let sum = 0;
  let amp = 0.55;
  let freq = 1.0;
  let weight = 1.0;
  for (let i = 0; i < octaves; i++) {
    const n = 1.0 - Math.abs(vNoise(x * freq, y * freq, seed + i * 19) * 2.0 - 1.0);
    const sq = n * n * weight;
    weight = Math.max(0.15, Math.min(1.0, sq * 1.8));
    sum += sq * amp;
    freq *= 2.08;
    amp *= 0.48;
  }
  return sum;
}

/**
 * 3. True Ridged-Multifractal Himalayan Mountain Range Geometry (`createHimalayanMountainGeo`)
 * Replaces toy cones with razor-sharp alpine arêtes, sunlit snow couloirs, and vertex-colored granite/snow slopes!
 */
export function createHimalayanMountainGeo(opts: {
  width: number;
  depth: number;
  maxHeight: number;
  segX?: number;
  segZ?: number;
  seed?: number;
  snowColorHex?: string;
  rockColorHex?: string;
  peakCenterX?: number;
}): THREE.BufferGeometry {
  const {
    width,
    depth,
    maxHeight,
    segX = 64,
    segZ = 40,
    seed = 8848,
    snowColorHex = '#EFF7FF',
    rockColorHex = '#1F3A54',
    peakCenterX = 0.0,
  } = opts;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI * 0.5);

  const pos = geo.attributes.position;
  const snowCol = new THREE.Color(snowColorHex);
  const rockCol = new THREE.Color(rockColorHex);
  const shadowBlue = new THREE.Color('#4B7DA6');
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = (x / (width * 0.5)) - peakCenterX;
    const nz = z / (depth * 0.5);

    // Dramatic sweeping alpine crest envelope (tall jagged central massif + flanking sub-peaks)
    const mainRidge = Math.exp(-(nz * nz) * 2.1) * Math.exp(-(nx * nx) * 0.85);
    const subPeakL = Math.exp(-Math.pow(nx + 0.58, 2) * 3.2 - nz * nz * 2.4) * 0.72;
    const subPeakR = Math.exp(-Math.pow(nx - 0.62, 2) * 3.6 - nz * nz * 2.6) * 0.68;
    const envelope = Math.max(mainRidge, subPeakL, subPeakR);

    const ridge = ridgedFbm(x * 0.36 + 2.4, z * 0.36 - 1.3, seed, 5);
    const y = envelope * maxHeight * (0.48 + 0.78 * ridge);
    pos.setY(i, y);

    // Vertex color: sunlit snow caps & ridges vs dark exposed slate granite couloirs!
    const hNorm = Math.max(0, Math.min(1, y / (maxHeight * 0.85)));
    const snowMask = Math.max(0, Math.min(1, (hNorm - 0.24) * 1.45 + (ridge - 0.45) * 0.65));
    const c = rockCol.clone().lerp(shadowBlue, Math.min(1, hNorm * 0.9)).lerp(snowCol, snowMask);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * 4. Displaced Sculpted Glacier Ice Cliff Face (`createGlacierCliffGeo`)
 * Replaces floating dodecahedrons with ONE continuous jagged alpine serac wall featuring
 * real horizontal snow ledges, vertical ice flutes, and vertex-colored deep glacial blue crevices!
 */
export function createGlacierCliffGeo(opts?: {
  height?: number;
  depth?: number;
  segY?: number;
  segZ?: number;
  seed?: number;
}): THREE.BufferGeometry {
  const { height = 9.5, depth = 4.6, segY = 72, segZ = 34, seed = 4201 } = opts ?? {};
  // Plane facing -X (climber climbs on the -X face!)
  const geo = new THREE.PlaneGeometry(depth, height, segZ, segY);
  geo.rotateY(-Math.PI * 0.5);

  const pos = geo.attributes.position;
  const deepIce = new THREE.Color('#0E3B61');
  const midIce = new THREE.Color('#4A9AC7');
  const snowCrust = new THREE.Color('#E8F6FF');
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ridge = ridgedFbm(z * 0.65 + 1.1, y * 0.45 - 0.7, seed, 5);
    // Horizontal stratified glacier ice ledges (natural crampon steps & axe placements!)
    const strata = Math.sin(y * 3.8 + ridge * 2.2) * 0.085;
    // Slight inward taper at back Z edges so cliff feels 3D volumetric
    const edgeRound = Math.pow(Math.abs(z) / (depth * 0.5), 2.4) * 0.68;
    const dispX = -ridge * 0.52 - strata + edgeRound;
    pos.setX(i, dispX);

    // Bright frosted snow along raised ridges & ledges, deep cerulean ice inside crevasses!
    const snowMask = Math.max(0, Math.min(1, ridge * 1.15 + strata * 3.5));
    const col = deepIce.clone().lerp(midIce, Math.min(1, ridge * 1.3)).lerp(snowCrust, Math.pow(snowMask, 1.8));
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}
