import { test } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { BMIUtils } from './bmi-utils.js';
import { PALCalculator } from './pal-calculator.js';
import Baseline from './baseline.js';
import BodyModel from './bodymodel.js';

test('BMI Property: Should always be non-negative for positive inputs', () => {
  fc.assert(
    fc.property(fc.double({ min: 0.1, max: 500 }), fc.double({ min: 10, max: 300 }), (weight, height) => {
      const bmi = BMIUtils.calculate(weight, height);
      return bmi >= 0 && !isNaN(bmi) && isFinite(bmi);
    })
  );
});

test('BMI Property: Increasing weight at fixed height increases BMI', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 1, max: 500 }),
      fc.double({ min: 1, max: 500 }),
      fc.double({ min: 50, max: 250 }),
      (w1, w2, h) => {
        const weight1 = Math.min(w1, w2);
        const weight2 = Math.max(w1, w2);
        const bmi1 = BMIUtils.calculate(weight1, h);
        const bmi2 = BMIUtils.calculate(weight2, h);
        return bmi2 >= bmi1;
      }
    )
  );
});

test('PAL Property: Should always be clamped between 1.1 and 3.0', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          met: fc.double({ min: 0, max: 25 }),
          duration: fc.double({ min: 0, max: 1440 }),
          frequency: fc.double({ min: 0, max: 7 }),
          period: fc.double({ min: 1, max: 30 }),
        })
      ),
      (activities) => {
        const pal = PALCalculator.calculateAdvanced(activities);
        return pal >= 1.1 && pal <= 3.0;
      }
    )
  );
});

test('Baseline Property: RMR should be positive for realistic human ranges', () => {
  fc.assert(
    fc.property(
      fc.boolean(), // isMale
      fc.double({ min: 1, max: 120 }), // age
      fc.double({ min: 50, max: 250 }), // height
      fc.double({ min: 2, max: 300 }), // weight
      (isMale, age, height, weight) => {
        const b = new Baseline(isMale, age, height, weight);
        const rmr = b.getRMR();
        return rmr > 0 && isFinite(rmr);
      }
    )
  );
});

test('BodyModel Property: Simulation should not produce NaN or Infinity', () => {
  fc.assert(
    fc.property(
      fc.boolean(), // isMale
      fc.double({ min: 18, max: 100 }), // age
      fc.double({ min: 100, max: 220 }), // height
      fc.double({ min: 40, max: 200 }), // weight
      fc.double({ min: 1000, max: 5000 }), // calories
      fc.integer({ min: 1, max: 365 }), // days
      (isMale, age, height, weight, cals, days) => {
        const b = new Baseline(isMale, age, height, weight);
        const intervention = {
          calories: cals,
          carbinpercent: 50,
          sodium: 4000,
          getAct: (base) => base.getActivityParam(),
        };
        const finalModel = BodyModel.projectFromBaselineViaIntervention(b, intervention, days);
        const finalWeight = finalModel.getWeight(b);
        return !isNaN(finalWeight) && isFinite(finalWeight);
      }
    )
  );
});

test('Baseline Fuzzing: Should handle garbage data without crashing or returning NaN', () => {
  fc.assert(
    fc.property(
      fc.anything(), // isMale
      fc.anything(), // age
      fc.anything(), // height
      fc.anything(), // weight
      (isMale, age, height, weight) => {
        const b = new Baseline(isMale, age, height, weight);
        const rmr = b.getRMR();
        const bmi = b.getBMI();
        return !isNaN(rmr) && !isNaN(bmi);
      }
    )
  );
});
