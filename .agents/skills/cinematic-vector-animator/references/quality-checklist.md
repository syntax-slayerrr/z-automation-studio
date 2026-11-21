# Quality Checklist — gate dan self-review

Jawab tiap item dengan jujur (lulus / gagal + alasan). Satu item gagal pada Fase 1 berarti perbaiki sebelum lanjut.

## Daftar isi
1. Gate Fase 0 (art bible)
2. Gate Fase 1 (vertical slice)
3. Gate Fase 2 (rigging)
4. Gate Fase 3 (produksi)
5. Tanda "murahan"
6. Cara memperbaiki (urutan)

## 1. Gate Fase 0
- [ ] Palet ≤ 6 warna dasar, tiap warna punya ramp 3 tingkat.
- [ ] Tidak ada #000 / #fff; shadow dan highlight berwarna.
- [ ] Key, fill, rim light terdefinisi (arah + warna).
- [ ] Jumlah layer dan parallax/blur/haze per layer terdefinisi.
- [ ] Bahasa bentuk dan aturan outline tertulis.
- [ ] User menyetujui; `locked: true`.

## 2. Gate Fase 1 (vertical slice)
Komposisi
- [ ] Ada **satu** titik fokus yang terbaca dalam 0.5 detik.
- [ ] Squint test lolos: siluet dan massa terang-gelap tetap jelas saat gambar dikecilkan/dikaburkan.
- [ ] Teks/wajah penting berada di dalam safe zone.

Depth dan kamera
- [ ] Minimal 4 layer dengan kecepatan parallax berbeda.
- [ ] Layer jauh lebih rendah kontras / lebih berkabut daripada layer dekat.
- [ ] Ada foreground blur yang membingkai.
- [ ] Kamera bergerak (gerak utama + drift); tidak ada tepi kosong terlihat.

Cahaya dan tekstur
- [ ] Satu sumber cahaya utama, bayangan konsisten dengannya.
- [ ] Rim light memisahkan subjek dari latar.
- [ ] Rays/glow ada dan "bernapas", tidak statis.
- [ ] Debu dua kedalaman, deterministik.
- [ ] Vignette, color grade, grain terpasang di urutan yang benar.

Gerak
- [ ] Tidak ada gerak linear.
- [ ] Ada anticipation/overshoot pada kemunculan utama.
- [ ] Ada hold setelah gerak besar.
- [ ] Setidaknya satu *signature detail* yang tidak generik.
- [ ] Render ulang dua kali menghasilkan frame identik (deterministik).

## 3. Gate Fase 2 (rigging)
- [ ] Karakter hidup saat diam: napas, sway, kedip tak beraturan.
- [ ] Kepala sedikit tertinggal dari badan; elemen sekunder bergerak.
- [ ] 4–5 bentuk mulut, 5–8 ekspresi, transisi ekspresi di-tween.
- [ ] Pivot benar: tidak ada bagian yang "melayang" atau terpotong saat bergerak.

## 4. Gate Fase 3 (produksi)
- [ ] Semua scene memakai art bible, komponen kamera/layer/FX yang sama.
- [ ] Transisi punya alasan (match cut, light wipe, push-through).
- [ ] Ritme dan beat selaras dengan narasi.
- [ ] Tonton penuh: tidak ada scene yang terasa dari video lain.
- [ ] `ASSETS.md` memuat sumber + lisensi semua aset eksternal.

## 5. Tanda "murahan"
Gerak linear, semua layer bergerak sama, warna jenuh penuh, hitam atau putih murni, kamera statis, outline tebal seragam, partikel seragam, tidak ada hold, terlalu banyak objek, rays statis, glow berupa lingkaran datar tanpa pengaruh pada sekitarnya, teks menempel tanpa animasi masuk, transisi cross-dissolve.

## 6. Cara memperbaiki (urutan)
Jika scene terasa kurang premium, perbaiki **dalam urutan ini** sebelum menambah elemen:
1. Cahaya (arah, rim light, bayangan jatuh).
2. Depth (haze, blur foreground, perbedaan parallax).
3. Timing (easing, hold, anticipation).
4. Tekstur (grain, vignette, grade).
5. Baru terakhir: tambah objek atau detail.
