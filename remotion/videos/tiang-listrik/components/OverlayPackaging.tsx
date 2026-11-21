import React from "react";
import { interpolate } from "remotion";
import { OVERLAYS } from "../story";

export interface OverlayPackagingProps {
  frame: number;
}

/**
 * 1:1 Forensic Screen-Space Packaging matching @gimanabisaid:
 * - Word-by-word progressive type-on bold white subtitles with soft drop shadow (ZERO opaque boxes!)
 * - Upper sky floating clean technical titles: "Tiang listrik", "Kedalaman tanam", "Isolator", "Andongan", "Beton pratekan"
 * - Animated white wind gust arrows (Shots 4 & 6)
 * - Bold red opposing underground lever-force arrows (Shot 7)
 * - Crisp yellow vertical dimension lines WITH top & bottom T-caps ("12 meter", "hampir 2 meter")
 * - Clean white angled leader line pointing directly under orange shed ("tetap kering", Shot 21)
 * - Animated Red -> Blue Thermometer + Dual Red Contraction Arrows (Shot 23!)
 * - Bold Red Concrete Bending Force Arrow (Shot 28!)
 * - Yellow Inward Diamond/Triangle Compression Arrows tracking lifted books (Shot 31)
 * - Glowing Floating "20.000 V" (orange) -> "220 V" (mint green) cleanly spaced above lines (Shot 34)
 * - ZERO TikTok watermarks or platform outro cards!
 */
