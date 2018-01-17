angular.module('mainController',['authServices','userServices','nurseServices'])
.controller('mainCntrl', function ($scope, $mdSidenav,Auth,User,$location,$timeout,$window,$rootScope,$route,Admin,Nurse) {
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


});

//nurse home page items
// angular.module('homeController',['homeServices'])
// .controller('homeCntrl',function ($http,$route,$scope,$rootScope,$interval,$window,$location,$timeout,$mdDialog,$scope,Home,socket) {
//     var app = this;
//     var index = false;
//     $scope.openedtasks = [{}];
//     $scope.times = [];
//     $scope.inprogresstasks=[{}];
//     $scope.alertedtasks=[{}];
//     var date=new Date();
//     var hour=date.getHours();
//     var minute = date.getMinutes();
//     $scope.currentHour = hour;
//     //on page reload get all tasks from db
//     Home.getopenedTasks().then(function (data) {
//         if(data.data.success){
//             $scope.openedtasks = data.data.openedtasks;
//             $scope.times = data.data.times;

//         }
//         else{
//           $scope.openedtasks = [{}];

//         }
       
//     });

//     //on page reload get all active tasks from db
//     Home.getinprogressTasks().then(function (data) {
//         if(data.data.success){
//             $scope.inprogresstasks = data.data.inprogresstasks;
//             for(var key in data.data.inprogresstasks){
//             	if(data.data.inprogresstasks[key].type == 'infusion'){
//             		$scope.inprogresstasks[key].span = 6;
//             	}
//             	else{
//             		$scope.inprogresstasks[key].span = 4;
//             	}
            	
//             }

//         }else{
//            $scope.inprogresstasks=[];
//         }
//     });
//     //get alerted
//     Home.getalertedTasks().then(function (data) {
//         if(data.data.success){
//             $scope.alertedtasks = data.data.alertedtasks;

//         }else{
//            $scope.alertedtasks=[];
//         }
//     });
//     //function for giving background color to footer of card
   

//     //to show the card details as dialog box
//     $scope.showDetails = function(ev,task) {
//        $mdDialog.show({
//          contentElement: '#myDialog'+task._id,
//          parent: angular.element(document.body),
//          targetEvent: ev,
//          clickOutsideToClose: true
//        });
//      }

//     //function to change opened task to alerted in front end
//     $interval(function () {
//         var currentDate=new Date();
//         if(currentDate.getMinutes() == 59){
//             for(var key in $scope.opeendtasks){
//                 if($scope.openedtasks[key].time == (currentDate.getHours()))
//                 {   
//                     $scope.openedtasks[key].status = 'alerted';
//                     $scope.alertedtasks.push($scope.openedtasks[key]);
//                     $scope.openedtasks.splice(key,1);
//                 }
//             }
//         }
//         else if(currentDate.getMinutes() == 0){ //sync with database
//             $window.location.reload('/');
//         }

//     },60000)

//     //function to show a confirm dialog when user skip a task
//     $scope.showSkipConfirm = function(ev,task) {
//       var confirm = $mdDialog.confirm({
//         onComplete: function afterShowAnimation() {
//             var $dialog = angular.element(document.querySelector('md-dialog'));
//             var $actionsSection = $dialog.find('md-dialog-actions');
//             var $cancelButton = $actionsSection.children()[0];
//             var $confirmButton = $actionsSection.children()[1];
//             angular.element($confirmButton).addClass('md-raised md-warn');
//             angular.element($cancelButton).addClass('md-raised');
//         }
//       })
//       .title('Would you like to skip this '+task.type)
//       .textContent('This will remove '+task.type+' permanantly')
//       .ariaLabel('Lucky day')
//       .targetEvent(ev)
//       .ok('Yes, Skip!')
//       .cancel('No, Later');

//       $mdDialog.show(confirm).then(function() {
//         Home.skipTask(task).then(function (data) {
//             if(data.data.success){
//                 $window.location.reload('/');
//             }
//         });

//       }, function() {

//       });
//     };
//     //function to show a confirm dialog when user skip a task
//     $scope.showCloseConfirm = function(ev,task) {
//       var confirm = $mdDialog.confirm({
//         onComplete: function afterShowAnimation() {
//             var $dialog = angular.element(document.querySelector('md-dialog'));
//             var $actionsSection = $dialog.find('md-dialog-actions');
//             var $cancelButton = $actionsSection.children()[0];
//             var $confirmButton = $actionsSection.children()[1];
//             angular.element($confirmButton).addClass('md-raised md-warn');
//             angular.element($cancelButton).addClass('md-raised');
//         }
//       })
//       .title('Done this task manually ')
//       .textContent('Are you sure you want to close this task?')
//       .ariaLabel('Lucky day')
//       .targetEvent(ev)
//       .ok('Yes, Close!')
//       .cancel('No, Later');

