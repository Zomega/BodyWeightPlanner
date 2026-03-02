import { Hall, MSJ, ECW, BMI, Limits, BFP } from './constants.js';

/**
 * Pure functional physiology calculations.
 */

export const calculateBMI = (weight, height) => {
  if (!weight || height < Limits.MIN_HEIGHT) return 0;
  const bmi = weight / Math.pow(height / 100, 2);
  // Clamp BMI to a safe numerical range to avoid log(0) or massive numbers in BFP
  return Math.max(0.1, Math.min(1000.0, bmi));
};

export const calculateRMR = (weight, height, age, isMale) => {
  const safeWeight = Math.max(0, weight);
  const safeHeight = Math.max(Limits.MIN_HEIGHT, height);
  const safeAge = Math.max(0, age);
  
  const offset = isMale ? MSJ.MALE_OFFSET : MSJ.FEMALE_OFFSET;
  const rmr =
    MSJ.WEIGHT_COEFF * safeWeight + MSJ.HEIGHT_COEFF * safeHeight - MSJ.AGE_COEFF * safeAge + offset;
  return Math.max(Limits.MIN_RMR, rmr);
};

export const calculateNewRMR = (newWeight, height, initialAge, day, isMale) => {
  const currentAge = Math.max(0, initialAge + day / Hall.DAYS_PER_YEAR);
  return calculateRMR(newWeight, height, currentAge, isMale);
};

export const calculateBFP = (bmi, age, isMale) => {
  const safeBMI = Math.max(0.1, bmi);
  const safeAge = Math.max(0, age);
  let bfp;
  if (isMale) {
    bfp = BFP.AGE_COEFF * safeAge + BFP.MALE_LOG_BMI_COEFF * Math.log(safeBMI) - BFP.MALE_OFFSET;
  } else {
    bfp = BFP.AGE_COEFF * safeAge + BFP.FEMALE_LOG_BMI_COEFF * Math.log(safeBMI) - BFP.FEMALE_OFFSET;
  }
  return Math.max(0.0, Math.min(Limits.MAX_BFP_CALC, bfp));
};

export const calculateECW = (weight, height, age, isMale) => {
  const safeWeight = Math.max(0, weight);
  const safeHeight = Math.max(Limits.MIN_HEIGHT, height);
  const safeAge = Math.max(0, age);
  
  if (isMale) {
    return (
      ECW.MALE_AGE_COEFF * safeAge +
      ECW.MALE_HEIGHT_COEFF * (safeHeight / 100.0) +
      ECW.MALE_WEIGHT_COEFF * safeWeight +
      ECW.MALE_OFFSET
    );
  } else {
    return (
      ECW.FEMALE_OFFSET +
      ECW.FEMALE_HEIGHT_COEFF * (safeHeight / 100.0) +
      ECW.FEMALE_WEIGHT_COEFF * safeWeight
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

export const calculateGlycogenH2O = (currentGlycogen, initialGlycogen) => {
  return Hall.GLYCOGEN_WATER_COEFF * (currentGlycogen - initialGlycogen);
};

export const calculateCurrentWeight = (fat, lean, currentGlycogen, decw, physState) => {
  const weight =
    fat +
    lean +
    calculateGlycogenH2O(currentGlycogen, physState.initialGlycogen) +
    decw;
  return Math.max(0, weight);
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

/**
 * Creates a PhysiologicalState object containing all derived constants
 * needed for simulation, decoupling it from user input sources like Baseline.
 */
export const createPhysiologicalState = (baseline) => {
  return {
    kFactor: baseline.getK(),
    carbsIn: baseline.getCarbsIn(),
    maintCals: baseline.getMaintCals(),
    initialFat: baseline.getFatWeight(),
    initialLean: baseline.getLeanWeight(),
    initialGlycogen: baseline.glycogen,
    initialSodium: baseline.sodium,
    initialTherm: baseline.getTherm(),
    carbIntakePct: baseline.carbIntakePct,
    height: baseline.height,
    isMale: baseline.isMale,
    age: baseline.age,
  };
};
