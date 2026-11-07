# Z-Automation Studio 🎬

Studio pembuatan konten multimedia, motion graphics, promotional video (Instagram Reels, TikTok, YouTube Shorts), dan banner video interaktif untuk **Z-Automation** (`https://z-automation.my.id`).

Engine ini dibangun menggunakan **[Remotion](https://www.remotion.dev/)** dan React 19.

---

## 🚀 Quick Start

### 1. Buka Remotion Studio (Preview Interaktif di Browser)
```bash
npm run studio
# atau
npm run dev
```
Buka preview di browser lokal (biasanya di `http://localhost:3000`). Kamu bisa scrub timeline, atur props secara real-time, dan cek tiap frame animasi.

---

## 📦 Compositions yang Tersedia

| ID Komposisi | Resolusi | Rasio | Durasi | Peruntukan |
| :--- | :--- | :--- | :--- | :--- |
| `ZAutomationLaunch` | 1080 × 1920 | 9:16 | 7s (210f) | Instagram Reels, TikTok, YouTube Shorts |
| `ZAutomationSquarePromo` | 1080 × 1080 | 1:1 | 6s (180f) | Instagram Feed, Carousel Video, LinkedIn Post |

---

## 🎥 Perintah Rendering Video (Export MP4)

### Render 9:16 Vertical Reel:
```bash
npm run render:reel
# Hasil: out/reels/z-automation-launch.mp4
```

### Render 1:1 Square Feed:
```bash
npm run render:square
# Hasil: out/feed/z-automation-promo.mp4
```

### Render Semua Video Sekaligus:
```bash
npm run render:all
```

---

## 📸 Render Thumbnail / Still Image (PNG)

### Thumbnail Reel (Frame 60):
```bash
npm run still:thumbnail
# Hasil: out/thumbnails/reel-cover.png
```

### Thumbnail Feed (Frame 45):
```bash
npm run still:square
# Hasil: out/thumbnails/feed-cover.png
```

---

## 📁 Struktur Direktori

```text
z-automation-studio/
├── .agents/skills/        # Remotion Agent Skills (14 modular skills)
├── compositions/
│   ├── ZAutomationLaunch.tsx       # Template Reel vertikal 9:16
│   └── ZAutomationSquarePromo.tsx  # Template Square feed 1:1
├── public/
│   └── assets/                     # Karakter 3D Hermes, OpenClaw, Logo, Icons
├── out/                            # Direktori output hasil render (MP4 & PNG)
├── remotion.config.ts              # Konfigurasi Chromium headless & encoder
├── Root.tsx                        # Pendaftaran Composition & parameter durasi
└── index.ts                        # Entry point Remotion
```

---

## ⚡ Performa Render
File `remotion.config.ts` sudah dikonfigurasi untuk langsung menggunakan Chrome lokal di sistem Windows (`C:/Program Files/Google/Chrome/Application/chrome.exe`), sehingga proses bundle dan rendering frame berlangsung cepat dalam hitungan detik.

