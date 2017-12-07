angular.module('userServices',[])
.factory('User',function ($http) {
	userFactory={};

	userFactory.create = function (userData) {
		return $http.post('/api/register',userData);
	}
	
	userFactory.activateAccount = function(token) {
	    return $http.put('/api/activate/' + token);
	}
	userFactory.checkCredentials = function (loginData) {
		return $http.post('/api/resend',loginData);
	}
	userFactory.resendLink = function (username) {
		return $http.put('/api/resend',username);
	}
	userFactory.sendPassword = function (resetData) {
		return $http.put('/api/forgotpassword',resetData);
	}
	return userFactory;
});