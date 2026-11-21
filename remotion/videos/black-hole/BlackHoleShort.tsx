import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { BlackHoleGL } from './BlackHoleGL';
import {
  BLACK_HOLE_FPS,
  BLACK_HOLE_FRAMES,
  CUES,
  SCENES,
  SUBTITLE_CARDS,
} from './story';

export { BLACK_HOLE_FPS, BLACK_HOLE_FRAMES };

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp(t, 0, 1);
const easeInOut = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
const easeOutCubic = (t: number): number => {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
};

export const BlackHoleShort: React.FC = () => {
  const f = useCurrentFrame();
  const { s2Start, s3Start, s4Start, s5Start, s6Start, s7Start, totalFrames } = SCENES;
  const s3bStart = CUES.s3_horizon + 24;

  // --- Editorial Top Serif Telemetry (preserving warm refined aesthetic inside 9:16 safe area) ---
  let headerTitle = '';
  let headerSub = '';
  let headerAlpha = 1;
  let accentColor = '#ffe29c';

  if (f < s2Start - 10) {
    headerTitle = 'LUBANG HITAM';
    headerSub = 'DILATASI WAKTU';
    headerAlpha = f < s2Start - 22 ? 1 : easeInOut((s2Start - 10 - f) / 12);
    accentColor = '#ffe094';
  } else if (f < s3Start - 8) {
    headerTitle = '1,5 RS';
    headerSub = 'BOLA FOTON';
    headerAlpha =
      easeInOut((f - (s2Start - 4)) / 10) *
      (f > s3Start - 18 ? easeInOut((s3Start - 8 - f) / 10) : 1);
    accentColor = '#ffd584';
  } else if (f < s4Start - 8) {
    headerTitle = '1,0 RS';
    headerSub = 'EVENT HORIZON';
    const hushDim =
      f >= CUES.s3_hening - 4 && f <= CUES.s3_sky - 14
        ? lerp(1, 0.32, easeInOut((f - (CUES.s3_hening - 4)) / 14))
        : 1;
    headerAlpha =
      easeInOut((f - (s3Start - 2)) / 10) *
      (f > s4Start - 18 ? easeInOut((s4Start - 8 - f) / 10) : 1) *
      hushDim;
    accentColor = '#ff9a72';
  } else if (f < s5Start - 8) {
    headerTitle = 'RUANG ↔ WAKTU';
    headerSub = 'MASA DEPANMU';
    headerAlpha =
      easeInOut((f - (s4Start - 2)) / 10) *
      (f > s5Start - 18 ? easeInOut((s5Start - 8 - f) / 10) : 1);
    accentColor = '#dec4ff';
  } else if (f < s6Start - 8) {
    headerTitle = 'GAYA PASANG';
    headerSub = 'SPAGHETTIFICATION';
    headerAlpha =
      easeInOut((f - (s5Start - 2)) / 10) *
      (f > s6Start - 18 ? easeInOut((s6Start - 8 - f) / 10) : 1);
    accentColor = '#ffb868';
  } else if (f < s7Start - 8) {
    headerTitle = '∞';
    headerSub = 'SINGULARITAS';
    headerAlpha =
      easeInOut((f - (s6Start - 2)) / 10) *
      (f > s7Start - 18 ? easeInOut((s7Start - 8 - f) / 10) : 1);
    accentColor = '#fff6dc';
  } else {
    headerTitle = 'SAGITTARIUS A*';
    headerSub = '4 JUTA MATAHARI';
    // Gentle fade-out on final 18 frames so Frame N-1 blends invisibly into Frame 0 seamless loop!
    headerAlpha =
      easeInOut((f - (s7Start + 4)) / 14) *
      (f > totalFrames - 22 ? easeInOut((totalFrames - 4 - f) / 18) : 1);
    accentColor = '#ffe094';
  }

  // --- Scene-Specific Pure-Code Optical & Editorial Overlays ---
  // 1. Subtle First-Person Curved Helmet Glass Reflection Rim (S2 & S3a dive into Event Horizon)
  const visorAlpha =
    f >= s2Start - 6 && f < s3bStart + 18
      ? easeInOut((f - (s2Start - 6)) / 14) *
        (1 - easeInOut((f - (s3bStart - 6)) / 24))
      : 0;

  // 2. S2b Photon Sphere Bent-Light Mirror Arc connecting 3D Astronaut -> Glowing 3D Back Reflection!
  const mirrorArcAlpha =
    f >= CUES.s2_mirror - 14 && f < s3Start + 6
      ? easeInOut((f - (CUES.s2_mirror - 14)) / 22) * (1 - easeInOut((f - (s3Start - 10)) / 16))
      : 0;

  // 3. S5 Tidal Force Comparison Vectors (pure crisp editorial graphics flanking 3D stretching astronaut)
  const s5VecAlpha =
    f >= s5Start + 12 && f < CUES.s5_atoms + 8
      ? easeInOut((f - (s5Start + 12)) / 18) * (1 - easeInOut((f - (CUES.s5_atoms - 12)) / 18))
      : 0;
  const s5StretchP = easeInOut((f - (CUES.s5_stretch - 14)) / Math.max(1, CUES.s5_atoms - CUES.s5_stretch + 8));

  // 4. S6 Etched General Relativity Field Equation Fracturing cleanly in sync with 3D shattering rings!
  const s6EqAlpha =
    f >= s6Start && f < s7Start - 6
      ? easeInOut((f - s6Start) / 20) * (1 - easeInOut((f - (s7Start - 22)) / 16))
      : 0;
  const s6CrackT = easeOutCubic((f - (CUES.s6_crack - 6)) / 56);

  // 5. Optical Transition Lens-Flare Wash on S1->S2 Whip-Push & S5->S6 Flash Cut
  const whipFlare =
    f >= s2Start - 12 && f <= s2Start + 10
      ? Math.sin(clamp((f - (s2Start - 12)) / 22, 0, 1) * Math.PI) * 0.42
      : 0;
  const flashCut =
    f >= s6Start - 10 && f <= s6Start + 12
      ? Math.sin(clamp((f - (s6Start - 10)) / 22, 0, 1) * Math.PI) * 0.68
      : 0;

  // --- Active Cinema Karaoke Subtitle Card (Exact ElevenLabs Word Timestamps) ---
  const activeCard = SUBTITLE_CARDS.find((c) => f >= c.startFrame && f <= c.endFrame);
  let activeWordIdx = -1;
  if (activeCard) {
    for (const [hs, he, wi] of activeCard.highlights) {
      if (f >= hs && f <= he) {
        activeWordIdx = wi;
        break;
      }
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#020207', overflow: 'hidden', width: 720, height: 1280 }}>
      {/* Broadcast-Mastered ElevenLabs v4 + Bespoke Sound-V3 SFX + CC0 Foley + Mixkit #723 Score */}
      <Audio src={staticFile('black-hole/audio_master.m4a')} />

      {/* 1. 100% Pure-Code Real-Time 3D WebGL GLSL Raymarched Black Hole + 3D PBR Hero Objects & Particles */}
      <BlackHoleGL f={f} />

      {/* 2. Pure-Code Curved Helmet Visor Optical Rim Reflections (S2 & S3a Dive) */}
      {visorAlpha > 0.01 && (
        <svg
          width={720}
          height={1280}
          style={{ position: 'absolute', left: 0, top: 0, opacity: visorAlpha, pointerEvents: 'none' }}
        >
          {/* Soft dark curved visor peripheral vignette */}
          <defs>
            <radialGradient id="visorEdge" cx="50%" cy="50%" r="64%">
              <stop offset="68%" stopColor="rgba(0,0,0,0)" />
              <stop offset="92%" stopColor="rgba(4,5,12,0.52)" />
              <stop offset="100%" stopColor="rgba(2,3,8,0.88)" />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={720} height={1280} fill="url(#visorEdge)" />
          {/* Delicate curved golden-amber glass rim catchlights along left & right visor curvature */}
          <path
            d="M 48 160 Q 14 640, 48 1120"
            fill="none"
            stroke="rgba(255,198,122,0.34)"
            strokeWidth={2.4}
          />
          <path
            d="M 672 160 Q 706 640, 672 1120"
            fill="none"
            stroke="rgba(255,198,122,0.28)"
            strokeWidth={2.0}
          />
          {/* Subtle micro telemetry horizon ticks tucked quietly along outer visor edge */}
          <path
            d="M 58 580 L 70 580 M 54 640 L 74 640 M 58 700 L 70 700"
            stroke="rgba(164,224,255,0.42)"
            strokeWidth={1.6}
          />
          <path
            d="M 650 580 L 662 580 M 646 640 L 666 640 M 650 700 L 662 700"
            stroke="rgba(164,224,255,0.42)"
            strokeWidth={1.6}
          />
        </svg>
      )}

      {/* 3. S2b Curved Golden Photon-Orbit Ray connecting 3D Astronaut to 3D Back-of-Head Reflection */}
      {mirrorArcAlpha > 0.01 && (
        <svg
          width={720}
          height={1280}
          style={{ position: 'absolute', left: 0, top: 0, opacity: mirrorArcAlpha * 0.85, pointerEvents: 'none' }}
        >
          <path
            d="M 192 560 C 235 335, 495 335, 535 552"
            fill="none"
            stroke="#ffe098"
            strokeWidth={2.2}
            strokeDasharray="10 7"
          />
          <circle cx={192} cy={560} r={4.5} fill="#fff4d6" />
          <circle cx={535} cy={552} r={4.5} fill="#fff4d6" />
          <text
            x={362}
            y={374}
            textAnchor="middle"
            fill="#ffe5aa"
            fontSize={13}
            fontWeight="bold"
            fontFamily="Segoe UI, sans-serif"
            letterSpacing="3px"
          >
            CAHAYA MELENGKUNG 180°
          </text>
        </svg>
      )}

      {/* 4. S5 Crisp Minimalist Tidal Gradient Force Callouts flanking 3D Spaghettification */}
      {s5VecAlpha > 0.01 && (
        <svg
          width={720}
          height={1280}
          style={{ position: 'absolute', left: 0, top: 0, opacity: s5VecAlpha, pointerEvents: 'none' }}
        >
          {/* Gentle pull at head */}
          <line x1={476} y1={430} x2={476} y2={474} stroke="#c8b4f4" strokeWidth={2.6} strokeLinecap="round" />
          <polygon points="476,485 469,472 483,472" fill="#c8b4f4" />
          <text x={494} y={462} fill="#dfd2fb" fontSize={14} fontWeight="bold" fontFamily="Segoe UI, sans-serif" letterSpacing="1.6px">
            KEPALA
          </text>

          {/* Violent blazing pull at boots */}
          <line
            x1={476}
            y1={640}
            x2={476}
            y2={lerp(765, 865, s5StretchP)}
            stroke="#ffaa48"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <polygon
            points={`476,${lerp(784, 886, s5StretchP)} 464,${lerp(760, 862, s5StretchP)} 488,${lerp(760, 862, s5StretchP)}`}
            fill="#ffe08c"
          />
          <text x={494} y={732} fill="#ffe4a4" fontSize={15} fontWeight="bold" fontFamily="Segoe UI, sans-serif" letterSpacing="1.4px">
            KAKI (×10⁶ G)
          </text>
        </svg>
      )}

      {/* 5. S6 Glowing Etched Serif General Relativity Field Equation fracturing cleanly on CUES.s6_crack */}
      {s6EqAlpha > 0.01 && (
        <svg
          width={720}
          height={1280}
          style={{ position: 'absolute', left: 0, top: 0, opacity: s6EqAlpha, pointerEvents: 'none' }}
        >
          {[
            { txt: 'Gμν', x: 224, y: 452, vx: -48, vy: -36, vr: -16 },
            { txt: '=', x: 310, y: 452, vx: -10, vy: -46, vr: 18 },
            { txt: '8πG / c⁴', x: 404, y: 452, vx: 34, vy: -38, vr: 14 },
            { txt: 'Tμν', x: 498, y: 452, vx: 60, vy: -24, vr: -18 },
            { txt: 'r → 0   ·   ρ → ∞', x: 360, y: 822, vx: 6, vy: 46, vr: 8 },
          ].map((eq, idx) => {
            const tx = eq.x + s6CrackT * eq.vx;
            const ty = eq.y + s6CrackT * eq.vy;
            return (
              <text
                key={idx}
                x={tx}
                y={ty}
                textAnchor="middle"
                fill="#fff3d2"
                fontSize={idx === 4 ? 22 : 30}
                fontStyle="italic"
                fontWeight="bold"
                fontFamily="Times New Roman, serif"
                opacity={clamp(1 - s6CrackT * 0.62, 0.22, 1)}
                transform={`rotate(${(s6CrackT * eq.vr).toFixed(1)}, ${tx.toFixed(1)}, ${ty.toFixed(1)})`}
              >
                {eq.txt}
              </text>
            );
          })}
        </svg>
      )}

      {/* 6. Optical Cinema Transition Flares (Anamorphic Gold Whip + White-Gold Flash Cut) */}
      {whipFlare > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(ellipse 140% 24% at 50% 50%, rgba(255,222,150,${whipFlare}) 0%, rgba(255,148,54,${whipFlare * 0.45}) 42%, rgba(0,0,0,0) 78%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {flashCut > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 50%, rgba(255,250,235,${flashCut}) 0%, rgba(255,204,112,${flashCut * 0.55}) 45%, rgba(0,0,0,0) 88%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 7. Warm Editorial Serif Top Telemetry Header (Safe Area: y=108..232) */}
      {headerTitle && headerAlpha > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 360,
            top: 0,
            width: 0,
            opacity: headerAlpha,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -320,
              top: headerTitle === '∞' ? 92 : 122,
              width: 640,
              textAlign: 'center',
              color: accentColor,
              fontFamily: 'Times New Roman, serif',
              fontSize: headerTitle === '∞' ? 136 : headerTitle.length > 10 ? 50 : 84,
              lineHeight: 1.02,
              fontWeight: 'bold',
              letterSpacing: headerTitle.length > 10 ? '2.4px' : '5px',
              textShadow: '0 4px 22px rgba(2,2,8,0.95), 0 0 26px rgba(255,176,72,0.42)',
            }}
          >
            {headerTitle}
          </div>
          {headerSub && (
            <div
              style={{
                position: 'absolute',
                left: -280,
                top: headerTitle === '∞' ? 216 : headerTitle.length > 10 ? 188 : 218,
                width: 560,
                textAlign: 'center',
                color: '#f2ece0',
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '7.2px',
                textShadow: '0 2px 10px rgba(2,2,8,0.95)',
              }}
            >
              {headerSub}
            </div>
          )}
        </div>
      )}

      {/* 8. Sleek High-Contrast Floating Cinema Karaoke Subtitles (Safe Area: y=955..1065, Zero Clunky Box!) */}
      {activeCard && (() => {
        const sf = activeCard.startFrame;
        // Frame-0 Hook Rule: immediately crisp on Frame 0!
        const popT = sf === 0 ? 1 : easeOutCubic((f - sf) / 5);
        const yOff = lerp(8, 0, popT);
        let wordCursor = 0;

        return (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: activeCard.lines.length === 1 ? 964 : 940,
              width: 720,
              opacity: popT,
              transform: `translateY(${yOff}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 46px',
              boxSizing: 'border-box',
              background: 'radial-gradient(ellipse 58% 48% at 50% 50%, rgba(2,2,10,0.68) 0%, rgba(2,2,10,0.28) 58%, rgba(2,2,10,0) 100%)',
              pointerEvents: 'none',
            }}
          >
            {activeCard.lines.map((line, li) => {
              const words = line.split(' ');
              return (
                <div
                  key={li}
                  style={{
                    fontFamily: 'Segoe UI, Arial, sans-serif',
                    fontSize: 33,
                    fontWeight: 800,
                    lineHeight: 1.28,
                    textAlign: 'center',
                    letterSpacing: '-0.2px',
                    textShadow: '0 3px 14px rgba(0,0,0,0.96), 0 1px 3px rgba(0,0,0,1)',
                  }}
                >
                  {words.map((w, wi) => {
                    const idx = wordCursor++;
                    const isActive = idx === activeWordIdx;
                    return (
                      <span
                        key={wi}
                        style={{
                          color: isActive ? '#ffbc4c' : '#f8f5ee',
                          textShadow: isActive
                            ? '0 0 18px rgba(255,168,54,0.75), 0 3px 12px rgba(0,0,0,0.95)'
                            : '0 3px 14px rgba(0,0,0,0.96), 0 1px 3px rgba(0,0,0,1)',
                          marginRight: wi < words.length - 1 ? 9 : 0,
                        }}
                      >
                        {w}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 9. Subtle 35mm Cinema Corner Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 64%, rgba(2,2,8,0.44) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
