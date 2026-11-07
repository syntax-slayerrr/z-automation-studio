/**
 * Z-AUTOMATION // UNIFIED SHELL ENGINE (2026 ARCHITECTURAL EDITION)
 * Harmonizes Navigation Drawer, Preloader Safety Watchdog, and End-of-Scroll Across All Pages
 */

(function () {
  'use strict';

  // 1. Proactive Font Preload to Prevent QuickLoader Font Measurement Freezes
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
    try {
      Promise.allSettled([
        document.fonts.load('400 120px Aeonik'),
        document.fonts.load('500 120px Aeonik'),
        document.fonts.load('italic 400 120px Aeonik'),
        document.fonts.load('400 120px IBMPlexMono'),
        document.fonts.load('500 120px IBMPlexMono'),
        document.fonts.load('400 120px LusionMono')
      ]).catch(function () {});
    } catch (e) {}
  }

  // 2. Preloader Safety Watchdog
  function setupPreloaderWatchdog() {
    var pre = document.getElementById('preloader');
    if (!pre) return;

    function dismissPreloader() {
      document.documentElement.classList.add('is-ready');
      if (!pre) return;
      pre.style.transition = 'opacity 0.5s ease-out';
      pre.style.opacity = '0';
      pre.style.pointerEvents = 'none';
      setTimeout(function () {
        if (pre && pre.parentNode) {
          pre.style.display = 'none';
        }
      }, 550);
    }

    // Dismiss watchdog fires after 2.8s maximum to prevent any stuck state
    var watchdogTimer = setTimeout(function () {
      dismissPreloader();
    }, 2800);

    // Also listen if WebGL / QuickLoader marks ready earlier
    var observer = new MutationObserver(function (mutations) {
      if (document.documentElement.classList.contains('is-ready')) {
        clearTimeout(watchdogTimer);
        setTimeout(dismissPreloader, 400);
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // 3. Harmonized Navigation Menu Drawer
  function setupMenuDrawer() {
    var btn = document.getElementById('header-right-menu-btn');
    var header = document.getElementById('header');
    var menu = document.getElementById('header-menu');
    var bg = document.getElementById('header-background');

    if (!btn || !header || !menu) return;

    function toggleMenu(forceState) {
      var isOpened = typeof forceState === 'boolean' ? !forceState : btn.classList.contains('--opened');
      var nextState = !isOpened;

      btn.classList.toggle('--opened', nextState);
      header.classList.toggle('--menu-opened', nextState);
      menu.classList.toggle('--opened', nextState);

      if (bg) {
        bg.classList.toggle('--opened', nextState);
        bg.style.opacity = nextState ? (window.innerWidth >= 1000 ? '0.2' : '0.95') : '0';
        bg.style.pointerEvents = nextState ? 'auto' : 'none';
      }

      menu.style.pointerEvents = nextState ? 'auto' : 'none';
      menu.style.opacity = nextState ? '1' : '0';
      menu.style.visibility = nextState ? 'visible' : 'hidden';
      header.style.pointerEvents = nextState ? 'auto' : 'none';
      if (header.firstElementChild) {
        header.firstElementChild.style.pointerEvents = 'auto';
      }
    }

    // Direct click handler
    btn.onclick = function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      toggleMenu();
    };

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!btn.classList.contains('--opened')) return;
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Close when clicking any menu link
    var menuLinks = menu.querySelectorAll('.header-menu-link');
    menuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        toggleMenu(false);
      });
    });

    // Harmonize active states based on current URL path
    var path = window.location.pathname.toLowerCase();
    menuLinks.forEach(function (link) {
      var href = (link.getAttribute('href') || '').toLowerCase();
      var isCurrent = false;

      if ((path === '/' || path === '/index.html' || path === '') && (href === '/' || href === '/index.html')) {
        isCurrent = true;
      } else if (path.includes('layanan') && href.includes('layanan')) {
        isCurrent = true;
      } else if ((path.includes('edukasi') || path.includes('eksplorasi')) && href.includes('edukasi')) {
        isCurrent = true;
      } else if (path.includes('project') && href.includes('project')) {
        isCurrent = true;
      } else if (path.includes('about') && href.includes('about')) {
        isCurrent = true;
      }

      link.classList.toggle('--active', isCurrent);
    });
  }

  // 4. End-of-Scroll Next Target Harmonization
  function setupScrollNavTarget() {
    var scrollNav = document.getElementById('scroll-nav-section');
    if (!scrollNav) return;

    var path = window.location.pathname.toLowerCase();
    var nextPath = '/layanan.html';
    var nextText = 'Layanan';

    if (path === '/' || path === '/index.html' || path === '') {
      nextPath = '/layanan.html';
      nextText = 'Layanan';
    } else if (path.includes('layanan')) {
      nextPath = '/edukasi-eksplorasi.html';
      nextText = 'Edukasi & Eksplorasi';
    } else if (path.includes('edukasi') || path.includes('eksplorasi')) {
      nextPath = '/projects.html';
      nextText = 'Karya & Proyek';
    } else if (path.includes('project')) {
      nextPath = '/about.html';
      nextText = 'Tentang Kami';
    } else if (path.includes('about')) {
      nextPath = '/layanan.html';
      nextText = 'Layanan Rekayasa';
    }

    scrollNav.setAttribute('data-path', nextPath);
    var textEl = document.getElementById('scroll-nav-text');
    if (textEl) {
      textEl.innerHTML = nextText;
    }

    // Direct click handler on scroll nav section
    scrollNav.style.cursor = 'pointer';
    scrollNav.addEventListener('click', function () {
      window.location.href = nextPath;
    });
  }

  // Initialize on DOM ready
  function initAll() {
    setupPreloaderWatchdog();
    setupMenuDrawer();
    setupScrollNavTarget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();

