import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { SceneDirector } from "./components/SceneDirector";
import { OverlayPackaging } from "./components/OverlayPackaging";
import { COMPOSITION_CONFIG } from "./story";

export const TiangListrikShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Subtle warm sunrise bloom veil bridging the pole swap seamlessly at the midpoint of Shot 38 loop!
  const loopSunriseVeil =
    frame >= 3032 && frame <= 3066
      ? interpolate(frame, [3032, 3049, 3066], [0, 0.32, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <AbsoluteFill style={{ background: "#2278D2" }}>
      {/* 1. 3D WebGL World Layer (100% ANGLE-Safe, ACES Filmic, 2048px Shadows, Macro 85mm Bokeh) */}
      <ThreeCanvas
        width={width}
        height={height}
        shadows="percentage"
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{
          fov: 42,
          near: 0.1,
          far: 145,
          position: [0.12, 1.08, 5.55],
        }}
      >
        <SceneDirector frame={frame} />
      </ThreeCanvas>

      {/* Subtle Blender Cinema Lens Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 62%, rgba(15,18,24,0.18) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle warm dawn sunlight veil during Shot 38 seamless loop handoff */}
      {loopSunriseVeil > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,244,218,0.85), rgba(255,220,175,0.42))",
            opacity: loopSunriseVeil,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 2. Clean 1:1 Screen-Space Overlays & Progressive Subtitles (ZERO TikTok watermark) */}
      <OverlayPackaging frame={frame} />

      {/* 3. Broadcast Audio Master (-14.7 LUFS) */}
      <Audio src={staticFile(COMPOSITION_CONFIG.audioMasterPath)} />
    </AbsoluteFill>
  );
};
