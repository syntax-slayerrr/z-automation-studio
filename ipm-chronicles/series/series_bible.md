# Series Bible — Serial Dokumenter Sejarah IPM (v1.0 — Locked after Ep 1 Pilot)

## 1. Series promise / series question
> **Pertanyaan Serial (L01)**: *Bagaimana sebuah keputusan dalam konferensi di Garut tahun 1958 tumbuh menjadi organisasi pelajar yang hari ini hidup sampai ke tingkat cabang seperti Panawuan?*

Serial 15 episode vertikal (9:16, 60–120 detik per episode) yang menelusuri perjalanan sejarah Ikatan Pelajar Muhammadiyah (IPM) dari gagasan awal di Garut 1958, pendirian resmi 1961, dinamika perubahan nama menjadi IRM (1992) hingga kembali ke IPM pasca-Muktamar XVI Surakarta (23–28 Oktober 2008), serta dampaknya hingga ke akar rumput cabang seperti Panawuan.

## 2. Audience and platform (sound on/off context)
- **Target**: Pelajar/mahasiswa Muhammadiyah, kader cabang/daerah (khususnya Garut/Panawuan), dan penonton umum pencinta dokumenter sejarah pendek di Reels / TikTok / YouTube Shorts (1080×1920, 30 fps).
- **Sound-off readiness**: Teks layar minimal & akurat, label `REKONSTRUKSI` saat menampilkan reka adegan, caption tersinkron per kata dari Cartesia `word_timestamps`, kontras visual tinggi di layar ponsel.
- **Sound-on promise**: Narasi dokumenter tenang & berwibawa (Cartesia `sonic-3.6` bahasa Indonesia), foley/ambience ruang nyata, tanpa musik dramatis berlebihan.

## 3. Look lock (v1.0 Locked)
- **Rendering style & architecture**: Remotion 9:16 vertical (`1080x1920`, `30 fps`) dengan mesin **2.5D Textured Flat-Vector + True 3D Projection**:
  - Kamera & Panggung (`src/shared/Flat3DCamera.tsx`): Hermite spline (`track`), `Cam2D`, CSS 3D stage (`PerspStage` dengan safe overscan scale otomatis), proyektor 3D sejati (`project3D`), `handheld`, `shake`, `EditorialCallout`.
  - Karakter (`src/shared/HeritageKid.tsx`): Figur flat-vector bertekstur bergaya buku cerita sejarah (tinta `#22150c`), kedip mata, kontrol alis/mulut, gerak berjalan, mode punggung netral (`backView` untuk kerumunan/rekaman anonim), siluet, dan properti historis.
  - Arsitektur & Properti (`src/shared/HeritageProps25D.tsx`): Bangunan, pohon beringin/kelapa bergoyang, gapura, perahu pinisi, jam pasir, meja arsip, hujan, dan cahaya jendela berlapis parallax.
  - Kartografi (`src/shared/AtlasMap2D.tsx`): Peta historis berbasis `d3-geo` dengan tilt 3D, kontur batimetri, mawar kompas, pin kronologis, dan penanda rute bergerak (`pinisi` / `walker`).
- **Frame rate & paper grade (`src/shared/PaperTextures.tsx`)**: 30 fps, `SunDustMotes`, serta `MuseumPaperGrade` (SVG fractal noise tile `160x160` GPU-cached + vignette hangat) sebagai penyatu tonal antar-adegan.
- **Caption & labels (`src/shared/EditorialCaptions.tsx`)**: Subtitle aktif per kata dari Cartesia `word_timestamps` pada zona aman `9:16` (`bottom: 342`), label `REKONSTRUKSI` tipis di sudut kanan atas pada adegan reka ulang.
- **Target Upgrade v2.0 (Mulai Ep 2)**: Memperhalus transisi kamera antar-adegan (match-cut & foreground parallax), memperdalam pencahayaan rim/volumetrik dan *secondary motion* properti, sambil tetap setia pada identitas visual 2.5D v1.0.

