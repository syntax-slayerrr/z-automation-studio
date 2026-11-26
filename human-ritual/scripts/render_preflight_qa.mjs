/**
 * Pre-Flight Visual QA Contact Sheet Generator for HumanRitualShort.
 * Pre-bundles Remotion ONCE -> renders 18 critical storyboard frames across Scenes 1..7 ->
 * stitches into a crisp 6x3 labeled contact sheet (`human-ritual/out/preflight_contact_sheet.jpg`).
 *
 * Run:
 *   node human-ritual/scripts/render_preflight_qa.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");
const BUNDLE_DIR = join(PROJECT, ".bundle");
const TMP_DIR = join(PROJECT, ".tmp");
const STILLS_DIR = join(PROJECT, ".preflight_stills");
const OUT_SHEET = join(PROJECT, "out", "preflight_contact_sheet.jpg");
const ALIGN_JSON = join(PROJECT, "audio", "alignment.json");

mkdirSync(TMP_DIR, { recursive: true });
mkdirSync(STILLS_DIR, { recursive: true });
mkdirSync(join(PROJECT, "out"), { recursive: true });

const env = { ...process.env, TEMP: TMP_DIR, TMP: TMP_DIR };
const align = JSON.parse(readFileSync(ALIGN_JSON, "utf8"));
const s = align.scenesFrame;
const c = align.cuesFrame;
const total = align.totalFrames;

// 18 critical storyboard frames covering every single shot, transition & title card!
const shots = [
  { label: "01 S1 Hook Laces (f0)",        frame: 0 },
  { label: "02 S1 Retie Pattern",          frame: Math.min(c.s1_bracelet - 22, 130) },
  { label: "03 S1 Athlete Bracelet",       frame: c.s1_bracelet + 24 },
  { label: "04 S1 3-Era Montage",          frame: c.s1_montage + 42 },
  { label: "05 S2 Wedding Vessel",         frame: s.s2Start + 46 },
  { label: "06 S2 Community Adat",         frame: c.s2_community + 34 },
  { label: "07 S2 Funeral & Circle",       frame: c.s2_funeral + 40 },
  { label: "08 S2->S3 Sacred Circle",      frame: c.s2_circle + 28 },
  { label: "09 S3 Chaos & Threats",        frame: c.s3_threats + 28 },
  { label: "10 S3 Ritual Order",           frame: c.s3_order + 46 },
  { label: "11 S4 Brain Neurons",          frame: s.s4Start + 48 },
  { label: "12 S4 Hobson Control ERN",     frame: c.s4_exp_err + 36 },
  { label: "13 S4 Hobson Post-Ritual",     frame: c.s4_exp_ritual + 52 },
  { label: "14 S5 Community Sync",         frame: c.s5_group + 46 },
  { label: "15 S5 Aerial Mandala",         frame: c.s5_aerial + 46 },
  { label: "16 S6 Child Imitate Era",      frame: c.s6_imitate + 52 },
  { label: "17 S6 Four Generations",       frame: c.s6_generations + 46 },
  { label: "18 S7 Silhouette & Title",     frame: total - 42 },
];

console.log("=== [1/3] Pre-bundling Remotion project ONCE ===");
if (existsSync(BUNDLE_DIR)) rmSync(BUNDLE_DIR, { recursive: true, force: true });
execFileSync(
  "npx.cmd",
  ["remotion", "bundle", join(ROOT, "remotion", "index.ts"), "--out-dir", BUNDLE_DIR],
  { env, stdio: "inherit", shell: true }
);

console.log(`\n=== [2/3] Rendering ${shots.length} pre-flight QA stills ===`);
const stillPaths = [];
for (let i = 0; i < shots.length; i++) {
  const sh = shots[i];
  const fClamp = Math.max(0, Math.min(total - 1, Math.round(sh.frame)));
  const outPng = join(STILLS_DIR, `s_${String(i).padStart(2, "0")}.png`);
  console.log(`  [${i + 1}/${shots.length}] f=${fClamp} -> ${sh.label}`);
  execFileSync(
    "npx.cmd",
    ["remotion", "still", BUNDLE_DIR, "HumanRitualShort", outPng, `--frame=${fClamp}`, "--log=error"],
    { env, stdio: "inherit", shell: true }
  );
  stillPaths.push({ path: outPng, label: `${sh.label} [f=${fClamp}]` });
}

console.log("\n=== [3/3] Stitching 6x3 Contact Sheet ->", OUT_SHEET);
const pyCode = `
import cv2, json, sys, numpy as np
items = json.loads(sys.argv[1])
out_path = sys.argv[2]
cols, rows = 6, 3
tw, th = 320, 569
pad = 10
hdr = 28
W = cols * tw + (cols + 1) * pad
H = rows * (th + hdr) + (rows + 1) * pad
sheet = np.full((H, W, 3), 20, dtype=np.uint8)
for idx, it in enumerate(items):
    r, c = divmod(idx, cols)
    img = cv2.imread(it["path"])
    if img is None:
        continue
    res = cv2.resize(img, (tw, th), interpolation=cv2.INTER_AREA)
    x0 = pad + c * (tw + pad)
    y0 = pad + r * (th + hdr + pad)
    cv2.rectangle(sheet, (x0, y0), (x0 + tw, y0 + hdr), (36, 22, 46), -1)
    cv2.putText(sheet, it["label"], (x0 + 6, y0 + 19), cv2.FONT_HERSHEY_SIMPLEX, 0.43, (246, 226, 175), 1, cv2.LINE_AA)
    sheet[y0 + hdr : y0 + hdr + th, x0 : x0 + tw] = res
cv2.imwrite(out_path, sheet, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
print("SAVED:", out_path)
`;
execFileSync("python", ["-c", pyCode, JSON.stringify(stillPaths), OUT_SHEET], { stdio: "inherit" });
