/**
 * main.js — Intutive.space Application Entry Point
 * Initializes Lenis smooth scroll, Three.js scene, GSAP animations,
 * theme management, and all UI components.
 */
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { NeuralScene } from './three/NeuralScene.js';
import { ScrollManager } from './animations/ScrollManager.js';
import { Loader } from './animations/Loader.js';
import { Navigation } from './components/Navigation.js';
import { renderFeatureGrid } from './components/FeatureGrid.js';
import { initProductCards } from './components/ProductCard.js';

gsap.registerPlugin(ScrollTrigger);

// ─── Application State ───────────────────────────────────
let neuralScene = null;
let scrollManager = null;
let lenis = null;

// ─── Initialize Lenis Smooth Scroll ──────────────────────
function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  // Sync Lenis with GSAP ticker
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

// ─── Initialize Three.js 3D Scene ────────────────────────
function initScene() {
  const container = document.getElementById('scene-container');
  if (!container) return;

  try {
    neuralScene = new NeuralScene(container);
    neuralScene.setState('idle');
  } catch (err) {
    console.warn('WebGL not available, 3D scene disabled:', err);
    neuralScene = null;
  }
}

// ─── Mouse Parallax for 3D Scene ─────────────────────────
function initMouseParallax() {
  if (!neuralScene) return;

  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    neuralScene.onMouseMove(nx, ny);
  });
}

// ─── Animation Loop ──────────────────────────────────────
function animate() {
  if (neuralScene) {
    neuralScene.animate();
  }
  requestAnimationFrame(animate);
}

// ─── Handle Resize ───────────────────────────────────────
function onResize() {
  if (neuralScene) {
    neuralScene.resize();
  }
  ScrollTrigger.refresh();
}

// ─── Waitlist Form Handler ───────────────────────────────
function initForm() {
  const form = document.getElementById('cta-submit');
  const input = document.getElementById('cta-email');

  if (form && input) {
    form.addEventListener('click', (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email || !email.includes('@')) {
        input.style.borderColor = '#ef4444';
        setTimeout(() => { input.style.borderColor = ''; }, 2000);
        return;
      }

      // Store email (placeholder — connect to real backend later)
      console.log('Waitlist signup:', email);
      form.querySelector('.mono').textContent = 'JOINED ✓';
      form.style.pointerEvents = 'none';
      input.value = '';
      input.placeholder = 'Thanks! We\'ll be in touch.';

      gsap.fromTo(form, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    });
  }
}

// ─── Boot Sequence ───────────────────────────────────────
function boot() {
  // 1. Render dynamic components
  renderFeatureGrid();

  // 2. Init smooth scroll
  initLenis();

  // 3. Init 3D scene
  initScene();
  initMouseParallax();

  // 4. Init navigation with theme toggle
  const nav = new Navigation((isDark) => {
    if (neuralScene) {
      neuralScene.setTheme(isDark);
    }
  });

  // 5. Start loading animation
  const loader = new Loader();
  loader.start(() => {
    // After loader completes:

    // 6. Init scroll-driven animations
    scrollManager = new ScrollManager(neuralScene);
    scrollManager.init();

    // 7. Init product card effects
    initProductCards();

    // 8. Init form
    initForm();

    // 9. Refresh layout
    ScrollTrigger.refresh();
  });

  // 10. Start render loop
  animate();

  // 11. Handle resize
  window.addEventListener('resize', onResize);
}

// ─── Start ───────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
