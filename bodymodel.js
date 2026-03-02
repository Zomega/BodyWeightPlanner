import DailyParams from './dailyparams.js';
import { Hall } from './constants.js';
import * as Physiology from './physiology.js';

export class BodyChange {
  constructor(df = 0, dl = 0, dg = 0, dDecw = 0, dtherm = 0) {
    this.df = df;
    this.dl = dl;
    this.dg = dg;
    this.dDecw = dDecw;
    this.dtherm = dtherm;
  }
}

export default class BodyModel {
  constructor(fat = 0, lean = 0, glycogen = 0, decw = 0, therm = 0) {
    this.RK4wt = [1, 2, 2, 1];
    this.fat = fat;
    this.lean = lean;
    this.glycogen = glycogen;
    this.decw = decw;
    this.therm = therm;
  }

  static createFromPhysState(physState) {
    return new BodyModel(
      physState.initialFat,
      physState.initialLean,
      physState.initialGlycogen,
      0, // decw usually starts at 0 relative to baseline
      physState.initialTherm
    );
  }

  // Deprecated: use createFromPhysState
  static createFromBaseline(baseline) {
    return this.createFromPhysState(Physiology.createPhysiologicalState(baseline));
  }

  static projectFromPhysState(physState, dailyParams, simlength) {
    let loop = BodyModel.createFromPhysState(physState);
    for (let i = 0; i < simlength; i++) {
      loop = BodyModel.RungeKatta(loop, physState, dailyParams);
    }
    return loop;
  }

  // Deprecated: use projectFromPhysState
  static projectFromBaseline(baseline, dailyParams, simlength) {
    return this.projectFromPhysState(Physiology.createPhysiologicalState(baseline), dailyParams, simlength);
  }

  static projectFromBaselineViaIntervention(baseline, intervention, simlength) {
    const physState = Physiology.createPhysiologicalState(baseline);
    const dailyParams = DailyParams.createFromIntervention(intervention, baseline);
    return BodyModel.projectFromPhysState(physState, dailyParams, simlength);
  }

  getWeight(physState) {
    return Physiology.calculateCurrentWeight(this.fat, this.lean, this.glycogen, this.decw, physState);
  }

  getapproxWeight() {
    return this.fat + this.lean + this.decw;
  }

  getFatFree(physState) {
    return this.getWeight(physState) - this.fat;
  }

  getFatPercent(physState) {
    const weight = this.getWeight(physState);
    return weight > 0 ? (this.fat / weight) * 100.0 : 0;
  }

  getBMI(physState) {
    return Physiology.calculateBMI(this.getWeight(physState), physState.height);
  }

  dt(physState, dailyParams) {
    const df = this.dfdt(physState, dailyParams);
    const dl = this.dldt(physState, dailyParams);
    const dg = this.dgdt(physState, dailyParams);
    const dDecw = this.dDecwdt(physState, dailyParams);
    const dtherm = this.dthermdt(physState, dailyParams);

    return new BodyChange(df, dl, dg, dDecw, dtherm);
  }

  static RungeKatta(bodyModel, physState, dailyParams) {
    const dt1 = bodyModel.dt(physState, dailyParams);
    const b2 = bodyModel.addchange(dt1, 0.5);
    const dt2 = b2.dt(physState, dailyParams);
    const b3 = bodyModel.addchange(dt2, 0.5);
    const dt3 = b3.dt(physState, dailyParams);
    const b4 = bodyModel.addchange(dt3, 1.0);
    const dt4 = b4.dt(physState, dailyParams);
    const finaldt = bodyModel.avgdt_weighted([1, 2, 2, 1], [dt1, dt2, dt3, dt4]);
    const finalstate = bodyModel.addchange(finaldt, 1.0);
    return finalstate;
  }

  getTEE(physState, dailyParams) {
    const p = this.getp();
    const calin = dailyParams.calories;
    const carbflux = this.carbflux(physState, dailyParams);
    const Expend = this.getExpend(physState, dailyParams);
    
    const p_n = ((1.0 - p) * Hall.THERMIC_EFFECT_CARBS) / Hall.ENERGY_DENSITY_FAT + (p * Hall.THERMIC_EFFECT_PROTEIN) / Hall.ENERGY_DENSITY_LEAN;
    const p_d = 1.0 + (p * Hall.THERMIC_EFFECT_PROTEIN) / Hall.ENERGY_DENSITY_LEAN + ((1.0 - p) * Hall.THERMIC_EFFECT_CARBS) / Hall.ENERGY_DENSITY_FAT;
    
    return (Expend + (calin - carbflux) * p_n) / p_d;
  }

