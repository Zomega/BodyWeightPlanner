import { test } from 'node:test';
import assert from 'node:assert';
import { PALCalculator } from './pal-calculator.js';

const REST_MET = 1.0;
const HOURS_PER_DAY = 24;
const MIN_PAL = 1.1;
const MAX_PAL = 3.0;
const DEFAULT_PAL = 1.6;

test('PALCalculator.calculateAdvanced - logic and clamping', () => {
  // Scenario: 1 hour of 2.0 MET activity daily
  const activeMET = 2.0;
  const activeHours = 1;
  const activities = [{ met: activeMET, duration: activeHours * 60, frequency: 1, period: 1 }];

  // Total MET-hours = (activeMET * activeHours) + (REST_MET * (24 - activeHours))
  // (2.0 * 1) + (1.0 * 23) = 2 + 23 = 25
  // Average MET (PAL) = 25 / 24 = 1.0416...
  const expectedPAL = 25 / HOURS_PER_DAY;

  const pal = PALCalculator.calculateAdvanced(activities);
  assert.strictEqual(pal, Math.max(MIN_PAL, expectedPAL), 'Should clamp to 1.1');

  // High activity scenario
  const highActiveHours = 12;
  const activities2 = [{ met: activeMET, duration: highActiveHours * 60, frequency: 1, period: 1 }];
  // (2 * 12) + (1 * 12) = 36. 36/24 = 1.5
  assert.strictEqual(PALCalculator.calculateAdvanced(activities2), 1.5);
});

test('PALCalculator.calculateAdvanced - complex period logic', () => {
  const met = 10.0;
  const duration = 30; // mins
  const frequency = 3; // times
  const period = 7; // days

  const activities = [{ met, duration, frequency, period }];

  const activeMinsPerDay = (duration * frequency) / period;
  const activeHoursPerDay = activeMinsPerDay / 60;
  const activeMetHours = met * activeHoursPerDay;
  const restMetHours = (HOURS_PER_DAY - activeHoursPerDay) * REST_MET;

  const expectedPAL = (activeMetHours + restMetHours) / HOURS_PER_DAY;

  const pal = PALCalculator.calculateAdvanced(activities);
  assert.strictEqual(pal, Math.max(MIN_PAL, Math.min(MAX_PAL, expectedPAL)));
});

test('PALCalculator.calculateAdvanced - defaults and limits', () => {
  assert.strictEqual(PALCalculator.calculateAdvanced(null), DEFAULT_PAL);
  assert.strictEqual(PALCalculator.calculateAdvanced([]), DEFAULT_PAL);

  // Extreme high MET should clamp to 3.0
  const extreme = [{ met: 100, duration: 1440, frequency: 1, period: 1 }];
  assert.strictEqual(PALCalculator.calculateAdvanced(extreme), MAX_PAL);
});

test('PALCalculator.getSimpleValue - lookup and fallback', () => {
  assert.strictEqual(PALCalculator.getSimpleValue('Moderate', 'Moderate'), 1.8);
  assert.strictEqual(PALCalculator.getSimpleValue('Active', 'Heavy'), 2.1);
  assert.strictEqual(PALCalculator.getSimpleValue('Invalid', 'Data'), DEFAULT_PAL);
});
