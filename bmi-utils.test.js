import { test } from 'node:test';
import assert from 'node:assert';
import { BMIUtils } from './bmi-utils.js';
import { BMI } from './constants.js';

test('BMIUtils.calculate - precision and invalid inputs', () => {
  const weight = 70;
  const height = 180;
  const expected = weight / Math.pow(height / 100, 2);

  assert.strictEqual(BMIUtils.calculate(weight, height), expected);
  assert.strictEqual(BMIUtils.calculate(0, 180), 0);
  assert.strictEqual(BMIUtils.calculate(70, 0), 0);
  assert.strictEqual(BMIUtils.calculate(null, 180), 0);
  assert.strictEqual(BMIUtils.calculate(70, null), 0);
});

test('BMIUtils.getCategory - boundary precision', () => {
  // Verify strict < boundaries to kill >= mutants
  assert.strictEqual(BMIUtils.getCategory(BMI.UNDERWEIGHT - 0.1), 'Underweight');
  assert.strictEqual(BMIUtils.getCategory(BMI.UNDERWEIGHT), 'Normal');

  assert.strictEqual(BMIUtils.getCategory(BMI.NORMAL - 0.1), 'Normal');
  assert.strictEqual(BMIUtils.getCategory(BMI.NORMAL), 'Overweight');

  assert.strictEqual(BMIUtils.getCategory(BMI.OVERWEIGHT - 0.1), 'Overweight');
  assert.strictEqual(BMIUtils.getCategory(BMI.OVERWEIGHT), 'Obese');
});

test('BMIUtils.getHealthyRange - functional consistency', () => {
  const height = 180;
  const range = BMIUtils.getHealthyRange(height);

  // Verify that the weights in the range produce the correct BMI thresholds
  const lowBMI = BMIUtils.calculate(range.low, height);
  const highBMI = BMIUtils.calculate(range.high, height);

  assert.strictEqual(lowBMI, BMI.UNDERWEIGHT);
  assert.strictEqual(highBMI, BMI.NORMAL);
});
