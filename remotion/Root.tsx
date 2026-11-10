import React from 'react';
import { Composition } from 'remotion';
import { ZAutomationLaunch } from './compositions/ZAutomationLaunch';
import { ZAutomationSquarePromo } from './compositions/ZAutomationSquarePromo';
import { KurzgesagtBlackHole } from './kurzgesagt/KurzgesagtBlackHole';
import { BridgeShort, BRIDGE_FRAMES } from './videos/bridge/Bridge';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Cartoon 3D Short (Three.js + Remotion) — 1080x1920 (9:16), 30fps */}
      <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Kurzgesagt / Vox Explainer Reel — 1080x1920 (9:16), 32.63s @ 60fps */}
      <Composition
        id="KurzgesagtBlackHole"
        component={KurzgesagtBlackHole}
        durationInFrames={1958}
        fps={60}
        width={1080}
        height={1920}
      />

      {/* Flagship 1:1 Reference Design Composition — 1920x1080 (16:9), 14.83s @ 60fps */}
      <Composition
        id="ZAutomationLaunch"
        component={ZAutomationLaunch}
        durationInFrames={890}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'z-automation',
          tagline: 'Bangun Sistem Otomasi sekarang lewat Web 3D dan Agen AI',
          domain: 'z-automation.my.id',
          audioSrc: 'assets/audio/z-launch-1to1.wav',
        }}
      />

      {/* Clean 1080x1080 Square Adaptation (Zero HUD / Zero AI Slop) */}
      <Composition
        id="ZAutomationSquarePromo"
        component={ZAutomationSquarePromo}
        durationInFrames={890}
        fps={60}
        width={1080}
        height={1080}
        defaultProps={{
          domain: 'z-automation.my.id',
          audioSrc: 'assets/audio/z-launch-1to1.wav',
        }}
      />
    </>
  );
};
