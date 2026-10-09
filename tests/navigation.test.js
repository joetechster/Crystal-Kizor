import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationController, initNavigation } from '../src/components/Navigation.js';

describe('NavigationController Component Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav class="nav-glass-bar">
        <a href="#hero" class="nav-link active">Philosophy</a>
        <a href="#showcase" class="nav-link">Built Work</a>
        <a href="#connect" class="nav-link">Connect</a>
      </nav>
      <header id="hero" style="height: 500px;"></header>
      <section id="showcase" style="height: 800px;"></section>
      <section id="connect" style="height: 600px;"></section>
      <button id="btnBackToTop" type="button">Back to top</button>
    `;
  });

  it('updates active link without unnecessary DOM writes if hash matches', () => {
    const controller = new NavigationController(document);
    controller.init();

    const showcaseLink = document.querySelector('a[href="#showcase"]');
    const heroLink = document.querySelector('a[href="#hero"]');

    expect(heroLink.classList.contains('active')).toBe(true);
    expect(showcaseLink.classList.contains('active')).toBe(false);

    controller.updateActiveLink('#showcase');
    expect(heroLink.classList.contains('active')).toBe(false);
    expect(showcaseLink.classList.contains('active')).toBe(true);

    // Calling again should be idempotent without throwing
    controller.updateActiveLink('#showcase');
    expect(showcaseLink.classList.contains('active')).toBe(true);

    controller.destroy();
  });

  it('sets up IntersectionObserver for scroll spy when supported', () => {
    let observedCount = 0;
    class MockIntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }
      observe() {
        observedCount++;
      }
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new NavigationController(document);
    controller.init();

    expect(controller.scrollSpyObserver).toBeDefined();
    expect(observedCount).toBe(3); // hero, showcase, connect

    controller.destroy();
    expect(controller.scrollSpyObserver).toBeNull();
  });

  it('handles back to top click via smoothScroll or window.scrollTo', () => {
    const mockSmoothScroll = {
      scrollToPosition: vi.fn()
    };

    const controller = new NavigationController(document, mockSmoothScroll);
    controller.init();

    const backToTopBtn = document.getElementById('btnBackToTop');
    backToTopBtn.click();

    expect(mockSmoothScroll.scrollToPosition).toHaveBeenCalledWith(0);
    controller.destroy();
  });
});
