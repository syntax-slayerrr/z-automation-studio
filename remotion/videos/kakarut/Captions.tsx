import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import wordsData from "../../../public/assets/audio/garut-kakarut-words.json";

export type WordItem = {
  word: string;
  start: number;
  end: number;
};

export type CaptionChunk = {
  words: WordItem[];
  start: number;
  end: number;
};

export const buildChunks = (words: WordItem[], maxWordsPerChunk = 3): CaptionChunk[] => {
  const chunks: CaptionChunk[] = [];
  let cur: WordItem[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    cur.push(w);
    const hasPunctuation = /[.,!?:;]/.test(w.word);
    const nextGap = i < words.length - 1 ? words[i + 1].start - w.end : 0;
    const shouldBreak =
      cur.length >= maxWordsPerChunk ||
      hasPunctuation ||
      nextGap > 0.25 ||
      i === words.length - 1;

    if (shouldBreak && cur.length > 0) {
      chunks.push({
        words: [...cur],
        start: cur[0].start,
        end: cur[cur.length - 1].end,
      });
      cur = [];
    }
  }

  return chunks;
};

export const WordCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const time = frame / 30;

  const chunks = useMemo(() => buildChunks(wordsData.words as WordItem[], 3), []);

  const activeChunk = useMemo(() => {
    return chunks.find((c) => time >= c.start && time <= c.end + 0.2);
  }, [chunks, time]);

  if (!activeChunk) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 220,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px 18px",
          padding: "16px 28px",
          background: "rgba(18, 14, 12, 0.85)",
          borderRadius: 20,
          border: "2px solid rgba(245, 197, 66, 0.4)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
          maxWidth: "85%",
        }}
      >
        {activeChunk.words.map((w, idx) => {
          const isSpoken = time >= w.start && time <= w.end + 0.08;
          return (
            <span
              key={idx}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: isSpoken ? "#FCD34D" : "#FFFFFF", // Yellow gold highlight
                transform: isSpoken ? "scale(1.15)" : "scale(1)",
                transition: "transform 0.08s ease, color 0.08s ease",
                textShadow: isSpoken
                  ? "0 0 20px rgba(252, 211, 77, 0.8), 0 4px 10px rgba(0,0,0,0.9)"
                  : "0 3px 6px rgba(0,0,0,0.8)",
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
