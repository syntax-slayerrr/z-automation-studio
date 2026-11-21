import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { SUBTITLE_CARDS, EARTH_24H_FRAMES, formatHumanCounter, formatMicrobeCounter } from './story';
import { BRONTO_PATH, DINO_MOON_PATH, TREX_PATH } from './painterlyVectors';

export { EARTH_24H_FRAMES };

const easeInOut = (t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

const lerp = (a: number, b: number, t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  return a + (b - a) * c;
};

const lerpRgb = (c1: [number, number, number], c2: [number, number, number], t: number): string => {
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * c);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * c);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * c);
  return `rgb(${r},${g},${b})`;
};

const describeArc = (r: number, startDeg: number, endDeg: number): string => {
  if (endDeg - startDeg <= 0.1) return '';
  const cappedEnd = Math.min(startDeg + 359.6, endDeg);
  const a0 = (startDeg * Math.PI) / 180;
  const a1 = (cappedEnd * Math.PI) / 180;
  const x0 = r * Math.cos(a0);
  const y0 = r * Math.sin(a0);
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  const large = cappedEnd - startDeg > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

type ClockMode =
  | 'clock_daynight'
  | 'zoom_molten'
  | 'clock_to_ocean'
  | 'ocean_full'
  | 'clock_microbes'
  | 'dinos_full'
  | 'clock_human_end';

function getCameraAndClockState(f: number) {
  let cx = 358;
  let cy = 617;
  let scale = 0.92;
  let hourDeg = 0;
  let minDeg = 0;
  let secDeg: number | null = null;
  let eraHours = 24;
  let minBlurSpan = 0;
  let humanBandAlpha = 0;
  let mode: ClockMode = 'clock_daynight';

  if (f <= 234) {
    mode = 'clock_daynight';
    if (f < 48) {
      const t = easeInOut(f / 48);
      scale = lerp(1.38, 0.945, t);
      cx = lerp(350, 355, t);
      cy = lerp(624, 619, t);
    } else if (f < 216) {
      const t = (f - 48) / 168;
      scale = lerp(0.945, 1.008, t);
      cx = lerp(355, 358, t);
      cy = lerp(619, 626, t);
    } else {
      const t = (f - 216) / 18;
      scale = lerp(1.008, 1.04, t);
      cx = 360;
      cy = 626;
    }

    if (f <= 51) {
      const t1 = Math.max(0, Math.min(1, f / 51));
      const hVal = 24 * (1 - Math.pow(1 - t1, 1.2));
      hourDeg = (hVal / 24) * 360;
      minDeg = f === 51 ? 0 : (hVal % 1) * 360;
      minBlurSpan = 22;
      eraHours = hVal;
    } else if (f <= 212) {
      const t2 = Math.max(0, Math.min(1, (f - 51.5) / (212 - 51.5)));
      const hVal = 24 * (1 - Math.pow(1 - t2, 2.4));
      hourDeg = (hVal / 24) * 360;
      minDeg = f === 212 ? 0 : (hVal % 1) * 360;
      minBlurSpan = f < 192 ? 20 : Math.max(0, 20 * (1 - (f - 192) / 14));
      if (f <= 203) {
        eraHours = f >= 200 ? 24 : Math.min(24, f >= 196 ? hVal * 1.006 : hVal);
      } else {
        eraHours = 24 * (1 - easeInOut((f - 203) / 17));
      }
    } else {
      hourDeg = 0;
      minDeg = 0;
      minBlurSpan = 0;
      eraHours = f < 220 ? 24 * (1 - easeInOut((f - 203) / 17)) : 0;
    }
  } else if (f <= 398) {
    mode = 'zoom_molten';
    eraHours = 0;
    if (f < 250) {
      const t = easeInOut((f - 234) / 16);
      scale = lerp(1.04, 3.2, t);
      cx = 360;
      cy = lerp(626, 562, t);
    } else if (f <= 382) {
      scale = 3.2;
      cx = 360;
      cy = 562;
    } else {
      const t = easeInOut((f - 382) / 16);
      scale = lerp(3.2, 0.96, t);
      cx = 360;
      cy = lerp(562, 622, t);
      hourDeg = lerp(0, 60, t);
      minDeg = lerp(0, 360, t);
      eraHours = lerp(0, 4.2, t);
    }
  } else if (f <= 442) {
    mode = 'clock_to_ocean';
    hourDeg = 60;
    eraHours = 4.2;
    if (f < 427) {
      const t = (f - 398) / 29;
      scale = lerp(0.96, 1.03, t);
      cx = 362;
      cy = 620;
    } else {
      const t = easeInOut((f - 427) / 15);
      scale = lerp(1.03, 2.85, t);
      cx = lerp(362, 360, t);
      cy = lerp(620, 562, t);
    }
  } else if (f <= 560) {
    mode = 'ocean_full';
    cx = 360;
    cy = 562;
    scale = 3.2;
  } else if (f <= 712) {
    mode = 'clock_microbes';
    if (f < 572) {
      const t = easeInOut((f - 560) / 12);
      scale = lerp(3.2, 0.97, t);
      cx = lerp(360, 356, t);
      cy = lerp(562, 620, t);
      const startH = (4 * 60 + 7) / 60;
      hourDeg = (startH / 24) * 360;
      minDeg = (7 / 60) * 360;
      eraHours = startH;
    } else if (f <= 696) {
      const t = (f - 572) / 124;
      scale = lerp(0.97, 1.06, t);
      cx = lerp(356, 361, t);
      cy = 620;
      const mc = formatMicrobeCounter(Math.min(f, 690));
      eraHours = mc.hours;
      hourDeg = (mc.hours / 24) * 360;
      minDeg = (mc.hours % 1) * 360;
      minBlurSpan = f >= 592 && f <= 674 ? 18 : 0;
    } else {
      const t = easeInOut((f - 696) / 16);
      scale = lerp(1.06, 3.2, t);
      cx = lerp(361, 360, t);
      cy = lerp(620, 562, t);
      eraHours = 22.78;
      hourDeg = (22.78 / 24) * 360;
      minDeg = (47 / 60) * 360;
    }
  } else if (f <= 986) {
    mode = 'dinos_full';
    cx = 360;
    cy = 562;
    scale = 3.2;
  } else {
    mode = 'clock_human_end';
    eraHours = 24;
    if (f < 1002) {
      const t = easeInOut((f - 986) / 16);
      scale = lerp(3.2, 0.99, t);
      cx = lerp(360, 355, t);
      cy = lerp(562, 608, t);
      hourDeg = 356;
      minDeg = 290;
      secDeg = 180;
    } else if (f < 1044) {
      const t = (f - 1002) / 42;
      scale = lerp(0.99, 1.08, t);
      cx = lerp(355, 360, t);
      cy = lerp(608, 650, t);
      hourDeg = lerp(356, 359.5, t);
      minDeg = lerp(290, 357, t);
      secDeg = (180 + t * 520) % 360;
    } else if (f < 1072) {
      const t = easeInOut((f - 1044) / 28);
      scale = lerp(1.08, 2.62, t);
      cx = lerp(360, 512, t);
      cy = lerp(650, 1165, t);
      hourDeg = 359.2;
      minDeg = 358.8;
      secDeg = lerp(145, 320.4, easeInOut((f - 1044) / 28));
    } else if (f < 1149) {
      const t = (f - 1072) / 77;
      scale = lerp(2.62, 2.68, Math.sin(Math.min(1, t) * Math.PI * 0.5));
      cx = lerp(512, 470, t);
      cy = lerp(1165, 1220, easeInOut(t));
      hourDeg = 358.8;
      minDeg = 358.8;
      secDeg = lerp(320.4, 360, Math.min(1, (f - 1072) / 60));
      humanBandAlpha = f >= 1073 ? easeInOut((f - 1073) / 8) : 0;
    } else {
      const t = easeInOut((f - 1149) / 21);
      scale = lerp(2.68, 1.035, t);
      cx = lerp(470, 360, t);
      cy = lerp(1220, 700, t);
      hourDeg = 0;
      minDeg = 0;
      secDeg = 0;
      humanBandAlpha = 1;
    }
  }

  return { cx, cy, scale, mode, hourDeg, minDeg, secDeg, eraHours, minBlurSpan, humanBandAlpha };
}

const DayNightDial: React.FC<{ f: number }> = ({ f }) => {
  const cycT = f <= 52 ? f / 52 : Math.min(1, (f - 53) / 161);
  const stops: Array<[number, [number, number, number]]> =
    f <= 52
      ? [
        [0, [170, 196, 186]],
        [0.3, [166, 206, 198]],
        [0.65, [194, 152, 174]],
        [0.88, [216, 162, 100]],
        [1, [216, 162, 100]],
      ]
      : [
        [0, [216, 162, 100]],
        [0.045, [162, 184, 160]],
        [0.14, [192, 204, 194]],
        [0.26, [238, 234, 224]],
        [0.42, [226, 192, 174]],
        [0.55, [216, 170, 146]],
        [0.75, [224, 174, 102]],
        [0.86, [234, 182, 88]],
        [1, [242, 194, 92]],
      ];

  let skyRgb: [number, number, number] = stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (cycT >= t0 && cycT <= t1) {
      const u = (cycT - t0) / Math.max(1e-4, t1 - t0);
      skyRgb = [
        Math.round(c0[0] + (c1[0] - c0[0]) * u),
        Math.round(c0[1] + (c1[1] - c0[1]) * u),
        Math.round(c0[2] + (c1[2] - c0[2]) * u),
      ];
      break;
    }
  }
  const skyCol = `rgb(${skyRgb[0]},${skyRgb[1]},${skyRgb[2]})`;

  let sunX = 212;
  let sunY = 240;
  let rayA = 0.16;
  if (f <= 52) {
    const ang = cycT * Math.PI * 1.45 + 2.65;
    sunX = 424 * (0.48 + 0.25 * Math.cos(ang));
    sunY = 424 * (0.48 + 0.16 * Math.sin(ang));
  } else {
    const sunPhase = (cycT - 0.08) * Math.PI * 1.65;
    sunX = 424 * (0.5 - 0.22 * Math.cos(sunPhase));
    sunY = 424 * (0.56 - 0.23 * Math.sin(sunPhase));
    rayA = cycT < 0.45 ? 0.14 : Math.max(0, 0.14 * (1 - (cycT - 0.45) / 0.18));
  }

  let moonVis = 0;
  let moonX = 250;
  let moonY = 185;
  if (f <= 52 && cycT > 0.72) {
    moonVis = (cycT - 0.72) / 0.28;
  } else if (f > 52) {
    if (cycT < 0.24) {
      moonX = 424 * lerp(0.58, 0.72, cycT / 0.24);
      moonY = 424 * lerp(0.45, 0.54, cycT / 0.24);
      moonVis = 1 - Math.max(0, (cycT - 0.12) / 0.12);
    } else if (cycT > 0.44) {
      const um = Math.min(1, (cycT - 0.44) / 0.42);
      moonX = 424 * lerp(0.34, 0.48, um);
      moonY = 424 * lerp(0.49, 0.4, um);
      moonVis = Math.min(1, (cycT - 0.44) / 0.12);
    }
  }

  const wipeY = f >= 217 ? 424 * (1 - easeInOut((f - 217) / 12)) : 430;

  return (
    <svg width={424} height={424} viewBox="0 0 424 424">
      <rect x={0} y={0} width={424} height={424} fill={skyCol} />
      {rayA > 0.01 && (
        <g style={{ mixBlendMode: 'screen' }}>
          <circle cx={sunX} cy={sunY} r={94} fill={`rgba(255,244,210,${rayA})`} />
          {Array.from({ length: 22 }).map((_, i) => {
            const a0 = i * ((2 * Math.PI) / 22) + cycT * 0.4;
            const p1x = sunX + 275 * Math.cos(a0 - 0.06);
            const p1y = sunY + 275 * Math.sin(a0 - 0.06);
            const p2x = sunX + 275 * Math.cos(a0 + 0.06);
            const p2y = sunY + 275 * Math.sin(a0 + 0.06);
            return <polygon key={i} points={`${sunX},${sunY} ${p1x},${p1y} ${p2x},${p2y}`} fill={`rgba(255,246,214,${rayA})`} />;
          })}
        </g>
      )}
      {sunY < 238 && <circle cx={sunX} cy={sunY} r={24} fill="rgba(238,198,98,0.88)" />}
      {moonVis > 0.05 && (
        <g opacity={moonVis}>
          <circle cx={moonX} cy={moonY} r={19} fill="#f8f0e0" />
          <circle cx={moonX + 7} cy={moonY - 5} r={18} fill={skyCol} />
        </g>
      )}
      <path d="M 0 236 Q 100 206 212 232 T 424 234 L 424 424 L 0 424 Z" fill="#64446c" />
      <path d="M 0 272 Q 112 292 228 262 T 424 276 L 424 424 L 0 424 Z" fill="#422a4e" stroke="rgba(214,198,224,0.85)" strokeWidth={1.6} />
      {f >= 217 && (
        <g>
          <rect x={0} y={wipeY} width={424} height={424 - wipeY} fill="#7a2e1c" />
          <line x1={0} y1={wipeY} x2={424} y2={wipeY} stroke="rgba(224,152,92,0.72)" strokeWidth={2.5} />
        </g>
      )}
    </svg>
  );
};

