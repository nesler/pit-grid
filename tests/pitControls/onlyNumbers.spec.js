describe("onlyNumbers DOM", function() {
  var elm, scope, compile;

  beforeEach(module('pitControls.directives'));

  beforeEach(inject(function($rootScope, $compile){
    scope = $rootScope;
    compile = $compile;

    elm = angular.element(
      '<input pit-only-numbers ng-model="model"/>'
    );

    compile(elm)(scope);
    scope.$digest();
  }));

  it("shoul accept a 'real' number", function() {
    scope.$apply(function(){
      scope.model = 123.321;
    });

    expect(elm.val()).toBe('123.321');
  });

  it("should replace comma with dot", function() {
    scope.$apply(function(){
      scope.model = '123,321';
    });

    expect(elm.val()).toBe('123.321');
  });

  it("should accept a value as ,123", function() {
    scope.$apply(function(){
      scope.model = ',321';
    });

    expect(elm.val()).toBe('0.321');
  });

  it("should not allow more than 1 non-numeric symbol", function() {
    scope.$apply(function(){
      scope.model = '0.321.23';
    });

    expect(elm.val()).toBe('0.32123');

    scope.$apply(function(){
      scope.model = 'ab32.def34';
    });

    expect(elm.val()).toBe('32.34');
  });

  it("should only allow usage on input-fields", function() {
    elm = angular.element(
      '<div pit-only-numbers ng-model="model"/>'
    );

    compile(elm)(scope);
    scope.$digest();

    expect(elm).toHaveClass('invalid-element-type');
  });
});