import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { CUES, HUMAN_FIRE_FRAMES, SCENES, SUBTITLE_CARDS } from './story';
import {
  AmbientEmbersOverlay,
  ChapterHeader,
  CinematicGradeOverlay,
  clamp,
  easeInOut,
  ParchmentSubtitleCard,
} from './fx';
import { Scene1BeforeFire } from './Scene1BeforeFire';
import { Scene2FirstFire } from './Scene2FirstFire';
import { Scene3Cooking } from './Scene3Cooking';
import { Scene4SafeNight } from './Scene4SafeNight';
import { Scene5SocialCircle } from './Scene5SocialCircle';
import { Scene6Civilization } from './Scene6Civilization';
import { Scene7Legacy } from './Scene7Legacy';

export { HUMAN_FIRE_FRAMES };

interface ChapterMeta {
  start: number;
  end: number;
  title: string;
  subtitle: string;
}

export const HumanFireShort: React.FC = () => {
  const f = useCurrentFrame();
  const { s1Start, s2Start, s3Start, s4Start, s5Start, s6Start, s7Start, totalFrames } = SCENES;

  const chapters: ChapterMeta[] = [
    { start: s1Start, end: s2Start, title: 'ERA PRASEJARAH', subtitle: 'DUNIA SEBELUM API' },
    { start: s2Start, end: s3Start, title: 'NYALA PERTAMA', subtitle: 'SAMBARAN PETIR' },
    { start: s3Start, end: s4Start, title: 'EVOLUSI PANGAN', subtitle: 'MEMASAK DENGAN API' },
    { start: s4Start, end: s5Start, title: 'PERLINDUNGAN', subtitle: 'MALAM LEBIH AMAN' },
    { start: s5Start, end: s6Start, title: 'IKATAN SOSIAL', subtitle: 'BERKUMPUL DI SEKITAR API' },
    { start: s6Start, end: s7Start, title: 'TEKNOLOGI AWAL', subtitle: 'MENUJU PERADABAN' },
    { start: s7Start, end: CUES.s7_title - 8, title: 'WARISAN API', subtitle: 'MEMBENTUK PERADABAN' },
  ];

  const activeChapter = chapters.find((c) => f >= c.start && f < c.end);
  let headerAlpha = 0;
  let subAlpha = 0;
  if (activeChapter) {
    const enter = easeInOut((f - activeChapter.start - 4) / 14);
    const exit = f > activeChapter.end - 14 ? 1 - easeInOut((f - (activeChapter.end - 14)) / 14) : 1;
    headerAlpha = enter * exit;
    subAlpha = easeInOut((f - activeChapter.start - 14) / 14) * exit;
  }

  // Smooth motivated transition envelopes (16-frame warm optical overlaps — zero abrupt hard cuts!)
  const xf = 16;
  const b12 = easeInOut((f - (s2Start - xf / 2)) / xf);
  const b23 = easeInOut((f - (s3Start - xf / 2)) / xf);
  const b34 = easeInOut((f - (s4Start - xf / 2)) / xf);
  const b45 = easeInOut((f - (s5Start - xf / 2)) / xf);
  const b56 = easeInOut((f - (s6Start - xf / 2)) / xf);
  const b67 = easeInOut((f - (s7Start - xf / 2)) / xf);

  // Subtle warm golden light-wipe pulses right on motivated fire/era transitions (S2->S3, S5->S6, S6->S7)
  const wipePulse = (center: number, dur = 18) =>
    Math.sin(clamp((f - (center - dur / 2)) / dur, 0, 1) * Math.PI);
  const goldenWipe = Math.max(
    wipePulse(s3Start, 18) * 0.48,
    wipePulse(s6Start, 18) * 0.36,
    wipePulse(s7Start, 20) * 0.45
  );

  const openFade = f < 10 ? easeInOut(f / 10) : 1;
  const endFade = f > totalFrames - 22 ? 1 - easeInOut((f - (totalFrames - 22)) / 22) : 1;
  const emberOp = f >= CUES.s2_lightning + 6 ? 0.72 * endFade : 0;

  // Hide subtitle parchment cleanly once closing title card ("Sebuah Nyala Kecil, Mengubah Peradaban.") rises!
  const subCardOpacity = f >= CUES.s7_title + 26 ? 1 - easeInOut((f - (CUES.s7_title + 26)) / 16) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#160a1e', overflow: 'hidden', opacity: openFade }}>
      <Audio src={staticFile('human-fire/audio_master.m4a')} />

      {/* 7 Seamless Pure-Code Documentary Scenes */}
      {f < s2Start + xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - b12 }}>
          <Scene1BeforeFire f={f} />
        </div>
      )}
      {f >= s2Start - xf && f < s3Start + xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: b12 * (1 - b23) }}>
          <Scene2FirstFire f={f} />
        </div>
      )}
      {f >= s3Start - xf && f < s4Start + xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: b23 * (1 - b34) }}>
          <Scene3Cooking f={f} />
        </div>
      )}
      {f >= s4Start - xf && f < s5Start + xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: b34 * (1 - b45) }}>
          <Scene4SafeNight f={f} />
        </div>
      )}
      {f >= s5Start - xf && f < s6Start + xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: b45 * (1 - b56) }}>
          <Scene5SocialCircle f={f} />
        </div>
      )}
      {f >= s6Start - xf && f < s7Start + xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: b56 * (1 - b67) }}>
          <Scene6Civilization f={f} />
        </div>
      )}
      {f >= s7Start - xf && (
        <div style={{ position: 'absolute', inset: 0, opacity: b67 }}>
          <Scene7Legacy f={f} />
        </div>
      )}

      {/* Motivated Golden Firelight Optical Transition Pulse */}
      {goldenWipe > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 62%, rgba(255,222,148,${goldenWipe.toFixed(3)}) 0%, rgba(236,128,50,${(goldenWipe * 0.5).toFixed(3)}) 55%, rgba(22,10,30,0) 100%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Ambient Two-Depth Rising Embers across Fire Eras */}
      <AmbientEmbersOverlay
        f={f}
        count={34}
        opacity={emberOp}
        riseSpeed={f >= s6Start - 16 && f <= s6Start + 24 ? 2.4 : 1.0}
        wind={0.14}
      />

      {/* Signature Earth-24h Glowing Warm Serif Chapter Header */}
      {activeChapter && (
        <ChapterHeader
          title={activeChapter.title}
          subtitle={activeChapter.subtitle}
          opacity={headerAlpha}
          subOpacity={subAlpha}
        />
      )}

      {/* Signature Earth-24h Hand-Torn Deckle-Edge Parchment Karaoke Subtitle Card */}
      <ParchmentSubtitleCard f={f} cards={SUBTITLE_CARDS} fadeOpacity={subCardOpacity} />

      {/* Optical Corner Vignette & Archival SVG Paper Grain */}
      <CinematicGradeOverlay warmth={f >= CUES.s2_lightning ? 0.08 * endFade : 0.02} vignette={0.34} />
    </AbsoluteFill>
  );
};
