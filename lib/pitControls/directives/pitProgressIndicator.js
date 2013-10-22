'use strict'

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

pitDirectives.directive('pitProgressIndicator', function(){
  var template =  '<div class="progress">' +
                    '<div class="progress-bar" role="progressbar" aria-valuenow="{{progress}}" aria-valuemin="{{minValue}}" aria-valuemax="{{maxValue}}" ng-style="style()">' +
                      '<span class="sr-only">{{progressPercent}}% Complete</span>' +
                    '</div>' +
                  '</div>';
  return {
    scope: {},
    restrict: 'AC',
    controller: PitGridProgressIndicatorController,
    template: template
  }
});