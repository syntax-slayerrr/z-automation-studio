import React from "react";
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_SANS, FONT_SERIF, HERITAGE } from "./PaperTextures";
import { ReconstructInkStamp } from "./VintageCartouche";

export interface CaptionWord {
  w: string;
  cue: string | null;
  scene: number;
  line: number;
  start: number;
  end: number;
  speaker?: string;
}

export interface CaptionChunk {
  words: CaptionWord[];
  start: number;
  end: number;
}

export interface SceneChapterMeta {
  era: string;
  label: string;
  reconstruct?: boolean;
  darkMode?: boolean;
}

export const EditorialEraHeader: React.FC<{
  sceneStartFrame: number;
  meta: SceneChapterMeta;
}> = ({ sceneStartFrame, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - sceneStartFrame;
  const enter = spring({ frame: local, fps, config: { damping: 16, stiffness: 190 } });
  const dark = Boolean(meta.darkMode);

  const eraCol = dark ? "#dfb567" : HERITAGE.oxblood;
  const labelCol = dark ? "rgba(245, 234, 214, 0.88)" : HERITAGE.ink;
  const ruleCol = dark ? "rgba(223, 181, 103, 0.32)" : "rgba(74, 48, 22, 0.65)";

  return (
    <div
      style={{
        position: "absolute",
        top: 112,
        left: 56,
        right: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pointerEvents: "none",
        transform: `translateY(${(1 - enter) * -8}px)`,
        opacity: Math.min(1, enter * 1.4),
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "baseline",
          gap: 12,
          padding: "6px 16px 6px 16px",
          background: dark
            ? "linear-gradient(155deg, rgba(28, 22, 16, 0.80), rgba(18, 14, 10, 0.88))"
            : "linear-gradient(155deg, rgba(248, 236, 212, 0.96), rgba(227, 201, 159, 0.96))",
          border: `1.5px solid ${dark ? "rgba(223, 181, 103, 0.36)" : "rgba(79, 52, 24, 0.78)"}`,
          borderRadius: 3,
          boxShadow: dark
            ? "-3px 6px 10px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 240, 210, 0.12)"
            : "-3px 6px 10px rgba(24, 12, 4, 0.36), inset 0 1px 0 rgba(255, 252, 242, 0.72)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${staticFile("art/textures/parchment_grain_alpha.png")})`,
            backgroundSize: "256px 256px",
            opacity: dark ? 0.52 : 0.72,
            pointerEvents: "none",
          }}
        />
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: FONT_SERIF,
            fontWeight: 900,
            fontSize: 23,
            color: eraCol,
            letterSpacing: 1.0,
          }}
        >
          {meta.era}
        </span>
        <span style={{ position: "relative", zIndex: 1, color: ruleCol, fontSize: 17, fontWeight: 700 }}>·</span>
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: FONT_SANS,
            fontWeight: 800,
            fontSize: 15.5,
            color: labelCol,
            letterSpacing: 1.8,
          }}
        >
          {meta.label}
        </span>
      </div>

      {meta.reconstruct && <ReconstructInkStamp dark={dark} />}
    </div>
  );
};

/**
 * Motionformat-inspired scalloped parchment caption placard:
 * Cream archival ticket + double sepia ink border + terracotta active highlight.
 * Automatically shifts to deep night-slate placard on dark scenes.
 */
