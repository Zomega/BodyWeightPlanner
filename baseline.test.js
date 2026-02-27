import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';

test('Baseline RMR calculation (Male)', (_t) => {
  // 9.99 * 70 + 625.0 * 1.8 - 4.92 * 23 + 5.0
  // 699.3 + 1125 - 113.16 + 5 = 1716.14
  const b = new Baseline(true, 23, 180, 70);
  const rmr = b.getRMR();
  assert.strictEqual(Math.round(rmr), 1716);
  // Specifically verify the +5 constant vs -161
  const b2 = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  b2.rmrCalc = true;
  assert.strictEqual(b2.getRMR().toFixed(2), '1716.14');
});

test('Baseline RMR calculation (Female)', (_t) => {
  // 9.99 * 70 + 625.0 * 1.8 - 4.92 * 23 - 161.0
  // 699.3 + 1125 - 113.16 - 161 = 1550.14
  const b = new Baseline(false, 23, 180, 70);
  const rmr = b.getRMR();
  assert.strictEqual(Math.round(rmr), 1550);
  assert.strictEqual(rmr.toFixed(2), '1550.14');
});

test('getNewRMR (Male and Female)', (_t) => {
  const bMale = new Baseline(true, 23, 180, 70);
  const bFemale = new Baseline(false, 23, 180, 70);
  
  // day 365 = 1 year later. age 23 -> 24.
  // Male: 9.99 * 75 + 1125 - 4.92 * 24 + 5 = 749.25 + 1125 - 118.08 + 5 = 1761.17
  assert.strictEqual(Math.round(bMale.getNewRMR(75, 365)), 1761);
  
  // Female: 9.99 * 75 + 1125 - 4.92 * 24 - 161 = 749.25 + 1125 - 118.08 - 161 = 1595.17
  assert.strictEqual(Math.round(bFemale.getNewRMR(75, 365)), 1595);
});

test('Baseline BFP calculation', (_t) => {
  const bMale = new Baseline(true, 23, 180, 70);
  const bFemale = new Baseline(false, 23, 180, 70);
  
  // BMI = 70 / 1.8^2 = 21.6049
  assert.strictEqual(Math.round(bMale.getBFP()), 14);
  assert.strictEqual(Math.round(bFemale.getBFP()), 24);
});

test('Baseline Maintenance and Expenditure', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6);
  // RMR = 1716.14, PAL = 1.6
  // TEE = 1716.14 * 1.6 = 2745.824
  assert.strictEqual(Math.round(b.getTEE()), 2746);
  assert.strictEqual(Math.round(b.getMaintCals()), 2746);
  // Activity Expenditure = TEE - RMR = 2745.824 - 1716.14 = 1029.684
  assert.strictEqual(Math.round(b.getActivityExpenditure()), 1030);

  // getActivityParam: (0.9 * RMR * PAL - RMR) / weight
  // (0.9 * 1716.14 * 1.6 - 1716.14) / 70
  // (2471.2416 - 1716.14) / 70 = 755.1016 / 70 = 10.787...
  assert.strictEqual(b.getActivityParam().toFixed(4), '10.7872');
});

test('Baseline Healthy Weight Range', (_t) => {
  const b = new Baseline(true, 23, 180, 70);
  const range = b.getHealthyWeightRange();
  assert.strictEqual(range.low, 60);
  assert.strictEqual(range.high, 81);
});

test('Manual RMR and BFP modes', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1708, 1.6);
  b.setCalculatedRMR(false);
  b.rmr = 2000;
  assert.strictEqual(b.getRMR(), 2000);
  
  b.setCalculatedBFP(false);
  b.bfp = 25;
  assert.strictEqual(b.getBFP(), 25);
  
  // Toggle back
  b.setCalculatedRMR(true);
  assert.strictEqual(Math.round(b.rmr), 1716);
  b.setCalculatedBFP(true);
  assert.strictEqual(Math.round(b.bfp), 14);
});

