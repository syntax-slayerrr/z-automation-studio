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
import { ForegroundFoliageFrame, PrehistoricTree, StarryNightSky } from './PrehistoricLandscape';

/**
 * SCENE 3 — API MENGUBAH MAKANAN
 * 1. Aru walks into warm hearth clearing carrying hunt prey.
 * 2. Meat placed on wooden spit across glowing campfire.
 * 3. Intimate zoom on roasting meat caramelizing + fragrant curling steam wisps.
 * 4. Aru & companion warmly enjoying their cooked meal beside the hearth.
 */
export const Scene3Cooking: React.FC<{ f: number }> = ({ f }) => {
  const s3Start = SCENES.s3Start;
  const s4Start = SCENES.s4Start;
  const localF = Math.max(0, f - s3Start);
  const fl = fireFlicker(f, 11);

  const huntWalkT = easeOutCubic(localF / Math.max(1, CUES.s3_roast - s3Start - 8));
  const roastT = easeInOutCubic((f - (CUES.s3_roast - 14)) / 32);
  const cookProg = easeInOut((f - (CUES.s3_roast + 12)) / Math.max(1, CUES.s3_enjoy - CUES.s3_roast - 20));
  const closeupT =
    easeInOutCubic((f - (CUES.s3_cooked - 36)) / 30) *
    (1 - easeInOutCubic((f - (CUES.s3_enjoy - 24)) / 28));
  const enjoyT = easeInOutCubic((f - (CUES.s3_enjoy - 20)) / 26);

  // Motivated Camera: Establishing hearth -> push-in for roasting & sizzling close-up -> warm pull-back for meal!
  const camZoom = 1.0 + roastT * 0.14 + closeupT * 0.34 - enjoyT * 0.14;
  const camX = lerp(-18, 0, roastT) + Math.sin(f * 0.024) * 4;
  const camY = -closeupT * 62;

  // Meat color smoothly transforms from raw reddish-pink -> rich golden-seared roasted amber-brown!
  const meatMainCol = lerpRgb([152, 54, 48], [136, 68, 28], cookProg);
  const meatEdgeCol = lerpRgb([108, 36, 36], [78, 36, 16], cookProg);
  const meatSheenCol = lerpRgb([214, 128, 108], [248, 184, 96], cookProg);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="s3Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1b0e28" />
            <stop offset="54%" stopColor="#351d3c" />
            <stop offset="100%" stopColor="#5e2f30" />
          </linearGradient>
          <radialGradient id="s3HearthBounce" cx="50%" cy="62%" r="55%">
            <stop offset="0%" stopColor="#ffdfa0" stopOpacity={0.52 * fl} />
            <stop offset="40%" stopColor="#e87a2e" stopOpacity={0.28 * fl} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="s3SoftBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#s3Sky)" />
        <StarryNightSky f={f} opacity={0.68} count={52} />

        {/* === MAIN 2D DIORAMA === */}
        <g transform={`translate(360, 760) scale(${camZoom}) translate(-360, -760) translate(${camX}, ${camY})`}>
          {/* Far Dusk Ridges */}
          <path d="M -120 790 L 65 655 L 250 720 L 455 620 L 650 700 L 840 650 L 840 1280 L -120 1280 Z" fill="#231430" />

          {/* Warm Firelight Bounce across Clearing */}
          <ellipse cx={360} cy={785} rx={390 * fl} ry={290 * fl} fill="url(#s3HearthBounce)" style={{ mixBlendMode: 'screen' }} />

          {/* Surrounding Forest Silhouettes Catching Golden Hearth Rim */}
          <PrehistoricTree x={68} y={845} scale={0.94} fill="#1b0f26" kind="canopy" rimColor="#f8b256" rimSide="right" rimOpacity={0.62 * fl} />
          <PrehistoricTree x={655} y={850} scale={0.98} fill="#1b0f26" kind="pine" rimColor="#f8b256" rimSide="left" rimOpacity={0.62 * fl} />

          {/* Hearth Clearing Floor */}
          <path d="M -120 865 Q 360 832, 840 868 L 840 1320 L -120 1320 Z" fill="#211229" />
          <ellipse cx={360} cy={878} rx={210 * fl} ry={34} fill="#e87a30" opacity={0.28} filter="url(#s3SoftBlur)" />

          {/* === BEAT 1 -> 4: CONSISTENT CHARACTERS (ARU & COMPANION) === */}
          {/* Companion sitting warmly on right tending & enjoying meal */}
          <PrehistoricHumanRig
            f={f}
            x={518}
            y={878}
            scale={0.96}
            facing={-1}
            variant="companion"
            pose="sit_warm"
            blendToPose="eat_warm"
            blendT={enjoyT}
            rimIntensity={0.92}
            rimColor="#ffc26a"
            rimFromFront
            shadowStretch={1.45}
            seed={31}
            idSuffix="s3comp"
          />

          {/* Aru walking in with hunt -> kneeling to roast -> enjoying cooked meal! */}
          <PrehistoricHumanRig
            f={f}
            x={lerp(75, 206, huntWalkT)}
            y={878}
            scale={1.0}
            facing={1}
            variant="aru"
            pose={enjoyT > 0.05 ? 'roast_meat' : 'walk_hunt'}
            blendToPose={enjoyT > 0.05 ? 'eat_warm' : 'roast_meat'}
            blendT={enjoyT > 0.05 ? enjoyT : roastT}
            rimIntensity={lerp(0.45, 0.96, huntWalkT)}
            rimColor="#ffc26a"
            rimFromFront
            shadowStretch={-1.45}
            prop={roastT < 0.25 ? 'hunt_prey' : 'none'}
            seed={33}
            idSuffix="s3aru"
          />

          {/* Wooden Y-Fork Spit Roasting Rack & Skewered Meat Clearly Kissed by Flame Tips (Beats 2-3!) */}
          {roastT > 0.05 && (
            <g opacity={roastT * (1 - enjoyT * 0.72)}>
              {/* Left & Right Wooden Y-Stakes */}
              <path d="M 268 878 L 282 706 L 270 688 M 282 706 L 295 690" fill="none" stroke="#361c1c" strokeWidth={7} strokeLinecap="round" />
              <path d="M 452 878 L 438 706 L 425 690 M 438 706 L 450 688" fill="none" stroke="#361c1c" strokeWidth={7} strokeLinecap="round" />
              {/* Horizontal Roasting Spit Pole */}
              <line x1={264} y1={706} x2={456} y2={706} stroke="#4e2b20" strokeWidth={5.5} strokeLinecap="round" />

              {/* Skewered Haunch of Meat Rotating Gently & Caramelizing Clearly Above Flames! */}
              <g transform={`translate(360, 706) rotate(${Math.sin(f * 0.06) * 4})`}>
                {/* Bone end */}
                <path d="M -52 -4 L -68 -8 C -72 -12, -76 -5, -72 0 C -76 5, -72 12, -68 8 L -52 4 Z" fill="#e6dcc6" />
                {/* Sculpted Roast Haunch */}
                <path
                  d="M -52 -16 C -34 -34, 24 -36, 48 -18 C 60 -6, 60 12, 46 22 C 22 34, -32 32, -52 14 Z"
                  fill={meatMainCol}
                  stroke={meatEdgeCol}
                  strokeWidth={2.5}
                />
                {/* Caramelized Sear Marks Appearing as cookProg -> 1 */}
                {cookProg > 0.2 && (
                  <g opacity={(cookProg - 0.2) * 0.9} stroke="#3c180e" strokeWidth={3.2} strokeLinecap="round">
                    <path d="M -26 -20 Q -18 0, -24 18" fill="none" />
                    <path d="M 0 -24 Q 8 0, 2 22" fill="none" />
                    <path d="M 24 -20 Q 30 0, 24 18" fill="none" />
                  </g>
                )}
                {/* Glistening Hot Specular Firelight Highlight on Underside of Roast */}
                <path
                  d="M -36 16 Q 0 28, 38 15"
                  fill="none"
                  stroke={meatSheenCol}
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  opacity={0.78 * fl}
                />

                {/* Signature Detail: Sizzling Hot Fat Droplets & Fragrant Curling Steam Ribbons! */}
                {[0, 1, 2, 3].map((si) => {
                  const sp = ((f * 0.018 + si * 0.25) % 1);
                  const sx = -32 + si * 22 + Math.sin(sp * Math.PI * 3 + si) * 14;
                  const sy = -28 - sp * 115;
                  const sop = Math.sin(sp * Math.PI) * (0.28 + cookProg * 0.45);
                  return (
                    <path
                      key={si}
                      d={`M ${sx} ${sy + 18} Q ${sx + 10} ${sy + 6}, ${sx - 6} ${sy - 8} T ${sx + 5} ${sy - 26}`}
                      fill="none"
                      stroke="#f6e6d0"
                      strokeWidth={3.2 + sp * 3}
                      strokeLinecap="round"
                      opacity={sop}
                      filter="url(#s3SoftBlur)"
                    />
                  );
                })}
                {/* Sizzling pop droplets falling toward embers */}
                {[0, 1, 2].map((di) => {
                  const dp = ((f * 0.055 + hash01(di * 19.3)) % 1);
                  return (
                    <circle
                      key={di}
                      cx={-18 + di * 20}
                      cy={22 + dp * 64}
                      r={2.4 * (1 - dp * 0.4)}
                      fill="#ffd27c"
                      opacity={(1 - dp) * 0.85}
                    />
                  );
                })}
              </g>
            </g>
          )}

          {/* Central Volumetric Hearth Campfire (flame tips warmly kissing the roasting meat above!) */}
          <VolumetricFire2D
            f={f}
            cx={360}
            cy={862}
            scale={lerp(1.06, 0.90, roastT * (1 - enjoyT))}
            intensity={1.0}
            showLogs
            showSmoke
            emberCount={26}
            wind={0.05}
            idPrefix="s3hearth"
          />
        </g>
      </svg>

      <ForegroundFoliageFrame parallaxX={camX * 0.5} parallaxY={0} tint="#14091c" opacity={0.68} />
    </AbsoluteFill>
  );
};
