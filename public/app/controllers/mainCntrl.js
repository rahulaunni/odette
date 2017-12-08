angular.module('mainController',['authServices','userServices'])
.controller('mainCntrl', function ($scope, $mdSidenav,Auth,User,$location,$timeout,$rootScope) {
	$scope.showMobileMainHeader = true;
	$scope.openSideNavPanel = function() {
		$mdSidenav('left').open();
	};
	$scope.closeSideNavPanel = function() {
		$mdSidenav('left').close();
	};
	var app=this;
	app.loadMe=false;
	$rootScope.$on("$routeChangeStart",function () {
		if(Auth.isLoggedIn()){
			app.isLoggedIn = true;
			Auth.getUser().then(function (data) {
				app.username = data.data.username;
				User.getPermission().then(function (data) {
					if(data.data.permission === 'admin'){
						app.adminaccess = true;
						app.loadMe = true;
					}
					else if(data.data.permission === 'nurse'){
						app.nurseaccess = true;
						app.loadMe = true;
					}
					else if(data.data.permission === 'doctor'){
						app.doctoraccess = true;
						app.loadMe = true;
					}
					else{
						app.loadMe = true;

					}
				});

			});
		}
		else{
			app.isLoggedIn = false;
			app.username = "Guest";
			app.loadMe = true;
		}
	});
	
	//controller config for login dependency authServices
	this.loginUser = function (loginData) {
		app.loader = true;
		app.errorMsg = false;
		app.successMsg = false;
		app.expired = false;
		Auth.login(this.loginData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = false;
				$timeout(function () {
					$location.path('/')
				},3000);
			}
			else{
				if(data.data.expired){
					app.expired = true;
					app.errorMsg=data.data.message;
					app.loader = false;

				}
				else{
					app.errorMsg=data.data.message;
					app.loader = false;
				}			
			}
		});
	};

	this.logout = function () {
		app.errorMsg = false;
		app.successMsg = false;
		$location.path('/logout')
		Auth.logout();
		$timeout(function () {
			$location.path('/login')
		},3000);

	};


});






