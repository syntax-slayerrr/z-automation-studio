---
name: 3d-cutaway-explainer
description: >-
  Produce a 100% pure-code Blender-grade 3D Cutaway Engineering & Everyday Science Explainer Short
  (1080x1920 Full HD or 720x1280 9:16 vertical, 60-90s, 30 fps, Remotion + Three.js Pro / React Three Fiber)
  upgrading the viral "Bedah Cara Kerja (@gimanabisaid)" style with Next-Gen 2-Bone Analytical Inverse
  Kinematics (solveTwoBoneIK), Prop-Drives-Hand zero-clipping tool grips, Terrain-Locked Foot IK,
  7 Continuous Choreographed Camera Sequences + Motivated Match-Cuts, Custom GLSL Water & Cumulus Sky
  Shaders, synthetic PMREM HDRI lighting, procedural PBR normal/roughness maps, sculpted LatheGeometry
  wooden mannequin with birch grain & baked crevice AO, clean shadow-only bold white subtitles (ZERO
  TikTok watermarks/end-cards), ElevenLabs Indonesian VO + bespoke Sound-V3 tactile foley + upbeat
  score mastered to -14.8 LUFS, and a Seamless Visual & Verbal Loop returning pixel-identically to
  Frame 0. Use whenever the user asks for a "video bedah cara kerja 3D", "style gimanabisaid",
  "3D cutaway explainer", "kenapa [benda/infrastruktur/alam] dibuat begini", or any 3D educational
  physics/engineering short.
---

# 3D Cutaway Explainer V6 (`3d-cutaway-explainer`) — Three.js Pro + Analytical 2-Bone IK Pipeline

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna awam **TIDAK** perlu mengerti Three.js, Inverse Kinematics, ataupun shader 3D. Cukup ketik 1 kalimat di AI agent mana pun:
> *"Buatkan video gaya **3D Cutaway Explainer** tentang **[Kenapa Sawah di Gunung Dibuat Bertingkat / Kenapa Rel Kereta Pakai Batu Kerikil / Kenapa Jembatan Gantung Tidak Runtuh]**"*

**Instruksi Otomatis untuk AI Agent:**
1. **Jangan suruh pengguna menulis kode!** Tangani seluruh produksi dari nol sampai file `.mp4` selesai secara otonom.
2. Gunakan golden reference terbaru **`remotion/videos/sawah-terasering/`** (`1080×1920` Full HD, Analytical 2-Bone IK, 7 sekuens kamera kontinu) & `sawah-terasering/scripts/` (`build_vo_and_sfx.mjs`, `build_sound_mix.py`, `render_qa_stills.ps1`, `render_sawah_chunks.ps1`) sebagai cetakan biru utama.
3. Jalankan 4 fase wajib tanpa lompat:
   - **Fase 1**: Tulis naskah `brutal-storyteller` (65–75 detik, ~180 kata, `TEMPO = 1.24–1.25`, margin `trimLead = aligned[0].start - 0.14s` agar konsonan awal bebas clipping!) → sintesis VO ElevenLabs `eleven_v4` + 9 SFX `eleven_text_to_sound_v3` + musik Mixkit `-14.8 LUFS` → dengarkan langsung via `read_file`.
   - **Fase 2**: Bangun dunia 3D + `ikSolver.ts` (`solveTwoBoneIK`, `getTerrainY`) + `MannequinProIK.tsx` + `SceneDirector.tsx` + isolated entry `remotion/entry-<slug>.ts`.
   - **Fase 3**: Render **16-Frame Full HD QA Contact Sheet + 2×2 IK Close-Up Audit + Frame 0 vs Final Frame Loop Compare** (`Mean Pixel Diff < 2.0/255`) → inspeksi dengan `read_file` dan perbaiki setiap bug clipping/framing sebelum lanjut!
   - **Fase 4**: Render chunked Full HD (`1080×1920`, `--gl=angle --concurrency=1 --muted`), mux audio, scan integritas frame MP4 terdekode (0 blank frame), dan bersihkan folder temp (`out/chunks`, `out/bundle`).

