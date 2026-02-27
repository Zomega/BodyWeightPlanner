import { test } from 'node:test';
import assert from 'node:assert';
import Intervention from './intervention.js';
import Baseline from './baseline.js';
import BodyModel from './bodymodel.js';

test('Intervention constructor constraints', () => {
    const int = new Intervention(10, -500, 150, -200, 60000);
    assert.strictEqual(int.day, 10);
    assert.strictEqual(int.calories, 0); // Math.max(0, -500)
    assert.strictEqual(int.carbinpercent, 100); // Math.min(100, 150)
    assert.strictEqual(int.actchangepercent, -100); // Math.max(-100, -200)
    assert.strictEqual(int.sodium, 50000); // Math.min(50000, 60000)
    assert.strictEqual(int.title, '');
});

test('Intervention.getAct logic', () => {
    const b = new Baseline(true, 23, 180, 70);
    const actParam = b.getActivityParam();
    
    const intAdd = new Intervention(0, 2000, 50, 50); // +50%
    assert.strictEqual(intAdd.getAct(b), actParam * 1.5);
    
    const intSub = new Intervention(0, 2000, 50, -50); // -50%
    assert.strictEqual(intSub.getAct(b), actParam * 0.5);
});

test('Intervention.setproportionalsodium', () => {
    const b = new Baseline(true, 23, 180, 70);
    const maint = b.getMaintCals();
    const int = new Intervention(0, maint * 0.5); // 50% of maint cals
    int.setproportionalsodium(b);
    assert.strictEqual(int.sodium, b.sodium * 0.5);
});

test('Intervention.forgoal edge cases', () => {
    const b = new Baseline(true, 23, 180, 70);
    const maint = b.getMaintCals();
    
    // Case: weight matches AND actchange is 0
    const goalSame = Intervention.forgoal(b, 70, 100, 0, 0, 0.001);
    assert.strictEqual(goalSame.calories, maint);
    assert.strictEqual(goalSame.title, 'Goal Intervention');

    // Case: weight matches BUT actchange is NOT 0
    // If activity increases, we need MORE calories to maintain weight
    const goalSameAct = Intervention.forgoal(b, 70, 100, 10, 0, 0.001);
    assert.ok(goalSameAct.calories > maint);
});

test('Intervention.forgoal search logic precision', () => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.4, false, false);
    const maint = b.getMaintCals();
    const eps = 0.0001;
    
    // Test goal above starting weight
    const goalGain = Intervention.forgoal(b, 75, 100, 0, 0, eps);
    assert.ok(goalGain.calories > maint, 'Gain requires surplus');
    
    // Test that eps is actually respected
    const starv = BodyModel.projectFromBaselineViaIntervention(b, goalGain, 100);
    assert.ok(Math.abs(starv.getWeight(b) - 75) <= eps, 'Should reach goal within epsilon');
});

test('Intervention.forgoal unachievable starvation', () => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.4, false, false);
    // If goal weight is already reached but we set mincals very high
    // Actually, starvation check is: if (error < eps || goalwt <= starvwt)
    // where starvwt is weight after goaltime at MINCALS.
    // If goalwt is 100kg but maintenance only gets us to 80kg in 10 days, error logic applies.
    assert.throws(() => {
        Intervention.forgoal(b, 10, 1, 0, 2000, 0.001); // Can't drop to 10kg in 1 day with 2000 cals
    }, /Unachievable Goal/);
});
