import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface TypographyHeaderProps {
  kicker: string;
  headline: string;
  subtitle: string;
  fromFrame?: number;
}

export const TypographyHeader: React.FC<TypographyHeaderProps> = ({
  kicker,
  headline,
  subtitle,
  fromFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = Math.max(0, frame - fromFrame);

  const kickerFade = interpolate(relFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const kickerY = interpolate(relFrame, [0, 8], [15, 0], {
    extrapolateRight: "clamp",
  });

  const headlineSpring = spring({
    frame: Math.max(0, relFrame - 4),
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  const subtitleFade = interpolate(relFrame, [10, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        left: 60,
        right: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      {/* Kicker / Time-Tag */}
      <div
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "0.22em",
          color: "#A24838", // Terakota / bata vintage
          textTransform: "uppercase",
          opacity: kickerFade,
          transform: `translateY(${kickerY}px)`,
          marginBottom: 10,
        }}
      >
        {kicker}
      </div>

      {/* Main Headline */}
      <h1
        style={{
          margin: 0,
          fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
          fontSize: 70,
          fontWeight: 900,
          lineHeight: 1.12,
          letterSpacing: "-0.01em",
          color: "#1F1A18", // Charcoal deep sepia
          textTransform: "uppercase",
          opacity: headlineSpring,
          transform: `scale(${0.92 + headlineSpring * 0.08})`,
          textShadow: "0 2px 14px rgba(238, 230, 218, 0.9)",
        }}
      >
        {headline}
      </h1>

      {/* Subtitle / Descriptive Italic */}
      <div
        style={{
          marginTop: 14,
          fontFamily: "'Georgia', 'Garamond', serif",
          fontStyle: "italic",
          fontSize: 34,
          fontWeight: 400,
          color: "#4C3F35",
          opacity: subtitleFade,
          maxWidth: 900,
          lineHeight: 1.35,
        }}
      >
        “{subtitle}”
      </div>
    </div>
  );
};
