/**
 * Apple Design Hybrid Smooth Scroll Controller
 * Interpolates notched mouse wheel scrolls and anchor links with critically damped spring physics.
 * Strictly preserves 1:1 hardware trackpad and touch gestures with zero latency (Apple Design Rules 1 & 2).
 * Fully interruptible on user touch, pointer, or keyboard interaction (Apple Design Rule 3).
 */
import { clamp } from '../utils/gestures.js';

export class SmoothScrollController {
  constructor(root = document, options = {}) {
    this.root = root;
    this.options = {
      friction: options.friction || 0.18, // Critically damped spring relaxation factor
      wheelStepMultiplier: options.wheelStepMultiplier || 1.0,
      ...options
    };

    this.currentScrollY = 0;
    this.targetScrollY = 0;
    this.isAnimating = false;
    this.rafId = null;
    this.prefersReducedMotion = false;
    this.motionQuery = null;
    this.onMotionChange = null;

    this.onWheel = this.onWheel.bind(this);
    this.onInterrupt = this.onInterrupt.bind(this);
    this.step = this.step.bind(this);
  }

  init() {
    if (typeof window === 'undefined') return;

    this.currentScrollY = window.scrollY || 0;
    this.targetScrollY = this.currentScrollY;

    // Check prefers-reduced-motion (Apple Design Skill Section 14)
    if (window.matchMedia) {
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = this.motionQuery.matches;
      this.onMotionChange = (e) => {
        this.prefersReducedMotion = e.matches;
        if (this.prefersReducedMotion) {
          this.stopAnimation();
        }
      };
      if (this.motionQuery.addEventListener) {
        this.motionQuery.addEventListener('change', this.onMotionChange);
      } else if (this.motionQuery.addListener) {
        this.motionQuery.addListener(this.onMotionChange);
      }
    }

    // Set documentElement scrollBehavior to auto during custom smooth scroll to prevent fighting
    if (document.documentElement) {
      document.documentElement.style.scrollBehavior = 'auto';
    }

    // Listen to wheel events with { passive: false } to allow preventing notched wheel jumps
    window.addEventListener('wheel', this.onWheel, { passive: false });

    // Apple Zero-Latency & Interruptibility: Touch, pointer, key events immediately halt animation
    window.addEventListener('touchstart', this.onInterrupt, { passive: true });
    window.addEventListener('pointerdown', this.onInterrupt, { passive: true });
    window.addEventListener('keydown', (e) => {
      const interruptKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space', ' '];
      if (interruptKeys.includes(e.key) || [32, 33, 34, 35, 36, 38, 40].includes(e.keyCode)) {
        this.onInterrupt();
      }
    }, { passive: true });
  }

  /**
   * Distinguishes high-frequency 1:1 hardware trackpads / mobile touch from notched mouse wheels.
   * Precision trackpads produce continuous small deltas with fractional values or horizontal deltas.
   */
  isPrecisionTrackpad(e) {
    if (Math.abs(e.deltaX) > 0) return true;
    if (!Number.isInteger(e.deltaY)) return true;
    if (Math.abs(e.deltaY) < 35 && e.deltaMode === 0) return true;
    return false;
  }

  onWheel(e) {
    if (this.prefersReducedMotion) return;

    // Preserve 100% 1:1 hardware trackpad and touch inertia with zero latency
    if (this.isPrecisionTrackpad(e)) {
      if (this.isAnimating) {
        this.stopAnimation();
      }
      return;
    }

    // Discrete notched mouse wheel detected
    e.preventDefault();

    let delta = e.deltaY;
    if (e.deltaMode === 1) {
      // Lines mode (Firefox / older mice)
      delta *= 36;
    } else if (e.deltaMode === 2) {
      // Pages mode
      delta *= (window.innerHeight || 800);
    }

    // Normalize notched tick multiplier for consistent Apple-like smooth step
    const step = Math.sign(delta) * Math.min(Math.abs(delta) * this.options.wheelStepMultiplier, 120);

    const docHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
    const winHeight = window.innerHeight || 0;
    const maxScroll = Math.max(0, docHeight - winHeight);

    // If currently animating, chain smoothly into target (momentum handoff)
    const currentBase = this.isAnimating ? this.targetScrollY : (window.scrollY || 0);
    this.targetScrollY = clamp(currentBase + step, 0, maxScroll);
    this.currentScrollY = window.scrollY || 0;

    if (!this.isAnimating) {
      this.isAnimating = true;
      this.rafId = window.requestAnimationFrame(this.step);
    }
  }

  onInterrupt() {
    this.stopAnimation();
    if (typeof window !== 'undefined') {
      this.currentScrollY = window.scrollY || 0;
      this.targetScrollY = this.currentScrollY;
    }
  }

  step() {
    if (!this.isAnimating) return;

    const diff = this.targetScrollY - this.currentScrollY;
    if (Math.abs(diff) < 0.6) {
      window.scrollTo(0, this.targetScrollY);
      this.currentScrollY = this.targetScrollY;
      this.stopAnimation();
      return;
    }

    // Critically damped spring relaxation step
    this.currentScrollY += diff * this.options.friction;
    window.scrollTo(0, Math.round(this.currentScrollY));

    this.rafId = window.requestAnimationFrame(this.step);
  }

  /**
   * Programmatic smooth scroll to target position with Apple critically damped spring curve.
   * Used for navigation anchors and Back to Top.
   */
  scrollToPosition(targetY, duration = 600) {
    if (typeof window === 'undefined') return;

    if (this.prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }

    this.stopAnimation();

    const startY = window.scrollY || 0;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    // Apple critically damped spring curve approximation: fast rise with smooth asymptotic settle
    const appleEase = (t) => 1 - Math.pow(1 - t, 3.6);

    const animateScroll = (now) => {
      if (!this.isAnimating) return;

      const currentTime = now || ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
      const elapsed = (currentTime - startTime) / duration;
      const progress = clamp(elapsed, 0, 1);
      const eased = appleEase(progress);

      const nextY = startY + distance * eased;
      this.currentScrollY = nextY;
      window.scrollTo(0, Math.round(nextY));

      if (progress < 1) {
        this.rafId = window.requestAnimationFrame(animateScroll);
      } else {
        window.scrollTo(0, targetY);
        this.currentScrollY = targetY;
        this.targetScrollY = targetY;
        this.stopAnimation();
      }
    };

    this.isAnimating = true;
    this.rafId = window.requestAnimationFrame(animateScroll);
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.rafId && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stopAnimation();
    if (typeof window !== 'undefined') {
      window.removeEventListener('wheel', this.onWheel);
      window.removeEventListener('touchstart', this.onInterrupt);
      window.removeEventListener('pointerdown', this.onInterrupt);

      if (this.motionQuery && this.onMotionChange) {
        if (this.motionQuery.removeEventListener) {
          this.motionQuery.removeEventListener('change', this.onMotionChange);
        } else if (this.motionQuery.removeListener) {
          this.motionQuery.removeListener(this.onMotionChange);
        }
      }
    }
  }
}

export function initSmoothScroll(options) {
  const controller = new SmoothScrollController(document, options);
  controller.init();
  return controller;
}
