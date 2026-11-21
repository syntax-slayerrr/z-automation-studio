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
  microShake,
  springSettle,
  starPoints,
  TwilightStars,
} from './fx';
import { ID_CITIES, IndonesiaTwilightMap } from './IndonesiaTwilightMap';
import { HistoricalHumanRig } from './HistoricalHumanRig';

/**
 * SCENE 2 — LAHIRNYA GAGASAN PERSATUAN (Tiga Kota Perjuangan) [V2 TOTAL CINEMA REBUILD]
 * Fixes every flaw of seconds 28-35: ZERO static copy-paste inset box! ZERO cropped map labels!
 * 1. Dynamic Zoom-In from Nusantara -> Java (all 3 city names 100% safe!) + Bung Karno Marhaenisme Emblem bloom.
 * 2. Camera Dive into FULL-BLEED Yogyakarta Diorama (Tugu Jogja + Pendopo + seated circle lamp discussion + GMM pennant).
 * 3. Snappy Horizontal Whip-Pan into FULL-BLEED Surabaya Dusk Diorama (Tugu Pahlawan + Jembatan Merah + heroic scroll rally).
 * 4. Snappy Horizontal Whip-Pan into FULL-BLEED Jakarta Campus Steps Diorama (colonial columns + students ascending w/ Hadiprabowo).
 * 5. Zoom-Out Match-Cut back to Java Map -> 3 Merah-Putih-Emas arcs collide with impact shake igniting a 5-Pointed GMNI Star!
 */
