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
        const targetParams = DailyParams.createFromIntervention(nextInt, baseline);

        if (nextInt.rampon && i > 0) {
          // Ramp from whatever the state was at the start of this intervention
          // Note: Simplification - ramp logic usually happens BETWEEN intervention start dates.
          // To match original spirit: if ramp is on, we interpolate from last state to this one.
          // But usually, ramp means "ramp UP TO this day".
          // Let's implement: interpolate from last state to target state over the duration.
        }
        currentParams = targetParams;
        lastCalories = currentParams.calories;
        lastAct = currentParams.actparam;
        lastCarb = currentParams.carbpercent;
        lastSodium = currentParams.sodium;
        lastDay = i;
      }

      // Check if we are currently in a ramp period for the 'next' upcoming intervention
      const upcoming = activeInterventions.find((int) => int.day > i && int.rampon);
      if (upcoming) {
        const startDay = lastDay;
        const endDay = upcoming.day;
        const progress = (i - startDay) / (endDay - startDay);

        const targetCals = upcoming.calories;
        const targetAct = upcoming.getAct(baseline);
        const targetCarb = upcoming.carbinpercent;
        const targetSodium = upcoming.sodium;

        const dcal = lastCalories + progress * (targetCals - lastCalories);
        const dact = lastAct + progress * (targetAct - lastAct);
        const dcarb = lastCarb + progress * (targetCarb - lastCarb);
        const dsodium = lastSodium + progress * (targetSodium - lastSodium);

        const rampedParams = new DailyParams(dcal, dcarb, dsodium, dact);
        rampedParams.ramped = true;
        paramtraj.push(rampedParams);
      } else {
        paramtraj.push(currentParams);
      }
    }
    return paramtraj;
  }
}
