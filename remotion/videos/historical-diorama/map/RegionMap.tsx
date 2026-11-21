import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MapRouteConfig } from "../types";

export const RegionMap: React.FC<{ config: MapRouteConfig; fromFrame?: number }> = ({
  config,
  fromFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const rel = Math.max(0, frame - fromFrame);

  // Progressive route drawing (0 -> 100%)
  const routeProgress = interpolate(rel, [10, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: "260px 40px 180px 40px",
        borderRadius: 8,
        border: "3px double #8A725C",
        backgroundColor: "#EFE8DC",
        boxShadow: "inset 0 0 40px rgba(110, 90, 70, 0.25), 0 10px 30px rgba(0,0,0,0.15)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 1000 1200" style={{ width: "100%", height: "100%" }}>
        {/* Subtle Map Grid lines */}
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(160, 140, 120, 0.18)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Decorative Sea Names */}
        <text x="120" y="240" fill="#8C7A6B" fontSize="28" fontFamily="Georgia, serif" letterSpacing="6">
          SELAT SUNDA
        </text>
        <text x="600" y="160" fill="#8C7A6B" fontSize="28" fontFamily="Georgia, serif" letterSpacing="6">
          LAUT JAWA
        </text>
        <text x="350" y="1080" fill="#8C7A6B" fontSize="32" fontFamily="Georgia, serif" letterSpacing="8">
          SAMUDRA HINDIA
        </text>

        {/* Stylized Island Landmass (West Java & Banten) */}
        <path
          d="M 180 320 Q 240 260 380 280 T 680 290 T 920 380 L 880 720 Q 650 780 420 800 Q 250 820 160 560 Z"
          fill="#DDD1BF"
          stroke="#9C8570"
          strokeWidth="3"
        />

        {/* Mountain Pictogram Clusters */}
        {[
          [350, 480], [420, 520], [510, 560], [580, 510], [670, 590]
        ].map(([mx, my], idx) => (
          <polygon
            key={idx}
            points={`${mx},${my} ${mx - 22},${my + 36} ${mx + 22},${my + 36}`}
            fill="#B4A490"
            stroke="#7E6A56"
            strokeWidth="2"
          />
        ))}

        {/* Animated Dashed Shipping Route */}
        {config.points.length >= 2 && (
          <g>
            <path
              id="shipRoute"
              d={`M ${config.points[0].coords[0] * 10} ${config.points[0].coords[1] * 12} Q 280 880 ${config.points[1].coords[0] * 10} ${config.points[1].coords[1] * 12}`}
              fill="none"
              stroke={config.routeColor ?? "#B83A2E"}
              strokeWidth="4"
              strokeDasharray="10 8"
              strokeDashoffset={-rel * 2}
            />

            {/* Vehicle Marker Moving Along Route */}
            <circle
              cx={config.points[0].coords[0] * 10 + (config.points[1].coords[0] * 10 - config.points[0].coords[0] * 10) * routeProgress}
              cy={config.points[0].coords[1] * 12 + (config.points[1].coords[1] * 12 - config.points[0].coords[1] * 12) * routeProgress}
              r="18"
              fill="#FFFFFF"
              stroke="#B83A2E"
              strokeWidth="4"
            />
          </g>
        )}

        {/* Location Pins & Callout Tags */}
        {config.points.map((pt, i) => {
          const px = pt.coords[0] * 10;
          const py = pt.coords[1] * 12;
          return (
            <g key={i}>
              <circle cx={px} cy={py} r="10" fill="#B83A2E" stroke="#FFFFFF" strokeWidth="3" />
              {/* Callout box */}
              <rect
                x={px - 80}
                y={py - 60}
                width="160"
                height="44"
                rx="4"
                fill="#FAF6EF"
                stroke="#B83A2E"
                strokeWidth="2"
              />
              <text
                x={px}
                y={py - 32}
                textAnchor="middle"
                fill="#2B211A"
                fontSize="22"
                fontWeight="bold"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                {pt.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
