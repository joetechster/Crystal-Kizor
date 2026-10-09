/**
 * Navigation Component Controller
 * Manages scroll spy, Apple spring smooth anchor scrolling with header offset, and back-to-top button.
 */

export class NavigationController {
  constructor(root = document, smoothScroll = null) {
    this.root = root;
    this.smoothScroll = smoothScroll;
    this.sections = this.root.querySelectorAll('section[id], header[id]');
    this.navLinks = this.root.querySelectorAll('.nav-link');
    this.backToTopBtn = this.root.getElementById('btnBackToTop');
    this.headerOffset = 76;
    this.onScroll = null;
    this.scrollSpyObserver = null;
    this.currentActiveHash = null;
  }

  init() {
    this.initSmoothAnchors();
    this.initScrollSpy();
    this.initBackToTop();
  }

  initSmoothAnchors() {
    this.root.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#' || targetId.startsWith('#!')) return;
        const targetEl = this.root.querySelector(targetId);
        if (targetEl && typeof window !== 'undefined') {
          e.preventDefault();
          const elementPosition = targetEl.getBoundingClientRect().top;
          const currentY = window.pageYOffset || window.scrollY || 0;
          const offsetPosition = Math.max(0, elementPosition + currentY - this.headerOffset);

          if (this.smoothScroll && typeof this.smoothScroll.scrollToPosition === 'function') {
            this.smoothScroll.scrollToPosition(offsetPosition);
          } else {
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }

          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      });
    });
  }

  initScrollSpy() {
    if (typeof window === 'undefined') return;

    if ('IntersectionObserver' in window) {
      // Modern IntersectionObserver scroll spy: zero forced reflows & zero layout thrashing
      const visibleRatios = new Map();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visibleRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
          });

          // Determine the most prominently visible section
          let activeSection = null;
          let highestRatio = 0;

          this.sections.forEach((sec) => {
            const ratio = visibleRatios.get(sec) || 0;
            if (ratio > highestRatio) {
              highestRatio = ratio;
              activeSection = sec;
            }
          });

          // Fallback to first intersecting section in DOM order
          if (!activeSection) {
            for (let i = 0; i < this.sections.length; i++) {
              const sec = this.sections[i];
              if (visibleRatios.get(sec) > 0) {
                activeSection = sec;
                break;
              }
            }
          }

          if (activeSection) {
            const id = activeSection.getAttribute('id');
            if (id) {
              this.updateActiveLink(`#${id}`);
            }
          }
        },
        {
          rootMargin: '-10% 0px -40% 0px',
          threshold: [0, 0.2, 0.5, 0.8]
        }
      );

      this.sections.forEach((sec) => observer.observe(sec));
      this.scrollSpyObserver = observer;
      return;
    }

    // Passive scroll fallback (batched read phase before write phase to avoid forced reflows)
    let ticking = false;
    this.onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = (window.scrollY || 0) + 180;
          let targetId = null;

          // Pure Read Phase
          for (let i = 0; i < this.sections.length; i++) {
            const sec = this.sections[i];
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              targetId = sec.getAttribute('id');
              break;
            }
          }

          // Pure Write Phase (only if changed)
          if (targetId) {
            this.updateActiveLink(`#${targetId}`);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  updateActiveLink(targetHash) {
    if (this.currentActiveHash === targetHash) return;
    this.currentActiveHash = targetHash;
    this.navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === targetHash;
      link.classList.toggle('active', isActive);
    });
  }

  initBackToTop() {
    if (this.backToTopBtn && typeof window !== 'undefined') {
      this.backToTopBtn.addEventListener('click', () => {
        if (this.smoothScroll && typeof this.smoothScroll.scrollToPosition === 'function') {
          this.smoothScroll.scrollToPosition(0);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  destroy() {
    if (this.scrollSpyObserver) {
      this.scrollSpyObserver.disconnect();
      this.scrollSpyObserver = null;
    }
    if (this.onScroll && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
      this.onScroll = null;
    }
  }
}

export function initNavigation(smoothScroll = null) {
  const controller = new NavigationController(document, smoothScroll);
  controller.init();
  return controller;
}