test('ECW calculations', (_t) => {
  const bMale = new Baseline(true, 23, 180, 70);
  const bFemale = new Baseline(false, 23, 180, 70);
  
  assert.strictEqual(bMale.getECW().toFixed(2), '18.77');
  assert.strictEqual(bFemale.getECW().toFixed(2), '18.45');
  
  // New ECW
  // Male day 365, weight 75: 0.025 * 24 + 9.57 * 1.8 + 0.191 * 75 - 12.4 = 0.6 + 17.226 + 14.325 - 12.4 = 19.751
  assert.strictEqual(bMale.getNewECW(365, 75).toFixed(2), '19.75');
  // Female weight 75: -4.0 + 5.98 * 1.8 + 0.167 * 75 = -4.0 + 10.764 + 12.525 = 19.289
  assert.strictEqual(bFemale.getNewECW(365, 75).toFixed(2), '19.29');
});

test('BMI metrics', (_t) => {
  const b = new Baseline(true, 23, 180, 70);
  assert.strictEqual(b.getBMI().toFixed(2), '21.60');
  assert.strictEqual(b.getNewBMI(80).toFixed(2), '24.69');
});

test('Weight metrics (Fat/Lean)', (_t) => {
  const b = new Baseline(true, 23, 180, 100, 20); // 100kg, 20% fat
  b.setCalculatedBFP(false);
  b.bfp = 20;
  assert.strictEqual(b.getFatWeight(), 20);
  assert.strictEqual(b.getLeanWeight(), 80);
  
  b.bfp = 30;
  assert.strictEqual(b.getFatWeight(), 30);
  assert.strictEqual(b.getLeanWeight(), 70);

  // Check the division by 100 logic explicitly
  const bSmall = new Baseline(true, 23, 180, 1, 50, 1716, 1.6, false, false);
  // (1 * 50) / 100 = 0.5
  assert.strictEqual(bSmall.getFatWeight(), 0.5);
});

test('Baseline default isMale', () => {
    const b = new Baseline();
    assert.strictEqual(b.isMale, true);
});

test('Sodium and Glycogen metrics', (_t) => {
  const b = new Baseline(true, 23, 180, 70);
  b.sodium = 3000;
  assert.strictEqual(Math.round(b.proportionalSodium(2000)), 2185);
  assert.strictEqual(b.getGlycogenH2O(0.6).toFixed(2), '0.37');
  assert.strictEqual(b.getCarbsIn().toFixed(0), '1373'); // 50% of 2746
});

test('Baseline physics and composition', (_t) => {
    const b = new Baseline(true, 23, 180, 70);
    assert.ok(!isNaN(b.getK()), 'K should be a number');
    assert.strictEqual(b.getTherm().toFixed(0), '384'); // 0.14 * 2746
    
    const comp = b.getBodyComposition();
    assert.strictEqual(comp.length, 3);
    assert.strictEqual(comp[2], 0); // dECW init 0
    
    // getNewWeight
    const nw = b.getNewWeight(10, 50, 0.5, 2); // 10 fat + 50 lean + 3.7*(0.5-0.5) + 2 ECW = 62
    assert.strictEqual(nw, 62);
    
    // getNewWeightFromBodyModel
    const nwModel = b.getNewWeightFromBodyModel({ fat: 15, lean: 55, glycogen: 0.6, decw: 1 });
    // 15 + 55 + 3.7*(0.6-0.5) + 1 = 71.37
    assert.strictEqual(nwModel.toFixed(2), '71.37');
});

test('Steady state / stability equations', (_t) => {
    const b = new Baseline(true, 23, 180, 70);
    const ssWeight = b.getStableWeight(10, 50, 2000);
    assert.ok(ssWeight > 0);
});

test('getNewAct', (_t) => {
    const b = new Baseline();
    assert.strictEqual(b.getNewAct(null), null);
    const mockIntervention = { getAct: (base) => base.pal + 0.2 };
    assert.strictEqual(b.getNewAct(mockIntervention), 1.8);
});

test('getNewTEE', (_t) => {
    const b = new Baseline();
    const mockModel = { getTEE: () => 2500 };
    assert.strictEqual(b.getNewTEE(mockModel, {}), 2500);
});

test('Baseline constructor safeNum catch', (_t) => {
    // Passing a Symbol should trigger the catch block in safeNum
    const b = new Baseline(true, Symbol('23'), 180, 70);
    assert.strictEqual(b.age, 23); // Should fall back to INITIAL_AGE
});
