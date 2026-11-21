---
name: saas-product-promo
description: >-
  Produce a 100% pure-code Commercial SaaS, App, Web 3D, or Tech Brand Launch & Explainer Video
  (16:9 landscape, 9:16 vertical Reel, or 1:1 square feed, 30 or 60 fps, Remotion + React/Three.js)
  with 3 selectable sub-styles: (1) Clean Airy UI Walkthrough (explainer-default, 45-90s),
  (2) One-Take Hero Element Continuous Workflow Journey (explainer-engaging, 10-30s), or
  (3) High-Energy Beat-Locked Kinetic Typography & 3D Tech Hype Reel (explainer-high-energy /
  ZAutomationLaunch, 12-25s). Use whenever the user asks for a "video promosi produk / aplikasi / SaaS",
  "launch trailer", "company profile", "demo UI", or commercial promo video.
---

# SaaS & Tech Product Promo Studio (`saas-product-promo`)

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna cukup mengetik 1 kalimat di AI agent:
> *"Buatkan video **Promo Produk / SaaS** untuk **[Nama Produk: Aplikasi Kasir AI / Website Otomasi Bisnis]** dengan gaya **[Clean UI Demo / Continuous Journey / High-Energy Hype Reel]**"*

**Instruksi Otomatis untuk AI Agent:**
1. Pilih salah satu dari **3 Sub-Skill Resmi** berdasarkan kebutuhan pengguna (atau tawarkan jika pengguna belum memilih):
   - **Varian A — Clean UI Walkthrough (`45–90s`)**: Baca & ikuti [`.agents/skills/explainer-default/SKILL.md`](../explainer-default/SKILL.md). Kanvas terang, kamera zoom-in ke komponen UI produk yang diketik/diklik secara nyata, tabel hasil, integrasi, dan penutup logo.
   - **Varian B — One-Take Continuous Workflow (`10–30s`)**: Baca & ikuti [`.agents/skills/explainer-engaging/SKILL.md`](../explainer-engaging/SKILL.md). Satu elemen utama (kursor, bola, pesan, file) meluncur melewati stasiun-stasiun workflow di satu kanvas raksasa tanpa putus, lalu zoom-out memperlihatkan keseluruhan sistem.
   - **Varian C — High-Energy Kinetic & 3D Tech Hype Reel (`12–25s`)**: Baca & ikuti [`.agents/skills/explainer-high-energy/SKILL.md`](../explainer-high-energy/SKILL.md) serta golden reference `remotion/compositions/ZAutomationLaunch.tsx` & `ZAutomationSquarePromo.tsx`. Transisi terkunci ketukan drum (*beat-locked*), tipografi kinetik tajam, showcase perangkat 3D (`Phone3DShowcase.tsx`), dan musik elektronik/upbeat.
2. Bangun komponen UI/3D produk langsung di kode React/Remotion (jangan pakai screenshot blur!), tambahkan SFX klik/whoosh/riser yang terukur (`sound-effects` / `real-sound`), dan render ke MP4 siap tayang (`npm run render:reel` atau `npm run render:square`).

## Golden References di Repository
- **16:9 / 9:16 Flagship 3D Tech Launch**: `remotion/compositions/ZAutomationLaunch.tsx` (`npm run render:reel`)
- **1:1 Square Feed Promo**: `remotion/compositions/ZAutomationSquarePromo.tsx` (`npm run render:square`)
- **3D Device & Mascot Components**: `remotion/components/Phone3DShowcase.tsx`, `remotion/components/Sanctum3DMascots.tsx`
