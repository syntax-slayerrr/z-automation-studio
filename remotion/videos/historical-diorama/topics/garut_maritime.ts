import { VideoTopicManifest } from "../types";

export const GARUT_MARITIME_TOPIC: VideoTopicManifest = {
  meta: {
    title: "Pelabuhan Santolo & SS Garoet",
    topicId: "garut_santolo_1920",
    totalDurationSeconds: 42,
    fps: 30,
    voiceSettings: {
      voiceId: "a053f6bc-7df4-40de-96d4-de026bc47ce8", // Cartesia Andi
      model: "sonic-3.6",
      scriptText: "Tahukah kamu, ada kapal uap milik maskapai Belanda yang dinamai SS Garoet...",
    },
  },
  palette: {
    paperBg: "#F6F1E8",
    kickerColor: "#A24838",
    headlineColor: "#1F1A18",
    accentRed: "#B83A2E",
  },
  shots: [
    {
      id: "shot1_intro",
      from: 0,
      duration: 30 * 7,
      kicker: "TAHUKAH KAMU?",
      headline: "KAPAL UAP SS GAROET",
      subtitle: "Dinamai dari nama kota di pedalaman Priangan",
      visualType: "diorama_3d",
      diorama: {
        biome: "ocean",
        primaryAsset: "steamship",
        waveRipples: true,
      },
      archival: {
        caption: "Kapal SS Garoet (foto arsip)",
        sourceText: "Rotterdamsche Lloyd (1918)",
        tiltDeg: -3,
        position: "top-right",
      },
    },
    {
      id: "shot2_plantation",
      from: 30 * 7,
      duration: 30 * 8,
      kicker: "AWAL ABAD KE-20",
      headline: "GARUT SELATAN",
      subtitle: "Penuh perkebunan karet, kina, dan teh",
      visualType: "diorama_3d",
      diorama: {
        biome: "plantation",
        primaryAsset: "none",
        terrainElevation: 1.5,
      },
      archival: {
        caption: "Kebun masa kolonial (foto arsip)",
        sourceText: "KITLV Leiden",
        tiltDeg: 4,
        position: "bottom-right",
      },
    },
    {
      id: "shot3_pedati",
      from: 30 * 15,
      duration: 30 * 7,
      kicker: "TAPI LEWAT DARAT",
      headline: "JALAN GUNUNG",
      subtitle: "Medan curam pedati memakan waktu berhari-hari",
      visualType: "diorama_3d",
      diorama: {
        biome: "mountain",
        primaryAsset: "pedati",
      },
      archival: {
        caption: "Pedati pengangkut komoditas",
        sourceText: "KITLV Collection",
        tiltDeg: -2,
        position: "bottom-right",
      },
    },
    {
      id: "shot4_harbor",
      from: 30 * 22,
      duration: 30 * 8,
      kicker: "SEKITAR 1920-AN",
      headline: "DERMAGA SANTOLO",
      subtitle: "Dibangun dermaga beton di muara Cilauteureun",
      visualType: "diorama_3d",
      diorama: {
        biome: "harbor",
        primaryAsset: "steamship",
      },
      archival: {
        caption: "Pantai Cilauteureun, 1918",
        sourceText: "KITLV Archives",
        tiltDeg: 3,
        position: "top-right",
      },
    },
    {
      id: "shot5_map",
      from: 30 * 30,
      duration: 30 * 12,
      kicker: "JALUR MARITIM",
      headline: "SANTOLO — BATAVIA",
      subtitle: "Komoditas Priangan berlayar cepat ke pelabuhan dunia",
      visualType: "map_route",
      map: {
        region: "jawa_barat",
        points: [
          { name: "SANTOLO", coords: [48, 70], isOrigin: true },
          { name: "BATAVIA", coords: [44, 25] },
        ],
        vehicleIcon: "ship",
      },
    },
  ],
};
