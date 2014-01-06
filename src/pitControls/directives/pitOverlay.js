/**
 * @ngdoc directive
 * @name pitControls.directive:pit-overlay
 * @element any
 * @restrict A
 * @description
 * Add an overlay to a parent element
 * For it to work the best, the parent container must be relatively positioned.
 */
pitDirectives.directive('pitOverlay', function(){
  var template =  '<div style="position:absolute; left:0px; top:0px; right:0px; bottom:0px;">'+
                    '<div class="pit-overlay-background" style="position:absolute; z-index:1; width:100%; height:100%;"/>'+
                    '<div ng-transclude style="position:relative; z-index:2"/>'+
                  '</div>';
  return {
    scope: {},
    restrict: 'AC',
    template: template,
    transclude: true,
    link: function($scope, $elem){
      // A static position should equal no explicit position style
      if($elem.parent().css('position') === 'static' || $elem.parent().css('position') === ''){
        $elem.parent().css('position', 'relative');
      }
    }
  };
});