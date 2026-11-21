import React from "react";
import { interpolate } from "remotion";
import { ACTS, CUES, SUBTITLES } from "../story";

export interface RelOverlayPackagingProps {
  frame: number;
}

/**
 * Clean 3D Cutaway Explainer Packaging (ZERO TikTok Watermarks, ZERO Dark Subtitle Boxes!)
 * - Crisp bold white subtitles with soft drop-shadow at y = 75%
 * - Shaded physical force & stress arrows (Red load, Orange heat stress, Yellow 10mm caliper)
 * - Clean floating technical labels synced directly to ElevenLabs [[cue]] timestamps
 */
export const RelOverlayPackaging: React.FC<RelOverlayPackagingProps> = ({ frame }) => {
  const activeSub = SUBTITLES.find((s) => frame >= s.startFrame && frame <= s.endFrame) || null;

  const actObj = ACTS.find((a) => frame >= a.startFrame && frame < a.endFrame) || ACTS[ACTS.length - 1];
  const act = actObj.act;

  // Cue-locked technical visual annotations
  const show100Ton = act === 1 && frame >= (CUES.b1_hook ?? 0) + 6 && frame < (CUES.b1_why ?? 140);
  const showRedPressureArrows = act === 3 && frame >= (CUES.b3_sink ?? 300) && frame <= (CUES.b3_derail ?? 550) + 25;
  const showBallastCallout = act === 4 && frame >= (CUES.b4_ballast ?? 600) && frame < (CUES.b4_macro ?? 720);
  const showBallastForceVectors = act === 4 && frame >= (CUES.b4_macro ?? 720) && frame <= (CUES.b4_lock ?? 1014) + 15;
  const showTableLabels = act === 5;
  const showHeat60C = act === 6 && frame >= (CUES.b6_heat ?? 1200) + 24;
  const showExpansionArrows = act === 6 && frame >= (CUES.b6_expand ?? 1300);
  const show10mmCaliper = act === 7 && frame >= (CUES.b7_gap ?? 1500) + 12;
  const showHarmonyRecap = act === 8 && frame >= (CUES.b8_harmony ?? 2274) + 20 && frame < (CUES.b8_loop ?? 2394);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Poppins', 'Montserrat', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* 1. BEAT 1: Clean Floating '100 TON' Callout above Locomotive */}
      {show100Ton && (
        <div
          style={{
            position: "absolute",
            top: "14%",
            left: "50%",
            transform: `translateX(-50%) scale(${interpolate(frame, [(CUES.b1_hook ?? 0) + 6, (CUES.b1_hook ?? 0) + 18], [0.82, 1], { extrapolateRight: "clamp" })})`,
            color: "#FFD84D",
            fontSize: "46px",
            fontWeight: 900,
            letterSpacing: "0.03em",
            textShadow: "0 3px 12px rgba(0,0,0,0.65), 0 0 18px rgba(255, 216, 77, 0.4)",
          }}
        >
          100 TON
        </div>
      )}

      {/* 2. BEAT 3: Bold Red Downward Concentrated Load Arrows (Narrow Point Pressure!) */}
      {showRedPressureArrows && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const drop = Math.sin(frame * 0.28) * 14;
            return (
              <g opacity={interpolate(frame, [CUES.b3_sink ?? 300, (CUES.b3_sink ?? 300) + 12], [0, 1], { extrapolateRight: "clamp" })}>
                {[290, 360, 430].map((cx, i) => (
                  <path
                    key={i}
                    d={`M ${cx - 14} ${430 + drop} L ${cx + 14} ${430 + drop} L ${cx + 14} ${545 + drop} L ${cx + 34} ${545 + drop} L ${cx} ${605 + drop} L ${cx - 34} ${545 + drop} L ${cx - 14} ${545 + drop} Z`}
                    fill="#E53935"
                    stroke="#8B1816"
                    strokeWidth="3"
                  />
                ))}
              </g>
            );
          })()}
        </svg>
      )}

      {/* 3. BEAT 4: Crisp Thin Yellow Leader Line -> 'BALAST' */}
      {showBallastCallout && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          <polyline
            points="390,690 480,550 565,550"
            fill="none"
            stroke="#FFD740"
            strokeWidth="3.5"
          />
          <circle cx="390" cy="690" r="6" fill="#FFD740" />
          <text
            x="575"
            y="560"
            fill="#FFFFFF"
            fontSize="30"
            fontWeight="900"
            style={{ filter: "drop-shadow(0px 2px 6px rgba(0,0,0,0.9))" }}
          >
            BALAST
          </text>
        </svg>
      )}

      {/* 3b. BEAT 4 MACRO: 45° Spreading Force Vectors + Callouts */}
      {showBallastForceVectors && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          <g opacity={interpolate(frame, [CUES.b4_macro ?? 860, (CUES.b4_macro ?? 860) + 14], [0, 1], { extrapolateRight: "clamp" })}>
            {/* 45° spreading force lines from center */}
            <line x1="360" y1="420" x2="210" y2="680" stroke="#48D8FF" strokeWidth="3" strokeDasharray="8,5" />
            <line x1="360" y1="420" x2="510" y2="680" stroke="#48D8FF" strokeWidth="3" strokeDasharray="8,5" />
            {/* Failure callout left */}
            <text x="68" y="575" fill="#FF7B73" fontSize="22" fontWeight="900" style={{ filter: "drop-shadow(0px 2px 6px rgba(0,0,0,0.9))" }}>
              ✕ Batu Bulat
            </text>
            <text x="68" y="602" fill="#FF7B73" fontSize="18" fontWeight="700" style={{ filter: "drop-shadow(0px 2px 6px rgba(0,0,0,0.9))" }}>
              (Licin)
            </text>
            {/* Success callout right */}
            <text x="508" y="575" fill="#6CF096" fontSize="22" fontWeight="900" style={{ filter: "drop-shadow(0px 2px 6px rgba(0,0,0,0.9))" }}>
              ✓ Batu Pecah
            </text>
            <text x="508" y="602" fill="#6CF096" fontSize="18" fontWeight="700" style={{ filter: "drop-shadow(0px 2px 6px rgba(0,0,0,0.9))" }}>
              Tajam
            </text>
          </g>
        </svg>
      )}

      {/* 4. BEAT 5: Everyday Table Analogy Labels (Round Marbles X vs Sharp Stones Check) */}
      {showTableLabels && (
        <>
          <div
            style={{
              position: "absolute",
              top: "14%",
              left: "24%",
              transform: "translateX(-50%)",
              textAlign: "center",
              color: "#FF7B73",
              fontSize: "26px",
              fontWeight: 900,
              textShadow: "0 2px 8px rgba(0,0,0,0.85)",
            }}
          >
            ✕ KELERENG
          </div>
          <div
            style={{
              position: "absolute",
              top: "14%",
              left: "76%",
              transform: "translateX(-50%)",
              textAlign: "center",
              color: "#6CF096",
              fontSize: "26px",
              fontWeight: 900,
              textShadow: "0 2px 8px rgba(0,0,0,0.85)",
            }}
          >
            ✓ BATU TAJAM
          </div>
        </>
      )}

      {/* 5. BEAT 6: Animated Thermometer Gauge + 60°C Temperature + Opposing Thermal Expansion Arrows */}
      {showHeat60C && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Thermometer Bar Gauge */}
          <svg width="28" height="82" viewBox="0 0 28 82">
            <rect x="8" y="2" width="12" height="72" rx="6" fill="#2A1A12" stroke="#FFB84D" strokeWidth="2" />
            {(() => {
              const heatProg = Math.min(1, (frame - (CUES.b6_heat ?? 1200) - 24) / 70);
              const fillH = Math.max(0, heatProg) * 64;
              return (
                <rect
                  x="11"
                  y={72 - fillH}
                  width="6"
                  height={fillH + 2}
                  rx="3"
                  fill={`rgb(${Math.round(200 + 55 * heatProg)}, ${Math.round(100 - 60 * heatProg)}, ${Math.round(40 - 20 * heatProg)})`}
                />
              );
            })()}
            <circle cx="14" cy="76" r="6" fill="#FF4422" />
          </svg>
          <div
            style={{
              color: "#FF842B",
              fontSize: "52px",
              fontWeight: 900,
              textShadow: "0 3px 12px rgba(0,0,0,0.6), 0 0 22px rgba(255, 132, 43, 0.55)",
              lineHeight: 1,
            }}
          >
            60°C
          </div>
        </div>
      )}

      {showExpansionArrows && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const push = Math.sin(frame * 0.35) * 10;
            return (
              <g>
                {/* Left orange arrow pushing RIGHT */}
                <path
                  d={`M ${70 + push} 615 L ${205 + push} 615 L ${205 + push} 590 L ${275 + push} 630 L ${205 + push} 670 L ${205 + push} 645 L ${70 + push} 645 Z`}
                  fill="#FF7824"
                  stroke="#9C3800"
                  strokeWidth="3"
                />
                {/* Right orange arrow pushing LEFT */}
                <path
                  d={`M ${650 - push} 615 L ${515 - push} 615 L ${515 - push} 590 L ${445 - push} 630 L ${515 - push} 670 L ${515 - push} 645 L ${650 - push} 645 Z`}
                  fill="#FF7824"
                  stroke="#9C3800"
                  strokeWidth="3"
                />
              </g>
            );
          })()}
        </svg>
      )}

      {/* 6. BEAT 7: Crisp Yellow Caliper Dimension Bracket -> '10 mm' Expansion Gap */}
      {show10mmCaliper && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {/* Left & Right Vertical Ticks framing the 10mm gap */}
          <line x1="322" y1="360" x2="322" y2="520" stroke="#FFD740" strokeWidth="4" />
          <line x1="398" y1="360" x2="398" y2="520" stroke="#FFD740" strokeWidth="4" />
          <line x1="322" y1="400" x2="398" y2="400" stroke="#FFD740" strokeWidth="4" />
          <text
            x="360"
            y="340"
            textAnchor="middle"
            fill="#FFD740"
            fontSize="44"
            fontWeight="900"
            style={{ filter: "drop-shadow(0px 3px 8px rgba(0,0,0,0.85))" }}
          >
            10 mm
          </text>
        </svg>
      )}

      {/* 7b. BEAT 8: Harmony Recap Badges (Balast Tajam + Celah 10 mm!) */}
      {showHarmonyRecap && (
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "14px",
          }}
        >
          <div
            style={{
              background: "rgba(72, 229, 122, 0.22)",
              border: "2px solid #6CF096",
              borderRadius: "8px",
              padding: "4px 14px",
              color: "#6CF096",
              fontSize: "21px",
              fontWeight: 900,
              textShadow: "0 2px 8px rgba(0,0,0,0.85)",
            }}
          >
            ✓ Balast Tajam
          </div>
          <div
            style={{
              background: "rgba(255, 215, 64, 0.22)",
              border: "2px solid #FFD740",
              borderRadius: "8px",
              padding: "4px 14px",
              color: "#FFD740",
              fontSize: "21px",
              fontWeight: 900,
              textShadow: "0 2px 8px rgba(0,0,0,0.85)",
            }}
          >
            ✓ Celah 10 mm
          </div>
        </div>
      )}

      {/* 7. CLEAN BOLD WHITE SUBTITLES (Zero dark boxes, zero watermarks!) */}
      {activeSub && (
        <div
          style={{
            position: "absolute",
            top: "75%",
            left: "8%",
            width: "84%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#FAF7F0",
              letterSpacing: "0.005em",
              lineHeight: 1.24,
              textShadow:
                "0 2px 7px rgba(0,0,0,0.92), 0 0 3px rgba(0,0,0,0.96), -1px -1px 0 rgba(0,0,0,0.75), 1px -1px 0 rgba(0,0,0,0.75), -1px 1px 0 rgba(0,0,0,0.75), 1px 1px 0 rgba(0,0,0,0.75)",
            }}
          >
            {activeSub.text}
          </span>
        </div>
      )}
    </div>
  );
};
