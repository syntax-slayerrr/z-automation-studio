import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EVOLUTION_TOKENS } from './tokens';
import { RightScaleRuler } from './EvolutionOverlays';

export type DiagnosticOrganType =
  | 'spleen'
  | 'muscle_capillary'
  | 'lung_alveoli'
  | 'eye_lens'
  | 'skin_sweat';

export type SpeckleMetaphorShape =
  | 'none'
  | 'oxygen_tank'
  | 'lung_sac'
  | 'heart_pump'
  | 'shield'
  | 'battery'
  | 'sweat_drop';

export interface UltrasoundSectorProps {
  canvasWidth?: number;
  canvasHeight?: number;
  organType?: DiagnosticOrganType;
  organScale?: number;
  showCaliperTrace?: boolean;
  metaphorMorph?: number;
  metaphorShape?: SpeckleMetaphorShape;
  seed?: number;
}

function hash2D(ix: number, iy: number, seed: number): number {
  let n = ix * 374761393 + iy * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

/** Smooth 2D value noise for authentic laterally-stretched phased-array acoustic speckle! */
function smoothPolarSpeckle(r: number, theta: number, tick: number, seed: number): number {
  // Clinical ultrasound beams widen laterally along theta as r increases — stretch laterally ~3.6x!
  const u = r * 0.72;
  const v = theta * 38.0;
  const iu = Math.floor(u);
  const iv = Math.floor(v);
  const fu = u - iu;
  const fv = v - iv;
  const su = fu * fu * (3 - 2 * fu);
  const sv = fv * fv * (3 - 2 * fv);

  const n00 = hash2D(iu, iv, tick + seed);
  const n10 = hash2D(iu + 1, iv, tick + seed);
  const n01 = hash2D(iu, iv + 1, tick + seed);
  const n11 = hash2D(iu + 1, iv + 1, tick + seed);
  const coarse = (n00 * (1 - su) + n10 * su) * (1 - sv) + (n01 * (1 - su) + n11 * su) * sv;

  // Fine high-frequency sparkling acoustic backscatter layer
  const fine = hash2D(Math.floor(r * 1.15), Math.floor(theta * 92.0), tick * 3 + seed + 19);
  // Rayleigh distribution shape for bright crisp white-gold sparkle peaks + deep dark speckles!
  const rayleigh = Math.sqrt(-Math.log(Math.max(0.012, coarse * 0.65 + fine * 0.35)) * 0.56);
  return Math.max(0.08, Math.min(1.65, rayleigh));
}

function sdfSpleenBean(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const ca = Math.cos(-0.42);
  const sa = Math.sin(-0.42);
  const rx = sx * ca - sy * sa;
  const ry = sx * sa + sy * ca - 0.12 * rx * rx;
  return Math.hypot(rx / 0.34, ry / 0.175) - 1.0;
}

function sdfMuscleCapillary(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const r = Math.hypot(sx / 0.28, sy / 0.24);
  const hexMod = 0.036 * Math.cos(Math.atan2(sy, sx) * 6.0);
  return r - (1.0 + hexMod);
}

function sdfLungAlveoli(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const l = Math.hypot((sx + 0.14) / 0.13, sy / 0.25) - 1.0;
  const r = Math.hypot((sx - 0.14) / 0.13, sy / 0.25) - 1.0;
  return Math.min(l, r);
}

function sdfEyeLens(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  return Math.hypot(sx / 0.30, sy / 0.15) - 1.0;
}

function sdfSkinSweat(x: number, y: number, scale: number): number {
  const sx = x / Math.max(0.85, scale);
  const sy = y / Math.max(0.85, scale);
  // Dermis biopsy oval showing hair follicle & surrounding eccrine sweat gland cluster
  return Math.hypot(sx / 0.34, sy / 0.22) - 1.0;
}

function evalOrganSdf(x: number, y: number, scale: number, organType: DiagnosticOrganType): number {
  if (organType === 'muscle_capillary') return sdfMuscleCapillary(x, y, scale);
  if (organType === 'lung_alveoli') return sdfLungAlveoli(x, y, scale);
  if (organType === 'eye_lens') return sdfEyeLens(x, y, scale);
  if (organType === 'skin_sweat') return sdfSkinSweat(x, y, scale);
  return sdfSpleenBean(x, y, scale);
}

function sdfMetaphor(x: number, y: number, shape: SpeckleMetaphorShape): number {
  if (shape === 'sweat_drop') {
    // Crisp teardrop sweat droplet SDF
    const ny = y - 0.04;
    const width = ny < 0 ? Math.max(0.012, 0.21 * (1 + ny * 2.9)) : Math.max(0.012, 0.21 * Math.sqrt(Math.max(0.01, 1 - Math.pow(ny / 0.24, 2))));
    return Math.hypot(x / width, (ny - 0.02) / 0.28) - 1.0;
  }
  if (shape === 'oxygen_tank' || shape === 'none') {
    const bodyX = Math.max(Math.abs(x) - 0.145, 0);
    const bodyY = Math.max(Math.abs(y - 0.05) - 0.27, 0);
    const body = Math.hypot(bodyX, bodyY) - 0.045;
    const neckX = Math.max(Math.abs(x) - 0.035, 0);
    const neckY = Math.max(Math.abs(y + 0.29) - 0.055, 0);
    const neck = Math.hypot(neckX, neckY) - 0.015;
    const valveX = Math.max(Math.abs(x) - 0.07, 0);
    const valveY = Math.max(Math.abs(y + 0.345) - 0.012, 0);
    const valve = Math.hypot(valveX, valveY) - 0.01;
    return Math.min(body, neck, valve);
  }
  if (shape === 'battery') {
    const bx = Math.max(Math.abs(x) - 0.165, 0);
    const by = Math.max(Math.abs(y - 0.03) - 0.245, 0);
    const b = Math.hypot(bx, by) - 0.028;
    const cap =
      Math.hypot(Math.max(Math.abs(x) - 0.068, 0), Math.max(Math.abs(y + 0.265) - 0.025, 0)) - 0.01;
    return Math.min(b, cap);
  }
  if (shape === 'shield') {
    const sy = y + 0.02;
    const widen = Math.max(0.04, 0.22 * (1 - Math.max(0, sy + 0.25) * 1.15));
    return Math.hypot(x / widen, sy / 0.32) - 1.0;
  }
  const leftLobe = Math.hypot((x + 0.12) / 0.14, y / 0.26) - 1.0;
  const rightLobe = Math.hypot((x - 0.12) / 0.14, y / 0.26) - 1.0;
  return Math.min(leftLobe, rightLobe);
}

/**
 * 1:1 High-Contrast Polar-Anisotropic B-Mode Golden Acoustic Speckle Scanner (`UltrasoundSectorScan`)
 * Upgraded to match `ref_04_xray.png` photographically:
 * - Laterally-elongated concentric phased-array acoustic speckle arcs!
 * - High-contrast sparkling cream-white-gold echogenic fascia & organ walls!
 * - Deep dark dramatic radial rib-shadow lanes!
 * - Sparkling mitochondrial O2 rings & wide capillaries (Sherpa) or bean spleen (Bajo)!
 */
export const UltrasoundSectorScan: React.FC<UltrasoundSectorProps> = ({
  canvasWidth = 920,
  canvasHeight = 820,
  organType = 'spleen',
  organScale = 1.0,
  showCaliperTrace = false,
  metaphorMorph = 0,
  metaphorShape = 'oxygen_tank',
  seed = 101,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rw = Math.round(canvasWidth * 0.56);
    const rh = Math.round(canvasHeight * 0.56);
    if (canvas.width !== rw || canvas.height !== rh) {
      canvas.width = rw;
      canvas.height = rh;
    }

    const img = ctx.createImageData(rw, rh);
    const data = img.data;

    const apexX = rw * 0.5;
    const apexY = rh * 0.035;
    const minR = rh * 0.082;
    const maxR = rh * 0.92;
    const halfAngle = (EVOLUTION_TOKENS.instruments.ultrasound.sectorApexDeg * 0.5 * Math.PI) / 180;

    const boilTick = Math.floor(frame / 2) + seed * 31;
    const morphT = Math.max(0, Math.min(1, metaphorMorph));

    const organCenterX = rw * 0.51;
    const organCenterY = rh * 0.54;
    const normRadius = rh * 0.54;

    const mitoNodes = [
      [-0.105, -0.072, 0.056],
      [0.092, -0.062, 0.059],
      [-0.008, 0.018, 0.068],
      [-0.112, 0.092, 0.054],
      [0.102, 0.084, 0.056],
    ];
    const capNodes = [
      [-0.295, -0.11],
      [0.295, -0.09],
      [0.0, -0.275],
      [-0.245, 0.195],
      [0.255, 0.185],
    ];

    for (let py = 0; py < rh; py++) {
      const dy = py - apexY;
      if (dy < 0) continue;
      for (let px = 0; px < rw; px++) {
        const dx = px - apexX;
        const r = Math.hypot(dx, dy);
        if (r < minR || r > maxR) continue;
        const theta = Math.atan2(dx, dy);
        if (Math.abs(theta) > halfAngle) continue;

        const speckle = smoothPolarSpeckle(r, theta, boilTick, seed);

        // 3 Dramatic Deep Acoustic Rib-Shadow Lanes (signature look of ref_04_xray.png!)
        const s1 = Math.exp(-Math.pow((theta + 0.30) / 0.052, 2)) * 0.68;
        const s2 = Math.exp(-Math.pow((theta - 0.02) / 0.048, 2)) * 0.62;
        const s3 = Math.exp(-Math.pow((theta - 0.31) / 0.055, 2)) * 0.58;
        const ribShadow = 1.0 - Math.min(0.78, s1 + s2 + s3);

        const rNorm = (r - minR) / (maxR - minR);
        // Base tissue echogenicity with realistic TGC depth attenuation
        let intensity = 0.36 * (1.0 - 0.18 * rNorm);

        // Bright sparkling near-field transducer apex ring-down zone (ref_04_xray.png top apex!)
        if (rNorm < 0.16) {
          intensity += Math.pow(1.0 - rNorm / 0.16, 1.35) * 0.78;
        }

        // Crisp glowing echogenic fascia / muscle-sheath concentric arcs
        const arc1 = Math.exp(-Math.pow((rNorm - 0.24 - 0.018 * Math.sin(theta * 3)) / 0.011, 2));
        const arc2 = Math.exp(-Math.pow((rNorm - 0.145) / 0.009, 2));
        intensity += arc1 * 0.72 + arc2 * 0.48;

        const ox = (px - organCenterX) / normRadius;
        const oy = (py - organCenterY) / normRadius;
        const dOrgan = evalOrganSdf(ox, oy, organScale, organType);
        const dMeta = sdfMetaphor(ox, oy, metaphorShape);
        const d = dOrgan * (1 - morphT) + dMeta * morphT;

        // Bright crisp echogenic outer capsule boundary!
        const wallBand = Math.exp(-Math.pow(d / 0.024, 2));
        intensity += wallBand * 1.15;

        if (d < 0) {
          intensity += 0.30;

          if (metaphorShape === 'battery' && morphT > 0.32) {
            const barFade = (morphT - 0.32) / 0.68;
            for (const barY of [-0.11, 0.02, 0.15]) {
              if (Math.abs(ox) < 0.12 && Math.abs(oy - barY) < 0.036) {
                intensity += 0.85 * barFade;
              }
            }
          }

          if (morphT < 0.65) {
            const orgVis = 1 - morphT / 0.65;
            if (organType === 'spleen') {
              const hx = (ox + 0.04) / organScale;
              const hy = (oy - 0.05) / organScale;
              const branch1 = Math.abs(hy + 0.32 * hx - 0.02 * Math.sin(hx * 18));
              const branch2 = Math.abs(hy - 0.18 * hx - 0.03);
              if ((hx > -0.18 && hx < 0.16 && branch1 < 0.017) || (hx > -0.02 && hx < 0.18 && branch2 < 0.014)) {
                intensity *= 0.14 + 0.86 * (1 - orgVis);
              }
            } else if (organType === 'skin_sweat') {
              // Control (organScale <= 1.05): GIANT thick ape hair follicle shaft + 1 tiny sweat coil!
              // Adapted Human (organScale > 1.05): tiny vellus hair + 10 bright glowing coiled eccrine sweat glands!
              const isHuman = organScale > 1.05;
              if (!isHuman) {
                // Thick coarse terminal hair bulb & shaft across dermis
                const bulb = Math.hypot((ox + 0.02) / 0.11, (oy - 0.05) / 0.10) - 1.0;
                const shaft = Math.abs(ox + 0.02 + oy * 0.22) - 0.032;
                if (bulb < 0 || (oy < 0.08 && shaft < 0)) {
                  intensity += 0.92 * orgVis;
                }
                // Single small sweat gland off to right
                const sg = Math.hypot(ox - 0.18, oy - 0.04) - 0.034;
                intensity += Math.exp(-Math.pow(sg / 0.012, 2)) * 0.55 * orgVis;
              } else {
                // 10 glowing coiled eccrine sweat glands densely packed in human dermis!
                const glands: Array<[number, number]> = [
                  [-0.24, -0.06], [-0.14, -0.09], [-0.03, -0.07], [0.09, -0.09], [0.21, -0.05],
                  [-0.21, 0.07],  [-0.10, 0.09],  [0.01, 0.06],   [0.13, 0.09],  [0.24, 0.06],
                ];
                for (const [gx, gy] of glands) {
                  const gd = Math.hypot(ox - gx, oy - gy) - 0.036;
                  const ring = Math.exp(-Math.pow(gd / 0.013, 2));
                  intensity += ring * 0.95 * orgVis;
                  if (gd < 0) intensity += 0.42 * orgVis;
                }
              }
            } else if (organType === 'muscle_capillary') {
              const sx = ox / organScale;
              const sy = oy / organScale;
              for (const [mx, my, mr] of mitoNodes) {
                const md = Math.hypot(sx - mx, sy - my) - mr;
                const ring = Math.exp(-Math.pow(md / 0.015, 2));
                intensity += ring * 0.92 * orgVis;
                if (md < 0) intensity += (organScale > 1.1 ? 0.44 : 0.10) * orgVis;
              }
            }
          }
        }

        if (organType === 'muscle_capillary' && morphT < 0.6) {
          const orgVis = 1 - morphT / 0.6;
          const capR = organScale > 1.1 ? 0.054 : 0.035;
          for (const [cx, cy] of capNodes) {
            const cd = Math.hypot(ox - cx * organScale, oy - cy * organScale) - capR;
            const cRing = Math.exp(-Math.pow(cd / 0.014, 2));
            intensity += cRing * (organScale > 1.1 ? 0.96 : 0.48) * orgVis;
            if (cd < 0) intensity *= 0.36;
          }
        } else if (organType === 'spleen') {
          const vx = (px - rw * 0.34) / (rh * 0.14);
          const vy = (py - rh * 0.72) / (rh * 0.09);
          const vRotX = vx * 0.82 + vy * 0.57;
          const vRotY = -vx * 0.57 + vy * 0.82;
          const vDist = Math.hypot(vRotX, vRotY) - 1.0;
          if (Math.abs(vDist) < 0.22) intensity += (1 - Math.abs(vDist) / 0.22) * 0.62;
          else if (vDist < 0) intensity *= 0.42;
        }

        const edgeFade = Math.min(
          1,
          (halfAngle - Math.abs(theta)) / 0.030,
          (maxR - r) / 7.0,
          (r - minR) / 3.0,
        );
        const val = Math.max(0, Math.min(1.55, intensity * speckle * ribShadow)) * edgeFade;

        // Photographic Golden-Amber to Sparkling Cream-White LUT (1:1 ref_04_xray.png!)
        let rr = 0;
        let gg = 0;
        let bb = 0;
        if (val < 0.30) {
          const t = val / 0.30;
          rr = 20 + t * 92;
          gg = 9 + t * 44;
          bb = 3 + t * 8;
        } else if (val < 0.74) {
          const t = (val - 0.30) / 0.44;
          rr = 112 + t * 124;
          gg = 53 + t * 114;
          bb = 11 + t * 38;
        } else {
          const t = Math.min(1, (val - 0.74) / 0.58);
          rr = 236 + t * 19;
          gg = 167 + t * 82;
          bb = 49 + t * 176;
        }

        const idx = (py * rw + px) * 4;
        data[idx] = rr;
        data[idx + 1] = gg;
        data[idx + 2] = bb;
        data[idx + 3] = Math.round(Math.min(1, edgeFade * 1.6) * 255);
      }
    }

    ctx.putImageData(img, 0, 0);

    // Clinical Cyan-White Sonographer `+ · · · +` Caliper Trace
    if (showCaliperTrace && morphT < 0.25) {
      ctx.save();
      ctx.strokeStyle = EVOLUTION_TOKENS.instruments.ultrasound.caliperColor;
      ctx.fillStyle = EVOLUTION_TOKENS.instruments.ultrasound.caliperColor;
      const steps = 32;
      for (let i = 0; i < steps; i++) {
        const ang = (i / steps) * Math.PI * 2;
        let wx = organCenterX;
        let wy = organCenterY;
        if (organType === 'muscle_capillary') {
          const mod = 1 + 0.036 * Math.cos(ang * 6);
          wx = organCenterX + Math.cos(ang) * 0.29 * mod * organScale * normRadius;
          wy = organCenterY + Math.sin(ang) * 0.25 * mod * organScale * normRadius;
        } else {
          const ca = Math.cos(0.42);
          const sa = Math.sin(0.42);
          const bx = Math.cos(ang) * 0.345 * organScale;
          const by = (Math.sin(ang) * 0.18 + 0.12 * bx * bx) * organScale;
          wx = organCenterX + (bx * ca - by * sa) * normRadius;
          wy = organCenterY + (bx * sa + by * ca) * normRadius;
        }
        ctx.beginPath();
        ctx.arc(wx, wy, 1.6, 0, Math.PI * 2);
        ctx.fill();

        if (i === 0 || i === steps / 2) {
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(wx - 6.0, wy);
          ctx.lineTo(wx + 6.0, wy);
          ctx.moveTo(wx, wy - 6.0);
          ctx.lineTo(wx, wy + 6.0);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }, [canvasWidth, canvasHeight, frame, metaphorMorph, metaphorShape, organScale, organType, seed, showCaliperTrace]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        imageRendering: 'auto',
      }}
    />
  );
};

export interface DiagnosticUltrasoundScreenProps {
  mode?: 'single' | 'dual_comparison';
  organType?: DiagnosticOrganType;
  adaptedOrganScale?: number;
  controlOrganScale?: number;
  controlLabelTop?: string;
  controlLabelBottom?: string;
  adaptedLabelPrefix?: string;
  adaptedLabelHighlight?: string;
  metaphorMorph?: number;
  metaphorShape?: SpeckleMetaphorShape;
  showCaliperTrace?: boolean;
  splitFactor?: number;
}

export const DiagnosticUltrasoundScreen: React.FC<DiagnosticUltrasoundScreenProps> = ({
  mode = 'single',
  organType = 'spleen',
  adaptedOrganScale = 1.24,
  controlOrganScale = 0.96,
  controlLabelTop = 'tetangga,',
  controlLabelBottom = 'bukan penyelam',
  adaptedLabelPrefix = 'orang ',
  adaptedLabelHighlight = 'Bajo',
  metaphorMorph = 0,
  metaphorShape = 'oxygen_tank',
  showCaliperTrace = false,
  splitFactor = mode === 'dual_comparison' ? 1 : 0,
}) => {
  const { width, height, typography, instruments } = EVOLUTION_TOKENS;
  const u = instruments.ultrasound;
  const s = Math.max(0, Math.min(1, splitFactor));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 48%, ${u.bgEspresso} 0%, ${u.bgVignetteEdge} 100%)`,
        overflow: 'hidden',
      }}
    >
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: Math.ceil(width / u.gridStepPx) }).map((_, i) => (
          <line
            key={`vx-${i}`}
            x1={i * u.gridStepPx}
            y1={0}
            x2={i * u.gridStepPx}
            y2={height}
            stroke={u.gridStroke}
            strokeWidth={1.5}
          />
        ))}
        {Array.from({ length: Math.ceil(height / u.gridStepPx) }).map((_, j) => (
          <line
            key={`hy-${j}`}
            x1={0}
            y1={j * u.gridStepPx}
            x2={width}
            y2={j * u.gridStepPx}
            stroke={u.gridStroke}
            strokeWidth={1.5}
          />
        ))}
      </svg>

      {s > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${10 + (1 - s) * -45}%`,
            transform: 'translateX(-50%)',
            opacity: s,
          }}
        >
          <UltrasoundSectorScan
            canvasWidth={680}
            canvasHeight={590}
            organType={organType}
            organScale={controlOrganScale}
            seed={202}
          />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${21 + s * 25.5}%`,
          transform: `translateX(-50%) scale(${1 - s * 0.31})`,
          transformOrigin: 'top center',
        }}
      >
        <UltrasoundSectorScan
          canvasWidth={980}
          canvasHeight={860}
          organType={organType}
          organScale={adaptedOrganScale}
          showCaliperTrace={showCaliperTrace}
          metaphorMorph={metaphorMorph}
          metaphorShape={metaphorShape}
          seed={101}
        />
      </div>

      {s > 0.15 && (
        <div style={{ opacity: (s - 0.15) / 0.85, fontFamily: typography.fontFamily }}>
          <div
            style={{
              position: 'absolute',
              left: '8.2%',
              top: '13.8%',
              fontSize: typography.diagnosticLabelPx,
              fontWeight: 600,
              lineHeight: 1.18,
              color: typography.textWhite,
              textShadow: typography.textShadow,
            }}
          >
            <div>{controlLabelTop}</div>
            <div>{controlLabelBottom}</div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '8.2%',
              top: '48.2%',
              fontSize: typography.diagnosticLabelPx + 4,
              fontWeight: 700,
              color: typography.textWhite,
              textShadow: typography.textShadow,
            }}
          >
            <span>{adaptedLabelPrefix}</span>
            <span style={{ color: typography.keywordGold }}>{adaptedLabelHighlight}</span>
          </div>
        </div>
      )}

      <RightScaleRuler />
    </AbsoluteFill>
  );
};
