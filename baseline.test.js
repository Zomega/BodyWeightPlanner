import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';

test('Baseline RMR calculation (Male)', (t) => {
    // 9.99 * 70 + 625.0 * 1.8 - 4.92 * 23 + 5.0
    // 699.3 + 1125 - 113.16 + 5 = 1716.14
    const b = new Baseline(true, 23, 180, 70);
    const rmr = b.getRMR();
    assert.strictEqual(Math.round(rmr), 1716);
});

test('Baseline Maintenance Calories', (t) => {
    // 1716.14 * 1.6 = 2745.824
    const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
    const maint = b.getMaintCals();
    assert.strictEqual(Math.round(maint), 2746);
});

test('Baseline Healthy Weight Range', (t) => {
    const b = new Baseline(true, 23, 180, 70);
    const range = b.getHealthyWeightRange();
    // low: 18.5 * (1.8^2) = 59.94 -> 60
    // high: 25 * (1.8^2) = 81
    assert.strictEqual(range.low, 60);
    assert.strictEqual(range.high, 81);
});
