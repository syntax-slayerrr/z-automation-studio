import React from "react";
import { Composition, registerRoot } from "remotion";
import { CinematicKitQA } from "./videos/zaldy-room-showcase/CinematicKitQA";
import { MotionRigAuditQA } from "./videos/zaldy-room-showcase/MotionRigAuditQA";
import { ZaldyRigQA } from "./videos/zaldy-room-showcase/ZaldyRigQA";
import { ZaldyRoomQA } from "./videos/zaldy-room-showcase/ZaldyRoomQA";
import { ZaldyRoomShowcase } from "./videos/zaldy-room-showcase/ZaldyRoomShowcase";
import { COMPOSITION_CONFIG } from "./videos/zaldy-room-showcase/story";

const ZaldyRoomRoot: React.FC = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {
      id: COMPOSITION_CONFIG.id,
      component: ZaldyRoomShowcase,
      durationInFrames: COMPOSITION_CONFIG.durationInFrames,
      fps: COMPOSITION_CONFIG.fps,
      width: COMPOSITION_CONFIG.width,
      height: COMPOSITION_CONFIG.height,
    }),
    React.createElement(Composition, {
      id: "CinematicKitQA",
      component: CinematicKitQA,
      durationInFrames: 8,
      fps: 30,
      width: 1280,
      height: 1080,
    }),
    React.createElement(Composition, {
      id: "MotionRigAuditQA",
      component: MotionRigAuditQA,
      durationInFrames: 135,
      fps: 30,
      width: 720,
      height: 1280,
    }),
    React.createElement(Composition, {
      id: "ZaldyRigQA",
      component: ZaldyRigQA,
      durationInFrames: 6,
      fps: 30,
      width: 1440,
      height: 1080,
    }),
    React.createElement(Composition, {
      id: "ZaldyRoomQA",
      component: ZaldyRoomQA,
      durationInFrames: 6,
      fps: 30,
      width: 1440,
      height: 1080,
    })
  );
};

registerRoot(ZaldyRoomRoot);
