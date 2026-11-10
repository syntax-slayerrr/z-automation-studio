// usage: node scripts/bridge-stills.mjs <outPrefix> <frame,frame,...> [scale]  (bundles once, GPU via ANGLE, jpeg)
import fs from "node:fs";
if (process.env.REMOTION_TMP) { 
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); 
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; 
}
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [prefix = "out/still_", frames = "50", scale = "0.5"] = process.argv.slice(2);
const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };
const entryPoint = path.resolve(process.env.BRIDGE_ENTRY || "remotion/index.ts");
console.log("Bundling entry:", entryPoint);

const serveUrl = await bundle({ entryPoint, publicDir: path.resolve("public") });
console.log("Bundle ready:", serveUrl);

const composition = await selectComposition({ serveUrl, id: "BridgeShort", browserExecutable, chromiumOptions });
console.log("Composition selected:", composition.id, "fps:", composition.fps, "duration:", composition.durationInFrames);

const onBrowserLog = (l) => { 
  console.log(`[browser:${l.type}]`, l.text); 
};

for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  const outPath = `${prefix}${f}.jpg`;
  await renderStill({ 
    composition, 
    serveUrl, 
    frame: f, 
    output: outPath, 
    imageFormat: "jpeg", 
    jpegQuality: 88, 
    scale: Number(scale),
    browserExecutable, 
    chromiumOptions, 
    timeoutInMilliseconds: 180000, 
    onBrowserLog 
  });
  console.log("still", f, "saved to", outPath, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}

