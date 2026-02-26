import { test } from 'node:test';
import assert from 'node:assert';
import { BMIUtils } from './bmi-utils.js';

test('BMIUtils.calculate', () => {
  // 70kg, 180cm -> ~21.6
  const bmi = BMIUtils.calculate(70, 180);
  assert.strictEqual(bmi.toFixed(1), '21.6');
  assert.strictEqual(BMIUtils.calculate(0, 180), 0);
});

test('BMIUtils.getCategory', () => {
  assert.strictEqual(BMIUtils.getCategory(17.0), 'Underweight');
  assert.strictEqual(BMIUtils.getCategory(22.0), 'Normal');
  assert.strictEqual(BMIUtils.getCategory(27.0), 'Overweight');
  assert.strictEqual(BMIUtils.getCategory(32.0), 'Obese');
});

test('BMIUtils.getHealthyRange', () => {
  const range = BMIUtils.getHealthyRange(180);
  // low = 18.5 * (1.8^2) = 59.94
  // high = 25.0 * (1.8^2) = 81
  assert.strictEqual(range.low.toFixed(2), '59.94');
  assert.strictEqual(range.high.toFixed(0), '81');
});
