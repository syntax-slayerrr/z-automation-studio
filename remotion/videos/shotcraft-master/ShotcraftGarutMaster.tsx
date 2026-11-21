import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import wordsData from "../../../public/assets/audio/shotcraft-garut-words.json";

export const SHOTCRAFT_MASTER_FRAMES = 465; // ~15.5 seconds @ 30fps

// Dynamic Slice Window for subtitle
const WordCaptions: React.FC<{ words: any[]; activeWordIdx: number }> = ({ words, activeWordIdx }) => {
  const currentIdx = activeWordIdx >= 0 ? activeWordIdx : 0;
  const startIdx = Math.max(0, currentIdx - 1);
  const slice = words.slice(startIdx, startIdx + 4);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 140,
        left: 60,
        right: 60,
        display: "flex",
        justifyContent: "center",
        zIndex: 80,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(13, 15, 20, 0.94)",
          padding: "18px 32px",
          borderRadius: 18,
          border: "1px solid rgba(212, 163, 115, 0.3)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          gap: "12px 18px",
          maxWidth: 880,
        }}
      >
        {slice.map((w, idx) => {
          const globalIdx = startIdx + idx;
          const isCurrent = globalIdx === activeWordIdx;
          return (
            <span
              key={globalIdx}
              style={{
                fontSize: 34,
                fontWeight: isCurrent ? 800 : 500,
                color: isCurrent ? "#F3C68F" : "rgba(245, 235, 224, 0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                transform: isCurrent ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.08s ease, color 0.08s ease",
                textShadow: isCurrent
                  ? "0 0 22px rgba(243, 198, 143, 0.85)"
                  : "none",
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

export const ShotcraftGarutMaster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Camera Dolly Physics (Continuous exponential curve)
  const dollyScale = 1.0 + Math.pow(frame / SHOTCRAFT_MASTER_FRAMES, 1.3) * 0.12;

  // Three Beat Progression:
  // Beat 1 (0 - 5.2s / f=0-156): Benteng Alami
  // Beat 2 (5.2 - 10.5s / f=156-315): Barisan Vulkanik & Cimanuk
  // Beat 3 (10.5 - 15.5s / f=315-465): Saksi Lahirnya Pergerakan
  const beat = frame < 156 ? 1 : frame < 315 ? 2 : 3;

  // Beacon & Sonar Pulses
  const pulseLoop = (frame * 1.5) % 45;
  const pulseScale = interpolate(pulseLoop, [0, 45], [1, 2.6]);
  const pulseAlpha = interpolate(pulseLoop, [0, 30, 45], [0.8, 0.25, 0]);

  // Card Assembly Spring (Apple-grade)
  const cardSpring = spring({
    frame: frame % 156,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 140 },
  });

  // Current Subtitle Word
  const words = wordsData.words;
  const activeWordIdx = words.findIndex((w) => time >= w.start && time <= w.end);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B0D11",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 1. Master Audio Voiceover */}
      <Audio src={staticFile("assets/audio/shotcraft-garut.wav")} volume={1.0} />

      {/* 2. World Space (Camera Dolly Driven) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${dollyScale})`,
          transformOrigin: "center 45%",
        }}
      >
        {/* Deep Atmosphere Radial Glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 36%, rgba(212, 163, 115, 0.16) 0%, rgba(22, 26, 34, 0.65) 45%, rgba(11, 13, 17, 1) 90%)",
          }}
        />

        {/* Ambient Topographic Isolines */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.2,
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const r = 240 + i * 80;
            return (
              <circle
                key={i}
                cx={540}
                cy={680}
                r={r}
                fill="none"
                stroke="#D4A373"
                strokeWidth={1.2}
                strokeDasharray={i % 2 === 0 ? "8 6" : "none"}
              />
            );
          })}
        </svg>

        {/* Top Floating Archival Shadowbox */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 90,
            right: 90,
            height: 520,
            backgroundColor: "rgba(18, 21, 28, 0.94)",
            borderRadius: 20,
            border: "1px solid rgba(212, 163, 115, 0.3)",
            boxShadow:
              "0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 50px rgba(0,0,0,0.5)",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
            opacity: interpolate(cardSpring, [0, 1], [0, 1]),
          }}
        >
          {/* Header Metadata */}
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
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.26em",
                color: "#D4A373",
                textTransform: "uppercase",
              }}
            >
              {beat === 1
                ? "ARSIP TOPOGRAFI • PRIANGAN"
                : beat === 2
                ? "GEO-STRATEGIS • GUNUNG & SUNGAI"
                : "SUMBU HISTORIS • KOTA INTAN"}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 15,
                letterSpacing: "0.14em",
                color: "#8FA0B5",
              }}
            >
              7°13'S 107°54'E
            </div>
          </div>

          {/* Central Animated Cartography Graphic */}
          <div
            style={{
              position: "relative",
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Dynamic Real Topography Mountain Ridges */}
            <svg
              viewBox="0 0 400 240"
              style={{
                position: "absolute",
                width: 380,
                height: 220,
                opacity: 0.35,
              }}
            >
              {/* Mountain Silhouette Line Art */}
              <path
                d="M 40 190 Q 110 60 190 130 T 310 70 T 380 180"
                fill="none"
                stroke="#D4A373"
                strokeWidth="2"
              />
              <path
                d="M 80 195 Q 140 90 200 145 T 320 100"
                fill="none"
                stroke="#D4A373"
                strokeWidth="1.2"
                strokeDasharray="6 4"
              />
              {/* River Cimanuk Stream */}
              <path
                d="M 50 40 Q 150 90 190 130 T 350 200"
                fill="none"
                stroke="#4A90E2"
                strokeWidth="2.8"
                strokeDasharray="10 6"
              />
            </svg>

            {/* Dial Rotating Axis */}
            <div
              style={{
                position: "absolute",
                width: 230,
                height: 230,
                borderRadius: "50%",
                border: "1px dashed rgba(212, 163, 115, 0.25)",
                transform: `rotate(${frame * 0.12}deg)`,
              }}
            />

            {/* Sonar Beacon */}
            <div
              style={{
                position: "absolute",
                width: 65,
                height: 65,
                borderRadius: "50%",
                border: "2px solid #E63946",
                transform: `scale(${pulseScale})`,
                opacity: pulseAlpha,
              }}
            />

            {/* Glowing Core Dot */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "#E63946",
                boxShadow: "0 0 35px #E63946, 0 0 15px #FFF",
                border: "3px solid #FFF",
                zIndex: 10,
              }}
            />

            {/* Mechanical Target Callout Tag */}
            <div
              style={{
                position: "absolute",
                top: 40,
                left: 480,
                backgroundColor: "rgba(14, 16, 22, 0.95)",
                border: "1px solid #D4A373",
                borderRadius: 6,
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  backgroundColor: "#2ECC71",
                  boxShadow: "0 0 10px #2ECC71",
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#FAF0E6",
                  letterSpacing: "0.12em",
                }}
              >
                {beat === 1
                  ? "BENTENG PRIANGAN"
                  : beat === 2
                  ? "LEMBAH CIMANUK"
                  : "SUMBU PERGERAKAN"}
              </span>
            </div>
          </div>

          {/* Document Footer */}
          <div
            style={{
              borderTop: "1px solid rgba(212, 163, 115, 0.18)",
              paddingTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 14,
              color: "#8FA0B5",
            }}
          >
            <span>KOTA INTAN • SWARNA DWIPA</span>
            <span style={{ color: "#D4A373", fontWeight: 700 }}>
              VERIFIKASI: VALID
            </span>
          </div>
        </div>

        {/* Master Editorial Typography */}
        <div
          style={{
            position: "absolute",
            top: 840,
            left: 70,
            right: 70,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Eyebrow Tag */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.36em",
              color: "#E29578",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {beat === 1
              ? "BENTENG ALAMI PRIANGAN"
              : beat === 2
              ? "BARISAN VULKANIK & SUNGAI"
              : "SAKSI SEJARAH BANGSA"}
          </div>

          {/* Master Serif Gilded Headline (Unified Luxury Tone) */}
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 90,
              fontWeight: 900,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              display: "flex",
              gap: 22,
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
              {beat === 1 ? "GARUT," : beat === 2 ? "LEMBAH" : "SEJARAH"}
            </span>
            <span
              style={{
                color: "#F5EFEB",
                textShadow: "0 4px 25px rgba(255, 255, 255, 0.2)",
              }}
            >
              {beat === 1 ? "PRIANGAN" : beat === 2 ? "CIMANUK" : "GARUT"}
            </span>
          </h1>

          {/* Badge Sub-Tag */}
          <div
            style={{
              marginTop: 26,
              padding: "12px 28px",
              background: "rgba(212, 163, 115, 0.10)",
              border: "1px solid rgba(212, 163, 115, 0.3)",
              borderRadius: 30,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Georgia', serif",
                fontStyle: "italic",
                fontSize: 27,
                color: "#F5EBE0",
                letterSpacing: "0.02em",
              }}
            >
              {beat === 1
                ? "“Benteng Pertahanan Alami di Tanah Sunda”"
                : beat === 2
                ? "“Dipagari Gunung Api dan Air Melimpah”"
                : "“Lahirnya Para Pemikir dan Gerakan Bangsa”"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Luxury Floating Word Captions (Dynamic Slice Window) */}
      <WordCaptions words={words} activeWordIdx={activeWordIdx} />

      {/* 4. Film Grain Texture Overlay (CSS Noise Pattern - Low RAM) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, transparent 70%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 95,
          opacity: 0.8,
        }}
      />

      {/* 5. Vignette Shadow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 160px 60px rgba(0, 0, 0, 0.85)",
          pointerEvents: "none",
          zIndex: 96,
        }}
      />
    </AbsoluteFill>
  );
};
