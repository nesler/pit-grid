describe("trimLeadingZeros DOM", function() {
  var elm, scope, compile;

  function createDirectiveDom(value, isModel){
    elm = angular.element(
      '<div pit-trim-leading-zeros'+
      (isModel ? ' ng-model="'+value+'">' : '>' + value)+
      '</div>'
    );

    compile(elm)(scope);
    scope.$digest();
  }

  beforeEach(module('pitControls.directives'));

  beforeEach(inject(function($rootScope, $compile){
    scope = $rootScope;
    compile = $compile;
  }));

  it("should remove leading zeros from text", function() {
    scope.$apply(function(){
      scope.value = '000123';
    })

    createDirectiveDom('{{value}}');

    expect(elm.text()).toBe('123');
  });

  it("should remove leading zeros from ng-model", function() {
    scope.$apply(function(){
      scope.value = '000123';
    })

    createDirectiveDom('value', true);

    expect(elm.text()).toBe('123');
  });
});