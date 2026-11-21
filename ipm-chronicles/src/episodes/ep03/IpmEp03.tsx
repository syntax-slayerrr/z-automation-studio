import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import {
  EditorialCaptions,
  EditorialEraHeader,
  type SceneChapterMeta,
} from "../../shared/EditorialCaptions";
import { CAPTION_CHUNKS, FPS, SCENES } from "./script";
import { Ep03World3D } from "./three/Ep03World3D";

export const EP03_FRAMES = SCENES[SCENES.length - 1].to;

const CHAPTERS: SceneChapterMeta[] = [
  { era: "MUKTAMAR", label: "MEJA KERJA · AMBANG PINTU", reconstruct: false, darkMode: true },
  { era: "STRUKTUR", label: "RUANG KELAS · PP KE PR", reconstruct: true, darkMode: false },
  { era: "KADERISASI", label: "SPI · FORTASI & TARUNA MELATI", reconstruct: true, darkMode: false },
  { era: "1923 · 1958", label: "AKAR PRIANGAN · GARUT", reconstruct: false, darkMode: false },
  { era: "PANAWUAN", label: "TAROGONG KIDUL · GARUT", reconstruct: true, darkMode: true },
];

export const IpmEp03: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#140d08" }}>
      <Audio src={staticFile("audio/ep03/ep03_master_audio.wav")} />

      <Ep03World3D />

      {CHAPTERS.map((meta, idx) => (
        <Sequence key={meta.era} from={SCENES[idx].from} durationInFrames={SCENES[idx].dur}>
          <EditorialEraHeader sceneStartFrame={0} meta={meta} />
        </Sequence>
      ))}

      <EditorialCaptions
        chunks={CAPTION_CHUNKS}
        fps={FPS}
        darkAtScene={(sceneIdx) => sceneIdx === 0 || sceneIdx === 4}
      />
    </AbsoluteFill>
  );
};
