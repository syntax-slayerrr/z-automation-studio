import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { DioramaSceneConfig } from "../types";
import { IsometricTerrain } from "./IsometricTerrain";

export const DioramaCanvas: React.FC<{
  scene?: DioramaSceneConfig;
  cameraPos?: [number, number, number];
  zoom?: number;
}> = ({
  scene,
  cameraPos = [12, 14, 12],
  zoom = 42,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
      <ThreeCanvas
        orthographic
        camera={{
          position: cameraPos,
          zoom: zoom,
          near: 0.1,
          far: 1000,
        }}
        width={1080}
        height={1920}
      >
        {/* Vintage Sunlight & Ambient */}
        <ambientLight intensity={1.1} color="#FFF8EE" />
        <directionalLight
          position={[15, 25, 10]}
          intensity={1.8}
          color="#FFF2D6"
          castShadow
        />
        <directionalLight position={[-10, 8, -10]} intensity={0.5} color="#D2E4F0" />

        {/* 3D Diorama Terrain & Objects */}
        <IsometricTerrain scene={scene} />
      </ThreeCanvas>
    </div>
  );
};
