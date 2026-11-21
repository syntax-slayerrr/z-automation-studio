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
  Scene0Surakarta1961,
  Scene1Pembentukan1961,
  Scene2OrdeBaru1992,
  Scene3Kembali2008,
  Scene4GerakanBaru2010,
  Scene5Cliffhanger,
} from "./Ep02Scenes";

export const EP02_FRAMES = SCENES[SCENES.length - 1].to;

const CHAPTERS: SceneChapterMeta[] = [
  { era: "1960–1961", label: "YOGYAKARTA · SURAKARTA", reconstruct: true, darkMode: true },
  { era: "1961–1976", label: "MASA KONSOLIDASI", reconstruct: true, darkMode: false },
  { era: "1976–1992", label: "ATURAN SEKOLAH · IRM", reconstruct: true, darkMode: true },
  { era: "1992–2008", label: "JALAN KEMBALI", reconstruct: true, darkMode: true },
  { era: "2010", label: "BANTUL · RUMAH KREATIF", reconstruct: true, darkMode: false },
  { era: "EPISODE 02", label: "SEJARAH BELUM SELESAI", reconstruct: true, darkMode: true },
];

export const IpmEp02: React.FC = () => {
  const s3MedanSec = SCENES[3].fromSec + cue(3, "s3_medan", 338) / FPS;
  const s3SoloSec = SCENES[3].fromSec + cue(3, "s3_solo", 609) / FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0a07" }}>
      <Audio src={staticFile("audio/ep02/ep02_master_audio.wav")} />

      <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].dur}>
        <Scene0Surakarta1961 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[0]} />
      </Sequence>

      <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].dur}>
        <Scene1Pembentukan1961 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[1]} />
      </Sequence>

      <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].dur}>
        <Scene2OrdeBaru1992 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[2]} />
      </Sequence>

      <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].dur}>
        <Scene3Kembali2008 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[3]} />
      </Sequence>

      <Sequence from={SCENES[4].from} durationInFrames={SCENES[4].dur}>
        <Scene4GerakanBaru2010 />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[4]} />
      </Sequence>

      <Sequence from={SCENES[5].from} durationInFrames={SCENES[5].dur}>
        <Scene5Cliffhanger />
        <EditorialEraHeader sceneStartFrame={0} meta={CHAPTERS[5]} />
      </Sequence>

      <EditorialCaptions
        chunks={CAPTION_CHUNKS}
        fps={FPS}
        darkAtScene={(sceneIdx, t) =>
          sceneIdx === 0 ||
          sceneIdx === 2 ||
          sceneIdx === 5 ||
          (sceneIdx === 3 && (t < s3MedanSec || t >= s3SoloSec))
        }
      />

      <MuseumPaperGrade />
    </AbsoluteFill>
  );
};
