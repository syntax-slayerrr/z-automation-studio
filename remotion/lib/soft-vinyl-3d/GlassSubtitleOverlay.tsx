import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Ultra-Minimalist Adaptive Frosted-Glass Pill Subtitles
 * Reverse-engineered 1:1 from `galeri-motion-characterflow.mp4`:
 *  - ZERO top street banners, ZERO numbered pills, ZERO comic ink borders, ZERO watermarks!
 *  - Single soft translucent dark-glass capsule (`rgba(36, 44, 66, 0.62)`, backdrop blur)
 *  - Adaptive vertical positioning (`zone: "top" | "lower"`) so subtitles NEVER cover face or POV notebook!
 *  - Progressive spoken word reveal: past/active words crisp `#FFFFFF`, emotional keywords warm gold `#FACC15`,
 *    upcoming words soft translucent `rgba(255,255,255,0.52)`.
 */

export interface GlassSubtitleWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface GlassSubtitleChunk {
  id: string;
  scene: number;
  startFrame: number;
  endFrame: number;
  words: GlassSubtitleWord[];
}

const FONT_CLEAN =
  "'Segoe UI', 'Inter', 'Helvetica Neue', 'Trebuchet MS', system-ui, sans-serif";

function matchesKeyword(word: string, keywords: string[]): boolean {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean) return false;
  return keywords.some((kw) => clean === kw.toLowerCase() || clean.includes(kw.toLowerCase()));
}

export const GlassSubtitleOverlay: React.FC<{
  chunks: GlassSubtitleChunk[];
  zone: "top" | "lower";
  keywords?: string[];
}> = ({ chunks, zone, keywords = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeChunk = chunks.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );
  if (!activeChunk) return null;

  const entry = spring({
    frame: Math.max(0, frame - activeChunk.startFrame),
    fps,
    config: { damping: 18, stiffness: 210, mass: 0.6 },
  });

  let activeIdx = -1;
  for (let i = 0; i < activeChunk.words.length; i++) {
    if (frame >= activeChunk.words[i].startFrame) activeIdx = i;
  }

  const posStyle: React.CSSProperties =
    zone === "top"
      ? { top: 155 }
      : { bottom: 265 };

  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        ...posStyle,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
        opacity: Math.min(1, entry * 1.4),
        transform: `translateY(${interpolate(entry, [0, 1], [10, 0])}px)`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "4px 10px",
          padding: "16px 28px",
          background: "rgba(32, 40, 62, 0.62)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 20,
          border: "1.5px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 12px 32px rgba(10, 14, 28, 0.34)",
          maxWidth: 920,
        }}
      >
        {activeChunk.words.map((w, idx) => {
          const isSpoken = idx <= activeIdx;
          const isKey = matchesKeyword(w.text, keywords);
          const color = !isSpoken
            ? "rgba(255, 255, 255, 0.54)"
            : isKey
              ? "#FACC15"
              : "#FFFFFF";

          return (
            <span
              key={`${activeChunk.id}_${idx}`}
              style={{
                fontFamily: FONT_CLEAN,
                fontSize: 40,
                fontWeight: isKey && isSpoken ? 700 : 600,
                lineHeight: 1.28,
                color,
                textShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
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
