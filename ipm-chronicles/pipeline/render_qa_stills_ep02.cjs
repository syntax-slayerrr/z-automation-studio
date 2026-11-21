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

const OUT_DIR = path.join(PROJECT, "out/ep02/qa");
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const oldFile of fs.readdirSync(OUT_DIR)) {
  if (/\.jpg$/i.test(oldFile)) {
    fs.unlinkSync(path.join(OUT_DIR, oldFile));
  }
}

// Sample 16 hero keyframes spanning all 6 upgraded scenes (3639 frames = 121.30s)
const STILLS = [
  { name: "01_s0_jogja_arch", frame: 42 },
  { name: "02_s0_solo_1961", frame: 235 },
  { name: "03_s0_twist_crack", frame: 432 },
  { name: "04_s1_nusantara_map", frame: 645 },
  { name: "05_s1_blueprint_69", frame: 810 },
  { name: "06_s1_charter_76", frame: 978 },
  { name: "07_s2_gates_closing", frame: 1345 },
  { name: "08_s2_clutch_nov18", frame: 1625 },
  { name: "09_s2_irm_morph", frame: 1845 },
  { name: "10_s3_reformasi_px", frame: 2085 },
  { name: "11_s3_medan_tanwir", frame: 2410 },
  { name: "12_s3_solo_reborn", frame: 2638 },
  { name: "13_s4_pendopo_work", frame: 2945 },
  { name: "14_s4_rumah_kreatif", frame: 3158 },
  { name: "15_s5_cliff_push", frame: 3485 },
  { name: "16_s5_sejarah_end", frame: 3620 },
];

(async () => {
  console.log("Bundling Remotion for EP02 QA Stills...");
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
      id: "IpmEp02",
      puppeteerInstance: browser,
    });
    console.log(`Composition IpmEp02 duration=${composition.durationInFrames} (${(composition.durationInFrames / 30).toFixed(2)}s)`);
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

  const sh1 = path.join(OUT_DIR, "qa_ep02_sheet1.jpg");
  const sh2 = path.join(OUT_DIR, "qa_ep02_sheet2.jpg");
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
  console.log("QA_EP02_SHEETS_COMPLETE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
