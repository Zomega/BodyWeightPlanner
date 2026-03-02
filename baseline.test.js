import { test } from 'node:test';
import assert from 'node:assert';
import Baseline from './baseline.js';
import { MSJ, Hall, BMI, Defaults } from './constants.js';

const MSJ_SEX_DIFFERENCE = MSJ.MALE_OFFSET - MSJ.FEMALE_OFFSET; // 166.0

test('Baseline RMR calculation - Mifflin-St Jeor SEX relationship', (_t) => {
  const age = 23.5;
  const height = 180.5;
  const weight = 70.5;

  const bMale = new Baseline(true, age, height, weight, 18, 1700, 1.6, false, true);
  const bFemale = new Baseline(false, age, height, weight, 18, 1700, 1.6, false, true);

  const rmrMale = bMale.getRMR();
  const rmrFemale = bFemale.getRMR();

  assert.strictEqual(rmrMale.toFixed(3), '1721.800');
  assert.strictEqual(rmrFemale.toFixed(3), '1555.800');
  assert.strictEqual(rmrMale - rmrFemale, MSJ_SEX_DIFFERENCE);
});

test('getNewRMR - consistency with aging and weight change', (_t) => {
  const bMale = new Baseline(true, 23, 180, 70, 18, 1716.14, 1.6, false, false);

  // day 365 = 1 year later. age 23 -> 24. weight 70 -> 75
  const rmrNew = bMale.getNewRMR(75, Hall.DAYS_PER_YEAR);
  assert.strictEqual(rmrNew.toFixed(2), '1761.17');

  // Test non-integer days/weights to kill more mutants
  const rmrNew2 = bMale.getNewRMR(72.5, 182.5); // 0.5 years
  assert.strictEqual(rmrNew2.toFixed(3), '1738.655');
});

test('Baseline BFP calculation - MSJ SEX relationship', (_t) => {
  const bMale = new Baseline(true, 23, 180, 70);
  const bFemale = new Baseline(false, 23, 180, 70);

  assert.strictEqual(Math.round(bMale.getBFP()), 14);
  assert.strictEqual(Math.round(bFemale.getBFP()), 24);
});

test('Baseline Maintenance - TEE/PAL relationship', (_t) => {
  const pal = 1.6;
  const b = new Baseline(true, 23, 180, 70, 18, 1716.14, pal);

  const rmr = b.getRMR();
  const tee = b.getTEE();
  const maint = b.getMaintCals();
  const actExpend = b.getActivityExpenditure();

  assert.strictEqual(tee, rmr * pal, 'TEE should be RMR * PAL');
  assert.strictEqual(maint, tee, 'Maintenance should equal TEE');
  assert.strictEqual(actExpend, tee - rmr, 'Activity should be TEE - RMR');
});

test('Baseline Healthy Weight Range - BMI consistency', (_t) => {
  const height = 180;
  const b = new Baseline(true, 23, height, 70);
  const range = b.getHealthyWeightRange();

  // Verify that the range boundaries correspond to healthy BMI thresholds
  assert.strictEqual(b.getNewBMI(range.low), 18.51851851851852);
  assert.strictEqual(b.getNewBMI(range.high), 25);
});

test('Manual RMR and BFP modes - toggle logic', (_t) => {
  const manualRMR = 2000;
  const manualBFP = 25;
  const b = new Baseline(true, 23, 180, 70, 18, manualRMR, 1.6);

  b.setCalculatedRMR(false);
  b.rmr = manualRMR;
  assert.strictEqual(b.getRMR(), manualRMR);

  b.setCalculatedBFP(false);
  b.bfp = manualBFP;
  assert.strictEqual(b.getBFP(), manualBFP);

  // Verify toggle back to auto-calc uses MSJ again (1716.14)
  b.setCalculatedRMR(true);
  assert.strictEqual(b.rmr.toFixed(2), '1716.14');

  // Verify toggle back to auto-calc uses BFP formula again (13.93)
  b.setCalculatedBFP(true);
  assert.strictEqual(b.bfp.toFixed(2), '13.93');
});

