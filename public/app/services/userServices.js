angular.module('userServices',[])
.factory('User',function ($http) {
	userFactory={};

	userFactory.create = function (userData) {
		return $http.post('/api/register',userData);
	}
	userFactory.activateAccount = function(token) {
	    return $http.put('/api/activate/' + token);
	}
	return userFactory;
});