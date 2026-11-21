# Transitions & 30 FPS Motion Grammar (`vintage-poster-explainer`)

Forensically mapped from 8 frame-accurate transition strips (`transitions_part1.jpg` & `transitions_part2.jpg`) and L1 pixel-diff cadence measurements (`30 fps` continuous motion, zero stutter, zero lazy opacity cross-fades).

---

## Core Motion Law
- **True Continuous 30 FPS**: Every camera move, cloud drift, water ripple, counter spin, rising water, and plume expansion updates cleanly on every frame (`useCurrentFrame()`).
- **Zero Static Holds**: Even in calm establishing beats (`0–2s`, `33–36s`), maintain simultaneous subtle parallax life: slow drifting cumulus clouds (`0.3–0.6 px/f`), shimmering lake ripples, gently bobbing boats/foliage, soaring distant tiny birds, and a micro camera push/pull (`1.00 → 1.03`).
- **Every Scene Change Is Physically Motivated**: The camera, weather, smoke, or terrain physically carries the eye into the next beat!

---

## The 8 Signature Motivated Transitions (1:1 Choreography)

### 1. Time-Rewind / Origin Morph + Accelerating Counter (`t ≈ 2.0s → 6.5s`)
- **Mechanics**:
  - Foreground framing elements (left pine tree, right cultural house/shoreline) **dolly outward left & right** past the frame edges (`translateX ±140px`, `opacity → 0`).
  - Hero title morphs into a **rolling numeric counter** (`±400 → ±3.000 → ±10.300 → ±24.700 → ±46.600 → ±62.100 → ±74.000`) with non-linear ease-in-out curve (`easeInOutCubic`) locking cleanly onto the target figure with `TAHUN LALU` ticket bar beneath.
  - Water/modern surface **drains/recedes vertically** exposing textured ancient ground while sky interpolates smoothly from daytime teal → twilight plum-amber, sun shifts & swells, and the ancient structure **rises physically upward from the horizon** accompanied by rolling base dust clouds!

### 2. Blinding Flash + Radial-Blur Title Blowout + Camera Shake (`t ≈ 7.6s → 9.3s`)
- **Mechanics**:
  - At the climax trigger frame (`t0`):
    - Full-frame warm **white-gold flash** (`#FFF6DC`, `opacity 0 → 0.92` in `4 frames`, decays `0.92 → 0` over `14 frames`).
    - The counter/title **zooms violently into the lens with blur** (`scale 1.0 → 2.5`, `blur 0 → 16px`, `opacity 1 → 0` over `12 frames`) — feels like the shockwave literally blew the title away!
    - **Damped high-frequency camera shake** (`±8–14px` X/Y decaying over `45–90 frames`) synchronized with billowing multi-lobe ash puffs, symmetrical twin flow streams down both slopes, and **1–2 frame pure-white jagged lightning flashes** inside the column!

### 3. Vertical Camera Crane-Down Peel into Cutaway Cross-Section (`t ≈ 11.8s → 13.0s`)
- **Mechanics**:
  - Instead of cutting to a diagram, the camera **tilts/cranes continuously downward (`18–24 frames`)** — the subterranean chamber rises smoothly from the bottom edge while the exterior facade smoothly unveils the **stratified gouache geological/structural cross-section** directly aligned with the exterior silhouette above it!
  - Internal energy/liquid (magma, water, pressure, flow) actively animates inside the chamber/conduit (draining level, rising bubbles, pulsing glow).

### 4. Physical Shear / Structural Collapse + Term Callout Pop (`t ≈ 14.5s → 18.0s`)
- **Mechanics**:
  - Crisp dark vertical fault/cut lines draw down (`8 frames`).
  - The central block **physically shears and plunges straight down** (`easeInCubic` acceleration + brief bottom bounce/dust puff + micro-shake!) revealing the vertical cliff wall behind it.
  - Clean `Alfa Slab One` term label (e.g., `kaldera`) pops cleanly inside the newly opened space with `springSettle` (`scale 0.8 → 1.03 → 1.0`).

### 5. Painted Cloud-Curtain Wipe → Top-Down Aerial + Animated Scale Bar (`t ≈ 18.2s → 20.2s`)
- **Mechanics**:
  - Giant overlapping 2-tone painted cloud/ash puffs **rush inward from all edges to cover 100% of the canvas** (`12 frames`), hold full cover for `2 frames` while swapping from side cross-section to **90° top-down aerial view**, then **part radially outward** (`16 frames`)!
  - Below the top-down shape, dashed measurement drop-lines extend downward and an **alternating red-and-cream vintage cartographic scale bar (`±100 km`)** draws left-to-right (`stroke-dashoffset` / width reveal).

### 6. Continuous Aerial-to-Atlas Zoom-Out + 3D Stacked Trail/Plume (`t ≈ 20.2s → 22.8s`)
- **Mechanics**:
  - Seamless **continuous Mercator zoom-out** (`scale ~4.5x → 1.0x` over `28 frames`) straight from the top-down landform out to a real `d3-geo` **Vintage Painted Atlas Map** (showing surrounding islands/countries, bathymetry contours, and faint atlas graticules).
  - Along a curved `geoInterpolate` great-circle arc, **overlapping 3D-shaded painted discs/puffs** spawn sequentially from origin to destination (`TOBA → India`), culminating in a crisp `Alfa Slab One` destination label pop!

### 7. Second Cloud-Curtain Wipe → Atmospheric Transformation + Rainbow Clear (`t ≈ 22.5s → 25.8s`)
- **Mechanics**:
  - Another brisk painted cloud-curtain wipe swaps the atlas map into a **dramatic enclosed atmospheric view** (e.g., inside the dry caldera under dark rolling storm clouds and fast diagonal rain streaks).
  - Over `3 seconds`: liquid/change level **rises visibly upward**, dark clouds part & lighten to vintage daytime teal, warm sun blooms, tiny bird silhouettes glide across the sky, and a **soft translucent vintage rainbow arc** draws smoothly left-to-right!

### 8. Vertical Crane-Down Secondary Reveal → Loop Return → Dashed Ghost Blueprint + Vintage Postcard Finale (`t ≈ 25.8s → 38.4s`)
- **Mechanics**:
  - **Secondary Cutaway (`25.8–32.0s`)**: Smooth vertical crane-down returns to the cross-section (now filled with blue water!). Deep energy/magma swells upward, **3 crisp white outlined block arrows (`↑ ↑ ↑`)** pulse upward cyclically, and the central block physically **lifts above the waterline** revealing lush green surface + `Alfa Slab One` label (`Samosir`).
  - **Seamless Loop Return (`32.0–35.5s`)**: Smooth water-horizon match transition brings back the **EXACT opening composition from Beat 1** (left foreground tree + center vista + boats + right cultural landmark).
  - **Dashed Ghost Blueprint (`35.5–37.0s`)**: Right over the peaceful modern sky, **luminous cream-gold dashed lines (`stroke-dasharray: "10 8"`, `pathLength={1}` animated `strokeDashoffset 1 → 0`)** trace the colossal hidden past/structure!
  - **Collectible Vintage Travel Postcard Pull-Out (`37.0–38.4s`)**: The entire scene smoothly scales down (`scale 1.0 → 0.90`, `easeOutQuint`) inside a **thick warm cream vintage poster mat border (`#C9BEA7`) with dark inner hairline (`#3B342C`)**, while the **Hero `Alfa Slab One` Title + Dark Slate Punchline Ribbon** lock crisply at the top!
