# Layer System — memecah scene agar punya depth

## Prinsip
Satu scene = tumpukan layer. Tiap layer adalah SVG (atau grup SVG) terpisah yang dibungkus komponen `Layer` dengan faktor `parallax`. Kamera menggerakkan semuanya; `parallax` menentukan seberapa besar tiap layer ikut bergerak.

## Urutan dari belakang ke depan
1. `sky` — gradient langit, matahari/bulan, awan besar. parallax 0.05–0.15.
2. `far` — siluet jauh (bukit, kota, hutan). parallax 0.2–0.3, haze tinggi.
3. `mid` — lingkungan utama (bangunan, pilar, pohon). parallax ±0.5.
4. `subject` — karakter dan objek yang berinteraksi dengannya. parallax 0.8–1.0.
5. `foreground` — siluet dekat yang buram, membingkai. parallax 1.3–1.6, blur 4–10 px.
6. FX di atas semuanya: rays, glow, debu, vignette, grade, grain (tidak ikut parallax, kecuali debu yang dibuat per kedalaman).

## Bleed
Karena layer di-zoom dan digeser, gambar tiap layer **lebih besar dari frame** (±15%: sekitar −160 sampai 1240 px horizontal dan −290 sampai 2210 px vertikal untuk kanvas 1080×1920). Di starter, SVG memakai `overflow: visible` dan latar digambar melewati tepi viewBox.

Rumus yang dipakai `Layer`:
```
translate(-cam.x * parallax, -cam.y * parallax)
scale(1 + (cam.zoom - 1) * parallax)
rotate(cam.rotate * parallax)
```

## Memecah karakter
Pecah per bagian dengan pivot yang benar sebelum menganimasikan:
- badan (pivot di dasar), kepala (pivot di leher), mata kiri/kanan, alis, mulut (beberapa bentuk), lengan (pivot di bahu), elemen sekunder (kain, rambut, aksesori) dengan pivot di titik tempel.
- Gunakan `transform-box: fill-box` dan `transform-origin` persen pada elemen SVG agar pivot mengikuti bentuk.

## Struktur proyek yang disarankan
```
src/
  art-bible.json
  lib/        easing, palette, helper
  components/ Camera, Layer, FX, Particles, Character
  scenes/     Scene01.tsx, Scene02.tsx ...
  assets/     svg/ (aset vektor), ASSETS.md (sumber + lisensi)
scene-specs/  scene-01.json, scene-02.json ...
```

## Rasa depth tambahan
- Overlap: objek mid menutupi sebagian objek far.
- Skala: objek foreground jauh lebih besar dari subjek; kontras skala menciptakan ruang.
- Bayangan jatuh: subjek menjatuhkan bayangan ke layer di belakangnya (ellipse gelap lembut berwarna shadow).
- Rack focus: animasikan blur layer foreground/far untuk memindahkan perhatian.
