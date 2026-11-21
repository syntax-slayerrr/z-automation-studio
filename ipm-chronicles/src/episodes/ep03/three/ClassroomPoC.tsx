import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
// @ts-ignore
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { santriPutra, santriPutri } from "../../../shared/HeritageKid";
import { InkPass, NOINK, noInkFallback, twoTone } from "../../../shared/three3d/ep03Shaders";
import { GrainEffect, GradeEffect, LensBlur } from "../../../shared/three3d/ep03Post";
import { EP03_LIGHTS, applySceneLighting } from "../../../shared/three3d/ep03Lighting";
import { HeritageActor3D } from "../../../shared/three3d/HeritageBillboard";
import {
  ChalkboardCanvas,
  dustMoteTex,
  plasterWallTex,
  sunbeamTex,
  tiledFloorTex,
  woodGrainTex,
} from "../../../shared/three3d/worldTextures";

export const POC_EP03_3D_FRAMES = 780;

const PostSync: React.FC = () => {
  const [handle] = useState(() => delayRender("ClassroomPoC EffectComposer"));
  const { advance } = useThree();
  useFrame(() => {
    continueRender(handle);
  }, 100);
  useEffect(() => {
    const id = requestAnimationFrame(() => advance(performance.now()));
    return () => cancelAnimationFrame(id);
  }, [advance]);
  return null;
};

interface DeskRowProps {
  z: number;
  x: number;
  woodMat: THREE.Material;
  darkWoodMat: THREE.Material;
  paperMat: THREE.Material;
  brassMat: THREE.Material;
}

const SchoolDeskUnit: React.FC<DeskRowProps> = ({ z, x, woodMat, darkWoodMat, paperMat, brassMat }) => {
  // Desktop surface at y = 0.64m, bench seat at y = 0.40m (behind desk at z + 0.44m)
  return (
    <group position={[x, 0, z]}>
      {/* Desk surface */}
      <mesh position={[0, 0.625, 0]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[1.18, 0.04, 0.50]} />
      </mesh>
      {/* Front modesty apron */}
      <mesh position={[0, 0.47, -0.21]} material={darkWoodMat} castShadow receiveShadow>
        <boxGeometry args={[1.08, 0.27, 0.035]} />
      </mesh>
      {/* 4 Desk legs */}
      {[-0.52, 0.52].map((lx) =>
        [-0.20, 0.20].map((lz) => (
          <mesh key={`dl_${lx}_${lz}`} position={[lx, 0.31, lz]} material={darkWoodMat} castShadow receiveShadow>
            <boxGeometry args={[0.055, 0.62, 0.055]} />
          </mesh>
        ))
      )}
      {/* Closed archive notebook + brass inkwell on desk */}
      <mesh position={[-0.18, 0.658, 0.04]} rotation={[0, 0.14, 0]} material={paperMat} castShadow>
        <boxGeometry args={[0.24, 0.024, 0.18]} />
      </mesh>
      <mesh position={[0.32, 0.662, -0.10]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.025, 0.032, 0.036, 12]} />
      </mesh>
      {/* Wooden bench behind desk */}
      <mesh position={[0, 0.40, 0.44]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[1.14, 0.038, 0.30]} />
      </mesh>
      {[-0.48, 0.48].map((bx) => (
        <mesh key={`bl_${bx}`} position={[bx, 0.20, 0.44]} material={darkWoodMat} castShadow receiveShadow>
          <boxGeometry args={[0.055, 0.40, 0.26]} />
        </mesh>
      ))}
    </group>
  );
};

interface CamState {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  roll: number;
  cInf: number;
  focusPoint?: [number, number, number];
}

