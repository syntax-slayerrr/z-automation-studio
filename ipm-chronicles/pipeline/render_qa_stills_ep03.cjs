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

const OUT_DIR = path.join(PROJECT, "out/ep03/qa");
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const oldFile of fs.readdirSync(OUT_DIR)) {
  if (/\.jpg$/i.test(oldFile)) {
    fs.unlinkSync(path.join(OUT_DIR, oldFile));
  }
}

// Compute scene-exact frame samples directly from alignment.json (~2876 frames = 95.85s)
const ALIGN = JSON.parse(fs.readFileSync(path.join(PROJECT, "src/episodes/ep03/alignment.json"), "utf8"));
const cueFrame = (name, fallback) => {
  const w = ALIGN.words.find((x) => x.cue === name);
  return w ? Math.round(w.start * 30) : fallback;
};

const STILLS = [
  { name: "01_s0_desk_open", frame: 15 },
  { name: "02_s0_tanfidz_close", frame: cueFrame("s0_close", 97) + 16 },
  { name: "03_s0_door_ajar", frame: cueFrame("s0_door", 146) + 22 },
  { name: "04_s0_door_light", frame: cueFrame("s0_hall", 195) + 18 },
  { name: "05_s1_class_ots", frame: cueFrame("s1_class", 252) + 22 },
  { name: "06_s1_board_flow", frame: cueFrame("s1_flow", 399) + 65 },
  { name: "07_s1_ranting_root", frame: cueFrame("s1_basis", 649) + 45 },
  { name: "08_s2_spi_book", frame: cueFrame("s2_spi", 789) + 60 },
  { name: "09_s2_fortasi_page", frame: cueFrame("s2_fortasi", 955) + 32 },
  { name: "10_s2_tm_ladder", frame: cueFrame("s2_tm", 1217) + 60 },
  { name: "11_s2_anisa_sched", frame: cueFrame("s2_sched", 1332) + 38 },
  { name: "12_s3_garut_pulse", frame: cueFrame("s3_1923", 1652) + 28 },
  { name: "13_s3_garut_1958", frame: cueFrame("s3_1958", 1903) + 18 },
  { name: "14_s3_valley_mist", frame: cueFrame("s3_1958", 1903) + 82 },
  { name: "15_s4_panawuan_pdpm", frame: cueFrame("s4_pdpm", 2452) + 35 },
  { name: "16_s4_l03_window_end", frame: cueFrame("s4_bridge", 2612) + 45 },
];

(async () => {
  console.log("Bundling Remotion for EP03 QA Stills...");
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
      id: "IpmEp03",
      puppeteerInstance: browser,
    });
    console.log(`Composition IpmEp03 duration=${composition.durationInFrames} (${(composition.durationInFrames / 30).toFixed(2)}s)`);
    for (const s of STILLS) {
      const f = Math.max(0, Math.min(s.frame, composition.durationInFrames - 1));
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
    // Also render ending title frame cleanly
    const endF = composition.durationInFrames - 15;
    await renderStill({
      composition,
      serveUrl,
      output: path.join(OUT_DIR, `17_s4_endcard_f${endF}.jpg`),
      frame: endF,
      imageFormat: "jpeg",
      jpegQuality: 88,
      puppeteerInstance: browser,
      chromiumOptions: { gl: "angle" },
    });
  } finally {
    await browser.close({ silent: false });
  }

  const sh1 = path.join(OUT_DIR, "qa_ep03_sheet1.jpg");
  const sh2 = path.join(OUT_DIR, "qa_ep03_sheet2.jpg");
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
  console.log("QA_EP03_SHEETS_COMPLETE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
