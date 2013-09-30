//We're not able to use the "number" filter on inputs, so we'll just create a directive in stead
pitDirectives.directive('pitPageIndicator', function(){
  var template =  '<ul class="pagination">'+
                    '<li><a href="#" ng-click="prevPage($event)">&laquo;</a></li>'+
                    '<li ng-repeat="pageIndex in pages" class="{{isActiveElement(pageIndex)}}"><a href="#" ng-click="clickhandler(pageIndex,$event)">{{pageIndex+1}}</a></li>'+
                    '<li><a href="#" ng-click="nextPage($event)">&raquo;</a></li>'+
                  '</ul>';
  return {
    scope: {},
    restrict: 'AC',
    controller: function($scope, $element, $attrs){
      $scope.clickhandler = function(index, $event){
        $event.preventDefault();
        if(index < 0 || index > $scope.pages.length-1)
          return;
        $scope.activeIndex = index;
        $scope.$parent.$eval($attrs.pitGridPageIndicatorClick)(index);
      }

      $scope.isActiveElement = function(index){
        if(index == $scope.activeIndex){
          return 'active'
        }

        return '';
      }

      $scope.nextPage = function($event){
        $scope.clickhandler($scope.activeIndex+1, $event);
      }

      $scope.prevPage = function($event){
        $scope.clickhandler($scope.activeIndex-1, $event);
      }

      $scope.pages = [];
      $scope.activeIndex = 0;

      $scope.$parent.$watch($attrs.pitPageIndicator, function(newVal){
        var tmp = [];
        for(var i = 0; i < newVal; ++i){
          tmp.push(i);
        }
        $scope.pages = tmp;
      });

      if(angular.isDefined($attrs.pitPageIndicatorSelectedPage)){
        if(angular.isNumber($attrs.pitPageIndicatorSelectedPage)){
          $scope.activeIndex = $attrs.pitPageIndicatorSelectedPage;
        }else{
          $scope.$parent.$watch($attrs.pitPageIndicatorSelectedPage, function(newVal){
            $scope.activeIndex = newVal;
          });
        }
      }
    },
    template: template
  }
});