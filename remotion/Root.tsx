import React from 'react';
import { Composition } from 'remotion';
import { ZAutomationLaunch } from './compositions/ZAutomationLaunch';
import { ZAutomationSquarePromo } from './compositions/ZAutomationSquarePromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
