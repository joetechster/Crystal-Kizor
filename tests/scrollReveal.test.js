import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScrollRevealController } from '../src/components/ScrollReveal.js';

describe('ScrollRevealController Component Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section data-reveal id="sec1">Section 1</section>
      <section data-reveal id="sec2">Section 2</section>
    `;
  });

  it('immediately reveals all elements when prefers-reduced-motion is active', () => {
    // Mock prefers-reduced-motion: reduce
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    const controller = new ScrollRevealController(document);
    controller.init();

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach((el) => {
      expect(el.classList.contains('is-revealed')).toBe(true);
      expect(el.classList.contains('reveal-direction-up')).toBe(false);
    });
  });

  it('sets up IntersectionObserver when motion is enabled', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    let observedCount = 0;
    class MockIntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }
      observe(el) {
        observedCount++;
      }
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document);
    controller.init();

    expect(observedCount).toBe(2);
  });

  it('reveals element for downward scroll (without reveal-direction-up)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    let observerCallback = null;
    class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document);
    controller.init();
    controller.scrollDirection = 'down';

    const sec1 = document.getElementById('sec1');
    observerCallback([
      {
        target: sec1,
        isIntersecting: true,
        boundingClientRect: { top: 100, bottom: 400 }
      }
    ]);

    expect(sec1.classList.contains('is-revealed')).toBe(true);
    expect(sec1.classList.contains('reveal-direction-up')).toBe(false);
  });

  it('reveals element for upward scroll (with reveal-direction-up)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    let observerCallback = null;
    class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document);
    controller.init();
    controller.scrollDirection = 'up';

    const sec2 = document.getElementById('sec2');
    observerCallback([
      {
        target: sec2,
        isIntersecting: true,
        boundingClientRect: { top: 50, bottom: 250 }
      }
    ]);

    expect(sec2.classList.contains('is-revealed')).toBe(true);
    expect(sec2.classList.contains('reveal-direction-up')).toBe(true);
  });

  it('resets element and primes reveal-direction-up when element scrolls far above viewport', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    let observerCallback = null;
    class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document, { hysteresisBuffer: 60 });
    controller.init();

    const sec1 = document.getElementById('sec1');
    sec1.classList.add('is-revealed');

    // Scrolled far above: bottom is -100px (less than -60px)
    observerCallback([
      {
        target: sec1,
        isIntersecting: false,
        boundingClientRect: { top: -400, bottom: -100 }
      }
    ]);

    expect(sec1.classList.contains('is-revealed')).toBe(false);
    expect(sec1.classList.contains('reveal-direction-up')).toBe(true);
  });

  it('resets element and removes reveal-direction-up when element scrolls far below viewport', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    let observerCallback = null;
    class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document, { hysteresisBuffer: 60 });
    controller.init();

    const sec2 = document.getElementById('sec2');
    sec2.classList.add('is-revealed');
    sec2.classList.add('reveal-direction-up');

    // Scrolled far below: top is 1000px (greater than 800 + 60)
    observerCallback([
      {
        target: sec2,
        isIntersecting: false,
        boundingClientRect: { top: 1000, bottom: 1300 }
      }
    ]);

    expect(sec2.classList.contains('is-revealed')).toBe(false);
    expect(sec2.classList.contains('reveal-direction-up')).toBe(false);
  });

  it('cleans up observer and listeners on destroy', () => {
    let disconnected = false;
    class MockIntersectionObserver {
      observe() {}
      disconnect() {
        disconnected = true;
      }
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document);
    controller.init();
    controller.destroy();

    expect(disconnected).toBe(true);
    expect(controller.observer).toBeNull();
  });

  it('automatically assigns --reveal-index to children in a data-reveal-group without explicit delay', () => {
    document.body.innerHTML = `
      <div data-reveal-group>
        <div data-reveal id="child1">Child 1</div>
        <div data-reveal id="child2">Child 2</div>
        <div data-reveal id="child3" data-reveal-delay="5">Child 3 (explicit)</div>
      </div>
    `;

    const controller = new ScrollRevealController(document);
    controller.init();

    const c1 = document.getElementById('child1');
    const c2 = document.getElementById('child2');
    const c3 = document.getElementById('child3');

    expect(c1.style.getPropertyValue('--reveal-index')).toBe('0');
    expect(c2.style.getPropertyValue('--reveal-index')).toBe('1');
    // c3 has explicit delay, so --reveal-index is not set
    expect(c3.style.getPropertyValue('--reveal-index')).toBe('');
  });

  it('animates multiple components in and out individually on scroll', () => {
    document.body.innerHTML = `
      <section id="sectionA">
        <h2 data-reveal id="itemA1">Title</h2>
        <p data-reveal id="itemA2">Description</p>
        <button data-reveal id="itemA3">Button</button>
      </section>
    `;

    let observerCallback = null;
    class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    const controller = new ScrollRevealController(document);
    controller.init();

    const item1 = document.getElementById('itemA1');
    const item2 = document.getElementById('itemA2');
    const item3 = document.getElementById('itemA3');

    // Simulate item 1 and item 2 entering viewport, while item 3 has not reached yet
    observerCallback([
      { target: item1, isIntersecting: true, boundingClientRect: { top: 100, bottom: 150 } },
      { target: item2, isIntersecting: true, boundingClientRect: { top: 160, bottom: 200 } }
    ]);

    expect(item1.classList.contains('is-revealed')).toBe(true);
    expect(item2.classList.contains('is-revealed')).toBe(true);
    expect(item3.classList.contains('is-revealed')).toBe(false);

    // Now user scrolls down: item 1 scrolls out above viewport, item 3 enters
    observerCallback([
      { target: item1, isIntersecting: false, boundingClientRect: { top: -80, bottom: -10 } },
      { target: item3, isIntersecting: true, boundingClientRect: { top: 220, bottom: 260 } }
    ]);

    // Item 1 has animated out and primed for upward scroll
    expect(item1.classList.contains('is-revealed')).toBe(false);
    expect(item1.classList.contains('reveal-direction-up')).toBe(true);
    // Item 2 remains revealed
    expect(item2.classList.contains('is-revealed')).toBe(true);
    // Item 3 has animated in
    expect(item3.classList.contains('is-revealed')).toBe(true);
  });

  it('supports refresh to observe newly added data-reveal components', () => {
    let observedCount = 0;
    class MockIntersectionObserver {
      observe() {
        observedCount++;
      }
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;

    document.body.innerHTML = `<div data-reveal id="initial">Initial</div>`;
    const controller = new ScrollRevealController(document);
    controller.init();
    expect(observedCount).toBe(1);

    // Dynamically insert a new element
    const newEl = document.createElement('div');
    newEl.setAttribute('data-reveal', '');
    document.body.appendChild(newEl);

    controller.refresh();
    // Both initial and newly added are observed
    expect(observedCount).toBe(3); // 1 initial + 2 upon refresh
  });
});
