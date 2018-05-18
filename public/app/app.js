
//files holds the angular app configuratin every dependencies, services and controllers are passed to myApp
angular.module('myApp', ['ngMaterial','ngMessages','ngAnimate','userServices','authServices','adminServices','nurseServices','homeServices','suServices','suhomeServices','dochomeServices','appRoutes','userControllers','mainController','emailController','adminController','nurseController','homeController','suController','suhomeController','dochomeController','angularGrid','slick'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('altTheme')
    .primaryPalette('indigo')
    .accentPalette('grey')
    .warnPalette('green',{
    	'default': '500', 
    	'hue-1': '300', 
    	'hue-2': '200', 
    	'hue-3': '100' 
    });

})

.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('dark')
    .primaryPalette('indigo')
    .accentPalette('grey')
    .warnPalette('red',{
      'default': '500', 
      'hue-1': '300', 
      'hue-2': '200', 
      'hue-3': '100' 
    });

})
//inorder to inject token in every request header to make the user logged in
.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors');
})

//socket.io client config
.factory('socket', ['$rootScope', function($rootScope) {
   var socket = io.connect();
  return {
    on: function(eventName, callback){
      socket.on(eventName, callback);
    },
    emit: function(eventName, data) {
      socket.emit(eventName, data);
    }
  };
}]);
