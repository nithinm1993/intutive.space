/**
 * ProductCard.js — Product card interaction enhancements
 * Adds hover glow effects and mouse-tracking gradient on product cards
 */

export function initProductCards() {
  const cards = document.querySelectorAll('.product-card');

  cards.forEach((card) => {
    // Mouse-tracking gradient overlay on hover
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.background = `
        radial-gradient(
          300px circle at var(--mouse-x) var(--mouse-y),
          var(--color-border-hover),
          transparent 40%
        ),
        var(--glass-bg)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
}
