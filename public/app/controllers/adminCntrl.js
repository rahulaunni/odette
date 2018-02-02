angular.module('adminController',['userServices','adminServices'])
.controller('manageStationCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin) {
	var app = this;
	$scope.stations = [];
	$scope.nostation=false;
	Admin.viewStation().then(function (data) {
		if(data.data.success){
			$scope.stations=data.data.stations;

		}
		else{
			$scope.nostation=true;

		}
	});
	app.loader = false;
	app.successMsg = false;
	app.errorMsg = false;
	app.showOnEditStation = false;
	app.editloader = false;
	app.editsuccessMsg = false;
	app.editerrorMsg = false;
	app.editstation = {};
	//function for add user form submission
	this.addStation = function (stationData) {
		Admin.addStation(this.stationData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					Admin.viewStation().then(function (data) {
						if(data.data.success){
							$scope.stations=data.data.stations;

						}
						else{
							$scope.nostation=true;

						}
					});
					$window.location('/admin/managestations');
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});
	};

	//function to provide edit station tab and hide add station tab
	this.showEditStation = function (station) {
		app.showOnEditStation = true;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.editstation = station;
	};
	//form submission after edit
	this.editStation = function (editstation) {
		Admin.editStation(this.editstation).then(function(data) {
			if(data.data.success){
				app.editloader = true;
				app.editsuccessMsg = data.data.message;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					Admin.viewStation().then(function (data) {
						if(data.data.success){
							$scope.stations=data.data.stations;

						}
						else{
							$scope.nostation=true;

						}
					});
					app.showOnEditStation = false;
					$window.location('/admin/managestations');
				},3000);
			}
			else{
				app.editerrorMsg=data.data.message;
				app.editloader = false;
			}
		});
		
	};



	//when cancel the edit tab
	this.cancel=function () {
		app.showOnEditStation = false;
		$location.path('/admin/managestations');
	};


		//function for deleteting an user by admin show a dialog box and delte on confirm
		this.showConfirmdeleteStation = function(ev,station) {
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
		        .title('Would you like to delete '+station.stationname)
		        .textContent('This will remove '+station.stationname+' permanantly from database')
		        .ariaLabel('Lucky day')
		        .targetEvent(ev)
		        .ok('Yes, Delete!')
		        .cancel('No, Keep Station');

		  $mdDialog.show(confirm).then(function() {
		  	Admin.deleteStation(station).then(function (data) {
		  		if(data.data.success){
		  			$scope.myTabIndex =0;
		  			Admin.viewStation().then(function (data) {
		  				if(data.data.success){
		  					$scope.stations=data.data.stations;

		  				}
		  				else{
		  					$scope.nostation=true;

		  				}
		  			});
		  			$window.location('/admin/managestations');
		  		}
		  	});

		  }, function() {

		  });
		};
		$scope.reload =  function () {
			app.showOnEditStation = false;
		}


})
.controller('manageBedCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin) {
	var app = this;
	$scope.stations = [];
	$scope.nostation=false;
	//function called on page load gives all the stations associated with the user to frontend
	Admin.viewStation().then(function (data) {
		if(data.data.success){
			$scope.stations=data.data.stations;

		}
		else{
			$scope.nostation=true;

		}
	});
	$scope.beds = [];
	$scope.nobed=false;
	//function called on page load gives all the stations associated with the user to frontend
	Admin.viewBed().then(function (data) {
		if(data.data.success){
			$scope.beds=data.data.beds;

		}
		else{
			$scope.nobed=true;

		}
	});
	
	app.loader = false;
	app.successMsg = false;
	app.errorMsg = false;
	app.showOnEditStation = false;
	app.editloader = false;
	app.editsuccessMsg = false;
	app.editerrorMsg = false;
	app.showOnEditBed = false;
	//function to add bed while form submission
	this.addBed = function (bedData) {
		Admin.addBed(this.bedData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					Admin.viewBed().then(function (data) {
						if(data.data.success){
							$scope.beds=data.data.beds;

						}
						else{
							$scope.nobed=true;

						}
					});
					
					$window.location('/admin/managebeds');
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}

		});
		
	};
	//function to provide edit bed tab and hide add bed tab
	this.showEditBed = function (bed) {
		app.showOnEditBed = true;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.editbed = bed;
	};
	//form submission after edit
	this.editBed = function (editbed) {
		Admin.editBed(this.editbed).then(function(data) {
			if(data.data.success){
				app.editloader = true;
				app.editsuccessMsg = data.data.message;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					Admin.viewBed().then(function (data) {
						if(data.data.success){
							$scope.beds=data.data.beds;

						}
						else{
							$scope.nobed=true;

						}
					});
					app.showOnEditBed = false;
					$window.location('/admin/managebeds');
				},3000);
			}
			else{
				app.editerrorMsg=data.data.message;
				app.editloader = false;
			}
		});
		
	};
	//when cancel the edit tab
	this.cancel=function () {
		app.showOnEditBed = false;
		$location.path('/admin/managebeds');
	};


		//function for deleteting an user by admin show a dialog box and delte on confirm
		this.showConfirmdeleteBed = function(ev,bed) {
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
		        .title('Would you like to delete '+bed.bedname)
		        .textContent('This will remove '+bed.bedname+' permanantly from database')
		        .ariaLabel('Lucky day')
		        .targetEvent(ev)
		        .ok('Yes, Delete!')
		        .cancel('No, Keep Bed');

		  $mdDialog.show(confirm).then(function() {
		  	Admin.deleteBed(bed).then(function (data) {
		  		if(data.data.success){
		  			$scope.myTabIndex =0;
		  			Admin.viewBed().then(function (data) {
		  				if(data.data.success){
		  					$scope.beds=data.data.beds;

		  				}
		  				else{
		  					$scope.nobed=true;

		  				}
		  			});
		  			
		  			$window.location('/admin/managebeds');
		  		}
		  	});

		  }, function() {

		  });
		};
		$scope.reload =  function () {
			app.showOnEditBed = false;
		}

})