function classroomCamAt(f: number): CamState {
  if (f < 304) {
    // Shot 05 (f=243..304): Wide 3D Diagonal Aisle Walk-In with subtle continuous dolly
    const u = Math.max(0, Math.min(1, (f - 243) / 61));
    return {
      pos: [1.75 - u * 0.45, 1.50 - u * 0.06, 0.95 - u * 0.55],
      look: [0.12, 1.05, -2.10],
      fov: 42 - u * 2.5,
      roll: -0.02 + u * 0.008,
      cInf: 7.5,
      focusPoint: [0.18, 1.02, -1.95],
    };
  }
  if (f < 399) {
    // Shot 06 (f=304..399): True OTS framing over seated foreground student's shoulder (lower-left bokeh) toward Andi
    const u = Math.max(0, Math.min(1, (f - 304) / 95));
    return {
      pos: [-1.46 + u * 0.14, 1.18 - u * 0.03, -0.40 - u * 0.14],
      look: [-0.02, 1.04, -1.85],
      fov: 42 - u * 2.5,
      roll: 0.018 - u * 0.008,
      cInf: 16,
      focusPoint: [0.16, 1.08, -1.85],
    };
  }
  if (f < 588) {
    // Shot 08 (f=399..588): Wide-medium diagonal low sweep showing Chalkboard PP..PR + Kader pointing
    const u = Math.max(0, Math.min(1, (f - 399) / 189));
    return {
      pos: [-0.85 + u * 1.15, 1.22 + u * 0.08, 0.15 - u * 0.45],
      look: [-0.10 + u * 0.85, 1.56, -3.40],
      fov: 42 - u * 2.5,
      roll: -0.022 + u * 0.03,
      cInf: 8,
      focusPoint: [0.25, 1.62, -3.40],
    };
  }
  // Shot 10 (f=588..780): Dramatic punch framing PC -> PR on chalkboard alongside Kader Papan
  const u = Math.max(0, Math.min(1, (f - 588) / 192));
  return {
    pos: [0.52 + u * 0.16, 1.38 - u * 0.04, -0.35 - u * 0.45],
    look: [1.18, 1.44, -3.20],
    fov: 38 - u * 2.5,
    roll: 0.025 - u * 0.015,
    cInf: 11,
    focusPoint: [1.35, 1.44, -3.10],
  };
}

