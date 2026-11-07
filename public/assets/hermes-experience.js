import * as THREE from '/assets/vendor/three/three.module.js';
import { GLTFLoader } from '/assets/vendor/three/GLTFLoader.js';

/**
 * Hermes 3D Scene Controller — Z-Automation AI Agent Exploration Lab
 * Coordinates Virtual Office environment and Hermes Agent character.
 * Supports dual beginner-friendly narratives:
 * - 'eksplorasi' (Mengenal Otak HERMES)
 * - 'edukasi'    (Simulasi Tangan OPENCLAW)
 */
export class HermesExperience {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('hermes-viewport');
    this.canvas = options.canvas || document.getElementById('hermes-3d-canvas');
    this.onChapterChange = options.onChapterChange || (() => {});

    this.currentMode = options.defaultMode || 'eksplorasi';
    this.currentChapter = 0;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mixer = null;
    this.clock = new THREE.Clock();

    this.officeModel = null;
    this.hermesModel = null;
    this.animations = {};
    this.currentAction = null;

    this.camTargetPos = new THREE.Vector3();
    this.camTargetLook = new THREE.Vector3();
    this.currentCamLook = new THREE.Vector3();
    this.hermesTargetPos = new THREE.Vector3();
    this.hermesTargetRot = new THREE.Euler();

    this.mouseOffset = new THREE.Vector2(0, 0);
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animFrameId = null;
    this.isDisposed = false;

