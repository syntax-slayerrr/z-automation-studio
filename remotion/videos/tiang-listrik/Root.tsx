import React from "react";
import { Composition } from "remotion";
import { TiangListrikShort } from "./TiangListrikShort";
import { COMPOSITION_CONFIG } from "./story";

export const TiangRoot: React.FC = () => {
  return (
    <Composition
      id="TiangListrikShort"
      component={TiangListrikShort}
      durationInFrames={COMPOSITION_CONFIG.durationInFrames}
      fps={COMPOSITION_CONFIG.fps}
      width={COMPOSITION_CONFIG.width}
      height={COMPOSITION_CONFIG.height}
    />
  );
};