const ClassroomInner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const rootRef = useRef<THREE.Group>(null);
  const raysRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Group>(null);

  const chalk = useMemo(() => new ChalkboardCanvas(), []);

  const mats = useMemo(() => {
    const floor = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = tiledFloorTex().clone();
          t.repeat.set(3.5, 4);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const plaster = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = plasterWallTex().clone();
          t.repeat.set(3, 1.5);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const wood = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#6b4426", "#3d2311", 5) }));
    const darkWood = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#452a16", "#251409", 4) }));
    const paper = twoTone(new THREE.MeshLambertMaterial({ color: "#e9dec0" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#b68838", specular: "#fff0bf", shininess: 42 }));
    const slate = new THREE.MeshLambertMaterial({
      map: chalk.tex,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: chalk.tex,
      emissiveIntensity: 0.24,
    });
    const ray = new THREE.MeshBasicMaterial({
      map: sunbeamTex(),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const windowGlow = new THREE.MeshBasicMaterial({ color: "#ffebd0", fog: false });
    const lampShade = twoTone(new THREE.MeshLambertMaterial({ color: "#2d4232" }));
    const bulbGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.15, 0.72), toneMapped: false });
    const dust = new THREE.MeshBasicMaterial({
      map: dustMoteTex(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { floor, plaster, wood, darkWood, paper, brass, slate, ray, windowGlow, lampShade, bulbGlow, dust };
  }, [chalk]);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera, {
        color: "#1a0e07",
        widthNear: 3.4,
        widthFar: 2.0,
        distNear: 2.0,
        distFar: 22,
      }),
      lens: new LensBlur({ maxCoC: 20, nearScale: 1.3 }),
      bloom: new BloomEffect({
        blendFunction: BlendFunction.ADD,
        intensity: 0.42,
        luminanceThreshold: 1.0,
        luminanceSmoothing: 0.25,
        mipmapBlur: true,
        levels: 5,
        radius: 0.55,
      }),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(EP03_LIGHTS.classroom_day.grade, EP03_LIGHTS.classroom_day.gradeAmount),
      grain: new GrainEffect({ amount: 0.015, cellPx: 1.6 }),
    }),
    [camera, scene]
  );

  useEffect(() => () => fx.ink.dispose(), [fx]);

  // Update chalkboard progression synced to S1 word cues (start visible PP/PW at Shot 08 f=399 -> PR f=588)
  const flowP = Math.max(0, Math.min(1, (f - 375) / (600 - 375)));
  const prPulse = f >= 588 ? 0.55 + 0.45 * Math.sin((f - 588) * 0.2) : 0;
  chalk.update(flowP, prPulse, f >= 635);

  const camState = classroomCamAt(f);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...camState.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...camState.look);
  cam.rotateZ(camState.roll);
  cam.fov = camState.fov;
  cam.near = 0.15;
  cam.far = 100;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);

  const targetVec = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  const syncFrame = () => {
    cam.position.set(...camState.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...camState.look);
    cam.rotateZ(camState.roll);
    cam.fov = camState.fov;
    cam.near = 0.15;
    cam.far = 100;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    cam.layers.enable(NOINK);

    targetVec.set(...(camState.focusPoint ?? camState.look));
    cam.getWorldDirection(fwd);
    fx.lens.focus = Math.max(0.4, targetVec.clone().sub(cam.position).dot(fwd));
    fx.lens.cInf = camState.cInf;
    fx.grain.seed = f;

    if (sunRef.current && hemiRef.current) {
      applySceneLighting("classroom_day", sunRef.current, hemiRef.current, scene, cam, targetVec, fx.grade, 10);
    }
    if (rootRef.current) {
      noInkFallback(rootRef.current);
    }
    raysRef.current?.traverse((o) => o.layers.set(NOINK));
    dustRef.current?.traverse((o) => o.layers.set(NOINK));
  };

  syncFrame();
  useLayoutEffect(() => {
    syncFrame();
  });

  // Character blocking across Shot 05 -> Shot 10
  const walkU = Math.max(0, Math.min(1, (f - 243) / 60));
  const andiZ = f < 304 ? -2.35 + walkU * 0.50 : -1.85;
  const andiWalking = f < 300;
  const lampSwing = Math.sin(f * 0.065) * 0.055;

  const dustCoords = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: -2.6 + ((i * 0.71) % 3.8),
        y: 0.75 + ((i * 0.43) % 1.9),
        z: -2.4 + ((i * 0.89) % 3.6),
        spd: 0.012 + (i % 4) * 0.004,
      })),
    []
  );

  const post = useMemo(
    () => (
      <EffectComposer multisampling={2}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
        <primitive object={fx.grain} dispose={null} />
        <PostSync />
      </EffectComposer>
    ),
    [fx]
  );

  return (
    <>
      <hemisphereLight ref={hemiRef} />
      <directionalLight
        ref={sunRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <group ref={rootRef}>
        {/* Floor */}
        <mesh position={[0, 0, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor} receiveShadow>
          <planeGeometry args={[7.0, 8.2]} />
        </mesh>

        {/* Front Wall (Chalkboard wall) + Wainscot Panel */}
        <mesh position={[0, 1.7, -3.65]} material={mats.plaster} receiveShadow>
          <boxGeometry args={[7.0, 3.4, 0.16]} />
        </mesh>
        <mesh position={[0, 0.46, -3.55]} material={mats.darkWood} receiveShadow castShadow>
          <boxGeometry args={[7.0, 0.92, 0.06]} />
        </mesh>

        {/* Right Wall */}
        <mesh position={[3.45, 1.7, 0.4]} material={mats.plaster} receiveShadow>
          <boxGeometry args={[0.16, 3.4, 8.2]} />
        </mesh>
        <mesh position={[3.35, 0.46, 0.4]} material={mats.darkWood} receiveShadow>
          <boxGeometry args={[0.05, 0.92, 8.2]} />
        </mesh>

        {/* Left Wall with two real open Window Bays (x = -3.35) */}
        <mesh position={[-3.35, 0.44, 0.4]} material={mats.darkWood} receiveShadow>
          <boxGeometry args={[0.18, 0.88, 8.2]} />
        </mesh>
        <mesh position={[-3.35, 2.95, 0.4]} material={mats.plaster} receiveShadow>
          <boxGeometry args={[0.18, 0.95, 8.2]} />
        </mesh>
        {/* Wall piers between & around windows (windows at z=-1.55..-0.35 and z=0.65..1.85) */}
        {[
          { z: -2.6, len: 2.1 },
          { z: 0.15, len: 1.0 },
          { z: 3.05, len: 2.4 },
        ].map((p, idx) => (
          <mesh key={`pier_${idx}`} position={[-3.35, 1.68, p.z]} material={mats.plaster} receiveShadow castShadow>
            <boxGeometry args={[0.18, 1.62, p.len]} />
          </mesh>
        ))}

        {/* Window mullions & warm sunlit sky pane outside */}
        {[-0.95, 1.25].map((wz) => (
          <group key={`win_${wz}`} position={[-3.36, 1.68, wz]}>
            <mesh position={[-0.45, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.windowGlow}>
              <planeGeometry args={[2.2, 2.2]} />
            </mesh>
            <mesh position={[0, 0, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.08, 1.60, 0.05]} />
            </mesh>
            <mesh position={[0, 0.15, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.08, 0.05, 1.20]} />
            </mesh>
            <mesh position={[0, -0.80, 0]} material={mats.wood} castShadow receiveShadow>
              <boxGeometry args={[0.28, 0.06, 1.28]} />
            </mesh>
          </group>
        ))}

        {/* Chalkboard + Teak Frame + Ledge */}
        <group position={[0.1, 1.72, -3.52]}>
          <mesh position={[0, 0, 0.04]} material={mats.slate}>
            <planeGeometry args={[3.04, 1.46]} />
          </mesh>
          {/* Frame border bars */}
          <mesh position={[0, 0.76, 0.02]} material={mats.wood} castShadow>
            <boxGeometry args={[3.22, 0.08, 0.09]} />
          </mesh>
          <mesh position={[0, -0.77, 0.04]} material={mats.wood} castShadow receiveShadow>
            <boxGeometry args={[3.26, 0.09, 0.14]} />
          </mesh>
          <mesh position={[-1.56, 0, 0.02]} material={mats.wood} castShadow>
            <boxGeometry args={[0.09, 1.56, 0.09]} />
          </mesh>
          <mesh position={[1.56, 0, 0.02]} material={mats.wood} castShadow>
            <boxGeometry args={[0.09, 1.56, 0.09]} />
          </mesh>
        </group>

        {/* Ceiling Beamed Rafters + Gently Swinging Pendulum Lamp */}
        {[-2.2, -0.6, 1.0].map((bz) => (
          <mesh key={`beam_${bz}`} position={[0, 3.22, bz]} material={mats.darkWood} castShadow>
            <boxGeometry args={[6.9, 0.16, 0.18]} />
          </mesh>
        ))}
        <group position={[0.2, 3.22, -1.75]} rotation={[0, 0, lampSwing]}>
          <mesh position={[0, -0.45, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.014, 0.014, 0.90, 8]} />
          </mesh>
          <mesh position={[0, -0.92, 0]} material={mats.lampShade} castShadow>
            <coneGeometry args={[0.22, 0.14, 16, 1, true]} />
          </mesh>
          <mesh position={[0, -0.97, 0]} material={mats.bulbGlow}>
            <sphereGeometry args={[0.05, 12, 12]} />
          </mesh>
        </group>

        {/* 3x2 Classroom Student Desks & Benches (central aisle clear) */}
        {[-1.55, -0.15, 1.25].map((dz) =>
          [-1.35, 1.35].map((dx) => (
            <SchoolDeskUnit
              key={`desk_${dx}_${dz}`}
              x={dx}
              z={dz}
              woodMat={mats.wood}
              darkWoodMat={mats.darkWood}
              paperMat={mats.paper}
              brassMat={mats.brass}
            />
          ))
        )}

        {/* Slanted Volumetric Sunbeams from Window Bays (NOINK) */}
        <group ref={raysRef}>
          {[-0.95, 1.25].map((wz) => (
            <mesh
              key={`ray_${wz}`}
              position={[-1.45, 1.25, wz + 0.15]}
              rotation={[0.05, 0.15, -0.78]}
              material={mats.ray}
              renderOrder={2}
            >
              <planeGeometry args={[2.8, 3.6]} />
            </mesh>
          ))}
        </group>

        {/* Floating Dust Motes (NOINK) */}
        <group ref={dustRef}>
          {dustCoords.map((d, idx) => (
            <mesh
              key={`dust_${idx}`}
              position={[d.x + Math.sin(f * d.spd + idx) * 0.08, d.y + Math.cos(f * d.spd * 0.8 + idx) * 0.06, d.z]}
              material={mats.dust}
              rotation={[0, 0.5, 0]}
              renderOrder={2}
            >
              <planeGeometry args={[0.055, 0.055]} />
            </mesh>
          ))}
        </group>

        {/* 2D HeritageKid Cast inside 3D Room */}
        {/* 1. Andi walking aisle & pausing for OTS question */}
        <HeritageActor3D
          look={santriPutra(0, "brown")}
          f={f}
          position={[0.16, 0, andiZ]}
          view={f < 304 ? "threeQuarter" : "front"}
          pose="stand"
          walk={andiWalking ? (f - 243) * 0.055 : 0}
          walkAmp={andiWalking ? 0.9 : 0}
          headTurn={f >= 304 ? -0.45 : -0.15}
          brow={f >= 304 ? 0.35 : 0.05}
          open={f >= 304 ? 0.45 : 0}
          held="book"
          heldHand="R"
          armL={[10, 12]}
          armR={[18, -56]}
          seed={11}
          rimColor="#ffdca8"
          rimSide="L"
          rimStrength={0.34}
          cast3DShadow
        />

        {/* 2. Seated front-left student (blurred foreground shoulder during OTS f=304..399) */}
        <HeritageActor3D
          look={santriPutri(1)}
          f={f}
          position={[-1.26, 0, -1.11]}
          view="back"
          pose="sit_desk"
          billboard={false}
          yaw={-0.18}
          seed={23}
          showBlob={false}
        />

        {/* 3. Kader pointing & charting hierarchy at Chalkboard */}
        <HeritageActor3D
          look={santriPutra(2, null)}
          f={f}
          position={[1.64, 0, -2.92]}
          view="profile"
          flip
          pose="stand"
          billboard={false}
          yaw={0.22}
          armR={[-46, -24]}
          head={-6}
          seed={37}
          rimColor="#ffdfaa"
          rimSide="L"
          rimStrength={0.3}
          cast3DShadow
        />
      </group>

      {post}
    </>
  );
};

export const ClassroomPoC: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#d8c49c" }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        shadows
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.15, far: 100 }}
      >
        <ClassroomInner />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
