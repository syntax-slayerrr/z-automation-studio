import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  DriftingTwilightClouds,
  easeInOut,
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
import { ID_CITIES, IndonesiaTwilightMap } from './IndonesiaTwilightMap';
import { HistoricalHumanRig } from './HistoricalHumanRig';

/**
 * SCENE 6 — PERJALANAN SEBUAH GERAKAN & PENUTUP RESMI [V2 CINEMATIC DYNAMIC + ICONIC GMNI FINALE]
 * 1. Full Nusantara Map sweeping zoom-out (Java -> Sabang-Merauke, Medan-Jayapura 100% safe!) as 15 branch pins & crimson-gold arcs bloom.
 * 2. Two-angle Cadre Education Hall (push-in -> close-up debate shift) featuring iconic wall banner "PEJUANG PEMIKIR · PEMIKIR PEJUANG".
 * 3. Active lateral dolly tracking shot of cadres & community solidarity among twilight village palms.
 * 4. TRUE CINEMA DOLLY MARCH: scrolling colonial skyline + streetlamps + foreground columns as GMNI cadres march carrying BOTH Merah Putih & Panji GMNI!
 * 5. GRAND OFFICIAL GMNI FINALE: Animated golden Hexagonal Shield stroke draw-in -> impact bloom -> official GMNI emblem + exact script closing text!
 */
