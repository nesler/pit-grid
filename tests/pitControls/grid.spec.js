describe("grid DOM", function() {
  var elm, ctrl, scope, compile, data, template;

  function createDirectiveDom(attrs){
    elm = angular.element(
      '<div pit-grid pit-grid-data-source="data" pit-grid-template="template"/>'
    );

    if(!!attrs){
      for(var attr in attrs){
        elm.attr(attr, attrs[attr]);
      }
    }

    compile(elm)(scope);
    scope.$digest();
  }

  beforeEach(module('pitControls.services'));
  beforeEach(module('pitControls.directives'));

  beforeEach(function(){
    template = 
      '<table>'+
        '<thead>'+
          '<th pit-grid-fixed-column pit-grid-sort-source="a">a</th>'+
          '<th pit-grid-sort-source="b" pit-grid-sort-data-type="number">b</th>'+
          '<th pit-grid-hideable-column>c</th>'+
        '</thead>'+
        '<tbody>'+
          '<tr>'+
            '<td>{{a}}</td>'+
            '<td><input type="text" ng-model="b"/></td>'+
            '<td>{{c}}</td>'+
          '</tr>'+
        '</tody>'+
      '</table>';

    data = [
       { a: 1, b: 10 }
      ,{ a: 3, b: 8 } 
      ,{ a: 5, b: 6 }
      ,{ a: 7, b: 4 }
      ,{ a: 9, b: 2 }
    ]
  })

  beforeEach(inject(function($controller, $rootScope, $compile){
    scope = $rootScope;
    scope.data = data;
    scope.template = template;
    compile = $compile;
  }));

  describe("basic operations", function() {
    it("should render standard grid", function() {
      createDirectiveDom();

      var rows = elm.find('tbody tr.pit-grid-row');
      expect(rows.length).toBe(scope.data.length);

      rows.each(function(i){
        expect($(this).find('td:eq(0)').text()).toBe(data[i].a.toString());
        expect($(this).find('td:eq(1) input').val()).toBe(data[i].b.toString());
      });

      expect(elm.find('.pit-grid-container').css('height')).toBe('100%');
    });

    it("should add a row the data and render to DOM", function() {
      createDirectiveDom();

      scope.$apply(function(){
        scope.data.push({a: 10, b: 12});
      });

      var rows = elm.find('tbody tr.pit-grid-row');
      expect(rows.length).toBe(scope.data.length);
    });

    it("should remove a row from the data and render to DOM", function() {
      createDirectiveDom();

      scope.$apply(function(){
        scope.data.pop();
      });

      var rows = elm.find('tbody tr.pit-grid-row');
      expect(rows.length).toBe(scope.data.length);
    });

    it("should modify a value in data and render to DOM", function() {
      createDirectiveDom();

      scope.$apply(function(){
        scope.data[1].a = 2000;
      });

      expect(elm.find('.pit-grid-row:eq(1) td:first').text()).toBe('2000');
    });

    it("should be able to set a fixed height to the table", function() {
      createDirectiveDom({'pit-grid-height': '500px'});

      expect(elm.find('.pit-grid-container').height()).toBe(500);
    });
  });

  describe("editing options", function() {
    it("should default disable editing", function() {
      createDirectiveDom();

      expect(elm.find('input:disabled').length).toBe(elm.find('input').length);
    });

    it("should enable editing", function() {
      createDirectiveDom({'pit-grid-editable': 'always'});

      expect(elm.find('input:not(:disabled)').length).toBe(elm.find('input').length);
    });

    it("should be able to add a toggle-edit button", function() {
      createDirectiveDom({'pit-grid-editable': 'toggle'});

      var button = elm.find('button.pit-grid-button-editable');

      expect(button.length).toBe(1);
      expect(elm.find('input:disabled').length).toBe(elm.find('input').length);

      button.click();
      expect(elm.find('input:not(:disabled)').length).toBe(elm.find('input').length);

      button.click();
      expect(elm.find('input:disabled').length).toBe(elm.find('input').length);
    });

    it("should be able to toggle editable through scope var", function() {
      scope.$apply(function(){
        scope.editable = false;
      });

      createDirectiveDom({'pit-grid-editable': 'editable'});

      expect(elm.find('input:disabled').length).toBe(elm.find('input').length);

      scope.$apply(function(){
        scope.editable = true;
      });

      expect(elm.find('input:not(:disabled)').length).toBe(elm.find('input').length);
    });
  });

  describe("fixed header", function() {
    it("should add a fixed header", function() {
      createDirectiveDom({'pit-grid-fixed-header': '', 'pit-grid-height': '5px'});

      elm.find('.pit-grid-container').scroll();
      expect(elm.find('thead tr').length).toBe(2);
      expect(elm.find('thead tr.pit-grid-fixed-header').length).toBe(1);
    });
  });

  describe("fixed column", function() {
    it("should enable fixed columns", function() {
      createDirectiveDom({'pit-grid-enable-fixed-columns': ''});

      expect(elm.find('table').length).toBe(2);
    });
  });

  describe("render mode", function() {
    beforeEach(function(){
      for(var i = 0; i < 100; ++i){
        scope.data.push({a: i, b: i+1});
      }
      scope.$digest();
    });

    it("renders all (default)", function() {
      createDirectiveDom();

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBe(scope.data.length);
    });

    it("renders virtually", function() {
      createDirectiveDom({'pit-grid-render-mode': 'virtual', 'pit-grid-height': '200px'});

      var initialRows = elm.find('tr[ng-repeat="row in renderedRows"]').length;

      expect(initialRows).toBeLessThan(scope.data.length);

      scope.$apply(function(){
        scope.scrollTop = 2000;
      });

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBe(initialRows+3);

      scope.$apply(function(){
        // Scroll to the bottom
        scope.scrollTop = elm.find('tbody').height() - elm.find('.pit-grid-container').height();
      });

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).not.toBeGreaterThan(initialRows);

      scope.$apply(function(){
        scope.scrollTop = 0;
      });

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).not.toBeGreaterThan(initialRows);
    });

    it("renders scrolling", function() {
      createDirectiveDom({'pit-grid-render-mode': 'scroll', 'pit-grid-height': '200px'});

      var initialRows = elm.find('tr[ng-repeat="row in renderedRows"]').length;

      expect(initialRows).toBeLessThan(scope.data.length);

      scope.$apply(function(){
        scope.scrollTop = 2000;
      });

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBeGreaterThan(initialRows);
      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBeLessThan(scope.data.length);

      scope.$apply(function(){
        // Scroll to the bottom
        scope.scrollTop = elm.find('table').height() - elm.find('.pit-grid-container').height();
      });

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBe(scope.data.length);
    });

    it("renders paged", function() {
      createDirectiveDom({'pit-grid-render-mode': 'page', 'pit-grid-page-size': '10'});

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBe(10);

      expect(scope.totalPages).toBe(Math.ceil(scope.data.length/10));

      scope.renderRows(4);

      expect(elm.find('tr[ng-repeat="row in renderedRows"]').length).toBe(10);
    });

    it("renders in chunks", inject(function($timeout) {
      runs(function(){
        createDirectiveDom({'pit-grid-render-mode': 'chunk', 'pit-grid-height': '200px'});
        expect(elm.find('[pit-progress-indicator]').length).toBeGreaterThan(0);
      });

      waitsFor(function(){
        $timeout.flush();
        return elm.find('[pit-progress-indicator]').length == 0;
      }, 'waiting', 10000)

      runs(function(){
        expect(elm.find('.pit-grid-row').length).toBe(scope.data.length);
      });
    }));
  });

  describe("row-select", function() {
    it("enables row-select on row click", function() {
      createDirectiveDom({'pit-grid-row-select': ''});

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(0);

      elm.find('.pit-grid-row:eq(1)').click();

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(1);
    });

    it("selects multiple rows when ctrl is held down", function() {
      createDirectiveDom({'pit-grid-row-select': ''});
      var evt = $.Event('click');
      evt.ctrlKey = true;

      elm.find('.pit-grid-row:eq(1)').trigger(evt);
      elm.find('.pit-grid-row:eq(2)').trigger(evt);
      elm.find('.pit-grid-row:eq(3)').trigger(evt);

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(3);

      elm.find('.pit-grid-row:eq(2)').trigger(evt);

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(2);
    });

    it("selects multiple, then clears multiple-select when ctrl is released", function() {
      createDirectiveDom({'pit-grid-row-select': ''});
      var evt = $.Event('click');
      evt.ctrlKey = true;

      elm.find('.pit-grid-row:eq(1)').trigger(evt);
      elm.find('.pit-grid-row:eq(2)').trigger(evt);
      elm.find('.pit-grid-row:eq(3)').trigger(evt);

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(3);

      elm.find('.pit-grid-row:eq(2)').trigger(evt);

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(2);

      elm.find('.pit-grid-row:eq(4)').click();

      expect(elm.find('.pit-grid-row.pit-grid-row-selected').length).toBe(1);
    });

    it("selects a row from external scope modification", function() {
      createDirectiveDom();

      scope.$apply(function(){
        scope.data[2].pitGridRowSelected = true;
        scope.getClassNames(data[2]);
      });

      expect(elm.find('.pit-grid-row-selected').length).toBe(1);
    });

    it("selects multiple rows from external scope modification", function() {
      createDirectiveDom();

      scope.$apply(function(){
        scope.data[0].pitGridRowSelected = true;
        scope.getClassNames(data[0]);
        scope.data[2].pitGridRowSelected = true;
        scope.getClassNames(data[2]);
        scope.data[4].pitGridRowSelected = true;
        scope.getClassNames(data[4]);
      });

      expect(elm.find('.pit-grid-row-selected').length).toBe(3);
    });
  });
  
  describe("row sorting", function() {
    it("should apply default sorting b,a", function() {
      createDirectiveDom({'pit-grid-sortable': 'b,a'});

      expect(elm.find('input:first').val()).toBe('2');
    });

    it("should sort by b when clicking the column header", function() {
      createDirectiveDom({'pit-grid-sortable': ''});

      expect(elm.find('input:first').val()).toBe('10');

      scope.$apply(function(){
        elm.find('[pit-grid-sort-source="b"] span').click();
      });

      expect(elm.find('input:first').val()).toBe('2');

      scope.$apply(function(){
        elm.find('[pit-grid-sort-source="b"] span').click();
      });

      expect(elm.find('input:first').val()).toBe('10');

      scope.$apply(function(){
        elm.find('[pit-grid-sort-source="b"] span').click();
      });

      expect(elm.find('input:first').val()).toBe('10');
    });
  });

  describe("column hiding", function() {
    it("shows an arrow on hidable columns", function() {
      createDirectiveDom({'pit-grid-enable-column-toggle': ''});

      expect(elm.find('.pit-grid-hidden-column-toggler').length).toBeGreaterThan(0);
    });

    it("toggles the column when clicking the arrow", function() {
      createDirectiveDom({'pit-grid-enable-column-toggle': ''});

      expect(elm.find('th[ng-hide="column0visible"]').hasClass('ng-hide')).toBe(true);
      expect(elm.find('th[ng-show="column0visible"]').hasClass('ng-hide')).toBe(false);

      elm.find('.pit-grid-collapse-column').click();

      expect(elm.find('th[ng-hide="column0visible"]').hasClass('ng-hide')).toBe(false);
      expect(elm.find('th[ng-show="column0visible"]').hasClass('ng-hide')).toBe(true);

      elm.find('.pit-grid-expand-column').click();

      expect(elm.find('th[ng-hide="column0visible"]').hasClass('ng-hide')).toBe(true);
      expect(elm.find('th[ng-show="column0visible"]').hasClass('ng-hide')).toBe(false);
    });
  });
});