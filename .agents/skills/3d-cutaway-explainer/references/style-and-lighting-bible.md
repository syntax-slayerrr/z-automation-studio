# Three.js Pro Visual, Lighting, PBR & Shader Bible

This reference specifies the mandatory rendering upgrades that elevate pure-code Three.js + Remotion from "flat WebGL primitives" to **Blender Eevee/Cycles-grade stylized 3D diorama quality**.

## 1. Renderer & Tone Mapping Lock
Configure `<ThreeCanvas>` identically on every project:
```tsx
<ThreeCanvas
  width={width}
  height={height}
  shadows="percentage"
  dpr={1}
  gl={{
    antialias: true,
    powerPreference: "high-performance",
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.04,
    outputColorSpace: THREE.SRGBColorSpace,
  }}
>
```

## 2. Synthetic PMREM HDRI Environment (`proEnvironment.ts`)
Never rely solely on `<ambientLight>` (which flattens shading into dull gray plastic). Generate a deterministic equirectangular sky/sun/ground texture in Canvas2D, pass it through `THREE.PMREMGenerator`, and bind to `scene.environment`:
- **Daylight**: Deep azure zenith (`#1E6FC4`), airy horizon (`#C9E7FD`), bright warm solar hotspot (`#FFF8DC` at top-left-front), warm sandy earth bounce hemisphere (`#B89670`).
- **Blazing Heat**: Slightly hazy warm cyan zenith (`#3888C8`), golden-peach horizon haze (`#FFE2B3`), intense bright sun disk (`#FFF4C4`), hot terracotta ground bounce (`#C88E56`).
- **Storm / Rain**: Overcast steel-blue zenith (`#3A5068`), misty slate horizon (`#8DA2B5`), cool damp ground bounce (`#555C62`).
- **Golden Hour / Dusk**: Periwinkle-violet zenith (`#526492`), coral-peach horizon (`#F9C4A4`), warm sunset sun bounce (`#FF9B54`), warm umber ground bounce (`#6E4832`).

Result: Every metallic rail, bolt, gravel facet, ceramic insulator, skin surface, and wooden plank receives physically believable specular highlights, ambient occlusion bounce, and color-tinted shadows!

## 3. Procedural PBR Texture Triplets (`Albedo + Sobel NormalMap + RoughnessMap`)
Build a reusable `createPBRTriplet(heightCanvas, albedoCanvas, roughnessRange, normalStrength)` utility:
1. Draw deterministic procedural micro-height data into a grayscale `heightCanvas` (e.g., soil clods + roots, fractured granite facets, brushed metal streaks, concrete pores, wood grain, scalloped terracotta roof tiles).
2. Convert `heightCanvas` into a tangent-space **RGB Normal Map** using a 3x3 Sobel filter (`dx`, `dy`, `dz = 1 / strength`), yielding crisp directional micro-lighting under the sun!
3. Map `heightCanvas` into a **Roughness Map** (crevices rougher `0.85–0.95`, raised facets/polished edges smoother `0.25–0.55`).
4. Always set `albedoTex.colorSpace = THREE.SRGBColorSpace`, while `normalMap` and `roughnessMap` remain `THREE.NoColorSpace` (linear)!

## 4. Custom GLSL Sky Dome & Sculpted Cumulus Cloud Strata
Replace static flat cloud planes or blurry smeared fog noise with a deterministic `THREE.ShaderMaterial` sky dome (`sphereGeometry` radius 72):
- Uniforms: `uTime` (driven deterministically by `frame / fps`), `uZenith`, `uHorizon`, `uGround`, `uSunDir`, `uSunColor`, `uCloudLight`, `uCloudShadow`, `uCloudCover` — interpolated continuously via `rainFactor` (`0..1`) and `duskFactor` (`0..1`) for smooth weather timelapses and sunrise loops!
- Fragment shader computes:
  1. Clear azure tropical Rayleigh sky gradient (`#1E76D0` zenith → `#BBE1FC` horizon in daylight; `#54689E` → `#F6B89A` coral-peach at dusk).
  2. Horizontally stretched perspective cloud UV (`vec2(baseUV.x * 0.72, baseUV.y * 1.48)`) with multi-octave FBM shaped by a **crisp threshold (`smoothstep(threshold, threshold + 0.085, n)`)** so clouds read as bright, crisp sculpted Blender cumulus strata (`#FFFFFF` tops, `#C4DDF4` undersides) — NEVER smeared gray fog!

