/**
 * ScrollManager.js — GSAP ScrollTrigger orchestration
 * Manages scroll-driven animations, section transitions, and 3D scene state changes
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fadeUpElements, animateCounter } from './TextReveal.js';

gsap.registerPlugin(ScrollTrigger);

export class ScrollManager {
  /**
   * @param {import('../three/NeuralScene.js').NeuralScene} neuralScene
   */
  constructor(neuralScene) {
    this.scene = neuralScene;
    this.ctx = null;
    this.sections = ['hero', 'vision', 'products', 'capabilities', 'cta'];
    this.activeDots = document.querySelectorAll('.side-nav__dot');
    this.nav = document.getElementById('main-nav');
    this.countersAnimated = false;
  }

  /** Initialize all scroll-driven animations */
  init() {
    this.ctx = gsap.context(() => {
      this.setupNavScroll();
      this.setupFadeUps();
      this.setupSectionTriggers();
      this.setupSideDots();
      this.setupCounters();
    });
  }

  /** Nav background on scroll */
  setupNavScroll() {
    ScrollTrigger.create({
      start: 'top -80',
      end: 99999,
      onUpdate: (self) => {
        if (self.direction === 1 || self.scroll() > 80) {
          this.nav.classList.add('is-scrolled');
        }
        if (self.scroll() < 80) {
          this.nav.classList.remove('is-scrolled');
        }
      },
    });
  }

  /** Fade-up animations for all .fade-up elements */
  setupFadeUps() {
    const fadeEls = document.querySelectorAll('.fade-up');
    fadeEls.forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }

  /** Section-based 3D scene state transitions */
  setupSectionTriggers() {
    const stateMap = {
      hero: 'idle',
      vision: 'pulse',
      products: 'cluster',
      capabilities: 'orbit',
      cta: 'converge',
    };

    this.sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          if (this.scene && stateMap[id]) {
            this.scene.setState(stateMap[id]);
          }
          this.updateActiveDot(id);
        },
        onEnterBack: () => {
          if (this.scene && stateMap[id]) {
            this.scene.setState(stateMap[id]);
          }
          this.updateActiveDot(id);
        },
      });
    });
  }

  /** Side dot navigation active state */
  setupSideDots() {
    this.activeDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const target = dot.dataset.section;
        const el = document.getElementById(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /** Update which dot is active */
  updateActiveDot(sectionId) {
    this.activeDots.forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.section === sectionId);
    });
  }

  /** Animate stat counters when vision section enters */
  setupCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    ScrollTrigger.create({
      trigger: '#vision',
      start: 'top 60%',
      once: true,
      onEnter: () => {
        if (this.countersAnimated) return;
        this.countersAnimated = true;
        counters.forEach((el) => animateCounter(el, 2));
      },
    });
  }

  /** Refresh ScrollTrigger (call after layout changes) */
  refresh() {
    ScrollTrigger.refresh();
  }

  /** Cleanup */
  destroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
