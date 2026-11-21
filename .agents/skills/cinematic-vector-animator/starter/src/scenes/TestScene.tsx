import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../components/Camera';
import {Layer} from '../components/Layer';
import {Character} from '../components/Character';
import {ColorGrade, Glow, Grain, LightRays, SafeZones, Vignette} from '../components/FX';
import {Dust} from '../components/Particles';
import {ease, pop, springs, tween} from '../lib/easing';
import {FX, H, LAYERS, P, SAFE, W} from '../lib/palette';

export type TestSceneProps = {showSafeZones: boolean};

const layerCfg = (name: string) => LAYERS.find((l) => l.name === name) ?? {parallax: 1, blur: 0, haze: 0};

/** Svg dengan overflow visible agar bleed bisa digambar di luar viewBox. */
const Canvas: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
    {children}
  </svg>
);

/**
 * Scene uji Fase 1: lima layer parallax, kamera push-in + drift, karakter + lentera,
 * rays, glow, debu dua kedalaman, vignette, grade, grain.
 * Semua aset di sini placeholder — ganti dengan aset asli sambil mempertahankan struktur.
 */
export const TestScene: React.FC<TestSceneProps> = ({showSafeZones}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const sky = layerCfg('sky');
  const far = layerCfg('far');
  const mid = layerCfg('mid');
  const subject = layerCfg('subject');
  const fg = layerCfg('foreground');

  // Beat 1 (frame 8): karakter masuk dengan spring + fade 14 frame.
  const appear = tween(frame, [8, 22], [0, 1], ease.out);
  const rise = (1 - pop(frame, fps, 8, springs.character)) * 40;
  const lantern = {x: W / 2 + 150, y: 1160};

  return (
    <AbsoluteFill style={{backgroundColor: P.shadow.deep}}>
      <Camera from={{zoom: 1.0, y: 0}} to={{zoom: 1.08, y: -26}} drift={6}>
        {/* SKY */}
        <Layer parallax={sky.parallax} haze={sky.haze}>
          <Canvas>
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={P.accent.coolShadow} />
                <stop offset="0.45" stopColor={P.base.mid} />
                <stop offset="0.75" stopColor={P.highlight.warm} />
                <stop offset="1" stopColor={P.base.light} />
              </linearGradient>
              <radialGradient id="sun">
                <stop offset="0" stopColor={P.highlight.cream} />
                <stop offset="0.4" stopColor={P.highlight.warm} stopOpacity="0.85" />
                <stop offset="1" stopColor={P.highlight.warm} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x={-300} y={-500} width={W + 600} height={H + 1000} fill="url(#sky)" />
            <circle cx={W * 0.22} cy={640} r={260} fill="url(#sun)" />
          </Canvas>
        </Layer>

        {/* FAR: siluet bukit, kontras rendah */}
        <Layer parallax={far.parallax} blur={far.blur} haze={far.haze}>
          <Canvas>
            <path
              d={`M-300,1080 C-100,960 140,1010 300,930 C460,850 640,980 820,900 C980,830 1180,950 1400,900 L1400,1700 L-300,1700 Z`}
              fill={P.base.dark}
            />
          </Canvas>
        </Layer>

        {/* MID: pilar reruntuhan */}
        <Layer parallax={mid.parallax} blur={mid.blur} haze={mid.haze}>
          <Canvas>
            <g fill={P.shadow.soft}>
              <path d="M120,1500 L150,880 L230,880 L260,1500 Z" />
              <path d="M130,880 L250,880 L240,846 L140,846 Z" fill={P.base.dark} />
              <path d="M820,1500 L842,1030 L914,1030 L936,1500 Z" />
            </g>
            <rect x={-300} y={1380} width={W + 600} height={700} fill={P.shadow.mid} />
          </Canvas>
        </Layer>

        {/* SUBJECT: karakter + lentera */}
        <Layer parallax={subject.parallax} blur={subject.blur} haze={subject.haze}>
          <Canvas>
            <g transform={`translate(0 ${rise})`}>
              <Character
                x={W / 2}
                y={1430}
                scale={1.1}
                expression="curious"
                prevExpression="neutral"
                expressionSince={60}
                talk={[60, 170]}
                appear={appear}
              />
              {/* lentera: tiang + rumah lentera */}
              <g opacity={appear}>
                <line x1={lantern.x} y1={lantern.y - 40} x2={lantern.x - 40} y2={1360} stroke={P.shadow.deep} strokeWidth="9" strokeLinecap="round" />
                <rect x={lantern.x - 22} y={lantern.y - 34} width="44" height="64" rx="8" fill={P.shadow.mid} />
                <rect x={lantern.x - 14} y={lantern.y - 24} width="28" height="44" rx="5" fill={P.highlight.warm} />
              </g>
            </g>
          </Canvas>
        </Layer>

        {/* FOREGROUND: siluet gelap, buram, membingkai */}
        <Layer parallax={fg.parallax} blur={fg.blur}>
          <Canvas>
            <g fill={P.shadow.deep}>
              {Array.from({length: 14}, (_, i) => {
                const x = -260 + i * 120 + random(`fg-x-${i}`) * 70;
                const h = 280 + random(`fg-h-${i}`) * 420;
                const sway = Math.sin(frame / fps * 1.1 + i) * 14;
                return (
                  <path
                    key={i}
                    d={`M${x},${H + 300} C${x + 20},${H - h * 0.5} ${x + sway},${H - h * 0.8} ${x + sway * 1.6},${H - h} C${x + 50 + sway},${H - h * 0.7} ${x + 60},${H - h * 0.3} ${x + 70},${H + 300} Z`}
                  />
                );
              })}
            </g>
          </Canvas>
        </Layer>
      </Camera>

      {/* FX di luar kamera */}
      <Glow x={lantern.x} y={lantern.y} radius={90} flicker={0.9} seed="lantern" intensity={0.9} />
      <LightRays originX={W * 0.22} originY={-80} count={FX.rays.count} opacity={FX.rays.opacity} />
      <Dust depth="far" count={FX.dust.count} seed="far" />
      <Dust depth="near" count={Math.round(FX.dust.count / 4)} seed="near" wind={[0.4, -0.5]} />
      <Vignette strength={FX.vignette.strength} />
      <ColorGrade opacity={FX.grade.opacity} />
      <Grain opacity={FX.grain.opacity} scale={FX.grain.scale} />
      {showSafeZones && <SafeZones {...SAFE} />}
    </AbsoluteFill>
  );
};
