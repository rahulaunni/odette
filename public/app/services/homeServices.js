angular.module('homeServices',[])
.factory('Home',function ($http) {
	homeFactory={};
	homeFactory.getopenedTasks = function () {
		return $http.post('/api/nurse/getopenedtask');
	}
	homeFactory.getinprogressTasks = function () {
		return $http.post('/api/nurse/getinprogresstask');
	}
	homeFactory.getalertedTasks = function () {
		return $http.post('/api/nurse/getalertedtask');
	}
	homeFactory.skipTask = function (task) {
		return $http.post('/api/nurse/skiptask',task);
	}
	homeFactory.closeTask = function (task) {
		return $http.post('/api/nurse/closetask',task);
	}

	return homeFactory;
});
