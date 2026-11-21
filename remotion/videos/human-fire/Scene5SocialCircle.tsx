import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  fireFlicker,
  hash01,
  lerp,
  VolumetricFire2D,
} from './fx';
import { PrehistoricHumanRig } from './PrehistoricHumanRig';
import { ForegroundFoliageFrame, PrehistoricTree, StarryNightSky } from './PrehistoricLandscape';

/**
 * SCENE 5 — KEHIDUPAN SOSIAL BERKEMBANG
 * 1. Community of 5 gathered warmly in a circle around the hearth fire.
 * 2. Elder Tua tells a vivid hunting story with sweeping hand gestures + flickering cave-wall shadow theater!
 * 3. Adult (Aru) teaches curious child (Kala) to knap flint stone tools with rhythmic sparks!
 * 4. Slow grand pull-out revealing the entire illuminated tribe beneath a vast starry night sky.
 */
export const Scene5SocialCircle: React.FC<{ f: number }> = ({ f }) => {
  const s5Start = SCENES.s5Start;
  const s6Start = SCENES.s6Start;
  const localF = Math.max(0, f - s5Start);
  const fl = fireFlicker(f, 23);

  const storyT = easeInOutCubic((f - (CUES.s5_story - 16)) / 30);
  const teachT = easeInOutCubic((f - (CUES.s5_teach - 18)) / 32);
  const wideT = easeInOutCubic((f - (CUES.s5_wide - 24)) / 58);

  // Camera Choreography:
  // Beat 1: Gathering medium wide -> Beat 2: Gently pan left to Storytelling Elder -> Beat 3: Pan right to Aru & Kala stone-knapping -> Beat 4: Sweeping pull-out under starry cosmos!
  const panStory = storyT * (1 - teachT) * 72;
  const panTeach = teachT * (1 - wideT) * -78;
  const camX = panStory + panTeach + Math.sin(f * 0.022) * 3;
  const camZoom = lerp(1.06, 1.22, storyT * (1 - wideT)) - wideT * 0.22;
  const camY = lerp(0, -28, storyT * (1 - wideT)) + wideT * 42;

  // Periodic flint spark burst when Aru taps stone in Beat 3!
  const knapWave = Math.sin(f * 0.36 + 57);
  const sparkBurst = teachT > 0.25 && wideT < 0.7 && knapWave > 0.72 ? (knapWave - 0.72) / 0.28 : 0;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="s5Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#140a22" />
            <stop offset="52%" stopColor="#2c173c" />
            <stop offset="100%" stopColor="#4c2638" />
          </linearGradient>
          <radialGradient id="s5WarmHearth" cx="50%" cy="66%" r="55%">
            <stop offset="0%" stopColor="#ffebb8" stopOpacity={0.58 * fl} />
            <stop offset="38%" stopColor="#f08a34" stopOpacity={0.30 * fl} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="s5Soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#s5Sky)" />
        <StarryNightSky f={f} opacity={0.92} count={92} />

        {/* === MAIN SOCIAL CAMPFIRE DIORAMA === */}
        <g transform={`translate(360, 740) scale(${camZoom}) translate(-360, -740) translate(${camX}, ${camY})`}>
          {/* Distant Starlit Ridges */}
          <path d="M -180 785 L 20 640 L 210 708 L 385 602 L 580 698 L 760 618 L 920 765 L 920 1280 L -180 1280 Z" fill="#1e112b" />

          {/* Sweeping Ochre-Lit Cave Shelter Rock Wall Behind Circle (Canvas for Shadow Storytelling!) */}
          <path
            d="M 35 865 C 48 635, 110 475, 218 422 C 320 374, 448 386, 542 448 C 618 498, 668 648, 682 865 Z"
            fill="#28162e"
            stroke="#f09842"
            strokeOpacity={0.32 * fl}
            strokeWidth={2.5}
          />
          <ellipse cx={360} cy={740} rx={420 * fl} ry={330 * fl} fill="url(#s5WarmHearth)" style={{ mixBlendMode: 'screen' }} />

          {/* SIGNATURE DETAIL (Beat 2): Ancient Cave-Art / Firelight Shadow Story Dancing on Stone Wall! */}
          <g
            opacity={storyT * (1 - wideT * 0.5) * 0.42 * fl}
            transform={`translate(${245 + Math.sin(f * 0.08) * 6}, ${565 + Math.cos(f * 0.09) * 4})`}
          >
            {/* Flickering ochre-tinted shadow of a charging prehistoric stag & hunter spear on rock wall! */}
            <path
              d="M -60 40 C -45 14, -10 8, 22 14 C 38 16, 52 8, 64 -4 L 74 -30 M 64 -4 L 84 -18 M 64 -4 L 54 -28 M 56 16 L 68 48 M 36 22 L 42 56 M -26 24 L -38 56 M -48 24 L -62 50"
              fill="none"
              stroke="#14091b"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx={6} cy={22} rx={38} ry={17} fill="#14091b" />
            {/* Silhouette hunter spear raised in shadow projection */}
            <line x1={-125} y1={52} x2={-78} y2={-6} stroke="#14091b" strokeWidth={5.5} strokeLinecap="round" />
            <circle cx={-106} cy={14} r={11} fill="#14091b" />
            <path d="M -112 24 L -102 58 M -100 24 L -86 54" stroke="#14091b" strokeWidth={8} strokeLinecap="round" />
          </g>

          {/* Flanking Forest Silhouettes */}
          <PrehistoricTree x={-25} y={870} scale={1.1} fill="#160b20" kind="pine" rimColor="#f8aa4e" rimSide="right" rimOpacity={0.5 * fl} />
          <PrehistoricTree x={755} y={872} scale={1.12} fill="#160b20" kind="pine" rimColor="#f8aa4e" rimSide="left" rimOpacity={0.5 * fl} />

          {/* Warm Campfire Clearing Floor */}
          <path d="M -180 868 Q 360 832, 920 870 L 920 1340 L -180 1340 Z" fill="#1e1026" />
          <ellipse cx={360} cy={882} rx={275 * fl} ry={44} fill="#ec8232" opacity={0.32} filter="url(#s5Soft)" />

          {/* === 5 CONSISTENT COMMUNITY MEMBERS GATHERED AROUND THE FIRE === */}
          {/* 1. Far-left tribe companion listening warmly */}
          <PrehistoricHumanRig
            f={f}
            x={106}
            y={878}
            scale={0.88}
            facing={1}
            variant="companion"
            pose="sit_warm"
            rimIntensity={0.82}
            rimColor="#ffc268"
            rimFromFront
            shadowStretch={-1.5}
            seed={51}
            idSuffix="s5c1"
          />

          {/* 2. BEAT 2 HERO: Elder Tua gesturing dramatically while recounting hunt! */}
          <PrehistoricHumanRig
            f={f}
            x={224}
            y={882}
            scale={0.98}
            facing={1}
            variant="elder"
            pose="sit_warm"
            blendToPose="storytell"
            blendT={storyT * (1 - wideT * 0.4)}
            gestureAmp={storyT}
            rimIntensity={0.96}
            rimColor="#ffc870"
            rimFromFront
            shadowStretch={-1.3}
            seed={54}
            idSuffix="s5elder"
          />

          {/* 3. Background listener perched softly behind hearth */}
          <PrehistoricHumanRig
            f={f}
            x={302}
            y={856}
            scale={0.76}
            facing={1}
            variant="companion"
            pose="sit_warm"
            rimIntensity={0.9}
            rimColor="#ffd07c"
            rimFromFront
            showGroundShadow={false}
            seed={55}
            idSuffix="s5bg"
          />

          {/* 4. BEAT 3 HERO: Aru teaching child Kala to knap flint stone tools! */}
          <PrehistoricHumanRig
            f={f}
            x={476}
            y={882}
            scale={0.96}
            facing={-1}
            variant="aru"
            pose="sit_warm"
            blendToPose="knap_stone"
            blendT={teachT * (1 - wideT * 0.4)}
            prop={teachT > 0.25 ? 'flint' : 'none'}
            rimIntensity={0.96}
            rimColor="#ffc870"
            rimFromFront
            shadowStretch={1.3}
            seed={57}
            idSuffix="s5aru"
          />

          {/* 5. Curious Child Kala leaning closely beside Aru watching stone-knapping */}
          <PrehistoricHumanRig
            f={f}
            x={576}
            y={886}
            scale={0.96}
            facing={-1}
            variant="child"
            pose="sit_warm"
            blendToPose="observe_awe"
            blendT={teachT}
            rimIntensity={0.86}
            rimColor="#ffc268"
            rimFromFront
            shadowStretch={1.45}
            seed={59}
            idSuffix="s5child"
          />

          {/* Flint Stone-Knapping Sparks right between Aru's hands in Beat 3! */}
          {sparkBurst > 0.05 && (
            <g transform="translate(446, 822)" opacity={sparkBurst}>
              <circle cx={0} cy={0} r={10 * sparkBurst} fill="#fff4d4" filter="url(#s5Soft)" />
              {Array.from({ length: 8 }).map((_, si) => {
                const ang = (si / 8) * Math.PI * 2 + hash01(si * 13.7) * 0.6;
                const d = (1 - sparkBurst * 0.4) * (18 + hash01(si * 29.1) * 20);
                return (
                  <line
                    key={si}
                    x1={Math.cos(ang) * 4}
                    y1={Math.sin(ang) * 4}
                    x2={Math.cos(ang) * d}
                    y2={Math.sin(ang) * d}
                    stroke="#ffe69a"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          )}

          {/* Central Community Hearth Fire */}
          <VolumetricFire2D
            f={f}
            cx={356}
            cy={866}
            scale={1.12}
            intensity={1.0}
            showLogs
            showSmoke
            emberCount={30}
            wind={0.03}
            idPrefix="s5social"
          />
        </g>
      </svg>

      <ForegroundFoliageFrame parallaxX={camX * 0.35} parallaxY={0} tint="#13091a" opacity={0.58 * (1 - wideT * 0.5)} />
    </AbsoluteFill>
  );
};