## 4. Era palette table
| Era | Locations | Dominant materials | Palette swatches | Light character | Wardrobe notes | Avoid |
|---|---|---|---|---|---|---|
| **1958–1961 (Pra-Pendirian & Garut)** | Ruang belajar/sidang sederhana, dataran tinggi Priangan | Kayu jati tua, plester kapur hangat, kertas tulis, tanah & teh hijau redup | `#5b3d24`, `#d8ccb2`, `#e4dcc6`, `#2b3441`, `#c9c5bb` | Cahaya jendela miring hangat (`#ffeccf`) + kabut pagi Priangan | Kemeja katun panjang/pendek pudar, celana kain gelap, peci hitam | Lampu neon modern, plastik terang, bangunan beton modern |
| **1961–1992 (Konsolidasi & Orde Baru)** | Ruang rapat organisasi, sekolah Muhammadiyah, peta Jawa–Nusantara | Kayu, kertas arsip, papan tulis kapur | `#6a4a2c`, `#dcd6c6`, `#1d2329` | Cahaya ruang kelas/kantor tenang | Seragam/kemeja rapi era 70–80an | Warna jenuh neon |
| **1992–2008 (Era IRM -> Kembali IPM)** | Aula muktamar, ruang diskusi, Surakarta | Kayu & plester terang, kain spanduk dokumentasi berlabel | `#e8e0cb`, `#323d4d`, `#8a6a48` | Cahaya siang netral | Kemeja/jas organisasi | Teks spanduk palsu |
| **Masa Kini (Cabang / Panawuan)** | Ruang belajar pelajar masa kini, aktivitas cabang | Kayu cerah, plester bersih, buku modern | `#e9e4d6`, `#2c3d52`, `#d9d2bd` | Cahaya alami jendela jernih | Busana pelajar masa kini | Mengimplikasikan bangunan masa kini sebagai lokasi 1958 |

## 5. Motif system
1. **Kertas & Pena / Catatan Rapat**: Muncul di Ep 1 (tulisan tangan persiapan di Garut) dan kembali di Ep 15 sebagai benang merah gagasan yang diwariskan.
2. **Kabut & Lanskap Priangan (Garut)**: Jangkar geografis pembuka dan penutup pertanyaan serial ("Dari Garut... hingga Panawuan").
3. **Cahaya Jendela Berdebu (Archive Hush)**: Penanda transisi kontemplatif saat jeda narasi.

## 6. Sound lock (v1.0 Locked)
- **Narrator**: Cartesia `sonic-3` (`language: "id"`, `add_timestamps: true`, sintesis per beat tanpa tag `emotion` bahasa Inggris, variasi `speed: 0.95–1.08`):
  - Terkunci: **Galang** (`04b567df-2923-4b0c-896b-4b7df0a07e1a`) — `pipeline/ep01_build_vo.py`
  - Cadangan audisi: **Andi** (`a053f6bc-7df4-40de-96d4-de026bc47ce8`), **Anisa** (`8f703c45-8cb6-4e0c-8015-5e8a9e260a8a`)
- **Sound Design & SFX**: 100% rekaman foley CC0 nyata (Freesound/Kenney/`site-sfx`) ditempatkan persis ke timestamp `word_timestamps` (`CUES`), tanpa sintesis bip osilator, dipadu music bed berlisensi dengan *sidechain ducking*.
- **Mix targets**: `-14.5 LUFS` terintegrasi (±0.5 LU), true peak `<= -1.5 dBFS` (diverifikasi langsung di MP4 akhir via `ffmpeg ebur128`; hasil Ep 1: `-14.6 LUFS`, true peak `-2.4 dBFS`).

## 7. Terminology and style guide
- **Nama resmi**: `Ikatan Pelajar Muhammadiyah` (ditulis penuh pada penyebutan pertama tiap episode; selanjutnya `IPM`). `Ikatan Remaja Muhammadiyah` (`IRM`) untuk periode 1992–2008.
- **Format tanggal & angka**: Di layar `18 Juli 1961`, `23–28 Oktober 2008`; di TTS (`narration_tts.txt`) ditulis penuh agar dibaca alami (`seribu sembilan ratus lima puluh delapan`, `dua puluh tiga hingga dua puluh delapan Oktober dua ribu delapan`).
- **Aturan sejarah**: Tanpa nama tokoh/lokasi spesifik yang belum terverifikasi di `evidence_ledger.csv` (Ep 1: tidak menyebut nama tokoh `C006`, tidak mengimplikasikan Panawuan sebagai lokasi konferensi 1958).

