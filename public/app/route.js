var app = angular.module('appRoutes', ['ngRoute'])
.config(function($routeProvider, $locationProvider) {
	$routeProvider
	.when('/',{
		templateUrl:'app/views/pages/home.html',
		authenticated:true
	})
	.when('/login',{
		templateUrl:'app/views/pages/login.html',
		authenticated:false
	})
	.when('/register',{
		templateUrl:'app/views/pages/register.html',
		controller: 'registerCntrl',
		controllerAs: 'register',
		authenticated:false
	})
	.when('/forgotpassword',{
		templateUrl:'app/views/pages/forgotpassword.html',
		authenticated:false
	})
	.when('/activate/:token',{
		templateUrl:'app/views/pages/activation.html',
		controller: 'emailCntrl',
		controllerAs: 'email',
		authenticated:false
	})
	.when('/logout',{
		templateUrl:'app/views/pages/logout.html',
		authenticated:true
	})
	.otherwise({redirectTo:'/'});

	$locationProvider
	.html5Mode({
	  enabled: true,
	  requireBase: false
	})
	.hashPrefix('');

});

app.run(['$rootScope','Auth','$location',function ($rootScope,Auth,$location) {
	$rootScope.$on('$routeChangeStart',function (event,next,current) {
		if(next.$$route.authenticated == true){
			if(!Auth.isLoggedIn()){
				event.preventDefault();
				$location.path('/login')
			}

		}
		else if(next.$$route.authenticated == false){
			if(Auth.isLoggedIn()){
				event.preventDefault();
			}

		}
		else{

		}
	})
}]);