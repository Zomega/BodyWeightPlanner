import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import Intervention from './intervention.js';
import DailyParams from './dailyparams.js';

test('DailyParams trajectory - Single intervention no ramp', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  const maint = b.getMaintCals();

  const int1 = new Intervention(10, 2000, 50, 0, 4000);
  const int2 = new Intervention(); // Off
  int2.on = false;

  const traj = DailyParams.makeparamtrajectory(b, int1, int2, 20);

  assert.strictEqual(traj.length, 20);
  // Days 0-9 should be baseline
  assert.strictEqual(Math.round(traj[0].calories), Math.round(maint));
  assert.strictEqual(Math.round(traj[9].calories), Math.round(maint));
  // Days 10-19 should be intervention
  assert.strictEqual(traj[10].calories, 2000);
  assert.strictEqual(traj[19].calories, 2000);
});

test('DailyParams trajectory - Single intervention WITH ramp', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  const maint = b.getMaintCals(); // ~2746

  const int1 = new Intervention(10, 2000, 50, 0, 4000);
  int1.rampon = true;
  const int2 = new Intervention();
  int2.on = false;

  const traj = DailyParams.makeparamtrajectory(b, int1, int2, 20);

  // Day 5 should be roughly halfway between maintenance and 2000
  const midpoint = (maint + 2000) / 2;
  assert.ok(Math.abs(traj[5].calories - midpoint) < 50);
  assert.strictEqual(traj[10].calories, 2000);
});

test('DailyParams trajectory - Multi-intervention sequence', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);

  const int1 = new Intervention(10, 2500, 50, 0, 4000);
  const int2 = new Intervention(20, 2000, 50, 0, 4000);
  int2.on = true;

  const traj = DailyParams.makeparamtrajectory(b, int1, int2, 30);

  assert.strictEqual(traj[5].calories, b.getMaintCals());
  assert.strictEqual(traj[15].calories, 2500);
  assert.strictEqual(traj[25].calories, 2000);
});
