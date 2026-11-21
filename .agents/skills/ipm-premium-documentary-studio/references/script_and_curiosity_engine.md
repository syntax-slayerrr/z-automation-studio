# Script & Curiosity Engine (Naskah)

Goal: make true history feel like something the viewer *must* find out, in Indonesian that sounds like a person speaking, and make every one of 15 episodes feel different from the others.

## Contents
1. How curiosity works (and what is forbidden)
2. Design the episode before writing a line
3. Structure library (use IDs in the variation matrix)
4. Hook library and hook test
5. Retention mechanics: keeping curiosity alive for 60–120 s
6. Anti-monotony: measurable rules
7. Spoken Indonesian craft
8. Three-track writing method
9. Endings
10. Drafting process
11. Emotional integrity
12. Deliverables
13. Worked example (pattern, with placeholders)

---

## 1. How curiosity works
Curiosity appears when the viewer notices a **specific gap** between what they know and what they want to know. It needs three things:
- **A specific, true gap.** "Why did X happen *after* Y?" beats "Here is an amazing story."
- **Stakes.** Something was at risk or changed for real people. State why it matters in plain words.
- **A promise of payoff the script then pays.** A gap that is never closed teaches the audience to distrust you.

**Where honest gaps come from:** a verified contradiction with popular belief; a decision whose reason is documented but surprising; an unexplained timing; a name change; a place that mattered and is now forgotten; a document that exists while the context around it does not; a consequence that arrived years later; the limits of the record (what historians still debate).

**Forbidden:** fake secrets ("tak ada yang tahu"), invented conflict, invented dialogue, fake cliffhangers, vague teasers ("kisah ini akan mengejutkanmu"), and withholding a payoff to manufacture suspense. Real uncertainty is a *feature*: "the sources disagree" is a perfectly good hook when it is true.

## 2. Design the episode before writing a line
Fill these in (they feed `templates/episode_brief.md`). If you cannot answer one, the research is not finished.
1. **Central question**: one sentence, specific, answerable (or honestly partly answerable) from the ledger.
2. **Assumption to challenge**: what a typical viewer believes at second 0.
3. **The turn / reveal**: the fact or reframing that changes that belief, with evidence IDs.
4. **Question ladder**: 3 micro-questions, each answered by the next beat while raising a deeper one.
5. **Human-scale entry**: a role, a place, or an object (grounded in evidence) through which the viewer feels the history.
6. **Stakes**: what was at risk or changed, and for whom.
7. **Structure** (§3), **hook type** (§4), **ending type** (§9), chosen against the variation matrix.
8. **Distinctive idea**: the one thing only this episode does.

## 3. Structure library
Use IDs exactly as written in `variation_matrix.csv`. Beat times are for a 90 s reference; compress for 60 s, expand for 120 s.

| ID | Shape | Use when | Risks |
|---|---|---|---|
| `question_first` | Open on the question → context → evidence steps → answer → what it changes | A real puzzle exists in the record | Becomes formula if overused; do not use two episodes in a row |
| `object_doorway` | Start from one verified document, place, or artifact; widen to the story it unlocks; return to the object with new meaning | A strong verified item exists (publication, resolution text, building, photo with provenance) | Do not invent the object's details or readable text |
| `decision_point` | Situation before → the decision → options considered (only if documented) → consequence trail | A documented decision with clear before/after | Never fabricate the deliberation |
| `reverse_reveal` | Show the consequence first (a later state) → trace backwards to its cause → return to the opening image with new understanding | The result is more familiar than its cause | Keep chronology clear on screen with graphics |
| `one_day_one_room` | Compress into one documented moment or place; use contextual reconstruction carefully | Rich documented single event | High invention risk: label as contextual; no invented actions |
| `contrast_pair` | Two eras or two conditions side by side; the difference is the story | A real change over time is the point | Do not flatten complexity into "then bad / now good" |
| `map_movement` | A journey across geography: how something spread, moved, or was organized | The history is about places and reach | Needs reliable locations and dates; maps built in post |
| `misconception_correction` | "What is commonly told" → "what the record shows" → why the difference exists | A popular claim is demonstrably shaky | Tone: curious, not mocking; never "debunk" without strong evidence |
| `quiet_chronicle` | Sparse narration, long visual holds, sound-led; facts delivered in few, weighty lines | A breather; reflective or procedural history; after a dense episode | Must still have a clear gap and payoff; not an excuse for thin research |
| `numbers_ledger` | One verified quantity or series of quantities drives the story | Reliable statistics exist | Never estimate or round without saying so |
| `document_voice` | Narration organized around exact, verified wording from a real source, quoted briefly | A short verified text is powerful and rights-clear | Quote only what is exact; keep quotes short; credit |

**Reference beat maps (90 s)**
- Hook 0–5 s: open the gap.
- Orientation 5–20 s: only the context needed *now*.
- Development 20–55 s: two or three ladder steps, each visually distinct.
- Turn 55–75 s: the reveal or reframing.
- Payoff 75–90 s: close the loop, state the consequence, land the ending.
- `quiet_chronicle` shifts weight to long holds: fewer words, longer shots, a single turn near the 60% mark.

