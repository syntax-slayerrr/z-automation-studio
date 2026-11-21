const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const PROJECT = path.resolve(__dirname, "..");
const ROOT = path.resolve(PROJECT, "..");
const { bundle } = require(path.join(ROOT, "node_modules/@remotion/bundler"));
const { openBrowser, selectComposition, renderStill } = require(path.join(ROOT, "node_modules/@remotion/renderer"));

const TEMP_DIR = path.join(ROOT, ".cache", "remotion-temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;

const OUT_DIR = path.join(PROJECT, "out/ep01/qa_v5");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Sample 16 keyframes evenly across all 7 v5 scenes (~102.8s / ~3086 frames)
const STILLS = [
  { name: "01_s0_f0_hook", frame: 0 },
  { name: "02_s0_slash", frame: 215 },
  { name: "03_s0_1919_42y", frame: 392 },
  { name: "04_s1_map_jogja", frame: 445 },
  { name: "05_s1_muallimin", frame: 555 },
  { name: "06_s1_siswo_seal", frame: 710 },
  { name: "07_s2_map_1926", frame: 980 },
  { name: "08_s2_malang_solo", frame: 1125 },
  { name: "09_s2_study_1926", frame: 1220 },
  { name: "10_s3_fly_wajo", frame: 1470 },
  { name: "11_s3_wajo_rain", frame: 1800 },
  { name: "12_s4_desk_tags", frame: 2110 },
  { name: "13_s4_hourglass", frame: 2200 },
  { name: "14_s5_garut_map", frame: 2440 },
  { name: "15_s5_garut_hall", frame: 2630 },
  { name: "16_s6_jogja_dawn", frame: 3000 },
];

(async () => {
  console.log("Bundling Remotion for EP01 v5 QA...");
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT, "src/index.ts"),
    publicDir: path.join(PROJECT, "public"),
  });
  const browser = await openBrowser("chrome", {
    chromiumOptions: { gl: "angle" },
  });
  try {
    const composition = await selectComposition({
      serveUrl,
      id: "IpmEp01",
      puppeteerInstance: browser,
    });
    console.log(`Composition IpmEp01 duration=${composition.durationInFrames} (${(composition.durationInFrames / 30).toFixed(2)}s)`);
    for (const s of STILLS) {
      const f = Math.min(s.frame, composition.durationInFrames - 1);
      const outPath = path.join(OUT_DIR, `${s.name}.jpg`);
      await renderStill({
        composition,
        serveUrl,
        output: outPath,
        frame: f,
        imageFormat: "jpeg",
        jpegQuality: 88,
        puppeteerInstance: browser,
        chromiumOptions: { gl: "angle" },
      });
      console.log(`Rendered ${s.name} (f=${f})`);
    }
  } finally {
    await browser.close({ silent: false });
  }

  // Build 4x4 contact sheets cleanly with ffmpeg (sheet 1: 01..08, sheet 2: 09..16)
  const sh1 = path.join(OUT_DIR, "qa_v5_sheet1.jpg");
  const sh2 = path.join(OUT_DIR, "qa_v5_sheet2.jpg");
  const buildSheet = (items, out) => {
    const inputs = items.map((s) => `-i "${path.join(OUT_DIR, s.name + ".jpg")}"`).join(" ");
    const tiles = items
      .map(
        (s, i) =>
          `[${i}:v]scale=420:746,drawbox=x=0:y=0:w=iw:h=34:color=black@0.72:t=fill,` +
          `drawtext=text='${s.name} (f${s.frame})':x=10:y=9:fontsize=16:fontcolor=#fbbf24[v${i}]`
      )
      .join(";");
    const stack = `${items.map((_, i) => `[v${i}]`).join("")}xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0[out]`;
    execSync(`ffmpeg -y -loglevel error ${inputs} -filter_complex "${tiles};${stack}" -map "[out]" -q:v 3 "${out}"`, {
      stdio: "inherit",
    });
  };
  buildSheet(STILLS.slice(0, 8), sh1);
  buildSheet(STILLS.slice(8, 16), sh2);
  console.log("QA_V5_SHEETS_COMPLETE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
