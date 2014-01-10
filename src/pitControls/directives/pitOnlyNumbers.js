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
 *   <input type="text" ng-model="value" pit-only-numbers/>
 * </pre>
 * <b>Note:</b> This will NOT work with `type="number"`! 
 * 
 * @param {Number} [pit-only-numbers-min] Min-value for the input
 * @param {Number} [pit-only-numbers-max] Max-value for the input
 * 
 * @example Some basic example
    <example>
      <file name="index.html">
        <p>Type anything, only numeric values will persist</p>
        <input type="text" ng-init="value=1" ng-model="value" pit-only-numbers=""/>
        <p>{{value}}</p>
      </file>
      <file name="style.css">
        .someClass {
          color:red;
        }
      </file>
    </example>
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
      var  r = /^(-{0,1}\d*),(\d*)$/
          ,model = attr.ngModel
          ,ref = $scope
          ,paths = !!model ? model.split('.') : [];

      function fixInput(val, oldVal){
        var  min = Number(attr.min || attr.pitOnlyNumbersMin)
            ,max = Number(attr.max || attr.pitOnlyNumbersMax);

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

        if(oldVal && ((angular.isNumber(min) && val < min) || (angular.isNumber(max) && val > max)))
          return oldVal;

        return val;
      }

      // If ng-model was provided
      if(model && paths.length > 0){
        $scope.$watch(model, function(newVal, oldVal){
          var val = fixInput(newVal, oldVal);        
          if(val && angular.isString(val) && val.indexOf('.') == 0)
            val = '0' + val;
          
          if(val != newVal){
            ref = $scope;
            
            // Get the actual modelerty reference, to avoid unwanted Number-casting!
            for(var i = 0; i < paths.length-1; ++i)
              ref = ref[paths[i]];
              
            // Only cast the number to Number, if it's really a number
            // This is done to not loose a value of "1.", which would be cast to "1"
            if(val == (val*1).toString())
              val = val*1;
    
            // Set the actual reference to the value
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