export const Scene2UnityIdea: React.FC<{ f: number }> = ({ f }) => {
  const s2Start = SCENES.s2Start;
  const localF = Math.max(0, f - s2Start);
  const lg = lampGlow(f, 7);

  // Beat transition envelopes (snappy cinema timing!)
  const marhaenBloom = easeOutCubic((f - (s2Start + 145)) / 32); // blooms when VO mentions "Marhaenisme ... Bung Karno"
  const diveJogjaT = easeInOutCubic((f - (CUES.s2_jogja - 12)) / 18);
  const whipSbyT = easeOutQuint((f - (CUES.s2_sby - 8)) / 16);
  const whipJktT = easeOutQuint((f - (CUES.s2_jkt - 8)) / 16);
  const pullBackT = easeInOutCubic((f - (CUES.s2_unite - 12)) / 22);
  const arcProg = easeOutCubic((f - (CUES.s2_unite + 2)) / 38);
  const starHitT = springSettle((f - (CUES.s2_unite + 34)) / 22);

  // Impact micro-shake right when the 3 city energy lines collide into the 5-pointed star!
  const shake = microShake(f, CUES.s2_unite + 34, 14, 6.5);

  // Map visibility: Beat 1 (opening zoom-in) & Beat 5 (tri-city convergence)
  const mapBeat1Op = clamp(1 - diveJogjaT, 0, 1);
  const mapBeat5Op = pullBackT;
  const showMap = mapBeat1Op > 0.01 || mapBeat5Op > 0.01;

  // Map zoom: sweeps from Nusantara (scale 820) smoothly onto Java (scale 2360, safe margins for JKT/JOG/SBY!)
  const openZoomT = easeInOutCubic(localF / 95);
  const diveScaleBoost = diveJogjaT * (1 - pullBackT) * 950;
  const mapCenterLng = lerp(114.5, 109.75, openZoomT);
  const mapCenterLat = lerp(-4.5, -7.1, openZoomT);
  const mapScale =
    mapBeat5Op > 0.05
      ? lerp(3150, 2360, pullBackT)
      : lerp(820, 2360, openZoomT) + diveScaleBoost;

  // Full-bleed city diorama visibility (seconds 27.8 - 35.5)
  const jogjaLocal = Math.max(0, f - (CUES.s2_jogja - 12));
  const sbyLocal = Math.max(0, f - (CUES.s2_sby - 8));
  const jktLocal = Math.max(0, f - (CUES.s2_jkt - 8));

  const jogjaOp = clamp(diveJogjaT * (1 - whipSbyT), 0, 1);
  const sbyOp = clamp(whipSbyT * (1 - whipJktT), 0, 1);
  const jktOp = clamp(whipJktT * (1 - pullBackT), 0, 1);

  // Hub coordinate dead-center over Java
  const hubCoord: [number, number] = [109.85, -6.7];

  const pins = [
    {
      id: 'jkt',
      label: 'JAKARTA',
      sublabel: pullBackT > 0.2 ? 'GMDI' : undefined,
      coord: ID_CITIES.jakarta,
      appearT: easeOutCubic((localF - 50) / 20),
      color: '#d62c2c',
      labelDir: 'top' as const,
      major: true,
    },
    {
      id: 'jogja',
      label: 'YOGYAKARTA',
      sublabel: pullBackT > 0.2 ? 'GMM' : undefined,
      coord: ID_CITIES.yogyakarta,
      appearT: easeOutCubic((localF - 64) / 20),
      color: '#f4a442',
      labelDir: 'bottom' as const,
      major: true,
    },
    {
      id: 'sby',
      label: 'SURABAYA',
      sublabel: pullBackT > 0.2 ? 'G.M. MERDEKA' : undefined,
      coord: ID_CITIES.surabaya,
      appearT: easeOutCubic((localF - 78) / 20),
      color: '#d62c2c',
      labelDir: 'top' as const,
      major: true,
    },
  ];

  const arcs = [
    { id: 'a_jkt', from: ID_CITIES.jakarta, to: hubCoord, progress: arcProg, color: '#e63838', bend: -52 },
    { id: 'a_jog', from: ID_CITIES.yogyakarta, to: hubCoord, progress: arcProg, color: '#f8be62', bend: -28 },
    { id: 'a_sby', from: ID_CITIES.surabaya, to: hubCoord, progress: arcProg, color: '#e63838', bend: -52 },
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg
        width={720}
        height={1280}
        viewBox="0 0 720 1280"
        style={{ position: 'absolute', inset: 0, transform: `translate(${shake.x.toFixed(1)}px, ${shake.y.toFixed(1)}px)` }}
      >
        <defs>
          <linearGradient id="s2JogjaSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c0d29" />
            <stop offset="48%" stopColor="#4c2342" />
            <stop offset="84%" stopColor="#b04d38" />
            <stop offset="100%" stopColor="#ec9a4e" />
          </linearGradient>
          <linearGradient id="s2SbySky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1b091e" />
            <stop offset="44%" stopColor="#581a2e" />
            <stop offset="82%" stopColor="#c2302e" />
            <stop offset="100%" stopColor="#f08c42" />
          </linearGradient>
          <linearGradient id="s2JktSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#180d29" />
            <stop offset="50%" stopColor="#3c2246" />
            <stop offset="86%" stopColor="#943c3c" />
            <stop offset="100%" stopColor="#e6924a" />
          </linearGradient>
          <radialGradient id="s2LampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff4cc" stopOpacity={0.85 * lg} />
            <stop offset="38%" stopColor="#f49c42" stopOpacity={0.38 * lg} />
            <stop offset="72%" stopColor="#c4262a" stopOpacity={0.14 * lg} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="s2Blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* === BEAT 1 (OPENING MAP ZOOM) & BEAT 5 (TRI-CITY STAR CONVERGENCE) === */}
        {showMap && (
          <g opacity={Math.max(mapBeat1Op, mapBeat5Op)}>
            <IndonesiaTwilightMap
              f={f}
              center={[mapCenterLng, mapCenterLat]}
              scale={mapScale}
              centerY={505}
              pins={pins}
              arcs={mapBeat5Op > 0.05 ? arcs : []}
              highlightIslands={openZoomT > 0.45 ? ['jawa'] : ['all']}
              convergeGlow={{ coord: hubCoord, intensity: starHitT * mapBeat5Op }}
            />

            {/* BEAT 1 SECOND-HALF VISUAL EMPHASIS: Marhaenisme & Bung Karno Heritage Medallion (breaks 10s map stillness!) */}
            {mapBeat1Op > 0.05 && marhaenBloom > 0.02 && (
              <g
                opacity={marhaenBloom * mapBeat1Op}
                transform={`translate(360, ${lerp(810, 770, marhaenBloom)}) scale(${lerp(0.88, 1.0, marhaenBloom)})`}
              >
                <ellipse cx={0} cy={0} rx={210} ry={95} fill="url(#s2LampGlow)" opacity={0.55} style={{ mixBlendMode: 'screen' }} />
                {/* Glowing Connecting Rays from Marhaenisme Crest up toward Java */}
                <line x1={-120} y1={-40} x2={-195} y2={-220} stroke="#f6bc68" strokeWidth={1.3} strokeDasharray="5 6" opacity={0.48} />
                <line x1={0} y1={-48} x2={0} y2={-210} stroke="#e03838" strokeWidth={1.5} strokeDasharray="5 6" opacity={0.58} />
                <line x1={120} y1={-40} x2={195} y2={-220} stroke="#f6bc68" strokeWidth={1.3} strokeDasharray="5 6" opacity={0.48} />

                <rect x={-230} y={-44} width={460} height={88} rx={44} fill="#1d0e26" fillOpacity={0.92} stroke="#f0b662" strokeWidth={1.8} />
                {/* Crimson Left Emblem Circle with 5-Pointed Star */}
                <circle cx={-182} cy={0} r={30} fill="#b81e24" stroke="#ffe2a6" strokeWidth={1.6} />
                <polygon points={starPoints(-182, 0, 17, 7)} fill="#fff0cc" />
                <text x={24} y={-7} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={19} fontWeight="bold" letterSpacing="2.4px">
                  MARHAENISME
                </text>
                <text x={24} y={17} textAnchor="middle" fill="#f4b868" fontFamily="Segoe UI, sans-serif" fontSize={12.5} fontWeight={700} letterSpacing="3.4px">
                  PEMIKIRAN BUNG KARNO
                </text>
              </g>
            )}

            {/* BEAT 5 IMPACT: Igniting 5-Pointed GMNI Star Foretelling + Unity Ribbon! */}
            {mapBeat5Op > 0.1 && starHitT > 0.02 && (
              <g opacity={starHitT * mapBeat5Op}>
                {/* Glowing 5-Pointed Star Hovering right above Central Java Convergence Point */}
                <g transform={`translate(360, 488) scale(${lerp(0.25, 1.0, starHitT)})`}>
                  <circle cx={0} cy={0} r={88} fill="url(#s2LampGlow)" style={{ mixBlendMode: 'screen' }} />
                  <circle cx={0} cy={0} r={46 + Math.sin(f * 0.2) * 4} fill="none" stroke="#ffe4a4" strokeWidth={1.6} strokeDasharray="5 6" opacity={0.8} />
                  <polygon points={starPoints(0, 0, 34, 13.5)} fill="#d6262a" stroke="#fff4d6" strokeWidth={2.2} />
                </g>
                {/* Unity Heritage Banner */}
                <g transform={`translate(360, ${lerp(785, 755, starHitT)})`}>
                  <rect x={-225} y={-25} width={450} height={50} rx={25} fill="#21102a" fillOpacity={0.92} stroke="#f4b662" strokeWidth={1.8} />
                  <rect x={-215} y={-15} width={6} height={30} rx={3} fill="#d4262c" />
                  <rect x={209} y={-15} width={6} height={30} rx={3} fill="#d4262c" />
                  <text x={0} y={6} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={18} fontWeight="bold" letterSpacing="2.4px">
                    SATU CITA-CITA · MARHAENISME
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* === BEAT 2 (0:27.8–0:30.3): FULL-BLEED YOGYAKARTA DIORAMA (GMM) === */}
        {jogjaOp > 0.01 && (
          <g
            opacity={jogjaOp}
            transform={`translate(${(-whipSbyT * 420).toFixed(1)}, 0) translate(360, 620) scale(${lerp(0.92, 1.14, easeOutCubic(jogjaLocal / 85)).toFixed(3)}) translate(-360, -620)`}
          >
            <rect width={720} height={1280} fill="url(#s2JogjaSky)" />
            <TwilightStars f={f} opacity={0.5} count={48} />
            <DriftingTwilightClouds f={f} opacity={0.28} tint="#703652" speed={0.7} />

            {/* Warm Radiant Twilight Backlight behind Tugu Yogyakarta */}
            <ellipse cx={360} cy={640} rx={380} ry={300} fill="url(#s2LampGlow)" style={{ mixBlendMode: 'screen' }} />

            {/* Far Joglo/Pendopo Rooflines & Towering Illuminated Tugu Yogyakarta (0.65x Parallax) */}
            <g transform={`translate(${lerp(24, -18, jogjaLocal / 85).toFixed(1)}, 0)`}>
              <path d="M -60 845 L 40 725 L 175 725 L 250 845 Z" fill="#251330" opacity={0.85} />
              <path d="M 480 845 L 560 715 L 690 715 L 780 845 Z" fill="#251330" opacity={0.85} />
              {/* Monumental Tugu Yogyakarta */}
              <g transform="translate(360, 848)">
                <rect x={-52} y={-44} width={104} height={44} fill="#261432" stroke="#f4b868" strokeWidth={1.6} />
                <rect x={-30} y={-235} width={60} height={191} fill="#2c1738" stroke="#f6c474" strokeWidth={1.8} />
                <polygon points="-36,-235 36,-235 18,-285 -18,-285" fill="#3e2246" stroke="#f8cc82" strokeWidth={1.4} />
                <polygon points="-9,-285 9,-285 0,-345" fill="#f8c874" />
                <circle cx={0} cy={-348} r={18} fill="url(#s2LampGlow)" style={{ mixBlendMode: 'screen' }} />
              </g>
            </g>

            {/* Warm Pendopo Floor + Hanging Crimson-Gold GMM Pennant */}
            <path d="M -60 855 Q 360 832, 780 858 L 780 1280 L -60 1280 Z" fill="#180b20" />
            <g transform="translate(115, 650)">
              <line x1={0} y1={-40} x2={0} y2={205} stroke="#442736" strokeWidth={5} />
              <polygon points="3,-32 108,-18 92,10 108,36 3,48" fill="#b81e24" stroke="#f6c474" strokeWidth={1.5} />
              <text x={48} y={14} textAnchor="middle" fill="#fff2d4" fontFamily="Georgia, serif" fontSize={18} fontWeight="bold">
                GMM
              </text>
            </g>

            {/* UNIQUE STAGING #1: Students Gathered Sitting & Leaning Around Warm Pendopo Study Table */}
            <HistoricalHumanRig f={f} x={218} y={868} scale={1.12} facing={1} role="student_male" pose="sit_circle" prop="books" wearPeci redScarf rimIntensity={0.98} rimColor="#ffca74" seed={31} idSuffix="s2y1" />
            <HistoricalHumanRig f={f} x={502} y={868} scale={1.1} facing={-1} role="student_female" pose="sit_circle" prop="books" redScarf rimIntensity={0.98} rimColor="#ffca74" seed={34} idSuffix="s2y2" />
            <HistoricalHumanRig f={f} x={360} y={854} scale={1.06} facing={1} role="student_male" pose="discuss_stand" wearPeci redScarf rimIntensity={1.0} rimColor="#ffd886" seed={37} idSuffix="s2y3" />

            {/* Low Pendopo Discussion Table with Glowing Oil Lamp & Open Manuscripts */}
            <g transform="translate(360, 792)">
              <rect x={-110} y={0} width={220} height={15} rx={4} fill="#3c212c" stroke="#f4b864" strokeWidth={1.6} />
              <rect x={-92} y={15} width={14} height={58} fill="#24121e" />
              <rect x={78} y={15} width={14} height={58} fill="#24121e" />
              <rect x={-52} y={-6} width={38} height={6} fill="#f4e6c8" />
              <rect x={22} y={-6} width={36} height={6} fill="#f4e6c8" />
              <circle cx={0} cy={-16} r={52} fill="url(#s2LampGlow)" style={{ mixBlendMode: 'screen' }} />
              <ellipse cx={0} cy={-14} rx={8} ry={12} fill="#fff4cc" />
            </g>

            <ForegroundBokehPillars offsetX={lerp(-25, 35, jogjaLocal / 85)} opacity={0.48} />
          </g>
        )}

        {/* === BEAT 3 (0:30.3–0:32.8): FULL-BLEED SURABAYA HEROIC DUSK DIORAMA (G.M. MERDEKA) === */}
        {sbyOp > 0.01 && (
          <g
            opacity={sbyOp}
            transform={`translate(${lerp(640, 0, whipSbyT) - whipJktT * 420}, 0) translate(360, 640) scale(${lerp(1.02, 1.15, easeOutCubic(sbyLocal / 82)).toFixed(3)}) translate(-360, -640)`}
          >
            <rect width={720} height={1280} fill="url(#s2SbySky)" />
            <TwilightStars f={f} opacity={0.44} count={44} />
            <DriftingTwilightClouds f={f} opacity={0.34} tint="#7a2434" speed={0.85} />

            {/* Sweeping Crimson-Gold Searchlights across Surabaya Dusk Sky */}
            {[-28, 6, 36].map((ang, si) => (
              <polygon
                key={si}
                points={`360,720 385,720 ${360 + (ang + Math.sin(f * 0.05 + si) * 5) * 12 + 70},120 ${360 + (ang + Math.sin(f * 0.05 + si) * 5) * 12 - 50},120`}
                fill={si === 1 ? '#ffe6a8' : '#e03a38'}
                opacity={0.11}
              />
            ))}

            {/* Monumental Tugu Pahlawan + Jembatan Merah + Port Crane Silhouette (0.6x Parallax) */}
            <g transform={`translate(${lerp(-28, 22, sbyLocal / 82).toFixed(1)}, 0)`}>
              {/* Surabaya Harbor Cranes Silhouette */}
              <path d="M 48 830 L 68 655 L 175 615 M 68 655 L 92 830" stroke="#2c1124" strokeWidth={5} fill="none" opacity={0.78} />
              <path d="M 655 830 L 635 665 L 535 628 M 635 665 L 610 830" stroke="#2c1124" strokeWidth={5} fill="none" opacity={0.78} />
              {/* Towering Tugu Pahlawan */}
              <g transform="translate(360, 820)">
                <polygon points="-76,0 76,0 50,-32 -50,-32" fill="#281024" stroke="#f8c26e" strokeWidth={1.6} />
                <polygon points="-24,-32 24,-32 8,-375 -8,-375" fill="#321428" stroke="#ffd082" strokeWidth={2} />
                <line x1={0} y1={-375} x2={0} y2={-38} stroke="#fff0c0" strokeOpacity={0.55} strokeWidth={2.5} />
              </g>
              {/* Jembatan Merah Steel Arch */}
              <path d="M -40 835 Q 160 765, 360 835 Q 560 765, 760 835" fill="none" stroke="#c82e30" strokeWidth={5.5} opacity={0.85} />
            </g>

            {/* Foreground Ground + Crimson-Amber Horizon Bounce */}
            <ellipse cx={360} cy={760} rx={360} ry={220} fill="url(#s2LampGlow)" opacity={0.68} style={{ mixBlendMode: 'screen' }} />
            <path d="M -60 858 Q 360 830, 780 862 L 780 1280 L -60 1280 Z" fill="#17091d" />

            {/* UNIQUE STAGING #2: Bold Low-Angle Hero Scale Surabaya Students Marching & Raising Manifesto Scroll! */}
            <HistoricalHumanRig f={f} x={lerp(135, 195, sbyLocal / 82)} y={880} scale={1.18} facing={1} role="student_male" pose="march_flag" prop="gmni_flag" wearPeci redScarf rimIntensity={1.0} rimColor="#ffbe68" seed={41} idSuffix="s2s1" />
            <HistoricalHumanRig f={f} x={lerp(330, 385, sbyLocal / 82)} y={885} scale={1.26} facing={1} role="student_male" pose="march_raise" prop="scroll" wearPeci redScarf rimIntensity={1.0} rimColor="#ffd884" seed={44} idSuffix="s2s2" />
            <HistoricalHumanRig f={f} x={lerp(510, 560, sbyLocal / 82)} y={878} scale={1.14} facing={1} role="student_female" pose="walk_books" prop="books" redScarf rimIntensity={0.96} rimColor="#ffbe68" seed={47} idSuffix="s2s3" />

            <ForegroundBokehPillars offsetX={lerp(35, -35, sbyLocal / 82)} opacity={0.5} />
          </g>
        )}

        {/* === BEAT 4 (0:32.8–0:35.5): FULL-BLEED JAKARTA COLONIAL CAMPUS STEPS (GMDI) === */}
        {jktOp > 0.01 && (
          <g
            opacity={jktOp}
            transform={`translate(${lerp(640, 0, whipJktT)}, 0) translate(360, 620) scale(${lerp(1.0, 1.15, easeOutCubic(jktLocal / 85)).toFixed(3)}) translate(-360, -620)`}
          >
            <rect width={720} height={1280} fill="url(#s2JktSky)" />
            <TwilightStars f={f} opacity={0.48} count={46} />
            <DriftingTwilightClouds f={f} opacity={0.26} tint="#5e3256" speed={0.6} />

            {/* Grand Illuminated Colonial Campus Portico & Stepped Stone Entrance */}
            <g transform={`translate(${lerp(20, -24, jktLocal / 85).toFixed(1)}, 0)`}>
              <ellipse cx={360} cy={595} rx={360} ry={290} fill="url(#s2LampGlow)" style={{ mixBlendMode: 'screen' }} />
              {/* Pediment Roof */}
              <polygon points="45,455 360,335 675,455" fill="#251332" stroke="#f4b868" strokeWidth={2} />
              <rect x={75} y={455} width={570} height={355} fill="#20112b" stroke="#f0b05e" strokeOpacity={0.45} strokeWidth={1.6} />
              {/* Warm Tall Glowing Library Arches */}
              {[185, 360, 535].map((wx, wi) => (
                <path key={wi} d={`M ${wx - 46} 765 L ${wx - 46} 575 C ${wx - 46} 520, ${wx + 46} 520, ${wx + 46} 575 L ${wx + 46} 765 Z`} fill="#f8be64" opacity={0.62 * lg} />
              ))}
              {/* 4 Tall Classical Columns */}
              {[110, 268, 452, 610].map((cx, ci) => (
                <rect key={ci} x={cx - 13} y={455} width={26} height={355} fill="#321c3e" stroke="#f6cc84" strokeOpacity={0.52} strokeWidth={1.4} />
              ))}
              {/* Wide Stepped Stone Stairway Descending to Foreground */}
              <rect x={35} y={808} width={650} height={24} fill="#2a1636" stroke="#f4b662" strokeOpacity={0.45} strokeWidth={1.2} />
              <rect x={10} y={832} width={700} height={26} fill="#23122e" stroke="#f4b662" strokeOpacity={0.38} strokeWidth={1.2} />
              <rect x={-20} y={858} width={760} height={422} fill="#180b21" />
            </g>

            {/* UNIQUE STAGING #3: Diagonal Ascending Composition — S.M. Hadiprabowo Leading on Upper Step + Cadres Ascending! */}
            <HistoricalHumanRig f={f} x={475} y={818} scale={1.06} facing={-1} role="hadiprabowo" pose="lead_meeting" rimIntensity={1.0} rimColor="#ffd886" shadowStretch={0.9} seed={51} idSuffix="s2j1" />
            <HistoricalHumanRig f={f} x={lerp(145, 215, jktLocal / 85)} y={874} scale={1.16} facing={1} role="student_male" pose="walk_books" prop="books" wearPeci redScarf rimIntensity={0.96} rimColor="#ffc46a" shadowStretch={-1.1} seed={54} idSuffix="s2j2" />
            <HistoricalHumanRig f={f} x={lerp(275, 335, jktLocal / 85)} y={846} scale={1.1} facing={1} role="student_female" pose="discuss_stand" prop="books" redScarf rimIntensity={0.96} rimColor="#ffc870" shadowStretch={-0.8} seed={57} idSuffix="s2j3" />

            <ForegroundBokehPillars offsetX={lerp(-45, 45, jktLocal / 85)} opacity={0.55} />
          </g>
        )}

        {/* Unscaled Razor-Sharp City Crest Badges (safely positioned at y=236 below ChapterHeader with zero zoom drift!) */}
        {jogjaOp > 0.02 && (
          <g opacity={jogjaOp} transform={`translate(${(360 - whipSbyT * 240).toFixed(1)}, 236)`}>
            <rect x={-268} y={-24} width={536} height={48} rx={24} fill="#1b0d24" fillOpacity={0.92} stroke="#f4b662" strokeWidth={1.6} />
            <rect x={-256} y={-14} width={34} height={28} rx={14} fill="#c42026" />
            <text x={-239} y={5} textAnchor="middle" fill="#fff4d8" fontFamily="Segoe UI, sans-serif" fontSize={12.5} fontWeight={800}>01</text>
            <text x={16} y={-2} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={15} fontWeight="bold" letterSpacing="1.6px">
              GERAKAN MAHASISWA MARHAENIS
            </text>
            <text x={16} y={15} textAnchor="middle" fill="#f4b662" fontFamily="Segoe UI, sans-serif" fontSize={11} fontWeight={700} letterSpacing="3.5px">
              YOGYAKARTA · GMM
            </text>
          </g>
        )}
        {sbyOp > 0.02 && (
          <g opacity={sbyOp} transform={`translate(${(360 + lerp(280, 0, whipSbyT) - whipJktT * 240).toFixed(1)}, 236)`}>
            <rect x={-268} y={-24} width={536} height={48} rx={24} fill="#1b0d24" fillOpacity={0.92} stroke="#e03c3c" strokeWidth={1.8} />
            <rect x={-256} y={-14} width={34} height={28} rx={14} fill="#c42026" />
            <text x={-239} y={5} textAnchor="middle" fill="#fff4d8" fontFamily="Segoe UI, sans-serif" fontSize={12.5} fontWeight={800}>02</text>
            <text x={16} y={-2} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={15.5} fontWeight="bold" letterSpacing="1.8px">
              GERAKAN MAHASISWA MERDEKA
            </text>
            <text x={16} y={15} textAnchor="middle" fill="#f4b662" fontFamily="Segoe UI, sans-serif" fontSize={11} fontWeight={700} letterSpacing="3.5px">
              SURABAYA · KOTA PAHLAWAN
            </text>
          </g>
        )}
        {jktOp > 0.02 && (
          <g opacity={jktOp} transform={`translate(${(360 + lerp(280, 0, whipJktT)).toFixed(1)}, 236)`}>
            <rect x={-278} y={-24} width={556} height={48} rx={24} fill="#1b0d24" fillOpacity={0.92} stroke="#f4b662" strokeWidth={1.6} />
            <rect x={-266} y={-14} width={34} height={28} rx={14} fill="#c42026" />
            <text x={-249} y={5} textAnchor="middle" fill="#fff4d8" fontFamily="Segoe UI, sans-serif" fontSize={12.5} fontWeight={800}>03</text>
            <text x={18} y={-2} textAnchor="middle" fill="#fcecc8" fontFamily="Georgia, serif" fontSize={14} fontWeight="bold" letterSpacing="1.2px">
              GERAKAN MAHASISWA DEMOKRAT INDONESIA
            </text>
            <text x={18} y={15} textAnchor="middle" fill="#f4b662" fontFamily="Segoe UI, sans-serif" fontSize={11} fontWeight={700} letterSpacing="3.5px">
              JAKARTA · GMDI
            </text>
          </g>
        )}

        {/* Subtle GMNI Watermark Halo Pulse during Beat 5 Convergence */}
        {mapBeat5Op > 0.2 && (
          <GmniHeritageWatermark f={f} cx={360} cy={488} scale={0.72} opacity={0.14 * starHitT * mapBeat5Op} />
        )}
      </svg>
    </AbsoluteFill>
  );
};
