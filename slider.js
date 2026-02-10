var _____WB$wombat$assign$function_____=function(name){return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name))||self[name];};if(!self.__WB_pmw){self.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}{
let window = _____WB$wombat$assign$function_____("window");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opens = _____WB$wombat$assign$function_____("opens");
/*
 jQuery UI Slider plugin wrapper
*/
angular.module('ui.slider', []).value('uiSliderConfig',{}).directive('uiSlider', ['uiSliderConfig', '$timeout', function(uiSliderConfig, $timeout) {
    uiSliderConfig = uiSliderConfig || {};
    return {
        require: 'ngModel',
        compile: function () {
            return function (scope, elm, attrs, ngModel) {

                function parseNumber(n, decimals) {
                    return (decimals) ? parseFloat(n) : parseInt(n);
                };

                var options = angular.extend(scope.$eval(attrs.uiSlider) || {}, uiSliderConfig);
                // Object holding range values
                var prevRangeValues = {
                    min: null,
                    max: null
                };

                // convenience properties
                var properties = ['min', 'max', 'step'];
                var useDecimals = (!angular.isUndefined(attrs.useDecimals)) ? true : false;

                var init = function() {
                    // When ngModel is assigned an array of values then range is expected to be true.
                    // Warn user and change range to true else an error occurs when trying to drag handle
                    if (angular.isArray(ngModel.$viewValue) && options.range !== true) {
                        console.warn('Change your range option of ui-slider. When assigning ngModel an array of values then the range option should be set to true.');
                        options.range = true;
                    }

                    // Ensure the convenience properties are passed as options if they're defined
                    // This avoids init ordering issues where the slider's initial state (eg handle
                    // position) is calculated using widget defaults
                    // Note the properties take precedence over any duplicates in options
                    angular.forEach(properties, function(property) {
                        if (angular.isDefined(attrs[property])) {
                            options[property] = parseNumber(attrs[property], useDecimals);
                        }
                    });

                    elm.slider(options);
                    init = angular.noop;
                };

                // Find out if decimals are to be used for slider
                angular.forEach(properties, function(property) {
                    // support {{}} and watch for updates
                    attrs.$observe(property, function(newVal) {
                        if (!!newVal) {
                            init();
                            elm.slider('option', property, parseNumber(newVal, useDecimals));
                            ngModel.$render();
                        }
                    });
                });
                attrs.$observe('disabled', function(newVal) {
                    init();
                    elm.slider('option', 'disabled', !!newVal);
                });

                // Watch ui-slider (byVal) for changes and update
                scope.$watch(attrs.uiSlider, function(newVal) {
                    init();
                    if(newVal != undefined) {
                      elm.slider('option', newVal);
                    }
                }, true);

                // Late-bind to prevent compiler clobbering
                $timeout(init, 0, true);

                // Update model value from slider
                elm.bind('slide', function(event, ui) {
                    ngModel.$setViewValue(ui.values || ui.value);
                    scope.$apply();
                });

                // Update slider from model value
                ngModel.$render = function() {
                    init();
                    var method = options.range === true ? 'values' : 'value';
                    
                    if (!options.range && isNaN(ngModel.$viewValue) && !(ngModel.$viewValue instanceof Array)) {
                        ngModel.$viewValue = 0;
                    }
                    else if (options.range && !angular.isDefined(ngModel.$viewValue)) {
                            ngModel.$viewValue = [0,0];
                    }

                    // Do some sanity check of range values
                    if (options.range === true) {
                        //console.log("max: " + JSON.parse(attrs.uiSlider).max);
                        //Ofer Asif fix 
                        options.max = JSON.parse(attrs.uiSlider).max;

                        // Check outer bounds for min and max values
                        if (angular.isDefined(options.min) && options.min > ngModel.$viewValue[0]) {
                            ngModel.$viewValue[0] = options.min;
                        }
                        if (angular.isDefined(options.max) && options.max < ngModel.$viewValue[1]) {
                            ngModel.$viewValue[1] = options.max;
                        }

                        // Check min and max range values
                        if (ngModel.$viewValue[0] > ngModel.$viewValue[1]) {
                            // Min value should be less to equal to max value
                            if (prevRangeValues.min >= ngModel.$viewValue[1])
                                ngModel.$viewValue[0] = prevRangeValues.min;
                            // Max value should be less to equal to min value
                            if (prevRangeValues.max <= ngModel.$viewValue[0])
                                ngModel.$viewValue[1] = prevRangeValues.max;
                        }

                        // Store values for later user
                        prevRangeValues.min = ngModel.$viewValue[0];
                        prevRangeValues.max = ngModel.$viewValue[1];

                    }
                    elm.slider(method, ngModel.$viewValue);
                };

                scope.$watch(attrs.ngModel, function() {
                    if (options.range === true) {
                        ngModel.$render();
                    }
                }, true);

                function destroy() {
                    elm.slider('destroy');
                }
                elm.bind('$destroy', destroy);
            };
        }
    };
}]);

}

/*
     FILE ARCHIVED ON 06:13:57 Feb 06, 2025 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 17:49:10 Feb 10, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.524
  exclusion.robots: 0.017
  exclusion.robots.policy: 0.008
  esindex: 0.011
  cdx.remote: 32.23
  LoadShardBlock: 237.21 (3)
  PetaboxLoader3.datanode: 210.298 (5)
  PetaboxLoader3.resolve: 134.41 (2)
  load_resource: 162.695
  loaddict: 70.118
*/