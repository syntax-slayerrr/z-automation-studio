# Style Bible — Twilight Parchment 2D Documentary

Distilled from the aesthetic DNA of `remotion/videos/earth-24h/Earth24Hours.tsx` and proven end-to-end on `remotion/videos/human-fire/`.

## 1. Color Architecture (Never `#000` or `#fff`)
- **60% Deep Shadows & Atmospheric Midtones**:
  - Deep Twilight Plum: `#160a1e` (base canvas & vignette)
  - Cave / Earth Umber: `#26152c`
  - Forest / Night Indigo: `#382246`
  - Dusk Mauve: `#5c3d68`
  - Misty / Storm Slate: `#44586c`, `#24374a`
- **30% Warm Earth & Midground Silhouettes**:
  - Foreground/Midground structures & characters sit in warm dark plum-brown (`#1e1026`–`#4a2e38`) so light-facing edges pop dramatically.
- **10% Key Light & Rim Highlights**:
  - Fire / Hearth / Civilization Ramp: Terracotta `#c84c28` → Molten Amber `#ec8238` → Flame Gold `#f8b65c` → Incandescent Cream `#ffecc4`.
  - Cold Night / Moonlight / Storm Contrast Accent (≤ 5%): Pale Moon Blue `#9ab4d4`, Electric Lightning Cyan `#dceeff`.
- **Editorial Parchment Subtitle Ramp**:
  - Card paper gradient: `#f7efde` → `#ebe0c8`, border `#d2c3a8`, subtle paper fibers `rgba(206,190,162,0.5)`
  - Spoken ink: `#241f1c` | Active karaoke word: `#ba382a` (terracotta crimson) | Upcoming ink: `#7e766c`

## 2. Five-Layer Depth Diorama (Parallax & Atmospheric Perspective)
| Plane | Role | Parallax | Blur | Visual Treatment |
|---|---|---:|---:|---|
| 1. `sky` | Sky gradient, sun/moon, twinkling stars, clouds, shafts | `0.12x` | `0px` | Smooth vertical gradient + breathing shafts |
| 2. `far` | Distant mountain ridges, horizon mist, far skyline | `0.28x` | `1.2–1.5px` | Lower contrast, hazy tint toward horizon |
| 3. `mid` | Ancient trees, cave cliffs, workshops, industrial buildings | `0.55x` | `0px` | Crisp dark silhouettes + subtle key-light rim |
| 4. `subject` | Articulated hero characters, volumetric fire, hero props | `1.00x` | `0px` | Strongest contrast, full directional rim + cast ground shadow |
| 5. `foreground` | Framing fern fronds, rock corners, near bokeh embers | `1.38x` | `4.5–6px` | Dark silhouette vignette framing edges without blocking safe zones |

## 3. Lighting, Rim-Light & Shadows
- **One Dominant Motivated Light Source per Scene** (sun, moon, lightning, fire, kiln, molten pour, city glow).
- **Dynamic Directional Rim-Lighting**: Every hero character, tree, and rock face near the light source renders a directional gradient fill (`linearGradient` angled toward the light) plus a crisp `2–3px` glowing rim contour strictly on the light-facing edge — never a uniform cartoon outline around the whole body.
- **Flickering Bounce & Cast Shadows**: When fire/furnace light is active, drive halo opacity, rim intensity, and ground cast-shadow stretch from a deterministic multi-harmonic `fireFlicker(f, seed)` (`0.86..1.14`). Shadows always point strictly away from `(lightX, lightY)`.
- **Organic Procedural Fire (`VolumetricFire2D`)**:
  - Always use a **curved rounded bowl base** (NEVER a flat horizontal bottom edge).
  - Stack 5 layers: wide `screen`-blend radial bounce halo → rising smoke ribbons → charred logs/ember bed → multi-tongue asymmetric S-curve terracotta/amber flames + detached wisps → incandescent cream heart → deterministic rising ember sparks (`hash01`).

## 4. Character Rigging & Silhouette Craft (`PrehistoricHumanRig.tsx` Pattern)
- **Origin `(0, 0)` = Ground Contact Point** between feet (zero floating characters).
- **Anatomy**: Tapered rounded SVG limb paths with seamless circular joint pivots (`pelvis → torso → head` with 5-frame head-lag, `shoulder → upperArm → elbow → forearm → hand + thumb`, `hip → thigh → knee → shin → foot`), profile brow/nose/chin head silhouette, hair/clothing secondary sway.
- **Living Idle Motion**: Subtle chest breathing (`Math.sin(f * 0.065 + seed)`), gentle sway, shivering/gesturing/walking/working pose blends via `blendPoses(poseA, poseB, easeInOutCubic(t))`.
- **Physical Contact Audit**: Whenever a character holds a tool/spear/tongs or interacts with an object (clay pot, spit, stone), verify in stills that the prop angle is natural and hands physically connect to the object.

## 5. Signature Editorial Typography & Grade (`9:16` `720×1280`)
- **Safe Zones**: Top `y = 86..175` (chapter header), Hero Action `y = 240..900`, Subtitle Card `y = 950..1080`, Bottom Margin `1100..1280`.
- **Chapter Header**: `Georgia, "Times New Roman", serif` (`44px`, `#f6ecd4`, warm golden halo `0 0 22px rgba(245,200,130,0.65)`) + uppercase tracked subheader (`Segoe UI`, `15px`, `letterSpacing: 6.5px`, `#f4eee4`).
- **Deckle-Edge Parchment Subtitle Card**: Centered at `x = 360, y = 1005..1024`, organic hand-torn polygon edge, subtle `±0.14°` deterministic tilt, soft `#100816` drop shadow, 4–7 words per card (max 2 balanced lines), Frame-0 card visible immediately on frame `0`.
- **Finishing Grade**: Warm subtle screen glow (`0.02..0.08`) + optical corner vignette (`rgba(20,10,28,0.34)`) + archival SVG paper grain (`feTurbulence`, `baseFrequency="0.72"`, `opacity: 0.04`, `mixBlendMode: 'overlay'`).
- **Anti-Slop Checklist**: Reject flat pill ellipses for clouds (use compound billowing Bezier cloud banks), sharp geometric zigzag triangles for trees (use drooping organic boughs & scalloped leaf crowns with vines), uniform outlines, static cameras, or abrupt unmotivated cuts.
