/**
 * Loader.js — Loading screen orchestration
 * Animated wordmark reveal, progress bar, and transition to main content
 */
import { gsap } from 'gsap';

export class Loader {
  constructor() {
    this.el = document.getElementById('loader');
    this.logo = this.el.querySelector('.loader__logo');
    this.barFill = this.el.querySelector('.loader__bar-fill');
    this.percent = this.el.querySelector('.loader__percent');
    this.progress = this.el.querySelector('.loader__progress');
    this.tagline = this.el.querySelector('.loader__tagline');
    this.letters = this.el.querySelectorAll('.wm-letter');
    this.currentProgress = 0;
    this.isComplete = false;
  }

  /**
   * Runs the full loading animation sequence
   * @param {Function} onComplete — Callback when loading is done
   */
  start(onComplete) {
    document.body.classList.add('is-loading');

    const tl = gsap.timeline({
      onComplete: () => {
        this.hide(onComplete);
      },
    });

    // Phase 1: Fade in logo
    tl.to(this.logo, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
    });

    // Phase 2: Animate letters in stagger
    tl.fromTo(
      this.letters,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'power2.out',
      },
      '-=0.3'
    );

    // Phase 3: Show progress bar
    tl.to(this.progress, {
      opacity: 1,
      duration: 0.3,
    });

    // Phase 4: Animate progress to 100%
    tl.to(this, {
      currentProgress: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        const val = Math.round(this.currentProgress);
        this.barFill.style.width = `${val}%`;
        this.percent.textContent = `${val}%`;
      },
    });

    // Phase 5: Show tagline
    tl.to(this.tagline, {
      opacity: 1,
      duration: 0.3,
    }, '-=0.5');

    // Phase 6: Brief hold
    tl.to({}, { duration: 0.4 });
  }

  /**
   * Hides the loader with a smooth transition
   * @param {Function} onComplete
   */
  hide(onComplete) {
    this.isComplete = true;

    gsap.to(this.el, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        this.el.classList.add('is-hidden');
        document.body.classList.remove('is-loading');
        if (onComplete) onComplete();
      },
    });
  }
}
