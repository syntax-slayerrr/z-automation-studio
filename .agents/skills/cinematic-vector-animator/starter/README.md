# Starter — Cinematic Vector (Remotion)

```bash
npm install
npm run dev        # Remotion Studio
npm run still      # out/frame.png (frame 60)
npm run render     # out/test-scene.mp4 (1080x1920, 30fps, H.264)
npm run typecheck
```

- `src/art-bible.json` — sumber kebenaran palet/cahaya/depth/FX (salin dari `assets/art-bible.template.json`, lalu isi).
- `src/components/Camera.tsx` + `Layer.tsx` — kamera virtual + parallax.
- `src/components/FX.tsx` — Vignette, ColorGrade, Grain, Glow, LightRays, SafeZones (debug).
- `src/components/Particles.tsx` — Dust deterministik (far/near).
- `src/components/Character.tsx` — rig placeholder: napas, sway, kedip, mulut, ekspresi, kain. Ganti path dengan aset asli, pertahankan struktur.
- `src/scenes/TestScene.tsx` — scene uji Fase 1.

Semua animasi deterministik terhadap frame. Jangan memakai CSS transition, `Math.random()`, atau GSAP real-time (lihat `references/remotion-gotchas.md`).
