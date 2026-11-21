# Sound, Voice & Edit Rhythm

Sound is half the film, and the narrator is the series' face. Many mobile viewers watch muted, so design for both: **sound-off must be complete (captions + picture), sound-on must feel premium.**

## Contents
1. Principles
2. The narrator (voice lock)
3. Narration performance direction
4. Master narration vs TTS export; pronunciation
5. Generating voice with ElevenLabs (or another TTS)
6. Sound architecture and sonic identity
7. Sound palettes (matrix vocabulary)
8. Music
9. Spotting sheet
10. Edit rhythm
11. Captions and on-screen text
12. Mix and delivery
13. Sound QA checklist

---

## 1. Principles
1. **Voice is the series' face.** One narrator, one settings profile, across all 15 episodes. Variation comes from tempo and intensity, never from changing the voice.
2. **Sound-on richness, sound-off completeness.** Captions and picture carry the story alone; sound adds depth, mood, and trust.
3. **Silence is a sound.** A deliberate half-second before the turn line is worth more than another effect.
4. **Honest sound.** Ambience and foley must be plausible for the place and time; do not fabricate crowd chants, speeches, or recognizable historical recordings without provenance and rights.
5. **Sound design follows story function.** Every sound event answers "what is the viewer meant to notice or feel here?"
6. **Design for the phone speaker and earbuds** first, then check on larger systems.

## 2. The narrator (voice lock)
Run once, at gate S2; record in the Series Bible.
- **Casting criteria:** natural Indonesian diction; warm, authoritative but not pompous; clear on phone speakers; able to carry quiet and brisk modes; no constant dramatic whisper or "trailer announcer" delivery.
- **Audition:** generate the same 20–30 s test passage with 3–5 candidate voices. The passage must include a date, an acronym, two proper names, a long sentence, a short sentence, and a turn line.
- **Voice lock sheet:** voice name/ID, model/version, settings, language/accent, date tested, sample file, any restrictions. Do not change after the pilot without logging a series-wide change.
- **Rights:** verify the voice's licensing and commercial-use terms in current documentation before locking. Do not assume.

## 3. Narration performance direction
Prepare a **narrator direction card** per episode (in the script template):
- **Overall mode:** `measured`, `brisk`, `intimate_slow`, or `building` (vocabulary for the variation matrix). Change the mode between neighbouring episodes where the structure allows.
- **Tempo map per beat:** slow / medium / quick / pause, with approximate seconds.
- **Landing lines:** which lines are delivered slower and which words carry emphasis.
- **Pause plan:** where the picture and the sound need air (the turn line, after a number, before the last line).
- **Intensity curve:** quiet → focused → peak → release; not flat and not climbing for the entire length.
- **Do-not list:** no melodrama on facts, no fake awe on dates, no upward inflection on statements.

## 4. Master narration vs TTS export; pronunciation
Keep two text files per episode:
- **Master narration:** verified spelling, used for captions and archives.
- **TTS export:** identical content with only the adjustments the voice engine needs (spelled-out numbers or acronyms where misread, punctuation for pauses). No stage directions, citations, shot labels, or sound cues inside the file unless the engine's current documentation says to use specific tags (verify first).

**Pronunciation sheet:** every proper name, acronym (e.g., how "IPM" and "IRM" are spoken), place name, Arabic-origin term, and year. Test each with the chosen voice; record the approved rendering and the audio sample. Do not guess; confirm with a native or domain reviewer where uncertain.

## 5. Generating voice with ElevenLabs (or another TTS)
Verify the current features, model names, controls, limits, and pricing in official documentation before relying on them. Typical controls include stability, similarity, and style-related settings; treat names and ranges as **unverified until checked**.
- Generate **per paragraph or per sentence group**, not the full script in one take, so you can control delivery and fix single lines.
- Produce **2–3 takes** of landing lines and the hook; pick by ear.
- Keep identical settings across the series; log every generation (text, settings, take number, chosen).
- Build **pauses in the edit** (timed gaps between segments) instead of depending on the engine's pause behavior.
- Clean each take: remove breaths that sound wrong, mouth clicks, and clipping; match room tone; normalize consistently.
- If a take is intelligible but flat, change the *text and punctuation or segmentation* before changing settings; flat reads are usually a writing problem.

## 6. Sound architecture and sonic identity
**Layers:** voice-over; music; ambience bed; hard effects/foley (only for on-screen action); design elements (transitions, risers, impacts, used sparingly); silence.

**Sonic identity (constant across the series):**
- A short sonic signature (≤ 2 s) used at the start or end of every episode, in the same way.
- A music cue library of 3–4 motifs (e.g., "theme", "inquiry", "consequence", "quiet") that return in different arrangements: leitmotif logic, so episode 15 can echo episode 1.
- A consistent treatment of the narrator (EQ, light de-essing, gentle compression, consistent room feel).

