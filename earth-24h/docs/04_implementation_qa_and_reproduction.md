# PHASE 6–10, V4, V5 & V6 (SHADOW-BOX LIGHTING & DEPTH CRAFT) — TECHNICAL IMPLEMENTATION, QA & REPRODUCTION REPORT

## 1. Dual-Pipeline Modular Architecture (`earth-24h/` + `remotion/`)

Both **Python Engine (`earth-24h/`)** and **Remotion Studio (`remotion/videos/earth-24h/`)** share deterministic procedural painterly & shadow-box layers built without video screenshot cutouts:

```text
earth-24h/
├── ref.mp4                              # Original Ground-Truth Reference Video (720x1280, 30fps, 1194 frames)
├── topics/
│   └── earth_24h.json                   # Declarative Topic & Timeline Specification (reusable for new topics)
├── assets/
│   ├── vector_shapes.json               # Extracted 2D Vector Polygon Contours
│   └── layers/                          # Shared V6 Shadow-Box, Motivated-Lighting & Multi-Plane Sprites
│       ├── clock_plate_v6.png           # 3.0x (2460x2460) Directional 3D Gold Scallops, Groove AO & Inward Cast Shadow
│       ├── gear_{tl_lg,br_lg}.png       # Far-Plane Antique Bronze Gears (muted depth blur + backdrop shadow)
│       ├── gear_{tl_md,br_md}.png       # Near-Plane Sunlit Brass Gears (directional key light + deep shadow)
│       ├── bronto_layer.png             # Smooth B-Spline Brontosaurus w/ Upward-Only Lavender Rim Light
│       ├── trex_layer.png               # Re-Sculpted Slender T-Rex (neck, open jaw, forearms, stride)
│       ├── bronto_lit_v6.png            # Motivated Warm Orange Comet Rim-Light Mask for Brontosaurus
│       ├── trex_lit_v6.png              # Motivated Warm Orange Comet Rim-Light Mask for T-Rex
│       ├── fallen_dino_v6.png           # Fallen Extinction Dinosaur Silhouette on Foreground Hill (f>=944)
│       ├── palms_far_v6.png             # Hazy Far-Plane Atmospheric Palms (low contrast + soft mist blur)
│       ├── palms_near_v6.png            # Velvety Foreground Prehistoric Cycad Palms
│       ├── palms_backlight_v6.png       # Optical Warm Orange Edge Light-Wrap Clipped Inside Foreground Palms
│       ├── ocean_backdrop_v6.png        # Gouache Deep-Teal Ocean + Canopy Cast Shadow + Far DoF Microbes + 2-Tier Seabed
│       ├── molten_sphere_v6.png         # Incandescent Subsurface Core + Tapered Branching Magma Rivers
│       ├── molten_frame_v6.png          # Proscenium Curved Side Framing Curtains w/ Bevel & Cast Shadow
│       ├── molten_clouds_v6_{back,front}.png # 2-Tier Parallax Volcanic Clouds w/ Bounced Orange Rim Light
│       ├── asteroid_plume_v6.png        # Billowing Cosmic Lavender Plume w/ Comet-Lit Right Flank
│       ├── dust_clouds_v6.png           # Multi-Tier Backlit Terracotta Dust Bank + 3 Tiny Fleeing Dinos
│       └── twilight_palms_vp.png        # Painterly Twilight Palms for Scene 6/7 Dial Viewport
├── src/
│   ├── painterly_fx.py                  # FBM Gouache Noise, Screen Blend, Directional Light, Edge-Wrap & Tapered Rivers
│   ├── clock_rig.py                     # V6 Shadow-Box Dial, 2-Plane Gears, Metallic Spade Hands, 3D Specular Pin & 6 DETIK Bloom
│   ├── scenes.py                        # V6 Multi-Plane Lighting, Motivated Comet Re-Lighting, Ground Mist & Embers
│   ├── typography.py                    # Tracked Lining Serif Headers (cx=333.0) & Cardstock Deckle-Edge Subtitle Cards
│   └── render_video.py                  # Deterministic Orchestrator (synced 320.4°->360° sec hand & subtle corner vignette)
├── scripts/
│   ├── build_layered_assets.py          # Shared V6 Painterly Asset & Smooth SVG Bezier Builder (Python + Remotion sync)
│   └── qa_compare.py                    # Automated Visual QC (SSIM, PSNR, MAE, RMSE, Contact Sheets & Quad Video)
└── out/
    ├── remotion_earth24h.mp4            # Remotion V6 Final Video (remotion_earth24h_v6.mp4, 720x1280, 30fps, 1194f, 3.85 Mbps)
    ├── reconstructed.mp4                # Python V6 Final Video (reconstructed_v6.mp4, 720x1280, 30fps, 1194f, 6.07 Mbps)
    ├── comparison_quad.mp4              # 4-Panel Synchronized Comparison Video (Remotion V6 vs Reference)
    ├── qa_contact_sheet_v1..v6.jpg      # Keyframe Contact Sheets (incl. qa_contact_sheet_remotion_v6.jpg)
    └── qa_metrics_v1..v6.json           # Per-Iteration Metrics JSON (incl. qa_metrics_remotion_v6.json)
```

