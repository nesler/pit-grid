/**
 * @ngdoc directive
 * @name pitControls.directive:pit-only-numbers
 * @element     input
 * @restrict    AC
 * @description
 * Force an input to allow only numbers. The "number" filter won't allow this.
 * This works both with and without ng-model present,so it could be used for simple input limitation
 * <pre>
 *   <input type="text" pit-only-numbers/>
 * </pre>
 * or
 * <pre>
 *   <input type="text" ng-model="value" pit-grid-only-numbers/>
 * </pre>
 * @example
 * Prep for a working build of grunt-ngdocs with Angular 1.2.x
 * <pre>
 *   <example module="pitControls">
 *     <file name="index.html">
 *       Type anything, only numeric values will persist
 *       <input type="text" pit-only-numbers/>
 *     </file>
 *   </example>
 * </pre>
 */

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
          ,paths = !!prop ? prop.split('.') : [];

      function fixInput(val){
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

        return val;
      }

      // If ng-model was provided
      if(prop && paths.length > 0){
        $scope.$watch(prop, function(newVal, oldVal){
          var val = fixInput(newVal);        
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
      // Else be stupid :D
      }else{
        el.bind('keyup', function(){
          var preVal = el.val();
          var postVal = fixInput(preVal);
          if(preVal != postVal)
            el.val(postVal);
        })
      }
    }
  }
});