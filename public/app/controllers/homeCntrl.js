angular.module('homeController',['homeServices'])
.controller('homeCntrl',function ($http,$route,$scope,$rootScope,$window,$location,$timeout,$mdDialog,$scope,Home) {
	var app = this;
  var index = false;
	$scope.tasks = [{}];
  $scope.times = [];
 	Home.getTasks().then(function (data) {
			$scope.tasks = data.data.tasks;
      $scope.times = data.data.times;
		});
  Home.getactiveTasks().then(function (data) {
      $scope.activetasks = data.data.activetasks;
    });
  $scope.setbgColor = function (status) {
    if (status == "inprogress") {
      return { background: "#00fc00" }
    }
    if (status == "opened") {
      return { background: "#CCCCCC" }
    }
  }
});
 