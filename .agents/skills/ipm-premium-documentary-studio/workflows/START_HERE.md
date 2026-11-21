# Start Here — Prompts for the User

Copy a prompt below into your AI after installing the skill. All prompts assume the skill `ipm-premium-documentary-studio` is active.

## 1. Kick off the whole series (Series mode)
```
Aktifkan IPM Premium Documentary Studio.

Kita membuat serial 15 episode dokumenter animasi sejarah IPM. Mulai dari Series mode (gate S0–S3), jangan langsung menulis naskah episode atau membuat video.

Arah yang sudah dikunci: premium realistic-stylized 3D; karakter manusia; dokumenter sejarah (bukan promosi); 60–120 detik per episode; vertikal 9:16; narasi Bahasa Indonesia untuk ElevenLabs; satu narator untuk seluruh seri.
Pondasi kualitas: naskah, animasi, dan suara. Naskah tidak boleh monoton dan setiap episode harus memunculkan rasa penasaran yang jujur (berbasis fakta, bukan drama buatan).

Lakukan berurutan:
1. Ajukan hanya pertanyaan brief yang benar-benar belum terjawab.
2. Riset dossier seluruh arc (sumber primer/resmi diutamakan), susun kronologi, daftar kandidat episode (lebih dari 15), dan tandai verified/probable/disputed/unknown.
3. Susun Series Bible: series question, look lock, narrator & sonic signature, motif, glosarium.
4. Peta 15 episode (fungsi tiap slot), variation matrix, dan open-loop ledger. Jalankan series_audit.py.
5. Berikan satu paket persetujuan (Bundle S) sebelum kita masuk Episode 1.
Jangan membuat klaim, dialog, tokoh, wajah, lokasi, atau dokumen yang tidak didukung bukti.
```

## 2. Start an episode (Episode mode)
```
Aktifkan IPM Premium Documentary Studio. Lanjutkan ke Episode [N] sesuai Series Bible dan project_state.md.
Mulai dari E1: riset + 2–3 pendekatan cerita yang berbeda (struktur dan mekanisme hook berbeda), cocokkan dengan variation matrix dan open-loop ledger, lalu rekomendasikan satu. Tunggu persetujuan sebelum menulis naskah.
```

## 3. Write the script
```
Naskah Episode [N] sudah disetujui treatment-nya. Lanjutkan ke E2: tulis tiga hook dengan mekanisme berbeda, pilih satu dengan hook test, lalu naskah tiga-jalur (Suara | Gambar | Bunyi), narrator direction card, master narration + TTS export, spotting sheet. Jalankan script_lint.py dan jawab Premium Test.
```

## 4. Resume in a new session (or with a different AI)
```
Baca project_state.md, Series Bible, variation matrix, dan open-loop ledger. Ringkas posisi kita (gate, keputusan terkunci, yang menunggu persetujuan, blocker), lalu lanjutkan dari next action. Jangan mengubah keputusan terkunci tanpa persetujuan.
```

## 5. Single tasks (examples)
- "Beri 3 alternatif hook untuk Episode [N] dengan mekanisme berbeda dan jelaskan mana yang paling kuat."
- "Buat shot card untuk hero shot Episode [N], lalu prompt untuk tool [X] (cek dokumentasi terbaru)."
- "Periksa naskah ini: ritme, pengulangan frasa, kejujuran rasa penasaran, dan kecocokan dengan seri."
- "Rancang sound plan dan spotting sheet untuk Episode [N]."
- "Jalankan QA lengkap Episode [N] dan beri skor."
