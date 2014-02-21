var app = angular.module('gridtest', ['pitControls']);

app.controller('MainCtrl', function($scope, $http, $timeout) {
  $scope.rows = [];
  $scope.visibleRows = [];
  $scope.loading = true;

  $scope.gridTemplate = 'table.html';

  $scope.loaderTemplate = '<h3>plx w41t ..!.. </h3>';

  $timeout(function(){
    $http.get('data.json')
      .success(function(data){
        var rows = data.Rowsets.Rowset[0].Row;
        var tmp = [];
        for(var i = 0; i < rows.length; ++i){
          rows[i].realIndex = i;
          tmp.push(rows[i]);
        }
        $scope.rows = tmp;
        $scope.loading = false;
      });
    }, 5);  

  $scope.$watch('rows', function(newVal){
    $scope.visibleRows = $scope.rows.filter(function(row){
      return row.HIDDEN_ROW !== 'true' && row.DISHINDEX !== '---';
    });
  });
});

app.controller('TableCtrl', function($scope, $http, $timeout){
  $scope.isRowHidden = function(row){
    return row.HIDDEN_ROW !== 'true' && row.DISHINDEX !== '---';
  }

  $scope.toggleSelectAll = function(){
    $scope.allSelected = !$scope.allSelected;
    $scope.apply(function(){
      angular.forEach($scope.rows, function(value, key){
        row.selected = $scope.allSelected;
      });
    });
  }
});

app.controller('RowCtrl', function($scope){
  $scope.$watch('$parent.row.FIANITRIT', function(newVal, oldVal){
    if(String(newVal).length != String(oldVal).length)
      console.log(newVal, oldVal);
  });
})

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

