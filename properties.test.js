import { test } from 'node:test';
import fc from 'fast-check';
import { BMIUtils } from './bmi-utils.js';
import { PALCalculator } from './pal-calculator.js';
import Baseline from './baseline.js';
import BodyModel from './bodymodel.js';
import DailyParams from './dailyparams.js';
import { Hall, Limits, Defaults, Domains } from './constants.js';

test('BMI Property: Should always be non-negative for positive inputs', () => {
  fc.assert(
    fc.property(
      fc.double({ ...Domains.HUMAN.WEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.HEIGHT, noNaN: true, noDefaultInfinity: true }),
      (w, h) => {
        const bmi = BMIUtils.calculate(w, h);
        return bmi >= 0;
      }
    )
  );
});

test('BMI Property: Increasing weight at fixed height increases BMI', () => {
  fc.assert(
    fc.property(
      fc.double({ ...Domains.HUMAN.WEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.WEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.HEIGHT, noNaN: true, noDefaultInfinity: true }),
      (w1, w2, h) => {
        const weight1 = Math.min(w1, w2);
        const weight2 = Math.max(w1, w2);
        if (weight1 === weight2) return true;

        const bmi1 = BMIUtils.calculate(weight1, h);
        const bmi2 = BMIUtils.calculate(weight2, h);
        return bmi2 > bmi1;
      }
    )
  );
});

test('PAL Property: Should always be clamped between limits', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          met: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          duration: fc.double({ min: 0, max: 1440, noNaN: true, noDefaultInfinity: true }),
          frequency: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          period: fc.double({ min: 0.1, max: 365, noNaN: true, noDefaultInfinity: true }),
        })
      ),
      (activities) => {
        const pal = PALCalculator.calculateAdvanced(activities);
        return pal >= Limits.MIN_PAL_ADVANCED && pal <= Limits.MAX_PAL_ADVANCED;
      }
    )
  );
});

test('Baseline Property: RMR should be positive for realistic human ranges', () => {
  fc.assert(
    fc.property(
      fc.boolean(),
      fc.double({ ...Domains.HUMAN.AGE, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.HEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.WEIGHT, noNaN: true, noDefaultInfinity: true }),
      (isMale, age, height, weight) => {
        const b = new Baseline(isMale, age, height, weight);
        const rmr = b.getRMR();
        return rmr >= Limits.MIN_RMR;
      }
    )
  );
});

test('BodyModel Property: Simulation stability (Realistic Human Domain)', () => {
  fc.assert(
    fc.property(
      fc.double({ ...Domains.HUMAN.HEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.WEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.HUMAN.CALORIES, noNaN: true, noDefaultInfinity: true }),
      fc.integer({ min: 1, max: 365 }),
      (height, weight, calories, duration) => {
        const b = new Baseline(true, 30, height, weight);
        const physState = b.toPhysiologicalState();
        const params = new DailyParams(
          calories,
          Defaults.CARB_INTAKE_PCT,
          Defaults.SODIUM,
          b.getActivityParam()
        );
        const model = BodyModel.projectFromPhysState(physState, params, duration);
        const finalWeight = model.getWeight(physState);

        return !isNaN(finalWeight) && isFinite(finalWeight) && finalWeight >= 0;
      }
    ),
    { numRuns: 100 }
  );
});

test('BodyModel Property: Numerical Robustness (Extreme Domain)', () => {
  fc.assert(
    fc.property(
      fc.double({ ...Domains.ROBUSTNESS.HEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.ROBUSTNESS.WEIGHT, noNaN: true, noDefaultInfinity: true }),
      fc.double({ ...Domains.ROBUSTNESS.CALORIES, noNaN: true, noDefaultInfinity: true }),
      fc.integer({ min: 1, max: 100 }), // Shorter duration for robustness
      (height, weight, calories, duration) => {
        const b = new Baseline(true, 30, height, weight);
        const physState = b.toPhysiologicalState();
        const params = new DailyParams(
          calories,
          Defaults.CARB_INTAKE_PCT,
          Defaults.SODIUM,
          b.getActivityParam()
        );
        const model = BodyModel.projectFromPhysState(physState, params, duration);
        const finalWeight = model.getWeight(physState);

        // Even with garbage inputs, the engine should never produce NaN/Infinity
        return !isNaN(finalWeight) && isFinite(finalWeight);
      }
    ),
    { numRuns: 100 }
  );
});

test('Baseline Fuzzing: Should handle garbage data without crashing', () => {
  fc.assert(
    fc.property(
      fc.anything(),
      fc.anything(),
      fc.anything(),
      fc.anything(),
      (isMale, age, height, weight) => {
        const b = new Baseline(isMale, age, height, weight);
        const rmr = b.getRMR();
        const bmi = b.getBMI();
        return !isNaN(rmr) && !isNaN(bmi);
      }
    )
  );
});
