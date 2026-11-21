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
} from "../../shared/Flat3DCamera";
import { HeritageKid, santriPutra, santriPutri } from "../../shared/HeritageKid";
import {
  BanyanTree,
  HeritageHall,
  PaintedPeak,
  PouringBrassHourglass,
  RollingRidge,
  StageBackdrop,
  SunAura,
  YogyakartaGapura25D,
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
 * S4 — Misteri Tengah (64.96s -> 78.17s)
 * Camera pans over 3 isolated regional nodes + rises into Giant Pouring Hourglass + Curious Kid
 */
export const Scene4MysteryHourglass: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[4].dur;

  const fAll = cue(4, "s4_all", 49);
  const fSulsel = cue(4, "s4_sulsel", 151);
  const fWhy = cue(4, "s4_why", 187);
  const fWho = cue(4, "s4_who", 328);

  const glassPop = spring({ frame: Math.max(0, frame - fWhy), fps, config: { damping: 14, stiffness: 155 } });
  const glassOp = fadeIn(frame, fWhy, 12);
  const tagDim = Math.max(0, 1 - glassOp * 1.15);

  const sandProg = prog(frame, fWhy, Math.max(fWhy + 30, dur - 12));

  // Hermite spline panning horizontally from node 1 -> node 2 -> node 3 -> center hourglass push-in
  const [cx, cy, zoom] = camAt(
    frame,
    [
      K3(0, 460, 960, 1.04),
      K3(fAll + 20, 620, 960, 1.07),
      K3(fSulsel, 540, 1020, 1.05),
      K3(fWhy + 20, 540, 930, 0.98),
      K3(Math.max(fWho, dur - 10), 540, 900, 1.12),
    ],
    0.55
  );
  const [hx, hy] = handheld(frame, 2.0);
  const tiltX = lerp(4, 9, pe(frame, fWhy, fWhy + 35));

  const tag1Op = fadeIn(frame, fAll, 8) * tagDim;
  const tag2Op = fadeIn(frame, fAll + 34, 8) * tagDim;
  const tag3Op = fadeIn(frame, fSulsel, 8) * tagDim;

  const folioBadge = (year: string, place: string, org: string): React.ReactNode => (
    <div
      style={{
        padding: "10px 20px",
        backgroundColor: "rgba(24, 15, 9, 0.92)",
        border: "1.5px solid rgba(219, 180, 106, 0.62)",
        clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.65)",
      }}
    >
      <div style={{ fontFamily: FONT_SERIF, fontSize: 27, fontWeight: 800, color: "#f6ebd4" }}>
        <span style={{ color: "#e6b85c" }}>{year}</span> · {place}
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 18, color: "#d7be92", marginTop: 2 }}>
        {org}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#140e09" }}>
      <PerspStage tiltXDeg={tiltX} scaleBoost={1.09} origin="50% 56%">
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <StageBackdrop id="s4_bg" top="#16100a" mid="#261b11" bottom="#120c07" />

          <Cam2D cx={cx + hx} cy={cy + hy} zoom={zoom}>
            {/* Warm Golden Archival Spotlight Cone Behind Center Hourglass */}
            <polygon
              points="310,0 770,0 980,1480 100,1480"
              fill="#e6b85c"
              opacity={0.07 + 0.08 * glassOp}
            />
            <SunAura id="s4_halo" x={540} y={840} r={460} color="#e6b85c" op={0.28 + 0.14 * glassOp} />

            {/* Stylized Nusantara Ribbon Map Strip Across Walnut Table */}
            <polygon
              points="-500,1370 1580,1370 1760,2100 -680,2100"
              fill="#2f1f13"
              stroke="#5c3e24"
              strokeWidth={3}
            />
            <path
              d="M90,1180 Q320,1220 560,1215 Q740,1205 940,1105 L960,1155 Q720,1265 550,1265 Q300,1275 80,1225 Z"
              fill="#8a6039"
              stroke="#e6b85c"
              strokeWidth={2.2}
              opacity={0.72}
            />

            {/* Severed Dotted Strings Connecting the Three Isolated Nodes */}
            <path
              d="M235,1160 Q400,1040 530,1165"
              fill="none"
              stroke="#e6b85c"
              strokeWidth={3.5}
              strokeDasharray="9 11"
              opacity={0.55}
            />
            <path
              d="M550,1165 Q700,1040 855,1115"
              fill="none"
              stroke="#e6b85c"
              strokeWidth={3.5}
              strokeDasharray="9 11"
              opacity={0.55}
            />

            {/* Three Isolated Youth Collectives Standing Apart on Scattered Nodes (dim smoothly when Hourglass enters) */}
            <g opacity={fadeIn(frame, fAll, 12) * (1 - glassOp * 0.68)}>
              <circle cx={235} cy={1150} r={74} fill="rgba(223,181,103,0.14)" stroke="#dfb567" strokeWidth={2.2} strokeDasharray="5 5" opacity={0.75} />
              <HeritageKid look={santriPutra(0)} f={frame} x={235} y={1210} scale={0.62} sil="#7a5738" held="book" seed={41} />
            </g>
            <g opacity={fadeIn(frame, fAll + 28, 12) * (1 - glassOp * 0.68)}>
              <circle cx={545} cy={1155} r={74} fill="rgba(223,181,103,0.14)" stroke="#dfb567" strokeWidth={2.2} strokeDasharray="5 5" opacity={0.75} />
              <HeritageKid look={santriPutri(0)} f={frame} x={545} y={1215} scale={0.62} sil="#835d3c" seed={42} />
            </g>
            <g opacity={fadeIn(frame, fSulsel, 12) * (1 - glassOp * 0.68)}>
              <circle cx={865} cy={1100} r={74} fill="rgba(223,181,103,0.14)" stroke="#dfb567" strokeWidth={2.2} strokeDasharray="5 5" opacity={0.75} />
              <HeritageKid look={santriPutra(2)} f={frame} x={865} y={1160} scale={0.62} sil="#7a5738" seed={43} />
            </g>

            {/* Foreground Wonder Question Mark Silhouettes + Giant Pouring Hourglass! */}
            {frame >= fWhy - 4 && (
              <g opacity={glassOp}>
                {/* Floating muted '?' emblems drifting cleanly to sides of hourglass */}
                {[-215, 220].map((dx, qi) => (
                  <text
                    key={qi}
                    x={540 + dx}
                    y={765 + Math.sin(frame * 0.08 + qi * 2) * 14}
                    textAnchor="middle"
                    fontFamily={FONT_SERIF}
                    fontWeight={800}
                    fontSize={92}
                    fill="#e6b85c"
                    opacity={0.34 + 0.14 * glassPop}
                  >
                    ?
                  </text>
                ))}

                {/* Motionformat-style Giant Pouring Brass Hourglass Seated Right on Center Table */}
                <PouringBrassHourglass
                  x={540}
                  y={800}
                  scale={1.72 * (0.85 + 0.15 * glassPop)}
                  progress={sandProg}
                />

                {/* Foreground Kid Character holding lantern looking straight up at Hourglass in inquiry */}
                <HeritageKid
                  look={santriPutra(0, "brown")}
                  f={frame}
                  x={220}
                  y={1440}
                  scale={1.15}
                  held="lamp"
                  heldHand="R"
                  armR={[84, 38]}
                  armL={[16, 12]}
                  look2={[0.55, -0.85]}
                  brow={0.65}
                  smile={-0.15}
                  head={-8}
                  seed={44}
                />
              </g>
            )}
          </Cam2D>
        </svg>
      </PerspStage>

      <SunDustMotes color="#e4bc72" count={14} opacity={0.24} />

      {/* Initial 3 Archival Node Stamps (fAll -> fWhy cleanly hand off to Hourglass!) */}
      <div style={{ position: "absolute", top: 315, left: 84, opacity: tag1Op, transform: "rotate(-2.5deg)", pointerEvents: "none" }}>
        {folioBadge("1919", "Yogyakarta", "Siswo Projo")}
      </div>
      <div style={{ position: "absolute", top: 470, right: 78, opacity: tag2Op, transform: "rotate(2.2deg)", pointerEvents: "none" }}>
        {folioBadge("1926", "Malang & Solo", "GKPM")}
      </div>
      <div style={{ position: "absolute", top: 635, left: 105, opacity: tag3Op, transform: "rotate(-1.8deg)", pointerEvents: "none" }}>
        {folioBadge("1950", "Wajo, Sulsel", "IPM Lokal Terpisah")}
      </div>

      {/* Hero Editorial Headline over Pouring Brass Hourglass — positioned cleanly ABOVE & BELOW glass! */}
      {frame >= fWhy && (
        <AbsoluteFill style={{ opacity: glassOp, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: 235,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontSize: 48,
              fontWeight: 700,
              color: "#f7ecd6",
              textShadow: "0 4px 18px rgba(0,0,0,0.95)",
              transform: `scale(${(0.92 + 0.08 * glassPop).toFixed(3)})`,
            }}
          >
            Puluhan tahun berjalan...
          </div>
          <div
            style={{
              position: "absolute",
              top: 1095,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: FONT_SERIF,
              fontSize: 34,
              fontWeight: 800,
              color: "#e6b85c",
              letterSpacing: 0.6,
              textShadow: "0 3px 16px rgba(0,0,0,0.98)",
            }}
          >
            Belum Satu Wadah Nasional?
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * S5 — 1958 Garut: Highland Map Approach -> Mist-Clearing Conference Forum + Speaking Kid
 */
export const Scene5Garut1958: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES[5].dur;
  const fGarut = cue(5, "s5_garut", 135);
  const fConf = cue(5, "s5_conf", 176);
  const fIdea = cue(5, "s5_idea", 247);

  const plateOp = fadeIn(frame, fConf, 14);
  const confF = Math.max(0, frame - fConf);
  const [cx, cy, zoom] = camAt(
    confF,
    [
      K3(0, 540, 1020, 0.96),
      K3(Math.max(40, fIdea - fConf), 540, 960, 1.05),
      K3(Math.max(80, dur - fConf), 540, 930, 1.11),
    ],
    0.55
  );
  const [hx, hy] = handheld(frame, 2.0);
  const ideaRise = pe(frame, fIdea, fIdea + 28);
  const doorOpen = pe(frame, fConf, fConf + 28);

  return (
    <AbsoluteFill>
      <AtlasMap2D
        fromCenter={[114.2, -5.2]}
        toCenter={GEO.garut}
        fromZoom={1.75}
        toZoom={4.2}
        moveStartFrame={0}
        moveEndFrame={Math.max(24, fGarut + 12)}
        activeIslands={["jawa"]}
        activeIslandFrame={8}
        tiltDeg={7.5}
        routes={[
          {
            id: "to_garut",
            from: GEO.yogyakarta,
            to: GEO.garut,
            startFrame: 6,
            endFrame: Math.max(28, fGarut + 4),
            color: HERITAGE.oxblood,
            traveler: "walker",
            arcBendDeg: 0.32,
          },
        ]}
        pins={[
          {
            id: "garut58",
            label: "GARUT, JABAR",
            sublabel: "1958 · KONFERENSI",
            coord: GEO.garut,
            triggerFrame: Math.max(8, fGarut - 48),
            color: HERITAGE.oxblood,
            size: "lg",
            labelSide: "top",
          },
        ]}
      />

      {frame < fConf + 8 && (
        <div style={{ position: "absolute", top: 215, left: 84, opacity: 1 - plateOp }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 82, fontWeight: 800, color: HERITAGE.ink, lineHeight: 0.95 }}>
            1958
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 28, fontWeight: 700, color: HERITAGE.oxblood }}>
            Titik Terang di Pegunungan Priangan
          </div>
        </div>
      )}

      {frame >= fConf && (
        <AbsoluteFill style={{ opacity: plateOp, backgroundColor: "#8a6c49" }}>
          <PerspStage tiltXDeg={3} scaleBoost={1.06}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              <StageBackdrop id="s5_sky" top="#dce5dc" mid="#ecdab9" bottom="#ccb88d" />

              <Cam2D cx={cx + hx} cy={cy + hy} zoom={zoom}>
                <SunAura id="s5_sun" x={540} y={560} r={540} color="#ffe4a1" op={0.55} />

                {/* Layered Priangan Mountains (Guntur / Cikuray ridges) */}
                <PaintedPeak x={240} y={960} w={680} h={340} lit="#839684" shade="#5b6f5e" />
                <PaintedPeak x={820} y={980} w={640} h={310} lit="#738775" shade="#4e6150" />
                <RollingRidge y={1020} color="#637a60" amp={56} seed={12} />

                {/* Slow drifting highland mist parting cleanly to reveal the conference hall */}
                <ellipse
                  cx={320 - ideaRise * 160}
                  cy={840}
                  rx={380}
                  ry={55}
                  fill="#f3ecd8"
                  opacity={0.55 - ideaRise * 0.25}
                />
                <ellipse
                  cx={780 + ideaRise * 160}
                  cy={885}
                  rx={360}
                  ry={48}
                  fill="#f3ecd8"
                  opacity={0.5 - ideaRise * 0.25}
                />

                {/* Courtyard Terrace Floor */}
                <rect x={-300} y={1140} width={1700} height={900} fill="#b59c74" stroke="#5b4326" strokeWidth={2.5} />

                {/* Warm Timber Garut Conference Balai */}
                <HeritageHall
                  id="s5_hall"
                  x={540}
                  y={1210}
                  w={840}
                  h={320}
                  door={0.3 + doorOpen * 0.7}
                  glow={0.95}
                  wall="#f2e4c7"
                  roof="#8e3f24"
                />

                {/* Raised Conference Floor & Speaker Lectern Left (cleanly separated from attendees) */}
                <rect x={-400} y={1390} width={1880} height={700} fill="#8a6c49" stroke="#24160c" strokeWidth={3} />
                <g transform="translate(185, 1410)">
                  <HeritageKid
                    look={santriPutra(0, "brown")}
                    f={frame}
                    x={-18}
                    y={-28}
                    scale={1.12}
                    backView={false}
                    armR={[68 + Math.sin(frame * 0.16) * 18, 28]}
                    armL={[22, 16]}
                    open={0.35 + Math.abs(Math.sin(frame * 0.25)) * 0.35}
                    look2={[0.8, 0]}
                    seed={50}
                  />
                  {/* Wooden Speaker Podium in front of speaker */}
                  <polygon points="-58,-185 52,-195 44,0 -50,0" fill="#683d1e" stroke="#22140a" strokeWidth={2.6} />
                  <rect x={-68} y={-198} width={128} height={16} rx={3} fill="#8a562e" stroke="#22140a" strokeWidth={2.4} />
                </g>

                {/* Row of Attentive Delegates (rear 3/4 view + gentle attentive head nods) */}
                {[0, 1, 2, 3].map((i) => {
                  const look = i % 2 === 1 ? santriPutri(i) : santriPutra(i + 1, i === 2 ? "indigo" : "olive");
                  return (
                    <HeritageKid
                      key={i}
                      look={look}
                      f={frame}
                      x={485 + i * 140}
                      y={1442 + (i % 2) * 14}
                      scale={1.05}
                      backView={true}
                      flip={true}
                      head={Math.sin(frame * 0.08 + i * 1.4) * 3}
                      held={i === 1 ? "book" : null}
                      heldHand="R"
                      seed={55 + i}
                    />
                  );
                })}

                {/* Glowing Expanding Concept Rings behind Hall */}
                {frame >= fIdea - 8 &&
                  [0, 1].map((i) => {
                    const rk = prog(frame, fIdea - 8 + i * 14, fIdea + 58 + i * 14);
                    return (
                      <circle
                        key={i}
                        cx={540}
                        cy={780}
                        r={45 + rk * 260}
                        fill="none"
                        stroke="#e6b85c"
                        strokeWidth={5}
                        opacity={(1 - rk) * 0.72}
                      />
                    );
                  })}
              </Cam2D>
            </svg>
          </PerspStage>
          <SunDustMotes color="#ffda8e" count={16} opacity={0.28} />

          <div
            style={{
              position: "absolute",
              top: 205,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 44,
                fontWeight: 800,
                color: HERITAGE.ink,
                textAlign: "center",
                textShadow: "0 2px 12px rgba(241,230,207,0.95)",
              }}
            >
              Konferensi Pemuda Muhammadiyah
            </div>

            {frame >= fIdea - 6 && (
              <ParchmentCartouche
                width={790}
                height={155}
                kicker="KEPUTUSAN GARUT · 1958"
                title="Dirumuskan Serius & Sistematis"
                titleSize={36}
                triggerFrame={fIdea - 6}
                waxYear="1958"
              />
            )}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * S6 — Penutup 1960: Map Flight Garut->Jogja -> TRUE 3D-Projected Dawn Avenue Fly-Through!
 */
export const Scene6Bridge1960: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES[6].dur;
  const fTwo = cue(6, "s6_twoyr", 65);
  const fJogja = cue(6, "s6_jogja", 156);
  const fNext = cue(6, "s6_next", 182);

  const dawnIn = fadeIn(frame, fJogja + 8, 16);
  const dawnT = clamp((frame - (fJogja + 8)) / Math.max(40, dur - fJogja - 8), 0, 1);

  // Camera flies physically forward down the sunlit 3D Yogyakarta avenue!
  const cam3D = {
    x: 0,
    y: lerp(1.9, 1.75, dawnT),
    z: lerp(0, 7.6, dawnT),
    fov: 980,
    horizonY: lerp(960, 910, dawnT),
    pitchRad: -0.04,
  };

  // Road flagstone ribbons receding into horizon sunrise
  const roadSegments = Array.from({ length: 18 }, (_, i) => ({
    z0: 1 + i * 1.4,
    z1: 2.3 + i * 1.4,
    shade: i % 2 === 0 ? "#c8b38c" : "#b8a178",
  }));

  // 3D depth-sorted roadside items (Trees, Streetlamps, Gapura Archway, Walking Kids Trio!)
  type Item3D = { z: number; render: () => React.ReactNode };
  const items3D: Item3D[] = [];

  for (let i = 0; i < 6; i++) {
    const tz = 4.5 + i * 3.8;
    [-3.75, 3.75].forEach((sideX, si) => {
      const p = project3D(sideX, 0, tz, cam3D);
      if (!p) return;
      const sc = p.sc / 170;
      items3D.push({
        z: tz,
        render: () => (
          <BanyanTree
            key={`tr_${i}_${si}`}
            x={p.sx}
            y={p.sy}
            s={sc * 1.15}
            f={frame}
            seed={i * 3 + si}
            leaf={i > 3 ? "#627c53" : "#446236"}
            hi="#8ba56b"
          />
        ),
      });
    });

    // Colonial tiled cottages along outer corridor edge for rich architectural depth
    [-5.6, 5.6].forEach((sideX, si) => {
      const bz = tz + 1.5;
      const bp = project3D(sideX, 0, bz, cam3D);
      if (!bp) return;
      const s = bp.sc / 170;
      items3D.push({
        z: bz,
        render: () => (
          <g key={`cot_${i}_${si}`} transform={`translate(${bp.sx.toFixed(1)},${bp.sy.toFixed(1)}) scale(${s.toFixed(4)})`}>
            <rect x={-90} y={-140} width={180} height={140} fill="#eadcc0" stroke="#26180d" strokeWidth={2.5} />
            <polygon points="-110,-140 0,-215 110,-140" fill="#9c4728" stroke="#26180d" strokeWidth={2.5} />
            <rect x={-30} y={-95} width={60} height={48} fill="#ffcf74" stroke="#26180d" strokeWidth={2} opacity={0.8} />
          </g>
        ),
      });
    });

    const lpL = project3D(-2.65, 0, tz - 1.2, cam3D);
    const lpR = project3D(2.65, 0, tz - 1.2, cam3D);
    [lpL, lpR].forEach((lp, si) => {
      if (!lp) return;
      const s = lp.sc / 170;
      items3D.push({
        z: tz - 1.2,
        render: () => (
          <g key={`lmp_${i}_${si}`} transform={`translate(${lp.sx.toFixed(1)},${lp.sy.toFixed(1)}) scale(${s.toFixed(4)})`}>
            <rect x={-5} y={-275} width={10} height={275} fill="#362415" />
            <circle cx={0} cy={-290} r={44} fill="#ffdf8a" opacity={0.22} />
            <circle cx={0} cy={-290} r={12} fill="#fff3c4" stroke="#26180d" strokeWidth={2.2} />
          </g>
        ),
      });
    });
  }

  // Grand Yogyakarta Classical Gapura Archway waiting ahead down the street
  const gapuraZ = 19.2;
  const gp = project3D(0, 0, gapuraZ, cam3D);
  if (gp) {
    items3D.push({
      z: gapuraZ,
      render: () => <YogyakartaGapura25D key="gapura" x={gp.sx} y={gp.sy} sc={gp.sc / 145} />,
    });
  }

  // Animated HeritageKid Trio striding briskly down the avenue toward the sunlit Gapura!
  const kidsBaseZ = lerp(6.8, 15.6, dawnT);
  [
    { x: -0.95, zOff: 0, look: santriPutra(0, "brown"), held: "letter" as const, ph: 0 },
    { x: 0.0, zOff: -0.5, look: santriPutri(0), held: "lamp" as const, ph: 1.5 },
    { x: 0.95, zOff: 0.2, look: santriPutra(2, "indigo"), held: "book" as const, ph: 3.0 },
  ].forEach((k, idx) => {
    const kz = kidsBaseZ + k.zOff;
    const kp = project3D(k.x, 0, kz, cam3D);
    if (kp) {
      items3D.push({
        z: kz,
        render: () => (
          <HeritageKid
            key={`kw_${idx}`}
            look={k.look}
            f={frame}
            x={kp.sx}
            y={kp.sy}
            scale={kp.sc / 165}
            backView={true}
            walk={frame * 0.24 + k.ph}
            walkAmp={1}
            held={k.held}
            heldHand="R"
            armR={k.held === "lamp" ? [98, 28] : [20, 12]}
            seed={61 + idx}
          />
        ),
      });
    }
  });

  items3D.sort((a, b) => b.z - a.z);

  return (
    <AbsoluteFill>
      <AtlasMap2D
        fromCenter={GEO.garut}
        toCenter={GEO.yogyakarta}
        fromZoom={3.45}
        toZoom={3.9}
        moveStartFrame={Math.max(6, fTwo - 8)}
        moveEndFrame={Math.max(36, fJogja + 10)}
        activeIslands={["jawa"]}
        activeIslandFrame={0}
        tiltDeg={7.5}
        routes={[
          {
            id: "garut_jogja_60",
            from: GEO.garut,
            to: GEO.yogyakarta,
            startFrame: Math.max(10, fTwo),
            endFrame: Math.max(40, fJogja + 8),
            color: HERITAGE.oxbloodBright,
            traveler: "walker",
            arcBendDeg: 0.25,
          },
        ]}
        pins={[
          {
            id: "grt58",
            label: "GARUT",
            sublabel: "1958",
            coord: GEO.garut,
            triggerFrame: 0,
            color: "#7a5330",
            size: "md",
            labelSide: "bottom",
          },
          {
            id: "jgj60",
            label: "YOGYAKARTA",
            sublabel: "1960 · BABAK BARU",
            coord: GEO.yogyakarta,
            triggerFrame: Math.max(18, fJogja - 8),
            color: HERITAGE.oxblood,
            size: "lg",
            labelSide: "top",
          },
        ]}
      />

      {frame < fJogja + 12 && (
        <div style={{ position: "absolute", top: 215, left: 84, opacity: 1 - dawnIn }}>
          <div style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 30, fontWeight: 700, color: HERITAGE.oxblood }}>
            Garut Bukan Garis Akhir
          </div>
        </div>
      )}

      {frame >= fJogja + 8 && (
        <AbsoluteFill style={{ opacity: dawnIn, backgroundColor: "#7d8c5a" }}>
          <PerspStage tiltXDeg={2.5} scaleBoost={1.06}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              <StageBackdrop id="s6_dawn" top="#69636d" mid="#dcb37a" bottom="#f5daa1" />

              {/* Golden Sunrise Radiance on Horizon */}
              <SunAura id="s6_sunrise" x={540} y={910} r={540} color="#fff0b8" op={0.78} />

              {/* Horizon ground grassy lawns flanking the avenue */}
              <rect x={-200} y={cam3D.horizonY} width={1500} height={1200} fill="#7d8c5a" />

              {/* True 3D Projected Cobblestone Boulevard */}
              {roadSegments.map((seg, idx) => {
                const l0 = project3D(-1.9, 0, seg.z0, cam3D);
                const r0 = project3D(1.9, 0, seg.z0, cam3D);
                const r1 = project3D(1.9, 0, seg.z1, cam3D);
                const l1 = project3D(-1.9, 0, seg.z1, cam3D);
                if (!l0 || !r0 || !r1 || !l1) return null;
                return (
                  <polygon
                    key={idx}
                    points={`${l0.sx.toFixed(1)},${l0.sy.toFixed(1)} ${r0.sx.toFixed(1)},${r0.sy.toFixed(1)} ${r1.sx.toFixed(1)},${r1.sy.toFixed(1)} ${l1.sx.toFixed(1)},${l1.sy.toFixed(1)}`}
                    fill={seg.shade}
                    stroke="#6c563a"
                    strokeWidth={1.6}
                  />
                );
              })}

              {/* Painter-sorted 3D Avenue Elements */}
              {items3D.map((item) => item.render())}
            </svg>
          </PerspStage>

          <SunDustMotes color="#ffdf94" count={22} opacity={0.44} />

          <div
            style={{
              position: "absolute",
              top: 230,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <ParchmentCartouche
              width={810}
              height={230}
              kicker="GARUT 1958  →  YOGYAKARTA 1960"
              title="Episode 02"
              titleSize={62}
              subtitle="Pertemuan Menuju Kelahiran Resmi"
              triggerFrame={Math.max(fJogja + 12, fNext - 10)}
              waxYear="1960"
            />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
