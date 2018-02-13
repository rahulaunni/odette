angular.module('homeServices',[])
.factory('Home',function ($http) {
	homeFactory={};
	homeFactory.getopenedTasks = function () {
		return $http.get('/api/nurse/getopenedtask');
	}
	homeFactory.getinprogressTasks = function () {
		return $http.get('/api/nurse/getinprogresstask');
	}
	homeFactory.getalertedTasks = function () {
		return $http.get('/api/nurse/getalertedtask');
	}
	homeFactory.skipTask = function (task) {
		return $http.post('/api/nurse/skiptask',task);
	}
	homeFactory.closeTask = function (task) {
		return $http.post('/api/nurse/closetask',task);
	}

	return homeFactory;
});
