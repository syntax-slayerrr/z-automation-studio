# Motion Choreography — timing, kamera, karakter

## Daftar isi
1. Prinsip
2. Easing dan spring
3. Kamera
4. Ritme dan beat
5. Rigging karakter
6. Ekspresi
7. Secondary motion
8. Transisi

## 1. Prinsip

- **Anticipation**: sebelum gerak besar, ada gerak kecil berlawanan (menarik napas, condong ke belakang 3–5 frame).
- **Overshoot kecil**: objek melewati target sedikit lalu kembali. Pakai spring, bukan interpolasi biasa.
- **Overlap dan follow-through**: bagian tubuh tidak berhenti serempak. Kepala tertinggal dari badan 3–4 frame, kain tertinggal lebih lama.
- **Stagger**: elemen dalam satu kelompok masuk dengan selisih 3–6 frame, bukan serentak.
- **Hold**: setelah gerak besar, diam 8–20 frame. Jeda memberi bobot.
- **Satu perubahan besar per beat.**

## 2. Easing dan spring

Preset ada di `starter/src/lib/easing.ts`:

| Nama | Bezier | Dipakai untuk |
|---|---|---|
| `ease.out` | (0.16, 1, 0.3, 1) | Masuk: cepat di awal, mendarat lembut. Default untuk hampir semua kemunculan |
| `ease.inOut` | (0.65, 0, 0.35, 1) | Perpindahan A ke B yang tetap di layar |
| `ease.in` | (0.7, 0, 0.84, 0) | Keluar/menghilang |
| `ease.soft` | (0.33, 1, 0.68, 1) | Gerak halus objek |
| `ease.camera` | (0.4, 0, 0.2, 1) | Push-in dan pan kamera |

Spring (untuk karakter dan objek yang "punya massa"): `character` {damping 14, stiffness 120, mass 0.8}, `object` {18, 100, 1}, `heavy` {22, 80, 1.4}, `camera` {damping 200} (nyaris tanpa overshoot).

Durasi acuan pada 30 fps: kemunculan elemen kecil 12–18 frame, elemen besar 24–40 frame, push-in kamera sepanjang scene (150–240 frame), transisi 10–20 frame.

## 3. Kamera

Pilih **satu** gerakan utama per scene:
- **Push-in**: zoom 1.00 → 1.06–1.10 sepanjang scene. Menambah intensitas.
- **Pull-back reveal**: 1.10 → 1.00. Mengungkap konteks.
- **Drift**: translasi pelan 20–60 px, cocok untuk scene kontemplatif.
- **Tilt reveal**: y bergeser pelan dari foreground ke subjek.
Semua kamera ditambah `drift` 4–8 px (handheld halus). Rotasi kamera sangat kecil (≤0.5°) atau tidak ada.

## 4. Ritme dan beat

Tulis beat di `scene-spec.json` dengan nomor frame. Selaraskan perubahan visual dengan kata penting di narasi (±3 frame sebelum kata diucapkan; mata mendahului telinga). Dalam 6–8 detik, 3–5 beat cukup. Beat pertama di bawah 0.5 detik agar penonton TikTok tidak menggulir.

## 5. Rigging karakter

Bagian: badan, kepala, mata (kiri/kanan), alis, mulut, lengan, elemen sekunder. Layer animasi idle yang selalu aktif:

| Gerak | Cara | Nilai |
|---|---|---|
| Napas | scaleY badan, pivot dasar | ±1.2%, periode 3–3.5 s |
| Sway | rotasi seluruh figur | ±0.8°, periode 8–12 s |
| Kepala tertinggal | translasi kepala memakai fase badan dikurangi 0.12 s | ±2 px |
| Kedip | tutup mata 5–6 frame, jarak antar kedip acak 2.8–6.2 s | deterministik dari seed |
| Mikro-saccade mata | geser pupil 1–2 px tiap 20–50 frame | opsional |

Mulut saat bicara: 4–5 bentuk (tertutup, kecil, lebar, bulat, gigi). Ganti bentuk tiap 3–5 frame mengikuti pola deterministik dari seed; tutup mulut di jeda kalimat. Tidak perlu lip-sync fonetik penuh; ritme yang selaras dengan narasi sudah cukup meyakinkan untuk gaya ini.

## 6. Ekspresi

Definisikan 5–8 ekspresi sebagai parameter (alis: sudut dan tinggi; mata: bukaan; mulut: bentuk/lengkung), lalu **transisi antar ekspresi memakai tween 6–10 frame**, jangan memotong langsung. Ekspresi di starter: `neutral`, `curious`, `determined`, `awe`. Tambah sesuai kebutuhan cerita (sedih, lega, waspada, tersenyum tipis).

## 7. Secondary motion

Kain, rambut, kabut, api, daun: gerak sinus berlapis (dua frekuensi tidak berkelipatan), fase berbeda per elemen, arah angin konsisten satu scene. Elemen sekunder bergerak walau karakter diam — itu yang membuat dunia terasa hidup.

## 8. Transisi

Transisi harus punya alasan: **match cut** (bentuk di akhir scene A = bentuk di awal scene B), **light wipe** (cahaya terang menyapu layar lalu mengungkap scene berikut), **push-through** (kamera menembus foreground gelap). Hindari cross-dissolve generik dan efek transisi bawaan editor.
