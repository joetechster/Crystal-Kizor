/**
 * Apple Design Gesture Math & Momentum Physics Utilities
 */

/**
 * Calculates gesture release velocity in pixels per millisecond
 * @param {number} dx - Displacement in pixels
 * @param {number} dt - Time elapsed in milliseconds
 * @returns {number} Velocity (px/ms)
 */
export function calculateVelocity(dx, dt) {
  const safeDt = Math.max(1, dt);
  return dx / safeDt;
}

/**
 * Determines whether a drag or flick gesture should trigger slide navigation
 * Evaluates both displacement distance and release flick velocity (Apple momentum handoff)
 * @param {number} dx - Displacement in pixels
 * @param {number} vx - Velocity in px/ms
 * @param {number} distanceThreshold - Distance required for displacement-based trigger (default 50)
 * @param {number} velocityThreshold - Velocity required for flick-based trigger (default 0.35)
 * @returns {'next' | 'prev' | 'snap'} Navigation decision
 */
export function shouldAdvanceSlide(dx, vx, distanceThreshold = 50, velocityThreshold = 0.35) {
  // Swiping left (drag negative) -> Next photo
  if (dx < -distanceThreshold || (vx < -velocityThreshold && dx < -15)) {
    return 'next';
  }
  // Swiping right (drag positive) -> Previous photo
  if (dx > distanceThreshold || (vx > velocityThreshold && dx > 15)) {
    return 'prev';
  }
  return 'snap';
}

/**
 * Clamps a number within inclusive [min, max] boundaries
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Calculates wrapped next or previous index in a circular collection
 * @param {number} currentIndex 
 * @param {number} delta - Usually +1 or -1
 * @param {number} totalCount 
 * @returns {number}
 */
export function calculateWrappedIndex(currentIndex, delta, totalCount) {
  if (totalCount <= 0) return 0;
  return (currentIndex + delta + totalCount) % totalCount;
}
