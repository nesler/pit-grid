var app = angular.module('gridtest', []);

app.controller('MainCtrl', function($scope, $http, $timeout) {
  $scope.name = 'World 1 æøå';
});

// Load a configuration through a service, to allow other parts of the
// app to wait for the config to be loaded
app.factory('configLoader', function($q, $http){
  var def = $q.defer();
  var isLoading = false;
  return function(configUrl){
    if(!isLoading){
      isLoading = true;
      if(configUrl){
        $http.get(configUrl)
          .success(function(data){
            def.resolve(data);
            isLoading = false;
          });
      }else{
        def.resolve({});
        isLoading = false;
      }
    }
    return def.promise;
  };
});

app.controller('RowCtrl', function($scope){
  var isHidden = $scope.$parent.isRowHidden($scope.row);
  if(isHidden)
    return;
});

app.controller('TableCtrl', function($scope, $http, $timeout){
  $scope.rows = [];
  $scope.isRowHidden = function(row){
    return row.HIDDEN_ROW !== 'true' && row.DISHINDEX !== '---';
  }
  
  $scope.loading = true;
  $http.get('data.json')
    .success(function(data){
      $scope.rows = data.Rowsets.Rowset[0].Row;
      $scope.loading = false;
    });
});

app.directive('pitGrid', function($http, $compile, configLoader){
  return {
    restrict: 'A',
    controller: function($scope, $element, $attrs){
      $scope.pitGridConfig = {};
      $scope.pitGridCfgReady = configLoader($attrs.pitGridConfig).then(function(config){
        $scope.pitGridConfig = config;
      });

      switch($attrs.pitGridEditable){
        case 'always':
          $scope.editable = true;
          break;
        case 'toggle':
          $scope.editable = false;
          break;
        case 'never':
        default:
          $scope.editable = false;
          break;
      }

      $scope.onRowSelected = function($event, row){
        var p = this.$parent;
        p.classNames = p.classNames || {};
        p.classNames['pit-grid-selected'] = !p.classNames['pit-grid-selected'];

        console.log($event);
      }

      $scope.fixedHeaderPos = function(container){
        var  pos = container.offset()
            ,scrollTop = $(window).scrollTop()
            ,scrollLeft = $(window).scrollLeft()
            ,left = pos.left - scrollLeft
            ,top = pos.top - scrollTop;

        return {top: top, left: left};
      }

      $scope.scrollBarWidth = (function() {
        /* Taken from http://www.alexandre-gomes.com/?p=115 */
        var inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";

        var outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.appendChild (inner);

        document.body.appendChild (outer);
        var w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild (outer);

        return (w1 - w2);
      })();
    },
    link: function($scope, el, attrs){
      var template = attrs.pitGridTemplate;
      // Manually retreive and compile the template.
      // Do this to avoid directives in the template to be compiled before the actual table
      $http.get(template)
        .success(function(htmlTemplate){
          var maxHeight = (angular.isDefined(attrs.pitGridMaxHeight) ? attrs.pitGridMaxHeight : '100%')

          htmlTemplate = $('<div><div class="pitGridContainerButtons"></div><div class="pitGridContainer" style="overflow:auto; max-height:'+maxHeight+';">' + htmlTemplate + '</div></div>');
          
          htmlTemplate.find('input').attr('ng-disabled', '!editable');
          htmlTemplate.find('tr').attr('ng-class', 'classNames');

          if(attrs.pitGridEditable == 'toggle'){
            htmlTemplate.find('.pitGridContainerButtons').append('<button ng-click="editable = !editable">Can edit: {{editable}}</button>');
          }

          if(angular.isDefined(attrs.pitGridRowSelect)){
            htmlTemplate.find('tr').attr('ng-click', 'onRowSelected($event, row)');
          }

          // change table layout to use fixed left columns
          if(angular.isDefined(attrs.pitGridEnableFixedColumns)){
            var lastFixedColumnIndex = htmlTemplate.find('[pit-grid-fixed-column]:last').index()
                ,mainTable = htmlTemplate.find('table')
                ,fixedColumnTable = mainTable.clone(true);

            // Remove fixed columns from primary table
            mainTable.find('th:lt('+(lastFixedColumnIndex+1)+')').remove();
            mainTable.find('td:lt('+(lastFixedColumnIndex+1)+')').remove();
            mainTable.addClass('mainTable');

            // Remove non-fixed columns from fixed column table
            fixedColumnTable.find('th:gt('+lastFixedColumnIndex+')').remove();
            fixedColumnTable.find('td:gt('+lastFixedColumnIndex+')').remove();
            fixedColumnTable.addClass('fixedColumnTable');

            // Add the fixed column table to the template
            htmlTemplate.find('table').before(fixedColumnTable);

            htmlTemplate.find('.pitGridContainer').css({
              'overflow': '',
              'max-height': ''
            })

            htmlTemplate.find('.mainTable').wrap('<div style="overflow: auto; max-height:'+maxHeight+';"/>');
            htmlTemplate.find('.mainTable').parent('div').css('max-height', '+='+$scope.scrollBarWidth);
            htmlTemplate.find('.fixedColumnTable').wrap('<div style="overflow: hidden; float:left; max-height:'+maxHeight+';"/>');

            htmlTemplate.find('tbody tr').css('height', '30px');
          }
          
          $scope.pitGridCfgReady
            .then(function(){
              $scope.tableDom = $compile(htmlTemplate)($scope);
              el.replaceWith($scope.tableDom);

              var  $container = $scope.tableDom.find('div.pitGridContainer')
                  ,$tables = $container.find('table')
                  ,$fixedColTable = $tables.filter('.fixedColumnTable')
                  ,$mainTable = $tables.filter('.mainTable')
                  ,$scrollContainer = ($mainTable.length > 0 ? $mainTable.parent() : $container);                

              $tables.find('thead').addClass('pitGridHeader');

              // add fixed header and set fixed widths
              if(angular.isDefined(attrs.pitGridFixedHeader)){
                // Trigger all the bindings on first scroll.
                // This make 98% sure, that rows are loaded and widths are steady
                $scrollContainer.scroll(function(){
                  // Only do this once!
                  if($scope.isHeaderInitialized)
                    return;

                  var baseOffsetLeft = 0;
                  var containerOffsetLet = $container.offset().left;
                  // For each table available, add a header. This will add a fixed header to the fixed columns table as well, if present
                  $tables.each(function(i,table){
                    var  $table = $(table)
                        ,$headings = $table.find('th')
                        ,$fixedHeader = $('<div style="position: fixed; overflow: hidden; display:table-row; width:0px;" class="pitGridHeader pitGridFixedHeader"/>');

                    // Get the widths of eacn header, and add a div with the same dimensions to the fixed header
                    $headings.each(function (i, e) {
                      var w = $(e).width();
                      var css = {
                          'width': w,
                          'min-width': w,
                          'max-width': w,
                          'padding' : $(e).css('padding'),
                          'display': 'table-cell'
                      };
                      var $fixedCell = $('<div/>').css(css).text($(e).text());
                      $fixedHeader.append($fixedCell);
                    });

                    // Get the width of the fixed header. Either the same width as the table, or if overflowing, the width of the container
                    var headerWidth = 0;
                    headerWidth = $table.width();
                    if(headerWidth > $container.width() - baseOffsetLeft - $scope.scrollBarWidth)
                      headerWidth = $container.width() - baseOffsetLeft - $scope.scrollBarWidth;

                    $fixedHeader.css({
                      'width': headerWidth,
                      'height': $tables.find('thead').height(),
                      'left' : baseOffsetLeft + containerOffsetLet
                    });

                    // Wrap this in a clojure, since baseOffsetLieft and $fixedHeader changes for each iteration
                    (function($fixedHeader, baseOffsetLeft){
                      // Move the fixed header along when the window scrolls
                      $(window).scroll(function () {
                        var pos = $scope.fixedHeaderPos($container);
                        $fixedHeader.css({
                          'left': baseOffsetLeft - $(window).scrollLeft(),
                          'top': pos.top
                        });
                      });
                    })($fixedHeader, baseOffsetLeft + containerOffsetLet);
                    $(window).scroll();

                    baseOffsetLeft += headerWidth;
                    $table.before($fixedHeader);
                  });                 

                  var $scrollHeader = $scrollContainer.find('.pitGridFixedHeader');
                  $scrollContainer.scroll(function () {
                    var $this = $(this);
                    var left = $this.scrollLeft();
                    $scrollHeader.scrollLeft(left);
                  });

                  $scope.isHeaderInitialized = true;
                }); 
              }
              // add scroll-handler for fixed columns, to not scroll them
              if(angular.isDefined(attrs.pitGridEnableFixedColumns)){

                if($fixedColTable.length > 0){
                  var $fixedColScroller = $fixedColTable.parent();
                  $scrollContainer.scroll(function(){
                    var $this = $(this);
                    var top = $this.scrollTop();
                    $fixedColScroller.scrollTop(top);
                  });
                }
              }
            });          
        });
    }
  }
})

