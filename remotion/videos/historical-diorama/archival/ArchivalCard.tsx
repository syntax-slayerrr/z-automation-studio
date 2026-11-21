import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArchivalCardConfig } from "../types";

export const ArchivalCard: React.FC<ArchivalCardConfig & { fromFrame?: number }> = ({
  imageSrc,
  caption,
  sourceText,
  tiltDeg,
  position,
  fromFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = Math.max(0, frame - fromFrame);

  const pop = spring({
    frame: rel,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 100 },
  });

  const getPosStyle = () => {
    switch (position) {
      case "top-right":
        return { top: 480, right: 70 };
      case "bottom-right":
        return { bottom: 220, right: 70 };
      case "bottom-left":
        return { bottom: 220, left: 70 };
      case "center":
      default:
        return { top: "45%", left: "50%", transform: `translate(-50%, -50%) rotate(${tiltDeg}deg) scale(${pop})` };
    }
  };

  const posStyle = getPosStyle();

  return (
    <div
      style={{
        position: "absolute",
        ...posStyle,
        transform: position === "center" ? posStyle.transform : `rotate(${tiltDeg}deg) scale(${pop})`,
        zIndex: 60,
        backgroundColor: "#FAF6EF",
        padding: "16px 16px 20px 16px",
        borderRadius: 4,
        boxShadow: "0 18px 45px rgba(45, 30, 20, 0.35), 0 2px 6px rgba(0,0,0,0.1)",
        border: "1px solid rgba(190, 175, 155, 0.5)",
        maxWidth: 440,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Inner Photo Area */}
      <div
        style={{
          width: 400,
          height: 270,
          backgroundColor: "#DCD3C4",
          overflow: "hidden",
          borderRadius: 2,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        {imageSrc ? (
          <Img
            src={imageSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "sepia(0.35) contrast(1.1) grayscale(0.2)",
            }}
          />
        ) : (
          <div
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              color: "#6D5E52",
              fontSize: 20,
              textAlign: "center",
              padding: 20,
            }}
          >
            [ Foto Arsip Otentik ]
          </div>
        )}
      </div>

      {/* Caption & Citation */}
      <div
        style={{
          marginTop: 12,
          textAlign: "center",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 20,
          color: "#2E241E",
          lineHeight: 1.25,
        }}
      >
        {caption}
      </div>
      {sourceText && (
        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            fontFamily: "sans-serif",
            letterSpacing: "0.08em",
            color: "#8B4A3E",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {sourceText}
        </div>
      )}
    </div>
  );
};
