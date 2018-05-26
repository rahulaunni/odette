//this files hold all the angular routes
var app = angular.module('appRoutes', ['ngRoute'])
.config(function($routeProvider, $locationProvider) {
	$routeProvider
	.when('/',{
		templateUrl:'app/views/pages/home.html',
		authenticated:true,
		controller : 'homeCntrl',
		controllerAs : 'home',
		permission:['nurse']
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
	.when('/resend',{
		templateUrl:'app/views/pages/resend.html',
		controller:'resendCntrl',
		controllerAs:'resend',
		authenticated:false
	})
	.when('/forgotpassword',{
		templateUrl:'app/views/pages/forgotpassword.html',
		controller: 'passwordCntrl',
		controllerAs: 'password',
		authenticated:false
	})
	.when('/activate/:token',{
		templateUrl:'app/views/pages/activation.html',
		controller: 'emailCntrl',
		controllerAs: 'email',
		authenticated:false
	})
	.when('/resetpassword/:token',{
		templateUrl:'app/views/pages/resetpassword.html',
		controller : 'passwordrstCntrl',
		controllerAs : 'passwordrst',
		authenticated:false
	})
	.when('/selectstation',{
		templateUrl:'app/views/pages/selectstation.html',
		authenticated:true,
		controller : 'nurseCntrl',
		controllerAs : 'nurse',
		permission:['nurse']
	})
	.when('/admin/home',{
		templateUrl:'app/views/adminpages/adminhome.html',
		authenticated:true,
		controller: 'adminHomeCntrl',
		controllerAs: 'adminHome',
		permission:['admin']
	})
	.when('/admin/manageusers',{
		templateUrl:'app/views/adminpages/manageuser.html',
		authenticated:true,
		controller: 'manageUserCntrl',
		controllerAs: 'manageUser',
		permission:['admin']
	})
	.when('/admin/managestations',{
		templateUrl:'app/views/adminpages/managestation.html',
		authenticated:true,
		controller: 'manageStationCntrl',
		controllerAs: 'manageStation',
		permission:['admin']
	})
	.when('/admin/managebeds',{
		templateUrl:'app/views/adminpages/managebed.html',
		authenticated:true,
		controller: 'manageBedCntrl',
		controllerAs: 'manageBed',
		permission:['admin']
	})
	.when('/admin/manageivsets',{
		templateUrl:'app/views/adminpages/manageivset.html',
		authenticated:true,
		controller: 'manageIvsetCntrl',
		controllerAs: 'manageIvset',
		permission:['admin']
	})
	.when('/admin/help',{
		templateUrl:'app/views/adminpages/adminhelp.html',
		authenticated:true,
		controller: 'adminhelpCntrl',
		controllerAs: 'adminhelp',
		permission:['admin']
	})
	.when('/logout',{
		templateUrl:'app/views/pages/logout.html',
		authenticated:true
	})
	.when('/admin/managedripos',{
		templateUrl:'app/views/adminpages/managedripo.html',
		authenticated:true,
		controller: 'manageDripoCntrl',
		controllerAs: 'manageDripo',
		permission:['admin']
	})
	.when('/admin/update',{
		templateUrl:'app/views/adminpages/update.html',
		authenticated:true,
		controller: 'updateCntrl',
		controllerAs: 'update',
		permission:['admin']
	})
	.when('/managepatients',{
		templateUrl:'app/views/pages/managepatient.html',
		authenticated:true,
		controller: 'managePatientCntrl',
		controllerAs: 'managePatient',
		permission:['nurse']
	})
	.when('/help',{
		templateUrl:'app/views/pages/help.html',
		authenticated:true,
		controller: 'helpCntrl',
		controllerAs: 'help',
		permission:['nurse']
	})
	.when('/su/home',{
		templateUrl:'app/views/su/home.html',
		authenticated:true,
		controller: 'suhomeCntrl',
		controllerAs: 'suhome',
		permission:['su']

	})
	.when('/su/managesynapse',{
		templateUrl:'app/views/su/localserverdetails.html',
		authenticated:true,
		controller: 'suCntrl',
		controllerAs: 'su',
		permission:['su']

	})
	.when('/su/analysis',{
		templateUrl:'app/views/su/analysis.html',
		authenticated:true,
		controller: 'suAnalysisCntrl',
		controllerAs: 'analysis',
		permission:['su']

	})
	.when('/doc/home',{
		templateUrl:'app/views/doc/home.html',
		authenticated:true,
		controller: 'dochomeCntrl',
		controllerAs: 'dochome',
		permission:['doctor']

	})

	.otherwise({redirectTo:'/'});
//function to remove defualut /#/ thing
	$locationProvider
	.html5Mode({
	  enabled: true,
	  requireBase: false
	})
	.hashPrefix('');

});
//this code section will check for user's authentication and authorization, prevent user from accessing other contents
app.run(['$rootScope','Auth','User','$location',function ($rootScope,Auth,User,$location) {
	$rootScope.$on('$routeChangeStart',function (event,next,current) {
		if (next.$$route !== undefined) { //checking whether routes are defined
		if(next.$$route.authenticated == true){ 
			if(!Auth.isLoggedIn()){
				event.preventDefault();
				$location.path('/login')
			}
			else if (next.$$route.permission) {
			    // Function: Get current user's permission to see if authorized on route
			    User.getPermission().then(function(data) {
			        // Check if user's permission matches at least one in the array
			        if (next.$$route.permission[0] !== data.data.permission) {
			            if (next.$$route.permission[1] !== data.data.permission) {
			                event.preventDefault(); // If at least one role does not match, prevent accessing route
			                if(data.data.permission == 'admin'){
			                	$location.path('/admin/home')
			                }
			                else if(data.data.permission == 'su'){
			                	$location.path('/su/home')
			                }
			                else if(data.data.permission == 'doctor'){
			                	$location.path('/doc/home')
			                }
			                else{
			                	$location.path('/'); // Redirect to home instead
			                }
			            }
			        }
			    });
			}

		}
		else if(next.$$route.authenticated == false){
			if(Auth.isLoggedIn()){
				event.preventDefault();
			}

		}
		
	}
	})
}]);