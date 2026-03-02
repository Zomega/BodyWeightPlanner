import BodyModel from './bodymodel.js';
import DailyParams from './dailyparams.js';
import * as Physiology from './physiology.js';
import { Solver } from './solver.js';
import { Limits } from './constants.js';

export default class Intervention {
  constructor(
    day = 100,
    calories = 2200.0,
    carbinpercent = 50.0,
    actchangepercent = 0.0,
    sodium = 4000.0
  ) {
    this.calories = Math.max(0, calories);
    this.carbinpercent = Math.max(0, Math.min(100.0, carbinpercent));
    this.sodium = Math.max(0, Math.min(Limits.MAX_SODIUM, sodium));
    this.on = true;
    this.rampon = false;
    this.actchangepercent = Math.max(-100.0, actchangepercent);
    this.day = day;
    this.title = '';
  }

  static forgoal(baseline, goalwt, goaltime, actchangepercent, mincals, eps) {
    const physState = Physiology.createPhysiologicalState(baseline);
    const goalinter = new Intervention();
    goalinter.title = 'Goal Intervention';
    goalinter.day = 1;
    goalinter.calories = mincals;
    goalinter.actchangepercent = actchangepercent;
    goalinter.carbinpercent = baseline.carbIntakePct;
    goalinter.setproportionalsodium(baseline);

    if (baseline.weight === goalwt && actchangepercent === 0) {
      goalinter.calories = baseline.getMaintCals();
      goalinter.setproportionalsodium(baseline);
    } else {
      const starvFn = (cals) => {
        const tempInter = new Intervention(1, cals, baseline.carbIntakePct, actchangepercent);
        tempInter.setproportionalsodium(baseline);
        const res = BodyModel.projectFromPhysState(
          physState,
          DailyParams.createFromIntervention(tempInter, baseline),
          goaltime
        );
        const wt = res.getWeight(physState);
        return isNaN(wt) ? 0 : Math.max(0, wt);
      };

      const starvwt = Math.max(0, starvFn(mincals));
      const error = Math.abs(starvwt - goalwt);

      if (error < eps || goalwt <= starvwt) {
        goalinter.calories = 0.0;
        throw new Error('Unachievable Goal');
      }

      // Use generic solver.
      const maxCals = 10000.0;

      goalinter.calories = Solver.binarySearch(starvFn, goalwt, mincals, maxCals, eps);
      goalinter.setproportionalsodium(baseline);
      
      // Post-check for stability and accuracy
      const finalWeight = starvFn(goalinter.calories);
      const finalError = Math.abs(finalWeight - goalwt);
      if (finalWeight <= 0 || isNaN(finalWeight) || finalError > eps * 10) {
        throw new Error('Unachievable Goal');
      }
    }
    return goalinter;
  }

  getAct(baseline) {
    return baseline.getActivityParam() * (1.0 + this.actchangepercent / 100.0);
  }

  setproportionalsodium(baseline) {
    this.sodium = (baseline.sodium * this.calories) / baseline.getMaintCals();
  }
}
