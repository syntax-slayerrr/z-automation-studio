# LookDev v6, Character Rigging & 9:16 Safe-Zone Technical Bible (*Nalar Pelajar Series*)

Referensi teknis baku hasil *battle-testing* Episode 1 ([`remotion/videos/ipm-nalar-pelajar/scene3d/`](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/)). Wajib diterapkan pada setiap episode baru agar kualitas visual setara film animasi pendek Pixar × `@kacaurus`.

---

## 1. Living-Clay PBR Shader & Procedural Texture Standards

Gunakan langsung [LivingShaderForge.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/LivingShaderForge.ts) dan [LivingTextureForge.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/LivingTextureForge.ts):

1. **Custom GLSL `applyLivingClayShader` (`onBeforeCompile` sebelum `#include <opaque_fragment>`):**
   - Menghasilkan 2.5-tone *warm soft-stepped clay shading* (`warmShadowTint` oranye-karamel pada bayangan kulit/kain, bukan abu-abu kusam!), *subsurface wrap*, dan *crisp Fresnel rim light*.
   - **DILARANG:** `BackSide` black ink outlines, `MeshToonMaterial`, atau `<EffectComposer>`.
2. **Synchronous Per-Act PMREM HDRI (`buildLivingPMREMEnvironments(gl)`):**
   - Generate environment map per babak secara **sinkron** di `useMemo` sehingga **ZERO Frame-0 dark flash** pada setiap pergantian chunk 300-frame!
3. **Procedural Indonesian Architectural & Fabric PBR Maps:**
   - **Kulit karakter:** `createWisnuSkinTextures` (`roughness ~0.58`, `sheen`, *feathered radial cheek blush* via `PlaneGeometry` transparan + `polygonOffset` — **JANGAN** pakai `SphereGeometry` pipi yang memotong wajah!).
   - **Rambut keriting / wavy / hijab:** `createVelvetHairTextures` (`roughness: 0.80`, `clearcoat: 0.0`, `sheen: 0.38`) — **matte-velvet**, bukan bola plastik boba mengilap!
   - **Pakaian:** `createSweaterKnitTextures` (rajut benang + lipatan halus, tanpa garis pinggang horizontal saat dipakai di lengan POV!), `createCargoTwillTextures`.
   - **Ruangan Indonesia:** `createTerrazzoFloorTextures` (lantai teraso), `createTwoToneWallTextures` (dinding *wainscoting* 2 warna + lis kayu), `createCeilingGridTextures` (plafon akustik), `createWarmWoodTextures`.
   - **Kampung / Outdoor:** Paving block bertekstur + proyeksi *dappled tree leaf gobo* + pot bunga bugenvil + rumah 2 warna + sinar pagi volumetrik + *dust motes*.
4. **Dynamic Tight `2048×2048` Hero Shadow Frustum:**
   - Persempit `shadowSpan` secara dinamis mengikuti shot (`1.22–1.45m` untuk close-up & makro menulis agar bayangan poni di dahi dan bayangan tangan/pulpen di kertas tajam lembut; `3.8–5.4m` untuk wide shot & kampung).
   - **Rear Wall Rule:** Setiap ruangan interior (kamar, kelas, aula, sekretariat) wajib memiliki **dinding belakang fisik tertutup penuh** (pintu, poster IPM, lampu dinding *sconce*) — kamera reverse-shot tidak boleh pernah menghadap void gelap!

---

## 2. Character Rigging Golden Rules (Wisnu & Kader IPM Baru)

### A. Flush Spherical Eyelids (Face-Normal Transfer)
Acuan paten: [WisnuCharacter3D.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/WisnuCharacter3D.ts).
- Posisikan `eyeGrp.position.z = 0.1722` (flush pada permukaan pipi, 0 celah kulit di pinggir iris bahkan pada 85mm ECU).
- Bangun `lidCage` ellipsoidal tunggal dengan `upperLidPivot` yang berotasi mulus (`-0.86 rad` terbuka lebar → `-0.08 rad` setengah tertutup → `+0.36 rad` pejam damai).
- Material kelopak (`lidSkinMat`) wajib menyetel `rimStrength: 0.0, contourStrength: 0.0` dan mentransfer *vertex normals* mengarah ke depan wajah (*Face-Normal Transfer*) agar 0 garis bayangan seam di kelopak.
- Tampilkan `uShell` **hanya saat transisi/setengah tertutup** (`!happyEyes && !isFullyShut && lidDrop > 0.05`); saat pejam penuh gunakan lengkung bulu mata tunggal flush.
- Arah alis cemas/sedih (`anxious_sad`): selalu `b.bp.rotation.z = b.dir * browTilt` dengan `browTilt < 0` agar ujung luar turun sedih (bukan marah).

### B. Pixar 3D Articulated Lip-Sync Mouth (Wajib untuk SEMUA Tokoh Berbicara!)
Acuan paten: [SeminarHall3D.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/SeminarHall3D.ts) (`setModeratorTalk`) & [NalarPelajar3DCanvas.tsx](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/NalarPelajar3DCanvas.tsx) (`evalRawViseme` / `getSpeakerViseme`).
- **DILARANG KERAS** menskalakan vertikal `TorusGeometry` garis senyum saat tokoh bicara!
- Setiap karakter yang punya dialog wajib dilengkapi grup mulut 3D flush kontur wajah:
  - `smileLine` (`CatmullRomCurve3`, aktif saat `open < 0.09`),
  - `openGrp`: rongga mulut gelap matte (`#431819`), ring bibir lembut (`#B87358`), bar gigi atas gading (`#FAF7F0`, tampil jika `open > 0.22`), lidah merah muda (`#D4696E`, tampil jika `open > 0.36`).
