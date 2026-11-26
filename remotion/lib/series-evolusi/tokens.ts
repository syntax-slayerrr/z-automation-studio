/**
 * 1:1 Forensic Design Tokens for `/series-evolusi`
 * Reverse-engineered pixel-by-pixel & spectrum-by-spectrum from the Bajau Evolution reference short
 * (49.80s, 30 fps, 9:16 vertical, -14.1 LUFS, A minor @ 86.15 / 172.3 BPM).
 */

export interface EvolutionBiomePalette {
  id: string;
  label: string;
  /** Primary deep environment top/bottom gradient */
  envTop: string;
  envMid: string;
  envBottom: string;
  /** Caustic / atmospheric highlight */
  causticHighlight: string;
  /** Matte silhouette human rig albedo + directional rim light */
  silhouetteBody: string;
  silhouetteRim: string;
  /** X-Ray cavity & organ colors */
  xrayShellInner: string;
  xrayShellRim: string;
  xrayBoneCore: string;
  xrayBoneRim: string;
  xrayRefOrganCore: string;
  xrayRefOrganRim: string;
  xrayHeroOrganCore: string;
  xrayHeroOrganRim: string;
}

/**
 * Exact HEX swatches sampled from lossless PNG frames (f=60, 120, 168, 285, 366, 480, 735, 1260)
 */
export const EVOLUTION_TOKENS = {
  fps: 30,
  width: 1080,
  height: 1920,

  typography: {
    fontFamily: "'Montserrat', 'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif",
    /** Line 1 primary size (~3.9% of height = 74px at 1080x1920) */
    primarySizePx: 72,
    /** Line 2 secondary size (~2.95% of height = 56px at 1080x1920) */
    secondarySizePx: 56,
    /** Hero floating world title (e.g. "suku Bajo", "2018" ~8.2% height = 136px) */
    heroTitleSizePx: 132,
    /** Diagnostic small label (e.g. "tetangga, bukan penyelam" ~3.1% height = 50px) */
    diagnosticLabelPx: 46,
    fontWeightPrimary: 700,
    fontWeightSecondary: 600,
    lineHeight: 1.18,
    letterSpacing: '-0.015em',
    textWhite: '#F8FAFC',
    keywordGold: '#F6AD2B',
    keywordWarmAmber: '#FF9F1C',
    calloutCyan: '#7CF6FF',
    /** Crisp soft shadow ONLY — ZERO black outline stroke, ZERO opaque pill boxes */
    textShadow: '0 4px 18px rgba(0, 0, 0, 0.62), 0 1px 4px rgba(0, 0, 0, 0.45)',
    /** Per-word directional optical blur reveal duration in frames (at 30 fps) */
    wordBlurInFrames: 7,
    wordBlurOutFrames: 6,
    maxBlurPx: 12,
  },

  safeZones: {
    leftPct: 8.2,
    rightMaxPct: 84.0, // leaves 86%..95% clean for RightScaleRuler!
    topZoneYPct: 13.5,
    midZoneYPct: 48.0,
    bottomZoneYPct: 70.5,
  },

  instruments: {
    /** Right-Edge Scientific Scale / Depth Gauge (measured on f=60 & f=735) */
    ruler: {
      rightEdgeXPct: 93.8,
      majorTickWidthPx: 38,
      majorTickHeightPx: 3,
      minorTickWidthPx: 18,
      minorTickHeightPx: 2,
      majorCount: 6,
      minorPerInterval: 4,
      topYPct: 10.5,
      bottomYPct: 80.5,
      majorColor: 'rgba(248, 250, 252, 0.82)',
      minorColor: 'rgba(248, 250, 252, 0.40)',
      indicatorHex: '#F5B841',
      indicatorSizePx: 20,
    },

    /** 1.5px (at 478w -> 3.2px at 1080w) crisp white scientific callout + hollow circle target */
    callout: {
      strokeColor: 'rgba(248, 250, 252, 0.92)',
      strokeWidthPx: 2.6,
      targetRingRadiusPx: 11,
      targetRingStrokePx: 2.6,
    },

    /** Holographic Ghost Counter-Prop + Cross-Out ("Tanpa tabung oksigen") */
    hologram: {
      coreColor: '#0E9EC2',
      rimColor: '#7CF6FF',
      crossOutColor: '#FF6B35',
      crossOutStrokePx: 6,
    },

    /** B-Mode Golden Acoustic Speckle Ultrasound Diagnostic Screen (f=525..855) */
    ultrasound: {
      bgEspresso: '#190D05',
      bgVignetteEdge: '#0E0702',
      gridStroke: 'rgba(255, 188, 112, 0.045)',
      gridStepPx: 90,
      sectorApexDeg: 68,
      speckleDark: '#261206',
      speckleMid: '#9B5B14',
      speckleGold: '#E8A838',
      speckleBright: '#FFF1BE',
      caliperColor: '#D8F5FF',
    },

    /** Bioluminescent Coastline Cartographic Map (f=354..378) */
    map: {
      oceanDeep: '#003C72',
      oceanShelf: '#095A96',
      landBase: '#1B5B27',
      landHighlight: '#2E7338',
      shoreInner: '#C2F9EC',
      shoreGlow: '#1CE2FF',
    },

    /** 3D Molecular Ball-and-Stick DNA Double Helix (f=1238..1288) */
    dna: {
      strandTeal: '#26C6DA',
      strandAmber: '#FFA726',
      nodeCoral: '#E64A19',
      nodeCream: '#F4E5C6',
      rungCream: '#F5E6C8',
      rungTeal: '#26A69A',
      rungCoral: '#E64A19',
      rungGold: '#FFB300',
      bgWarmLeft: '#9A5212',
      bgDeepRight: '#0C2F49',
    },
  },

  /** Harmonic & Acoustic 1:1 Specification (A Natural Minor, 86.15 / 172.3 BPM) */
  audio: {
    bpmHalfTime: 86.15,
    bpmDoubleTime: 172.3,
    key: 'A minor',
    chordProgression: ['Am', 'F', 'G', 'Dm'] as const,
    bassRootsHz: [108.0, 87.9, 96.0, 72.0] as const, // A2, F2, G2, D2
    ostinatoLowPassHz: 480, // Keeps 500 Hz - 4,000 Hz 100% open for Baritone VO!
    sonarPingHz: 2637.8, // E7 (5th of A minor)
    monitorPulseHz: [886.3, 519.7] as const, // A5 + C5
    dnaChimeHz: [4187.3, 4698.0, 5869.3, 7044.0, 8216.7] as const, // C8..C9
    targetLufs: -14.3,
    truePeakCeilingDb: -1.5,
  },
} as const;

