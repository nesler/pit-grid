// A directive, that accepts a formula-attribute, and watches the formula-properties for changes to live-update the result
pitDirectives.directive('pitCalculated', function($log){
  return{
    restrict: 'AC',
    require: 'ngModel',
    link: function($scope, el, attr){
      el = $(el);

      var model = attr.ngModel
         ,child = model.split('.')[0]
         ,formula = $scope.$eval(attr.pitCalculatedFormula)
         ,decimals = $scope.$eval(attr.pitCalculatedDecimals);

      if(angular.isUndefined($scope[child]))
        $scope[child] = {};

      // If the formula-attr evaluated to NaN, it was the actual formula
      // Otherwise, it was a scope property, which contained the formula
      formula = angular.isNumber(formula) ? attr.pitCalculatedFormula : formula;
      decimals = angular.isNumber(decimals) ? attr.pitCalculatedDecimals : decimals;
      
      var toWatch = formula.match(/([A-Za-z]+)/g);

      for(var i = toWatch.length; i--;){
        var prop = toWatch[i];
        //If prop is not defined anywhere, return;
        if(angular.isUndefined($scope[prop]) && angular.isUndefined($scope[child][prop])){
          $log.error(prop + ' is not defined anywhere');
          return;
        }else if(angular.isUndefined($scope[prop]) && angular.isDefined($scope[child][prop])){
          prop = child+'.'+prop;
        }
        if(prop !== ''){
          formula = formula.replace(toWatch[i], prop+'*1');
          toWatch[i] = prop;
        }
      }

      var calcFunction = function(newVal, oldVal){
        if(newVal == oldVal)
            return;
        var val = $scope.$eval(formula).toFixed(decimals);
        if(el.is('input')){
          el.val(val);
        }else{
          $scope.$eval(model + '=' + val);
          if(el.text().length == 0 || el.text().match(/{{(.*)}}/g) == null)
            el.text(val);
        }
      }

      for(var j = toWatch.length; j--;){
        var p = toWatch[j];
        $scope.$watch(p, calcFunction);
      }
    }
  }
});