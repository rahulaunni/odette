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
	userFactory.verifyLink = function (token) {
		return $http.get('/api/resetpassword/' + token);
	}
	userFactory.savePassword = function (userData) {
		return $http.put('/api/savepassword/',userData);
	}
	userFactory.getPermission = function () {
		return $http.get('/api/permission/');
	}
	userFactory.addUser = function (userData) {
		return $http.post('/api/admin/adduser',userData);
	}
	userFactory.viewUser = function (userData) {
		return $http.post('/api/admin/viewuser',userData);
	}
	userFactory.deleteUser = function (user) {
		return $http.post('/api/admin/deleteuser',user);
	}
	userFactory.savelocalPassword = function (edituser) {
		return $http.put('/api/admin/savelocalpassword/',edituser);
	}
	userFactory.getIp = function () {
		return $http.post('/api/admin/getip/');
	}
	userFactory.getConnectedDripos = function () {
		return $http.post('/admin/getconnecteddripos');
	}
	return userFactory;
});