var app = angular.module('gridtest', ['pitControls']);

app.controller('MainCtrl', function($scope, $http, $timeout) {
  $scope.name = 'World 1 æøå';

  $scope.rows = [];
  $scope.visibleRows = [];
  $scope.loading = true;
  $timeout(function(){
    $http.get('data.json')
      .success(function(data){
        $scope.rows = data.Rowsets.Rowset[0].Row;
        $scope.loading = false;
      });
    }, 200)
  

  $scope.$watch('rows.length', function(newVal){
    $scope.visibleRows = $scope.rows.filter(function(row){
      return row.HIDDEN_ROW !== 'true' && row.DISHINDEX !== '---';
    });
  });

  $scope.testCfg = {'abe': 1}
  $scope.$on('pitGridDomReady', function(){
    console.log(arguments);
  })
});

app.controller('TableCtrl', function($scope, $http, $timeout){
  $scope.isRowHidden = function(row){
    return row.HIDDEN_ROW !== 'true' && row.DISHINDEX !== '---';
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

