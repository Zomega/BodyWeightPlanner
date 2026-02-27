import { test } from 'node:test';
import assert from 'node:assert';
import { BMIUtils } from './bmi-utils.js';

const UNDERWEIGHT_LIMIT = 18.5;
const NORMAL_LIMIT = 25.0;
const OVERWEIGHT_LIMIT = 30.0;

test('BMIUtils.calculate - precision and invalid inputs', () => {
  const weight = 70;
  const height = 180;
  const expected = weight / Math.pow(height / 100, 2);

  assert.strictEqual(BMIUtils.calculate(weight, height), expected);
  assert.strictEqual(BMIUtils.calculate(0, 180), 0);
  assert.strictEqual(BMIUtils.calculate(70, 0), 0);
});

test('BMIUtils.getCategory - boundary precision', () => {
  // Verify strict < boundaries to kill >= mutants
  assert.strictEqual(BMIUtils.getCategory(UNDERWEIGHT_LIMIT - 0.1), 'Underweight');
  assert.strictEqual(BMIUtils.getCategory(UNDERWEIGHT_LIMIT), 'Normal');

  assert.strictEqual(BMIUtils.getCategory(NORMAL_LIMIT - 0.1), 'Normal');
  assert.strictEqual(BMIUtils.getCategory(NORMAL_LIMIT), 'Overweight');

  assert.strictEqual(BMIUtils.getCategory(OVERWEIGHT_LIMIT - 0.1), 'Overweight');
  assert.strictEqual(BMIUtils.getCategory(OVERWEIGHT_LIMIT), 'Obese');
});

test('BMIUtils.getHealthyRange - functional consistency', () => {
  const height = 180;
  const range = BMIUtils.getHealthyRange(height);

  // Verify that the weights in the range produce the correct BMI thresholds
  const lowBMI = BMIUtils.calculate(range.low, height);
  const highBMI = BMIUtils.calculate(range.high, height);

  assert.strictEqual(lowBMI, UNDERWEIGHT_LIMIT);
  assert.strictEqual(highBMI, NORMAL_LIMIT);
});
