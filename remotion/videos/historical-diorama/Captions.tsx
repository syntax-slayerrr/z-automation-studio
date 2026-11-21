import React, { useMemo } from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export const WordCaptions: React.FC<{ wordsJsonPath?: string }> = ({
  wordsJsonPath = "assets/audio/ipm-words.json",
}) => {
  const frame = useCurrentFrame();
  const currentTime = frame / 30;

  // Static loaded data
  let wordsData: WordTimestamp[] = [];
  try {
    const raw = require("../../../public/assets/audio/ipm-words.json");
    wordsData = raw.words ?? [];
  } catch (e) {
    // fallback
  }

  // Find active word
  const activeIndex = wordsData.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  // Take window of words (e.g. 5 words)
  const windowStart = Math.max(0, activeIndex - 2);
  const currentWindow = wordsData.slice(windowStart, windowStart + 5);

  if (currentWindow.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px 14px",
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(30, 24, 20, 0.88)",
          padding: "16px 28px",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          display: "flex",
          gap: 12,
          border: "1.5px solid rgba(210, 180, 140, 0.35)",
        }}
      >
        {currentWindow.map((w, idx) => {
          const isCurrent = currentTime >= w.start && currentTime <= w.end;
          return (
            <span
              key={idx}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 32,
                fontWeight: isCurrent ? 800 : 500,
                color: isCurrent ? "#F2BD44" : "#E8DEC8", // Golden yellow highlight
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                transform: isCurrent ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.08s ease",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
