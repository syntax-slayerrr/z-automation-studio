import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  EditorialBadge,
  GP,
  lerp,
  RetroSlabTitle3D,
  springSettle,
  SvgSlabLabel,
} from './fx';
import { ID_COORDS, IndonesiaPremiumAtlas } from './IndonesiaPremiumAtlas';
import { PeatPainterDefs } from './peatPainter';

/**
 * SCENE 2 — JEJAK SEJAK 26 RIBU TAHUN LALU (00:09–00:21)
 * 1. PREMIUM TEXTURED INDONESIA ATLAS zooming from Nusantara -> Sebangau, Kalimantan Tengah.
 * 2. Animated stainless-steel Russian peat corer plunging & extracting 9.5m core tube.
 * 3. Vertical pan tracing all organic strata of the 9.5-meter Sebangau peat core (0m -> 9.5m).
 * 4. Laboratory radiocarbon dating (C-14) graphic revealing ±26.000 TAHUN LALU -> zooms into core texture!
 */
export const Scene2SebangauCore: React.FC<{ f: number }> = ({ f }) => {
  const s2Start = SCENES.s2Start;
  const s3Start = SCENES.s3Start;
  const localF = Math.max(0, f - s2Start);

  // Phase 1: Premium Indonesia Atlas Zoom -> Sebangau (f = s2Start .. s2_auger + 18)
  const zoomT = easeInOutCubic(localF / 64);
  const mapCenterLng = lerp(112.2, ID_COORDS.sebangau[0], zoomT);
  const mapCenterLat = lerp(-1.8, ID_COORDS.sebangau[1], zoomT);
  const mapScale = lerp(1080, 4400, zoomT);

  // Phase 2: Core Drilling & 9.5m Core Sample Vertical Inspection (f = s2_auger .. s2_lab26k)
  const corePanelT = easeInOutCubic((f - (CUES.s2_auger - 6)) / 24);
  const drillPlungeT = easeOutCubic((f - CUES.s2_auger) / 28);
  const coreScrollT = easeInOutCubic((f - (CUES.s2_core95 - 8)) / 128);

  // Phase 3: Laboratory Radiocarbon Analysis -> ±26.000 TAHUN LALU (f = s2_lab26k .. s3Start)
  const labT = easeInOutCubic((f - (CUES.s2_lab26k - 14)) / 24);
  const numPopT = springSettle((f - (CUES.s2_lab26k + 4)) / 22);
  const exitDiveT = easeInOutCubic((f - (s3Start - 16)) / 16);

  const depthMeters = lerp(0, 9.5, coreScrollT);
  const c14Years = Math.round(lerp(0, 26000, easeOutCubic((f - (CUES.s2_lab26k - 4)) / 36)));

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#133144' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        {/* === PHASE 1: MUSEUM-GRADE TEXTURED TOPOGRAPHIC INDONESIA ATLAS === */}
        <g opacity={1 - labT * 0.85}>
          <IndonesiaPremiumAtlas
            f={f}
            center={[mapCenterLng, mapCenterLat]}
            scale={mapScale}
            centerY={565}
            highlightZone="sebangau"
            highlightT={easeOutCubic((localF - 18) / 30)}
            scaleBarLabel="SEBANGAU · KALTENG"
            scaleBarProgress={easeOutCubic((localF - 24) / 28)}
            pins={[
              {
                id: 'sebangau',
                label: 'SEBANGAU',
                sublabel: 'KALIMANTAN TENGAH',
                coord: ID_COORDS.sebangau,
                appearT: clamp((localF - 16) / 20, 0, 1),
                slab: true,
                labelDir: 'top',
                color: '#D23B26',
              },
            ]}
          />
        </g>

        {/* === PHASE 2: PEAT CORE AUGER & 9.5-METER ORGANIC CORE SAMPLE VERTICAL SCAN === */}
        {corePanelT > 0.01 && labT < 0.99 && (
          <g opacity={corePanelT * (1 - labT)}>
            {/* Warm Archival Geological Specimen Backdrop Panel (keeps map visible subtly on sides!) */}
            <rect x={0} y={0} width={720} height={1280} fill="#182328" opacity={0.86 * corePanelT} />
            <rect x={0} y={0} width={720} height={1280} fill="url(#gpHorizontalBrush)" opacity={0.85} />

            {/* Subtle Cross-Section Earth Background Behind Specimen */}
            <rect x={48} y={248} width={624} height={684} rx={8} fill="#212C32" stroke="#9A896B" strokeWidth={2} opacity={0.92} />

            {/* Animated Stainless-Steel Russian Peat Corer Handle & Rod (Clean Clearance Above Depth Readout!) */}
            <g transform={`translate(215, ${lerp(260, 326, drillPlungeT).toFixed(1)})`}>
              <text
                x={0}
                y={-26}
                textAnchor="middle"
                fill="#DFC896"
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={12.5}
                fontWeight={800}
                letterSpacing="2.2px"
              >
                BOR INTI GAMBUT
              </text>
              {/* T-Bar Auger Handle */}
              <rect x={-52} y={-12} width={104} height={12} rx={5} fill="#C8C4BA" stroke={GP.ink} strokeWidth={2} />
              <rect x={-7} y={0} width={14} height={180} fill="#9AA4AA" stroke={GP.ink} strokeWidth={1.8} />
              <rect x={-3} y={0} width={5} height={180} fill="#E4ECEE" opacity={0.6} />
              {/* Half-Cylinder Peat Corer Chamber */}
              <path
                d="M -22 180 L 22 180 L 22 365 Q 0 400, -22 365 Z"
                fill="#7D8990"
                stroke={GP.ink}
                strokeWidth={2}
              />
              {/* Damp Organic Core Inside Auger Chamber */}
              <path d="M -14 187 L 14 187 L 14 358 Q 0 382, -14 358 Z" fill="#4E3424" />
              <path d="M -14 187 L 14 187 L 14 358 Q 0 382, -14 358 Z" fill="url(#gpPeatFibers)" />
            </g>

            {/* HERO 9.5-METER FULL-STRATA PEAT CORE TUBE SCROLLING VERTICALLY! */}
            <g transform="translate(465, 290)">
              <defs>
                <clipPath id="s2CoreWindowClip">
                  <rect x={-72} y={0} width={144} height={590} rx={18} />
                </clipPath>
              </defs>

              {/* Soft Drop Shadow Behind Core Tube */}
              <rect x={-68} y={6} width={144} height={590} rx={18} fill="#0D1418" opacity={0.5} filter="url(#gpSoftShadow)" />

              {/* Scrolling 9.5-Meter Organic Stratigraphy Inside Core Window */}
              <g clipPath="url(#s2CoreWindowClip)">
                <g transform={`translate(0, ${lerp(0, -560, coreScrollT).toFixed(1)})`}>
                  {/* 0.0m - 2.0m: Fibric Light Moss & Intact Roots */}
                  <rect x={-76} y={0} width={152} height={240} fill="#7B563A" />
                  {/* 2.0m - 4.5m: Upper Hemic Reddish-Brown Wood Fibers */}
                  <rect x={-76} y={240} width={152} height={280} fill="#5C3B28" />
                  {/* 4.5m - 7.5m: Deep Hemic / Sapric Dark Rich Peat */}
                  <rect x={-76} y={520} width={152} height={340} fill="#3E281D" />
                  {/* 7.5m - 9.5m: Basal 26,000-Year Ancient Compressed Sapric Peat */}
                  <rect x={-76} y={860} width={152} height={230} fill="#261914" />
                  {/* > 9.5m: Pale Mineral Alluvial Clay Base */}
                  <rect x={-76} y={1090} width={152} height={110} fill="#625A52" />

                  {/* Organic Fibrous Texture & Embedded Ancient Wood Chips */}
                  <rect x={-76} y={0} width={152} height={1090} fill="url(#gpPeatFibers)" opacity={1} />
                  {Array.from({ length: 24 }).map((_, ci) => (
                    <g key={ci}>
                      <ellipse
                        cx={Math.sin(ci * 3.1) * 34}
                        cy={35 + ci * 44}
                        rx={14 + (ci % 3) * 7}
                        ry={4.5}
                        fill={ci < 6 ? '#9A744E' : ci < 15 ? '#6E4A32' : '#422B20'}
                        opacity={0.78}
                      />
                    </g>
                  ))}
                  {/* Cylindrical Glass / Specimen Rim Shading */}
                  <rect x={-76} y={0} width={28} height={1200} fill="#FAF2DC" opacity={0.14} />
                  <rect x={44} y={0} width={32} height={1200} fill="#120C0A" opacity={0.32} />
                </g>
              </g>

              {/* Crisp Specimen Tube Border */}
              <rect x={-72} y={0} width={144} height={590} rx={18} fill="none" stroke="#DFC896" strokeWidth={2.6} />

              {/* Animated Brass Metric Depth Ruler on Right Side (0m -> 9.5m) */}
              <g transform="translate(88, 0)">
                <line x1={0} y1={12} x2={0} y2={578} stroke="#DFC896" strokeWidth={2} />
                {[0, 2, 4, 6, 8, 9.5].map((mVal, mi) => {
                  const ty = 16 + (mVal / 9.5) * 556;
                  const passed = depthMeters >= mVal - 0.3;
                  return (
                    <g key={mi} transform={`translate(0, ${ty.toFixed(1)})`}>
                      <line x1={0} y1={0} x2={passed ? 14 : 9} y2={0} stroke={passed ? '#F8D348' : '#C8B894'} strokeWidth={2.2} />
                      <text
                        x={18}
                        y={4}
                        fill={passed ? '#F8D348' : '#C8B894'}
                        fontFamily='"Plus Jakarta Sans", sans-serif'
                        fontSize={13}
                        fontWeight={800}
                      >
                        {String(mVal).replace('.', ',')}m
                      </text>
                    </g>
                  );
                })}
                {/* Live Sliding Depth Pointer */}
                <polygon
                  points={`-16,${(16 + (depthMeters / 9.5) * 556).toFixed(1)} -2,${(9 + (depthMeters / 9.5) * 556).toFixed(1)} -2,${(23 + (depthMeters / 9.5) * 556).toFixed(1)}`}
                  fill="#F8D348"
                  stroke={GP.ink}
                  strokeWidth={1.4}
                />
              </g>
            </g>

            {/* Live Depth Counter Readout on Left Bottom of Panel */}
            <g transform="translate(215, 815)">
              <SvgSlabLabel x={0} y={0} text={`${depthMeters.toFixed(1).replace('.', ',')} METER`} fontSize={32} fill="#F8D348" />
              <text
                x={0}
                y={26}
                textAnchor="middle"
                fill="#EFE6D3"
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={12.5}
                fontWeight={800}
                letterSpacing="2.4px"
              >
                KEDALAMAN INTI GAMBUT
              </text>
            </g>
          </g>
        )}

        {/* === PHASE 3: RADIOCARBON C-14 LABORATORY DATING -> ±26.000 TAHUN LALU === */}
        {labT > 0.01 && (
          <g
            opacity={labT}
            transform={`translate(360, 610) scale(${lerp(1.0, 2.2, exitDiveT).toFixed(3)}) translate(-360, -610)`}
          >
            <rect x={0} y={0} width={720} height={1280} fill="#182228" />
            <rect x={0} y={0} width={720} height={1280} fill="url(#gpHorizontalBrush)" opacity={0.85} />

            {/* Subtle Vintage Lab Measurement Grid */}
            <g stroke="#FAF1DC" strokeOpacity={0.07} strokeWidth={1}>
              {[180, 320, 460, 600, 740, 880].map((gy) => (
                <line key={gy} x1={40} y1={gy} x2={680} y2={gy} />
              ))}
              {[120, 240, 360, 480, 600].map((gx) => (
                <line key={gx} x1={gx} y1={160} x2={gx} y2={940} />
              ))}
            </g>

            {/* Illuminated Microscope / Radiocarbon Specimen Lens on Basal 9.5m Peat Sample */}
            <g transform="translate(360, 615)">
              <circle r={195} fill="#2A1D17" stroke="#DFC896" strokeWidth={3.5} />
              <circle r={176} fill="#3A271E" />
              <clipPath id="s2LabLens">
                <circle r={174} />
              </clipPath>
              <g clipPath="url(#s2LabLens)">
                <rect x={-180} y={-180} width={360} height={360} fill="url(#gpPeatFibers)" opacity={1} />
                {/* Magnified Organic Plant Cells & Glowing Carbon-14 Isotope Pulses */}
                {Array.from({ length: 14 }).map((_, ci) => {
                  const ang = ci * 1.9 + f * 0.018;
                  const rad = 28 + (ci % 4) * 34;
                  const cx = Math.cos(ang) * rad;
                  const cy = Math.sin(ang) * rad;
                  return (
                    <g key={ci}>
                      <circle cx={cx} cy={cy} r={8 + (ci % 3) * 4} fill="#5C3D28" stroke="#9A7850" strokeWidth={1.2} opacity={0.72} />
                      <circle cx={cx} cy={cy} r={3.2} fill="#F8D348" opacity={0.45 + 0.45 * Math.sin(f * 0.16 + ci)} />
                    </g>
                  );
                })}
                {/* Radiocarbon C-14 Decay Waveform Sweeping Across Lens */}
                <path
                  d={`M -170 48 Q -90 ${-20 + Math.sin(f * 0.15) * 14}, -10 18 T 170 ${-36 + Math.cos(f * 0.15) * 12}`}
                  fill="none"
                  stroke="#F8D348"
                  strokeWidth={3}
                  opacity={0.85}
                />
              </g>
              {/* Rotating Outer Radiocarbon Brass Calibration Dial */}
              <circle r={212} fill="none" stroke="#F8D348" strokeWidth={1.6} strokeDasharray="10 8" opacity={0.62} transform={`rotate(${(f * 0.4).toFixed(1)})`} />
              <text
                y={-198}
                textAnchor="middle"
                fill="#F8D348"
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={12}
                fontWeight={800}
                letterSpacing="3px"
              >
                ANALISIS RADIOCARBON C-14 · DASAR 9,5 M
              </text>
            </g>

            {/* Monumental Animated Radiocarbon Year Readout */}
            <g opacity={clamp(numPopT, 0, 1)}>
              <SvgSlabLabel
                x={360}
                y={275}
                text={`±${c14Years.toLocaleString('id-ID')}`}
                fontSize={72}
                fill="#F8D348"
                scale={lerp(0.84, 1.0, clamp(numPopT, 0, 1.04))}
              />
              <SvgSlabLabel x={360} y={335} text="TAHUN LALU" fontSize={36} />
            </g>
          </g>
        )}
      </svg>

      {/* Top Editorial Headers per Phase (Cleanly Non-Overlapping!) */}
      {corePanelT > 0.25 && labT < 0.5 && (
        <RetroSlabTitle3D
          lines={['INTI GAMBUT 9,5 METER']}
          subtitle="SEBANGAU, KALIMANTAN TENGAH"
          top={112}
          fontSize={40}
          opacity={corePanelT * (1 - labT * 2)}
        />
      )}
      {corePanelT <= 0.25 && (
        <EditorialBadge
          text="SEBANGAU, KALIMANTAN TENGAH"
          top={98}
          opacity={easeOutCubic(localF / 22) * (1 - corePanelT * 4)}
          fontSize={14}
        />
      )}
      {labT > 0.35 && (
        <EditorialBadge
          text="PENANGGALAN INTI GAMBUT SEBANGAU"
          top={120}
          opacity={easeOutCubic((labT - 0.35) / 0.5)}
          fontSize={13.5}
        />
      )}
    </AbsoluteFill>
  );
};
