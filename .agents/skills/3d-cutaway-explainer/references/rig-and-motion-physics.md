# Character Rigging (2-Bone Analytical IK), Organic Diorama Modeling, Transitions & Seamless Loop Physics

## 0. Next-Gen 2-Bone Analytical Inverse Kinematics (`ikSolver.ts` & `MannequinProIK.tsx` — V6 Standard)
Proven on `remotion/videos/sawah-terasering/` (`1080×1920` Full HD). **Never use manual Forward Kinematics (FK) shoulder/elbow rotation guessing when a character holds tools or walks on slopes!**
1. **`solveTwoBoneIK(rootPos, targetPos, len1, len2, poleHint)`**:
   - Uses deterministic Law of Cosines in world space (zero stateful drift in Remotion `useCurrentFrame()`) returning twist-stabilized `upperQuat` and `lowerQuat` for all 4 limbs (`armL`, `armR`, `legL`, `legR`).
2. **`Prop-Drives-Hand` Zero-Clipping Architecture**:
   - Animate the tool/prop FIRST (hoe chop cycle, clay water pitcher tilt, bamboo pipe placement, seedling bundle) and export exact world-space `leftGripWorld` and `rightGripWorld` coordinates from the prop's transformation matrix.
   - Feed `leftGripWorld` and `rightGripWorld` directly into `MannequinProIK` → hands stay locked to the tool handle to the sub-millimeter with **0.00 mm clipping or detachment**.
3. **Biomechanical `Terrain-Locked Foot IK` (`getTerrainY` & `getTerrainSlopeAngleZ`)**:
   - Both the 3D terrain mesh (`TerraceHillCutaway.tsx`) and the character's sandals query the exact same mathematical surface function `getTerrainY(x, z, morph)`.
   - Set pelvis height relative to the LOWER foot (`hipY = Math.min(leftFootY, rightFootY) + 0.655 - crouch`) so the downhill leg extends naturally and the uphill knee bends athletically against 30° slopes — **zero floating or sinking sandals!**
4. **Sunlit Visible Face & Caping Hygiene**:
   - Clamp `headPitch` to `[-0.24, +0.22]` and tilt the sculpted `LatheGeometry` caping hat slightly back (`rotation={[-0.22, 0, 0]}`, `position={[0, 0.088, -0.028]}`, `castShadow={false}`) so the character's charming wooden face & blinking glossy eyes remain 100% visible above chest-level props!

## 1. 1:1 Stylized Wooden Mannequin Craftsman Rig (Forensic `@gimanabisaid` Standard)
- **Warm Sunlit Birch Wood Finish**: Use unified warm peach-tan birch wood (`#E6AE80` limbs/head, `#D29568` joint spheres, `roughness: 0.44`) — NEVER dark brown/shadowed plastic!
- **Friendly Brightly-Lit Head & Face**:
  - Smooth high-segment oval sphere (`24x24`), small rounded wooden button nose, dark espresso hair cap (`#241912`) + **cute parted bangs/fringe tufts on forehead**, **small glossy black bead eyes (`r = 0.014`) with white specular catchlights & natural blink cycle** (`scaleY` dips to `0.14` for 4 frames every ~96 frames) — **NO thick blocky rectangular eyebrows** that make faces look angry/creepy!
  - **Headgear Shadow Hygiene**: Conical woven straw *caping* (`#F7EFD6`, NO top ball knob, NO thick floating brim torus) or hard-hat MUST set **`castShadow={false}`** so overhead brims NEVER black-out the character's face!
- **Tapered Flat-Front Torso, Seamless Sleeves & Fitted Two-Leg Shorts**:
  - **Torso**: Slightly flattened front-to-back tapered cylinder (`scale={[1, 1, 0.68]}`) with rounded shoulder & hem caps in vibrant sunlit cotton hue (`#F48D36`) — **NEVER a bloated capsule balloon!**
  - **Sleeves**: Rounded shoulder hemisphere + short tapered sleeve seated flush inside the shoulder socket so sleeves move naturally with arms (**ZERO floating macaroni gaps!**).
  - **Two-Leg Shorts (`#243B5C`)**: Compact pelvis hip block PLUS **TWO SEPARATE FITTED LEG CUFFS** rotating inside each left/right thigh group (**NEVER a single wide cylinder bucket skirt!**).
  - **Shadow-Acne-Free Joints**: Set `castShadow={false}` on small knee, elbow, and wrist ball joints so cylindrical limb intersections NEVER produce jagged black shadow-acne rings!
  - **Footwear**: Grounded flip-flop sandals (thin dark sole + wooden foot + dark strap) or work boots resting flush at `Y = 0.00` over a soft contact AO shadow disc.