export const OverlayPackaging: React.FC<OverlayPackagingProps> = ({ frame }) => {
  // Active sanitized subtitle with progressive word-by-word reveal!
  const activeSub =
    OVERLAYS.find((item) => frame >= item.startFrame && frame <= item.endFrame) || null;

  let displayedSubtitle = "";
  if (activeSub) {
    const words = activeSub.text.split(" ");
    const dur = Math.max(1, activeSub.endFrame - activeSub.startFrame);
    const localP = Math.max(0, Math.min(1, (frame - activeSub.startFrame) / (dur * 0.58)));
    const visibleCount = Math.max(1, Math.min(words.length, Math.ceil(localP * words.length)));
    displayedSubtitle = words.slice(0, visibleCount).join(" ");
  }

  // Upper floating technical section badges (exact y ~ 12.5% matching @gimanabisaid!)
  let upperTitle: string | null = null;
  if (frame >= 172 && frame <= 192) upperTitle = "Tiang listrik";
  else if (frame >= 568 && frame <= 626) upperTitle = "Kedalaman tanam";
  else if (frame >= 1272 && frame <= 1310) upperTitle = "Isolator";
  else if (frame >= 1770 && frame <= 1817) upperTitle = "Andongan";
  else if (frame >= 2480 && frame <= 2544) upperTitle = "Beton pratekan";

  // Shot-specific technical overlays
  const showShot4WindArrows = frame >= 194 && frame <= 237;
  const showShot6WindArrow = frame >= 288 && frame <= 357;
  const showShot7ForceArrows = frame >= 364 && frame <= 431;
  const showShot9Ruler = frame >= 508 && frame <= 564;
  const showShot10Ruler = frame >= 574 && frame <= 626;
  const showShot21TetapKering = frame >= 1344 && frame <= 1424;
  const showShot23Thermo = frame >= 1525 && frame <= 1590;
  const showShot28BendArrow = frame >= 2050 && frame <= 2125;
  const showShot31Arrows = frame >= 2364 && frame <= 2477;
  const showShot34Volt20k = frame >= 2642 && frame <= 2692;
  const showShot34Volt220 = frame >= 2693 && frame <= 2749;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Poppins', 'Montserrat', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* 0. UPPER FLOATING CLEAN TECHNICAL TITLE BADGES */}
      {upperTitle && (
        <div
          style={{
            position: "absolute",
            top: "12.5%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#FFFFFF",
            fontSize: "27px",
            fontWeight: 800,
            letterSpacing: "0.01em",
            textShadow: "0 2px 7px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.7)",
          }}
        >
          {upperTitle}
        </div>
      )}

      {/* 1. SHOT 4: Animated White Wind Gust Arrows sweeping across upper sky toward pole top (shot_004.jpg) */}
      {showShot4WindArrows && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {[
            { y: 390, delay: 0 },
            { y: 515, delay: 8 },
            { y: 650, delay: 16 },
          ].map((a, i) => {
            const cyc = ((frame - 194 + a.delay) % 24) / 24;
            const x = -80 + cyc * 310;
            const op = Math.sin(cyc * Math.PI) * 0.92;
            return (
              <g key={i} transform={`translate(${x}, ${a.y}) rotate(-26)`} opacity={op}>
                <path
                  d="M 0 -10 L 92 -10 L 92 -24 L 136 0 L 92 24 L 92 10 L 0 10 Z"
                  fill="#F4FAFF"
                  style={{ filter: "drop-shadow(0px 2px 5px rgba(0,40,90,0.35))" }}
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* 2. SHOT 6: Bold Animated White Wind Arrow pushing higher as bamboo pole grows taller (tiles_10_20_1.jpg) */}
      {showShot6WindArrow && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const p = Math.max(0, Math.min(1, (frame - 288) / 66));
            const arrowY = 470 - p * 270;
            const pulseX = Math.sin(frame * 0.35) * 14;
            const scale = 0.8 + p * 0.45;
            return (
              <g transform={`translate(${42 + pulseX}, ${arrowY}) rotate(-6) scale(${scale})`} opacity={0.96}>
                <path
                  d="M 0 -15 L 185 -15 L 185 -36 L 245 0 L 185 36 L 185 15 L 0 15 Z"
                  fill="#F7FBFF"
                  stroke="rgba(160, 200, 240, 0.65)"
                  strokeWidth="2"
                  style={{ filter: "drop-shadow(0px 3px 8px rgba(0,30,80,0.32))" }}
                />
              </g>
            );
          })()}
        </svg>
      )}

      {/* 3. SHOT 7: Bold Red Underground Opposing Lever-Force Arrows (shot_007.jpg) */}
      {showShot7ForceArrows && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {/* Upper-right red arrow pushing LEFT against pole base */}
          <g
            transform={`translate(${interpolate(frame, [364, 386], [70, 0], { extrapolateRight: "clamp" })}, 0)`}
            opacity={interpolate(frame, [364, 374], [0, 1], { extrapolateRight: "clamp" })}
          >
            <path
              d="M 716 585 L 542 572 L 548 532 L 438 574 L 538 634 L 544 594 L 716 608 Z"
              fill="#E53935"
              stroke="#8B1816"
              strokeWidth="2.5"
            />
          </g>
          {/* Lower-left red arrow pushing RIGHT against bottom tip */}
          <g
            transform={`translate(${interpolate(frame, [364, 386], [-70, 0], { extrapolateRight: "clamp" })}, 0)`}
            opacity={interpolate(frame, [364, 374], [0, 1], { extrapolateRight: "clamp" })}
          >
            <path
              d="M 4 862 L 178 876 L 172 916 L 282 874 L 182 814 L 176 854 L 4 838 Z"
              fill="#E53935"
              stroke="#8B1816"
              strokeWidth="2.5"
            />
          </g>
        </svg>
      )}

      {/* 4. SHOT 9: Crisp Yellow Vertical 12-Meter Dimension Bar WITH Top & Bottom T-Caps (shot_009.jpg) */}
      {showShot9Ruler && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const yTop = 188;
            const yBot = interpolate(frame, [508, 532], [yTop, 1020], { extrapolateRight: "clamp" });
            return (
              <>
                <line x1="452" y1={yTop} x2="496" y2={yTop} stroke="#FFD740" strokeWidth="5" />
                <line x1="474" y1={yTop} x2="474" y2={yBot} stroke="#FFD740" strokeWidth="5" />
                {yBot > 1000 && (
                  <line x1="452" y1={yBot} x2="496" y2={yBot} stroke="#FFD740" strokeWidth="5" />
                )}
                {frame >= 518 && (
                  <>
                    <polyline
                      points="474,565 340,510 278,510"
                      fill="none"
                      stroke="#FFD740"
                      strokeWidth="3.2"
                    />
                    <circle cx="474" cy="565" r="5" fill="#FFD740" />
                    <text
                      x="266"
                      y="521"
                      textAnchor="end"
                      fill="#FFFFFF"
                      fontSize="29"
                      fontWeight="800"
                      style={{ filter: "drop-shadow(0px 2px 5px rgba(0,0,0,0.88))" }}
                    >
                      12 meter
                    </text>
                  </>
                )}
              </>
            );
          })()}
        </svg>
      )}

      {/* 5. SHOT 10: Crisp Yellow Underground 2-Meter Depth Bar WITH T-Caps spanning Ground -> Pole Base (tiles_20_30_1.jpg) */}
      {showShot10Ruler && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const yTop = 305;
            const yBot = interpolate(frame, [574, 596], [yTop, 1045], { extrapolateRight: "clamp" });
            return (
              <>
                <line x1="448" y1={yTop} x2="500" y2={yTop} stroke="#FFD740" strokeWidth="5" />
                <line x1="474" y1={yTop} x2="474" y2={yBot} stroke="#FFD740" strokeWidth="5" />
                {yBot > 1020 && (
                  <line x1="448" y1={yBot} x2="500" y2={yBot} stroke="#FFD740" strokeWidth="5" />
                )}
                {frame >= 584 && (
                  <>
                    <polyline
                      points="474,775 385,840 315,840"
                      fill="none"
                      stroke="#FFD740"
                      strokeWidth="3"
                    />
                    <circle cx="474" cy="775" r="5" fill="#FFD740" />
                    <text
                      x="304"
                      y="850"
                      textAnchor="end"
                      fill="#FFFFFF"
                      fontSize="26"
                      fontWeight="800"
                      style={{ filter: "drop-shadow(0px 2px 5px rgba(0,0,0,0.88))" }}
                    >
                      hampir 2 meter
                    </text>
                  </>
                )}
              </>
            );
          })()}
        </svg>
      )}

      {/* 6. SHOT 21: Crisp Thin White Leader Line pointing directly under right-bottom orange shed -> "tetap kering" (shot_021.jpg) */}
      {showShot21TetapKering && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          <polyline
            points="518,742 448,818 355,818"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            opacity="0.96"
          />
          <circle cx="518" cy="742" r="5.5" fill="#FFFFFF" />
          <text
            x="344"
            y="828"
            textAnchor="end"
            fill="#FFFFFF"
            fontSize="26"
            fontWeight="800"
            style={{ filter: "drop-shadow(0px 2px 5px rgba(0,0,0,0.9))" }}
          >
            tetap kering
          </text>
        </svg>
      )}

      {/* 7. SHOT 23: Animated RED -> BLUE Thermometer + Dual RED Contraction Arrows on Tight Wire! (tiles_50_60_1.jpg) */}
      {showShot23Thermo && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const p = Math.max(0, Math.min(1, (frame - 1525) / 56));
            const isCold = p > 0.45;
            const fillH = interpolate(p, [0, 0.45, 0.85], [220, 95, 42], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const mercuryColor = isCold ? "#3A94E8" : "#E63E36";
            const arrowOp = interpolate(p, [0.42, 0.54], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pullSlide = interpolate(p, [0.44, 0.95], [0, 26], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <>
                {/* Crisp Rounded White Thermometer Housing on Left */}
                <g transform="translate(86, 290)">
                  <rect
                    x="0"
                    y="0"
                    width="34"
                    height="252"
                    rx="17"
                    fill="#F4F6F9"
                    stroke="rgba(40,55,75,0.28)"
                    strokeWidth="2"
                    style={{ filter: "drop-shadow(0px 3px 6px rgba(0,0,0,0.28))" }}
                  />
                  {/* Dynamic Mercury Column Dropping Red -> Blue */}
                  <rect
                    x="10"
                    y={238 - fillH}
                    width="14"
                    height={fillH}
                    rx="7"
                    fill={mercuryColor}
                  />
                </g>

                {/* Two Bold Red Contraction Tension Arrows Pulling Outward Along Wire */}
                {arrowOp > 0.01 && (
                  <g opacity={arrowOp}>
                    {/* Left arrow pulling LEFT */}
                    <g transform={`translate(${265 - pullSlide}, 612)`}>
                      <path
                        d="M 110 -12 L 38 -12 L 38 -28 L -8 0 L 38 28 L 38 12 L 110 12 Z"
                        fill="#E53935"
                        stroke="#8B1816"
                        strokeWidth="2"
                      />
                    </g>
                    {/* Right arrow pulling RIGHT */}
                    <g transform={`translate(${455 + pullSlide}, 612)`}>
                      <path
                        d="M -110 -12 L -38 -12 L -38 -28 L 8 0 L -38 28 L -38 12 L -110 12 Z"
                        fill="#E53935"
                        stroke="#8B1816"
                        strokeWidth="2"
                      />
                    </g>
                  </g>
                )}
              </>
            );
          })()}
        </svg>
      )}

      {/* 8. SHOT 28: Bold Red Bending Force Arrow Pushing Ordinary Concrete Pole Top (tiles_70_80_1.jpg) */}
      {showShot28BendArrow && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const p = Math.max(0, Math.min(1, (frame - 2050) / 55));
            const slideX = interpolate(p, [0, 0.35], [-120, 0], { extrapolateRight: "clamp" });
            const pulseX = Math.sin(frame * 0.35) * 8;
            return (
              <g transform={`translate(${12 + slideX + pulseX}, 110) rotate(-14)`}>
                <path
                  d="M 0 -16 L 235 -16 L 235 -40 L 302 0 L 235 40 L 235 16 L 0 16 Z"
                  fill="#EB3B32"
                  stroke="#8C1814"
                  strokeWidth="2.5"
                />
              </g>
            );
          })()}
        </svg>
      )}

      {/* 9. SHOT 31: Bright Yellow Inward Diamond/Triangle Compression Arrows Rising With Lifted Books (shot_031.jpg) */}
      {showShot31Arrows && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 1280">
          {(() => {
            const liftT = Math.max(0, Math.min(1, (frame - 2382) / 45));
            const smoothLift = liftT * liftT * (3 - 2 * liftT);
            const arrowY = 675 - smoothLift * 230;
            const pulse = Math.sin(frame * 0.38) * 7;
            return (
              <>
                <polygon
                  points={`${12 + pulse},${arrowY - 38} ${102 + pulse},${arrowY} ${12 + pulse},${arrowY + 38}`}
                  fill="#FFCB2E"
                  stroke="#C99200"
                  strokeWidth="2"
                />
                <polygon
                  points={`${708 - pulse},${arrowY - 38} ${618 - pulse},${arrowY} ${708 - pulse},${arrowY + 38}`}
                  fill="#FFCB2E"
                  stroke="#C99200"
                  strokeWidth="2"
                />
              </>
            );
          })()}
        </svg>
      )}

      {/* 10. SHOT 34: Clean Glowing Floating '20.000 V' (Orange) -> '220 V' (Mint Green) cleanly in open sky above wires (shot_034.jpg) */}
      {showShot34Volt20k && (
        <div
          style={{
            position: "absolute",
            top: "7.5%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#FF8429",
            fontSize: "52px",
            fontWeight: 900,
            letterSpacing: "0.02em",
            textShadow: "0 3px 10px rgba(0,0,0,0.48), 0 0 18px rgba(255, 132, 41, 0.45)",
          }}
        >
          20.000 V
        </div>
      )}

      {showShot34Volt220 && (
        <div
          style={{
            position: "absolute",
            top: "7.5%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#7CE88C",
            fontSize: "52px",
            fontWeight: 900,
            letterSpacing: "0.02em",
            textShadow: "0 3px 10px rgba(0,0,0,0.48), 0 0 18px rgba(124, 232, 140, 0.45)",
          }}
        >
          220 V
        </div>
      )}

      {/* 11. CLEAN 1:1 PROGRESSIVE WORD-BY-WORD BOLD WHITE SUBTITLES (Zero dark box, subtle outline shadow only!) */}
      {displayedSubtitle && (
        <div
          style={{
            position: "absolute",
            top: "74.8%",
            left: "7%",
            width: "86%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#FAF7F0",
              letterSpacing: "0.004em",
              lineHeight: 1.24,
              textShadow:
                "0 2px 6px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.92), -1px -1px 0 rgba(0,0,0,0.65), 1px -1px 0 rgba(0,0,0,0.65), -1px 1px 0 rgba(0,0,0,0.65), 1px 1px 0 rgba(0,0,0,0.65)",
            }}
          >
            {displayedSubtitle}
          </span>
        </div>
      )}
    </div>
  );
};
