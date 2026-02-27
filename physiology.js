import { Hall, MSJ, ECW, BMI, Limits, BFP } from './constants.js';

/**
 * Pure functional physiology calculations.
 */

export const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  return weight / Math.pow(height / 100, 2);
};

export const calculateRMR = (weight, height, age, isMale) => {
  const offset = isMale ? MSJ.MALE_OFFSET : MSJ.FEMALE_OFFSET;
  const rmr =
    MSJ.WEIGHT_COEFF * weight + MSJ.HEIGHT_COEFF * height - MSJ.AGE_COEFF * age + offset;
  return Math.max(Limits.MIN_RMR, rmr);
};

export const calculateNewRMR = (newWeight, height, initialAge, day, isMale) => {
  const currentAge = initialAge + day / Hall.DAYS_PER_YEAR;
  return calculateRMR(newWeight, height, currentAge, isMale);
};

export const calculateBFP = (bmi, age, isMale) => {
  let bfp;
  if (isMale) {
    bfp = BFP.AGE_COEFF * age + BFP.MALE_LOG_BMI_COEFF * Math.log(bmi) - BFP.MALE_OFFSET;
  } else {
    bfp = BFP.AGE_COEFF * age + BFP.FEMALE_LOG_BMI_COEFF * Math.log(bmi) - BFP.FEMALE_OFFSET;
  }
  return Math.max(0.0, Math.min(Limits.MAX_BFP_CALC, bfp));
};

export const calculateECW = (weight, height, age, isMale) => {
  if (isMale) {
    return (
      ECW.MALE_AGE_COEFF * age +
      ECW.MALE_HEIGHT_COEFF * (height / 100.0) +
      ECW.MALE_WEIGHT_COEFF * weight +
      ECW.MALE_OFFSET
    );
  } else {
    return (
      ECW.FEMALE_OFFSET +
      ECW.FEMALE_HEIGHT_COEFF * (height / 100.0) +
      ECW.FEMALE_WEIGHT_COEFF * weight
    );
  }
};

export const calculateNewECW = (newWeight, height, initialAge, day, isMale) => {
  const currentAge = initialAge + day / Hall.DAYS_PER_YEAR;
  return calculateECW(newWeight, height, currentAge, isMale);
};

export const calculateKFactor = (maintCals, leanWeight, fatWeight, actParam, weight, deltaE = 0) => {
  return (
    Hall.K_FACTOR_MAINT_EFF * maintCals -
    deltaE -
    Hall.LEAN_METABOLIC_RATE * leanWeight -
    Hall.FAT_METABOLIC_RATE * fatWeight -
    actParam * weight
  );
};

export const calculateActivityParam = (rmr, pal, weight) => {
  return (Hall.ACT_PARAM_EFF * rmr * pal - rmr) / weight;
};

export const calculateTherm = (tee) => {
  return Hall.THERM_COEFF * tee;
};

export const calculateForbesP = (fat) => {
  return Hall.FORBES_CONSTANT / (Hall.FORBES_CONSTANT + fat);
};

export const calculateGlycogenEquation = (
  initialGlycogen,
  caloricIntake,
  carbIntakePct,
  initialCarbsIn
) => {
  return (
    initialGlycogen *
    Math.sqrt(((carbIntakePct / 100.0) * caloricIntake) / initialCarbsIn)
  );
};

export const calculateDeltaECWEquation = (
  caloricIntake,
  initialSodium,
  initialMaintCals,
  carbIntakePct,
  initialCarbsIn
) => {
  return (
    ((initialSodium / initialMaintCals +
      (Hall.SODIUM_CARB_COEFF * carbIntakePct) / (100.0 * initialCarbsIn)) *
      caloricIntake -
      (initialSodium + Hall.SODIUM_CARB_COEFF)) /
    Hall.SODIUM_WATER_COEFF
  );
};

export const calculateStableWeight = (
  fat,
  lean,
  initialGlycogen,
  initialCarbsIn,
  carbIntakePct,
  caloricIntake,
  initialSodium,
  initialMaintCals
) => {
  const newGlycogen = calculateGlycogenEquation(
    initialGlycogen,
    caloricIntake,
    carbIntakePct,
    initialCarbsIn
  );
  const glycogenH2O = Hall.GLYCOGEN_WATER_COEFF * (newGlycogen - initialGlycogen);
  const deltaECW = calculateDeltaECWEquation(
    caloricIntake,
    initialSodium,
    initialMaintCals,
    carbIntakePct,
    initialCarbsIn
  );
  return fat + lean + glycogenH2O + deltaECW;
};
