import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ZAutomationLaunch } from './ZAutomationLaunch';

export interface ZAutomationSquarePromoProps {
  domain?: string;
  audioSrc?: string;
}

/**
 * Clean 1080x1080 Square Adaptation of the 1:1 Z-Automation Launch Film.
 * Scales the 1920x1080 master composition cleanly into a 1080x1080 viewport
 * without any HUD clutter or AI-slop overlays.
 */
export const ZAutomationSquarePromo: React.FC<ZAutomationSquarePromoProps> = ({
  domain = 'z-automation.my.id',
  audioSrc = 'assets/audio/z-launch-1to1.wav',
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          transform: 'scale(0.84)',
          transformOrigin: 'center center',
        }}
      >
        <ZAutomationLaunch domain={domain} audioSrc={audioSrc} />
      </div>
    </AbsoluteFill>
  );
};
