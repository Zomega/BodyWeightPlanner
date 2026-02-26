import Baseline from './baseline.js';
import Intervention from './intervention.js';
import BodyModel from './bodymodel.js';
import DailyParams from './dailyparams.js';
import { WorkActivityLevel, LeisureActivityLevel } from './constants.js';

// Polyfill from legacy appController.js
if (!Math.IEEERemainder) {
    Math.IEEERemainder = function (dividend, divisor) {
        return dividend - (divisor * Math.round(dividend / divisor));
    };
}

class App {
    constructor() {
        this.baseline = new Baseline();
        this.isMetric = true;
        this.isCalories = true;
        this.showAdvanced = false;
        this.activeTab = 'goal'; // 'goal' or 'lifestyle'
        this.chartView = 'weight'; // 'weight' or 'fat'
        this.chart = null;
        this.simLengthTouched = false;
        this.STORAGE_KEY = 'bwp_user_data';
        this.init();
    }

    init() {
        try {
            this.initEventListeners();
            this.initChart();
            this.populatePalOptions();
            this.loadFromLocalStorage();

            const list = document.getElementById('intervention-list');
            if (list && list.children.length === 0) {
                this.addPhase(0, 2000, 0, false);
            }

            this.updateResults();
        } catch (e) {
            console.error("Initialization error:", e);
        }
    }

