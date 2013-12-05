describe("calculated DOM", function() {
  var elm, scope, compile;

  function createDirectiveDom(formula, decimals){
    elm = angular.element(
      '<div pit-calculated ng-model="value" pit-calculated-formula="'+formula+'" '+ (decimals ? 'pit-calculated-decimals="'+decimals+'"' : '' ) + '/>'
    );

    compile(elm)(scope);
    scope.$digest();
  }

  beforeEach(module('pitControls.directives'));

  beforeEach(inject(function($rootScope, $compile){
    scope = $rootScope;
    compile = $compile;
  }));

  it("should calculate scope.formula with 2 decimals", function() {
    scope.$apply(function(){
      scope.formula = 'a+b';
      scope.a = 0;
      scope.b = 0;
    });

    createDirectiveDom('formula', 2);

    scope.$apply(function(){
      scope.a = 2;
      scope.b = 5;
    });

    expect(elm.text()).toBe('7.00');
  });

  it("should calculate a+b (2+5) with 2 decimals", function() {
    scope.$apply(function(){
      scope.a = 0;
      scope.b = 0;
    });

    createDirectiveDom('a+b', 2);

    scope.$apply(function(){
      scope.a = 2;
      scope.b = 5;
    });

    expect(elm.text()).toBe('7.00');
  });

  it("should not calculate, if parts of the calculation is not defined", inject(function($log) {
    scope.$apply(function(){
      scope.a = 0;
    });

    createDirectiveDom('a+b', 2);

    scope.$apply(function(){
      scope.a = 2;
      scope.b = 5;
    });

    expect(elm.text()).toBe('');
    expect($log.error.logs.length).toBe(1);
    expect($log.error.logs[0][0]).toBe('b is not defined anywhere');
  }));

  it("should calculate without decimal specification", function() {
    scope.$apply(function(){
      scope.a = 0;
      scope.b = 0;
    });

    createDirectiveDom('a+b');

    scope.$apply(function(){
      scope.a = 2;
      scope.b = 5;
    });

    expect(elm.text()).toBe('7');
  });
});