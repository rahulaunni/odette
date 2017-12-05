angular.module('myApp', ['ngMaterial','ngMessages','ngAnimate','userServices','authServices','appRoutes','userControllers','mainController'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('altTheme')
    .primaryPalette('purple')
    .accentPalette('grey')
    .warnPalette('green',{
    	'default': '500', 
    	'hue-1': '300', 
    	'hue-2': '200', 
    	'hue-3': '100' 
    });

})
.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors');
});
