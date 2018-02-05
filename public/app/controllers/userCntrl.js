angular.module('userControllers',['userServices'])
.controller('registerCntrl',function ($http,$location,$timeout,User) {
	var app=this;

	this.registerUser = function (userData) {
		app.loader = true;
		app.errorMsg = false;
		app.successMsg = false;
		app.hider = false;
		User.create(this.userData).then(function (data) {
			console.log(data.data);
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = false;
				app.hider = true;
				$timeout(function () {
					$location.path('/login')
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
				app.hider = false;

			}
		});
	}
})
.controller('manageUserCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,User) {
	var app=this;
	$scope.users = [];
	$scope.nouser = false;
	User.viewUser().then(function (data) {
		if(data.data.success){
			$scope.users=data.data.users;

		}
		else{
			app.users=false;
			$scope.nouser = true;

		}
	});
	app.loader = false;
	app.editloader = false;
	app.editsuccessMsg = false;
	app.editerrorMsg = false;
	app.errorMsg = false;
	app.successMsg = false;
	app.showOnEditUser = false;
	app.edituser ={};
	$scope.form={};
	//function for add user form submission
	this.addUser = function (userData) {
		User.addUser(this.userData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					User.viewUser().then(function (data) {
						if(data.data.success){
							$scope.users=data.data.users;

						}
						else{
							app.users=false;
							$scope.nouser = true;

						}
					});
					app.userData ={};
					$scope.form.addUser.$setPristine(true);
					$scope.form.addUser.$setUntouched(true);
					app.errorMsg = false;
					$location.path('/admin/manageusers');
				},1500);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});

	};
	//function to provide edit user tab and hide add user tab
	this.showEditUser = function (user) {
		app.showOnEditUser = true;
		app.editloader = false;
		$scope.myTabIndex = $scope.myTabIndex +1; //to move tp next tab
		app.edituser = user;
	};
	//form submit for change password
	this.editUser = function (edituser) {
		User.savelocalPassword(this.edituser).then(function(data) {
			if(data.data.success){
				app.editloader = true;
				app.editsuccessMsg = data.data.message;
				console.log(app.editsuccessMsg);
				$timeout(function () {
					app.loader = false;
					$scope.myTabIndex =0;
					User.viewUser().then(function (data) {
						if(data.data.success){
							$scope.users=data.data.users;

						}
						else{
							app.users=false;
							$scope.nouser = true;

						}
					});
					app.userData ={};
					app.edituser ={};
					$scope.form.editUser.$setPristine();
					$scope.form.editUser.$setUntouched();
					$location.path('/admin/manageusers');
					app.editsuccessMsg = false;
					app.editloader = false;
				},1500);
			}
			else{
				app.editerrorMsg=data.data.message;
				app.editloader = false;
			}
		});

	};
	//function to cancel change password tab
	this.cancel=function () {
		app.showOnEditUser = false;
		$location.path('/admin/manageusers');
	};


	//function for deleteting an user by admin show a dialog box and delte on confirm
	this.showConfirmdeleteUser = function(ev,user) {
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
	        .title('Would you like to delete '+user.userName)
	        .textContent('This will remove '+user.userName+' permanantly from database')
	        .ariaLabel('Lucky day')
	        .targetEvent(ev)
	        .ok('Yes, Delete!')
	        .cancel('No, Keep User');

	  $mdDialog.show(confirm).then(function() {
	  	User.deleteUser(user).then(function (data) {
	  		if(data.data.success){
	  			User.viewUser().then(function (data) {
	  				if(data.data.success){
	  					$scope.users=data.data.users;

	  				}
	  				else{
	  					app.users=false;
	  					$scope.nouser = true;

	  				}
	  			});
	  			$location.path('/admin/manageusers');
	  		}
	  	});

	  }, function() {

	  });
	};
	$scope.reload =  function () {
		app.showOnEditUser = false;
	}
});
