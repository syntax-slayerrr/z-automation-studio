# Claude Code Directives (`CLAUDE.md`)

Selamat datang di **Z-Automation Studio**! Repository ini berisi **15 Master Video Style Skills** berbasis **Remotion + Three.js / React / SVG / GLSL** yang dirancang agar bahkan **orang awam (tanpa pengalaman koding)** cukup mengetik **1 kalimat topik** untuk menghasilkan video `.mp4` siap upload lengkap dengan voice-over Bahasa Indonesia, SFX tactile, dan musik latar `-14.8` s.d. `-14.3 LUFS`.

## Instruksi Utama untuk Claude Code
1. **Baca [`AGENTS.md`](./AGENTS.md) terlebih dahulu** untuk melihat tabel katalog **15 Master Video Style Skills** beserta lokasi Golden Reference di `remotion/videos/` dan `remotion/lib/`.
2. Saat pengguna meminta pembuatan video, **baca file `SKILL.md` yang cocok di `.agents/skills/<nama-skill>/SKILL.md`** dan jalankan seluruh alur kerja secara otonom dari penulisan naskah (`.agents/skills/brutal-storyteller/SKILL.md`), pembuatan audio, pembuatan komponen Remotion, inspeksi visual QA contact sheet, hingga render `.mp4` selesai.
3. Pada Windows, selalu gunakan flag `--gl=angle --concurrency=1` saat merender komposisi 3D Three.js dengan Remotion, dan gunakan isolated entry (`remotion/entry-<slug>.ts`) agar proses bundling cepat (~4 detik) dan bebas dari V8 heap OOM.
4. Pastikan `npx tsc --noEmit` menghasilkan **0 error** sebelum memulai render video penuh.
