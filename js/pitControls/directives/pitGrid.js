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

    if(angular.isDefined($attrs.pitGridEditable)){
      switch($attrs.pitGridEditable){
        case 'always':
          $scope.editable = true;
          break;
        case 'toggle':
          $scope.editable = false;
          break;
        case 'never':
          $scope.editable = false;
          break;
        default:
          // Just in case the parent controller should manage this.
          $scope.$parent.$watch($attrs.pitGridEditable, function(newVal){
            $scope.editable = !!newVal;
          });
      }
    }

    $scope.getClassNames = function(row){
      if(!row)
        return {};

      return {
          "pit-grid-hover": !!row.hover
         ,"pit-grid-selected": !!row.selected
      }
    }

    var sortedBy = [];
    var sortPrimers = {
       'number': parseInt
      ,'decimal': parseFloat
    }
    $scope.sortRows = function(sortByColumn, sortDataType){
      var sortState = 'none';
      var sortToChangeIndex;
      var sortToChange = sortedBy.filter(function(e,i){ if(e.name == sortByColumn){ sortToChangeIndex = i; return true; } })[0];
      if(!sortToChange){
        sortedBy.push({
           name: sortByColumn
          ,reverse: false
          ,primer: (!!sortDataType && typeof sortPrimers[sortDataType] == 'function' ? sortPrimers[sortDataType] : null)
        });
        sortState = 'asc';
      }else{
        // If sorting non-reverse, change to reverse
        if(sortToChange.reverse === false){
          sortToChange.reverse = true;
          sortState = 'desc';
        // If sorting reverse, remove sort
        }else{
          sortedBy.splice(sortToChangeIndex,1);
        }
      }

      if(sortedBy.length > 0){
        $scope.dataSourceRows.sort(utilities.sortBy.apply(this, sortedBy));
      }else{
        if($attrs.pitGridSortable.length > 0)
          $scope.dataSourceRows.sort(utilities.sortBy.apply(this, $attrs.pitGridSortable.split(',')));
        else
          $scope.dataSourceRows.sort();
      }

      // Get the current scrollTop before re-rendering
      var scrollTop = $scope.$scrollContainer.scrollTop();

      $scope.renderedRows = [];
      $scope.renderRows();

      // Scroll back down
      $scope.$scrollContainer.scrollTop(scrollTop);
      return sortState;
    }

    var selectedRows = [];
    $scope.onRowSelected = function($event, row){
      console.log(row);
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

    var TOP_ROWS = 3, BOTTOM_ROWS = 3, PREV_SCROLLED_ROWS = 0, FIRST_ROW_INDEX = 0, LAST_ROW_INDEX = 0, HASH_IDENT = null;
    function renderVirually(){
      var  scrollTop = $scope.$scrollContainer.scrollTop()
          ,scrolledRows = 0;

      if(scrollTop == 0){
        FIRST_ROW_INDEX = 0;
        LAST_ROW_INDEX = visibleRows + BOTTOM_ROWS;
      }else{
        scrolledRows = Math.ceil(scrollTop / $scope.rowHeight);

        FIRST_ROW_INDEX = scrolledRows - TOP_ROWS;
        if(FIRST_ROW_INDEX < 0)
          FIRST_ROW_INDEX = 0;

        LAST_ROW_INDEX = scrolledRows + visibleRows + BOTTOM_ROWS;
        if(LAST_ROW_INDEX > $scope.dataSourceRows.length)
          LAST_ROW_INDEX = $scope.dataSourceRows.length
      }

      if(HASH_IDENT != null && $scope.dataSourceRows[FIRST_ROW_INDEX].$$hashkey == HASH_IDENT){
        return;
      }

      HASH_IDENT = ($scope.dataSourceRows[FIRST_ROW_INDEX].$$hashkey || null);

      var tmp = []
      for(var rowIndex = FIRST_ROW_INDEX; rowIndex < LAST_ROW_INDEX; ++rowIndex){
        var row = $scope.dataSourceRows[rowIndex];
        if(!!row)
          tmp.push(row);
      }

      $scope.renderedRows = tmp;

      $scope.topRowStyle.height = (FIRST_ROW_INDEX-1) * $scope.rowHeight;
      $scope.bottomRowStyle.height = getOffsetBottom(scrollTop);

      if(!$scope.$root.$$phase)
        $scope.$digest();

      PREV_SCROLLED_ROWS = scrolledRows;
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

      //$scope.$scrollContainer.scrollTop(scrollTop);
    }

    function renderAll(){
      $scope.renderedRows = $scope.dataSourceRows;
    }

    $scope.totalPages = 0;
    $scope.pageSize = angular.isDefined($attrs.pitGridPageSize) ? $attrs.pitGridPageSize*1 : 0;
    function renderPaged(page){
      $scope.currentPage = (angular.isNumber(page) ? page : $scope.currentPage) || 0;
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
    var  isRendering = false
        ,duration, startTime;
    function renderChuncked(){
      if(isRendering)
        return;

      var scrollTop = $scope.$scrollContainer.scrollTop();
      var max = $scope.dataSourceRows.length;
      // Create the loader-container
      var loader = $('<div class="chunk-loader" style="position:absolute; left:0px; top:0px; right:0px; bottom:0px; cursor:wait;"/>');
      // Add an semi-transparent background
      loader.append('<div style=" background-color: white; opacity: 0.5; filter: alpha(opacity = 50); position:absolute; z-index:1; width:100%; height:100%;"/>')
      // Compile and add the progress indicator
      loader.append($compile('<div pit-progress-indicator="renderProgress" pit-progress-indicator-max-value="'+max+'" style="width:70%; margin-left:15%; margin-top:'+$scope.gridHeight/2+'px; position:absolute; z-index:2;"></div>')($scope));
      // Append it to the DOM
      $scope.tableDom.find('.pit-grid-container').append(loader);
      isRendering = true;

      var addToRender = function(rStart){
        if(rStart >= max){
          isRendering = false;
          loader.remove();
          $scope.$scrollContainer.scrollTop(scrollTop);
          return;
        }

        startTime = new Date();

        var rEnd = (rStart+5 > $scope.dataSourceRows.length ? max : rStart+5);
        for(rStart; rStart < rEnd; ++rStart){
          var row = $scope.dataSourceRows[rStart];
          if(!!row)
            $scope.renderedRows.push($scope.dataSourceRows[rStart]);
        }

        $scope.renderProgress = rStart;

        if(!$scope.$root.$$phase)
          $scope.$digest();

        duration = (new Date() - startTime);

        $timeout(function(){
          addToRender(rStart);
        }, duration/2)
      }

      addToRender(0);
    }

    var renderer;
    var IS_RENDERING_PAGED = false;
    var IS_RENDERING_ONSCROLL = false;
    $scope.renderRows = function(){
      var postInitialRender = function(){}
      if(typeof renderer != 'function'){
        switch($scope.renderMode){
          case 'virtual':
            renderer = renderVirually;

            $scope.topRowStyle.display = '';
            $scope.bottomRowStyle.display = '';
            IS_RENDERING_ONSCROLL = true;
            break;
          case 'scroll':
            if($scope.gridHeight == '100%'){
              $log.info('Render mode "' + $scope.renderMode + '"" can not be used without a fixed height');
              break;
            }
            renderer = renderScrolling;
            $scope.topRowStyle.display = '';
            $scope.bottomRowStyle.display = '';
            IS_RENDERING_ONSCROLL = true;
            break;
          case 'page':
          case 'paged':
            if(angular.isDefined($attrs.pitGridPageSize) && $attrs.pitGridPageSize*1 > 0){
              renderer = renderPaged;
              IS_RENDERING_PAGED = true;
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

        postInitialRender = function(){
          // Trigger scroll to automatically force the fixed header
          // But wait to do so until the data is actually loaded into the table
          $timeout(function(){
            $scope.$scrollContainer.scroll();
          }, 0);
        }
      }

      renderer.apply(this, arguments);
      postInitialRender();
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
      if($scope.pageSize > 0 && IS_RENDERING_PAGED)
        $scope.tbodyStyle.height = $scope.pageSize * $scope.rowHeight;
      else
        $scope.tbodyStyle.height = $scope.dataSourceRows.length * $scope.rowHeight;

      if(visibleRows == 0)
        visibleRows = Math.ceil($scope.gridHeight / $scope.rowHeight);

      $scope.renderRows();
    }

    // Dont start watching properties until the DOM is actually linked and ready for data!
    $scope.$on('pitGridDomLinked', function(){
      // Watch both length and actual object, since removal triggers on length
      $scope.$parent.$watch($attrs.pitGridDataSource + '.length', function(newVal){
        rowWatchHandler();
      });
      $scope.$parent.$watch($attrs.pitGridDataSource, function(newVal){
        rowWatchHandler(newVal);
      });
    });
    
  }

  function fixedHeaderPos(container){
    var  pos = container.offset()
        ,scrollTop = $(window).scrollTop()
        ,scrollLeft = $(window).scrollLeft()
        ,left = pos.left - scrollLeft
        ,top = pos.top - scrollTop;

    return {top: top, left: left};
  }

  function fixedHeadingStyle(fromElement, index){
    var w = $(fromElement).outerWidth();
    var css = {
        'width': w,
        'min-width': w,
        'max-width': w,
        'cursor': $(fromElement).css('cursor'),
        'overflow': 'hidden',
        'text-overflow': 'ellipsis'
    };

    return css;
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
    
    htmlTemplate.find('.fixedColumnTable td, .fixedColumnTable th').css('border-right', 'none');
  }

  var hiddenColumnIndex = 0;
  function addHiddenColumnMarkup(htmlTemplate, $scope){
    htmlTemplate
      .find('th[pit-grid-hideable-column]')
      .each(function(){
        $scope['column' + hiddenColumnIndex + 'visible'] = true;

        var  $this = $(this)
            ,pTable = $this.parents('table:first')
            ,index = $this.index();

        $this
          .attr('ng-show', 'column' + hiddenColumnIndex + 'visible');
        $this
          .append('<span class="glyphicon glyphicon-chevron-left pit-grid-collapse-column pit-grid-hidden-column-toggler" ng-click="column' + hiddenColumnIndex + 'visible = !column' + hiddenColumnIndex + 'visible"></span>');

        var hiddenTH = $(
          '<th pit-grid-hideable-column ng-hide="column' + hiddenColumnIndex + 'visible" style="width:0px; max-width:0px; min-width:0px;">'+
            '<span title="'+$this.text()+'" class="glyphicon glyphicon-chevron-right pit-grid-expand-column pit-grid-hidden-column-toggler" style="margin:0px;" ng-click="column' + hiddenColumnIndex + 'visible = !column' + hiddenColumnIndex + 'visible"></span>'+
          '</th>'
        );

        $this.before(hiddenTH);
        pTable
          .find('tbody td:eq('+index+')')
          .attr('ng-show', 'column' + hiddenColumnIndex + 'visible')
          .before('<td ng-hide="column' + hiddenColumnIndex + 'visible"></td>');

        hiddenColumnIndex++;
      });

    htmlTemplate.on('click', 'th[pit-grid-hideable-column] span', function(event){
      var $this = $(this)
          ,pTable = $this.parents('table:first');

      var  fixedHeadings = pTable.find('.pit-grid-fixed-header th')
          ,indexCells = pTable.find('tbody tr.ng-scope:first td');
      
      pTable
        .find('.pit-grid-regular-header th')
        .each(function(i,e){
        var $fixedCell = fixedHeadings.eq(i);
        var css = fixedHeadingStyle(e, i);

        $fixedCell.css(css);
      });
      
      if($this.tooltip){
        pTable.find('th[pit-grid-hideable-column] span[title]').each(function(){
          $(this).tooltip({'container': 'body'});
        });
      }

      event.stopPropagation();
    });
  }

  pitDirectives.directive('pitGrid', function($http, $compile, $log, utilities){
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
            htmlTemplate = $(
              '<div>'+
                '<div class="pit-grid-container-buttons btn-group"></div>'+
                '<div class="pit-grid-container" style="overflow:auto; height:'+$scope.gridHeight+'px; position:relative;">' + htmlTemplate + '</div>'+
              '</div>'
            );
            
            // Make some basic checks, to see if the configured template is actually compilable!
            var preCompileErrors = [];
            if(htmlTemplate.find('[pit-grid-sort-source][pit-grid-hideable-column]').length > 0){
              preCompileErrors.push('A heading is configured with both pit-grid-sort-source (being sortable) and pit-grid-hideable-colum (being hideable). These cannot be used on the same element!');
            }

            if(preCompileErrors.length > 0){
              $log.error(preCompileErrors.join('\n'));
              return;
            }

            htmlTemplate.find('tbody td').each(function(i){
              $(this).attr('ng-style', 'pitGridCellStyle'+i);
            })

            if(angular.isDefined(attrs.pitGridEditable)){
              // Add an ng-disabled trigger on all input
              htmlTemplate.find('input').attr('ng-disabled', '!editable');


              if(attrs.pitGridEditable == 'toggle'){
                htmlTemplate
                  .find('.pit-grid-container-buttons')
                  .append(
                    '<button class="pit-grid-button btn btn-primary" ng-click="editable = !editable" data-toggle="button">'+
                      '<span class="glyphicon glyphicon-edit"></span>'+
                    '</button>'
                  );
              }
            }

            if(angular.isDefined(attrs.pitGridRowSelect)){
              htmlTemplate.find('tbody tr').attr('ng-click', 'onRowSelected($event, row)');
            }

            // change table layout to use fixed left columns
            if(angular.isDefined(attrs.pitGridEnableFixedColumns) && htmlTemplate.find('[pit-grid-fixed-column]').length > 0){
              addFixedColumnMarkup(htmlTemplate, $scope);
            }

            if(angular.isDefined(attrs.pitGridEnableColumnToggle) && htmlTemplate.find('[pit-grid-hideable-column]')){
              addHiddenColumnMarkup(htmlTemplate, $scope);
            }

            if(angular.isDefined(attrs.pitGridSortable)){
              htmlTemplate.on('click', 'th[pit-grid-sort-source] span', function(){
                var  $this = $(this)
                    ,$th = $this.parent();

                var sortState = $scope.sortRows($th.attr('pit-grid-sort-source'), $th.attr('pit-grid-sort-data-type'));

                var $state = $('<span class="pit-grid-sortstate glyphicon"></span>');

                if(sortState == 'asc'){
                  $state.addClass('glyphicon-sort-by-attributes pit-grid-sorting-asc')
                }else if(sortState == 'desc'){
                  $state.addClass('glyphicon-sort-by-attributes-alt pit-grid-sorting-desc')
                }else{
                  $state.addClass('glyphicon-sort pit-grid-sorting-none')
                }

                $th.find('span').remove();
                $th.append($state);
              });

              htmlTemplate.find('th[pit-grid-sort-source]')
                        .append('<span class="pit-grid-sortstate glyphicon glyphicon-sort pit-grid-sorting-none"></span>');
            }

            if($scope.renderMode == 'paged' || $scope.renderMode == 'page'){
              htmlTemplate.find('.pit-grid-container').append('<div pit-page-indicator="totalPages" pit-grid-page-indicator-click="renderRows" style="float:right;"></div>')
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

                var  $container = $scope.tableDom.find('div.pit-grid-container')
                    ,$tables = $container.find('table')
                    ,$fixedColTable = $tables.filter('.fixedColumnTable')
                    ,$mainTable = $tables.filter('.mainTable')
                    ,$scrollContainer = $scope.$scrollContainer = ($mainTable.length > 0 ? $mainTable.parent() : $container);                

                $tables.find('thead').addClass('pit-grid-header');

                // add fixed header and set fixed widths
                if(angular.isDefined(attrs.pitGridFixedHeader)){

                  // Trigger all the bindings on first scroll.
                  // This make 98% sure, that rows are loaded and widths are steady
                  $scrollContainer.bind('scroll', function(){
                    // Only do this once!
                    if($scope.isFixedHeaderInitialized)
                      return;

                    var baseOffsetLeft = 0;
                    var containerOffsetLet = $container.offset().left;
                    var cellIndex = 0;
                    // For each table available, add a header. This will add a fixed header to the fixed columns table as well, if present
                    $tables.each(function(i,table){
                      var  $table = $(table)
                          ,$headings = $table.find('th')
                          ,$fixedHeader = $('<tr style="position: fixed; overflow: hidden; width:0px;" class="pit-grid-header pit-grid-fixed-header"/>');

                      $table.find('thead tr').addClass('pit-grid-regular-header');

                      // Get the widths of eacn header, and add a div with the same dimensions to the fixed header
                      $headings.each(function (i, e) {
                        var $fixedCell = $(e).clone();
                        var css = fixedHeadingStyle(e, i);

                        $fixedCell.css(css);
                        if(!$fixedCell.hasClass('ng-hide')){
                          $scope['pitGridCellStyle'+(cellIndex++)] = css;
                        };

                        // Copy all of the attributes, except style
                        var attributes = $(e).prop('attributes');
                        $.each(attributes, function() {
                          if(this.name.indexOf('style') == -1)
                            $fixedCell.attr(this.name, this.value);
                        });

                        $fixedHeader.append($fixedCell);
                      });

                      // Get the width of the fixed header. Either the same width as the table, or if overflowing, the width of the container
                      var headerWidth = 0;
                      headerWidth = $table.outerWidth();
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
                      $table.find('thead').append($compile($fixedHeader)($scope));
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