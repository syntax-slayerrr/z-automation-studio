import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  DashedGhostBlueprint,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  RetroSlabTitle3D,
  springSettle,
  VintagePostcardFrame,
  VP,
} from './fx';
import {
  BaseMistCollar,
  ErodedGouacheVolcano,
  GarutHighlandValley,
  LinelessGouacheCloud,
  PainterlyDefs,
  PainterlySky,
} from './painter';

/**
 * SCENE 6 — PENUTUP: GUNUNG GUNTUR MASA KINI & KARTU POS VINTAGE (01:08–01:20)
 * [V2 100% REAL LANDLOCKED GARUT HIGHLAND GEOGRAPHY — ZERO OCEAN/SEA!!]
 * 1. Seamless morphing: historic volcanic dusk -> sunlit vintage daytime teal sky & lush green Garut hills!
 * 2. Graceful pull-out revealing the REAL iconic Garut highland landscape:
 *    - Eroded lush green Gunung Guntur with authentic barren rock/savanna upper scar + sunlit base mist
 *    - Curving emerald-gold Garut terraced rice paddies (sawah terasering)
 *    - Narrow winding inland Sungai Cimanuk + subtle warm thermal steam wisps from Cipanas Garut
 *    - Organic hand-painted Garut highland pine + bamboo on left & Sunda saung pavilion on right!
 * 3. Crisp real-dash cream-gold ghost blueprint tracing the ancient towering cone cleanly BELOW title!
 * 4. Collectible Cream-Bordered Vintage Travel Postcard Pull-Out (`#C9BEA7`) locking on "GUNUNG GUNTUR / RAKSASA API GARUT"!
 */
