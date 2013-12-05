/**
 * @ngdoc directive
 * @name pitControls.directive:pit-page-indicator
 * @element     any
 * @restrict    AC
 * @description
 * Add a page-indicator to your page. Useful for tables or other paged stuffs
 * @scope
 * @param {expression} pit-page-indicator The number of pages to render
 * @param {function} [pit-page-indicator-click] The function to eval when navigating
 *                                              It will have [index] passed as parameter.
 *                                              Optional.
 * @param {expression} [pit-page-indicator-selected-page] Either the actual value of the selected page,
 *                                                        or a reference to an object containing the value.
 *                                                        Optional.
 */
var PageIndicatorController = function($scope, $element, $attrs, $log){

  $scope.pages = [];
  $scope.activeIndex = 0;

  $scope.$watch('activeIndex', function(newVal, oldVal){
    if(angular.isUndefined(newVal))
      return;

    if($scope.pages.length > 0){
      for(var i = $scope.pages.length; i--;){
        $scope.pages[i].active = false;
      }

      $scope.pages[newVal].active = true;
    }
  })

  $scope.pageChangeHandler = function(index, $event){
    if(angular.isDefined($event))
      $event.preventDefault();

    if(angular.isUndefined(index) || index < 0 || index > $scope.pages.length-1)
      return;

    $scope.activeIndex = index;
    
    if(angular.isDefined($attrs.pitPageIndicatorClick))
      $scope.$parent.$eval($attrs.pitPageIndicatorClick)(index);
  }

  $scope.getClass = function(page){
    return {
      'active': page.active
    }
  }

  $scope.nextPage = function($event){
    $scope.pageChangeHandler($scope.activeIndex+1, $event);
  }

  $scope.prevPage = function($event){
    $scope.pageChangeHandler($scope.activeIndex-1, $event);
  }

  var buildPages = function(pages){
    if(pages > $scope.pages.length){
      for(var i = $scope.pages.length; i < pages; ++i){
        $scope.pages.push({index: i, active: (i == 0)});
      }
    }else if(pages < $scope.pages.length){
      for(var i = $scope.pages.length-1; i >= pages; --i){
        var page = $scope.pages.pop();
        if(page.active)
          $scope.activeIndex = pages-1;
      }
    }

    $scope.pageChangeHandler();
  }

  if(angular.isDefined($attrs.pitPageIndicator) || $attrs.pitPageIndicator.length == 0){
    if(angular.isNumber($attrs.pitPageIndicator)){
      buildPages($attrs.pitPageIndicator);
    }else{
      $scope.$parent.$watch($attrs.pitPageIndicator, function(newVal){
        buildPages(newVal);
      });
    }
  }else{
    $log.error('Attribute pit-page-indicator contains an invalid value. It must be either a static number, or a reference to a scope variable');
  }

  if(angular.isDefined($attrs.pitPageIndicatorSelectedPage)){
    if(angular.isNumber($attrs.pitPageIndicatorSelectedPage)){
      $scope.pageChangeHandler($attrs.pitPageIndicatorSelectedPage);
    }else{
      $scope.$parent.$watch($attrs.pitPageIndicatorSelectedPage, function(newVal){
        if(angular.isUndefined(newVal) || newVal < 0){
          $log.warn('An index of ' + newVal + ' was assigned to the pager. Defaulting to 0.');
          newVal = 0;
        }

        if(newVal > $scope.pages.length-1){
          $log.warn('An index of ' + newVal + ' was assigned to the pager. Defaulting to ' + ($scope.pages.length-1) +'.');
          newVal = $scope.pages.length-1;
        }

        $scope.pageChangeHandler(newVal);
      });
    }
  }
}

pitDirectives.directive('pitPageIndicator', function(){
      template =  '<ul class="pagination">'+
                    '<li class="pagination-prev"><a href="#" ng-click="prevPage($event)">&laquo;</a></li>'+
                    '<li ng-repeat="page in pages" class="pagination-page" ng-class="getClass(page)"><a href="#" ng-click="pageChangeHandler(page.index,$event)">{{page.index+1}}</a></li>'+
                    '<li class="pagination-next"><a href="#" ng-click="nextPage($event)">&raquo;</a></li>'+
                  '</ul>';
  return {
    scope: {},
    restrict: 'AC',
    controller: ['$scope','$element','$attrs','$log',PageIndicatorController],
    template: template
  }
});