## 5. Frontal-3/4 Tropical Sunlight, Shadow Hygiene & Grounded Contact AO Decals
- **Primary Sun `directionalLight`**: Place at **frontal-left-upper** (`sunDir = [-0.46, 0.72, 0.88]` scaled `* 18`, intensity `2.55`, color `#FFF7E8`), `shadow-mapSize={[2048, 2048]}`, tight shadow frustum (`[-11, 11, 11, -5]`), **`shadow-bias={-0.0005}`, `shadow-normalBias={0.045}`** (critical to eliminate 100% of knee/elbow shadow-acne rings!). The strong `+Z` frontal component ensures character faces under wide brims, book spines, walls, and cutaway soil faces stay brightly & warmly lit while casting crisp diagonal shadows toward back-right!
- **Warm Balanced Fill**: Add a soft frontal fill `directionalLight` (`position={[3.5, 2.8, 12.0]}`, intensity `0.56`, `#FFF5E6`) + opposite cool rim light (`[10, 6, -8]`, intensity `0.42`) + warm sky/earth `hemisphereLight` (intensity `0.92`) so cast shadows read warm taupe-brown rather than crushed pitch-black!
- **Contact AO Shadow Decals**: Place soft radial dark gradient discs (`opacity: 0.55–0.65`, `depthWrite: false`) right at `Y = 0.005` beneath character feet and yard props.

## 5b. 1:1 PBR Material Anti-Slop Checklist (Verified Forensically Against `@gimanabisaid`)
- **Soil Cutaway (`createSoilPBR`)**: Smooth painterly 5-stop earth gradient (`#4B311E` humus → `#B06D3C` ochre → `#BF7642` terracotta → `#8B4624` base) with soft low-alpha cloud mottling (NO sharp polka dots!), **thin organic warm tan-brown capillary roots (`#C4A27A` / `#AE8A64`, width `0.8–2.4px`, top 40% only — NEVER thick bright white spaghetti cobwebs!)**, and **small matte beige/taupe pebbles (`3–6px` — NEVER huge shiny concave bowls!)**. NEVER line up giant polygonal dodecahedron rocks along the cutaway edge!
- **Terracotta Genteng Roof (`createTerracottaRoofPBR`)**: Always draw **staggered scalloped barrel clay tiles** with curved horizontal highlight-to-shadow shading + bottom course overlap lip — NEVER flat horizontal orange stripes!
- **Stucco & Yard (`createStuccoPBR`, `createGroundYardPBR`)**: Subtle mottled plaster with gentle bottom-plinth weathering; warm sunlit cream-sand yard (`#DFCCA9`) without noisy dark gravel speckles.
- **Glowing Energy / Leakage Effects**: Use soft radial Gaussian glow `CanvasTexture` sprites with `THREE.AdditiveBlending` and `depthWrite={false}` — NEVER hard-edged opaque white spheres!

## 6. Macro 85mm Depth-of-Field Bokeh & Cinema Lens Polish (Remotion ANGLE Safe!)
**CRITICAL REMOTION HEADLESS RULE**: Avoid `@react-three/postprocessing` `<EffectComposer multisampling={4}>` in headless Chromium ANGLE renders — its MSAA offscreen render target hijacks R3F's priority loop and can return a blank transparent WebGL frame!
Instead, achieve guaranteed 100% deterministic cinema bokeh & lens polish directly in primary WebGL + compositing:
- **Macro 85mm Soft Bokeh Backdrop**: During macro close-ups, place a dedicated procedural soft-blurred radial-bokeh village/foliage backdrop plane directly behind the razor-sharp 3D PBR hero prop (paired with a local macro studio `pointLight`), giving authentic shallow DOF separation at zero offscreen-buffer risk!
- **Glowing Highlights**: Use `toneMapped={false}` emissive cores with additive halo meshes on sparks, headlights, lock points, and power/stress paths.
- **Cinema Lens Vignette**: Apply a subtle CSS radial-gradient vignette (`rgba(0,0,0,0) 58% -> rgba(12,16,24,0.28) 100%`) above `<ThreeCanvas>` and beneath typography.

