# Audio-First Narration, Tactile Foley & Broadcast Render QA

## 1. Conversational Indonesian Narration (ElevenLabs `eleven_v4`)
- **Script Craft**: Always write via `brutal-storyteller` — hook in `<2.5s`, concrete numbers/physics, zero dry textbook phrasing, and a closing sentence that loops grammatically straight into the opening hook!
- **Pacing**: Energetic curious explainer cadence (`TEMPO = 1.15–1.22` via pitch-preserved FFmpeg `atempo`, hitting ~2.1–2.4 words/sec — snappy, clear, never robotic or rushed).
- **Voice Selection**: Warm engaging Indonesian-capable ElevenLabs voice (e.g., `Brian` `nPczCjzI2devNBz1zQrb` or `Adam`/`Chris` — `stability: 0.48`, `similarityBoost: 0.78`, `languageCode: "id"`).
- **Deterministic Caching & `[[cue]]` Anchors**:
  - Embed `[[cue_name]]` tokens inline in each beat right before the exact trigger word (e.g. `[[c_buckle]]melengkung kayak ular`, `[[c_gap]]celah kecil`).
  - Hash `(voiceId, model, stability, similarity, ttsText, prevPlain, nextPlain, normFlag)` into `<slug>/audio/vo_cache/beat_<NN>_<sha1>.mp3` + `.json`.
  - Use `convertWithTimestamps` to derive **millisecond-exact word timestamps**, `CUES`, `SHOTS`, and clean word-group subtitle chunks (2–4 words per chunk so they read fast & punchy on vertical screens!) exported directly into `remotion/videos/<slug>/story.ts`.
- **Mandatory Indonesian Pronunciation Shield**:
  - Flag risky short words (`api`, `rel`, `ai`, `id`, `it`, `as`, `in`, `mm`, `cm`, `ton`, `km`) with lowercase/spelled-out `ttsText` (e.g. `milimeter`, `sentimeter`, `kilometer`) + `applyTextNormalization: "off"` while keeping crisp notation (`10 mm`, `100 ton`) in visual display subtitles.
  - **Mandatory Audio Verification**: Directly listen (`read_file`) to risky beats & final mix clips to verify zero mispronunciations.

## 2. Tactile Mechanical Foley + Upbeat Curious Score
- **Bespoke Mechanical SFX (`eleven_text_to_sound_v3`)**: Generate 8–10 topic-specific tactile sounds cached in `<slug>/audio/sfx/` (e.g., train approaching rumble, rhythmic rail clack-clack, crushed gravel crunch, heavy metal clank, steel heat creak/snap, wooden blocks clatter, pneumatic swoosh, chime reveal).
- **Curated CC0 Impacts**: Layer subtle crisp transitions/pops from `.agents/skills/sound-effects/sfx/` (verify every file exists before mixing!).
- **Licensed Upbeat Score**: Source a clean free-license upbeat curious pizzicato/plucked/rhythmic track from Mixkit (cached in `<slug>/.audio-cache/` with full attribution in `<slug>/out/CREDITS.txt`).
- **Broadcast Mix Architecture (`build_sound_mix.py`)**:
  - Narrator VO EQ: `highpass=80Hz`, warmth `+1.5dB @ 160Hz`, presence `+2.0dB @ 3.2kHz`, de-ess `-1.2dB @ 6.5kHz`.
  - Music Anti-Masking Pocket EQ: `highpass=45Hz`, `lowpass=11kHz`, ducking pocket `-3.5dB @ 1.8kHz`, `-2.5dB @ 3.2kHz` + smooth `sidechaincompress` keyed by narrator VO.
  - Two-pass linear `loudnorm` targeting **`-14.8 LUFS`** (±0.3 LU), **`True Peak <= -1.5 dBFS`**, `48 kHz` Stereo AAC `256k–320k` → `public/<slug>/audio_master.m4a`.
  - Measure & log both **Stereo** and **`-ac 1` Mono** `ebur128=peak=true` plus waveform/spectrogram `<slug>/out/audio_qa_sheet.png`.

## 3. Pre-Bundled Resumable Chunk Render & Visual QA Gate
1. **TypeScript Check**: `npx tsc --noEmit` → zero errors in `remotion/videos/<slug>/`.
2. **Bundle Once**: `npx remotion bundle remotion/index.ts --out-dir=<slug>/out/bundle` (prevents 9x redundant Webpack bundling & `public/` copying!).
3. **12-Frame Pre-Flight QA Contact Sheet**:
   - Render 12 frames covering every beat, macro DOF shot, analogy shot, force-arrow climax, AND **Frame `0` vs `durationInFrames - 1`** side-by-side to prove seamless looping!
   - Inspect visually via `read_file` and verify:
     - Synthetic HDRI reflections & warm ground bounce visibly active (no flat gray plastic)?
     - PBR normal/roughness micro-detail visible on soil, stones, wood, metal?
     - GLSL sky dome + soft volumetric clouds smooth and painterly?
     - Shadows crisp & contact AO decals grounding every foot/object?
     - Macro DOF bokeh visibly separating hero from background?
     - Subtitles crisp white with soft shadow (ZERO dark boxes, ZERO TikTok watermark)?
     - Frame 0 and Final Frame match seamlessly?
4. **Resumable Chunked Render**:
   - Render `~300–350 frames/chunk` using `--gl=angle --concurrency=1 --muted --timeout=60000` with automatic single retry.
   - Concatenate lossless (`-f concat -safe 0 -c copy`) → mux audio (`-c:v copy -c:a copy -movflags +faststart -shortest`).
   - Verify final MP4 with `ffprobe`, Stereo & Mono `ebur128`, and inspect 3 decoded MP4 frames via `read_file`.
   - Delete temporary `chunks/` and `bundle/` directories cleanly after verification.