    this.chapters = {
      eksplorasi: [
        {
          index: '01',
          name: 'PERKENALAN // SIAPA ITU HERMES?',
          hermesAnim: 'fluttua',
          camPos: [0.0, 2.5, 4.5],
          camLook: [-0.6, 1.2, 0.4],
          hermesPos: [-0.6, 1.25, 0.6],
          hermesRotY: 0.2,
          speaker: '[[ 01 // HERMES — SANG OTAK PERENCANA ]]',
          text: 'Halo! Saya Hermes. Berbeda dengan chatbot biasa yang hanya bisa membalas teks, saya adalah "Otak Manajer" AI Agent yang mampu menyusun rencana kerja dan mengingat aturan bisnis Anda.'
        },
        {
          index: '02',
          name: 'PENALARAN // MEMECAH MASALAH',
          hermesAnim: 'salto',
          camPos: [-1.3, 1.45, 1.7],
          camLook: [-1.4, 1.25, 0.6],
          hermesPos: [-1.4, 1.25, 0.6],
          hermesRotY: -0.1,
          speaker: '[[ 02 // CARA HERMES BERPIKIR ]]',
          text: 'Saat Anda memberi 1 perintah besar—misalnya "Rekap penjualan hari ini"—saya otomatis memecahnya menjadi langkah kecil yang berurutan: ambil data, hitung total, lalu susun laporan.'
        },
        {
          index: '03',
          name: 'MEMORI // MENGINGAT KONTEKS',
          hermesAnim: 'fluttua',
          camPos: [1.2, 2.2, 2.8],
          camLook: [-0.3, 1.1, 0.2],
          hermesPos: [-0.2, 1.25, 0.2],
          hermesRotY: 0.8,
          speaker: '[[ 03 // INGATAN JANGKA PANJANG ]]',
          text: 'Di ruang kerja ini, saya terhubung dengan dokumen SOP, daftar harga, dan riwayat percakapan Anda. Anda tidak perlu mengulang-ulang instruksi setiap hari.'
        },
        {
          index: '04',
          name: 'EKSEKUSI // MEMANGGIL ALAT KERJA',
          hermesAnim: 'lavora',
          camPos: [-0.85, 1.4, 1.0],
          camLook: [-1.4, 1.05, 0.14],
          hermesPos: [-1.4, 1.05, 0.14],
          hermesRotY: -1.57,
          speaker: '[[ 04 // KOMANDO FUNCTION CALLING ]]',
          text: 'Setelah rencana matang, saya tidak diam saja. Saya memanggil "Tangan Digital" bernama OpenClaw di meja komputer ini untuk langsung mengerjakan tugas tersebut.'
        },
        {
          index: '05',
          name: 'KOLABORASI // ASISTEN 24 JAM',
          hermesAnim: 'fluttua',
          camPos: [-0.2, 3.2, 5.0],
          camLook: [-0.6, 1.1, 0.4],
          hermesPos: [-0.8, 1.4, 1.2],
          hermesRotY: 0.0,
          speaker: '[[ 05 // KENDALI DI TANGAN ANDA ]]',
          text: 'Saya bekerja 24 jam tanpa lelah, namun Anda tetap bosnya. Untuk keputusan penting, saya akan selalu mengirim pesan konfirmasi ke WhatsApp Anda terlebih dahulu.'
        }
      ],
      edukasi: [
        {
          index: '01',
          name: 'OPENCLAW // TANGAN DIGITAL AI',
          hermesAnim: 'fluttua',
          camPos: [0.0, 2.5, 4.5],
          camLook: [-0.6, 1.2, 0.4],
          hermesPos: [-0.6, 1.25, 0.6],
          hermesRotY: 0.15,
          speaker: '[[ 01 // APA ITU OPENCLAW? ]]',
          text: 'Jika Hermes adalah otaknya, maka OpenClaw adalah "Sepasang Tangan Digitalnya". OpenClaw memungkinkan AI menggerakkan browser, mengetik, dan mengklik aplikasi layaknya manusia.'
        },
        {
          index: '02',
          name: 'JEMBATAN CHAT // WHATSAPP & TELEGRAM',
          hermesAnim: 'salto',
          camPos: [-1.2, 1.45, 1.8],
          camLook: [-1.4, 1.2, 0.7],
          hermesPos: [-1.4, 1.2, 0.7],
          hermesRotY: -0.2,
          speaker: '[[ 02 // PERINTAH LEWAT CHAT HARIAN ]]',
          text: 'Dengan OpenClaw, Anda tidak perlu membuka aplikasi rumit. Cukup kirim chat biasa lewat WhatsApp atau Telegram, dan perintah Anda langsung diterima oleh Hermes.'
        },
        {
          index: '03',
          name: 'NAVIGASI WEB // BACA & KLIK OTOMATIS',
          hermesAnim: 'fluttua',
          camPos: [1.0, 2.0, 2.6],
          camLook: [-0.5, 1.15, 0.2],
          hermesPos: [-0.5, 1.15, 0.2],
          hermesRotY: 0.9,
          speaker: '[[ 03 // MENGOPERASIKAN BROWSER ]]',
          text: 'OpenClaw dapat membuka situs web, memeriksa harga pasar, mengunduh file tagihan PDF, hingga mengisi formulir administrasi secara mandiri tanpa salah ketik.'
        },
        {
          index: '04',
          name: 'OLAH FILE // EXCEL, PDF & DATABASE',
          hermesAnim: 'lavora',
          camPos: [-0.9, 1.35, 0.95],
          camLook: [-1.4, 1.05, 0.14],
          hermesPos: [-1.4, 1.05, 0.14],
          hermesRotY: -1.57,
          speaker: '[[ 04 // MENYELESAIKAN TUGAS MEJA ]]',
          text: 'Lihat bagaimana Hermes + OpenClaw bekerja di meja ini: membaca ratusan baris tabel, menyusun ringkasan rapi, dan menyimpannya langsung ke folder kerja Anda.'
        },
        {
          index: '05',
          name: 'LAPORAN TUNTAS // SIAP PAKAI',
          hermesAnim: 'dorme',
          camPos: [-0.2, 3.0, 4.8],
          camLook: [-0.6, 1.1, 0.4],
          hermesPos: [-0.8, 1.35, 1.0],
          hermesRotY: 0.1,
          speaker: '[[ 05 // TUGAS SELESAI & SIAGA ]]',
          text: 'Begitu pekerjaan tuntas dan laporan terkirim ke ponsel Anda, agen kembali ke mode siaga hemat daya—siap menunggu instruksi Anda berikutnya kapan saja.'
        }
      ]
    };
  }

  async init() {
    if (!this.canvas || !this.container) return;

    const width = this.container.clientWidth || 960;
    const height = this.container.clientHeight || 640;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f1fa);
    this.scene.fog = new THREE.FogExp2(0xf0f1fa, 0.014);

    const fov = width < 768 ? 55 : 44;
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(5, 8, 5);
    this.scene.add(keyLight);

    const blueRim = new THREE.DirectionalLight(0x1a2ffb, 1.6);
    blueRim.position.set(-6, 4, -4);
    this.scene.add(blueRim);

    const fillLight = new THREE.DirectionalLight(0xf0f1fa, 1.0);
    fillLight.position.set(0, -3, 5);
    this.scene.add(fillLight);

    const deskAccent = new THREE.PointLight(0x1a2ffb, 2.2, 10);
    deskAccent.position.set(-1.4, 1.5, 0.5);
    this.scene.add(deskAccent);

    await this.loadModels();
    this.setChapter(0, true);

    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.container.addEventListener('pointermove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      this.mouseOffset.set(nx * 0.18, -ny * 0.12);
    });

    this.animate();
  }

  async loadModels() {
    const loader = new GLTFLoader();

    try {
      const officeGltf = await loader.loadAsync('/assets/3d/virtual-office/model.glb');
      this.officeModel = officeGltf.scene;
      this.officeModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.roughness = Math.min(Math.max(child.material.roughness || 0.5, 0.2), 0.8);
          if (child.material.map) {
            child.material.map.colorSpace = THREE.SRGBColorSpace;
          }
        }
      });
      this.scene.add(this.officeModel);
    } catch (e) {
      console.error('Failed to load virtual office GLB:', e);
    }

    try {
      const robotGltf = await loader.loadAsync('/assets/3d/hermes/agente-robot-non-compresso.glb');
      this.hermesModel = robotGltf.scene;
      this.hermesModel.scale.set(0.42, 0.42, 0.42);

      if (robotGltf.animations && robotGltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.hermesModel);
        robotGltf.animations.forEach((clip) => {
          this.animations[clip.name] = this.mixer.clipAction(clip);
        });
      }

      this.scene.add(this.hermesModel);
    } catch (e) {
      console.error('Failed to load Hermes robot GLB:', e);
    }
  }

  setMode(mode) {
    if (mode !== 'eksplorasi' && mode !== 'edukasi') return;
    this.currentMode = mode;
    this.setChapter(0, false);
  }

  playAnimation(name, crossFadeDuration = 0.45) {
    if (!this.mixer) return;
    const aliasMap = {
      idle: 'fluttua',
      work: 'lavora',
      walk: 'salto',
      wave: 'dorme'
    };
    const resolved = this.animations[name] ? name : (aliasMap[name] || 'fluttua');
    const nextAction = this.animations[resolved];
    if (!nextAction || this.currentAction === nextAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(crossFadeDuration);
    }
    nextAction.reset().fadeIn(crossFadeDuration).play();
    this.currentAction = nextAction;
  }

  setChapter(index, immediate = false) {
    const chapterList = this.chapters[this.currentMode];
    if (!chapterList || index < 0 || index >= chapterList.length) return;

    this.currentChapter = index;
    const cfg = chapterList[index];

    this.camTargetPos.set(cfg.camPos[0], cfg.camPos[1], cfg.camPos[2]);
    this.camTargetLook.set(cfg.camLook[0], cfg.camLook[1], cfg.camLook[2]);

    this.hermesTargetPos.set(cfg.hermesPos[0], cfg.hermesPos[1], cfg.hermesPos[2]);
    this.hermesTargetRot.set(0, cfg.hermesRotY, 0);

    if (immediate || this.isReducedMotion) {
      this.camera.position.copy(this.camTargetPos);
      this.currentCamLook.copy(this.camTargetLook);
      this.camera.lookAt(this.currentCamLook);
      if (this.hermesModel) {
        this.hermesModel.position.copy(this.hermesTargetPos);
        this.hermesModel.rotation.copy(this.hermesTargetRot);
      }
    }

    if (cfg.hermesAnim) {
      this.playAnimation(cfg.hermesAnim);
    }

    this.onChapterChange(cfg, index, chapterList.length);
  }

  onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.fov = width < 768 ? 55 : 44;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (!this.isReducedMotion) {
      const lerpFactor = 0.045;
      const desiredCamPos = this.camTargetPos.clone();
      desiredCamPos.x += this.mouseOffset.x;
      desiredCamPos.y += this.mouseOffset.y;

      this.camera.position.lerp(desiredCamPos, lerpFactor);
      this.currentCamLook.lerp(this.camTargetLook, lerpFactor);

      if (this.hermesModel) {
        const floatOffset = Math.sin(elapsedTime * 1.8) * 0.035;
        const targetWithFloat = this.hermesTargetPos.clone();
        targetWithFloat.y += floatOffset;

        this.hermesModel.position.lerp(targetWithFloat, lerpFactor);
        this.hermesModel.rotation.y += (this.hermesTargetRot.y - this.hermesModel.rotation.y) * lerpFactor;
      }
    }

    this.camera.lookAt(this.currentCamLook);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isDisposed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.handleResize) window.removeEventListener('resize', this.handleResize);
    if (this.renderer) this.renderer.dispose();
  }
}