export const EditorialCaptions: React.FC<{
  chunks: CaptionChunk[];
  fps: number;
  darkAtScene?: (sceneIdx: number, t: number) => boolean;
}> = ({ chunks, fps, darkAtScene }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  const chunk = chunks.find((c) => t >= c.start - 0.06 && t <= c.end + 0.16);
  if (!chunk) return null;

  const sceneIdx = chunk.words[0]?.scene ?? 0;
  const dark = darkAtScene ? darkAtScene(sceneIdx, t) : false;

  const entry =
    chunk.start <= 0.08
      ? 1
      : interpolate(t - chunk.start, [-0.06, 0.05], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const bgGrad = dark
    ? "linear-gradient(170deg, #1d2432 0%, #161d29 58%, #10151f 100%)"
    : "linear-gradient(170deg, #faf0da 0%, #efdbb4 55%, #dec08e 100%)";
  const borderOuter = dark ? "#8e7346" : "#4b3219";
  const borderInner = dark ? "rgba(218, 180, 107, 0.36)" : "rgba(92, 62, 31, 0.52)";
  const passiveText = dark ? "rgba(235, 228, 212, 0.72)" : "rgba(42, 27, 16, 0.74)";
  const spokenText = dark ? "#f3ead8" : "#22150c";
  const activeText = dark ? "#ebb95c" : "#8b2215";
  const rivet = dark ? "#cda253" : "#6c4b27";

  const firstSpeaker = chunk.words.find((w) => w.speaker && w.speaker !== "galang")?.speaker;
  const speakerLabel =
    firstSpeaker === "andi"
      ? "REKONSTRUKSI · KADER PUTRA"
      : firstSpeaker === "anisa"
      ? "REKONSTRUKSI · KADER PUTRI"
      : firstSpeaker
      ? `REKONSTRUKSI · ${firstSpeaker.toUpperCase()}`
      : null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 342,
        left: 72,
        right: 72,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {speakerLabel && (
        <div
          style={{
            marginBottom: 18,
            padding: "4px 14px",
            background: "linear-gradient(155deg, rgba(139, 44, 24, 0.94), rgba(92, 26, 14, 0.96))",
            border: "1.5px solid rgba(255, 224, 168, 0.72)",
            borderRadius: 4,
            boxShadow: "-2px 5px 10px rgba(0, 0, 0, 0.45)",
            fontFamily: FONT_SANS,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: "#fff3da",
          }}
        >
          {speakerLabel}
        </div>
      )}
      <div
        style={{
          transform: `translateY(${((1 - entry) * 8).toFixed(1)}px) scale(${(0.97 + 0.03 * entry).toFixed(3)})`,
          opacity: entry,
          filter: dark
            ? "drop-shadow(-4px 10px 14px rgba(0, 0, 0, 0.56))"
            : "drop-shadow(-4px 10px 14px rgba(22, 11, 4, 0.52))",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 34px",
            background: bgGrad,
            border: `2px solid ${borderOuter}`,
            clipPath:
              "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
            maxWidth: 880,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${staticFile("art/textures/parchment_grain_alpha.png")})`,
              backgroundSize: "256px 256px",
              opacity: dark ? 0.45 : 0.78,
              pointerEvents: "none",
            }}
          />
          {/* Top chamfered cardstock catchlight + inset framing rule */}
          <div
            style={{
              position: "absolute",
              inset: 5,
              border: `1px solid ${borderInner}`,
              borderTopColor: dark ? "rgba(255, 232, 185, 0.22)" : "rgba(255, 248, 228, 0.58)",
              pointerEvents: "none",
            }}
          />
        {/* Left & Right diamond brass rivets */}
        <span
          style={{
            width: 8,
            height: 8,
            backgroundColor: rivet,
            transform: "rotate(45deg)",
            marginRight: 16,
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "6px 14px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {chunk.words.map((w, idx) => {
            const isActive = t >= w.start - 0.03 && t <= w.end + 0.05;
            const isSpoken = t > w.end + 0.05;
            const pop = isActive
              ? interpolate(t - w.start, [-0.03, 0.05], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0;

            return (
              <span
                key={`${w.start}_${idx}`}
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 38,
                  fontWeight: isActive ? 800 : 700,
                  lineHeight: 1.18,
                  color: isActive ? activeText : isSpoken ? spokenText : passiveText,
                  transform: isActive ? `scale(${(1 + 0.045 * pop).toFixed(3)})` : "scale(1)",
                  transformOrigin: "center bottom",
                  padding: "0 2px",
                  display: "inline-block",
                  letterSpacing: 0.1,
                }}
              >
                {w.w}
              </span>
            );
          })}
        </div>

          <span
            style={{
              width: 8,
              height: 8,
              backgroundColor: rivet,
              transform: "rotate(45deg)",
              marginLeft: 16,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
};
