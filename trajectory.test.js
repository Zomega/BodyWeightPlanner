import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import Intervention from './intervention.js';
import DailyParams from './dailyparams.js';

test('DailyParams trajectory - Sort and Filter logic', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  const maint = b.getMaintCals();

  // Test Sort: int2 before int1 in array
  const int1 = new Intervention(5, 2000);
  const int2 = new Intervention(2, 2500);
  const int3 = new Intervention(8, 3000);
  int3.on = false; // Test Filter

  const traj = DailyParams.makeparamtrajectory(b, int1, int2, int3, 10);

  assert.strictEqual(traj.length, 10);
  // Days 0-1: Baseline
  assert.strictEqual(traj[0].calories, maint);
  assert.strictEqual(traj[1].calories, maint);
  // Days 2-4: int2 (2500)
  assert.strictEqual(traj[2].calories, 2500);
  assert.strictEqual(traj[4].calories, 2500);
  // Days 5-9: int1 (2000)
  assert.strictEqual(traj[5].calories, 2000);
  assert.strictEqual(traj[9].calories, 2000);
  
  // Verify int3 was filtered out (day 8 remains int1)
  assert.strictEqual(traj[8].calories, 2000);

  // One more filter check: null intervention
  const trajWithNull = DailyParams.makeparamtrajectory(b, null, 5);
  assert.strictEqual(trajWithNull[0].calories, maint);
});

test('DailyParams trajectory - progress duration math', () => {
    const b = new Baseline(true, 23, 180, 70, 18, 1000, 1.0, false, false);
    // lastDay = 0, lastCals = 1000
    const int = new Intervention(4, 2000); // endDay = 4, duration = 4
    int.rampon = true;
    
    const traj = DailyParams.makeparamtrajectory(b, int, 5);
    // i=1: prog = (1-0)/4 = 0.25 -> 1000 + 0.25*1000 = 1250
    assert.strictEqual(traj[1].calories, 1250);
    // i=2: prog = (2-0)/4 = 0.50 -> 1500
    assert.strictEqual(traj[2].calories, 1500);
    // i=3: prog = (3-0)/4 = 0.75 -> 1750
    assert.strictEqual(traj[3].calories, 1750);
});

test('DailyParams trajectory - Precise Ramping', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.0, false, false);
  const maint = b.getMaintCals(); // MSJ says 1716 * 1.0 = 1716

  // 10 day ramp from 1716 to 2716
  const int = new Intervention(10, 2716);
  int.rampon = true;

  const traj = DailyParams.makeparamtrajectory(b, int, 11);

  // i=0: baseline
  assert.strictEqual(traj[0].calories, 1716);
  assert.strictEqual(traj[0].ramped, false);
  
  // i=1: start of ramp
  assert.strictEqual(traj[1].ramped, true);
  
  // i=5: halfway (0.5 progress) -> 1716 + 0.5 * (2716 - 1716) = 2216
  assert.strictEqual(traj[5].calories, 2216);
  assert.strictEqual(traj[5].ramped, true);
  
  // i=9: 90% progress -> 1716 + 0.9 * 1000 = 2616
  assert.strictEqual(traj[9].calories, 2616);
  assert.strictEqual(traj[9].ramped, true);
  
  // i=10: target reached
  assert.strictEqual(traj[10].calories, 2716);
  assert.strictEqual(traj[10].ramped, false);
});

test('DailyParams trajectory - Multi-parameter Ramping', (_t) => {
    const b = new Baseline(true, 23, 180, 70, 18, 1000, 1.2, false, false);
    b.sodium = 1000;
    b.carbIntakePct = 50;
    
    const baselineAct = b.getActivityParam();
    
    const int0 = new Intervention(0, 1000, 50, 0, 1000);
    const int10 = new Intervention(10, 2000, 100, 100, 2000);
    int10.rampon = true;
    
    const traj = DailyParams.makeparamtrajectory(b, int0, int10, 11);
    const mid = traj[5]; // 50% progress
    
    assert.strictEqual(mid.calories, 1500);
    assert.strictEqual(mid.carbpercent, 75);
    assert.strictEqual(mid.sodium, 1500);
    assert.strictEqual(mid.actparam, baselineAct * 1.5);
});

test('DailyParams trajectory - Array-based call', (_t) => {
    const b = new Baseline();
    const interventions = [new Intervention(10, 2000)];
    const traj = DailyParams.makeparamtrajectory(b, interventions, 20);
    assert.strictEqual(traj.length, 20);
    assert.strictEqual(traj[15].calories, 2000);
    
    // Check path where args.length >= 2 and args[0] is array
    const traj2 = DailyParams.makeparamtrajectory(b, [new Intervention(5, 1000)], 10);
    assert.strictEqual(traj2[7].calories, 1000);
});
