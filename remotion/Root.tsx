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
import { ClaudeAnimasiPromo } from './videos/claude-animasi-promo/ClaudeAnimasiPromo';
import { COMPOSITION_CONFIG as CLAUDE_PROMO_CONFIG } from './videos/claude-animasi-promo/story';
import { KeseharianAgenZaldy } from './videos/keseharian-agen-zaldy/KeseharianAgenZaldy';
import { COMPOSITION_CONFIG as KESEHARIAN_CONFIG } from './videos/keseharian-agen-zaldy/story';
import { ZaldyRoomShowcase } from './videos/zaldy-room-showcase/ZaldyRoomShowcase';
import { COMPOSITION_CONFIG as ZALDY_ROOM_CONFIG } from './videos/zaldy-room-showcase/story';
import { MembangunRumahShort } from './videos/membangun-rumah/MembangunRumahShort';
import { COMPOSITION_CONFIG as RUMAH_CONFIG } from './videos/membangun-rumah/story';
import { HumanRitualShort, HUMAN_RITUAL_FRAMES } from './videos/human-ritual/HumanRitualShort';
import { AnthropologyShowcase, ANTHROPOLOGY_SHOWCASE_FRAMES } from './videos/anthropology-showcase/AnthropologyShowcase';
import { NusantaraSamudraShort, NUSANTARA_FRAMES } from './videos/nusantara-samudra/NusantaraSamudraShort';
import { HargaPeradabanShort, PERADABAN_FRAMES } from './videos/harga-peradaban/HargaPeradabanShort';
import { SejarahKomunikasiShort, KOMUNIKASI_FRAMES } from './videos/sejarah-komunikasi/SejarahKomunikasiShort';
import { GunungCikurayShort, CIKURAY_FRAMES } from './videos/gunung-cikuray/GunungCikurayShort';
import { CipanasGarutShort, CIPANAS_FRAMES } from './videos/cipanas-garut/CipanasGarutShort';
import { SumurBorShort } from './videos/sumur-bor/SumurBorShort';
import { COMPOSITION_CONFIG as SUMUR_CONFIG } from './videos/sumur-bor/story';
import { KamojangVsNuklirShort } from './videos/kamojang-vs-nuklir/KamojangVsNuklirShort';
import { COMPOSITION_CONFIG as KAMOJANG_CONFIG } from './videos/kamojang-vs-nuklir/story';
import { PerkembanganAiBrutal } from './videos/perkembangan-ai-brutal/PerkembanganAiBrutal';
import { COMPOSITION_CONFIG as AI_BRUTAL_CONFIG } from './videos/perkembangan-ai-brutal/story';
import { SehatEp01Short } from './videos/sehat-ep01/SehatEp01Short';
import { COMPOSITION_CONFIG as SEHAT_EP01_CONFIG } from './videos/sehat-ep01/story';
import { DoomscrollingEp02Short } from './videos/doomscrolling-ep02/DoomscrollingEp02Short';
import { COMPOSITION_CONFIG as DOOMSCROLLING_EP02_CONFIG } from './videos/doomscrolling-ep02/story';
import { KorupsiKumuhEp03Short } from './videos/korupsi-kumuh-ep03/KorupsiKumuhEp03Short';
import { COMPOSITION_CONFIG as KORUPSI_EP03_CONFIG } from './videos/korupsi-kumuh-ep03/story';
import { JembatanKembarGowaShort } from './videos/jembatan-kembar-gowa/JembatanKembarGowaShort';
import { COMPOSITION_CONFIG as GOWA_CONFIG } from './videos/jembatan-kembar-gowa/story';
import { AiBlackOctober } from './videos/ai-black-october/AiBlackOctober';
import { COMPOSITION_CONFIG as BLACK_OCTOBER_CONFIG } from './videos/ai-black-october/story';
import { IpmNalarPelajarShort } from './videos/ipm-nalar-pelajar/NalarPelajarShort';
import { COMPOSITION_CONFIG as IPM_NALAR_CONFIG } from './videos/ipm-nalar-pelajar/story';
import { Ep02SherpaHimalayaShort } from './videos/ep02-sherpa-himalaya/Ep02SherpaHimalayaShort';
import { COMPOSITION_CONFIG as EP02_SHERPA_CONFIG } from './videos/ep02-sherpa-himalaya/story';
import { Ep03ManusiaBerbuluShort } from './videos/ep03-manusia-berbulu/Ep03ManusiaBerbuluShort';
import { COMPOSITION_CONFIG as EP03_BERBULU_CONFIG } from './videos/ep03-manusia-berbulu/story';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1080x1920 Full HD /series-evolusi Ep03: Kenapa Manusia Tidak Berbulu Seperti Simpanse, Bonobo & Gorila? */}
      <Composition
        id={EP03_BERBULU_CONFIG.id}
        component={Ep03ManusiaBerbuluShort}
        durationInFrames={EP03_BERBULU_CONFIG.durationInFrames}
        fps={EP03_BERBULU_CONFIG.fps}
        width={EP03_BERBULU_CONFIG.width}
        height={EP03_BERBULU_CONFIG.height}
      />
      {/* 1080x1920 Full HD /series-evolusi Ep02: Rahasia Tubuh Suku Sherpa di Puncak Everest (EPAS1) */}
      <Composition
        id={EP02_SHERPA_CONFIG.id}
        component={Ep02SherpaHimalayaShort}
        durationInFrames={EP02_SHERPA_CONFIG.durationInFrames}
        fps={EP02_SHERPA_CONFIG.fps}
        width={EP02_SHERPA_CONFIG.width}
        height={EP02_SHERPA_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Soft-Vinyl CharacterFlow Drama: Nalar Pelajar — Wisnu (PC IPM Panawuan) */}
      <Composition
        id={IPM_NALAR_CONFIG.id}
        component={IpmNalarPelajarShort}
        durationInFrames={IPM_NALAR_CONFIG.durationInFrames}
        fps={IPM_NALAR_CONFIG.fps}
        width={IPM_NALAR_CONFIG.width}
        height={IPM_NALAR_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Cutaway Engineering & Traffic Physics: VIDEO 4 — KEMACETAN DI JEMBATAN KEMBAR GOWA */}
      <Composition
        id={GOWA_CONFIG.id}
        component={JembatanKembarGowaShort}
        durationInFrames={GOWA_CONFIG.durationInFrames}
        fps={GOWA_CONFIG.fps}
        width={GOWA_CONFIG.width}
        height={GOWA_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Soft-Vinyl Character-Flow: VIDEO 3 — KELOMPOK 3 DAMPAK KORUPSI TERHADAP KAWASAN KUMUH */}
      <Composition
        id={KORUPSI_EP03_CONFIG.id}
        component={KorupsiKumuhEp03Short}
        durationInFrames={KORUPSI_EP03_CONFIG.durationInFrames}
        fps={KORUPSI_EP03_CONFIG.fps}
        width={KORUPSI_EP03_CONFIG.width}
        height={KORUPSI_EP03_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Storyboard-First Trio Episode: AI BLACK OCTOBER — Audit Tengah Malam (Zaldy × Hermes × OpenClaw) */}
      <Composition
        id={BLACK_OCTOBER_CONFIG.id}
        component={AiBlackOctober}
        durationInFrames={BLACK_OCTOBER_CONFIG.durationInFrames}
        fps={BLACK_OCTOBER_CONFIG.fps}
        width={BLACK_OCTOBER_CONFIG.width}
        height={BLACK_OCTOBER_CONFIG.height}
      />
      {/* 1080x1920 Full HD 100% 2D Editorial Risograph & Halftone Zine: VIDEO 2 — DOOMSCROLLING & KESEHATAN MENTAL */}
      <Composition
        id={DOOMSCROLLING_EP02_CONFIG.id}
        component={DoomscrollingEp02Short}
        durationInFrames={DOOMSCROLLING_EP02_CONFIG.durationInFrames}
        fps={DOOMSCROLLING_EP02_CONFIG.fps}
        width={DOOMSCROLLING_EP02_CONFIG.width}
        height={DOOMSCROLLING_EP02_CONFIG.height}
      />
      {/* 1080x1920 Full HD Painted-Gouache 3D Health Documentary: SERI SEHAT ITU MENYELURUH — EP01 */}
      <Composition
        id={SEHAT_EP01_CONFIG.id}
        component={SehatEp01Short}
        durationInFrames={SEHAT_EP01_CONFIG.durationInFrames}
        fps={SEHAT_EP01_CONFIG.fps}
        width={SEHAT_EP01_CONFIG.width}
        height={SEHAT_EP01_CONFIG.height}
      />
      {/* 1080x1920 Full HD 360° Bedroom & Trio Comedy: Kamar Baru & Wujud 3D Bos Zaldy (Zaldy × Hermes × OpenClaw) */}
      <Composition
        id={ZALDY_ROOM_CONFIG.id}
        component={ZaldyRoomShowcase}
        durationInFrames={ZALDY_ROOM_CONFIG.durationInFrames}
        fps={ZALDY_ROOM_CONFIG.fps}
        width={ZALDY_ROOM_CONFIG.width}
        height={ZALDY_ROOM_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Dual-Agent Comedy: KOMEDI PERKEMBANGAN AI YANG BRUTAL (Hermes & OpenClaw) */}
      <Composition
        id={AI_BRUTAL_CONFIG.id}
        component={PerkembanganAiBrutal}
        durationInFrames={AI_BRUTAL_CONFIG.durationInFrames}
        fps={AI_BRUTAL_CONFIG.fps}
        width={AI_BRUTAL_CONFIG.width}
        height={AI_BRUTAL_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Engineering Cutaway Documentary: BEDAH TEKNOLOGI GEOTERMAL KAMOJANG VS NUKLIR */}
      <Composition
        id={KAMOJANG_CONFIG.id}
        component={KamojangVsNuklirShort}
        durationInFrames={KAMOJANG_CONFIG.durationInFrames}
        fps={KAMOJANG_CONFIG.fps}
        width={KAMOJANG_CONFIG.width}
        height={KAMOJANG_CONFIG.height}
      />
      {/* 1080x1920 Full HD 3D Hydrogeological Cutaway Explainer: BEDAH SUMUR BOR */}
      <Composition
        id={SUMUR_CONFIG.id}
        component={SumurBorShort}
        durationInFrames={SUMUR_CONFIG.durationInFrames}
        fps={SUMUR_CONFIG.fps}
        width={SUMUR_CONFIG.width}
        height={SUMUR_CONFIG.height}
      />
      {/* Vintage Poster Explainer 2D 10-Shot Full HD Short: Cipanas Garut Kehangatan Dari Perut Bumi (1080x1920, 30fps) */}
      <Composition
        id="CipanasGarutShort"
        component={CipanasGarutShort}
        durationInFrames={CIPANAS_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Vintage Poster Explainer 2D Full HD Short: Gunung Cikuray Atap Langit Garut (1080x1920, 30fps) */}
      <Composition
        id="GunungCikurayShort"
        component={GunungCikurayShort}
        durationInFrames={CIKURAY_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Earth-24h Gouache Silhouette Diorama Short: 5 LOMPATAN KOMUNIKASI MANUSIA (720x1280, 30fps) */}
      <Composition
        id="SejarahKomunikasiShort"
        component={SejarahKomunikasiShort}
        durationInFrames={KOMUNIKASI_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />
      {/* Anthropology Explanation ("Human Odyssey Filmic 2D") Character-Driven Documentary: HARGA SEBUAH PERADABAN (1080x1920, 30fps) */}
      <Composition
        id="HargaPeradabanShort"
        component={HargaPeradabanShort}
        durationInFrames={PERADABAN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Anthropology Explanation ("Human Odyssey Filmic 2D") Full Documentary: NUSANTARA — PERADABAN YANG MENGARUNGI SAMUDRA (1080x1920, 30fps) */}
      <Composition
        id="NusantaraSamudraShort"
        component={NusantaraSamudraShort}
        durationInFrames={NUSANTARA_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Anthropology Explanation ("Human Odyssey Filmic 2D") 4-Grammar Pure-Code TikTok 9:16 Showcase — 1080x1920, 30fps */}
      <Composition
        id="AnthropologyShowcase"
        component={AnthropologyShowcase}
        durationInFrames={ANTHROPOLOGY_SHOWCASE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Documentary 2D Short: Mengapa Manusia Memiliki Ritual? (Neuroantropologi) — 720x1280 (9:16), 30fps */}
      <Composition
        id="HumanRitualShort"
        component={HumanRitualShort}
        durationInFrames={HUMAN_RITUAL_FRAMES}
        fps={30}
        width={720}
        height={1280}
      />
      {/* 1080x1920 Full HD 3D Architectural Cutaway Documentary: Dari Masalah Menjadi Rumah */}
      <Composition
        id={RUMAH_CONFIG.id}
        component={MembangunRumahShort}
        durationInFrames={RUMAH_CONFIG.durationInFrames}
        fps={RUMAH_CONFIG.fps}
        width={RUMAH_CONFIG.width}
        height={RUMAH_CONFIG.height}
      />
      {/* Hybrid 2.5D/3D Dual-Agent Comedy Promo: Masih Susah Bikin Animasi Pakai Claude? (1080x1920 Full HD) */}
      <Composition
        id={CLAUDE_PROMO_CONFIG.id}
        component={ClaudeAnimasiPromo}
        durationInFrames={CLAUDE_PROMO_CONFIG.durationInFrames}
        fps={CLAUDE_PROMO_CONFIG.fps}
        width={CLAUDE_PROMO_CONFIG.width}
        height={CLAUDE_PROMO_CONFIG.height}
      />
      {/* 3D Dual-Agent Comedy Short: Shift 24 Jam Keseharian Agen Zaldy (1080x1920 Full HD) */}
      <Composition
        id={KESEHARIAN_CONFIG.id}
        component={KeseharianAgenZaldy}
        durationInFrames={KESEHARIAN_CONFIG.durationInFrames}
        fps={KESEHARIAN_CONFIG.fps}
        width={KESEHARIAN_CONFIG.width}
        height={KESEHARIAN_CONFIG.height}
      />
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
