//We're not able to use the "number" filter on inputs, so we'll just create a directive in stead
pitDirectives.directive('pitOnlyNumbers', function(){
  return {
    restrict: 'AC',
    link: function($scope, el, attr){
      // Only process inputs
      if(!el.is('input')){
        el.addClass('pit-only-numbers-invalid-element-type invalid-element-type');
        return;
      }
      //Matches: 1,23 - 0,12 - ,21
      var  r = /^(\d*),(\d*)$/
          ,prop = attr.ngModel
          ,ref = $scope
          ,paths = prop.split('.');
      $scope.$watch(prop, function(newVal, oldVal){
        var val = newVal;
        //Only act if the input is xx,yy and not xx.yy
        if(r.test(val)){
          val = val.replace(r, '$1.$2');
        //or if the input contains non-numeric chars or dots
        }else if(typeof val === 'string' && val.match(/[^\d\.]/g) !== null){
          val = val.replace(/[^\d\.]/g, '');
        //or if the input contains more than 1 dot
        }else if(typeof val === 'string' && val.match(/\./g) !== null && val.match(/\./g).length > 1){
          var indexOfLastDot = val.lastIndexOf('.');
          val = val.split('');
          val.splice(indexOfLastDot, 1);
          val = val.join('');
        }

        if(val && angular.isString(val) && val.indexOf('.') == 0)
          val = '0' + val;
        
        if(val != newVal){
          ref = $scope;
          
          for(var i = 0; i < paths.length-1; ++i)
            ref = ref[paths[i]];
            
          if(val == (val*1).toString())
            val = val*1;
  
          ref[paths[paths.length-1]] = val;
        }
      });
    }
  }
});