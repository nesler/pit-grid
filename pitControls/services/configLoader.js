// Load a configuration through a service, to allow other parts of the
// app to wait for the config to be loaded
pitServices.factory('configLoader', function($q, $http){
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