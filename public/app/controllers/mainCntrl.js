angular.module('mainController',['authServices','userServices','nurseServices'])
.controller('mainCntrl', function ($scope, $mdSidenav,Auth,User,$interval,$location,$timeout,$window,$rootScope,$route,Admin,Nurse) {
	$scope.showMobileMainHeader = true;
	$scope.openSideNavPanel = function() {
		$mdSidenav('left').open();
	};
	$scope.openSideNavPanelNurse = function() {
		$mdSidenav('nurseleft').open();
	};
	$scope.closeSideNavPanel = function() {
		$mdSidenav('left').close();
	};
	$scope.closeSideNavPanelNurse = function() {
		$mdSidenav('nurseleft').close();
	};
	var app=this;
	app.loadMe=false;
	$rootScope.$on("$routeChangeStart",function () {
		if(Auth.isLoggedIn()){
			app.isLoggedIn = true;
			Auth.getUser().then(function (data) {
				app.hospitalname = data.data.hospitalname;
				app.username = data.data.username;
				app.station = data.data.station;
				app.stationid = data.data.stationid;
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
						$location.path('/selectstation')
					},3000);
				}
				
			});
			}
			else{
				if(data.data.expired){
					app.expired = true;
					app.errorMsgNU=data.data.message;	
					app.loader = false;

				}
				else{
					if(data.data.message === "No user found"){
						app.errorMsgNU=data.data.message;
					}
					else{
						app.errorMsgWP=data.data.message;
					}					
					app.loader = false;
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
		$window.location.reload('/login');

	};
	//function to hide nurse toolbar whiile selection a station
	$scope.isActive = function(viewLocation) {
	    return viewLocation === $location.path();
	};
	$scope.ipaddress = false;
	//function to get ip address of server
	User.getIp().then(function (data) {
		if(data.data.success){
			$scope.ipaddress = data.data.ip;
		}
	});
	$scope.mqttserverstatus='running';
	User.getConnectedDripos().then(function (data) {
		if(data.data.success){
			$scope.connecteddripo=data.data.clients;
		}
		else{
			$scope.mqttserverstatus='stopped';
			$scope.connecteddripo=data.data.clients;

		}
	});
	//function to get connected dripo clients to admin view
	$interval(function () {
	User.getConnectedDripos().then(function (data) {
		if(data.data.success){
			$scope.connecteddripo=data.data.clients;
		}
		else{
			$scope.mqttserverstatus='stopped';
			$scope.connecteddripo=data.data.clients;

		}
	});
},30000)

/********************* Admin Menu *********************************/
$scope.adminMenuItems=[{menu:'Home',icon:'home',href:'/admin/home'},
					   {menu:'Manage User',icon:'account_circle',href:'/admin/manageusers'},
					   {menu:'Manage Station',icon:'important_devices',href:'/admin/managestations'},
					   {menu:'Manage Beds',icon:'hotel',href:'/admin/managebeds'},
					   {menu:'Manage Ivset',icon:'opacity',href:'/admin/manageivsets'},
					   {menu:'Manage Dripo',icon:'speaker_phone',href:'/admin/managedripos'},
					   {menu:'Update Server',icon:'update',href:'/admin/update'}];
//checking for the route change for changing the selected menu item
$rootScope.$on("$routeChangeStart",function () {
	if($location.path() == '/admin/home'){
		$scope.selectedIndex = 0;

	}
	else if($location.path() == '/admin/manageusers'){
		$scope.selectedIndex = 1;

	}
	else if($location.path() == '/admin/managestations'){
		$scope.selectedIndex = 2;

	}
	else if($location.path() == '/admin/managebeds'){
		$scope.selectedIndex = 3;

	}
	else if($location.path() == '/admin/manageivsets'){
		$scope.selectedIndex = 4;

	}
	else if($location.path() == '/admin/managedripos'){
		$scope.selectedIndex = 5;

	}
	else if($location.path() == '/admin/update'){
		$scope.selectedIndex = 6;

	}
//admin menu navigation
$scope.adminNav = function (link) {
	$location.path(link);
}

});




});
