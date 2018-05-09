angular.module('suServices',[])
.factory('Su',function ($http) {
	suFactory={};
	suFactory.viewSynapse = function () {
		return $http.get('/getsynapsedetails');
	} 

	return suFactory;

});