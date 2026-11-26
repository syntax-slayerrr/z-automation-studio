# Storyboard Produksi — `<Judul Episode>` (`<slug>`)

## 1. Director's Treatment (Anti-Template Brief)
- **Premis & Ironi Komedi**: ...
- **Dinamika Hermes vs OpenClaw**: ...
- **Jumlah Babak / Scene**: ... scene (kustom, sesuai kebutuhan cerita)
- **Visual Motif**: ...
- **Jadwal Time-of-Day & Mood Cahaya**: ...
- **Full-Frame Set Dressing (`buildBedroomWorld(options)`) — ZERO Leftover Assets**:
  - **Baligho Bambu Luar Jendela**: `visible: true/false` — isi custom: `...`
  - **Palet Kamar (Dinding, Gorden, Meja, LED)**: `...`
  - **Papan Dinding Kiri (`corkboard`)**: `visible: true/false` — isi custom: `...`
  - **Monitor Vertikal Kanan (`sideMonitor`)**: `visible: true/false` — isi custom: `...`
  - **Prop Meja & Jendela (`props`)**: aktifkan `...`, matikan/ganti `...`
- **Custom 3D Props / Gags Baru (`CustomProps3D.ts`)**:
  1. `...`
  2. `...`
- **Perbedaan Utama dari Episode Sebelumnya**: ...

---

## 2. Peta Ringkas Shot List

| Shot | Scene | Cue | Tipe Kamera & Gerak | Subjek & Aksi Utama | Prop 3D / Layar Laptop | Transisi & SFX |
|---|---|---|---|---|---|---|
| `SH01` | S1 | `s1_start` | `C08 Low-Angle` · slow push | ... | ... | Hard cut · `sfx_...` |
| `SH02` | S1 | `s1_react` | `C04 OTS OC→HM` · locked-off | ... | ... | Pre-lap · `...` |

---

## 3. Detail Panel Sutradara (Per Shot)

### `SH01` — `<Nama Shot>` (`S1`, cue: `[[s1_start]]`)
- **Dialog / Beat**: `OPENCLAW`: "..."
- **Kamera & Motivasi**: `C08 Low-Angle` (`fromPos` → `toPos`, `FOV 37°→35°`, `roll 0°`) — *Alasan*: ...
- **Blocking & Acting**:
  - **OpenClaw**: posisi `(...)`, ekspresi `...`, eyeline `...`, aksi `anticipation → action → settle`.
  - **Hermes (Listener/Counter-Acting)**: posisi `(...)`, ekspresi `...`, eyeline `...`, reaksi `...`.
- **Layar Laptop & Custom Prop 3D**: ...
- **Lighting & Suasana**: ...
- **SFX / Dinamika Musik**: ...

---

## 4. Anti-Template Storyboard Gate (9 Checklist Wajib)
- [ ] Struktur scene & punchline orisinal (tidak menyalin template 8-scene lama)
- [ ] Minimal 5 variasi shot scale/angle berbeda (termasuk OTS / Low / High / Dutch / ECU / Insert)
- [ ] Tidak ada 2 shot berurutan dengan framing & pergerakan kamera identik
- [ ] Minimal 2 custom 3D prop/gag baru di `CustomProps3D.ts`
- [ ] Karakter yang sedang diam memiliki reaksi & eyeline spesifik
- [ ] Jadwal Time-of-Day & musik disesuaikan dengan mood cerita
- [ ] Full-Frame Set Dressing lengkap (`baligho`, palet kamar, `corkboard`, `sideMonitor`, `props`, layar laptop)
- [ ] **ZERO Leftover Assets**: tidak ada sisa logo, teks, baligho, poster, atau prop dari video lama!
