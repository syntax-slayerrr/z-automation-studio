import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AtlasMap2D, GEO } from "../../shared/AtlasMap2D";
import {
  Cam2D,
  EditorialCallout,
  K3,
  PerspStage,
  camAt,
  clamp,
  handheld,
  lerp,
  pe,
  prog,
  project3D,
  shake,
} from "../../shared/Flat3DCamera";
import { HeritageKid, santriPutra, santriPutri } from "../../shared/HeritageKid";
import {
  BanyanTree,
  BugisPinisi25D,
  HeritageBrassLamp,
  HeritageHall,
  PaintedPeak,
  RainField,
  RollingRidge,
  RumahPanggung,
  SeaWaveBands,
  StageBackdrop,
  SunAura,
  SwayingPalm,
} from "../../shared/HeritageProps25D";
import { FONT_SANS, FONT_SERIF, HERITAGE, SunDustMotes } from "../../shared/PaperTextures";
import { ParchmentCartouche, RedWaxSeal } from "../../shared/VintageCartouche";
import { SCENES, cue } from "./script";

const fadeIn = (frame: number, start: number, dur = 10) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/**
 * S0 — Hook Paradoks (0.03s -> 13.86s)
 * Sunlit 2.5D archive table + curious Kid historian + sliding year cards 1961 -> 1919.
 */