export const Scene6MovementAndEmblem: React.FC<{ f: number }> = ({ f }) => {
  const s6Start = SCENES.s6Start;
  const totalFrames = SCENES.totalFrames;
  const localF = Math.max(0, f - s6Start);
  const lg = lampGlow(f, 31);

  const cadreT = easeInOutCubic((f - (CUES.s6_cadre - 10)) / 20);
  const socialT = easeInOutCubic((f - (CUES.s6_social - 12)) / 20);
  const marchT = easeInOutCubic((f - (CUES.s6_march - 10)) / 20);
  const logoT = easeInOutCubic((f - (CUES.s6_logo - 6)) / 26);
  const finalFadeOut = f > totalFrames - 24 ? 1 - easeInOut((f - (totalFrames - 24)) / 24) : 1;

  const mapAlpha = clamp(1 - cadreT, 0, 1);
  const cadreAlpha = clamp(cadreT * (1 - socialT), 0, 1);
  const socialAlpha = clamp(socialT * (1 - marchT), 0, 1);
  const marchAlpha = clamp(marchT * (1 - logoT), 0, 1);
  const logoAlpha = logoT;

  // Beat 1: Sweeping map zoom-out from Surabaya (1060) to Full Nusantara (745) so Medan & Jayapura fit with generous margins!
  const mapZoomOut = easeOutCubic(localF / 115);
  const mapCenterLng = lerp(113.2, 118.6, mapZoomOut);
  const mapCenterLat = lerp(-6.2, -2.6, mapZoomOut);
  const mapScale = lerp(1060, 745, mapZoomOut);

  // Beat 2: Two-stage dynamic camera inside Cadre Study Hall (push-in -> intimate close-up angle shift!)
  const cadreLocal = Math.max(0, f - (CUES.s6_cadre - 10));
  const cadreCutT = easeInOutCubic((cadreLocal - 135) / 36);
  const cadreScale = lerp(1.0, 1.12, easeOutCubic(cadreLocal / 135)) + cadreCutT * 0.16;
  const cadrePanX = lerp(14, -10, easeOutCubic(cadreLocal / 135)) - cadreCutT * 28;

  // Beat 3: Lateral dolly glide across community village solidarity
  const socialLocal = Math.max(0, f - (CUES.s6_social - 12));
  const socialPanX = lerp(34, -36, easeInOutCubic(socialLocal / 80));
  const socialScale = lerp(1.04, 1.14, easeOutCubic(socialLocal / 80));

  // Beat 4: TRUE CINEMA DOLLY MARCH (skyline, streetlamps, ground & foreground pillars continuously scroll leftward!)
  const marchLocal = Math.max(0, f - (CUES.s6_march - 10));
  const skylineScroll = (marchLocal * 1.4) % 440;
  const lampScroll = (marchLocal * 3.4) % 280;
  const fgScroll = (marchLocal * 6.2) % 860;
  const marchPush = lerp(1.0, 1.12, easeOutCubic(marchLocal / 200));

  // Beat 5: GRAND OFFICIAL GMNI EMBLEM FINALE — Hexagonal Stroke Draw-In -> Impact Bloom!
  const logoLocal = Math.max(0, f - (CUES.s6_logo - 6));
  const hexDrawProg = easeOutCubic(logoLocal / 24);
  const emblemBloom = springSettle((logoLocal - 14) / 22);
  const burstProg = easeOutCubic((logoLocal - 14) / 28);
  const shake = microShake(f, CUES.s6_logo + 8, 12, 5.5);

  const branchCities: Array<{ id: string; label: string; coord: [number, number]; delay: number; major?: boolean }> = [
    { id: 'sby', label: 'Surabaya', coord: ID_CITIES.surabaya, delay: 4, major: true },
    { id: 'jkt', label: 'Jakarta', coord: ID_CITIES.jakarta, delay: 10, major: true },
    { id: 'jog', label: 'Yogyakarta', coord: ID_CITIES.yogyakarta, delay: 16, major: true },
    { id: 'bdg', label: '', coord: ID_CITIES.bandung, delay: 22 },
    { id: 'smg', label: '', coord: ID_CITIES.semarang, delay: 26 },
    { id: 'dps', label: 'Bali', coord: ID_CITIES.denpasar, delay: 32 },
    { id: 'plm', label: '', coord: ID_CITIES.palembang, delay: 38 },
    { id: 'pdg', label: '', coord: ID_CITIES.padang, delay: 44 },
    { id: 'mdn', label: 'Medan', coord: ID_CITIES.medan, delay: 50 },
    { id: 'ptk', label: '', coord: ID_CITIES.pontianak, delay: 56 },
    { id: 'bjm', label: 'Banjarmasin', coord: ID_CITIES.banjarmasin, delay: 62 },
    { id: 'mks', label: 'Makassar', coord: ID_CITIES.makassar, delay: 68 },
    { id: 'mnd', label: 'Manado', coord: ID_CITIES.manado, delay: 74 },
    { id: 'amb', label: 'Ambon', coord: ID_CITIES.ambon, delay: 80 },
    { id: 'jyp', label: 'Jayapura', coord: ID_CITIES.jayapura, delay: 86 },
  ];

  const spreadPins = branchCities.map((c) => ({
    id: c.id,
    label: c.label,
    coord: c.coord,
    appearT: easeOutCubic((localF - c.delay) / 20),
    color: c.major ? '#d62c2c' : '#f4a844',
    major: c.major,
    labelDir: (
      c.id === 'jyp' ? 'left' :
      c.id === 'mdn' ? 'right' :
      c.id === 'jog' || c.id === 'dps' ? 'bottom' :
      'top'
    ) as 'top' | 'bottom' | 'left' | 'right',
  }));

  const spreadArcs = [
    { id: 'sp1', from: ID_CITIES.surabaya, to: ID_CITIES.medan, progress: easeOutCubic((localF - 20) / 48), color: '#e63838', bend: -32 },
    { id: 'sp2', from: ID_CITIES.surabaya, to: ID_CITIES.makassar, progress: easeOutCubic((localF - 30) / 44), color: '#f8b454', bend: -26 },
    { id: 'sp3', from: ID_CITIES.surabaya, to: ID_CITIES.banjarmasin, progress: easeOutCubic((localF - 26) / 40), color: '#f8b454', bend: -22 },
    { id: 'sp4', from: ID_CITIES.makassar, to: ID_CITIES.jayapura, progress: easeOutCubic((localF - 52) / 44), color: '#e63838', bend: -28 },
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg
        width={720}
        height={1280}
        viewBox="0 0 720 1280"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: finalFadeOut,
          transform: `translate(${shake.x.toFixed(1)}px, ${shake.y.toFixed(1)}px)`,
        }}
      >
        <defs>
          <linearGradient id="g6Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#170a22" />
            <stop offset="50%" stopColor="#421c3c" />
            <stop offset="88%" stopColor="#8c2b30" />
            <stop offset="100%" stopColor="#d47244" />
          </linearGradient>
          <radialGradient id="g6Halo" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#fff2c8" stopOpacity={0.82 * lg} />
            <stop offset="38%" stopColor="#ec8638" stopOpacity={0.38 * lg} />
            <stop offset="72%" stopColor="#c42228" stopOpacity={0.2 * lg} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="g6Glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#g6Sky)" />
        <TwilightStars f={f} opacity={0.65} count={68} />
        <DriftingTwilightClouds f={f} opacity={0.24} tint="#682844" speed={0.55} />

        {/* === BEAT 1: SWEEPING ARCHIPELAGO ZOOM-OUT (SURABAYA -> SELURUH NUSANTARA!) === */}
        {mapAlpha > 0.01 && (
          <g opacity={mapAlpha}>
            <IndonesiaTwilightMap
              f={f}
              center={[mapCenterLng, mapCenterLat]}
              scale={mapScale}
              centerY={565}
              pins={spreadPins}
              arcs={spreadArcs}
              highlightIslands={['all']}
            />
            <g transform="translate(360, 775)">
              <rect x={-225} y={-22} width={450} height={44} rx={22} fill="#1b0e25" fillOpacity={0.92} stroke="#f4b662" strokeWidth={1.6} />
              <rect x={-215} y={-12} width={6} height={24} rx={3} fill="#d4262c" />
              <rect x={209} y={-12} width={6} height={24} rx={3} fill="#d4262c" />
              <text x={0} y={5} textAnchor="middle" fill="#faecc8" fontFamily="Georgia, serif" fontSize={15} fontWeight="bold" letterSpacing="2px">
                MENYEBAR KE SELURUH NUSANTARA
              </text>
            </g>
          </g>
        )}

        {/* === BEAT 2: PENDIDIKAN KADER & DISKUSI — TWO-ANGLE DYNAMIC CAMERA + GMNI MOTTO BANNER === */}
        {cadreAlpha > 0.01 && (
          <g
            opacity={cadreAlpha}
            transform={`translate(360, 700) scale(${cadreScale.toFixed(3)}) translate(-360, -700) translate(${cadrePanX.toFixed(1)}, 0)`}
          >
            <ellipse cx={360} cy={615} rx={370} ry={300} fill="url(#g6Halo)" style={{ mixBlendMode: 'screen' }} />
            {/* Study Hall Interior Wall + Bookshelves */}
            <rect x={55} y={415} width={610} height={445} rx={12} fill="#21102a" stroke="#f0b260" strokeOpacity={0.4} strokeWidth={1.6} />
            {[520, 585, 650].map((sy, si) => (
              <line key={si} x1={90} y1={sy} x2={630} y2={sy} stroke="#3c223e" strokeWidth={6} />
            ))}
            {/* Iconic GMNI Heritage Banner on Study Hall Wall: "PEJUANG PEMIKIR · PEMIKIR PEJUANG" */}
            <g transform="translate(360, 466)">
              <rect x={-220} y={-20} width={440} height={40} rx={6} fill="#9c1b22" stroke="#f6c878" strokeWidth={1.5} />
              <text x={0} y={5} textAnchor="middle" fill="#fff2d4" fontFamily="Georgia, serif" fontSize={13.5} fontWeight="bold" letterSpacing="2.4px">
                ★ PEJUANG PEMIKIR · PEMIKIR PEJUANG ★
              </text>
            </g>
            <rect x={-80} y={860} width={880} height={420} fill="#160a1e" />

            {/* Cadres Studying, Reading & Debating in GMNI Crimson Scarves */}
            <HistoricalHumanRig f={f} x={198} y={868} scale={1.06} facing={1} role="student_male" pose="sit_meeting" prop="books" wearPeci redScarf rimIntensity={0.96} rimColor="#ffc46a" seed={101} idSuffix="s6c1" />
            <HistoricalHumanRig f={f} x={358} y={862} scale={1.1} facing={1} role="student_female" pose="lead_meeting" prop="books" redScarf rimIntensity={1.0} rimColor="#ffd482" seed={104} idSuffix="s6c2" />
            <HistoricalHumanRig f={f} x={522} y={868} scale={1.06} facing={-1} role="student_male" pose="sit_meeting" prop="books" redScarf rimIntensity={0.96} rimColor="#ffc46a" seed={107} idSuffix="s6c3" />

            <rect x={225} y={774} width={270} height={15} rx={4} fill="#3a202c" stroke="#f4b662" strokeOpacity={0.65} strokeWidth={1.6} />
            <rect x={245} y={789} width={12} height={74} fill="#241320" />
            <rect x={463} y={789} width={12} height={74} fill="#241320" />
            <ForegroundBokehPillars offsetX={cadrePanX * 0.85} opacity={0.44} />
          </g>
        )}

        {/* === BEAT 3: KEGIATAN SOSIAL BERSAMA MASYARAKAT — LATERAL TRACKING DOLLY === */}
        {socialAlpha > 0.01 && (
          <g
            opacity={socialAlpha}
            transform={`translate(360, 740) scale(${socialScale.toFixed(3)}) translate(-360, -740) translate(${socialPanX.toFixed(1)}, 0)`}
          >
            <ellipse cx={360} cy={620} rx={360} ry={290} fill="url(#g6Halo)" style={{ mixBlendMode: 'screen' }} />
            <g transform={`translate(${(-socialPanX * 0.45).toFixed(1)}, 0)`}>
              <path d="M -60 855 L -60 715 L 95 655 L 210 715 L 210 855 Z" fill="#25142e" />
              <path d="M 520 855 L 520 725 L 625 670 L 780 725 L 780 855 Z" fill="#25142e" />
            </g>
            <path d="M -100 858 Q 360 832, 820 860 L 820 1280 L -100 1280 Z" fill="#180c21" />

            <HistoricalHumanRig f={f} x={215} y={868} scale={1.08} facing={1} role="student_male" pose="social_help" prop="box" wearPeci redScarf rimIntensity={0.98} rimColor="#ffc870" seed={111} idSuffix="s6s1" />
            <HistoricalHumanRig f={f} x={358} y={868} scale={1.06} facing={-1} role="farmer" pose="discuss_stand" rimIntensity={0.96} rimColor="#ffc468" seed={114} idSuffix="s6s2" />
            <HistoricalHumanRig f={f} x={508} y={868} scale={1.06} facing={-1} role="student_female" pose="social_help" prop="books" redScarf rimIntensity={0.98} rimColor="#ffc870" seed={117} idSuffix="s6s3" />
            <ForegroundBokehPillars offsetX={socialPanX * 1.1} opacity={0.48} />
          </g>
        )}

        {/* === BEAT 4: BARISAN KADER GMNI — TRUE CINEMA DOLLY TRACK (SCROLLING SKYLINE + MERAH PUTIH & PANJI GMNI!) === */}
        {marchAlpha > 0.01 && (
          <g
            opacity={marchAlpha}
            transform={`translate(360, 720) scale(${marchPush.toFixed(3)}) translate(-360, -720)`}
          >
            <ellipse cx={360} cy={595} rx={420} ry={340} fill="url(#g6Halo)" style={{ mixBlendMode: 'screen' }} />

            {/* Continuous Scrolling Far Colonial Skyline (0.35x Parallax!) */}
            <g opacity={0.62} fill="#281434">
              {[-1, 0, 1, 2].map((si) => {
                const bx = si * 440 - skylineScroll;
                return (
                  <path
                    key={si}
                    d={`M ${bx} 855 L ${bx} 675 L ${bx + 70} 675 L ${bx + 115} 625 L ${bx + 165} 675 L ${bx + 260} 675 L ${bx + 260} 615 L ${bx + 340} 615 L ${bx + 390} 668 L ${bx + 440} 668 L ${bx + 440} 855 Z`}
                  />
                );
              })}
            </g>

            {/* Colossal Waving Sang Saka Merah Putih Sweeping Heroically Behind the Cadre Column */}
            <MerahPutihFlag2D f={f} x={52} y={850} poleH={485} flagW={625} flagH={285} windSpeed={0.15} rimOpacity={0.95} showPole={false} />

            {/* Continuous Scrolling 1950s Boulevard Streetlamps (0.9x Parallax!) */}
            {[-1, 0, 1, 2, 3].map((li) => {
              const lx = li * 280 - lampScroll;
              return (
                <g key={li} transform={`translate(${lx}, 856)`} opacity={0.78}>
                  <line x1={0} y1={0} x2={0} y2={-165} stroke="#2a1632" strokeWidth={4.5} />
                  <circle cx={12} cy={-160} r={34} fill="url(#g6Halo)" opacity={0.45} style={{ mixBlendMode: 'screen' }} />
                  <circle cx={12} cy={-160} r={4.5} fill="#fff2cc" />
                </g>
              );
            })}

            <path d="M -80 858 Q 360 834, 800 860 L 800 1280 L -80 1280 Z" fill="#170a20" />

            {/* 4 Determined Marching GMNI Cadres Carrying BOTH Merah Putih AND Iconic Panji GMNI ber-Bintang Lima! */}
            <HistoricalHumanRig f={f} x={148} y={874} scale={1.06} facing={1} role="student_male" pose="march_flag" prop="gmni_flag" wearPeci redScarf rimIntensity={1.0} rimColor="#ffd482" seed={121} idSuffix="s6m1" />
            <HistoricalHumanRig f={f} x={288} y={878} scale={1.1} facing={1} role="student_female" pose="walk_books" prop="books" redScarf rimIntensity={1.0} rimColor="#ffd482" seed={124} idSuffix="s6m2" />
            <HistoricalHumanRig f={f} x={436} y={874} scale={1.14} facing={1} role="hadiprabowo" pose="march_flag" prop="banner" redScarf rimIntensity={1.0} rimColor="#ffe096" seed={127} idSuffix="s6m3" />
            <HistoricalHumanRig f={f} x={582} y={874} scale={1.06} facing={1} role="student_male" pose="march_raise" prop="scroll" wearPeci redScarf rimIntensity={1.0} rimColor="#ffd482" seed={130} idSuffix="s6m4" />

            {/* Sweeping Fast Foreground Blurred Silhouette Column Gliding Leftward (1.7x Depth!) */}
            <g opacity={0.46} filter="url(#g6Glow)">
              <rect x={820 - fgScroll} y={240} width={58} height={740} fill="#0e0516" />
            </g>
          </g>
        )}

        {/* === BEAT 5: GRAND OFFICIAL GMNI EMBLEM FINALE — HEXAGONAL STROKE DRAW-IN + RADIAL IMPACT! === */}
        {logoAlpha > 0.01 && (
          <g opacity={logoAlpha}>
            <rect width={720} height={1280} fill="#14081c" opacity={0.92 * logoAlpha} />
            <ellipse cx={360} cy={465} rx={360} ry={340} fill="url(#g6Halo)" opacity={0.92} style={{ mixBlendMode: 'screen' }} />

            {/* Subtle Rotating GMNI Starburst Halo Behind Official Shield */}
            <GmniHeritageWatermark f={f} cx={360} cy={465} scale={1.18} opacity={0.28 * clamp(emblemBloom, 0, 1)} />

            {/* Animated Golden Hexagonal Shield Stroke Draw-In Tracing the Emblem! */}
            <polygon
              points="360,310 476,374 476,556 360,620 244,556 244,374"
              fill="none"
              stroke="#ffe096"
              strokeWidth={3.2}
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - hexDrawProg}
              opacity={0.9}
            />

            {/* Expanding Radial Shockwave Ring Right as the Official Emblem Ignites! */}
            {burstProg > 0.01 && burstProg < 0.99 && (
              <g>
                <circle cx={360} cy={465} r={lerp(60, 310, burstProg)} fill="none" stroke="#ffdf98" strokeWidth={lerp(6, 1, burstProg)} opacity={(1 - burstProg) * 0.85} />
                <circle cx={360} cy={465} r={lerp(40, 240, burstProg)} fill="none" stroke="#d4262c" strokeWidth={lerp(5, 1, burstProg)} opacity={(1 - burstProg) * 0.8} />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* === BEAT 5: OFFICIAL UPLOADED GMNI EMBLEM + EXACT CLOSING EDITORIAL TYPOGRAPHY === */}
      {logoAlpha > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 140,
            pointerEvents: 'none',
            opacity: logoAlpha * finalFadeOut,
            transform: `translate(${shake.x.toFixed(1)}px, ${shake.y.toFixed(1)}px)`,
          }}
        >
          {/* User's Official Alpha-Cleaned GMNI Hexagonal Shield Emblem */}
          <div
            style={{
              opacity: clamp(emblemBloom, 0, 1),
              transform: `scale(${lerp(0.68, 1.0, clamp(emblemBloom, 0, 1.05)).toFixed(3)})`,
              filter: 'drop-shadow(0 0 36px rgba(248, 184, 92, 0.72)) drop-shadow(0 0 18px rgba(210, 36, 42, 0.55)) drop-shadow(0 12px 24px rgba(10, 4, 16, 0.9))',
            }}
          >
            <Img
              src={staticFile('gmni-history/gmni_logo_clean.png')}
              style={{ width: 224, height: 'auto', display: 'block' }}
            />
          </div>

          {/* Exact Closing Editorial Typography from Script */}
          <div
            style={{
              marginTop: 34,
              textAlign: 'center',
              padding: '0 36px',
              opacity: easeOutCubic((logoLocal - 16) / 22),
              transform: `translateY(${lerp(22, 0, easeOutCubic((logoLocal - 16) / 22)).toFixed(1)}px)`,
            }}
          >
            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 31,
                fontWeight: 'bold',
                letterSpacing: '3px',
                lineHeight: 1.32,
                color: '#faf0dc',
                textShadow: '0 0 24px rgba(248, 184, 92, 0.72), 0 3px 10px rgba(12, 5, 18, 0.95)',
              }}
            >
              GERAKAN MAHASISWA
              <br />
              NASIONAL INDONESIA
            </div>

            {/* Iconic Merah-Putih-Merah Divider Bar */}
            <div
              style={{
                width: `${Math.round(lerp(20, 270, easeOutCubic((logoLocal - 20) / 24)))}px`,
                height: 4,
                margin: '18px auto',
                borderRadius: 2,
                background: 'linear-gradient(90deg, rgba(200,32,38,0) 0%, #d4282e 26%, #f8f2e4 50%, #d4282e 74%, rgba(200,32,38,0) 100%)',
                boxShadow: '0 0 14px rgba(214, 44, 44, 0.6)',
              }}
            />

            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 27,
                fontWeight: 'bold',
                letterSpacing: '6.5px',
                color: '#f8c46e',
                textShadow: '0 0 18px rgba(248, 184, 92, 0.65)',
              }}
            >
              23.03.1954
            </div>

            <div
              style={{
                marginTop: 14,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: 22,
                letterSpacing: '1.3px',
                color: '#f4e8d2',
                textShadow: '0 2px 8px rgba(12, 5, 18, 0.92)',
              }}
            >
              Satu Hati, Satu Jiwa, Satu Pikiran
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