  getExpend(physState, dailyParams) {
    const TEF = Hall.THERMIC_EFFECT_FOOD * dailyParams.calories;
    const weight = this.getWeight(physState);
    return (
      physState.kFactor +
      Hall.LEAN_METABOLIC_RATE * this.lean +
      Hall.FAT_METABOLIC_RATE * this.fat +
      dailyParams.actparam * weight +
      this.therm +
      TEF
    );
  }

  getp() {
    return Physiology.calculateForbesP(this.fat);
  }

  carbflux(physState, dailyParams) {
    const k_carb = physState.carbsIn / Math.pow(physState.initialGlycogen, 2.0);
    return dailyParams.getCarbIntake() - k_carb * Math.pow(this.glycogen, 2.0);
  }

  Na_imbal(physState, dailyParams) {
    return (
      dailyParams.sodium -
      physState.initialSodium -
      Hall.SODIUM_WATER_COEFF * this.decw -
      Hall.SODIUM_CARB_COEFF * (1.0 - dailyParams.getCarbIntake() / physState.carbsIn)
    );
  }

  dfdt(physState, dailyParams) {
    return (
      ((1.0 - this.getp()) *
        (dailyParams.calories -
          this.getTEE(physState, dailyParams) -
          this.carbflux(physState, dailyParams))) /
      Hall.ENERGY_DENSITY_FAT
    );
  }

  dldt(physState, dailyParams) {
    return (
      (this.getp() *
        (dailyParams.calories -
          this.getTEE(physState, dailyParams) -
          this.carbflux(physState, dailyParams))) /
      Hall.ENERGY_DENSITY_LEAN
    );
  }

  dgdt(physState, dailyParams) {
    return this.carbflux(physState, dailyParams) / Hall.ENERGY_DENSITY_GLYCOGEN;
  }

  dDecwdt(physState, dailyParams) {
    return this.Na_imbal(physState, dailyParams) / Hall.ECW_SODIUM_CONC;
  }

  dthermdt(physState, dailyParams) {
    return (Hall.THERM_COEFF * dailyParams.calories - this.therm) / Hall.THERM_TIME_CONSTANT;
  }

  addchange(bchange, tstep) {
    return new BodyModel(
      Math.max(0, this.fat + tstep * bchange.df),
      Math.max(0, this.lean + tstep * bchange.dl),
      Math.max(0, this.glycogen + tstep * bchange.dg),
      this.decw + tstep * bchange.dDecw, // decw can be negative relative to baseline
      Math.max(0, this.therm + tstep * bchange.dtherm)
    );
  }

  cals4balance(physState, act) {
    const weight = this.getWeight(physState);
    const Expend_no_food =
      physState.kFactor +
      Hall.LEAN_METABOLIC_RATE * this.lean +
      Hall.FAT_METABOLIC_RATE * this.fat +
      act * weight;
    const p = this.getp();
    const p_d =
      1.0 +
      (p * Hall.THERMIC_EFFECT_PROTEIN) / Hall.ENERGY_DENSITY_LEAN +
      ((1.0 - p) * Hall.THERMIC_EFFECT_CARBS) / Hall.ENERGY_DENSITY_FAT;
    const p_n =
      ((1.0 - p) * Hall.THERMIC_EFFECT_CARBS) / Hall.ENERGY_DENSITY_FAT +
      (p * Hall.THERMIC_EFFECT_PROTEIN) / Hall.ENERGY_DENSITY_LEAN;
    // At equilibrium, Intake = TEE = (Expend_no_food + 0.14*Intake + 0.1*Intake + Intake*p_n) / p_d
    // Intake * (p_d - p_n - 0.14 - 0.1) = Expend_no_food
    return Expend_no_food / (p_d - p_n - Hall.THERM_COEFF - Hall.THERMIC_EFFECT_FOOD);
  }

  avgdt_weighted(wt, bchange) {
    let sumf = 0.0,
      suml = 0.0,
      sumg = 0.0,
      sumdecw = 0.0,
      sumtherm = 0.0,
      wtsum = 0;
    for (let i = 0; i < bchange.length; i++) {
      let wti = wt[i] || 1;
      wti = wti < 0 ? 1 : wti;
      wtsum += wti;
      sumf += wti * bchange[i].df;
      suml += wti * bchange[i].dl;
      sumg += wti * bchange[i].dg;
      sumdecw += wti * bchange[i].dDecw;
      sumtherm += wti * bchange[i].dtherm;
    }
    wtsum = wtsum === 0 ? 1 : wtsum;
    return new BodyChange(
      sumf / wtsum,
      suml / wtsum,
      sumg / wtsum,
      sumdecw / wtsum,
      sumtherm / wtsum
    );
  }
}