const MoltenScene: React.FC<{ f: number }> = ({ f }) => {
  const growT = f < 256 ? easeInOut((f - 240) / 16) : 1;
  const rSphere = 48 + (212 - 48) * growT;
  const pulse = 1 + 0.015 * Math.sin(f * 0.14);
  const sphScale = (rSphere / 212) * pulse;
  const cloudT = f >= 246 ? easeInOut((f - 246) / 14) : 0;
  const yOff = (1 - cloudT) * 260;

  return (
    <div style={{ position: 'relative', width: 720, height: 1280, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 44%, #944428 0%, #5e201a 58%, #3e1216 100%)',
        }}
      />
      {/* Wide incandescent planetary corona (1.42x radius) using Screen blend */}
      <div
        style={{
          position: 'absolute',
          left: 360 - rSphere * 1.44,
          top: 562 - rSphere * 1.44,
          width: rSphere * 2.88,
          height: rSphere * 2.88,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(252,188,96,0.74) 0%, rgba(242,146,56,0.52) 48%, rgba(214,102,34,0.22) 72%, rgba(0,0,0,0) 86%)',
          mixBlendMode: 'screen',
          filter: 'blur(18px)',
        }}
      />
      {/* Spiral galaxy, sparkles, outer segmented arcs & ascending volcanic embers */}
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0 }}>
        {Array.from({ length: 42 }).map((_, tStep) => {
          const theta = tStep * 0.34 + f * 0.008;
          const gr = tStep * 1.4;
          return (
            <circle
              key={tStep}
              cx={205 + gr * Math.cos(theta) * 1.55}
              cy={195 + gr * Math.sin(theta) * 0.72}
              r={1.3}
              fill="rgba(238,198,158,0.6)"
            />
          );
        })}
        {[
          [148, 314, 9],
          [676, 562, 11],
          [612, 240, 6],
          [528, 326, 5],
        ].map(([sx, sy, ss], i) => (
          <polygon
            key={i}
            points={`${sx},${sy - ss} ${sx + ss * 0.22},${sy - ss * 0.22} ${sx + ss},${sy} ${sx + ss * 0.22},${sy + ss * 0.22} ${sx},${sy + ss} ${sx - ss * 0.22},${sy + ss * 0.22} ${sx - ss},${sy} ${sx - ss * 0.22},${sy - ss * 0.22}`}
            fill="rgba(252,226,178,0.85)"
          />
        ))}
        {f >= 250 && (
          <g transform="translate(360,562)" opacity={easeInOut((f - 250) / 10) * 0.55}>
            {[
              [-148, -110],
              [-95, -52],
              [-36, 8],
              [18, 52],
              [132, 168],
              [180, 212],
            ].map(([d0, d1], i) => (
              <path key={i} d={describeArc(238, d0, d1)} fill="none" stroke="#e09c76" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      <Img
        src={staticFile('earth-24h/layers/molten_sphere_v6.png')}
        style={{
          position: 'absolute',
          left: 360 - 240 * sphScale,
          top: 562 - 240 * sphScale,
          width: 480 * sphScale,
          height: 480 * sphScale,
        }}
      />
      {/* Rising glowing volcanic embers */}
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen' }}>
        {Array.from({ length: 22 }).map((_, k) => {
          const ex = ((k * 137 + 55 + 16 * Math.sin(f * 0.06 + k)) % 680) + 20;
          const ey = (((880 - ((f - 235) * (1.8 + (k % 4) * 0.65) + k * 43)) % 760) + 760) % 760 + 180;
          const er = 1.4 + (k % 3) * 0.8;
          const ea = 0.48 + 0.34 * (0.5 + 0.5 * Math.sin(f * 0.15 + k * 1.7));
          return <circle key={k} cx={ex} cy={ey} r={er} fill={`rgba(254,214,138,${ea.toFixed(2)})`} />;
        })}
      </svg>
      {/* Proscenium curved framing curtains with shadow-box bevels */}
      <Img src={staticFile('earth-24h/layers/molten_frame_v6.png')} style={{ position: 'absolute', left: 0, top: 0, width: 720, height: 1280 }} />
      {/* 2-Tier Parallax Volcanic Clouds (orange bounced rim back + deep shadowed front) */}
      {cloudT > 0.01 && (
        <>
          <Img
            src={staticFile('earth-24h/layers/molten_clouds_v6_back.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: (1 - cloudT) * 215 + 3 * Math.sin(f * 0.04),
              width: 720,
              height: 1280,
            }}
          />
          <Img
            src={staticFile('earth-24h/layers/molten_clouds_v6_front.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: (1 - cloudT) * 285 - 2 * Math.sin(f * 0.04),
              width: 720,
              height: 1280,
            }}
          />
        </>
      )}
    </div>
  );
};

const OceanScene: React.FC<{ f: number }> = ({ f }) => {
  const dx = 4.5 * Math.sin((f - 450) * 0.04);
  const dy = 4.0 * Math.cos((f - 450) * 0.035);
  const rods: Array<[number, number, number, number, number]> = [
    [97, 296, 56, 15, -36],
    [473, 354, 58, 14, 88],
    [663, 493, 56, 14, -64],
    [16, 571, 54, 14, 34],
    [373, 627, 68, 16, -34],
    [387, 781, 52, 13, 76],
  ];
  const cells: Array<[number, number, number]> = [
    [442, 578, 48],
    [284, 444, 30],
    [284, 679, 28],
    [628, 434, 28],
    [648, 444, 23],
    [2, 650, 26],
  ];
  const chains: Array<[number, number, number, number, number]> = [
    [96, 542, 20, 11, 84],
    [128, 835, 22, 13, 24],
    [518, 636, 24, 14, 62],
    [656, 756, 19, 10, 36],
    [520, 908, 21, 12, 42],
    [698, 558, 19, 10, 68],
  ];

  const bPulse = 0.92 + 0.08 * Math.sin((f - 440) * 0.08);
  return (
    <div style={{ position: 'relative', width: 720, height: 1280, overflow: 'hidden' }}>
      <Img src={staticFile('earth-24h/layers/ocean_backdrop_v6.png')} style={{ position: 'absolute', left: 0, top: 0, width: 720, height: 1280 }} />
      <div
        style={{
          position: 'absolute',
          left: 442 - 175,
          top: 578 - 175,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(145,246,228,${(0.56 * bPulse).toFixed(2)}) 0%, rgba(130,236,220,0) 70%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* Ascending shimmering underwater micro-bubbles */}
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen' }}>
        {Array.from({ length: 18 }).map((_, bi) => {
          const bx = ((bi * 179 + 64 + 8 * Math.sin(f * 0.05 + bi)) % 640) + 40;
          const by = (((940 - ((f - 430) * (1.2 + (bi % 3) * 0.5) + bi * 49)) % 760) + 760) % 760 + 165;
          const br = 1.6 + (bi % 3) * 1.0;
          return <circle key={bi} cx={bx} cy={by} r={br} fill="rgba(224,254,250,0.52)" />;
        })}
      </svg>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <filter id="microShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="4" dy="6" stdDeviation="3.8" floodColor="#061e22" floodOpacity="0.58" />
          </filter>
        </defs>
        <g filter="url(#microShadow)">
          {rods.map(([rx, ry, rlen, rrad, rang], i) => {
            const ox = rx + dx * (i % 2 === 0 ? 1 : -0.8);
            const oy = ry + dy * (i % 3 === 0 ? 0.8 : -0.7);
            return (
              <g key={i} transform={`translate(${ox}, ${oy}) rotate(${rang})`}>
                <rect x={-rlen / 2 - rrad} y={-rrad} width={rlen + rrad * 2} height={rrad * 2} rx={rrad} fill="#baee94" />
                <rect x={-rlen / 2 - rrad * 0.5} y={-rrad * 0.52} width={rlen + rrad} height={rrad * 0.5} rx={rrad * 0.25} fill="rgba(232,255,204,0.48)" />
                <circle cx={-rlen * 0.25} cy={0} r={rrad * 0.24} fill="#36784a" />
                <circle cx={rlen * 0.25} cy={0} r={rrad * 0.24} fill="#36784a" />
              </g>
            );
          })}
          {chains.map(([cx0, cy0, cstep, cbrad, cang], i) => {
            const a = (cang * Math.PI) / 180;
            return (
              <g key={i}>
                {[-1, 0, 1].map((k) => {
                  const bx = cx0 + k * cstep * Math.cos(a) + dx * 0.5;
                  const by = cy0 + k * cstep * Math.sin(a) + dy * 0.5;
                  return (
                    <g key={k}>
                      <circle cx={bx} cy={by} r={cbrad} fill="#a6e4ea" stroke="#e8fcfe" strokeWidth={1.2} />
                      <circle cx={bx} cy={by} r={cbrad * 0.36} fill="#2a7880" />
                    </g>
                  );
                })}
              </g>
            );
          })}
          {cells.map(([ccx, ccy, cr], i) => {
            const ox = ccx + dx * (i % 2 === 0 ? -0.7 : 0.9);
            const oy = ccy + dy * (i % 2 === 0 ? 0.9 : -0.6);
            return (
              <g key={i}>
                <circle cx={ox} cy={oy} r={cr} fill="#a8e8e0" stroke="#e8fffa" strokeWidth={1.6} />
                <circle cx={ox} cy={oy} r={cr * 0.72} fill="#ccf8f0" stroke="#8ed4cc" strokeWidth={1} />
                <path
                  d={describeArc(cr * 0.82, 200, 274)}
                  transform={`translate(${ox}, ${oy})`}
                  fill="none"
                  stroke="rgba(255,255,255,0.78)"
                  strokeWidth={Math.max(2, cr * 0.08)}
                  strokeLinecap="round"
                />
                <circle cx={ox + cr * 0.24} cy={oy - cr * 0.08} r={cr * 0.25} fill="#388080" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const DinosScene: React.FC<{ f: number }> = ({ f }) => {
  const moonShift = f >= 840 ? easeInOut((f - 840) / 18) : 0;
  const dustT = f >= 936 ? easeInOut((f - 936) / 18) : 0;
  const enterT = f < 730 ? easeInOut((f - 702) / 26) : 1;
  const fallT = f >= 942 ? easeInOut((f - 942) / 23) : 0;
  const idleBob = f >= 730 && f < 942 ? 1.6 * Math.sin((f - 730) * 0.09) : 0;

  const df = f - 920;
  const astX = 367 + df * -7.4;
  const astY = 478 + df * 18.8;
  const flashAlpha =
    f >= 926 && f <= 952 ? (f <= 936 ? easeInOut((f - 926) / 10) : 1 - easeInOut((f - 936) / 16)) : 0;

  const cometHeat = f >= 908 && f <= 935 ? Math.min(1, Math.max(0, (f - 908) / 16)) : 0;
  const wrapStrength = Math.max(cometHeat * 0.65, f >= 936 ? dustT * 0.85 : 0);
  const bx = (1 - enterT) * -80 + fallT * -55;
  const by = (1 - enterT) * 36 + fallT * 430 + idleBob;
  const tx = (1 - enterT) * 140 + fallT * 45;
  const ty = (1 - enterT) * 14 + fallT * 430 - idleBob * 0.7;

  return (
    <div style={{ position: 'relative', width: 720, height: 1280, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 42%, #905ca8 0%, #5c3b7c 58%, #342258 100%)',
        }}
      />
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0 }}>
        {Array.from({ length: 48 }).map((_, i) => {
          const sx = ((i * 197 + 43) % 700) + 10;
          const sy = ((i * 113 + 29) % 660) + 20;
          const op = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(f * 0.08 + i));
          return <circle key={i} cx={sx} cy={sy} r={i % 3 === 0 ? 1.8 : 1.1} fill={`rgba(235,215,245,${op.toFixed(2)})`} />;
        })}
        {DINO_MOON_PATH && (
          <path d={DINO_MOON_PATH} transform={`translate(${-32 * moonShift}, ${52 * moonShift})`} fill="rgba(228,186,184,0.96)" />
        )}
        {f >= 710 && f <= 900 && (
          <polygon
            points={`${470 + 18 * Math.sin((f - 710) * 0.03) - 42},${248 + 4 * Math.cos((f - 710) * 0.04) + 2} ${470 + 18 * Math.sin((f - 710) * 0.03) - 6},${248 + 4 * Math.cos((f - 710) * 0.04) - 6} ${470 + 18 * Math.sin((f - 710) * 0.03) + 38},${248 + 4 * Math.cos((f - 710) * 0.04) + 1} ${470 + 18 * Math.sin((f - 710) * 0.03)},${248 + 4 * Math.cos((f - 710) * 0.04) + 3}`}
            fill="rgba(66,42,98,0.7)"
          />
        )}
      </svg>

      {/* Far Misty Prehistoric Palms (Atmospheric Perspective Plane 1) */}
      {f < 952 && (
        <Img
          src={staticFile('earth-24h/layers/palms_far_v6.png')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 720,
            height: 1280,
            opacity: f < 936 ? 0.92 : Math.max(0, 1 - (f - 936) / 14),
          }}
        />
      )}

      {/* Billowing Comet-Lit Cosmic Plume (f = 900..935) */}
      {f >= 900 && f <= 935 && (
        <Img
          src={staticFile('earth-24h/layers/asteroid_plume_v6.png')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 720,
            height: 1280,
            opacity: easeInOut((f - 900) / 10),
          }}
        />
      )}

      {/* Multi-Tiered Terracotta Dust Cloud Bank STRICTLY BEHIND Near Palms (f >= 936) */}
      {f >= 936 && (
        <Img
          src={staticFile('earth-24h/layers/dust_clouds_v6.png')}
          style={{
            position: 'absolute',
            left: 0,
            top: (1 - dustT) * 200,
            width: 720,
            height: 1280,
            opacity: Math.min(1, dustT * 1.2),
          }}
        />
      )}

      {/* Soft Valley Purple Ground Mist separating background palms from foreground dinosaurs */}
      {f < 946 && (
        <div
          style={{
            position: 'absolute',
            left: -60,
            top: 740,
            width: 840,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(168,128,200,0.36) 0%, rgba(168,128,200,0) 70%)',
            opacity: f < 936 ? 1 : Math.max(0, 1 - (f - 936) / 10),
            filter: 'blur(20px)',
          }}
        />
      )}

      {/* Foreground Velvety Cycad Palms + Optical Orange Edge Light-Wrap */}
      <Img src={staticFile('earth-24h/layers/palms_near_v6.png')} style={{ position: 'absolute', left: 0, top: 0, width: 720, height: 1280 }} />
      {wrapStrength > 0.02 && (
        <Img
          src={staticFile('earth-24h/layers/palms_backlight_v6.png')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 720,
            height: 1280,
            opacity: wrapStrength,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Foreground Ground Hills */}
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0 }}>
        <polygon points="0,902 140,886 265,884 390,898 540,908 720,892 720,1280 0,1280" fill="#322052" />
        <polyline points="0,902 140,886 265,884 390,898 540,908 720,892" fill="none" stroke="rgba(176,146,208,0.82)" strokeWidth={2} />
      </svg>

      {/* Fallen Dinosaur Silhouette + Drifting Ash Embers (f >= 944, matching REF f=965) */}
      {f >= 944 && (
        <>
          <Img
            src={staticFile('earth-24h/layers/fallen_dino_v6.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: (1 - easeInOut((f - 944) / 16)) * 28,
              width: 720,
              height: 1280,
              opacity: easeInOut((f - 944) / 16),
            }}
          />
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen' }}>
            {Array.from({ length: 24 }).map((_, k) => {
              const ax = ((k * 167 + (f - 944) * (1.2 + (k % 3) * 0.4)) % 700) + 10;
              const ay = ((k * 119 + 290 + (f - 944) * (0.9 + (k % 4) * 0.35)) % 620) + 260;
              const ar = 1.3 + (k % 3) * 0.7;
              return <circle key={k} cx={ax} cy={ay} r={ar} fill={`rgba(252,206,138,${(0.52 * dustT).toFixed(2)})`} />;
            })}
          </svg>
        </>
      )}

      {/* Grounded Contact Shadows + Smooth Rim-Lit Dinosaurs + Dynamic Asteroid Re-Lighting */}
      {fallT < 0.99 && (
        <>
          {enterT > 0.5 && fallT < 0.3 && (
            <div style={{ position: 'absolute', inset: 0, opacity: (1 - fallT / 0.3) * Math.min(1, (enterT - 0.5) * 2) }}>
              <div
                style={{
                  position: 'absolute',
                  left: 135,
                  top: 895,
                  width: 360,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(22,10,36,0.52)',
                  filter: 'blur(9px)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 545,
                  top: 900,
                  width: 145,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(22,10,36,0.52)',
                  filter: 'blur(9px)',
                }}
              />
            </div>
          )}
          <Img
            src={staticFile('earth-24h/layers/bronto_layer.png')}
            style={{ position: 'absolute', left: bx, top: by, width: 720, height: 1280 }}
          />
          <Img
            src={staticFile('earth-24h/layers/trex_layer.png')}
            style={{ position: 'absolute', left: tx, top: ty, width: 720, height: 1280 }}
          />
          {cometHeat > 0.02 && (
            <>
              <Img
                src={staticFile('earth-24h/layers/bronto_lit_v6.png')}
                style={{ position: 'absolute', left: bx, top: by, width: 720, height: 1280, opacity: cometHeat * 0.85, mixBlendMode: 'screen' }}
              />
              <Img
                src={staticFile('earth-24h/layers/trex_lit_v6.png')}
                style={{ position: 'absolute', left: tx, top: ty, width: 720, height: 1280, opacity: cometHeat * 0.85, mixBlendMode: 'screen' }}
              />
            </>
          )}
        </>
      )}

      {/* Streaking Blazing Asteroid w/ Feathered SVG Corona, Trailing Sparks & Bow-Shock Rim */}
      {f >= 900 && f <= 934 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {f >= 912 && (
            <div
              style={{
                position: 'absolute',
                left: 70,
                top: 445,
                width: 580,
                height: 285,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(246,166,118,${0.58 * Math.min(1, (f - 912) / 14)}) 0%, rgba(0,0,0,0) 70%)`,
                mixBlendMode: 'screen',
                filter: 'blur(20px)',
              }}
            />
          )}
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen' }}>
            <defs>
              <filter id="cometCorona" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
              <filter id="cometSoft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
            </defs>
            <g filter="url(#cometCorona)">
              <circle cx={astX} cy={astY + 8} r={118} fill="rgba(254,182,126,0.68)" />
              <polygon
                points={`${astX - 58},${astY - 28} ${astX + 58},${astY + 30} ${astX + 350},${astY - 500} ${astX + 290},${astY - 500}`}
                fill="rgba(238,128,58,0.72)"
              />
            </g>
            <g filter="url(#cometSoft)">
              <polygon
                points={`${astX - 38},${astY - 19} ${astX + 38},${astY + 21} ${astX + 335},${astY - 500} ${astX + 301},${astY - 500}`}
                fill="rgba(236,128,56,0.9)"
              />
              <polygon
                points={`${astX - 20},${astY - 11} ${astX + 20},${astY + 11} ${astX + 293},${astY - 455}`}
                fill="rgba(255,242,212,0.96)"
              />
              {Array.from({ length: 14 }).map((_, si) => {
                const us = (si + 0.5) / 14;
                const sx = astX + 315 * us + Math.sin(si * 3.7 + f * 0.25) * (24 + 18 * us);
                const sy = astY - 500 * us + Math.cos(si * 2.9 + f * 0.22) * (18 + 14 * us);
                return <circle key={si} cx={sx} cy={sy} r={2 + (si % 3) * 1.2} fill="rgba(255,224,162,0.85)" />;
              })}
            </g>
          </svg>
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0 }}>
            <polygon
              points={`${astX - 46},${astY + 10} ${astX - 38},${astY - 16} ${astX - 14},${astY - 42} ${astX + 16},${astY - 36} ${astX + 38},${astY - 12} ${astX + 42},${astY + 22} ${astX + 18},${astY + 46} ${astX - 20},${astY + 48}`}
              fill="#50302a"
              stroke="#f8b260"
              strokeWidth={2.4}
            />
            <polyline
              points={`${astX - 46},${astY + 10} ${astX - 44},${astY + 30} ${astX - 20},${astY + 48} ${astX + 18},${astY + 46}`}
              fill="none"
              stroke="#ffeaba"
              strokeWidth={3.2}
              strokeLinecap="round"
            />
            <circle cx={astX - 14} cy={astY - 10} r={7.5} fill="#b0927e" stroke="#3a221c" strokeWidth={1} />
            <circle cx={astX + 14} cy={astY - 14} r={5.5} fill="#b0927e" stroke="#3a221c" strokeWidth={1} />
            <circle cx={astX - 4} cy={astY + 22} r={9.5} fill="#b0927e" stroke="#3a221c" strokeWidth={1} />
            <circle cx={astX + 20} cy={astY + 12} r={4.5} fill="#b0927e" stroke="#3a221c" strokeWidth={1} />
          </svg>
        </div>
      )}

      {flashAlpha > 0.01 && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(248,242,228,${flashAlpha * 0.97})` }} />
      )}
    </div>
  );
};

const PostImpactTwilightDial: React.FC = () => (
  <div style={{ position: 'relative', width: 424, height: 424, background: 'linear-gradient(180deg, #805458 0%, #54364c 100%)', overflow: 'hidden' }}>
    <Img src={staticFile('earth-24h/layers/twilight_palms_vp.png')} style={{ position: 'absolute', left: 0, top: 0, width: 424, height: 424 }} />
    <svg width={424} height={424} viewBox="0 0 424 424" style={{ position: 'absolute', left: 0, top: 0 }}>
      <ellipse cx={116} cy={358} rx={160} ry={88} fill="#442c48" stroke="#946c80" strokeWidth={1.5} />
      <ellipse cx={308} cy={362} rx={160} ry={84} fill="#3e2844" stroke="#946c80" strokeWidth={1.5} />
      <polygon points="0,322 212,310 424,326 424,424 0,424" fill="#2c1c52" />
    </svg>
  </div>
);

export const Earth24HoursShort: React.FC = () => {
  const f = useCurrentFrame();
  const cam = getCameraAndClockState(f);
  const gearRot = f * 0.25;
  const gearAlpha = Math.max(0, Math.min(1, (2.6 - cam.scale) / 1.1));

  // Crossfade to/from fullscreen era scenes during deep dive transitions
  let fullOceanAlpha = cam.mode === 'ocean_full' ? 1 : 0;
  if (cam.mode === 'clock_to_ocean' && f >= 435) fullOceanAlpha = easeInOut((f - 435) / 7);
  if (cam.mode === 'clock_microbes' && f <= 568) fullOceanAlpha = Math.max(0, 1 - easeInOut((f - 560) / 8));

  let fullDinoAlpha = cam.mode === 'dinos_full' ? 1 : 0;
  if (cam.mode === 'clock_microbes' && f >= 702) fullDinoAlpha = easeInOut((f - 702) / 10);

  const isFullMolten = cam.mode === 'zoom_molten' && f >= 250 && f <= 382;
  const wipeU = f >= 386 ? easeInOut((f - 386) / 28) : 0;
  const duskBlend = cam.mode === 'clock_daynight' && f >= 212 ? 0.72 * easeInOut((f - 212) / 22) : 0;

  // Determine synced header + subheader matching typography.py
  let headerTitle = '';
  let headerSub = '';
  let headerAlpha = 1;
  let subAlpha = 0;
  let plusMinus = false;

  if (f >= 8 && f <= 226) {
    headerAlpha = easeInOut((f - 8) / 8) * (f >= 216 ? 1 - easeInOut((f - 216) / 10) : 1);
    headerTitle = '4,5 miliar tahun';
    if (f >= 25) {
      headerSub = '24 jam';
      subAlpha = easeInOut((f - 25) / 8) * (f >= 216 ? 1 - easeInOut((f - 216) / 10) : 1);
    }
  } else if (f >= 232 && f <= 395) {
    headerAlpha = easeInOut((f - 232) / 8) * (f >= 388 ? 1 - easeInOut((f - 388) / 7) : 1);
    headerTitle = '00.00';
    if (f >= 264) {
      headerSub = 'BUMI TERBENTUK';
      subAlpha = easeInOut((f - 264) / 8) * headerAlpha;
    }
  } else if (f >= 402 && f <= 565) {
    headerAlpha = easeInOut((f - 402) / 8) * (f >= 558 ? 1 - easeInOut((f - 558) / 7) : 1);
    headerTitle = '04.00';
    plusMinus = true;
    if (f >= 426) {
      headerSub = 'KEHIDUPAN PERTAMA';
      subAlpha = easeInOut((f - 426) / 8) * headerAlpha;
    }
  } else if (f >= 580 && f <= 695) {
    headerAlpha = easeInOut((f - 580) / 8) * (f >= 689 ? 1 - easeInOut((f - 689) / 6) : 1);
    headerTitle = formatMicrobeCounter(Math.min(f, 690)).label;
    if (f >= 658) {
      headerSub = 'MAKHLUK MIKROSKOPIS';
      subAlpha = easeInOut((f - 658) / 6) * headerAlpha;
    }
  } else if (f >= 700 && f <= 844) {
    headerAlpha = easeInOut((f - 700) / 7) * (f >= 838 ? 1 - easeInOut((f - 838) / 7) : 1);
    headerTitle = '22.47';
    if (f >= 710) {
      headerSub = 'DINOSAURUS DATANG';
      subAlpha = easeInOut((f - 710) / 8) * headerAlpha;
    }
  } else if (f >= 845 && f <= 988) {
    headerAlpha = easeInOut((f - 845) / 8) * (f >= 980 ? 1 - easeInOut((f - 980) / 8) : 1);
    headerTitle = '23.39';
    if (f >= 910) {
      headerSub = 'ASTEROID • PUNAH';
      subAlpha = easeInOut((f - 910) / 8) * headerAlpha;
    }
  } else if (f >= 1005 && f <= 1131) {
    headerAlpha = easeInOut((f - 1005) / 8);
    headerTitle = formatHumanCounter(f);
    if (f >= 1084) {
      headerSub = 'MANUSIA MUNCUL';
      subAlpha = easeInOut((f - 1084) / 8);
    }
  } else if (f >= 1132) {
    headerAlpha = easeInOut((f - 1132) / 6);
    headerTitle = '24.00';
    if (f >= 1138) {
      headerSub = 'TENGAH MALAM';
      subAlpha = easeInOut((f - 1138) / 8);
    }
  }

  // Active subtitle card with 2-frame cardstock ink lag matching typography.py
  const activeCard = SUBTITLE_CARDS.find((c) => f >= c.startFrame && f <= c.endFrame);
  let activeWordIdx = 0;
  if (activeCard) {
    for (const [ws, we, wi] of activeCard.highlights) {
      if (f >= ws && f <= we) {
        activeWordIdx = wi;
        break;
      } else if (f > we) {
        activeWordIdx = wi;
      }
    }
  }
  const cardInkAlpha = activeCard ? Math.min(1, Math.max(0, (f - activeCard.startFrame) / 2)) : 0;

  const flareAlpha =
    f >= 1128 && f <= 1154 ? (f <= 1134 ? easeInOut((f - 1128) / 6) : 1 - easeInOut((f - 1134) / 20)) : 0;
  const openFade = f < 8 ? easeInOut(f / 8) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#160a1e', overflow: 'hidden', opacity: openFade }}>
      <Audio src={staticFile('earth-24h/audio.m4a')} />

      {/* 1. Starry Indigo Outer Space Backdrop */}
      {!isFullMolten && fullOceanAlpha < 0.99 && fullDinoAlpha < 0.99 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 45%, #2e1a40 0%, #150a1e 100%)',
          }}
        >
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', left: 0, top: 0 }}>
            {Array.from({ length: 64 }).map((_, i) => {
              const sx = (i * 163 + 23) % 700 + 10;
              const sy = (i * 199 + 17) % 1200 + 15;
              const op = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(f * 0.08 + i));
              return <circle key={i} cx={sx} cy={sy} r={i % 4 === 0 ? 2 : 1.2} fill={`rgba(228,212,238,${op.toFixed(2)})`} />;
            })}
            {[
              [-10, 1272, 82],
              [98, 1265, 75],
              [218, 1270, 78],
              [342, 1262, 86],
              [482, 1268, 78],
              [602, 1264, 76],
              [722, 1270, 82],
            ].map(([lx, ly, lr], i) => (
              <circle key={i} cx={lx} cy={ly} r={lr} fill="#160c22" stroke="rgba(108,92,134,0.7)" strokeWidth={2} />
            ))}
          </svg>
        </div>
      )}

      {/* 2. Clock Rig + Inner Painterly Viewport */}
      {!isFullMolten && fullOceanAlpha < 0.99 && fullDinoAlpha < 0.99 && (
        <div
          style={{
            position: 'absolute',
            left: cam.cx,
            top: cam.cy,
            width: 0,
            height: 0,
            transform: `scale(${cam.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* 2-Plane Corner Painterly Bronze Gears (far plane first, near plane on top) */}
          {gearAlpha > 0.02 && (
            <div style={{ opacity: gearAlpha }}>
              <Img
                src={staticFile('earth-24h/layers/gear_tl_lg.png')}
                style={{ position: 'absolute', left: -315 - 144, top: -370 - 144, width: 288, height: 288, transform: `rotate(${gearRot}deg)` }}
              />
              <Img
                src={staticFile('earth-24h/layers/gear_br_lg.png')}
                style={{ position: 'absolute', left: 312 - 142, top: 372 - 142, width: 284, height: 284, transform: `rotate(${-gearRot * 0.9}deg)` }}
              />
              <Img
                src={staticFile('earth-24h/layers/gear_tl_md.png')}
                style={{ position: 'absolute', left: -202 - 88, top: -472 - 88, width: 176, height: 176, transform: `rotate(${-gearRot * 1.35}deg)` }}
              />
              <Img
                src={staticFile('earth-24h/layers/gear_br_md.png')}
                style={{ position: 'absolute', left: 215 - 86, top: 255 - 86, width: 172, height: 172, transform: `rotate(${gearRot * 1.25}deg)` }}
              />
            </div>
          )}

          {/* Circular Inner Scene Viewport (r=210, cropped cleanly around [148..572, 350..774]) */}
          <div style={{ position: 'absolute', left: -210, top: -210, width: 420, height: 420, borderRadius: '50%', overflow: 'hidden' }}>
            {cam.mode === 'clock_daynight' && (
              <>
                <DayNightDial f={f} />
                {duskBlend > 0.01 && (
                  <div style={{ position: 'absolute', left: 0, top: 0, opacity: duskBlend }}>
                    <div style={{ marginLeft: -148, marginTop: -350 }}>
                      <MoltenScene f={f} />
                    </div>
                  </div>
                )}
              </>
            )}
            {cam.mode === 'zoom_molten' && (
              <>
                <div style={{ marginLeft: -148, marginTop: -350 }}>
                  <MoltenScene f={f} />
                </div>
                {f >= 386 && (
                  <div style={{ position: 'absolute', left: 0, top: 0, width: 424, height: 424 * wipeU, overflow: 'hidden' }}>
                    <div style={{ marginLeft: -148, marginTop: -350 }}>
                      <OceanScene f={f} />
                    </div>
                  </div>
                )}
              </>
            )}
            {cam.mode === 'clock_to_ocean' && (
              <>
                {f <= 414 ? (
                  <>
                    <div style={{ marginLeft: -148, marginTop: -350 }}>
                      <MoltenScene f={f} />
                    </div>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: 424, height: 424 * wipeU, overflow: 'hidden' }}>
                      <div style={{ marginLeft: -148, marginTop: -350 }}>
                        <OceanScene f={f} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ marginLeft: -148, marginTop: -350 }}>
                    <OceanScene f={f} />
                  </div>
                )}
              </>
            )}
            {cam.mode === 'clock_microbes' && (
              <div style={{ marginLeft: -148, marginTop: -350 }}>
                {f < 674 ? <OceanScene f={f} /> : <DinosScene f={f} />}
              </div>
            )}
            {cam.mode === 'clock_human_end' && <PostImpactTwilightDial />}
          </div>

          {/* High-Res V6 Shadow-Box Painterly Clock Plate (directional gold scallops, groove AO & inward cast shadow) */}
          <Img
            src={staticFile('earth-24h/layers/clock_plate_v6.png')}
            style={{ position: 'absolute', left: -410, top: -410, width: 820, height: 820 }}
          />

          {/* SVG Era Arcs, Glowing 6 DETIK Yellow Band, Human Silhouette & Sculpted Ornate Hands */}
          <svg
            width={760}
            height={760}
            viewBox="-380 -380 760 760"
            style={{ position: 'absolute', left: -380, top: -380, overflow: 'visible' }}
          >
            <defs>
              <filter id="handShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="4" dy="6.5" stdDeviation="3" floodColor="#140c0e" floodOpacity="0.56" />
              </filter>
              <filter id="yellowBloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <radialGradient id="brassPinGrad" cx="35%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#feecc2" />
                <stop offset="35%" stopColor="#e4b86c" />
                <stop offset="80%" stopColor="#b8823c" />
                <stop offset="100%" stopColor="#6c4416" />
              </radialGradient>
            </defs>

            {/* Yellow "6 DETIK" band inside inner tick track with warm soft radiance bloom */}
            {cam.humanBandAlpha > 0.01 && (
              <>
                <path
                  d={describeArc(241.5, 242, 271.5)}
                  fill="none"
                  stroke={`rgba(252,236,118,${0.55 * cam.humanBandAlpha})`}
                  strokeWidth={42}
                  filter="url(#yellowBloom)"
                />
                <path
                  d={describeArc(241.5, 243.75, 270)}
                  fill="none"
                  stroke={`rgba(248,238,128,${0.88 * cam.humanBandAlpha})`}
                  strokeWidth={33}
                />
              </>
            )}

            {/* Colored Geological Era Arcs in recessed track (r=266, width=16) */}
            {cam.eraHours > 0 && (
              <path d={describeArc(266, -90, -90 + (Math.min(4.2, cam.eraHours) / 24) * 360)} fill="none" stroke="#de5c38" strokeWidth={16} />
            )}
            {cam.eraHours > 4.2 && (
              <path
                d={describeArc(266, -90 + (4.2 / 24) * 360, -90 + (Math.min(22.78, cam.eraHours) / 24) * 360)}
                fill="none"
                stroke="#2e9e96"
                strokeWidth={16}
              />
            )}
            {cam.eraHours > 22.78 && (
              <path
                d={describeArc(266, -90 + (22.78 / 24) * 360, -90 + (Math.min(23.65, cam.eraHours) / 24) * 360)}
                fill="none"
                stroke="#8a68c0"
                strokeWidth={16}
              />
            )}
            {cam.eraHours > 23.65 && (
              <path
                d={describeArc(266, 264.75, -90 + (Math.min(24, cam.eraHours) / 24) * 360)}
                fill="none"
                stroke="#e0b654"
                strokeWidth={16}
              />
            )}

            {/* Radially Upright Human Silhouette & Crisp Dark Sepia 6 DETIK Label */}
            {cam.humanBandAlpha > 0.01 && (
              <g opacity={cam.humanBandAlpha}>
                <g
                  transform={`translate(${241 * Math.cos((254.25 * Math.PI) / 180)}, ${241 * Math.sin((254.25 * Math.PI) / 180)}) rotate(${254.25 + 90
                    }) scale(0.92)`}
                >
                  <circle cx={-1} cy={-14} r={4} fill="#201a16" />
                  <polygon
                    points="-4.2,-8.5 -9,1 -6.8,2.2 -3.2,-4 -2.5,13 0.5,13 0.8,3 3.8,12 6.8,11.2 3.5,-5 6.2,-19 3.4,-19.8 0.5,-9"
                    fill="#201a16"
                  />
                </g>
                <text
                  x={219 * Math.cos((254.8 * Math.PI) / 180)}
                  y={219 * Math.sin((254.8 * Math.PI) / 180)}
                  transform={`rotate(-15, ${219 * Math.cos((254.8 * Math.PI) / 180)}, ${219 * Math.sin((254.8 * Math.PI) / 180)})`}
                  textAnchor="middle"
                  fill="#46382c"
                  fontSize="13.5"
                  fontWeight="bold"
                  fontFamily="Segoe UI, sans-serif"
                >
                  6 DETIK
                </text>
              </g>
            )}

            {/* Motion-blurred Minute Fan */}
            {cam.minBlurSpan > 2 &&
              Array.from({ length: 6 }).map((_, gi) => {
                const ga = cam.minDeg - ((gi + 1) / 6) * cam.minBlurSpan;
                return (
                  <g key={gi} transform={`rotate(${ga})`} opacity={0.28 * (1 - gi / 6)}>
                    <polygon
                      points="-3.2,34 3.2,34 2.5,-77 9.2,-102 2.5,-126 2.2,-167 7.4,-190 0,-226 -7.4,-190 -2.2,-167 -2.5,-126 -9.2,-102 -2.5,-77"
                      fill="#2c1f16"
                    />
                  </g>
                );
              })}

            {/* Hour & Minute Ornate Spade Hands w/ Warm Metallic Ridge & 3D Specular Brass Pin */}
            <g filter="url(#handShadow)">
              <g transform={`rotate(${cam.hourDeg})`}>
                <path
                  d="M -4.8 26 L 4.8 26 L 3.8 -67 L 12.6 -102 L 0 -150 L -12.6 -102 L -3.8 -67 Z M 0 -99 m -4.5 0 a 4.5 4.5 0 1 0 9 0 a 4.5 4.5 0 1 0 -9 0 Z"
                  fill="#2a1d15"
                  fillRule="evenodd"
                />
                <line x1={-0.8} y1={16} x2={-0.5} y2={-82} stroke="rgba(108,82,58,0.52)" strokeWidth={1.6} />
              </g>
              <g transform={`rotate(${cam.minDeg})`}>
                <path
                  d="M -3.2 34 L 3.2 34 L 2.5 -77 L 9.2 -102 L 2.5 -126 L 2.2 -167 L 7.4 -190 L 0 -226 L -7.4 -190 L -2.2 -167 L -2.5 -126 L -9.2 -102 L -2.5 -77 Z M 0 -178 L 3.4 -192 L 0 -210 L -3.4 -192 Z"
                  fill="#2a1d15"
                  fillRule="evenodd"
                />
                <line x1={-0.6} y1={22} x2={-0.4} y2={-166} stroke="rgba(108,82,58,0.5)" strokeWidth={1.3} />
              </g>
              {cam.secDeg !== null && (
                <g transform={`rotate(${cam.secDeg})`}>
                  <line x1={0} y1={52} x2={0} y2={-248} stroke="#d64c34" strokeWidth={2.4} />
                  <circle cx={0} cy={52} r={6.5} fill="none" stroke="#d64c34" strokeWidth={2.4} />
                </g>
              )}
              <circle cx={0} cy={0} r={17.5} fill="url(#brassPinGrad)" stroke="#6c4416" strokeWidth={1.6} />
              <circle cx={-3.5} cy={-3.8} r={4.2} fill="rgba(255,244,204,0.72)" />
              <circle cx={0} cy={0} r={5} fill="#42240e" />
            </g>
          </svg>
        </div>
      )}

      {/* 3. Fullscreen Era Scenes & Crossfades */}
      {isFullMolten && <MoltenScene f={f} />}
      {fullOceanAlpha > 0.01 && (
        <div style={{ position: 'absolute', inset: 0, opacity: fullOceanAlpha }}>
          <OceanScene f={f} />
        </div>
      )}
      {fullDinoAlpha > 0.01 && (
        <div style={{ position: 'absolute', inset: 0, opacity: fullDinoAlpha }}>
          <DinosScene f={f} />
        </div>
      )}

      {/* 4. Midnight Golden Bloom Flare (f = 1128..1154) */}
      {flareAlpha > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 360 - 520,
            top: 430 - 520,
            width: 1040,
            height: 1040,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(254,228,162,${0.56 * flareAlpha}) 0%, rgba(254,228,162,0) 70%)`,
          }}
        />
      )}

      {/* 5. Tracked Top Header Centered at cx = 333 */}
      {headerTitle && headerAlpha > 0.01 && (
        <div style={{ position: 'absolute', left: 333, top: 0, width: 0 }}>
          {f <= 226 ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: -260,
                  top: 118,
                  width: 520,
                  textAlign: 'center',
                  color: '#fcf8f4',
                  fontFamily: 'Times New Roman, serif',
                  fontSize: 48,
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(16,10,22,0.8)',
                  opacity: headerAlpha,
                }}
              >
                {headerTitle}
              </div>
              {headerSub && (
                <div
                  style={{
                    position: 'absolute',
                    left: -260,
                    top: 170,
                    width: 520,
                    textAlign: 'center',
                    fontFamily: 'Times New Roman, serif',
                    fontSize: 92,
                    fontWeight: 'bold',
                    color: '#fde08d',
                    textShadow: '0 0 18px rgba(246,182,84,0.75)',
                    opacity: subAlpha,
                  }}
                >
                  <span style={{ fontSize: 58, fontWeight: 'normal', color: '#e0ceae', marginRight: 10 }}>=</span>
                  {headerSub}
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: -280,
                  top: 138,
                  width: 560,
                  textAlign: 'center',
                  color: '#fdf8ec',
                  fontFamily: 'Times New Roman, serif',
                  fontSize: headerTitle.length <= 5 ? 114 : 110,
                  lineHeight: 1,
                  fontWeight: 'bold',
                  letterSpacing: headerTitle.length <= 5 ? '5px' : '8.5px',
                  textShadow: '0 0 16px rgba(245,208,145,0.65)',
                  opacity: headerAlpha,
                }}
              >
                {plusMinus && (
                  <span style={{ fontSize: 54, fontWeight: 'normal', color: '#bceaea', verticalAlign: 'middle', marginRight: 6 }}>±</span>
                )}
                {headerTitle}
              </div>
              {headerSub && subAlpha > 0.01 && (
                <div
                  style={{
                    position: 'absolute',
                    left: -260,
                    top: 244,
                    width: 520,
                    textAlign: 'center',
                    color: '#f4eee4',
                    fontFamily: 'Segoe UI, sans-serif',
                    fontSize: 17,
                    fontWeight: 'bold',
                    letterSpacing: '7.2px',
                    textShadow: '0 2px 3px rgba(14,10,18,0.7)',
                    opacity: subAlpha,
                  }}
                >
                  {headerSub}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 6. Tactile Hand-Torn Deckle-Edge Parchment Subtitle Card Centered at cx = 333 */}
      {activeCard && (() => {
        const cardH = activeCard.lines.length === 1 ? 72 : 117;
        const longestChars = Math.max(...activeCard.lines.map((l) => l.length));
        const cardW = Math.max(326, Math.min(620, Math.round(longestChars * 21.5 + 94)));
        const cyCard = activeCard.lines.length === 1 ? 1002.5 : 1024.5;
        const sf = activeCard.startFrame;
        const tiltDeg = ((sf % 7) - 3) * 0.12;
        const pts: string[] = [];
        for (let i = 0; i <= 24; i++) {
          const u = i / 24;
          const px = u * cardW;
          const py = 4 + 1.8 * Math.sin(u * Math.PI * 6 + sf * 0.13) + 0.9 * Math.cos(u * 19);
          pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        pts.push(`${(cardW + 2.8).toFixed(1)},${(cardH * 0.36).toFixed(1)}`);
        pts.push(`${(cardW + 0.9).toFixed(1)},${(cardH * 0.72).toFixed(1)}`);
        for (let i = 24; i >= 0; i--) {
          const u = i / 24;
          const px = u * cardW;
          const py = cardH - 4 + 1.8 * Math.cos(u * Math.PI * 6 + sf * 0.17) + 0.9 * Math.sin(u * 17);
          pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        pts.push(`${(-2.4).toFixed(1)},${(cardH * 0.66).toFixed(1)}`);
        pts.push(`${(-0.7).toFixed(1)},${(cardH * 0.31).toFixed(1)}`);

        return (
          <div
            style={{
              position: 'absolute',
              left: 333,
              top: cyCard,
              width: cardW,
              height: cardH,
              transform: `translate(-50%, -50%) rotate(${tiltDeg.toFixed(2)}deg)`,
            }}
          >
            <svg
              width={cardW + 16}
              height={cardH + 16}
              viewBox={`-8 -8 ${cardW + 16} ${cardH + 16}`}
              style={{ position: 'absolute', left: -8, top: -8, overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="parchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f7efde" />
                  <stop offset="100%" stopColor="#ebe0c8" />
                </linearGradient>
                <filter id="cardDrop" x="-15%" y="-20%" width="130%" height="150%">
                  <feDropShadow dx="2.5" dy="5.5" stdDeviation="3.5" floodColor="#0e0814" floodOpacity="0.58" />
                </filter>
              </defs>
              <polygon points={pts.join(' ')} fill="url(#parchGrad)" stroke="#d2c3a8" strokeWidth={1.4} filter="url(#cardDrop)" />
              {Array.from({ length: 12 }).map((_, fi) => {
                const fx = ((fi * 71 + sf * 13) % Math.max(40, cardW - 40)) + 20;
                const fy = ((fi * 29 + sf * 7) % Math.max(16, cardH - 20)) + 10;
                const dx = ((fi % 3) - 1) * 18 + 14;
                const dy = ((fi % 5) - 2) * 3;
                return <line key={fi} x1={fx} y1={fy} x2={fx + dx} y2={fy + dy} stroke="rgba(210,196,170,0.48)" strokeWidth={1} />;
              })}
            </svg>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {activeCard.lines.map((ln, lIdx) => {
                const words = ln.split(' ');
                const prevWords = lIdx === 0 ? 0 : activeCard.lines[0].split(' ').length;
                return (
                  <div
                    key={lIdx}
                    style={{
                      fontFamily: 'Segoe UI, Arial, sans-serif',
                      fontSize: 40,
                      lineHeight: '48px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      opacity: cardInkAlpha,
                    }}
                  >
                    {words.map((w, wIdx) => {
                      const gIdx = prevWords + wIdx;
                      const col = gIdx < activeWordIdx ? '#241f1c' : gIdx === activeWordIdx ? '#ba382a' : '#7e766c';
                      return (
                        <span key={wIdx} style={{ color: col }}>
                          {w}
                          {wIdx < words.length - 1 ? ' ' : ''}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 7. Subtle Optical Corner Vignette & Archival SVG Paper Grain Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 58%, rgba(20,10,28,0.22) 100%)',
        }}
      />
      <svg width={720} height={1280} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, mixBlendMode: 'overlay' }}>
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="19" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperGrain)" />
      </svg>
    </AbsoluteFill>
  );
};
