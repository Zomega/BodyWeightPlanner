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
   * Refactored trajectory logic using functional interpolators.
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

    const activeInterventions = interventions
      .filter((int) => int && int.on)
      .sort((a, b) => a.day - b.day);

    const baselineParams = DailyParams.createFromBaseline(baseline);

    const getParamsAt = (day) => {
      // Find the current active intervention (the one at or most recently before this day)
      // Note: We search backwards through sorted interventions.
      let currentInt = null;
      for (let j = activeInterventions.length - 1; j >= 0; j--) {
        if (activeInterventions[j].day <= day) {
          currentInt = activeInterventions[j];
          break;
        }
      }

      const currentParams = currentInt
        ? DailyParams.createFromIntervention(currentInt, baseline)
        : baselineParams;

      // Check for upcoming ramp
      const upcoming = activeInterventions.find((int) => int.day > day && int.rampon);

      if (upcoming) {
        // Find the start of this ramp (either the current intervention's day or day 0)
        const startDay = currentInt ? currentInt.day : 0;
        const duration = upcoming.day - startDay;
        const progress = (day - startDay) / duration;

        const startCals = currentParams.calories;
        const startAct = currentParams.actparam;
        const startCarb = currentParams.carbpercent;
        const startSodium = currentParams.sodium;

        const targetCals = upcoming.calories;
        const targetAct = upcoming.getAct(baseline);
        const targetCarb = upcoming.carbinpercent;
        const targetSodium = upcoming.sodium;

        const dcal = startCals + progress * (targetCals - startCals);
        const dact = startAct + progress * (targetAct - startAct);
        const dcarb = startCarb + progress * (targetCarb - startCarb);
        const dsodium = startSodium + progress * (targetSodium - startSodium);

        const ramped = new DailyParams(dcal, dcarb, dsodium, dact);
        ramped.ramped = day > startDay;
        return ramped;
      }

      return currentParams;
    };

    const paramtraj = [];
    for (let i = 0; i < simlength; i++) {
      paramtraj.push(getParamsAt(i));
    }
    return paramtraj;
  }
}
