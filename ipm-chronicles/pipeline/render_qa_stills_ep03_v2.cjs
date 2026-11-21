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
const { selectComposition, renderStill } = require(path.join(ROOT, "node_modules/@remotion/renderer"));

const OUT_DIR = path.join(PROJECT, "out/ep03/qa_v2_3d");
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT, "src/index.ts"),
    outDir: BUNDLE_DIR,
  });

  const comp = await selectComposition({
    serveUrl,
    id: "IpmEp03",
    chromiumOptions: { gl: "angle" },
  });

  // 16 key stills across all 4 3D Sets and all 28 sub-shots
  const frames = [
    // Sheet 1 (S0 & S1)
    { f: 20, name: "01_s0_desk.jpg" },
    { f: 75, name: "02_s0_orbit.jpg" },
    { f: 118, name: "03_s0_closed.jpg" },
    { f: 195, name: "04_s0_doorway.jpg" },
    { f: 270, name: "05_s1_walk.jpg" },
    { f: 332, name: "06_s1_ots.jpg" },
    { f: 455, name: "07_s1_chalk_pp_pd.jpg" },
    { f: 615, name: "08_s1_pr_punch.jpg" },
    // Sheet 2 (S2, S3, S4)
    { f: 815, name: "09_s2_spi_desk.jpg" },
    { f: 905, name: "10_s2_spi_macro.jpg" },
    { f: 1005, name: "11_s2_fortasi.jpg" },
    { f: 1280, name: "12_s2_tm_steps.jpg" },
    { f: 1390, name: "13_s2_anisa_sched.jpg" },
    { f: 1540, name: "14_s3_java_map.jpg" },
    { f: 1705, name: "15_s3_garut_1923.jpg" },
    { f: 1835, name: "16_s3_mono_1923.jpg" },
    { f: 1995, name: "17_s3_garut_1958.jpg" },
    { f: 2235, name: "18_s4_panawuan_desk.jpg" },
    { f: 2375, name: "19_s4_plaque.jpg" },
    { f: 2770, name: "20_s4_window_bridge.jpg" },
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
      jpegQuality: 90,
      overwrite: true,
      chromiumOptions: { gl: "angle" },
    });
    console.log(`Rendered f=${item.f} -> ${item.name} (${((Date.now() - ts) / 1000).toFixed(2)}s)`);
    outPaths.push(out);
  }

  function makeSheet(paths, cols, rows, outPath) {
    const inputs = paths.flatMap((p) => ["-i", p]);
    const scales = paths.map((_, i) => `[${i}:v]scale=360:640[v${i}]`).join(";");
    const layout = paths
      .map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return `${col * 360}_${row * 640}`;
      })
      .join("|");
    const vInputs = paths.map((_, i) => `[v${i}]`).join("");
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel", "error",
      ...inputs,
      "-filter_complex",
      `${scales};${vInputs}xstack=inputs=${paths.length}:layout=${layout}[out]`,
      "-map", "[out]",
      "-q:v", "2",
      outPath,
    ]);
  }

  const sheet1 = path.join(OUT_DIR, "qa_ep03_v2_sheet1.jpg");
  const sheet2 = path.join(OUT_DIR, "qa_ep03_v2_sheet2.jpg");
  makeSheet(outPaths.slice(0, 8), 4, 2, sheet1);
  makeSheet(outPaths.slice(8, 20), 4, 3, sheet2);
  console.log("QA_V2_3D_COMPLETE:", sheet1, sheet2);
})();
