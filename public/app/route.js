angular.module('appRoutes', ['ngRoute'])
.config(function($routeProvider, $locationProvider) {
	$routeProvider

	.when('/signin',{
		templateUrl:'app/views/pages/signin.html'
	})
	.when('/signup',{
		templateUrl:'app/views/pages/signup.html'
	})
	.when('/forgotpassword',{
		templateUrl:'app/views/pages/forgotpassword.html'
	});

	$locationProvider
	.html5Mode({
	  enabled: true,
	  requireBase: false
	})
	.hashPrefix('');

});