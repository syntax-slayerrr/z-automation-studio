import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
// @ts-ignore
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK, noInkFallback } from "../../../shared/three3d/ep03Shaders";
import { GradeEffect, GrainEffect, LensBlur } from "../../../shared/three3d/ep03Post";
import { EP03_LIGHTS, applySceneLighting } from "../../../shared/three3d/ep03Lighting";
import { FONT_SERIF } from "../../../shared/PaperTextures";
import { SetAMuktamar } from "./SetAMuktamar";
import { SetBClassroomSpi } from "./SetBClassroomSpi";
import { SetCPrianganMap } from "./SetCPrianganMap";
import { SetDPanawuanDusk } from "./SetDPanawuanDusk";
import { cam3DAt, shot3DAt, smoother, transitionOverlayAt, type SubShot3D } from "./ep03Camera";

const PostSync: React.FC = () => {
  const [handle] = useState(() => delayRender("Ep03World3D EffectComposer"));
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

const SceneRig3D: React.FC<{ shot: SubShot3D; f: number }> = ({ shot, f }) => {
  const { camera, scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const rootRef = useRef<THREE.Group>(null);
  const targetVec = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera, {
        color: "#1a0e07",
        widthNear: 3.4,
        widthFar: 2.0,
        distNear: 2.0,
        distFar: 24,
      }),
      lens: new LensBlur({ maxCoC: 20, nearScale: 1.3 }),
      bloom: new BloomEffect({
        blendFunction: BlendFunction.ADD,
        intensity: 0.44,
        luminanceThreshold: 1.0,
        luminanceSmoothing: 0.25,
        mipmapBlur: true,
        levels: 5,
        radius: 0.58,
      }),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(EP03_LIGHTS.muktamar_warm.grade, EP03_LIGHTS.muktamar_warm.gradeAmount),
      grain: new GrainEffect({ amount: 0.014, cellPx: 1.6 }),
    }),
    [camera, scene]
  );

  useEffect(() => () => fx.ink.dispose(), [fx]);

  const camPose = cam3DAt(shot, f);
  const cam = camera as THREE.PerspectiveCamera;

  const syncFrame = () => {
    cam.position.set(...camPose.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...camPose.look);
    cam.rotateZ(camPose.roll);
    cam.fov = camPose.fov;
    cam.near = 0.12;
    cam.far = 140;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    cam.layers.enable(NOINK);

    targetVec.set(...(camPose.focusPoint ?? camPose.look));
    cam.getWorldDirection(fwd);
    fx.lens.focus = Math.max(0.35, targetVec.clone().sub(cam.position).dot(fwd));
    fx.lens.cInf = camPose.cInf;
    fx.grain.seed = f;

    if (sunRef.current && hemiRef.current) {
      applySceneLighting(shot.light, sunRef.current, hemiRef.current, scene, cam, targetVec, fx.grade, shot.shadowRadius);
    }
    if (rootRef.current) {
      noInkFallback(rootRef.current);
    }
  };

  syncFrame();
  useLayoutEffect(() => {
    syncFrame();
  });

  const post = useMemo(
    () => (
      <EffectComposer multisampling={0}>
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
      <directionalLight ref={sunRef} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      <group ref={rootRef}>
        {/* Keep only active 3D set mounted/visible inside one single persistent WebGL context */}
        <group visible={shot.set === "A_MUKTAMAR"}>
          {shot.set === "A_MUKTAMAR" && <SetAMuktamar f={f} />}
        </group>
        <group visible={shot.set === "B_CLASSROOM"}>
          {shot.set === "B_CLASSROOM" && <SetBClassroomSpi f={f} />}
        </group>
        <group visible={shot.set === "C_PRIANGAN_MAP"}>
          {shot.set === "C_PRIANGAN_MAP" && <SetCPrianganMap f={f} />}
        </group>
        <group visible={shot.set === "D_PANAWUAN"}>
          {shot.set === "D_PANAWUAN" && <SetDPanawuanDusk f={f} />}
        </group>
      </group>

      {post}
    </>
  );
};

export const Ep03World3D: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shot3DAt(f);
  const overlay = transitionOverlayAt(f);
  const endOpacity = f >= 2745 ? smoother((f - 2745) / 28) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#140d08" }}>
      {/* Single persistent ThreeCanvas guarantees zero WebGL context exhaustion across all 2,876 frames */}
      <ThreeCanvas
        width={1080}
        height={1920}
        shadows
        gl={{
          preserveDrawingBuffer: true,
          antialias: false,
          stencil: false,
          powerPreference: "high-performance",
          toneMappingExposure: 1.0,
        }}
        camera={{ fov: 40, near: 0.12, far: 140 }}
      >
        <SceneRig3D shot={shot} f={f} />
      </ThreeCanvas>

      {overlay && overlay.opacity > 0 && (
        <AbsoluteFill style={{ backgroundColor: overlay.color, opacity: overlay.opacity, pointerEvents: "none" }} />
      )}

      {endOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: 290,
            left: 88,
            right: 88,
            opacity: endOpacity,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "16px 28px",
              background: "rgba(22, 14, 9, 0.72)",
              border: "1.5px solid rgba(226, 179, 88, 0.72)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 22,
                letterSpacing: "0.18em",
                color: "#e2b358",
                marginBottom: 8,
              }}
            >
              BERSAMBUNG KE EPISODE 04
            </div>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.25,
                color: "#f7ecd2",
              }}
            >
              Merawat Api Pengkaderan Pelajar
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
