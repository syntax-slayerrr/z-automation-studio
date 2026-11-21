export interface ShotCue {
  id: string;
  from: number; // in frames
  duration: number; // in frames
  kicker: string;
  headline: string;
  subtitle: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    zoom?: number;
  };
  archival?: {
    imageSrc?: string;
    caption: string;
    source: string;
    tiltDeg: number;
    position: "top-right" | "bottom-right" | "bottom-left" | "center";
  };
  mapMode?: boolean;
}

export const FPS = 30;
export const TOTAL_FRAMES = 30 * 42; // 42 seconds standard reel

export const SHOTS: ShotCue[] = [
  {
    id: "hook",
    from: 0,
    duration: 30 * 7,
    kicker: "TAHUKAH KAMU?",
    headline: "KAPAL UAP SS GAROET",
    subtitle: "Dinamai dari nama kota di pedalaman Priangan",
    camera: {
      position: [12, 14, 12],
      target: [0, 0, 0],
      zoom: 45,
    },
    archival: {
      caption: "Kapal SS Garoet (foto arsip)",
      source: "Rotterdamsche Lloyd (1918)",
      tiltDeg: -3,
      position: "top-right",
    },
  },
  {
    id: "kebun",
    from: 30 * 7,
    duration: 30 * 8,
    kicker: "AWAL ABAD KE-20",
    headline: "GARUT SELATAN",
    subtitle: "Penuh perkebunan karet, kina, dan teh",
    camera: {
      position: [14, 16, 14],
      target: [0, 1, 0],
      zoom: 40,
    },
    archival: {
      caption: "Kebun masa kolonial (foto arsip)",
      source: "KITLV Leiden",
      tiltDeg: 4,
      position: "bottom-right",
    },
  },
  {
    id: "jalur_darat",
    from: 30 * 15,
    duration: 30 * 7,
    kicker: "TAPI LEWAT DARAT",
    headline: "JALAN GUNUNG",
    subtitle: "Medan curam pedati memakan waktu berhari-hari",
    camera: {
      position: [16, 12, 10],
      target: [0, 0, 0],
      zoom: 42,
    },
    archival: {
      caption: "Pedati pengangkut komoditas",
      source: "KITLV Collection",
      tiltDeg: -2,
      position: "bottom-right",
    },
  },
  {
    id: "dermaga",
    from: 30 * 22,
    duration: 30 * 8,
    kicker: "SEKITAR 1920-AN",
    headline: "DERMAGA SANTOLO",
    subtitle: "Dibangun dermaga beton di muara Cilauteureun",
    camera: {
      position: [10, 15, 10],
      target: [0, 0, 0],
      zoom: 46,
    },
    archival: {
      caption: "Pantai Cilauteureun, 1918",
      source: "KITLV Archives",
      tiltDeg: 3,
      position: "top-right",
    },
  },
  {
    id: "karang_alami",
    from: 30 * 30,
    duration: 30 * 6,
    kicker: "GUGUSAN BATU",
    headline: "PEMECAH OMBAK",
    subtitle: "Karang alami meredam gelombang Samudra Hindia",
    camera: {
      position: [8, 18, 8],
      target: [0, 0, 0],
      zoom: 50,
    },
  },
  {
    id: "rute_laut",
    from: 30 * 36,
    duration: 30 * 6,
    kicker: "JALUR MARITIM",
    headline: "SANTOLO — BATAVIA",
    subtitle: "Komoditas Priangan berlayar cepat ke pelabuhan dunia",
    camera: {
      position: [0, 20, 0],
      target: [0, 0, 0],
      zoom: 35,
    },
    mapMode: true,
  },
];
