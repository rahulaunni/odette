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
.controller('manageUserCntrl',function ($http,$route,$location,$timeout,$scope,User) {
	var app=this;
	$scope.users = false;
	User.viewUser().then(function (data) {
		if(data.data.success){
			$scope.users=data.data.users;
			console.log($scope.users);

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
					$route.reload('/admin/manageusers')
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});

	}
	console.log("test");
});