.controller('manageIvsetCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin) {
	var app = this;

	$scope.ivsets = [];
	$scope.noivset=false;
	//function called on page load gives all the stations associated with the user to frontend
	Admin.viewIvset().then(function (data) {
		if(data.data.success){
			$scope.ivsets=data.data.ivsets;

		}
		else{
			$scope.noivset=true;

		}
	});


	app.showOnEditIvset = false;
	app.loader = false;
	app.successMsg = false;
	app.errorMsg = false;
	app.editloader = false;
	app.editsuccessMsg = false;
	app.editerrorMsg = false;
	//function to add bed while form submission
	this.addIvset = function (ivsetData) {
		Admin.addIvset(this.ivsetData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					Admin.viewIvset().then(function (data) {
						if(data.data.success){
							$scope.ivsets=data.data.ivsets;

						}
						else{
							$scope.noivset=true;

						}
					});
					$window.location('/admin/manageivsets');
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
			
		});
		
	};

	//function to provide edit ivset tab and hide add ivset tab
	this.showEditIvset = function (ivset) {
		app.showOnEditIvset = true;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.editivset = ivset;
	};
	//form submission after edit
	this.editIvset = function (editivset) {
		Admin.editIvset(this.editivset).then(function(data) {
			if(data.data.success){
				app.editloader = true;
				app.editsuccessMsg = data.data.message;
				$timeout(function () {
					app.loader = false;
					app.showOnEditIvset = false;
					$scope.myTabIndex =0;
					Admin.viewIvset().then(function (data) {
						if(data.data.success){
							$scope.ivsets=data.data.ivsets;

						}
						else{
							$scope.noivset=true;

						}
					});
					$window.location('/admin/manageivsets');
				},3000);
			}
			else{
				app.editerrorMsg=data.data.message;
				app.editloader = false;
			}
		});
		
	};
	//when cancel the edit tab
	this.cancel=function () {
		app.showOnEditIvset = false;
		$location.path('/admin/manageivsets');
	};

		//function for deleteting an user by admin show a dialog box and delte on confirm
		this.showConfirmdeleteIvset = function(ev,ivset) {
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
		        .title('Would you like to delete '+ivset.ivsetname)
		        .textContent('This will remove '+ivset.ivsetname+' permanantly from database')
		        .ariaLabel('Lucky day')
		        .targetEvent(ev)
		        .ok('Yes, Delete!')
		        .cancel('No, Keep Ivset');

		  $mdDialog.show(confirm).then(function() {
		  	Admin.deleteIvset(ivset).then(function (data) {
		  		if(data.data.success){
		  			$scope.myTabIndex =0;
		  			Admin.viewIvset().then(function (data) {
		  				if(data.data.success){
		  					$scope.ivsets=data.data.ivsets;

		  				}
		  				else{
		  					$scope.noivset=true;

		  				}
		  			});
		  			$window.location('/admin/manageivsets');
		  		}
		  	});

		  }, function() {

		  });
		};
		$scope.reload =  function () {
			app.showOnEditIvset = false;
		}

})
.controller('manageDripoCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin) {
	var app = this;
	$scope.stations = [];
	$scope.nostation=false;
	//function called on page load gives all the stations associated with the user to frontend
	Admin.viewStation().then(function (data) {
		if(data.data.success){
			$scope.stations=data.data.stations;

		}
		else{
			$scope.nostation=true;

		}
	});
	$scope.dripos = [];
	$scope.nodripo=false;
	//function called on page load gives all the stations associated with the user to frontend
	Admin.viewDripo().then(function (data) {
		if(data.data.success){
			$scope.dripos=data.data.dripos;

		}
		else{
			$scope.nodripo=true;

		}
	});

	app.showOnEditDripo = false;
	app.loader = false;
	app.successMsg = false;
	app.errorMsg = false;
	app.editloader = false;
	app.editsuccessMsg = false;
	app.editerrorMsg = false;
	//function to add dripo while form submission
	this.addDripo = function (dripoData) {
		Admin.addDripo(this.dripoData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					Admin.viewDripo().then(function (data) {
						if(data.data.success){
							$scope.dripos=data.data.dripos;

						}
						else{
							$scope.nodripo=true;

						}
					});
					$window.location('/admin/managedripos');
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}

		});
	

		
	};

	//function to provide edit ivset tab and hide add ivset tab
	this.showEditDripo = function (dripo) {
		app.showOnEditDripo = true;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.editdripo = dripo;
	};
	//form submission after edit
	this.editDripo = function (editdripo) {
		Admin.editDripo(this.editdripo).then(function(data) {
			if(data.data.success){
				app.editloader = true;
				app.editsuccessMsg = data.data.message;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					app.showOnEditDripo = false;
					Admin.viewDripo().then(function (data) {
						if(data.data.success){
							$scope.dripos=data.data.dripos;

						}
						else{
							$scope.nodripo=true;

						}
					});
					$window.location('/admin/managedripos');
				},3000);
			}
			else{
				app.editerrorMsg=data.data.message;
				app.editloader = false;
			}
		});
		
	};
	//when cancel the edit tab
	this.cancel=function () {
		app.showOnEditDripo = false;
		$location.path('/admin/managedripos');
	};


		//function for deleteting an user by admin show a dialog box and delte on confirm
		this.showConfirmdeleteDripo = function(ev,dripo) {
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
		        .title('Would you like to delete '+dripo.dripoid)
		        .textContent('This will remove '+dripo.dripoid+' permanantly from database')
		        .ariaLabel('Lucky day')
		        .targetEvent(ev)
		        .ok('Yes, Delete!')
		        .cancel('No, Keep Dripo');

		  $mdDialog.show(confirm).then(function() {
		  	Admin.deleteDripo(dripo).then(function (data) {
		  		if(data.data.success){
		  			$scope.myTabIndex =0;
		  			Admin.viewDripo().then(function (data) {
		  				if(data.data.success){
		  					$scope.dripos=data.data.dripos;

		  				}
		  				else{
		  					$scope.nodripo=true;

		  				}
		  			});
		  			$window.location('/admin/managedripos');
		  		}
		  	});

		  }, function() {

		  });
		};
		$scope.reload =  function () {
			app.showOnEditDripo = false;
		}

})
.controller('updateCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin,User) {
	$scope.updated = false;
	$scope.nochange = false;
	$scope.reply =false;
	$scope.loader = false;
	this.checkUpdate = function (editdripo) {
		$scope.loader = true;
		Admin.checkUpdate().then(function(data) {
			if(data.data.success){
				$scope.updated = true;
				$scope.nochange = false;
				$scope.loader = false;
				$scope.reply  = data.data.message;
			}
			else{
				$scope.updated = false;
				$scope.nochange = true;
				$scope.loader = false;
				$scope.reply  = data.data.message;
			}
		});

	}
})


.controller('adminHomeCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Admin,User) {
	var app=this;
	Admin.getDetails().then(function(data) {
		if(data.data.success){
			$scope.totaluser = data.data.totaluser;
			$scope.totalnurse = data.data.totalnurse;
			$scope.totaldoctor = data.data.totaldoctor;
			$scope.totalstation = data.data.totalstation;
			$scope.totalbed= data.data.totalbed;
			$scope.totalivset = data.data.totalivset;
			$scope.totaldripo = data.data.totaldripo;
		}
	});

});