    addPhase(day = 0, cals = 2000, act = 0, ramp = false, id = null) {
        const list = document.getElementById('intervention-list');
        if (!list) return;

        const phaseId = id || crypto.randomUUID();
        const phaseIdx = list.children.length + 1;
        const actId = `phase-act-${phaseId}`;
        const calsId = `phase-cals-${phaseId}`;
        
        const div = document.createElement('div');
        div.className = 'intervention-box';
        div.dataset.phaseId = phaseId;
        div.innerHTML = `
            <div class="intervention-header">
                <h3>Phase ${phaseIdx}</h3>
                ${phaseIdx > 1 ? '<button class="remove-btn" title="Remove Phase">&times;</button>' : ''}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Day</label>
                    <input type="number" class="phase-day" value="${day}" min="0">
                </div>
                <div class="form-group">
                    <label>Calories (<span class="unit-energy">${this.isCalories ? 'cals/day' : 'kj/day'}</span>)</label>
                    <input type="number" class="phase-cals" id="${calsId}" value="${cals}" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Activity Change (%)</label>
                    <div class="input-with-action">
                        <input type="number" class="phase-act" id="${actId}" value="${act}">
                        <button type="button" class="action-btn estimate-phase-act" data-target="${actId}">Estimate</button>
                    </div>
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <div class="checkbox-group">
                        <input type="checkbox" class="phase-ramp" ${ramp ? 'checked' : ''}>
                        <label>Ramp to this phase</label>
                    </div>
                </div>
            </div>
        `;

        const removeBtn = div.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                div.remove();
                this.reindexPhases();
                this.updateResults();
                this.saveToLocalStorage();
            });
        }

        div.querySelector('.estimate-phase-act').addEventListener('click', (e) => {
            this.openActChangeModal(e.target.dataset.target);
        });

        div.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                let type = 'phase-act';
                if (e.target.classList.contains('phase-day')) type = 'goal-days';
                if (e.target.classList.contains('phase-cals')) type = 'sodium'; // Borrowing sodium max check for cals or just leave

                const validated = this.validateInput(type, e.target.value);
                e.target.value = validated.newVal;

                this.updateResults();
                this.saveToLocalStorage();
            });
        });

        list.appendChild(div);
    }

    validateInput(id, val) {
        let newVal = val;
        let error = "";
        const numVal = parseFloat(val);

        switch (id) {
            case 'age':
                if (numVal < 18) { error = "Age must be at least 18"; newVal = 18; }
                if (numVal > 120) { error = "Age must be no more than 120"; newVal = 120; }
                break;
            case 'weight':
            case 'goal-weight':
                if (numVal < 10) { error = "Weight must be at least 10kg"; newVal = 10; }
                if (numVal > 1000) { error = "Weight must be no more than 1000kg"; newVal = 1000; }
                break;
            case 'height':
                if (numVal < 50) { error = "Height must be at least 50cm"; newVal = 50; }
                if (numVal > 300) { error = "Height must be no more than 300cm"; newVal = 300; }
                break;
            case 'height-ft':
                if (numVal < 1) { error = "Min 1ft"; newVal = 1; }
                if (numVal > 9) { error = "Max 9ft"; newVal = 9; }
                break;
            case 'height-in':
                if (numVal < 0) { error = "Min 0in"; newVal = 0; }
                if (numVal > 11) { error = "Max 11in"; newVal = 11; }
                break;
            case 'pal':
                if (numVal < 1.1) { error = "PAL must be at least 1.1"; newVal = 1.1; }
                if (numVal > 3.0) { error = "PAL must be no more than 3.0"; newVal = 3.0; }
                break;
            case 'goal-days':
            case 'sim-length':
                if (numVal < 1) { error = "Min 1 day"; newVal = 1; }
                if (numVal > 3650) { error = "Max 10 years (3650 days)"; newVal = 3650; }
                if (numVal > 500) { error = "Warning: Long simulations may be slow."; }
                break;
            case 'activity-change':
            case 'phase-act':
                if (numVal < -100) { error = "Min change -100%"; newVal = -100; }
                if (numVal > 500) { error = "Max change 500%"; newVal = 500; }
                break;
            case 'carbs-pct':
                if (numVal < 0) { error = "Min 0%"; newVal = 0; }
                if (numVal > 100) { error = "Max 100%"; newVal = 100; }
                break;
            case 'sodium':
                if (numVal < 0) { error = "Sodium cannot be negative"; newVal = 0; }
                if (numVal > 20000) { error = "Max sodium 20,000mg"; newVal = 20000; }
                break;
            case 'bfp':
                if (numVal < 0) { error = "BFP cannot be negative"; newVal = 0; }
                if (numVal > 100) { error = "Max BFP 100%"; newVal = 100; }
                break;
            case 'rmr':
                if (numVal < 0) { error = "RMR cannot be negative"; newVal = 0; }
                if (numVal > 100000) { error = "Max RMR 100,000 cals"; newVal = 100000; }
                break;
        }

        return { newVal, error };
    }

    showError(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        this.clearError(id);
        const div = document.createElement('div');
        div.className = 'alert-box warning validation-error';
        div.textContent = msg;
        el.closest('.form-group')?.after(div);
    }

    clearError(id) {
        const el = document.getElementById(id);
        const err = el?.closest('.form-group')?.nextElementSibling;
        if (err?.classList.contains('validation-error')) {
            err.remove();
        }
    }

    reindexPhases() {
        const list = document.getElementById('intervention-list');
        if (!list) return;
        Array.from(list.children).forEach((box, i) => {
            const h3 = box.querySelector('h3');
            if (h3) h3.textContent = `Phase ${i + 1}`;
        });
    }

    openActChangeModal(targetId) {
        const modal = document.getElementById('pal-change-modal');
        if (!modal) return;
        modal.dataset.targetId = targetId;
        const list = document.getElementById('activity-change-list');
        if (list) list.innerHTML = '';
        this.addActivityRow();
        modal.showModal();
    }

    initChart() {
        const canvas = document.getElementById('mainChart');
        if (!canvas) {
            console.error("Canvas element 'mainChart' not found.");
            return;
        }
        const ctx = canvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Projection',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        zIndex: 2
                    },
                    {
                        label: 'Upper Bound',
                        data: [],
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(52, 152, 219, 0.15)',
                        fill: '+1',
                        pointRadius: 0,
                        zIndex: 1
                    },
                    {
                        label: 'Lower Bound',
                        data: [],
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(52, 152, 219, 0.15)',
                        fill: false,
                        pointRadius: 0,
                        zIndex: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    annotation: {
                        annotations: {
                            goalLine: {
                                type: 'line',
                                scaleID: 'x',
                                value: undefined,
                                borderColor: 'rgba(0,0,0,0.3)',
                                borderWidth: 2,
                                borderDash: [4, 4],
                                display: false,
                                label: {
                                    display: true,
                                    content: 'Goal',
                                    position: 'start'
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: { title: { display: true, text: 'Weight (kg)' } },
                    x: { title: { display: true, text: 'Days' } }
                }
            }
        });
    }

    populatePalOptions() {
        const workSelect = document.getElementById('work-activity');
        const leisureSelect = document.getElementById('leisure-activity');
        if (!workSelect || !leisureSelect) return;

        Object.values(WorkActivityLevel).sort((a,b) => a.sortOrder - b.sortOrder).forEach(opt => {
            const el = document.createElement('option');
            el.value = opt.name; el.textContent = opt.name; el.dataset.desc = opt.description;
            workSelect.appendChild(el);
        });
        Object.values(LeisureActivityLevel).sort((a,b) => a.sortOrder - b.sortOrder).forEach(opt => {
            const el = document.createElement('option');
            el.value = opt.name; el.textContent = opt.name; el.dataset.desc = opt.description;
            leisureSelect.appendChild(el);
        });
        const updateDescs = () => {
            document.getElementById('work-desc').textContent = workSelect.selectedOptions[0]?.dataset.desc || '';
            document.getElementById('leisure-desc').textContent = leisureSelect.selectedOptions[0]?.dataset.desc || '';
        };
        workSelect.addEventListener('change', updateDescs);
        leisureSelect.addEventListener('change', updateDescs);
        updateDescs();
    }

    initEventListeners() {
        const inputs = [
            'weight', 'sex', 'age', 'height', 'height-ft', 'height-in', 'pal',
            'goal-weight', 'goal-days', 'activity-change',
            'carbs-pct', 'sodium', 'bfp', 'uncertainty', 'sim-length', 'rmr'
        ];
        
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', (e) => {
                const validated = this.validateInput(id, e.target.value);
                if (validated.error) {
                    this.showError(id, validated.error);
                } else {
                    this.clearError(id);
                }
                e.target.value = validated.newVal;

                if (id === 'goal-days' && !this.simLengthTouched) {
                    const simEl = document.getElementById('sim-length');
                    if (simEl) simEl.value = (parseInt(el.value) || 180) * 2;
                }
                this.updateResults();
                this.saveToLocalStorage();
            });
        });

        document.getElementById('add-phase')?.addEventListener('click', () => {
            const list = document.getElementById('intervention-list');
            const lastDay = parseInt(list?.lastElementChild?.querySelector('.phase-day')?.value) || 0;
            this.addPhase(lastDay + 30, 2000, 0, false);
            this.updateResults();
            this.saveToLocalStorage();
        });

        const simLenEl = document.getElementById('sim-length');
        if (simLenEl) {
            simLenEl.addEventListener('input', () => {
                this.simLengthTouched = true;
                this.updateResults();
            });
        }

        document.getElementById('bfp-mode')?.addEventListener('change', () => {
            this.updateResults();
            this.saveToLocalStorage();
        });
        document.getElementById('rmr-mode')?.addEventListener('change', () => {
            this.updateResults();
            this.saveToLocalStorage();
        });
        document.getElementById('unit-metric')?.addEventListener('click', () => this.setUnits(true));
        document.getElementById('unit-us')?.addEventListener('click', () => this.setUnits(false));
        document.getElementById('unit-cals')?.addEventListener('click', () => this.setEnergyUnits(true));
        document.getElementById('unit-kj')?.addEventListener('click', () => this.setEnergyUnits(false));
        
        document.getElementById('toggle-advanced-show')?.addEventListener('click', () => this.setAdvanced(true));
        document.getElementById('toggle-advanced-hide')?.addEventListener('click', () => this.setAdvanced(false));

        document.getElementById('tab-goal')?.addEventListener('click', () => this.setTab('goal'));
        document.getElementById('tab-lifestyle')?.addEventListener('click', () => this.setTab('lifestyle'));
        document.getElementById('chart-weight')?.addEventListener('click', () => this.setChartView('weight'));
        document.getElementById('chart-fat')?.addEventListener('click', () => this.setChartView('fat'));

        document.getElementById('link-about')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('about-modal')?.showModal();
        });

        document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV());

        document.getElementById('btn-reset-all')?.addEventListener('click', () => {
            if (confirm("This will permanently delete all your saved data and settings. Are you sure?")) {
                this.resetAllData();
            }
        });

        const modal = document.getElementById('pal-modal');
        document.getElementById('btn-estimate-pal')?.addEventListener('click', () => modal.showModal());
        document.getElementById('pal-cancel')?.addEventListener('click', () => modal.close());
        modal?.addEventListener('submit', () => {
            const work = document.getElementById('work-activity').value;
            const leisure = document.getElementById('leisure-activity').value;
            document.getElementById('pal').value = this.getPalValue(leisure, work);
            this.updateResults();
            this.saveToLocalStorage();
        });

        const changeModal = document.getElementById('pal-change-modal');
        document.getElementById('btn-estimate-act-change')?.addEventListener('click', () => {
            this.openActChangeModal('activity-change');
        });
        document.getElementById('pal-change-cancel')?.addEventListener('click', () => changeModal.close());
        document.getElementById('add-activity-row')?.addEventListener('click', () => this.addActivityRow());
        changeModal?.addEventListener('submit', () => {
            const targetId = changeModal.dataset.targetId;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.value = Math.round(this.calculateTotalActChange());
                this.updateResults();
                this.saveToLocalStorage();
            }
        });
    }

    addActivityRow() {
        const list = document.getElementById('activity-change-list');
        const template = document.getElementById('activity-row-template');
        if (!list || !template) return;

        const clone = template.content.cloneNode(true);
        const row = clone.querySelector('.activity-row');
        
        row.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', () => this.updateActChangePreview());
        });

        row.querySelector('.remove-activity-btn').addEventListener('click', () => {
            row.remove();
            this.updateActChangePreview();
        });

        list.appendChild(row);
        this.updateActChangePreview();
    }

    updateActChangePreview() {
        const pct = this.calculateTotalActChange();
        const display = document.getElementById('total-act-change-pct');
        if (display) display.textContent = Math.round(pct);
    }

    calculateTotalActChange() {
        const list = document.getElementById('activity-change-list');
        if (!list) return 0;

        let metTotal = 0;
        Array.from(list.children).forEach(row => {
            const direction = parseInt(row.querySelector('.act-direction').value);
            const metValue = parseFloat(row.querySelector('.act-type').value);
            const duration = parseInt(row.querySelector('.act-duration').value);
            const frequency = parseInt(row.querySelector('.act-frequency').value);
            const period = parseInt(row.querySelector('.act-period').value);

            const met = direction * (metValue - 1) * (duration / 60) * frequency * (1 / period);
            if (!isNaN(met)) metTotal += met;
        });

        const baselineActParam = this.baseline.getActivityParam();
        let actChangePct = (metTotal / baselineActParam) * 100;

        return Math.max(-100, Math.min(500, actChangePct));
    }

    setAdvanced(show, shouldSave = true) {
        this.showAdvanced = show;
        document.getElementById('toggle-advanced-show')?.classList.toggle('active', show);
        document.getElementById('toggle-advanced-hide')?.classList.toggle('active', !show);
        document.querySelectorAll('.advanced-controls').forEach(el => el.style.display = show ? 'block' : 'none');
        if (shouldSave) this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        const list = document.getElementById('intervention-list');
        const phases = [];
        if (list) {
            Array.from(list.children).forEach(box => {
                phases.push({
                    id: box.dataset.phaseId,
                    day: box.querySelector('.phase-day')?.value,
                    cals: box.querySelector('.phase-cals')?.value,
                    act: box.querySelector('.phase-act')?.value,
                    ramp: box.querySelector('.phase-ramp')?.checked
                });
            });
        }

        const data = {
            isMetric: this.isMetric,
            isCalories: this.isCalories,
            showAdvanced: this.showAdvanced,
            weight: document.getElementById('weight')?.value,
            sex: document.getElementById('sex')?.value,
            age: document.getElementById('age')?.value,
            height: document.getElementById('height')?.value,
            heightFt: document.getElementById('height-ft')?.value,
            heightIn: document.getElementById('height-in')?.value,
            pal: document.getElementById('pal')?.value,
            goalWeight: document.getElementById('goal-weight')?.value,
            goalDays: document.getElementById('goal-days')?.value,
            activityChange: document.getElementById('activity-change')?.value,
            bfpMode: document.getElementById('bfp-mode')?.value,
            rmrMode: document.getElementById('rmr-mode')?.value,
            phases: phases
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            
            if (data.isMetric !== undefined) {
                this.isMetric = data.isMetric;
                this.applyUnitUI();
            }
            if (data.isCalories !== undefined) {
                this.isCalories = data.isCalories;
                this.applyEnergyUnitUI();
            }
            if (data.showAdvanced !== undefined) {
                this.setAdvanced(data.showAdvanced, false);
            }

            if (data.weight) document.getElementById('weight').value = data.weight;
            if (data.sex) document.getElementById('sex').value = data.sex;
            if (data.age) document.getElementById('age').value = data.age;
            if (data.height) document.getElementById('height').value = data.height;
            if (data.heightFt) document.getElementById('height-ft').value = data.heightFt;
            if (data.heightIn) document.getElementById('height-in').value = data.heightIn;
            if (data.pal) document.getElementById('pal').value = data.pal;
            if (data.goalWeight) document.getElementById('goal-weight').value = data.goalWeight;
            if (data.goalDays) document.getElementById('goal-days').value = data.goalDays;
            if (data.activityChange) document.getElementById('activity-change').value = data.activityChange;
            if (data.bfpMode) document.getElementById('bfp-mode').value = data.bfpMode;
            if (data.rmrMode) document.getElementById('rmr-mode').value = data.rmrMode;

            if (data.phases && Array.isArray(data.phases)) {
                const list = document.getElementById('intervention-list');
                if (list) list.innerHTML = '';
                data.phases.forEach(p => {
                    this.addPhase(p.day, p.cals, p.act, p.ramp, p.id);
                });
            }

        } catch (e) {
            console.error("Error loading from localStorage", e);
        }
    }

    resetAllData() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.reload();
    }

    applyEnergyUnitUI() {
        document.getElementById('unit-cals')?.classList.toggle('active', this.isCalories);
        document.getElementById('unit-kj')?.classList.toggle('active', !this.isCalories);
        document.querySelectorAll('.unit-energy').forEach(el => el.textContent = this.isCalories ? 'cals/day' : 'kj/day');
    }

    applyUnitUI() {
        document.getElementById('unit-metric')?.classList.toggle('active', this.isMetric);
        document.getElementById('unit-us')?.classList.toggle('active', !this.isMetric);
        document.querySelectorAll('.height-metric').forEach(el => el.style.display = this.isMetric ? 'block' : 'none');
        document.querySelectorAll('.height-us').forEach(el => el.style.display = this.isMetric ? 'none' : 'block');
        document.querySelectorAll('.unit-weight').forEach(el => el.textContent = this.isMetric ? 'kg' : 'lbs');
        if (this.chart) {
            this.chart.options.scales.y.title.text = this.chartView === 'weight' ? 
                `Weight (${this.isMetric ? 'kg' : 'lbs'})` : 'Body Fat %';
        }
    }

    setTab(tab) {
        this.activeTab = tab;
        document.getElementById('tab-goal')?.classList.toggle('active', tab === 'goal');
        document.getElementById('tab-lifestyle')?.classList.toggle('active', tab === 'lifestyle');
        
        const goalSec = document.getElementById('goal-section');
        if (goalSec) goalSec.style.display = tab === 'goal' ? 'block' : 'none';
        
        const lifeSec = document.getElementById('lifestyle-section');
        if (lifeSec) lifeSec.style.display = tab === 'lifestyle' ? 'block' : 'none';
        
        const goalRes = document.getElementById('goal-results-group');
        if (goalRes) goalRes.style.display = tab === 'goal' ? 'flex' : 'none';
        
        const lifeRes = document.getElementById('lifestyle-results-group');
        if (lifeRes) lifeRes.style.display = tab === 'lifestyle' ? 'flex' : 'none';
        
        this.updateResults();
    }

    setChartView(view) {
        this.chartView = view;
        document.getElementById('chart-weight')?.classList.toggle('active', view === 'weight');
        document.getElementById('chart-fat')?.classList.toggle('active', view === 'fat');
        if (this.chart) {
            this.chart.options.scales.y.title.text = view === 'weight' ? `Weight (${this.isMetric ? 'kg' : 'lbs'})` : 'Body Fat %';
        }
        this.updateResults();
    }

    getPalValue(leisure, work) {
        const map = {
            "Very Light|Very Light": 1.4, "Very Light|Light": 1.5, "Very Light|Moderate": 1.6, "Very Light|Heavy": 1.7,
            "Light|Very Light": 1.5, "Light|Light": 1.6, "Light|Moderate": 1.7, "Light|Heavy": 1.8,
            "Moderate|Very Light": 1.6, "Moderate|Light": 1.7, "Moderate|Moderate": 1.8, "Moderate|Heavy": 1.9,
            "Active|Very Light": 1.7, "Active|Light": 1.8, "Active|Moderate": 1.9, "Active|Heavy": 2.1,
            "Very Active|Very Light": 1.9, "Very Active|Light": 2.0, "Very Active|Moderate": 2.2, "Very Active|Heavy": 2.3
        };
        return map[`${leisure}|${work}`] || 1.6;
    }

    setUnits(isMetric) {
        if (this.isMetric === isMetric) return;
        const currentWeight = this.getWeightKg();
        const currentGoalWeight = this.getGoalWeightKg();
        const currentHeight = this.getHeightCm();
        this.isMetric = isMetric;
        
        this.applyUnitUI();
        
        if (isMetric) {
            document.getElementById('weight').value = (currentWeight || 70).toFixed(1);
            document.getElementById('goal-weight').value = (currentGoalWeight || 70).toFixed(1);
            if (currentHeight) document.getElementById('height').value = Math.round(currentHeight);
        } else {
            document.getElementById('weight').value = (currentWeight * 2.20462 || 154.3).toFixed(1);
            document.getElementById('goal-weight').value = (currentGoalWeight * 2.20462 || 154.3).toFixed(1);
            if (currentHeight) {
                const totalInches = currentHeight / 2.54;
                document.getElementById('height-ft').value = Math.floor(totalInches / 12);
                document.getElementById('height-in').value = Math.round(totalInches % 12);
            }
        }
        this.updateResults();
        this.saveToLocalStorage();
    }

    getWeightKg() {
        const val = parseFloat(document.getElementById('weight')?.value) || 0;
        return this.isMetric ? val : val / 2.20462;
    }

    getGoalWeightKg() {
        const val = parseFloat(document.getElementById('goal-weight')?.value) || 0;
        return this.isMetric ? val : val / 2.20462;
    }

    getHeightCm() {
        if (this.isMetric) return parseFloat(document.getElementById('height')?.value) || 0;
        const ft = parseFloat(document.getElementById('height-ft')?.value) || 0;
        const inch = parseFloat(document.getElementById('height-in')?.value) || 0;
        return (ft * 12 + inch) * 2.54;
    }

    updateResults() {
        try {
            const weight = this.getWeightKg();
            const height = this.getHeightCm();
            const sex = document.getElementById('sex')?.value === 'male';
            const age = parseFloat(document.getElementById('age')?.value) || 0;
            const pal = parseFloat(document.getElementById('pal')?.value) || 1.6;
            const simLength = parseInt(document.getElementById('sim-length')?.value) || 360;
            const uncertaintyPct = parseFloat(document.getElementById('uncertainty')?.value) || 10;

            if (!weight || !height || !age) return;

            this.baseline.isMale = sex; this.baseline.weight = weight; this.baseline.age = age; this.baseline.height = height; this.baseline.pal = pal;
            this.baseline.carbIntakePct = parseFloat(document.getElementById('carbs-pct')?.value) || 50;
            this.baseline.sodium = parseFloat(document.getElementById('sodium')?.value) || 4000;
            
            const bfpModeEl = document.getElementById('bfp-mode');
            if (bfpModeEl) {
                this.baseline.bfpCalc = (bfpModeEl.value === 'auto');
                if (!this.baseline.bfpCalc) this.baseline.bfp = parseFloat(document.getElementById('bfp')?.value) || 18;
                if (this.baseline.bfpCalc) {
                    const bfpVal = this.baseline.getBFP();
                    const bfpInput = document.getElementById('bfp');
                    if (bfpInput) bfpInput.value = bfpVal.toFixed(1);
                }
            }

            const rmrModeEl = document.getElementById('rmr-mode');
            if (rmrModeEl) {
                this.baseline.rmrCalc = (rmrModeEl.value === 'auto');
                if (!this.baseline.rmrCalc) this.baseline.rmr = parseFloat(document.getElementById('rmr')?.value) || 1700;
                if (this.baseline.rmrCalc) {
                    const rmrVal = this.baseline.getRMR();
                    const rmrInput = document.getElementById('rmr');
                    if (rmrInput) rmrInput.value = Math.round(rmrVal);
                }
            }

            const maintCals = this.baseline.getMaintCals();
            const maintRes = document.getElementById('maint-cals');
            if (maintRes) maintRes.textContent = Math.round(maintCals * (this.isCalories ? 1 : 4.184));
            
            const bmi = this.baseline.getBMI();
            const range = this.baseline.getHealthyWeightRange();
            const bmiRes = document.getElementById('current-bmi');
            if (bmiRes) bmiRes.textContent = bmi.toFixed(1);
            
            const rangeRes = document.getElementById('healthy-range');
            if (rangeRes) {
                rangeRes.textContent = this.isMetric ? `${range.low} - ${range.high}` : 
                    `${Math.round(range.low * 2.20462)} - ${Math.round(range.high * 2.20462)}`;
            }
            
            this.updateBMICategory(bmi);
            this.checkBMIAlert(bmi, range);

            const calorieSpread = maintCals * uncertaintyPct / 100;

            if (this.activeTab === 'goal') {
                this.handleGoalSimulation(simLength, calorieSpread);
            } else {
                this.handleLifestyleSimulation(simLength, calorieSpread);
            }
        } catch (e) {
            console.error("Update error:", e);
        }
    }

    handleGoalSimulation(simLength, calorieSpread) {
        const goalWeight = this.getGoalWeightKg();
        const goalDays = parseInt(document.getElementById('goal-days')?.value) || 180;
        const activityChange = parseFloat(document.getElementById('activity-change')?.value) || 0;

        try {
            const goalInt = Intervention.forgoal(this.baseline, goalWeight, goalDays, activityChange, 1000, 0.01);
            
            if (goalInt.calories < 1000) {
                this.showError('goal-cals', "Intake below 1000 calories/day may not meet nutritional needs.");
            } else {
                this.clearError('goal-cals');
            }

            const energyMult = this.isCalories ? 1 : 4.184;
            const goalCalsRes = document.getElementById('goal-cals');
            if (goalCalsRes) goalCalsRes.textContent = Math.round(goalInt.calories * energyMult);

            const goalBC = BodyModel.projectFromBaselineViaIntervention(this.baseline, goalInt, goalDays);
            const targetBmi = this.baseline.getNewBMI(goalWeight);
            const targetBmiRes = document.getElementById('target-bmi');
            if (targetBmiRes) targetBmiRes.textContent = targetBmi.toFixed(1);

            const maintInt = new Intervention();
            maintInt.calories = goalBC.cals4balance(this.baseline, goalInt.getAct(this.baseline));
            const goalMaintRes = document.getElementById('goal-maint-cals');
            if (goalMaintRes) goalMaintRes.textContent = Math.round(maintInt.calories * energyMult);

            const trajectory = this.collectTrajectoryData(this.baseline, goalInt, maintInt, goalDays, simLength);
            const upperTraj = this.collectTrajectoryData(this.getModifiedBaseline(calorieSpread), goalInt, maintInt, goalDays, simLength);
            const lowerTraj = this.collectTrajectoryData(this.getModifiedBaseline(-calorieSpread), goalInt, maintInt, goalDays, simLength);

            this.lastResults = { trajectory, upperTraj, lowerTraj, goalDays };
            this.updateChartData(
                trajectory.map(d => d.value), 
                upperTraj.map(d => d.value), 
                lowerTraj.map(d => d.value), 
                goalDays
            );
            this.clearError('goal-weight');
        } catch (e) {
            if (e.message.includes("Unachievable Goal")) {
                this.showError('goal-weight', `This goal is unachievable in ${goalDays} days. Try more time or more activity.`);
            }
            this.clearResults();
        }
    }

    handleLifestyleSimulation(simLength, calorieSpread) {
        const list = document.getElementById('intervention-list');
        const interventions = [];
        let lowCalPhase = false;

        if (list) {
            Array.from(list.children).forEach(box => {
                const day = parseInt(box.querySelector('.phase-day')?.value) || 0;
                const calsEl = box.querySelector('.phase-cals');
                const cals = parseFloat(calsEl?.value) || 2000;
                const act = parseFloat(box.querySelector('.phase-act')?.value) || 0;
                const ramp = box.querySelector('.phase-ramp')?.checked || false;

                this.clearError(calsEl.id);
                if (cals < 1000) {
                    lowCalPhase = true;
                    this.showError(calsEl.id, "Intake below 1000 calories/day may not meet nutritional needs.");
                }

                const inter = new Intervention(
                    day,
                    cals,
                    this.baseline.carbIntakePct,
                    act,
                    this.baseline.sodium
                );
                inter.rampon = ramp;
                interventions.push(inter);
            });
        }

        const finalWeightRes = document.getElementById('final-weight');
        if (lowCalPhase) {
            this.showError('final-weight', "One or more phases have an intake below 1000 calories/day, which may not meet nutritional needs.");
        } else {
            this.clearError('final-weight');
        }

        if (interventions.length === 0) {
            interventions.push(new Intervention(0, 2000, this.baseline.carbIntakePct, 0, this.baseline.sodium));
        }

        const trajectory = this.collectMultiTrajectoryData(this.baseline, interventions, simLength);
        const upperTraj = this.collectMultiTrajectoryData(this.getModifiedBaseline(calorieSpread), interventions, simLength);
        const lowerTraj = this.collectMultiTrajectoryData(this.getModifiedBaseline(-calorieSpread), interventions, simLength);

        this.lastResults = { trajectory, upperTraj, lowerTraj, goalDays: -1 };
        const finalVal = trajectory[trajectory.length - 1].value;
        if (finalWeightRes) finalWeightRes.textContent = finalVal.toFixed(1);
        
        const finalWeightKg = (this.isMetric || this.chartView !== 'weight') ? finalVal : finalVal / 2.20462;
        const finalBmi = (this.chartView === 'weight' && this.baseline.height > 0) ? (finalWeightKg / Math.pow(this.baseline.height / 100, 2)) : 0;
        const finalBmiRes = document.getElementById('final-bmi');
        if (finalBmiRes) finalBmiRes.textContent = (this.chartView === 'weight') ? finalBmi.toFixed(1) : '-';
        
        this.updateChartData(
            trajectory.map(d => d.value), 
            upperTraj.map(d => d.value), 
            lowerTraj.map(d => d.value), 
            -1
        );
    }

    collectTrajectoryData(baseline, goalInt, maintInt, goalDays, simLength) {
        const data = [];
        const goalParams = DailyParams.createFromIntervention(goalInt, baseline);
        const maintParams = DailyParams.createFromIntervention(maintInt, baseline);
        let model = BodyModel.createFromBaseline(baseline);

        for (let i = 0; i <= simLength; i++) {
            const params = (i < goalDays) ? goalParams : maintParams;
            data.push(this.getDetailedRow(i, model, baseline, params));
            model = BodyModel.RungeKatta(model, baseline, params);
        }
        return data;
    }

    collectMultiTrajectoryData(baseline, interventions, simLength) {
        const data = [];
        const paramsTraj = DailyParams.makeparamtrajectory(baseline, interventions, simLength + 1);
        let model = BodyModel.createFromBaseline(baseline);

        for (let i = 0; i <= simLength; i++) {
            const p = paramsTraj[i] || paramsTraj[paramsTraj.length - 1];
            data.push(this.getDetailedRow(i, model, baseline, p));
            model = BodyModel.RungeKatta(model, baseline, p);
        }
        return data;
    }

    getDetailedRow(day, model, baseline, params) {
        const weight = model.getWeight(baseline);
        const fatPercent = model.getFatPercent(baseline);
        const bmi = model.getBMI(baseline);
        const value = this.chartView === 'weight' ? weight : fatPercent;

        return {
            day,
            weight,
            fatPercent,
            bmi,
            fat: model.fat,
            lean: model.lean,
            calories: params.calories,
            tee: model.getTEE(baseline, params),
            value: this.chartView === 'weight' && !this.isMetric ? value * 2.20462 : value
        };
    }

    exportCSV() {
        if (!this.lastResults) return;
        const { trajectory, upperTraj, lowerTraj } = this.lastResults;
        
        const wUnit = this.isMetric ? 'kg' : 'lbs';
        const eUnit = this.isCalories ? 'cals' : 'kj';
        const eMult = this.isCalories ? 1 : 4.184;
        
        let csv = 'sep=,\r\n';
        csv += `Day,Weight (${wUnit}),Upper Weight (${wUnit}),Lower Weight (${wUnit}),Body Fat %,BMI,Fat Mass (${wUnit}),Lean Mass (${wUnit}),Intake (${eUnit}),Expenditure (${eUnit})\r\n`;

        trajectory.forEach((row, i) => {
            const upper = upperTraj[i].weight;
            const lower = lowerTraj[i].weight;
            const mult = this.isMetric ? 1 : 2.20462;
            
            csv += `${row.day},` +
                   `${(row.weight * mult).toFixed(2)},` +
                   `${(upper * mult).toFixed(2)},` +
                   `${(lower * mult).toFixed(2)},` +
                   `${row.fatPercent.toFixed(2)},` +
                   `${row.bmi.toFixed(2)},` +
                   `${(row.fat * mult).toFixed(2)},` +
                   `${(row.lean * mult).toFixed(2)},` +
                   `${Math.round(row.calories * eMult)},` +
                   `${Math.round(row.tee * eMult)}\r\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "BWS_Data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getModifiedBaseline(deltaE) {
        const b = Object.assign(Object.create(Object.getPrototypeOf(this.baseline)), this.baseline);
        b.delta_E = deltaE;
        return b;
    }

    updateChartData(main, upper, lower, goalDay) {
        if (!this.chart) return;
        this.chart.data.labels = Array.from({length: main.length}, (_, i) => i);
        this.chart.data.datasets[0].data = main;
        this.chart.data.datasets[1].data = upper;
        this.chart.data.datasets[2].data = lower;
        
        if (this.chart.options.plugins.annotation.annotations.goalLine) {
            if (goalDay >= 0) {
                this.chart.options.plugins.annotation.annotations.goalLine.display = true;
                this.chart.options.plugins.annotation.annotations.goalLine.value = goalDay;
            } else {
                this.chart.options.plugins.annotation.annotations.goalLine.display = false;
                this.chart.options.plugins.annotation.annotations.goalLine.value = undefined;
            }
        }
        this.chart.update('none');
    }

    clearResults() {
        const goalCals = document.getElementById('goal-cals');
        if (goalCals) goalCals.textContent = "Err";
        const goalMaint = document.getElementById('goal-maint-cals');
        if (goalMaint) goalMaint.textContent = "-";
        const targetBmi = document.getElementById('target-bmi');
        if (targetBmi) targetBmi.textContent = "-";
        if (this.chart) {
            this.chart.data.labels = [];
            this.chart.data.datasets.forEach(d => d.data = []);
            this.chart.update();
        }
    }

    updateBMICategory(bmi) {
        const el = document.getElementById('bmi-category');
        if (!el) return;
        if (bmi < 18.5) el.textContent = "Underweight";
        else if (bmi < 25) el.textContent = "Normal";
        else if (bmi < 30) el.textContent = "Overweight";
        else el.textContent = "Obese";
    }

    checkBMIAlert(bmi, range) {
        const alert = document.getElementById('bmi-alert');
        if (!alert) return;
        if (bmi < 18.5 || bmi > 25) {
            alert.style.display = 'block'; alert.className = 'alert-box warning';
            const unit = this.isMetric ? 'kg' : 'lbs';
            const low = this.isMetric ? range.low : Math.round(range.low * 2.20462);
            const high = this.isMetric ? range.high : Math.round(range.high * 2.20462);
            alert.textContent = `BMI outside healthy range (${low}-${high} ${unit}).`;
        } else { alert.style.display = 'none'; }
    }
}

window.addEventListener('DOMContentLoaded', () => new App());
