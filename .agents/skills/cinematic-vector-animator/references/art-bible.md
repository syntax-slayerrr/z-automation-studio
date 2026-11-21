# Art Bible — panduan mengisi `art-bible.json`

Art bible adalah hukum visual proyek. Semua scene membaca dari file yang sama. Tujuannya satu: **konsistensi**, karena konsistensi adalah setengah dari rasa premium.

## Daftar isi
1. Palet
2. Cahaya
3. Bahasa bentuk
4. Depth (kedalaman)
5. Tekstur dan grade
6. Tipografi
7. Yang dilarang

## 1. Palet

Batasi diri: **5–6 warna dasar, masing-masing dengan ramp 3 tingkat** (gelap, tengah, terang). Lebih banyak warna = lebih sulit konsisten.

Struktur untuk mood **hangat sinematik (golden, dramatis)**:

| Peran | Fungsi | Contoh |
|---|---|---|
| Shadow | Bayangan dalam, tidak pernah hitam murni | `#0f0806`, `#2a140c`, `#5a2d17` |
| Base | Warna objek di area terkena cahaya sedang | `#7a3b17`, `#b8641f`, `#e39a3b` |
| Highlight | Cahaya paling terang, tidak putih murni | `#ffc873`, `#fff0cf` |
| Accent dingin | Kontras komplementer di bayangan dan rim light | `#1d3a4a`, `#7fd1d6` |

Aturan proporsi (60/30/10): sekitar 60% area di shadow+base gelap, 30% di tengah, 10% di highlight. Accent dingin maksimal sekitar 5% — gunanya membuat hangat terasa lebih hangat, bukan menjadi warna kedua.

Mood lain? Pertahankan strukturnya (shadow berwarna, highlight berwarna, accent komplementer), ganti hue-nya. Neon futuristik: shadow ungu-biru tua, accent magenta/cyan. Earthy-historis: shadow cokelat tanah, highlight kuning gading, accent hijau lumut.

## 2. Cahaya

Putuskan sekali, pakai di semua scene:

- **Key light**: arah dan warna (mis. kiri-atas, emas hangat).
- **Fill**: sangat redup, warna dingin dari sisi berlawanan.
- **Rim light**: garis tipis di tepi objek yang menghadap key; warna accent. Ini yang memisahkan karakter dari latar.
- **Kontras**: tinggi untuk dramatis (shadow menutupi 40–50% bentuk), sedang untuk lembut.

Sumber cahaya dalam scene (lentera, matahari terbenam, jendela) harus konsisten dengan key light, atau scene harus menjelaskan kenapa berbeda.

## 3. Bahasa bentuk

Tentukan dan tulis: bentuk dominan (bulat lembut / bersudut tajam / campuran), ada atau tidaknya outline (disarankan **tanpa outline**, bentuk dipisahkan oleh nilai terang-gelap dan rim light), radius sudut, tingkat detail (sedikit detail yang dipilih dengan baik > banyak detail rata).

Aturan nilai (value): setiap objek penting harus terbaca sebagai siluet dan terbaca jika gambar diubah ke hitam-putih. Jika dua objek berbeda memiliki nilai terang-gelap yang sama, penonton akan menganggapnya satu massa.

## 4. Depth (kedalaman)

Tentukan jumlah layer dan sifat tiap layer di JSON (`depth.layers`):

| Layer | Parallax | Blur | Haze | Catatan |
|---|---|---|---|---|
| sky | 0.05–0.15 | 0 | 0.8 | Gradient + elemen langit, paling hangat/terang |
| far | 0.2–0.3 | 0–1 | 0.55 | Siluet, kontras rendah, warna mendekati langit |
| mid | 0.5 | 0 | 0.2 | Lingkungan utama, detail sedang |
| subject | 0.8–1.0 | 0 | 0 | Karakter + objek utama, kontras tertinggi |
| foreground | 1.3–1.6 | 4–10 | 0 | Siluet gelap, buram; membingkai subjek |

Haze (kabut atmosfer) menaikkan kecerahan dan menurunkan saturasi/kontras layer jauh. Ini trik depth paling murah.

## 5. Tekstur dan grade

Nilai default hangat sinematik: grain 0.10–0.14, vignette 0.5–0.6, debu 30–60 partikel, rays 4–6 berkas dengan opacity 0.12–0.22. Grade akhir: gradient soft-light (shadow ke biru-hijau tua, highlight ke amber) dengan opacity 0.25–0.4.

## 6. Tipografi

Satu keluarga huruf untuk judul, satu untuk teks pendukung; maksimal dua. Teks di dalam safe zone. Beri bayangan lembut atau latar gradient tipis agar terbaca di atas scene yang hangat. Animasi teks: masuk dengan `ease.out`, keluar lebih cepat dari masuk.

## 7. Yang dilarang

Hitam murni, putih murni, warna jenuh 100% (kecuali satu aksen kecil yang disengaja), gradient pelangi, lebih dari satu gaya outline, drop shadow hitam kaku, sumber cahaya yang saling bertentangan.
