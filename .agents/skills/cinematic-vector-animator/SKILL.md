---
name: cinematic-vector-animator
description: Membuat animasi 2D vektor vertikal (9:16 untuk TikTok/Reels/Shorts) yang terasa premium dan sinematik — hangat-golden, berdepth, berkarakter, tidak kaku — memakai Remotion + SVG/CSS/GSAP/Lottie. Gunakan skill ini SETIAP KALI user menyebut animasi 2D, vektor, motion graphic, video TikTok/Reels, scene animasi, karakter bergerak, rigging, parallax, kamera sinematik, lighting, grain, Remotion, atau ingin hasil yang "premium", "sinematik", "tidak murahan", "tidak datar" — walau user tidak menyebut kata "skill". Berisi alur kerja bertahap (art bible → satu scene uji → rigging → penyusunan), template JSON, starter code Remotion, dan checklist kualitas. Also use for any premium cinematic 2D vector vertical-video animation task in Remotion.
---

# Cinematic Vector Animator

Skill ini mengubah agent dari "tukang gambar SVG yang menggerakkan sesuatu" menjadi **sutradara + animator** yang membangun animasi vertikal 2D vektor dengan rasa sinematik.

## Inti pemikiran

"Premium" di 2D vektor **bukan** hasil gambar yang rumit. Premium adalah hasil dari lima sistem yang bekerja bersama:

1. **Art bible terkunci** — palet, aturan bentuk, aturan cahaya. Tanpa ini, tiap scene punya gaya sendiri dan terlihat murahan.
2. **Layer berdepth** — latar jauh, tengah, dekat, foreground, dan karakter dipisah per bagian.
3. **Kamera virtual** — satu kamera yang bergerak pelan; tiap layer bereaksi dengan faktor parallax berbeda.
4. **Cahaya dan tekstur** — satu sumber cahaya yang masuk akal, rays, glow, debu, vignette, grain, color grade.
5. **Choreography timing** — easing yang disengaja, anticipation, overshoot kecil, secondary motion, dan *jeda*.

Gambar sederhana dengan lima sistem ini mengalahkan gambar rumit tanpa sistem. Karena itu: **jangan mulai dengan menggambar. Mulai dengan keputusan.**

## Alur kerja (jangan loncat fase)

Setiap fase punya gate. Jangan lanjut sebelum gate lolos — memperbaiki fondasi setelah 10 scene jadi jauh lebih mahal daripada sekarang.

### Fase 0 — Art bible
- Salin `assets/art-bible.template.json` → `art-bible.json` di proyek, isi dengan keputusan user (mood, palet, sumber cahaya, bahasa bentuk). Panduan tiap field ada di `references/art-bible.md`.
- Jika user belum memberi arah, usulkan satu arah lengkap (jangan tanya semuanya satu-satu) dan minta konfirmasi sekali.
- **Gate:** user menyetujui art bible. Setelah itu, status `locked: true`; perubahan hanya lewat persetujuan user.

### Fase 1 — Vertical slice (satu scene 6–8 detik)
- Bangun **satu** scene saja dengan pipeline lengkap: 4+ layer parallax, kamera bergerak, karakter statis + objek, lighting, partikel, grain, grade. Mulai dari `starter/` (proyek Remotion siap pakai).
- Tulis `scene-spec.json` dulu (lihat bagian berikutnya), baru kode.
- Render 3 still (awal, tengah, akhir) dan review dengan `references/quality-checklist.md`.
- **Gate:** scene ini terasa premium *saat dimatikan suaranya*. Kalau belum, perbaiki sistem (cahaya, depth, timing), bukan menambah objek.

### Fase 2 — Rigging karakter
- Pecah karakter jadi bagian terpisah dengan pivot yang benar: badan, kepala, mata, alis, mulut, lengan, elemen sekunder (kain, rambut).
- Tambahkan: napas, idle sway, kedip tak beraturan, 4–5 bentuk mulut, 5–8 ekspresi, kepala yang sedikit tertinggal dari badan. Detail di `references/motion-choreography.md`.
- **Gate:** karakter terlihat hidup saat diam (tidak bergerak = tidak berarti tidak ada gerak).

