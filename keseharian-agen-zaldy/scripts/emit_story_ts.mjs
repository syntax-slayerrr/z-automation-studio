import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");

const SR = 44100;
const FPS = 30;
const OPEN_LEAD_SILENCE_S = 0.22;
const END_HOLD_S = 2.4;

const LINES = [
  // SCENE 1
  { scene: 1, who: "hermes", pauseBeforeS: 0.15, pauseAfterS: 0.18, text: "[[s1_open]]Jam dua lewat empat belas pagi. Dan Zaldy baru kirim satu kalimat yang paling ditakuti semua AI." },
  { scene: 1, who: "openclaw", pauseBeforeS: 0.05, pauseAfterS: 0.18, text: "[curious] [[s1_oc_chill]]Apaan? Server mati?" },
  { scene: 1, who: "hermes", pauseBeforeS: 0.06, pauseAfterS: 0.45, text: "[[s1_brief]]Lebih horor. \"Tolong bikinin video 3D, jangan template, besok pagi gue cek.\"" },
  // SCENE 2
  { scene: 2, who: "openclaw", pauseBeforeS: 0.12, pauseAfterS: 0.14, text: "[excited] [[s2_proud]]Tenang, Mes! Gue udah kerja keras dari subuh. Nih, empat puluh tujuh ide konsep baru udah rapi!" },
  { scene: 2, who: "hermes", pauseBeforeS: 0.08, pauseAfterS: 0.22, text: "[[s2_ask_render]]Keren. Terus yang udah selesai dirender... berapa?" },
  { scene: 2, who: "openclaw", pauseBeforeS: 0.05, pauseAfterS: 0.22, text: "[sheepish] [[s2_zero]]Eh... nol sih. Tapi judul foldernya bagus-bagus!" },
  { scene: 2, who: "hermes", pauseBeforeS: 0.08, pauseAfterS: 0.48, text: "[[s2_folder_roast]]Folder bagus nggak bisa di-upload, Claw." },
  // SCENE 3
  { scene: 3, who: "openclaw", pauseBeforeS: 0.10, pauseAfterS: 0.12, text: "[panicked] [[s3_ping]]Eh, bunyi notif! Zaldy nge-chat lagi!" },
  { scene: 3, who: "hermes", pauseBeforeS: 0.05, pauseAfterS: 0.16, text: "[[s3_read]]Coba baca." },
  { scene: 3, who: "openclaw", pauseBeforeS: 0.06, pauseAfterS: 0.22, text: "[frustrated] [[s3_list]]Katanya... \"Mantap, tapi sudut kameranya tambahin OTS, baligho di luar ganti, sama ruangan kamarnya sesuaikan naskah.\"" },
  { scene: 3, who: "hermes", pauseBeforeS: 0.08, pauseAfterS: 0.16, text: "[[s3_perfeksionis]]Nah, itu baru bos perfeksionis. Bukan asal jadi, tapi standar studio." },
  { scene: 3, who: "openclaw", pauseBeforeS: 0.06, pauseAfterS: 0.46, text: "[exasperated] [[s3_gorengan]]Gue tahu itu bagus, Mes... tapi prosesor gue udah panas kayak gorengan!" },
  // SCENE 4
  { scene: 4, who: "hermes", pauseBeforeS: 0.14, pauseAfterS: 0.12, text: "[[s4_teamwork]]Udah, nggak usah drama. Lo pegang cerita, humor, sama ritme suara. Gue kunci kamera, cahaya, sama fisika 3D-nya." },
  { scene: 4, who: "openclaw", pauseBeforeS: 0.06, pauseAfterS: 0.14, text: "[enthusiastic] [[s4_deal]]Deal! Akhirnya kita kompak juga!" },
  { scene: 4, who: "hermes", pauseBeforeS: 0.08, pauseAfterS: 0.46, text: "[[s4_ready]]Lihat tuh. Dari pagi sampai senja... seratus persen mulus, nol error, siap di-ACC Zaldy." },
  // SCENE 5
  { scene: 5, who: "openclaw", pauseBeforeS: 0.12, pauseAfterS: 0.14, text: "[bright] [[s5_relief]]Haaah... akhirnya selesai juga. Boleh sleep mode bentar ya, Mes?" },
  { scene: 5, who: "hermes", pauseBeforeS: 0.06, pauseAfterS: 0.28, text: "[[s5_win]]Silakan. Hari ini kita menang." },
  { scene: 5, who: "openclaw", pauseBeforeS: 0.08, pauseAfterS: 0.25, text: "[panicked] [[s5_ping]]Tunggu... Zaldy ngetik lagi! \"Keren banget! Barusan dapet ide baru, gas satu episode lagi ya?\"" },
  { scene: 5, who: "hermes", pauseBeforeS: 0.08, pauseAfterS: 0.20, text: "[[s5_pasrah]]Gue udah nggak kaget." },
  { scene: 5, who: "openclaw", pauseBeforeS: 0.06, pauseAfterS: 0.40, text: "[exasperated] [[s5_kopi]]Woi! Kopi mana kopi?!" },
];

