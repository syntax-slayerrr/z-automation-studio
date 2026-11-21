import React from "react";
import { CUES, SEQS, SUBTITLE_CHUNKS } from "../story";
import { smoothstep } from "../ikSolver";

export interface OverlayPackagingProps {
  frame: number;
  fps: number;
}

/**
 * Clean Viral Full HD (1080×1920) Educational Packaging Layer:
 * - Audio-locked word-by-word type-on white bold subtitles with soft natural drop-shadow ONLY (NO box pills!)
 * - Clean upper technical badge titles ("Kemiringan 30°", "Terasering", "Pematang", "Resapan Mata Air", "Saluran Pelimpah")
 * - Crisp animated SVG physics diagrams (30° slope protractor & red gravity erosion arrows; blue stepped braking arrows!)
 * - ZERO TikTok watermarks, ZERO @handles, ZERO platform outro cards!
 */
export const OverlayPackaging: React.FC<OverlayPackagingProps> = ({ frame }) => {
  // Active subtitle chunk synchronized directly to ElevenLabs character timestamps
  const activeChunk = SUBTITLE_CHUNKS.find(
    (ch) => frame >= ch.startFrame && frame <= ch.endFrame
  );

  // Upper floating technical concept header
  let topTitle = "";
  let topSub = "";
  let titleAlpha = 0;

  if (frame >= CUES.s2_angle - 6 && frame < SEQS.seq3Start - 6) {
    topTitle = "Kemiringan 30°";
    topSub = "ARUS EROSI GRAVITASI";
    titleAlpha =
      smoothstep(CUES.s2_angle - 6, CUES.s2_angle + 8, frame) *
      (1 - smoothstep(SEQS.seq3Start - 18, SEQS.seq3Start - 6, frame));
  } else if (frame >= CUES.s3_label - 6 && frame < CUES.s3_bund - 10) {
    topTitle = "Terasering";
    topSub = "POTONGAN TANGGA DATAR";
    titleAlpha =
      smoothstep(CUES.s3_label - 6, CUES.s3_label + 8, frame) *
      (1 - smoothstep(CUES.s3_bund - 20, CUES.s3_bund - 10, frame));
  } else if (frame >= CUES.s3_bund - 8 && frame < SEQS.seq4Start - 4) {
    topTitle = "Pematang";
    topSub = "TANGGUL TANAH LIAT PADAT";
    titleAlpha =
      smoothstep(CUES.s3_bund - 8, CUES.s3_bund + 6, frame) *
      (1 - smoothstep(SEQS.seq4Start - 14, SEQS.seq4Start - 4, frame));
  } else if (frame >= CUES.s4_pour_flat - 6 && frame < CUES.s4_stepped - 6) {
    topTitle = "Papan Miring";
    topSub = "AIR LANGSUNG TUMPAH";
    titleAlpha =
      smoothstep(CUES.s4_pour_flat - 6, CUES.s4_pour_flat + 8, frame) *
      (1 - smoothstep(CUES.s4_stepped - 16, CUES.s4_stepped - 6, frame));
  } else if (frame >= CUES.s4_stepped - 4 && frame < SEQS.seq5Start - 4) {
    topTitle = "Papan Berundak";
    topSub = "ARUS DIREM & TERKUNCI";
    titleAlpha =
      smoothstep(CUES.s4_stepped - 4, CUES.s4_stepped + 10, frame) *
      (1 - smoothstep(SEQS.seq5Start - 14, SEQS.seq5Start - 4, frame));
  } else if (frame >= CUES.s5_seep - 6 && frame < CUES.s5_roots - 8) {
    topTitle = "Resapan Mata Air";
    topSub = "AIR MERESAP KE AKUIFER BUKIT";
    titleAlpha =
      smoothstep(CUES.s5_seep - 6, CUES.s5_seep + 10, frame) *
      (1 - smoothstep(CUES.s5_roots - 18, CUES.s5_roots - 8, frame));
  } else if (frame >= CUES.s5_roots - 6 && frame < SEQS.seq6Start - 4) {
    topTitle = "Jaring Akar Padi";
    topSub = "MENGUNCI TANAH ANTI-LONGSOR";
    titleAlpha =
      smoothstep(CUES.s5_roots - 6, CUES.s5_roots + 10, frame) *
      (1 - smoothstep(SEQS.seq6Start - 14, SEQS.seq6Start - 4, frame));
  } else if (frame >= CUES.s6_pipe - 6 && frame < SEQS.seq7Start - 8) {
    topTitle = "Saluran Pelimpah";
    topSub = "IRIGASI GRAVITASI ANTAR-PETAK";
    titleAlpha =
      smoothstep(CUES.s6_pipe - 6, CUES.s6_pipe + 10, frame) *
      (1 - smoothstep(SEQS.seq7Start - 18, SEQS.seq7Start - 8, frame));
  }

  // Animated 30° Slope Protractor + Red Gravity Erosion Vectors (Seq 2!)
  const showSlopeDiagram = frame >= CUES.s2_angle - 4 && frame < SEQS.seq3Start - 8;
  const slopeDiagramAlpha = showSlopeDiagram
    ? smoothstep(CUES.s2_angle - 4, CUES.s2_angle + 12, frame) *
      (1 - smoothstep(SEQS.seq3Start - 22, SEQS.seq3Start - 8, frame))
    : 0;
  const erosionDashOffset = -(frame * 5.2) % 60;

  // Animated Stepped Water-Brake Blue Arrows (Seq 4 stepped board!)
  const showBrakeArrows = frame >= CUES.s4_brake - 4 && frame < SEQS.seq5Start - 6;
  const brakeAlpha = showBrakeArrows
    ? smoothstep(CUES.s4_brake - 4, CUES.s4_brake + 12, frame) *
      (1 - smoothstep(SEQS.seq5Start - 16, SEQS.seq5Start - 6, frame))
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* 1. Upper Clean Technical Concept Title (Zero Clutter, Shadow-Only Premium Clarity!) */}
      {titleAlpha > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: 215,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: titleAlpha,
            transform: `translateY(${(1 - titleAlpha) * 16}px)`,
          }}
        >
          <div
            style={{
              fontSize: 66,
              fontWeight: 900,
              color: "#FFFDF8",
              letterSpacing: "-0.5px",
              lineHeight: 1.08,
              textAlign: "center",
              textShadow:
                "0 4px 16px rgba(18, 22, 26, 0.62), 0 2px 4px rgba(0, 0, 0, 0.72)",
            }}
          >
            {topTitle}
          </div>
          {topSub && (
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "3.2px",
                color: "#FFE58A",
                textShadow:
                  "0 2px 10px rgba(12, 16, 20, 0.72), 0 1px 3px rgba(0, 0, 0, 0.8)",
              }}
            >
              {topSub}
            </div>
          )}
        </div>
      )}

      {/* 2. Seq 2 Animated SVG 30° Slope Protractor & Red Gravity Erosion Force Vectors */}
      {slopeDiagramAlpha > 0.01 && (
        <svg
          width="1080"
          height="1920"
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0, opacity: slopeDiagramAlpha }}
        >
          <defs>
            <filter id="vecShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.65" />
            </filter>
          </defs>
          {/* Dashed Horizontal Reference + 30° Angle Arc */}
          <g filter="url(#vecShadow)">
            <line
              x1="160"
              y1="1010"
              x2="760"
              y2="1010"
              stroke="#FFF8E8"
              strokeWidth="4"
              strokeDasharray="12 10"
              opacity="0.88"
            />
            <line
              x1="160"
              y1="745"
              x2="760"
              y2="1010"
              stroke="#FF5244"
              strokeWidth="6"
              strokeDasharray="18 12"
              strokeDashoffset={erosionDashOffset}
            />
            {/* Angle Protractor Arc at lower-right vertex (760, 1010) */}
            <path
              d="M 600 1010 A 160 160 0 0 1 614 945"
              fill="none"
              stroke="#FFE47A"
              strokeWidth="5"
            />
            <text
              x="530"
              y="988"
              fill="#FFE47A"
              fontSize="44"
              fontWeight="900"
              fontFamily="'Segoe UI', Arial, sans-serif"
            >
              30°
            </text>

            {/* Bold Animated Red Gravity Runoff Arrow pointing downslope */}
            <g transform="translate(475, 810) rotate(23.8)">
              <line x1="-115" y1="0" x2="105" y2="0" stroke="#FF4238" strokeWidth="12" strokeLinecap="round" />
              <polygon points="135,0 88,-24 98,0 88,24" fill="#FF4238" />
            </g>
          </g>
        </svg>
      )}

      {/* 3. Seq 4 Blue Energy-Braking Step Arrows over Stepped Wooden Board */}
      {brakeAlpha > 0.01 && (
        <svg
          width="1080"
          height="1920"
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0, opacity: brakeAlpha }}
        >
          <defs>
            <filter id="blueShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>
          <g filter="url(#blueShadow)">
            {[0, 1, 2].map((i) => {
              const pulse = Math.sin(frame * 0.22 - i * 0.9) * 6;
              const bx = 305 + i * 168;
              const by = 825 + i * 58 + pulse;
              return (
                <g key={i} transform={`translate(${bx}, ${by})`}>
                  <path
                    d="M 0 -22 C 42 -22, 56 6, 82 6"
                    fill="none"
                    stroke="#52D4FF"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <polygon points="104,6 70,-12 76,6 70,24" fill="#52D4FF" />
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* 4. Clean Audio-Locked Bold White Word-by-Word Type-On Subtitles (Shadow-Only, ZERO Box Pill!) */}
      {activeChunk && (
        <div
          style={{
            position: "absolute",
            bottom: 350,
            left: 72,
            right: 72,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: 910,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 16px",
              textAlign: "center",
            }}
          >
            {activeChunk.words.map((w, idx) => {
              if (frame < w.startFrame) return null;
              const age = frame - w.startFrame;
              const pop =
                age < 5 ? 0.92 + (age / 5) * 0.14 : age < 9 ? 1.06 - ((age - 5) / 4) * 0.06 : 1.0;
              const isLatest =
                idx === activeChunk.words.length - 1 ||
                frame < activeChunk.words[idx + 1].startFrame;

              return (
                <span
                  key={`${activeChunk.id}_${idx}`}
                  style={{
                    display: "inline-block",
                    fontSize: 58,
                    fontWeight: 900,
                    lineHeight: 1.18,
                    letterSpacing: "-0.4px",
                    color: isLatest ? "#FFF8DE" : "#FFFFFF",
                    transform: `scale(${pop})`,
                    textShadow:
                      "0 5px 14px rgba(0, 0, 0, 0.82), 0 2px 5px rgba(0, 0, 0, 0.92), 0 0 2px rgba(0, 0, 0, 0.95)",
                  }}
                >
                  {w.text}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
