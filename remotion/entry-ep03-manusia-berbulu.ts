import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Ep03ManusiaBerbuluShort } from './videos/ep03-manusia-berbulu/Ep03ManusiaBerbuluShort';
import { COMPOSITION_CONFIG } from './videos/ep03-manusia-berbulu/story';

const IsolatedEp03BerbuluRoot: React.FC = () =>
  React.createElement(Composition, {
    id: COMPOSITION_CONFIG.id,
    component: Ep03ManusiaBerbuluShort,
    durationInFrames: COMPOSITION_CONFIG.durationInFrames,
    fps: COMPOSITION_CONFIG.fps,
    width: COMPOSITION_CONFIG.width,
    height: COMPOSITION_CONFIG.height,
  });

registerRoot(IsolatedEp03BerbuluRoot);
