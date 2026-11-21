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
  lerpRgb,
  VolumetricFire2D,
} from './fx';
import { PrehistoricHumanRig } from './PrehistoricHumanRig';

/**
 * SCENE 6 — MENUJU PERADABAN
 * 4 Seamless Craft & Era Beats (100% Pure-Code 2D Cinematic Vector):
 * 1. Clay shaped smoothly on spinning pottery wheel into a graceful vessel.
 * 2. Domed terracotta pottery kiln glowing red-orange inside as vessels fire.
 * 3. Glowing white-gold molten bronze poured from crucible into a stone tool mold with sparks & steam!
 * 4. Seamless transition from forged ancient bronze tools into early industrial gears, foundry chimneys & steam!
 */
export const Scene6Civilization: React.FC<{ f: number }> = ({ f }) => {
  const s6Start = SCENES.s6Start;
  const s7Start = SCENES.s7Start;
  const localF = Math.max(0, f - s6Start);
  const fl = fireFlicker(f, 29);

  // Sub-beat blend windows synced tightly to ElevenLabs cues
  const kilnT = easeInOutCubic((f - (CUES.s6_kiln - 18)) / 24);
  const metalT = easeInOutCubic((f - (CUES.s6_metal - 10)) / 26);
  const indT = easeInOutCubic((f - (CUES.s6_industry - 24)) / 36);

  // Beat opacities (clean motivated light-wipes, zero abrupt cuts!)
  const clayAlpha = clamp(1 - kilnT, 0, 1);
  const kilnAlpha = clamp(kilnT * (1 - metalT), 0, 1);
  const metalAlpha = clamp(metalT * (1 - indT), 0, 1);
  const indAlpha = indT;

  // Clay vessel morph progression during Beat 1
  const clayMorph = easeOutCubic(localF / Math.max(1, CUES.s6_kiln - s6Start - 10));
  // Molten bronze pour progression during Beat 3
  const pourProg = easeInOut((f - (CUES.s6_metal + 8)) / Math.max(1, CUES.s6_industry - CUES.s6_metal - 38));

  // Sky shifts from warm terracotta workshop -> molten forge amber -> twilight industrial indigo-copper
  const skyTop = lerpRgb([36, 18, 42], [28, 18, 40], indT);
  const skyMid = lerpRgb([86, 38, 42], [72, 38, 56], indT);
  const skyBot = lerpRgb([148, 66, 38], [134, 68, 46], indT);

  const driftX = Math.sin(f * 0.025) * 6;
  const gearRot = f * 0.65;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#1a0e22' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="s6Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="56%" stopColor={skyMid} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <radialGradient id="s6KilnGlow" cx="50%" cy="62%" r="52%">
            <stop offset="0%" stopColor="#fff4cf" stopOpacity={0.9 * fl} />
            <stop offset="32%" stopColor="#f48a2c" stopOpacity={0.55 * fl} />
            <stop offset="72%" stopColor="#b8381c" stopOpacity={0.22 * fl} />
            <stop offset="100%" stopColor="#1a0e22" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="s6Molten" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff9e2" />
            <stop offset="45%" stopColor="#ffd066" />
            <stop offset="100%" stopColor="#f07824" />
          </linearGradient>
          <filter id="s6Glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="s6Soft" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#s6Sky)" />

        {/* === BEAT 1: SHAPING CLAY ON SPINNING POTTERY WHEEL === */}
        {clayAlpha > 0.01 && (
          <g opacity={clayAlpha} transform={`translate(${driftX}, 0)`}>
            {/* Warm workshop ambient glow */}
            <ellipse cx={380} cy={690} rx={360} ry={290} fill="url(#s6KilnGlow)" opacity={0.48} style={{ mixBlendMode: 'screen' }} />
            {/* Workshop floor & wooden potter bench */}
            <path d="M -40 870 Q 360 848, 760 872 L 760 1280 L -40 1280 Z" fill="#211226" />
            {/* Potter Artisan Positioned Cleanly So Sculpted Hands Shape the Spinning Clay Vessel! */}
            <PrehistoricHumanRig
              f={f}
              x={252}
              y={885}
              scale={1.10}
              facing={1}
              variant="aru"
              pose="shape_clay"
              rimIntensity={0.85}
              rimColor="#f8b65c"
              rimFromFront
              shadowStretch={-1.2}
              seed={61}
              idSuffix="s6potter"
            />
            {/* Spinning Wooden Pottery Wheel Pedestal */}
            <g transform="translate(404, 782) scale(0.86)">
              <rect x={-22} y={14} width={44} height={106} rx={6} fill="#2c1724" />
              <ellipse cx={0} cy={14} rx={105} ry={22} fill="#3a202c" stroke="#d88642" strokeOpacity={0.55} strokeWidth={2} />
              {/* Spinning rotation dash marks */}
              <ellipse
                cx={0}
                cy={14}
                rx={82}
                ry={14}
                fill="none"
                stroke="#f2b268"
                strokeWidth={2.2}
                strokeDasharray="18 28"
                strokeDashoffset={-f * 5}
                opacity={0.55}
              />
              {/* Morphing Sculpted Terracotta Clay Vessel (Lump -> Graceful Amphora!) */}
              <path
                d={`M -44 10
                    C ${lerp(-58, -76, clayMorph)} ${lerp(-24, -64, clayMorph)},
                      ${lerp(-42, -58, clayMorph)} ${lerp(-64, -124, clayMorph)},
                      ${lerp(-26, -30, clayMorph)} ${lerp(-78, -148, clayMorph)}
                    L ${lerp(-28, -42, clayMorph)} ${lerp(-84, -172, clayMorph)}
                    Q 0 ${lerp(-76, -162, clayMorph)}, ${lerp(28, 42, clayMorph)} ${lerp(-84, -172, clayMorph)}
                    L ${lerp(26, 30, clayMorph)} ${lerp(-78, -148, clayMorph)}
                    C ${lerp(42, 58, clayMorph)} ${lerp(-64, -124, clayMorph)},
                      ${lerp(58, 76, clayMorph)} ${lerp(-24, -64, clayMorph)},
                      44 10
                    Q 0 22, -44 10 Z`}
                fill="#a65232"
                stroke="#f6be78"
                strokeWidth={2.4}
              />
              {/* Warm specular clay curve highlight */}
              <path
                d={`M ${lerp(24, 48, clayMorph)} ${lerp(-20, -48, clayMorph)} Q ${lerp(34, 58, clayMorph)} ${lerp(-52, -96, clayMorph)}, ${lerp(18, 28, clayMorph)} ${lerp(-72, -138, clayMorph)}`}
                fill="none"
                stroke="#ffe0a6"
                strokeWidth={3.5}
                strokeLinecap="round"
                opacity={0.62}
              />
            </g>
            {/* Background Hearth Fire lighting workshop */}
            <VolumetricFire2D f={f} cx={595} cy={856} scale={0.76} intensity={0.9} showLogs showSmoke={false} emberCount={14} idPrefix="s6wfire" />
          </g>
        )}

        {/* === BEAT 2: FIRING CERAMICS INSIDE GLOWING DOMED KILN === */}
        {kilnAlpha > 0.01 && (
          <g opacity={kilnAlpha} transform={`translate(${driftX * 0.8}, 0)`}>
            <ellipse cx={360} cy={675} rx={420 * fl} ry={340 * fl} fill="url(#s6KilnGlow)" style={{ mixBlendMode: 'screen' }} />
            <path d="M -40 875 Q 360 855, 760 878 L 760 1280 L -40 1280 Z" fill="#1e1024" />
            {/* Massive Domed Clay Pottery Kiln Silhouette */}
            <g transform="translate(360, 868)">
              {/* Chimney Top Vent with Glowing Heat Plume */}
              <rect x={-48} y={-445} width={96} height={95} rx={8} fill="#2b1628" stroke="#e87c34" strokeOpacity={0.45} strokeWidth={2} />
              <ellipse cx={0} cy={-452} rx={64 * fl} ry={26} fill="#f8a03c" opacity={0.55} filter="url(#s6Glow)" />
              {/* Domed Clay Kiln Shell */}
              <path
                d="M -230 0 C -222 -215, -152 -368, -48 -378 L 48 -378 C 152 -368, 222 -215, 230 0 Z"
                fill="#2d1729"
                stroke="#f0923e"
                strokeOpacity={0.48 * fl}
                strokeWidth={3}
              />
              {/* Brick texture subtle arcs */}
              {[-280, -210, -140].map((ky, ki) => (
                <path key={ki} d={`M ${-155 + ki * 12} ${ky} Q 0 ${ky - 18}, ${155 - ki * 12} ${ky}`} fill="none" stroke="#422236" strokeWidth={3} opacity={0.65} />
              ))}
              {/* Blazing Arched Kiln Chamber Mouth */}
              <path d="M -112 0 L -112 -145 C -112 -225, 112 -225, 112 -145 L 112 0 Z" fill="#f47824" />
              <path d="M -98 0 L -98 -138 C -98 -206, 98 -206, 98 -138 L 98 0 Z" fill="#ffcf6e" opacity={0.9 * fl} />
              {/* Silhouettes of Glowing Red-Hot Pottery Vessels Firing Inside Kiln! */}
              {[-52, 0, 52].map((px, pi) => (
                <path
                  key={pi}
                  d={`M ${px - 16} -22 C ${px - 26} -48, ${px - 22} -78, ${px - 10} -94 L ${px - 15} -106 L ${px + 15} -106 L ${px + 10} -94 C ${px + 22} -78, ${px + 26} -48, ${px + 16} -22 Z`}
                  fill="#6e1e16"
                  stroke="#fff2c8"
                  strokeWidth={2}
                />
              ))}
              {/* Roasting Fire Base Inside Kiln */}
              <VolumetricFire2D f={f} cx={0} cy={-4} scale={0.92} intensity={1.0} showLogs={false} showSmoke={false} emberCount={22} idPrefix="s6kilnf" />
            </g>
          </g>
        )}

        {/* === BEAT 3: POURING BLAZING MOLTEN METAL INTO STONE MOLD === */}
        {metalAlpha > 0.01 && (
          <g opacity={metalAlpha}>
            <ellipse cx={395} cy={705} rx={440 * fl} ry={350 * fl} fill="url(#s6KilnGlow)" style={{ mixBlendMode: 'screen' }} />
            <path d="M -40 878 Q 360 854, 760 882 L 760 1280 L -40 1280 Z" fill="#1b0e22" />

            {/* Master Metalsmith Standing Braced Gripping Long Forge Tongs & Pouring Molten Bronze */}
            <PrehistoricHumanRig
              f={f}
              x={208}
              y={886}
              scale={1.12}
              facing={1}
              variant="aru"
              pose="pour_metal"
              rimIntensity={1.0}
              rimColor="#ffe49e"
              rimFromFront
              shadowStretch={-1.5}
              seed={65}
              idSuffix="s6smith"
            />

            {/* Long Forged Iron Tongs Physically Seated Right Inside Smith's Hand (x~298,y~754) to Glowing Crucible! */}
            <g>
              <line
                x1={296}
                y1={752}
                x2={368}
                y2={686}
                stroke="#321d2a"
                strokeWidth={7.5}
                strokeLinecap="round"
              />
              <line
                x1={296}
                y1={752}
                x2={368}
                y2={686}
                stroke="#f8b25a"
                strokeOpacity={0.5}
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Tilted Ceramic Crucible Held Cleanly by Tongs */}
              <g transform={`translate(376, 676) rotate(${lerp(18, 48, pourProg)})`}>
                <path d="M -36 -26 L 38 -26 L 30 32 C 22 46, -22 46, -30 32 Z" fill="#2a1626" stroke="#f8ae4c" strokeWidth={2.8} />
                <ellipse cx={2} cy={-24} rx={34} ry={9} fill="#fff4cf" />
              </g>
            </g>

            {/* Blazing White-Gold Molten Bronze Stream Flowing Straight from Crucible Rim into Mold! */}
            <g opacity={clamp(pourProg * 2.2, 0.2, 1)}>
              <path
                d={`M 412 668 Q ${426 + Math.sin(f * 0.4) * 3} 745, 424 824`}
                fill="none"
                stroke="#ffac3e"
                strokeWidth={24 * fl}
                strokeLinecap="round"
                opacity={0.55}
                filter="url(#s6Glow)"
              />
              <path
                d={`M 412 668 Q ${426 + Math.sin(f * 0.4) * 2.5} 745, 424 824`}
                fill="none"
                stroke="url(#s6Molten)"
                strokeWidth={10.5}
                strokeLinecap="round"
              />
            </g>

            {/* Carved Stone Blade Mold on Workbench Filling with Molten Glow! */}
            <g transform="translate(432, 822)">
              <polygon points="-115,62 -95,0 135,0 155,62" fill="#29172b" stroke="#f09a42" strokeOpacity={0.55} strokeWidth={2} />
              {/* Glowing Spearhead / Bronze Axe Cavity Filling Up */}
              <path
                d="M -68 12 L 45 12 L 96 26 L 45 40 L -68 40 Z"
                fill="#f8a434"
                opacity={0.35 + pourProg * 0.65}
                filter="url(#s6Soft)"
              />
              <path
                d="M -62 16 L 42 16 L 86 26 L 42 36 L -62 36 Z"
                fill="#fff6d4"
                opacity={0.45 + pourProg * 0.55}
              />
              {/* Explosive White-Gold Molten Sparks Bursting from Impact! */}
              {Array.from({ length: 18 }).map((_, si) => {
                const p = (f * 0.045 + hash01(si * 17.3)) % 1;
                const vx = (hash01(si * 31.1) - 0.5) * 240;
                const vy = -120 - hash01(si * 47.9) * 140;
                const sx = -8 + vx * p;
                const sy = 10 + vy * p + 220 * p * p; // parabolic gravity arc!
                return (
                  <circle
                    key={si}
                    cx={sx}
                    cy={sy}
                    r={2.8 * (1 - p * 0.5)}
                    fill={si % 2 === 0 ? '#fff6d4' : '#ffa63c'}
                    opacity={(1 - p) * 0.95}
                  />
                );
              })}
            </g>
          </g>
        )}

        {/* === BEAT 4: TRANSITION FROM FORGED TOOLS INTO INDUSTRIAL CIVILIZATION === */}
        {indAlpha > 0.01 && (
          <g opacity={indAlpha}>
            <ellipse cx={360} cy={760} rx={450} ry={340} fill="url(#s6KilnGlow)" opacity={0.52} style={{ mixBlendMode: 'screen' }} />

            {/* Rising Warm Industrial Steam Clouds Behind Skyline */}
            {[0, 1, 2, 3].map((ci) => {
              const cp = ((f * 0.008 + ci * 0.25) % 1);
              return (
                <ellipse
                  key={ci}
                  cx={140 + ci * 155 + cp * 60}
                  cy={520 - cp * 240}
                  rx={55 + cp * 65}
                  ry={34 + cp * 36}
                  fill="#8c5864"
                  opacity={Math.sin(cp * Math.PI) * 0.35}
                  filter="url(#s6Glow)"
                />
              );
            })}

            {/* Interlocking Wrought-Iron Industrial Gears Rotating Smoothly (Motif of Progress!) */}
            {[
              { x: 145, y: 540, r: 78, dir: 1, teeth: 12 },
              { x: 268, y: 615, r: 54, dir: -1.4, teeth: 10 },
              { x: 565, y: 530, r: 86, dir: -0.9, teeth: 14 },
            ].map((g, gi) => (
              <g key={gi} transform={`translate(${g.x}, ${g.y}) rotate(${gearRot * g.dir})`} opacity={0.72}>
                <circle cx={0} cy={0} r={g.r * 0.78} fill="none" stroke="#48283e" strokeWidth={16} />
                <circle cx={0} cy={0} r={g.r * 0.28} fill="#361c30" stroke="#f09e48" strokeOpacity={0.5} strokeWidth={2.5} />
                {Array.from({ length: g.teeth }).map((_, ti) => {
                  const a = (ti / g.teeth) * 360;
                  return (
                    <rect
                      key={ti}
                      x={-7}
                      y={-g.r}
                      width={14}
                      height={22}
                      rx={3}
                      fill="#48283e"
                      transform={`rotate(${a})`}
                    />
                  );
                })}
                {[0, 90, 180, 270].map((sa) => (
                  <line key={sa} x1={0} y1={0} x2={0} y2={-g.r * 0.75} stroke="#48283e" strokeWidth={8} transform={`rotate(${sa})`} />
                ))}
              </g>
            ))}

            {/* Industrial Foundries, Arched Factory Roofs, Chimneys & Glowing Furnace Windows */}
            <g transform="translate(0, 0)">
              {/* Tall Smokestack Chimneys */}
              <polygon points="108,790 122,495 152,495 166,790" fill="#241328" />
              <polygon points="215,790 227,540 250,540 262,790" fill="#201124" />
              <polygon points="518,790 532,485 566,485 580,790" fill="#241328" />
              {/* Sawtooth Factory Buildings */}
              <path
                d="M -20 885 L -20 690 L 95 650 L 95 690 L 210 650 L 210 690 L 325 650 L 325 710 L 445 660 L 570 660 L 570 695 L 740 650 L 740 1280 L -20 1280 Z"
                fill="#1d0f24"
                stroke="#f09840"
                strokeOpacity={0.42}
                strokeWidth={2}
              />
              {/* Warm Glowing Foundry Arched Windows */}
              {[60, 130, 200, 270, 380, 440, 500, 610, 668].map((wx, wi) => (
                <path
                  key={wi}
                  d={`M ${wx - 14} 815 L ${wx - 14} 755 C ${wx - 14} 735, ${wx + 14} 735, ${wx + 14} 755 L ${wx + 14} 815 Z`}
                  fill="#ffbe5c"
                  opacity={(0.65 + 0.25 * Math.sin(f * 0.14 + wi * 1.3)) * fl}
                />
              ))}
              {/* Iconic Forged Bronze Tools & Anvil Foreground Silhouette Bridging Ancient -> Modern */}
              <path d="M 275 885 L 298 835 L 430 835 L 458 815 L 468 830 L 436 862 L 450 885 Z" fill="#14091a" stroke="#f8b25a" strokeOpacity={0.5} strokeWidth={2} />
            </g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
