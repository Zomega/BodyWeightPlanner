import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import BodyModel from './bodymodel.js';
import DailyParams from './dailyparams.js';

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
