angular.module('homeServices',[])
.factory('Home',function ($http) {
	homeFactory={};
	homeFactory.getTasks = function () {
		return $http.post('/api/nurse/gettask');
	}
	homeFactory.getactiveTasks = function () {
		return $http.post('/api/nurse/getactivetask');
	}

	return homeFactory;
});