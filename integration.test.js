import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import Intervention from './intervention.js';

test('Intervention.forgoal returns maintenance for same weight', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  const maintCals = b.getMaintCals();
  const goalInter = Intervention.forgoal(b, 70, 100, 0, 0, 0.001);

  // Should be very close to maintenance
  assert.ok(Math.abs(goalInter.calories - maintCals) < 1);
});

test('Intervention.forgoal calculates calories for weight loss', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  // Lose 5kg in 180 days
  const goalInter = Intervention.forgoal(b, 65, 180, 0, 0, 0.001);

  // We expect calories to be less than maintenance (2746)
  assert.ok(goalInter.calories < 2746);
  assert.ok(goalInter.calories > 1500); // Sanity check
});

test('Unachievable goal throws error', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  // Lose 50kg in 10 days (impossible)
  assert.throws(() => {
    Intervention.forgoal(b, 20, 10, 0, 0, 0.001);
  }, /Unachievable Goal/);
});

test('Intervention.forgoal - unachievable due to mincals', (_t) => {
    const b = new Baseline(true, 23, 180, 70);
    // Maintenance is ~2746. If we set mincals to 3000, we can never reach a goal weight of 65kg.
    assert.throws(() => {
        Intervention.forgoal(b, 65, 180, 0, 3000, 0.001);
    }, /Unachievable Goal/);
});

test('Intervention.forgoal - PCXerror trigger', (_t) => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.4, false, false);
    // Very high goal weight and short time might force search into instability
    assert.throws(() => {
        Intervention.forgoal(b, 1000, 1, 0, 0, 0.000001);
    }, /Unachievable Goal/);
});
