pitDirectives.directive('pitTrimLeadingZeros', function(){
  return {
    restrict: 'AC', // E = Element, A = Attribute, C = Class, M = Comment
    link: function($scope, iElm, iAttrs, controller) {
      var el = $(iElm);
      if(!el.is(':visible'))
        return;

      var model = iAttrs.ngModel || el.text().replace(/{{(.*)}}/, "$1")
         ,child = model.split('.')[0]
         ,source = $scope[child];

      if(!source) return;

      var val = $scope.$eval(model);
      if(angular.isNumber(val))
        return;
      
      var result = val.replace(/^0+/,'');
      $scope.$eval(model + '=' + result);
    }
  };
});