export const Scene6ModernPostcard: React.FC<{ f: number }> = ({ f }) => {
  const s6Start = SCENES.s6Start;
  const totalFrames = SCENES.totalFrames;
  const localF = Math.max(0, f - s6Start);

  const morphGreenT = easeInOutCubic(localF / 72);
  const pullOutT = easeInOutCubic((f - (CUES.s6_pullout - 14)) / 78);
  const ghostDrawT = easeOutCubic((f - (CUES.s6_postcard - 10)) / 42);
  const postcardMatT = easeInOutCubic((f - (CUES.s6_postcard + 24)) / 32);
  const titleLockT = springSettle((f - (CUES.s6_postcard + 28)) / 24);
  const finalFade = f > totalFrames - 20 ? 1 - easeInOut((f - (totalFrames - 20)) / 20) : 1;

  const camScale = lerp(1.20, 1.0, pullOutT);

  // Clean 1:1 Danau Toba dashed ghost silhouette of ancient towering peak sitting cleanly BELOW hero title (y=412)!
  const ghostVolcanoD = 'M 75 732 L 266 492 L 336 414 L 360 432 L 384 414 L 454 492 L 645 732';

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#1E1A18', opacity: finalFade }}>
      <VintagePostcardFrame matProgress={postcardMatT}>
        <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
          <PainterlyDefs />

          {/* LAYER 0: Sky Morph — Historical Sepia Dusk -> 1:1 Danau Toba Sunlit Daytime Vintage Poster Sky! */}
          <PainterlySky f={f} mood="dusk" sunX={540} sunY={455} sunR={38} opacity={1} />
          <PainterlySky f={f} mood="day" sunX={540} sunY={455} sunR={40} opacity={morphGreenT} />

          {/* === MAIN CAMERA PULL-OUT COMPOSITION === */}
          <g transform={`translate(360, 620) scale(${camScale.toFixed(3)}) translate(-360, -620)`}>
            {/* LAYER 1: Lineless Painted Daytime Cumulus Clouds (Framed cleanly around Dashed Ghost Apex!) */}
            <LinelessGouacheCloud x={lerp(115, 165, localF / 420)} y={222} scale={1.02} tone="day" opacity={0.94} />
            <LinelessGouacheCloud x={lerp(600, 545, localF / 420)} y={282} scale={0.92} tone="day" opacity={0.92} flip />
            <LinelessGouacheCloud x={lerp(145, 195, localF / 420)} y={372} scale={0.76} tone="day" opacity={0.84} />

            {/* Peaceful Tiny Highland Birds Gliding Across Morning Sun */}
            {morphGreenT > 0.35 &&
              [0, 1, 2, 3].map((bi) => {
                const bx = ((210 + bi * 54 + localF * (0.45 + bi * 0.08)) % 680) + 20;
                const by = 432 + (bi % 2) * 28 + Math.sin(f * 0.1 + bi) * 5;
                const wing = Math.sin(f * 0.24 + bi * 1.7) * 4;
                return (
                  <path
                    key={bi}
                    d={`M ${bx - 9} ${by + wing} Q ${bx - 4} ${by - 4}, ${bx} ${by} Q ${bx + 4} ${by - 4}, ${bx + 9} ${by + wing}`}
                    fill="none"
                    stroke={VP.ink}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    opacity={morphGreenT * 0.72}
                  />
                );
              })}

            {/* 1:1 DANAU TOBA SIGNATURE: Real Pixel Dashed Cream-Gold Ghost Blueprint cleanly below title! */}
            <DashedGhostBlueprint d={ghostVolcanoD} drawProgress={ghostDrawT} clipId="gg6GhostClip" />

            {/* LAYER 2: Aerial-Perspective Distant Misty Priangan Mountain Ridges (Lineless!) */}
            <path
              d="M -60 725 L 88 632 L 222 680 L 495 668 L 625 612 L 780 698 L 780 830 L -60 830 Z"
              fill={morphGreenT > 0.45 ? '#7BA1A6' : '#7D6A72'}
            />
            <rect x={-60} y={645} width={840} height={105} fill="#E4E6D6" opacity={0.38 * morphGreenT} filter="url(#ptMistBlur)" />

            {/* LAYER 3: HERO ERODED LINELESS GUNUNG GUNTUR MORPHING FROM HISTORIC DUSK -> LUSH MODERN GARUT GREEN! */}
            <ErodedGouacheVolcano f={f} cx={360} baseY={745} peakY={472} halfW={335} mode="dusk" sunFromLeft={false} opacity={1} />
            <ErodedGouacheVolcano f={f} cx={360} baseY={745} peakY={472} halfW={335} mode="modern_green" sunFromLeft={false} opacity={morphGreenT} />
            {/* Volumetric Sun Halation Wrapping Warmly Across Guntur's Right Shoulder! */}
            <circle cx={540} cy={455} r={145} fill="#FAF3D8" opacity={0.22 * morphGreenT} filter="url(#ptSunBloom)" />

            {/* Subtle Base Morning Mist Cushion Hugging Guntur's Lower Slopes */}
            <BaseMistCollar f={f} y={718} tone="day" opacity={0.62 * morphGreenT} />

            {/* LAYER 4-6: 100% REAL LANDLOCKED GARUT HIGHLAND VALLEY (Sawah Terasering, Sungai Cimanuk, Cipanas Steam, Pine & Bamboo, Sunda Saung — ZERO OCEAN!) */}
            <GarutHighlandValley f={f} greenT={morphGreenT} pullOutT={pullOutT} />
          </g>
        </svg>

        {/* === COLLECTIBLE VINTAGE TRAVEL POSTCARD CLOSING TITLE LOCK === */}
        <RetroSlabTitle3D
          lines={['GUNUNG', 'GUNTUR']}
          subtitle="RAKSASA API GARUT"
          top={124}
          fontSize={62}
          opacity={clamp(titleLockT, 0, 1)}
          scale={lerp(0.86, 1.0, clamp(titleLockT, 0, 1.04))}
        />
      </VintagePostcardFrame>
    </AbsoluteFill>
  );
};
