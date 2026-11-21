import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { CUES, GUNTUR_FRAMES, SCENES, SUBTITLE_CARDS } from './story';
import {
  BrushedInkSubtitleBar,
  easeInOut,
  VintagePaperOverlay,
  VintagePosterFonts,
} from './fx';
import { Scene1Opening } from './Scene1Opening';
import { Scene2Colonial1829 } from './Scene2Colonial1829';
import { Scene3EruptionEra } from './Scene3EruptionEra';
import { Scene4Eruption1847 } from './Scene4Eruption1847';
import { Scene5VolcanicComplex } from './Scene5VolcanicComplex';
import { Scene6ModernPostcard } from './Scene6ModernPostcard';

export { GUNTUR_FRAMES };

export const GunungGunturShort: React.FC = () => {
  const f = useCurrentFrame();
  const { s2Start, s3Start, s4Start, s5Start, s6Start, totalFrames } = SCENES;

  // Clean motivated cross-bridges aligned to physical transitions (rock->map, cloud-curtain, lava->1847, aerial->modern)
  const b12 = easeInOut((f - (s2Start - 7)) / 14);
  const b23 = f >= s3Start ? 1 : 0; // Seamless ash CloudCurtainWipe handoff at peak 100% cover!
  const b34 = easeInOut((f - (s4Start - 5)) / 10); // Molten lava handoff!
  const b45 = f >= s5Start ? 1 : 0; // Seamless daylight CloudCurtainWipe handoff!
  const b56 = easeInOut((f - (s6Start - 10)) / 20); // Smooth aerial-to-modern morph!

  // Hide lower brushed-ink subtitle bar gracefully once the Vintage Travel Postcard frame pulls back!
  const subFade = f >= CUES.s6_postcard + 22 ? 1 - easeInOut((f - (CUES.s6_postcard + 22)) / 14) : 1;
  const endFade = f > totalFrames - 18 ? 1 - easeInOut((f - (totalFrames - 18)) / 18) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#1C191C', overflow: 'hidden' }}>
      <VintagePosterFonts />
      <Audio src={staticFile('gunung-guntur/audio_master.m4a')} />

      {/* 6 Seamless 1:1 Vintage Poster Explainer Scenes */}
      {f < s2Start + 8 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - b12 }}>
          <Scene1Opening f={f} />
        </div>
      )}
      {f >= s2Start - 8 && f < s3Start && (
        <div style={{ position: 'absolute', inset: 0, opacity: b12 * (1 - b23) }}>
          <Scene2Colonial1829 f={f} />
        </div>
      )}
      {f >= s3Start && f < s4Start + 6 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - b34 }}>
          <Scene3EruptionEra f={f} />
        </div>
      )}
      {f >= s4Start - 6 && f < s5Start && (
        <div style={{ position: 'absolute', inset: 0, opacity: b34 * (1 - b45) }}>
          <Scene4Eruption1847 f={f} />
        </div>
      )}
      {f >= s5Start && f < s6Start + 12 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - b56 }}>
          <Scene5VolcanicComplex f={f} />
        </div>
      )}
      {f >= s6Start - 12 && (
        <div style={{ position: 'absolute', inset: 0, opacity: b56 }}>
          <Scene6ModernPostcard f={f} />
        </div>
      )}

      {/* 1:1 Danau Toba Static Non-Boiling Vintage Watercolor/Linen Paper Texture Overlay */}
      <VintagePaperOverlay opacity={0.19 * endFade} />

      {/* 1:1 Danau Toba Hand-Brushed Feathered Charcoal Ink Karaoke Subtitle Bar (Yellow Active Word!) */}
      <BrushedInkSubtitleBar f={f} cards={SUBTITLE_CARDS} fadeOpacity={subFade * endFade} />
    </AbsoluteFill>
  );
};