## 4. Hook library and hook test
Mechanisms (IDs for the matrix). Hooks are about *mechanism*, not wording; do not reuse a mechanism within three episodes.

| ID | Mechanism | Pattern (Indonesian; fill only with verified content) |
|---|---|---|
| `specific_question` | A precise "why/how" from the record | "Mengapa [peristiwa] justru terjadi setelah [peristiwa]?" |
| `verified_paradox` | Two true facts that seem to clash | "[Fakta A]. Tetapi [fakta B]." |
| `object_doorway` | A verified object or document | "Di tangan siapa [dokumen] ini ditulis, dan untuk siapa?" (only if supported) |
| `consequence_first` | Start from the result | "[Hasil]. Semuanya bermula dari satu keputusan." |
| `misconception_flip` | Popular belief overturned | "Banyak yang mengira [X]. Catatannya menunjukkan [Y]." |
| `scale_or_number` | One verified quantity | "[Angka terverifikasi], dalam [rentang waktu]." |
| `moment_in_medias_res` | Start mid-moment (contextual reconstruction, labelled) | A sound and an action before any narration |
| `contrast_then_now` | Two eras, one image | "Hari ini [X]. Pada masa itu [Y]." |
| `absence_gap` | What the record does *not* say | "Ada satu hal yang tidak dicatat." (only if true) |
| `decision_countdown` | A date and a looming choice | "[Tanggal]. Ada satu keputusan yang harus diambil." |
| `document_voice` | A short exact verified phrase | Quote ≤ 12 words, credited |
| `silence_image` | An image and a sound with no words for 2–4 s | Visual hook; first narration line arrives late |

**Hook test (all must pass)**
1. **Specific:** could this line open any *other* episode? If yes, it is generic.
2. **True:** every claim maps to an evidence ID.
3. **One idea**, about 3–6 seconds spoken (typically ≤ 14 words).
4. **Pictured:** the first frame is already a strong image; motion and a sound event occur in the first 2 s.
5. **Earned:** the payoff is planned before the hook is written.
6. **Fresh:** different mechanism from the previous 2 episodes and not in the banned list.

Write **three** hook variants with different mechanisms, then choose; record the two rejected hooks in the episode's script notes (they feed later episodes).

Avoid openings such as "Tahukah kamu", "Pada zaman dahulu", "Kisah ini sangat menarik", "Inilah awal mula", and unsupported "tidak ada yang tahu".

## 5. Retention mechanics (60–120 s)
- **Open loop → ladder → payoff.** Never let more than ~20 s pass without either advancing the ladder or giving a small payoff.
- **Pattern interrupt every 8–15 s:** a change in information (a new fact type), visual mode (place → hands → map → document), voice tempo, or sound texture. Change at least one, ideally in sync.
- **Orientation on demand.** No more than three unfamiliar names or dates in a row without visual orientation (map, timeline, title card).
- **Turn line.** Each episode has one line the whole script is built toward, short and plain, often followed by a half-second of silence.
- **Honest cliffhanger.** A bridge loop is allowed only when the history genuinely continues and the question is real. Phrase it as a question or a documented fact, never as a trailer promise.
- **Value density.** Every sentence adds a fact, a stake, a connection, or a feeling. If it only "sets the mood", cut it.
- **Compress the middle.** Most scripts fail between 20 s and 60 s. Make the middle the most concrete part (specific places, roles, documents), not the most abstract.

## 6. Anti-monotony: measurable rules
**Across the series**
- Hook mechanism and structure do not repeat within three episodes; endings never repeat consecutively (see the matrix rules).
- Each episode has a *distinctive idea* (structure, camera, or sound) recorded in the matrix.
- **Overuse budget:** connectives and filler phrases such as "Namun", "Di sinilah", "Ternyata", "Sementara itu", "Dan inilah", "Pada akhirnya" appear **at most once per episode** and not in consecutive episodes. `scripts/script_lint.py` enforces it.
- Do not reuse a signature sentence frame ("Semuanya bermula dari…") across episodes unless it is a deliberate series refrain (record it in the Series Bible).

**Within an episode**
- **Sentence-length rhythm:** mix short (≤ 6 words), medium (7–14), and occasional long (15–22) sentences. A sequence of four same-length sentences is a flag. Rule of thumb: the standard deviation of sentence length should be ≥ 3 words.
- Do not start more than two consecutive sentences with the same word.
- At most **two rhetorical questions** per episode; none as filler.
- Vary syntax: statement, question, fragment, instruction-like imperative ("Bayangkan…" at most once per series), list of three, and one contrast.
- Alternate exposition with a consequence, contrast, or visual reveal.
- Do not repeat a date or name in narration and on-screen text unless needed.

