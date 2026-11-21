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
 * SCENE 4 — 23 MARET 1954: GMNI DILAHIRKAN [V2 CINEMATIC DYNAMIC + STRONG GMNI IDENTITY]
 * 1. Vertical tilt-up & zoom-in from Kalimas River/Jembatan Merah soaring up Tugu Pahlawan Surabaya.
 * 2. Forward camera dolly into Gedung Kongres Pertama as delegates stride through glowing archway.
 * 3. Heroic push-in on S.M. Hadiprabowo striking the Congress gavel (with radiating shockwave + GMNI & Merah Putih banners).
 * 4. Explosive Birth of GMNI Climax: Impact shake + Merah-Putih-Merah stage beams + rotating GMNI shield watermark + monumental 23 MARET 1954!
 */
export const Scene4Congress1954: React.FC<{ f: number }> = ({ f }) => {
  const s4Start = SCENES.s4Start;
  const localF = Math.max(0, f - s4Start);
  const lg = lampGlow(f, 17);

  const hallT = easeInOutCubic((f - (CUES.s4_hall - 14)) / 22);
  const congT = easeInOutCubic((f - (CUES.s4_congress - 10)) / 20);
  const nameT = springSettle((f - (CUES.s4_name - 6)) / 22);
  const dateT = springSettle((f - (CUES.s4_date - 10)) / 22);

  const cityAlpha = clamp(1 - hallT, 0, 1);
  const hallAlpha = clamp(hallT * (1 - congT), 0, 1);
  const congAlpha = clamp(congT * (1 - clamp(nameT, 0, 1) * 0.56), 0, 1);

  // Beat 1: Tilt-up & zoom-in along Tugu Pahlawan Surabaya
  const b1Prog = clamp(localF / Math.max(1, CUES.s4_hall - s4Start), 0, 1);
  const sbyScale = lerp(0.98, 1.18, easeOutCubic(b1Prog));
  const sbyTiltY = lerp(-42, 48, easeInOutCubic(b1Prog));

  // Beat 2: Forward dolly into lit Congress Hall doorway
  const hallLocal = Math.max(0, f - (CUES.s4_hall - 14));
  const hallScale = lerp(0.96, 1.18, easeOutCubic(hallLocal / 95));

  // Beat 3: Dramatic push-in to Hadiprabowo striking the gavel!
  const congLocal = Math.max(0, f - (CUES.s4_congress - 10));
  const congScale = lerp(1.0, 1.22, easeOutCubic(congLocal / 70));

  // Beat 4-5: Continuous dramatic creep zoom + double impact micro-shakes (at GMNI birth & 23 Maret 1954!)
  const climaxLocal = Math.max(0, f - (CUES.s4_name - 6));
  const climaxCreepScale = lerp(0.96, 1.07, clamp(climaxLocal / 340, 0, 1));
  const shake1 = microShake(f, CUES.s4_name - 4, 14, 7.5);
  const shake2 = microShake(f, CUES.s4_date - 8, 12, 5.5);
  const sx = shake1.x + shake2.x;
  const sy = shake1.y + shake2.y;
  const burstProg = easeOutCubic((f - (CUES.s4_name - 6)) / 30);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg
        width={720}
        height={1280}
        viewBox="0 0 720 1280"
        style={{ position: 'absolute', inset: 0, transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)` }}
      >
        <defs>
          <linearGradient id="g4Dawn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1b0d29" />
            <stop offset="44%" stopColor="#52203e" />
            <stop offset="80%" stopColor="#be3c34" />
            <stop offset="100%" stopColor="#f29c4c" />
          </linearGradient>
          <radialGradient id="g4Stage" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#fff2c8" stopOpacity={0.78 * lg} />
            <stop offset="40%" stopColor="#ec8234" stopOpacity={0.38 * lg} />
            <stop offset="75%" stopColor="#c42228" stopOpacity={0.18 * lg} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <filter id="g4Glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill="url(#g4Dawn)" />
        <TwilightStars f={f} opacity={0.45} count={48} />
        <DriftingTwilightClouds f={f} opacity={0.3} tint="#6e2944" speed={0.65} />

        {/* === BEAT 1: SURABAYA 1954 — TILT-UP ALONG TUGU PAHLAWAN & JEMBATAN MERAH === */}
        {cityAlpha > 0.01 && (
          <g
            opacity={cityAlpha}
            transform={`translate(360, 660) scale(${sbyScale.toFixed(3)}) translate(-360, -660) translate(0, ${sbyTiltY.toFixed(1)})`}
          >
            <circle cx={360} cy={650} r={260} fill="url(#g4Stage)" style={{ mixBlendMode: 'screen' }} />
            {/* Sweeping Sunrise Beams behind Tugu Pahlawan */}
            {[-30, -8, 14, 34].map((ang, ri) => (
              <polygon
                key={ri}
                points={`360,680 385,680 ${360 + (ang + Math.sin(f * 0.04 + ri) * 3) * 11 + 65},120 ${360 + (ang + Math.sin(f * 0.04 + ri) * 3) * 11 - 55},120`}
                fill="#ffe6b0"
                opacity={0.09}
              />
            ))}
            {/* Far 1954 Surabaya Rooftops */}
            <path
              d="M -60 785 L -60 655 L 70 655 L 105 612 L 155 655 L 250 655 L 250 618 L 485 618 L 535 580 L 585 628 L 780 628 L 780 880 L -60 880 Z"
              fill="#291534"
            />
            {/* Towering Tugu Pahlawan Surabaya */}
            <g transform="translate(360, 785)">
              <polygon points="-76,0 76,0 52,-32 -52,-32" fill="#23122e" stroke="#f6be6a" strokeOpacity={0.55} strokeWidth={1.6} />
              <polygon points="-24,-32 24,-32 9,-355 -9,-355" fill="#2d1636" stroke="#f8c878" strokeOpacity={0.82} strokeWidth={2.2} />
              <line x1={0} y1={-355} x2={0} y2={-38} stroke="#ffe4a4" strokeOpacity={0.55} strokeWidth={2.4} />
            </g>
            {/* Jembatan Merah Steel Arch Bridge & Shimmering Kalimas River */}
            <path d="M -40 825 L 760 825" stroke="#982228" strokeWidth={8} />
            <path d="M 60 825 Q 210 745, 360 825 Q 510 745, 660 825" fill="none" stroke="#cf2e30" strokeWidth={5.5} />
            <rect x={-40} y={830} width={800} height={450} fill="#180c22" />
            {[110, 230, 360, 490, 610].map((rx, ri) => (
              <rect
                key={ri}
                x={rx - 28 + Math.sin(f * 0.1 + ri) * 10}
                y={858 + (ri % 3) * 22}
                width={58}
                height={3.8}
                rx={2}
                fill="#f6b662"
                opacity={0.44}
              />
            ))}
            <g transform="translate(360, 338)">
              <rect x={-135} y={-18} width={270} height={36} rx={18} fill="#1a0d23" fillOpacity={0.9} stroke="#f4b662" strokeWidth={1.4} />
              <text x={0} y={5} textAnchor="middle" fill="#faecc8" fontFamily="Georgia, serif" fontSize={14.5} fontWeight="bold" letterSpacing="2.6px">
                SURABAYA · 1954
              </text>
            </g>
          </g>
        )}

        {/* === BEAT 2: GEDUNG KONGRES PERTAMA — FORWARD DOLLY PUSH-IN === */}
        {hallAlpha > 0.01 && (
          <g
            opacity={hallAlpha}
            transform={`translate(360, 740) scale(${hallScale.toFixed(3)}) translate(-360, -740)`}
          >
            <ellipse cx={360} cy={670} rx={360} ry={280} fill="url(#g4Stage)" style={{ mixBlendMode: 'screen' }} />
            <g transform="translate(360, 860)">
              <rect x={-265} y={-270} width={530} height={270} fill="#23132c" stroke="#f0b05e" strokeOpacity={0.5} strokeWidth={1.8} />
              <polygon points="-285,-270 0,-360 285,-270" fill="#2c1736" stroke="#f4b868" strokeWidth={2} />
              <path d="M -68 0 L -68 -148 C -68 -205, 68 -205, 68 -148 L 68 0 Z" fill="#ffd27c" opacity={0.85 * lg} />
              <rect x={-195} y={-252} width={390} height={40} rx={5} fill="#b41e24" stroke="#ffe2a4" strokeWidth={1.8} />
              <text x={0} y={-227} textAnchor="middle" fill="#fff4d8" fontFamily="Georgia, serif" fontSize={15} fontWeight="bold" letterSpacing="2.8px">
                KONGRES PERTAMA · 1954
              </text>
            </g>
            <MerahPutihFlag2D f={f} x={72} y={860} poleH={305} flagW={120} flagH={70} />
            <rect x={-60} y={860} width={840} height={420} fill="#180c21" />

            <HistoricalHumanRig f={f} x={lerp(120, 275, hallT)} y={872} scale={0.98} facing={1} role="student_male" pose="walk_books" prop="books" wearPeci redScarf rimIntensity={0.96} rimColor="#ffc870" seed={61} idSuffix="s4w1" />
            <HistoricalHumanRig f={f} x={lerp(605, 448, hallT)} y={872} scale={0.96} facing={-1} role="student_female" pose="walk_books" prop="books" redScarf rimIntensity={0.96} rimColor="#ffc870" seed={64} idSuffix="s4w2" />
            <HistoricalHumanRig f={f} x={lerp(235, 345, hallT)} y={866} scale={0.94} facing={1} role="hadiprabowo" pose="walk_books" rimIntensity={1.0} rimColor="#ffd07c" seed={67} idSuffix="s4w3" />

            <ForegroundBokehPillars offsetX={lerp(0, -60, hallLocal / 95)} opacity={0.48} />
          </g>
        )}

        {/* === BEAT 3: SUASANA KONGRES PERTAMA & KETUKAN PALU S.M. HADIPRABOWO === */}
        {congAlpha > 0.01 && (
          <g
            opacity={congAlpha}
            transform={`translate(360, 680) scale(${congScale.toFixed(3)}) translate(-360, -680)`}
          >
            <rect x={-80} y={-80} width={880} height={1440} fill="#1b0e25" />
            <ellipse cx={360} cy={565} rx={380} ry={340} fill="url(#g4Stage)" style={{ mixBlendMode: 'screen' }} />
            <path d="M 55 855 L 55 395 C 55 280, 665 280, 665 395 L 665 855 Z" fill="#251430" stroke="#f0b260" strokeOpacity={0.4} strokeWidth={2} />
            <MerahPutihFlag2D f={f} x={145} y={765} poleH={285} flagW={115} flagH={68} windSpeed={0.09} />
            {/* Crimson Congress Banner Crest on Right of Podium */}
            <g transform="translate(555, 485)">
              <line x1={0} y1={-5} x2={0} y2={280} stroke="#442736" strokeWidth={5} />
              <rect x={-88} y={8} width={84} height={116} rx={3} fill="#b81e24" stroke="#f6c474" strokeWidth={1.6} />
              <rect x={-58} y={8} width={24} height={116} fill="#f4ede0" />
              <polygon points={starPoints(-46, 56, 22, 9)} fill="#c42026" stroke="#180c1c" strokeWidth={1.2} />
            </g>

            {/* Chairman Podium Platform + S.M. Hadiprabowo Swinging Gavel! */}
            <rect x={170} y={762} width={380} height={24} fill="#341e32" stroke="#f4b662" strokeOpacity={0.55} strokeWidth={1.5} />
            <HistoricalHumanRig f={f} x={360} y={764} scale={1.1} facing={1} role="hadiprabowo" pose="lead_meeting" prop="gavel" rimIntensity={1.0} rimColor="#ffd07c" seed={71} idSuffix="s4chair" />
            <polygon points="365,764 415,764 422,670 358,670" fill="#42242c" stroke="#f4b662" strokeWidth={1.6} />

            {/* Subtle Gavel Sound-Pulse Rings Radiating from Lectern */}
            <circle cx={392} cy={670} r={24 + ((f * 3) % 75)} fill="none" stroke="#ffe4a4" strokeWidth={1.8} opacity={0.45 * (1 - ((f * 3) % 75) / 75)} />

            <rect x={-80} y={786} width={880} height={494} fill="#150a1e" />
            {[115, 225, 495, 605].map((dx, di) => (
              <HistoricalHumanRig
                key={di}
                f={f}
                x={dx}
                y={892}
                scale={0.94}
                facing={dx < 360 ? 1 : -1}
                role={di % 2 === 0 ? 'student_male' : 'student_female'}
                pose="sit_meeting"
                wearPeci={di % 2 === 0}
                redScarf
                rimIntensity={0.86}
                rimColor="#f8b65c"
                seed={74 + di}
                idSuffix={`s4del${di}`}
              />
            ))}
          </g>
        )}

        {/* === BEAT 4 & 5 CLIMAX BACKDROP: GMNI HERITAGE WATERMARK + MERAH-PUTIH-MERAH THEATRICAL BEAMS! === */}
        {nameT > 0.01 && (
          <g opacity={clamp(nameT, 0, 1)}>
            <rect width={720} height={1280} fill="#16091e" opacity={0.72 * clamp(nameT, 0, 1)} />
            {/* Theatrical Crimson-White-Crimson Vertical Light Pillars */}
            <rect x={120} y={140} width={110} height={820} fill="#c41e24" opacity={0.14} filter="url(#g4Glow)" />
            <rect x={305} y={140} width={110} height={820} fill="#f6efe2" opacity={0.09} filter="url(#g4Glow)" />
            <rect x={490} y={140} width={110} height={820} fill="#c41e24" opacity={0.14} filter="url(#g4Glow)" />
            <ellipse cx={360} cy={520} rx={370} ry={290} fill="url(#g4Stage)" opacity={0.82 * clamp(nameT, 0, 1)} style={{ mixBlendMode: 'screen' }} />

            {/* Iconic Rotating GMNI Hexagonal Shield & 5-Pointed Star Heritage Watermark */}
            <GmniHeritageWatermark f={f} cx={360} cy={520} scale={1.38} opacity={0.22 * clamp(nameT, 0, 1)} />

            {/* Expanding Birth-of-GMNI Shockwave Ring */}
            {burstProg > 0.01 && burstProg < 0.99 && (
              <circle cx={360} cy={520} r={lerp(40, 360, burstProg)} fill="none" stroke="#ffdf98" strokeWidth={lerp(7, 1, burstProg)} opacity={(1 - burstProg) * 0.85} />
            )}
          </g>
        )}
      </svg>

      {/* === BEAT 4 & 5: DRAMATIC MONUMENTAL HISTORICAL TYPOGRAPHY REVEAL === */}
      {nameT > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 330,
            width: 720,
            textAlign: 'center',
            pointerEvents: 'none',
            opacity: clamp(nameT, 0, 1),
            transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${(lerp(0.84, 1.0, clamp(nameT, 0, 1.06)) * climaxCreepScale).toFixed(3)})`,
          }}
        >
          {/* Archival Congress Stamp Overline */}
          <div
            style={{
              display: 'inline-block',
              marginBottom: 14,
              padding: '5px 20px',
              borderRadius: 16,
              background: 'rgba(26, 12, 34, 0.86)',
              border: '1px solid rgba(246, 194, 114, 0.55)',
              fontFamily: 'Segoe UI, Arial, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '4.2px',
              color: '#f6ca7c',
            }}
          >
            ★ KONGRES PERTAMA · SURABAYA ★
          </div>

          {/* Monumental Date Stamp "23 MARET 1954" */}
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: dateT > 0.1 ? 68 : 54,
              fontWeight: 'bold',
              letterSpacing: '5px',
              color: '#fcecc8',
              textShadow: '0 0 36px rgba(248, 180, 86, 0.92), 0 0 18px rgba(210, 42, 42, 0.55), 0 4px 14px rgba(14, 6, 22, 0.95)',
            }}
          >
            23 MARET 1954
          </div>

          {/* Merah-Putih-Merah Shimmer Divider Bar */}
          <div
            style={{
              width: `${Math.round(lerp(40, 420, easeOutCubic(clamp(nameT, 0, 1))))}px`,
              height: 4.5,
              margin: '18px auto',
              borderRadius: 3,
              background: 'linear-gradient(90deg, rgba(198,32,38,0) 0%, #d4282e 26%, #f8f2e4 50%, #d4282e 74%, rgba(198,32,38,0) 100%)',
              boxShadow: '0 0 16px rgba(214, 44, 44, 0.65)',
            }}
          />

          {/* Dramatic Full Organization Name */}
          <div
            style={{
              padding: '0 44px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 34,
              fontWeight: 'bold',
              lineHeight: 1.32,
              letterSpacing: '3.2px',
              color: '#f8eed8',
              textShadow: '0 0 24px rgba(240, 170, 88, 0.7), 0 3px 10px rgba(14, 6, 22, 0.95)',
            }}
          >
            GERAKAN MAHASISWA
            <br />
            NASIONAL INDONESIA
          </div>

          {/* Iconic Crimson GMNI Seal Badge */}
          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 30px',
              borderRadius: 30,
              background: 'linear-gradient(135deg, #9c181e 0%, #d4282e 50%, #9c181e 100%)',
              border: '1.8px solid #f6ca7c',
              fontFamily: 'Segoe UI, Arial, sans-serif',
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '6px',
              color: '#fff6e0',
              boxShadow: '0 0 28px rgba(214, 44, 44, 0.65)',
            }}
          >
            <span style={{ color: '#ffe4a4', letterSpacing: 0 }}>★</span>
            <span>GMNI</span>
            <span style={{ color: '#ffe4a4', letterSpacing: 0 }}>★</span>
          </div>

          {dateT > 0.05 && (
            <div
              style={{
                marginTop: 22,
                opacity: clamp(dateT, 0, 1),
                transform: `translateY(${lerp(14, 0, clamp(dateT, 0, 1)).toFixed(1)}px)`,
                fontFamily: 'Segoe UI, Arial, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '4.5px',
                color: '#f4c87e',
                textShadow: '0 2px 6px rgba(14, 6, 22, 0.9)',
              }}
            >
              KETUA UMUM PERTAMA · S.M. HADIPRABOWO
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
