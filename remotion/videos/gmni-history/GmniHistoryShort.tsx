import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { CUES, GMNI_FRAMES, SCENES, SUBTITLE_CARDS } from './story';
import {
  AmbientGoldDustOverlay,
  ChapterHeader,
  CinematicGradeOverlay,
  clamp,
  easeInOut,
  easeInOutCubic,
  lerp,
  ParchmentSubtitleCard,
} from './fx';
import { Scene1PostIndependence } from './Scene1PostIndependence';
import { Scene2UnityIdea } from './Scene2UnityIdea';
import { Scene3Fusion1953 } from './Scene3Fusion1953';
import { Scene4Congress1954 } from './Scene4Congress1954';
import { Scene5Marhaenisme } from './Scene5Marhaenisme';
import { Scene6MovementAndEmblem } from './Scene6MovementAndEmblem';

export { GMNI_FRAMES };

interface ChapterMeta {
  start: number;
  end: number;
  title: string;
  subtitle: string;
}

export const GmniHistoryShort: React.FC = () => {
  const f = useCurrentFrame();
  const { s1Start, s2Start, s3Start, s4Start, s5Start, s6Start, totalFrames } = SCENES;

  const chapters: ChapterMeta[] = [
    { start: s1Start, end: s2Start, title: 'TAHUN 1950-AN', subtitle: 'PASCA KEMERDEKAAN' },
    { start: s2Start, end: s3Start, title: 'GAGASAN PERSATUAN', subtitle: 'TIGA KOTA PERJUANGAN' },
    { start: s3Start, end: s4Start, title: 'SEPTEMBER 1953', subtitle: 'GAGASAN FUSI' },
    { start: s4Start, end: s5Start, title: '23 MARET 1954', subtitle: 'LAHIRNYA GMNI' },
    { start: s5Start, end: s6Start, title: 'MARHAENISME', subtitle: 'LANDASAN PERJUANGAN' },
    { start: s6Start, end: CUES.s6_logo - 10, title: 'PERJALANAN GERAKAN', subtitle: 'GERAKAN MAHASISWA NASIONAL' },
  ];

  const activeChapter = chapters.find((c) => f >= c.start && f < c.end);
  let headerAlpha = 0;
  let subAlpha = 0;
  let enterProg = 1;
  if (activeChapter) {
    enterProg = clamp((f - activeChapter.start - 2) / 14, 0, 1);
    const enter = easeInOut(enterProg);
    const exit = f > activeChapter.end - 12 ? 1 - easeInOut((f - (activeChapter.end - 12)) / 12) : 1;
    headerAlpha = enter * exit;
    subAlpha = easeInOut((f - activeChapter.start - 10) / 14) * exit;
  }

  // Kinetic Zoom-Through & Directional Parallax Scene Transitions (ZERO sluggish flat fades!)
  const xf = 14;
  const b12 = easeInOutCubic((f - (s2Start - xf / 2)) / xf);
  const b23 = easeInOutCubic((f - (s3Start - xf / 2)) / xf);
  const b34 = easeInOutCubic((f - (s4Start - xf / 2)) / xf);
  const b45 = easeInOutCubic((f - (s5Start - xf / 2)) / xf);
  const b56 = easeInOutCubic((f - (s6Start - xf / 2)) / xf);

  const wipePulse = (center: number, dur = 16) =>
    Math.sin(clamp((f - (center - dur / 2)) / dur, 0, 1) * Math.PI);
  const crimsonGoldWipe = Math.max(
    wipePulse(s2Start, 16) * 0.34,
    wipePulse(s3Start, 16) * 0.42,
    wipePulse(s4Start, 18) * 0.54,
    wipePulse(s5Start, 16) * 0.4,
    wipePulse(s6Start, 16) * 0.42
  );

  const openFade = f < 10 ? easeInOut(f / 10) : 1;
  const endFade = f > totalFrames - 22 ? 1 - easeInOut((f - (totalFrames - 22)) / 22) : 1;
  const subCardOpacity = f >= CUES.s6_logo + 14 ? 1 - easeInOut((f - (CUES.s6_logo + 14)) / 16) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#160a1e', overflow: 'hidden', opacity: openFade }}>
      <Audio src={staticFile('gmni-history/audio_master.m4a')} />

      {/* 6 Seamless Historical Documentary Scenes with Kinetic Push-Through Transitions */}
      {f < s2Start + xf && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 1 - b12,
            transform: `scale(${lerp(1.0, 1.09, b12).toFixed(3)})`,
          }}
        >
          <Scene1PostIndependence f={f} />
        </div>
      )}
      {f >= s2Start - xf && f < s3Start + xf && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: b12 * (1 - b23),
            transform: `scale(${(lerp(0.94, 1.0, b12) * lerp(1.0, 1.09, b23)).toFixed(3)})`,
          }}
        >
          <Scene2UnityIdea f={f} />
        </div>
      )}
      {f >= s3Start - xf && f < s4Start + xf && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: b23 * (1 - b34),
            transform: `scale(${(lerp(0.94, 1.0, b23) * lerp(1.0, 1.1, b34)).toFixed(3)})`,
          }}
        >
          <Scene3Fusion1953 f={f} />
        </div>
      )}
      {f >= s4Start - xf && f < s5Start + xf && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: b34 * (1 - b45),
            transform: `scale(${(lerp(0.94, 1.0, b34) * lerp(1.0, 1.09, b45)).toFixed(3)})`,
          }}
        >
          <Scene4Congress1954 f={f} />
        </div>
      )}
      {f >= s5Start - xf && f < s6Start + xf && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: b45 * (1 - b56),
            transform: `scale(${(lerp(0.94, 1.0, b45) * lerp(1.0, 1.09, b56)).toFixed(3)})`,
          }}
        >
          <Scene5Marhaenisme f={f} />
        </div>
      )}
      {f >= s6Start - xf && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: b56,
            transform: `scale(${lerp(0.94, 1.0, b56).toFixed(3)})`,
          }}
        >
          <Scene6MovementAndEmblem f={f} />
        </div>
      )}

      {/* Motivated Crimson-Gold Optical Light-Streak Scene Transition Wipe */}
      {crimsonGoldWipe > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 52%, rgba(255,228,158,${crimsonGoldWipe.toFixed(3)}) 0%, rgba(208,38,42,${(crimsonGoldWipe * 0.52).toFixed(3)}) 52%, rgba(22,10,30,0) 100%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      <AmbientGoldDustOverlay f={f} count={36} opacity={0.62 * endFade} />

      {activeChapter && (
        <ChapterHeader
          title={activeChapter.title}
          subtitle={activeChapter.subtitle}
          opacity={headerAlpha}
          subOpacity={subAlpha}
          enterProgress={enterProg}
        />
      )}

      <ParchmentSubtitleCard f={f} cards={SUBTITLE_CARDS} fadeOpacity={subCardOpacity} />
      <CinematicGradeOverlay warmth={0.07 * endFade} vignette={0.34} />
    </AbsoluteFill>
  );
};
