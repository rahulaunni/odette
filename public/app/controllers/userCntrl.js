angular.module('userControllers',['userServices'])
.controller('signupCntrl',function ($http,$location,$timeout,User) {
	var app=this;

	this.signupUser = function (userData) {
		app.loader = true;
		app.errorMsg = false;
		app.successMsg = false;
		User.create(this.userData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = false;
				$timeout(function () {
					$location.path('/signin')
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});
	}
});