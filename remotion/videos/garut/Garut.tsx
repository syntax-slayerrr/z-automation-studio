import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
// @ts-ignore
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";

import { GarutWorld } from "./world";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { GARUT_FRAMES, shotAt, dofAt } from "./story";

export { GARUT_FRAMES };

const makeBloom = () =>
  new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.6,
    luminanceThreshold: 0.95,
    luminanceSmoothing: 0.25,
    mipmapBlur: true,
  });

const PostSync: React.FC = () => {
  const [handle] = useState(() => delayRender("Garut PostSync"));
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

const GarutSceneInner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new GarutWorld(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 22, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    }),
    [camera, scene]
  );

  useEffect(() => () => fx.ink.dispose(), [fx]);

  const shot = shotAt(f);
  const cam = camera as THREE.PerspectiveCamera;

  // Update world physics, actors, and camera
  target.copy(world.update(shot.id, f, cam, scene));
  noInkFallback(world.root);

  // Depth of field
  const d = dofAt(shot.id, f);
  fx.lens.focus = d.focus;
  fx.lens.cInf = d.cInf;

  // Grade
  gradeFor(fx.grade, shot.light);

  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
        <PostSync />
      </EffectComposer>
    </>
  );
};

export const GarutShort: React.FC = () => {
  const f = useCurrentFrame();

  // Subtle flash on scene cut between Shot 1 & Shot 2, and Shot 2 & Shot 3
  const isCut1 = f >= 75 && f < 78;
  const isCut2 = f >= 135 && f < 138;
  const flashAlpha = isCut1
    ? [0.8, 0.4, 0.15][f - 75]
    : isCut2
    ? [0.8, 0.4, 0.15][f - 135]
    : 0;

  return (
    <AbsoluteFill style={{ background: "#7fb2dc" }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        shadows
        gl={{
          antialias: false,
          stencil: false,
          powerPreference: "high-performance",
          toneMappingExposure: 1.0,
        }}
        camera={{ fov: 40, near: 0.2, far: 1500 }}
      >
        <GarutSceneInner />
      </ThreeCanvas>

      {/* Screen flash transition */}
      {flashAlpha > 0 && (
        <AbsoluteFill style={{ background: "#ffffff", opacity: flashAlpha }} />
      )}

      {/* Audio Track */}
      <Audio src={staticFile("garut_voice.mp3")} />
    </AbsoluteFill>
  );
};
