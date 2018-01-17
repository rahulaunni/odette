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
		Nurse.setStation(this.selectstationData).then(function (data) {
			if(data.data.success){
				app.selected=true;
				$location.url('/');
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
	$scope.nopatient = false;
	//function to pass patient details to frontend
	Nurse.viewPatient().then(function (data) {
		if(data.data.success){
			app.patient=data.data.patient;
			$scope.patients=data.data.patients;
			for(var key in $scope.patients){
				if(!$scope.patients[key]._medication.length){
					$scope.patients[key].add=true;
				}
				else{
					$scope.patients[key].add=false;
				}
			}
		}
		else{
			$scope.nopatient = true;
		}
	});

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
	app.patient = false;
	app.showOnAddMedication = false;
	this.showAddMedication = function (patientData) {
		Nurse.addPatient(this.patientData).then(function (data) {
			if(data.data.success){
				app.patient=data.data.patient;
				app.bed = data.data.bed;
				$scope.choices.patientid=data.data.patient._id;
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



	//function to get time details
	  $scope.variables=[];
	  this.getTime = function (choice, ambutton, index,i) {
	  			$scope.variables[i][index] = !$scope.variables[i][index];//to toggle button action
	           if(!$scope.variables[i][index]){//checking whether button is sctive
	           	choice.time.push(ambutton);//save that time
	           }
	           else{
	           	var index = choice.time.indexOf(ambutton);//if button pressed again delete the time
	           	choice.time.splice(index, 1);
	            }
	       };
	$scope.variabless=[];
	this.getTimePM = function (choice, pmbutton, index,i) {
	         $scope.variabless[i][index] = !$scope.variabless[i][index];
	         if(!$scope.variabless[i][index]){
	         	choice.time.push(pmbutton);
	             //save the value to an array;
	         }
	         else{
	         	var index = choice.time.indexOf(pmbutton);
	         	choice.time.splice(index, 1);
	          }
	     };

	//function and variable to add more medicines

	$scope.ambuttons = [0,1,2,3,4,5,6,7,8,9,10,11];
	$scope.pmbuttons = [12,13,14,15,16,17,18,19,20,21,22,23];
	$scope.buttons = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	$scope.choices = [{id: 'choice1',time:[]}];	 
	$scope.addNewChoice = function() {
	   var newItemNo = $scope.choices.length+1;
	   $scope.choices.push({'id':'choice'+newItemNo,'time':[]});
	};
	   
	$scope.removeChoice = function() {
	   var lastItem = $scope.choices.length-1;
	   $scope.choices.splice(lastItem);
	};
	app.medloader = false;
	this.addMedication = function (patientId,bedId) {
		for(var key in $scope.choices){
			$scope.choices[key].patientid = patientId;
			$scope.choices[key].bedid = bedId;
		}
		Nurse.addMedication($scope.choices).then(function (data) {
			if(data.data.success){
				app.medloader = true;
				$timeout(function () {
					app.medloader = false;
					app.loader = false;
					$window.location.reload('/nurse/managepatients');
				},3000);
			}
			else{
				app.medloader = false;

			}
		});


	};

	//show edit medication
	app.showOnEditMedication = false;
	app.patientid = false;
	this.showEditMedication = function (editpatient) {
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.showOnEditMedication = true;
		Nurse.editMedication(this.editpatient).then(function(data) {
			app.patientid=data.data.medication[0].patientid;
			app.bedid=data.data.medication[0].bedid;
			$scope.selected=[];
			for (i=0;i<20;i++) {
			 $scope.selected[i]=new Array();
			 for (j=0;j<24;j++) {
			  $scope.selected[i][j] = false ;
			 }
			}
			$scope.editchoices = data.data.medication;
			for(var key in $scope.editchoices){
				var newItemNo = key;
				$scope.editchoices[key].id=newItemNo;
				for(var key2 in $scope.editchoices[key].time){
					$scope.selected[key][$scope.editchoices[key].time[key2]]= true;
				}
			}
		});
	};

	this.editgetTime = function (editchoice, button, index,i) {
				$scope.selected[i][index] = !$scope.selected[i][index];//to toggle button action
				if($scope.selected[i][index]){
					editchoice.time.push(button);
				    //save the value to an array;
				}
				else{
					var index = editchoice.time.indexOf(button);
					editchoice.time.splice(index, 1);
					// var index = choice.time.indexOf(pmbutton);
					// choice.time.splice(index, 1);
				 }
	     };

	$scope.editremoveChoice = function(index) {
	   $scope.editchoices.splice(index,1);  //removing the object
	   for(var key in $scope.editchoices){   //shift the id for 1st to 0th and so on
	   	var newItemNo = key;
	   	$scope.editchoices[key].id=newItemNo;
	   }
	};

	$scope.editaddNewChoice = function() {
	   var newItemNo = $scope.editchoices.length;
	   if(newItemNo == 0){
	   	for (i=0;i<20;i++) {
	   	 for (j=0;j<24;j++) {
	   	  $scope.selected[i][j] = false ;
	   	 }
	   	}
	   }
	   $scope.editchoices.push({'id':newItemNo,patientid:app.patientid,bedid:app.bedid,medicineid:'new',time:[],timeid:[]});
	};
	//form submission after edit medication
	app.editmedloader = false;
	this.editMedication = function () {
		if($scope.editchoices.length > 0){
			Nurse.editMedicationSave($scope.editchoices).then(function(data) {
				if(data.data.success){
					app.editmedloader = true;
					$timeout(function () {
						app.medloader = false;
						app.loader = false;
						$window.location.reload('/nurse/managepatients');
					},3000);

				}
				else{
					app.editmedloader = false;

				}
			});
		}
		//if user delete all medicine call deletemedicine route
		else{
			$scope.patid={patientid:app.patientid};
			Nurse.deleteMedication($scope.patid).then(function(data) {
				if(data.data.success){
					app.editmedloader = true;
					$timeout(function () {
						app.medloader = false;
						app.loader = false;
						$window.location.reload('/nurse/managepatients');
					},3000);

				}
				else{
					app.editmedloader = false;

				}
			});

		}
		
	};





	this.showfromlistAddMedication = function (patient) {
		app.patient = patient;
		app.bed = {_id:patient._bed};
		app.showOnAddMedication = true;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab

	}
	app.showOnEditPatient = false;
	//function to provide edit patient tab and hide add patient
	this.showEditPatient = function (patient) {
		app.oldbed = patient.bedname;
		app.showOnEditPatient = true;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.editpatient = patient;
	};
	app.editpatloader = false;
	//form submission after edit
	this.editPatient = function (editpatient) {
		this.editpatient.oldbed = app.oldbed;
		Nurse.editPatient(this.editpatient).then(function(data) {
			if(data.data.success){
				app.editpatloader = true;
				app.editsuccessMsg = data.data.message;
				$timeout(function () {
					app.editpatloader = false;
					$window.location.reload('/admin/managedripos');
				},3000);
			}
			else{
				app.editerrorMsg=data.data.message;
				app.editloader = false;
			}
		});
		
	};
	


		//function for dischargin a patient by nurse show a dialog box and delte on confirm
		this.showConfirmdischargePatient = function(ev,patient) {
		  // Appending dialog to document.body to cover sidenav in docs app
		  var confirm = $mdDialog.confirm({
		  	onComplete: function afterShowAnimation() {
		  		var $dialog = angular.element(document.querySelector('md-dialog'));
		  		var $actionsSection = $dialog.find('md-dialog-actions');
		  		var $cancelButton = $actionsSection.children()[0];
		  		var $confirmButton = $actionsSection.children()[1];
		  		angular.element($confirmButton).addClass('md-raised md-warn');
		  		angular.element($cancelButton).addClass('md-raised');
		  	}
		  })
		  .title('Would you like to discharge '+patient.patientname)
		  .textContent('This will remove '+patient.patientname+' permanantly from database')
		  .ariaLabel('Lucky day')
		  .targetEvent(ev)
		  .ok('Yes, Discharge!')
		  .cancel('No, Keep Patient');

		  $mdDialog.show(confirm).then(function() {
		  	Nurse.dischargePatient(patient).then(function (data) {
		  		if(data.data.success){
		  			$window.location.reload('/nurse/managepatients');
		  		}
		  	});

		  }, function() {

		  });
		};



});