Shared Remotion assets & composition:
- `d:\PROJECTS\z-automation-studio\public\earth-24h\layers\*.png` + `d:\PROJECTS\z-automation-studio\public\earth-24h\audio.m4a`
- `d:\PROJECTS\z-automation-studio\remotion\videos\earth-24h\Earth24Hours.tsx` (includes `<DecklePaperCard>` torn-parchment SVG, feathered SVG comet corona, motivated comet re-lighting, 2-plane parallax clouds/palms, and memory-optimized SVG shadows)
- `d:\PROJECTS\z-automation-studio\remotion\videos\earth-24h\story.ts` & `painterlyVectors.ts`
- Registered in `d:\PROJECTS\z-automation-studio\remotion\Root.tsx` as composition `Earth24HoursShort`.

---

## 2. Iterative Quality Control Progression (`v1 -> v6`, All 1,194 Frames)

Every iteration was evaluated objectively across all `1,194` frames against [ref.mp4](file:///d:/PROJECTS/z-automation-studio/earth-24h/ref.mp4):

| Iteration / Engine | Global Mean SSIM | Global Mean PSNR (dB) | Global Mean MAE (0–255) | Global Mean RMSE (0–255) | Key Architectural & Visual Upgrades |
|---|---:|---:|---:|---:|---|
| **`v1`** (Python PIL) | `0.5700` | `13.40 dB` | `35.83` | `56.76` | Initial parametric clock (`cy=601`), Georgia serif, thresholded polygons. |
| **`v2`** (Python PIL) | `0.5875` | `14.23 dB` | `31.23` | `51.29` | Lining serif (`Times Bold`), continuous camera push-in, geometric microbes, twilight dial. |
| **`v3`** (Python PIL) | `0.5897` | `14.69 dB` | `30.32` | `49.19` | Header cap-height & card dimensions calibration, early close-up dial. |
| **`v4`** (Python 3x/2x) | `0.5867` | `15.06 dB` | `28.48` | `46.45` | `3x` static dial, radial upright human in `6 DETIK`, `cx=333` headers, Scene 7 pull-out calibration, exact microbes, low Scene 2 clouds, palms front of dust. |
| **`v4_r3`** (Python Calib.) | `0.5876` | `15.12 dB` | `27.94` | `45.85` | Scene 3 (`f=427..442`, `560..572`) & Scene 7 (`f=1149..1170`) transition timing fix + pre-molten dusk blend + 2-frame cardstock ink fade. |
| **`v5` (Python Painterly)** | `0.5981` | `15.27 dB` | **`27.59`** | `45.07` | Smooth B-spline dinos + top-only rim light, FBM gouache textures, Screen magma/ocean/asteroid blooms, calibrated Cycle 1/2 Day-Night dial, dark sepia `6 DETIK`. |
| **`v5` (Remotion Studio)** | **`0.6482`** | **`15.30 dB`** | `27.83` | **`44.80`** | Highest strict pixel-similarity baseline (shared painterly layers + SVG Bezier + Chromium compositing). |
| **`v6` (Python Shadow-Box)** | `0.5886` | `15.14 dB` | `28.33` | `45.72` | V6 Studio Lighting & Depth Craft + post-QA fixes (detik 19 `f=572..579` counter clamp & smooth `04:07` continuity; Scene 1 full 360° `24.0h` wrap w/ 24:1 geared hands & `22.78h` teal→purple era breakpoint). |
| **`v6` (Remotion Studio)** | **`0.6394`** | **`15.28 dB`** | `28.24` | **`44.88`** | Full V6 Shadow-Box & Lighting Craft + deckle parchment cards + feathered comet + post-QA fixes (detik 19 & Scene 1 full 360° 24h wrap, `18.24 MiB`, `3.85 Mbps`). |

### Per-Scene Quantitative Breakdown (`v5 Remotion` vs `v6 Remotion` vs `v6 Python`)

| Scene | Frame Range | `v5 Remotion` (SSIM / PSNR / MAE) | `v6 Remotion` (SSIM / PSNR / MAE) | `v6 Python` (SSIM / PSNR / MAE) |
|---|---|---|---|---|
| **Scene 1** (Hook & 24h Spin) | `0000..0238` | `0.5933` / `15.11 dB` / `25.74` | `0.5863` / `15.09 dB` / `25.96` (`f=60: SSIM 0.603`) | `0.5242` / `14.65 dB` / `27.74` |
| **Scene 2** (`00.00` Molten Earth) | `0239..0430` | `0.7136` / `16.01 dB` / `25.01` | **`0.7073`** / `15.82 dB` / `26.82` (`f=270: SSIM 0.767`) | `0.6509` / `15.59 dB` / `27.03` (`f=270: SSIM 0.706`) |
| **Scene 3** (`±04.00` Primordial Ocean) | `0431..0568` | `0.6511` / `14.62 dB` / `28.83` | `0.6413` / **`14.83 dB`** / **`28.73`** (`f=480: 15.2 dB`) | `0.6015` / `14.76 dB` / `29.41` |
| **Scene 4** (`04.07->22.47` Dinos) | `0569..0844` | `0.6457` / `15.96 dB` / `25.54` | `0.6361` / **`16.00 dB`** / `25.79` (`f=780: 18.1 dB`) | `0.5858` / `15.90 dB` / `24.97` (`f=780: 18.0 dB`) |
| **Scene 5** (`23.39` Asteroid Streak) | `0845..0924` | `0.7190` / `16.54 dB` / `25.52` | **`0.7043`** / `16.20 dB` / `26.51` | `0.6723` / `16.68 dB` / `21.80` |
| **Scene 6** (Extinction & `6 Detik`) | `0925..1129` | `0.6382` / `14.25 dB` / `34.92` | `0.6297` / **`14.27 dB`** / **`34.70`** (`f=965: SSIM 0.740`) | `0.5812` / `14.21 dB` / `35.17` |
| **Scene 7** (`24.00` Midnight Pull-Out) | `1130..1193` | `0.6048` / `14.33 dB` / `31.90` | `0.5932` / **`14.34 dB`** / `31.92` (`f=1185: 15.0 dB`) | `0.5450` / `14.23 dB` / `32.86` |

---

## 3. Transparent Technical Notes (`V5` vs `V6`)

1. **Perceptual Studio Craft vs Pixel-Strict SSIM Trade-Off**: Adding physical *paper-cut shadow-box* depth (inward dial cast shadow, 3D directional bezel lighting, far-plane DoF ocean microbes, misty background palms, valley fog, ascending embers/ash, and corner vignette) noticeably deepens perceived dimensionality, specular lighting, and realism across all 7 scenes while shifting mean global SSIM by ~`-0.009` (`0.6482 -> 0.6394` in Remotion; `0.5981 -> 0.5886` in Python) because those richer lights/particles/shadows add localized luminance deltas against `ref.mp4`. Both `reconstructed_v5.mp4` and `remotion_earth24h_v6.mp4` / `reconstructed_v6.mp4` are retained in `earth-24h/out/`.
2. **Post-QA Forensic Bugfixes (Applied to Both Remotion & Python)**:
   - **Detik 19 (`f=572..579`) Clock Jump Bug**: `formatMicrobeCounter` (`story.ts`) & `format_microbe_counter` (`typography.py`) lacked a lower-bound guard for `f < 580`, causing an 8-frame fallback jump to `22:47` before snapping back to `04:07`. Fixed with lower-bound clamp, refined `f=580..600` waypoints (`04.07 -> 04.08 -> 04.12 -> 04.16 -> 04.26 -> 04.42`), and smooth `04:07` pull-out hand/arc continuity across `f=560..580`.
   - **Scene 1 Full 360° 24-Hour Clock Wrap (`f=0..234`)**: Removed artificial `22.0h` / `20.4h` caps on `eraHours` so both Cycle 1 (`f=0..51`) and Cycle 2 (`f=52..203`, *"dipadatkan jadi satu hari"*) sweep a complete 360° ring (`24.0h`) with true 24:1 geared minute/hour hands before smoothly unwinding `24.0 -> 0.0` (`f=203..220`). Also calibrated the teal→purple era breakpoint from `21.0h` to `22.78h` (`22:47`, matching `ref.mp4` across Scenes 1, 4, and 6 `f=1095`).
3. **Low `C:` Free Disk & Memory Optimization**: When rendering Remotion on systems with low `C:` free space, point `$env:TEMP` and `$env:TMP` to `D:` and run with `--concurrency=2` (`Earth24Hours.tsx` already removes redundant scaled CSS/SVG filter buffers so full 1,194-frame renders complete smoothly with zero Chrome OOM).

---

## 4. Reproduction Commands

### A. Regenerate Shared V6 Painterly & Shadow-Box Layers (Python + Remotion Sync)
```powershell
python "d:\PROJECTS\z-automation-studio\earth-24h\scripts\build_layered_assets.py"
```

### B. Render & Validate Remotion Studio V6 (`Earth24HoursShort`)
```powershell
$env:TEMP = "d:\PROJECTS\z-automation-studio\earth-24h\.tmp"
$env:TMP  = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
npx remotion render remotion/index.ts Earth24HoursShort "d:\PROJECTS\z-automation-studio\earth-24h\out\remotion_earth24h_v6.mp4" --concurrency=2
python "d:\PROJECTS\z-automation-studio\earth-24h\scripts\qa_compare.py" remotion_v6 "d:\PROJECTS\z-automation-studio\earth-24h\out\remotion_earth24h_v6.mp4" --quad
```
Live Studio preview: `npm run studio` -> select **`Earth24HoursShort`**.

### C. Render & Validate Python V6 Engine
```powershell
python "d:\PROJECTS\z-automation-studio\earth-24h\src\render_video.py" v6
python "d:\PROJECTS\z-automation-studio\earth-24h\scripts\qa_compare.py" v6 "d:\PROJECTS\z-automation-studio\earth-24h\out\reconstructed_v6.mp4"
```
