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

    var PalChangeDialogController = function ($scope, $modalInstance, $window, data) {
        var dialogResults = {};
        $scope.actChangePctField = 0;
        $scope.addActivity = function () {
            $("#activityContainer").append($("#activityRowTemplate").html());
            $("#activityContainer .row:not(:last)").addClass("activityChangeRow");
        };

        function deleteRow(ctrl){

        }

        //add first input row. For some reason requires delay
        var init = function () {
            setTimeout(function () {
                $scope.addActivity();
                //if memory exists add rows
                if (data.memorySelection != null) {
                    $.each(data.memorySelection, function (index, memoryRow) {
                        var domRow = $("#activityContainer .row:last");
                        domRow.find("select[name='actChange']").val(memoryRow.actChange);
                        domRow.find("select[name='activity']").val(memoryRow.activity);
                        domRow.find("select[name='duration']").val(memoryRow.duration);
                        domRow.find("select[name='frequency']").val(memoryRow.frequency);
                        domRow.find("select[name='dayWeek']").val(memoryRow.dayWeek);
                        $scope.addActivity();
                    });
                    $window.calcPctChange();

                    $("modal-dialog:last").css("background-color", "red");
                }
            }, 500);
        }
        init();

        $window.calcPctChange = function () {
            var memorySelection = [];
            var met = 0;
            var metTotal = 0;
            $("#activityContainer .row").each(function (index) {
                $(this).find(".glyphicon-ok").remove();
                met = parseInt($(this).find("select[name='actChange']").val()) *
                        (parseFloat($(this).find("select[name='activity']").val()) - 1) *
                        (parseInt($(this).find("select[name='duration']").val()) / 60) *
                        parseInt($(this).find("select[name='frequency']").val()) *
                        (1 / parseInt($(this).find("select[name='dayWeek']").val()));
                //console.log(met);
                if (!isNaN(met)) {
                    var memoryRow = {};
                    memoryRow.actChange = $(this).find("select[name='actChange']").val();
                    memoryRow.activity = $(this).find("select[name='activity']").val();
                    memoryRow.duration = $(this).find("select[name='duration']").val();
                    memoryRow.frequency = $(this).find("select[name='frequency']").val();
                    memoryRow.dayWeek = $(this).find("select[name='dayWeek']").val();
                    memorySelection.push(memoryRow);
                    metTotal += met;
                    
                    $(this).find(".form-inline").append("<span class='glyphicon glyphicon-ok icon-success' aria-hidden='true' title='Valid. Saved!'></span>");
                }
            });

            var actChangePct = metTotal / data.baselineActivityParam * 100;

            if (actChangePct < -100) {
                actChangePct = -100;
            } else if (actChangePct > 500) {
                actChangePct = 500;
            }

            if (!isNaN(actChangePct)) {
                $scope.actChangePctField = parseInt(actChangePct);
                dialogResults.pctChange = $scope.actChangePctField;
                dialogResults.memorySelection = memorySelection;
                //for some reason lost 2-way binding. Use jquery.
                $("#actChangePctField").html($scope.actChangePctField);
            }
            //console.log(metTotal + "," + data.baselineActivityParam + "," + $scope.actChangePctField)
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('canceled');
            console.log('canceled');
        }; // end cancel
        $scope.save = function () {
            $modalInstance.close(dialogResults);
        }; // end save
    }
    
    app.controller("PalChangeDialogController", PalChangeDialogController);

}();
}

/*
     FILE ARCHIVED ON 07:14:37 Feb 06, 2025 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 17:49:10 Feb 10, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.638
  exclusion.robots: 0.026
  exclusion.robots.policy: 0.013
  esindex: 0.016
  cdx.remote: 7.812
  LoadShardBlock: 177.3 (3)
  PetaboxLoader3.datanode: 182.233 (5)
  PetaboxLoader3.resolve: 142.771 (2)
  load_resource: 152.978
  loaddict: 8.357
*/