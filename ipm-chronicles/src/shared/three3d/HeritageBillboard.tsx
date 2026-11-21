import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { continueRender, delayRender, staticFile } from "remotion";
import { HeritageKid, type HeritageKidProps } from "../HeritageKid";
import { CARD_K, NOINK, blobMaterial, cardShade } from "./ep03Shaders";
import { contactBlobTex } from "./worldTextures";

// HeritageKid SVG coordinate span: x [-150..150] (300u), y [-415..15] (430u), shoes bottom at y=0, hat top ~ -386.
// At metric height 1.55m for 386 SVG units -> 1 SVG unit = 0.0040155m.
const SVG_W = 300;
const SVG_H = 430;
const TEX_W = 600;
const TEX_H = 860;
const METERS_PER_SVG = 1.55 / 386;

const BODY_GEO = (() => {
  const w = SVG_W * METERS_PER_SVG;
  const h = SVG_H * METERS_PER_SVG;
  const g = new THREE.PlaneGeometry(w, h);
  // Shift geometry upward so mesh y=0 rests flush on SVG y=0 (shoe soles)
  g.translate(0, (SVG_H * 0.5 - 15) * METERS_PER_SVG, 0);
  return g;
})();

const BLOB_GEO = new THREE.PlaneGeometry(1, 1);
const WORLD_TMP = new THREE.Vector3();

const BLANK_TEX: THREE.Texture = (() => {
  if (typeof document === "undefined") return new THREE.Texture();
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 4;
  return new THREE.CanvasTexture(c);
})();

let cachedFabricDataUri: string | null = null;
let fabricFetchPromise: Promise<string> | null = null;

function getFabricTextureDataUri(): Promise<string> {
  if (cachedFabricDataUri !== null) return Promise.resolve(cachedFabricDataUri);
  if (fabricFetchPromise) return fabricFetchPromise;

  const url = staticFile("art/textures/fabric_grain_alpha.png");
  fabricFetchPromise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const out = typeof reader.result === "string" ? reader.result : "";
            cachedFabricDataUri = out;
            resolve(out);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => {
      cachedFabricDataUri = "";
      return "";
    });
  return fabricFetchPromise;
}

const TEXTURE_CACHE = new Map<string, THREE.Texture>();
const INFLIGHT_CACHE = new Map<string, Promise<THREE.Texture>>();
const MAX_TEXTURE_CACHE = 128;

function cacheTextureLRU(key: string, tex: THREE.Texture): void {
  if (TEXTURE_CACHE.has(key)) {
    TEXTURE_CACHE.delete(key);
  }
  TEXTURE_CACHE.set(key, tex);
  while (TEXTURE_CACHE.size > MAX_TEXTURE_CACHE) {
    const oldest = TEXTURE_CACHE.keys().next().value;
    if (oldest === undefined) break;
    const oldTex = TEXTURE_CACHE.get(oldest);
    TEXTURE_CACHE.delete(oldest);
    if (oldTex && oldTex !== BLANK_TEX) {
      oldTex.dispose();
    }
  }
}

const q = (v: number | undefined, step: number) => Math.round((v ?? 0) / step) * step;

function quantizeProps(p: HeritageKidProps): { key: string; baked: HeritageKidProps } {
  // Keep internal SVG frame fixed at 0 so character geometry never ticks at 5fps;
  // smooth 30fps breathing, walk bob, and conversational motion happen cleanly on the 3D transform!
  const cycleWalk = p.walk ? ((p.walk % 1) + 1) % 1 : 0;
  const blinkPhase = ((p.f ?? 0) + (p.seed ?? 1) * 43) % 127;
  const blinkClosed = p.useV2Blink ? (blinkPhase >= 124 ? 1 : 0) : 0;
  const baked: HeritageKidProps = {
    ...p,
    f: 0,
    x: 0,
    y: 0,
    scale: 1,
    castShadow: false,
    useV2Blink: false,
    sleep: blinkClosed > 0 ? 1 : p.sleep,
    painterly: p.painterly ?? true,
    tactile: p.tactile ?? true,
    // Phase in radians over one full gait cycle: sin() is periodic, so wrapping at 2π is seamless (no sawtooth reset)
    walk: q(cycleWalk, 0.045) * Math.PI * 2,
    walkAmp: q(p.walkAmp, 0.15),
    armL: p.armL ? [q(p.armL[0], 2), q(p.armL[1], 2)] : undefined,
    armR: p.armR ? [q(p.armR[0], 2), q(p.armR[1], 2)] : undefined,
    head: q(p.head, 1),
    headTurn: q(p.headTurn, 0.06),
    lean: q(p.lean, 1),
    smile: q(p.smile, 0.15),
    open: q(p.open, 0.12),
    brow: q(p.brow, 0.15),
    lanternBounce: q(p.lanternBounce, 0.15),
  };

  const keyObj = {
    look: baked.look,
    flip: !!baked.flip,
    back: !!baked.backView,
    view: baked.view ?? "front",
    pose: baked.pose ?? "stand",
    walk: baked.walk,
    wa: baked.walkAmp,
    al: baked.armL,
    ar: baked.armR,
    hd: baked.head,
    ht: baked.headTurn,
    ln: baked.lean,
    sm: baked.smile,
    op: baked.open,
    br: baked.brow,
    sl: baked.sleep,
    held: baked.held ?? null,
    hh: baked.heldHand ?? "R",
    seed: baked.seed ?? 1,
    sil: baked.sil ?? null,
    rim: baked.rimColor ?? null,
    rs: baked.rimSide ?? "L",
    rst: q(baked.rimStrength, 0.1),
    lb: baked.lanternBounce,
    pt: baked.painterly,
    tc: baked.tactile,
  };
  return { key: JSON.stringify(keyObj), baked };
}

