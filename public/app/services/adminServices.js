angular.module('adminServices',[])
.factory('Admin',function ($http) {
	adminFactory={};
	//to add station calling api post
	adminFactory.addStation = function (stationData) {
		return $http.post('/api/admin/station',stationData);
	}
	//to view all the station
	adminFactory.viewStation = function (stationData) {
		return $http.get('/api/admin/station',stationData);
	}
	//to delete a station
	adminFactory.deleteStation = function (station) {
		return $http.delete('/api/admin/station',{params: {stationid: station._id}});
	}
	adminFactory.editStation = function (editstation) {
		return $http.put('/api/admin/station',editstation);
	}
	adminFactory.addBed = function (bedData) {
		return $http.post('/api/admin/bed',bedData);
	}
	adminFactory.viewBed = function (bedData) {
		return $http.get('/api/admin/bed',bedData);
	} 
	adminFactory.deleteBed = function (bed) {
		return $http.delete('/api/admin/bed',{params:{bedid:bed._id}});
	}  
	adminFactory.editBed = function (editbed) {
		return $http.put('/api/admin/bed',editbed);
	} 
	adminFactory.addIvset = function (ivsetData) {
		return $http.post('/api/admin/ivset',ivsetData);
	}    
	adminFactory.viewIvset = function (ivsetData) {
		return $http.get('/api/admin/ivset',ivsetData);
	} 
	adminFactory.deleteIvset = function (ivset) {
		return $http.delete('/api/admin/ivset',{params:{ivsetid:ivset._id}});
	}
	adminFactory.editIvset = function (editivset) {
		return $http.put('/api/admin/ivset',editivset);
	}
	adminFactory.addDripo = function (dripoData) {
		return $http.post('/api/admin/dripo',dripoData);
	}
	adminFactory.viewDripo = function (dripoData) {
		return $http.get('/api/admin/dripo',dripoData);
	}
	adminFactory.deleteDripo = function (dripo) {
		return $http.delete('/api/admin/dripo',{params:{dripoid:dripo._id}});
	}
	adminFactory.editDripo = function (editdripo) {
		return $http.put('/api/admin/dripo',editdripo);
	}
	adminFactory.getDetails = function () {
		return $http.get('/api/admin/getdetails');
	} 
	adminFactory.checkUpdate = function () {
		return $http.post('/admin/update');
	}   
	adminFactory.getConnectedDripo = function () {
		return $http.get('/api/admin/getconnecteddriponames');
	}    
	return adminFactory;
});