/**
 * Apple Design Scroll Reveal Animation Controller
 * Bi-directional, interruptible viewport revelations in both scroll directions
 * with symmetrical hysteresis reset and full prefers-reduced-motion support.
 * (Apple Design Skill Sections 3, 4, 7, 10, 14)
 */

export class ScrollRevealController {
  constructor(root = document, options = {}) {
    this.root = root;
    this.options = options;
    this.elements = this.root.querySelectorAll('[data-reveal]');
    this.observer = null;
    this.scrollDirection = 'down'; // 'down' | 'up'
    this.lastScrollY = 0;
    this.ticking = false;
    this.hysteresisBuffer = options.hysteresisBuffer !== undefined ? options.hysteresisBuffer : 0;
    this.rootMargin = options.rootMargin || '0px 0px -20px 0px';
    this.threshold = options.threshold !== undefined ? options.threshold : 0.05;
    this.motionQuery = null;
    this.onMotionChange = null;
    this.onScroll = null;
  }

  init() {
    // Auto-stagger child elements inside [data-reveal-group] if not explicitly set
    const groups = this.root.querySelectorAll('[data-reveal-group]');
    groups.forEach((group) => {
      const items = group.querySelectorAll('[data-reveal]');
      items.forEach((item, index) => {
        if (!item.hasAttribute('data-reveal-delay') && !item.style.getPropertyValue('--reveal-index')) {
          item.style.setProperty('--reveal-index', index.toString());
        }
      });
    });

    this.elements = this.root.querySelectorAll('[data-reveal]');
    if (!this.elements.length) return;

    if (typeof window !== 'undefined') {
      this.lastScrollY = window.scrollY || 0;
    }

    // Respect user's motion preferences (Apple Design Skill Section 14)
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.onMotionChange = (e) => {
        if (e.matches) {
          this.applyReducedMotion();
        } else {
          this.setupObserver();
        }
      };

      if (this.motionQuery.addEventListener) {
        this.motionQuery.addEventListener('change', this.onMotionChange);
      } else if (this.motionQuery.addListener) {
        this.motionQuery.addListener(this.onMotionChange);
      }

      if (this.motionQuery.matches) {
        this.applyReducedMotion();
        return;
      }
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.applyReducedMotion();
      return;
    }

    this.initScrollTracker();
    this.setupObserver();
  }

  applyReducedMotion() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.elements.forEach((el) => {
      el.classList.add('is-revealed');
      el.classList.remove('reveal-direction-up');
    });
  }

  initScrollTracker() {
    if (typeof window === 'undefined') return;

    this.onScroll = () => {
      const currentScrollY = window.pageYOffset || window.scrollY || 0;
      const delta = currentScrollY - this.lastScrollY;
      if (Math.abs(delta) >= 2) {
        this.scrollDirection = delta > 0 ? 'down' : 'up';
      }
      this.lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Direction-aware entrance trajectory (Apple Design Rule 7)
            if (this.scrollDirection === 'up') {
              entry.target.classList.add('reveal-direction-up');
            } else {
              entry.target.classList.remove('reveal-direction-up');
            }
            entry.target.classList.add('is-revealed');
          } else {
            // Symmetrical hysteresis reset: only reset when safely outside viewport bounds
            const rect = entry.boundingClientRect;
            const isFarBelow = rect.top >= vh + this.hysteresisBuffer;
            const isFarAbove = rect.bottom <= -this.hysteresisBuffer;

            if (isFarBelow) {
              // Scrolled past upwards: element is now below viewport
              entry.target.classList.remove('is-revealed');
              entry.target.classList.remove('reveal-direction-up');
            } else if (isFarAbove) {
              // Scrolled past downwards: element is now above viewport
              entry.target.classList.remove('is-revealed');
              entry.target.classList.add('reveal-direction-up');
            }
          }
        });
      },
      {
        root: null,
        rootMargin: this.rootMargin,
        threshold: this.threshold
      }
    );

    this.elements.forEach((el) => this.observer.observe(el));
  }

  refresh() {
    this.elements = this.root.querySelectorAll('[data-reveal]');
    if (this.observer) {
      this.elements.forEach((el) => this.observer.observe(el));
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.onScroll && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
      this.onScroll = null;
    }
    if (this.motionQuery && this.onMotionChange) {
      if (this.motionQuery.removeEventListener) {
        this.motionQuery.removeEventListener('change', this.onMotionChange);
      } else if (this.motionQuery.removeListener) {
        this.motionQuery.removeListener(this.onMotionChange);
      }
      this.motionQuery = null;
      this.onMotionChange = null;
    }
  }
}

export function initScrollReveal(options) {
  const controller = new ScrollRevealController(document, options);
  controller.init();
  return controller;
}
