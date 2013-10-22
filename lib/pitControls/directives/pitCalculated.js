// A directive, that accepts a formula-attribute, and watches the formula-properties for changes to live-update the result
pitDirectives.directive('pitCalculated', function(){
  return{
    restrict: 'AC',
    require: 'ngModel',
    link: function($scope, el, attr){
      el = $(el);
      if(!el.is(':visible'))
        return;

      var model = attr.ngModel
         ,child = model.split('.')[0]
         ,formula = $scope.$eval(attr.pitCalculatedFormula)
         ,decimals = $scope.$eval(attr.pitCalculatedDecimals);

      if(!$scope[child]) return;
         
      // If the formula-attr evaluated to NaN, it was the actual formula
      // Otherwise, it was a scope property, which contained the formula
      formula = typeof(formula) === 'number' ? attr.pitCalculatedFormula : formula;
      decimals = typeof(decimals) === 'number' ? attr.pitCalculatedDecimals : decimals;
      
      var toWatch = formula.match(/([A-Za-z]+)/g);
      
      for(var i = toWatch.length; i--;){
        var prop = toWatch[i];
        if(typeof $scope[prop] == 'undefined' && typeof $scope[child][prop] == 'undefined'){
          toWatch.splice(i,1);
          prop = '';
        }else if(typeof $scope[prop] == 'undefined' && typeof $scope[child][prop] != 'undefined'){
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
        if(el.is('input'))
          el.val(val);
        else
          $scope.$eval(model + '=' + val);
      }

      for(var j = toWatch.length; j--;){
        var p = toWatch[j];
        $scope.$watch(p, calcFunction);
      }
    }
  }
});