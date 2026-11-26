import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Ep02SherpaHimalayaShort } from './videos/ep02-sherpa-himalaya/Ep02SherpaHimalayaShort';
import { COMPOSITION_CONFIG } from './videos/ep02-sherpa-himalaya/story';

const IsolatedEp02SherpaRoot: React.FC = () =>
  React.createElement(Composition, {
    id: COMPOSITION_CONFIG.id,
    component: Ep02SherpaHimalayaShort,
    durationInFrames: COMPOSITION_CONFIG.durationInFrames,
    fps: COMPOSITION_CONFIG.fps,
    width: COMPOSITION_CONFIG.width,
    height: COMPOSITION_CONFIG.height,
  });

registerRoot(IsolatedEp02SherpaRoot);
