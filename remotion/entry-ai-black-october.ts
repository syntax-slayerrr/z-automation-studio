import React from "react";
import { Composition, registerRoot } from "remotion";
import { AiBlackOctober } from "./videos/ai-black-october/AiBlackOctober";
import {
  AiBlackOctoberMotionQA,
  AiBlackOctoberScreensQA,
  AiBlackOctoberShotsQA,
} from "./videos/ai-black-october/AiBlackOctoberQA";
import { COMPOSITION_CONFIG } from "./videos/ai-black-october/story";

const AiBlackOctoberRoot: React.FC = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {
      id: COMPOSITION_CONFIG.id,
      component: AiBlackOctober,
      durationInFrames: COMPOSITION_CONFIG.durationInFrames,
      fps: COMPOSITION_CONFIG.fps,
      width: COMPOSITION_CONFIG.width,
      height: COMPOSITION_CONFIG.height,
    }),
    React.createElement(Composition, {
      id: "AiBlackOctoberShotsQA",
      component: AiBlackOctoberShotsQA,
      durationInFrames: 10,
      fps: 30,
      width: 540,
      height: 960,
    }),
    React.createElement(Composition, {
      id: "AiBlackOctoberMotionQA",
      component: AiBlackOctoberMotionQA,
      durationInFrames: 6,
      fps: 30,
      width: 540,
      height: 960,
    }),
    React.createElement(Composition, {
      id: "AiBlackOctoberScreensQA",
      component: AiBlackOctoberScreensQA,
      durationInFrames: 6,
      fps: 30,
      width: 1024,
      height: 640,
    })
  );
};

registerRoot(AiBlackOctoberRoot);
