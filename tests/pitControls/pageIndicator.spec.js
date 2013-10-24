describe("pageIndicator DOM", function() {
  var elm, scope, compile;

  function createDirectiveDom(selectedPage, clickHandler){
    elm = angular.element(
      '<div pit-page-indicator="pageCount"'+
      (!!selectedPage ? ' pit-page-indicator-selected-page="'+selectedPage+'"' : '')+
      (!!clickHandler ? ' pit-page-indicator-click="'+clickHandler+'"' : '')+
      '/>'
    );

    compile(elm)(scope);
    scope.$digest();
  }

  beforeEach(module('pitControls.directives'));

  beforeEach(inject(function($rootScope, $compile){
    scope = $rootScope;
    compile = $compile;
  }));

  it("should create 10 pages", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom();

    expect(elm.find('li.pagination-page').length).toBe(10);
  });

  it("page 1 should be default active", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom();
    expect(elm.find('li.pagination-page.active a').text()).toBe('1');
  });

  it("set page 3 as active page", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom(2);
    expect(elm.find('li.pagination-page.active a').text()).toBe('3');
  });

  it("change page depending on scope variable", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
      scope.selectedPage = 3;
    });

    createDirectiveDom('selectedPage');
    expect(elm.find('li.pagination-page.active a').text()).toBe('4');

    scope.$apply(function(){
      scope.selectedPage = 7;
    });

    expect(elm.find('li.pagination-page.active a').text()).toBe('8');
  });

  it("change page-count", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom('selectedPage');
    expect(elm.find('li.pagination-page').length).toBe(10);

    scope.$apply(function(){
      scope.pageCount = 20;
    });

    expect(elm.find('li.pagination-page').length).toBe(20);
  });

  it("change page-count and move active", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom('selectedPage');
    expect(elm.find('li.pagination-page').length).toBe(10);

    scope.$apply(function(){
      scope.pageCount = 20;
    });

    expect(elm.find('li.pagination-page').length).toBe(20);

    scope.$apply(function(){
      scope.selectedPage = 15;
    });

    expect(elm.find('li.pagination-page.active a').text()).toBe('16');

    scope.$apply(function(){
      scope.pageCount = 10;
    });

    expect(elm.find('li.pagination-page').length).toBe(10);
    expect(elm.find('li.pagination-page.active a').text()).toBe('10');

    scope.$apply(function(){
      scope.pageCount = 20;
    });

    expect(elm.find('li.pagination-page').length).toBe(20);
    expect(elm.find('li.pagination-page.active a').text()).toBe('10');
  });

  it("cannot set page index outside page-length (<0, >10)", inject(function($log) {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom('selectedPage');

    expect($log.warn.logs.length).toBe(1);
    expect($log.warn.logs[0][0]).toBe('An index of undefined was assigned to the pager. Defaulting to 0.');
    expect(elm.find('li.pagination-page.active a').text()).toBe('1');

    scope.$apply(function(){
      scope.selectedPage = -1;
    });

    expect($log.warn.logs.length).toBe(2);
    expect($log.warn.logs[1][0]).toBe('An index of -1 was assigned to the pager. Defaulting to 0.');
    expect(elm.find('li.pagination-page.active a').text()).toBe('1');

    scope.$apply(function(){
      scope.selectedPage = 9;
    });

    expect(elm.find('li.pagination-page.active a').text()).toBe('10');

    scope.$apply(function(){
      scope.selectedPage = 10;
    });

    expect($log.warn.logs.length).toBe(3);
    expect($log.warn.logs[2][0]).toBe('An index of 10 was assigned to the pager. Defaulting to 9.');
    expect(elm.find('li.pagination-page.active a').text()).toBe('10');
  }));

  it("can change using buttons", function() {
    scope.$apply(function(){
      scope.pageCount = 10;
    });

    createDirectiveDom();

    expect(elm.find('li.pagination-page.active a').text()).toBe('1');

    elm.find('li.pagination-next a').click();
    expect(elm.find('li.pagination-page.active a').text()).toBe('2');

    elm.find('li.pagination-prev a').click();
    expect(elm.find('li.pagination-page.active a').text()).toBe('1');
  });

  it("triggers a callback when changing page using buttons", function() {
    var msg = '';
    scope.$apply(function(){
      scope.pageCount = 10;
      scope.clickHandler = function(){ msg = 'ok'; };
    });

    createDirectiveDom(null, 'clickHandler');
    elm.find('li.pagination-next a').click();
    expect(msg).toBe('ok');
  });

  it("triggers a callback when changing page using scope variable", function() {
    var msg = '';

    scope.$apply(function(){
      scope.pageCount = 10;
      scope.selectedPage = 0;
      scope.clickHandler = function(){ msg = 'ok'; };
    });

    createDirectiveDom('selectedPage', 'clickHandler');

    scope.$apply(function(){
      scope.selectedPage = 5;
    });

    expect(msg).toBe('ok');
  });
});

describe("pageIndicator Controller", function() {
  var scope, ctrl;

  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope;

    // instantiate the controller stand-alone, without the directive
    ctrl = $controller(PageIndicatorController, {$scope: scope, $element: null, $attrs: {pitPageIndicator: 10}});
  }));

  it("deactivate other pages on selection", function() {
    expect(scope.pages[0].active).toBe(true);
    expect(scope.pages[1].active).toBe(false);
    expect(scope.pages[2].active).toBe(false);

    scope.pageChangeHandler(1);
    scope.$digest();
    expect(scope.pages[0].active).toBe(false);
    expect(scope.pages[1].active).toBe(true);
    expect(scope.pages[2].active).toBe(false);

    scope.pageChangeHandler(2);
    scope.$digest();
    expect(scope.pages[0].active).toBe(false);
    expect(scope.pages[1].active).toBe(false);
    expect(scope.pages[2].active).toBe(true);
  });

  it("changes activation when calling prev or next methods", function() {
    scope.nextPage();
    scope.$digest();
    expect(scope.pages[0].active).toBe(false);
    expect(scope.pages[1].active).toBe(true);
    expect(scope.pages[2].active).toBe(false);

    scope.prevPage();
    scope.$digest();
    expect(scope.pages[0].active).toBe(true);
    expect(scope.pages[1].active).toBe(false);
    expect(scope.pages[2].active).toBe(false);
  });
});