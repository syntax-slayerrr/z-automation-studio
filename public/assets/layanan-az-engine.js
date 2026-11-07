import * as THREE from '/assets/vendor/three/three.module.js';

/**
 * Z-AUTOMATION // A-SPACE 3D WEBGL GLOBE EARTH (CUSTOM GLSL DAY/NIGHT SHADER)
 * Matches the moody dark-terminator Earth + green polar aurora + right rim light
 * from the A-SPACE reference UI.
 */

function initWebGLEarth() {
  const canvas = document.getElementById('aspace-earth-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || 680;

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  camera.position.set(0, 0.05, 6.6);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    return;
  }

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Position Earth brought slightly more inward/centered (framing opposite to the Hero text)
  const earthGroup = new THREE.Group();
  earthGroup.position.set(width > 992 ? 2.05 : (width > 768 ? 1.35 : 0.0), width > 992 ? 0.08 : -0.25, 0);
  earthGroup.rotation.z = 0.16;
  scene.add(earthGroup);

  const loader = new THREE.TextureLoader();
  const radius = 2.25;
  const sphereGeo = new THREE.SphereGeometry(radius, 64, 64);

  const dayTex = loader.load('/assets/textures/earth/earth_atmos_2048.jpg');
  const specTex = loader.load('/assets/textures/earth/earth_lights_2048.png');
  const cloudTex = loader.load('/assets/textures/earth/earth_clouds_1024.png');

  // Custom GLSL Day/Night Terminator + Dynamic City Lights + Aurora Shader
  // Sun shines from the front-left (illuminating the visible hemisphere facing the text & viewer),
  // while the dark night terminator sweeps away to the right side with glowing golden city lights!
  const earthShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uDayMap: { value: dayTex },
      uSpecMap: { value: specTex },
      uCloudMap: { value: cloudTex },
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(-0.95, 0.32, 0.75).normalize() }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vNormalView;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vPos = position;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uDayMap;
      uniform sampler2D uSpecMap;
      uniform sampler2D uCloudMap;
      uniform float uTime;
      uniform vec3 uSunDir;

      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vNormalView;
      varying vec3 vPos;

      void main() {
        vec3 dayCol = texture2D(uDayMap, vUv).rgb;
        
        // Dynamic slowly drifting clouds
        vec2 cloudUv = vec2(fract(vUv.x + uTime * 0.0025), vUv.y);
        float clouds = texture2D(uCloudMap, cloudUv).r;

        // Sun illumination: sun comes from front-left (illuminating the hemisphere facing the text!)
        float ndotl = dot(vNormalWorld, uSunDir);
        float dayFactor = smoothstep(-0.10, 0.38, ndotl);

        // Night side city lights (facing the right edge, away from the text)
        vec3 cityLights = texture2D(uSpecMap, vUv).rgb * vec3(1.15, 0.92, 0.58) * 1.85;
        vec3 nightBase = vec3(0.005, 0.010, 0.022) + cityLights * (1.0 - smoothstep(-0.05, 0.22, ndotl));

        // Subtle polar aurora glow
        float auroraBand = smoothstep(0.64, 0.86, vUv.y) * smoothstep(0.98, 0.78, vUv.y);
        float auroraWave = sin(vUv.x * 22.0 + uTime * 0.35) * 0.5 + 0.5;
        vec3 aurora = vec3(0.08, 0.72, 0.52) * auroraBand * auroraWave * (1.0 - dayFactor * 0.8) * 0.28;

        // Rich illuminated day side (cinematic blue oceans, vibrant land, crisp clouds)
        vec3 litEarth = dayCol * vec3(0.92, 1.04, 1.22) + vec3(clouds * 0.48);

        // Combine night and day across smooth terminator
        vec3 surface = mix(nightBase + aurora, litEarth, dayFactor);

        // Atmospheric Fresnel rim glow around the globe limb
        float fresnel = pow(1.0 - max(0.0, dot(vNormalView, vec3(0.0, 0.0, 1.0))), 3.2);
        float rimSun = smoothstep(-0.35, 0.55, ndotl) * 0.8 + 0.2;
        vec3 rimColor = mix(vec3(0.12, 0.46, 0.95), vec3(0.55, 0.92, 1.0), rimSun);

        vec3 finalCol = surface + rimColor * fresnel * 0.95;
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `
  });

  // 1. Backside Ambient Shadow & Deep Cosmic Glow Disc (Wrapped Around Earth)
  const shadowGlowGeo = new THREE.PlaneGeometry(radius * 4.6, radius * 4.6);
  const shadowGlowMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5, 0.5));
        // Soft cosmic ambient glow blooming outward from the globe
        float glow = smoothstep(0.5, 0.16, d) * 0.38;
        vec3 glowCol = vec3(0.14, 0.42, 0.92);
        
        // Deep celestial core shadow directly behind the planet body
        float coreShadow = smoothstep(0.24, 0.0, d) * 0.72;
        vec3 shadowCol = vec3(0.01, 0.02, 0.05);
        
        vec3 col = mix(glowCol, shadowCol, coreShadow);
        float alpha = max(glow, coreShadow * 0.75);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  const shadowGlowMesh = new THREE.Mesh(shadowGlowGeo, shadowGlowMat);
  shadowGlowMesh.position.set(0, 0, -0.35);
  earthGroup.add(shadowGlowMesh);

  // 2. The Main Earth Mesh
  const earthMesh = new THREE.Mesh(sphereGeo, earthShaderMat);
  earthMesh.rotation.y = 3.6;
  earthGroup.add(earthMesh);

  // 3. Inner Intense Atmospheric Corona Halo
  const innerAtmosGeo = new THREE.SphereGeometry(radius * 1.045, 64, 64);
  const innerAtmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
        vec3 col = vec3(0.28, 0.72, 1.0);
        gl_FragColor = vec4(col, 1.0) * intensity * 1.35;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  earthGroup.add(new THREE.Mesh(innerAtmosGeo, innerAtmosMat));

  // 4. Outer Ethereal Atmospheric Bloom Halo
  const outerAtmosGeo = new THREE.SphereGeometry(radius * 1.25, 64, 64);
  const outerAtmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
        vec3 col = vec3(0.15, 0.45, 0.95);
        gl_FragColor = vec4(col, 1.0) * intensity * 0.9;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  earthGroup.add(new THREE.Mesh(outerAtmosGeo, outerAtmosMat));

  // Deep Space Stars
  const starCount = 380;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 26;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    starPositions[i * 3 + 2] = -Math.random() * 12 - 2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xdbeafe,
    size: 0.028,
    transparent: true,
    opacity: 0.65
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // Mouse & Drag Rotation
  let targetRotY = 0;
  let targetRotX = 0;
  let isDragging = false;
  let prevX = 0;
  let dragSpinOffset = 0;

  window.addEventListener(
    'mousemove',
    (e) => {
      const nx = e.clientX / Math.max(1, window.innerWidth) - 0.5;
      const ny = e.clientY / Math.max(1, window.innerHeight) - 0.5;
      targetRotY = nx * 0.45;
      targetRotX = ny * 0.2;
      if (isDragging) {
        dragSpinOffset += (e.clientX - prevX) * 0.005;
        prevX = e.clientX;
      }
    },
    { passive: true }
  );

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevX = e.clientX;
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('resize', () => {
    const nw = canvas.clientWidth || window.innerWidth;
    const nh = canvas.clientHeight || 680;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
    earthGroup.position.x = nw > 992 ? 2.05 : (nw > 768 ? 1.35 : 0.0);
    earthGroup.position.y = nw > 992 ? 0.08 : -0.25;
  });

  const clock = new THREE.Clock();
  const heroTrack = document.getElementById('aspace-hero-track');
  const heroStage = document.getElementById('aspace-hero-stage');
  const actBarFill = document.getElementById('hero-act-bar-fill');
  const scrollStatusEl = document.getElementById('hero-scroll-status');
  const actSlides = [
    document.getElementById('hero-act-0'),
    document.getElementById('hero-act-1'),
    document.getElementById('hero-act-2')
  ];
  const actTabs = document.querySelectorAll('.aspace-act-tab');
  let currentActIndex = 0;
  let baseSpin = 3.6;

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  let currentScrollProgress = 0;

  function updateHeroChoreography(scrollPx) {
    if (!heroTrack || !heroStage) return;
    const isDesktopChoreo = window.innerWidth > 780;
    if (!isDesktopChoreo) {
      heroStage.style.transform = 'none';
      return;
    }

    const viewH = window.innerHeight || 800;
    const trackH = heroTrack.offsetHeight || viewH * 3.4;
    const maxPin = Math.max(1, trackH - viewH);
    const pinnedPx = Math.min(Math.max(0, scrollPx), maxPin);
    currentScrollProgress = pinnedPx / maxPin;
    const p = currentScrollProgress;

    // Apply pinning synchronously in the EXACT same tick as #page-container
    heroStage.style.transform = `translate3d(0, ${pinnedPx.toFixed(2)}px, 0)`;

    // Strict Non-Overlapping Scenario Plateaus (Zero Collision)
    // Act 01: Fully locked 0.00 -> 0.26 | Clean exit crossfade 0.26 -> 0.32
    // Act 02: Clean enter 0.32 -> 0.38 | Fully locked 0.38 -> 0.60 | Clean exit crossfade 0.60 -> 0.66
    // Act 03: Clean enter 0.66 -> 0.72 | Fully locked 0.72 -> 0.86 | Fade-out handoff 0.86 -> 0.96
    const w0 = 1 - smoothstep(0.26, 0.32, p);
    const w1 = smoothstep(0.32, 0.38, p) * (1 - smoothstep(0.60, 0.66, p));
    const w2 = smoothstep(0.66, 0.72, p) * (1 - smoothstep(0.86, 0.96, p));
    const weights = [w0, w1, w2];

    const y0 = -smoothstep(0.26, 0.32, p) * 14;
    const y1 = (1 - smoothstep(0.32, 0.38, p)) * 14 - smoothstep(0.60, 0.66, p) * 14;
    const y2 = (1 - smoothstep(0.66, 0.72, p)) * 14 - smoothstep(0.86, 0.96, p) * 12;
    const offsets = [y0, y1, y2];

    actSlides.forEach((sl, idx) => {
      if (!sl) return;
      const w = weights[idx];
      sl.style.opacity = w.toFixed(3);
      sl.style.transform = `translate3d(0, ${offsets[idx].toFixed(2)}px, 0)`;
      sl.style.pointerEvents = w > 0.7 ? 'auto' : 'none';
    });

    const nextAct = p < 0.32 ? 0 : (p < 0.66 ? 1 : 2);
    if (nextAct !== currentActIndex) {
      currentActIndex = nextAct;
      actSlides.forEach((sl, idx) => {
        if (sl) sl.classList.toggle('is-active', idx === currentActIndex);
      });
      actTabs.forEach((tb, idx) => {
        tb.classList.toggle('is-active', idx === currentActIndex);
      });
      if (scrollStatusEl) {
        const labels = [
          'GULIR UNTUK MEMUTAR ORBIT BUMI // BABAK 01/03',
          'SPEKTRUM LAYANAN RP 150RB – 1,5 JT // BABAK 02/03',
          'TELEMETRI ARSITEKTUR 60 FPS // BABAK 03/03'
        ];
        scrollStatusEl.textContent = labels[currentActIndex] || labels[0];
      }
    }
    if (actBarFill) {
      const pct = Math.max(12, Math.min(100, Math.round(p * 100)));
      actBarFill.style.width = `${pct}%`;
    }
  }

  function tryHookLusionSync() {
    const sm = window._sm || window._scrollManager;
    if (sm && typeof sm.syncDom === 'function' && !sm._azHeroSyncHooked) {
      sm._azHeroSyncHooked = true;
      const origSyncDom = sm.syncDom.bind(sm);
      sm.syncDom = function () {
        origSyncDom();
        updateHeroChoreography(this.scrollPixel);
      };
      updateHeroChoreography(sm.scrollPixel || 0);
      return true;
    }
    return !!(sm && sm._azHeroSyncHooked);
  }

  window.scrollToHeroAct = function (actIdx) {
    if (!heroTrack) return;
    const viewH = window.innerHeight || 800;
    const maxPin = Math.max(1, heroTrack.offsetHeight - viewH);
    const ratios = [0.02, 0.48, 0.78];
    const targetPx = Math.round((ratios[actIdx] || 0) * maxPin);
    const sm = window._sm || window._scrollManager;
    if (sm && typeof sm.scrollToPixel === 'function') {
      sm.scrollToPixel(targetPx);
    } else if (sm && typeof sm.scrollTo === 'function') {
      sm.scrollTo(targetPx);
    } else {
      window.scrollTo({ top: targetPx, behavior: 'smooth' });
    }
  };

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    earthShaderMat.uniforms.uTime.value = elapsed;

    // Synchronize scroll: if Lusion is not yet hooked, update via fallback
    if (!tryHookLusionSync()) {
      const sm = window._sm || window._scrollManager;
      const scrollPx = sm && typeof sm.scrollPixel === 'number' ? sm.scrollPixel : -heroTrack.getBoundingClientRect().top;
      updateHeroChoreography(scrollPx);
    }

    // Auto-recover canvas size if initial boot occurred while container was resizing
    const cw = canvas.clientWidth || window.innerWidth;
    const ch = canvas.clientHeight || window.innerHeight || 680;
    if (cw > 0 && ch > 0 && (Math.abs(renderer.domElement.width / renderer.getPixelRatio() - cw) > 2 || Math.abs(renderer.domElement.height / renderer.getPixelRatio() - ch) > 2)) {
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch, false);
    }

    // Stepped Orbital Rotation Plateaus (Earth rotates smoothly during transitions and holds steady on plateaus)
    const p = currentScrollProgress;
    const step1 = smoothstep(0.24, 0.38, p);
    const step2 = smoothstep(0.58, 0.72, p);
    const choreoProgress = (step1 + step2) * 0.5;

    baseSpin += 0.0011;
    const scrollSpin = choreoProgress * Math.PI * 1.35;
    earthMesh.rotation.y = baseSpin + scrollSpin;

    const nw = canvas.clientWidth || window.innerWidth;
    const basePosX = nw > 992 ? 2.05 - choreoProgress * 0.28 : (nw > 768 ? 1.35 : 0.0);
    const basePosY = nw > 992 ? 0.06 + Math.sin(choreoProgress * Math.PI) * 0.08 : -0.25;
    earthGroup.position.x = basePosX;
    earthGroup.position.y = basePosY;

    camera.position.z = 6.6 - choreoProgress * 0.92;
    earthGroup.rotation.z = 0.16 + choreoProgress * 0.16;

    const desiredY = targetRotY + dragSpinOffset;
    earthGroup.rotation.y += (desiredY - earthGroup.rotation.y) * 0.06;
    earthGroup.rotation.x += (targetRotX + choreoProgress * 0.12 - earthGroup.rotation.x) * 0.06;

    renderer.render(scene, camera);
  }

  animate();
}

// ============================================================================
// 2. INTERACTIVE WORKFLOW SANDBOX (HERMES x OPENCLAW)
// ============================================================================
const SANDBOX_SCENARIOS = {
  wa_closing: {
    input: 'Pelanggan menghubungi jam 01:30 dini hari menanyakan ketersediaan paket Website Ucapan Ulang Tahun beserta tambahan lagu latar.',
    hermes: 'Hermes membaca katalog harga Z-Automation -> memilih Paket 01 (Rp 150.000) + Add-on Selesai Ekspres 24 Jam (Rp 50.000) = Total Rp 200.000.',
    openclaw: 'OpenClaw menerbitkan Nomor Invoice ORD-ZA, menyimpan data pesanan ke Database, dan mengirimkan konfirmasi ke WhatsApp pelanggan dalam 1,5 detik.'
  },
  rekap_nota: {
    input: 'Tim operasional mengirimkan 45 foto struk pengeluaran harian ke grup WhatsApp internal.',
    hermes: 'Hermes Vision mengekstrak nama item, tanggal, dan nominal, lalu mengklasifikasikan pos anggaran secara otomatis.',
    openclaw: 'OpenClaw menginput seluruh 45 baris transaksi ke spreadsheet keuangan dan mengirimkan ringkasan kas harian.'
  },
  lead_landing: {
    input: 'Pengunjung mengklik iklan dan membuka High-Conversion Landing Page (Paket Rp 550.000).',
    hermes: 'Struktur copywriting terukur & waktu muat < 1.2 detik mengarahkan pengunjung mengisi formulir pemesanan.',
    openclaw: 'Sistem mencatat lead di Database (/api/orders) dan memicu pesan sambutan WhatsApp otomatis.'
  }
};

window.selectSandboxScenario = function (key, btn) {
  const data = SANDBOX_SCENARIOS[key];
  if (!data) return;

  document.querySelectorAll('.aspace-sandbox-tab').forEach((b) => b.classList.remove('is-active'));
  if (btn) btn.classList.add('is-active');

  const inEl = document.getElementById('sb-log-input');
  const hmEl = document.getElementById('sb-log-hermes');
  const ocEl = document.getElementById('sb-log-openclaw');

  if (inEl) inEl.textContent = data.input;
  if (hmEl) hmEl.textContent = data.hermes;
  if (ocEl) ocEl.textContent = data.openclaw;
};

// ============================================================================
// 3. 6-PACKAGE ASYMMETRIC BENTO CATALOG FILTER (RP 150.000 - RP 1.500.000)
// ============================================================================
window.filterCatalog = function (category, btn) {
  document.querySelectorAll('.aspace-filter-btn').forEach((b) => b.classList.remove('is-active'));
  if (btn) btn.classList.add('is-active');

  const grid = document.getElementById('aspace-bento-grid');
  if (grid) {
    grid.classList.toggle('is-filtered', category !== 'all');
  }

  const cards = document.querySelectorAll('.aspace-pkg-card[data-cat]');
  cards.forEach((card) => {
    const cat = card.getAttribute('data-cat');
    const isHoriz = card.classList.contains('aspace-bento-card--horizontal');
    if (category === 'all' || cat === category) {
      card.style.display = isHoriz && window.innerWidth > 1024 ? 'grid' : 'flex';
    } else {
      card.style.display = 'none';
    }
  });

  const sm = window._sm || window._scrollManager;
  if (sm && typeof sm.resize === 'function') {
    setTimeout(() => sm.resize(window.innerWidth, window.innerHeight), 40);
  }
};

// ============================================================================
// 4. CONTEXTUAL ORDER FORM + DATABASE (/api/orders) + WHATSAPP PIPELINE
// ============================================================================
const CATALOG_PACKAGES = {
  ultah_150k: {
    name: 'Paket 01 — Website Ucapan Ulang Tahun / Anniversary Premium',
    price: 150000,
    duration: '1 – 2 Hari Kerja',
    type: 'personal',
    image: '/assets/images/katalog/paket-01-ultah-gift.jpg',
    targetLabel: 'Untuk Siapa Website Ini? (Nama Pasangan / Sahabat / Keluarga) *',
    targetPlaceholder: 'Contoh: Ulang Tahun ke-22 Nabila',
    briefLabel: 'Konsep Kejutan, Pesan Utama, & Judul Lagu Latar *',
    briefPlaceholder: 'Tuliskan nuansa warna, judul lagu latar yang diinginkan, serta isi pesan spesial...'
  },
  undangan_250k: {
    name: 'Paket 02 — Website Undangan & Event Digital Eksklusif',
    price: 250000,
    duration: '2 – 3 Hari Kerja',
    type: 'personal',
    image: '/assets/images/katalog/paket-02-undangan-vip.jpg',
    targetLabel: 'Nama Acara / Mempelai & Tanggal Acara *',
    targetPlaceholder: 'Contoh: Engagement Reza & Dinda — 20 Desember 2026',
    briefLabel: 'Detail Lokasi Maps, Susunan Acara, & Rekening/QRIS *',
    briefPlaceholder: 'Tuliskan lokasi acara, waktu pelaksanaan, dan tema warna undangan...'
  },
  portfolio_350k: {
    name: 'Paket 03 — Web Portfolio, CV Interaktif & Katalog Menu UMKM',
    price: 350000,
    duration: '2 – 4 Hari Kerja',
    type: 'personal',
    image: '/assets/images/katalog/paket-03-portfolio-umkm.jpg',
    targetLabel: 'Nama Personal / Nama Cafe / UMKM Anda *',
    targetPlaceholder: 'Contoh: Kopi Senja / Portfolio Kreatif Dimas',
    briefLabel: 'Daftar Menu / Karya yang Ingin Ditampilkan *',
    briefPlaceholder: 'Jelaskan singkat daftar produk/menu atau portofolio kerja yang ingin ditampilkan...'
  },
  landing_550k: {
    name: 'Paket 04 — High-Conversion Landing Page (Jualan / Iklan Ads)',
    price: 550000,
    duration: '3 – 5 Hari Kerja',
    type: 'bisnis',
    image: '/assets/images/katalog/paket-04-landing-roas.jpg',
    targetLabel: 'Nama Brand / Produk / Layanan Utama *',
    targetPlaceholder: 'Contoh: Skincare GlowUp / Kelas Privat',
    briefLabel: 'Keunggulan Produk, Penawaran Promo, & Target Pembeli *',
    briefPlaceholder: 'Jelaskan produk yang ingin dipasarkan, harga promo, dan target audiens...'
  },
  compro_950k: {
    name: 'Paket 05 — Website Company Profile / Toko Online WhatsApp',
    price: 950000,
    duration: '5 – 7 Hari Kerja',
    type: 'bisnis',
    image: '/assets/images/katalog/paket-05-corporate-store.jpg',
    targetLabel: 'Nama Perusahaan / Toko Online *',
    targetPlaceholder: 'Contoh: PT Karya Mandiri / Butik Nusantara',
    briefLabel: 'Struktur Halaman & Jumlah Produk Katalog *',
    briefPlaceholder: 'Sebutkan profil singkat usaha Anda dan jumlah produk untuk katalog keranjang WA...'
  },
  custom_1500k: {
    name: 'Paket 06 — Custom Website 3D Interaktif / Integrasi AI Agent',
    price: 1500000,
    duration: '7 – 14 Hari Kerja',
    type: 'custom',
    image: '/assets/images/katalog/paket-06-webgl-ai-flagship.jpg',
    targetLabel: 'Nama Perusahaan / Sistem Proyek *',
    targetPlaceholder: 'Contoh: Studio Kreatif / Otomasi AI Hermes + OpenClaw',
    briefLabel: 'Spesifikasi Kustom 3D WebGL atau Alur Kerja AI Agent *',
    briefPlaceholder: 'Ceritakan fitur kustom, adegan 3D interaktif, atau alur tugas bot AI yang ingin dibangun...'
  }
};

function formatRupiah(num) {
  return 'Rp ' + Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

window.selectTierChip = function (pkgId) {
  const selectEl = document.getElementById('order-package-select');
  if (selectEl) {
    selectEl.value = pkgId;
    window.updateOrderCalculation();
  }
};

window.chooseCatalogPackage = function (pkgId) {
  const selectEl = document.getElementById('order-package-select');
  if (selectEl) {
    selectEl.value = pkgId;
    window.updateOrderCalculation();
  }
  if (window.scrollToSection) {
    window.scrollToSection('order-wizard');
  } else {
    const wizardSec = document.getElementById('order-wizard');
    if (wizardSec) {
      wizardSec.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

window.updateOrderCalculation = function () {
  const selectEl = document.getElementById('order-package-select');
  if (!selectEl) return;

  const pkgId = selectEl.value;
  const pkg = CATALOG_PACKAGES[pkgId] || CATALOG_PACKAGES.ultah_150k;

  document.querySelectorAll('#configurator-tier-grid .tier-chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.getAttribute('data-tier') === pkgId);
  });

  const targetLbl = document.getElementById('lbl-brand-target');
  const targetInp = document.getElementById('order-brand-target');
  const briefLbl = document.getElementById('lbl-brief-notes');
  const briefInp = document.getElementById('order-brief-notes');

  if (targetLbl) targetLbl.textContent = pkg.targetLabel;
  if (targetInp) targetInp.placeholder = pkg.targetPlaceholder;
  if (briefLbl) briefLbl.textContent = pkg.briefLabel;
  if (briefInp) briefInp.placeholder = pkg.briefPlaceholder;

  let addonTotal = 0;
  const addonNames = [];
  document.querySelectorAll('#aspace-order-form input[name="order_addon"]:checked').forEach((cb) => {
    addonTotal += parseInt(cb.value || '0', 10);
    addonNames.push(cb.getAttribute('data-label') || '');
  });

  const totalPrice = pkg.price + addonTotal;

  const sumName = document.getElementById('sum-pkg-name');
  const sumBase = document.getElementById('sum-pkg-base');
  const sumTime = document.getElementById('sum-pkg-time');
  const sumAddons = document.getElementById('sum-pkg-addons');
  const sumTotal = document.getElementById('sum-total-price');

  if (sumName) sumName.textContent = pkg.name;
  if (sumBase) sumBase.textContent = formatRupiah(pkg.price);
  if (sumTime) sumTime.textContent = pkg.duration;
  if (sumAddons) sumAddons.textContent = addonNames.length ? addonNames.join(', ') : 'Tidak ada tambahan';
  if (sumTotal) sumTotal.textContent = formatRupiah(totalPrice);

  const invoiceHud = document.getElementById('aspace-invoice-hud');
  if (invoiceHud) {
    invoiceHud.classList.remove('is-flashing');
    void invoiceHud.offsetWidth;
    invoiceHud.classList.add('is-flashing');
  }

  return { pkgId, pkg, addonNames, totalPrice };
};

window.applyQuickTemplate = function (tplKey) {
  const briefInp = document.getElementById('order-brief-notes');
  if (!briefInp) return;

  const templates = {
    ultah:
      'Konsep Kejutan Ulang Tahun:\n- Tema warna: Midnight Blue & Silver\n- Lagu latar: Lagu favorit (putar otomatis saat amplop dibuka)\n- Konten: 6 foto kenangan polaroid, surat ucapan efek ketik, dan animasi interaktif.',
    landing:
      'Konsep Landing Page:\n- Target: Meningkatkan konversi iklan ke WhatsApp\n- Struktur: Headline utama, keunggulan produk, testimoni pelanggan, penawaran harga promo, dan tombol order.',
    ai_bot:
      'Konsep Web 3D & Otomasi AI (Hermes + OpenClaw):\n- Target: Melayani konsultasi pelanggan 24/7 di Web & WhatsApp serta merekap pesanan otomatis ke Database.'
  };

  if (templates[tplKey]) {
    briefInp.value = templates[tplKey];
  }
};

window.handleOrderSubmit = async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById('order-submit-btn');
  const successBox = document.getElementById('order-success-box');

  const clientName = (document.getElementById('order-client-name')?.value || '').trim();
  const clientWhatsapp = (document.getElementById('order-client-wa')?.value || '').trim();
  const clientEmail = (document.getElementById('order-client-email')?.value || '').trim();
  const brandOrTargetName = (document.getElementById('order-brand-target')?.value || '').trim();
  const briefNotes = (document.getElementById('order-brief-notes')?.value || '').trim();

  const calc = window.updateOrderCalculation();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan ke Database...';
  }

  let orderId = 'ORD-ZA-' + Math.floor(1000 + Math.random() * 9000);

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        clientWhatsapp,
        clientEmail,
        brandOrTargetName,
        packageId: calc.pkgId,
        packageName: calc.pkg.name,
        basePrice: calc.pkg.price,
        addons: calc.addonNames,
        totalPrice: calc.totalPrice,
        estimatedDuration: calc.pkg.duration,
        briefNotes,
        sourcePage: '/layanan'
      })
    });
    const data = await res.json();
    if (data && data.orderId) {
      orderId = data.orderId;
    }
  } catch (err) {
    console.warn('Order ID fallback:', err);
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Order';
  }

  if (successBox) {
    successBox.classList.add('is-visible');
    successBox.innerHTML = `
      <strong>PESANAN TERSIMPAN DI DATABASE</strong><br/>
      Nomor Invoice: <strong style="color:#58b8ff; font-family:monospace;">${orderId}</strong> — Mengarahkan ke WhatsApp Z-Automation...
    `;
  }

  const waMessage = [
    `Halo Zaldy (Z-Automation), saya ingin memesan pembuatan website:`,
    ``,
    `• Nomor Order Database: *${orderId}*`,
    `• Nama Pemesan: ${clientName}`,
    `• Nomor WA: ${clientWhatsapp}`,
    `• Paket Katalog: *${calc.pkg.name}*`,
    `• Nama Target / Brand: ${brandOrTargetName}`,
    `• Fitur Tambahan: ${calc.addonNames.length ? calc.addonNames.join(', ') : '-'}`,
    `• Estimasi Durasi: ${calc.pkg.duration}`,
    `• Total Estimasi Biaya: *${formatRupiah(calc.totalPrice)}*`,
    ``,
    `Detail Konsep / Kebutuhan:`,
    briefNotes
  ].join('\n');

  const waUrl = 'https://wa.me/62895360420668?text=' + encodeURIComponent(waMessage);
  window.open(waUrl, '_blank');
};

window.downloadOrderReceiptTxt = function () {
  const clientName = (document.getElementById('order-client-name')?.value || '').trim() || 'Klien Z-Automation';
  const clientWhatsapp = (document.getElementById('order-client-wa')?.value || '').trim() || '-';
  const brandOrTargetName = (document.getElementById('order-brand-target')?.value || '').trim() || '-';
  const briefNotes = (document.getElementById('order-brief-notes')?.value || '').trim() || '-';
  const calc = window.updateOrderCalculation();

  const txt = [
    '========================================================================',
    'Z-AUTOMATION // NOTA SPESIFIKASI & ESTIMASI PEMESANAN WEBSITE',
    'WhatsApp Resmi: +62 895-3604-20668 | Garut, Jawa Barat, Indonesia',
    'Tanggal: ' + new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }),
    '========================================================================',
    '',
    '1. DATA PEMESAN',
    '   • Nama Pemesan : ' + clientName,
    '   • WhatsApp     : ' + clientWhatsapp,
    '   • Nama Web/Brand: ' + brandOrTargetName,
    '',
    '2. RINCIAN PAKET KATALOG',
    '   • Paket Dipilih : ' + calc.pkg.name,
    '   • Harga Dasar   : ' + formatRupiah(calc.pkg.price),
    '   • Add-Ons       : ' + (calc.addonNames.length ? calc.addonNames.join(', ') : 'Tidak ada'),
    '   • Estimasi Jadi : ' + calc.pkg.duration,
    '   • TOTAL BIAYA   : ' + formatRupiah(calc.pkg.totalPrice),
    '',
    '3. CATATAN KONSEP & FITUR:',
    briefNotes,
    '',
    '========================================================================',
    'Terima kasih telah memilih Z-Automation (Zaldy Muhammad Fazri).',
    '========================================================================'
  ].join('\n');

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Nota_Pesanan_Z-Automation_' + clientName.replace(/[^a-zA-Z0-9]/g, '_') + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// 5. SOCIAL MEDIA & WHATSAPP CATALOG SHARING (FULL CATALOG & PER-PACKAGE)
// ============================================================================
function showShareToast(msg) {
  let toast = document.getElementById('aspace-share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aspace-share-toast';
    toast.style.cssText =
      'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(6,16,32,0.96);border:1px solid #38bdf8;color:#fff;padding:10px 20px;border-radius:99px;font-family:monospace;font-size:12px;box-shadow:0 12px 35px rgba(0,0,0,0.85);transition:opacity 0.25s ease;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(window._shareToastTimer);
  window._shareToastTimer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 2600);
}

window.shareFullCatalog = async function (platform, btnEl) {
  const baseUrl = window.location.origin + '/katalog?paket=all';
  const shareTitle = 'Katalog Pembuatan Website & AI Z-Automation (Rp 150rb – Rp 1,5 Jt)';
  const shareText = [
    baseUrl,
    '',
    '✨ *KATALOG PEMBUATAN WEBSITE & AI — Z-AUTOMATION*',
    'Studio Arsitektur Web 3D & Otomasi AI (Sekali Bayar • Terima Beres):',
    '',
    '• *Paket 01 (Rp 150.000):* Web Ucapan Ulang Tahun / Anniversary 3D Interaktif',
    '• *Paket 02 (Rp 250.000):* Web Undangan & Event Digital VIP (Unlimited Tamu)',
    '• *Paket 03 (Rp 350.000):* Web Portfolio, CV Interaktif & Katalog Menu UMKM',
    '• *Paket 04 (Rp 550.000):* High-Conversion Landing Page (Iklan Meta/TikTok Ads)',
    '• *Paket 05 (Rp 950.000):* Website Company Profile & Toko Online WhatsApp',
    '• *Paket 06 (Rp 1.500.000):* Custom Website 3D WebGL & Agen AI Otonom (Hermes & OpenClaw)'
  ].join('\n');

  if (platform === 'wa') {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
    return;
  }
  if (platform === 'tg') {
    window.open(
      'https://t.me/share/url?url=' + encodeURIComponent(baseUrl) + '&text=' + encodeURIComponent(shareTitle),
      '_blank'
    );
    return;
  }
  if (platform === 'x') {
    window.open(
      'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareTitle + ' — ') + '&url=' + encodeURIComponent(baseUrl),
      '_blank'
    );
    return;
  }
  if (platform === 'copy') {
    try {
      await navigator.clipboard.writeText(shareText);
      showShareToast('✓ Link & Preview Foto Katalog berhasil disalin!');
      if (btnEl) {
        const span = btnEl.querySelector('span');
        if (span) {
          const orig = span.textContent;
          span.textContent = 'Tersalin!';
          setTimeout(() => {
            span.textContent = orig;
          }, 2000);
        }
      }
    } catch (e) {
      showShareToast('Link: ' + baseUrl);
    }
  }
};

window.shareCatalogItem = async function (pkgId, mode) {
  const pkg = CATALOG_PACKAGES[pkgId] || CATALOG_PACKAGES.ultah_150k;
  const itemUrl = window.location.origin + '/katalog?paket=' + encodeURIComponent(pkgId);
  const imgUrl = window.location.origin + (pkg.image || '/assets/images/katalog/paket-06-webgl-ai-flagship.jpg');
  const textMsg = [
    itemUrl,
    ``,
    `🚀 *${pkg.name}*`,
    `• Harga Paket: *${formatRupiah(pkg.price)}* (Sekali Bayar)`,
    `• Estimasi Jadi: ${pkg.duration}`,
    `• Studio: Z-Automation (Arsitektur Web 3D & AI)`,
    `• Preview Foto: ${imgUrl}`
  ].join('\n');

  if (mode === 'wa') {
    window.open('https://wa.me/?text=' + encodeURIComponent(textMsg), '_blank');
    return;
  }

  if (navigator.share) {
    try {
      const shareData = {
        title: pkg.name + ' — Z-Automation',
        text: `${pkg.name} (${formatRupiah(pkg.price)} • ${pkg.duration}) — Z-Automation`,
        url: itemUrl
      };
      try {
        const resp = await fetch(pkg.image);
        const blob = await resp.blob();
        const file = new File([blob], `${pkgId}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      } catch (imgErr) {}
      await navigator.share(shareData);
      return;
    } catch (err) {}
  }

  try {
    await navigator.clipboard.writeText(textMsg);
    showShareToast(`✓ Link & Kartu Foto ${pkg.name} berhasil disalin!`);
  } catch (e) {
    showShareToast('Link: ' + itemUrl);
  }
};

