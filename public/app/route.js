angular.module('appRoutes', ['ngRoute'])
.config(function($routeProvider, $locationProvider) {
	$routeProvider

	.when('/signin',{
		templateUrl:'app/views/pages/signin.html'
	})
	.when('/signup',{
		templateUrl:'app/views/pages/signup.html',
		controller: 'signupCntrl',
		controllerAs: 'signup'
	})
	.when('/forgotpassword',{
		templateUrl:'app/views/pages/forgotpassword.html'
	})
	.when('/logout',{
		templateUrl:'app/views/pages/logout.html'
	})
	.otherwise({redirectTo:'/'});

	$locationProvider
	.html5Mode({
	  enabled: true,
	  requireBase: false
	})
	.hashPrefix('');

});