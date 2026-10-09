/**
 * Ambient Glow Parallax Controller
 * Subtle physical depth motion on background glow elements using requestAnimationFrame.
 */

export class ParallaxController {
  constructor(root = document) {
    this.root = root;
    this.heroGlow = this.root.getElementById('heroAmbientGlow');
    this.wayfinderGlow = this.root.getElementById('wayfinderAmbientGlow');
    this.ticking = false;
    this.onScroll = null;
  }

  init() {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (!this.heroGlow && !this.wayfinderGlow) return;

    this.onScroll = () => {
      const scrollY = window.pageYOffset || window.scrollY || 0;
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.update(scrollY);
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  update(scrollY) {
    if (this.heroGlow) {
      this.heroGlow.style.transform = `translate3d(0, ${scrollY * 0.14}px, 0)`;
    }
    if (this.wayfinderGlow) {
      const offset = (scrollY - 900) * 0.08;
      this.wayfinderGlow.style.transform = `translate3d(-50%, ${offset}px, 0)`;
    }
  }

  destroy() {
    if (this.onScroll && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
    }
  }
}

export function initParallax() {
  const controller = new ParallaxController(document);
  controller.init();
  return controller;
}