- **Weight-Transfer Kinematics & Expressive Acting**:
  - Use 3-phase physical cycles (anticipation lift → cubic-accelerated `t²` slam/thrust with deep knee flexion → damped elastic recoil), startled panic hands-on-head reactions, bilateral arm clamping around analogy objects, and continuous breathing sway!

## 2. Organic Diorama & Botanical Modeling (Zero Low-Poly Icosahedrons!)
- **Multi-Layered Botanical Trees**:
  - Never represent trees with bare `icosahedronGeometry` balls! Build tapered curved trunks + 2–3 forked branches + `18–26` smoothly shaded overlapping rounded leaf clusters (`sphereGeometry(r, 14, 12)` gently scaled organically along X/Y/Z) in a 4-tone sunlit canopy gradient (bright sunlit crown `#73B33C` → mid leaf `#4E8A29` → lower canopy `#32631B` → deep interior shadow `#1E4210`).
- **Curved Tropical Fronds & Instanced Grass**:
  - Build arched tapered banana/palm fronds with bent vertex geometry (`ShapeGeometry` curved along a quadratic arch + central rib ridge) casting distinct dappled shadows on the ground.
  - Scatter `40–80` 3D tufted grass clumps & wildflowers along embankments and cutaway edges using deterministic seeded placement.
- **Sculpted Geological Soil Cutaway**:
  - Combine a seamless `2048x1024` PBR soil cutaway face (`albedo + Sobel normal + roughness`) with an **irregular 3D sculpted topsoil overhang lip** (overlapping rounded turf/earth clods along `Y = 0`), protruding **3D rounded pebbles/rocks** embedded at `Z = 0.02`, and recursive bifurcating root filaments.
  - Whenever an underground element (pole, foundation, crushed stone ballast bed, pipe, root) sits inside the cutaway, render it with crisp **longitudinal cross-section detail** (layered sub-ballast, compacted earth, sharp angular interlocking gravel stones, concrete rebar/tendons, or hollow interiors).

## 3. Motivated Camera Choreography & Smooth Transitions
**Golden Rule of Remotion 3D Cameras**: Every camera transform (`position`, `lookAt`, `fov`) MUST be a **pure deterministic function of `frame`** — NEVER stateful `camera.position.lerp(...)` inside `useFrame`!

Use these 6 signature motivated transitions between beats instead of jarring lifeless cuts:
1. **Smooth Glide Dolly / Orbit** (`cubicBezier(0.25, 0.1, 0.25, 1.0)`): Between related shots in the same location, smoothly glide camera `position` and `lookAt` over `14–22 frames` rather than hard-cutting!
2. **Vertical Crane-Down Cutaway Peel**: Camera tilts/cranes smoothly from ground level down beneath `Y = 0` to reveal underground soil/ballast/foundation cross-section while soil strata & force arrows animate in.
3. **Macro Rack-Focus Push**: Smooth push-in (`18 frames`) while ramping `DepthOfField` `bokehScale` from `0 → 4.5` to isolate a single bolt, gap, stone interlock, or insulator.
4. **Impact Camera Shake**: Damped high-frequency camera micro-shake (`exp(-t * 8) * sin(t * 45) * amplitude`) synced to exact frame of heavy train pass, steel snap, buckle, or drop!
5. **Time-Lapse Weather / Sun Sweep**: Smoothly interpolate `uSunDir`, sky zenith/horizon colors, and lighting temperature from crisp morning → blazing noon heat shimmer → cool dusk/rain → back to morning!
6. **Handheld Living Micro-Breath**: Layer ultra-subtle smooth camera drift (`±0.018m` X/Y via low-frequency sine harmonics) on static holds so every frame feels alive like a real Blender camera rig.

## 4. Exact Seamless Visual Loop Contract (Zero Watermarks!)
To ensure invisible replay loops on Reels/Shorts/TikTok:
- **Define `LOOP_ANCHOR_CAMERA`** = exact `[position, lookAt, fov]` of Frame `0`.
- **Define `LOOP_ANCHOR_STATE`** = exact lighting mood (`day`), sky sun angle, character position/pose, and hero diorama state at Frame `0`.
- During the final beat (`totalFrames - 54` to `totalFrames - 1`):
  - Smoothly glide camera back to `LOOP_ANCHOR_CAMERA` (`smoothstep` over 45 frames).
  - Smoothly blend lighting/sky back to `LOOP_ANCHOR_STATE`.
  - Smoothly reset hero props/trains/character cleanly to Frame `0` state so `frame === totalFrames - 1` visually matches `frame === 0` with **zero jump cut**!
- Always inspect **Frame `0` vs `totalFrames - 1`** side-by-side in the Pre-Flight QA Contact Sheet!
