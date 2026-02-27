import { test } from 'node:test';
import assert from 'node:assert';
import { PALCalculator } from './pal-calculator.js';

test('PALCalculator.calculateAdvanced - precision check', () => {
  // 1 hour of 2.0 MET activity daily
  // Active MET-hours: 2.0 * 1 = 2
  // Rest MET-hours: 23.0 * 1.0 = 23
  // Total MET-hours: 25
  // PAL = 25 / 24 = 1.04166 -> clamped to 1.1
  const activities = [{ met: 2.0, duration: 60, frequency: 1, period: 1 }];
  const pal = PALCalculator.calculateAdvanced(activities);
  assert.strictEqual(pal, 1.1);
  
  // High activity to check division/multiplication kills
  // 12 hours of 2.0 MET
  // Active: 12 * 2 = 24
  // Rest: 12 * 1 = 12
  // Total: 36
  // PAL = 36 / 24 = 1.5
  const activities2 = [{ met: 2.0, duration: 720, frequency: 1, period: 1 }];
  const pal2 = PALCalculator.calculateAdvanced(activities2);
  assert.strictEqual(pal2, 1.5);
});

test('PALCalculator.calculateAdvanced - complex weekly activity', () => {
  const activities = [{ met: 10.0, duration: 30, frequency: 3, period: 7 }];
  const pal = PALCalculator.calculateAdvanced(activities);
  assert.strictEqual(pal.toFixed(2), '1.10');
});

test('PALCalculator.calculateAdvanced - edge cases', () => {
  assert.strictEqual(PALCalculator.calculateAdvanced(null), 1.6);
  assert.strictEqual(PALCalculator.calculateAdvanced([]), 1.6);
  
  const heavy = [{ met: 20, duration: 1440, frequency: 1, period: 1 }];
  assert.strictEqual(PALCalculator.calculateAdvanced(heavy), 3.0);
  
  const invalid = [{ met: 'abc', duration: null, frequency: undefined }];
  assert.strictEqual(PALCalculator.calculateAdvanced(invalid), 1.1);
});

test('PALCalculator.getSimpleValue', () => {
  assert.strictEqual(PALCalculator.getSimpleValue('Moderate', 'Moderate'), 1.8);
  assert.strictEqual(PALCalculator.getSimpleValue('Active', 'Heavy'), 2.1);
  assert.strictEqual(PALCalculator.getSimpleValue('Invalid', 'Data'), 1.6);
});
