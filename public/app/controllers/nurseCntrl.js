angular.module('nurseController',['authServices','userServices','adminServices','nurseServices'])
.controller('nurseCntrl',function ($http,$route,$routeParams,$scope,$rootScope,$window,$location,$timeout,$mdDialog,$scope,Auth,Admin,Nurse) {
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
	$scope.patientstatus = 'active';
	$scope.myTabIndex = 0;
	app.patientData ={admittedon:''}
	app.patientData.admittedon = new Date();
	$scope.pageloaded=false;
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
			$scope.pageloaded=true;
		}
		else{
			$scope.nopatient = true;
			$scope.pageloaded=true;


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




		//function for dischargin a patient by nurse show a dialog box and delte on confirm
		this.showConfirmdischargePatient = function(ev,patient) {
		  // Appending dialog to document.body to cover sidenav in docs app
		  var confirm = $mdDialog.confirm({
		  	onComplete: function afterShowAnimation() {
		  		var $dialog = angular.element(document.querySelectorAll('[aria-label="disch"]'));
		  		var $actionsSection = $dialog.find('md-dialog-actions');
		  		var $cancelButton = $actionsSection.children()[0];
		  		var $confirmButton = $actionsSection.children()[1];
		  		angular.element($confirmButton).addClass('md-raised md-warn');
		  		angular.element($cancelButton).addClass('md-raised');
		  	}
		  })
		  .title('Would you like to discharge '+patient.patientname)
		  .textContent('This will remove '+patient.patientname+' permanantly from database')
		  .ariaLabel('disch')
		  .targetEvent(ev)
		  .ok('Yes, Discharge!')
		  .cancel('No, Keep Patient');

		  $mdDialog.show(confirm).then(function() {
		  	Nurse.dischargePatient(patient).then(function (data) {
		  		if(data.data.success){
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
		  			$location.path('/managepatients');
		  		}
		  	});

		  }, function() {

		  });
		};
		$scope.reload = function () {
			app.showOnEditMedication = false;
			app.showOnAddMedication = false;
			app.showOnEditPatient = false;
		}
		
		app.showOnPatientDetails = false;
		$scope.showPatientDetails = function (patient) {
			Nurse.showPatientDetails(patient).then(function (data) {
				if(data.data.success){
					$scope.patientdetails = data.data.patientdetails;
					app.showOnPatientDetails = true;
				}
				else{
					$scope.patientdetails = false;
					app.showOnPatientDetails = false;

				}
			});
			
		}
		$scope.toggleView = false;
		$scope.showInfusionDetails = function (id,tv) {
			if(tv == false){
				$scope.toggleView = true;
				var target = angular.element('#'+id);
				target.css('display','block');
			}
			else{
				$scope.toggleView = false;
				var target = angular.element('#'+id);
				target.css('display','none');
			}


		}
		$scope.backToView = function () {
			app.showOnPatientDetails = false;
			$route.reload('/managepatients');
			app.showOnEditMedication = false;
			app.showOnAddMedication = false;
			app.showOnEditPatient = false;
		}


//add patient functions
$scope.showAddPatient = function(ev) {
  $mdDialog.show({
    contentElement: '#addPatient',
    clickOutsideToClose: false,
    parent: angular.element(document.body),
    targetEvent: ev,
  });
};
$scope.cancelAddPatient=function () {
  $route.reload('/managepatients');
}
$scope.genders=['male','female'];
$scope.addPatient = function (ipdata) {
	Nurse.addPatient(ipdata).then(function (data) {
		if(data.data.success){
			$route.reload('/managepatients');
		}
	})
}

//edit patient functions

$scope.editPatient = function (editpatData) {
	Nurse.editPatient(editpatData).then(function(data) {
		if(data.data.success){
			$route.reload('/managepatients');
		}
	})
}



$scope.showEditPatient= function(ev,patDet) {
              $mdDialog.show ({
              	locals: { editpatData: patDet,oldbed:patDet.bedname,olddoc:patDet.doctorname},
              	targetEvent: ev,
                 clickOutsideToClose: false,
                 scope: $scope,        
                 preserveScope: true,           
                 template: '<md-dialog layout-padding>'+
        					'<md-content layout-padding="">'+  
     '        <form name="patientForm" ng-submit="editPatient(editpatData)";'+
 '                <md-subheader class="md-no-sticky">Edit Patient</md-subheader>'+
 '                  <div layout-padding>'+
 '                  <div layout="column" layout-fill layout-xs="column">'+
 '                    <div layout="row" layout-fill layout-xs="column">'+
 '                        <md-input-container class="md-icon-float md-block" flex>'+
 '                            <label>Patient Name</label>'+
 '                            <md-icon class="md-default-theme" class="material-icons">&#xE87C;</md-icon>'+
 '                            <input ng-model="editpatData.patientname" type="text" name="patientname" required>'+
 '                            <div ng-messages="patientForm.patientname.$error" role="alert" multiple>'+
 '                                <div ng-message="required" class="my-message">This field is required</div>'+
 '                            </div>'+
 '                        </md-input-container>'+
'                        <md-input-container class="md-icon-float md-block" flex>'+
'                            <label>Bed</label>'+
'                            <md-icon class="md-default-theme" class="material-icons">hotel</md-icon>'+
'                            <md-select type="text" aria-label="filter" ng-model="editpatData.bedname" name="bed" required>'+
'                                <md-optgroup label="bed">'+
'                                    <md-option ng-value="oldbed"  ng-selected="true"> {{oldbed}}</md-option>'+
'                                    <md-option ng-value="bed.bedname"  ng-repeat="bed in beds"> {{bed.bedname}}</md-option>'+
'                                </md-optgroup>'+
'                            </md-select>'+
'                        </md-input-container>'+
'                    </div>'+
'                      <div layout="row" layout-fill layout-xs="column">'+
'                        <md-input-container class="md-icon-float md-block" flex>'+
'                            <label>Age</label>'+
'                            <md-icon class="md-default-theme" class="material-icons">child_care</md-icon>'+
'                            <input ng-model="editpatData.patientage" type="number" name="patientage" required ng-min="10" min="0">'+
'                            <div ng-messages="patientForm.patientage.$error" role="alert" multiple>'+
'                                <div ng-message="required" class="my-message">This field is required</div>'+
'                                <div ng-message="min" class="my-message">Age cant be negative</div>'+
'                            </div>'+
'                        </md-input-container>'+
'                        <md-input-container class="md-icon-float md-block" flex>'+
'                            <label>Weight</label>'+
'                            <md-icon class="md-default-theme" class="material-icons">person_pin_circle</md-icon>'+
'                            <input ng-model="editpatData.patientweight" type="number" name="patientweight" required ng-min="0" min="0" ng-value="0">'+
'                            <div ng-messages="patientForm.patientweight.$error" role="alert" multiple>'+
'                                <div ng-message="required" class="my-message">This field is required</div>'+
'                                <div ng-message="min" class="my-message">Weight cant be negative</div>'+
'                            </div>'+
'                        </md-input-container>'+
'                        <md-input-container class="md-icon-float md-block" flex>'+
'                            <label>Gender</label>'+
'                            <md-icon class="md-default-theme" class="material-icons">perm_identity</md-icon>'+
'                            <md-select type="text" aria-label="gender" ng-model="editpatData.gender" name="gender" required>'+
'                                <md-optgroup label="gender">'+
'                                    <md-option ng-value="gender"  ng-repeat="gender in genders"> {{gender}}</md-option>'+
'                                </md-optgroup>'+
'                            </md-select>'+
'                        </md-input-container>'+
'                        </div>'+
'                        <md-input-container class="md-icon-float md-block" flex>'+
'                            <label>Select Doctor</label>'+
'                            <md-icon class="md-default-theme" class="material-icons">person</md-icon>'+
'                            <md-select type="text" aria-label="filter" ng-model="editpatData.doctorname" name="doctor" required>'+
'                                <md-optgroup label="doctor">'+
'                                    <md-option ng-value="doctor.userName"  ng-repeat="doctor in doctors"> {{doctor.userName}}</md-option>'+
'                                	 <md-option ng-value="null">Dont assign doctor</md-option>'+
'                                </md-optgroup>'+
'                            </md-select>'+
'                            <div ng-messages="patientForm.doctor.$error" role="alert" multiple>'+
'                                <div ng-message="required" class="my-message">This field is required</div>'+
'                            </div>'+
'                        </md-input-container>'+
'                  </div>'+
'                </div>'+
'                <div layout="row" layout-fill layout-xs="column">'+
'                    <md-button  ng-click="cancelAddPatient();"  class="md-raised md-warn">cancel</md-button>'+
'                    <md-button type="submit" ng-disabled="taskForm.$invalid" class="md-raised md-accent">Submit</md-button>'+
'                </div>'+
'            </form>'+
'        </md-content>'+
'    </md-dialog>',
                 controller: function DialogController($scope, $mdDialog,editpatData,oldbed,olddoc) {
                 	$scope.editpatData = editpatData;
                 	$scope.oldbed = oldbed;
                 	$scope.olddoc = olddoc;
                    $scope.closeDialog = function() {
                       $mdDialog.hide();
                    }
                 }
             })

           };



  //function for re-admitting patient
  $scope.showreadmittPatient = function(ev,patient) {
    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm({
    	onComplete: function afterShowAnimation() {
    		var $dialog = angular.element(document.querySelectorAll('[aria-label="star"]'));
    		var $actionsSection = $dialog.find('md-dialog-actions');
    		var $cancelButton = $actionsSection.children()[0];
    		var $confirmButton = $actionsSection.children()[1];
    		angular.element($confirmButton).addClass('md-raised md-warn');
    		angular.element($cancelButton).addClass('md-raised');
    	}
    })
    .title('Would you like to Re-admit '+patient.patientname)
    .textContent('This will add '+patient.patientname)
    .ariaLabel('star')
    .targetEvent(ev)
    .ok('Yes, Add!')
    .cancel('No, Cancel');

    $mdDialog.show(confirm).then(function() {
 		              $mdDialog.show ({
 		              	locals: { editpatData: patient,olddoc:patient.doctorname},
 		              	targetEvent: ev,
 		                 clickOutsideToClose: false,
 		                 scope: $scope,        
 		                 preserveScope: true,           
 		                 template: '<md-dialog layout-padding>'+
 		        					'<md-content layout-padding="">'+  
 		     '        <form name="patientForm" ng-submit="readdPatient(editpatData)";'+
 		 '                <md-subheader class="md-no-sticky">Edit Patient</md-subheader>'+
 		 '                  <div layout-padding>'+
 		 '                  <div layout="column" layout-fill layout-xs="column">'+
 		 '                    <div layout="row" layout-fill layout-xs="column">'+
 		 '                        <md-input-container class="md-icon-float md-block" flex>'+
 		 '                            <label>Patient Name</label>'+
 		 '                            <md-icon class="md-default-theme" class="material-icons">&#xE87C;</md-icon>'+
 		 '                            <input ng-model="editpatData.patientname" type="text" name="patientname" required>'+
 		 '                            <div ng-messages="patientForm.patientname.$error" role="alert" multiple>'+
 		 '                                <div ng-message="required" class="my-message">This field is required</div>'+
 		 '                            </div>'+
 		 '                        </md-input-container>'+
 		'                        <md-input-container class="md-icon-float md-block" flex>'+
 		'                            <label>Bed</label>'+
 		'                            <md-icon class="md-default-theme" class="material-icons">hotel</md-icon>'+
 		'                            <md-select type="text" aria-label="filter" ng-model="editpatData.bedname" name="bed" required>'+
 		'                                <md-optgroup label="bed">'+
 		'                                    <md-option ng-value="bed.bedname"  ng-repeat="bed in beds"> {{bed.bedname}}</md-option>'+
 		'                                </md-optgroup>'+
 		'                            </md-select>'+
 		'                        </md-input-container>'+
 		'                    </div>'+
 		'                      <div layout="row" layout-fill layout-xs="column">'+
 		'                        <md-input-container class="md-icon-float md-block" flex>'+
 		'                            <label>Age</label>'+
 		'                            <md-icon class="md-default-theme" class="material-icons">child_care</md-icon>'+
 		'                            <input ng-model="editpatData.patientage" type="number" name="patientage" required ng-min="10" min="0">'+
 		'                            <div ng-messages="patientForm.patientage.$error" role="alert" multiple>'+
 		'                                <div ng-message="required" class="my-message">This field is required</div>'+
 		'                                <div ng-message="min" class="my-message">Age cant be negative</div>'+
 		'                            </div>'+
 		'                        </md-input-container>'+
 		'                        <md-input-container class="md-icon-float md-block" flex>'+
 		'                            <label>Weight</label>'+
 		'                            <md-icon class="md-default-theme" class="material-icons">person_pin_circle</md-icon>'+
 		'                            <input ng-model="editpatData.patientweight" type="number" name="patientweight" required ng-min="0" min="0" ng-value="0">'+
 		'                            <div ng-messages="patientForm.patientweight.$error" role="alert" multiple>'+
 		'                                <div ng-message="required" class="my-message">This field is required</div>'+
 		'                                <div ng-message="min" class="my-message">Weight cant be negative</div>'+
 		'                            </div>'+
 		'                        </md-input-container>'+
 		'                        </div>'+
 		'                        <md-input-container class="md-icon-float md-block" flex>'+
 		'                            <label>Select Doctor</label>'+
 		'                            <md-icon class="md-default-theme" class="material-icons">person</md-icon>'+
 		'                            <md-select type="text" aria-label="filter" ng-model="editpatData.doctorname" name="doctor" required>'+
 		'                                <md-optgroup label="doctor">'+
 		'                                    <md-option ng-value="doctor.userName"  ng-repeat="doctor in doctors"> {{doctor.userName}}</md-option>'+
 		'                                	 <md-option ng-value="null">Dont assign doctor</md-option>'+
 		'                                </md-optgroup>'+
 		'                            </md-select>'+
 		'                            <div ng-messages="patientForm.doctor.$error" role="alert" multiple>'+
 		'                                <div ng-message="required" class="my-message">This field is required</div>'+
 		'                            </div>'+
 		'                        </md-input-container>'+
 		'                  </div>'+
 		'                </div>'+
 		'                <div layout="row" layout-fill layout-xs="column">'+
 		'                    <md-button  ng-click="cancelAddPatient();"  class="md-raised md-warn">cancel</md-button>'+
 		'                    <md-button type="submit" ng-disabled="taskForm.$invalid" class="md-raised md-accent">Submit</md-button>'+
 		'                </div>'+
 		'            </form>'+
 		'        </md-content>'+
 		'    </md-dialog>',
 		                 controller: function DialogController($scope, $mdDialog,editpatData,olddoc) {
 		                 	$scope.editpatData = editpatData;
 		                 	$scope.olddoc = olddoc;
 		                    $scope.closeDialog = function() {
 		                       $mdDialog.hide();
 		                    }
 		                 }
 		             })


    }, function() {

    });
  };

  $scope.readdPatient = function (editpatData) {
  	Nurse.readdPatient(editpatData).then(function(data) {
  		if(data.data.success){
  			$route.reload('/managepatients');
  		}
  	})
  }


});
