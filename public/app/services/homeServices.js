angular.module('homeServices',[])
.factory('Home',function ($http) {
	homeFactory={};
	homeFactory.getTasks = function () {
		return $http.post('/api/nurse/gettask');
	}
	homeFactory.getactiveTasks = function () {
		return $http.post('/api/nurse/getactivetask');
	}
	homeFactory.skipTask = function (task) {
		return $http.post('/api/nurse/skiptask',task);
	}

	return homeFactory;
})
//socket.io client config
.factory('socket', ['$rootScope', function($rootScope) {
  var socket = io.connect();

  return {
    on: function(eventName, callback){
      socket.on(eventName, callback);
    },
    emit: function(eventName, data) {
      socket.emit(eventName, data);
    }
  };
}]);