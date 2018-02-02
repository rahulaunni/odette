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
	adminFactory.addIvset = function (ivsetData) {
		return $http.post('/api/admin/addivset',ivsetData);
	}    
	adminFactory.viewIvset = function (ivsetData) {
		return $http.post('/api/admin/viewivset',ivsetData);
	} 
	adminFactory.deleteIvset = function (ivset) {
		return $http.post('/api/admin/deleteivset',ivset);
	}
	adminFactory.editIvset = function (editivset) {
		return $http.put('/api/admin/editivset',editivset);
	}
	adminFactory.addDripo = function (dripoData) {
		return $http.post('/api/admin/adddripo',dripoData);
	}
	adminFactory.viewDripo = function (dripoData) {
		return $http.post('/api/admin/viewdripo',dripoData);
	}
	adminFactory.deleteDripo = function (dripo) {
		return $http.post('/api/admin/deletedripo',dripo);
	}
	adminFactory.editDripo = function (editdripo) {
		return $http.put('/api/admin/editdripo',editdripo);
	}
	adminFactory.getDetails = function () {
		return $http.post('/api/admin/getdetails');
	} 
	adminFactory.checkUpdate = function () {
		return $http.post('/admin/update');
	}   
	adminFactory.getConnectedDripo = function () {
		return $http.post('/api/admin/getconnecteddriponames');
	}    
	return adminFactory;
});