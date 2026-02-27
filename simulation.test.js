import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import BodyModel, { BodyChange } from './bodymodel.js';
import DailyParams from './dailyparams.js';
import * as Physiology from './physiology.js';
import { Hall } from './constants.js';

const createSimBaseline = () => new Baseline(true, 23, 180, 100, 30, 2000, 1.4);

test('BodyModel simulation - Monotonicity under deficit', (_t) => {
  const b = createSimBaseline();
  let model = BodyModel.createFromBaseline(b);

  // Calculate cals for balance
  const equilibriumCals = model.cals4balance(b, b.getActivityParam());
  const deficitCals = equilibriumCals - 500;
  const params = new DailyParams(deficitCals, 50, 4000, b.getActivityParam());

  let lastWeight = model.getWeight(b);

  // Simulate 10 days and verify weight is strictly decreasing (monotonicity)
  for (let i = 0; i < 10; i++) {
    model = BodyModel.RungeKatta(model, b, params);
    const currentWeight = model.getWeight(b);
    assert.ok(currentWeight < lastWeight, `Weight should decrease at day ${i + 1}`);
    lastWeight = currentWeight;
  }
});

test('BodyModel simulation - Stability at equilibrium', (_t) => {
  const b = createSimBaseline();
  const model = BodyModel.createFromBaseline(b);

  const equilibriumCals = model.cals4balance(b, b.getActivityParam());
  const params = new DailyParams(equilibriumCals, b.carbIntakePct, b.sodium, b.getActivityParam());

  // At equilibrium, the derivatives should be zero
  const change = model.dt(b, params);

  const EPSILON = 1e-10;
  assert.ok(Math.abs(change.df) < EPSILON, 'Fat change should be zero at equilibrium');
  assert.ok(Math.abs(change.dl) < EPSILON, 'Lean change should be zero at equilibrium');
});

test('BodyModel - Utility invariants', (_t) => {
  const b = new Baseline(true, 23, 180, 80, 20, 1716, 1.6, false, false);
  const fat = 16;
  const lean = 64;
  const decw = 2.5;
  const model = new BodyModel(fat, lean, 0.5, decw, 384);

  const weight = model.getWeight(b);

  // Invariant: weight = fat + lean + glycogenH2O + decw
  // Invariant: FatFree = weight - fat
  assert.strictEqual(model.getFatFree(b), weight - fat);
  assert.strictEqual(model.getFatPercent(b), (fat / weight) * 100.0);

  // Invariant: approxWeight = fat + lean + decw
  assert.strictEqual(model.getapproxWeight(), fat + lean + decw);
});

test('BodyModel - BMI and weight invariants', () => {
  const b = createSimBaseline();
  const model = BodyModel.createFromBaseline(b);

  // Test getBMI explicitly
  assert.strictEqual(model.getBMI(b), b.getBMI());

  // Test getWeight sign for decw
  const modelWithDecw = new BodyModel(10, 50, 0.5, 5, 0);
  // Weight = 10 + 50 + 0 + 5 = 65. If - decw, result 55.
  assert.strictEqual(modelWithDecw.getWeight(b), 65);
});

test('BodyModel - simulation loop boundaries', () => {
  const b = createSimBaseline();
  const params = DailyParams.createFromBaseline(b);

  // 1 day should have EXACTLY 1 step of change.
  // If mutant is <=, it will do 2 steps.
  const start = BodyModel.createFromBaseline(b);
  const end = BodyModel.projectFromBaseline(b, params, 1);

  const step1 = BodyModel.RungeKatta(start, b, params);
  assert.strictEqual(end.fat, step1.fat, '1-day simulation should equal exactly 1 RungeKatta step');
});

test('BodyModel - physics operator verification', () => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  const model = BodyModel.createFromBaseline(b);
  const params = new DailyParams(2000, 50, 4000, 10);

  // Na_imbal: sodium - baseline.sodium - Hall.SODIUM_WATER_COEFF * decw - Hall.SODIUM_CARB_COEFF * (1 - carbRatio)
  assert.ok(model.Na_imbal(b, params) < 0);

  // dfdt and dldt: check they use the same base (cals - TEE - carbflux)
  const df = model.dfdt(b, params);
  const dl = model.dldt(b, params);
  assert.ok(df < 0 && dl < 0, 'Deficit should lead to fat and lean loss');

  // Verify K factor default param (deltaE)
  const kDefault = Physiology.calculateKFactor(2500, 60, 10, 10, 70);
  assert.ok(!isNaN(kDefault));

  // Verify RMR clamping
  const lowRMR = Physiology.calculateRMR(1, 1, 100, true);
  assert.strictEqual(lowRMR, 500);

  // Verify BFP clamping
  const lowBFP = Physiology.calculateBFP(1, 100, true);
  assert.strictEqual(lowBFP, 0);
  const highBFP = Physiology.calculateBFP(100, 20, false);
  assert.strictEqual(highBFP, 60);
});

test('BodyModel - avgdt_weighted array mutants', () => {
  const model = new BodyModel();
  const change = new BodyChange(1, 1, 1, 1, 1);

  // Test empty weight array (mutant might delete it)
  const avg = model.avgdt_weighted([], [change]);
  assert.strictEqual(avg.df, 1, 'Empty weight array should default to 1');

  // Test wtsum = 0 case
  // Note: implementation has "wt[i] || 1", so passing [0] actually uses weight 1.
  const avgZero = model.avgdt_weighted([0], [change]);
  assert.strictEqual(avgZero.df, 1, 'Weight of 0 should fall back to 1');
});

test('BodyModel - avgdt_weighted logical boundaries', (_t) => {
  const model = new BodyModel();
  const change1 = new BodyChange(1, 1, 1, 1, 1);
  const change2 = new BodyChange(3, 3, 3, 3, 3);

  // Equal weights: average should be (1+3)/2 = 2
  const avg = model.avgdt_weighted([1, 1], [change1, change2]);
  assert.strictEqual(avg.df, 2);

  // Weighted average: [1, 3] -> (1*1 + 3*3) / 4 = 10 / 4 = 2.5
  const weightedAvg = model.avgdt_weighted([1, 3], [change1, change2]);
  assert.strictEqual(weightedAvg.df, 2.5);

  // Negative weight should be treated as 1
  const negAvg = model.avgdt_weighted([-10], [change1]);
  assert.strictEqual(negAvg.df, 1);
});

test('BodyModel - RK4 weights invariant', () => {
  const model = new BodyModel();
  const weightSum = model.RK4wt.reduce((a, b) => a + b, 0);
  assert.strictEqual(weightSum, 6, 'RK4 weights [1,2,2,1] must sum to 6');
});
