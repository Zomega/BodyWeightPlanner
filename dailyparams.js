export default class DailyParams {
  constructor(calories = 0, carbpercent = 0, sodium = 0, actparam = 0) {
    this.calories = Math.max(0, calories);
    this.carbpercent = Math.max(0, Math.min(100.0, carbpercent));
    this.sodium = Math.max(0, sodium);
    this.actparam = Math.max(0, actparam);
    this.flag = false;
    this.ramped = false;
  }

  static createFromBaseline(baseline) {
    return new DailyParams(
      baseline.getMaintCals(),
      baseline.carbIntakePct,
      baseline.sodium,
      baseline.getActivityParam()
    );
  }

  static createFromIntervention(intervention, baseline) {
    return new DailyParams(
      intervention.calories,
      intervention.carbinpercent,
      intervention.sodium,
      intervention.getAct(baseline)
    );
  }

  getCarbIntake() {
    return (this.carbpercent / 100.0) * this.calories;
  }

  /**
   * Creates a trajectory of daily parameters based on an array of interventions.
   * Interventions should be sorted by day.
   */
  static makeparamtrajectory(baseline, ...args) {
    let interventions;
    let simlength;

    if (args.length >= 2 && Array.isArray(args[0])) {
      interventions = args[0];
      simlength = args[1];
    } else {
      simlength = args.pop();
      interventions = args;
    }

    const paramtraj = [];
    const activeInterventions = interventions
      .filter((int) => int && int.on)
      .sort((a, b) => a.day - b.day);

    let currentParams = DailyParams.createFromBaseline(baseline);
    let lastDay = 0;
    let lastCalories = baseline.getMaintCals();
    let lastAct = baseline.getActivityParam();
    let lastCarb = baseline.carbIntakePct;
    let lastSodium = baseline.sodium;

    for (let i = 0; i < simlength; i++) {
      const nextInt = activeInterventions.find((int) => int.day === i);

      if (nextInt) {
        currentParams = DailyParams.createFromIntervention(nextInt, baseline);
        lastCalories = currentParams.calories;
        lastAct = currentParams.actparam;
        lastCarb = currentParams.carbpercent;
        lastSodium = currentParams.sodium;
        lastDay = i;
      }

      // Check if we are currently in a ramp period for the 'next' upcoming intervention
      const upcoming = activeInterventions.find((int) => int.day > i && int.rampon);
      
      // We only ramp if there was a previous point to ramp FROM
      if (upcoming && i >= lastDay) {
        const startDay = lastDay;
        const endDay = upcoming.day;
        const duration = endDay - startDay;
        
        // If duration is 0 (shouldn't happen with day > i), progress is 1
        const progress = duration > 0 ? (i - startDay) / duration : 1.0;

        const targetCals = upcoming.calories;
        const targetAct = upcoming.getAct(baseline);
        const targetCarb = upcoming.carbinpercent;
        const targetSodium = upcoming.sodium;

        const dcal = lastCalories + progress * (targetCals - lastCalories);
        const dact = lastAct + progress * (targetAct - lastAct);
        const dcarb = lastCarb + progress * (targetCarb - lastCarb);
        const dsodium = lastSodium + progress * (targetSodium - lastSodium);

        const rampedParams = new DailyParams(dcal, dcarb, dsodium, dact);
        rampedParams.ramped = i > lastDay; // It's only 'ramping' if we are past the start day
        paramtraj.push(rampedParams);
      } else {
        paramtraj.push(currentParams);
      }
    }
    return paramtraj;
  }
}
