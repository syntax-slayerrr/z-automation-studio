import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Reusable Cel-Toon Comic Packaging UI Overlay
 * Reverse-engineered 1:1 from `galeri-motion-tipikal.mp4`:
 *  1. `TopSignBanner` — Highway/Street-Sign Top Pill (forest green or jewel tone + inner crisp white pinstripe + bold condensed white title)
 *  2. `NumberedBeatPill` — Sliding circular red-ringed number badge + warm-ivory rounded pill with crimson keyword highlight & thick ink border
 *  3. `ComicBubblePopup` — Crisp floating comic speech/thought/SFX callout (?, !, JACKPOT!, 9%, SWIPE!)
 *  4. `CelToonSubtitles` — Clean bold cartoon karaoke caption pill inside 9:16 mobile safe area
 */

export const TOON_FONT_DISPLAY =
  "'Impact', 'Arial Narrow', 'Segoe UI Black', system-ui, sans-serif";
export const TOON_FONT_SANS =
  "'Trebuchet MS', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export interface ToonSubtitleWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface ToonSubtitleChunk {
  id: string;
  scene: number;
  startFrame: number;
  endFrame: number;
  words: ToonSubtitleWord[];
}

export const TopSignBanner: React.FC<{
  title: string;
  icon?: string;
  bgColor?: string;
}> = ({ title, icon = "📱", bgColor = "#146B3A" }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 96,
        left: 44,
        right: 44,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 45,
      }}
    >
      <div
        style={{
          background: bgColor,
          border: "5px solid #0F1016",
          borderRadius: 20,
          padding: 7,
          boxShadow: "0px 7px 0px rgba(15, 16, 22, 0.92)",
          width: "100%",
          maxWidth: 960,
        }}
      >
        <div
          style={{
            border: "3.5px solid #FFFFFF",
            borderRadius: 12,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 38, lineHeight: 1 }}>{icon}</span>
          <span
            style={{
              fontFamily: TOON_FONT_DISPLAY,
              fontSize: 44,
              color: "#FFFFFF",
              letterSpacing: 2.2,
              textTransform: "uppercase",
              lineHeight: 1.05,
            }}
          >
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};

export const NumberedBeatPill: React.FC<{
  number: string | number;
  prefix: string;
  highlight: string;
  suffix?: string;
  enterFrame: number;
  ringColor?: string;
  highlightColor?: string;
}> = ({
  number,
  prefix,
  highlight,
  suffix = "",
  enterFrame,
  ringColor = "#D92D20",
  highlightColor = "#D92D20",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: { damping: 14, stiffness: 210, mass: 0.72 },
  });
  const tx = interpolate(slide, [0, 1], [-920, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 214,
        left: 56,
        right: 56,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 44,
        transform: `translateX(${tx}px)`,
      }}
    >
      {/* Fused White-Ivory Comic Pill */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "#FFFDF6",
          border: "5px solid #0F1016",
          borderRadius: 24,
          boxShadow: "0px 8px 0px #0F1016",
          padding: "16px 30px 16px 124px",
          minHeight: 108,
          width: "100%",
          maxWidth: 920,
        }}
      >
        {/* Overlapping Circular Numbered Badge on Left (exact match to galeri-motion-tipikal.mp4!) */}
        <div
          style={{
            position: "absolute",
            left: -14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 112,
            height: 112,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: `12px solid ${ringColor}`,
            boxShadow: "0 0 0 5px #0F1016, 0px 6px 0px #0F1016",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: TOON_FONT_DISPLAY,
            fontSize: 58,
            color: "#0F1016",
          }}
        >
          {number}
        </div>

        <div
          style={{
            fontFamily: TOON_FONT_SANS,
            fontSize: 34,
            fontWeight: 900,
            color: "#0F1016",
            lineHeight: 1.22,
          }}
        >
          {prefix}
          <span style={{ color: highlightColor }}>{highlight}</span>
          {suffix}
        </div>
      </div>
    </div>
  );
};

