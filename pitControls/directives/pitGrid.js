pitDirectives.directive('pitGrid', function($http, $compile, configLoader, utilities){
  return {
    restrict: 'A',
    controller: function($scope, $element, $attrs){

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
    },
    link: function($scope, el, attrs){
      var template = attrs.pitGridTemplate;
      // Manually retreive and compile the template.
      // Do this to avoid directives in the template to be compiled before the actual table
      $http.get(template)
        .success(function(htmlTemplate){
          var maxHeight = (angular.isDefined(attrs.pitGridMaxHeight) ? attrs.pitGridMaxHeight : '100%')

          htmlTemplate = $('<div><div class="pit-grid-container-buttons"></div><div class="pit-grid-container" style="overflow:auto; max-height:'+maxHeight+';">' + htmlTemplate + '</div></div>');
          
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
              'max-height': ''
            });

            htmlTemplate.find('.mainTable').wrap('<div style="overflow: auto; max-height:'+maxHeight+';"/>');
            htmlTemplate.find('.mainTable').parent('div').css('max-height', '+='+$scope.scrollBarWidth);
            htmlTemplate.find('.fixedColumnTable').wrap('<div style="overflow: hidden; float:left; max-height:'+maxHeight+';"/>');

            htmlTemplate.find('tbody tr').css('height', '30px');
          }

          htmlTemplate.find('table').each(function(i,table){
            $(table).find('tbody tr:first').attr('ng-repeat', 'row in '+attrs.pitGridDataSource);
          });
          
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
                        ,$fixedHeader = $('<div style="position: fixed; overflow: hidden; display:table-row; width:0px;" class="pit-grid-header pit-grid-fixed-header"/>');

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
                        var pos = fixedHeaderPos($container);
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

                  var $scrollHeader = $scrollContainer.find('.pit-grid-fixed-header');
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
});