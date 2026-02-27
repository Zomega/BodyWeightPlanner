import { BMIUtils } from './bmi-utils.js';
import { StorageService } from './storage-service.js';

class BMICalculatorApp {
  constructor() {
    this.targetBmiInput = document.getElementById('target-bmi');
    this.currentWeightInput = document.getElementById('current-weight');
    this.isMetric = true;
    this.isCalories = true;
    this.isReverseMode = false;

    this.init();
  }

  init() {
    this.initEventListeners();
    this.loadFromLocalStorage();
    this.calculate();
  }

  loadSharedSettings() {
    const settings = StorageService.loadSettings();
    if (settings.isMetric !== undefined) this.isMetric = settings.isMetric;
    if (settings.isCalories !== undefined) this.isCalories = settings.isCalories;
  }

  saveSharedSettings() {
    StorageService.saveSettings({
      isMetric: this.isMetric,
      isCalories: this.isCalories
    });
  }

  initEventListeners() {
    this.targetBmiInput?.addEventListener('input', () => this.calculate());
    this.currentWeightInput?.addEventListener('input', () => this.calculate());
    document.getElementById('height')?.addEventListener('input', () => this.calculate());
    document.getElementById('height-ft')?.addEventListener('input', () => this.calculate());
    document.getElementById('height-in')?.addEventListener('input', () => this.calculate());

    document.getElementById('mode-reverse')?.addEventListener('click', () => this.setMode(true));
    document.getElementById('mode-forward')?.addEventListener('click', () => this.setMode(false));

    document.getElementById('btn-bmi-info')?.addEventListener('click', () => {
      document.getElementById('bmi-info-modal')?.showModal();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      document.getElementById('settings-modal')?.showModal();
    });

    document.getElementById('unit-metric')?.addEventListener('click', () => this.setUnits(true));
    document.getElementById('unit-us')?.addEventListener('click', () => this.setUnits(false));
    document.getElementById('unit-cals')?.addEventListener('click', () => this.setEnergyUnits(true));
    document.getElementById('unit-kj')?.addEventListener('click', () => this.setEnergyUnits(false));

    document.getElementById('btn-export')?.addEventListener('click', () => {
      StorageService.exportToJSON();
    });

    document.getElementById('btn-import-trigger')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click();
    });

    document.getElementById('import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (confirm('Importing will overwrite your current settings. Continue?')) {
        try {
          await StorageService.importFromJSON(file);
          window.location.reload();
        } catch (err) {
          alert('Failed to import data: ' + err.message);
        }
      }
    });

    document.getElementById('btn-reset-all')?.addEventListener('click', () => {
      if (confirm('This will permanently delete all your saved data and settings. Are you sure?')) {
        StorageService.clear();
        StorageService.clear(StorageService.SETTINGS_KEY);
        window.location.reload();
      }
    });

    // Global listener for modal close buttons
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.close-modal-btn');
      if (closeBtn) {
        closeBtn.closest('dialog')?.close();
      }
    });
  }

  setMode(isReverse) {
    if (this.isReverseMode === isReverse) return;
    this.isReverseMode = isReverse;
    this.applyModeUI();
    this.calculate();
    this.saveToLocalStorage();
  }

  setUnits(isMetric) {
    if (this.isMetric === isMetric) return;
    const currentHeight = this.getHeightCm();
    const currentWeight = this.getWeightKg();
    this.isMetric = isMetric;
    this.applyUnitUI();

    if (isMetric) {
      if (currentHeight) document.getElementById('height').value = Math.round(currentHeight);
      if (currentWeight) this.currentWeightInput.value = currentWeight.toFixed(1);
    } else {
      if (currentHeight) {
        const totalInches = currentHeight / 2.54;
        document.getElementById('height-ft').value = Math.floor(totalInches / 12);
        document.getElementById('height-in').value = Math.round(totalInches % 12);
      }
      if (currentWeight) this.currentWeightInput.value = (currentWeight * 2.20462).toFixed(1);
    }
    this.calculate();
    this.saveSharedSettings();
    this.saveToLocalStorage();
  }

  setEnergyUnits(isCalories) {
    if (this.isCalories === isCalories) return;
    this.isCalories = isCalories;
    this.applyEnergyUnitUI();
    this.calculate();
    this.saveSharedSettings();
    this.saveToLocalStorage();
  }

  applyModeUI() {
    document.getElementById('mode-reverse')?.classList.toggle('active', this.isReverseMode);
    document.getElementById('mode-forward')?.classList.toggle('active', !this.isReverseMode);
    document.querySelectorAll('.mode-reverse-only').forEach((el) => el.classList.toggle('hidden', !this.isReverseMode));
    document.querySelectorAll('.mode-forward-only').forEach((el) => el.classList.toggle('hidden', this.isReverseMode));

    document.getElementById('app-title').textContent = this.isReverseMode ? 'Reverse BMI Calculator' : 'BMI Calculator';
    document.getElementById('app-subtitle').textContent = this.isReverseMode
      ? 'Find your goal weight based on target BMI'
      : 'Calculate your BMI based on weight and height';
    document.getElementById('result-title').textContent = this.isReverseMode
      ? '1. Goal Weight Calculation'
      : '1. BMI Calculation';
    document.getElementById('result-label-primary').textContent = this.isReverseMode
      ? 'Your Goal Weight:'
      : 'Your Calculated BMI:';
  }

  applyUnitUI() {
    document.getElementById('unit-metric')?.classList.toggle('active', this.isMetric);
    document.getElementById('unit-us')?.classList.toggle('active', !this.isMetric);
    document.querySelectorAll('.height-metric').forEach((el) => el.classList.toggle('hidden', !this.isMetric));
    document.querySelectorAll('.height-us').forEach((el) => el.classList.toggle('hidden', this.isMetric));
    document.querySelectorAll('.unit-weight').forEach((el) => (el.textContent = this.isMetric ? 'kg' : 'lbs'));
  }

  applyEnergyUnitUI() {
    document.getElementById('unit-cals')?.classList.toggle('active', this.isCalories);
    document.getElementById('unit-kj')?.classList.toggle('active', !this.isCalories);
    document.querySelectorAll('.unit-energy').forEach((el) => (el.textContent = this.isCalories ? 'kcal/day' : 'kj/day'));
  }

  getHeightCm() {
    if (this.isMetric) return parseFloat(document.getElementById('height')?.value) || 0;
    const ft = parseFloat(document.getElementById('height-ft')?.value) || 0;
    const inch = parseFloat(document.getElementById('height-in')?.value) || 0;
    return (ft * 12 + inch) * 2.54;
  }

  getWeightKg() {
    const val = parseFloat(this.currentWeightInput.value) || 0;
    return this.isMetric ? val : val / 2.20462;
  }

  calculate() {
    const heightCm = this.getHeightCm();
    if (!heightCm) return;

    let targetBmi;
    let weightKg;

    if (this.isReverseMode) {
      targetBmi = parseFloat(this.targetBmiInput.value);
      if (!targetBmi) return;
      const heightM = heightCm / 100;
      weightKg = targetBmi * Math.pow(heightM, 2);
    } else {
      weightKg = this.getWeightKg();
      if (!weightKg) return;
      targetBmi = BMIUtils.calculate(weightKg, heightCm);
    }

    const weightLbs = weightKg * 2.20462;
    this.updateUI(targetBmi, heightCm, weightKg, weightLbs);
    this.saveToLocalStorage();
  }

  updateUI(targetBmi, heightCm, weightKg, weightLbs) {
    // 1. Primary Result
    if (this.isReverseMode) {
      const primaryWeight = this.isMetric ? weightKg : weightLbs;
      const primaryUnit = this.isMetric ? 'kg' : 'lbs';
      document.getElementById('result-weight-primary').textContent = primaryWeight.toFixed(1);
      document.getElementById('result-unit-primary').textContent = primaryUnit;
    } else {
      document.getElementById('result-weight-primary').textContent = targetBmi.toFixed(1);
      document.getElementById('result-unit-primary').textContent = 'BMI';
    }

    // 2. Analysis Table
    const category = BMIUtils.getCategory(targetBmi);
    this.updateAnalysisTable(heightCm, category);

    const descEl = document.getElementById('category-description');
    let categoryHtml;
    let dietaryTitle;
    let dietaryTip = '';
    let pRange;
    let macros;
    let calAdjustment;

    if (category === 'Normal') {
      descEl.style.background = '#e8f5e9';
      descEl.style.color = '#2e7d32';
      categoryHtml = '<strong>Within Standard Range:</strong> This BMI is statistically associated with the lowest risk for metabolic and cardiovascular disease in the general population.';
      dietaryTitle = 'Maintenance Strategy:';
      pRange = { min: 0.5, max: 0.7 };
      macros = { c: 45, p: 25, f: 30 };
      calAdjustment = 0;
    } else if (category === 'Underweight') {
      descEl.style.background = '#fff3e0';
      descEl.style.color = '#e65100';
      categoryHtml = '<strong>Sub-standard Mass:</strong> Values in this range can indicate nutritional deficiencies, reduced immune function, or low bone density.';
      dietaryTitle = 'Hypercaloric Strategy:';
      dietaryTip = '<strong>Note:</strong> Prioritize caloric density and protein intake to support lean mass accrual.';
      pRange = { min: 0.7, max: 0.8 };
      macros = { c: 50, p: 20, f: 30 };
      calAdjustment = 500;
    } else {
      descEl.style.background = '#fff3e0';
      descEl.style.color = '#e65100';
      categoryHtml = `<strong>Elevated Mass (${category}):</strong> This range is associated with increased metabolic load. Note that clinical relevance varies significantly based on muscle mass and age.`;
      dietaryTitle = 'Hypocaloric Strategy:';
      pRange = { min: 0.7, max: 0.8 };
      macros = { c: 40, p: 30, f: 30 };
      calAdjustment = -500;
    }

    descEl.innerHTML = categoryHtml;
    document.getElementById('dietary-strategy-title').textContent = dietaryTitle;

    const tipEl = document.getElementById('dietary-tip');
    if (dietaryTip) {
      tipEl.innerHTML = dietaryTip;
      tipEl.classList.remove('hidden');
    } else {
      tipEl.classList.add('hidden');
    }

    // 3. Dietary Math
    const energyMult = this.isCalories ? 1 : 4.184;
    const baseMaint = weightKg * 30;
    const estCals = Math.max(1200, Math.round(baseMaint + calAdjustment));
    document.getElementById('rec-cals').textContent = `${Math.round((estCals - 100) * energyMult)} - ${Math.round((estCals + 100) * energyMult)}`;

    const pMin = Math.round(weightLbs * pRange.min);
    const pMax = Math.round(weightLbs * pRange.max);
    document.getElementById('rec-protein').textContent = `${pMin} - ${pMax}`;

    document.getElementById('macro-c-pct').textContent = macros.c;
    document.getElementById('macro-p-pct').textContent = macros.p;
    document.getElementById('macro-f-pct').textContent = macros.f;

    document.getElementById('macro-carbs').textContent = Math.round((estCals * (macros.c / 100)) / 4);
    document.getElementById('macro-protein').textContent = Math.round((estCals * (macros.p / 100)) / 4);
    document.getElementById('macro-fat').textContent = Math.round((estCals * (macros.f / 100)) / 9);

    // 5. Summary
    let summaryGoalText;
    if (category === 'Underweight') {
      summaryGoalText = `Mass gain via positive energy balance and protein support.`;
    } else if (category === 'Normal') {
      summaryGoalText = `Maintenance via energy balance.`;
    } else {
      summaryGoalText = `Adipose reduction via negative energy balance and muscle preservation.`;
    }

    document.getElementById('summary-content').innerHTML = `
            <p><strong>Resultant Weight:</strong> ~${Math.round(weightLbs)} lbs / ${weightKg.toFixed(1)} kg</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Primary Objective:</strong> ${summaryGoalText}</p>
            <p style="margin-top:1rem; font-size:0.9rem; opacity:0.8;">
                This tool provides mathematical estimates based on population averages. Clinical application should be overseen by a medical professional.
            </p>
        `;
  }

  updateAnalysisTable(heightCm, activeCategory) {
    const tableBody = document.getElementById('bmi-table-body');
    if (!tableBody) return;

    const ranges = [
      { label: 'Underweight', bmi: '< 18.5', minBmi: 0, maxBmi: 18.5 },
      { label: 'Normal', bmi: '18.5 – 24.9', minBmi: 18.5, maxBmi: 25 },
      { label: 'Overweight', bmi: '25.0 – 29.9', minBmi: 25, maxBmi: 30 },
      { label: 'Obese', bmi: '≥ 30.0', minBmi: 30, maxBmi: 60 }
    ];

    const conversion = this.isMetric ? 1 : 2.20462;
    const heightFactor = Math.pow(heightCm / 100, 2);

    tableBody.innerHTML = ranges
      .map((r) => {
        const isSelected = r.label === activeCategory;
        const weightMin = Math.round(r.minBmi * heightFactor * conversion);
        const weightMax = Math.round(r.maxBmi * heightFactor * conversion);

        let weightStr;
        if (r.label === 'Underweight') {
          weightStr = `< ${weightMax}`;
        } else if (r.label === 'Obese') {
          weightStr = `> ${weightMin}`;
        } else {
          weightStr = `${weightMin} – ${weightMax}`;
        }

        return `
                <tr class="${isSelected ? 'highlight-row' : ''}">
                    <td>${r.label}</td>
                    <td>${r.bmi}</td>
                    <td>${weightStr}</td>
                </tr>
            `;
      })
      .join('');
  }

  saveToLocalStorage() {
    const data = {
      isReverseMode: this.isReverseMode,
      targetBmi: this.targetBmiInput.value,
      currentWeight: this.currentWeightInput.value,
      heightCm: this.getHeightCm()
    };
    StorageService.save(data, 'bmi_calculator_data');
  }

  loadFromLocalStorage() {
    this.loadSharedSettings();
    const data = StorageService.load('bmi_calculator_data');
    if (!data) {
        this.applyUnitUI();
        this.applyEnergyUnitUI();
        this.applyModeUI();
        return;
    }
    
    this.isReverseMode = data.isReverseMode !== undefined ? data.isReverseMode : false;

    this.applyUnitUI();
    this.applyEnergyUnitUI();
    this.applyModeUI();

    if (data.targetBmi) this.targetBmiInput.value = data.targetBmi;
    if (data.currentWeight) this.currentWeightInput.value = data.currentWeight;
    
    const height = data.heightCm;
    if (height) {
        if (this.isMetric) {
            document.getElementById('height').value = height;
        } else {
            const totalInches = height / 2.54;
            document.getElementById('height-ft').value = Math.floor(totalInches / 12);
            document.getElementById('height-in').value = Math.round(totalInches % 12);
        }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new BMICalculatorApp());