## Golden References di Repository
- **V6 Flagship (1080×1920 Full HD, 2-Bone Analytical IK, GLSL Water, 7 Continuous Sequences)**: `remotion/videos/sawah-terasering/` & `sawah-terasering/scripts/` (`npm run render:sawah`)
- **V5 Reference (720×1280, Village Infrastructure & Cutaway)**: `remotion/videos/tiang-listrik/` & `tiang-listrik/scripts/` (`npm run render:tiang`)
- **V4 Reference (720×1280, Railway Ballast & Thermal Expansion)**: `remotion/videos/rel-kereta/` & `rel-kereta/scripts/` (`npm run render:rel`)

## Related Skills (Use Together)
- `brutal-storyteller` — Mandatory for crafting the curiosity-chain Indonesian narration ("Rantai Jawab-Tanya", concrete numbers, everyday analogy, zero boring textbook openings).
- `remotion` / `remotion-best-practices` — Composition registration, deterministic `useCurrentFrame()` driving, pre-bundled chunk rendering.
- `real-sound` / `sound-effects` — Tactile mechanical foley locked to every physical impact/transition + upbeat curious acoustic/pizzicato score (`-14.8 LUFS`).
- `short-form-video` — First-3-second physical curiosity hook + seamless visual & verbal loop back to Frame 0.

## Non-Negotiable Visual, Lighting, Animation & Loop Standards

1. **Synthetic HDRI / PMREM Image-Based Lighting (Zero Flat Ambient!)**:
   - Every scene MUST build a runtime `PMREMGenerator` environment map matching the active mood (`day`, `heat`, `rain`, `cold`, `golden_hour`) and assign it to `scene.environment`. Metallic steel, rails, bolts, porcelain, water, and skin immediately gain realistic sky reflections and warm ground bounce.
2. **Procedural PBR Texture Triplets (`map` + `normalMap` + `roughnessMap`)**:
   - Never ship bare solid-color meshes for hero surfaces! Generate deterministic Canvas2D albedo + Sobel height-to-normal (`normalMap`) + `roughnessMap` for soil strata, gravel/ballast stones, weathered concrete, steel, wood grain, painted stucco, and terracotta roof tiles. See [`references/style-and-lighting-bible.md`](./references/style-and-lighting-bible.md).
3. **Custom GLSL Sky Dome & Soft Volumetric Clouds (Zero Flat White Rectangles!)**:
   - Render a large background sky sphere/dome using a custom GLSL `ShaderMaterial` combining Rayleigh zenith→horizon scattering, warm directional sun Mie glow, and multi-octave smooth FBM drifting cumulus clouds.
4. **Grounded Shadows + Contact AO Decals + ANGLE-Safe Macro 85mm Bokeh**:
   - Use `shadows="percentage"` (`2048x2048`, tight camera frustum, `shadow-bias={-0.0005}`, `shadow-normalBias={0.045}` to eliminate 100% of joint shadow acne!) PLUS soft radial contact-shadow AO decals beneath feet, wheels, sleepers, props, and structures.
   - **CRITICAL ANGLE RULE**: **NEVER use `@react-three/postprocessing` `<EffectComposer>` + `<DepthOfField>`** in headless Remotion Chromium (`--gl=angle`) — it hijacks R3F's render loop and outputs solid blank WebGL frames! Instead, use a dedicated **Macro 85mm Gaussian-Blurred Canvas2D Bokeh Backdrop Plane** (`ctx.filter = "blur(14px–18px)"`) directly behind razor-sharp 3D PBR hero props on macro shots (`#2, #18, #20, #21`) plus additive radial glow sprites (`THREE.AdditiveBlending`) and a subtle CSS cinema lens vignette!