export const ComicBubblePopup: React.FC<{
  text: string;
  x: number; // left px (0..1080)
  y: number; // top px (0..1920)
  enterFrame: number;
  exitFrame?: number;
  variant?: "speech" | "circle" | "burst" | "badge";
  bg?: string;
  fg?: string;
  rotateDeg?: number;
  fontSize?: number;
}> = ({
  text,
  x,
  y,
  enterFrame,
  exitFrame,
  variant = "speech",
  bg = "#FFFDF6",
  fg = "#0F1016",
  rotateDeg = 0,
  fontSize = 36,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < enterFrame) return null;
  if (exitFrame !== undefined && frame > exitFrame) return null;

  const pop = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: { damping: 11, stiffness: 280, mass: 0.6 },
  });
  const s = interpolate(pop, [0, 1], [0.2, 1]);

  if (variant === "circle") {
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${s}) rotate(${rotateDeg}deg)`,
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: bg,
          border: "5px solid #0F1016",
          boxShadow: "0px 6px 0px #0F1016",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TOON_FONT_DISPLAY,
          fontSize: 54,
          color: fg,
          pointerEvents: "none",
          zIndex: 48,
        }}
      >
        {text}
      </div>
    );
  }

  if (variant === "burst") {
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${s}) rotate(${rotateDeg}deg)`,
          fontFamily: TOON_FONT_DISPLAY,
          fontSize: fontSize + 18,
          color: bg,
          letterSpacing: 3,
          WebkitTextStroke: "4px #0F1016",
          textShadow: "6px 6px 0px #0F1016",
          pointerEvents: "none",
          zIndex: 49,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rotateDeg}deg)`,
        background: bg,
        color: fg,
        border: "5px solid #0F1016",
        borderRadius: variant === "badge" ? 16 : 22,
        boxShadow: "6px 6px 0px #0F1016",
        padding: "12px 26px",
        fontFamily: TOON_FONT_DISPLAY,
        fontSize,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 48,
      }}
    >
      {text}
      {variant === "speech" && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -16,
            transform: "translateX(-50%) rotate(45deg)",
            width: 24,
            height: 24,
            background: bg,
            borderRight: "5px solid #0F1016",
            borderBottom: "5px solid #0F1016",
          }}
        />
      )}
    </div>
  );
};

export const CelToonSubtitles: React.FC<{
  chunks: ToonSubtitleChunk[];
  highlightBg?: string;
  highlightFg?: string;
}> = ({ chunks, highlightBg = "#FACC15", highlightFg = "#0F1016" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeChunk = chunks.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );
  if (!activeChunk) return null;

  const entry = spring({
    frame: Math.max(0, frame - activeChunk.startFrame),
    fps,
    config: { damping: 15, stiffness: 260, mass: 0.55 },
  });

  let activeIdx = -1;
  for (let i = 0; i < activeChunk.words.length; i++) {
    if (frame >= activeChunk.words[i].startFrame) activeIdx = i;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 52,
        right: 52,
        bottom: 165,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 55,
        transform: `translateY(${interpolate(entry, [0, 1], [14, 0])}px)`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px 10px",
          padding: "16px 26px",
          background: "#FFFDF6",
          border: "5px solid #0F1016",
          borderRadius: 24,
          boxShadow: "0px 8px 0px #0F1016",
          maxWidth: 940,
        }}
      >
        {activeChunk.words.map((w, idx) => {
          const isCur = idx === activeIdx;
          const isPast = idx < activeIdx;
          const pop = isCur
            ? spring({
                frame: Math.max(0, frame - w.startFrame),
                fps,
                config: { damping: 13, stiffness: 320, mass: 0.45 },
              })
            : 1;
          return (
            <span
              key={`${activeChunk.id}_${idx}`}
              style={{
                display: "inline-block",
                fontFamily: TOON_FONT_SANS,
                fontSize: 38,
                fontWeight: 900,
                lineHeight: 1.18,
                padding: isCur ? "2px 12px" : "2px 3px",
                borderRadius: 12,
                background: isCur ? highlightBg : "transparent",
                color: isCur ? highlightFg : isPast ? "#0F1016" : "#8A8E9E",
                border: isCur ? "3px solid #0F1016" : "3px solid transparent",
                transform: isCur ? `scale(${interpolate(pop, [0, 1], [0.9, 1.07])})` : "none",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
