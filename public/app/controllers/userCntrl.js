angular.module('userControllers',['userServices'])
.controller('registerCntrl',function ($http,$location,$timeout,User) {
	var app=this;

	this.registerUser = function (userData) {
		app.loader = true;
		app.errorMsg = false;
		app.successMsg = false;
		User.create(this.userData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = false;
				$timeout(function () {
					$location.path('/login')
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});
	}
})
.controller('manageUserCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,User) {
	var app=this;
	$scope.users = [];
	User.viewUser().then(function (data) {
		if(data.data.success){
			$scope.users=data.data.users;

		}
		else{
			app.users=false;

		}
	});
	app.loader = false;
	app.errorMsg = false;
	app.successMsg = false;
	this.addUser = function (userData) {
		User.addUser(this.userData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = true;
				$timeout(function () {
					app.loader = false;
					$window.location.reload('/admin/manageusers')
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});

	}
	this.editUser = function (userid) {
		console.log(userid);
	}

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
	  			$window.location.reload('/admin/manageusers');
	  		}
	  	});

	  }, function() {

	  });
	};
});
