import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import Intervention from './intervention.js';
import DailyParams from './dailyparams.js';

const createTestBaseline = () => new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);

test('DailyParams - flag mutation kill', () => {
  const d = new DailyParams();
  assert.strictEqual(d.flag, false);
});

test('DailyParams trajectory - Sort order Day 0 check', () => {
  const b = createTestBaseline();

  // int1: day 0, int2: day 5
  // a-b: 0-5 = -5 (int1 first)
  // a+b: 0+5 = 5 (int2 first)
  const int1 = new Intervention(0, 1000);
  const int2 = new Intervention(5, 3000);

  const traj = DailyParams.makeparamtrajectory(b, [int2, int1], 10);

  // Day 1 should be 1000 if int1 is first.
  assert.strictEqual(traj[1].calories, 1000);
});

test('DailyParams trajectory - Sort mutant kill', () => {
  const b = createTestBaseline();

  // a.day - b.day (correct) vs a.day + b.day (mutant)
  // int1: day 2, int2: day 5.
  // a-b: 2-5 = -3 (correct order [int1, int2])
  // a+b: 2+5 = 7 (incorrect order [int2, int1])
  const int1 = new Intervention(2, 2000);
  const int2 = new Intervention(5, 3000);

  const traj = DailyParams.makeparamtrajectory(b, [int2, int1], 10);

  // If sorted correctly, day 3 is 2000.
  assert.strictEqual(traj[3].calories, 2000);
});

test('DailyParams trajectory - ramping arithmetic survivors', () => {
  const b = createTestBaseline();
  const startCals = b.getMaintCals();
  const targetCals = startCals + 1000;
  const endDay = 10;

  const int = new Intervention(endDay, targetCals);
  int.rampon = true;

  const traj = DailyParams.makeparamtrajectory(b, int, 11);

  // Test day 0 explicitly to kill i >= lastDay mutant
  assert.strictEqual(traj[0].calories, startCals);
  assert.strictEqual(traj[0].ramped, false);
});

test('DailyParams trajectory - Sort and Filter logic refined', (_t) => {
  const b = createTestBaseline();

  const int1 = new Intervention(5, 2000);
  const int2 = new Intervention(2, 2500);

  // Test already sorted array to kill sort mutants
  const trajSorted = DailyParams.makeparamtrajectory(b, [int2, int1], 10);
  assert.strictEqual(trajSorted[3].calories, 2500);

  // Test unsorted array to kill sort mutants
  const trajUnsorted = DailyParams.makeparamtrajectory(b, [int1, int2], 10);
  assert.strictEqual(trajUnsorted[3].calories, 2500);
});

test('DailyParams trajectory - Ramping arithmetic precision', () => {
  const b = new Baseline(true, 23, 180, 70, 18, 1000, 1.0, false, false);
  b.sodium = 1000;
  b.carbIntakePct = 50;

  // Day 0: 1000 cals, 50% carb, 1000 sodium
  // Day 10: 2000 cals, 100% carb, 2000 sodium
  const int = new Intervention(10, 2000, 100, 0, 2000);
  int.rampon = true;

  const traj = DailyParams.makeparamtrajectory(b, int, 11);

  // Day 1 (10% progress)
  // Cals: 1000 + 0.1 * (2000 - 1000) = 1100.
  assert.strictEqual(traj[1].calories, 1100);
  assert.strictEqual(traj[1].sodium, 1100);
  assert.strictEqual(traj[1].carbpercent, 55);

  // Verify ramped flag logic: i > lastDay
  assert.strictEqual(traj[0].ramped, false);
  assert.strictEqual(traj[1].ramped, true);
  assert.strictEqual(traj[10].ramped, false);
});

test('DailyParams trajectory - Ramping progress proportionality', () => {
  const b = createTestBaseline();
  const startCals = b.getMaintCals();
  const targetCals = 2000;
  const endDay = 10;

  const int = new Intervention(endDay, targetCals);
  int.rampon = true;

  const traj = DailyParams.makeparamtrajectory(b, int, endDay + 1);

  // Check multiple points to kill math mutants (+ vs -, * vs /)
  for (let day = 1; day < endDay; day++) {
    const progress = day / endDay;
    const expectedCals = startCals + (targetCals - startCals) * progress;
    assert.strictEqual(traj[day].calories, expectedCals, `Ramp failed at day ${day}`);
    assert.ok(traj[day].ramped, `Day ${day} should be flagged as ramped`);
  }

  assert.strictEqual(traj[endDay].calories, targetCals, 'End point should reach target');
  assert.strictEqual(traj[endDay].ramped, false, 'Target day itself is not "ramping"');
});

test('DailyParams trajectory - Multi-parameter Ramping precision', () => {
  const b = createTestBaseline();
  const startCals = b.getMaintCals();
  const startAct = b.getActivityParam();
  const startCarb = b.carbIntakePct;
  const startSodium = b.sodium;

  const targetCals = 3000;
  const targetActPercent = 100; // Double activity
  const targetCarb = 100;
  const targetSodium = 8000;

  const int = new Intervention(10, targetCals, targetCarb, targetActPercent, targetSodium);
  int.rampon = true;
  const targetAct = int.getAct(b);

  const traj = DailyParams.makeparamtrajectory(b, int, 11);
  const mid = traj[5]; // 50% progress

  assert.strictEqual(mid.calories, startCals + (targetCals - startCals) * 0.5);
  assert.strictEqual(mid.actparam, startAct + (targetAct - startAct) * 0.5);
  assert.strictEqual(mid.carbpercent, startCarb + (targetCarb - startCarb) * 0.5);
  assert.strictEqual(mid.sodium, startSodium + (targetSodium - startSodium) * 0.5);
});

test('DailyParams trajectory - Argument handling and edge cases', (_t) => {
  const b = createTestBaseline();

  // No interventions
  const trajEmpty = DailyParams.makeparamtrajectory(b, 5);
  assert.strictEqual(trajEmpty.length, 5);
  assert.strictEqual(trajEmpty[0].calories, b.getMaintCals());

  // Array vs Rest arguments
  const int = new Intervention(2, 2000);
  const trajArray = DailyParams.makeparamtrajectory(b, [int], 5);
  const trajRest = DailyParams.makeparamtrajectory(b, int, 5);

  assert.strictEqual(trajArray[2].calories, 2000);
  assert.strictEqual(trajRest[2].calories, 2000);
});
