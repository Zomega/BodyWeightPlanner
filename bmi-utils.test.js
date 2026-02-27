import { test } from 'node:test';
import assert from 'node:assert';
import { BMIUtils } from './bmi-utils.js';

test('BMIUtils.calculate', () => {
  assert.strictEqual(BMIUtils.calculate(70, 180).toFixed(2), '21.60');
  assert.strictEqual(BMIUtils.calculate(0, 180), 0);
  assert.strictEqual(BMIUtils.calculate(70, 0), 0);
});

test('BMIUtils.getCategory thresholds', () => {
  // Underweight < 18.5
  assert.strictEqual(BMIUtils.getCategory(18.4), 'Underweight');
  assert.strictEqual(BMIUtils.getCategory(18.5), 'Normal');
  
  // Normal < 25
  assert.strictEqual(BMIUtils.getCategory(24.9), 'Normal');
  assert.strictEqual(BMIUtils.getCategory(25.0), 'Overweight');
  
  // Overweight < 30
  assert.strictEqual(BMIUtils.getCategory(29.9), 'Overweight');
  assert.strictEqual(BMIUtils.getCategory(30.0), 'Obese');
});

test('BMIUtils.getHealthyRange', () => {
  const range = BMIUtils.getHealthyRange(180);
  assert.strictEqual(range.low.toFixed(2), '59.94'); // 18.5 * 1.8^2
  assert.strictEqual(range.high.toFixed(2), '81.00'); // 25 * 1.8^2
});
