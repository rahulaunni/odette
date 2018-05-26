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
		return $http.put('/api/nurse/skiptask',task);
	}
	homeFactory.closeTask = function (task) {
		return $http.put('/api/nurse/closetask',task);
	}
	homeFactory.viewBed = function () {
		return $http.get('/api/nurse/viewoccupiedbed');
	}
	homeFactory.addTask = function (ipdata) {
		return $http.post('/api/nurse/task',ipdata);
	}

	return homeFactory;
});