5. **1:1 Stylized Wooden Mannequin & Organic Diorama Modeling**:
   - **Character Silhouette**: Tapered flat-front rounded shirt torso (NEVER a fat capsule pill), seamless rounded sleeves seated flush on shoulders (ZERO gaps), sculpted shorts with **TWO SEPARATE FITTED LEG CUFFS** rotating inside each leg group (NEVER a solid cylinder bucket skirt!), bright sunlit peach-tan birch face (`#E6AE80`) with cute parted bangs & small glossy bead eyes (NO heavy angry block eyebrows!), headgear with `castShadow={false}` so faces NEVER go pitch-black under brims, and `castShadow={false}` on tiny knee/elbow ball joints to eliminate shadow-acne rings.
   - **Environment & Cutaway Fidelity**: Center hero building/focal landmark behind the cutaway (ZERO awkward blank horizon gaps), scalloped clay roof tiles (`genteng`), weathered stucco walls, dense split-bamboo/wood fencing, asymmetric multi-layered sunlit tropical trees, and painterly 4-horizon geological soil cutaways with **thin organic warm tan-brown capillary roots (`#B8926A`, opacity 0.7)** + **small matte beige pebbles** (NEVER thick bright white spiderweb roots, NEVER giant metallic concave pebbles, NEVER polygonal rock meatballs lined along the cutaway edge!).
6. **Motivated Continuous Camera Motion (~80% of Shots) & Smooth Transitions**:
   - All camera moves are 100% deterministic from `frame` (NEVER stateful iterative `lerp()` inside `useFrame`!). Apply gentle smooth push-ins, crane-ups, tracking hoists, diagonal mold orbits, impact micro-shakes, and smooth continuous weather/dusk lighting blends (`rainFactor`, `duskFactor` `0..1`) rather than frozen tripod shots or harsh sky snaps.
7. **Clean Progressive Typography, Upper Technical Badges & ZERO Watermarks**:
   - Progressive **word-by-word type-on** bold white sans-serif subtitles (`#FAF7F0`, `fontWeight: 800`, crisp soft drop-shadow, **ZERO opaque dark boxes**) at `top: 74.8%`.
   - Clean floating upper-sky technical badges (`top: 12.5%`, e.g., `"Isolator"`, `"Andongan"`, `"Beton pratekan"`), T-capped yellow dimension bars (`#FFD740`), crisp white leader lines (`#FFFFFF`), animated thermometers/wind arrows, and bold shaded force arrows (`#E53935` red, `#3898FF` blue, `#FFCB2E` yellow).
   - **HARD RULE**: **NEVER render any TikTok logo, `@handle` watermark, or platform outro card!**
8. **Mandatory Seamless Visual Loop Ending & Isolated Entry Bundling**:
   - The final beat (`last 2.5–4.0s`) smoothly glides camera, continuous sunrise lighting (`duskFactor: 1 → 0`), and scene props back to the **EXACT framing, pose, and lighting of Frame 0**, while the final spoken line bridges grammatically back into the opening hook.
   - Always register a dedicated single-composition isolated Remotion entry (`remotion/entry-<slug>.ts` + `Root.tsx`) when bundling on Windows to avoid monorepo V8 heap OOMs (`4s` bundle vs OOM crash).

## End-to-End 8-Beat Production Arc ("Bedah Cara Kerja")

Adapt all 8 beats to any engineering/infrastructure/science topic (e.g., railway ballast & expansion gaps, suspension bridges, chicken-claw foundations, airplane wings, septic tanks, dams):

