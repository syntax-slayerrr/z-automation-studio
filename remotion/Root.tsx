import React from 'react';
import { Composition } from 'remotion';
import { ZAutomationLaunch } from './compositions/ZAutomationLaunch';
import { ZAutomationSquarePromo } from './compositions/ZAutomationSquarePromo';
import { KurzgesagtBlackHole } from './kurzgesagt/KurzgesagtBlackHole';
import { BridgeShort, BRIDGE_FRAMES } from './videos/bridge/Bridge';
import { CnutShort, CNUT_FRAMES } from './videos/cnut/Cnut';
import { KakarutShort, KAKARUT_FRAMES } from './videos/kakarut/Kakarut';
import { CinematicHistory5s, CINEMATIC_5S_FRAMES } from './videos/cinematic-5s/CinematicHistory5s';
import { ShotcraftGarutMaster, SHOTCRAFT_MASTER_FRAMES } from './videos/shotcraft-master/ShotcraftGarutMaster';
import { HistoricalDioramaReel } from './videos/historical-diorama';
import { SEJARAH_IPM_TOPIC } from './videos/historical-diorama/topics/sejarah_ipm';
import { Earth24HoursShort, EARTH_24H_FRAMES } from './videos/earth-24h/Earth24Hours';
import { BlackHoleShort, BLACK_HOLE_FRAMES } from './videos/black-hole/BlackHoleShort';
import { HumanFireShort, HUMAN_FIRE_FRAMES } from './videos/human-fire/HumanFireShort';
import { GmniHistoryShort, GMNI_FRAMES } from './videos/gmni-history/GmniHistoryShort';
import { GunungGunturShort, GUNTUR_FRAMES } from './videos/gunung-guntur/GunungGunturShort';
import { GambutHistoryShort } from './videos/gambut-history/GambutHistoryShort';
import { GAMBUT_FRAMES } from './videos/gambut-history/story';
import { TiangListrikShort } from './videos/tiang-listrik/TiangListrikShort';
import { COMPOSITION_CONFIG as TIANG_CONFIG } from './videos/tiang-listrik/story';
import { RelKeretaShort } from './videos/rel-kereta/RelKeretaShort';
import { REL_COMPOSITION_CONFIG as REL_CONFIG } from './videos/rel-kereta/story';
import { SawahTeraseringShort } from './videos/sawah-terasering/SawahTeraseringShort';
import { COMPOSITION_CONFIG as SAWAH_CONFIG } from './videos/sawah-terasering/story';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Next-Gen 1080x1920 Full HD 3D Cutaway & 2-Bone Analytical IK Explainer: Kenapa Sawah di Gunung Dibuat Bertingkat (Terasering)? */}
      <Composition
        id={SAWAH_CONFIG.id}
        component={SawahTeraseringShort}
        durationInFrames={SAWAH_CONFIG.durationInFrames}
        fps={SAWAH_CONFIG.fps}
        width={SAWAH_CONFIG.width}
        height={SAWAH_CONFIG.height}
      />
      {/* Three.js Pro 3D Cutaway Explainer: Kenapa Rel Kereta Pakai Batu Kerikil & Celah? — 720x1280 (9:16), 30fps, Seamless Loop */}
      <Composition
        id="RelKeretaShort"
        component={RelKeretaShort}
        durationInFrames={REL_CONFIG.durationInFrames}
        fps={REL_CONFIG.fps}
        width={REL_CONFIG.width}
        height={REL_CONFIG.height}
      />

      {/* 3D Animated Educational Short: Kenapa Tiang Listrik di Desa Pakai Bambu/Kayu/Beton — 720x1280 (9:16), 30fps */}
      <Composition
        id="TiangListrikShort"
        component={TiangListrikShort}
        durationInFrames={TIANG_CONFIG.durationInFrames}
        fps={TIANG_CONFIG.fps}
        width={TIANG_CONFIG.width}
        height={TIANG_CONFIG.height}
      />

      {/* Scientific Documentary 2D Short: Gambut Warisan Ribuan Tahun — 720x1280 (9:16), 30fps */}
      <Composition
        id="GambutHistoryShort"
        component={GambutHistoryShort}
        durationInFrames={GAMBUT_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />

      {/* Vintage Poster Explainer 2D Short: Gunung Guntur Raksasa Api Garut — 720x1280 (9:16), 30fps */}
      <Composition
        id="GunungGunturShort"
        component={GunungGunturShort}
        durationInFrames={GUNTUR_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />

      {/* Historical Documentary 2D Short: Sejarah Berdirinya GMNI — 720x1280 (9:16), 30fps */}
      <Composition
        id="GmniHistoryShort"
        component={GmniHistoryShort}
        durationInFrames={GMNI_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />

      {/* Documentary 2D Short: Ketika Manusia Mengenal Api — 720x1280 (9:16), 30fps */}
      <Composition
        id="HumanFireShort"
        component={HumanFireShort}
        durationInFrames={HUMAN_FIRE_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />

      {/* Science Short: Apa yang Terjadi Jika Kamu Jatuh ke Lubang Hitam? — 720x1280 (9:16), 30fps */}
      <Composition
        id="BlackHoleShort"
        component={BlackHoleShort}
        durationInFrames={BLACK_HOLE_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />

      {/* 24-Hour Celestial Clock & Paper Diorama Reconstruction — 720x1280 (9:16), 30fps */}
      <Composition
        id="Earth24HoursShort"
        component={Earth24HoursShort}
        durationInFrames={EARTH_24H_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />

      {/* High-End Motion Design Master Video — 1080x1920 (9:16), 30fps */}
      <Composition
        id="ShotcraftGarutMaster"
        component={ShotcraftGarutMaster}
        durationInFrames={SHOTCRAFT_MASTER_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 5-Second Master-Class Cinematic History Shot — 1080x1920 (9:16), 30fps */}
      <Composition
        id="CinematicHistory5s"
        component={CinematicHistory5s}
        durationInFrames={CINEMATIC_5S_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Cartoon 3D Short: Asal-Usul Garut (Kakarut) — 1080x1920 (9:16), 30fps */}
      <Composition
        id="KakarutShort"
        component={KakarutShort}
        durationInFrames={KAKARUT_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Historical 3D Diorama & Archival Motion Graphic (Edu-Docu Series) — 1080x1920 (9:16), 30fps */}
      <Composition
        id="HistoricalDioramaReel"
        component={HistoricalDioramaReel}
        durationInFrames={Math.round(SEJARAH_IPM_TOPIC.meta.totalDurationSeconds * 30)}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Cartoon 3D Short (Three.js + Remotion) — 1080x1920 (9:16), 30fps */}
      <Composition
        id="CnutShort"
        component={CnutShort}
        durationInFrames={CNUT_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Kurzgesagt / Vox Explainer Reel — 1080x1920 (9:16), 32.63s @ 60fps */}
      <Composition
        id="KurzgesagtBlackHole"
        component={KurzgesagtBlackHole}
        durationInFrames={1958}
        fps={60}
        width={1080}
        height={1920}
      />

      {/* Flagship 1:1 Reference Design Composition — 1920x1080 (16:9), 14.83s @ 60fps */}
      <Composition
        id="ZAutomationLaunch"
        component={ZAutomationLaunch}
        durationInFrames={890}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'z-automation',
          tagline: 'Bangun Sistem Otomasi sekarang lewat Web 3D dan Agen AI',
          domain: 'z-automation.my.id',
          audioSrc: 'assets/audio/z-launch-1to1.wav',
        }}
      />

      {/* Clean 1080x1080 Square Adaptation (Zero HUD / Zero AI Slop) */}
      <Composition
        id="ZAutomationSquarePromo"
        component={ZAutomationSquarePromo}
        durationInFrames={890}
        fps={60}
        width={1080}
        height={1080}
        defaultProps={{
          domain: 'z-automation.my.id',
          audioSrc: 'assets/audio/z-launch-1to1.wav',
        }}
      />
    </>
  );
};
