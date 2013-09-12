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

          htmlTemplate = $('<div><div class="pitGridContainerButtons"></div><div class="pitGridContainer">' + htmlTemplate + '</div></div>');
          
          htmlTemplate.find('input').attr('ng-disabled', '!editable');

          if(attrs.pitGridEditable == 'toggle'){
            htmlTemplate.find('.pitGridContainerButtons').append('<button ng-click="editable = !editable">Can edit: {{editable}}</button>');
          }

          /*
            TODO: Impl. http://jsfiddle.net/snNuk/1/
          */

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
            fixedColumnTable.addClass('fixedColumnTable pitGrid');

            // Add the fixed column table to the template
            htmlTemplate.find('table').before(fixedColumnTable);

            htmlTemplate.find('.mainTable').wrap('<div style="overflow: auto; max-height:'+maxHeight+';"/>');
            htmlTemplate.find('.fixedColumnTable').wrap('<div style="overflow: hidden; float:left; max-height:'+maxHeight+';"/>');
            debugger;
            htmlTemplate.find('.fixedColumnTable').parent('div').css('max-width', '+='+$scope.scrollBarWidth);

            htmlTemplate.find('tbody tr').css('height', '30px');
          }
          
          $scope.pitGridCfgReady
            .then(function(){
              $scope.tableDom = $compile(htmlTemplate)($scope);
              el.replaceWith($scope.tableDom);

              var  $container = $scope.tableDom.find('div.pitGridContainer')
                  ,$table = $container.find('table')
                  ,$fixedHeader = $('<div style="position: fixed; overflow: hidden; display:table-row; width:0px;" class="pitGridHeader"/>');

              $table.find('thead').addClass('pitGridHeader');

              $container.find('table:first').before($fixedHeader);

              // set fixed widths and add fixed header
              if(angular.isDefined(attrs.pitGridFixedHeader)){
                $($scope.tableDom.find('div.pitGridContainer')).scroll(function(){
                  if($scope.isHeaderInitialized)
                    return;

                  var  $headings = $container.find('th');

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

                  var headerWidth = 0;
                  if($table.length > 1){
                    $table.each(function(){
                      headerWidth += $(this).width();
                    });
                  }else{
                    headerWidth = $table.width();
                  }
                  if(headerWidth > $container.width() - $scope.scrollBarWidth)
                    headerWidth = $container.width() - $scope.scrollBarWidth;

                  $fixedHeader.css({
                    'width': headerWidth,
                    'height': $table.find('thead').height()
                  });

                  $container.scroll(function () {
                    var left = $(this).scrollLeft();
                    $fixedHeader.scrollLeft(left);
                  });

                  $(window).scroll(function () {
                    var pos = $scope.fixedHeaderPos($container);

                    $fixedHeader.css({
                      'left': pos.left,
                      'top': pos.top
                    });
                  });
                  $(window).scroll();

                  $scope.isHeaderInitialized = true;
                });
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