1. **Beat 1 — Physical Hook (`0–5s`)**: Iconic diorama cutaway establishing shot + tactile action immediately raising a counter-intuitive question (*"Kenapa [objek] nggak dibuat mulus/polos aja?"*). **Frame 0 = Loop Anchor!**
2. **Beat 2 — The Naive Attempt (`5–14s`)**: Show what happens if you build it the "obvious/simple" way (e.g., rail laid straight on bare dirt / seamless welded rail with zero gap).
3. **Beat 3 — Catastrophic Physics Failure (`14–26s`)**: Heavy load, heat, rain, or wind hits → animated 3D force arrows (`#E53935` red) reveal *why* it fails (sinking, buckling, snapping, rotting) right inside the cutaway!
4. **Beat 4 — Cutaway Engineering Solution #1 (`26–42s`)**: Crane-down / macro close-up with shallow DOF revealing the hidden geometry/material trick (e.g., sharp angular crushed granite ballast locking together under load, spreading pressure into a wide pyramid cone).
5. **Beat 5 — Everyday Tactile Analogy (`42–56s`)**: Cut to the character behind a wooden table demonstrating the physics with a vivid everyday object (e.g., stepping on round marbles vs angular Lego/gravel, or squeezing a row of colorful books!).
6. **Beat 6 — Hidden Twist / Secondary Hazard (`56–70s`)**: Temperature/weather swing (blazing sun heat glow vs freezing cold) showing the second failure mode (e.g., steel rail thermal expansion buckling into a snake-wave *"sun kink"*!).
7. **Beat 7 — Engineering Solution #2 + Full System Harmony (`70–84s`)**: Macro cutaway reveal of the second mechanism (expansion joint gap + fishplate bolts / Pandrol clips / modern continuous welded rail tensioning) working together as a full train / load glides smoothly overhead!
8. **Beat 8 — Seamless Return Loop (`84–92s`)**: Smooth camera & sky glide back to the **exact Frame 0 diorama composition & pose**, paying off the curiosity loop and verbally bridging directly back into Beat 1!

## Production Phases & Mandatory Quality Gates

### Phase 0 — Script (`brutal-storyteller`) & Art Bible
1. Write the Indonesian narration using `brutal-storyteller` (conversational, specific numbers, zero textbook jargon, seamless verbal loop ending → opening).
2. Copy [`templates/art-bible.template.json`](./templates/art-bible.template.json) to `<slug>/art-bible.json` defining color/lighting presets, PBR textures, hero props, character outfit, and camera choreography.

### Phase 1 — Audio-First VO, Tactile Sound-V3 Foley & Upbeat Score
Follow [`references/audio-and-render-qa.md`](./references/audio-and-render-qa.md):
1. Generate ElevenLabs `eleven_v4` Indonesian VO (`convertWithTimestamps`, cached by SHA-1 hash, Indonesian acronym pronunciation shield) → exports exact `story.ts` timing cues & clean sanitized subtitles.
2. Listen directly (`read_file`) to any sensitive Indonesian words/numbers to verify 100% clean pronunciation.
3. Generate 8–10 bespoke tactile mechanical SFX via ElevenLabs `eleven_text_to_sound_v3` + curated CC0 impacts + licensed upbeat Mixkit score → mix with anti-masking EQ & sidechain ducking → master to **`-14.8 LUFS`**, `TP <= -1.5 dBFS`.

### Phase 2 — Three.js Pro Vertical Slice Gate (Shots 1–3 + Macro Test)
1. Implement `proEnvironment.ts` (PMREM HDRI + GLSL Sky Dome), `pbrMaterials.ts` (albedo + Sobel normal + roughness maps), diorama terrain cutaway, character rig, and hero props.
2. Run `npx tsc --noEmit` → zero errors in `<slug>`.
3. Bundle once (`npx remotion bundle`), render 6 key stills (opening, failure arrows, macro DOF close-up, analogy table, thermal/weather twist, final loop frame), inspect visually via `read_file`, and polish lighting/shadows/composition until Blender-grade!

### Phase 3 — Full Pre-Flight QA, Chunked Render & Final Verification
1. Assemble a **12-Frame Pre-Flight Contact Sheet** (including side-by-side **Frame 0 vs Final Frame** seamless loop verification!).
2. Render full MP4 via pre-bundled resumable chunks (`~320 frames/chunk`, `--gl=angle --concurrency=1 --muted`), concat lossless + mux `-c:a copy` + `-movflags +faststart`.
3. Verify final MP4 with `ffprobe` (exact frame count, 30 fps, `bt709`), Stereo & Mono `ebur128`, and decoded frame spot-checks via `read_file`, then clean temp chunks & bundle folders.
