var _____WB$wombat$assign$function_____=function(name){return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name))||self[name];};if(!self.__WB_pmw){self.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}{
let window = _____WB$wombat$assign$function_____("window");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opens = _____WB$wombat$assign$function_____("opens");
(function () {
    'use strict';
    var app = angular.module("BWS");
    app.directive('ngChangeOnBlur', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            replace: true,
            link: function (scope, elm, attrs) {
                if (attrs.type === 'radio' || attrs.type === 'checkbox')
                    return;
                var oldValue = null;

                elm.bind('focus', function () {
                    oldValue = elm.val();
                });
                elm.bind("keydown keypress", function (event) {
                    if (event.which === 13) {
                        scope.$apply(function () {
                            applyInput(elm);
                        });
                        event.preventDefault();
                    }
                });
                elm.bind('blur', function () {
                    scope.$apply(function () {
                        applyInput(elm);
                    });
                });

                function applyInput(elm) {
                    var ctrlNgModel = attrs.ngModel;
                    var validatedInputResults = validateInput(ctrlNgModel, elm.val(), oldValue);
                    var newValue = validatedInputResults.newVal;

                    //to keep the form valid, we must apply validatedInputResults.newVal, which will override invalid input
                    scope[ctrlNgModel] = newValue;

                    //execute the function only if the value changed
                    //note: date field "/" gets focus from the calendar after update so newValue == oldValue even when changed
                    if ((newValue != oldValue) || newValue.toString().indexOf("/") != -1) {
                        //we need to save the value of the last item changed
                        //we will use this information when we undo calculation in case of a bad input (ex. starvation and other edge cases)
                        scope["undoModel"] = ctrlNgModel;
                        scope["undoValue"] = oldValue;

                        //execute the function that the directive is equal to. ex: ng-change-on-blur="goalChange()"
                        scope.$eval(attrs.ngChangeOnBlur);

                        //in case that the focus does not change, we want to ensure that the old value is in fact the new value after it has been applied
                        oldValue = newValue;
                    }
                }

                function validateInput(model, newVal, oldVal) {
                    //console.log(newVal + " - " + oldVal);
                    var validatedInputResults = {};
                    switch (model) {
                        case "dt":
                            var dayDiff = 0;
                            console.log("Today " + moment(new Date()).format('M/D/YYYY') + ", New: " + moment(new Date(newVal)).format('M/D/YYYY'));
                            dayDiff = moment(new Date(newVal)).diff(moment(new Date()), 'days');
                            console.log("dayDiff " + dayDiff);

                            validatedInputResults.newVal = isNaN(dayDiff) ? moment(new Date()).add(100, 'day').format('M/D/YYYY') :
                            dayDiff < 1 ? moment(new Date()).add(100, 'day').format('M/D/YYYY') :
                            dayDiff > 3650 ? moment(new Date()).add(100, 'day').format('M/D/YYYY') :
                            moment(new Date(newVal)).format('M/D/YYYY');
                            validatedInputResults.error = isNaN(dayDiff) ? "Invalid Date" :
                            dayDiff < 1 ? "Date must be in the future" :
                            dayDiff > 3650 ? "Date must be within 10 years" :
                            "";
                            break;
                        case "heightFt":
                            oldVal = oldVal == "" ? "5" : oldVal;
                            newVal = newVal == "" ? oldVal : newVal;
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 1 ? "1" :
                            newVal > 9 ? "9" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid: Height Ft." : "";
                            break;
                        case "heightIn":
                            oldVal = oldVal == "" ? "11" : oldVal;
                            newVal = newVal == "" ? oldVal : newVal;
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? "0" :
                            newVal > 11 ? "11" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid: Height In." : "";
                            break;
                        case "heightField":
                            oldVal = oldVal == "" ? "180" : oldVal;
                            newVal = newVal == "" ? oldVal : newVal;
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 50 ? "50" :
                            newVal > 300 ? "300" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Height Cm." : "";
                            break;
                        case "initialPALField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 1.111 ? oldVal :
                            newVal > 3 ? "3" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid: Input must be a number between 1.111 and 3" : "";
                            break;
                        case "initialWeightField":
                            oldVal = oldVal == "" ? "154.3" : oldVal;
                            newVal = newVal == "" ? oldVal : newVal;
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 10 ? oldVal :
                            newVal > 1000 ? "1000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Weight" : "";
                            break;
                        case "ageField":
                            oldVal = oldVal == "" ? "23" : oldVal;
                            newVal = newVal == "" ? oldVal : newVal;
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 18 ? oldVal :
                            newVal > 120 ? "120" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Age. Must be at least 18" : "";
                            break;
                        case "initialCarbInPercField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? "0" :
                            newVal > 100 ? "100" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "initialSodiumField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 20000 ? oldVal : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "InitialBfpField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 100 ? oldVal : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "initialRMRField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 100000 ? "100000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "goalWeight":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 20 ? oldVal :
                            newVal > 1000 ? "1000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Goal Weight" : "";
                            break;
                        case "goalTime":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 1 ? oldVal :
                            newVal > 3650 ? "3650" : newVal;
                            if (newVal > 500) {
                                validatedInputResults.error = "Warning: Long simulation will take long time to perform. In order to avoid performance delays, please limit the simulation to 500 days or specify it as the last input after all other input has been entered."
                            } else {
                                validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid. Values must be between 1 and 3650" : "";
                            }
                            break;
                        case "simulationLengthField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 2 ? "2" :
                            newVal > 3650 ? "3650" : newVal;
                            if (newVal > 500) {
                                validatedInputResults.error = "Warning: Long simulation will take long time to perform. In order to avoid performance delays, please limit the simulation to 500 days or specify it as the last input after all other input has been entered."
                            } else {
                                validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid. Values must be between 2 and 3650" : "";
                            }
                            break;
                        case "goalActChangeBox":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal.trim() == "" ? 0 :
                            newVal < -100 ? -100 :
                            newVal > 500 ? 500 : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid value." : "";
                            break;
                        case "goalMaintenanceActChangeBox":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal.trim() == "" ? 0 :
                            newVal < -100 ? -100 :
                            newVal > 500 ? 500 : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid value." : "";
                            break;
                        case "int1_dayField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 1000 ? "1000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid. Values must be between 0 and 1000" : "";
                            break;
                        case "int2_dayField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 1000 ? "1000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid. Values must be between 0 and 1000" : "";
                            break;
                        case "int1_calField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 100000 ? "100000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid. Values must be between 0 and 10,000" : "";
                            break;
                        case "int2_calField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 100000 ? "100000" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid. Values must be between 0 and 10,000" : "";
                            break;
                        case "int1_palField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < -100 ? -100 :
                            newVal > 500 ? 500 : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid value." : "";
                            break;
                        case "int2_palField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < -100 ? -100 :
                            newVal > 500 ? 500 : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid value." : "";
                            break;
                        case "int1_carbInPercField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 100 ? "100" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "int2_carbInPercField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 100 ? "100" : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "int1_sodiumField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 20000 ? oldVal : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        case "int2_sodiumField":
                            validatedInputResults.newVal = isNaN(newVal) ? oldVal :
                            newVal < 0 ? oldVal :
                            newVal > 20000 ? oldVal : newVal;
                            validatedInputResults.error = newVal != validatedInputResults.newVal ? "Invalid Value" : "";
                            break;
                        default:
                            validatedInputResults.newVal = newVal;
                            validatedInputResults.error = "";
                    }
                    $(".bwsError").remove();
                    if (validatedInputResults.error != "") {
                        $("input[ng-model='" + model + "']").closest(".form-group").after("<div class='alert alert-danger bwsError' role='alert'><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span>" + validatedInputResults.error + "</div>");
                    }
                    return validatedInputResults;
                }

            }
        };
    });
}());






}

/*
     FILE ARCHIVED ON 14:07:24 Feb 06, 2025 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 17:49:10 Feb 10, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 1.896
  exclusion.robots: 0.02
  exclusion.robots.policy: 0.01
  esindex: 0.01
  cdx.remote: 19.593
  LoadShardBlock: 155.717 (3)
  PetaboxLoader3.datanode: 152.786 (5)
  PetaboxLoader3.resolve: 67.756 (2)
  load_resource: 99.268
  loaddict: 19.802
*/