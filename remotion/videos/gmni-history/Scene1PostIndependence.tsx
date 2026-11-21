import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  DriftingTwilightClouds,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuint,
  ForegroundBokehPillars,
  lampGlow,
  lerp,
  MerahPutihFlag2D,
  TwilightStars,
} from './fx';
import { HistoricalHumanRig } from './HistoricalHumanRig';

/**
 * SCENE 1 — INDONESIA SETELAH KEMERDEKAAN (Tahun 1950-an) [V2 CINEMATIC DYNAMIC]
 * 1. Continuous 3-layer parallax dolly tracking a 1950s vintage sedan across colonial Jakarta.
 * 2. Dramatic crane-up push-in onto the billowing Sang Saka Merah Putih against crimson-gold dusk.
 * 3. Active lateral dolly glide across Petani -> Buruh Pabrik (billowing steam + spinning gear) -> Pasar.
 * 4. True cinema dolly tracking shot alongside marching/walking 1950s students (campus scrolls smoothly past!).
 */
export const Scene1PostIndependence: React.FC<{ f: number }> = ({ f }) => {
  const lg = lampGlow(f, 3);

  const flagFocusT = easeInOutCubic((f - (CUES.s1_flag - 12)) / 26);
  const peopleT = easeInOutCubic((f - (CUES.s1_people - 12)) / 22);
  const studentsT = easeInOutCubic((f - (CUES.s1_students - 14)) / 22);

  const cityAlpha = clamp(1 - peopleT, 0, 1);
  const peopleAlpha = clamp(peopleT * (1 - studentsT), 0, 1);
  const studentsAlpha = studentsT;

  // Beat 1-2 dynamic camera: pans with vintage car, then cranes up & pushes into Merah Putih!
  const b1Prog = clamp(f / Math.max(1, CUES.s1_people), 0, 1);
  const carX = lerp(-140, 820, easeInOut(b1Prog));
  const cityCamX = lerp(42, -36, b1Prog);
  const cityScale = lerp(1.02, 1.09, b1Prog) + flagFocusT * 0.24;
  const cityLiftY = lerp(0, 118, flagFocusT);

  // Beat 3 dynamic lateral dolly pan: Petani (left) -> Buruh (center) -> Pasar (right)
  const b3Prog = clamp((f - CUES.s1_people) / Math.max(1, CUES.s1_students - CUES.s1_people), 0, 1);
  const peopleCamX = lerp(115, -110, easeInOutCubic(b3Prog));
  const peopleScale = lerp(1.16, 1.08, b3Prog);
  const gearRot = f * 1.45;

  // Beat 4 true cinema tracking dolly: campus arches & columns scroll leftward as students stride right!
  const b4Local = Math.max(0, f - (CUES.s1_students - 14));
  const archScroll = (b4Local * 2.4) % 210;
  const fgScroll = (b4Local * 4.6) % 720;
  const b4PushScale = lerp(1.0, 1.12, easeOutCubic(b4Local / 120));

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="g1Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a0d2b" />
            <stop offset="46%" stopColor="#4c2646" />
            <stop offset="80%" stopColor="#b4463a" />
            <stop offset="100%" stopColor="#ec9850" />
          </linearGradient>
          <radialGradient id="g1Sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.9" />
            <stop offset="38%" stopColor="#f49a48" stopOpacity="0.42" />
            <stop offset="72%" stopColor="#c4262c" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g1Lamp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe8a8" stopOpacity={0.82 * lg} />
            <stop offset="45%" stopColor="#e88a38" stopOpacity={0.3 * lg} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="g1Blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#g1Sky)" />
        <TwilightStars f={f} opacity={0.48} count={52} />
        <DriftingTwilightClouds f={f} opacity={0.28} tint="#683354" speed={0.55} />

        {/* Sweeping Volumetric Sunset Shafts */}
        <g transform={`translate(${cityCamX * 0.25}, 0)`}>
          <circle cx={360} cy={615} r={275} fill="url(#g1Sun)" />
          {[0, 1, 2, 3, 4].map((ri) => {
            const ang = -36 + ri * 18 + Math.sin(f * 0.03 + ri) * 3.5;
            return (
              <polygon
                key={ri}
                points={`${360 - 16},615 ${360 + 16},615 ${360 + ang * 11 + 85},1120 ${360 + ang * 11 - 52},1120`}
                fill="#ffe6b2"
                opacity={0.075}
              />
            );
          })}
        </g>

        {/* === BEATS 1 & 2: 1950s JAKARTA COLONIAL BOULEVARD + HEROIC MERAH PUTIH CRANE-UP === */}
        {cityAlpha > 0.01 && (
          <g
            opacity={cityAlpha}
            transform={`translate(360, 560) scale(${cityScale.toFixed(3)}) translate(-360, -560) translate(${cityCamX.toFixed(1)}, ${cityLiftY.toFixed(1)})`}
          >
            {/* Far Skyline Parallax (0.35x counter-shift) */}
            <g fill="#2b1738" opacity={0.86} transform={`translate(${(-cityCamX * 0.65).toFixed(1)}, 0)`}>
              <path d="M -120 770 L -120 605 L 40 605 L 80 565 L 120 605 L 220 605 L 220 555 L 265 505 L 310 555 L 310 615 L 455 615 L 495 570 L 535 615 L 620 615 L 620 558 L 860 558 L 860 880 L -120 880 Z" />
            </g>

            {/* Midground 1950s Colonial Facades */}
            <g transform={`translate(${(-cityCamX * 0.2).toFixed(1)}, 0)`}>
              <path d="M -80 855 L -80 570 L 185 570 L 210 615 L 210 855 Z" fill="#21122b" stroke="#f0a858" strokeOpacity={0.38} strokeWidth={1.6} />
              <polygon points="-45,570 88,518 195,570" fill="#2a1636" stroke="#f0a858" strokeOpacity={0.38} strokeWidth={1.5} />
              {[18, 74, 130].map((wx, wi) => (
                <path key={wi} d={`M ${wx} 735 L ${wx} 668 C ${wx} 650, ${wx + 28} 650, ${wx + 28} 668 L ${wx + 28} 735 Z`} fill="#f8be64" opacity={(0.52 + 0.14 * Math.sin(f * 0.12 + wi)) * lg} />
              ))}
              <path d="M 515 855 L 515 605 L 545 555 L 800 555 L 800 855 Z" fill="#21122b" stroke="#f0a858" strokeOpacity={0.38} strokeWidth={1.6} />
              {[555, 612, 668].map((wx, wi) => (
                <path key={wi} d={`M ${wx} 735 L ${wx} 668 C ${wx} 650, ${wx + 28} 650, ${wx + 28} 668 L ${wx + 28} 735 Z`} fill="#f8be64" opacity={(0.5 + 0.14 * Math.cos(f * 0.1 + wi)) * lg} />
              ))}
            </g>

            {/* Boulevard Ground & Classic Streetlamps */}
            <path d="M -140 850 L 860 850 L 860 1280 L -140 1280 Z" fill="#190d23" />
            {[155, 565].map((lx, li) => (
              <g key={li} transform={`translate(${lx}, 850)`}>
                <line x1={0} y1={0} x2={0} y2={-165} stroke="#2c1a36" strokeWidth={5} />
                <path d="M 0 -165 Q 16 -178, 22 -162" fill="none" stroke="#2c1a36" strokeWidth={3.5} />
                <circle cx={22} cy={-156} r={58} fill="url(#g1Lamp)" style={{ mixBlendMode: 'screen' }} />
                <circle cx={22} cy={-156} r={6} fill="#fff2cc" />
              </g>
            ))}

            {/* BEAT 2 HERO: Proud Merah Putih Flag */}
            <MerahPutihFlag2D f={f} x={305} y={852} poleH={430} flagW={225} flagH={134} windSpeed={0.16} rimOpacity={0.92} />
            <polygon points="260,858 276,824 334,824 350,858" fill="#281632" stroke="#f4b25c" strokeOpacity={0.5} strokeWidth={1.6} />

            {/* Gliding 1950s Classic Vintage Sedan with Dynamic Headlight Sweep */}
            <g transform={`translate(${carX.toFixed(1)}, 848)`}>
              <polygon points="72,-20 235,-46 235,14 72,-8" fill="#ffe6a8" opacity={0.26} filter="url(#g1Blur)" />
              <path
                d="M -78 -14 C -76 -28, -58 -32, -40 -34 L -18 -56 C -4 -60, 26 -60, 38 -54 L 54 -34 C 72 -32, 82 -24, 82 -12 L 82 -4 L -78 -4 Z"
                fill="#1f1028"
                stroke="#f4b260"
                strokeOpacity={0.62}
                strokeWidth={1.8}
              />
              <path d="M -32 -34 L -14 -50 L 8 -50 L 8 -34 Z" fill="#f8be68" opacity={0.48} />
              <path d="M 14 -34 L 14 -50 L 32 -50 L 44 -34 Z" fill="#f8be68" opacity={0.48} />
              <circle cx={78} cy={-18} r={5} fill="#fff4d4" />
              <circle cx={-46} cy={-4} r={14} fill="#14091b" stroke="#9e828c" strokeWidth={3} />
              <circle cx={46} cy={-4} r={14} fill="#14091b" stroke="#9e828c" strokeWidth={3} />
            </g>

            {/* Foreground Parallax Silhouettes Passing at 1.65x Speed */}
            <ForegroundBokehPillars offsetX={cityCamX * 1.4} opacity={0.48 * (1 - flagFocusT * 0.7)} />
          </g>
        )}

        {/* === BEAT 3: ACTIVE LATERAL DOLLY ACROSS PETANI -> BURUH PABRIK -> PASAR === */}
        {peopleAlpha > 0.01 && (
          <g
            opacity={peopleAlpha}
            transform={`translate(360, 740) scale(${peopleScale.toFixed(3)}) translate(-360, -740) translate(${peopleCamX.toFixed(1)}, 0)`}
          >
            {/* Distant Hills (0.4x parallax) */}
            <g transform={`translate(${(-peopleCamX * 0.6).toFixed(1)}, 0)`}>
              <path d="M -220 760 Q 120 675, 360 735 T 960 710 L 960 1280 L -220 1280 Z" fill="#261530" />
            </g>

            {/* Factory Foundry Center-Back + Animated Chimney Steam Puffs + Spinning Iron Gear */}
            <g transform="translate(360, 745)" opacity={0.92}>
              {/* Animated rising steam puffs */}
              {[0, 1, 2, 3].map((si) => {
                const sp = ((f * 0.018 + si * 0.25) % 1);
                return (
                  <circle
                    key={si}
                    cx={-46 + sp * 45 + Math.sin(sp * 5) * 8}
                    cy={-105 - sp * 115}
                    r={14 + sp * 28}
                    fill="#946278"
                    opacity={(1 - sp) * 0.28}
                  />
                );
              })}
              <polygon points="-68,105 -56,-95 -36,-95 -24,105" fill="#22122b" />
              <path d="M -115 105 L -115 10 L -45 -22 L -45 10 L 35 -22 L 35 10 L 115 -18 L 115 105 Z" fill="#22122b" stroke="#f0a250" strokeOpacity={0.38} strokeWidth={1.5} />
              <g transform={`translate(76, -42) rotate(${gearRot.toFixed(1)})`} opacity={0.62}>
                <circle cx={0} cy={0} r={34} fill="none" stroke="#784c64" strokeWidth={9} />
                {Array.from({ length: 8 }).map((_, ti) => (
                  <rect key={ti} x={-4} y={-44} width={8} height={14} rx={2} fill="#784c64" transform={`rotate(${ti * 45})`} />
                ))}
              </g>
            </g>

            {/* Traditional Market Stall Awning on Right with Gently Swaying Lantern */}
            <g transform="translate(590, 855)">
              <line x1={-68} y1={0} x2={-68} y2={-175} stroke="#361f2e" strokeWidth={5} />
              <line x1={76} y1={0} x2={76} y2={-175} stroke="#361f2e" strokeWidth={5} />
              <polygon points="-86,-162 94,-162 78,-198 -70,-198" fill="#6a2430" stroke="#f4b25c" strokeOpacity={0.6} strokeWidth={1.6} />
              <g transform={`translate(4, -162) rotate(${(Math.sin(f * 0.08) * 5).toFixed(1)})`}>
                <line x1={0} y1={0} x2={0} y2={16} stroke="#f4b25c" strokeWidth={1.5} />
                <circle cx={0} cy={18} r={48} fill="url(#g1Lamp)" style={{ mixBlendMode: 'screen' }} />
                <circle cx={0} cy={18} r={5.5} fill="#fff2cc" />
              </g>
            </g>

            {/* Warm Ground Horizon */}
            <path d="M -220 860 Q 360 832, 940 862 L 940 1280 L -220 1280 Z" fill="#1b0e24" />

            {/* 3 Society Archetypes Spread Wider for Dynamic Camera Pan! */}
            <HistoricalHumanRig f={f} x={115} y={866} scale={1.0} facing={1} role="farmer" pose="farm_hoe" prop="hoe" rimIntensity={0.92} rimColor="#f8bc64" shadowStretch={-1.1} seed={11} idSuffix="s1farm" />
            <HistoricalHumanRig f={f} x={360} y={864} scale={1.02} facing={1} role="worker" pose="discuss_stand" rimIntensity={0.9} rimColor="#f8bc64" shadowStretch={-0.6} seed={14} idSuffix="s1work" />
            <HistoricalHumanRig f={f} x={595} y={866} scale={0.98} facing={-1} role="merchant" pose="discuss_stand" rimIntensity={0.92} rimColor="#f8bc64" shadowStretch={1.1} seed={17} idSuffix="s1merc" />
          </g>
        )}

        {/* === BEAT 4: TRUE CINEMA DOLLY TRACKING SHOT ALONGSIDE WALKING 1950s STUDENTS === */}
        {studentsAlpha > 0.01 && (
          <g
            opacity={studentsAlpha}
            transform={`translate(360, 720) scale(${b4PushScale.toFixed(3)}) translate(-360, -720)`}
          >
            {/* Scrolling Colonial Campus Arches (Background Moving Leftward as Students Stride Right!) */}
            <path d="M -80 860 L -80 510 L 800 510 L 800 860 Z" fill="#23132e" opacity={0.78} />
            {[-1, 0, 1, 2, 3, 4].map((ai) => {
              const ax = ai * 210 - archScroll;
              return (
                <g key={ai}>
                  <path d={`M ${ax - 52} 855 L ${ax - 52} 635 C ${ax - 52} 565, ${ax + 52} 565, ${ax + 52} 635 L ${ax + 52} 855 Z`} fill="#4d2b48" opacity={0.62} />
                  <circle cx={ax} cy={600} r={34} fill="url(#g1Lamp)" opacity={0.45} style={{ mixBlendMode: 'screen' }} />
                </g>
              );
            })}
            <ellipse cx={360} cy={710} rx={380} ry={270} fill="url(#g1Sun)" opacity={0.46} style={{ mixBlendMode: 'screen' }} />
            <path d="M -60 862 Q 360 842, 780 866 L 780 1280 L -60 1280 Z" fill="#1a0d23" />

            {/* Students Dynamically Striding Forward Carrying Books (with Subtle Crimson Heritage Scarf Preview!) */}
            <HistoricalHumanRig f={f} x={185} y={874} scale={1.1} facing={1} role="student_male" pose="walk_books" prop="books" wearPeci rimIntensity={0.96} rimColor="#ffc46a" shadowStretch={-1.2} seed={21} idSuffix="s1st1" />
            <HistoricalHumanRig f={f} x={355} y={876} scale={1.12} facing={1} role="hadiprabowo" pose="walk_books" prop="books" rimIntensity={1.0} rimColor="#ffd07c" shadowStretch={-0.9} seed={23} idSuffix="s1st2" />
            <HistoricalHumanRig f={f} x={520} y={874} scale={1.08} facing={1} role="student_female" pose="walk_books" prop="books" rimIntensity={0.95} rimColor="#ffc46a" shadowStretch={-1.0} seed={26} idSuffix="s1st3" />

            {/* Fast Foreground Blurred Campus Column Gliding Past Leftward (True 1.8x Parallax Depth!) */}
            <g opacity={0.44} filter="url(#g1Blur)">
              <rect x={760 - fgScroll * 1.3} y={240} width={54} height={720} fill="#0e0516" />
            </g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
