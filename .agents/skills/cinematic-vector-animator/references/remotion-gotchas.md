# Remotion Gotchas — agar render tidak rusak

## Daftar isi
1. Aturan deterministik
2. GSAP di Remotion
3. Lottie
4. SVG, filter, dan performa
5. Font dan aset
6. Perintah render
7. Lisensi

## 1. Aturan deterministik

Remotion merender tiap frame secara terpisah (bisa paralel). Semua yang terlihat harus murni fungsi dari `useCurrentFrame()`.

| Jangan | Pakai |
|---|---|
| CSS `transition`, `@keyframes`, `animation` | `interpolate`, `spring`, `Easing` dari remotion |
| `Math.random()` | `random('seed-string')` dari remotion |
| `Date.now()`, `setTimeout`, `requestAnimationFrame` | `useCurrentFrame()` dan `useVideoConfig().fps` |
| `useState` untuk animasi | Hitung langsung dari frame |
| `<img>` biasa | `<Img>` dari remotion (menunggu gambar termuat) |

## 2. GSAP di Remotion

GSAP real-time tidak cocok. Pakai timeline **paused** lalu *seek* sesuai frame:

```tsx
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useLayoutEffect, useMemo, useRef} from 'react';
import gsap from 'gsap';

export const GsapBox: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);
  const tl = useMemo(() => gsap.timeline({paused: true}), []);

  useLayoutEffect(() => {
    tl.clear();
    tl.fromTo(ref.current, {y: 80, opacity: 0}, {y: 0, opacity: 1, duration: 1, ease: 'expo.out'});
  }, [tl]);

  useLayoutEffect(() => {
    tl.seek(frame / fps); // detik
  }, [frame, fps, tl]);

  return <div ref={ref} />;
};
```
Gunakan GSAP untuk path morphing atau timeline kompleks yang sulit ditulis dengan `interpolate`; untuk sisanya `interpolate`/`spring` lebih sederhana dan aman.

## 3. Lottie

Gunakan `@remotion/lottie` untuk elemen kecil (ikon, efek percikan, loading). Jangan untuk karakter utama: sulit disesuaikan dengan art bible dan kamera. Muat JSON dengan `staticFile` atau `delayRender`/`continueRender`, dan pastikan palet Lottie diwarnai ulang ke palet art bible.

## 4. SVG, filter, dan performa

- Gunakan `overflow: visible` pada `<svg>` layer supaya bleed bisa digambar di luar viewBox.
- `filter: blur`, `feTurbulence`, dan `mix-blend-mode` pada elemen penuh-layar mahal. Batasi jumlahnya, hindari menumpuk filter pada elemen yang sama.
- ID gradient/filter harus unik per komponen; ID kembar menyebabkan gradient salah muncul.
- Pakai `<Sequence from durationInFrames premountFor={fps}>` untuk menyusun scene dan memuat sebelumnya.
- Transform pada elemen SVG: gunakan `style={{transformOrigin: '50% 100%', transformBox: 'fill-box'}}` agar pivot mengikuti bentuk.

## 5. Font dan aset

- Font: `@remotion/google-fonts` atau `@font-face` lokal; pastikan termuat sebelum frame dirender.
- Aset statis di folder `public/` dan dipanggil lewat `staticFile('nama.svg')`.
- Catat sumber dan lisensi setiap aset di `ASSETS.md`.

## 6. Perintah render

```bash
npm install
npm run dev                       # Remotion Studio, pratinjau real-time
npm run still                     # PNG satu frame (frame 60 secara default)
npm run render                    # MP4 H.264 1080x1920 30fps
npx remotion render src/index.ts TestScene out/scene.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p
npx remotion render ... --concurrency=2   # jika memori/CPU terbatas
```
Untuk TikTok/Reels: MP4 H.264, `yuv420p`, 30 fps, 1080×1920, CRF 16–18. Periksa bahwa audio (jika ada) AAC 48 kHz.

## 7. Lisensi

Remotion gratis untuk individu dan tim kecil, tetapi punya aturan lisensi komersial untuk perusahaan berukuran tertentu. Untuk pekerjaan klien/komersial, cek ketentuan terbaru di situs resmi Remotion sebelum merilis.
