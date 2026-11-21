import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  fireFlicker,
  lerp,
  VolumetricFire2D,
} from './fx';
import { PrehistoricHumanRig } from './PrehistoricHumanRig';
import {
  ForegroundFoliageFrame,
  PredatorBeastSilhouette,
  PrehistoricTree,
  StarryNightSky,
} from './PrehistoricLandscape';

/**
 * SCENE 4 — MALAM MENJADI LEBIH AMAN
 * 1. Campfire burning proudly in front of the prehistoric cave mouth.
 * 2. Expanding warm golden light dome illuminates humans, cave cliffs & trees (casting huge dancing cave shadows!).
 * 3. Prowling wild predators recoil from firelight & retreat rapidly into the dark forest.
 * 4. Tribe sits peacefully warming their hands; night is no longer purely a threat.
 */
export const Scene4SafeNight: React.FC<{ f: number }> = ({ f }) => {
  const s4Start = SCENES.s4Start;
  const s5Start = SCENES.s5Start;
  const localF = Math.max(0, f - s4Start);
  const pAll = clamp(localF / Math.max(1, s5Start - s4Start), 0, 1);
  const fl = fireFlicker(f, 17);

  // Beat cues locked to ElevenLabs timestamps
  const glowExpandT = easeOutCubic((f - (CUES.s4_glow - 16)) / 52);
  const retreatT = easeInOutCubic((f - (CUES.s4_retreat - 6)) / 66);
  const warmT = easeInOutCubic((f - (CUES.s4_warm - 16)) / 36);

  // Camera pulls slightly back from hearth to reveal the illuminated sanctuary + retreating beasts, then drifts warmly inward!
  const camZoom = lerp(1.16, 0.96, easeOutCubic(localF / 56)) + warmT * 0.14;
  const camX = Math.sin(pAll * Math.PI * 1.4) * 14;
  const camY = lerp(24, 0, easeOutCubic(localF / 50)) - warmT * 18;

  const domeRx = lerp(195, 430, glowExpandT) * fl;
  const domeRy = lerp(165, 345, glowExpandT) * fl;

  // Predators peer from forest edge -> recoil & flee rapidly outward once retreatT > 0.25!
  const leftBeastX = retreatT < 0.25 ? lerp(68, 92, retreatT / 0.25) : lerp(92, -135, (retreatT - 0.25) / 0.75);
  const rightBeastX = retreatT < 0.25 ? lerp(658, 628, retreatT / 0.25) : lerp(628, 865, (retreatT - 0.25) / 0.75);
  const beastFacingL: 1 | -1 = retreatT < 0.25 ? 1 : -1;
  const beastFacingR: 1 | -1 = retreatT < 0.25 ? -1 : 1;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="s4Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#140a20" />
            <stop offset="56%" stopColor="#261638" />
            <stop offset="100%" stopColor="#3c2240" />
          </linearGradient>
          <radialGradient id="s4LightDome" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#ffebb8" stopOpacity={0.62 * fl} />
            <stop offset="35%" stopColor="#f08c32" stopOpacity={0.34 * fl} />
            <stop offset="72%" stopColor="#b04422" stopOpacity={0.14 * fl} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="s4Blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#s4Sky)" />
        <StarryNightSky f={f} opacity={0.88} count={76} />

        {/* Crescent Moon High Left */}
        <g transform="translate(132, 265)" opacity={0.78}>
          <circle cx={0} cy={0} r={62} fill="#8caad4" opacity={0.14} filter="url(#s4Blur)" />
          <path d="M 6 -24 A 24 24 0 1 0 24 10 A 19 19 0 1 1 6 -24 Z" fill="#e6f0ff" />
        </g>

        {/* === MAIN 2D SANCTUARY DIORAMA === */}
        <g transform={`translate(360, 740) scale(${camZoom}) translate(-360, -740) translate(${camX}, ${camY})`}>
          {/* Distant Forest Mountains */}
          <path d="M -140 785 L 40 640 L 195 705 L 360 610 L 550 695 L 710 620 L 860 765 L 860 1280 L -140 1280 Z" fill="#1c1028" />

          {/* Towering Rocky Cliff & Prehistoric Cave Entrance Behind Campfire */}
          <path
            d="M 120 865 C 128 655, 165 465, 238 392 C 308 332, 415 335, 488 398 C 555 468, 590 658, 602 865 Z"
            fill="#22132b"
            stroke="#f09840"
            strokeOpacity={0.28 * (0.5 + glowExpandT * 0.5) * fl}
            strokeWidth={3}
          />
          {/* Deep Warmly-Lit Cave Opening Archway */}
          <path
            d="M 208 860 C 212 695, 245 552, 298 492 C 338 455, 384 455, 424 492 C 478 552, 508 695, 514 860 Z"
            fill="#14091b"
          />

          {/* Signature Detail: Soft Giant Trembling Human Shadows Cast onto Cave Back Wall! */}
          <g opacity={0.28 * (0.4 + glowExpandT * 0.6)} filter="url(#s4Blur)">
            <ellipse cx={275 - (fl - 1) * 28} cy={715} rx={42} ry={86} fill="#0f0714" />
            <ellipse cx={448 + (fl - 1) * 28} cy={720} rx={40} ry={82} fill="#0f0714" />
          </g>

          {/* Expanding Golden Sanctuary Light Dome (Beats 1 -> 2!) */}
          <ellipse cx={360} cy={770} rx={domeRx} ry={domeRy} fill="url(#s4LightDome)" style={{ mixBlendMode: 'screen' }} />

          {/* Dark Flanking Forest Trees Catching Warm Expanding Rim Light */}
          <PrehistoricTree x={42} y={860} scale={1.08} fill="#170c22" kind="pine" rimColor="#f8a84c" rimSide="right" rimOpacity={0.55 * glowExpandT * fl} />
          <PrehistoricTree x={135} y={850} scale={0.78} fill="#1b0f26" kind="canopy" rimColor="#f8a84c" rimSide="right" rimOpacity={0.65 * glowExpandT * fl} />
          <PrehistoricTree x={588} y={850} scale={0.80} fill="#1b0f26" kind="canopy" rimColor="#f8a84c" rimSide="left" rimOpacity={0.65 * glowExpandT * fl} />
          <PrehistoricTree x={684} y={862} scale={1.10} fill="#170c22" kind="pine" rimColor="#f8a84c" rimSide="left" rimOpacity={0.55 * glowExpandT * fl} />

          {/* Sanctuary Ground Terrace */}
          <path d="M -140 868 Q 360 834, 860 870 L 860 1320 L -140 1320 Z" fill="#1e1127" />
          <ellipse cx={360} cy={878} rx={lerp(130, 280, glowExpandT) * fl} ry={40} fill="#ec8232" opacity={0.32} filter="url(#s4Blur)" />

          {/* Beat 3: Wild Predators Startled by Expanding Firelight & Retreating Into Dark Woods! */}
          <g opacity={clamp(1 - (retreatT - 0.55) / 0.45, 0, 1)}>
            <PredatorBeastSilhouette
              f={f}
              x={leftBeastX}
              y={872}
              scale={0.92}
              facing={beastFacingL}
              eyeGlow={retreatT < 0.28 ? 0.95 : 0.25}
              rimColor="#f8a84c"
              rimOpacity={0.52 * (1 - retreatT * 0.5)}
              strideSpeed={retreatT > 0.25 ? 0.34 : 0.08}
              seed={41}
            />
            <PredatorBeastSilhouette
              f={f}
              x={rightBeastX}
              y={875}
              scale={0.86}
              facing={beastFacingR}
              eyeGlow={retreatT < 0.28 ? 0.92 : 0.25}
              rimColor="#f8a84c"
              rimOpacity={0.48 * (1 - retreatT * 0.5)}
              strideSpeed={retreatT > 0.25 ? 0.36 : 0.09}
              seed={44}
            />
          </g>

          {/* Beat 4: Safe Prehistoric Family Sitting Warmly Extending Hands to Campfire! */}
          <PrehistoricHumanRig
            f={f}
            x={248}
            y={878}
            scale={0.92}
            facing={1}
            variant="aru"
            pose="sit_warm"
            rimIntensity={0.88 + glowExpandT * 0.12}
            rimColor="#ffc268"
            rimFromFront
            shadowStretch={-1.5}
            seed={47}
            idSuffix="s4aru"
          />
          <PrehistoricHumanRig
            f={f}
            x={474}
            y={878}
            scale={0.90}
            facing={-1}
            variant="companion"
            pose="sit_warm"
            rimIntensity={0.88 + glowExpandT * 0.12}
            rimColor="#ffc268"
            rimFromFront
            shadowStretch={1.5}
            seed={49}
            idSuffix="s4comp"
          />
          <PrehistoricHumanRig
            f={f}
            x={424}
            y={886}
            scale={0.86}
            facing={-1}
            variant="child"
            pose="sit_warm"
            rimIntensity={0.95}
            rimColor="#ffd07c"
            rimFromFront
            shadowStretch={1.1}
            seed={52}
            idSuffix="s4child"
          />

          {/* Central Hero Campfire Guarding Cave Entrance */}
          <VolumetricFire2D
            f={f}
            cx={360}
            cy={862}
            scale={lerp(1.02, 1.24, glowExpandT)}
            intensity={1.0}
            showLogs
            showSmoke
            emberCount={28}
            wind={0.04}
            idPrefix="s4guard"
          />
        </g>
      </svg>

      <ForegroundFoliageFrame parallaxX={camX * 0.4} parallaxY={0} tint="#13091a" opacity={0.62} />
    </AbsoluteFill>
  );
};