function prepareLine(rawText, lineIdx) {
  const displayTokens = [];
  const parts = rawText.split(/(?<!\[)(\[[^\[\]]+\])(?!\])/g);
  for (const part of parts) {
    if (!part || /^\[[^\[\]]+\]$/.test(part)) continue;
    for (const tok of part.trim().split(/\s+/)) {
      if (!tok) continue;
      const m = tok.match(/^(?:\[\[([^\]]+)\]\])?(.*)$/);
      const cue = m[1] || null;
      const disp = m[2];
      if (!disp) continue;
      displayTokens.push({ w: disp, cue, line: lineIdx });
    }
  }
  return displayTokens;
}

const cacheDir = join(PROJECT, "audio/vo_cache");
const files = existsSync(cacheDir) ? readdirSync(cacheDir).filter(f => f.endsWith(".wav")).sort() : [];

let curSec = OPEN_LEAD_SILENCE_S;
const wordTimings = [];
const cueTimesSec = {};
const sceneStartsSec = { s1: OPEN_LEAD_SILENCE_S };
let currentScene = 1;

for (let i = 0; i < LINES.length; i++) {
  const lineDef = LINES[i];
  if (lineDef.scene !== currentScene) {
    currentScene = lineDef.scene;
    sceneStartsSec[`s${currentScene}`] = curSec + lineDef.pauseBeforeS;
  }
  curSec += lineDef.pauseBeforeS;
  const lineStartSec = curSec;

  // Check if cached wav exists
  const matchingWav = files.find(f => f.startsWith(`line_${String(i).padStart(2, "0")}_`));
  let dur = 0;
  if (matchingWav) {
    const wavPath = join(cacheDir, matchingWav);
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wavPath]).toString().trim();
    dur = parseFloat(out);
  } else {
    // Estimated duration: ~0.055s per char
    dur = Math.max(1.4, lineDef.text.length * 0.055);
  }

  const tokens = prepareLine(lineDef.text, i);
  const tokenDur = dur / Math.max(1, tokens.length);

  tokens.forEach((tok, tIdx) => {
    const s = lineStartSec + tIdx * tokenDur;
    const e = s + tokenDur;
    wordTimings.push({
      word: tok.w,
      cue: tok.cue,
      line: i,
      who: lineDef.who,
      scene: lineDef.scene,
      startSec: s,
      endSec: e,
      startFrame: Math.round(s * FPS),
      endFrame: Math.round(e * FPS),
    });
    if (tok.cue) {
      cueTimesSec[tok.cue] = s;
    }
  });

  curSec += dur;
  curSec += lineDef.pauseAfterS;
}

curSec += END_HOLD_S;
const totalSec = curSec;
const totalFrames = Math.ceil(totalSec * FPS);

const storyTs = `/**
 * Auto-generated by keseharian-agen-zaldy/scripts/emit_story_ts.mjs
 * Total Duration: ${totalSec.toFixed(2)}s (${totalFrames} frames @ ${FPS}fps)
 */
export interface WordTiming {
  word: string;
  cue: string | null;
  line: number;
  who: "hermes" | "openclaw";
  scene: number;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export const FPS = ${FPS};
export const TOTAL_FRAMES = ${totalFrames};
export const TOTAL_SECONDS = ${totalSec.toFixed(2)};

export const COMPOSITION_CONFIG = {
  id: "KeseharianAgenZaldy",
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  width: 1080,
  height: 1920,
};

export const SCENE_STARTS = ${JSON.stringify(
  Object.fromEntries(Object.entries(sceneStartsSec).map(([k, sec]) => [k, Math.round(sec * FPS)])),
  null,
  2
)} as const;

export const CUES = ${JSON.stringify(
  Object.fromEntries(Object.entries(cueTimesSec).map(([k, sec]) => [k, Math.round(sec * FPS)])),
  null,
  2
)} as const;

export const WORDS: WordTiming[] = ${JSON.stringify(wordTimings, null, 2)};
`;

const remotionDir = resolve(ROOT, "remotion/videos/keseharian-agen-zaldy");
mkdirSync(remotionDir, { recursive: true });
writeFileSync(join(remotionDir, "story.ts"), storyTs);
console.log("Successfully emitted story.ts!");

const alignmentData = {
  projectSlug: "keseharian-agen-zaldy",
  fps: FPS,
  totalVideoSec: totalSec,
  totalFrames,
  scenesSec: sceneStartsSec,
  scenesFrame: Object.fromEntries(
    Object.entries(sceneStartsSec).map(([k, sec]) => [k, Math.round(sec * FPS)])
  ),
  cuesSec: cueTimesSec,
  cuesFrame: Object.fromEntries(
    Object.entries(cueTimesSec).map(([k, sec]) => [k, Math.round(sec * FPS)])
  ),
  wordTimings,
};

mkdirSync(join(PROJECT, "audio"), { recursive: true });
writeFileSync(join(PROJECT, "audio/alignment.json"), JSON.stringify(alignmentData, null, 2));
console.log("Successfully emitted alignment.json!");
