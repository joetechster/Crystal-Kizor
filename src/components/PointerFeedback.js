/**
 * WWDC 2018 Fluid Interface Rule #1: Response (Zero-Latency Feedback)
 * Instant pointer-down active states on all interactive elements.
 */

export function initPointerFeedback(root = document) {
  const interactiveSelectors = '.btn, .wayfinder-tab, .intent-pill, .bento-card, .project-card, .gallery-arrow-btn, .thumb-btn';
  const elements = root.querySelectorAll(interactiveSelectors);

  elements.forEach((el) => {
    el.addEventListener('pointerdown', () => {
      el.style.transform = 'scale(0.975)';
    });
    const reset = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointerup', reset);
    el.addEventListener('pointercancel', reset);
    el.addEventListener('pointerleave', reset);
  });
}
