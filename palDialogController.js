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
    var app = angular.module("BWS");

    var PalDialogController = function ($scope, $modalInstance, WorkActivityLevel, LeisureActivityLevel, data) {
        $scope.workActivityLevelOptions = WorkActivityLevel;
        $scope.leisureActivityLevelOptions = LeisureActivityLevel;
        $scope.selectedWorkDesc = "";
        $scope.selectedLeisureDesc = "";

        //console.log(JSON.stringify($scope.workActivityLevelOptions));

        $scope.PAL = { WorkActivityLevel: '', LeisureActivityLevel: '' };

        var init = function () {
            if (data.memorySelection != null) {
                setTimeout(function () {
                    $("select[name='WorkActivityLevel']").val(data.memorySelection.workActivityLevel);
                    $("select[name='LeisureActivityLevel']").val(data.memorySelection.leisureActivityLevel);
                    $scope.PAL.WorkActivityLevel = data.memorySelection.workActivityLevel;
                    $scope.PAL.LeisureActivityLevel = data.memorySelection.leisureActivityLevel;
                    $scope.showDescription();
                }, 0);
            }
        };
        init();

        $scope.showDescription = function () {
            //$scope.selectedLeisureDesc
            $scope.selectedLeisureDesc = $("select[name='LeisureActivityLevel'] option:selected").attr("title");
            $scope.selectedWorkDesc = $("select[name='WorkActivityLevel'] option:selected").attr("title");
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('canceled');
            //console.log('canceled');
        }; // end cancel

        $scope.save = function () {
            $modalInstance.close($scope.getActivityLevel($scope.PAL.LeisureActivityLevel, $scope.PAL.WorkActivityLevel));
            //console.log($scope.getActivityLevel($scope.PAL.LeisureActivityLevel, $scope.PAL.WorkActivityLevel));
            // console.log($scope.PAL.LeisureActivityLevel + ", " + $scope.PAL.WorkActivityLevel);
        }; // end save


        $scope.getActivityLevel = function (leisureActivityLevel, workActivityLevel) {
            var activityLevel = $scope.getPalValue(leisureActivityLevel, workActivityLevel);
            var dialogResults = {};
            dialogResults.pal = activityLevel;
            var memorySelection = {};
            memorySelection.leisureActivityLevel = leisureActivityLevel;
            memorySelection.workActivityLevel = workActivityLevel;
            dialogResults.memorySelection = memorySelection;
            return dialogResults;
        };

        $scope.getPalValue = function (leisureActivityLevel, workActivityLevel) {
            var activityLevelValue = 0
            console.log(leisureActivityLevel + "|" + workActivityLevel);
            switch (leisureActivityLevel + "|" + workActivityLevel) {
                case "Very Light|Very Light":
                    activityLevelValue = 1.4;
                    break;
                case "Very Light|Light":
                    activityLevelValue = 1.5;
                    break;
                case "Very Light|Moderate":
                    activityLevelValue = 1.6;
                    break;
                case "Very Light|Heavy":
                    activityLevelValue = 1.7;
                    break;
                case "Light|Very Light":
                    activityLevelValue = 1.5;
                    break;
                case "Light|Light":
                    activityLevelValue = 1.6;
                    break;
                case "Light|Moderate":
                    activityLevelValue = 1.7;
                    break;
                case "Light|Heavy":
                    activityLevelValue = 1.8;
                    break;
                case "Moderate|Very Light":
                    activityLevelValue = 1.6;
                    break;
                case "Moderate|Light":
                    activityLevelValue = 1.7;
                    break;
                case "Moderate|Moderate":
                    activityLevelValue = 1.8;
                    break;
                case "Moderate|Heavy":
                    activityLevelValue = 1.9;
                    break;
                case "Active|Very Light":
                    activityLevelValue = 1.7;
                    break;
                case "Active|Light":
                    activityLevelValue = 1.8;
                    break;
                case "Active|Moderate":
                    activityLevelValue = 1.9;
                    break;
                case "Active|Heavy":
                    activityLevelValue = 2.1;
                    break;
                case "Very Active|Very Light":
                    activityLevelValue = 1.9;
                    break;
                case "Very Active|Light":
                    activityLevelValue = 2.0;
                    break;
                case "Very Active|Moderate":
                    activityLevelValue = 2.2;
                    break;
                case "Very Active|Heavy":
                    activityLevelValue = 2.3;
                    break;
            }
            return activityLevelValue;
        }
    }

    app.controller("PalDialogController", PalDialogController);

    app.filter("toArray", function () {
        return function (obj) {
            var result = [];
            angular.forEach(obj, function (val, key) {
                result.push(val);
            });
            return result;
        };
    })




}();
}

/*
     FILE ARCHIVED ON 07:06:57 Feb 06, 2025 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 17:49:11 Feb 10, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.733
  exclusion.robots: 0.034
  exclusion.robots.policy: 0.016
  esindex: 0.017
  cdx.remote: 24.378
  LoadShardBlock: 113.047 (3)
  PetaboxLoader3.datanode: 260.606 (5)
  load_resource: 409.027
  PetaboxLoader3.resolve: 221.635
  loaddict: 34.204
*/