import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  DriftingTwilightClouds,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuint,
  ForegroundBokehPillars,
  GmniHeritageWatermark,
  lampGlow,
  lerp,
  MerahPutihFlag2D,
  microShake,
  springSettle,
  starPoints,
  TwilightStars,
} from './fx';
import { HistoricalHumanRig } from './HistoricalHumanRig';

/**
 * SCENE 3 — GAGASAN FUSI TIGA ORGANISASI (September 1953) [V2 CINEMATIC DYNAMIC]
 * 1. Two-stage dynamic dolly push-in at Gedung Proklamasi (delegates arriving -> camera pushes through glowing arched door!).
 * 2. Heroic closer framing of S.M. Hadiprabowo leading GMDI under gently swinging pendant light beam.
 * 3. Smooth lateral dolly pan across colonial veranda arches of Rumah Dinas Wali Kota Soediro, Taman Suropati.
 * 4. High-energy orbital collision (with micro-shake + shockwave!) forging the iconic Merah-Putih-Merah GMNI Shield & Star!
 */
export const Scene3Fusion1953: React.FC<{ f: number }> = ({ f }) => {
  const s3Start = SCENES.s3Start;
  const localF = Math.max(0, f - s3Start);
  const lg = lampGlow(f, 11);

  const hadiT = easeInOutCubic((f - (CUES.s3_hadi - 44)) / 24);
  const suropatiT = easeInOutCubic((f - (CUES.s3_suropati - 12)) / 22);
  const mergeT = easeInOutCubic((f - (CUES.s3_merge - 12)) / 26);

  const prokAlpha = clamp(1 - hadiT, 0, 1);
  const hadiAlpha = clamp(hadiT * (1 - suropatiT), 0, 1);
  const suroAlpha = clamp(suropatiT * (1 - mergeT), 0, 1);
  const mergeAlpha = mergeT;

  // Beat 1 continuous 2-stage dolly push: wide gate approach (0..180) -> doorway dive (180..320)
  const prokWalkProg = clamp(localF / 240, 0, 1);
  const prokDiveT = easeInOutCubic((localF - 170) / 145);
  const prokScale = lerp(0.95, 1.12, easeOutCubic(localF / 180)) + prokDiveT * 0.56;
  const prokShiftY = lerp(0, -48, prokDiveT);

  // Beat 2 subtle hero push-in + swinging pendant lamp
  const hadiLocal = Math.max(0, f - (CUES.s3_hadi - 44));
  const hadiScale = lerp(1.0, 1.14, easeOutCubic(hadiLocal / 90));
  const lampSwing = Math.sin(f * 0.055) * 4.5;

  // Beat 3 lateral dolly pan across Taman Suropati arches
  const suroLocal = Math.max(0, f - (CUES.s3_suropati - 12));
  const suroPanX = lerp(46, -42, easeInOutCubic(suroLocal / 105));
  const suroScale = lerp(1.04, 1.13, easeOutCubic(suroLocal / 105));

  // Beat 4 fusion orbit -> collision impact!
  const fuseProg = easeInOutCubic((f - (CUES.s3_merge + 2)) / 48);
  const impactFrame = CUES.s3_merge + 46;
  const impactT = springSettle((f - impactFrame) / 20);
  const shockProg = easeOutCubic((f - impactFrame) / 26);
  const shake = microShake(f, impactFrame, 15, 7.5);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg
        width={720}
        height={1280}
        viewBox="0 0 720 1280"
        style={{ position: 'absolute', inset: 0, transform: `translate(${shake.x.toFixed(1)}px, ${shake.y.toFixed(1)}px)` }}
      >
        <defs>
          <linearGradient id="g3Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#190d28" />
            <stop offset="50%" stopColor="#3f2042" />
            <stop offset="86%" stopColor="#863434" />
            <stop offset="100%" stopColor="#cf7844" />
          </linearGradient>
          <radialGradient id="g3LampCone" cx="50%" cy="28%" r="62%">
            <stop offset="0%" stopColor="#ffefb8" stopOpacity={0.78 * lg} />
            <stop offset="45%" stopColor="#ec923e" stopOpacity={0.32 * lg} />
            <stop offset="76%" stopColor="#b82428" stopOpacity={0.14 * lg} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="g3Glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#g3Sky)" />
        <TwilightStars f={f} opacity={0.55} count={52} />
        <DriftingTwilightClouds f={f} opacity={0.28} tint="#642e4d" speed={0.55} />

        {/* === BEAT 1: GEDUNG PROKLAMASI, PEGANGSAAN TIMUR 56 — 2-STAGE DOLLY PUSH THROUGH DOORWAY === */}
        {prokAlpha > 0.01 && (
          <g
            opacity={prokAlpha}
            transform={`translate(360, 745) scale(${prokScale.toFixed(3)}) translate(-360, -745) translate(0, ${prokShiftY.toFixed(1)})`}
          >
            <ellipse cx={360} cy={660} rx={360} ry={260} fill="url(#g3LampCone)" style={{ mixBlendMode: 'screen' }} />
            <g transform="translate(360, 855)">
              <rect x={-265} y={-24} width={530} height={24} fill="#281632" stroke="#f0b260" strokeOpacity={0.48} strokeWidth={1.5} />
              <rect x={-245} y={-210} width={490} height={186} fill="#23132c" stroke="#f0b260" strokeOpacity={0.42} strokeWidth={1.5} />
              <polygon points="-285,-208 285,-208 232,-285 -232,-285" fill="#1d0f25" stroke="#f0a856" strokeOpacity={0.45} strokeWidth={1.8} />
              <polygon points="-132,-208 0,-292 132,-208" fill="#2c1836" stroke="#f4b868" strokeOpacity={0.68} strokeWidth={2} />
              {/* Swelling Warm Arched Doorway Light as Camera Pushes In! */}
              <rect x={-34} y={-158} width={68} height={134} rx={34} fill="#ffd482" opacity={clamp((0.72 + prokDiveT * 0.28) * lg, 0, 1)} />
              <circle cx={0} cy={-95} r={lerp(50, 160, prokDiveT)} fill="#ffebb8" opacity={0.28 + prokDiveT * 0.4} filter="url(#g3Glow)" />
              {[-185, -115, 115, 185].map((wx, wi) => (
                <rect key={wi} x={wx - 18} y={-156} width={36} height={82} rx={4} fill="#f4b45c" opacity={0.58 * lg} />
              ))}
              {[-124, -62, 62, 124].map((px, pi) => (
                <rect key={pi} x={px - 7} y={-208} width={14} height={184} fill="#382242" stroke="#f6cc86" strokeOpacity={0.55} strokeWidth={1.2} />
              ))}
              {/* Archival Address Plaque (generous horizontal margin!) */}
              <rect x={-218} y={-345} width={436} height={36} rx={18} fill="#1b0e24" fillOpacity={0.9} stroke="#f0b462" strokeWidth={1.4} />
              <text x={0} y={-322} textAnchor="middle" fill="#faecc8" fontFamily="Segoe UI, sans-serif" fontSize={13} fontWeight={700} letterSpacing="2.2px">
                PEGANGSAAN TIMUR 56 · JAKARTA 1953
              </text>
            </g>
            <MerahPutihFlag2D f={f} x={102} y={860} poleH={275} flagW={115} flagH={68} windSpeed={0.14} />
            <path d="M -80 855 L 800 855 L 800 1280 L -80 1280 Z" fill="#180c21" />

            {/* Arriving Student Delegates Walking Briskly Toward the Lit Doorway (eliminates 10s dead stillness!) */}
            <g opacity={clamp(1 - prokDiveT * 1.4, 0, 1)}>
              <HistoricalHumanRig f={f} x={lerp(135, 310, prokWalkProg)} y={866} scale={0.74} facing={1} role="student_male" pose="walk_books" prop="books" wearPeci redScarf rimIntensity={0.92} rimColor="#ffc870" seed={42} idSuffix="s3w1" />
              <HistoricalHumanRig f={f} x={lerp(595, 415, prokWalkProg)} y={866} scale={0.72} facing={-1} role="student_female" pose="walk_books" prop="books" redScarf rimIntensity={0.9} rimColor="#ffc870" seed={45} idSuffix="s3w2" />
            </g>

            {/* Foreground Wrought-Iron Gate Posts Parting Outward as Camera Glides In! */}
            <g opacity={0.58 * (1 - prokDiveT)} filter="url(#g3Glow)">
              <rect x={lerp(-18, -140, prokWalkProg)} y={360} width={54} height={600} fill="#0e0516" />
              <rect x={lerp(684, 806, prokWalkProg)} y={360} width={54} height={600} fill="#0e0516" />
            </g>
          </g>
        )}

        {/* === BEAT 2: RAPAT MAHASISWA DIPIMPIN S.M. HADIPRABOWO — HERO PUSH-IN === */}
        {hadiAlpha > 0.01 && (
          <g
            opacity={hadiAlpha}
            transform={`translate(320, 700) scale(${hadiScale.toFixed(3)}) translate(-320, -700)`}
          >
            <rect x={-80} y={-80} width={880} height={1440} fill="#1f1028" />
            {/* Gently Swinging Warm Pendant Lamp Light Cone */}
            <g transform={`translate(360, 180) rotate(${lampSwing.toFixed(1)}) translate(-360, -180)`}>
              <ellipse cx={360} cy={595} rx={360} ry={330} fill="url(#g3LampCone)" style={{ mixBlendMode: 'screen' }} />
              <line x1={360} y1={165} x2={360} y2={355} stroke="#44293c" strokeWidth={3.5} />
              <path d="M 305 385 Q 360 340, 415 385 Z" fill="#3a2034" stroke="#f6c474" strokeWidth={1.8} />
              <circle cx={360} cy={386} r={14} fill="#fff4d0" filter="url(#g3Glow)" />
            </g>

            <rect x={-80} y={860} width={880} height={420} fill="#160a1e" />

            {/* Closer Heroic Scale S.M. Hadiprabowo Leading the Meeting! */}
            <HistoricalHumanRig f={f} x={238} y={872} scale={1.22} facing={1} role="hadiprabowo" pose="lead_meeting" rimIntensity={1.0} rimColor="#ffd07a" shadowStretch={-1.1} seed={41} idSuffix="s3hadi" />
            <HistoricalHumanRig f={f} x={455} y={874} scale={1.08} facing={-1} role="student_male" pose="sit_meeting" wearPeci redScarf rimIntensity={0.94} rimColor="#ffc268" shadowStretch={1.0} seed={44} idSuffix="s3m1" />
            <HistoricalHumanRig f={f} x={562} y={876} scale={1.04} facing={-1} role="student_female" pose="sit_meeting" redScarf rimIntensity={0.88} rimColor="#f8b65c" shadowStretch={1.2} seed={47} idSuffix="s3m2" />

            <g transform="translate(360, 775)">
              <rect x={-120} y={0} width={285} height={16} rx={4} fill="#3a212c" stroke="#f4b662" strokeOpacity={0.62} strokeWidth={1.6} />
              <rect x={-96} y={16} width={14} height={82} fill="#261420" />
              <rect x={128} y={16} width={14} height={82} fill="#261420" />
              <rect x={-55} y={-5} width={44} height={5} fill="#f2e4c8" opacity={0.88} />
              <rect x={15} y={-5} width={52} height={5} fill="#f2e4c8" opacity={0.88} />
            </g>

            {/* Archival Name Caption Tag with Crimson Left Accent */}
            <g transform="translate(245, 545)">
              <rect x={-120} y={-18} width={240} height={34} rx={17} fill="#1b0e24" fillOpacity={0.92} stroke="#f4b662" strokeWidth={1.4} />
              <rect x={-110} y={-10} width={6} height={20} rx={3} fill="#d4262c" />
              <text x={4} y={5} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={14} fontWeight="bold" letterSpacing="1.3px">
                S.M. HADIPRABOWO
              </text>
            </g>
          </g>
        )}

        {/* === BEAT 3: RUMAH DINAS WALI KOTA SOEDIRO, TAMAN SUROPATI — LATERAL DOLLY PAN === */}
        {suroAlpha > 0.01 && (
          <g
            opacity={suroAlpha}
            transform={`translate(360, 710) scale(${suroScale.toFixed(3)}) translate(-360, -710) translate(${suroPanX.toFixed(1)}, 0)`}
          >
            <rect x={-120} y={-80} width={960} height={1440} fill="#1e1028" />
            <ellipse cx={360} cy={620} rx={380} ry={310} fill="url(#g3LampCone)" style={{ mixBlendMode: 'screen' }} />
            {/* Colonial Arched Veranda (0.65x subtle depth offset) */}
            <g transform={`translate(${(-suroPanX * 0.35).toFixed(1)}, 0)`}>
              {[120, 360, 600].map((ax, ai) => (
                <path key={ai} d={`M ${ax - 95} 855 L ${ax - 95} 525 C ${ax - 95} 435, ${ax + 95} 435, ${ax + 95} 525 L ${ax + 95} 855 Z`} fill="#2b1736" stroke="#f0b260" strokeOpacity={0.36} strokeWidth={1.6} />
              ))}
            </g>
            <rect x={-120} y={855} width={960} height={425} fill="#160a1e" />

            <g transform={`translate(${360 - suroPanX * 0.5}, 365)`}>
              <rect x={-262} y={-18} width={524} height={34} rx={17} fill="#1a0d23" fillOpacity={0.9} stroke="#f0b462" strokeWidth={1.4} />
              <text x={0} y={4} textAnchor="middle" fill="#faecc8" fontFamily="Segoe UI, sans-serif" fontSize={12} fontWeight={700} letterSpacing="1.6px">
                TAMAN SUROPATI · RUMAH DINAS WALI KOTA SOEDIRO
              </text>
            </g>

            {/* 3 Organization Representatives Conferring Around Round Fusion Table */}
            <HistoricalHumanRig f={f} x={198} y={868} scale={1.08} facing={1} role="student_male" pose="sit_meeting" wearPeci redScarf rimIntensity={0.96} rimColor="#ffc46a" seed={51} idSuffix="s3d1" />
            <HistoricalHumanRig f={f} x={358} y={856} scale={1.02} facing={1} role="hadiprabowo" pose="discuss_stand" rimIntensity={1.0} rimColor="#ffcf78" seed={54} idSuffix="s3d2" />
            <HistoricalHumanRig f={f} x={522} y={868} scale={1.08} facing={-1} role="student_female" pose="sit_meeting" redScarf rimIntensity={0.96} rimColor="#ffc46a" seed={57} idSuffix="s3d3" />

            <g transform="translate(360, 772)">
              <ellipse cx={0} cy={0} rx={125} ry={22} fill="#3d222f" stroke="#f6be6c" strokeOpacity={0.68} strokeWidth={2} />
              <rect x={-14} y={14} width={28} height={82} fill="#261420" />
              <ellipse cx={0} cy={-2} rx={36} ry={8} fill="#faecc8" opacity={0.86} />
              <circle cx={0} cy={-16} r={58} fill="url(#g3LampCone)" opacity={0.55} style={{ mixBlendMode: 'screen' }} />
            </g>

            <ForegroundBokehPillars offsetX={suroPanX * 0.9} opacity={0.5} />
          </g>
        )}

        {/* === BEAT 4: THREE EMBLEMS COLLIDE & FORGE THE MERAH-PUTIH-MERAH GMNI SHIELD & STAR! === */}
        {mergeAlpha > 0.01 && (
          <g opacity={mergeAlpha}>
            <ellipse cx={360} cy={575} rx={380} ry={360} fill="url(#g3LampCone)" style={{ mixBlendMode: 'screen' }} />
            <GmniHeritageWatermark f={f} cx={360} cy={575} scale={lerp(0.85, 1.12, impactT)} opacity={0.18 * mergeAlpha} />

            {/* Converging Sacred Orbit Ring */}
            <circle cx={360} cy={575} r={lerp(215, 130, fuseProg)} fill="none" stroke="#f4b864" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="8 8" />

            {/* Expanding Crimson-Gold Impact Shockwave Ring on Collision! */}
            {shockProg > 0.01 && shockProg < 0.99 && (
              <g>
                <circle cx={360} cy={575} r={lerp(36, 290, shockProg)} fill="none" stroke="#ffdf98" strokeWidth={lerp(6, 1, shockProg)} opacity={1 - shockProg} />
                <circle cx={360} cy={575} r={lerp(24, 220, shockProg)} fill="none" stroke="#dc2c2c" strokeWidth={lerp(5, 1, shockProg)} opacity={(1 - shockProg) * 0.85} />
              </g>
            )}

            {/* Three Orbiting Crests Spiraling Inward */}
            {[
              { label: 'GMM', city: 'YOGYAKARTA', baseAng: -Math.PI / 2, col: '#c62b2b' },
              { label: 'GM MERDEKA', city: 'SURABAYA', baseAng: Math.PI / 6, col: '#e88a3a' },
              { label: 'GMDI', city: 'JAKARTA', baseAng: (5 * Math.PI) / 6, col: '#c62b2b' },
            ].map((org, oi) => {
              const rad = lerp(210, 0, fuseProg);
              const ang = org.baseAng + fuseProg * Math.PI * 1.45;
              const ox = 360 + Math.cos(ang) * rad;
              const oy = 575 + Math.sin(ang) * rad;
              const orbOp = clamp(1 - (fuseProg - 0.78) / 0.22, 0, 1);
              return (
                <g key={oi} transform={`translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`} opacity={orbOp}>
                  <circle cx={0} cy={0} r={64} fill="#24132e" stroke={org.col} strokeWidth={3.2} />
                  <circle cx={0} cy={0} r={54} fill="none" stroke="#f8cc7c" strokeOpacity={0.68} strokeWidth={1.2} />
                  <text x={0} y={-2} textAnchor="middle" fill="#fff2d2" fontFamily="Georgia, serif" fontSize={14} fontWeight="bold">
                    {org.label}
                  </text>
                  <text x={0} y={16} textAnchor="middle" fill="#f4b868" fontFamily="Segoe UI, sans-serif" fontSize={9.5} fontWeight={700} letterSpacing="1.4px">
                    {org.city}
                  </text>
                </g>
              );
            })}

            {/* Unified Forged GMNI Merah-Putih-Merah Hexagonal Shield + 5-Pointed Crimson Star! */}
            {impactT > 0.01 && (
              <g transform={`translate(360, 575) scale(${lerp(0.35, 1.15, impactT).toFixed(3)})`} opacity={clamp(impactT, 0, 1)}>
                <circle cx={0} cy={0} r={145} fill="#ffd886" opacity={0.34} filter="url(#g3Glow)" />
                {/* Outer Crimson Hex Shield */}
                <polygon points="0,-108 78,-66 78,60 0,108 -78,60 -78,-66" fill="#ba1e24" stroke="#ffe4a4" strokeWidth={3} />
                {/* Signature Center Vertical White Stripe */}
                <polygon points="-24,-95 24,-95 24,93 -24,93" fill="#f6efe2" />
                {/* Iconic 5-Pointed Crimson Star + Black Core Disc */}
                <polygon points={starPoints(0, -10, 58, 23)} fill="#c82026" stroke="#180c1c" strokeWidth={1.8} />
                <circle cx={0} cy={-10} r={18} fill="#180c1c" stroke="#f6efe2" strokeWidth={2} />
                <path d="M 0 -28 A 18 18 0 0 0 0 8 Z" fill="#f6efe2" />
              </g>
            )}

            {/* Forged Caption Pill Below Shield */}
            {impactT > 0.25 && (
              <g transform={`translate(360, ${lerp(778, 755, impactT).toFixed(1)})`} opacity={clamp(impactT, 0, 1)}>
                <rect x={-225} y={-22} width={450} height={44} rx={22} fill="#1c0d24" fillOpacity={0.92} stroke="#f4b662" strokeWidth={1.6} />
                <text x={0} y={5} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={15.5} fontWeight="bold" letterSpacing="2.2px">
                  SATU WADAH PERJUANGAN MAHASISWA
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
