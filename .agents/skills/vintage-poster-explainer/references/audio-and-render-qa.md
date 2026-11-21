# Audio Design, Tactile Foley & Broadcast Render QA (`vintage-poster-explainer`)

Measured directly from the reference *"Danau Toba Dulunya Gunung Api Raksasa"* (`38.40s`, `-15.3 LUFS`, `LRA 2.8 LU`, `True Peak -1.2 dBFS`).

---

## 1. Narrator & Script Pacing Formula
- **Target Duration**: `35–65 seconds` (`9:16` Shorts/Reels/TikTok).
- **Speaking Rate**: **`155–170 WPM`** — warm, clear, curious conversational Indonesian male documentary storyteller (NOT shouting hype-bro, NOT stiff robotic announcer).
- **Sentence Rhythm**: Short punchy clauses (`5–11 words`) with crisp `0.15–0.30s` breathing beats timed right on visual payoffs (*"Danau Toba itu... dulunya sebuah gunung api raksasa."*).
- **TTS & Pronunciation Shield**:
  - ElevenLabs `eleven_v4` (natural warm male narrator e.g. `Brian` / `nPczCjzI2devNBz1zQrb` or user's chosen Indonesian voice), `applyTextNormalization: "off"`.
  - Spell out Indonesian numbers & years phonetically in `ttsText` (`74.000` → `"tujuh puluh empat ribu"`, `100 km` → `"seratus kilometer"`) while keeping crisp display tokens in `SUBTITLE_CARDS` and exact word alignment.
  - Protect Indonesian words colliding with English acronyms (`api`, `air`, `abu`, `era`, `id`, etc.) in lowercase in `ttsText`.
  - **Mandatory Audio Listen Gate**: Always inspect (`read_file`) key VO clips BEFORE mixing to guarantee 100% authentic Indonesian pronunciation.

---

## 2. Score & Frame-Locked Tactile Foley Map
- **Background Music (BGM)**:
  - **Genre**: Light, curious **plucked acoustic guitar / marimba / warm Rhodes / pizzicato** documentary underscore (`~100–110 BPM`).
  - **Contour**: Curious & airy on opening scenic beat (`-15 dB` under VO) → subtle tension pulse during peak disaster/mechanism → gentle warmth during transformation & rainbow → bright resolving acoustic chord right on the Vintage Postcard lock!
  - Always use verified commercial-safe tracks (e.g., Mixkit Free Stock Music / CC0) and log license in `CREDITS.txt`.
- **Mandatory Frame-Locked Foley Per Physical Beat** (synthesize bespoke clips via ElevenLabs `eleven_text_to_sound_v3` or use real CC0 recordings):
  1. **Scenic Opening & Loop Return**: Gentle nature ambience (soft water lap / distant breeze / faint birds).
  2. **Time-Rewind Counter Spin**: Crisp mechanical counter/clockwork tick-rattle accelerating into a resonant lock thud + low earth rise rumble.
  3. **Peak Climax Flash**: Deep low-frequency boom + crackling electric/thunder snap + rumbling rush.
  4. **Vertical Crane-Down Cutaway**: Soft tactile paper/cutaway swoosh + subtle interior liquid/energy bubble hum.
  5. **Structural Collapse / Term Pop**: Heavy rock shear & rumble thud + crisp muted wooden pop for slab-serif label (`kaldera`).
  6. **Cloud-Curtain Wipe & Scale Bar**: Soft airy cloth/wind whoosh + subtle mechanical ruler click on scale bar draw (`±100 km`).
  7. **Atlas Plume / Route Sweep**: High-altitude wind rush sweeping across the map.
  8. **Weather Transformation**: Realistic falling rainstorm + swelling water fill → soft harp/shimmer & gentle birds on rainbow clear.
  9. **Subterranean Uplift Arrows**: Deep rising resonant pressure swell + subtle stone lift.
  10. **Ghost Blueprint + Postcard Finale**: Light chalk/pencil sketch swoosh as dashed outline draws → crisp vintage camera shutter / acoustic chord lock on the cream postcard border!

---

## 3. Mixing, Loudness & Broadcast Render Pipeline
- **Audio Master Target**:
  - Vocal pocket EQ (`-2.5 dB` @ `2.6 kHz` on BGM) + sidechain ducking (`threshold -26 dB`, `ratio 4:1`, `attack 15ms`, `release 180ms`).
  - Two-pass linear FFmpeg `loudnorm`: **`-14.8` to `-14.5 LUFS`**, **`LRA 2.4–3.0 LU`**, **`True Peak ≤ -1.5 dBFS`**.
  - Export `public/<topic-slug>/audio_master.m4a` (`48 kHz stereo AAC 192k`) and verify BOTH stereo AND `-ac 1` mono fold-down `ebur128=peak=true`.
- **Resumable Chunked Remotion Render (Windows Safe)**:
  1. Redirect `$env:TEMP` & `$env:TMP` to `<topic-slug>\.tmp` (workspace drive).
  2. Pre-bundle ONCE into `<topic-slug>\.bundle` (`npx remotion bundle remotion/index.ts --out-dir <topic-slug>\.bundle`).
  3. Render `~350–400` frame chunks (`--muted --concurrency=2 --crf=14 --log=error`, 2 auto-retry attempts, `ffprobe` packet count verification using `-of default=noprint_wrappers=1:nokey=1`).
  4. FFmpeg concat + continuous broadcast encode (`libx264 -preset medium -crf 17 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" -r 30 -movflags +faststart`) + `-i public/<topic-slug>/audio_master.m4a -c:a copy`.
- **Mandatory Final QA Gate**:
  - Verify `ffprobe` (`h264`, `yuv420p`, `bt709/bt709/bt709`, `30/1 fps`, exact frame count, `aac 48000 Hz stereo`).
  - Verify Stereo & Mono `ebur128` directly on the final MP4.
  - Extract 12–15 decoded frames via `select=eq(n\,...) -fps_mode passthrough` into `out/qa_contact_sheet.jpg` and visually inspect via `read_file`.
  - Clean temporary `.chunks/`, `.bundle/`, `.tmp/` folders upon completion.
