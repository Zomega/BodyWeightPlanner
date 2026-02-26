/**
 * Utility for BMI calculations and categorization.
 */
export const BMIUtils = {
  calculate(weightKg, heightCm) {
    if (!weightKg || !heightCm) return 0;
    return weightKg / Math.pow(heightCm / 100, 2);
  },

  getCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  },

  getHealthyRange(heightCm) {
    return {
      low: 18.5 * Math.pow(heightCm / 100, 2),
      high: 25.0 * Math.pow(heightCm / 100, 2),
    };
  },
};