## 7. Clean Screen-Space Typography & Technical Callouts
- **Subtitles**: Crisp bold sans-serif (`Poppins`/`Montserrat`/`Segoe UI`, `800` weight, `30px` at `720x1280`), color `#FAF7F0`, positioned cleanly at `top: 75%` (`y = 0.75`). **NO opaque dark boxes or pills behind subtitles!** Use layered crisp soft drop-shadow (`0 2px 6px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.95)`).
- **Leader Lines & Dimension Brackets**: Crisp `3px–4px` SVG polylines (`#FFD740` gold or `#FFFFFF` white) with small circular anchor dots (`r=5`) pointing cleanly to the exact 3D feature + clean bold shadow-only white label text.
- **Force & Physics Arrows**: Bold shaded 3D extruded meshes or crisp SVG vector arrows with dark bevel border:
  - Load / Tension / Danger: `#E53935` (crimson red)
  - Heat / Thermal Expansion: `#FF7A26` (glowing orange)
  - Compression / Cooling / Stabilizing: `#389BFF` (vivid cobalt blue)
  - Safe Flow / Balanced Distribution: `#48E57A` (mint emerald)
- **ZERO Platform Watermarks**: Never render TikTok logos, `@handles`, or platform end-cards.

## 8. 1:1 Aspect-Correct Square UV Rule for Wide Strata Cutaway Planes
When mapping a square `1024x1024` procedural soil or rock texture across an elongated cutaway plane (e.g., `24m–26m` wide by `4.6m` high, ratio ~5.5:1), standard `[0, 1]` UV mapping stretches the texture horizontally by over 500%, turning round pebbles into oblong streaks and razor roots into blurry bands.
- **Mandatory Fix**:
  1. The texture generator must use horizontally tileable noise/strata with modulo wrap at boundaries (`ox in [-size, 0, size]`).
  2. Configure the Three.js CanvasTexture triplet identically:
     ```ts
     map.wrapS = THREE.RepeatWrapping;
     map.wrapT = THREE.ClampToEdgeWrapping;
     map.repeat.set(5, 1); // Math.round(width / height)

     normalMap.wrapS = THREE.RepeatWrapping;
     normalMap.wrapT = THREE.ClampToEdgeWrapping;
     normalMap.repeat.set(5, 1);

     roughnessMap.wrapS = THREE.RepeatWrapping;
     roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
     roughnessMap.repeat.set(5, 1);
     ```
- **Result**: 100% square 1:1 texels with razor-sharp vertical taproots, spherical 3D pebbles, and rich stippled earth strata matching reference videos forensicly.

## 9. Synchronous Mesh Arrays vs. Asynchronous InstancedMesh in Headless Remotion
Remotion's headless Chromium renderer captures individual frames at arbitrary timestamps and can drop `useEffect()` callbacks between frames.
- Using `useEffect` or stateful matrix updates to populate `<instancedMesh>` can lead to frame drops where instances render as untextured white cubes/boulders or fail to initialize on frame 0.
- **Mandatory Fix**: Use synchronous `<mesh>` arrays with deterministic `useMemo()` geometry/materials. For scattering 50–300 stones, gravel particles, or grass tufts, synchronous arrays render reliably with zero glitch risk across all parallel Chromium worker tabs.

## 10. Seamless Visual & Verbal Loop Returning to Frame 0
Every 3D cutaway explainer short MUST end with a seamless loop returning cleanly to Frame 0:
- The final shot (e.g., last 90–120 frames) smoothly glides the camera position, lookAt, and FOV back to match Frame 0's exact camera parameters via cubic Hermite interpolation (`t * t * (3 - 2 * t)`).
- Environment lighting transitions back to the opening daylight mood (`weather = "day"`).
- Props and actors smoothly reset to their opening positions.
- **ZERO Platform Watermarks**: Never render TikTok logos, `@handles`, or platform outro cards.

## 11. PowerShell Execution Directives (`& npx`, `;` chaining, temp cleanup)
- On Windows PowerShell, `npx` resolves to `npx.ps1`, not an executable. Calling `Start-Process "npx"` throws `"not a valid Win32 application"`. Always use `& npx` directly in scripts.
- Chain sequential commands with `;` instead of `&&`.
- Windows background cleanup can delete `$env:TEMP\remotion-*` during long multi-minute renders. Always use chunked rendering (`~250–350` frames per chunk) with temp dir cleanup before each chunk and `--timeout=90000`.