//We're not able to use the "number" filter on inputs, so we'll just create a directive in stead
app.directive('onlyNumbers', function(){
  return {
    restrict: 'AC',
    link: function($scope, el, attr){
      if(!$(el).is(':visible'))
        return;
      //Matches: 1,23 - 0,12 - ,21
      var  r = /^(\d*),(\d*)$/
          ,prop = attr.ngModel
          ,ref = $scope
          ,paths = prop.split('.');
      $scope.$watch(prop, function(newVal, oldVal){
        var val = newVal;
        //Only act if the input is xx,yy and not xx.yy
        if(r.test(val)){
          val = val.replace(r, '$1.$2');
        //or if the input contains non-numeric chars or dots
        }else if(typeof val === 'string' && val.match(/[^\d\.]/g) !== null){
          val = val.replace(/[^\d\.]/g, '');
        //or if the input contains more than 1 dot
        }else if(typeof val === 'string' && val.match(/\./g).length > 1){
          var indexOfLastDot = val.lastIndexOf('.');
          val = val.split('');
          val.splice(indexOfLastDot, 1);
          val = val.join('');
        }
        
        if(val != newVal){
          ref = $scope;
          
          for(var i = 0; i < paths.length-1; ++i)
            ref = ref[paths[i]];
            
          if(val == (val*1).toString())
            val = val*1;
  
          ref[paths[paths.length-1]] = val;
        }
      });
    }
  }
});

