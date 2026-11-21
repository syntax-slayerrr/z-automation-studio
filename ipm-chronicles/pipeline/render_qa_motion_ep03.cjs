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

const OUT_DIR = path.join(PROJECT, "out/ep03/qa_motion");
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) {
  if (/\.jpg$/i.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
}

const ALIGN = JSON.parse(fs.readFileSync(path.join(PROJECT, "src/episodes/ep03/alignment.json"), "utf8"));
const cueFrame = (name, fallback) => {
  const w = ALIGN.words.find((x) => x.cue === name);
  return w ? Math.round(w.start * 30) : fallback;
};

// Transition & motion smoothness bursts across doorway push, OTS rack focus, SPI cover fold, Garut pulse, Panawuan pullback
const FRAMES = [
  { name: "b01_s0_tanfidz_mid", frame: cueFrame("s0_close", 97) + 4 },
  { name: "b02_s0_door_half", frame: cueFrame("s0_door", 146) + 12 },
  { name: "b03_s0_door_exit", frame: cueFrame("s0_hall", 195) + 30 },
  { name: "b04_s1_entry_desk", frame: cueFrame("s1_class", 252) + 8 },
  { name: "b05_s1_chalk_mid", frame: cueFrame("s1_flow", 399) + 32 },
  { name: "b06_s2_cover_hinge", frame: cueFrame("s2_spi", 789) + 28 },
  { name: "b07_s3_map_pulse1", frame: cueFrame("s3_1923", 1652) + 10 },
  { name: "b08_s4_pullback", frame: cueFrame("s4_bridge", 2612) + 80 },
];

(async () => {
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT, "src/index.ts"),
    publicDir: path.join(PROJECT, "public"),
  });
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  try {
    const composition = await selectComposition({ serveUrl, id: "IpmEp03", puppeteerInstance: browser });
    for (const s of FRAMES) {
      const f = Math.max(0, Math.min(s.frame, composition.durationInFrames - 1));
      await renderStill({
        composition,
        serveUrl,
        output: path.join(OUT_DIR, `${s.name}.jpg`),
        frame: f,
        imageFormat: "jpeg",
        jpegQuality: 88,
        puppeteerInstance: browser,
        chromiumOptions: { gl: "angle" },
      });
      console.log(`Motion QA frame ${s.name} (f=${f})`);
    }
  } finally {
    await browser.close({ silent: false });
  }

  const outSheet = path.join(OUT_DIR, "qa_ep03_motion_burst.jpg");
  const inputs = FRAMES.map((s) => `-i "${path.join(OUT_DIR, s.name + ".jpg")}"`).join(" ");
  const tiles = FRAMES.map(
    (s, i) =>
      `[${i}:v]scale=420:746,drawbox=x=0:y=0:w=iw:h=34:color=black@0.72:t=fill,` +
      `drawtext=text='${s.name} (f${s.frame})':x=10:y=9:fontsize=16:fontcolor=#fbbf24[v${i}]`
  ).join(";");
  const stack = `${FRAMES.map((_, i) => `[v${i}]`).join("")}xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0[out]`;
  execSync(`ffmpeg -y -loglevel error ${inputs} -filter_complex "${tiles};${stack}" -map "[out]" -q:v 3 "${outSheet}"`, {
    stdio: "inherit",
  });
  console.log("QA_EP03_MOTION_COMPLETE");
})();