//       $mdDialog.show(confirm).then(function() {
//         Home.closeTask(task).then(function (data) {
//             if(data.data.success){
//                 $window.location.reload('/');
//             }
//         });

//       }, function() {

//       });
//     };
   
//     //ssocket.io test
//     socket.on('dripo', function(data) {
//         if(data.infusionstatus == 'start'){
//           for(var key in $scope.tasks){
//             if($scope.openedtasks[key]._id == data.taskid){
//               console.log($scope.tasks[key]);
//               $scope.openedtasks[key].status = 'inprogress';
//               $scope.openedtasks[key].infusionstatus = data.infusionstatus;
//               $scope.openedtasks[key].rate = data.rate;
//               $scope.openedtasks[key].infusedVolume = data.infusedVolume;
//               $scope.openedtasks[key].timeRemaining = data.timeRemaining;
//               $scope.openedtasks[key].totalVolume = data.totalVolume;
//               $scope.openedtasks[key].percentage = data.percentage;
//               $scope.inprogresstasks.unshift($scope.openedtasks[key]);
//             }
//             if(key == $scope.openedtasks.length -1){
//               for(var key2 in $scope.alertedtasks){
//                 if($scope.alertedtasks[key]._id == data.taskid){
//                   console.log($scope.tasks[key2]);
//                   $scope.alertedtasks[key2].status = 'inprogress';
//                   $scope.alertedtasks[key2].infusionstatus = data.infusionstatus;
//                   $scope.alertedtasks[key2].rate = data.rate;
//                   $scope.alertedtasks[key2].infusedVolume = data.infusedVolume;
//                   $scope.alertedtasks[key2].timeRemaining = data.timeRemaining;
//                   $scope.alertedtasks[key2].totalVolume = data.totalVolume;
//                   $scope.alertedtasks[key2].percentage = data.percentage;
//                   $scope.inprogresstasks.unshift($scope.activetasks[key2]);
//                 }

//               }
//             }
//           }
//         }//end of start
//         if(data.infusionstatus == 'infusing'){
//           for(var key in $scope.inprogresstasks){
//             if($scope.inprogresstasks[key]._id == data.taskid){
//               $scope.inprogresstasks[key].status = 'inprogress';
//               $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
//               $scope.inprogresstasks[key].rate = data.rate;
//               $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
//               $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
//               $scope.inprogresstasks[key].totalVolume = data.totalVolume;
//               $scope.inprogresstasks[key].percentage = data.percentage;

//             }
//           }
//         }//end of infusing
//         if(data.infusionstatus == 'stop'){
//           for(var key in $scope.inprogresstasks){
//             if($scope.inprogresstasks[key]._id == data.taskid){
//               $scope.inprogresstasks[key].status = 'alerted';
//               $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
//               $scope.inprogresstasks[key].rate = data.rate;
//               $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
//               $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
//               $scope.inprogresstasks[key].totalVolume = data.totalVolume;
//               $scope.inprogresstasks[key].percentage = data.percentage;

//             }
//           }
//         }//end of stop
//         if(data.infusionstatus == 'Empty'){
//           for(var key in $scope.inprogresstasks){
//             if($scope.inprogresstasks[key]._id == data.taskid){
//               $scope.inprogresstasks[key].status = 'closed';
//               $scope.inprogresstasks.splice(key,1);

//             }
//           }
//         }//end of empty
//         if(data.infusionstatus == 'Block'|| data.infusionstatus == 'Rate_Err'){
//           for(var key in $scope.inprogresstasks){
//             if($scope.inprogresstasks[key]._id == data.taskid){
//               $scope.inprogresstasks[key].status = 'inprogress';
//               $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
//               $scope.inprogresstasks[key].rate = data.rate;
//               $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
//               $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
//               $scope.inprogresstasks[key].totalVolume = data.totalVolume;
//               $scope.inprogresstasks[key].percentage = data.percentage;
//               console.log($scope.inprogresstasks[key]);
//             }


//           }

//         }


//       });


// });
 






