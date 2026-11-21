import React from "react";
import { AbsoluteFill } from "remotion";

export const VintageOverlay: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 90,
      }}
    >
      {/* Base warm parchment gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(246, 241, 232, 0.45) 0%, rgba(235, 226, 212, 0.75) 75%, rgba(210, 196, 175, 0.95) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Soft Vignette Border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 160px 50px rgba(58, 42, 28, 0.28)",
          mixBlendMode: "darken",
        }}
      />

      {/* Subtle Paper Fiber Border Line */}
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: "1.5px solid rgba(138, 116, 94, 0.25)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