- Gerakkan menggunakan **3-frame triangular smoothed Indonesian vowel/bilabial viseme** langsung dari `WORDS` di `story.ts`:
  - `a` → `open: 0.92, wide: 1.06`
  - `e / i` → `open: 0.56, wide: 1.22`
  - `o / u` → `open: 0.70, wide: 0.72`
  - `m / b / p` → `open: 0.04, wide: 0.96` (tutup bibir singkat alami!)
  - konsonan lain → `open: 0.30, wide: 0.98`
- Sertakan kedipan mata organik (`computeNaturalBlink(tSec + offset, rate)`) untuk tokoh utama maupun tokoh pendukung!

### C. 2-Bone Analytical IK & Prop-Drives-Hand (Zero Clipping!)
Acuan paten: `solveTwoBoneIK` (`remotion/lib/zaldy-world/ikSolver3D.ts`), [WisnuCharacter3D.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/WisnuCharacter3D.ts), dan [StudyRoom3D.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/StudyRoom3D.ts).
- **Mikrofon Genggam Berdiri:** Pasang di `rightHandSocket` agar sumbu `-Z_socket` mengarah tegak ke mulut pembicara (`position: (0, -0.014, -0.022)`, `rotation: (-Math.PI/2 - 0.12, 0, 0.06)`).
- **Macro POV Menulis / Aksi Meja (SH08 Pattern):**
  1. Selalu bangun **tubuh sweater/kemeja + kedua bahu (`L_SHOULDER`, `R_SHOULDER`)** di tepi bawah meja dan hubungkan ke kedua tangan lewat **2-Bone Analytical IK** (lengan atas + sendi siku bulat tanpa celah + lengan bawah + manset rajut + pergelangan kulit tirus `openEnded: true` + bola sambung pergelangan halus).
  2. **Tangan Kiri Penahan Kertas:** Pakai telapak ramping proporsional + 5 jari 2-segmen (`addJointedDigit`). Luruskan rotasi tangan kiri ke arah vektor lengan bawah memakai **`+lYaw`** (dalam Euler `"XYZ"`, `Rz(+lYaw)` lalu `Rx(+Math.PI/2)` memetakan jari `-Y` tepat ke `(+sin(lYaw), 0, -cos(lYaw))` — **JANGAN `-lYaw`**!).
  3. **Tangan Kanan Memegang Pulpen (*Unified Prop-Drives-Hand*):** Bangun batang pulpen (`+Y` dari ujung tinta `(0,0,0)`) dan jari-jari tripod 2-segmen (`addJointedDigit`: telunjuk di `-Z`, ibu jari di `-X`, jari tengah penyangga di `+Z`, manis & kelingking di `+X/+Z`) dalam **satu grup lokal `penAndHandRig`** pada jarak radial persis `r_pen + r_finger` → **secara matematis 0.0 mm clipping!** Lalu arahkan target IK lengan kanan tepat ke `RIGHT_WRIST_LOCAL` hasil transformasi dunia `penAndHandRig`.

### D. Official IPM Emblem & Reconstructed Digital UIs
- **Pin IPM 3D Resmi:** Selalu gunakan `createOfficialIpmPin3D` dan `drawOfficialIpmLogo` dari [OfficialIpmLogo.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/OfficialIpmLogo.ts) (perisai pentagon resmi dengan gradasi kuning-hijau, buku terbuka, matahari, dan teks IPM). Pastikan posisi Z pin sedikit di luar permukaan dada (`z ≈ 0.236` pada rig Moderator) agar tidak tenggelam di kain.
- **UI Layar HP / Laptop / Slide Seminar:** Selalu render Canvas2D beresolusi tinggi (`540×1140` untuk ponsel vertikal, `1920×1080` untuk slide presentasi) lewat pola [DigitalUISurfaces.ts](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/DigitalUISurfaces.ts) — tampilkan antarmuka nyata (feed sosial media, drawer komentar/cek fakta, slide Keynote dengan donat chart & catatan metodologi), **jangan pernah kotak warna kosong atau teks tempelan murahan!**

---

## 3. Rumus Strict 9:16 Bubble & Orb Safe-Zone (Zero Cropped Text!)

Pada rasio vertikal `9:16` (`aspect = 0.5625`), lebar layar jauh lebih sempit daripada tinggi layar. Setiap gelembung pikiran 3D, orb edukasi, atau kartu melayang **WAJIB** dihitung terhadap jarak kamera `D` dan `FOV`:

```text
halfH = D * tan(FOV / 2)
halfW = halfH * 0.5625

Syarat Wajib Anti-Potong:
  |bubbleX - camLookX| + (bubbleScale / 2) <= 0.85 * halfW
  |bubbleY - camLookY| + (bubbleScale / 2) <= 0.82 * halfH
```

Aturan praktis tambahan yang terbukti di Episode 1:
- **Zona Bebas Subtitle Atas:** Jika shot memakai pill subtitle di zona atas (`top: 11%`), pastikan tepi atas gelembung tertinggi berada di bawah `camLookY + 0.58 * halfH` agar ikon & teks bubble tidak tertumpuk pill subtitle!
- **Zona Bebas Rambut & Kursi:** Hindari menaruh bubble sejajar telinga/sandaran kursi di belakang karakter (akan tampak seperti potongan lingkaran mengintip). Susun 3 bubble hero dalam **segitiga seimbang tepat di atas rambut karakter** dan 6 orb edukasi (`5W 1H` dsb.) dalam **2 kolom rapi mengapit kepala** dengan skala aktif `0.34` / tenang `0.28`.
- **Awan 50+ Bubble Eskalasi:** Batasi sebaran acak `bx` secara ketat di sekitar `±0.55m` dari pusat karakter (`by` menjulang ke atas), bukan melebar ±1.6m ke luar layar!
