# Voice Cartesia Adapter (Sonic-3.6 — Indonesian)

This adapter bridges `references/sound_and_voice_design.md` with **Cartesia `sonic-3.6`** (`scripts/ipm/cartesia_tts.py`) for the IPM documentary series.

## 1. Model & API Configuration
- **Endpoint**: `https://api.cartesia.ai/tts/sse` (with `Cartesia-Version: 2025-04-16`)
- **Model ID**: `sonic-3.6` (verified multilingual model supporting `language: "id"` and word-level timestamps)
- **Output format**: `pcm_s16le`, `44100` Hz (wrapped into WAV by `scripts/ipm/cartesia_tts.py`, then normalized to `-14 LUFS` / `-1 dBTP` during Remotion/FFmpeg master mix)
- **Timestamps**: `add_timestamps: true` (returns `word_timestamps.words`, `start`, `end` in seconds per segment for exact Remotion caption & picture sync)
- **Auth**: `CARTESIA_API_KEY` read strictly from `.env` / environment variable (never hardcoded).

## 2. Speed & Pause Controls (Replacing ElevenLabs SSML/v3)
- **Pace (`speed`)**: Use `generation_config.speed` (`0.6`–`1.5`).
  - Default documentary cadence: `0.92` (`intimate_slow`), `0.96` (`measured`), `1.02` (`brisk`).
- **Pauses**: Use inline `<break time="0.4s"/>` or `<break time="0.8s"/>` inside `narration_tts.txt` segments, or split into separate `segments.json` entries with explicit `pause_after_s` so `cartesia_tts.py assemble` inserts clean room-tone silence between segments.
- **Emotion tags**: Do **NOT** use Cartesia beta `emotion` tags for Indonesian documentary narration (English-optimized; risk of unnatural prosody). Convey tone through punctuation, sentence length, and `speed`.

## 3. Indonesian Voice Audition Pool
Generated via `python scripts/ipm/cartesia_tts.py voices` & `audition`:
| Candidate | Voice ID | Character | Audition File |
|---|---|---|---|
| **Galang** *(Recommended default)* | `04b567df-2923-4b0c-896b-4b7df0a07e1a` | Warm, measured, authoritative documentary baritone | `productions/ipm-series/assets/voice_audition/04b567df.wav` |
| **Andi** | `a053f6bc-7df4-40de-96d4-de026bc47ce8` | Crisp, slightly brighter narrative tone | `productions/ipm-series/assets/voice_audition/a053f6bc.wav` |
| **Anisa** | `8f703c45-8cb6-4e0c-8015-5e8a9e260a8a` | Calm, reflective female narrator | `productions/ipm-series/assets/voice_audition/8f703c45.wav` |

## 4. Per-Segment Workflow
1. Write `episodes/epXX/narration_master.txt` (human-readable) and `episodes/epXX/narration_tts.txt` (TTS-normalized: years spelled out, acronyms dotted/spaced if needed, `<break time="..."/>` where pauses belong).
2. Define `episodes/epXX/segments.json` (`id`, `text`, `speed`, `pause_after_s`, `intent`).
3. Run:
   - `python scripts/ipm/cartesia_tts.py episode ep01 --voice <VOICE_ID>` (generates per-segment WAVs + `words.json` + logs to `takes_log.csv`)
   - `python scripts/ipm/cartesia_tts.py assemble ep01` (builds `voice/ep01_vo.wav` + `voice/ep01_words.json` with exact cumulative offsets).
