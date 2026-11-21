# Style Bible — 1:1 Forensic Visual Specification (`vintage-poster-explainer`)

Measured directly from frame-by-frame pixel sampling, 2× macro typography crops, and L1 temporal-diff forensics of the reference *"Danau Toba Dulunya Gunung Api Raksasa"* (`480×854` source -> produce at `1080×1920` or `720×1280`, `30 fps`, `9:16`).

---

## 1. Surface Materiality & Anti-Flat-Vector DNA

| Visual Layer | Exact 1:1 Specification | What NEVER to Do |
| :--- | :--- | :--- |
| **Master Paper Texture** | Full-canvas static (non-boiling!) vintage matte watercolor/linen paper grain (`mix-blend-mode: multiply`, opacity `0.15–0.22`) with subtle horizontal dry-brush paper fibers and warm parchment cast (`#EFE6D3`). | Never boil/jitter grain per frame (measured `sky-patch L1 = 0.000` on reference). Never skip the paper overlay (without it, SVG looks plastic). |
| **Linework / Outlines (CRITICAL 2× MACRO LAW!)** | **LINELESS PAINTERLY GOUACHE** on skies, clouds, mist, mountains, hills, and eruption ash plumes! Volume is carved purely by warm-sunlight vs cool-shadow tonal contrast + soft aerial perspective haze. Reserve thin dark sepia ink contours (`1.1–1.8px`, `#241C1B`) ONLY for foreground architectural trims, foreground tree bark/clusters, cutaway borders, scale bars, and crisp diagram arrows. | Never put thick `2.2px+` black cartoon outlines around clouds, mountains, hills, or smoke puffs (that turns painterly gouache into cheap Flash vector!). |
| **Gouache Shading & Brushwork** | Every major mass uses 3–4 painted tonal planes (warm lit top/side + cool violet/indigo shadow belly + **visible horizontal dry-brush gouache streaks** across skies, mountains, grass, and water) + atmospheric sun-wrap halation (`screen` bloom) and soft valley mist veils separating far/mid/near planes. | Never use flat uniform solid SVG fills without horizontal brushwork texture or depth mist veils. |
| **Geological / Interior Strata** | 4–5 alternating earth bands (`#945534`, `#C27A44`, `#E0C398`, `#6E4229`, `#3E261E`) overlaid with **fine horizontal hand-drawn woodcut/sedimentary grain lines** (`opacity 0.22–0.35`). Cavity walls use **vertical cliff striation lines**. | Never draw smooth solid-color rectangles for earth/walls. |
| **Painted Clouds & Ash Puffs** | Multi-lobe stacked overlapping circles merged into a unified silhouette: warm lit top (`#EFE9DA` day / `#A8A2A6` ash), cool blue-grey/violet shadow underside (`#828C98` day / `#535061` ash), crisp thin dark outer ink contour ONLY. | Never use semi-transparent Gaussian-blurred white ovals or generic puff-pill clouds. |
| **Water & Atlas Ocean** | Lake water (`#3E6776` → `#5E8B98`) layered with subtle horizontal gouache wave streaks (`#8BB5BC`, `opacity 0.28–0.45`). Vintage atlas ocean (`#28556E` → `#1E435A`) features faint cream lat/lon graticule lines (`opacity 0.14`) and bright coastal bathymetry shelf glow (`#4C8299`). | Never use flat uniform cyan `#00BFFF` water. |

---

## 2. Exact Sampled HEX Palette Matrix (All 6 Moods)

### Mood A — Daytime Vintage Travel Poster (Opening & Loop Closing)
- **Sky Top → Mid → Horizon**: `#2A627D` → `#5B96A8` → `#C6D8C8` → `#EAE2C6` (sun glow `#FAF3DA`)
- **Cloud Lit / Shadow**: `#EFE8D8` / `#858E96`
- **Lake Deep / Mid / Shimmer**: `#315768` / `#3E6776` / `#7DAAB4`
- **Hillside Grass / Forest Mid / Pine Foliage**: `#52713B` / `#3D5B34` / `#2B4028`
- **Tree Trunk / Stone Path / Cultural Accent (e.g., Batak Roof)**: `#583E2E` / `#8A7C6A` / `#9E2E24` (crimson) + `#F2E4C8` (trim)

### Mood B — Time-Rewind Dusk & Ancient Rise
- **Sky Top → Mid → Horizon**: `#212642` → `#6E6270` → `#BA876A` → `#E8B87D`
- **Ancient Landform Lit Slope / Shadow Slope**: `#BA9B86` / `#6F6372`
- **Ground Dust Billows**: `#D8C7B2` (lit) / `#8A7C84` (shadow)

### Mood C — Peak Climax / Eruption Inferno
- **Sky Top → Mid → Horizon**: `#3D1C26` → `#8F2D24` → `#D96B2B` → `#F4A642`
- **Ash Column Lit / Mid / Shadow**: `#A49C9E` / `#6D6672` / `#3F3946`
- **Lightning Bolt**: `#FFF9EC` core + `#FFE29C` thin glow (1–2 frame flashes)
- **Molten Core / Lava Rim**: `#FFF0A8` → `#F88D2A` → `#C8321E`

### Mood D — Cutaway Cross-Section & Underground Strata
- **Strata Band 1 (Topsoil/Rust)**: `#945534`
- **Strata Band 2 (Ochre Sandstone)**: `#C27A44`
- **Strata Band 3 (Warm Cream Limestone)**: `#E0C398`
- **Strata Band 4 (Deep Clay/Umber)**: `#6E4229`
- **Bedrock / Deep Shadow Base**: `#36211B`
- **Cavity Wall / Vertical Cliff Face**: `#5C493E` (lit) / `#3D2F29` (deep vertical striations)
- **Magma Chamber Gradient**: `#FFF2A6` (hot center) → `#F28828` (mid) → `#B8341E` (rim) → `#2C1618` (void ceiling)
- **Uplift / Mechanism Arrows**: `#F7F2E6` fill with `#241C1B` `2px` dark ink outline

