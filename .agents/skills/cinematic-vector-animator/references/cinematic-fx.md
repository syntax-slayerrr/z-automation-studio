# Cinematic FX — cahaya dan tekstur

Semua efek di `starter/src/components/FX.tsx` dan `Particles.tsx`. Dokumen ini menjelaskan *kenapa* dan *cara menyetel*.

## Daftar isi
1. Urutan tumpukan FX
2. Light rays
3. Glow (cahaya sumber)
4. Debu / partikel
5. Vignette
6. Color grade
7. Grain
8. Depth of field
9. Performa

## 1. Urutan tumpukan (dari bawah ke atas)
`scene layers` → `Glow` pada sumber cahaya → `LightRays` (blend screen) → `Dust` → `Vignette` → `ColorGrade` (soft-light) → `Grain` (overlay). Grain paling atas agar menyatukan semuanya seperti satu rekaman.

## 2. Light rays
- Berkas dari satu titik asal (arah key light), 4–6 berkas, lebar dan sudut diacak **deterministik**.
- `mix-blend-mode: screen`, opacity 0.12–0.22, warna highlight hangat.
- Hidupkan dengan "napas": opacity berosilasi pelan (periode 4–7 detik) dan sudut bergoyang ±0.6°. Rays yang statis terlihat seperti stiker.
- Blur ringan (stdDeviation 6–10) agar tepi lembut.

## 3. Glow
- Gradient radial di sumber cahaya (lentera, jendela, matahari), blend `screen`.
- Tambahkan flicker halus untuk api/lentera: kombinasi sin lambat + noise acak per 2–3 frame (deterministik).
- Glow kedua yang lebih besar dan lebih redup di belakang yang pertama memberi kesan bloom murah tanpa menggandakan render.

## 4. Debu / partikel
- 30–60 butir, ukuran 1.5–5 px, kecepatan naik pelan, sway sinus, kelap-kelip alpha.
- Pisahkan **dua kedalaman**: butir jauh (kecil, redup, tajam) dan butir dekat (besar, buram, lebih cepat). Satu kedalaman saja terasa rata.
- Arah angin konsisten dengan elemen lain di scene (kain, rumput).

## 5. Vignette
Gradient radial dari transparan di tengah ke warna shadow gelap di tepi. Strength 0.5–0.6. Pusatkan sedikit di atas titik tengah agar subjek terasa "disorot".

## 6. Color grade
Overlay gradient vertikal dengan `mix-blend-mode: soft-light`: atas/bawah mengikuti nuansa shadow (biru-hijau tua atau cokelat tua), tengah mengikuti highlight (amber). Opacity 0.25–0.4. Ini menyatukan palet sehingga aset dari sumber berbeda tampak satu dunia.

## 7. Grain
- `feTurbulence` fractalNoise, baseFrequency ±0.85, 2 oktaf, di-desaturate, blend `overlay`, opacity 0.10–0.14.
- Ganti `seed` tiap 2 frame (±15 fps) — grain film terasa hidup tetapi tidak berisik.
- Render noise di resolusi setengah lalu di-scale (parameter `scale`) agar lebih murah dan butirnya lebih lembut.

## 8. Depth of field
Foreground: `blur(4–10px)`. Layer jauh: `blur(0–1px)` plus haze. Rack focus = animasikan blur dari satu layer ke layer lain di beat penting (mis. foreground jernih saat kamera mengungkap subjek).

## 9. Performa
- `feTurbulence` dan `filter: blur` pada layer penuh-layar mahal. Gunakan `scale` pada grain, batasi jumlah layer ber-blur, dan hindari filter bertumpuk pada elemen yang sama.
- Jika render lambat: turunkan `--concurrency`, kurangi jumlah partikel, atau pra-render grain jadi loop PNG/video pendek.
- Jangan menggandakan seluruh scene untuk bloom; pakai `Glow` di elemen emisif saja.
