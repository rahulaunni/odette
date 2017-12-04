angular.module('myApp', ['ngMaterial','appRoutes'])
.controller('AppCtrl', function($scope, $mdSidenav) {
	$scope.showMobileMainHeader = true;
	$scope.openSideNavPanel = function() {
		$mdSidenav('left').open();
	};
	$scope.closeSideNavPanel = function() {
		$mdSidenav('left').close();
	};
})
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

});
