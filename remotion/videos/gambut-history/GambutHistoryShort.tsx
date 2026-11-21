import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { GAMBUT_FRAMES, SCENES, SUBTITLE_CARDS } from './story';
import {
  BrushedInkSubtitleBar,
  clamp,
  easeInOut,
  VintagePaperOverlay,
  VintagePosterFonts,
} from './fx';
import { Scene1HiddenHistory } from './Scene1HiddenHistory';
import { Scene2SebangauCore } from './Scene2SebangauCore';
import { Scene3PeatFormation } from './Scene3PeatFormation';
import { Scene4AgeComparison } from './Scene4AgeComparison';
import { Scene5BalanceDisrupted } from './Scene5BalanceDisrupted';
import { Scene6SmoulderingUnderground } from './Scene6SmoulderingUnderground';
import { Scene7HardToExtinguish } from './Scene7HardToExtinguish';
import { Scene8Finale } from './Scene8Finale';

/**
 * GAMBUT: WARISAN RIBUAN TAHUN, API YANG TERSEMBUNYI (`GambutHistoryShort`)
 * 100% Pure-Code 2D Scientific Documentary (9:16 vertical, 720x1280, 30 fps, ~92s)
 * V2 Lineless Painterly Gouache + Upgraded 7-Layer Textured Indonesia Topographic Atlas!
 */
export const GambutHistoryShort: React.FC = () => {
  const f = useCurrentFrame();

  // Hide karaoke subtitle bar cleanly once final Vintage Poster closing lock fills the card
  const subFade =
    f > GAMBUT_FRAMES - 125 ? clamp(1 - easeInOut((f - (GAMBUT_FRAMES - 125)) / 18), 0, 1) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#182226', overflow: 'hidden' }}>
      <VintagePosterFonts />
      <Audio src={staticFile('gambut-history/audio_master.m4a')} />

      {f < SCENES.s2Start && <Scene1HiddenHistory f={f} />}
      {f >= SCENES.s2Start && f < SCENES.s3Start && <Scene2SebangauCore f={f} />}
      {f >= SCENES.s3Start && f < SCENES.s4Start && <Scene3PeatFormation f={f} />}
      {f >= SCENES.s4Start && f < SCENES.s5Start && <Scene4AgeComparison f={f} />}
      {f >= SCENES.s5Start && f < SCENES.s6Start && <Scene5BalanceDisrupted f={f} />}
      {f >= SCENES.s6Start && f < SCENES.s7Start && <Scene6SmoulderingUnderground f={f} />}
      {f >= SCENES.s7Start && f < SCENES.s8Start && <Scene7HardToExtinguish f={f} />}
      {f >= SCENES.s8Start && <Scene8Finale f={f} />}

      {/* Static Non-Boiling Vintage Watercolor Paper Multiply Texture + Warm Edge Vignette */}
      <VintagePaperOverlay opacity={0.23} />

      {/* Hand-Brushed Feathered Charcoal Karaoke Subtitle Bar */}
      <BrushedInkSubtitleBar f={f} cards={SUBTITLE_CARDS} fadeOpacity={subFade} />
    </AbsoluteFill>
  );
};
