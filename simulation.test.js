import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import BodyModel, { BodyChange } from './bodymodel.js';
import DailyParams from './dailyparams.js';
import Intervention from './intervention.js';

test('BodyModel simulation - Weight loss stability', (_t) => {
  const b = new Baseline(true, 23, 180, 100, 30, 2000, 1.4);
  const startWeight = b.weight;

  // Constant 2000 calorie intake (deficit)
  const params = new DailyParams(2000, 50, 4000, b.getActivityParam());

  let model = BodyModel.createFromBaseline(b);

  // Simulate 90 days
  for (let i = 0; i < 90; i++) {
    model = BodyModel.RungeKatta(model, b, params);
  }

  const endWeight = model.getWeight(b);

  // Should have lost significant weight but remained healthy
  assert.ok(endWeight < startWeight);
  assert.ok(endWeight > 70); // Sanity check
});

test('BodyModel simulation - Maintenance stability', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  const startWeight = b.weight;

  // Intake exactly at maintenance
  const params = DailyParams.createFromBaseline(b);

  let model = BodyModel.createFromBaseline(b);

  // Simulate 30 days
  for (let i = 0; i < 30; i++) {
    model = BodyModel.RungeKatta(model, b, params);
  }

  const endWeight = model.getWeight(b);

  // Should stay within 0.1kg of starting weight
  assert.ok(Math.abs(endWeight - startWeight) < 0.1);
});

test('BodyModel - Utility methods', (_t) => {
    const b = new Baseline(true, 23, 180, 80, 20, 1716, 1.6, false, false);
    const model = BodyModel.createFromBaseline(b);
    
    // fat=16, lean=64, glycogen=0.5, decw=0
    assert.strictEqual(model.getapproxWeight(), 80);
    assert.strictEqual(model.getFatFree(b), 64);
    assert.strictEqual(model.getFatPercent(b), 20);
    assert.strictEqual(model.getBMI(b).toFixed(2), '24.69');
});

test('BodyModel - projectFromBaselineViaIntervention', (_t) => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.4, false, false);
    const intervention = new Intervention(3000, 1.4);
    const finalModel = BodyModel.projectFromBaselineViaIntervention(b, intervention, 5);
    assert.ok(finalModel instanceof BodyModel);
});

test('BodyModel - cals4balance', (_t) => {
    const b = new Baseline(true, 23, 180, 70);
    const model = BodyModel.createFromBaseline(b);
    const cals = model.cals4balance(b, b.getActivityParam());
    assert.ok(cals > 0);
});

test('BodyModel - avgdt_weighted edge cases', (_t) => {
    const model = new BodyModel();
    const mockChange = new BodyChange(1, 1, 1, 1, 1);
    const mockChange2 = new BodyChange(2, 2, 2, 2, 2);
    
    // wt < 0 should be treated as 1
    const finalDt = model.avgdt_weighted([-1], [mockChange]);
    assert.strictEqual(finalDt.df, 1);
    
    // missing wt should be treated as 1
    const finalDt2 = model.avgdt_weighted([], [mockChange]);
    assert.strictEqual(finalDt2.df, 1);
    
    // multiple changes
    const finalDtMulti = model.avgdt_weighted([1, 1], [mockChange, mockChange2]);
    assert.strictEqual(finalDtMulti.df, 1.5);

    // empty bchange
    const finalDt3 = model.avgdt_weighted([1, 2], []);
    assert.strictEqual(finalDt3.df, 0);
});
