// Activity Level Definitions
export const WorkActivityLevel = {
  VeryLight: {
    name: 'Very Light',
    description: 'Sitting at the computer most of the day, or sitting at a desk.',
    sortOrder: 1,
  },
  Light: {
    name: 'Light',
    description: 'Light industrial work, sales or office work that comprises light activities.',
    sortOrder: 2,
  },
  Moderate: {
    name: 'Moderate',
    description: 'Cleaning, kitchen staff, or delivering mail on foot or by bicycle.',
    sortOrder: 3,
  },
  Heavy: {
    name: 'Heavy',
    description: 'Heavy industrial work, construction work or farming.',
    sortOrder: 4,
  },
};

export const LeisureActivityLevel = {
  VeryLight: {
    name: 'Very Light',
    description: 'Almost no activity at all.',
    sortOrder: 1,
  },
  Light: {
    name: 'Light',
    description: 'Walking, non-strenuous cycling or gardening approximately once a week.',
    sortOrder: 2,
  },
  Moderate: {
    name: 'Moderate',
    description:
      'Regular activity at least once a week, e.g., walking, bicycling (including to work) or gardening.',
    sortOrder: 3,
  },
  Active: {
    name: 'Active',
    description:
      'Regular activities more than once a week, e.g., intense walking, bicycling or sports.',
    sortOrder: 4,
  },
  VeryActive: {
    name: 'Very Active',
    description: 'Strenuous activities several times a week.',
    sortOrder: 5,
  },
};

// Anthropometric & Physiological Limits
export const Limits = {
  MAX_AGE: 250.0,
  MIN_HEIGHT: 0.1,
  MAX_HEIGHT: 400.0,
  MIN_WEIGHT: 0.1,
  MIN_BFP: 0.0,
  MAX_BFP: 100.0,
  MAX_BFP_CALC: 60.0,
  MIN_RMR: 500.0,
  MIN_PAL: 1.0,
  MIN_PAL_ADVANCED: 1.1,
  MAX_PAL_ADVANCED: 3.0,
  MAX_SODIUM: 50000.0,
};

// Defaults
export const Defaults = {
  AGE: 23.0,
  HEIGHT: 180.0,
  WEIGHT: 70.0,
  BFP: 18.0,
  PAL: 1.6,
  CARB_INTAKE_PCT: 50.0,
  SODIUM: 4000.0,
  GLYCOGEN: 0.5,
};

// Mifflin-St Jeor Coefficients
export const MSJ = {
  WEIGHT_COEFF: 9.99,
  HEIGHT_COEFF: 6.25, // 625 / 100
  AGE_COEFF: 4.92,
  MALE_OFFSET: 5.0,
  FEMALE_OFFSET: -161.0,
};

// BMI Thresholds
export const BMI = {
  UNDERWEIGHT: 18.5,
  NORMAL: 25.0,
  OVERWEIGHT: 30.0,
};

// BFP (Body Fat Percentage) Regression Coefficients
export const BFP = {
  AGE_COEFF: 0.14,
  MALE_LOG_BMI_COEFF: 37.31,
  MALE_OFFSET: 103.94,
  FEMALE_LOG_BMI_COEFF: 39.96,
  FEMALE_OFFSET: 102.01,
};

// Solver Constants
export const Solver = {
  INITIAL_CAL_STEP: 200.0,
  PCX_ERROR_THRESHOLD: 10,
};

// Hall Physiological Model Constants
export const Hall = {
  FORBES_CONSTANT: 1.990762711864407,
  ENERGY_DENSITY_FAT: 9440.0,
  ENERGY_DENSITY_LEAN: 1807.0,
  ENERGY_DENSITY_GLYCOGEN: 4180.0,
  GLYCOGEN_WATER_COEFF: 3.7,
  LEAN_METABOLIC_RATE: 22.0,
  FAT_METABOLIC_RATE: 3.2,
  THERMIC_EFFECT_FOOD: 0.1,
  THERMIC_EFFECT_CARBS: 180.0,
  THERMIC_EFFECT_PROTEIN: 230.0,
  THERM_COEFF: 0.14,
  THERM_TIME_CONSTANT: 14.0,
  ECW_SODIUM_CONC: 3220.0,
  SODIUM_WATER_COEFF: 3000.0,
  SODIUM_CARB_COEFF: 4000.0,
  K_FACTOR_MAINT_EFF: 0.76,
  ACT_PARAM_EFF: 0.9,
  CALS_BALANCE_EFF: 0.24,
  DAYS_PER_YEAR: 365.0,
  HOURS_PER_DAY: 24.0,
  MINS_PER_HOUR: 60.0,
};

// ECW (Extracellular Water) Regression Coefficients
export const ECW = {
  MALE_AGE_COEFF: 0.025,
  MALE_HEIGHT_COEFF: 9.57,
  MALE_WEIGHT_COEFF: 0.191,
  MALE_OFFSET: -12.4,
  FEMALE_HEIGHT_COEFF: 5.98,
  FEMALE_WEIGHT_COEFF: 0.167,
  FEMALE_OFFSET: -4.0,
};
