describe("progressIndicator DOM", function() {
  var elm, scope, compile;

  function createDirectiveDom(min, max){
    elm = angular.element(
      '<div pit-progress-indicator="progress"'+
      (!!min ? ' pit-progress-indicator-min-value="'+min+'"' : '')+
      (!!max ? ' pit-progress-indicator-max-value="'+max+'"' : '')+
      '/>'
    );

    compile(elm)(scope);
    scope.$digest();
  }

  beforeEach(module('pitControls.directives'));

  beforeEach(inject(function($rootScope, $compile){
    scope = $rootScope;
    compile = $compile;
    
    createDirectiveDom();
  }));

  it("should have a default values of blank, 0 (min) and 100 (max) with", function() {
    var progressBar = elm.find('div.progress-bar');

    expect(progressBar.attr('aria-valuenow')).toBe('');
    expect(progressBar.attr('aria-valuemin')).toBe('0');
    expect(progressBar.attr('aria-valuemax')).toBe('100');
  });

  it("should bind external scope variable to progress", function() {
    var progressBar = elm.find('div.progress-bar');

    scope.$apply(function(){
      scope.progress = 10;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('10');

    scope.$apply(function(){
      scope.progress = 20;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('20');
  });

  it("should change min and max values", function() {
    createDirectiveDom(10, 200);
    var progressBar = elm.find('div.progress-bar');

    expect(progressBar.attr('aria-valuemin')).toBe('10');
    expect(progressBar.attr('aria-valuemax')).toBe('200');
  });

  it("should not be able to have a progress below min", function() {
    var progressBar = elm.find('div.progress-bar');

    scope.$apply(function(){
      scope.progress = 1;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('1');

    scope.$apply(function(){
      scope.progress = 0;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('0');

    scope.$apply(function(){
      scope.progress = -1;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('0');
  });

  it("should not be able to have a progress above max", function() {
    var progressBar = elm.find('div.progress-bar');

    scope.$apply(function(){
      scope.progress = 99;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('99');

    scope.$apply(function(){
      scope.progress = 100;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('100');

    scope.$apply(function(){
      scope.progress = 101;
    });

    expect(progressBar.attr('aria-valuenow')).toBe('100');
  });

  it("should check, that progress is reflected in width", function() {
    var progressBar = elm.find('div.progress-bar');

    scope.$apply(function(){
      scope.progress = 10;
    });

    expect(progressBar.attr('style')).toContain('width: 10%;');
  });

  it("should check, that progressText is reflected with progress", function() {
    var text = elm.find('span.sr-only');

    scope.$apply(function(){
      scope.progress = 10;
    });

    expect(text.text()).toBe('10% Complete');
  });
});