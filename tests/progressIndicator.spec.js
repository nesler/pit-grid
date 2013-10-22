describe("progressIndicator DOM", function() {
  var elm, scope;

  beforeEach(module('pitControls.directives'));

  beforeEach(inject(function($rootScope, $compile){
    elm = angular.element(
      '<div pit-progress-indicator="progress"/>'
    );

    scope = $rootScope;
    $compile(elm)(scope);
    scope.$digest();
  }));

  it("should have a default value of 0 when progress is undefined", function() {
    var progressBar = elm.find('div.progress-bar');

    expect(progressBar.attr('aria-valuenow')).toBe(0);
  });
});

describe("progressIndicator controller", function() {
  var scope, ctrl;
  
  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope;

    // instantiate the controller stand-alone, without the directive
    ctrl = $controller(PitGridProgressIndicatorController, {$scope: scope, $element: null});
  }));
});