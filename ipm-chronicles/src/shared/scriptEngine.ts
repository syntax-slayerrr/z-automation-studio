export interface WordToken {
  w: string;
  cue: string | null;
  scene: number;
  line: number;
  start: number;
  end: number;
  speaker?: string;
}

export interface AlignmentFile {
  voice: string;
  model: string;
  duration: number;
  words: WordToken[];
}

export interface SceneWindow {
  id: number;
  name: string;
  fromSec: number;
  toSec: number;
  from: number;
  to: number;
  dur: number;
}

export interface CaptionChunk {
  words: WordToken[];
  start: number;
  end: number;
}

/** Build deterministic midpoint-cut scene windows, frame helpers, and caption chunks from an alignment JSON */
export function createScriptTiming(
  alignment: AlignmentFile,
  sceneNames: string[],
  fps = 30,
  endPadSec = 2.0
) {
  const words = alignment.words;
  const voDurationSec = alignment.duration;
  const totalSec = Number((voDurationSec + endPadSec).toFixed(3));
  const totalFrames = Math.ceil(totalSec * fps);
  const sf = (sec: number): number => Math.round(sec * fps);

  const cues: Record<string, number> = {};
  const cueEnds: Record<string, number> = {};
  for (const tok of words) {
    if (tok.cue) {
      cues[tok.cue] = tok.start;
      cueEnds[tok.cue] = tok.end;
    }
  }

  const sceneCount = Math.max(...words.map((w) => w.scene)) + 1;
  const sceneFirst: WordToken[] = [];
  const sceneLast: WordToken[] = [];
  for (let si = 0; si < sceneCount; si++) {
    const sw = words.filter((w) => w.scene === si);
    sceneFirst.push(sw[0]);
    sceneLast.push(sw[sw.length - 1]);
  }

  const scenes: SceneWindow[] = Array.from({ length: sceneCount }, (_, si) => {
    const fromSec = si === 0 ? 0 : (sceneLast[si - 1].end + sceneFirst[si].start) / 2;
    const toSec =
      si === sceneCount - 1 ? totalSec : (sceneLast[si].end + sceneFirst[si + 1].start) / 2;
    const from = sf(fromSec);
    const to = sf(toSec);
    return {
      id: si,
      name: sceneNames[si] ?? `S${si}`,
      fromSec,
      toSec,
      from,
      to,
      dur: Math.max(1, to - from),
    };
  });

  const cue = (sceneId: number, id: string, fallback = 0): number => {
    const t = cues[id];
    if (t === undefined) return fallback;
    return Math.max(0, sf(t) - scenes[sceneId].from);
  };

  const globalCue = (id: string, fallback = 0): number => {
    const t = cues[id];
    return t === undefined ? fallback : sf(t);
  };

  const captionChunks: CaptionChunk[] = (() => {
    const chunks: CaptionChunk[] = [];
    let cur: WordToken[] = [];
    const flush = () => {
      if (!cur.length) return;
      chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    };
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const prev = cur[cur.length - 1];
      const curChars = cur.reduce((acc, x) => acc + x.w.length + 1, 0);
      const shouldBreak =
        cur.length >= 4 ||
        (prev && (prev.scene !== w.scene || prev.line !== w.line)) ||
        (prev && /[.?!—]$/.test(prev.w)) ||
        curChars + w.w.length > 26;
      if (shouldBreak) flush();
      cur.push(w);
    }
    flush();
    return chunks;
  })();

  return {
    FPS: fps,
    END_PAD_SEC: endPadSec,
    WORDS: words,
    VO_DURATION_SEC: voDurationSec,
    TOTAL_SEC: totalSec,
    TOTAL_FRAMES: totalFrames,
    SCENES: scenes,
    CUES: cues,
    CUE_ENDS: cueEnds,
    CAPTION_CHUNKS: captionChunks,
    sf,
    cue,
    globalCue,
  };
}
