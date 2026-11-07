---
name: remotion
description: >-
  Create, preview, and render programmatic React videos using Remotion.
  Use when the user asks to generate videos, create motion graphics, build automated video pipelines,
  render TikTok/Reels/Shorts/trailers in code, use React components for animation, or install/run Remotion.
---

# Remotion Video Engineering & Skill Guide

Remotion allows developers and agents to write videos programmatically using React, TypeScript, and modern web technologies (HTML, CSS, Tailwind, Three.js, Canvas, SVG). Videos are deterministic, frame-based, and can be rendered into MP4, WebM, GIF, or individual PNG/JPEG stills.

---

## 1. Quick Start & CLI Workflows

### Project Structure Conventions
A standard Remotion project contains:
```text
remotion/
├── Root.tsx             # Defines all Compositions and Still entry points
├── index.ts             # Entry point registered via registerRoot(RemotionRoot)
├── compositions/        # Individual video templates / scenes
│   ├── MainVideo.tsx
│   ├── SocialReel.tsx
│   └── components/
├── package.json
└── remotion.config.ts   # Remotion CLI & bundler settings (scale, codecs, etc.)
```

### Essential CLI Commands

```bash
# 1. Launch Remotion Studio (interactive visual preview & scrubber)
npx remotion preview remotion/index.ts

# 2. Render MP4 Video
npx remotion render remotion/index.ts <CompositionId> out/video.mp4

# 3. Render High-Resolution Still Image (PNG)
npx remotion still remotion/index.ts <CompositionId> out/thumbnail.png --frame=60

# 4. Pass Dynamic Props via CLI (Automated Pipelines)
npx remotion render remotion/index.ts <CompositionId> out/custom.mp4 --props='{"title":"Z-Automation AI Agents","accentColor":"#00f0ff"}'

# 5. Fast Draft Render (Half resolution & quick encoding for rapid feedback)
npx remotion render remotion/index.ts <CompositionId> out/draft.mp4 --scale=0.5 --crf=28
```

---

## 2. Core Architectural Primitives

### 1. `Composition`
Registered in the root component. Declares canvas resolution, frame rate, duration, and default input props:
```tsx
import { Composition } from 'remotion';
import { MainVideo } from './compositions/MainVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SocialReel"
        component={MainVideo}
        durationInFrames={150} // 5 seconds at 30fps
        fps={30}
        width={1080}
        height={1920} // 9:16 vertical for TikTok / Reels / Shorts
        defaultProps={{
          title: 'Rekayasa Web 3D & Agen AI',
          subtitle: 'Z-Automation 2026',
        }}
      />
    </>
  );
};
```

### 2. `Sequence` & `Series`
- **`Sequence`**: Place elements at exact frame numbers (`from`) with an optional duration (`durationInFrames`). Frames inside a sequence are normalized: frame 0 starts when the sequence begins.
- **`Series`**: Linear concatenation of scenes without needing manual frame offset calculation.
```tsx
import { Series, Sequence } from 'remotion';

export const StoryVideo = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={60}>
        <IntroScene />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <FeatureShowcase />
      </Series.Sequence>
      <Series.Sequence durationInFrames={45}>
        <CallToAction />
      </Series.Sequence>
    </Series>
  );
};
```

---

## 3. Motion, Keyframes & Physics Hooks

Remotion renders deterministically based strictly on the current frame index. **Never use `Math.random()`, `Date.now()`, `setInterval`, or CSS animations that depend on system clock.**

### Deterministic Frame Hooks
```tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps, durationInFrames, width, height } = useVideoConfig();
```

### `interpolate()` (Keyframing & Easing)
Maps input frame ranges to output property ranges (opacity, position, scale, rotation):
```tsx
import { interpolate, Easing } from 'remotion';

// Smooth fade in & slide up over 20 frames
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

const translateY = interpolate(frame, [0, 20], [50, 0], {
  easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  extrapolateRight: 'clamp',
});
```

### `spring()` (Natural Physics & Snappiness)
Creates smooth natural motion with mass, stiffness, and damping:
```tsx
import { spring } from 'remotion';

const scale = spring({
  frame,
  fps,
  config: {
    damping: 12,
    mass: 0.8,
    stiffness: 100,
  },
});
```

### Deterministic Randomness
```tsx
import { random } from 'remotion';

// Generates the exact same random float between 0 and 1 for seed 'seed-1' on every render
const randomValue = random('seed-1');
```

---

## 4. Media & Assets

- **Audio**: `<Audio src={staticFile('music.mp3')} volume={(f) => interpolate(f, [0, 30], [0, 1])} />`
- **Video**: `<Video src={staticFile('b-roll.mp4')} startFrom={15} endAt={75} />`
- **Images**: `<Img src={staticFile('logo.png')} />`
- **Preloading Fonts**: Use `@remotion/google-fonts` or CSS `@font-face` with `continueRender` and `delayRender` helpers.

---

## 5. WebGL & 3D Integration (`@remotion/three`)

Remotion seamlessly integrates Three.js and `@react-three/fiber` for 3D motion graphics:
```tsx
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame } from 'remotion';

const SpinningObject = () => {
  const frame = useCurrentFrame();
  return (
    <mesh rotation={[frame * 0.02, frame * 0.03, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#00f0ff" roughness={0.2} metalness={0.8} />
    </mesh>
  );
};

export const Scene3D = () => {
  return (
    <ThreeCanvas width={1920} height={1080}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <SpinningObject />
    </ThreeCanvas>
  );
};
```

---

## 6. Next.js Web Player (`@remotion/player`)

Embed reactive, playable Remotion compositions inside Next.js apps with zero server rendering overhead:
```tsx
'use client';

import { Player } from '@remotion/player';
import { SocialReel } from '@/remotion/compositions/SocialReel';

export default function VideoPreview() {
  return (
    <div className="w-full max-w-[400px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
      <Player
        component={SocialReel}
        durationInFrames={150}
        fps={30}
        compositionWidth={1080}
        compositionHeight={1920}
        controls
        loop
        autoPlay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

---

## 7. Best Practices & Optimization Checklist

1. **Always Set `extrapolateRight: 'clamp'`**: Prevents runaway values when animating past the keyframe boundary.
2. **Use Relative Timing inside Sequences**: Sequences start at local `frame = 0`. Avoid hardcoding absolute timestamps.
3. **Hardware Acceleration**: Enable GPU rendering in Remotion config (`--gl=angle` on Windows).
4. **Bundle Splitting**: Keep static assets in `public/` or import using `staticFile()`.

