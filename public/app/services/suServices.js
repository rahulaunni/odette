angular.module('suServices',[])
.factory('Su',function ($http) {
	suFactory={};
	suFactory.viewSynapse = function () {
		return $http.get('/getsynapsedetails');
	} 
	suFactory.getHostname = function () {
		return $http.get('/api/su/hostname');
	} 
	return suFactory;

});