### Fase 3 — Produksi
- Susun banyak scene dengan transisi yang punya alasan (match cut, light-wipe, push-through), sinkron dengan beat narasi.
- Pakai ulang art bible, komponen kamera/layer/FX yang sama di semua scene. Konsistensi adalah setengah dari rasa premium.
- **Gate:** tonton dari awal sampai akhir; tidak ada scene yang terasa "dari video lain".

## Keputusan sutradara per scene (wajib ditulis sebelum kode)

Sebelum menulis satu baris kode untuk sebuah scene, isi `scene-spec.json` (template: `assets/scene-spec.template.json`). Isinya memaksa agent membuat pilihan, bukan jatuh ke pola generik:

- **Emosi** satu kata dan alasannya (bukan "menarik", tapi misalnya "sunyi yang menahan napas").
- **Titik fokus** — satu. Mata penonton harus tahu harus ke mana dalam 0,5 detik.
- **Gerak kamera** — satu gerakan utama (push-in, drift, tilt reveal), dengan alasan.
- **Sumber cahaya** — dari mana, warna apa, kenapa ada di situ.
- **Signature detail** — satu hal kecil yang tidak generik dan hanya cocok untuk scene ini (kunang-kunang searah angin, uap dari cangkir, bayangan yang telat mengikuti).
- **Beat** — daftar momen bernomor frame tempat sesuatu berubah, selaras dengan narasi.

Lalu tulis **3 opsi komposisi dalam satu kalimat tiap opsi**, pilih satu, dan jelaskan pilihan itu dalam satu kalimat. Ini murah, dan ini yang membedakan scene yang dirancang dari scene yang kebetulan jadi.

## Spesifikasi teknis default

- Kanvas **1080×1920**, **30 fps**, codec H.264, `yuv420p`, CRF 16–18.
- Safe zone konservatif (UI platform berubah-ubah): atas 160 px, bawah 420 px, kiri 60 px, kanan 140 px. Teks dan wajah penting tetap di dalam zona itu.
- Gambar tiap layer lebih besar dari frame (bleed ±15%) supaya parallax dan zoom tidak membuka tepi kosong.
- Semua animasi harus **deterministik terhadap nomor frame** (lihat `references/remotion-gotchas.md`). CSS transition, `Math.random()`, dan GSAP real-time akan merusak render.
- Struktur kode: gunakan komponen `Camera`, `Layer`, FX, dan `Character` di `starter/src/` sebagai fondasi, jangan menulis ulang dari nol.

## Integrasi dengan `ipm-chronicles` (Locked v1.0 Series Engine)

Saat bekerja di dalam workspace `ipm-chronicles/`:
- **Pertahankan Arsitektur Seri:** Jangan menimpa `src/shared/` (`Flat3DCamera`, `HeritageKid`, `IpmEmblem25D`, `AtlasMap2D`, `MuseumPaperGrade`) atau palet `HERITAGE` dengan placeholder `starter/` (`Character.tsx`, `art-bible.json`, atau `Grain` `<feTurbulence>` penuh-layar yang berat dan mengubah tone antar-episode).
- **Terapkan Prinsip Teknisnya:** Adopsi preset *easing* asimetris (`Easing.bezier(0.16, 1, 0.3, 1)`), Remotion `spring()` untuk gerak bermassa, *head lag* & tween ekspresi pada `HeritageKid`, *foreground blur* tepi frame, `VolumetricShafts` lembut yang bernapas, partikel deterministik `random(seed)` 2 kedalaman, *hold* setelah aksi besar, serta pengecekan *safe zone* 9:16 terhadap `EditorialEraHeader` dan `EditorialCaptions`.
- **Sinkronisasi Scene Multi-Beat:** Untuk scene sejarah berdurasi 15–25 detik dengan beberapa sub-beat (mis. Peta → Meja Arsitek), gabungkan transisi bermotivasi dari `hollywood-storyboard-director` dengan kurva *easing* dan *hold* dari skill ini.

## Aturan keras (dan alasannya)

