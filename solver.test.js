import { test } from 'node:test';
import assert from 'node:assert';
import { Solver } from './solver.js';

test('Solver.binarySearch - simple linear function', () => {
  const fn = (x) => 2 * x;
  const target = 10;
  const result = Solver.binarySearch(fn, target, 0, 100);
  assert.ok(Math.abs(result - 5) < 0.001);
});

test('Solver.binarySearch - inverse monotonic function', () => {
  const fn = (x) => 100 - x;
  const target = 20;
  // Function decreases: f(0)=100, f(100)=0. Target=20 should be at x=80.
  const result = Solver.binarySearch(fn, target, 0, 100);
  assert.ok(Math.abs(result - 80) < 0.001);
});

test('Solver.binarySearch - boundaries', () => {
  const fn = (x) => x;
  // Target exactly at min
  const minRes = Solver.binarySearch(fn, 0, 0, 100);
  assert.ok(Math.abs(minRes - 0) < 0.001);

  // Target exactly at max
  const maxRes = Solver.binarySearch(fn, 100, 0, 100);
  assert.ok(Math.abs(maxRes - 100) < 0.001);
});

test('Solver.binarySearch - max iterations', () => {
  const fn = (x) => x * x;
  // Sqrt(2) is irrational, will never be exact.
  const result = Solver.binarySearch(fn, 2, 0, 2, 1e-15, 50);
  // Should return best approximation after 50 iterations
  assert.ok(Math.abs(result * result - 2) < 0.1); // Loose check for termination
});
