import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import BodyModel, { BodyChange } from './bodymodel.js';
import DailyParams from './dailyparams.js';
import Intervention from './intervention.js';

test('BodyModel simulation - Weight loss stability', (_t) => {
  const b = new Baseline(true, 23, 180, 100, 30, 2000, 1.4);
  const startWeight = b.weight;

  const params = new DailyParams(2000, 50, 4000, b.getActivityParam());

  let model = BodyModel.createFromBaseline(b);

  for (let i = 0; i < 90; i++) {
    model = BodyModel.RungeKatta(model, b, params);
  }

  const endWeight = model.getWeight(b);
  assert.ok(endWeight < startWeight);
  assert.ok(endWeight > 70); 
});

test('BodyModel simulation - Maintenance stability', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  const startWeight = b.weight;

  const params = DailyParams.createFromBaseline(b);

  let model = BodyModel.createFromBaseline(b);

  for (let i = 0; i < 30; i++) {
    model = BodyModel.RungeKatta(model, b, params);
  }

  const endWeight = model.getWeight(b);
  assert.ok(Math.abs(endWeight - startWeight) < 0.1);
});

test('BodyModel - Utility methods', (_t) => {
    const b = new Baseline(true, 23, 180, 80, 20, 1716, 1.6, false, false);
    const model = new BodyModel(16, 64, 0.5, 2.5, 384); // fat, lean, gly, decw, therm
    
    // Weight: 16 + 64 + 3.7*(0.5-0.5) + 2.5 = 82.5
    assert.strictEqual(model.getWeight(b), 82.5);
    assert.strictEqual(model.getapproxWeight(), 82.5);
    assert.strictEqual(model.getFatFree(b), 66.5);
    assert.strictEqual(model.getFatPercent(b), (16/82.5)*100.0);
    assert.strictEqual(model.getBMI(b), 82.5 / Math.pow(1.8, 2));
});

test('BodyModel - projectFromBaseline loop count', () => {
    const b = new Baseline();
    const params = DailyParams.createFromBaseline(b);
    
    // 0 days should return initial state
    const model0 = BodyModel.projectFromBaseline(b, params, 0);
    assert.strictEqual(model0.fat, b.getFatWeight());
    
    // 1 day should return changed state
    const deficit = new DailyParams(1000, 50, 4000, b.getActivityParam());
    const modelDeficit = BodyModel.projectFromBaseline(b, deficit, 1);
    assert.notStrictEqual(modelDeficit.fat, b.getFatWeight());
});

test('BodyModel - RungeKatta weights check', () => {
    const b = new Baseline();
    const model = BodyModel.createFromBaseline(b);
    assert.deepStrictEqual(model.RK4wt, [1, 2, 2, 1]);
});

test('BodyModel - derivatives check', () => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
    const model = BodyModel.createFromBaseline(b);
    const params = DailyParams.createFromBaseline(b);
    
    const expectedP = 1.990762711864407 / (1.990762711864407 + model.fat);
    assert.strictEqual(model.getp(), expectedP);
    assert.strictEqual(model.carbflux(b, params), 0);

    const expend = model.getExpend(b, params);
    assert.ok(expend > 0);
    
    const change = model.dt(b, params);
    assert.ok(Math.abs(change.df) < 0.0001);
    assert.ok(Math.abs(change.dl) < 0.0001);
    assert.ok(Math.abs(change.dg) < 0.0001);
    assert.ok(Math.abs(change.dDecw) < 0.0001);
});

test('BodyModel - projectFromBaselineViaIntervention', (_t) => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.4, false, false);
    const intervention = new Intervention(3000, 1.4);
    const finalModel = BodyModel.projectFromBaselineViaIntervention(b, intervention, 5);
    assert.ok(finalModel instanceof BodyModel);
});

test('BodyModel - cals4balance precision', () => {
    const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
    const model = BodyModel.createFromBaseline(b);
    const act = b.getActivityParam();
    const cals = model.cals4balance(b, act);
    
    const params = new DailyParams(cals, b.carbIntakePct, b.sodium, act);
    const change = model.dt(b, params);
    assert.ok(Math.abs(change.df) < 1e-10);
    assert.ok(Math.abs(change.dl) < 1e-10);
});

test('BodyModel - avgdt_weighted edge cases', (_t) => {
    const model = new BodyModel();
    const mockChange = new BodyChange(1, 1, 1, 1, 1);
    const mockChange2 = new BodyChange(2, 2, 2, 2, 2);
    
    const finalDt = model.avgdt_weighted([-1], [mockChange]);
    assert.strictEqual(finalDt.df, 1);
    
    const finalDt2 = model.avgdt_weighted([], [mockChange]);
    assert.strictEqual(finalDt2.df, 1);
    
    const finalDtMulti = model.avgdt_weighted([1, 1], [mockChange, mockChange2]);
    assert.strictEqual(finalDtMulti.df, 1.5);

    const finalDt3 = model.avgdt_weighted([1, 2], []);
    assert.strictEqual(finalDt3.df, 0);
});
