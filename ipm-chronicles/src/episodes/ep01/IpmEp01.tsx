import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import {
  EditorialCaptions,
  EditorialEraHeader,
  type SceneChapterMeta,
} from "../../shared/EditorialCaptions";
import { MuseumPaperGrade } from "../../shared/PaperTextures";
import { CAPTION_CHUNKS, FPS, SCENES, cue } from "./script";
import {
  Scene0HookArchive,
  Scene1Yogyakarta1919,
  Scene2Gkpm1926,
  Scene3Wajo1950,
  Scene4MysteryHourglass,
  Scene5Garut1958,
  Scene6Bridge1960,
} from "./Ep01Scenes";

export const EP01_FRAMES = SCENES[SCENES.length - 1].to;

const CHAPTERS: SceneChapterMeta[] = [
  { era: "1961", label: "MISTERI KELAHIRAN", darkMode: false },
  { era: "1919", label: "SISWO PROJO · YOGYAKARTA", reconstruct: true, darkMode: false },
  { era: "1926", label: "GKPM · MALANG & SURAKARTA", reconstruct: true, darkMode: false },
  { era: "1950", label: "RINTISAN · WAJO, SULSEL", reconstruct: true, darkMode: false },
  { era: "1919–1950", label: "KRONOLOGI TERPUTUS?", darkMode: true },
  { era: "1958", label: "KONFERENSI GARUT", reconstruct: true, darkMode: false },
  { era: "1960", label: "MENUJU YOGYAKARTA", darkMode: false },
];

export const IpmEp01: React.FC = () => {
  const s3SplitSec = SCENES[3].fromSec + cue(3, "s3_split", 244) / FPS;
  const s2DiffSec = SCENES[2].fromSec + cue(2, "s2_diff", 215) / FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: "#e6d8be" }}>
      <Audio src={staticFile("audio/ep01/ep01_v5_master.wav")} />

      <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].dur}>
        <Scene0HookArchive />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[0]} />
      </Sequence>

      <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].dur}>
        <Scene1Yogyakarta1919 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[1]} />
      </Sequence>

      <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].dur}>
        <Scene2Gkpm1926 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[2]} />
      </Sequence>

      <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].dur}>
        <Scene3Wajo1950 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[3]} />
      </Sequence>

      <Sequence from={SCENES[4].from} durationInFrames={SCENES[4].dur}>
        <Scene4MysteryHourglass />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[4]} />
      </Sequence>

      <Sequence from={SCENES[5].from} durationInFrames={SCENES[5].dur}>
        <Scene5Garut1958 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[5]} />
      </Sequence>

      <Sequence from={SCENES[6].from} durationInFrames={SCENES[6].dur}>
        <Scene6Bridge1960 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[6]} />
      </Sequence>

      <EditorialCaptions
        chunks={CAPTION_CHUNKS}
        fps={FPS}
        darkAtScene={(sceneIdx, t) =>
          sceneIdx === 4 || (sceneIdx === 3 && t >= s3SplitSec) || (sceneIdx === 2 && t >= s2DiffSec)
        }
      />

      <MuseumPaperGrade />
    </AbsoluteFill>
  );
};
