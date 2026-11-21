import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { RelSceneDirector } from "./components/RelSceneDirector";
import { RelOverlayPackaging } from "./components/RelOverlayPackaging";
import { REL_COMPOSITION_CONFIG } from "./story";

export const RelKeretaShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#1C71CC" }}>
      {/* 1. Three.js Pro WebGL Stage (PMREM HDRI + PBR Normal/Roughness + GLSL Sky + DOF Bokeh) */}
      <ThreeCanvas
        width={width}
        height={height}
        shadows="percentage"
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.18,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{
          fov: 42,
          near: 0.1,
          far: 140,
          position: [0.45, 2.05, 6.2],
        }}
      >
        <RelSceneDirector frame={frame} />
      </ThreeCanvas>

      {/* 2. Subtle Cinema Vignette & Lens Polish Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 58%, rgba(12,16,24,0.28) 100%)",
        }}
      />

      {/* 3. Clean Shadow-Only Typography & Physics Overlays (Zero Watermarks!) */}
      <RelOverlayPackaging frame={frame} />

      {/* 3. Broadcast Audio Master (-14.8 LUFS) */}
      <Audio src={staticFile(REL_COMPOSITION_CONFIG.audioMasterPath)} />
    </AbsoluteFill>
  );
};
