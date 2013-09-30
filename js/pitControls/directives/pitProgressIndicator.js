//We're not able to use the "number" filter on inputs, so we'll just create a directive in stead
pitDirectives.directive('pitProgressIndicator', function(){
  var template =  '<div class="progress">' +
                    '<div class="progress-bar" role="progressbar" aria-valuenow="{{progress}}" aria-valuemin="0" aria-valuemax="100" style="width: {{progress}}%;">' +
                      '<span class="sr-only">60% Complete</span>' +
                    '</div>' +
                  '</div>';
  return {
    scope: {},
    restrict: 'AC',
    controller: function($scope, $element, $attrs){
      $scope.progress = 0;
      $scope.$parent.$watch($attrs.pitProgressIndicator, function(newVal){
        $scope.progress = newVal;
      });
    },
    template: template
  }
});