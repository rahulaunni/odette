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
	homeFactory.closeTask = function (task) {
		return $http.post('/api/nurse/closetask',task);
	}

	return homeFactory;
});
