import { Hall, BMI, Limits, Defaults } from './constants.js';
import * as Physiology from './physiology.js';

export default class Baseline {
  constructor(
    isMale = true,
    age = Defaults.AGE,
    height = Defaults.HEIGHT,
    weight = Defaults.WEIGHT,
    bfp = Defaults.BFP,
    rmr = null, // Will be calculated if null
    pal = Defaults.PAL,
    bfpCalc = true,
    rmrCalc = true
  ) {
    this.isMale = !!isMale;
    this.bfpCalc = bfpCalc;
    this.rmrCalc = rmrCalc;

    const safeNum = (val, def) => {
      try {
        const n = parseFloat(val);
        return isNaN(n) ? def : n;
      } catch {
        return def;
      }
    };

    this.age = safeNum(age, Defaults.AGE);
    this.maximumage = Limits.MAX_AGE;

    const h = safeNum(height, Defaults.HEIGHT);
    this.height = Math.max(Limits.MIN_HEIGHT, Math.min(Limits.MAX_HEIGHT, h));

    const w = safeNum(weight, Defaults.WEIGHT);
    this.weight = Math.max(Limits.MIN_WEIGHT, w);

    const b = safeNum(bfp, Defaults.BFP);
    this.bfp = Math.max(Limits.MIN_BFP, Math.min(Limits.MAX_BFP, b));

    // Initial RMR calculation if not provided
    const calculatedRMR = Physiology.calculateRMR(this.weight, this.height, this.age, this.isMale);
    this.rmr = safeNum(rmr, calculatedRMR);
    
    this.pal = Math.max(Limits.MIN_PAL, safeNum(pal, Defaults.PAL));

    this.carbIntakePct = Defaults.CARB_INTAKE_PCT;
    this.sodium = Defaults.SODIUM;
    this.delta_E = 0;
    this.dECW = 0;
    this.glycogen = Defaults.GLYCOGEN;
  }

  getNewAct(intervention) {
    return intervention && intervention.getAct(this);
  }

  getBFP() {
    if (this.bfpCalc) {
      this.bfp = Physiology.calculateBFP(this.getBMI(), this.age, this.isMale);
    }
    return this.bfp;
  }

  getHealthyWeightRange() {
    return {
      low: Math.round(BMI.UNDERWEIGHT * Math.pow(this.height / 100, 2)),
      high: Math.round(BMI.NORMAL * Math.pow(this.height / 100, 2)),
    };
  }

  getRMR() {
    if (this.rmrCalc) {
      this.rmr = Physiology.calculateRMR(this.weight, this.height, this.age, this.isMale);
    }
    return this.rmr;
  }

  getNewRMR(newWeight, day) {
    return Physiology.calculateNewRMR(newWeight, this.height, this.age, day, this.isMale);
  }

  getMaintCals() {
    return this.pal * this.getRMR();
  }

  getActivityParam() {
    return Physiology.calculateActivityParam(this.getRMR(), this.pal, this.weight);
  }

  getTEE() {
    return this.pal * this.getRMR();
  }

  getActivityExpenditure() {
    return this.getTEE() - this.getRMR();
  }

  getFatWeight() {
    return (this.weight * this.getBFP()) / 100.0;
  }

  getLeanWeight() {
    return this.weight - this.getFatWeight();
  }

  getK() {
    return Physiology.calculateKFactor(
      this.getMaintCals(),
      this.getLeanWeight(),
      this.getFatWeight(),
      this.getActivityParam(),
      this.weight,
      this.delta_E
    );
  }

  getBMI() {
    return Physiology.calculateBMI(this.weight, this.height);
  }

  getNewBMI(newWeight) {
    return Physiology.calculateBMI(newWeight, this.height);
  }

  getECW() {
    return Physiology.calculateECW(this.weight, this.height, this.age, this.isMale);
  }

  getNewECW(days, newWeight) {
    return Physiology.calculateNewECW(newWeight, this.height, this.age, days, this.isMale);
  }

  proportionalSodium(newCals) {
    return (this.sodium * newCals) / this.getMaintCals();
  }

  getCarbsIn() {
    return (this.carbIntakePct / 100.0) * this.getMaintCals();
  }

  setCalculatedBFP(bfpcalc) {
    this.bfpCalc = bfpcalc;
    if (this.bfpCalc) {
      this.bfp = this.getBFP();
    }
  }

  setCalculatedRMR(rmrcalc) {
    this.rmrCalc = rmrcalc;
    if (this.rmrCalc) {
      this.rmr = this.getRMR();
    }
  }

  getGlycogenH2O(newGlycogen) {
    return Hall.GLYCOGEN_WATER_COEFF * (newGlycogen - this.glycogen);
  }

  getTherm() {
    return Physiology.calculateTherm(this.getTEE());
  }

  getBodyComposition() {
    return [
      (this.weight * this.bfp) / 100.0,
      (this.weight * (100.0 - this.bfp)) / 100.0,
      this.dECW,
    ];
  }

  getNewWeight(fat, lean, glycogen, deltaECW) {
    return fat + lean + this.getGlycogenH2O(glycogen) + deltaECW;
  }

  getNewWeightFromBodyModel(bodyModel) {
    return (
      bodyModel.fat + bodyModel.lean + this.getGlycogenH2O(bodyModel.glycogen) + bodyModel.decw
    );
  }

  glycogenEquation(caloricIntake) {
    return Physiology.calculateGlycogenEquation(
      this.glycogen,
      caloricIntake,
      this.carbIntakePct,
      this.getCarbsIn()
    );
  }

  deltaECWEquation(caloricIntake) {
    return Physiology.calculateDeltaECWEquation(
      caloricIntake,
      this.sodium,
      this.getMaintCals(),
      this.carbIntakePct,
      this.getCarbsIn()
    );
  }

  getStableWeight(fat, lean, caloricIntake) {
    return Physiology.calculateStableWeight(
      fat,
      lean,
      this.glycogen,
      this.getCarbsIn(),
      this.carbIntakePct,
      caloricIntake,
      this.sodium,
      this.getMaintCals()
    );
  }

  getNewTEE(bodyModel, dailyParams) {
    return bodyModel.getTEE(this, dailyParams);
  }
}
