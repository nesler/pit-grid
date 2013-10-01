(function(){
  'use strict'

  var pitGridController = function($scope, $element, $attrs, $q, $http, $log, $timeout, $compile, utilities){
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
        ,"pit-grid-hover": !!row.hover
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
      return $scope.tbodyStyle.height - scrollTop - (visibleRows * $scope.rowHeight);
    }

    function renderScrolling(){
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
    }

    $scope.totalPages = 0;
    $scope.pageSize = angular.isDefined($attrs.pitGridPageSize) ? $attrs.pitGridPageSize*1 : 0;
    function renderPaged(page){
      $scope.currentPage = page || 0;
      $scope.totalPages = Math.ceil($scope.dataSourceRows.length/$scope.pageSize);
      var tmp = [];
      for(var i = $attrs.pitGridPageSize * $scope.currentPage; i < $attrs.pitGridPageSize * ($scope.currentPage+1); ++i){
        var row = $scope.dataSourceRows[i];
        if(!!row)
          tmp.push(row);
      }
      
      $scope.renderedRows = tmp;

      if(!$scope.$root.$$phase)
        $scope.$digest();
    }

    $scope.renderProgress = 0;
    function renderChuncked(){
      var __self = this;
      __self.isRendering = !!__self.isRendering;
      if(__self.isRendering)
        return;

      var max = $scope.dataSourceRows.length;
      // Create the loader-container
      var loader = $('<div class="chunk-loader" style="position:absolute; left:0px; top:0px; right:0px; bottom:0px; cursor:wait;"/>');
      // Add an semi-transparent background
      loader.append('<div style=" background-color: white; opacity: 0.5; filter: alpha(opacity = 50); position:absolute; z-index:1; width:100%; height:100%;"/>')
      // Compile and add the progress indicator
      loader.append($compile('<div pit-progress-indicator="renderProgress" pit-progress-indicator-max-value="'+max+'" style="width:70%; margin-left:15%; margin-top:'+$scope.gridHeight/2+'px; position:absolute; z-index:2;"></div>')($scope));
      // Append it to the DOM
      $scope.tableDom.find('.pit-grid-container').append(loader);
      __self.isRendering = true;
      var addToRender = function(rStart){
        if(rStart >= max){
          __self.isRendering = false;
          loader.remove();
          return;
        }

        var rEnd = (rStart+5 > $scope.dataSourceRows.length ? max : rStart+5);
        for(rStart; rStart < rEnd; ++rStart){
          var row = $scope.dataSourceRows[rStart];
          if(!!row)
            $scope.renderedRows.push($scope.dataSourceRows[rStart]);
        }

        $scope.renderProgress = rStart;

        if(!$scope.$root.$$phase)
          $scope.$digest();

        $timeout(function(){
          addToRender(rStart);
        }, 500)
      }

      addToRender(0);
    }

    var renderer;

    $scope.renderRows = function(){
      if(typeof renderer == 'function'){
        renderer.apply(this, arguments);
        return;
      }

      switch($scope.renderMode){
        case 'scroll':
          if($scope.gridHeight == '100%'){
            $log.info('Render mode "' + $scope.renderMode + '"" can not be used without a fixed height');
            break;
          }
          renderer = renderScrolling;
          $scope.topRowStyle.display = 'table-row';
          $scope.bottomRowStyle.display = 'table-row';
          break;
        case 'page':
        case 'paged':
          if(angular.isDefined($attrs.pitGridPageSize) && $attrs.pitGridPageSize*1 > 0){
            renderer = renderPaged;
          }else{
            $log.info('Render mode was set to pages, but pit-grid-page-size was not set to a value');
          }
          break;
        case 'chunk':
        case 'chunked':
          renderer = renderChuncked;
          break;
      }

      if(typeof renderer != 'function'){
        $log.warn('Could not match render mode "' + $scope.renderMode + '"" to anything valid.');
        renderer = renderAll;
      }

      renderer.apply(this, arguments);
    }

    $scope.tbodyStyle = {
      'height': '0px'
    }

    $scope.topRowStyle = {
      'height': '0px',
      'max-height': '0px',
      'line-height': '0px',
      'padding': '0px',
      'display': 'none'
    }

    $scope.bottomRowStyle = {
      'height': '100%',
      'max-height': '0px',
      'line-height': '0px',
      'padding': '0px',
      'display': 'none'
    }

    function rowWatchHandler(newVal){
      if(!newVal)
        newVal = $scope.$parent.$eval($attrs.pitGridDataSource);

      if(!newVal || newVal.length == 0)
        return;

      $scope.dataSourceRows = newVal;
      if($scope.pageSize > 0)
        $scope.tbodyStyle.height = $scope.pageSize * $scope.rowHeight;
      else
        $scope.tbodyStyle.height = $attrs.pitGridDataSource.length * $scope.rowHeight;

      if(visibleRows == 0)
        visibleRows = Math.ceil($scope.gridHeight / $scope.rowHeight);

      $scope.renderRows();
    }

    // Watch both length and actual object, since removal triggers on length
    $scope.$parent.$watch($attrs.pitGridDataSource + '.length', function(newVal){
      rowWatchHandler();
    });
    $scope.$parent.$watch($attrs.pitGridDataSource, function(newVal){
      rowWatchHandler(newVal);
    });
  }

  function addFixedColumnMarkup(htmlTemplate, $scope){
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

    htmlTemplate.find('tr').each(function(){ $(this).find('td:first, th:first').css('borderLeft', 'none'); });
  }

  pitDirectives.directive('pitGrid', function($http, $compile){
    return {
      restrict: 'A',
      scope: {},
      controller: pitGridController,
      link: function($scope, el, attrs){
        var template = attrs.pitGridTemplate;
        // Manually retreive and compile the template.
        // Do this to avoid directives in the template to be compiled before the actual table
        $http.get(template)
          .success(function(htmlTemplate){          

            // Wrap the template in a managable structure
            htmlTemplate = $('<div><div class="pit-grid-container-buttons"></div><div class="pit-grid-container" style="overflow:auto; height:'+$scope.gridHeight+'px; position:relative;">' + htmlTemplate + '</div></div>');
            
            // Add an ng-disabled trigger on all input
            htmlTemplate.find('input').attr('ng-disabled', '!editable');


            if(attrs.pitGridEditable == 'toggle'){
              htmlTemplate.find('.pit-grid-container-buttons').append('<button class="pit-grid-button btn" ng-click="editable = !editable">Can edit: {{editable}}</button>');
            }

            if(angular.isDefined(attrs.pitGridRowSelect)){
              htmlTemplate.find('tr').attr('ng-click', 'onRowSelected($event, row)');
            }

            // change table layout to use fixed left columns
            if(angular.isDefined(attrs.pitGridEnableFixedColumns) && htmlTemplate.find('[pit-grid-fixed-column]').length > 0){
              addFixedColumnMarkup(htmlTemplate, $scope);
            }

            if($scope.renderMode == 'paged' || $scope.renderMode == 'page'){
              htmlTemplate.append('<div pit-page-indicator="totalPages" pit-grid-page-indicator-click="renderRows"></div>')
            }

            htmlTemplate.find('table tbody').each(function(i,tbody){
              tbody = $(tbody);
              var rowAttrs = {
                 'ng-repeat': 'row in renderedRows'
                ,'ng-class': 'getClassNames(row)'
              };

              if(angular.isDefined(attrs.pitGridRowHoverHighlight)){
                rowAttrs['ng-mouseenter'] = 'row.hover = true';
                rowAttrs['ng-mouseleave'] = 'row.hover = false';
              }

              if(angular.isDefined(attrs.pitGridRowColorOdds)){
                rowAttrs['ng-class-odd'] = "'pit-grid-odd-row'";
              }

              tbody.find('tr:first').attr(rowAttrs);

              tbody.prepend('<tr ng-style="topRowStyle"><td colspan="100000" ng-style="topRowStyle">&nbsp;</td></tr>');
              tbody.append('<tr ng-style="bottomRowStyle"><td colspan="100000" ng-style="bottomRowStyle">&nbsp;</td></tr>');
            });

            htmlTemplate.find('tbody').attr('ng-style', 'tbodyStyle');
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
                            'max-width': w
                        };
                        if(i == 0)
                          css.borderLeft = 'none;';

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
                          $fixedColTable.parent().css('height', '-='+$scope.scrollBarWidth);
                          //$scrollContainer.css('height', '+='+$scope.scrollBarWidth);

                        $scope.isFixedColInitialized = true;
                      }
                    });
                  }
                }

                if($scope.renderMode == 'scroll' || $scope.renderMode == 'virtual')
                  $scrollContainer.bind('scroll', function(){
                    $scope.renderRows();
                  });

                $scope.$emit('pitGridDomLinked', attrs);
              });          
          });
      }
    }
  });
})();