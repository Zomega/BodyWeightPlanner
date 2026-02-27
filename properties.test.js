import { test } from 'node:test';
import fc from 'fast-check';
import { BMIUtils } from './bmi-utils.js';
import { PALCalculator } from './pal-calculator.js';
import Baseline from './baseline.js';
import BodyModel from './bodymodel.js';
import DailyParams from './dailyparams.js';
import { Hall, Limits, Defaults } from './constants.js';

test('BMI Property: Should always be non-negative for positive inputs', () => {
  fc.assert(
    fc.property(fc.double({ min: 0.1, max: 500 }), fc.double({ min: 0.1, max: 300 }), (w, h) => {
      const bmi = BMIUtils.calculate(w, h);
      return bmi >= 0;
    })
  );
});

test('BMI Property: Increasing weight at fixed height increases BMI', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 1, max: 500 }),
      fc.double({ min: 1, max: 500 }),
      fc.double({ min: 1, max: 300 }),
      (w1, w2, h) => {
        if (isNaN(w1) || isNaN(w2) || isNaN(h)) return true;
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

test('PAL Property: Should always be clamped between 1.1 and 3.0', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          met: fc.double({ min: 0, max: 100 }),
          duration: fc.double({ min: 0, max: 1440 }),
          frequency: fc.double({ min: 0, max: 100 }),
          period: fc.double({ min: 0.1, max: 365 }),
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
      fc.double({ min: 1, max: 120 }),
      fc.double({ min: 50, max: 250 }),
      fc.double({ min: 20, max: 300 }),
      (isMale, age, height, weight) => {
        const b = new Baseline(isMale, age, height, weight);
        const rmr = b.getRMR();
        return rmr >= Limits.MIN_RMR;
      }
    )
  );
});

test('BodyModel Property: Simulation should not produce NaN or Infinity', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 100, max: 250 }), // height
      fc.double({ min: 40, max: 300 }), // weight
      fc.double({ min: 1000, max: 8000 }), // calories
      fc.integer({ min: 1, max: 365 }), // duration
      (height, weight, calories, duration) => {
        if (isNaN(height) || isNaN(weight) || isNaN(calories)) return true;
        const b = new Baseline(true, 30, height, weight);
        const params = new DailyParams(calories, Defaults.CARB_INTAKE_PCT, Defaults.SODIUM, b.getActivityParam());
        const model = BodyModel.projectFromBaseline(b, params, duration);
        const finalWeight = model.getWeight(b);
        return !isNaN(finalWeight) && isFinite(finalWeight) && finalWeight > 0;
      }
    ),
    { numRuns: 50 }
  );
});

test('Baseline Fuzzing: Should handle garbage data without crashing or returning NaN', () => {
  fc.assert(
    fc.property(fc.anything(), fc.anything(), fc.anything(), fc.anything(), (isMale, age, height, weight) => {
      const b = new Baseline(isMale, age, height, weight);
      const rmr = b.getRMR();
      const bmi = b.getBMI();
      return !isNaN(rmr) && !isNaN(bmi);
    })
  );
});
