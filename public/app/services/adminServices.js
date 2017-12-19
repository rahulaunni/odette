angular.module('adminServices',[])
.factory('Admin',function ($http) {
	adminFactory={};
	adminFactory.addStation = function (stationData) {
		return $http.post('/api/admin/addstation',stationData);
	}
	adminFactory.viewStation = function (stationData) {
		return $http.post('/api/admin/viewstation',stationData);
	}
	adminFactory.deleteStation = function (station) {
		return $http.post('/api/admin/deletestation',station);
	}
	adminFactory.editStation = function (editstation) {
		return $http.put('/api/admin/editstation',editstation);
	}
	adminFactory.addBed = function (bedData) {
		return $http.post('/api/admin/addbed',bedData);
	}
	adminFactory.viewBed = function (bedData) {
		return $http.post('/api/admin/viewbed',bedData);
	} 
	adminFactory.deleteBed = function (bed) {
		return $http.post('/api/admin/deletebed',bed);
	}  
	adminFactory.editBed = function (editbed) {
		return $http.put('/api/admin/editbed',editbed);
	}     
	
	return adminFactory;
});