1. **Tidak ada gerak linear.** Linear terbaca sebagai mesin; easing menandai niat. Pakai preset di `lib/easing.ts`.
2. **Tidak ada hitam murni (#000) atau putih murni (#fff).** Bayangan diwarnai (cokelat gelap/biru tua), highlight diwarnai (krem). Ini yang membuat gambar terlihat "difilmkan".
3. **Tiap layer bergerak dengan kecepatan berbeda.** Jika semua layer bergerak sama, depth hilang.
4. **Satu sumber cahaya utama.** Banyak sumber setara membuat gambar rata dan tidak jelas fokusnya.
5. **Layer jauh = kontras lebih rendah, lebih kabur, lebih berkabut.** Atmospheric perspective adalah trik depth paling murah dan paling efektif.
6. **Satu perubahan besar per beat.** Kalau semuanya bergerak sekaligus, tidak ada yang terasa penting.
7. **Selalu ada hold.** Diam sepersekian detik setelah gerakan besar adalah bagian dari sinematik; tanpa jeda, tidak ada bobot.
8. **Kamera tidak pernah benar-benar statis.** Drift halus (beberapa piksel) sudah cukup untuk membuat frame terasa direkam.
9. **Partikel dan noise deterministik** (`random(seed)` dari Remotion), bukan `Math.random()`.
10. **Jangan menambah objek untuk menutupi kelemahan.** Jika scene terasa kosong, periksa cahaya, depth, dan timing dulu.

## Rasa, bukan hanya teknik

Sinematik itu soal menahan. Biarkan satu momen bernapas. Biarkan cahaya bercerita: jika ada lentera, cahaya dari lentera itu harus benar-benar jatuh di wajah dan lantai, bukan hanya digambar sebagai lingkaran kuning. Setiap scene harus punya sesuatu yang *dirasakan* penonton sebelum mereka *mengerti*. Kalau scene hanya menjelaskan, itu masih mentah.

## Saat user memberi referensi (video, foto, link)

Bedah dulu menjadi spesifikasi sebelum meniru: palet (ambil nilai warna nyata), arah dan warna cahaya, jumlah layer dan kecepatan relatifnya, gerak kamera (jenis, durasi, easing), ritme potongan, tekstur (grain, haze), dan tipografi. Tulis hasil bedah ke dalam `art-bible.json` dan `scene-spec.json`. Jangan menebak "kira-kira mirip"; ukur.

## Aset dari internet

Boleh dipakai sebagai **referensi** (bentuk, pencahayaan, komposisi) dan sebagai tekstur/aset bila lisensinya jelas (utamakan CC0 atau lisensi komersial yang eksplisit). Catat sumber dan lisensi di `ASSETS.md`. Aset vektor sebaiknya disederhanakan dan diwarnai ulang agar patuh pada art bible; aset yang gayanya bentrok dengan art bible lebih baik dibuat ulang.

## Sebelum menyerahkan hasil: self-review

1. Render still di frame awal, tengah, akhir (`npm run still`).
2. Lakukan *squint test*: kecilkan atau kaburkan gambar; fokus dan bentuk besar tetap terbaca?
3. Jalankan `references/quality-checklist.md` item per item. Laporkan jujur item yang gagal beserta rencana perbaikannya.
4. Serahkan: file video, `art-bible.json`, `scene-spec.json`, dan catatan singkat apa yang diubah dan kenapa.

## Peta file

| File | Baca kapan |
|---|---|
| `references/art-bible.md` | Mengisi/menafsirkan art bible: palet, cahaya, bentuk, depth |
| `references/layer-system.md` | Memecah scene jadi layer, faktor parallax, struktur file aset |
| `references/cinematic-fx.md` | Membuat cahaya, rays, glow, debu, vignette, grain, grade |
| `references/motion-choreography.md` | Easing, kamera, timing, rigging karakter, ekspresi |
| `references/remotion-gotchas.md` | Menulis/merender di Remotion, GSAP/Lottie, performa |
| `references/quality-checklist.md` | Gate tiap fase, tanda "murahan", self-review |
| `assets/art-bible.template.json` | Fase 0 |
| `assets/scene-spec.template.json` | Tiap scene baru |
| `starter/` | Proyek Remotion siap jalan (`npm install && npm run dev`) |
