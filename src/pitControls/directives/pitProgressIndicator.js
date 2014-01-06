'use strict'

/**
 * @ngdoc directive
 * @name pitControls.directive:pit-progress-indicator
 * @element     any
 * @restrict    AC
 * @description
 * Create a progress bar
 * 
 * @param {expression} pit-progress-indicator The current value of the progress
 * @param {number} [pit-progress-indicator-min-value=0] Min-value of the progress bar. Default: 0. Optional.
 * @param {number} [pit-progress-indicator-max-value=100] Max-value of the progress bar. Default: 100. Optional.
 */
pitDirectives.directive('pitProgressIndicator', function(){
  var PitGridProgressIndicatorController = function($scope, $element, $attrs){
    $scope.minValue = angular.isDefined($attrs.pitProgressIndicatorMinValue) ? $attrs.pitProgressIndicatorMinValue : 0;
    $scope.maxValue = angular.isDefined($attrs.pitProgressIndicatorMaxValue) ? $attrs.pitProgressIndicatorMaxValue : 100;
    $scope.progress = 0;
    $scope.progressPercent = 0;

    $scope.style = function(){
      return { width: $scope.progressPercent+'%' };
    }
    
    $scope.$parent.$watch($attrs.pitProgressIndicator, function(newVal){
      if(newVal > $scope.maxValue || newVal < $scope.minValue)
        return;
      
      $scope.progress = newVal;
      $scope.progressPercent = (newVal/$scope.maxValue)*100;
    });
  }
  var template =  '<div class="progress">' +
                    '<div class="progress-bar" role="progressbar" aria-valuenow="{{progress}}" aria-valuemin="{{minValue}}" aria-valuemax="{{maxValue}}" ng-style="style()">' +
                      '<span class="sr-only">{{progressPercent}}% Complete</span>' +
                    '</div>' +
                  '</div>';
  return {
    scope: {},
    restrict: 'AC',
    controller: ['$scope','$element','$attrs',PitGridProgressIndicatorController],
    template: template
  }
});