// A directive, that accepts a formula-attribute, and watches the formula-properties for changes to live-update the result
app.directive('calculated', function(){
  return{
    restrict: 'AC',
    require: 'ngModel',
    link: function($scope, el, attr){
      el = $(el);
      if(!el.is(':visible'))
        return;

      var model = attr.ngModel
         ,child = model.split('.')[0]
         ,formula = $scope.$eval(attr.calculatedFormula)
         ,decimals = $scope.$eval(attr.calculatedDecimals);

      if(!$scope[child]) return;
         
      // If the formula-attr evaluated to NaN, it was the actual formula
      // Otherwise, it was a scope property, which contained the formula
      formula = typeof(formula) === 'number' ? attr.calculatedFormula : formula;
      decimals = typeof(decimals) === 'number' ? attr.calculatedDecimals : decimals;
      
      var toWatch = formula.match(/([A-Za-z]+)/g);
      
      for(var i = toWatch.length; i--;){
        var prop = toWatch[i];
        if(typeof $scope[prop] == 'undefined' && typeof $scope[child][prop] == 'undefined'){
          toWatch.splice(i,1);
          prop = '';
        }else if(typeof $scope[prop] == 'undefined' && typeof $scope[child][prop] != 'undefined'){
          prop = child+'.'+prop;
        }
        
        if(prop !== ''){
          formula = formula.replace(toWatch[i], prop+'*1');
          toWatch[i] = prop;
        }
      }
      
      var calcFunction = function(newVal, oldVal){
        if(newVal == oldVal)
            return;
        var val = $scope.$eval(formula).toFixed(decimals);
        if(el.is('input'))
          el.val(val);
        else
          $scope.$eval(model + '=' + val);
      }

      for(var j = toWatch.length; j--;){
        var p = toWatch[j];
        $scope.$watch(p, calcFunction);
      }
    }
  }
});

app.directive('sapResult', function(){
  return {
    restrict: 'AC',
    link: function($scope, el, attr){
      el = $(el);
      if(!el.is(':visible'))
        return;
        
      var model = attr.ngModel || el.text().replace(/{{(.*)}}/, "$1")
         ,child = model.split('.')[0]
         ,source = $scope[child];
      
      if(!source) return;

      var result = (source['SAMPLE_RES'] == 'X' ? (source['MEAN_VALUE'] || source['CODE1']) : source['RES_VALUE']);
      if(result.length > 0)
        $scope.$eval(model + '=' + result);
    }
  }
});

app.directive('trimLeadingZeros', function(){
  // Runs during compile
  return {
    // name: '',
    // priority: 1,
    // terminal: true,
    // scope: {}, // {} = isolate, true = child, false/undefined = no change
    // cont­rol­ler: function($scope, $element, $attrs, $transclue) {},
    // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
    restrict: 'AC', // E = Element, A = Attribute, C = Class, M = Comment
    // template: '',
    // templateUrl: '',
    // replace: true,
    // transclude: true,
    // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
    link: function($scope, iElm, iAttrs, controller) {
      var el = $(iElm);
      if(!el.is(':visible'))
        return;

      var model = iAttrs.ngModel || el.text().replace(/{{(.*)}}/, "$1")
         ,child = model.split('.')[0]
         ,source = $scope[child];

      if(!source) return;

      var result = $scope.$eval(model).replace(/^0+/,'');
      $scope.$eval(model + '=' + result);
    }
  };
});