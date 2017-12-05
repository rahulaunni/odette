angular.module('userServices',[])
.factory('User',function ($http) {
	userFactory={};

	userFactory.create = function (userData) {
		return $http.post('/api/signup',userData)
	}
	return userFactory;
})