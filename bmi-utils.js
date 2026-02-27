import { BMI } from './constants.js';

/**
 * Utility for BMI calculations and categorization.
 */
export const BMIUtils = {
  calculate(weightKg, heightCm) {
    if (!weightKg || !heightCm) return 0;
    return weightKg / Math.pow(heightCm / 100, 2);
  },

  getCategory(bmi) {
    if (bmi < BMI.UNDERWEIGHT) return 'Underweight';
    if (bmi < BMI.NORMAL) return 'Normal';
    if (bmi < BMI.OVERWEIGHT) return 'Overweight';
    return 'Obese';
  },

  getHealthyRange(heightCm) {
    return {
      low: BMI.UNDERWEIGHT * Math.pow(heightCm / 100, 2),
      high: BMI.NORMAL * Math.pow(heightCm / 100, 2),
    };
  },
};
