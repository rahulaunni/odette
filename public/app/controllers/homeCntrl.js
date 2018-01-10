angular.module('homeController',['homeServices'])
.controller('homeCntrl',function ($http,$route,$scope,$rootScope,$interval,$window,$location,$timeout,$mdDialog,$scope,Home) {
    var app = this;
    var index = false;
    $scope.tasks = [{}];
    $scope.times = [];

    var date=new Date();
    var hour=date.getHours();
    $scope.currentHour = hour;
    console.log($scope.currentHour);
    //on page reload get all tasks from db
    Home.getTasks().then(function (data) {
        if(data.data.success){
            $scope.tasks = data.data.tasks;
            $scope.times = data.data.times;

        }
       
    });

    //on page reload get all active tasks from db
    Home.getactiveTasks().then(function (data) {
        if(data.data.success){
            $scope.activetasks = data.data.activetasks;

        }
    });

    //function for giving background color to footer of card
    $scope.setbgColor = function (status) {
        if (status == "inprogress") {
            return { background: "#9AB707" }
        }
        if (status == "alerted") {
            return { background: "#C70039" }
        }
        if (status == "opened") {
            return { background: "#CCCCCC" }
        }
    }

    //to show the card details as dialog box
    $scope.showDetails = function(ev,task) {
       $mdDialog.show({
         contentElement: '#myDialog'+task._id,
         parent: angular.element(document.body),
         targetEvent: ev,
         clickOutsideToClose: true
       });
     }

     $scope.determinateValue = 30;
    $interval(function () {


            $scope.determinateValue += 1;
            if ($scope.determinateValue > 100) {
              $scope.determinateValue = 30;
            }
    },100)


});
 