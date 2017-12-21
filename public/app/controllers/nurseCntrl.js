angular.module('nurseController',['userServices','adminServices','nurseServices'])
.controller('nurseCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin,Nurse) {
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
		Nurse.setStation(this.selectstationData).then(function (data) {
			if(data.data.success){
				app.selected=true;
				$location.path('/');
			}
		});

	};
	

});
