/**
 * hermes-hero-init.js
 * Mounts AIAgentHeroScene (3D Hermes × OpenClaw Duet + 3-Act AI Agent Storyboard)
 * into #home-hero-visual-container on the Home page.
 */

import { AIAgentHeroScene } from '/assets/ai-agent-hero-scene.js?v=20261107';

const POLL_INTERVAL_MS = 60;
const MAX_WAIT_MS = 25000;

let _elapsed = 0;
let _app = null;

function mountAIAgentHero() {
  const visualContainer = document.getElementById('home-hero-visual-container');
  if (!visualContainer) return false;

  // Guard: already mounted inside current visualContainer
  if (visualContainer.querySelector('#ai-agent-hero-viewport')) return true;

  // Clean up previous instance if container was re-created
  if (_app && typeof _app.dispose === 'function') {
    _app.dispose();
    _app = null;
  }

  // Ensure container styles support rounded 3D viewport clipping like Lusion's frame
  const computed = window.getComputedStyle(visualContainer);
  if (computed.position === 'static') {
    visualContainer.style.position = 'relative';
  }
  visualContainer.style.overflow = 'hidden';
  if (!computed.borderRadius || computed.borderRadius === '0px') {
    visualContainer.style.borderRadius = 'var(--global-border-radius, 20px)';
  }
  visualContainer.style.cursor = 'pointer';

  const viewport = document.createElement('div');
  viewport.id = 'ai-agent-hero-viewport';
  viewport.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;border-radius:inherit;z-index:2;pointer-events:auto;';

  const canvas = document.createElement('canvas');
  canvas.id = 'ai-agent-hero-canvas';
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;border-radius:inherit;';

  viewport.appendChild(canvas);
  visualContainer.appendChild(viewport);

  _app = new AIAgentHeroScene({
    container: viewport,
    canvas: canvas,
  });

  window.__aiAgentHero = _app;
  window.__hermesHero = _app;
  return true;
}

function poll() {
  if (mountAIAgentHero()) {
    return;
  }

  _elapsed += POLL_INTERVAL_MS;
  if (_elapsed < MAX_WAIT_MS) {
    setTimeout(poll, POLL_INTERVAL_MS);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', poll);
} else {
  poll();
}
