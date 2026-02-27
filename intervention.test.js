import { test } from 'node:test';
import assert from 'node:assert';
import Intervention from './intervention.js';
import Baseline from './baseline.js';

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
    // Title check
    const goal = Intervention.forgoal(b, 65, 180, 0, 0, 0.001);
    assert.strictEqual(goal.title, 'Goal Intervention');
});