**Per-episode:** choose a palette (§7), a silence strategy, and one *sound idea* that is distinctive (e.g., the room tone of a particular place that returns at the turn, a sound bridge into the final image).

**Sound bridges and transitions.** Let audio cross cuts: the next scene's ambience arrives before the picture (J-cut), or the previous ambience lingers (L-cut). Prefer bridges and match-cut sounds over generic whooshes.

**Diegetic realism.** Footsteps, paper, fabric, doors, vehicles, room tone: only where the action exists on screen. Use research-informed ambience for place and period; if the exact sound is unverifiable, stay generic and unobtrusive rather than "authentic-sounding" but invented.

## 7. Sound palettes (matrix vocabulary)
Name each episode's palette so repetition is visible. Examples (extend as needed):
- `room_tone_sparse`: close room tone, paper, a few instrument notes, long silences
- `street_life_warm`: layered ambient life, light percussion, warm strings
- `inquiry_pulse`: soft rhythmic pulse, restrained synths/strings, rising tension kept subtle
- `open_air_wide`: wind, distance, sustained pads, one lead instrument
- `archive_hush`: near-silence, tiny object sounds, long reverb tails, solo instrument
- `consequence_swell`: gradually building arrangement that resolves into silence
No palette repeats in consecutive episodes; `quiet_chronicle` episodes use the sparsest palettes.

## 8. Music
- Music supports pacing and emotional temperature; it never dictates feeling the history does not justify.
- Avoid overused "epic trailer" scores, constant piano-and-strings loops, and heavy music under key facts.
- Follow the rhythm curve: establish, develop, intensify or deepen, resolve. Do not force a climax in a procedural story.
- Mirror the ending type: `answer_resolve` resolves harmonically; `bridge_loop` can end on an unresolved note or pad; `quiet_hold` ends in near silence.
- **Rights:** every music or SFX asset has a recorded license and source. For AI-generated music, verify the tool's commercial terms; never imitate or request the voice or style of a recognizable composer or artist in a way that could infringe or mislead.
- Keep stems (voice, music, ambience, effects) for revisions and future cut-downs.

## 9. Spotting sheet
Use `templates/sound_spotting_sheet.md`. For each event: timecode, picture event, sound intention, layer, source (library / generated / recorded), license, treatment, notes. Spot **before** the final edit so the picture is cut to breathe with sound, not retrofitted.

## 10. Edit rhythm
- Editing creates progression, not constant stimulation. Balance information density, shot length, voice breathing, music, and silence.
- **Cut on narration beats and on motion.** Let the image arrive about a quarter to half second before the word it illustrates; avoid cutting on the exact word.
- **Rhythm curve:** vary shot length with the structure; hold longer on evidence and the turn, shorter during build-up.
- **Pattern interrupts** every 8–15 s (information, visual mode, tempo, or sound), but each cut adds information, perspective, rhythm, or emphasis.
- **Head and tail:** the first frame is already a strong image with a sound event in 2 s; the last frame holds 0.5–1.5 s (longer for `quiet_hold`), with no dead air at the head.
- **Transitions express relationships** (match cut, sound bridge, graphic/map transition, temporal dissolve, hard cut). Avoid transition packs and decorative effects.
- Apply the unified glue pass at the end (see `animation_direction.md` §7).

## 11. Captions and on-screen text
- Burn-in or sidecar subtitles as the platform requires; high contrast, short lines, safe from platform UI.
- Do not cover faces, key props, or evidence.
- Verify spelling, dates, and names against the master narration and ledger.
- Use verified text added in post; never rely on text generated inside video frames.
- Caption timing: sync within about two frames of the spoken word; phrase breaks follow speech rhythm.

## 12. Mix and delivery
Check the current platform specifications before final export; the numbers below are common starting points, not guarantees.
- Intelligibility first: the voice sits clearly above music and ambience; duck music under speech by an amount judged by ear (often several dB), and restore smoothly during pauses.
- Loudness target: commonly around **-14 LUFS integrated** for social platforms with true peak not above **-1 dBTP**; verify per platform.
- Check on a phone speaker, earbuds, and a larger system; roll off unnecessary low-end that small speakers cannot reproduce.
- No clipping, no pumping, consistent narrator level across all 15 episodes.
- Export master with stems; archive project files, prompts, take log, licenses.

## 13. Sound QA checklist
- [ ] Narrator consistent with the voice lock; names and numbers pronounced as approved.
- [ ] Hook has a sound event within 2 s.
- [ ] The turn line has designed space (pause or sound change).
- [ ] Ambience plausible for place/period; no invented speeches or recordings.
- [ ] Music mirrors the ending type; no music masking key facts.
- [ ] Foley only for visible actions; no random whooshes.
- [ ] Eyes-closed test passes (audio alone is coherent and feels designed).
- [ ] Mute test passes (captions and picture alone carry the story).
- [ ] Loudness, peaks, and phone-speaker clarity checked.
- [ ] Licenses recorded for every music/SFX/voice asset.
