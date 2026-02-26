import BodyModel from './bodymodel.js';

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
    this.sodium = Math.max(0, Math.min(50000.0, sodium));
    this.on = true;
    this.rampon = false;
    this.actchangepercent = Math.max(-100.0, actchangepercent);
    this.day = day;
    this.title = '';
  }

  static forgoal(baseline, goalwt, goaltime, actchangepercent, mincals, eps) {
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
      const starvtest = BodyModel.projectFromBaselineViaIntervention(baseline, goalinter, goaltime);
      const starvwt = Math.max(0, starvtest.getWeight(baseline));
      let error = Math.abs(starvwt - goalwt);

      if (error < eps || goalwt <= starvwt) {
        goalinter.calories = 0.0;
        throw new Error('Unachievable Goal');
      }

      let checkcals = mincals;
      let calstep = 200.0;
      let holdcals = 0.0;
      let i = 0;
      let PCXerror = 0;

      do {
        i++;
        holdcals = checkcals;
        checkcals += calstep;
        goalinter.calories = checkcals;
        goalinter.setproportionalsodium(baseline);

        const testbc = BodyModel.projectFromBaselineViaIntervention(baseline, goalinter, goaltime);
        const testwt = testbc.getWeight(baseline);

        if (testwt < 0.0) {
          PCXerror++;
          if (PCXerror > 10) throw new Error('Unachievable Goal');
        }
        error = Math.abs(goalwt - testwt);

        if (error > eps && testwt > goalwt) {
          calstep /= 2.0;
          checkcals = holdcals;
        }
      } while (error > eps);
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