test('ECW calculations - SEX and aging relationships', (_t) => {
  const bMale = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  const bFemale = new Baseline(false, 23, 180, 70, 18, 1716, 1.6, false, false);

  // Initial values
  assert.strictEqual(bMale.getECW().toFixed(3), '18.771');
  assert.strictEqual(bFemale.getECW().toFixed(3), '18.454');

  // Aging effect: 0.025 per year for males
  const ecwNew = bMale.getNewECW(Hall.DAYS_PER_YEAR, 70);
  assert.strictEqual((ecwNew - bMale.getECW()).toFixed(3), '0.025');

  // Female aging check (no age dependency in formula)
  const ecwNewF = bFemale.getNewECW(Hall.DAYS_PER_YEAR, 70);
  assert.strictEqual(ecwNewF, bFemale.getECW());
});

test('Weight metrics (Fat/Lean) - proportionality', (_t) => {
  const weight = 100;
  const fatPercent = 20;
  const b = new Baseline(true, 23, 180, weight, fatPercent, 1716, 1.6, false, false);

  assert.strictEqual(b.getFatWeight(), weight * (fatPercent / 100));
  assert.strictEqual(b.getLeanWeight(), weight - b.getFatWeight());
});

test('Sodium and Glycogen metrics - proportionality', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  const maint = b.getMaintCals();
  const halfMaint = maint * 0.5;

  // proportionalSodium: (sodium * halfMaint) / maint = sodium * 0.5
  assert.strictEqual(b.proportionalSodium(halfMaint), b.sodium * 0.5);

  // carbsIn: (carbIntakePct / 100) * maint
  assert.strictEqual(b.getCarbsIn(), (b.carbIntakePct / 100) * maint);
});

test('Baseline - body composition and weight decomposition', () => {
  const b = new Baseline(true, 23, 180, 100, 20, 1716, 1.6, false, false);
  const comp = b.getBodyComposition();

  // fat = 20, lean = 80, decw = 0
  assert.deepStrictEqual(comp, [20, 80, 0]);

  // getNewWeight arithmetic
  assert.strictEqual(b.getNewWeight(20, 80, 0.6, 5).toFixed(2), '105.37');
});

test('Baseline - MSJ gender coefficients', () => {
  const common = [23, 180, 70];
  const bMale = new Baseline(true, ...common);
  const bFemale = new Baseline(false, ...common);

  assert.strictEqual(bMale.getRMR() - bFemale.getRMR(), 166);

  const b = new Baseline(true, ...common);
  assert.strictEqual(b.isMale, true);
});

test('Baseline - stability equation arithmetic', () => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);

  const cals = 2000;
  const res = b.glycogenEquation(cals);
  assert.strictEqual(res.toFixed(4), '0.4267');

  const decw = b.deltaECWEquation(cals);
  assert.strictEqual(decw.toFixed(4), '-0.7242');
});

test('Baseline - weight decomposition arithmetic', () => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  const nw = b.getNewWeight(10, 50, 0.6, 2);
  assert.strictEqual(nw.toFixed(2), '62.37');

  const nwLeanMutant = 10 - 50 + Hall.GLYCOGEN_WATER_COEFF * (0.6 - Defaults.GLYCOGEN) + 2;
  assert.notStrictEqual(nw, nwLeanMutant);
});

test('Steady state / stability equations - precision logic', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  const caloricIntake = 2000;

  assert.strictEqual(b.glycogenEquation(caloricIntake).toFixed(4), '0.4267');
  assert.strictEqual(b.deltaECWEquation(caloricIntake).toFixed(4), '-0.7242');

  const ssWeight = b.getStableWeight(10, 50, caloricIntake);
  assert.strictEqual(ssWeight.toFixed(4), '59.0048');
});

test('getK precision', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716.14, 1.6);
  assert.strictEqual(b.getK().toFixed(3), '-24.947');
});

test('Calculated flags false branch', (_t) => {
  const b = new Baseline(true, 23, 180, 70, 18, 1716, 1.6, false, false);
  b.bfp = 25;
  b.rmr = 2000;
  assert.strictEqual(b.getBFP(), 25);
  assert.strictEqual(b.getRMR(), 2000);
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
  const b = new Baseline(true, Symbol('23'), 180, 70);
  assert.strictEqual(b.age, Defaults.AGE);
});

test('Baseline - toPhysiologicalState', () => {
  const b = new Baseline(true, 23, 180, 70);
  const state = b.toPhysiologicalState();
  assert.strictEqual(state.height, 180);
  assert.strictEqual(state.isMale, true);
  assert.strictEqual(state.initialGlycogen, 0.5);
});
