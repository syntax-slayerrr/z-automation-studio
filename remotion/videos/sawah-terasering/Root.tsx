import React from "react";
import { Composition } from "remotion";
import { SawahTeraseringShort } from "./SawahTeraseringShort";
import { COMPOSITION_CONFIG } from "./story";

export const SawahRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_CONFIG.id}
        component={SawahTeraseringShort}
        durationInFrames={COMPOSITION_CONFIG.durationInFrames}
        fps={COMPOSITION_CONFIG.fps}
        width={COMPOSITION_CONFIG.width}
        height={COMPOSITION_CONFIG.height}
      />
    </>
  );
};
