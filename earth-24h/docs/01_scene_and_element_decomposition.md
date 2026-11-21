# PHASE 1 — FORENSIC VIDEO ANALYSIS & SCENE DECOMPOSITION

## A. Technical Metadata (Measured via `ffprobe`)

| Parameter | Measured Value |
|---|---|
| **Source File** | `ref.mp4` (`Kalau_Umur_Bumi_Cuma_24_Jam,_Manusia_Muncul_Jam_Berapa__#shorts.mp4`) |
| **SHA-256** | `ce7d9895523bf34d8898b7c149b5b4a5d76372997f2c874837102a28d30c704e` |
| **Resolution** | `720 x 1280` pixels |
| **Aspect Ratio** | `9:16` (`1:1` SAR) |
| **Frame Rate (FPS)** | `30/1` (`30.000 fps` constant, native 30fps without 24->30 pulldown duplicates) |
| **Total Video Frames** | `1,194` frames (`f = 0..1193`) |
| **Video Stream Duration** | `39.800000` seconds (`start_time = 0.033333s`, `time_base = 1/15360`) |
| **Container / Audio Duration** | `39.925215` seconds (`5,665,398` bytes, overall bitrate `1,135,202` bps) |
| **Video Codec** | H.264 / AVC (`avc1`, Main Profile `77`, Level `3.1`, `1,006,396` bps) |
| **Pixel Format & Color Space** | `yuv420p`, `color_range: tv` (limited), `color_space: smpte170m`, `color_transfer: bt709`, `color_primaries: bt470bg` |
| **Audio Codec** | AAC LC (`mp4a`, `fltp`, `44,100` Hz, `2` channels stereo, `127,893` bps) |

---

## B & C. Scene & Timeline Decomposition (`f = 0..1193`)

| Scene / Shot | Frame Range | Time Range (s) | Header Timestamp & Subheader | Visual / Animation Sequence |
|---|---|---|---|---|
| **Scene 1** (`shot_001`) | `0000..0238` | `0.000 - 7.933` | `4,5 miliar tahun` / `= 24 jam` -> `00.00` | Fade in from black (`f=0..8`), camera pulls out from `scale=1.45` to `0.91` (`f=0..21`), then slowly pushes in to `0.995` (`f=21..216`). Clock hands spin rapidly as sun & moon orbit over 2 purple wave layers inside viewport and colored era arcs sweep clockwise around dial. At `f=217..230`, dark rust curtain wipes upward inside viewport. |
| **Scene 2** (`shot_002`) | `0239..0430` | `7.967 - 14.333` | `00.00` / `BUMI TERBENTUK` -> `±04.00` | Camera zooms through clock viewport (`f=232..246`) into dark rust cosmos. Molten proto-Earth sphere expands (`r=48 -> 212`) with 3-tier glowing yellow-orange magma fissures while maroon volcanic cloud layers rise at bottom. At `f=387..405`, camera zooms out to clock dial (`00:00 -> 04:00`), and teal ocean wipes in (`f=408..426`). |
| **Scene 3** (`shot_003`) | `0431..0568` | `14.367 - 18.933` | `±04.00` / `KEHIDUPAN PERTAMA` | Camera zooms through clock viewport (`f=428..447`) into fullscreen deep teal ocean (`#185f66`) with 6 diagonal white-cyan sunbeams, top/bottom scalloped wave borders, and floating geometric microbes (green capsule rods with twin dots, concentric cyan cells, 3-bead cocci chains, and bubbles). Zooms out at `f=557..574`. |
| **Scene 4** (`shot_004a`) | `0569..0695` | `18.967 - 23.167` | `04.07` -> `22.46` / `MAKHLUK MIKROSKOPIS` | Full clock dial view with slow push-in (`scale=0.915 -> 1.015`). Header counts continuously from `04.07` to `22.47` while hour hand advances from `60°` to `341.7°`, minute hand spins with motion-blur fan, and teal/purple era arcs sweep around rim. At `f=678..690`, inner viewport transitions from teal microbes to purple prehistoric sky. |
| **Scene 5** (`shot_004b` & `shot_005`) | `0696..0924` | `23.200 - 30.800` | `22.47` (`DINOSAURUS DATANG`) -> `23.39` (`ASTEROID • PUNAH`) | Camera zooms into purple prehistoric night landscape (`f=692..710`) with crescent moon, volcanic smoke plumes, and cycad/palm trees. Sauropod (left) and Theropod (right) silhouettes walk in (`f=702..730`). At `f=840..856`, timestamp shifts to `23.39` and moon shifts right. At `f=900..924`, blazing orange-white asteroid streaks diagonally from top-right toward dinosaurs. |
| **Scene 6** (`shot_006`) | `0925..1129` | `30.833 - 37.633` | `23.39` -> `23.47.21`..`23.59.54` / `MANUSIA MUNCUL` | Cream-white impact flash (`f=926..952`, peak `f=936`) reveals billowing orange post-impact dust cloud (`f=936+`) as both dinosaur silhouettes tilt and fall downward out of frame (`f=942..966`). Camera zooms out to clock (`f=992..1006`), counts in `HH.MM.SS` to `23.59.54`, and zooms into top rim (`22..24`, `cx=515, cy=1016, scale=1.92`, `f=1052..1076`) where yellow `6 DETIK` band and waving human silhouette appear (`f=1068+`) as red second hand ticks toward `24`. |
| **Scene 7** (`shot_007`) | `1130..1193` | `37.667 - 39.767` | `24.00` / `TENGAH MALAM` | Red second hand hits `24` (`0°`) at `f=1130` with warm golden radial flare (`f=1128..1154`). Header switches to `24.00 TENGAH MALAM`, and camera pulls out (`f=1145..1173`) to full 24-hour celestial clock dial (`cx=364, cy=622, scale=0.96`). |

