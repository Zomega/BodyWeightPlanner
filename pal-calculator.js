/**
 * Logic for calculating Physical Activity Level (PAL) based on MET-hours.
 */
export const PALCalculator = {
  /**
   * Calculates PAL multiplier based on a list of activities.
   * @param {Array} activities - List of activities { met, duration, frequency, period }
   * @returns {number} Calculated PAL (multiplier)
   */
  calculateAdvanced(activities) {
    if (!activities || activities.length === 0) return 1.6;

    let totalMetHours = 0;
    let totalActiveMinsPerDay = 0;

    activities.forEach((act) => {
      const met = parseFloat(act.met) || 1.0;
      const duration = parseFloat(act.duration) || 0;
      const freq = parseFloat(act.frequency) || 0;
      const period = parseFloat(act.period) || 7;

      // MET-minutes per day
      const minsPerDay = (duration * freq) / period;
      totalMetHours += (met * minsPerDay) / 60;
      totalActiveMinsPerDay += minsPerDay;
    });

    // The remaining hours of the day are assumed to be at 1.0 MET (sleeping/resting)
    const restHours = Math.max(0, 24 - totalActiveMinsPerDay / 60);
    totalMetHours += restHours * 1.0;

    // PAL is average METs over 24 hours
    const pal = totalMetHours / 24;
    return Math.max(1.1, Math.min(3.0, pal));
  },

  /**
   * Simple PAL lookup based on work and leisure categories.
   */
  getSimpleValue(leisure, work) {
    const map = {
      'Very Light|Very Light': 1.4,
      'Very Light|Light': 1.5,
      'Very Light|Moderate': 1.6,
      'Very Light|Heavy': 1.7,
      'Light|Very Light': 1.5,
      'Light|Light': 1.6,
      'Light|Moderate': 1.7,
      'Light|Heavy': 1.8,
      'Moderate|Very Light': 1.6,
      'Moderate|Light': 1.7,
      'Moderate|Moderate': 1.8,
      'Moderate|Heavy': 1.9,
      'Active|Very Light': 1.7,
      'Active|Light': 1.8,
      'Active|Moderate': 1.9,
      'Active|Heavy': 2.1,
      'Very Active|Very Light': 1.9,
      'Very Active|Light': 2.0,
      'Very Active|Moderate': 2.2,
      'Very Active|Heavy': 2.3,
    };
    return map[`${leisure}|${work}`] || 1.6;
  },
};
