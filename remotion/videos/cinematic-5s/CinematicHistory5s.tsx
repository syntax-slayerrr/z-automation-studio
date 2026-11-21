import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import wordsData from "../../../public/assets/audio/cinematic-5s-words.json";

export const CINEMATIC_5S_FRAMES = 215; // ~7.15 seconds @ 30fps

export const CinematicHistory5s: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Cinematic continuous slow push-in (macro-dolly)
  const dollyScale = interpolate(frame, [0, CINEMATIC_5S_FRAMES], [1.0, 1.07], {
    extrapolateRight: "clamp",
  });
  const dollyY = interpolate(frame, [0, CINEMATIC_5S_FRAMES], [0, -25], {
    extrapolateRight: "clamp",
  });

  // Gilded sheen sweep across headline (frames 15 to 75)
  const sheenProgress = interpolate(frame, [15, 80], [-100, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Beacon pulse
  const pulse1 = (frame * 1.8) % 60;
  const pulseScale1 = interpolate(pulse1, [0, 60], [1, 3.2]);
  const pulseOpacity1 = interpolate(pulse1, [0, 45, 60], [0.9, 0.4, 0]);

  // Active word subtitle
  const words = wordsData.words;
  const activeWordIdx = words.findIndex((w) => time >= w.start && time <= w.end);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0F1115",
        overflow: "hidden",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      {/* 1. Synchronized Cartesia Voiceover */}
      <Audio src={staticFile("assets/audio/cinematic-5s.wav")} volume={1.0} />

      {/* 2. World Camera Container (Dolly Scale) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${dollyScale}) translateY(${dollyY}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Background Atmospheric Radial Light Glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 42%, rgba(212, 163, 115, 0.18) 0%, rgba(30, 34, 42, 0.6) 45%, rgba(15, 17, 21, 1) 85%)",
          }}
        />

        {/* Topographic Contour Isolines (SVG Vector Terrain) */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.22,
          }}
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A373" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8A5A36" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const r = 260 + i * 75;
            const wobble = Math.sin(frame * 0.03 + i) * 8;
            return (
              <path
                key={i}
                d={`M ${540 - r + wobble} 960 Q 540 ${960 - r * 0.85} ${540 + r - wobble} 960 T ${540 - r + wobble} 960`}
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth={1.5}
                strokeDasharray={i % 2 === 0 ? "8 6" : "none"}
              />
            );
          })}
        </svg>

        {/* Centerpiece Hero: Archival Document Plate (Shadowbox) */}
        <div
          style={{
            position: "absolute",
            top: "32%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 820,
            height: 480,
            backgroundColor: "#1A1D24",
            borderRadius: 8,
            border: "1px solid rgba(212, 163, 115, 0.35)",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.7), inset 0 0 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Header of Document */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(212, 163, 115, 0.2)",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 16,
                letterSpacing: "0.28em",
                color: "#D4A373",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              ARSIP HISTORIS • REKAM PERISTIWA
            </div>
            <div
              style={{
                fontFamily: "'Inter', monospace",
                fontSize: 14,
                letterSpacing: "0.15em",
                color: "#8E9AA8",
              }}
            >
              7°13'S 107°54'E
            </div>
          </div>

          {/* Center Graphic: Compass Rose & Pulsing Garut Beacon */}
          <div
            style={{
              position: "relative",
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Compass Outer Dial */}
            <div
              style={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                border: "1px dashed rgba(212, 163, 115, 0.3)",
                transform: `rotate(${frame * 0.2}deg)`,
              }}
            />

            {/* Pulsing Beacon Rings */}
            <div
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "2px solid #E63946",
                transform: `scale(${pulseScale1})`,
                opacity: pulseOpacity1,
              }}
            />

            {/* Core Pinpoint */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#E63946",
                boxShadow: "0 0 25px #E63946, 0 0 10px #FFF",
                border: "3px solid #FFF",
                zIndex: 10,
              }}
            />

            {/* Floating Tag */}
            <div
              style={{
                position: "absolute",
                top: 30,
                left: 450,
                backgroundColor: "rgba(15, 17, 21, 0.9)",
                border: "1px solid #D4A373",
                borderRadius: 4,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#2ECC71",
                  boxShadow: "0 0 8px #2ECC71",
                }}
              />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#FAF0E6",
                  letterSpacing: "0.1em",
                }}
              >
                TITIK INISIASI: GARUT
              </span>
            </div>
          </div>

          {/* Document Footer */}
          <div
            style={{
              borderTop: "1px solid rgba(212, 163, 115, 0.2)",
              paddingTop: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: "#7E8B9B",
            }}
          >
            <span>KOTA INTAN • JAWA BARAT</span>
            <span style={{ color: "#D4A373", fontWeight: 600 }}>STATUS: TERVERIFIKASI</span>
          </div>
        </div>

        {/* 3. Master Headline Typography */}
        <div
          style={{
            position: "absolute",
            top: "54%",
            left: 70,
            right: 70,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Eyebrow / Kicker */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "0.32em",
              color: "#E29578",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            TITIK BALIK SEJARAH PELAJAR
          </div>

          {/* Unified Gilded Massive Headline (No Broken Word Coloring) */}
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 94,
              fontWeight: 900,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              display: "flex",
              gap: 24,
              justifyContent: "center",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                color: "#E5B97E",
                textShadow: "0 4px 30px rgba(229, 185, 126, 0.35)",
              }}
            >
              GARUT,
            </span>
            <span
              style={{
                color: "#F5EFEB",
                textShadow: "0 4px 25px rgba(255, 255, 255, 0.2)",
              }}
            >
              1958
            </span>
          </h1>

          {/* Subtitle Badge */}
          <div
            style={{
              marginTop: 22,
              padding: "10px 24px",
              background: "rgba(212, 163, 115, 0.12)",
              border: "1px solid rgba(212, 163, 115, 0.35)",
              borderRadius: 30,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Georgia', serif",
                fontStyle: "italic",
                fontSize: 28,
                color: "#F5EBE0",
                letterSpacing: "0.02em",
              }}
            >
              “Kesepakatan Melahirkan Wadah Otonom Pelajar”
            </span>
          </div>
        </div>
      </div>

      {/* 4. Luxury Kinetic Captions (Word-by-word) */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "center",
          zIndex: 80,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(12, 14, 18, 0.88)",
            padding: "18px 34px",
            borderRadius: 16,
            border: "1px solid rgba(212, 163, 115, 0.3)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 16px",
            maxWidth: 900,
          }}
        >
          {words.map((w, idx) => {
            const isCurrent = idx === activeWordIdx;
            return (
              <span
                key={idx}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 34,
                  fontWeight: isCurrent ? 800 : 500,
                  color: isCurrent ? "#F3C68F" : "rgba(245, 235, 224, 0.55)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transform: isCurrent ? "scale(1.1)" : "scale(1)",
                  transition: "transform 0.1s ease, color 0.1s ease",
                  textShadow: isCurrent
                    ? "0 0 20px rgba(243, 198, 143, 0.7)"
                    : "none",
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* 5. Cinematic Vignette & 35mm Grain Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 180px 60px rgba(0, 0, 0, 0.85)",
          pointerEvents: "none",
          zIndex: 90,
        }}
      />
    </AbsoluteFill>
  );
};
