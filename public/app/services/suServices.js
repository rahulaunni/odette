angular.module('suServices',[])
.factory('Su',function ($http) {
	suFactory={};
	suFactory.viewSynapse = function () {
		return $http.get('/getsynapsedetails');
	} 
	suFactory.getHostname = function () {
		return $http.get('/api/su/hostname');
	} 
	suFactory.getInfdetails = function (data) {
		console.log(data);
		return $http.get('/api/su/getinfdetails',{params: {hostname: data.synapse,date:data.date,day:data.day}});
	} 
	return suFactory;

});