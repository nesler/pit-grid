var app = angular.module('gridtest', ['pitControls']);

app.controller('MainCtrl', function($scope, $http, $timeout) {
  $scope.name = 'World 1 æøå';
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
      $scope.filteredData = $scope.rows.filter($scope.isRowHidden);
      $scope.loading = false;
    });
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

