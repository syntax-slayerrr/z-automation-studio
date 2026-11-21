const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const PROJECT = path.resolve(__dirname, "..");
const ROOT = path.resolve(PROJECT, "..");
const { bundle } = require(path.join(ROOT, "node_modules/@remotion/bundler"));
const {
  openBrowser,
  selectComposition,
  renderStill,
  renderMedia,
} = require(path.join(ROOT, "node_modules/@remotion/renderer"));

const TEMP_DIR = path.join(ROOT, ".cache", "remotion-temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;
process.env.TMPDIR = TEMP_DIR;

const QA_DIR = path.join(PROJECT, "out/poc/qa");
const OUT_MP4 = path.join(PROJECT, "out/poc/poc_v3_master.mp4");
fs.mkdirSync(QA_DIR, { recursive: true });

const STILLS = [
  { name: "f000_enter", frame: 0 },
  { name: "f045_walk", frame: 45 },
  { name: "f090_place", frame: 90 },
  { name: "f135_turn", frame: 135 },
  { name: "f175_gaze", frame: 175 },
];

const qaOnly = process.argv.includes("--qa-only");

(async () => {
  console.log("Bundling Remotion for PoCShotV3...");
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
      id: "PoCShotV3",
      puppeteerInstance: browser,
    });
    console.log(`Composition PoCShotV3 duration=${composition.durationInFrames} (${(composition.durationInFrames / 30).toFixed(2)}s)`);

    for (const st of STILLS) {
      const f = Math.min(st.frame, composition.durationInFrames - 1);
      const outPath = path.join(QA_DIR, `${st.name}.jpg`);
      await renderStill({
        composition,
        serveUrl,
        output: outPath,
        frame: f,
        imageFormat: "jpeg",
        jpegQuality: 92,
        puppeteerInstance: browser,
        chromiumOptions: { gl: "angle" },
      });
      console.log(`Rendered still ${st.name} (f=${f})`);
    }

    if (!qaOnly) {
      console.log("Rendering full 6s master preview MP4...");
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: OUT_MP4,
        crf: 17,
        pixelFormat: "yuv420p",
        chromiumOptions: { gl: "angle" },
        concurrency: 2,
      });
      const mb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
      console.log(`POC_V3_RENDER_COMPLETE file=${OUT_MP4} size=${mb} MB`);
    }
  } finally {
    await browser.close({ silent: false });
  }

  // Build 5-frame sequence sheet + 2x2 macro detail crops via Python PIL (fast, reliable on Windows)
  const tmpPy = path.join(TEMP_DIR, "build_poc_qa.py");
  fs.writeFileSync(
    tmpPy,
    `from pathlib import Path
from PIL import Image, ImageDraw
qa = Path(r"${QA_DIR}")
files = ["f000_enter.jpg", "f045_walk.jpg", "f090_place.jpg", "f135_turn.jpg", "f175_gaze.jpg"]
imgs = [Image.open(qa / fn) for fn in files]

strip = Image.new("RGB", (2100, 786), (18, 13, 9))
d = ImageDraw.Draw(strip)
for i, (fn, im) in enumerate(zip(files, imgs)):
    thumb = im.resize((420, 746), Image.Resampling.LANCZOS)
    strip.paste(thumb, (i * 420, 40))
    d.text((i * 420 + 12, 12), fn, fill=(255, 215, 130))
strip.save(qa / "qa_poc_v3_sequence.jpg", quality=92)

zooms = [
    ("ZOOM 1: Face/Rim/Gouache Texture (f175)", imgs[4].crop((340, 1020, 760, 1440))),
    ("ZOOM 2: Arm & Folder on Desk (f090)", imgs[2].crop((420, 1100, 920, 1460))),
    ("ZOOM 3: Shoes & Desk Legs Grounding (f090)", imgs[2].crop((400, 1320, 1040, 1660))),
    ("ZOOM 4: Open Door/Window World (f135)", imgs[3].crop((280, 640, 900, 1160))),
]
zsheet = Image.new("RGB", (1400, 1060), (20, 14, 10))
zd = ImageDraw.Draw(zsheet)
for idx, (lbl, cr) in enumerate(zooms):
    cx, cy = (idx % 2) * 700 + 20, (idx // 2) * 530 + 36
    cr_r = cr.copy()
    cr_r.thumbnail((660, 470), Image.Resampling.LANCZOS)
    zsheet.paste(cr_r, (cx, cy))
    zd.text((cx, cy - 24), lbl, fill=(255, 218, 135))
zsheet.save(qa / "qa_poc_v3_zoom.jpg", quality=92)
print("QA_SHEETS_OK")
`,
    "utf8"
  );
  execSync(`python "${tmpPy}"`, { stdio: "inherit" });
})();
