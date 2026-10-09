import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmoothScrollController } from '../src/components/SmoothScroll.js';

describe('SmoothScrollController Component Unit Tests', () => {
  let controller;

  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true
    });

    window.scrollTo = vi.fn((x, y) => {
      window.scrollY = (typeof y === 'object' && y !== null) ? y.top : y;
    });
    window.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
    window.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  afterEach(() => {
    if (controller) {
      controller.destroy();
      controller = null;
    }
  });

  it('initializes and sets documentElement scrollBehavior to auto', () => {
    controller = new SmoothScrollController(document);
    controller.init();

    expect(document.documentElement.style.scrollBehavior).toBe('auto');
  });

  it('correctly identifies precision trackpad vs notched wheel', () => {
    controller = new SmoothScrollController(document);

    // Trackpad: fractional deltaY
    const trackpadEvent1 = { deltaX: 0, deltaY: 2.45, deltaMode: 0 };
    expect(controller.isPrecisionTrackpad(trackpadEvent1)).toBe(true);

    // Trackpad: horizontal delta
    const trackpadEvent2 = { deltaX: 12, deltaY: 0, deltaMode: 0 };
    expect(controller.isPrecisionTrackpad(trackpadEvent2)).toBe(true);

    // Trackpad: low continuous delta
    const trackpadEvent3 = { deltaX: 0, deltaY: 15, deltaMode: 0 };
    expect(controller.isPrecisionTrackpad(trackpadEvent3)).toBe(true);

    // Notched mouse wheel: discrete integer step >= 35
    const wheelEvent = { deltaX: 0, deltaY: 100, deltaMode: 0 };
    expect(controller.isPrecisionTrackpad(wheelEvent)).toBe(false);
  });

  it('smooths notched mouse wheel events and calls preventDefault', () => {
    controller = new SmoothScrollController(document);
    controller.init();

    const preventDefault = vi.fn();
    const wheelEvent = new Event('wheel');
    Object.assign(wheelEvent, {
      deltaX: 0,
      deltaY: 100,
      deltaMode: 0,
      preventDefault
    });

    window.dispatchEvent(wheelEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(controller.isAnimating).toBe(true);
  });

  it('allows native trackpad scroll without preventDefault', () => {
    controller = new SmoothScrollController(document);
    controller.init();

    const preventDefault = vi.fn();
    const wheelEvent = new Event('wheel');
    Object.assign(wheelEvent, {
      deltaX: 0,
      deltaY: 1.5,
      deltaMode: 0,
      preventDefault
    });

    window.dispatchEvent(wheelEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(controller.isAnimating).toBe(false);
  });

  it('interrupts animation on pointerdown and touchstart (Apple Rule 3: Zero Lockout)', () => {
    controller = new SmoothScrollController(document);
    controller.init();
    controller.isAnimating = true;

    window.dispatchEvent(new Event('pointerdown'));
    expect(controller.isAnimating).toBe(false);

    controller.isAnimating = true;
    window.dispatchEvent(new Event('touchstart'));
    expect(controller.isAnimating).toBe(false);
  });

  it('programmatically scrolls to target position using spring curve', () => {
    controller = new SmoothScrollController(document);
    controller.init();

    controller.scrollToPosition(500, 200);

    expect(controller.isAnimating).toBe(true);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('bypasses wheel smoothing when prefers-reduced-motion is active', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    controller = new SmoothScrollController(document);
    controller.init();

    const preventDefault = vi.fn();
    const wheelEvent = new Event('wheel');
    Object.assign(wheelEvent, {
      deltaX: 0,
      deltaY: 100,
      deltaMode: 0,
      preventDefault
    });

    window.dispatchEvent(wheelEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(controller.isAnimating).toBe(false);
  });

  it('cleans up event listeners and stops animation on destroy', () => {
    controller = new SmoothScrollController(document);
    controller.init();
    controller.isAnimating = true;

    controller.destroy();

    expect(controller.isAnimating).toBe(false);
  });
});
