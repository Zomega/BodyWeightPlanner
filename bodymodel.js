import DailyParams from './dailyparams.js';

class BodyChange {
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

  static createFromBaseline(baseline) {
    return new BodyModel(
      baseline.getFatWeight(),
      baseline.getLeanWeight(),
      baseline.glycogen,
      baseline.dECW,
      baseline.getTherm()
    );
  }

  static projectFromBaseline(baseline, dailyParams, simlength) {
    let loop = BodyModel.createFromBaseline(baseline);
    for (let i = 0; i < simlength; i++) {
      loop = BodyModel.RungeKatta(loop, baseline, dailyParams);
    }
    return loop;
  }

  static projectFromBaselineViaIntervention(baseline, intervention, simlength) {
    const dailyParams = DailyParams.createFromIntervention(intervention, baseline);
    return BodyModel.projectFromBaseline(baseline, dailyParams, simlength);
  }

  getWeight(baseline) {
    return this.fat + this.lean + baseline.getGlycogenH2O(this.glycogen) + this.decw;
  }

  getapproxWeight() {
    return this.fat + this.lean + this.decw;
  }

  getFatFree(baseline) {
    return this.getWeight(baseline) - this.fat;
  }

  getFatPercent(baseline) {
    return (this.fat / this.getWeight(baseline)) * 100.0;
  }

  getBMI(baseline) {
    return baseline.getNewBMI(this.getWeight(baseline));
  }

  dt(baseline, dailyParams) {
    const df = this.dfdt(baseline, dailyParams);
    const dl = this.dldt(baseline, dailyParams);
    const dg = this.dgdt(baseline, dailyParams);
    const dDecw = this.dDecwdt(baseline, dailyParams);
    const dtherm = this.dthermdt(baseline, dailyParams);

    return new BodyChange(df, dl, dg, dDecw, dtherm);
  }

  static RungeKatta(bodyModel, baseline, dailyParams) {
    const dt1 = bodyModel.dt(baseline, dailyParams);
    const b2 = bodyModel.addchange(dt1, 0.5);
    const dt2 = b2.dt(baseline, dailyParams);
    const b3 = bodyModel.addchange(dt2, 0.5);
    const dt3 = b3.dt(baseline, dailyParams);
    const b4 = bodyModel.addchange(dt3, 1.0);
    const dt4 = b4.dt(baseline, dailyParams);
    const finaldt = bodyModel.avgdt_weighted([1, 2, 2, 1], [dt1, dt2, dt3, dt4]);
    const finalstate = bodyModel.addchange(finaldt, 1.0);
    return finalstate;
  }

  getTEE(baseline, dailyParams) {
    const p = this.getp();
    const calin = dailyParams.calories;
    const carbflux = this.carbflux(baseline, dailyParams);
    const Expend = this.getExpend(baseline, dailyParams);
    return (
      (Expend + (calin - carbflux) * (((1.0 - p) * 180.0) / 9440.0 + (p * 230.0) / 1807.0)) /
      (1.0 + (p * 230.0) / 1807.0 + ((1.0 - p) * 180.0) / 9440.0)
    );
  }

  getExpend(baseline, dailyParams) {
    const TEF = 0.1 * dailyParams.calories;
    const weight = baseline.getNewWeightFromBodyModel(this);
    return (
      baseline.getK() +
      22.0 * this.lean +
      3.2 * this.fat +
      dailyParams.actparam * weight +
      this.therm +
      TEF
    );
  }

  getp() {
    return 1.990762711864407 / (1.990762711864407 + this.fat);
  }

  carbflux(baseline, dailyParams) {
    const k_carb = baseline.getCarbsIn() / Math.pow(baseline.glycogen, 2.0);
    return dailyParams.getCarbIntake() - k_carb * Math.pow(this.glycogen, 2.0);
  }

  Na_imbal(baseline, dailyParams) {
    return (
      dailyParams.sodium -
      baseline.sodium -
      3000.0 * this.decw -
      4000.0 * (1.0 - dailyParams.getCarbIntake() / baseline.getCarbsIn())
    );
  }

  dfdt(baseline, dailyParams) {
    return (
      ((1.0 - this.getp()) *
        (dailyParams.calories -
          this.getTEE(baseline, dailyParams) -
          this.carbflux(baseline, dailyParams))) /
      9440.0
    );
  }

  dldt(baseline, dailyParams) {
    return (
      (this.getp() *
        (dailyParams.calories -
          this.getTEE(baseline, dailyParams) -
          this.carbflux(baseline, dailyParams))) /
      1807.0
    );
  }

  dgdt(baseline, dailyParams) {
    return this.carbflux(baseline, dailyParams) / 4180.0;
  }

  dDecwdt(baseline, dailyParams) {
    return this.Na_imbal(baseline, dailyParams) / 3220.0;
  }

  dthermdt(baseline, dailyParams) {
    return (0.14 * dailyParams.calories - this.therm) / 14.0;
  }

  addchange(bchange, tstep) {
    return new BodyModel(
      this.fat + tstep * bchange.df,
      this.lean + tstep * bchange.dl,
      this.glycogen + tstep * bchange.dg,
      this.decw + tstep * bchange.dDecw,
      this.therm + tstep * bchange.dtherm
    );
  }

  cals4balance(baseline, act) {
    const weight = this.getWeight(baseline);
    const Expend_no_food = baseline.getK() + 22.0 * this.lean + 3.2 * this.fat + act * weight;
    const p = this.getp();
    const p_d = 1.0 + (p * 230.0) / 1807.0 + ((1.0 - p) * 180.0) / 9440.0;
    const p_n = ((1.0 - p) * 180.0) / 9440.0 + (p * 230.0) / 1807.0;
    return Expend_no_food / (p_d - p_n - 0.24);
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
    return new BodyChange(
      sumf / wtsum,
      suml / wtsum,
      sumg / wtsum,
      sumdecw / wtsum,
      sumtherm / wtsum
    );
  }
}
