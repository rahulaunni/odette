angular.module('homeController',['homeServices'])
.controller('homeCntrl',function ($http,$route,$scope,$rootScope,$interval,$window,$location,$timeout,$mdDialog,$scope,Home,socket) {
    var app = this;
    var index = false;
    $scope.tasks = [{}];
    $scope.times = [];
    $scope.activetasks=[];
    var date=new Date();
    var hour=date.getHours();
    var minute = date.getMinutes();
    $scope.currentHour = hour;
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
            return { background: "#FAD60B"}
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
    },300)

    //function to change opened task to alerted in front end
    $interval(function () {
        var currentDate=new Date();
        if(currentDate.getMinutes() == 59){
            for(var key in $scope.tasks){
                if($scope.tasks[key].time == (currentDate.getHours()))
                {   
                    $scope.tasks[key].status = 'alerted';
                    $scope.activetasks.push($scope.tasks[key]);
                    $scope.tasks.splice(key,1);
                }
            }
        }
        else if(currentDate.getMinutes() == 0){ //sync with database
            $window.location.reload('/');
        }

    },60000)

    //function to show a confirm dialog when user skip a task
    $scope.showSkipConfirm = function(ev,task) {
        console.log(task);
      var confirm = $mdDialog.confirm({
        onComplete: function afterShowAnimation() {
            var $dialog = angular.element(document.querySelector('md-dialog'));
            var $actionsSection = $dialog.find('md-dialog-actions');
            var $cancelButton = $actionsSection.children()[0];
            var $confirmButton = $actionsSection.children()[1];
            angular.element($confirmButton).addClass('md-raised md-warn');
            angular.element($cancelButton).addClass('md-raised');
        }
      })
      .title('Would you like to skip this '+task.type)
      .textContent('This will remove '+task.type+' permanantly')
      .ariaLabel('Lucky day')
      .targetEvent(ev)
      .ok('Yes, Skip!')
      .cancel('No, Later');

      $mdDialog.show(confirm).then(function() {
        Home.skipTask(task).then(function (data) {
            if(data.data.success){
                $window.location.reload('/');
            }
        });

      }, function() {

      });
    };
   
    //ssocket.io test
    socket.on('dripo', function(data) {
        if(data.infusionstatus == 'start'){
          for(var key in $scope.tasks){
            if($scope.tasks[key]._id == data.taskid){
              console.log($scope.tasks[key]);
              $scope.tasks[key].status = 'inprogress';
              $scope.tasks[key].infusionstatus = data.infusionstatus;
              $scope.tasks[key].rate = data.rate;
              $scope.tasks[key].infusedVolume = data.infusedVolume;
              $scope.tasks[key].timeRemaining = data.timeRemaining;
              $scope.tasks[key].totalVolume = data.totalVolume;
              $scope.tasks[key].percentage = data.percentage;
              $scope.activetasks.unshift($scope.tasks[key]);
            }
            if(key == $scope.tasks.length -1){
              for(var key2 in $scope.activetasks){
                if($scope.tasks[key]._id == data.taskid){
                  console.log($scope.tasks[key2]);
                  $scope.activetasks[key2].status = 'inprogress';
                  $scope.activetasks[key2].infusionstatus = data.infusionstatus;
                  $scope.activetasks[key2].rate = data.rate;
                  $scope.activetasks[key2].infusedVolume = data.infusedVolume;
                  $scope.activetasks[key2].timeRemaining = data.timeRemaining;
                  $scope.activetasks[key2].totalVolume = data.totalVolume;
                  $scope.activetasks[key2].percentage = data.percentage;
                  $scope.activetasks.unshift($scope.activetasks[key2]);
                }

              }
            }
          }
        }//end of start
        if(data.infusionstatus == 'infusing'){
          for(var key in $scope.activetasks){
            if($scope.activetasks[key]._id == data.taskid){
              $scope.activetasks[key].status = 'inprogress';
              $scope.activetasks[key].infusionstatus = data.infusionstatus;
              $scope.activetasks[key].rate = data.rate;
              $scope.activetasks[key].infusedVolume = data.infusedVolume;
              $scope.activetasks[key].timeRemaining = data.timeRemaining;
              $scope.activetasks[key].totalVolume = data.totalVolume;
              $scope.activetasks[key].percentage = data.percentage;

            }
          }
        }//end of infusing
        if(data.infusionstatus == 'stop'){
          for(var key in $scope.activetasks){
            if($scope.activetasks[key]._id == data.taskid){
              $scope.activetasks[key].status = 'alerted';
              $scope.activetasks[key].infusionstatus = data.infusionstatus;
              $scope.activetasks[key].rate = data.rate;
              $scope.activetasks[key].infusedVolume = data.infusedVolume;
              $scope.activetasks[key].timeRemaining = data.timeRemaining;
              $scope.activetasks[key].totalVolume = data.totalVolume;
              $scope.activetasks[key].percentage = data.percentage;

            }
          }
        }//end of stop
        if(data.infusionstatus == 'Empty'){
          for(var key in $scope.activetasks){
            if($scope.activetasks[key]._id == data.taskid){
              $scope.activetasks[key].status = 'closed';
              $scope.activetasks.splice(key,1);

            }
          }
        }//end of empty
        if(data.infusionstatus == 'Block'|| data.infusionstatus == 'Rate_Err'){
          for(var key in $scope.activetasks){
            if($scope.activetasks[key]._id == data.taskid){
              $scope.activetasks[key].status = 'inprogress';
              $scope.activetasks[key].infusionstatus = data.infusionstatus;
              $scope.activetasks[key].rate = data.rate;
              $scope.activetasks[key].infusedVolume = data.infusedVolume;
              $scope.activetasks[key].timeRemaining = data.timeRemaining;
              $scope.activetasks[key].totalVolume = data.totalVolume;
              $scope.activetasks[key].percentage = data.percentage;

            }


          }

        }


      });


});
 