import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { World } from "./world";
import { TOTAL, SHOTS, layersAt } from "./story";
import { WordCaptions } from "./Captions";

export const KAKARUT_FRAMES = TOTAL;

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);

  const cam = camera as THREE.PerspectiveCamera;
  world.update(id, f, cam, scene);

  return <primitive object={world.root} dispose={null} />;
};

const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas
      width={1080}
      height={1920}
      shadows
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
      camera={{ fov: 38, near: 0.2, far: 500 }}
    >
      <Inner id={id} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const KakarutShort: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#A8D5BA" }}>
      {/* 1. Synchronized Cartesia Voiceover Audio */}
      <Audio src={staticFile("assets/audio/garut-kakarut-voice.wav")} volume={1.0} />

      {/* 2. 3D Cartoon World & Bean Head Characters */}
      {layersAt(f).map((l, i) => (
        <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} />
      ))}

      {/* 3. Word-by-Word Cartesia Captions */}
      <WordCaptions />
    </AbsoluteFill>
  );
};
