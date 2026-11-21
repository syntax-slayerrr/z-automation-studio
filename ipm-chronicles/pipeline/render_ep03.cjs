const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const PROJECT = path.resolve(__dirname, "..");
const ROOT = path.resolve(PROJECT, "..");

const TEMP_DIR = path.join(ROOT, ".cache", "remotion-temp");
const LOCAL_APP_DIR = path.join(ROOT, ".cache", "win-localappdata");
const BUNDLE_DIR = path.join(ROOT, ".cache", "remotion-bundle-ep03");
for (const d of [TEMP_DIR, LOCAL_APP_DIR, BUNDLE_DIR]) {
  fs.mkdirSync(d, { recursive: true });
}
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;
process.env.TMPDIR = TEMP_DIR;
process.env.LOCALAPPDATA = LOCAL_APP_DIR;
process.env.APPDATA = LOCAL_APP_DIR;

const { bundle } = require(path.join(ROOT, "node_modules/@remotion/bundler"));
const { selectComposition, renderMedia } = require(path.join(ROOT, "node_modules/@remotion/renderer"));

const OUT_DIR = path.join(PROJECT, "out/ep03");
const OUT_MP4 = path.join(OUT_DIR, "ep03_master.mp4");
const AUDIO_WAV = path.join(PROJECT, "public/audio/ep03/ep03_master_audio.wav");
fs.mkdirSync(OUT_DIR, { recursive: true });

function cleanRenderTemps() {
  for (const name of fs.readdirSync(TEMP_DIR)) {
    if (/^(puppeteer_dev_chrome_profile-|react-motion-render|remotion-v)/.test(name)) {
      try {
        fs.rmSync(path.join(TEMP_DIR, name), { recursive: true, force: true });
      } catch {
        // Ignore transient Windows file lock on recently exited headless browser profiles
      }
    }
  }
}

async function renderRange(serveUrl, composition, frameRange, outPath, label) {
  cleanRenderTemps();
  let lastPct = -1;
  const count = frameRange[1] - frameRange[0] + 1;
  console.log(`Rendering ${label} frames [${frameRange[0]}..${frameRange[1]}] (${count} frames) -> ${outPath}`);
  await renderMedia({
    composition,
    serveUrl,
    frameRange,
    muted: true,
    codec: "h264",
    crf: 18,
    x264Preset: "fast",
    imageFormat: "jpeg",
    jpegQuality: 90,
    outputLocation: outPath,
    overwrite: true,
    concurrency: 1,
    disableSharedMemoryCapture: true,
    offthreadVideoCacheSizeInBytes: 1024 * 1024,
    chromiumOptions: { gl: "angle" },
    ffmpegOverride: ({ type, args }) => {
      const extra = type === "pre-stitcher" ? ["-threads", "2", "-rc-lookahead", "10"] : ["-threads", "2"];
      return [...args.slice(0, -1), ...extra, args[args.length - 1]];
    },
    onProgress: ({ progress, renderedFrames }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastPct + 20 || pct === 100) {
        lastPct = pct;
        console.log(`${label} progress: ${pct}% (${renderedFrames}/${count})`);
      }
    },
  });
}

(async () => {
  const partArg = process.argv.find((a) => a.startsWith("--part="))?.split("=")[1] ?? "all";
  const rangeArg = process.argv.find((a) => a.startsWith("--range="))?.split("=")[1];
  const outArg = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1];
  const specsArg = process.argv.find((a) => a.startsWith("--specs="))?.split("=")[1];
  const reuseBundle = process.argv.includes("--reuse") && fs.existsSync(path.join(BUNDLE_DIR, "index.html"));
  const filesArg = process.argv.find((a) => a.startsWith("--files="))?.split("=")[1];
  const chunkArg = process.argv.find((a) => a.startsWith("--chunk="))?.split("=")[1];

  const CHUNK_SIZE = 240;
  let serveUrl;
  let composition;

  if (partArg !== "mux") {
    if (reuseBundle) {
      serveUrl = BUNDLE_DIR;
    } else {
      console.log("Bundling Remotion EP03 Master into D:.cache...");
      serveUrl = await bundle({
        entryPoint: path.join(PROJECT, "src/index.ts"),
        publicDir: path.join(PROJECT, "public"),
        outDir: BUNDLE_DIR,
      });
    }
    composition = await selectComposition({
      serveUrl,
      id: "IpmEp03",
      chromiumOptions: { gl: "angle" },
    });
  }

  if (partArg === "batch" && specsArg) {
    for (const item of specsArg.split(",")) {
      const [aStr, bStr, fname] = item.split(":");
      const a = Number(aStr);
      const b = Number(bStr);
      const outPath = path.resolve(TEMP_DIR, fname);
      await renderRange(serveUrl, composition, [a, b], outPath, `SEG_${a}_${b}`);
      console.log("SEG_OK:", fname, fs.statSync(outPath).size);
    }
    return;
  }

  if (partArg === "smoke" && rangeArg) {
    const [a, b] = rangeArg.split(",").map(Number);
    const smokeOut = outArg ? path.resolve(TEMP_DIR, outArg) : path.join(TEMP_DIR, "ep03_smoke.mp4");
    await renderRange(serveUrl, composition, [a, b], smokeOut, `SEG_${a}_${b}`);
    console.log("SEG_OK:", smokeOut, fs.statSync(smokeOut).size);
    return;
  }

  const totalFrames = composition ? composition.durationInFrames : 2876;
  const numChunks = Math.ceil(totalFrames / CHUNK_SIZE);
  const chunkPaths = filesArg
    ? filesArg.split(",").map((n) => path.resolve(TEMP_DIR, n))
    : Array.from({ length: numChunks }, (_, i) => path.join(TEMP_DIR, `ep03_chunk_${i}.mp4`));

  if (chunkArg !== undefined) {
    const ci = Number(chunkArg);
    const a = ci * CHUNK_SIZE;
    const b = Math.min(totalFrames - 1, (ci + 1) * CHUNK_SIZE - 1);
    await renderRange(serveUrl, composition, [a, b], chunkPaths[ci], `CHUNK_${ci}`);
    return;
  }

  if (partArg === "all" || partArg === "render") {
    for (let ci = 0; ci < numChunks; ci++) {
      const a = ci * CHUNK_SIZE;
      const b = Math.min(totalFrames - 1, (ci + 1) * CHUNK_SIZE - 1);
      await renderRange(serveUrl, composition, [a, b], chunkPaths[ci], `CHUNK_${ci}/${numChunks - 1}`);
    }
  }

  if (partArg === "all" || partArg === "mux") {
    const concatList = path.join(TEMP_DIR, "ep03_concat_parts.txt");
    fs.writeFileSync(
      concatList,
      chunkPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n",
      "utf8"
    );
    const silentConcat = path.join(TEMP_DIR, "ep03_silent_full.mp4");
    execFileSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList, "-c:v", "copy", silentConcat],
      { stdio: "inherit" }
    );
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        silentConcat,
        "-i",
        AUDIO_WAV,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
        "-shortest",
        OUT_MP4,
      ],
      { stdio: "inherit" }
    );
    cleanRenderTemps();
    const sizeMb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
    console.log(`EP03_MASTER_RENDER_COMPLETE: ${OUT_MP4} (${sizeMb} MB)`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
