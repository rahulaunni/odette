angular.module('nurseServices',['authServices'])
.factory('Nurse',function ($http,AuthToken) {
	nurseFactory={};

	nurseFactory.viewStation = function () {
		return $http.get('/api/nurse/viewstation');
	}
	nurseFactory.setStation = function (selectstationData) {
		//updating token with selected station
		return $http.post('/api/nurse/setstation',selectstationData).then(function (data) {
		AuthToken.setToken(data.data.token);
		return data;
	});
	}  
	nurseFactory.viewBed = function () {
		return $http.get('/api/nurse/viewbed');
	}
	nurseFactory.viewDoctor = function () {
		return $http.get('/api/nurse/viewdoctor');
	}
	nurseFactory.addPatient = function (patientData) {
		return $http.post('/api/nurse/patient',patientData);
	}
	nurseFactory.addMedication = function (choices) {
		return $http.post('/api/nurse/medication',choices);
	}
	nurseFactory.viewPatient = function () {
		return $http.get('/api/nurse/patient');
	}
	nurseFactory.dischargePatient = function (patient) {
		return $http.put('/api/nurse/dischargepatient',patient);
	}
	nurseFactory.editPatient = function (editpatient) {
		return $http.put('/api/nurse/patient',editpatient);
	}
	nurseFactory.readdPatient = function (editpatient) {
		return $http.put('/api/nurse/readdpatient',editpatient);
	}
	nurseFactory.editMedication = function (editpatient) {
		return $http.get('/api/nurse/medication',{params:{bedid:editpatient._bed}});
	}
	nurseFactory.editMedicationSave = function (editpatient) {
		return $http.put('/api/nurse/medication',editpatient);
	}
	nurseFactory.deleteMedication = function (patientid) {
		return $http.post('/api/nurse/deletemedication',patientid);
	}
	nurseFactory.showPatientDetails = function (patient) {
		return $http.get('/api/nurse/patientdetails',{params:{patientid:patient._id}});
	}

	return nurseFactory;
});