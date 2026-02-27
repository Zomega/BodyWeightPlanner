export default class Baseline {
  constructor(
    isMale = true,
    age = 23.0,
    height = 180.0,
    weight = 70.0,
    bfp = 18.0,
    rmr = 1708.0,
    pal = 1.6,
    bfpCalc = true,
    rmrCalc = true
  ) {
    this.MAX_AGE = 250.0;
    this.INITIAL_AGE = 23.0;
    this.MIN_HEIGHT = 0.1;
    this.MAX_HEIGHT = 400.0;
    this.INITIAL_HEIGHT = 180.0;
    this.MIN_WEIGHT = 0.1;
    this.INITIAL_WEIGHT = 70.0;
    this.MIN_BFP = 0.0;
    this.MAX_BFP = 100.0;
    this.INITIAL_BFP = 18.0;
    this.INITIAL_RMR = 1708.0;
    this.MIN_PAL = 1.0;
    this.INITIAL_PAL = 1.6;
    this.INITIAL_CARB_INTAKE_PCT = 50.0;
    this.INITIAL_SODIUM = 4000.0;
    this.INITIAL_GLYCOGEN = 0.5;
    this.INITIAL_DELTA_E = 0;
    this.INITIAL_DECW = 0;

    this.isMale = !!isMale;
    this.bfpCalc = bfpCalc;
    this.rmrCalc = rmrCalc;

    const safeNum = (val, def) => {
        try {
            const n = parseFloat(val);
            return isNaN(n) ? def : n;
        } catch (e) {
            return def;
        }
    };

    this.age = safeNum(age, this.INITIAL_AGE);
    this.maximumage = this.MAX_AGE;

    const h = safeNum(height, this.INITIAL_HEIGHT);
    this.height = Math.max(this.MIN_HEIGHT, Math.min(this.MAX_HEIGHT, h));
    
    const w = safeNum(weight, this.INITIAL_WEIGHT);
    this.weight = Math.max(this.MIN_WEIGHT, w);
    
    const b = safeNum(bfp, this.INITIAL_BFP);
    this.bfp = Math.max(this.MIN_BFP, Math.min(this.MAX_BFP, b));
    
    this.rmr = safeNum(rmr, this.INITIAL_RMR);
    this.pal = Math.max(this.MIN_PAL, safeNum(pal, this.INITIAL_PAL));

    this.carbIntakePct = this.INITIAL_CARB_INTAKE_PCT;
    this.sodium = this.INITIAL_SODIUM;
    this.delta_E = this.INITIAL_DELTA_E;
    this.dECW = this.INITIAL_DECW;
    this.glycogen = this.INITIAL_GLYCOGEN;
  }

  getNewAct(intervention) {
    return intervention && intervention.getAct(this);
  }

  getBFP() {
    if (this.bfpCalc) {
      if (this.isMale) this.bfp = 0.14 * this.age + 37.31 * Math.log(this.getBMI()) - 103.94;
      else this.bfp = 0.14 * this.age + 39.96 * Math.log(this.getBMI()) - 102.01;

      this.bfp = Math.max(0.0, Math.min(60.0, this.bfp));
    }
    return this.bfp;
  }

  getHealthyWeightRange() {
    return {
      low: Math.round(18.5 * Math.pow(this.height / 100, 2)),
      high: Math.round(25 * Math.pow(this.height / 100, 2)),
    };
  }

  getRMR() {
    if (this.rmrCalc) {
      if (this.isMale)
        this.rmr = 9.99 * this.weight + (625.0 * this.height) / 100.0 - 4.92 * this.age + 5.0;
      else this.rmr = 9.99 * this.weight + (625.0 * this.height) / 100.0 - 4.92 * this.age - 161.0;
    }
    // Safeguard against physically impossible MSJ results for extreme edge cases
    this.rmr = Math.max(500.0, this.rmr);
    return this.rmr;
  }

  getNewRMR(newWeight, day) {
    if (this.isMale)
      return (
        9.99 * newWeight + (625.0 * this.height) / 100.0 - 4.92 * (this.age + day / 365.0) + 5.0
      );
    else
      return (
        9.99 * newWeight + (625.0 * this.height) / 100.0 - 4.92 * (this.age + day / 365.0) - 161.0
      );
  }

  getMaintCals() {
    return this.pal * this.getRMR();
  }

  getActivityParam() {
    return (0.9 * this.getRMR() * this.pal - this.getRMR()) / this.weight;
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
    return (
      0.76 * this.getMaintCals() -
      this.delta_E -
      22.0 * this.getLeanWeight() -
      3.2 * this.getFatWeight() -
      this.getActivityParam() * this.weight
    );
  }

  getBMI() {
    return this.weight / Math.pow(this.height / 100.0, 2.0);
  }

  getNewBMI(newWeight) {
    return newWeight / Math.pow(this.height / 100.0, 2.0);
  }

  getECW() {
    if (this.isMale) return 0.025 * this.age + 9.57 * (this.height / 100.0) + 0.191 * this.weight - 12.4;
    else return -4.0 + 5.98 * (this.height / 100.0) + 0.167 * this.weight;
  }

  getNewECW(days, newWeight) {
    if (this.isMale)
      return 0.025 * (this.age + days / 365.0) + 9.57 * (this.height / 100.0) + 0.191 * newWeight - 12.4;
    else return -4.0 + 5.98 * (this.height / 100.0) + 0.167 * newWeight;
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
    return 3.7 * (newGlycogen - this.glycogen);
  }

  getTherm() {
    return 0.14 * this.getTEE();
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
    return (
      this.glycogen * Math.sqrt(((this.carbIntakePct / 100.0) * caloricIntake) / this.getCarbsIn())
    );
  }

  deltaECWEquation(caloricIntake) {
    return (
      ((this.sodium / this.getMaintCals() +
        (4000.0 * this.carbIntakePct) / (100.0 * this.getCarbsIn())) *
        caloricIntake -
        (this.sodium + 4000.0)) /
      3000.0
    );
  }

  getStableWeight(fat, lean, caloricIntake) {
    const newGlycogen = this.glycogenEquation(caloricIntake);
    const glycogenH2O = this.getGlycogenH2O(newGlycogen);
    const deltaECW = this.deltaECWEquation(caloricIntake);
    return fat + lean + glycogenH2O + deltaECW;
  }

  getNewTEE(bodyModel, dailyParams) {
    return bodyModel.getTEE(this, dailyParams);
  }
}
