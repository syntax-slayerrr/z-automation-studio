# PHASE 3 & PHASE 5 — VISUAL DESIGN, COLOR SCIENCE, TYPOGRAPHY & AUDIO SPEC

## 1. Color Science (Sampled Ground-Truth Palette)

| Visual Region / Element | Hex Value | RGB Tuple | Usage |
|---|---|---|---|
| **Indigo Cosmos Center / Edge** | `#2a183b` / `#150a1c` | `(42, 24, 59)` / `(21, 10, 28)` | Primary clock canvas radial backdrop |
| **Antique Brass Gear Fill / Rim** | `#805c2a` / `#a87e41` | `(128, 92, 42)` / `(168, 126, 65)` | Corner mechanical cogs |
| **Scalloped Gold Bezel** | `#a27236` / `#c69a58` | `(162, 114, 54)` / `(198, 154, 88)` | 48-scallop clock outer frame |
| **Cream Chapter Ring** | `#e8d6b4` -> `#cab28d` | `(232, 214, 180)` -> `(202, 178, 141)` | 24-hour numeral dial ring |
| **Era Arc 1 — Hadean (`00–04`)** | `#da5c38` | `(218, 92, 56)` | Molten Earth era band |
| **Era Arc 2 — Microbes (`04–21`)** | `#309c92` | `(48, 156, 146)` | Primordial single-celled life band |
| **Era Arc 3 — Complex/Dinos (`21–23.65`)** | `#7a56ac` | `(122, 86, 172)` | Multicellular & dinosaur era band |
| **Era Arc 4 — Human (`23.65–24`)** | `#e0b654` / `#f8ec84` | `(224, 182, 84)` / `(248, 236, 132)` | Final seconds & `6 DETIK` highlight band |
| **Molten Earth Crust / Magma Core** | `#a84c1e` / `#fcd87c` | `(168, 76, 30)` / `(252, 216, 124)` | Scene 2 proto-Earth sphere & fissures |
| **Primordial Ocean Mid / Deep** | `#2c868a` / `#12484f` | `(44, 134, 138)` / `(18, 72, 79)` | Scene 3 underwater backdrop |
| **Microbe Rod Green / Cell Cyan** | `#baec94` / `#b6eee6` | `(186, 236, 148)` / `(182, 238, 230)` | Scene 3 & 4 single-celled organisms |
| **Prehistoric Night Glow / Sky** | `#8c5ba3` / `#342256` | `(140, 91, 163)` / `(52, 34, 86)` | Scene 5 dinosaur night sky |
| **Dinosaur Silhouette / Rim** | `#3a2454` / `#a58ac0` | `(58, 36, 84)` / `(165, 138, 192)` | Sauropod & Theropod paper-cutout bodies |
| **Post-Impact Dust Cloud** | `#c9754b` | `(201, 117, 75)` | Scene 6 billowing extinction dust |
| **Deckle Paper Card / Active Word** | `#f2ead8` / `#b8382a` | `(242, 234, 216)` / `(184, 56, 42)` | Bottom subtitle strip & active spoken word |

---

## 2. Typography Engineering

1. **Primary Timestamp Header (`00.00`, `±04.00`, `12.42`, `22.47`, `23.39`, `23.59.54`, `24.00`)**:
   - **Typeface**: Lining Bold Serif (`Times New Roman Bold`, `timesbd.ttf`)
   - **Size & Position**: `116px` (`HH.MM`, cap height `77px`, width `270px`) / `104px` (`HH.MM.SS`, width `406px`), top cap edge aligned at `y = 148px`
   - **Color & Compositing**: `#fcf6ea` fill with `radius = 9px` Gaussian warm gold outer glow (`rgba(245, 208, 145, 0.65)`)
2. **Tracked Uppercase Subheader (`BUMI TERBENTUK`, `KEHIDUPAN PERTAMA`, `MAKHLUK MIKROSKOPIS`, `DINOSAURUS DATANG`, `ASTEROID • PUNAH`, `MANUSIA MUNCUL`, `TENGAH MALAM`)**:
   - **Typeface**: Bold Geometric Sans-Serif (`Segoe UI Bold`, `segoeuib.ttf`)
   - **Size, Tracking & Position**: `17px`, letter-spacing `+7.2px`, baseline at `y = 248px`, color `#f0eae1`
3. **Deckle-Edged Paper Subtitle Cards (20 Cards across `39.80s`)**:
   - **Typeface**: Bold Humanist Sans-Serif (`Segoe UI Bold`, `37px`, line height `45px`)
   - **Card Geometry**: 1-line cards at `cy = 1002.5px, h = 71px`; 2-line cards at `cy = 1024.5px, h = 117px`; procedural sinusoidal deckle wave (`amplitude = 1.4px`) along top and bottom edges with `(+2, +5)` drop shadow
   - **Word Highlight State Machine**:
     - Spoken words (`idx < active_word_idx`): Dark Charcoal `#24201e`
     - Active word (`idx == active_word_idx`): Terracotta Red `#b8382a`
     - Upcoming words (`idx > active_word_idx`): Warm Grey `#7a7268`

---

## 3. Audio Reconstruction & Stem Analysis (`rea-video` Stems)

- **Integrated Loudness & Peak**: `-17.3 dBFS` integrated, `-1.5 dBFS` true peak.
- **Separated Stems** (in `earth-24h/analysis/stems/`):
  - `original.wav`: Full stereo master (`44.1 kHz`)
  - `vocals.wav`: Indonesian male/neutral narration voiceover (`38%` active speech ratio, fundamental pitch `~147 Hz`)
  - `music.wav`: Atmospheric cinematic background score (`95.7 BPM`, key `A minor`, active `0.0s–37.5s` with structural transitions at `6.0s`, `11.0s`, and `32.0s`)
- **Synchronization**: In `render_video.py`, the exact original AAC stereo stream from `ref.mp4` (`1:a:0`) is muxed losslessly in sync with the `30.000 fps` reconstructed video stream (`0:v:0`).
