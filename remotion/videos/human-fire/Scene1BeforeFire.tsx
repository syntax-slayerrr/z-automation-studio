import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  hash01,
  lerp,
  lerpRgb,
} from './fx';
import { PrehistoricHumanRig } from './PrehistoricHumanRig';
import {
  CaveArchLayer,
  ForegroundFoliageFrame,
  PredatorBeastSilhouette,
  PrehistoricTree,
  StarryNightSky,
} from './PrehistoricLandscape';

export const Scene1BeforeFire: React.FC<{ f: number }> = ({ f }) => {
  const s1End = SCENES.s2Start;
  const pAll = clamp(f / Math.max(1, s1End), 0, 1);

  // Beat timings directly locked to ElevenLabs [[cue]] anchors!
  const sunsetT = easeInOutCubic((f - (CUES.s1_sunset - 42)) / 88); // 0 = sunlit afternoon, 1 = cold indigo night
  const predatorT = easeOutCubic((f - (CUES.s1_predator - 24)) / 62);
  const caveT = easeInOutCubic((f - (CUES.s1_cave - 30)) / 52);

  // Continuous cinematic camera motion (never static: slow drift -> subtle dusk pull -> push-in into cold cave)
  const camX = lerp(-26, 22, easeInOut(pAll)) + Math.sin(f * 0.025) * 4;
  const camY = lerp(10, -8, caveT);
  const camZoom = lerp(1.02, 1.12, easeInOut(pAll)) + caveT * 0.06;

  // Sky color transition: warm prehistoric afternoon -> sunset terracotta -> cold twilight plum-indigo
  const skyTop =
    sunsetT < 0.5
      ? lerpRgb([74, 108, 134], [76, 48, 86], sunsetT * 2)
      : lerpRgb([76, 48, 86], [22, 12, 34], (sunsetT - 0.5) * 2);
  const skyMid =
    sunsetT < 0.5
      ? lerpRgb([178, 136, 108], [166, 86, 78], sunsetT * 2)
      : lerpRgb([166, 86, 78], [46, 28, 62], (sunsetT - 0.5) * 2);
  const skyBot =
    sunsetT < 0.5
      ? lerpRgb([238, 190, 132], [228, 128, 72], sunsetT * 2)
      : lerpRgb([228, 128, 72], [36, 22, 48], (sunsetT - 0.5) * 2);

  const farHillCol = lerpRgb([96, 98, 112], [38, 26, 54], sunsetT);
  const midHillCol = lerpRgb([64, 72, 82], [29, 18, 42], sunsetT);
  const nearGroundCol = lerpRgb([42, 46, 52], [22, 13, 32], sunsetT);
  const treeCol = lerpRgb([36, 44, 48], [20, 11, 29], sunsetT);
  const activeRimCol = sunsetT < 0.55 ? '#f8c882' : '#9ab4d4';
  const rimStrength = sunsetT < 0.55 ? lerp(0.85, 0.35, sunsetT / 0.55) : lerp(0.25, 0.65, (sunsetT - 0.55) / 0.45);

  const sunY = lerp(395, 760, sunsetT);
  const sunAlpha = clamp(1 - (sunsetT - 0.52) / 0.3, 0, 1);
  const moonAlpha = easeOutCubic((sunsetT - 0.58) / 0.35);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      {/* 1. Sky & Celestial Bodies (Parallax 0.12x) */}
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="s1SkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="52%" stopColor={skyMid} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <radialGradient id="s1SunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#f8b660" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e87a38" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="s1MoonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dceaff" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#8caad4" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="s1SoftBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="s1FarBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#s1SkyGrad)" />

        {/* Night Stars fading in as sunset ends */}
        <StarryNightSky f={f} opacity={moonAlpha * 0.85} count={72} />

        {/* Setting Sun Disk & Golden Shafts */}
        {sunAlpha > 0.01 && (
          <g transform={`translate(${camX * 0.12}, ${camY * 0.12})`} opacity={sunAlpha}>
            <circle cx={380} cy={sunY} r={195} fill="url(#s1SunGlow)" />
            <circle cx={380} cy={sunY} r={46} fill="#fff2d2" />
            {/* Breathing volumetric afternoon sun shafts */}
            {[0, 1, 2, 3].map((ri) => {
              const ang = -28 + ri * 18 + Math.sin(f * 0.02 + ri) * 2;
              return (
                <polygon
                  key={ri}
                  points={`${380 - 18},${sunY} ${380 + 18},${sunY} ${380 + ang * 11 + 85},1120 ${380 + ang * 11 - 45},1120`}
                  fill="#ffe8b6"
                  opacity={0.075 * (1 - sunsetT * 0.6)}
                />
              );
            })}
          </g>
        )}

        {/* Cold Crescent Moon rising cleanly in upper right */}
        {moonAlpha > 0.01 && (
          <g transform={`translate(${545 + camX * 0.12}, ${290 - moonAlpha * 28})`} opacity={moonAlpha}>
            <circle cx={0} cy={0} r={115} fill="url(#s1MoonGlow)" />
            <path d="M 8 -34 A 34 34 0 1 0 32 14 A 27 27 0 1 1 8 -34 Z" fill="#e6f0ff" />
          </g>
        )}

        {/* Distant soaring prehistoric birds during daytime */}
        {sunAlpha > 0.1 && (
          <g opacity={sunAlpha * 0.65}>
            {[0, 1, 2, 3, 4].map((bi) => {
              const bx = 120 + bi * 95 + f * (0.45 + bi * 0.08);
              const by = 290 + bi * 26 + Math.sin(f * 0.08 + bi * 1.9) * 8;
              const wing = Math.sin(f * 0.25 + bi * 2.1) * 5;
              return (
                <path
                  key={bi}
                  d={`M ${bx - 12} ${by + wing} Q ${bx - 5} ${by - 6}, ${bx} ${by} Q ${bx + 5} ${by - 6}, ${bx + 12} ${by + wing}`}
                  fill="none"
                  stroke="#36283e"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        )}

        {/* === EXTERIOR PREHISTORIC VALLEY & FOREST (fades gracefully into Cave Interior on Beat 4!) === */}
        <g
          transform={`translate(360, 640) scale(${camZoom}) translate(-360, -640)`}
          opacity={1 - caveT * 0.55}
        >
          {/* 2. Far Misty Mountain Range (Parallax 0.28x, slightly blurred for atmospheric perspective) */}
          <g transform={`translate(${camX * 0.28}, ${camY * 0.25})`} filter="url(#s1FarBlur)">
            <path
              d="M -120 770 L 40 605 L 185 675 L 345 555 L 510 660 L 665 575 L 840 725 L 840 1280 L -120 1280 Z"
              fill={farHillCol}
            />
            {/* Valley mist ribbon */}
            <ellipse cx={360} cy={735} rx={480} ry={68} fill={sunsetT > 0.5 ? '#5c6c8a' : '#f4cf9e'} opacity={0.22} filter="url(#s1SoftBlur)" />
          </g>

          {/* 3. Midground Prehistoric Forest Hills & Tall Trees (Parallax 0.55x) */}
          <g transform={`translate(${camX * 0.55}, ${camY * 0.5})`}>
            <path
              d="M -120 820 Q 140 730, 360 778 T 840 765 L 840 1280 L -120 1280 Z"
              fill={midHillCol}
            />
            <PrehistoricTree x={75} y={810} scale={0.95} fill={treeCol} kind="pine" sway={Math.sin(f * 0.03) * 1.4} rimColor={activeRimCol} rimSide="right" rimOpacity={rimStrength * 0.55} />
            <PrehistoricTree x={190} y={796} scale={0.78} fill={treeCol} kind="canopy" sway={Math.sin(f * 0.03 + 1.2) * 1.2} rimColor={activeRimCol} rimSide="right" rimOpacity={rimStrength * 0.45} />
            <PrehistoricTree x={535} y={792} scale={0.86} fill={treeCol} kind="canopy" sway={Math.sin(f * 0.03 + 2.4) * 1.1} rimColor={activeRimCol} rimSide="left" rimOpacity={rimStrength * 0.5} />
            <PrehistoricTree x={665} y={815} scale={1.08} fill={treeCol} kind="pine" sway={Math.sin(f * 0.03 + 0.7) * 1.5} rimColor={activeRimCol} rimSide="left" rimOpacity={rimStrength * 0.55} />

            {/* Beat 3: Prowling Predator Silhouettes emerging clearly between trees at nightfall! */}
            {predatorT > 0.01 && (
              <g opacity={predatorT * (1 - caveT * 0.8)}>
                <PredatorBeastSilhouette
                  f={f}
                  x={lerp(765, 492, predatorT)}
                  y={852}
                  scale={1.12}
                  facing={-1}
                  eyeGlow={1.0}
                  rimColor="#b8d4f4"
                  rimOpacity={0.72}
                  strideSpeed={0.14}
                  seed={2}
                />
                <PredatorBeastSilhouette
                  f={f}
                  x={lerp(-70, 145, clamp((predatorT - 0.18) / 0.82, 0, 1))}
                  y={872}
                  scale={0.94}
                  facing={1}
                  eyeGlow={0.95}
                  rimColor="#b8d4f4"
                  rimOpacity={0.62}
                  strideSpeed={0.13}
                  seed={5}
                />
              </g>
            )}
          </g>

          {/* 4. Hero Foreground Ground & Aru watching the valley (Beats 1-3 before entering cave) */}
          <g transform={`translate(${camX * 0.95}, ${camY * 0.9})`}>
            <path
              d="M -100 905 Q 190 855, 410 885 T 820 890 L 820 1290 L -100 1290 Z"
              fill={nearGroundCol}
            />
            {/* Aru standing alert watching the sunset/nightfall before retreating to cave */}
            {caveT < 0.75 && (
              <g opacity={clamp(1 - caveT * 1.5, 0, 1)}>
                <PrehistoricHumanRig
                  f={f}
                  x={lerp(295, 255, predatorT)}
                  y={892}
                  scale={0.96}
                  facing={1}
                  variant="aru"
                  pose="stand_alert"
                  rimIntensity={rimStrength}
                  rimColor={activeRimCol}
                  rimFromFront
                  shadowStretch={-1.15}
                  prop="spear"
                  seed={1}
                  idSuffix="s1aru"
                />
              </g>
            )}
            {/* Creeping nocturnal cold forest mist */}
            {sunsetT > 0.35 && (
              <g opacity={(sunsetT - 0.35) * 0.42}>
                <ellipse cx={220 + Math.sin(f * 0.015) * 50} cy={925} rx={320} ry={48} fill="#7e94b8" filter="url(#s1SoftBlur)" />
                <ellipse cx={540 - Math.sin(f * 0.012) * 45} cy={950} rx={340} ry={52} fill="#6b80a6" filter="url(#s1SoftBlur)" />
              </g>
            )}
          </g>
        </g>

        {/* === BEAT 4: SHELTERING INSIDE THE COLD DARK CAVE (smooth cinematic push-in!) === */}
        {caveT > 0.01 && (
          <g opacity={caveT}>
            {/* Cold rocky cave floor + moonlight shaft pouring from cave opening */}
            <path d="M -40 858 Q 360 832, 760 865 L 760 1290 L -40 1290 Z" fill="#1b0e26" />
            <polygon points="240,280 480,280 570,900 150,900" fill="#8fb0dc" opacity={0.07} />
            <ellipse cx={360} cy={875} rx={235} ry={54} fill="#88a8d8" opacity={0.26} filter="url(#s1SoftBlur)" />

            {/* Huddled Prehistoric Family shivering in cold moonlight */}
            <PrehistoricHumanRig
              f={f}
              x={276}
              y={882}
              scale={1.08}
              facing={1}
              variant="aru"
              pose="huddle_cave"
              rimIntensity={0.78}
              rimColor="#b2ccf0"
              rimFromFront
              shadowStretch={-0.8}
              shiver={0.85}
              seed={11}
              idSuffix="s1cave_aru"
            />
            <PrehistoricHumanRig
              f={f}
              x={444}
              y={884}
              scale={1.04}
              facing={-1}
              variant="companion"
              pose="huddle_cave"
              rimIntensity={0.74}
              rimColor="#b2ccf0"
              rimFromFront
              shadowStretch={0.85}
              shiver={0.75}
              seed={14}
              idSuffix="s1cave_comp"
            />
            <PrehistoricHumanRig
              f={f}
              x={362}
              y={892}
              scale={1.02}
              facing={1}
              variant="child"
              pose="huddle_cave"
              rimIntensity={0.68}
              rimColor="#b2ccf0"
              rimFromFront={false}
              shadowStretch={-0.5}
              shiver={0.95}
              seed={17}
              idSuffix="s1cave_child"
            />

            {/* Signature Detail: Faint cold misty breath puffs rising in freezing night air! */}
            {[0, 1, 2].map((bi) => {
              const bp = ((f * 0.018 + bi * 0.34) % 1);
              const bx = (bi === 0 ? 314 : bi === 1 ? 404 : 374) + (bi === 1 ? -bp * 22 : bp * 22);
              const by = (bi === 2 ? 802 : 764) - bp * 34;
              const br = 6 + bp * 15;
              const bop = Math.sin(bp * Math.PI) * 0.24;
              return <circle key={bi} cx={bx} cy={by} r={br} fill="#c8daf0" opacity={bop} filter="url(#s1SoftBlur)" />;
            })}

            {/* Framing Cave Arch Silhouette */}
            <CaveArchLayer f={f} fireGlow={0} archScale={lerp(1.18, 1.0, caveT)} />
          </g>
        )}
      </svg>

      {/* 5. Blurred Foreground Framing Foliage (Parallax 1.38x) */}
      <ForegroundFoliageFrame parallaxX={camX} parallaxY={camY} tint="#12081b" opacity={0.72 * (1 - caveT * 0.6)} />
    </AbsoluteFill>
  );
};
