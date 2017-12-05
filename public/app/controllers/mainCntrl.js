angular.module('mainController',['authServices'])
.controller('mainCntrl', function ($scope, $mdSidenav,Auth,$location,$timeout) {
	$scope.showMobileMainHeader = true;
	$scope.openSideNavPanel = function() {
		$mdSidenav('left').open();
	};
	$scope.closeSideNavPanel = function() {
		$mdSidenav('left').close();
	};

	// if(AuthToken.getToken()){
	// 	console.log("User logged in");
	// 	Auth.getUser().then(function (data) {
	// 		console.log(data);
	// 	})
	// }
	// else{
	// 	console.log("User not logged in");
	// }
	//controller config for login dependency authServices
	var app=this;
	this.signinUser = function (signinData) {
		app.loader = true;
		app.errorMsg = false;
		app.successMsg = false;
		Auth.login(this.signinData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = false;
				$timeout(function () {
					$location.path('/')
				},3000);
			}
			else{
				app.errorMsg=data.data.message;
				app.loader = false;
			}
		});
	}

	this.logout = function () {
		Auth.logout();
		$location.path('/logout')
		$timeout(function () {
			$location.path('/signin')
		},3000);

	};


});






