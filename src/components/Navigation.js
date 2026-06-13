/**
 * Navigation.js — Fixed nav bar with theme toggle
 * Handles dark/light theme switching with localStorage persistence
 */

export class Navigation {
  /**
   * @param {Function} onThemeChange — Callback(isDark) when theme changes
   */
  constructor(onThemeChange) {
    this.onThemeChange = onThemeChange;
    this.toggleBtn = document.getElementById('theme-toggle');
    this.isDark = true;
    this.init();
  }

  init() {
    // Restore saved theme preference
    const saved = localStorage.getItem('intutive-theme');
    if (saved === 'light') {
      this.isDark = false;
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      this.isDark = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Notify initial state
    if (this.onThemeChange) {
      this.onThemeChange(this.isDark);
    }

    // Toggle button click
    this.toggleBtn.addEventListener('click', () => {
      this.isDark = !this.isDark;
      const theme = this.isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('intutive-theme', theme);

      // Animate toggle button
      this.toggleBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.toggleBtn.style.transform = 'scale(1)';
      }, 150);

      if (this.onThemeChange) {
        this.onThemeChange(this.isDark);
      }
    });

    // Smooth scroll for nav CTA link
    const ctaLink = document.querySelector('.nav__cta');
    if (ctaLink) {
      ctaLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('cta');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
}
