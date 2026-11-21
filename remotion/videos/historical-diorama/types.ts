export type VisualType = "diorama_3d" | "map_route" | "archival_focus";
export type EnvironmentBiome = "ocean" | "plantation" | "mountain" | "harbor" | "campus" | "custom";
export type DioramaAssetType = "steamship" | "pedati" | "breakwater_reef" | "warehouse" | "mountain_path" | "podium" | "school" | "document" | "emblem" | "none";

export interface DioramaSceneConfig {
  biome: EnvironmentBiome;
  primaryAsset: DioramaAssetType;
  secondaryAsset?: DioramaAssetType;
  terrainElevation?: number; // 0 (flat ocean/sand) to 2 (high tea hill)
  waterColor?: string; // e.g. #3A7B99
  groundColor?: string; // e.g. #7E8D56 (plantation) or #C8B48F (sand)
  waveRipples?: boolean;
}

export interface MapRouteConfig {
  region: "jawa_barat" | "nusantara" | "selat_sunda" | "custom";
  points: Array<{
    name: string;
    coords: [number, number]; // [x, y] in normalized map percent
    isOrigin?: boolean;
  }>;
  routeColor?: string; // default #B83A2E
  dashedAnimation?: boolean;
  vehicleIcon?: "anchor" | "ship" | "cart";
}

export interface ArchivalCardConfig {
  imageSrc?: string; // path to local asset or placeholder
  caption: string; // e.g. "Foto Arsip KITLV (1918)"
  sourceText?: string;
  tiltDeg: number; // e.g. -3 to 4
  position: "top-right" | "bottom-right" | "bottom-left" | "center";
}

export interface TopicShotCue {
  id: string;
  from: number;
  duration: number;
  // Typography
  kicker: string;
  headline: string;
  subtitle: string;
  // Visual Mode: Bebas switch per-shot sesuai topik
  visualType: VisualType;
  diorama?: DioramaSceneConfig;
  map?: MapRouteConfig;
  archival?: ArchivalCardConfig;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
    zoom?: number;
  };
}

export interface VideoTopicManifest {
  meta: {
    title: string;
    topicId: string;
    totalDurationSeconds: number;
    fps: number;
    voiceSettings?: {
      voiceId: string;
      model: string;
      scriptText: string;
    };
  };
  palette: {
    paperBg: string; // parchment tint
    kickerColor: string;
    headlineColor: string;
    accentRed: string;
  };
  shots: TopicShotCue[];
}