---

## D. Visual Element Decomposition (All 18 Categories)

1. **Geometric Shapes**: Concentric clock circles (`r = 5.5, 17.5, 212, 221, 232, 262, 276, 330, 336, 396`), 48 bezel scallop lobes (`r = 24` along `R = 338`), 48 triangular sunray spikes (`r = 346..384`), 4 colored geological era arc segments (`r = 262..276`).
2. **Vector Illustrations**: Sauropod silhouette, Theropod silhouette, prehistoric cycad/palm fronds, molten proto-Earth magma fissure network, asteroid rock head & flame tail, scalloped volcanic/ocean/impact cloud layers.
3. **Icons**: Waving human silhouette (`C3`) on the `6 DETIK` yellow sector band (`r = 247, angle = 250.5°`), crescent moon icon, sun disc with 18 fan rays.
4. **Typography**: Top display serif headers (`Times New Roman Bold`, `116px` / `104px`), tracked uppercase sans-serif subheaders (`Segoe UI Bold`, `17px`, tracking `7.2px`), clock chapter numerals `1..24` (`20px`, `24` at `29px`), curved `"6 DETIK"` label (`11px`).
5. **Text Blocks**: Bottom deckle-edged cream paper subtitle cards (`cy = 1002.5` for 1-line `h = 71px`, `cy = 1024.5` for 2-line `h = 117px`, `Segoe UI Bold 37px`) with word-level terracotta red (`#b8382a`) active word highlight.
6. **Images**: None (0% photographic/bitmap embeds; 100% vector/code-rendered graphics).
7. **Backgrounds**: Deep indigo starry night (`#2a183b -> #150a1c`), rust-maroon Hadean cosmos (`#8e4026 -> #401216`), primordial teal ocean (`#2c868a -> #12484f`), prehistoric purple night (`#8c5ba3 -> #342256`).
8. **Gradients**: Radial background illumination fields on all 4 scenes + warm golden bloom behind serif timestamps and molten sphere.
9. **Patterns**: 96 radial clock tick marks (24 hour ticks + 72 fifteen-minute ticks), 72 outer astronomical perimeter dots, concentric decorative wave arcs on ocean floor lobes.
10. **Lines & Strokes**: Thin lavender/rose rim highlights (`1.5–2px`) along dinosaur backs, wave crests, and cloud lobes; 6 diagonal white-cyan underwater sunbeam shafts (`width = 8–11px`).
11. **Particles**: 95 twinkling star dots (`r = 0.8..2.0px`), 36-dot spiral galaxy cluster at `(215, 215)` in Scene 2, rising underwater ring bubbles (`r = 6..8px`).
12. **Decorative Elements**: 4 rotating antique brass corner gears (`top-left (-310, -365, r=125)` & `(-205, -465, r=78)`; `bottom-right (215, 245, r=76)` & `(305, 365, r=120)` relative to clock center), bottom scalloped indigo wave border (`y = 1235..1280`).
13. **Masks**: Circular inner viewport clipping mask (`R = 212 * scale`) centered at `(cx, cy)`.
14. **Shadows**: Deckle-edge subtitle card drop shadow (`offset = (+2, +5)`, `rgba(12, 8, 16, 135)`), inner viewport rim shadow (`width = 2.5px`, `rgba(80, 65, 50, 140)`).
15. **Highlights**: Yellow `6 DETIK` arc highlight (`244°..270°`, `#f8ec84`), terracotta red active word highlight (`#b8382a`), rim outlines on silhouettes.
16. **Overlays**: White-cream asteroid impact flash (`f = 926..952`, peak opacity `97%` at `f = 936`), warm golden midnight flare (`f = 1128..1154`), deterministic paper grain (`sigma = 2.2` RGB levels).
17. **UI Elements**: None (pure editorial storybook animation).
18. **Other Visual Objects**: Multi-ghost motion-blur fan (`6` trailing semi-transparent spade hands) behind fast-spinning minute hand (`f = 0..214` and `f = 584..678`).