// Auto-mount & bind UI controls when DOM is ready
function mountHermesLab() {
  const canvas = document.getElementById('hermes-3d-canvas');
  const container = document.getElementById('hermes-viewport');
  if (!canvas || !container || window.__hermesMounted) return;
  window.__hermesMounted = true;

  const idxEl = document.getElementById('hermes-chapter-idx');
  const titleEl = document.getElementById('hermes-chapter-title');
  const speakerEl = document.getElementById('hermes-dialogue-speaker');
  const textEl = document.getElementById('hermes-dialogue-text');
  const stepDots = Array.from(document.querySelectorAll('.hermes-step-dot'));
  const modeBtns = Array.from(document.querySelectorAll('.hermes-mode-btn'));
  const animBtns = Array.from(document.querySelectorAll('.hermes-anim-btn'));
  const prevBtn = document.getElementById('hermes-prev-btn');
  const nextBtn = document.getElementById('hermes-next-btn');

  const app = new HermesExperience({
    container,
    canvas,
    defaultMode: 'eksplorasi',
    onChapterChange: (cfg, index, total) => {
      if (idxEl) idxEl.textContent = `BAB ${cfg.index} / 0${total}`;
      if (titleEl) titleEl.textContent = cfg.name;
      if (speakerEl) speakerEl.textContent = cfg.speaker;
      if (textEl) textEl.textContent = cfg.text;

      stepDots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
      });

      animBtns.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.anim === cfg.hermesAnim);
      });
    }
  });

  app.init();
  window.hermesApp = app;

  stepDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      app.setChapter(i, false);
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const list = app.chapters[app.currentMode];
      const nextIdx = (app.currentChapter - 1 + list.length) % list.length;
      app.setChapter(nextIdx, false);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const list = app.chapters[app.currentMode];
      const nextIdx = (app.currentChapter + 1) % list.length;
      app.setChapter(nextIdx, false);
    });
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      modeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      app.setMode(mode);
    });
  });

  animBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const anim = btn.dataset.anim;
      animBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      app.playAnimation(anim);
    });
  });
}

window.mountHermesLab = mountHermesLab;

if (!window.toggleCurriculumItem) {
  window.toggleCurriculumItem = function(btn) {
    const item = btn.closest('.lusion-ledger-item');
    if (!item) return;
    const wasOpen = item.classList.contains('is-open');
    document.querySelectorAll('.lusion-ledger-item').forEach((el) => {
      el.classList.remove('is-open');
    });
    if (!wasOpen) {
      item.classList.add('is-open');
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountHermesLab);
} else {
  mountHermesLab();
}
