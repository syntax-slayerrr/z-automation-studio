import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import wordsData from "../../../public/assets/audio/cnut-words.json";

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
        bottom: 240,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          maxWidth: 920,
          textAlign: "center",
          fontFamily: "'Impact', 'Arial Black', 'Montserrat', sans-serif",
          fontSize: 58,
          textTransform: "uppercase",
          letterSpacing: 2,
          lineHeight: 1.25,
        }}
      >
        {activeChunk.words.map((w, idx) => {
          const isActive = time >= w.start && time <= w.end;
          return (
            <span
              key={`${w.word}-${idx}`}
              style={{
                display: "inline-block",
                margin: "0 12px",
                color: isActive ? "#FFE600" : "#FFFFFF",
                transform: isActive ? "scale(1.12)" : "scale(1.0)",
                transition: "transform 0.05s ease, color 0.05s ease",
                WebkitTextStroke: "10px #0B0A0C",
                paintOrder: "stroke fill",
                textShadow:
                  "0px 6px 16px rgba(0,0,0,0.9), 0px 0px 4px rgba(0,0,0,0.8)",
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

