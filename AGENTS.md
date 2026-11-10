# Z-Automation Studio Directives

## 1. 3D Dialogue Videos (Hermes & OpenClaw)
- **Engine Toolkit**: `~/.video-3d-kit` (Windows: `%USERPROFILE%\.video-3d-kit`).
- **Slash Command**: Use `/video-3d <topic>` or `/video-3d-toons <topic>`.
- **Official Characters & Acting Dynamics**:
  - `hermes`: Primary keynote AI avatar (Cobalt Blue cyber chassis, glowing orbital halo).
    - *Tone*: Tenang, berwibawa, karismatik, cerdas, sedikit sarkastik/jenaka saat menegur OpenClaw.
    - *Acts*: `explain`, `think`, `shrug`, `proud`, `point`, `facepalm`, `nod`, `nod_small`, `lean_in`, `tilt_curious`, `present_screen`, `showcase`, `dismiss`.
  - `openclaw`: Secondary assistant (Red robotic crab with lime accents).
    - *Tone*: Ekspresif, heboh, komikal, mewakili keresahan/kebingungan pengguna awam.
    - *Acts*: `panic`, `slump`, `bounce`, `shake`, `cheer`, `claws_up`, `jolt`, `nod`, `nod_small`, `tilt`, `tilt_curious`, `lean_in`.
- **Dialogue Style (Banter & Komedi Dinamis)**:
  - Format naskah mengutamakan *banter* komedi cepat (saling menyela alami, gap pendek 0.20s - 0.35s).
  - OpenClaw membuka dengan keluhan riil & dramatis -> Hermes menanggapi dengan *facepalm* / *dismiss* -> Hermes menyajikan solusi elegan Z-Automation -> OpenClaw merespons gembira (*bounce* / *cheer*).
- **Portable Kit Backup**: Bundled at `d:\PROJECTS\z-automation\portable-kit\`. To restore or port to a new PC, run `portable-kit\install-to-new-device.bat`.

## 2. Motion Graphics & Video Studio (Remotion)
- **Studio Root**: `d:\PROJECTS\z-automation-studio\`
- **Preview Studio**: `npm run studio` (Remotion Live Player on port 3000).
- **Exporting Videos**: `npm run render:reel` (9:16 vertical) or `npm run render:square` (1:1 feed).

## 3. Cartoon 3D Animation Engine (Stickman / Bean-Head 1:1 Reference Standard)
- **Engine Path**: `remotion/videos/`
  - Reference Masterpiece: `remotion/videos/bridge/` (`BridgeShort` — "The Bridge That Fell for a Song")
  - Templates & References: `.agents/skills/cartoon-3d-short/templates/`
- **Installed Skills**:
  - `cartoon-3d-short` (`.agents/skills/cartoon-3d-short/SKILL.md`)
  - `cartoon-short-kit` (`.agents/skills/cartoon-short-kit/SKILL.md`)

### The 5 Golden Rules for 1:1 Stickman Style Reproduction:
1. **Contact Shadow Multiply Blend**:
   - `Fx.bind()` in `bridge/cast.ts` strictly checks `if (this.r!.key.includes("|blob|"))` to assign `this.blob` (multiply blend).
   - The pool request key **MUST** include `"|blob|"` (e.g. `blob|contact|#1e293b`). Never use generic keys like `"contact_blob"` or `"shadow"`, or Three.js will render an opaque solid white/blue rectangle under the character's feet!
2. **Deterministic Head & Accessory Coordinates**:
   - For adult stickman (`seed = 7`, `BUILD["adult"]`), head center (eyes) is NOT arbitrary:
     `H = headBlob(seed, 118, facing); hc = 975 - 6 * H.b;` (approx `312.2`).
   - Sunglasses must be placed at `hc - 16` to cover the eyes completely with gold rims and specular glare.
   - Ram horns/headgear mount at temples `cx ± 88, hc - 32` and must subtract Y (`hy - Math.sin(...) * radius`) to curve **upwards** into the sky (-Y in Canvas2D).
   - Gold chain drapes from `chin + 25` (`~448`) down to chest with medallion centered at `~535`.
3. **9:16 Vertical Camera Trigonometry & Signage**:
   - In 9:16 vertical shorts, horizontal field of view is narrow (`width = 2 * dist * tan(fov/2) * (9/16)`).
   - Ground signage/monuments must be sized between `1.0m - 2.2m` wide (never 6m wide horizontal banners which get cropped by 50%).
   - PlaneGeometry faces `+Z`. If the camera is at `-Z` looking toward `+Z`, the sign plate **MUST** have `rotation.y = Math.PI` to prevent mirrored text.
4. **Three-Tier Commuter Rush (Exodus Framing)**:
   - In running/marching crowd shots, stagger 3 commuters in depth (foreground `scale 1.05`, midground `scale 0.98`, background `scale 0.92`) with distinct outfits (executive suit, startup red jacket & cap, tech green jacket), dynamic swinging suitcases, and `expr: "grin"` / `"laugh"` / `"whistle"`.
5. **Contact Sheet QA Before Video Render**:
   - Always render still frames at 25%, 50%, and 80% mark (`remotion still <Comp> stills/shot1.jpg --frame 40`, etc.).
   - Assemble with `python scripts/create_contact_sheet.py` and inspect with `read_file` before launching full video renders.