export const Scene0HookArchive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[0].dur;

  const fBorn = cue(0, "s0_born", 83);
  const fSolo = cue(0, "s0_solo", 180);
  const fSlash = cue(0, "s0_slash", 205);
  const fStart = cue(0, "s0_start", 262);
  const fTwist = cue(0, "s0_twist", 340);
  const f42 = cue(0, "s0_42y", 382);

  const slashDraw = pe(frame, fSlash, fSlash + 14);
  const rollProgress = pe(frame, fSlash + 20, f42 + 4);
  const rolledYear = Math.round(1961 - rollProgress * 42);
  const slashKeep = 1 - fadeIn(frame, f42 - 12, 10);
  const waxImpactT = frame - fBorn;
  const slashImpactT = frame - fSlash;
  const twistPop = spring({ frame: Math.max(0, frame - f42), fps, config: { damping: 12, stiffness: 190 } });

  const [cx, cy, zoom] = camAt(
    frame,
    [
      K3(0, 540, 960, 1.0),
      K3(fBorn, 540, 920, 1.08),
      K3(fSolo, 540, 900, 1.13),
      K3(fSlash + 10, 540, 975, 0.99),
      K3(fTwist, 530, 945, 1.06),
      K3(dur, 540, 920, 1.11),
    ],
    0.55
  );
  const [hx, hy] = handheld(frame, 2.5);
  const sx = shake(waxImpactT, 7) + shake(slashImpactT, 11);
  const sy = shake(slashImpactT, 5);
  const tiltX = lerp(3.5, 7.2, rollProgress);

  const surprise = pe(frame, fSlash, fSlash + 16);
  const kidLookY = surprise > 0.2 ? -0.55 : -0.75;
  const kidHead = lerp(2, -9, surprise) + Math.sin(frame * 0.06) * 2;
  const wax1961Op = 1 - fadeIn(frame, fSlash + 16, 8);

  const years = [1919, 1926, 1950, 1961]; // bottom -> top so 1961 sits visibly on top at f=0

  return (
    <AbsoluteFill style={{ backgroundColor: "#c8ab7c" }}>
      <PerspStage tiltXDeg={tiltX} scaleBoost={1.07} origin="50% 62%">
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <StageBackdrop id="s0_sky" top="#f2e7cf" mid="#e8d6b3" bottom="#c8ab7c" />

          <Cam2D cx={cx + hx + sx} cy={cy + hy + sy} zoom={zoom}>
            {/* Slanted window sunbeam shafts across museum study */}
            <polygon
              points="180,-200 720,-200 1040,1450 260,1450"
              fill="#fff3cf"
              opacity={0.34 - 0.14 * surprise}
            />
            <polygon
              points="320,-200 620,-200 840,1450 420,1450"
              fill="#ffe49c"
              opacity={0.22}
            />

            {/* Architectural back wall paneling + picture rail */}
            <line x1={-200} y1={1060} x2={1300} y2={1060} stroke="#8f7048" strokeWidth={3} opacity={0.45} />
            <rect x={-200} y={1060} width={1500} height={380} fill="#d6be93" opacity={0.45} />

            {/* Fore/Midground Oak Historian Desk Surface (2.5D tilted trapezoid) */}
            <polygon
              points="-180,1410 1260,1410 1420,1980 -340,1980"
              fill="#8d5d33"
              stroke="#26180d"
              strokeWidth={3.5}
            />
            <polygon
              points="-180,1410 1260,1410 1260,1454 -180,1454"
              fill="#a87646"
              stroke="#26180d"
              strokeWidth={2.5}
            />
            {/* Desk plank grain seams */}
            {[1520, 1660, 1810].map((py, idx) => (
              <line
                key={idx}
                x1={-260}
                y1={py}
                x2={1340}
                y2={py}
                stroke="#4a2b13"
                strokeWidth={2.2}
                opacity={0.35}
              />
            ))}

            {/* Left desk stack: tied leather archival folders moving on timeline roll */}
            <g transform={`translate(220, 1390) rotate(${lerp(-5, -11, rollProgress)})`}>
              <ellipse cx={12} cy={22} rx={155} ry={22} fill="#180d05" opacity={0.26} />
              {[0, 1, 2].map((b) => (
                <g key={b} transform={`translate(${b * 6},${-b * 34}) rotate(${b * 2.5 - 3})`}>
                  <rect x={-125} y={-28} width={250} height={32} rx={5} fill={["#6f3822", "#4e3926", "#7f4d2d"][b]} stroke="#26180d" strokeWidth={2.6} />
                  <rect x={-110} y={-22} width={220} height={6} fill="#efe1be" opacity={0.65} />
                </g>
              ))}
              {/* Resting brass compass & inkwell */}
              <rect x={165} y={-34} width={48} height={52} rx={6} fill="#362c28" stroke="#180d05" strokeWidth={2.5} />
              <rect x={174} y={-44} width={30} height={12} rx={2} fill="#b68838" stroke="#180d05" strokeWidth={2} />
            </g>

            {/* Sliding & Flipping 3D-feel Milestone Year Deck (1961 top -> peels back to 1919) */}
            <g transform="translate(390, 1210)">
              {years.map((yr, stackIdx) => {
                // stackIdx: 0 = 1919 (bottom), 3 = 1961 (top at f=0)
                const peelOrder = 3 - stackIdx; // 1961 peels first (0), then 1950 (1), then 1926 (2)
                const peelStart = peelOrder * 0.24;
                const slideOut = stackIdx === 0 ? 0 : pe(clamp((rollProgress - peelStart) * 2.8, 0, 1), 0, 1);
                const isFront1919 = stackIdx === 0 && rollProgress > 0.72;
                const isFront1961 = stackIdx === 3 && rollProgress < 0.22;
                const offsetX = peelOrder * -10 - slideOut * 380;
                const offsetY = peelOrder * 8 + slideOut * 120;
                const rot = peelOrder * -2.8 - slideOut * 24;
                const op = stackIdx === 0 ? 1 : 1 - slideOut;
                if (op <= 0.02) return null;
                return (
                  <g
                    key={yr}
                    transform={`translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}) rotate(${rot.toFixed(1)})`}
                    opacity={op}
                  >
                    <rect x={-96} y={-58} width={192} height={116} rx={6} fill="rgba(26,16,8,0.22)" transform="translate(5,7)" />
                    <rect
                      x={-96}
                      y={-58}
                      width={192}
                      height={116}
                      rx={6}
                      fill={isFront1919 || isFront1961 ? "#f8eed6" : "#ead8b6"}
                      stroke="#3a2412"
                      strokeWidth={3}
                    />
                    <rect x={-86} y={-48} width={172} height={96} rx={3} fill="none" stroke="#a68050" strokeWidth={1.6} />
                    <text
                      x={0}
                      y={16}
                      textAnchor="middle"
                      fontFamily={FONT_SERIF}
                      fontWeight={800}
                      fontSize={52}
                      fill={stackIdx === 0 && rollProgress > 0.65 ? HERITAGE.oxblood : HERITAGE.ink}
                    >
                      {yr}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Connecting backwards arrow cleanly above deck */}
            {frame >= fStart && (
              <g opacity={pe(frame, fStart, fStart + 20)}>
                <path
                  d="M275,920 Q520,840 725,920"
                  fill="none"
                  stroke={HERITAGE.oxblood}
                  strokeWidth={4.5}
                  strokeDasharray="12 8"
                />
                <polygon points="275,920 296,906 293,932" fill={HERITAGE.oxblood} />
              </g>
            )}

            {/* Living HeritageKid Historian Actor beside desk */}
            <HeritageKid
              look={santriPutra(0, "brown")}
              f={frame}
              x={815}
              y={1440}
              scale={1.42}
              flip={false}
              held={surprise > 0.15 ? "lamp" : "magnifier"}
              heldHand="L"
              armL={[lerp(42, 96, surprise), lerp(20, 44, surprise)]}
              armR={[lerp(12, 34, surprise), 18]}
              head={kidHead}
              look2={[-0.6, kidLookY]}
              brow={lerp(0.25, -0.75, surprise)}
              smile={lerp(0.35, -0.25, surprise)}
              open={surprise > 0.15 && surprise < 0.85 ? 0.45 : 0}
              seed={12}
            />

            {/* Short callout placed left-above stacked timeline cards cleanly away from raised lantern */}
            <EditorialCallout
              x={315}
              y={1040}
              sub="AKAR SEJARAH"
              text="Berawal dari 1919"
              t={frame - f42}
              color={HERITAGE.oxblood}
              size={28}
            />
          </Cam2D>
        </svg>
      </PerspStage>

      <SunDustMotes color="#ffe39f" count={18} opacity={0.35} />

      {/* Center Editorial Year Cartouche + Crimson Slash + Wax Stamps */}
      <div
        style={{
          position: "absolute",
          top: 215,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${(rollProgress * -16).toFixed(1)}px)`,
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative" }}>
          <ParchmentCartouche
            width={780}
            height={272}
            kicker={
              rollProgress > 0.72
                ? "BENIH PERTAMA · YOGYAKARTA"
                : frame >= fSolo
                ? "SURAKARTA · KELAHIRAN RESMI"
                : "IKATAN PELAJAR MUHAMMADIYAH"
            }
            title={String(rolledYear)}
            titleSize={126}
            subtitle={
              rollProgress > 0.72
                ? "Akar Gerakan Pelajar Muhammadiyah"
                : frame >= fBorn
                ? "Ikatan Pelajar Muhammadiyah"
                : "Catatan Sejarah Organisasi"
            }
            triggerFrame={0}
          />

          {/* Dynamic brush slash over 1961 — fades cleanly away as 1919 locks in */}
          {slashDraw > 0.01 && slashKeep > 0.01 && (
            <svg
              width={430}
              height={160}
              viewBox="0 0 430 160"
              style={{
                position: "absolute",
                top: 52,
                left: 175,
                opacity: slashKeep,
                pointerEvents: "none",
              }}
            >
              <path
                d="M16,134 Q215,62 414,22"
                fill="none"
                stroke="#b02214"
                strokeWidth={14}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - slashDraw}
              />
            </svg>
          )}

          {frame >= fBorn && wax1961Op > 0.01 && (
            <div style={{ position: "absolute", top: 76, right: -26, opacity: wax1961Op }}>
              <RedWaxSeal text="1961" size={118} triggerFrame={fBorn} />
            </div>
          )}

          {frame >= f42 - 6 && (
            <div style={{ position: "absolute", top: 74, right: -26 }}>
              <RedWaxSeal text="1919" size={122} triggerFrame={f42 - 6} />
            </div>
          )}
        </div>

        {frame >= f42 && (
          <div
            style={{
              marginTop: 22,
              textAlign: "center",
              opacity: fadeIn(frame, f42, 8),
              transform: `scale(${(0.88 + 0.12 * twistPop).toFixed(3)})`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 46,
                fontWeight: 800,
                color: HERITAGE.oxblood,
                textShadow: "0 2px 12px rgba(244,234,212,0.95)",
              }}
            >
              42 Tahun Lebih Tua
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: FONT_SERIF,
                fontStyle: "italic",
                fontSize: 23,
                color: HERITAGE.ink,
                fontWeight: 700,
              }}
            >
              1961 ←─────── 1919
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * S1 — 1919 Yogyakarta: AtlasMap Dive -> 3D Projected Courtyard Walk to Madrasah Mu'allimin
 */
export const Scene1Yogyakarta1919: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES[1].dur;
  const fDoor = cue(1, "s1_door", 97);
  const fName = cue(1, "s1_name", 264);
  const fInk = cue(1, "s1_ink", 392);

  const reveal = fadeIn(frame, fDoor, 14);
  const doorOpen = pe(frame, fName - 24, fName + 18);
  const glowPower = 0.25 + doorOpen * 0.75 + fadeIn(frame, fInk, 18) * 0.25;

  // Walk progress along 3D corridor into Mu'allimin entrance
  const walkT = Math.max(0, frame - fDoor);
  const [cx, cy, zoom] = camAt(
    walkT,
    [
      K3(0, 540, 1020, 0.96),
      K3(Math.max(40, fName - fDoor), 540, 960, 1.04),
      K3(Math.max(80, dur - fDoor), 540, 915, 1.12),
    ],
    0.55
  );
  const [hx, hy] = handheld(frame, 2.2);

  // True 3D camera gliding smoothly down cobblestone walkway behind/beside walking students
  const walkRatio = clamp(walkT / Math.max(60, dur - fDoor), 0, 1);
  const cam3D = {
    x: lerp(0, 0, walkRatio),
    y: lerp(1.75, 1.95, walkRatio),
    z: lerp(-1.2, 2.8, walkRatio),
    fov: 960,
    horizonY: 940,
    pitchRad: -0.05,
  };

  // Build perspective cobblestone pavers along 3D pathway
  const cobbleRows: Array<{ z0: number; z1: number; shade: string }> = [];
  for (let i = 0; i < 16; i++) {
    cobbleRows.push({
      z0: 0.5 + i * 1.15,
      z1: 1.55 + i * 1.15,
      shade: i % 2 === 0 ? "#cab794" : "#bda882",
    });
  }

  // 3 walking students + roadside waving greeter spaced cleanly without overlap
  const walkers = [
    { id: 0, wx: -0.78, z0: 4.9, z1: 10.6, look: santriPutra(0, "brown"), held: "book" as const, phase: 0 },
    { id: 1, wx: 0.15, z0: 5.5, z1: 11.4, look: santriPutra(1, "indigo"), held: "letter" as const, phase: 1.7 },
    { id: 2, wx: 1.05, z0: 5.0, z1: 10.9, look: santriPutra(2, "olive"), held: null, phase: 3.1 },
  ];

  return (
    <AbsoluteFill>
      {/* Shot 1: Geographic zoom across Central Java onto Yogyakarta */}
      <AtlasMap2D
        fromCenter={[112.2, -7.2]}
        toCenter={GEO.yogyakarta}
        fromZoom={2.45}
        toZoom={4.35}
        moveStartFrame={0}
        moveEndFrame={Math.max(20, fDoor + 8)}
        activeIslands={["jawa"]}
        activeIslandFrame={0}
        tiltDeg={7.5}
        pins={[
          {
            id: "jogja1919",
            label: "YOGYAKARTA",
            sublabel: "1919 · SISWO PROJO",
            coord: GEO.yogyakarta,
            triggerFrame: 4,
            color: HERITAGE.oxblood,
            size: "lg",
            labelSide: "top",
          },
        ]}
      />

      {frame < fDoor + 6 && (
        <div style={{ position: "absolute", top: 215, left: 84, opacity: 1 - reveal }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 82, fontWeight: 800, color: HERITAGE.ink, lineHeight: 0.95 }}>
            1919
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 28, fontWeight: 700, color: HERITAGE.oxblood }}>
            Jawa Tengah · Yogyakarta
          </div>
        </div>
      )}

      {/* Shot 2: 2.5D Courtyard + Real 3D-Projected Walking Students Into Mu'allimin */}
      {frame >= fDoor && (
        <AbsoluteFill style={{ opacity: reveal, backgroundColor: "#9ca26f" }}>
          <PerspStage tiltXDeg={lerp(2.5, 4.5, walkRatio)} scaleBoost={1.06}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              <StageBackdrop id="s1_sky" top="#f5ead3" mid="#ead6af" bottom="#d8bd8b" />

              <Cam2D cx={cx + hx} cy={cy + hy} zoom={zoom}>
                <SunAura id="s1_sun" x={540} y={560} r={540} color="#ffe39e" op={0.55} />

                {/* Distant Volcanic Merapi Backdrop (low parallax) */}
                <PaintedPeak x={820} y={960} w={560} h={310} lit="#9ea996" shade="#73806f" />
                <RollingRidge y={980} color="#8a9779" amp={42} seed={3} />

                {/* Courtyard Grass Ground Horizon */}
                <rect x={-400} y={940} width={1900} height={1300} fill="#9ca26f" />

                {/* 3D Perspective Courtyard Flagstone Path */}
                {cobbleRows.map((row, idx) => {
                  const pL0 = project3D(-1.7, 0, row.z0, cam3D);
                  const pR0 = project3D(1.7, 0, row.z0, cam3D);
                  const pR1 = project3D(1.7, 0, row.z1, cam3D);
                  const pL1 = project3D(-1.7, 0, row.z1, cam3D);
                  if (!pL0 || !pR0 || !pR1 || !pL1) return null;
                  return (
                    <polygon
                      key={idx}
                      points={`${pL0.sx.toFixed(1)},${pL0.sy.toFixed(1)} ${pR0.sx.toFixed(1)},${pR0.sy.toFixed(1)} ${pR1.sx.toFixed(1)},${pR1.sy.toFixed(1)} ${pL1.sx.toFixed(1)},${pL1.sy.toFixed(1)}`}
                      fill={row.shade}
                      stroke="#7a6443"
                      strokeWidth={1.6}
                    />
                  );
                })}

                {/* Background Swaying Trees & Palms */}
                <SwayingPalm x={115} y={1020} s={0.95} f={frame} seed={4} />
                <SwayingPalm x={965} y={1030} s={1.05} f={frame} seed={9} />
                <BanyanTree x={180} y={1045} s={0.85} f={frame} seed={2} />
                <BanyanTree x={910} y={1040} s={0.9} f={frame} seed={7} />

                {/* Madrasah Mu'allimin Yogyakarta Pendopo anchored at path end */}
                {(() => {
                  const hp = project3D(0, 0, 12.6, cam3D);
                  if (!hp) return null;
                  const s = hp.sc / 100;
                  return (
                    <g transform={`translate(${hp.sx.toFixed(1)},${hp.sy.toFixed(1)}) scale(${(s * 0.92).toFixed(4)})`}>
                      <HeritageHall
                        id="s1_hall"
                        x={0}
                        y={0}
                        w={920}
                        h={360}
                        door={0.18 + doorOpen * 0.82}
                        glow={glowPower}
                      />
                    </g>
                  );
                })()}

                {/* Depth-Sorted 3D Projected Walking Santri Students + Greeter */}
                {walkers
                  .map((w) => {
                    const wz = lerp(w.z0, w.z1, pe(walkRatio, 0, 0.92));
                    const pt = project3D(w.wx, 0, wz, cam3D);
                    return pt ? { ...w, pt, wz } : null;
                  })
                  .filter((x): x is NonNullable<typeof x> => Boolean(x))
                  .sort((a, b) => b.wz - a.wz)
                  .map((w) => (
                    <HeritageKid
                      key={w.id}
                      look={w.look}
                      f={frame}
                      x={w.pt.sx}
                      y={w.pt.sy}
                      scale={(w.pt.sc / 170) * 0.95}
                      backView={true}
                      walk={walkT * 0.24 + w.phase}
                      walkAmp={walkRatio < 0.9 ? 1 : 0.1}
                      held={w.held}
                      heldHand="R"
                      seed={w.id + 20}
                    />
                  ))}

                {/* Cheerful Foreground-Left Greeter Kid spaced cleanly at walkway shoulder */}
                {(() => {
                  const gp = project3D(-2.35, 0, 7.6, cam3D);
                  if (!gp) return null;
                  const waveArm = 112 + Math.sin(frame * 0.22) * 18;
                  return (
                    <HeritageKid
                      look={santriPutra(3, "brown")}
                      f={frame}
                      x={gp.sx}
                      y={gp.sy}
                      scale={gp.sc / 165}
                      armR={[waveArm, 24]}
                      armL={[10, 8]}
                      look2={[0.8, 0.1]}
                      smile={0.8}
                      seed={88}
                    />
                  );
                })()}

                {/* Framing close-foreground banyan foliage silhouette at bottom corners */}
                <BanyanTree x={-60} y={1680} s={1.25} f={frame} seed={15} leaf="#37512d" hi="#4f6e3f" />
                <BanyanTree x={1150} y={1700} s={1.3} f={frame} seed={19} leaf="#37512d" hi="#4f6e3f" />

                <EditorialCallout
                  x={540}
                  y={1040}
                  sub="YOGYAKARTA · 1919"
                  text="Tempat pelajar belajar bersama"
                  t={frame - fInk}
                  color={HERITAGE.oxblood}
                  size={30}
                />
              </Cam2D>
            </svg>
          </PerspStage>
          <SunDustMotes color="#ffe6a3" count={18} opacity={0.25 + fadeIn(frame, fInk, 18) * 0.25} />

          {/* Calm open-sky Header -> Siswo Projo Cartouche */}
          {frame < fName - 6 ? (
            <div style={{ position: "absolute", top: 222, left: 84, right: 84, textAlign: "center", opacity: fadeIn(frame, fDoor + 4, 10) }}>
              <div style={{ fontFamily: FONT_SANS, fontWeight: 800, fontSize: 16, letterSpacing: 3, color: HERITAGE.oxblood }}>
                YOGYAKARTA · 1919
              </div>
              <div style={{ marginTop: 8, fontFamily: FONT_SERIF, fontSize: 42, fontWeight: 800, color: HERITAGE.ink, textShadow: "0 2px 12px rgba(242,231,208,0.92)" }}>
                Madrasah Mu&apos;allimin Muhammadiyah
              </div>
            </div>
          ) : (
            <div style={{ position: "absolute", top: 205, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <ParchmentCartouche
                width={790}
                height={196}
                kicker="MADRASAH MU'ALLIMIN MUHAMMADIYAH"
                title="Siswo Projo"
                titleSize={58}
                subtitle="Perintisan Pelajar · Yogyakarta, 1919"
                triggerFrame={fName - 6}
                waxYear="1919"
              />
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * S2 — 1926 Malang & Surakarta: AtlasMap Wave -> Candlelit Archive Study (2 Separated Youth!)
 */
export const Scene2Gkpm1926: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES[2].dur;
  const f1926 = cue(2, "s2_1926", 101);
  const fMlg = cue(2, "s2_mlg", 252);
  const fSlo = cue(2, "s2_slo", 283);
  const fDiff = cue(2, "s2_diff", 310);
  const fNeed = cue(2, "s2_need", 424);

  const studyReveal = fadeIn(frame, fDiff, 14);
  const rolledYear = Math.round(
    interpolate(frame, [0, Math.max(24, f1926)], [1919, 1926], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const studyF = Math.max(0, frame - fDiff);
  const [cx, cy, zoom] = camAt(
    studyF,
    [
      K3(0, 540, 1020, 0.96),
      K3(Math.max(40, fNeed - fDiff), 540, 960, 1.05),
      K3(Math.max(70, dur - fDiff), 540, 930, 1.12),
    ],
    0.55
  );
  const [hx, hy] = handheld(frame, 2.0);
  const needGlow = pe(frame, fNeed - 10, fNeed + 26);

  return (
    <AbsoluteFill>
      <AtlasMap2D
        fromCenter={[110.4, -7.7]}
        toCenter={[111.75, -7.75]}
        fromZoom={3.5}
        toZoom={3.2}
        moveStartFrame={6}
        moveEndFrame={Math.max(40, fSlo + 10)}
        activeIslands={["jawa"]}
        activeIslandFrame={0}
        tiltDeg={7.5}
        routes={[
          {
            id: "route_mlg",
            from: GEO.yogyakarta,
            to: GEO.malang,
            startFrame: Math.max(12, fMlg - 32),
            endFrame: Math.max(24, fMlg + 4),
            color: HERITAGE.oxblood,
            traveler: "walker",
            arcBendDeg: 0.35,
          },
          {
            id: "route_slo",
            from: GEO.yogyakarta,
            to: GEO.surakarta,
            startFrame: Math.max(18, fSlo - 22),
            endFrame: Math.max(30, fSlo + 6),
            color: "#9a4a1a",
            traveler: "walker",
            arcBendDeg: 0.16,
          },
        ]}
        pins={[
          {
            id: "yog19",
            label: "YOGYAKARTA",
            sublabel: "1919 · SISWO PROJO",
            coord: GEO.yogyakarta,
            triggerFrame: 0,
            color: "#7a5330",
            size: "sm",
            labelSide: "bottom",
          },
          {
            id: "mlg26",
            label: "MALANG",
            sublabel: "1926 · GKPM",
            coord: GEO.malang,
            triggerFrame: fMlg - 6,
            color: HERITAGE.oxblood,
            size: "md",
            labelSide: "bottom",
          },
          {
            id: "slo26",
            label: "SURAKARTA",
            sublabel: "1926 · GKPM",
            coord: GEO.surakarta,
            triggerFrame: fSlo - 6,
            color: HERITAGE.oxblood,
            size: "md",
            labelSide: "top",
          },
        ]}
      />

      {frame < f1926 - 8 && (
        <div style={{ position: "absolute", top: 215, left: 84 }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 82, fontWeight: 800, color: HERITAGE.ink, lineHeight: 0.95 }}>
            {rolledYear}
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 28, fontWeight: 700, color: HERITAGE.oxblood }}>
            Tujuh Tahun Berselang...
          </div>
        </div>
      )}

      {frame >= f1926 - 8 && frame < fDiff + 12 && (
        <div
          style={{
            position: "absolute",
            top: 205,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: 1 - studyReveal,
          }}
        >
          <ParchmentCartouche
            width={850}
            height={196}
            kicker="GELOMBANG JAWA TIMUR & TENGAH"
            title="Gabungan Keluarga Pelajar Muhammadiyah"
            titleSize={33}
            subtitle="GKPM · Malang & Surakarta"
            triggerFrame={f1926 - 8}
            waxYear="1926"
          />
        </div>
      )}

      {/* Shot 2: Cozy Dusk Study Room with Two Distinct Students & Flickering Oil Lamp */}
      {frame >= fDiff && (
        <AbsoluteFill style={{ opacity: studyReveal, backgroundColor: "#18100a" }}>
          <PerspStage tiltXDeg={3.5} scaleBoost={1.06}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              <StageBackdrop id="s2_dusk" top="#221912" mid="#342519" bottom="#18100a" />

              <Cam2D cx={cx + hx} cy={cy + hy} zoom={zoom}>
                {/* Subtle Library Bookcase Shelves Silhouettes */}
                <rect x={80} y={560} width={380} height={580} fill="#2a1d13" stroke="#180f08" strokeWidth={3} opacity={0.75} />
                <rect x={620} y={560} width={380} height={580} fill="#2a1d13" stroke="#180f08" strokeWidth={3} opacity={0.75} />
                {[680, 820, 960].map((sy, r) => (
                  <g key={r}>
                    <line x1={80} y1={sy} x2={460} y2={sy} stroke="#4e3420" strokeWidth={8} />
                    <line x1={620} y1={sy} x2={1000} y2={sy} stroke="#4e3420" strokeWidth={8} />
                  </g>
                ))}

                {/* Expanding Dotted Rings Signifying Growing Shared Need */}
                {frame >= fNeed - 10 &&
                  [0, 1, 2].map((i) => {
                    const ringK = prog(frame, fNeed - 10 + i * 12, fNeed + 60 + i * 12);
                    return (
                      <circle
                        key={i}
                        cx={540}
                        cy={840}
                        r={80 + ringK * 380}
                        fill="none"
                        stroke="#e6b85c"
                        strokeWidth={4}
                        strokeDasharray="10 10"
                        opacity={(1 - ringK) * 0.55}
                      />
                    );
                  })}

                {/* Two Physically Separated Archival Charters Floating Behind Youth */}
                <g transform={`translate(${275 - needGlow * 14}, 680) rotate(-3)`}>
                  <rect x={-165} y={-95} width={330} height={190} rx={6} fill="#efe1c1" stroke="#3c2614" strokeWidth={3} />
                  <text x={0} y={-24} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={36} fill={HERITAGE.oxblood}>
                    1919
                  </text>
                  <text x={0} y={24} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={28} fill={HERITAGE.ink}>
                    Siswo Projo
                  </text>
                  <text x={0} y={58} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={14} letterSpacing={2} fill="#6c4d30">
                    YOGYAKARTA
                  </text>
                </g>

                <g transform={`translate(${805 + needGlow * 14}, 680) rotate(3)`}>
                  <rect x={-165} y={-95} width={330} height={190} rx={6} fill="#f4ead3" stroke="#3c2614" strokeWidth={3} />
                  <text x={0} y={-24} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={36} fill={HERITAGE.oxblood}>
                    1926
                  </text>
                  <text x={0} y={24} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={28} fill={HERITAGE.ink}>
                    GKPM
                  </text>
                  <text x={0} y={58} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={14} letterSpacing={2} fill="#6c4d30">
                    MALANG &amp; SURAKARTA
                  </text>
                </g>

                {/* Central Dividing Symbol Between Them ("≠") */}
                <line x1={540} y1={590} x2={540} y2={990} stroke="#d4aa5a" strokeWidth={2.5} strokeDasharray="8 10" opacity={0.45} />

                {/* Left & Right Living Youth Students */}
                <HeritageKid
                  look={santriPutra(1, "brown")}
                  f={frame}
                  x={280}
                  y={1405}
                  scale={1.36}
                  held="letter"
                  heldHand="R"
                  armR={[42, 34]}
                  armL={[10, 12]}
                  look2={[0.6, -0.3]}
                  head={-4}
                  brow={0.35}
                  smile={0.15}
                  seed={21}
                />
                <HeritageKid
                  look={santriPutri(0)}
                  f={frame}
                  x={800}
                  y={1405}
                  scale={1.36}
                  flip={true}
                  held="quill"
                  heldHand="R"
                  armR={[46, 30]}
                  armL={[10, 12]}
                  look2={[0.6, -0.3]}
                  head={-4}
                  brow={0.3}
                  smile={0.2}
                  seed={22}
                />

                {/* Foreground Wooden Study Table Surface */}
                <rect x={-160} y={1360} width={1420} height={340} fill="#5c381f" stroke="#1e1108" strokeWidth={3.5} />
                <rect x={-160} y={1360} width={1420} height={26} fill="#7a4c2b" stroke="#1e1108" strokeWidth={2} />

                {/* Ribbon-bound packets on table + glowing Brass Oil Lamp center! */}
                <g transform="translate(275, 1345) rotate(-5)">
                  <rect x={-72} y={-22} width={144} height={24} rx={4} fill="#efe1c1" stroke="#24160c" strokeWidth={2.4} />
                  <rect x={-8} y={-24} width={16} height={28} fill="#8d2416" />
                </g>
                <g transform="translate(805, 1345) rotate(5)">
                  <rect x={-72} y={-22} width={144} height={24} rx={4} fill="#f4ead3" stroke="#24160c" strokeWidth={2.4} />
                  <rect x={-8} y={-24} width={16} height={28} fill="#8d2416" />
                </g>
                <HeritageBrassLamp id="s2_lamp" x={540} y={1364} f={frame} s={1.45} power={0.95 + needGlow * 0.25} />
              </Cam2D>
            </svg>
          </PerspStage>

          <div
            style={{
              position: "absolute",
              top: 215,
              right: 84,
              textAlign: "right",
              maxWidth: 520,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 800, letterSpacing: 2.6, color: "#f2c572", textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
              BUKAN KELANJUTAN LANGSUNG
            </div>
            <div style={{ marginTop: 6, fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 35, fontWeight: 700, color: "#f8eed9", lineHeight: 1.18, textShadow: "0 3px 16px rgba(10,6,3,0.92)" }}>
              Beda Nama, Beda Bentuk — Kebutuhan Makin Nyata
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * S3 — Wajo, Sulawesi Selatan (1950): Pinisi Map Voyage -> Living Harbor Celebration -> Rain Split
 */
export const Scene3Wajo1950: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES[3].dur;
  const fFly = cue(3, "s3_fly", 110);
  const fWajo = cue(3, "s3_wajo", 181);
  const fName = cue(3, "s3_name", 234);
  const fBorn = cue(3, "s3_born", 312);
  const fSplit = cue(3, "s3_split", 387);

  const plateIn = fadeIn(frame, fName - 10, 14);
  const rainTension = pe(frame, fSplit, fSplit + 28);

  const harborF = Math.max(0, frame - (fName - 10));
  const [cx, cy, zoom] = camAt(
    harborF,
    [
      K3(0, 540, 1000, 0.96),
      K3(Math.max(40, fSplit - (fName - 10)), 520, 960, 1.06),
      K3(Math.max(80, dur - (fName - 10)), 540, 985, 0.98),
    ],
    0.55
  );
  const [hx, hy] = handheld(frame, 2.2 + rainTension * 2.5);
  const shipX = lerp(920, 690, pe(frame, fName - 10, fSplit)) + Math.sin(frame * 0.03) * 14;
  const cheerBoost = frame >= fBorn - 8 && rainTension < 0.3 ? 1 : 0;

  return (
    <AbsoluteFill>
      <AtlasMap2D
        fromCenter={[111.5, -7.2]}
        toCenter={GEO.wajo}
        fromZoom={2.5}
        toZoom={2.48}
        midFlightZoomDip={0.52}
        moveStartFrame={10}
        moveEndFrame={Math.max(40, fWajo + 8)}
        activeIslands={["sulawesi"]}
        activeIslandFrame={Math.max(20, fWajo - 24)}
        compassGeo={[116.5, -5.6]}
        tiltDeg={8}
        routes={[
          {
            id: "cross_laut",
            from: GEO.surakarta,
            to: GEO.wajo,
            startFrame: Math.max(16, fFly - 16),
            endFrame: Math.max(42, fWajo + 2),
            color: HERITAGE.oxbloodBright,
            traveler: "pinisi",
            arcBendDeg: 1.85,
          },
        ]}
        pins={[
          {
            id: "java_origin",
            label: "JAWA",
            sublabel: "1919–1926",
            coord: GEO.surakarta,
            triggerFrame: 0,
            color: "#7a5330",
            size: "sm",
            labelSide: "bottom",
          },
          {
            id: "wajo_50",
            label: "WAJO, SULSEL",
            sublabel: "1950 · IPM LOKAL",
            coord: GEO.wajo,
            triggerFrame: fWajo - 6,
            color: HERITAGE.oxblood,
            size: "lg",
            labelSide: "top",
          },
        ]}
      />

      {frame < fName + 4 && (
        <div style={{ position: "absolute", top: 215, left: 84, opacity: 1 - plateIn }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 82, fontWeight: 800, color: HERITAGE.ink, lineHeight: 0.95 }}>
            1950
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 28, color: HERITAGE.oxblood, fontWeight: 700 }}>
            Melintasi Laut Jawa ke Sulawesi
          </div>
        </div>
      )}

      {frame >= fName - 10 && (
        <AbsoluteFill style={{ opacity: plateIn, backgroundColor: rainTension > 0.45 ? "#2e3c42" : "#6e4827" }}>
          <PerspStage tiltXDeg={3} scaleBoost={1.06}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              {/* Transition smooth from golden afternoon harbor to brooding storm slate */}
              <StageBackdrop
                id="s3_sky"
                top={rainTension > 0.45 ? "#28363e" : "#dfe6dc"}
                mid={rainTension > 0.45 ? "#43535b" : "#edd8b0"}
                bottom={rainTension > 0.45 ? "#2e3c42" : "#d8be8f"}
              />

              <Cam2D cx={cx + hx} cy={cy + hy} zoom={zoom}>
                <SunAura id="s3_sun" x={580} y={840} r={460} color="#ffd98a" op={Math.max(0.08, 0.55 - rainTension * 0.45)} />

                {/* Distant Sulawesi Hills & Peaks */}
                <PaintedPeak x={300} y={1080} w={580} h={280} lit={rainTension > 0.45 ? "#46565c" : "#80947f"} shade="#4e6150" />
                <RollingRidge y={1120} color={rainTension > 0.45 ? "#35454a" : "#6c8469"} amp={48} seed={8} />

                {/* Sailing Bugis Pinisi Schooner on the harbor waves! */}
                <BugisPinisi25D x={shipX} y={1155} scale={1.15} f={frame} stormMix={rainTension} />

                {/* Multi-band Animated Ocean Surface */}
                <SeaWaveBands baseY={1160} f={frame} stormMix={rainTension} />

                {/* Coastal Palm on Left Peninsula */}
                <SwayingPalm x={95} y={1160} s={1.18} f={frame} seed={6} windBias={rainTension * 0.9} />

                {/* Wajo Wooden Stilt Meeting Hall (Rumah Panggung) on Pier */}
                <RumahPanggung x={290} y={1175} f={frame} stormMix={rainTension} />

                {/* Foreground Timber Pier Boardwalk where Youth Gather */}
                <polygon
                  points="-180,1415 1100,1415 1260,1980 -340,1980"
                  fill="#6e4827"
                  stroke="#22140a"
                  strokeWidth={3.5}
                />
                <rect x={-180} y={1415} width={1280} height={22} fill="#8a5b34" stroke="#22140a" strokeWidth={2} />
                {[1490, 1590, 1710].map((py, i) => (
                  <line key={i} x1={-220} y1={py} x2={1220} y2={py} stroke="#382210" strokeWidth={2.2} opacity={0.4} />
                ))}

                {/* Living South Sulawesi Youth Characters on Pier: celebrating early IPM -> splitting on storm! */}
                <HeritageKid
                  look={santriPutra(0, "indigo")}
                  f={frame}
                  x={210 - rainTension * 35}
                  y={1445 - (cheerBoost ? Math.abs(Math.sin(frame * 0.25)) * 18 : 0)}
                  scale={1.18}
                  flip={rainTension > 0.45}
                  held={rainTension > 0.45 ? null : "banner"}
                  heldHand="R"
                  armR={[cheerBoost ? 142 : 16, 12]}
                  armL={[cheerBoost ? 130 : 12, 10]}
                  smile={rainTension > 0.45 ? -0.5 : 0.8}
                  brow={rainTension * 0.75}
                  look2={[rainTension > 0.45 ? -0.8 : 0.3, -0.2]}
                  seed={31}
                />
                <HeritageKid
                  look={santriPutri(1)}
                  f={frame}
                  x={380}
                  y={1450 - (cheerBoost ? Math.abs(Math.sin(frame * 0.25 + 1.2)) * 16 : 0)}
                  scale={1.16}
                  armR={[cheerBoost ? 135 : 22, 16]}
                  armL={[cheerBoost ? 120 : 18, 12]}
                  smile={rainTension > 0.45 ? -0.45 : 0.85}
                  brow={rainTension * 0.65}
                  look2={[rainTension > 0.45 ? 0 : 0.1, rainTension > 0.45 ? 0.3 : -0.3]}
                  seed={32}
                />
                <HeritageKid
                  look={santriPutra(3, "olive")}
                  f={frame}
                  x={550 + rainTension * 35}
                  y={1445 - (cheerBoost ? Math.abs(Math.sin(frame * 0.25 + 2.4)) * 18 : 0)}
                  scale={1.18}
                  held="letter"
                  heldHand="L"
                  armR={[cheerBoost ? 140 : 18, 12]}
                  armL={[cheerBoost ? 120 : 18, 18]}
                  smile={rainTension > 0.45 ? -0.55 : 0.75}
                  brow={rainTension * 0.8}
                  look2={[rainTension > 0.45 ? 0.85 : -0.3, -0.2]}
                  seed={33}
                />

                {/* Fracture ink line positioned cleanly ABOVE the separated heads/sky, never crossing a face */}
                {rainTension > 0.12 && (
                  <path
                    d="M380,680 L368,780 L392,880 L372,965 L384,1040"
                    fill="none"
                    stroke="#e5634b"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - rainTension}
                    opacity={rainTension * 0.88}
                  />
                )}

                <EditorialCallout
                  x={385}
                  y={640}
                  sub={rainTension > 0.4 ? "KENDALA INTERNAL" : "WAJO · 1950"}
                  text={rainTension > 0.4 ? "Belum mapan secara nasional" : 'Nama "IPM" muncul lokal'}
                  t={rainTension > 0.4 ? frame - fSplit : frame - fBorn}
                  color={rainTension > 0.4 ? "#f7dfb3" : HERITAGE.oxblood}
                  halo={rainTension > 0.4 ? "rgba(22,30,34,0.88)" : "rgba(244,234,214,0.92)"}
                  size={30}
                />

                <RainField f={frame} opacity={rainTension * 0.65} />
              </Cam2D>
            </svg>
          </PerspStage>

          <div
            style={{
              position: "absolute",
              top: 215,
              left: 84,
              right: 84,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              pointerEvents: "none",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 64,
                  fontWeight: 800,
                  color: rainTension > 0.35 ? "#f5e9d0" : HERITAGE.ink,
                  textShadow: rainTension > 0.35 ? "0 3px 14px rgba(0,0,0,0.8)" : "0 2px 10px rgba(244,234,214,0.9)",
                  lineHeight: 1.0,
                }}
              >
                Wajo, 1950
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: FONT_SERIF,
                  fontStyle: "italic",
                  fontSize: 28,
                  fontWeight: 700,
                  color: rainTension > 0.35 ? "#e6b85c" : HERITAGE.oxblood,
                  textShadow: rainTension > 0.35 ? "0 2px 10px rgba(0,0,0,0.8)" : "none",
                }}
              >
                {frame >= fSplit ? "Dinamika Internal · Belum Mapan Nasional" : 'Nama "IPM" Muncul di Daerah'}
              </div>
            </div>
            <RedWaxSeal text="1950" subtitle="LOKAL" size={124} triggerFrame={fName} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
