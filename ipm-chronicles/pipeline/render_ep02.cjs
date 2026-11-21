const path = require("path");
const fs = require("fs");

const PROJECT = path.resolve(__dirname, "..");
const ROOT = path.resolve(PROJECT, "..");
const { bundle } = require(path.join(ROOT, "node_modules/@remotion/bundler"));
const { selectComposition, renderMedia } = require(path.join(ROOT, "node_modules/@remotion/renderer"));

const TEMP_DIR = path.join(ROOT, ".cache", "remotion-temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;
process.env.TMPDIR = TEMP_DIR;

const OUT_MP4 = path.join(PROJECT, "out/ep02/ep02_master.mp4");
fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });

(async () => {
  console.log("Bundling Remotion EP02 Master with explicit publicDir...");
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT, "src/index.ts"),
    publicDir: path.join(PROJECT, "public"),
  });

  const composition = await selectComposition({
    serveUrl,
    id: "IpmEp02",
    chromiumOptions: { gl: "angle" },
  });

  console.log(
    `Rendering IpmEp02 -> ${OUT_MP4} (${composition.durationInFrames} frames / ${(
      composition.durationInFrames / composition.fps
    ).toFixed(2)}s)`
  );

  let lastPct = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 18,
    imageFormat: "jpeg",
    jpegQuality: 90,
    outputLocation: OUT_MP4,
    overwrite: true,
    concurrency: 2,
    chromiumOptions: { gl: "angle" },
    onProgress: ({ progress, renderedFrames }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastPct + 10 || pct === 100) {
        lastPct = pct;
        console.log(`Render progress: ${pct}% (${renderedFrames}/${composition.durationInFrames})`);
      }
    },
  });

  const sizeMb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
  console.log(`EP02_MASTER_RENDER_COMPLETE: ${OUT_MP4} (${sizeMb} MB)`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
