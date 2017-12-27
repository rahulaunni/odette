angular.module('nurseController',['authServices','userServices','adminServices','nurseServices'])
.controller('nurseCntrl',function ($http,$route,$scope,$rootScope,$window,$location,$timeout,$mdDialog,$scope,Auth,Admin,Nurse) {
	var app = this;
	//to provide all stations to nurse user
	$scope.stations = [];
	$scope.nostation=false;
	Nurse.viewStation().then(function (data) {
		if(data.data.success){
			$scope.stations=data.data.stations;

		}
		else{
			$scope.nostation=true;

		}
	});

	//user select a station and in service call a setstation route 
	this.selectStation = function (selectstationData) {
		console.log(this.selectstationData);
		Nurse.setStation(this.selectstationData).then(function (data) {
			if(data.data.success){
				app.selected=true;
				$location.path('/');
			}
			else{
				$location.path('/selectstation')
			}
		});

	};

	//redirect user if no station selected
	Auth.getUser().then(function (data) {
		if(!data.data.station){
			$location.path('/selectstation')
		}

	});	

})
.controller('managePatientCntrl',function ($http,$route,$scope,$rootScope,$window,$location,$timeout,$mdDialog,$scope,Auth,Admin,Nurse) {
	var app = this;
	$scope.beds = [];
	$scope.nobed=false;
	//function called on page load gives all the stations associated with the user to frontend
	Nurse.viewBed().then(function (data) {
		if(data.data.success){
			$scope.beds=data.data.beds;

		}
		else{
			$scope.nobed=true;

		}
	});
	$scope.doctors = [];
	$scope.nodoctor=false;
	//function called on page load gives all the stations associated with the user to frontend
	Nurse.viewDoctor().then(function (data) {
		if(data.data.success){
			$scope.doctors=data.data.doctors;

		}
		else{
			$scope.nodoctor=true;

		}
	});

	app.loader = false;
	app.successMsg = false;
	app.errorMsg = false;
	app.editloader = false;
	app.editsuccessMsg = false;
	app.editerrorMsg = false;
	this.addPatient = function (patientData) {
		Nurse.addPatient(this.patientData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$window.location.reload('/nurse/managepatients');
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});

	};

	app.showOnAddMedication = false;
	this.showAddMedication = function (patientData) {
		Nurse.addPatient(this.patientData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				app.showOnAddMedication = true;
				$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});
		
	};
});
