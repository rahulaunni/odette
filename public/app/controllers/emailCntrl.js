angular.module('emailController',['userServices'])
.controller('emailCntrl',function ($routeParams,$timeout,$location,User) {

	var app = this;

	User.activateAccount($routeParams.token).then(function(data) {
		app.successMsg = false;
		app.errorMsg = false;
		if(data.data.success){
			app.successMsg = data.data.message;
			$timeout(function () {
				$location.path('/login')
			},3000);
		}
		else{
			app.errorMsg = data.data.message;

		}

	})

});