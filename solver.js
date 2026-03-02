/**
 * Generic numerical solver utilities.
 */
export const Solver = {
  /**
   * Performs a binary search to find an input value that produces the target output.
   * @param {Function} fn - Monotonic function to solve: fn(x) -> y
   * @param {number} target - The target y value.
   * @param {number} min - Minimum x value.
   * @param {number} max - Maximum x value.
   * @param {number} epsilon - Acceptable error margin.
   * @param {number} maxIterations - Safety break for infinite loops.
   * @returns {number} The x value that produces y within epsilon.
   */
  binarySearch(fn, target, min, max, epsilon = 0.001, maxIterations = 100) {
    let low = min;
    let high = max;
    let mid = (low + high) / 2;
    let iterations = 0;

    // Check boundary conditions first
    const yMin = fn(min);
    if (Math.abs(yMin - target) < epsilon) return min;
    const yMax = fn(max);
    if (Math.abs(yMax - target) < epsilon) return max;

    // Determine monotonicity direction
    // If yMax is NaN or unstable, we assume increasing (safe for body weight)
    const increasing = isNaN(yMax) || yMax > yMin;

    while (iterations < maxIterations) {
      mid = (low + high) / 2;
      const yMid = fn(mid);

      if (Math.abs(yMid - target) < epsilon) {
        return mid;
      }

      // Handle NaN midpoints by treating them as "too large" (high instability)
      if (isNaN(yMid)) {
        high = mid;
      } else if (increasing) {
        if (yMid < target) low = mid;
        else high = mid;
      } else {
        if (yMid > target) low = mid;
        else high = mid;
      }

      iterations++;
    }

    return mid;
  },
};
