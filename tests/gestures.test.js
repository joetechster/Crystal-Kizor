import { describe, it, expect } from 'vitest';
import { calculateVelocity, shouldAdvanceSlide, clamp, calculateWrappedIndex } from '../src/utils/gestures.js';

describe('Gesture & Momentum Physics Utilities', () => {
  describe('calculateVelocity', () => {
    it('computes positive velocity correctly', () => {
      const v = calculateVelocity(100, 200); // 100px in 200ms
      expect(v).toBe(0.5);
    });

    it('computes negative velocity correctly', () => {
      const v = calculateVelocity(-120, 300);
      expect(v).toBe(-0.4);
    });

    it('safeguards against zero or negative dt division by zero', () => {
      const v = calculateVelocity(50, 0);
      expect(v).toBe(50); // safeDt clamped to at least 1ms
    });
  });

  describe('shouldAdvanceSlide', () => {
    it('triggers next slide on sufficient negative displacement', () => {
      // Swiped left > 50px
      const decision = shouldAdvanceSlide(-65, -0.1);
      expect(decision).toBe('next');
    });

    it('triggers previous slide on sufficient positive displacement', () => {
      // Swiped right > 50px
      const decision = shouldAdvanceSlide(70, 0.1);
      expect(decision).toBe('prev');
    });

    it('triggers next slide on fast flick with moderate displacement (Apple momentum)', () => {
      // Swiped left only 25px, but flick speed is -0.5 px/ms
      const decision = shouldAdvanceSlide(-25, -0.5);
      expect(decision).toBe('next');
    });

    it('triggers previous slide on fast right flick with moderate displacement', () => {
      // Swiped right only 25px, but flick speed is +0.5 px/ms
      const decision = shouldAdvanceSlide(25, 0.5);
      expect(decision).toBe('prev');
    });

    it('snaps back when drag and velocity do not meet thresholds', () => {
      // Sub-threshold drag and slow release
      const decision = shouldAdvanceSlide(-10, -0.1);
      expect(decision).toBe('snap');
    });
  });

  describe('clamp', () => {
    it('keeps values inside the range unchanged', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps values below the minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps values above the maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('calculateWrappedIndex', () => {
    it('increments index within bounds', () => {
      expect(calculateWrappedIndex(0, 1, 5)).toBe(1);
      expect(calculateWrappedIndex(3, 1, 5)).toBe(4);
    });

    it('wraps around to 0 when exceeding total count', () => {
      expect(calculateWrappedIndex(4, 1, 5)).toBe(0);
    });

    it('wraps backward to the end when decrementing from 0', () => {
      expect(calculateWrappedIndex(0, -1, 5)).toBe(4);
    });

    it('handles zero total count gracefully', () => {
      expect(calculateWrappedIndex(0, 1, 0)).toBe(0);
    });
  });
});
