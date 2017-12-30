angular.module('nurseServices',['authServices'])
.factory('Nurse',function ($http,AuthToken) {
	nurseFactory={};

	nurseFactory.viewStation = function () {
		return $http.post('/api/nurse/viewstation');
	}
	nurseFactory.setStation = function (selectstationData) {
		//updating token with selected station
		return $http.post('/api/nurse/setstation',selectstationData).then(function (data) {
		AuthToken.setToken(data.data.token);
		return data;
	});
	}  
	nurseFactory.viewBed = function () {
		return $http.post('/api/nurse/viewbed');
	}
	nurseFactory.viewDoctor = function () {
		return $http.post('/api/nurse/viewdoctor');
	}
	nurseFactory.addPatient = function (patientData) {
		return $http.post('/api/nurse/addpatient',patientData);
	}
	nurseFactory.addMedication = function (choices) {
		return $http.post('/api/nurse/addmedication',choices);
	}
	return nurseFactory;
});