export const EVOLUTION_BIOME_PALETTES: Record<string, EvolutionBiomePalette> = {
  ocean_bajau: {
    id: 'ocean_bajau',
    label: 'Laut Dalam Suku Bajo & Moken',
    envTop: '#0B8EC0',
    envMid: '#035E8E',
    envBottom: '#02263B',
    causticHighlight: '#36D6EE',
    silhouetteBody: '#0D1821',
    silhouetteRim: '#4FD8EE',
    xrayShellInner: '#8C4E08',
    xrayShellRim: '#F2B43B',
    xrayBoneCore: '#D9CBB4',
    xrayBoneRim: '#FFF8E6',
    xrayRefOrganCore: '#D9480F',
    xrayRefOrganRim: '#FF9248',
    xrayHeroOrganCore: '#C77D0A',
    xrayHeroOrganRim: '#FFE047',
  },
  himalaya_hypoxia: {
    id: 'himalaya_hypoxia',
    label: 'Pegunungan Tinggi Sherpa Tibet & Andes',
    envTop: '#1E4E79',
    envMid: '#122E4A',
    envBottom: '#091726',
    causticHighlight: '#90CAF9',
    silhouetteBody: '#121820',
    silhouetteRim: '#82CFFF',
    xrayShellInner: '#8C4E08',
    xrayShellRim: '#F2B43B',
    xrayBoneCore: '#D9CBB4',
    xrayBoneRim: '#FFF8E6',
    xrayRefOrganCore: '#D93B14',
    xrayRefOrganRim: '#FF8642',
    xrayHeroOrganCore: '#C98A0C',
    xrayHeroOrganRim: '#FFEA5E',
  },
  savanna_endurance: {
    id: 'savanna_endurance',
    label: 'Sabana Afrika Timur (Laktase / Pelari Kalenjin / Sabit Malaria)',
    envTop: '#C97A2B',
    envMid: '#7D4114',
    envBottom: '#2B1508',
    causticHighlight: '#FFD07B',
    silhouetteBody: '#17120E',
    silhouetteRim: '#FFB74D',
    xrayShellInner: '#8C4E08',
    xrayShellRim: '#F2B43B',
    xrayBoneCore: '#D9CBB4',
    xrayBoneRim: '#FFF8E6',
    xrayRefOrganCore: '#C93B14',
    xrayRefOrganRim: '#FF8A47',
    xrayHeroOrganCore: '#D4880F',
    xrayHeroOrganRim: '#FFE45E',
  },
  arctic_cold: {
    id: 'arctic_cold',
    label: 'Tundra & Es Arktik (Adaptasi Dingin Inuit)',
    envTop: '#236B8E',
    envMid: '#133F5C',
    envBottom: '#071B2B',
    causticHighlight: '#A7F3D0',
    silhouetteBody: '#101820',
    silhouetteRim: '#67E8F9',
    xrayShellInner: '#8C4E08',
    xrayShellRim: '#F2B43B',
    xrayBoneCore: '#D9CBB4',
    xrayBoneRim: '#FFF8E6',
    xrayRefOrganCore: '#D9480F',
    xrayRefOrganRim: '#FF9248',
    xrayHeroOrganCore: '#D98218',
    xrayHeroOrganRim: '#FFD95A',
  },
};