function rasterizeHeritageTexture(baked: HeritageKidProps, key: string, grainDataUri: string): Promise<THREE.Texture> {
  const existing = TEXTURE_CACHE.get(key);
  if (existing) return Promise.resolve(existing);
  const pending = INFLIGHT_CACHE.get(key);
  if (pending) return pending;

  const job = new Promise<THREE.Texture>((resolve) => {
    const useTactile = Boolean(baked.tactile && grainDataUri);
    const svgMarkup = renderToStaticMarkup(
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`-150 -415 ${SVG_W} ${SVG_H}`} width={TEX_W} height={TEX_H}>
        <HeritageKid {...baked} tactile={useTactile} />
      </svg>
    );

    const staticTexUrl = staticFile("art/textures/fabric_grain_alpha.png");
    const safeSvg = useTactile
      ? svgMarkup.split(staticTexUrl).join(grainDataUri)
      : svgMarkup;

    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = TEX_W;
      cv.height = TEX_H;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0, 0, TEX_W, TEX_H);
      ctx.drawImage(img, 0, 0, TEX_W, TEX_H);

      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      cacheTextureLRU(key, tex);
      INFLIGHT_CACHE.delete(key);
      resolve(tex);
    };
    img.onerror = () => {
      INFLIGHT_CACHE.delete(key);
      resolve(BLANK_TEX);
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(safeSvg);
  });

  INFLIGHT_CACHE.set(key, job);
  return job;
}

export interface HeritageActor3DProps extends HeritageKidProps {
  /** World space feet ground position [x, y, z] in meters */
  position: [number, number, number];
  /** Metric character height multiplier (default 1.0 = ~1.55m standing) */
  worldScale?: number;
  /** Keep flat quad facing camera horizontally (cylindrical billboard, default true) */
  billboard?: boolean;
  /** Fixed Y rotation (rad) when billboard=false */
  yaw?: number;
  /** Cast real directional shadow silhouette onto desks/floor (default false) */
  cast3DShadow?: boolean;
  /** Multiply ground contact blob width/depth in meters [rx, rz] */
  blobRadius?: [number, number];
  /** Hide contact blob when legs are hidden under desk */
  showBlob?: boolean;
}

/**
 * Places an exact 2D HeritageKid character into the 3D Three.js world on layer NOINK = 3,
 * lit with cardShade, depth-sorted for LensBlur DOF, and anchored with a multiply floor blob.
 */
