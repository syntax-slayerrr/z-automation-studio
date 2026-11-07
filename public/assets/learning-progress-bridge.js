// public/assets/learning-progress-bridge.js
// Bridge sinkronisasi progres belajar lokal (localStorage) & direktori modul

(function () {
  const STORAGE_KEY = "za_learning_progress_v1";

  function getProgressStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function updateHubProgress() {
    const store = getProgressStore();
    const verifiedSlugs = Object.keys(store).filter(
      (slug) => store[slug].status === "verified"
    );
    const count = verifiedSlugs.length;

    const badgeCountEl = document.getElementById("hub-verified-count");
    if (badgeCountEl) {
      badgeCountEl.textContent = `${count} / 24 MODUL TERVERIFIKASI`;
    }

    const progressFillEl = document.getElementById("hub-progress-fill");
    if (progressFillEl) {
      const pct = Math.round((count / 24) * 100);
      progressFillEl.style.width = `${pct}%`;
    }

    // Perbarui lencana pada kartu modul individu
    document.querySelectorAll(".module-directory-card").forEach((card) => {
      const slug = card.getAttribute("data-slug");
      if (slug && store[slug]) {
        const item = store[slug];
        const statusEl = card.querySelector(".module-card-status");
        if (statusEl) {
          if (item.status === "verified") {
            statusEl.textContent = `✓ TERVERIFIKASI (${item.score || 80}/100)`;
            statusEl.className =
              "module-card-status px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
          } else if (item.status === "completed") {
            statusEl.textContent = "SELESAI DIBACA";
            statusEl.className =
              "module-card-status px-2 py-0.5 rounded text-[11px] font-mono bg-blue-100 text-blue-800 border border-blue-200";
          }
        }
      }
    });
  }

  // Filter modul interaktif di Hub
  window.filterModulesByPillar = function (pillar, btn) {
    document.querySelectorAll(".pillar-filter-btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    const activeLevel = window.__activeLevelFilter || "all";
    applyModuleFilters(pillar, activeLevel);
  };

  window.filterModulesByLevel = function (level, btn) {
    window.__activeLevelFilter = level;
    document.querySelectorAll(".level-filter-btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    const activePillarBtn = document.querySelector(".pillar-filter-btn.is-active");
    const activePillar = activePillarBtn ? activePillarBtn.getAttribute("data-pillar") : "all";
    applyModuleFilters(activePillar, level);
  };

  window.searchModulesLive = function (input) {
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll(".module-directory-card").forEach((card) => {
      const title = (card.getAttribute("data-title") || "").toLowerCase();
      const code = (card.getAttribute("data-code") || "").toLowerCase();
      const text = card.textContent.toLowerCase();
      const match = !query || title.includes(query) || code.includes(query) || text.includes(query);
      card.style.display = match ? "flex" : "none";
    });
  };

  function applyModuleFilters(pillar, level) {
    window.__activePillarFilter = pillar;
    window.__activeLevelFilter = level;

    document.querySelectorAll(".module-directory-card").forEach((card) => {
      const cardPillar = card.getAttribute("data-pillar");
      const cardLevel = card.getAttribute("data-level");

      const matchPillar = pillar === "all" || cardPillar === pillar;
      const matchLevel = level === "all" || cardLevel === level;

      card.style.display = matchPillar && matchLevel ? "flex" : "none";
    });
  }

  window.shareModuleDirect = function (pillar, slug, title) {
    const url = `${window.location.origin}/edukasi/${pillar}/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert(`Tautan modul berhasil disalin:\n${url}\n\nSiap dibagikan ke WhatsApp, LinkedIn, atau X!`);
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(title + ": " + url)}`, "_blank");
    }
  };

  // Switcher Tab Paradigma
  window.switchParadigmTab = function (tabName, btn) {
    document.querySelectorAll(".paradigm-tab-btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    const aiLedger = document.getElementById("paradigm-ledger-ai");
    const webLedger = document.getElementById("paradigm-ledger-web");

    if (aiLedger && webLedger) {
      if (tabName === "ai") {
        aiLedger.style.display = "grid";
        webLedger.style.display = "none";
      } else {
        aiLedger.style.display = "none";
        webLedger.style.display = "grid";
      }
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    updateHubProgress();
  });
})();

