const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const PROJECT = path.resolve(__dirname, "..");
const ROOT = path.resolve(PROJECT, "..");
const TEMP_DIR = path.join(ROOT, ".cache", "remotion-temp");
const LOCAL_APP_DIR = path.join(ROOT, ".cache", "win-localappdata");
const BUNDLE_DIR = path.join(ROOT, ".cache", "remotion-bundle-ep03-3d");
for (const d of [TEMP_DIR, LOCAL_APP_DIR, BUNDLE_DIR]) {
  fs.mkdirSync(d, { recursive: true });
}
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;
process.env.TMPDIR = TEMP_DIR;
process.env.LOCALAPPDATA = LOCAL_APP_DIR;
process.env.APPDATA = LOCAL_APP_DIR;

const { bundle } = require(path.join(ROOT, "node_modules/@remotion/bundler"));
const { selectComposition, renderStill } = require(path.join(ROOT, "node_modules/@remotion/renderer"));

const OUT_DIR = path.join(PROJECT, "out/ep03/qa_poc3d");
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const t0 = Date.now();
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT, "src/index.ts"),
    outDir: BUNDLE_DIR,
    onProgress: (p) => {
      if (p % 25 === 0) console.log(`Bundle: ${p}%`);
    },
  });
  console.log(`Bundled in ${((Date.now() - t0) / 1000).toFixed(2)}s`);

  const comp = await selectComposition({
    serveUrl,
    id: "IpmEp03-3D-PoC",
    chromiumOptions: { gl: "angle" },
  });

  const frames = [
    { f: 265, name: "shot05_walk.jpg" },
    { f: 330, name: "shot06_ots.jpg" },
    { f: 430, name: "shot08_chalk.jpg" },
    { f: 605, name: "shot10_pr_punch.jpg" },
  ];

  const outPaths = [];
  for (const item of frames) {
    const out = path.join(OUT_DIR, item.name);
    const ts = Date.now();
    await renderStill({
      composition: comp,
      serveUrl,
      frame: item.f,
      output: out,
      imageFormat: "jpeg",
      jpegQuality: 92,
      overwrite: true,
      chromiumOptions: { gl: "angle" },
    });
    const dt = ((Date.now() - ts) / 1000).toFixed(2);
    console.log(`Rendered f=${item.f} (${item.name}) in ${dt}s`);
    outPaths.push(out);
  }

  const sheetPath = path.join(OUT_DIR, "poc_sheet.jpg");
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel", "error",
    "-i", outPaths[0],
    "-i", outPaths[1],
    "-i", outPaths[2],
    "-i", outPaths[3],
    "-filter_complex",
    "[0:v]scale=540:960[v0];[1:v]scale=540:960[v1];[2:v]scale=540:960[v2];[3:v]scale=540:960[v3];[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[out]",
    "-map", "[out]",
    "-q:v", "2",
    sheetPath,
  ]);
  console.log("POC_3D_QA_COMPLETE:", sheetPath);
})();