export const HeritageActor3D: React.FC<HeritageActor3DProps> = ({
  position,
  worldScale = 1.0,
  billboard = true,
  yaw = 0,
  cast3DShadow = false,
  blobRadius = [0.76, 0.42],
  showBlob = true,
  ...kidProps
}) => {
  const { advance } = useThree();
  const { key, baked } = useMemo(() => quantizeProps(kidProps), [JSON.stringify(kidProps)]);
  const [tex, setTex] = useState<THREE.Texture>(() => TEXTURE_CACHE.get(key) ?? BLANK_TEX);
  const meshRef = React.useRef<THREE.Mesh>(null);
  const blobRef = React.useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    meshRef.current?.layers.set(NOINK);
    blobRef.current?.layers.set(NOINK);
  }, []);

  const { mat, dmat, blobMat } = useMemo(() => {
    const initial = TEXTURE_CACHE.get(key) ?? BLANK_TEX;
    const m = cardShade(
      new THREE.MeshLambertMaterial({
        map: initial,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      })
    );
    m.alphaToCoverage = false;
    const dm = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: initial,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    const bm = blobMaterial(contactBlobTex("#544032"));
    return { mat: m, dmat: dm, blobMat: bm };
  }, []);

  useEffect(() => {
    const hit = TEXTURE_CACHE.get(key);
    if (hit) {
      mat.map = hit;
      dmat.map = hit;
      mat.needsUpdate = true;
      dmat.needsUpdate = true;
      setTex(hit);
      return;
    }
    let cancelled = false;
    const handle = delayRender(`HeritageBillboard:${baked.seed ?? 1}:${baked.view ?? "front"}`);
    getFabricTextureDataUri()
      .then((grainUri) => rasterizeHeritageTexture(baked, key, grainUri))
      .then((loaded) => {
        if (cancelled) {
          continueRender(handle);
          return;
        }
        mat.map = loaded;
        dmat.map = loaded;
        mat.needsUpdate = true;
        dmat.needsUpdate = true;
        setTex(loaded);
        requestAnimationFrame(() => {
          advance(performance.now());
          requestAnimationFrame(() => continueRender(handle));
        });
      })
      .catch(() => {
        continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
  }, [key, baked, advance, mat, dmat]);

  useEffect(() => {
    mat.map = tex;
    dmat.map = tex;
    mat.needsUpdate = true;
    dmat.needsUpdate = true;
  }, [tex, mat, dmat]);

  useEffect(() => {
    return () => {
      mat.dispose();
      dmat.dispose();
      blobMat.dispose();
    };
  }, [mat, dmat, blobMat]);

  // Compute exact 30fps continuous transform deterministically without metronomic Math.sin sway
  const tSec = (kidProps.f ?? 0) / 30;
  const seedOffset = (kidProps.seed ?? 1) * 1.13;
  // Near-imperceptible non-periodic settle (two incommensurate slow waves, tiny amplitude) instead of a metronomic breath loop
  const breathWave = 0.35 * (Math.sin(tSec * 0.71 + seedOffset) + 0.6 * Math.sin(tSec * 1.13 + seedOffset * 2.1));
  const isWalking = (kidProps.walkAmp ?? 0) > 0.05;
  const walkBounce = isWalking ? Math.abs(Math.sin((kidProps.walk ?? 0) * Math.PI * 2)) * 0.022 : 0;
  const animY = position[1] + walkBounce;
  const animScaleX = worldScale * (1 - breathWave * 0.0025);
  const animScaleY = worldScale * (1 + breathWave * 0.0045);
  const animRotZ = isWalking ? Math.sin((kidProps.walk ?? 0) * Math.PI * 2) * 0.014 : 0;

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.layers.set(NOINK);
    blobRef.current?.layers.set(NOINK);

    mesh.position.set(position[0], animY, position[2]);
    mesh.scale.set(animScaleX, animScaleY, worldScale);

    // Use the actor's WORLD position (it may live inside a translated parent group) so the card faces the camera correctly
    mesh.updateWorldMatrix(true, false);
    const wpos = mesh.getWorldPosition(WORLD_TMP);
    const rotY = billboard
      ? Math.atan2(camera.position.x - wpos.x, camera.position.z - wpos.z)
      : yaw;
    mesh.rotation.set(0, rotY, animRotZ);
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={BODY_GEO}
        material={mat}
        customDepthMaterial={dmat}
        position={[position[0], animY, position[2]]}
        scale={[animScaleX, animScaleY, worldScale]}
        rotation={[0, yaw, animRotZ]}
        castShadow={cast3DShadow}
        receiveShadow
        renderOrder={1}
        onBeforeRender={(renderer) => {
          const rt = renderer.getRenderTarget();
          CARD_K.uPx.value = (rt ? rt.height : renderer.domElement.height) / 1920;
          if (meshRef.current) meshRef.current.layers.set(NOINK);
        }}
      />
      {showBlob && (
        <mesh
          ref={blobRef}
          geometry={BLOB_GEO}
          material={blobMat}
          position={[position[0], position[1] + 0.004, position[2]]}
          rotation={[-Math.PI / 2, 0, yaw]}
          scale={[blobRadius[0] * worldScale, blobRadius[1] * worldScale, 1]}
          renderOrder={0.5}
        />
      )}
    </group>
  );
};
