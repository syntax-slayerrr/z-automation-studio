import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { VideoTopicManifest } from "./types";
import { SEJARAH_IPM_TOPIC } from "./topics/sejarah_ipm";
import { TypographyHeader } from "./typography";
import { VintageOverlay } from "./archival/VintageOverlay";
import { ArchivalCard } from "./archival/ArchivalCard";
import { DioramaCanvas } from "./world/DioramaCanvas";
import { RegionMap } from "./map/RegionMap";
import { WordCaptions } from "./Captions";

export interface HistoricalDioramaReelProps {
  manifest?: VideoTopicManifest;
}

export const HistoricalDioramaReel: React.FC<HistoricalDioramaReelProps> = ({
  manifest = SEJARAH_IPM_TOPIC,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: manifest.palette.paperBg }}>
      {/* 1. Synchronized Cartesia Voiceover Audio */}
      <Audio src={staticFile("assets/audio/ipm-voice.wav")} volume={1.0} />

      {/* 2. Visual Shots Timeline */}
      {manifest.shots.map((shot) => {
        return (
          <Sequence
            key={shot.id}
            from={shot.from}
            durationInFrames={shot.duration}
            name={shot.headline}
          >
            {/* 1. Header Typography */}
            <TypographyHeader
              kicker={shot.kicker}
              headline={shot.headline}
              subtitle={shot.subtitle}
            />

            {/* 2. Visual Layer Switcher */}
            {shot.visualType === "diorama_3d" && (
              <DioramaCanvas
                scene={shot.diorama}
                cameraPos={shot.camera?.position}
                zoom={shot.camera?.zoom}
              />
            )}

            {shot.visualType === "map_route" && shot.map && (
              <RegionMap config={shot.map} />
            )}

            {/* 3. Archival Photo Card (if present) */}
            {shot.archival && (
              <ArchivalCard
                imageSrc={shot.archival.imageSrc}
                caption={shot.archival.caption}
                sourceText={shot.archival.sourceText}
                tiltDeg={shot.archival.tiltDeg}
                position={shot.archival.position}
              />
            )}
          </Sequence>
        );
      })}

      {/* 3. Word-level Animated Subtitle (Cartesia Sync) */}
      <WordCaptions wordsJsonPath="assets/audio/ipm-words.json" />

      {/* 4. Top Vintage Vignette & Parchment Grade Overlay */}
      <VintageOverlay />
    </AbsoluteFill>
  );
};
