import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  DriftingTwilightClouds,
  easeInOutCubic,
  easeOutCubic,
  ForegroundBokehPillars,
  GmniHeritageWatermark,
  lampGlow,
  lerp,
  MerahPutihFlag2D,
  springSettle,
  starPoints,
  TwilightStars,
} from './fx';
import { HistoricalHumanRig } from './HistoricalHumanRig';

/**
 * SCENE 5 — MARHAENISME SEBAGAI LANDASAN PERJUANGAN [V2 CINEMATIC DYNAMIC + STRONG GMNI IDENTITY]
 * 1. Commanding Low-Angle Hero Close-Up of Bung Karno orating behind 1950s chrome ribbon microphone (rotating sunburst + waving cheering crowd!).
 * 2. Smooth camera pull-back as the 3 Marhaenisme Pillars slam in sequentially with spring settle + archival heraldic icons + Merah-Putih-Merah trim.
 * 3. Dynamic dolly reveal of Kaum Marhaen (petani, buruh, pedagang) bathed in crimson-gold dawn.
 * 4. Pull-out heroic solidarity: GMNI cadres (red scarf + Panji GMNI & books) join shoulder-to-shoulder beneath colossal waving Merah Putih!
 */
export const Scene5Marhaenisme: React.FC<{ f: number }> = ({ f }) => {
  const s5Start = SCENES.s5Start;
  const localF = Math.max(0, f - s5Start);
  const lg = lampGlow(f, 23);

  const p1T = springSettle((f - (CUES.s5_p1 - 4)) / 20);
  const p2T = springSettle((f - (CUES.s5_p2 - 4)) / 20);
  const p3T = springSettle((f - (CUES.s5_p3 - 4)) / 20);
  const marhaenT = easeInOutCubic((f - (CUES.s5_marhaen - 18)) / 22);
  const togetherT = easeInOutCubic((f - (CUES.s5_together - 16)) / 22);

  const sukarnoAlpha = clamp(1 - marhaenT, 0, 1);
  const pillarsAlpha = clamp(clamp(p1T, 0, 1) * (1 - marhaenT), 0, 1);
  const marhaenAlpha = marhaenT;

  // Beat 1-2 dynamic camera: starts heroic LOW-ANGLE CLOSE-UP on Bung Karno (scale 1.42), pulls back smoothly as 3 pillars enter!
  const bkOpenCreep = lerp(1.36, 1.46, easeOutCubic(localF / 180));
  const bkScale = lerp(bkOpenCreep, 1.06, clamp(p1T, 0, 1));
  const bkShiftY = lerp(-42, 74, clamp(p1T, 0, 1));

  // Beat 3-4 camera: starts tighter on Kaum Marhaen (1.16) then pulls wide (1.0) as GMNI cadres step into the frame!
  const b3Local = Math.max(0, f - (CUES.s5_marhaen - 18));
  const marhaenScale = lerp(1.16, 1.0, togetherT) + Math.sin(b3Local * 0.02) * 0.015;
  const marhaenPanX = lerp(-24, 0, togetherT);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="g5Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a0b24" />
            <stop offset="46%" stopColor="#521d38" />
            <stop offset="84%" stopColor="#ba302e" />
            <stop offset="100%" stopColor="#ee9448" />
          </linearGradient>
          <radialGradient id="g5Backlight" cx="50%" cy="54%" r="54%">
            <stop offset="0%" stopColor="#fff2c8" stopOpacity={0.82 * lg} />
            <stop offset="40%" stopColor="#ec8234" stopOpacity={0.38 * lg} />
            <stop offset="76%" stopColor="#c42228" stopOpacity={0.18 * lg} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={720} height={1280} fill="url(#g5Sky)" />
        <TwilightStars f={f} opacity={0.42} count={46} />
        <DriftingTwilightClouds f={f} opacity={0.28} tint="#722640" speed={0.65} />

        {/* === BEAT 1 & 2: HEROIC LOW-ANGLE BUNG KARNO PODIUM ORATION === */}
        {sukarnoAlpha > 0.01 && (
          <g opacity={sukarnoAlpha}>
            <ellipse cx={360} cy={615} rx={380} ry={340} fill="url(#g5Backlight)" style={{ mixBlendMode: 'screen' }} />
            <GmniHeritageWatermark f={f} cx={360} cy={590} scale={1.25} opacity={0.14} />

            {/* Sweeping Golden-Crimson Sunburst Rays Behind Podium */}
            {[0, 1, 2, 3, 4, 5].map((ri) => {
              const ang = -50 + ri * 20 + Math.sin(f * 0.032 + ri) * 3.5;
              return (
                <polygon
                  key={ri}
                  points={`${360 - 15},630 ${360 + 15},630 ${360 + ang * 11 + 65},130 ${360 + ang * 11 - 55},130`}
                  fill={ri % 2 === 0 ? '#ffe8b4' : '#e6423e'}
                  opacity={0.085}
                />
              );
            })}

            {/* Heroic Bung Karno Silhouette with Dynamic Low-Angle Close-Up -> Pull-Back! */}
            <g transform={`translate(360, 725) scale(${bkScale.toFixed(3)}) translate(-360, -725) translate(0, ${bkShiftY.toFixed(1)})`}>
              <HistoricalHumanRig
                f={f}
                x={325}
                y={855}
                scale={1.24}
                facing={1}
                role="bung_karno"
                pose="orate_podium"
                rimIntensity={1.0}
                rimColor="#ffd884"
                shadowStretch={-1.1}
                seed={81}
                idSuffix="s5bk"
              />
              {/* 1950s Vintage Wooden Podium with Subtle Crimson Emblem + Chrome Ribbon Microphone */}
              <polygon points="365,860 442,860 452,722 355,722" fill="#2c1628" stroke="#f6c474" strokeWidth={2} />
              <polygon points={starPoints(403, 766, 13, 5.5)} fill="#d4282c" stroke="#ffe2a4" strokeWidth={1} opacity={0.85} />
              <line x1={392} y1={722} x2={382} y2={648} stroke="#d4c4b2" strokeWidth={3.5} strokeLinecap="round" />
              <rect x={374} y={626} width={16} height={24} rx={8} fill="#888092" stroke="#fff2cc" strokeWidth={1.6} />
              <line x1={376} y1={634} x2={388} y2={634} stroke="#28182e" strokeWidth={1.2} />
              <line x1={376} y1={640} x2={388} y2={640} stroke="#28182e" strokeWidth={1.2} />
            </g>

            {/* Animated Cheering Crowd Silhouettes Below Podium (Gently Swaying & Raising Hands!) */}
            <g transform={`translate(0, ${Math.sin(f * 0.08) * 3})`}>
              <path
                d="M -20 925 Q 40 855, 95 885 Q 155 848, 215 882 Q 285 845, 360 878 Q 435 846, 505 882 Q 565 850, 625 884 Q 680 852, 740 915 L 740 1280 L -20 1280 Z"
                fill="#160a1f"
              />
              {/* Authentic Silhouetted Indonesian Crowd Heads & Peci Listening Attentively Below Podium */}
              {[58, 138, 224, 496, 582, 662].map((hx, hi) => {
                const bob = Math.sin(f * 0.09 + hi * 1.7) * 3.5;
                const hasPeci = hi % 2 === 0;
                return (
                  <g key={hi} transform={`translate(${hx}, ${884 + bob})`}>
                    {/* Shoulders */}
                    <path d="M -38 36 C -34 8, -18 -2, 0 -2 C 18 -2, 34 8, 38 36 Z" fill="#160a1f" stroke="#f4b25c" strokeOpacity={0.22} strokeWidth={1.1} />
                    {/* Head */}
                    <circle cx={0} cy={-16} r={14} fill="#160a1f" stroke="#f4b25c" strokeOpacity={0.26} strokeWidth={1.1} />
                    {hasPeci && (
                      <path d="M -14 -24 L -11 -36 C -4 -38, 4 -38, 11 -36 L 14 -24 Z" fill="#12071a" stroke="#f4b25c" strokeOpacity={0.28} strokeWidth={1} />
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        )}

        {/* === BEAT 3 & 4: KAUM MARHAEN + KADER GMNI BERSATU BERLATAR MERAH PUTIH === */}
        {marhaenAlpha > 0.01 && (
          <g
            opacity={marhaenAlpha}
            transform={`translate(360, 740) scale(${marhaenScale.toFixed(3)}) translate(-360, -740) translate(${marhaenPanX.toFixed(1)}, 0)`}
          >
            <ellipse cx={360} cy={610} rx={400} ry={320} fill="url(#g5Backlight)" style={{ mixBlendMode: 'screen' }} />

            {/* Colossal Flowing Merah Putih Flag Sweeping Behind People & Cadres! */}
            <g opacity={0.4 + togetherT * 0.6}>
              <MerahPutihFlag2D f={f} x={50} y={858} poleH={520} flagW={630} flagH={292} windSpeed={0.13} rimOpacity={0.9} showPole={false} />
            </g>

            <path d="M -80 855 Q 360 826, 800 858 L 800 1280 L -80 1280 Z" fill="#190c22" />

            {/* Kaum Marhaen Standing Dignified (Farmer, Worker, Merchant) */}
            <HistoricalHumanRig f={f} x={lerp(185, 112, togetherT)} y={868} scale={1.06} facing={1} role="farmer" pose="farm_hoe" prop="hoe" rimIntensity={0.96} rimColor="#ffd07c" shadowStretch={-1.1} seed={84} idSuffix="s5f" />
            <HistoricalHumanRig f={f} x={lerp(360, 238, togetherT)} y={866} scale={1.08} facing={1} role="worker" pose="stand_proud" rimIntensity={0.96} rimColor="#ffd07c" shadowStretch={-0.6} seed={87} idSuffix="s5w" />
            <HistoricalHumanRig f={f} x={lerp(535, 612, togetherT)} y={868} scale={1.04} facing={-1} role="merchant" pose="discuss_stand" rimIntensity={0.96} rimColor="#ffd07c" shadowStretch={1.1} seed={89} idSuffix="s5m" />

            {/* Beat 4: GMNI Cadres Stepping Shoulder-to-Shoulder with Kaum Marhaen carrying Panji GMNI & Books! */}
            {togetherT > 0.02 && (
              <g opacity={togetherT}>
                <HistoricalHumanRig f={f} x={lerp(340, 376, togetherT)} y={874} scale={1.1} facing={1} role="student_male" pose="march_flag" prop="gmni_flag" wearPeci redScarf rimIntensity={1.0} rimColor="#ffd884" seed={91} idSuffix="s5st1" />
                <HistoricalHumanRig f={f} x={lerp(530, 495, togetherT)} y={874} scale={1.06} facing={-1} role="student_female" pose="discuss_stand" prop="books" redScarf rimIntensity={1.0} rimColor="#ffd884" seed={94} idSuffix="s5st2" />
              </g>
            )}

            <ForegroundBokehPillars offsetX={lerp(30, -30, togetherT)} opacity={0.42} />
          </g>
        )}
      </svg>

      {/* === BEAT 2: THREE SEQUENTIAL MARHAENISME PILLARS (SNAPPY SPRING SLAM + HERALDIC ICONS!) === */}
      {pillarsAlpha > 0.02 && (
        <div
          style={{
            position: 'absolute',
            left: 52,
            top: 230,
            width: 616,
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
            pointerEvents: 'none',
            opacity: pillarsAlpha,
          }}
        >
          {[
            { num: 'I', label: 'SOSIO-NASIONALISME', icon: '★', t: p1T },
            { num: 'II', label: 'SOSIO-DEMOKRASI', icon: '⚖', t: p2T },
            { num: 'III', label: 'KETUHANAN YANG MAHA ESA', icon: '✦', t: p3T },
          ].map((pil, idx) => {
            const ct = clamp(pil.t, 0, 1.04);
            return (
              <div
                key={idx}
                style={{
                  opacity: clamp(pil.t, 0, 1),
                  transform: `translateX(${lerp(-52, 0, ct).toFixed(1)}px) scale(${lerp(0.95, 1.0, ct).toFixed(3)})`,
                  padding: '15px 22px',
                  borderRadius: 12,
                  background: 'linear-gradient(90deg, rgba(36,14,42,0.94) 0%, rgba(92,24,38,0.88) 100%)',
                  borderLeft: '6px solid #d4262c',
                  borderTop: '1px solid rgba(248,194,108,0.52)',
                  borderRight: '1px solid rgba(248,194,108,0.38)',
                  borderBottom: '1px solid rgba(248,194,108,0.28)',
                  boxShadow: '0 10px 26px rgba(12, 5, 18, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 23,
                      fontWeight: 'bold',
                      color: '#f8c268',
                      minWidth: 34,
                    }}
                  >
                    {pil.num}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 21.5,
                      fontWeight: 'bold',
                      letterSpacing: '1.9px',
                      color: '#fbf0d8',
                      textShadow: '0 0 14px rgba(248,194,108,0.48)',
                    }}
                  >
                    {pil.label}
                  </span>
                </div>
                <span style={{ fontSize: 20, color: '#ffd884', opacity: 0.9 }}>{pil.icon}</span>
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
