import React from "react";
import { DioramaSceneConfig } from "../types";
import { LowPolyShip, LowPolyPedati, LowPolyPodium, LowPolySchool, LowPolyDocument, LowPolyEmblem } from "./DioramaAssets";

export const IsometricTerrain: React.FC<{ scene?: DioramaSceneConfig }> = ({ scene }) => {
  const biome = scene?.biome ?? "harbor";

  return (
    <group>
      {/* 3D Base Slab (Balok Tanah/Air Terapung) */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[10, 1.2, 10]} />
        <meshStandardMaterial
          color={
            biome === "ocean"
              ? "#417A94"
              : biome === "plantation"
              ? "#5F7441"
              : biome === "mountain"
              ? "#7A684D"
              : biome === "campus"
              ? "#4E6E38"
              : "#D2BE9B"
          }
          roughness={0.8}
        />
      </mesh>

      {/* Water Layer for Ocean/Harbor */}
      {(biome === "ocean" || biome === "harbor") && (
        <mesh position={[0, 0.05, 1.5]}>
          <boxGeometry args={[9.8, 0.1, 6.8]} />
          <meshStandardMaterial
            color="#3B7D9E"
            roughness={0.2}
            metalness={0.1}
            transparent
            opacity={0.88}
          />
        </mesh>
      )}

      {/* Plantation Terraces */}
      {biome === "plantation" && (
        <group position={[0, 0, 0]}>
          {[-2, 0, 2].map((z, idx) => (
            <mesh key={idx} position={[0, 0.3 * idx, z]}>
              <boxGeometry args={[9, 0.35, 1.4]} />
              <meshStandardMaterial color={idx % 2 === 0 ? "#4A6832" : "#5A7D3C"} />
            </mesh>
          ))}
        </group>
      )}

      {/* Campus Courtyard Path */}
      {biome === "campus" && (
        <group position={[0, 0.02, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.5, 0.06, 9.6]} />
            <meshStandardMaterial color="#D8C8B0" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Primary Asset injection */}
      {scene?.primaryAsset === "steamship" && <LowPolyShip />}
      {scene?.primaryAsset === "pedati" && <LowPolyPedati />}
      {scene?.primaryAsset === "podium" && <LowPolyPodium />}
      {scene?.primaryAsset === "school" && <LowPolySchool />}
      {scene?.primaryAsset === "document" && <LowPolyDocument />}
      {scene?.primaryAsset === "emblem" && <LowPolyEmblem />}
    </group>
  );
};
