import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuint,
  fireFlicker,
  hash01,
  lerp,
  lerpRgb,
  VolumetricFire2D,
} from './fx';
import { PrehistoricHumanRig } from './PrehistoricHumanRig';
import { ForegroundFoliageFrame, PrehistoricTree } from './PrehistoricLandscape';

export const Scene2FirstFire: React.FC<{ f: number }> = ({ f }) => {
  const s2Start = SCENES.s2Start;
  const s3Start = SCENES.s3Start;
  const localF = Math.max(0, f - s2Start);
  const s2Dur = Math.max(1, s3Start - s2Start);
  const pAll = clamp(localF / s2Dur, 0, 1);

  // Beat cues anchored directly to ElevenLabs timestamps!
  const strikeF = CUES.s2_lightning;
  const observeF = CUES.s2_observe;
  const approachF = CUES.s2_approach;

  // Lightning bolt & flash envelope right on "petir menyambar pohon"!
  const dtStrike = f - strikeF;
  const boltVisible = dtStrike >= -2 && dtStrike <= 13;
  const boltAlpha = boltVisible
    ? dtStrike < 2
      ? easeOutCubic((dtStrike + 2) / 4)
      : Math.max(0, 1 - (dtStrike - 2) / 11) * (dtStrike % 3 === 0 ? 1 : 0.72)
    : 0;
  const flashAlpha = dtStrike >= -1 && dtStrike <= 10 ? Math.sin(clamp((dtStrike + 1) / 11, 0, 1) * Math.PI) * 0.88 : 0;
  const shakeX = dtStrike >= 0 && dtStrike <= 14 ? Math.sin(dtStrike * 2.9) * (1 - dtStrike / 14) * 14 : 0;
  const shakeY = dtStrike >= 0 && dtStrike <= 14 ? Math.cos(dtStrike * 3.4) * (1 - dtStrike / 14) * 10 : 0;

  // Tree catches roaring fire right after lightning impact!
  const fireIgniteT = easeOutQuint((f - (strikeF + 2)) / 24);
  const observeT = easeInOutCubic((f - (observeF - 14)) / 36);
  const approachT = easeInOutCubic((f - (approachF - 24)) / 68);
  const fl = fireFlicker(f, 3);

  // Motivated camera trajectory:
  // Beat 1: Tilt slightly down from brooding storm clouds -> Beat 2: Wide tree strike -> Beat 3: Pull back to reveal humans -> Beat 4: Intimate push-in toward Aru's outstretched hand & flame!
  const camZoom = lerp(1.12, 1.0, easeOutCubic(localF / 55)) + approachT * 0.24;
  const camX = lerp(0, -18, observeT) + lerp(0, 38, approachT) + shakeX;
  const camY = lerp(85, 0, easeOutCubic(localF / 60)) - approachT * 52 + shakeY;

  // Sky shifts from dark brooding teal-indigo storm -> warm orange-lit smoke clouds once tree ignites!
  const skyTop = lerpRgb([24, 34, 52], [44, 24, 38], fireIgniteT * 0.75);
  const skyMid = lerpRgb([38, 52, 72], [96, 46, 40], fireIgniteT * 0.78);
  const skyBot = lerpRgb([28, 22, 42], [148, 68, 36], fireIgniteT * 0.82);

  // End-of-scene warm flame zoom match-cut into Scene 3 hearth
  const exitGlow = easeInOut((f - (s3Start - 16)) / 16);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="s2Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="56%" stopColor={skyMid} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <radialGradient id="s2TreeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffeab8" stopOpacity={0.76 * fireIgniteT * fl} />
            <stop offset="35%" stopColor="#f08230" stopOpacity={0.44 * fireIgniteT * fl} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="s2Blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="s2BoltGlow" x="-60%" y="-30%" width="220%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#s2Sky)" />

        {/* 1. Billowing Painterly Multi-Puff Storm Cloud Banks (Parallax 0.20x — zero flat pill ellipses!) */}
        <g transform={`translate(${camX * 0.2}, ${camY * 0.2})`}>
          <path
            d={`M ${-90 + pAll * 38} 290 C -70 220, -10 185, 58 195 C 92 142, 186 136, 238 182 C 282 148, 376 155, 405 206 C 446 184, 512 204, 518 256 C 538 278, 520 308, 476 308 L -70 308 Z`}
            fill="#1c2438"
            opacity={0.92}
          />
          <path
            d={`M ${260 - pAll * 46} 275 C 275 210, 340 162, 412 174 C 454 126, 558 124, 608 176 C 656 152, 745 170, 775 230 L 810 296 L 260 296 Z`}
            fill="#182032"
            opacity={0.94}
          />
          {/* Soft Rounded Firelight / Lightning Bounce on Storm Cloud Bellies */}
          {(fireIgniteT > 0.05 || flashAlpha > 0.05) && (
            <ellipse
              cx={485}
              cy={285}
              rx={260}
              ry={44}
              fill={flashAlpha > 0.15 ? '#c6e6ff' : '#e87c34'}
              opacity={Math.max(flashAlpha * 0.65, fireIgniteT * 0.30 * fl)}
              filter="url(#s2Blur)"
            />
          )}
        </g>

        {/* Diagonal Storm Rain Streaks (fading gently as fire warmth takes over) */}
        <g opacity={clamp(0.45 - approachT * 0.35, 0.08, 0.45)}>
          {Array.from({ length: 42 }).map((_, ri) => {
            const p = (f * 0.045 + hash01(ri * 19.7)) % 1;
            const rx = hash01(ri * 41.3) * 820 - 40 - p * 140;
            const ry = p * 1360 - 80;
            return (
              <line
                key={ri}
                x1={rx}
                y1={ry}
                x2={rx - 14}
                y2={ry + 44}
                stroke={fireIgniteT > 0.4 ? '#f2b87c' : '#96b4d6'}
                strokeWidth={1.1}
                opacity={0.42}
              />
            );
          })}
        </g>

        {/* === MAIN 2D DIORAMA WORLD === */}
        <g transform={`translate(360, 660) scale(${camZoom}) translate(-360, -660) translate(${camX}, ${camY})`}>
          {/* 2. Distant Storm Ridge */}
          <path d="M -120 820 L 90 660 L 290 735 L 495 630 L 820 790 L 820 1280 L -120 1280 Z" fill="#20162c" />

          {/* 3. Wide Firelight Bounce Illuminating Landscape After Strike */}
          {fireIgniteT > 0.02 && (
            <ellipse
              cx={482}
              cy={685}
              rx={430 * fl}
              ry={340 * fl}
              fill="url(#s2TreeGlow)"
              style={{ mixBlendMode: 'screen' }}
            />
          )}

          {/* Background Forest Silhouettes */}
          <PrehistoricTree x={68} y={850} scale={0.86} fill="#1b1126" kind="pine" rimColor="#f49c42" rimSide="right" rimOpacity={fireIgniteT * 0.48} />
          <PrehistoricTree x={198} y={838} scale={0.72} fill="#1e1329" kind="canopy" rimColor="#f49c42" rimSide="right" rimOpacity={fireIgniteT * 0.55} />
          <PrehistoricTree x={648} y={854} scale={0.92} fill="#1b1126" kind="pine" rimColor="#f49c42" rimSide="left" rimOpacity={fireIgniteT * 0.52} />

          {/* 4. HERO GNARLED ANCIENT TREE STRUCK BY LIGHTNING */}
          <PrehistoricTree
            x={495}
            y={868}
            scale={1.16}
            fill="#1e1022"
            kind="gnarled"
            rimColor={boltAlpha > 0.2 ? '#e2f2ff' : '#ffb85c'}
            rimSide="left"
            rimOpacity={Math.max(boltAlpha * 0.95, fireIgniteT * 0.85 * fl)}
          />

          {/* Glowing Crack Split down Trunk after Lightning Strike */}
          {fireIgniteT > 0.01 && (
            <path
              d="M 490 545 L 478 608 L 502 668 L 486 735 L 498 815"
              fill="none"
              stroke="#ffe6a8"
              strokeWidth={4.2}
              strokeLinecap="round"
              opacity={fireIgniteT * 0.9 * fl}
              filter="url(#s2Blur)"
            />
          )}

          {/* Blazing Volumetric Fire Roaring Organically From Trunk Base up Into Crown + Fallen Branch */}
          {fireIgniteT > 0.01 && (
            <>
              <VolumetricFire2D
                f={f}
                cx={492}
                cy={838}
                scale={1.48}
                intensity={fireIgniteT}
                showLogs={false}
                emberCount={26}
                wind={-0.18}
                idPrefix="s2tree"
              />
              <VolumetricFire2D
                f={f + 13}
                cx={496}
                cy={685}
                scale={1.08}
                intensity={fireIgniteT * 0.90}
                showLogs={false}
                showSmoke={false}
                emberCount={14}
                wind={-0.22}
                idPrefix="s2crown"
              />
              {/* Fallen Burning Branch near Ground — Target of Aru's Cautious Hand in Beat 4! */}
              <g transform="translate(385, 868)">
                <path d="M -26 6 L 54 -10 L 60 -2 L -20 14 Z" fill="#28121c" stroke="#f49438" strokeWidth={1.6} />
                <VolumetricFire2D
                  f={f + 7}
                  cx={14}
                  cy={0}
                  scale={0.74}
                  intensity={fireIgniteT}
                  showLogs={false}
                  showSmoke={false}
                  emberCount={16}
                  wind={-0.12}
                  idPrefix="s2branch"
                />
              </g>
            </>
          )}

          {/* Dramatic Forked Lightning Bolt Hitting Tree Crown! */}
          {boltAlpha > 0.01 && (
            <g opacity={boltAlpha}>
              <polyline
                points="440,-20 462,115 432,215 478,325 456,420 492,545"
                fill="none"
                stroke="#8ed4ff"
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#s2BoltGlow)"
              />
              <polyline
                points="440,-20 462,115 432,215 478,325 456,420 492,545"
                fill="none"
                stroke="#f5fbff"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Forked side branches */}
              <polyline points="432,215 375,295 352,350" fill="none" stroke="#d8f0ff" strokeWidth={3.2} strokeLinecap="round" />
              <polyline points="478,325 538,395 568,455" fill="none" stroke="#d8f0ff" strokeWidth={2.8} strokeLinecap="round" />
              {/* Impact spark explosion at trunk */}
              <circle cx={492} cy={545} r={58 * boltAlpha} fill="#fff8e0" filter="url(#s2Blur)" />
            </g>
          )}

          {/* Ground Terrain Slope */}
          <path d="M -120 885 Q 240 842, 480 868 T 840 872 L 840 1320 L -120 1320 Z" fill="#1e1128" />
          {/* Warm firelight reflection pool on ground */}
          {fireIgniteT > 0.05 && (
            <ellipse cx={435} cy={882} rx={240 * fl} ry={34} fill="#e87a30" opacity={0.28 * fireIgniteT} filter="url(#s2Blur)" />
          )}

          {/* 5. BEAT 3 & 4: CONSISTENT PREHISTORIC HUMANS OBSERVING & ARU CAUTIOUSLY REACHING FOR WARMTH! */}
          {observeT > 0.01 && (
            <g opacity={observeT}>
              {/* Elder & Companion staying safely behind rocks observing in awe */}
              <PrehistoricHumanRig
                f={f}
                x={128}
                y={892}
                scale={0.92}
                facing={1}
                variant="elder"
                pose="observe_awe"
                rimIntensity={0.82 * fireIgniteT}
                rimColor="#f8b65c"
                rimFromFront
                shadowStretch={-1.45}
                seed={21}
                idSuffix="s2elder"
              />
              <PrehistoricHumanRig
                f={f}
                x={62}
                y={898}
                scale={0.88}
                facing={1}
                variant="companion"
                pose="observe_awe"
                rimIntensity={0.72 * fireIgniteT}
                rimColor="#f8b65c"
                rimFromFront
                shadowStretch={-1.5}
                seed={24}
                idSuffix="s2comp"
              />

              {/* Foreground Shelter Boulders partially framing the observers */}
              <path
                d="M -20 932 Q 40 855, 118 872 Q 168 885, 195 935 Z"
                fill="#170c21"
                stroke="#f09b42"
                strokeOpacity={0.35 * fireIgniteT * fl}
                strokeWidth={2}
              />

              {/* HERO ARU: Steps cautiously forward from behind rock -> kneels -> extends hand toward flame! */}
              <PrehistoricHumanRig
                f={f}
                x={lerp(205, 302, approachT)}
                y={890}
                scale={0.98}
                facing={1}
                variant="aru"
                pose="observe_awe"
                blendToPose="reach_flame"
                blendT={easeOutCubic(clamp((approachT - 0.12) / 0.88, 0, 1))}
                rimIntensity={lerp(0.68, 1.0, approachT) * fireIgniteT}
                rimColor="#ffc064"
                rimFromFront
                shadowStretch={-1.65}
                seed={27}
                idSuffix="s2aru"
              />
            </g>
          )}
        </g>

        {/* Electric Lightning Sky Flash */}
        {flashAlpha > 0.01 && (
          <rect width={720} height={1280} fill="#e2f2ff" opacity={flashAlpha * 0.72} />
        )}

        {/* Warm Incandescent Flame Zoom Match-Cut Wipe into Scene 3 */}
        {exitGlow > 0.01 && (
          <rect width={720} height={1280} fill="#f8a43e" opacity={exitGlow * 0.85} style={{ mixBlendMode: 'screen' }} />
        )}
      </svg>

      <ForegroundFoliageFrame parallaxX={camX * 0.4} parallaxY={camY * 0.2} tint="#14091c" opacity={0.7} />
    </AbsoluteFill>
  );
};
