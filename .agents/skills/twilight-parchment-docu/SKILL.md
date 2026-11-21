---
name: twilight-parchment-docu
description: >-
  Produce a 100% pure-code 2D cinematic documentary short (9:16 vertical, 60-120s,
  30 fps, Remotion + SVG rigging + procedural lighting/shadows) in the signature
  Twilight Parchment Documentary style adapted from Earth 24 Hours and proven on
  "Ketika Manusia Mengenal Api" (human-fire/). Features deep plum-indigo to warm
  amber-gold lighting (zero #000/#fff), 5-layer depth parallax, articulated 2D
  SVG character rigs with dynamic key-light rim highlights and trembling cast
  shadows, glowing serif chapter headers, hand-torn deckle-edge parchment karaoke
  subtitle cards, natural-tempo ElevenLabs eleven_v4 Indonesian narration with
  pronunciation verification, bespoke ElevenLabs Sound-V3 + CC0 foley + licensed
  documentary score mastered to -14.5 LUFS. Use whenever the user asks for a
  documentary/educational 2D video in the "dipadatkan 24 jam" style, "seperti
  Ketika Manusia Mengenal Api", "style twilight parchment / diorama 2D", or
  provides a multi-scene script/storyboard wanting this visual and audio craft
  for a new topic (never copying the 24-hour clock dial unless requested).
---

# Twilight Parchment Documentary (2D Pure-Code Pipeline)

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna awam cukup mengetik 1 kalimat di AI agent:
> *"Buatkan video gaya **Twilight Parchment Documentary (Ketika Manusia Mengenal Api / Sejarah GMNI)** tentang **[Bagaimana Manusia Purba Menemukan Roda / Sejarah Kongres Sumpah Pemuda 1928]**"*

**Instruksi Otomatis untuk AI Agent:**
1. Tangani seluruh produksi secara otonom (naskah `brutal-storyteller` → VO ElevenLabs `eleven_v4` dengan pelindung akronim Bahasa Indonesia + 9 SFX `eleven_text_to_sound_v3` + musik `-14.5 LUFS` → 5-layer depth parallax & rig karakter 2D SVG → audit 16-frame contact sheet → render MP4 final).
2. Gunakan kedua golden reference yang ada di repo ini sesuai nuansa topik:
   - **Topik Sains/Sejarah Peradaban Purba**: `remotion/videos/human-fire/` & `human-fire/scripts/` (`npm run render:humanfire`)
   - **Topik Sejarah Modern/Organisasi/Pergerakan Nasional**: `remotion/videos/gmni-history/` & `gmni-history/scripts/` (`npm run render:gmni`)

Proven golden reference in this workspace:
- **Video & Remotion Engine**: `remotion/videos/human-fire/` (`HumanFireShort`, `fx.tsx`, `PrehistoricHumanRig.tsx`, `PrehistoricLandscape.tsx`, `Scene1..Scene7`, `story.ts`)
- **Scripts & Locked Art Bible**: `human-fire/art-bible.json`, `human-fire/scripts/build_vo_and_sfx.mjs`, `human-fire/scripts/build_sound_mix.py`, `human-fire/scripts/render_humanfire_chunks.ps1`
- **Style Inspiration**: Aesthetic DNA from `remotion/videos/earth-24h/` (**style only** — NEVER copy the 24-hour clock/astrolabe dial or literal storyboard unless the topic itself is about a clock).

## Related Skills (Use Together, Do Not Duplicate)
- `cinematic-vector-animator` — phased gates, easing curves, lighting/depth hierarchy, anti-cheap checklist.
- `real-sound` / `sound-effects` — licensed audio sourcing, anti-masking mix, loudness QA, credits.
- `short-form-video` / `caption-animation` — 9:16 safe zones, instant Frame-0 hook presence, word-level karaoke timing.

## Hard Non-Negotiable Rules
1. **100% Pure Code Visuals**: Zero AI-generated photos, zero stock cutouts. Everything is code-driven SVG/Canvas/Remotion (or Three.js/GLSL when a scene needs 3D).
2. **Style Only — No Hardcoded Clock**: Inherit palette, depth parallax, dynamic rim-lighting, serif headers, parchment subtitle cards, and archival grain — build fresh custom scenes tailored 100% to the new topic's storyboard.
3. **Zero `#000` / `#fff` & Zero Linear Camera**: Colored plum/indigo shadows (`#160a1e`), warm cream highlights (`#ffecc4`), organic easing (`easeInOutCubic` / `easeOutQuint`), continuous subtle camera drift + motivated push/pull + breathing *holds*.
4. **Natural Documentary Narration Tempo**: Match the script's scene durations (`atempo=1.00..1.15`); NEVER artificially rush voiceover unless the user asks for fast Shorts pacing.
5. **Pronunciation & Visual Verification Mandatory**: Always inspect rendered stills (`read_file` on contact sheets) AND listen to risky TTS words (`read_file` on MP3 clips) before declaring done.

## End-to-End Production Workflow

### Phase 0 — Art Bible & Project Scaffold
1. Copy [`templates/art-bible.template.json`](./templates/art-bible.template.json) to `<topic-slug>/art-bible.json`, adapt dominant light sources & scene palette ramps for the new topic, and lock it with the user (confirm aspect ratio `9:16` `720×1280` vs `16:9`, parchment card vs floating caption, and narrator voice).
2. Read [`references/style-bible.md`](./references/style-bible.md) before designing any scene or character rig.

### Phase 1 — Audio-First Voiceover, Bespoke SFX & Broadcast Mix
Follow [`references/audio-and-pronunciation.md`](./references/audio-and-pronunciation.md):
1. Copy `human-fire/scripts/build_vo_and_sfx.mjs` → `<topic-slug>/scripts/build_vo_and_sfx.mjs`.
   - Keep the user's script verbatim with inline ElevenLabs `eleven_v4` acting tags (`[calm]`, `[thoughtful]`, `[warm]`, `[serious tone]`, `[resonant]`, `[quietly]`) and `[[cue_name]]` anchors mapped to every storyboard beat.
   - Protect Indonesian words that collide with English acronyms (`Api`, `Ai`, `Id`, `It`, `Os`, `Ui`, `Ir`, etc.) by sending lowercase + `applyTextNormalization: "off"` in `ttsText` while preserving proper capitalization in `displayTokens`.
   - Run `node --env-file=.env <topic-slug>/scripts/build_vo_and_sfx.mjs` to generate cached VO, 8–10 bespoke `eleven_text_to_sound_v3` SFX, `alignment.json`, and typed `remotion/videos/<topic-slug>/story.ts`.
   - **Audio Spot-Check Gate**: Listen directly to any sensitive beats via `read_file` on `<topic-slug>/audio/vo_cache/beat_*.mp3` (and verify word durations in `alignment.json`) so zero mispronunciations slip through!
2. Copy `human-fire/scripts/build_sound_mix.py` → `<topic-slug>/scripts/build_sound_mix.py`.
   - Pick a commercial-safe Mixkit Free Stock Music track matching the topic's mood, verify its license, wire frame-locked bespoke SFX + CC0 foley accents + multi-act volume contour + vocal pocket EQ + sidechain ducking + two-pass linear `loudnorm` (`-14.5 LUFS`, True Peak `≤ -1.9 dBFS`).
   - Run `python <topic-slug>/scripts/build_sound_mix.py` → outputs `public/<topic-slug>/audio_master.m4a`, `<topic-slug>/out/audio_qa_sheet.png`, `CREDITS.txt`, and `SOUND.md`. Verify stereo AND mono `ebur128` match cleanly.

### Phase 2 — Vertical Slice & Character Rig Gate (Scenes 1–2 First!)
1. Reuse/adapt the core visual engine from `remotion/videos/human-fire/fx.tsx` (`VolumetricFire2D` / custom procedural light FX, `AmbientEmbersOverlay`, `ChapterHeader`, `ParchmentSubtitleCard`, `CinematicGradeOverlay`) into `remotion/videos/<topic-slug>/fx.tsx`.
2. Build consistent articulated 2D character rig(s) modeled on `PrehistoricHumanRig.tsx` (grounded at `(0, 0)`, tapered Bezier limbs, seamless joint pivots, breathing + 5-frame head-lag, pose blending, dynamic light-facing rim highlights, trembling cast shadows).
3. Build **only Scenes 1 & 2** first, register the composition in `remotion/Root.tsx`, pre-bundle once, render **4–5 vertical-slice stills**, and visually inspect via `read_file`.
   - Check squint test, organic non-geometric shapes (no flat flame bottoms, no pill clouds, no stiff triangle trees), anatomical limb/prop angles, safe zones, and rim-light contrast. Fix foundation issues here before building remaining scenes!

### Phase 3 — Full Scene Production & 16–20 Frame Pre-Flight Audit
1. Build remaining scenes (Scenes 3–N) with **motivated transitions** (flame/light-wipe, pull-back reveal, match-cut morph, rising particle bridge — never flat abrupt cuts) and a serene closing editorial title card.
2. Check TypeScript (`npx tsc --noEmit 2>&1 | Select-String "<topic-slug>"` → 0 errors).
3. Render a **16–20 frame pre-flight contact sheet** covering every major storyboard beat across all scenes and inspect via `read_file`. Fix every physical contact / framing / overlap / timing micro-flaw (e.g., hands touching props, objects clearing flames/subtitles) and verify the fixed stills before final render.

### Phase 4 — Bulletproof Resumable Chunk Render & Final Broadcast QA
Follow [`references/render-and-qa.md`](./references/render-and-qa.md):
1. Copy `human-fire/scripts/render_humanfire_chunks.ps1` → `<topic-slug>/scripts/render_<slug>_chunks.ps1` (pre-bundle ONCE, render ~350–405 frame chunks with 2 auto-retry attempts and `ffprobe` packet count verification, concat + single continuous `H.264 yuv420p bt709` encode + bit-exact `-c:a copy` mux).
2. Verify **directly on the final exported MP4**:
   - `ffprobe` metadata (`h264`, `yuv420p`, `bt709`, exact width/height/fps/frame count, `aac 48000 Hz stereo`).
   - Stereo AND Mono `ffmpeg ebur128=peak=true` (`-14.5 LUFS`, True Peak `≤ -1.9 dBFS`).
   - Extract 12–15 exact decoded frames via FFmpeg `select=eq(n\,...)` into `<topic-slug>/out/qa_contact_sheet.jpg` and visually inspect via `read_file`.
   - Spot-listen to any critical pronunciation moments extracted directly from the final MP4 via `read_file`.
3. Clean temporary `.chunks/`, `.bundle/`, `.tmp/` directories, keeping `<topic-slug>/out/` spotless with the final MP4, `qa_contact_sheet.jpg`, `audio_qa_sheet.png`, `SOUND.md`, and `CREDITS.txt`.
