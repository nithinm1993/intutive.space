/**
 * TextReveal.js — Text animation utilities
 * Splits text into spans for character/word-level GSAP animation
 */
import { gsap } from 'gsap';

/**
 * Splits a text element's content into individual word spans
 * @param {HTMLElement} el — The element whose text to split
 * @returns {HTMLElement[]} Array of word span elements
 */
export function splitWords(el) {
  const text = el.textContent;
  const words = text.split(/\s+/).filter(Boolean);
  el.innerHTML = '';
  const spans = [];
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.style.display = 'inline-block';
    span.style.overflow = 'hidden';
    const inner = document.createElement('span');
    inner.className = 'word__inner';
    inner.style.display = 'inline-block';
    inner.textContent = word;
    span.appendChild(inner);
    el.appendChild(span);
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
    spans.push(inner);
  });
  return spans;
}

/**
 * Animates elements with the .fade-up class into view
 * @param {HTMLElement[]} elements — Elements to animate
 * @param {object} [scrollTriggerConfig] — Optional ScrollTrigger config
 * @returns {gsap.core.Tween}
 */
export function fadeUpElements(elements, scrollTriggerConfig = null) {
  const config = {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
  };

  if (scrollTriggerConfig) {
    config.scrollTrigger = scrollTriggerConfig;
  }

  return gsap.to(elements, config);
}

/**
 * Animates a number counting up from 0 to a target value
 * @param {HTMLElement} el — Element with data-count attribute
 * @param {number} duration — Animation duration in seconds
 */
export function animateCounter(el, duration = 2) {
  const target = parseInt(el.dataset.count, 10);
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = Math.round(obj.val);
    },
  });
}

/**
 * Typewriter effect for monospace labels
 * @param {HTMLElement} el — The element to animate
 * @param {number} speed — Characters per second
 */
export function typewriter(el, speed = 30) {
  const text = el.textContent;
  el.textContent = '';
  el.style.visibility = 'visible';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 1000 / speed);
}
