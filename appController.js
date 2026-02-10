var _____WB$wombat$assign$function_____=function(name){return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name))||self[name];};if(!self.__WB_pmw){self.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}{
let window = _____WB$wombat$assign$function_____("window");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opens = _____WB$wombat$assign$function_____("opens");
+function () {
    constants = angular.module('BWS.Constants', []);
    services = angular.module('BWS.Services', ['BWS.Constants']);

    var app = angular.module("BWS", [
		'BWS.Services',
        'ui.bootstrap',
        'dialogs.main',
        'ui.slider'
    ]);

    app.run(function () {
        if (!Math.IEEERemainder) {
            Math.IEEERemainder = function (dividend, divisor) {
                return dividend - (divisor * Math.round(dividend / divisor));
            };
        }
    });

    app.config(function (datepickerConfig, datepickerPopupConfig) {
        // datepickerConfig.showWeeks = false;
        // datepickerPopupConfig.toggleWeeksText = null;
        datepickerPopupConfig.showButtonBar = false;
        datepickerPopupConfig.datepickerPopup = "M/d/yyyy";
    });

    app.controller('appController', function ($scope, $filter, dialogs, Baseline, Intervention, BodyModel, BodyChange, DailyParams) {
        $scope.guidedStep = 1;
        $scope.zoomSliderOptions = {
            range: true
        }
        var baseline, goalIntervention, goalMaintenanceIntervention, int1, int2, minCal, goalWeight,
            goalMaintCals, chartArray, chartTableArray, memorySelectionMaintenance, memorySelectionInt1_pal,
            memorySelectionInt2_pal, memorySelectionWeight, memorySelectionPAL, calorie_spread, weightunits, energyunits, heightunits, eps,
            csv, googleChart, googleChartData, googleChartDataTabular, chartOptions, yAxisTitle, drawChart = false;

        //Date picker (calendar) config. Some configuration is in the app.config above.
        $scope.dtMinDate = moment(new Date());
        $scope.dtMaxDate = moment(new Date()).add(10, 'years');
        $scope.dtOpen = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.opened = true;
        };
        $scope.dtChange = function () {
            var daysDiff = moment(new Date($scope.dt)).diff(moment(new Date()), 'days') + 1;
            $scope.goalTime = daysDiff;
            $("input[ng-model='goalTime']").val($scope.goalTime); //Because we empty it in guided view
            $scope.goalChange();
        };

        $scope.calculateStarting = function () {
            if ($("input[ng-model='initialWeightField']").val() == "" ||
                $("select[ng-model='genderBox']").val() == null ||
                $("input[ng-model='ageField']").val() == "" ||
                $("input[ng-model='heightField']").val() == "" ||
                (($scope.heightUnitsGroup == "Inches") && ($("input[ng-model='heightFt']").val() == "" ||
                $("input[ng-model='heightIn']").val() == ""))) {
                $scope.launchDialog("guidedIncomplete");
            } else {
                $scope.startingCalculated = true;
                if ($scope.guidedStep == 3) {
                    $scope.baselineChange();
                }
                //$scope.launchDialog("guidedStartingCalculatedOK");
            }
        };

        $scope.btnGuidedNextStep = function (isNext) {
            $scope.calculateStarting();
            if ($scope.startingCalculated) {
                if ($scope.guidedStep == 4 && isNext) {
                    $scope.guidedStep = 0;
                }  else {
                    if ($scope.guidedStep == 1) {
                        // ensure that all default values are there.
                        populateBasline()

                    }
                    if (isNext) {
                        $scope.guidedStep++;
                    } else {
                        $scope.guidedStep--;
                    }
                }
            }
        };

        function populateBasline() {
            $("input[ng-model='initialWeightField']").val($scope.initialWeightField);
            $("select[ng-model='genderBox']").val($scope.genderBox);
            $("input[ng-model='ageField']").val($scope.ageField);
            $("input[ng-model='heightField']").val($scope.heightField);
            $("input[ng-model='heightFt']").val($scope.heightFt);
            $("input[ng-model='heightIn']").val($scope.heightIn);
        };

        $scope.switchToGuided = function () {
            //reset all goal values to avoide errors when switching between expert and guided mode
            $scope.goalWeight = $scope.initialWeightField;
            $scope.goalTime = 180;
            $scope.goalActChangeBox = 0;
            $scope.goalChange();
            //go to 1st step
            $scope.guidedStep = 1;
        }

        $scope.switchToExpert = function () {
            populateBasline()
            $scope.guidedStep = 0;
        };

        $scope.init = function (isReset) {
            $scope.unachievableGoal = false;
            baseline = new Baseline();
            goalIntervention = new Intervention();
            goalMaintenanceIntervention = goalIntervention;

            $scope.startingCalculated = false;
            $scope.usUnits = true;
            int1 = new Intervention(90, 2000, 50, 0, 4000);
            $scope.int1_onField = true;
            $scope.int1_sodiumAutoField = "true";
            $scope.int1_dayField = int1.day;
            int1.setproportionalsodium(baseline);
            $scope.int1_sodiumField = Math.round(int1.sodium);
            $scope.int1_carbInPercField = int1.carbinpercent;
            $scope.int1_palField = int1.actchangepercent;

            int2 = new Intervention(180, 2500, 50, 0, 4000);
            $scope.int2_onField = true;
            $scope.int2_sodiumAutoField = "true";
            $scope.int2_dayField = int2.day;
            int2.setproportionalsodium(baseline);
            $scope.int2_sodiumField = Math.round(int2.sodium);
            $scope.int2_carbInPercField = int2.carbinpercent;
            $scope.int2_palField = int2.actchangepercent;

            minCal = 0;
            goalMaintCals;
            chartArray = [];
            chartTableArray = [];
            memorySelectionMaintenance;
            memorySelectionInt1_pal;
            memorySelectionInt2_pal;

            memorySelectionWeight;
            memorySelectionPAL;
            calorie_spread = 256; // 10% uncertainty
            weightunits = 1;
            heightunits;

            $scope.initialWeightField = baseline.weight;
            $scope.goalWeight = baseline.weight;
            $scope.initialWeightField2 = baseline.weight;
            $scope.initialBfpField2 = Math.round10(baseline.getBFP(), -1);
            $scope.initialBMIField = Math.round10(baseline.getBMI(), -1);
            $scope.weightUnitsRadioGroup = "Kilograms";
            $scope.heightUnitsGroup = "Centimeters";
            $scope.energyUnitsRadioGroup = "Kilojoules/day";
            $scope.genderBox = "Male"; //baseline.isMale was initiated to true
            $scope.ageField = baseline.age;
            $scope.heightField = baseline.height; //in cm
            $scope.initialPALField = baseline.pal;
            $scope.goalCheckBox = true;
            $scope.goalTime = 180;
            $scope.goalActChangeBox = 0;
            $scope.goalMaintenanceActChangeBox = 0;
            $scope.simulationLengthField = 365;
            $scope.rmrCalcAuto = "true"; //automatically calculate rmr
            $scope.bfpCalcAuto = "true"; //automatically calculate Bfp
            $scope.rmrCalcDisabled = true; //automatically calculate rmr
            $scope.bfpCalcDisabled = true; //automatically calculate Bfp
            $scope.InitialBfpField = Math.round10(baseline.bfp, -1);
            $scope.initialCarbInPercField = baseline.carbIntakePct;
            $scope.initialSodiumField = baseline.sodium;
            $scope.uncertaintyBox = 10;
            eps = .001;
            $scope.selectedTab = 'weight';//lifestyle or weight
            $scope.selectedChartTab = "Weight";

            $scope.baselineAdvancedCtl = false;
            $scope.lifestyleAdvancedCtl = false;

            if (isReset) {
                $scope.goalChange();
                $scope.globalUnitsUS(true);
            }


        };

        //initiate for the first time
        $scope.init(false);

        $scope.globalUnitsUS = function (isUS) {
            $scope.usUnits = isUS;
            drawChart = false;
            if (isUS) {
                $scope.weightUnitsRadioGroup = "Pounds";
                $scope.heightUnitsGroup = "Inches";
                $scope.energyUnitsRadioGroup = "Calories/day";
            } else {
                $scope.weightUnitsRadioGroup = "Kilograms";
                $scope.heightUnitsGroup = "Centimeters";
                $scope.energyUnitsRadioGroup = "Kilojoules/day";
            }
            $scope.changeWeightUnits();
            $scope.changeHeightUnits();
            //draw chart only after everything is initialized to prevent multiple calls when the page first loads.
            drawChart = true;
            $scope.changeEnergyUnits();

            if ($scope.guidedStep == 1 && !$scope.startingCalculated) {
                //clearing the values in jQuery. The model does not change
                setTimeout(function () {
                    $("input[ng-model='initialWeightField']").val("");
                    $("select[ng-model='genderBox']").val("");
                    $("input[ng-model='ageField']").val("");
                    $("input[ng-model='heightField']").val("");
                    $("input[ng-model='heightFt']").val("");
                    $("input[ng-model='heightIn']").val("");

                    //$("input[ng-model='goalWeight']").val("");
                    //$("input[ng-model='goalTime']").val("");
                    //$("input[ng-model='dt']").val("");
                }, 10);
            }
        };

        $scope.goalTabsChange = function (selectedTab) {
            $scope.selectedTab = selectedTab;
            $scope.goalChange();
        };

        $scope.chartTabsChange = function (selectedChartTab) {
            $scope.selectedChartTab = selectedChartTab;
            $scope.chartSetup();
        };

        $scope.changeSpread = function () {
            calorie_spread = baseline.getMaintCals() * $scope.uncertaintyBox / 100;
            //console.log(calorie_spread);
            $scope.goalChange();
        };

        $scope.changeWeightUnits = function () {
            if ($scope.weightUnitsRadioGroup == "Pounds") {
                $scope.weightUnitsRadioGroupLbl = "lbs";
                weightunits = 2.20462;
            } else {
                $scope.weightUnitsRadioGroupLbl = "kg";
                weightunits = 1;
            }
            $scope.initialWeightField = Math.round10(baseline.weight * weightunits, -1);
            $scope.goalWeight = Math.round10(goalWeight * weightunits, -1);
            $scope.initialWeightField2 = $scope.initialWeightField;

            var healthyWeightRange = baseline.getHealthyWeightRange();
            $scope.weightRangeLow = Math.floor(healthyWeightRange.low * weightunits);
            $scope.weightRangeHigh = Math.ceil(healthyWeightRange.high * weightunits);
            if (drawChart) {
                $scope.chartTable();
            }
        };

        $scope.changeEnergyUnits = function () {

            if ($scope.energyUnitsRadioGroup == "Calories/day") {
                $scope.energyUnitsRadioGroupLbl = "Cal/day";
                $scope.energyUnitsLblSrt = "Calorie";
                energyunits = 1;

            } else {
                $scope.energyUnitsRadioGroupLbl = "Kj/day";
                $scope.energyUnitsLblSrt = "Kilojoule";
                energyunits = 4.184;
            }
            $scope.maintCalsField = Math.round(baseline.getMaintCals() * energyunits);
            $scope.goalCalsField = Math.round(goalIntervention.calories * energyunits);
            $scope.goalMaintCalsField = Math.round(goalMaintenanceIntervention.calories * energyunits);
            $scope.initialRMRField = Math.round(baseline.getRMR() * energyunits);
            $scope.int1_calField = Math.round(int1.calories * energyunits);
            $scope.int2_calField = Math.round(int2.calories * energyunits);
            if (drawChart) {
                $scope.chartTable();
            }
        };

        $scope.changeHeightUnits = function () {
            if ($scope.heightUnitsGroup == "Inches") {
                heightunits = 0.3937;
            } else {
                heightunits = 1;
            }
            $scope.heightField = Math.round10(baseline.height * heightunits, -1);
            convertHeightValue();
        };

        $scope.changeHeightField = function () {
            if ($scope.heightUnitsGroup == "Inches") {
                baseline.height = parseFloat($scope.heightField / heightunits);
                convertHeightValue();
            } else {
                baseline.height = $scope.heightField * 1
            }

            $scope.baselineChange();
        };

        $scope.changeHeightFeet = function () {
            var inches = parseInt($scope.heightFt) * 12 + parseInt($scope.heightIn);
            $scope.heightField = inches;
            $scope.changeHeightField();
        };

        function convertHeightValue() {
            if ($scope.heightUnitsGroup == 'Inches') {
                //set ft/inches in the mask
                var inches = baseline.height * heightunits;
                var feet = Math.floor(inches / 12);
                inches %= 12;
                inches = Math.round(inches);
                //console.log("before " + $scope.heightFeet );
                $scope.heightFt = feet;
                $scope.heightIn = inches;
                //console.log("after " + $scope.heightFeet );
            }
        };

        $scope.changeRmrInput = function () {
            //console.log($scope.rmrCalcAuto);
            if ($scope.rmrCalcAuto === "false") {
                $scope.rmrCalcDisabled = false;
                baseline.rmrCalc = true;
            } else {
                $scope.rmrCalcDisabled = true;
                baseline.rmrCalc = false;
            }
            $scope.baselineChange();
        };

        $scope.changeBfpInput = function () {
            //console.log($scope.bfpCalcAuto);
            if ($scope.bfpCalcAuto === "true") {
                $scope.bfpCalcDisabled = true;
                baseline.bfpCalc = true;
                $scope.goalChange();
            } else {
                $scope.bfpCalcDisabled = false;
                baseline.bfpCalc = false;
            }
            $scope.InitialBfpField = Math.round10(baseline.bfp, -1);
            $scope.initialBfpField2 = $scope.InitialBfpField;
            //console.log("init Bfpcalc " + baseline.bfpCalc);
        };

        $scope.changeBfpField = function () {
            var check = parseFloat($scope.InitialBfpField);
            if (check >= 0 && check <= 100 && check != baseline.bfp) {
                baseline.bfp = parseFloat($scope.InitialBfpField);
                $scope.initialBfpField2 = $scope.InitialBfpField;
                $scope.goalChange();
            } else {
                $scope.InitialBfpField = baseline.bfp;
            }
        };

        $scope.changeCarbIntakePct = function () {
            var check = $scope.initialCarbInPercField;
            if (check > 0 && check <= 100 && check != baseline.carbIntakePct) {
                baseline.carbIntakePct = check;
                $scope.goalChange();
            } else {
                $scope.initialCarbInPercField = baseline.carbIntakePct;
            }
        };

        $scope.changeInitialSodium = function () {
            var check = parseInt($scope.initialSodiumField);
            if (check >= 0 && check <= 50000 && check != baseline.sodium) {
                baseline.sodium = check;
                $scope.goalChange();
            } else {
                $scope.initialSodiumField = baseline.sodium;
            }
        };

        $scope.genderChange = function () {
            baseline.isMale = ($scope.genderBox === "Male") ? true : false;
            $scope.baselineChange();
        };

        $scope.changeInitialWeightField = function () {
            if ($scope.weightUnitsRadioGroup == "Pounds") {
                baseline.weight = $scope.initialWeightField / weightunits;
            } else {
                baseline.weight = $scope.initialWeightField * 1
            }
            $scope.goalWeight = $scope.initialWeightField;
            $scope.initialWeightField2 = $scope.initialWeightField;
            $scope.baselineChange();
        };

        var errorCounter = 0;

        $scope.launchDialog = function (which) {
            errorCounter++
            console.log(errorCounter);
            if (errorCounter > 40) {
                alert("Unrealistic Simulation");
                window.location.reload();
                throw "Loop error";
            }
            console.log("*launch: " + which);
            var dlg = null;
            switch (which) {
                // Error Dialog
                case 'error':
                    dlg = dialogs.error('This is my error message');
                    break;
                    // Wait / Progress Dialog
                case 'wait':
                    dlg = dialogs.wait(msgs[i++], progress);
                    fakeProgress();
                    break;

                    // Notify Dialog
                case 'about':
                    var notifyText = "<p>The <a target=\"_blank\" href=\"https:\/\/www.niddk.nih.gov\/research-funding\/at-niddk\/labs-branches\/laboratory-biological-modeling\/integrative-physiology-section\/research\/body-weight-planner\">research behind</a> the National Institutes of Health (NIH) Body Weight Planner is from work done by <a target=\"_blank\" href=\"https:\/\/www.niddk.nih.gov\/about-niddk\/staff-directory\/biography\/hall-kevin\">Dr. Kevin Hall\'s</a> research group to better understand how diet and exercise quantitatively contribute to weight loss and weight loss maintenance.</p>" +
                        "<p>This research was published as part of The Lancet Series on Obesity (August 27, 2011). Please reference this paper when publishing material using the Body Weight Planner:</p>" +
                        "<p>Hall KD, Sacks G, Chandramohan D, Chow CC, Wang YC, Gortmaker SL, Swinburn BA. <a target=\"_blank\" href=\"https:\/\/pubmed.ncbi.nlm.nih.gov\/21872751\/\" >Quantification of the effect of energy imbalance on bodyweight</a>. Lancet. 2011 Aug 27;378(9793):826-37. (PMID:21872751)</p>" +
                        "<p>Full description of the model equations can be found in the <a target=\"_blank\" href=\"https:\/\/www.niddk.nih.gov\/-\/media\/Files\/BWP\/Hall_Lancet_Web_Appendix.pdf\">Dynamic Mathematical Model of Body Weight Change in Adults</a> <span class=\"file-size\">(PDF, 244 KB)</span> <i class=\"file-pdf\" title=\"PDF document\"></i> document.</p>";

                    dlg = dialogs.notify('About', notifyText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'guidedStartingCalculatedOK':
                    var errorText = $scope.maintCalsField + " is an estimate of the typical number of " + $scope.energyUnitsRadioGroup + " you eat, based on the starting weight, sex, age, height, and physical activity level you provided. You can use SuperTracker\'s Food Tracker feature to track how many calories you eat each day. For accurate tracking, be sure to enter all meals, snacks and beverages, and pay close attention to the portion sizes you enter. You can find more information about portion sizes at ChooseMyPlate.gov.<br/><br/>Click the \"Next Step\" button to continue.";
                    dlg = dialogs.notify('Starting Intake Calculated', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'guidedStartingCalculated':
                    var errorText = "Please calculate the starting intake by clicking on the \"Calculate Starting " + $scope.energyUnitsRadioGroup + "\" button.";
                    dlg = dialogs.notify('Starting Intake Required', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'guidedIncomplete':
                    var errorText = "All the fields are required in order to move to the next step.";
                    dlg = dialogs.notify('All the fields are required', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'notifyLowBMI':
                    var errorText = "The goal weight you entered is below a healthy weight for someone of your height and age. A healthy weight range for you is between " + $scope.weightRangeLow + " and " + $scope.weightRangeHigh + " " + $scope.weightUnitsRadioGroup.toString().toLowerCase() + ".";
                    dlg = dialogs.notify('Please set a higher goal weight', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'notifyHighBMI':
                    var errorText = "The goal weight you entered is above a healthy weight for someone of your height and age. A healthy weight range for you is between " + $scope.weightRangeLow + " and " + $scope.weightRangeHigh + " " + $scope.weightUnitsRadioGroup.toString().toLowerCase() + ".";
                    dlg = dialogs.notify('Please set a lower goal weight', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'notifyNegativeMaintCals':
                    var errorText = "The information you entered results in a " + $scope.energyUnitsLblSrt.toString().toLowerCase() + " level that is too low." +
                        "<br/>Calorie goals must be at least 1000 calories/day. Food group targets and nutrient recommendations will not be met below 1000 calories/day." +
                        "<br/><br/>The last change you made has been reset so that you can enter a different value. Try giving yourself more time to achieve your goal, changing your activity level, or setting a different goal.";
                    dlg = dialogs.notify('Please adjust your goal', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                case 'unachievableGoal':
                    var errorText = "You can't achieve " + $scope.goalWeight + " " + $scope.weightUnitsRadioGroupLbl + " in " + $scope.goalTime + " days with " + $scope.goalActChangeBox + "% change in activity." +
                        "<br/><br/>The last change you made has been reset so that you can enter something different." +
                        "<br/>Try giving yourself more time to achieve your goal, changing your activity level, or setting a different goal.";
                    dlg = dialogs.notify('Please adjust your goal', errorText, { keyboard: true, backdrop: false, size: 'md', windowClass: '' });
                    break;
                    // Confirm Dialog
                case 'confirm':
                    dlg = dialogs.confirm('Please Confirm', 'Is this awesome or what?');
                    dlg.result.then(function (btn) {
                        $scope.confirmed = 'You thought this quite awesome!';
                    }, function (btn) {
                        $scope.confirmed = 'Shame on you for not thinking this is awesome!';
                    });
                    break;
                case 'palChangeWeight':
                    dlg = dialogs.create('./dialogs/palChangeDialog.html', 'PalChangeDialogController', { "baselineActivityParam": baseline.getActivityParam(), "memorySelection": memorySelectionWeight }, { keyboard: true, backdrop: false, size: 'lg' });
                    dlg.result.then(function (dialogResults) {
                        memorySelectionWeight = dialogResults.memorySelection;
                        //console.log("Weight");
                        $scope.goalActChangeBox = dialogResults.pctChange;
                        if ($scope.guidedStep != 0) {
                            //in guided view we copy the information to the maintenance phase
                            memorySelectionMaintenance = dialogResults.memorySelection;
                            //console.log("Maintenance");
                            $scope.goalMaintenanceActChangeBox = dialogResults.pctChange;
                        }
                        $scope.goalChange();
                    }, function () {
                        //canceled
                    });

                    break;
                case 'palChangeMaintenance':
                    dlg = dialogs.create('./dialogs/palChangeDialog.html', 'PalChangeDialogController', { "baselineActivityParam": baseline.getActivityParam(), "memorySelection": memorySelectionMaintenance }, { keyboard: true, backdrop: false, size: 'lg' });
                    dlg.result.then(function (dialogResults) {
                        memorySelectionMaintenance = dialogResults.memorySelection;
                        //console.log("Maintenance");
                        $scope.goalMaintenanceActChangeBox = dialogResults.pctChange;
                        $scope.goalChange();
                    }, function () {
                        //canceled
                    });

                    break;
                case 'int1_pal':
                    dlg = dialogs.create('./dialogs/palChangeDialog.html', 'PalChangeDialogController', { "baselineActivityParam": baseline.getActivityParam(), "memorySelection": memorySelectionInt1_pal }, { keyboard: true, backdrop: false, size: 'lg' });
                    dlg.result.then(function (dialogResults) {
                        memorySelectionInt1_pal = dialogResults.memorySelection;
                        //console.log("Maintenance");
                        $scope.int1_palField = dialogResults.pctChange;
                        $scope.goalChange();
                    }, function () {
                        //canceled
                    });

                    break;
                case 'int2_pal':
                    dlg = dialogs.create('./dialogs/palChangeDialog.html', 'PalChangeDialogController', { "baselineActivityParam": baseline.getActivityParam(), "memorySelection": memorySelectionInt2_pal }, { keyboard: true, backdrop: false, size: 'lg' });
                    dlg.result.then(function (dialogResults) {
                        memorySelectionInt2_pal = dialogResults.memorySelection;
                        //console.log("Maintenance");
                        $scope.int2_palField = dialogResults.pctChange;
                        $scope.goalChange();
                    }, function () {
                        //canceled
                    });

                    break;
                case 'pal':
                    dlg = dialogs.create('./dialogs/palDialog.html', 'PalDialogController', { "memorySelection": memorySelectionPAL }, { keyboard: false, backdrop: 'static', size: 'md' });
                    dlg.result.then(function (dialogResults) {
                        memorySelectionPAL = dialogResults.memorySelection;
                        $scope.initialPALField = dialogResults.pal;
                        $scope.baselineChange();
                    }, function () {
                        //canceled
                    });
                    break;
            }; // end switch
        };

        $scope.goalChange = function () {
            var healthyWeightRange = baseline.getHealthyWeightRange();
            $scope.weightRangeLow = Math.floor(healthyWeightRange.low * weightunits);
            $scope.weightRangeHigh = Math.ceil(healthyWeightRange.high * weightunits);

            //hide lifestyle warning
            $scope.goalLowIntakeShow = false;
            $scope.lifestyleLowIntakeShow = false;
            if ($scope.guidedStep != 0) {
                $scope.goalMaintenanceActChangeBox = $scope.goalActChangeBox;
            }



            $scope.dt = moment(new Date()).add(parseInt($scope.goalTime), 'days').format('M/D/YYYY');
            if ($("input[ng-model='goalTime']").val()!=""){
                $("input[ng-model='dt']").val($scope.dt); //Because we empty it in guided view
            }
            if (parseInt($scope.goalTime) > 365) {
                $scope.simulationLengthField = parseInt($scope.goalTime) + 14;
                $scope.zoomSlider = [0, parseInt($scope.simulationLengthField)];
            }

            goalIntervention = new Intervention();
            goalMaintenanceIntervention = goalIntervention;
            if ($scope.selectedTab == "weight") {
                goalMaintenanceIntervention.actchangepercent = $scope.goalMaintenanceActChangeBox;
            }
            if ($scope.weightUnitsRadioGroup == "Pounds") {
                goalWeight = $scope.goalWeight / weightunits;
            } else {
                goalWeight = $scope.goalWeight;
            }
            //elliminate rounding errors due to convertion of units
            if (Math.abs(goalWeight - baseline.weight) < .02) {
                goalWeight = baseline.weight;
            }

            try {
                goalIntervention = new Intervention.forgoal(baseline, goalWeight, parseInt($scope.goalTime), $scope.goalActChangeBox, minCal, eps);
                $scope.unachievableGoal = false;
            } catch (err) {
                $scope.unachievableGoal = true;
                console.log(err);
                $scope.launchDialog("unachievableGoal");
                $scope.undo();
            }

            if ($scope.selectedTab == "weight") {
                console.log("simulating goal weight");

                $scope.goalCalsField = Math.round(goalIntervention.calories * energyunits);

                //We find out what the body composition will be at the goal time with the RKlast_ecw function
                var goalbc = new BodyModel.projectFromBaselineViaIntervention(baseline, goalIntervention, parseInt($scope.goalTime) + 1);
                //console.log(JSON.stringify(goalbc));
                var weightAtGoal = baseline.getNewWeightFromBodyModel(goalbc);
                var bfpAtGoal = goalbc.getFatPercent(baseline);

                //The goal body comp is used to calculated the calories needed to keep tissue from changing. However, it does not account for 
                //the sodium needed to stabilize the extracellular water.
                if (goalWeight == baseline.weight && goalMaintenanceIntervention.actchangepercent == 0) {
                    goalMaintCals = baseline.getMaintCals();
                } else {
                    goalMaintCals = goalbc.cals4balance(baseline, goalMaintenanceIntervention.getAct(baseline));
                    //console.log("Goal therm=" + goalbc.therm + ", bad approx gives stabletherm=" + 0.14 * goalMaintCals);
                }

                //If the user has changed the maintenance activity level, we may get a negative result, so we check and redo if needed
                if (goalMaintCals < 0) {
                    $scope.launchDialog("notifyNegativeMaintCals");
                    $scope.undo();
                }

                //console.log("cals " + goalIntervention.calories);
                if ($scope.goalWeight != $scope.initialWeightField && (goalIntervention.calories < 1000 || goalMaintCals < 1000)) {
                    if ($scope.guidedStep != 0) { 
                        $scope.launchDialog("notifyNegativeMaintCals");
                        $scope.goalWeight = $scope.initialWeightField;
                    } else {
                        //expert mode
                        $scope.goalLowIntakeShow = true;
                    }
                }
                goalMaintenanceIntervention.day = parseInt($scope.goalTime) + 1;
                goalMaintenanceIntervention.calories = goalMaintCals;
                goalMaintenanceIntervention.carbinpercent = baseline.carbIntakePct;
                goalMaintenanceIntervention.setproportionalsodium(baseline);

                $scope.goalMaintCalsField = Math.round(goalMaintenanceIntervention.calories * energyunits);


            } else {
                console.log("simulating lifestyle change");

                // int1 variable setup
                int1.on = $scope.int1_onField;
                //solves issue when simulation is longer than intervention
                if (parseInt($scope.simulationLengthField) < parseInt($scope.int1_dayField)) {
                    int1.day = parseInt($scope.simulationLengthField);
                } else {
                    int1.day = parseInt($scope.int1_dayField);
                }
                int1.rampon = $scope.int1_gradulalRampField;

                int1.carbinpercent = $scope.int1_carbInPercField;
                if ($scope.energyUnitsRadioGroup == "Calories/day") {
                    int1.calories = parseInt($scope.int1_calField);
                } else {
                    int1.calories = parseInt($scope.int1_calField) / energyunits;
                }
                if ($scope.int1_sodiumAutoField == "true") {
                    int1.setproportionalsodium(baseline);
                    $scope.int1_sodiumField = Math.round(int1.sodium);
                } else {
                    int1.sodium = parseInt($scope.int1_sodiumField);
                }
                int1.actchangepercent = parseInt($scope.int1_palField);

                // int2 variable setup

                int2.on = $scope.int2_onField;
                //solves issue when simulation is longer than intervention
                if (parseInt($scope.simulationLengthField) < parseInt($scope.int2_dayField)) {
                    int2.day = parseInt($scope.simulationLengthField);
                } else {
                    int2.day = parseInt($scope.int2_dayField);
                }
                
                int2.rampon = $scope.int2_gradulalRampField;

                int2.carbinpercent = $scope.int2_carbInPercField;
                if ($scope.energyUnitsRadioGroup == "Calories/day") {
                    int2.calories = parseInt($scope.int2_calField);
                } else {
                    int2.calories = parseInt($scope.int2_calField) / energyunits;
                }
                if ($scope.int2_sodiumAutoField == "true") {
                    int2.setproportionalsodium(baseline);
                    $scope.int2_sodiumField = Math.round(int2.sodium);
                } else {
                    int2.sodium = parseInt($scope.int2_sodiumField);
                }
                int2.actchangepercent = parseInt($scope.int2_palField);


                if ((int1.calories < 1000 && int1.on) || (int2.calories < 1000 && int2.on)) {
                    //low intake for lifestyle only 
                    //$scope.launchDialog("lifestyleLowIntakeShow");
                    $scope.lifestyleLowIntakeShow = true;
                }

                // render lifestyle simutation results

                goalIntervention = int1;
                //console.log(goalIntervention);
                goalMaintenanceIntervention = int2;
                //console.log(goalMaintenanceIntervention);

            }

            if (drawChart) {
                $scope.chartTable();
                $scope.zoomSliderOptions = {
                    max: parseInt($scope.simulationLengthField),
                    range: true
                }

                $scope.zoomSlider = [0, parseInt($scope.simulationLengthField)];
                $scope.chartSliderZoomChange();
            }
        };

        $scope.undo = function () {
            console.log("Undo! " + $scope.undoModel + "=" + $scope.undoValue);
            var model = $scope.undoModel;
            var oldVal = $scope.undoValue;
            $scope[model] = oldVal.toString();

            if ($scope.undoModel == "heightFt" || $scope.undoModel == "heightIn") {
                $scope.changeHeightFeet();
            } if ($scope.undoModel == "initialWeightField") {
                changeInitialWeightField();
            } if ($scope.undoModel == "dt") {
                $scope.dtChange();
            } else {
                $scope.baselineChange();
            }
        };

        $scope.baselineChange = function () {
            baseline.rmr = parseInt($scope.initialRMRField) / energyunits;
            baseline.age = parseInt($scope.ageField);
            baseline.pal = parseFloat($scope.initialPALField);

            $scope.InitialBfpField = Math.round10(baseline.getBFP(), -1);
            $scope.initialBfpField2 = Math.round10(baseline.getBFP(), -1);

            $scope.initialBMIField = Math.round10(baseline.getBMI(), -1);
            drawChart = false;
            $scope.changeEnergyUnits();
            drawChart = true;
            //baseline changed so we need to adjust the goal
            if ($scope.startingCalculated || $scope.guidedStep == 0) {
                $scope.goalChange();
            }
        };

        $scope.btnCsvExportClick = function () {
            if ($scope.detectIE()) {
                csvFrame.document.open("text/html", "replace");
                csvFrame.document.write(csv);
                csvFrame.document.close();
                csvFrame.focus();
                csvFrame.document.execCommand('SaveAs', true, 'BWS_Data.txt');
            } else {
                csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
                $("#btnCsvExport").attr({
                    'href': csvData,
                    'target': '_blank',
                    'download': 'BWS_Data.csv'
                });
            }
        };

        $scope.detectIE = function () {
            var ua = window.navigator.userAgent;

            var msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            var edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // IE 12 => return version number
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }

            // other browser
            return false;
        };

        function chartRow(day, bodytraj, upperbodytraj, lowerbodytraj, paramtraj, baseline) {
            var date, weight, upper_weight, lower_weight, fat, upperfat, lowerfat, fatpercent, upperfatp, lowerfatp, fatfree, bmi, upperweight, lowerweight, TEE, calin;
            weight = Math.round10(bodytraj.getWeight(baseline) * weightunits, -1);
            upper_weight = Math.round10(upperbodytraj.getWeight(baseline) * weightunits, -1);
            lower_weight = Math.round10(lowerbodytraj.getWeight(baseline) * weightunits, -1);
            bmi = Math.round10(bodytraj.getBMI(baseline), -1);
            fat = Math.round10(bodytraj.fat * weightunits, -1);;
            upperfat = upperbodytraj.fat;
            lowerfat = lowerbodytraj.fat;
            fatpercent = Math.round10(bodytraj.getFatPercent(baseline), -1);
            upperfatp = Math.round10(upperbodytraj.getFatPercent(baseline), -1);
            lowerfatp = Math.round10(lowerbodytraj.getFatPercent(baseline), -1);
            fatfree = Math.round10(bodytraj.getFatFree(baseline) * weightunits, -1);

            TEE = Math.round10(bodytraj.getTEE(baseline, paramtraj) * energyunits, 0);
            calin = Math.round10(paramtraj.calories * energyunits, 0);
            //console.log(day + ", " + weight + ", " + upper_weight + ", " + lower_weight); //+ ", " + upperfat + ", " + lowerfat + ", " + fatpercent + ", " + upperfatp + ", " + lowerfatp + ", " + fatfree + ", " + bmi + ", " + TEE + ", " + calin)
            var datachartRow = {}
            datachartRow.weight = weight;
            datachartRow.fatpercent = fatpercent;
            datachartRow.bmi = bmi;
            chartTableArray[day] = datachartRow;
            date = moment(new Date()).add(day, 'days').format('M/D/YY');
            csv += day + "," + date + "," + weight + "," + upper_weight + "," + lower_weight + "," + fatpercent + "," + upperfatp + "," + lowerfatp + "," + bmi + "," + fat + "," + fatfree + "," + calin + "," + TEE + ",\r\n";
            chartArray[day] = [day, date, weight, upper_weight, lower_weight, fatpercent, upperfatp, lowerfatp, bmi, fat, fatfree, calin, TEE]
        };

        $scope.chartTable = function () {
            chartArray = [];
            chartTableArray = [];
            var dparams;

            var upperBaseline = angular.copy(baseline);
            upperBaseline.delta_E = calorie_spread;

            var lowerBaseline = angular.copy(baseline);
            lowerBaseline.delta_E = -calorie_spread;

            //console.log("baseline " + JSON.stringify(baseline));
            //console.log("bodytraj " + JSON.stringify(bodytraj));
            var paramtraj = DailyParams.makeparamtrajectory(baseline, goalIntervention, goalMaintenanceIntervention, parseInt($scope.simulationLengthField));


            var bodytraj = [];
            var upperbodytraj = [];
            var lowerbodytraj = [];


            bodytraj[0] = BodyModel.createFromBaseline(baseline);
            upperbodytraj[0] = BodyModel.createFromBaseline(upperBaseline);
            lowerbodytraj[0] = BodyModel.createFromBaseline(lowerBaseline);
            chartRow(0, bodytraj[0], upperbodytraj[0], lowerbodytraj[0], paramtraj[0], baseline)

            //Optional: If you run into delimiter issues (where the commas are not interpreted and all data is one cell), then use this line to manually specify the delimeter
            csv = 'sep=,\r\n';
            csv += "Day, Date, Weight (" + $scope.weightUnitsRadioGroup + "), Upper Weight (" + $scope.weightUnitsRadioGroup + "),Lower Weight (" + $scope.weightUnitsRadioGroup + "),Body Fat %,Upper Body Fat %,Lower Body Fat %, BMI, Fat Mass (" + $scope.weightUnitsRadioGroup + "), Fat Free Mass (" + $scope.weightUnitsRadioGroup + "), Intake (" + $scope.energyUnitsRadioGroup + "), Expenditure (" + $scope.energyUnitsRadioGroup + "),\r\n"

            for (var i = 1; i < parseInt($scope.simulationLengthField); i++) {
                dparams = paramtraj[i];
                //always use RK not Euler
                bodytraj[i] = BodyModel.RungeKatta(bodytraj[i - 1], baseline, dparams);
                upperbodytraj[i] = BodyModel.RungeKatta(upperbodytraj[i - 1], upperBaseline, dparams);
                lowerbodytraj[i] = BodyModel.RungeKatta(lowerbodytraj[i - 1], lowerBaseline, dparams);

                chartRow(i, bodytraj[i], upperbodytraj[i], lowerbodytraj[i], paramtraj[i], baseline)
            }


            $scope.finalWeightField = chartTableArray[chartArray.length - 1].weight;
            $scope.finalBfpField = chartTableArray[chartArray.length - 1].fatpercent;
            $scope.finalBMIField = chartTableArray[chartArray.length - 1].bmi;

            if (parseFloat($scope.finalBMIField) < 18.5 && parseFloat($scope.finalWeightField) < parseFloat($scope.initialWeightField)) {
                if ($scope.guidedStep == 2 && !$scope.unachievableGoal ) {
                    //!$scope.lowBmiShow is there to show popup only once
                    $scope.launchDialog("notifyLowBMI");
                    $scope.goalWeight = $scope.initialWeightField;
                }
                $scope.lowBmiShow = true;
                $scope.highBmiShow = false;

            } else if ($scope.finalBMIField > 25 && parseFloat($scope.finalWeightField) > parseFloat($scope.initialWeightField)) {
                if ($scope.guidedStep == 2 && !$scope.unachievableGoal) {
                    //!$scope.highBmiShow is there to show popup only once
                    $scope.launchDialog("notifyHighBMI");
                    $scope.goalWeight = $scope.initialWeightField;
                }
                $scope.highBmiShow = true;
                $scope.lowBmiShow = false;
            } else {
                $scope.lowBmiShow = false;
                $scope.highBmiShow = false;
            }



            $scope.chartSetup();
        };

        $scope.chartDownload = function () {
            if ($scope.detectIE()) {
                pngFrame.document.open("text/html", "replace");
                pngFrame.document.write($("#ex0").find("svg").parent("div").html());
                pngFrame.document.close();
                pngFrame.focus();
                pngFrame.document.execCommand('SaveAs', true, 'BWSChart.html');
            } else {
                $("#downloadChart").attr({
                    'href': googleChart.getImageURI(),
                    'target': '_blank',
                    'download': 'BWSChart.png'
                });
            }
        };

        $scope.chartOptions = function () {
            $scope.zoomSlider = $scope.zoomSlider || [0, parseInt($scope.simulationLengthField)];

            //avoid showing negative days
            if ($scope.zoomSlider[1] == 0) {
                $scope.zoomSlider[1] = 1;
            }

            chartOptions = {
                height: 400,
                width: 520,
                hAxis: {
                    title: 'Day',
                    titlePosition: 'in',
                    viewWindowMode: 'explicit',
                    viewWindow: {
                        min: $scope.zoomSlider[0],
                        max: $scope.zoomSlider[1]
                    },
                },
                vAxis: {
                    title: yAxisTitle,
                },
                explorer: { actions: ['dragToZoom', 'rightClickToReset'] },
                curveType: 'line',
                lineWidth: 2,
                intervals: { 'style': 'area', 'color': '#28a4c9' },
                tooltip: { isHtml: true },
                chartArea: { top: 10, left: 70, width: '100%', height: '85%' }
            }
        };

        $scope.chartZoomReset = function () {
            $scope.zoomSlider = [0, parseInt($scope.simulationLengthField)];
            $scope.chartSetup();
        };

        // Attempt to fix Google Charts table pagination accessibility issues
        (function () {
            var obs;
            function setLabels () {
                Array.prototype.forEach.call(
                    document.querySelectorAll('.google-visualization-table-page-prev,.google-visualization-table-page-next'),
                    function (elt) {
                        if (!elt) return;
                        var label = elt.className.match('prev') ? 'Previous' : 'Next';
                        while (elt && elt.role !== 'button') elt = elt.parentElement;
                        if (!elt || elt.ariaLabel) return;
                        elt.setAttribute('aria-label', label + ' page');
                    }
                );
            }
            var container = document.getElementById('table_div');
            if (!container) return;
            setLabels();
            if ('MutationObserver' in window) {
                if (obs) obs.disconnect();
                obs = new MutationObserver(function () {
                    setLabels();
                });
                obs.observe(container, {childList: true, subtree: true});
                return;
            }
            // If MutationObserver is not supported, obs is a 1-second interval instead
            if (obs) {
                clearInterval(obs);
                obs = null;
            }
            obs = setInterval(setLabels, 1000);
        })();

        $scope.chartSetup = function () {
            function matrixMorph(source, keepDupCols, insertCols) {
                Array.prototype.insert = function (index, item) {
                    this.splice(index, 0, item);
                };
                var arr = [];
                $.each(source, function (indexR, sRow) {
                    var row = [];
                    $.each(keepDupCols, function (indexK, keepPos) {
                        //console.log(sCol);
                        row.push(sRow[keepPos]);
                    });
                    $.each(insertCols, function (indexA, insertPos) {
                        //inserting at Pos2
                        var day = row[0];
                        if ($scope.selectedTab == "weight") {

                            if (day == parseInt($scope.goalTime)) {
                                row.insert(insertPos, "Target Goal Day");
                                row.insert(insertPos, null);
                            } else {
                                row.insert(insertPos, null);
                                row.insert(insertPos, null);
                            }
                        } else {
                            //body fat & intake and expenditure
                            if (day == parseInt($scope.int1_dayField) && $scope.int1_onField) {
                                row.insert(3, "Change 1");
                            } else {
                                row.insert(3, null);
                            }
                            if (day == parseInt($scope.int2_dayField) && $scope.int2_onField) {
                                row.insert(3, "Change 2");
                            } else {
                                row.insert(3, null);
                            }
                        }
                    });
                    //console.log(row);
                    arr.push(row);
                })
                return arr;
            }

            console.log("Rendering Chart");

            //we only need specific columns for the chart
            var selectedCol = chartArray;

            if ($scope.selectedChartTab != "Tabular") {
                googleChartData = new google.visualization.DataTable();
                if ($scope.selectedChartTab == "Weight") {
                    selectedCol = matrixMorph(selectedCol, [0, 1, 2, 3, 4, 3, 4], [3]);
                    googleChartData.addColumn('number', 'Day');
                    googleChartData.addColumn('string', 'Date');
                    googleChartData.addColumn('number', 'Weight (' + $scope.weightUnitsRadioGroupLbl + ')');
                    googleChartData.addColumn({ type: 'string', role: 'annotation' });
                    googleChartData.addColumn({ type: 'string', role: 'annotation' });
                    googleChartData.addColumn({ id: 'upperInterval', type: 'number', role: 'interval' });
                    googleChartData.addColumn({ id: 'lowerInterval', type: 'number', role: 'interval' });
                    googleChartData.addColumn('number', 'High Weight (' + $scope.weightUnitsRadioGroupLbl + ')');
                    googleChartData.addColumn('number', 'Low Weight (' + $scope.weightUnitsRadioGroupLbl + ')');
                    yAxisTitle = $scope.weightUnitsRadioGroup;
                } else if ($scope.selectedChartTab == "BodyFat") {
                    selectedCol = matrixMorph(selectedCol, [0, 1, 5, 6, 7, 6, 7], [3]);
                    googleChartData.addColumn('number', 'Day');
                    googleChartData.addColumn('string', 'Date');
                    googleChartData.addColumn('number', 'Body Fat %');
                    googleChartData.addColumn({ type: 'string', role: 'annotation' });
                    googleChartData.addColumn({ type: 'string', role: 'annotation' });
                    googleChartData.addColumn({ id: 'upperInterval', type: 'number', role: 'interval' });
                    googleChartData.addColumn({ id: 'lowerInterval', type: 'number', role: 'interval' });
                    googleChartData.addColumn('number', 'High Body Fat %');
                    googleChartData.addColumn('number', 'Low Body Fat %');
                    yAxisTitle = "Body Fat %";
                } else if ($scope.selectedChartTab == "InEx") {
                    selectedCol = matrixMorph(selectedCol, [0, 1, 11, 12], [3])
                    // console.log(selectedCol)
                    googleChartData.addColumn('number', 'Day');
                    googleChartData.addColumn('string', 'Date');
                    googleChartData.addColumn('number', 'Intake (' + $scope.energyUnitsRadioGroupLbl + ')');
                    googleChartData.addColumn({ type: 'string', role: 'annotation' });
                    googleChartData.addColumn({ type: 'string', role: 'annotation' });
                    googleChartData.addColumn('number', 'Expenditure (' + $scope.energyUnitsRadioGroupLbl + ')');
                    yAxisTitle = $scope.energyUnitsRadioGroup;
                }

                $("#chartContainer").show();

                googleChartData.addRows(selectedCol);
                //clone chart for table data next to chart
                var googleChartTable = $.extend(true, new google.visualization.DataTable(), googleChartData);

                // remove date column from the GRAPH data. if want to show date x axis then remove column 0 
                googleChartData.removeColumn(1);

                $scope.chartOptions();
                if ($scope.selectedChartTab == "Weight" || $scope.selectedChartTab == "BodyFat") {
                    chartOptions.series = [{ color: '#265a88' }, { color: '#7ec8de', lineWidth: 1 }, { color: '#7ec8de', lineWidth: 1 }];
                    googleChart = new google.visualization.LineChart(document.getElementById('ex0'));
                } else {
                    //InEx
                    chartOptions.legend = { position: 'bottom' };
                    googleChart = new google.visualization.LineChart(document.getElementById('ex0'));
                }

                $scope.chartDraw();

                //adding handler to prepend "Day" to all tooltips given tooltip: {isHtml: true
                function myHandler(e) {
                    if (e.row != null) {
                        $("div.google-visualization-tooltip li:first").prepend("<span style='font-family: Arial; color: rgb(0, 0, 0); margin: 0px; text-decoration: none;'>Date: <b>" + moment(new Date()).add(e.row, 'days').format('M/D/YY') + "</b>, Day: </span>");
                    }
                }
                google.visualization.events.addListener(googleChart, 'onmouseover', myHandler);

                //remove annotation columns for table view next to to chart

                googleChartTable.removeColumns(3, 2);
                if ($scope.selectedChartTab != "InEx") {
                    //remove interval columns
                    googleChartTable.removeColumns(3, 2);
                }

                var table = new google.visualization.Table(document.getElementById('table_div'));
                table.draw(googleChartTable, { showRowNumber: false, page: 'enable', pageSize: 15 });
            } else {
                //selectedChartTab = "Tabular"

                googleChartDataTabular = new google.visualization.DataTable();
                googleChartDataTabular.addColumn('number', 'Day');
                googleChartDataTabular.addColumn('string', 'Date');
                googleChartDataTabular.addColumn('number', 'Weight (' + $scope.weightUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addColumn('number', 'High Weight (' + $scope.weightUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addColumn('number', 'Low Weight (' + $scope.weightUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addColumn('number', 'Body Fat %');
                googleChartDataTabular.addColumn('number', 'High Body Fat %');
                googleChartDataTabular.addColumn('number', 'Low Body Fat %');
                googleChartDataTabular.addColumn('number', 'BMI');
                googleChartDataTabular.addColumn('number', 'Fat Mass (' + $scope.weightUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addColumn('number', 'Fat Free Mass (' + $scope.weightUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addColumn('number', 'Intake (' + $scope.energyUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addColumn('number', 'Expenditure (' + $scope.energyUnitsRadioGroupLbl + ')');
                googleChartDataTabular.addRows(selectedCol);

                $("#chartContainer").hide();

                var table = new google.visualization.Table(document.getElementById('table_div'));
                table.draw(googleChartDataTabular, { showRowNumber: false, page: 'enable', pageSize: 15 });
            }


        };

        $scope.chartDraw = function () {
            googleChart.draw(googleChartData, chartOptions);
        };

        $scope.chartSliderZoomChange = function () {
            $scope.chartOptions();
            if ($scope.selectedChartTab == "Weight" || $scope.selectedChartTab == "BodyFat") {
                chartOptions.series = [{ color: '#265a88', areaOpacity: 0 }, { color: '#28a4c9', lineWidth: 0 }, { color: 'white', lineWidth: 1, areaOpacity: 1 }];
            } else {
                //InEx
                chartOptions.legend = { position: 'bottom' };
            }

            $scope.chartDraw();
        };

        //set units for the first time
        $scope.goalChange();
        $scope.globalUnitsUS(true); // will also set drawChart=true, will clear baseline values in guided mode

        $scope.$watch('guidedStep', function () {

            if ($scope.guidedStep == 4) {
                $("#btnGuidedNextStep").text("Expert Mode");
            } else {
                $("#btnGuidedNextStep").text("Next Step");
            }
            var step = $scope.guidedStep;
            angular.element(document).ready(function () {
                angular.element("#guidedStep1").appendTo("#guidedContainerStep1");
                angular.element("#guidedStep2").appendTo("#guidedContainerStep2");
                angular.element("#guidedStep3").appendTo("#guidedContainerStep3");
                angular.element("#guidedStep4").appendTo("#guidedContainerStep4");
                if (step != "0") {
                    angular.element("#guidedStep" + step).appendTo("#guidedPanelContainer");
                    angular.element("#guidedNav").appendTo("#guidedPanelContainer");
                    $scope.baselineAdvancedCtl = false;
                    $scope.lifestyleAdvancedCtl = false;
                    //if (step == "2" && $("input[ng-model='goalTime']").val() == "") {
                    //    //initially we want to remove the goal weight which is set when the start weight is entered
                    //    $("input[ng-model='goalWeight']").val("");
                    //}
                } else {
                    //$("input[ng-model='goalWeight']").val($scope.goalWeight);
                    //$("input[ng-model='goalTime']").val($scope.goalTime);
                    //$("input[ng-model='dt']").val($scope.dt);

                    $scope.baselineChange();
                }
            });


        });

    });

    window.app = app;
}();

}

/*
     FILE ARCHIVED ON 02:41:50 Feb 06, 2025 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 17:49:10 Feb 10, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.6
  exclusion.robots: 0.021
  exclusion.robots.policy: 0.009
  esindex: 0.012
  cdx.remote: 32.908
  LoadShardBlock: 238.002 (3)
  PetaboxLoader3.datanode: 195.535 (5)
  PetaboxLoader3.resolve: 254.873 (2)
  load_resource: 247.598
  loaddict: 8.002
*/