function initBentoSpotlightAndTilt() {
  const cards = document.querySelectorAll('[data-bento-tilt]');
  cards.forEach((card) => {
    card.addEventListener(
      'mousemove',
      (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        if (window.innerWidth > 1024) {
          const cx = rect.width * 0.5;
          const cy = rect.height * 0.5;
          const rotY = ((x - cx) / cx) * 2.2;
          const rotX = -((y - cy) / cy) * 2.0;
          card.style.transform = `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
        }
      },
      { passive: true }
    );

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function initLiveBentoMicroInteractions() {
  // 1. Live Countdown Ticker in Paket 02 (VIP Pass)
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  let remainingSec = 14 * 86400 + 8 * 3600 + 42 * 60 + 19;
  if (elSecs) {
    setInterval(() => {
      remainingSec = remainingSec > 0 ? remainingSec - 1 : 14 * 86400;
      const d = Math.floor(remainingSec / 86400);
      const h = Math.floor((remainingSec % 86400) / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      const s = remainingSec % 60;
      if (elDays) elDays.textContent = String(d).padStart(2, '0');
      if (elHours) elHours.textContent = String(h).padStart(2, '0');
      if (elMins) elMins.textContent = String(m).padStart(2, '0');
      if (elSecs) elSecs.textContent = String(s).padStart(2, '0');
    }, 1000);
  }

  // 2. Live Autonomous Agent Ticker in Paket 06 (Flagship Card)
  const tickerEl = document.getElementById('bento-ai-ticker');
  if (tickerEl) {
    const messages = [
      'Hermes merumuskan spesifikasi -> OpenClaw menerbitkan Invoice #ORD-ZA dalam 1.2s...',
      'GLSL Custom Shader + Three.js Scene dikompilasi pada 60 FPS stabil...',
      'OpenClaw mengirim notifikasi WhatsApp otomatis & menyimpan ke Database...',
      'Hermes menganalisis pertanyaan pelanggan 24/7 dengan akurasi konteks penuh...'
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % messages.length;
      tickerEl.textContent = messages[idx];
    }, 3400);
  }
}

function bootAspacePage() {
  initWebGLEarth();
  initBentoSpotlightAndTilt();
  initLiveBentoMicroInteractions();
  window.updateOrderCalculation();

  function ensureFooterAndNoGap() {
    try {
      if (window._pagesManager && window._pagesManager.scrollTargetPage) {
        window._pagesManager.scrollTargetPage.hasExtraPages = true;
      }
      const endSec = document.getElementById('end-section');
      if (endSec) {
        endSec.style.setProperty('display', 'none', 'important');
        endSec.style.setProperty('height', '0px', 'important');
        endSec.style.setProperty('min-height', '0px', 'important');
      }
      const extra = document.getElementById('page-extra-sections');
      if (extra) {
        extra.style.removeProperty('display');
        extra.style.removeProperty('height');
      }
      const sm = window._sm || window._scrollManager;
      if (sm && typeof sm.resize === 'function' && (sm.scrollPixel === 0 || typeof sm.scrollPixel !== 'number')) {
        sm.resize(window.innerWidth, window.innerHeight);
      }
    } catch (e) {}
  }

  ensureFooterAndNoGap();
  setTimeout(ensureFooterAndNoGap, 120);
  setTimeout(ensureFooterAndNoGap, 500);
  setTimeout(ensureFooterAndNoGap, 1500);

  const params = new URLSearchParams(window.location.search);
  const paketParam = params.get('paket');
  if (paketParam) {
    const mapLegacy = {
      web3d: 'custom_1500k',
      aiagent: 'custom_1500k',
      enterprise: 'custom_1500k'
    };
    const resolved = CATALOG_PACKAGES[paketParam] ? paketParam : mapLegacy[paketParam];
    if (resolved) {
      window.chooseCatalogPackage(resolved);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAspacePage);
} else {
  bootAspacePage();
}
