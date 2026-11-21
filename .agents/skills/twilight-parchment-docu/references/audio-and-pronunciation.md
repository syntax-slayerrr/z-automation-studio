# Audio-First Narration, Pronunciation QA & Cinema Sound Design

Proven reference scripts:
- `human-fire/scripts/build_vo_and_sfx.mjs`
- `human-fire/scripts/build_sound_mix.py`

## 1. ElevenLabs `eleven_v4` Indonesian Narration
- **Default Narrator**: `Brian` (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone, `stability: 0.52`, `similarityBoost: 0.78`, `languageCode: "id"`).
- **Tempo Rule**: Respect the script's natural documentary pacing! Brian speaks ~1.63 w/s natively in Indonesian; `TEMPO = 1.10..1.15` (via FFmpeg pitch-preserved `atempo`) hits a warm, unhurried documentary cadence (~1.85–1.95 w/s) that naturally aligns ~200 words with ~100 seconds including breathing pauses. Never rush to `1.30+` unless explicitly making a rapid-fire hype short.
- **Deterministic Caching**: Hash `(voiceId, model, stability, similarity, ttsText, prevPlain, nextPlain, normFlag)` into `audio/vo_cache/beat_<NN>_<sha1>.mp3` + `.json`. Always compute `prevPlain`/`nextPlain` from `displayTokens` (plain text) so fixing 1 beat never invalidates neighboring cached beats!
- **Exact Storyboard Anchors**: Embed `[[cue_name]]` tokens right before key words in `BEATS`, strip them before TTS, and export `SCENES`, `CUES`, `CUES_SEC`, and `SUBTITLE_CARDS` directly into `remotion/videos/<slug>/story.ts`.

## 2. Critical Indonesian Pronunciation Shield (Zero Acronym Misreads!)
Neural multilingual voices (especially English-rooted baritones like `Brian`) with `applyTextNormalization: "on"` frequently misread short capitalized Indonesian words that match English tech/initialism acronyms:
- Known hazards: **`Api`** → *"A-P-I / epe i"* (especially near `"teknologi"` or at sentence start!), **`Ai`**, **`Id`**, **`It`**, **`Os`**, **`Ui`**, **`Ir`**, **`Ar`**, **`As`**, **`In`**.
- **Mandatory Prevention**:
  1. On any beat containing a risky word, set `fixPronunciation: true`: keep proper capitalization in `displayTokens` (for the parchment subtitle card), send lowercase (e.g. `api`) in `ttsText`, and pass `applyTextNormalization: "off"` to ElevenLabs `convertWithTimestamps`.
  2. **Mandatory Objective Verification**:
     - Inspect character-level durations in `alignment.json` / `vo_cache/*.json` — a 2-syllable word read as a 3-letter English acronym jumps from `~0.22–0.32s` to `~0.48–0.75s` with uneven per-letter durations!
     - **Actually listen** to every flagged/risky beat using `read_file` directly on the cached `.mp3` file (and again on clips extracted from the final exported `.mp4`!) to verify clean Indonesian pronunciation with 100% certainty.

## 3. Bespoke SFX, Licensed Score & Broadcast Mastering
- **Bespoke SFX**: Generate 8–10 scene-specific atmospheric & foley clips via ElevenLabs `eleven_text_to_sound_v3` (cached in `<slug>/audio/sfx/`), complemented by bundled CC0 transitions/impacts from `.agents/skills/sound-effects/sfx/` (verify every path exists before mixing — zero `WARN missing SFX`!).
- **Licensed Music Score**: Source 1 warm atmospheric documentary track from Mixkit Free Stock Music (e.g., Mixkit #148 *"Forest Mist Whispers"* by Alejandro Magaña, Mixkit Stock Music Free License — safe for YouTube, TikTok, Reels, and commercial projects) and record full attribution in `<slug>/out/CREDITS.txt`.
- **Mix Architecture**:
  - Narrator VO EQ: `highpass=75Hz`, warmth `+1.4dB @ 155Hz`, clarity `+1.3dB @ 3.0kHz`, gentle de-ess `-1.0dB @ 6.2kHz`.
  - Music Anti-Masking Vocal Pocket EQ: `highpass=45Hz`, `lowpass=11kHz`, gentle dips at `320Hz (-2.5dB)`, `1800Hz (-3.8dB)`, `3200Hz (-2.8dB)` + multi-act volume contour + smooth `sidechaincompress` triggered by narrator VO.
  - Two-pass linear `loudnorm` targeting **`-14.5 LUFS`**, **`TP <= -1.9 dBFS`**, `LRA ~2–6 LU`, `48 kHz` Stereo AAC `192k` (`public/<slug>/audio_master.m4a`).
  - Always measure and log **both Stereo and `-ac 1` Mono downmix** `ebur128=peak=true` plus waveform/spectrogram `audio_qa_sheet.png` and `SOUND.md` with 5 headphone spot-check timestamps.
