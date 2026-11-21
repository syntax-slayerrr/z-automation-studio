---
name: vintage-poster-explainer
description: >-
  Produce a 100% pure-code 2D Vintage Travel-Poster & Illustrated Gouache Science/Geography
  Explainer Short (9:16 vertical, 35-65s, 30 fps smooth animation, Remotion + SVG/Canvas)
  reproducing 1:1 the forensic visual & motion craft of "Danau Toba Dulunya Gunung Api Raksasa".
  Features static vintage watercolor/linen paper multiply texture (zero flicker/boil),
  2-3 tone hand-painted gouache shading with dark sepia ink outlines (#241C1B), chunky
  Alfa Slab One display titles with warm burnt-sienna 3D block shadows (#6E2C1B), dark slate
  subtitle ticket bars, hand-brushed feathered charcoal ink karaoke caption bars with
  3-state progression (past #F5F2EA / active golden-yellow #F8D348 / upcoming muted slate #98A0AC),
  geological/structural cutaway cross-sections, continuous aerial zoom-outs to vintage atlas maps,
  motivated physical transitions (time-rewind counter morph, flash-blur blowout, vertical crane peel,
  cloud-curtain wipe, dashed ghost blueprint overlay), seamless visual loop returning to the opening
  scene, and a collectible cream-bordered Vintage Travel Postcard finale. Use whenever the user asks
  for a video in "style Danau Toba", "vintage poster explainer", "retro gouache diorama",
  "cross-section edukasi", "animasi geografi / sains / sejarah bergaya poster klasik", or wants
  this exact 1:1 educational Shorts craft for any new topic.
---

# Vintage Poster Explainer (1:1 Retro Gouache & Atlas Pipeline)

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna awam cukup mengetik 1 kalimat di AI agent:
> *"Buatkan video gaya **Vintage Poster Explainer (Danau Toba / Gunung Guntur)** tentang **[Kenapa Kawah Putih Bisa Berubah Warna / Sejarah Letusan Krakatau 1883 / Bagaimana Lahan Gambut Menyimpan Karbon Ribuan Tahun]**"*

**Instruksi Otomatis untuk AI Agent:**
1. Tangani seluruh produksi secara otonom dari naskah (`brutal-storyteller`), VO ElevenLabs `eleven_v4` + SFX `eleven_text_to_sound_v3` + musik Mixkit (`-14.5 LUFS`), pembuatan komponen SVG/Canvas Remotion, audit contact sheet 16 frame, hingga render MP4 final!
2. Gunakan golden reference yang sudah terbukti di repo ini:
   - **`remotion/videos/gunung-guntur/`** & `gunung-guntur/scripts/` (`npm run render:guntur`)
   - **`remotion/videos/gambut-history/`** & `gambut-history/scripts/` (`npm run render:gambut`)

Forensically reverse-engineered 1:1 from *"Danau Toba Dulunya Gunung Api Raksasa"* (`38.4s`, `30 fps`, `9:16`).
Everything in this style is **100% procedural pure-code 2D SVG/Canvas + Remotion** (using `d3-geo` for accurate vintage atlas maps) — **zero AI-generated image cutouts**, **zero sterile flat corporate vectors**, **zero generic opacity cross-fades**.

## Related Skills (Use Together, Do Not Duplicate)
- `remotion` / `remotion-best-practices` — Remotion composition, font loading (`@remotion/google-fonts/AlfaSlabOne`, `PlusJakartaSans`), and rendering.
- `map-animation` — Accurate `d3-geo` GeoJSON vintage atlas projection & animated route/plume arcs.
- `real-sound` / `sound-effects` — Tactile foley cues per physical transition + licensed acoustic curiosity score (`-15.0` to `-14.5 LUFS`).
- `short-form-video` / `caption-animation` — 9:16 Shorts retention hook, 3-state karaoke word timing, and seamless opening→closing loop.

## Hard Non-Negotiable 1:1 Rules
1. **Static Vintage Paper Multiply Layer (Zero Boil/Flicker)**: Always overlay a fixed, non-animated warm linen/watercolor paper texture (`mix-blend-mode: multiply`, subtle horizontal fibers) across the entire viewport. Never jitter/boil the paper grain per frame.
2. **Painted Gouache + Dark Sepia Ink Outlines (Never Pure `#000`/`#fff`)**: Every illustrated form (clouds, trees, landforms, architecture, strata, arrows, map islands) uses 2–3 tone painted gouache gradients/shading + thin dark sepia-charcoal outlines (`1.2–2.2px`, `#241C1B`), warm cream highlights (`#FAF1DC`), and sedimentary woodcut grain lines on cross-sections.
3. **Exact 1:1 Typography Lock**:
   - **Hero Titles & In-Scene Callouts**: `Alfa Slab One` (heavy retro slab-serif), fill `#FAF1DC`, **burnt-sienna/terracotta 3D block extrusion shadow (`dx=+4, dy=+4`, `#6E2C1B`)** + crisp dark outline (`#2B1B17`).
   - **Sub-Title Ticket Ribbon**: Compact dark slate rectangle (`#1E2631` @ 92%, `rx=2`), wide-tracked uppercase sans-serif (`Plus Jakarta Sans` Bold, `0.24em`).
   - **Lower-Third Brushed-Ink Karaoke Bar (`y = 78%–83%`)**: Horizontal dark charcoal ink stroke (`#1B212C` @ 82%) with **feathered dry-bristle left/right ends** (NEVER a plain CSS rounded box!). Exact 3-state word colors: **past `#F5F2EA`**, **active `#F8D348` (golden yellow)**, **upcoming `#98A0AC` (~55% opacity)**.
4. **Silky 30 FPS + Motivated Physical Transitions Only**: Run at true continuous 30 fps (never 12fps choppy stutter). Never join scenes with sluggish flat opacity fades — use the 8 signature motivated transitions in [`references/transitions-and-motion.md`](./references/transitions-and-motion.md) (time-rewind morph, flash-blur zoom blowout, vertical crane-down cutaway peel, cloud-curtain wipe, continuous aerial-to-atlas zoom-out, storm-to-rainbow clear, uplift arrows, dashed ghost blueprint + vintage postcard pull-out).
5. **Iconic Opening → Loop → Vintage Postcard Finale**: Open on a rich modern/iconic scenic establishing shot with foreground framing (`left tree/landmark + center vista + right cultural detail`), take the viewer back in time/inside the mechanism, then **loop seamlessly back to that EXACT scenic frame**, draw a **dashed cream-gold ghost blueprint overlay** of the hidden truth over the sky, and pull out (`scale 1.0 → 0.90`) into a **cream-matted Vintage Travel Postcard** (`#C9BEA7` border + `#3B342C` hairline + title + punchline tag).
6. **100% Topic-Adapted — Style Only**: Reuse the materiality, typography, color grammar, cutaway/atlas language, and transition choreography 1:1 — NEVER hardcode volcanoes, Danau Toba, or Samosir unless the topic itself is volcanic! Adapt the visual metaphors to the new topic (e.g., ocean trench, ancient monument construction, human anatomy, historical city transformation, coral atoll, river delta, etc.).

## End-to-End Production Workflow

### Phase 0 — Art Bible & Narrative Loop Blueprint
1. Read [`references/style-bible.md`](./references/style-bible.md) and [`references/transitions-and-motion.md`](./references/transitions-and-motion.md).
2. Copy [`templates/art-bible.template.json`](./templates/art-bible.template.json) to `<topic-slug>/art-bible.json`.
3. Map the user's script into the signature **7–9 Beat Visual Loop** (`35–60s` target):
   - **Beat 1 (`0–2.5s`) — Scenic Poster Hook**: Iconic present-day establishing vista + `Alfa Slab One` title + slate location ribbon.
   - **Beat 2 (`2.5–7.5s`) — Time-Rewind / Origin Morph**: Foreground parts, rolling date/scale counter spins (`±... TAHUN LALU` or metric counter), environment physically morphs to its ancient/hidden state.
   - **Beat 3 (`7.5–12s`) — Peak Event / Mechanism Climax**: Flash-blur blowout + camera shake + dynamic painted FX (eruption, collision, flood, construction, surge).
   - **Beat 4 (`12–18s`) — Vertical Crane-Down Cutaway Cross-Section**: Camera tilts down into layered gouache interior strata/anatomy showing the hidden cause physically happening + slab-serif term callout.
   - **Beat 5 (`18–23s`) — Cloud/Curtain Wipe → Top-Down Scale Bar → Continuous Zoom-Out to Vintage Atlas Map**: Painted scale bar (`±... km`) zooms seamlessly out to a `d3-geo` vintage atlas map showing regional/global impact with animated painted trail/plume.
   - **Beat 6 (`23–27s`) — Atmospheric Transformation**: Cloud wipe into weather/time passage (rain filling, erosion, dawn, growth) resolving into a bright sunlit calm (rainbow / birds / sparkle).
   - **Beat 7 (`27–32s`) — Second Cutaway / Hidden Detail Reveal**: Vertical crane-down showing the secondary twist with crisp outlined upward/directional block arrows (`↑ ↑ ↑`) + slab-serif label.
   - **Beat 8 (`32–38s`) — Loop Return + Dashed Ghost Blueprint + Vintage Postcard Pull-Out**: Seamless return to Beat 1's exact composition → dashed cream-gold ghost lines trace the hidden past/structure across the sky → camera pulls back into a collectible cream-bordered Vintage Travel Postcard with closing punchline ribbon!

### Phase 1 — Audio-First VO, Tactile Foley & Curious Acoustic Score
Follow [`references/audio-and-render-qa.md`](./references/audio-and-render-qa.md):
1. Synthesize crisp conversational Indonesian VO (`155–170 WPM`, natural curiosity — ElevenLabs `eleven_v4`, `applyTextNormalization: "off"` + Indonesian acronym protection) with exact word-level timestamps (`alignment.json` → `story.ts`) and `[[cue]]` transition anchors.
2. Listen directly (`read_file`) to sensitive Indonesian words/numbers (`tahun`, acronyms, proper nouns) before locking audio.
3. Layer a light, wondrous acoustic/marimba/pizzicato score (`~100–110 BPM`) + **frame-locked tactile foley for EVERY transition** (counter rattle, impact boom, cutaway swoosh, crumble thud, cloud whoosh, weather ambience, uplift hum, chalk/pencil blueprint draw, postcard lock chime).
4. Master to **`-14.8` to `-14.5 LUFS`**, `LRA 2.4–3.0 LU`, `True Peak ≤ -1.5 dBFS` (verify both Stereo and `-ac 1` Mono).

### Phase 2 — Core Primitives & Vertical Slice Gate (Beats 1–3)
1. Implement core 1:1 visual components from [`references/svg-primitives-starter.md`](./references/svg-primitives-starter.md):
   - `VintagePaperOverlay`, `RetroSlabTitle3D`, `TicketSubtitleRibbon`, `BrushedInkSubtitleBar`, `CloudCurtainWipe`, `VintageScaleBar`, `DashedGhostBlueprint`, `VintagePostcardFrame`.
2. Build Beats 1–3 first, register in `remotion/Root.tsx`, pre-bundle once, render 5–6 stills, and visually inspect via `read_file` against the 1:1 checklist:
   - Paper texture clearly felt yet static (no muddiness, no pure white/black)?
   - `Alfa Slab One` warm cream + burnt-sienna 3D block shadow exact?
   - Brushed-ink subtitle bar feathered at both ends with exact 3-state colors (`#F5F2EA` / `#F8D348` / `#98A0AC`)?
   - Painted 2-tone clouds & sepia outlines rich and organic?

### Phase 3 — Full Beats, 18-Frame Pre-Flight Audit & Chunked Broadcast Render
1. Complete Beats 4–8 (cutaways, `d3-geo` vintage atlas, cloud wipes, dashed ghost blueprint, postcard pull-out).
2. Run `npx tsc --noEmit` → `0` errors on `<topic-slug>`.
3. Render an 18–20 frame pre-flight contact sheet covering every beat AND mid-transition frame; inspect via `read_file` and fix every micro-flaw.
4. Render via resumable chunk script (`~350–400` frames/chunk, `H.264 yuv420p bt709`, bit-exact `-c:a copy` mux), verify `ffprobe` + stereo/mono `ebur128` + decoded contact sheet (`read_file`) + spot-audio listen, then clean `.chunks/.bundle/.tmp`.