## 7. Spoken Indonesian craft
Write for the ear. People will hear each sentence once, at the speed of the voice.
- **Register:** warm, clear standard Indonesian (baku yang tidak kaku). Avoid slang, but also avoid bureaucratic phrasing ("dalam rangka pelaksanaan pengembangan…").
- **Concrete nouns and active verbs.** Prefer "Mereka menulis surat itu" to "Surat itu dituliskan oleh…". Reduce stacks of "di-/ke-an/pe-an" nominalizations.
- **One idea per sentence.** Aim for ≤ 18 words; allow a few up to 22 when the syntax is clean.
- **Explain institutional terms once**, briefly, the first time they appear in the series (record in the glossary).
- **Numbers and dates:** keep the master narration with proper spelling for captions; in the TTS export, spell out numbers and acronyms only where the voice engine misreads them (test first). Do not assume pronunciation: generate a short test with every proper name and number.
- **Punctuation supports breath,** not melodrama. Use full stops for decisive lines, commas for natural pauses, and avoid chains of ellipses or exclamation marks.
- **Read-aloud test:** read the script out loud at speaking pace. If you stumble, the voice will too; rewrite.
- **Breath test:** every sentence can be said in one breath without rushing.
- **Pace estimate:** documentary narration commonly runs about **2.2–2.7 words per second** including natural pauses, i.e. roughly 120–150 words for 60 s and 240–300 words for 120 s. Calibrate with a real generated sample of the chosen voice; do not force a word count.
- **Voiced ratio:** leave breathing room. Typical episodes are voiced 65–90% of the time; quiet episodes lower.

## 8. Three-track writing method
Write in one table (see `templates/script_and_shot_breakdown.md`): **Voice | Picture | Sound** per beat.
1. Decide what the picture and the sound can say alone.
2. Write narration only for what they cannot: dates, meaning, cause, stakes.
3. Leave deliberate voice-free moments (≥ 2 per episode) for sound and image to land the point.
4. Mark each line with the evidence IDs and the visual truth class of its shot.
5. Check alignment: the image should arrive just before the word that explains it (see `cinematography_shot_design.md`, narration sync).

## 9. Endings (IDs for the matrix)
| ID | What it does |
|---|---|
| `answer_resolve` | Gives the answer plainly and stops |
| `reframe` | Recasts the opening image or question with new meaning |
| `bridge_loop` | Opens a real, documented question that the next episode will address |
| `quiet_hold` | Final line, then image and sound hold with no further words |
| `consequence_echo` | Shows a later effect of the decision, then ends |
| `motif_callback` | Returns to a series motif with changed meaning |

Never end with generic inspiration ("Perjalanan masih panjang…") or "stay tuned" bait. The last sentence should be one the viewer could repeat to a friend.

## 10. Drafting process
1. Run §2; write three hooks (different mechanisms); pick one with the hook test.
2. Draft the beat sheet with timestamps and the question ladder.
3. Draft narration in **Voice | Picture | Sound** form.
4. Read aloud; cut 10–15%.
5. Evidence check: every factual line has an ID; confidence wording matches the ledger.
6. Curiosity audit: what is the gap at 5 s, 20 s, 40 s, 60 s, and the final line? Where is the turn?
7. Variation check: compare against the series matrix and `script_lint.py --series-dir`.
8. Mute test and eyes-closed test (Premium Test in `SKILL.md`).
9. Lock after user approval; export the master narration and TTS export.

## 11. Emotional integrity
Emotion comes from scale, uncertainty, sacrifice, institutional change, human consequences, and context. Do not manufacture grief, heroism, conflict, or triumph. Avoid promotional language ("luar biasa", "sangat hebat", "paling berpengaruh") unless evidence and editorial purpose justify it. No fake dialogue.

## 12. Deliverables per episode
A. One-sentence premise. B. Central question. C. Logline. D. Beat sheet with timestamps and ladder. E. Full three-track script with timestamps. F. On-screen text. G. Sound and music direction (links to the spotting sheet). H. Source markers (evidence IDs). I. **Master narration** (verified spelling, used for captions). J. **TTS export** (only pronunciation/number adjustments). K. Pronunciation and pacing guide, with narrator direction card. L. Runtime and word-count estimate (from `script_lint.py`). M. Curiosity map (loops opened and closed). N. Tempo map. O. Variation-matrix row. P. Rejected hooks.

## 13. Worked example (pattern only; brackets are placeholders, not facts)
*Weak:* "Tahukah kamu bagaimana IPM berdiri? Kisah ini sangat menarik dan penuh perjuangan."
Why weak: generic (fits any episode), no gap, no stakes, banned openers, promotional.

*Stronger pattern (`verified_paradox` hook):*
"[Fakta terverifikasi A]. Tetapi [fakta terverifikasi B]. Catatan [sumber] menunjukkan mengapa."
Beats: image of the specific place → a hands-on-paper insert → a map showing where this happened → the turn line → a quiet hold.
Why stronger: two verifiable facts create a real gap; the payoff is a documented explanation; the picture and sound each add information the voice does not repeat.

Replace every bracket only after the evidence ledger marks the claim *verified*.
