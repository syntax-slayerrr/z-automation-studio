import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { COMPOSITION_CONFIG } from "./story";
import { SceneDirector } from "./components/SceneDirector";
import { OverlayPackaging } from "./components/OverlayPackaging";

/**
 * SawahTeraseringShort — Next-Gen 1080×1920 (Full HD 9:16) 3D Cutaway Explainer
 * "Kenapa Sawah di Gunung Dibuat Bertingkat (Terasering)?"
 *
 * Pure-code Three.js + Analytical 2-Bone IK + Prop-Drives-Hand + Custom GLSL Water & Sky
 * + 7 Continuous Camera Sequences + Seamless Visual & Verbal Loop (ZERO Watermarks!)
 */
export const SawahTeraseringShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#1E78D4" }}>
      <Audio src={staticFile(COMPOSITION_CONFIG.audioMasterPath)} />

      <ThreeCanvas
        width={width}
        height={height}
        shadows="percentage"
        dpr={1}
        camera={{ fov: 39, near: 0.1, far: 180, position: [0.22, 2.38, 6.25] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.06,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <SceneDirector frame={frame} fps={fps} />
      </ThreeCanvas>

      <OverlayPackaging frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
