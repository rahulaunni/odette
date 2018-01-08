angular.module('homeServices',[])
.factory('Home',function ($http) {
	homeFactory={};
	homeFactory.getTasks = function () {
		return $http.post('/api/nurse/gettask');
	}

	return homeFactory;
});