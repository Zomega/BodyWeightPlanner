import { test } from 'node:test';
import assert from 'node:assert';
import { PALCalculator } from './pal-calculator.js';

test('PALCalculator.calculateAdvanced - simple activity', () => {
  // 1 hour of 4.0 MET activity daily
  const activities = [{ met: 4.0, duration: 60, frequency: 1, period: 1 }];
  // Active mins: 60
  // MET-hours: (4.0 * 1) = 4
  // Rest hours: 23 * 1.0 = 23
  // Total MET-hours: 27
  // PAL = 27 / 24 = 1.125
  const pal = PALCalculator.calculateAdvanced(activities);
  assert.strictEqual(pal.toFixed(3), '1.125'); // 27 / 24 = 1.125
});

test('PALCalculator.calculateAdvanced - complex weekly activity', () => {
  // 30 mins of 10.0 MET activity, 3 times per week
  const activities = [{ met: 10.0, duration: 30, frequency: 3, period: 7 }];
  // Active mins per day: (30 * 3) / 7 = 12.857
  // Active MET-hours per day: (10.0 * 12.857) / 60 = 2.142
  // Rest hours: 24 - (12.857 / 60) = 23.785
  // Total MET-hours: 2.142 + 23.785 = 25.927
  // PAL = 25.927 / 24 = 1.080 -> clamped to 1.1
  const pal = PALCalculator.calculateAdvanced(activities);
  assert.strictEqual(pal.toFixed(2), '1.10');
});

test('PALCalculator.calculateAdvanced - edge cases', () => {
  assert.strictEqual(PALCalculator.calculateAdvanced(null), 1.6);
  assert.strictEqual(PALCalculator.calculateAdvanced([]), 1.6);
  
  // High activity -> 3.0 ceiling
  const heavy = [{ met: 20, duration: 1440, frequency: 1, period: 1 }];
  assert.strictEqual(PALCalculator.calculateAdvanced(heavy), 3.0);
  
  // Missing/invalid fields
  const invalid = [{ met: 'abc', duration: null, frequency: undefined }];
  // 0 active mins -> (0 + 24)/24 = 1.0 -> clamped to 1.1
  assert.strictEqual(PALCalculator.calculateAdvanced(invalid), 1.1);
});

test('PALCalculator.getSimpleValue', () => {
  assert.strictEqual(PALCalculator.getSimpleValue('Moderate', 'Moderate'), 1.8);
  assert.strictEqual(PALCalculator.getSimpleValue('Active', 'Heavy'), 2.1);
  assert.strictEqual(PALCalculator.getSimpleValue('Invalid', 'Data'), 1.6);
});