### Mood E — Vintage Atlas Map & Rainstorm
- **Atlas Ocean Deep / Coastal Glow**: `#244F68` / `#4D859C`
- **Atlas Landmass / Contour Edge**: `#B49862` / `#6E5834` (border `#2E241C`)
- **Atlas Mountain Icons**: Tiny painted triangles `#8C7245` / `#644E2D`
- **Plume / Route Trail**: Stacked 3D-shaded painted discs (`#8A7E8C` lit / `#515568` shadow) + `#D9482B` origin dot
- **Storm Sky / Storm Clouds / Rain**: `#323E48` → `#56656E`, clouds `#3E4852` / `#283038`, diagonal rain streaks `#D8E4E6` (`opacity 0.42`)
- **Post-Storm Rainbow**: Soft desaturated vintage spectrum (`opacity 0.34`, multiply/screen blend, NEVER harsh neon!)

### Mood F — Vintage Postcard Border & Ghost Blueprint Finale
- **Postcard Outer Mat Border**: `#C9BEA7` (width `~4.5%` left/right, `~3.2%` top/bottom) with warm paper grain
- **Inner Postcard Hairline Frame**: `#3B342C` (`2px` stroke)
- **Ghost Blueprint Dashed Outline**: `#FAF0CE` / `#F6D782` (`stroke-dasharray: "10 8"`, subtle warm glow `opacity 0.85`)

---

## 3. Exact 1:1 Typography & Safe-Area Layout (`720×1280` / `1080×1920`)

| Element | Font & Weight | Color & FX | Exact Screen Placement |
| :--- | :--- | :--- | :--- |
| **Hero Title (`DANAU TOBA`, `±74.000`)** | `Alfa Slab One` (400 regular = ultra-heavy slab serif) | Fill `#FAF1DC` · Stroke `#2B1B17` (`2px` at `720w`) · **Hard 3D Extrusion Shadow `#7C3220` (`+4px, +4px`)** + soft ambient depth shadow | Top safe zone: `y = 11%–22%` (`140–280px` on `720×1280`), centered, max 2 stacked lines (`fontSize ~62–70px` @ `720w`). |
| **In-Scene Callout (`kaldera`, `India`, `Samosir`)** | `Alfa Slab One` | Fill `#FAF1DC` · Stroke `#241C1B` (`1.8px`) · Drop shadow `#382018` (`+3px, +3px`) | Positioned directly inside/beside the subject (`fontSize ~34–42px` @ `720w`). |
| **Location / Subtitle Ticket Strip (`SUMATERA UTARA`, `TAHUN LALU`, `BEKAS LETUSAN SUPER`)** | `Plus Jakarta Sans` Bold, ALL CAPS, `letter-spacing: 0.24em` | Text `#F5EFE2` inside crisp rectangular badge `#1E2631` (`opacity 0.92`, `rx=2`, horizontal padding `18px`, vertical `6px`) | Directly underneath Hero Title (`gap 10–14px`), `fontSize ~14–16px` @ `720w`. |
| **Scale Bar Label (`±100 km`)** | `Alfa Slab One` | Fill `#FAF1DC` + `#241C1B` dark outline beneath alternating `#C83226` / `#F5EFE2` vintage cartographic scale segments (`height 10px`, `#241C1B` border) | Directly below top-down subject (`y ≈ 58%–64%`). |
| **Lower-Third Brushed-Ink Karaoke Subtitle** | `Plus Jakarta Sans` Bold (`fontSize 28–30px` @ `720w`, sentence case, 1–2 lines max, 3–6 words/line) | **Backplate**: Dark slate charcoal (`#1B212C`, `opacity 0.82`) **SVG hand-brushed horizontal ribbon with jagged dry-bristle left & right tails** (NEVER plain rounded CSS pill!).<br>**Words**: Past = `#F5F2EA` · **Active = `#F8D348`** · Upcoming = `#98A0AC` (`opacity 0.58`). | Lower-third safe zone: centered at `y = 80.5%` (`1030px` on `720×1280`, well above TikTok/Shorts bottom UI & inside right-side icon clearance `x = 12%..88%`). |

---

## 4. Visual Quality Litmus Test (Anti-Cheap Checklist)
Before approving any frame, verify ALL 6:
1. **Paper Tactility Check**: Does it look like a hand-printed vintage Indonesian travel poster / illustrated encyclopedia plate, NOT a clean Figma/PowerPoint vector slide?
2. **Slab-Serif 3D Shadow Check**: Does the hero title show the signature **burnt-sienna/rust `#7C3220` offset 3D extrusion block** behind warm cream `#FAF1DC` letters?
3. **Brushed Subtitle Edge Check**: Do both left and right edges of the dark subtitle bar taper into **feathered dry-brush bristle strokes**?
4. **3-State Word Contrast Check**: Are spoken words crisp cream (`#F5F2EA`), active word unmistakable golden yellow (`#F8D348`), and future words subdued slate (`#98A0AC`)?
5. **Cutaway Texture Check**: Do geological/interior cross-sections contain subtle **horizontal woodcut grain lines** and **vertical wall striations**?
6. **Seamless Loop & Postcard Lock Check**: Does the closing scene match Beat 1's framing, draw the dashed ghost blueprint over the sky, and pull out cleanly inside the `#C9BEA7` vintage mat border?
