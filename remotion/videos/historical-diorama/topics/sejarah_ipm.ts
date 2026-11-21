import { VideoTopicManifest } from "../types";

// Total audio duration: 133.33s @ 30fps = 4000 frames
export const SEJARAH_IPM_TOPIC: VideoTopicManifest = {
  meta: {
    title: "Sejarah Lengkap Kelahiran IPM (1919 - 2008)",
    topicId: "sejarah_ipm_lengkap",
    totalDurationSeconds: 133.33,
    fps: 30,
    voiceSettings: {
      voiceId: "elevenlabs-custom",
      model: "elevenlabs-indonesian",
      scriptText: "Enam puluh tahun lalu, seorang pemuda bernama Herman Helmi Farid Ma'ruf berdiri di sebuah podium di Solo...",
    },
  },
  palette: {
    paperBg: "#F6F1E8",
    kickerColor: "#1B6B3A", // Hijau Muhammadiyah / IPM
    headlineColor: "#1F1A18", // Charcoal deep sepia
    accentRed: "#1B6B3A",
  },
  shots: [
    // Shot 1: 0s - 14.0s (0 - 420 frames) - Hook: Herman Helmi di Solo
    {
      id: "shot1_hook_herman_helmi",
      from: 0,
      duration: 420,
      kicker: "SURAKARTA 1961",
      headline: "SATU KEPUTUSAN",
      subtitle: "Herman Helmi Farid Ma'ruf dan awal berdirinya gerakan",
      visualType: "diorama_3d",
      diorama: {
        biome: "campus",
        primaryAsset: "podium",
        terrainElevation: 1.0,
      },
      archival: {
        caption: "Herman Helmi Farid Ma'ruf",
        sourceText: "Ketua Umum Pertama IPM (1961)",
        tiltDeg: -3,
        position: "top-right",
      },
      camera: {
        position: [12, 14, 12],
        target: [0, 0, 0],
        zoom: 44,
      },
    },

    // Shot 2: 14.0s - 36.0s (420 - 1080 frames) - Akar Siswoprojo 1919 & GKPM 1926
    {
      id: "shot2_akar_siswoprojo_gkpm",
      from: 420,
      duration: 660,
      kicker: "YOGYAKARTA 1919",
      headline: "SISWOPROJO & GKPM",
      subtitle: "Wadah pertama pelajar yang sempat dibubarkan",
      visualType: "diorama_3d",
      diorama: {
        biome: "campus",
        primaryAsset: "school",
      },
      archival: {
        caption: "Santri Mu'allimin 1919",
        sourceText: "Siswo Projo Yogyakarta",
        tiltDeg: 4,
        position: "bottom-right",
      },
      camera: {
        position: [14, 13, 11],
        target: [0, 0, 0],
        zoom: 42,
      },
    },

    // Shot 3: 36.0s - 50.0s (1080 - 1500 frames) - Garut 1958 & Jogja 1960
    {
      id: "shot3_garut_membuka_jalan",
      from: 1080,
      duration: 420,
      kicker: "GARUT 1958",
      headline: "MEMBUKA JALAN",
      subtitle: "Konferensi Pemuda Muhammadiyah hidupkan wadah pelajar",
      visualType: "map_route",
      map: {
        region: "jawa_barat",
        points: [
          { name: "GARUT (1958)", coords: [48, 68], isOrigin: true },
          { name: "JOGJA (1960)", coords: [70, 72] },
          { name: "SOLO (1961)", coords: [78, 62] },
        ],
        vehicleIcon: "cart",
        routeColor: "#1B6B3A",
      },
    },

    // Shot 4: 50.0s - 72.0s (1500 - 2160 frames) - Deklarasi Resmi IPM 18 Juli 1961
    {
      id: "shot4_deklarasi_resmi_ipm",
      from: 1500,
      duration: 660,
      kicker: "18 JULI 1961",
      headline: "LAHIRNYA IPM",
      subtitle: "Herman Helmi & Wirsyam Hasan deklarasikan IPM",
      visualType: "diorama_3d",
      diorama: {
        biome: "campus",
        primaryAsset: "podium",
        terrainElevation: 1.2,
      },
      archival: {
        caption: "Deklarasi 18 Juli 1961",
        sourceText: "Surakarta, Jawa Tengah",
        tiltDeg: -2,
        position: "top-right",
      },
      camera: {
        position: [11, 16, 11],
        target: [0, 0, 0],
        zoom: 46,
      },
    },

    // Shot 5: 72.0s - 92.0s (2160 - 2760 frames) - Dinamika Menjadi IRM (1992)
    {
      id: "shot5_menjadi_irm",
      from: 2160,
      duration: 600,
      kicker: "18 NOVEMBER 1992",
      headline: "MENJADI IRM",
      subtitle: "Kata pelajar berganti, tapi semangat tak pernah padam",
      visualType: "diorama_3d",
      diorama: {
        biome: "mountain",
        primaryAsset: "document",
      },
      archival: {
        caption: "Keputusan Perubahan Nama",
        sourceText: "Ikatan Remaja Muhammadiyah (1992)",
        tiltDeg: 3,
        position: "bottom-right",
      },
      camera: {
        position: [13, 14, 13],
        target: [0, 0, 0],
        zoom: 43,
      },
    },

    // Shot 6: 92.0s - 110.0s (2760 - 3300 frames) - Muktamar XVI Surakarta 2008
    {
      id: "shot6_kembali_ke_ipm",
      from: 2760,
      duration: 540,
      kicker: "SURAKARTA 2008",
      headline: "KEMBALI KE IPM",
      subtitle: "Muktamar XVI pulihkan nama Ikatan Pelajar Muhammadiyah",
      visualType: "diorama_3d",
      diorama: {
        biome: "campus",
        primaryAsset: "school",
      },
      archival: {
        caption: "Muktamar XVI Surakarta",
        sourceText: "Pemberlakuan Kembali Nama IPM",
        tiltDeg: -3,
        position: "top-right",
      },
      camera: {
        position: [12, 15, 12],
        target: [0, 0, 0],
        zoom: 45,
      },
    },

    // Shot 7: 110.0s - 133.33s (3300 - 4000 frames) - Ending: Pelajar Penggerak
    {
      id: "shot7_pelajar_penggerak",
      from: 3300,
      duration: 700,
      kicker: "FASTABIQUL KHAIRAT",
      headline: "PELAJAR PENGGERAK",
      subtitle: "Bukan hanya milik masa lalu, kini giliran kamu",
      visualType: "diorama_3d",
      diorama: {
        biome: "campus",
        primaryAsset: "emblem",
      },
      archival: {
        caption: "Lambang Resmi IPM",
        sourceText: "Pelajar Berkemajuan",
        tiltDeg: 2,
        position: "bottom-left",
      },
      camera: {
        position: [10, 18, 10],
        target: [0, 0, 0],
        zoom: 48,
      },
    },
  ],
};
