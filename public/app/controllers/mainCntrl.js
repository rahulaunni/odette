angular.module('mainController',['authServices','userServices'])
.controller('mainCntrl', function ($scope, $mdSidenav,Auth,User,$location,$timeout,$rootScope,$route) {
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
				app.hospitalname = data.data.hospitalname;
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
		app.errorMsgNU = false;
		app.errorMsgWP = false;
		app.successMsg = false;
		app.expired = false;
		Auth.login(this.loginData).then(function (data) {
			if(data.data.success){
				app.successMsg = data.data.message;
				app.loader = false;
				User.getPermission().then(function (data) {
				if(data.data.permission === "admin"){
					$timeout(function () {
						$location.path('/admin/home')
					},3000);
				}
				else if(data.data.permission === "nurse"){
					$timeout(function () {
						$location.path('/')
					},3000);
				}
				
			});
			}
			else{
				if(data.data.expired){
					app.expired = true;
					if(data.data.message === "No user found"){
						app.errorMsgNU=data.data.message;
					}
					else{
						app.errorMsgWP=data.data.message;
					}
					if(data.data.message === "No user found"){
						app.errorMsgNU=data.data.message;
					}
					else{
						app.errorMsgWP=data.data.message;
					}					app.loader = false;

				}
				else{
					if(data.data.message === "No user found"){
						app.errorMsgNU=data.data.message;
					}
					else{
						app.errorMsgWP=data.data.message;
					}					app.loader = false;
				}			
			}
		});
	};

	this.logout = function () {
		app.errorMsg = false;
		app.successMsg = false;
		app.adminaccess = false;
		app.nurseaccess = false;
		app.doctoraccess = false;
		Auth.logout();
		$route.reload('/login')

	};


});