## 8. Glossary of terms introduced
- **Tanwir**: Permusyawaratan tertinggi di bawah Muktamar dalam organisasi otonom Muhammadiyah (Ep 1 / terkait transisi 2007–2008).
- **Muktamar**: Forum permusyawaratan tertinggi tingkat nasional (Ep 14 / konteks XVI 2008 Surakarta).
- **Pimpinan Cabang**: Struktur organisasi IPM di tingkat kecamatan/kawasan cabang seperti Panawuan (Ep 1 & Ep 15).

## 9. Episode map (slot cards — ringkasan 3 babak)
- **Babak I (Ep 1–5) — Akar & Kelahiran**: Ep 1 Prolog *Dari Garut* (1958, pertanyaan serial); Ep 2 Menuju Surakarta (1961); Ep 3–5 konsolidasi awal & cabang-cabang perintis.
- **Babak II (Ep 6–10) — Ujian & Perubahan Nama**: Ep 6–8 dinamika kebijakan pelajar era Orde Baru; Ep 9–10 transisi menjadi IRM (1992).
- **Babak III (Ep 11–15) — Kembali ke IPM & Cabang Masa Kini**: Ep 11–13 kiprah IRM; Ep 14 Tanwir 2007 & Muktamar IRM XVI Surakarta (23–28 Okt 2008) kembali menjadi IPM; Ep 15 penutup lingkaran kembali ke cabang masa kini (Panawuan).

## 10. Variation matrix & 11. Open-loop ledger
- Lihat `ipm-chronicles/series/variation_matrix.csv`, `ipm-chronicles/series/open_loops.csv`, dan `ipm-chronicles/series/WORKFLOW.md`.

## 12. Asset registry
| ID | Type | Version | Source | License | Status |
|---|---|---|---|---|---|
| `src/shared/Flat3DCamera.tsx` | 2.5D/3D Camera & Stage | v1.0 | Buatan internal (`ipm-chronicles`) | Internal / Original | Active (Locked) |
| `src/shared/HeritageKid.tsx` | Textured Flat-Vector Characters | v1.0 | Buatan internal (`ipm-chronicles`) | Internal / Original | Active (Locked) |
| `src/shared/HeritageProps25D.tsx` | Layered 2.5D Architecture & Props | v1.0 | Buatan internal (`ipm-chronicles`) | Internal / Original | Active (Locked) |
| `src/shared/AtlasMap2D.tsx` | Historical Cartography (`d3-geo`) | v1.0 | Buatan internal (`ipm-chronicles`) | Internal / Original | Active (Locked) |
| `src/shared/PaperTextures.tsx` | Palette & GPU Grain Tile | v1.0 | Buatan internal (`ipm-chronicles`) | Internal / Original | Active (Locked) |
| `src/shared/scriptEngine.ts` | Cue-Synced Timing Engine | v1.0 | Buatan internal (`ipm-chronicles`) | Internal / Original | Active (Locked) |
| `voice_audition/*` | Cartesia `sonic-3` WAV | v1.0 | Cartesia API | Commercial API | Galang Selected |

## 13. Reliable motion recipes
- **Kamera kontinu & panggung 3D (`Flat3DCamera.tsx`)**: Gunakan Hermite `track(f, keys)` + `PerspStage` (dengan overscan aman agar sudut panggung tidak bocor saat tilt) dan `project3D` untuk jalan/avenue perspektif.
- **Aksi karakter & sinkronisasi kata (`HeritageKid.tsx` + `scriptEngine.ts`)**: Ikat perubahan ekspresi (`brow`, `smile`, `open`), langkah (`walk`), dan munculnya properti ke `cue(sec)` agar gerakan selalu mengunci ketukan suara narator.

## 14. Change log
- **2026-11-14 (v0.1)**: Inisialisasi Series Bible untuk bundel S0–S3 + perpindahan TTS ke Cartesia.
- **2026-11-14 (v1.0)**: Pilot Episode 01 selesai & terverifikasi (`IpmEp01`, `3080 frames`, `-14.6 LUFS`); look lock dan sound lock diperbarui ke mesin 2.5D Textured Flat-Vector + True 3D Projection serta alur kerja disimpan di `series/WORKFLOW.md`.
