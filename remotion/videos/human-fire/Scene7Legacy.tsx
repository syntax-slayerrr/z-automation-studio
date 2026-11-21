import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  fireFlicker,
  hash01,
  lerp,
  VolumetricFire2D,
} from './fx';
import { StarryNightSky } from './PrehistoricLandscape';

/**
 * SCENE 7 — PENUTUP ("Sebuah Nyala Kecil, Mengubah Peradaban.")
 * One unbroken motif of firelight evolving across 3 eras:
 * 1. Intimate close-up of a prehistoric campfire flame breathing in darkness.
 * 2. Smooth morph into a traditional arched stone forge & glowing hearth.
 * 3. Grand pull-out morph into a gleaming modern twilight-plum & gold city skyline.
 * 4. Serene fade into closing editorial serif card: "Sebuah Nyala Kecil, Mengubah Peradaban."
 */
export const Scene7Legacy: React.FC<{ f: number }> = ({ f }) => {
  const s7Start = SCENES.s7Start;
  const totalFrames = SCENES.totalFrames;
  const fl = fireFlicker(f, 37);

  // Beat transitions locked directly to ElevenLabs cues
  const forgeT = easeInOutCubic((f - (CUES.s7_forge - 18)) / 36);
  const cityT = easeInOutCubic((f - (CUES.s7_city - 32)) / 48);
  const titleT = easeInOutCubic((f - (CUES.s7_title - 4)) / 32);
  const finalFadeOut = f > totalFrames - 26 ? 1 - easeInOut((f - (totalFrames - 26)) / 26) : 1;

  const campfireAlpha = clamp(1 - forgeT, 0, 1);
  const forgeAlpha = clamp(forgeT * (1 - cityT), 0, 1);
  const cityAlpha = clamp(cityT * (1 - titleT * 0.72), 0, 1);

  const driftX = Math.sin(f * 0.02) * 5;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#160a1e' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, opacity: finalFadeOut }}>
        <defs>
          <linearGradient id="s7Sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#12091d" />
            <stop offset="52%" stopColor="#261436" />
            <stop offset="100%" stopColor="#462238" />
          </linearGradient>
          <radialGradient id="s7CenterGlow" cx="50%" cy="56%" r="54%">
            <stop offset="0%" stopColor="#fff0c8" stopOpacity={0.62 * fl} />
            <stop offset="36%" stopColor="#f08a34" stopOpacity={0.30 * fl} />
            <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="s7CityHorizon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#160b24" />
            <stop offset="55%" stopColor="#321d42" />
            <stop offset="86%" stopColor="#944b3a" />
            <stop offset="100%" stopColor="#e89444" />
          </linearGradient>
          <filter id="s7Glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="s7Bokeh" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <rect width={720} height={1280} fill={cityT > 0.2 ? 'url(#s7CityHorizon)' : 'url(#s7Sky)'} />
        <StarryNightSky f={f} opacity={0.85} count={84} />

        {/* === BEAT 1: INTIMATE MACRO CLOSE-UP OF PREHISTORIC CAMPFIRE === */}
        {campfireAlpha > 0.01 && (
          <g opacity={campfireAlpha} transform={`translate(${driftX}, 0)`}>
            <ellipse cx={360} cy={670} rx={380 * fl} ry={320 * fl} fill="url(#s7CenterGlow)" style={{ mixBlendMode: 'screen' }} />
            <path d="M -40 865 Q 360 835, 760 868 L 760 1280 L -40 1280 Z" fill="#190d22" />
            <VolumetricFire2D
              f={f}
              cx={360}
              cy={815}
              scale={1.85}
              intensity={1.0}
              showLogs
              showSmoke
              emberCount={36}
              wind={0.04}
              idPrefix="s7macro"
            />
          </g>
        )}

        {/* === BEAT 2: MORPH INTO TRADITIONAL ARCHED STONE FORGE === */}
        {forgeAlpha > 0.01 && (
          <g opacity={forgeAlpha} transform={`translate(${driftX * 0.8}, 0)`}>
            <ellipse cx={360} cy={685} rx={410 * fl} ry={340 * fl} fill="url(#s7CenterGlow)" style={{ mixBlendMode: 'screen' }} />
            {/* Stone Hearth Masonry & Chimney Hood */}
            <g transform="translate(360, 865)">
              <path d="M -380 0 L -380 -80 L 380 -80 L 380 420 L -380 420 Z" fill="#1c0f24" />
              {/* Arched Stone Forge Structure */}
              <path
                d="M -255 0 L -255 -300 C -255 -360, -140 -420, -105 -520 L 105 -520 C 140 -420, 255 -360, 255 -300 L 255 0 Z"
                fill="#27152c"
                stroke="#f09a44"
                strokeOpacity={0.44 * fl}
                strokeWidth={3}
              />
              {/* Stone Blocks Subtle Outlines */}
              {[-280, -210, -140].map((fy, fi) => (
                <line key={fi} x1={-245} y1={fy} x2={245} y2={fy} stroke="#1a0d20" strokeWidth={4} opacity={0.65} />
              ))}
              {/* Recessed Blazing Forge Firebox Arch */}
              <path d="M -135 0 L -135 -165 C -135 -258, 135 -258, 135 -165 L 135 0 Z" fill="#180a18" />
              <path d="M -120 0 L -120 -158 C -120 -238, 120 -238, 120 -158 L 120 0 Z" fill="#e86824" opacity={0.35 * fl} />
              {/* Glowing Red-Hot Iron Bar Resting on Embers */}
              <line x1={-175} y1={-48} x2={38} y2={-28} stroke="#2e1824" strokeWidth={11} strokeLinecap="round" />
              <line x1={-25} y1={-34} x2={38} y2={-28} stroke="#fff2c4" strokeWidth={9} strokeLinecap="round" filter="url(#s7Bokeh)" />
              {/* Roaring Traditional Forge Flame */}
              <VolumetricFire2D
                f={f}
                cx={0}
                cy={-18}
                scale={1.38}
                intensity={1.0}
                showLogs={false}
                showSmoke
                emberCount={32}
                wind={0}
                idPrefix="s7forge"
              />
            </g>
          </g>
        )}

        {/* === BEAT 3: MODERN TWILIGHT CITY SKYLINE ILLUMINATED BY GOLDEN LIGHT === */}
        {cityAlpha > 0.01 && (
          <g opacity={cityAlpha} transform={`translate(${driftX * 0.5}, ${lerp(45, 0, cityT)})`}>
            {/* Distant Warm Horizon Glow Behind Metropolis */}
            <ellipse cx={360} cy={835} rx={480} ry={220} fill="#f49c42" opacity={0.34} filter="url(#s7Glow)" style={{ mixBlendMode: 'screen' }} />

            {/* Far Layer Modern Skyscrapers (Parallax haze) */}
            <g fill="#2d1a3b" opacity={0.85}>
              <rect x={22} y={535} width={54} height={360} />
              <rect x={92} y={455} width={66} height={440} />
              <polygon points="125,455 125,385 129,455" fill="#f8c878" opacity={0.65} />
              <rect x={182} y={510} width={58} height={385} />
              <rect x={265} y={405} width={78} height={490} />
              <polygon points="304,405 304,325 309,405" fill="#ffe6a4" opacity={0.8} />
              <rect x={368} y={445} width={74} height={450} />
              <rect x={468} y={395} width={82} height={500} />
              <polygon points="509,395 509,335 513,395" fill="#f8c878" opacity={0.7} />
              <rect x={575} y={495} width={62} height={400} />
              <rect x={652} y={545} width={64} height={350} />
            </g>

            {/* Near Crisp Silhouette Towers & Glowing Golden City Window Grids */}
            <g fill="#1c0e28" stroke="#f09c44" strokeOpacity={0.28} strokeWidth={1.5}>
              <rect x={-10} y={625} width={96} height={340} />
              <rect x={125} y={565} width={92} height={400} />
              <rect x={238} y={495} width={104} height={470} />
              <rect x={374} y={525} width={98} height={440} />
              <rect x={502} y={575} width={96} height={390} />
              <rect x={622} y={615} width={110} height={350} />
            </g>

            {/* Thousands of Warm Amber Modern City Window Lights (Echoing Prehistoric Embers!) */}
            <g>
              {[
                { x: 140, y: 585, cols: 5, rows: 14 },
                { x: 254, y: 515, cols: 6, rows: 18 },
                { x: 390, y: 545, cols: 5, rows: 16 },
                { x: 518, y: 595, cols: 5, rows: 13 },
                { x: 638, y: 635, cols: 5, rows: 11 },
              ].map((b, bi) =>
                Array.from({ length: b.cols * b.rows }).map((_, wi) => {
                  const r = Math.floor(wi / b.cols);
                  const c = wi % b.cols;
                  const lit = hash01(bi * 101 + wi * 17.3) > 0.32;
                  if (!lit) return null;
                  const tw = 0.65 + 0.35 * Math.sin(f * 0.08 + wi + bi);
                  return (
                    <rect
                      key={`${bi}_${wi}`}
                      x={b.x + c * 13}
                      y={b.y + r * 16}
                      width={7}
                      height={9}
                      rx={1}
                      fill={wi % 4 === 0 ? '#fff2cc' : '#f8b85c'}
                      opacity={tw * 0.88}
                    />
                  );
                })
              )}
            </g>

            {/* Illuminated Suspension Bridge & Reflective City Waterfront Glow */}
            <path d="M -20 848 L 740 848" stroke="#f8c26c" strokeWidth={4} opacity={0.82} />
            <path d="M 40 848 Q 200 765, 360 848 Q 520 765, 680 848" fill="none" stroke="#ffd282" strokeWidth={2.5} opacity={0.68} />
            <rect x={0} y={850} width={720} height={430} fill="#15091f" />
            {/* Shimmering Golden Light Reflections on Water */}
            {Array.from({ length: 24 }).map((_, ri) => {
              const rx = 30 + ri * 29;
              const rw = 12 + hash01(ri * 23.1) * 26;
              const ry = 875 + (ri % 5) * 28;
              const sw = Math.sin(f * 0.1 + ri * 1.4) * 6;
              return (
                <rect
                  key={ri}
                  x={rx + sw}
                  y={ry}
                  width={rw}
                  height={3.2}
                  rx={2}
                  fill="#f8ba62"
                  opacity={0.35 + 0.25 * hash01(ri * 13.7)}
                />
              );
            })}
          </g>
        )}

        {/* === BEAT 4: SINGLE DELICATE BREATHING EMBER ABOVE CLOSING TITLE CARD === */}
        {titleT > 0.01 && (
          <g opacity={titleT}>
            <rect width={720} height={1280} fill="#15091e" opacity={0.76 * titleT} />
            <VolumetricFire2D
              f={f}
              cx={360}
              cy={515}
              scale={0.82}
              intensity={titleT}
              showLogs={false}
              showSmoke={false}
              emberCount={22}
              wind={0.02}
              idPrefix="s7final"
            />
          </g>
        )}
      </svg>

      {/* Editorial Closing Title Card: "Sebuah Nyala Kecil, Mengubah Peradaban." */}
      {titleT > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 575,
            width: 720,
            textAlign: 'center',
            pointerEvents: 'none',
            opacity: titleT * finalFadeOut,
            transform: `translateY(${lerp(18, 0, easeOutCubic(titleT))}px)`,
          }}
        >
          <div
            style={{
              width: 96,
              height: 2,
              margin: '0 auto 28px',
              background: 'linear-gradient(90deg, rgba(248,182,92,0) 0%, #f8c474 50%, rgba(248,182,92,0) 100%)',
            }}
          />
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 44,
              fontWeight: 'bold',
              lineHeight: 1.32,
              letterSpacing: '1.4px',
              color: '#f8eed8',
              textShadow: '0 0 28px rgba(248, 192, 108, 0.65), 0 4px 12px rgba(16, 8, 22, 0.9)',
              padding: '0 54px',
            }}
          >
            Sebuah Nyala Kecil,
            <br />
            Mengubah Peradaban.
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: 'Segoe UI, Arial, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '6px',
              color: '#dfc7a2',
              opacity: 0.82,
            }}
          >
            KETIKA MANUSIA MENGENAL API
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
