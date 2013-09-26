pitDirectives.directive('pitGrid', function($http, $q, $compile, utilities){
  return {
    restrict: 'A',
    scope: {},
    controller: function($scope, $element, $attrs){

      $scope.rowHeight = $attrs.pitGridRowHeight || 45;
      $scope.gridHeight = (angular.isDefined($attrs.pitGridHeight) ? $attrs.pitGridHeight.replace('px', '')*1 : '100%')
      $scope.renderMode = angular.isDefined($attrs.pitGridRenderMode) ? $attrs.pitGridRenderMode.toLowerCase() : 'virtual';

      var q = $q.defer();
      $scope.pitGridCfgReady = q.promise;

      // Config is provided as an object reference
      if(angular.isDefined($scope.$parent[$attrs.pitGridConfig])){
        $scope.pitGridConfig = $scope.$parent.$eval($attrs.pitGridConfig);
        q.resolve();
      }else if(angular.isString($attrs.pitGridConfig) && $attrs.pitGridConfig.length > 0){
        $http.get($attrs.pitGridConfig)
          .success(function(config){
            $scope.pitGridConfig = config;
            q.resolve();
          })
      }else{
        q.resolve();
      }

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

      $scope.getClassNames = function(row){
        if(!row)
          return {};

        return {
          "pit-grid-selected": !!row.selected
        }
      }

      var selectedRows = [];
      $scope.onRowSelected = function($event, row){
        if(selectedRows.length == 0){
          row.selected = true;
        }else if(!$event.ctrlKey && !$event.shiftKey){
          for(var i = selectedRows.length; i--;){
            selectedRows[i].selected = false;
            selectedRows.splice(i,1);
          }
          row.selected = true;
        }else if($event.ctrlKey && !$event.shiftKey){
          row.selected = !row.selected;
          selectedRows = selectedRows.filter(function(selectedRow){
            return selectedRow.$$hashKey != row.$$hashKey;
          });
        }else if($event.shiftKey && !$event.ctrlKey){
          //todo: impl shift-select of rows
        }

        row.$index = this.$parent.$index
        selectedRows.push(row);
      }

      $scope.getSelectedRows = function(){
        return selectedRows;
      }

      $scope.scrollBarWidth = utilities.scrollbarWidth();

      $scope.dataSourceRows = [];
      $scope.renderedRows = [];
      var visibleRows = 0;

      function getOffsetBottom(scrollTop){
        return $scope.tableStyle.height - scrollTop - (visibleRows * $scope.rowHeight);
      }

      function renderVirtually(){
        // if($scope.$root.$$phase && $scope.renderedRows.length > 0)
        //   return;
        
        var scrollTop = $scope.$scrollContainer.scrollTop();

        var ROWS_TOP = 3, ROWS_BOTTOM = 3;

        var offsetTop = 0;
        if(scrollTop > ROWS_TOP * $scope.rowHeight)
          offsetTop = scrollTop - (ROWS_TOP * $scope.rowHeight);

        var rowOffsetTop = Math.floor(offsetTop / $scope.rowHeight);

        if((scrollTop + (visibleRows * $scope.rowHeight) >= $scope.tableStyle.height) && offsetTop + ((visibleRows+1) * $scope.rowHeight) >= $scope.tableStyle.height){
          $scope.bottomRowStyle.height = 0;
          return;
        }

        var tmp = [];
        for(var i = rowOffsetTop; i < (rowOffsetTop + ROWS_TOP + visibleRows + ROWS_BOTTOM); ++i){
          var row = $scope.dataSourceRows[i];
          if(!!row)
            tmp.push(row);
        }
        $scope.renderedRows = tmp;

        $scope.topRowStyle.height = offsetTop;
        $scope.bottomRowStyle.height = getOffsetBottom(scrollTop);

        if(!$scope.$root.$$phase)
          $scope.$digest();
      }

      function renderScrolling(){
        // if($scope.$root.$$phase && $scope.renderedRows.length > 0)
        //   return;

        var scrollTop = $scope.$scrollContainer.scrollTop();

        var numRenderedRows = $scope.renderedRows.length;
        if(numRenderedRows == $scope.dataSourceRows.length){
          $scope.bottomRowStyle.height = 0;
          return;
        }

        var totalRowsToRender = Math.ceil(scrollTop / $scope.rowHeight) + visibleRows;
        if(totalRowsToRender > $scope.dataSourceRows.length)
          totalRowsToRender = $scope.dataSourceRows.length;

        for(var i = numRenderedRows; i < totalRowsToRender; ++i){
          $scope.renderedRows.push($scope.dataSourceRows[i]);
        }

        $scope.bottomRowStyle.height = getOffsetBottom(scrollTop);

        if(!$scope.$root.$$phase)
          $scope.$digest();
      }

      function renderAll(){
        $scope.renderedRows = $scope.dataSourceRows;
        $scope.bottomRowStyle.height = 0;
      }

      var renderer;

      $scope.renderRows = function(){
        if($scope.gridHeight == '100%')
          $scope.renderMode = 'all';

        if(typeof renderer == 'function'){
          renderer();
          return;
        }

        switch($scope.renderMode){
          case 'virtual':
            renderer = renderVirtually;
            break;
          case 'scroll':
            renderer = renderScrolling;
            break;
          default:
            renderer = renderAll;
            break;
        }

        renderer();
      }

      $scope.tableStyle = {
        'height': '0px'
      }

      $scope.topRowStyle = {
        'height': '0px',
        'max-height': '0px',
        'line-height': '0px',
        'padding': '0px'
      }

      $scope.bottomRowStyle = {
        'height': '100%',
        'max-height': '0px',
        'line-height': '0px',
        'padding': '0px'
      }

      // $scope.$on('pitGridDomReady', function(event, attrs){
        $scope.$parent.$watch($attrs.pitGridDataSource, function(newVal){
          if(!newVal || newVal.length == 0)
            return;

          $scope.dataSourceRows = newVal;
          $scope.tableStyle.height = $scope.dataSourceRows.length * $scope.rowHeight;

          if(visibleRows == 0)
            visibleRows = Math.ceil($scope.gridHeight / $scope.rowHeight);

          $scope.renderRows();
        });
      // })
    },
    link: function($scope, el, attrs){
      var template = attrs.pitGridTemplate;
      // Manually retreive and compile the template.
      // Do this to avoid directives in the template to be compiled before the actual table
      $http.get(template)
        .success(function(htmlTemplate){          

          htmlTemplate = $('<div><div class="pit-grid-container-buttons"></div><div class="pit-grid-container" style="overflow:auto; height:'+$scope.gridHeight+'px;">' + htmlTemplate + '</div></div>');
          
          htmlTemplate.find('input').attr('ng-disabled', '!editable');
          htmlTemplate.find('tr').attr('ng-class', 'getClassNames(row)');

          if(attrs.pitGridEditable == 'toggle'){
            htmlTemplate.find('.pit-grid-container-buttons').append('<button ng-click="editable = !editable">Can edit: {{editable}}</button>');
          }

          if(angular.isDefined(attrs.pitGridRowSelect)){
            htmlTemplate.find('tr').attr('ng-click', 'onRowSelected($event, row)');
          }

          // change table layout to use fixed left columns
          if(angular.isDefined(attrs.pitGridEnableFixedColumns)){
            // if the table had a specific controller attached, remove it and add it to the parent div
            var tableController = htmlTemplate.find('table').attr('ng-controller');
            htmlTemplate.find('table').removeAttr('ng-controller');
            htmlTemplate.find('.pit-grid-container').attr('ng-controller', tableController);

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

            htmlTemplate.find('.pit-grid-container').css({
              'overflow': '',
              'height': ''
            });

            htmlTemplate.find('.mainTable').wrap('<div style="overflow: auto; height:'+$scope.gridHeight+'px;"/>');
            htmlTemplate.find('.fixedColumnTable').wrap('<div style="overflow: hidden; float:left; height:'+$scope.gridHeight+'px;"/>');

            htmlTemplate.find('tbody tr').css('height', $scope.rowHeight + 'px');
          }

          htmlTemplate.find('table tbody').each(function(i,tbody){
            tbody = $(tbody);
            tbody.find('tr:first').attr('ng-repeat', 'row in renderedRows');//+attrs.pitGridDataSource);
            tbody.prepend('<tr ng-style="topRowStyle"><td colspan="100000" ng-style="topRowStyle">&nbsp;</td></tr>');
            tbody.append('<tr ng-style="bottomRowStyle"><td colspan="100000" ng-style="bottomRowStyle">&nbsp;</td></tr>');
          });

          htmlTemplate.find('table').attr('ng-style', 'tableStyle');
          $scope.pitGridCfgReady
            .then(function(){
              $scope.tableDom = $compile(htmlTemplate)($scope);
              el.replaceWith($scope.tableDom);

              $scope.$emit('pitGridDomReady', attrs);

              var  $container = $scope.tableDom.find('div.pit-grid-container')
                  ,$tables = $container.find('table')
                  ,$fixedColTable = $tables.filter('.fixedColumnTable')
                  ,$mainTable = $tables.filter('.mainTable')
                  ,$scrollContainer = $scope.$scrollContainer = ($mainTable.length > 0 ? $mainTable.parent() : $container);                

              $tables.find('thead').addClass('pit-grid-header');

              // add fixed header and set fixed widths
              if(angular.isDefined(attrs.pitGridFixedHeader)){

                var fixedHeaderPos = function(container){
                  var  pos = container.offset()
                      ,scrollTop = $(window).scrollTop()
                      ,scrollLeft = $(window).scrollLeft()
                      ,left = pos.left - scrollLeft
                      ,top = pos.top - scrollTop;

                  return {top: top, left: left};
                }

                // Trigger all the bindings on first scroll.
                // This make 98% sure, that rows are loaded and widths are steady
                $scrollContainer.bind('scroll', function(){
                  // Only do this once!
                  if($scope.isFixedHeaderInitialized)
                    return;

                  var baseOffsetLeft = 0;
                  var containerOffsetLet = $container.offset().left;
                  // For each table available, add a header. This will add a fixed header to the fixed columns table as well, if present
                  $tables.each(function(i,table){
                    var  $table = $(table)
                        ,$headings = $table.find('th')
                        ,$fixedHeader = $('<tr style="position: fixed; overflow: hidden; width:0px;" class="pit-grid-header pit-grid-fixed-header"/>');
                        //,$fixedHeader = $('<div style="position: fixed; overflow: hidden; display:table-row; width:0px;" class="pit-grid-header pit-grid-fixed-header"/>');

                    // Get the widths of eacn header, and add a div with the same dimensions to the fixed header
                    $headings.each(function (i, e) {
                      var w = $(e).innerWidth();
                      var css = {
                          'width': w,
                          'min-width': w,
                          'max-width': w,
                          'padding' : $(e).css('padding')
                      };
                      var $fixedCell = $('<th/>').css(css).text($(e).text());
                      $fixedHeader.append($fixedCell);
                    });

                    // Get the width of the fixed header. Either the same width as the table, or if overflowing, the width of the container
                    var headerWidth = 0;
                    headerWidth = $table.width();
                    if(headerWidth > $container.width() - baseOffsetLeft - $scope.scrollBarWidth)
                      headerWidth = $container.width() - baseOffsetLeft - $scope.scrollBarWidth;

                    $fixedHeader.css({
                      'width': headerWidth,
                      'min-width': headerWidth,
                      'max-width': headerWidth,
                      'height': $tables.find('thead').height(),
                      'left' : baseOffsetLeft + containerOffsetLet
                    });

                    // Wrap this in a clojure, since baseOffsetLieft and $fixedHeader changes for each iteration
                    (function($fixedHeader, baseOffsetLeft){
                      // Move the fixed header along when the window scrolls
                      $(window).bind('scroll',function () {
                        var pos = fixedHeaderPos($container);
                        $fixedHeader.css({
                          'left': baseOffsetLeft - $(window).scrollLeft(),
                          'top': pos.top
                        });
                      });
                    })($fixedHeader, baseOffsetLeft + containerOffsetLet);
                    $(window).scroll();

                    baseOffsetLeft += headerWidth;
                    $table.find('thead').append($fixedHeader);
                    //$table.before($fixedHeader);
                  });                 

                  var $scrollHeader = $scrollContainer.find('.pit-grid-fixed-header');
                  $scrollContainer.bind('scroll',function () {
                    var $this = $(this);
                    var left = $this.scrollLeft();
                    $scrollHeader.scrollLeft(left);
                  });

                  $scope.isFixedHeaderInitialized = true;
                }); 
              }

              // add scroll-handler for fixed columns, to not scroll them
              if(angular.isDefined(attrs.pitGridEnableFixedColumns)){

                if($fixedColTable.length > 0){
                  var $fixedColScroller = $fixedColTable.parent();
                  $scope.isFixedColInitialized = false;
                  $scrollContainer.bind('scroll', function(){
                    var $this = $(this);
                    var top = $this.scrollTop();
                    $fixedColScroller.scrollTop(top);

                    if(!$scope.isFixedColInitialized){
                      if($mainTable.width() > $scrollContainer.width())
                        $scrollContainer.css('height', '+='+$scope.scrollBarWidth);

                      $scope.isFixedColInitialized = true;
                    }
                  });
                }
              }

              $scrollContainer.bind('scroll', function(){
                $scope.renderRows();
              });

              $scope.$emit('pitGridDomLinked', attrs);
            });          
        });
    }
  }
});