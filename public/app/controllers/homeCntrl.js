angular.module('homeController',['homeServices'])
.controller('homeCntrl',function ($http,$route,$scope,$rootScope,$interval,$window,$location,$timeout,$mdDialog,$scope,Home,socket) {
    var app = this;
    var index = false;
    $scope.openedtasks = [{}];
    $scope.times = [];
    $scope.inprogresstasks=[{}];
    $scope.alertedtasks=[{}];
    var date=new Date();
    var hour=date.getHours();
    var minute = date.getMinutes();
    $scope.currentHour = hour;
    //on page reload get all tasks from db
    Home.getopenedTasks().then(function (data) {
        if(data.data.success){
            $scope.openedtasks = data.data.openedtasks;
            $scope.times = data.data.times;

        }
        else{
          $scope.openedtasks = [{}];

        }
       
    });

    //on page reload get all active tasks from db
    Home.getinprogressTasks().then(function (data) {
        if(data.data.success){
            $scope.inprogresstasks = data.data.inprogresstasks;

        }else{
           $scope.inprogresstasks=[];
        }
    });
    //get alerted
    Home.getalertedTasks().then(function (data) {
        if(data.data.success){
            $scope.alertedtasks = data.data.alertedtasks;

        }else{
           $scope.alertedtasks=[];
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

    //function to change opened task to alerted in front end
    $interval(function () {
        var currentDate=new Date();
        if(currentDate.getMinutes() == 59){
            for(var key in $scope.opeendtasks){
                if($scope.openedtasks[key].time == (currentDate.getHours()))
                {   
                    $scope.openedtasks[key].status = 'alerted';
                    $scope.alertedtasks.push($scope.openedtasks[key]);
                    $scope.openedtasks.splice(key,1);
                }
            }
        }
        else if(currentDate.getMinutes() == 0){ //sync with database
            $window.location.reload('/');
        }

    },60000)

    //function to show a confirm dialog when user skip a task
    $scope.showSkipConfirm = function(ev,task) {
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
    //function to show a confirm dialog when user skip a task
    $scope.showCloseConfirm = function(ev,task) {
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
      .title('Done this task manually ')
      .textContent('Are you sure you want to close this task?')
      .ariaLabel('Lucky day')
      .targetEvent(ev)
      .ok('Yes, Close!')
      .cancel('No, Later');

      $mdDialog.show(confirm).then(function() {
        Home.closeTask(task).then(function (data) {
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
            if($scope.openedtasks[key]._id == data.taskid){
              console.log($scope.tasks[key]);
              $scope.openedtasks[key].status = 'inprogress';
              $scope.openedtasks[key].infusionstatus = data.infusionstatus;
              $scope.openedtasks[key].rate = data.rate;
              $scope.openedtasks[key].infusedVolume = data.infusedVolume;
              $scope.openedtasks[key].timeRemaining = data.timeRemaining;
              $scope.openedtasks[key].totalVolume = data.totalVolume;
              $scope.openedtasks[key].percentage = data.percentage;
              $scope.inprogresstasks.unshift($scope.openedtasks[key]);
            }
            if(key == $scope.openedtasks.length -1){
              for(var key2 in $scope.alertedtasks){
                if($scope.alertedtasks[key]._id == data.taskid){
                  console.log($scope.tasks[key2]);
                  $scope.alertedtasks[key2].status = 'inprogress';
                  $scope.alertedtasks[key2].infusionstatus = data.infusionstatus;
                  $scope.alertedtasks[key2].rate = data.rate;
                  $scope.alertedtasks[key2].infusedVolume = data.infusedVolume;
                  $scope.alertedtasks[key2].timeRemaining = data.timeRemaining;
                  $scope.alertedtasks[key2].totalVolume = data.totalVolume;
                  $scope.alertedtasks[key2].percentage = data.percentage;
                  $scope.inprogresstasks.unshift($scope.activetasks[key2]);
                }

              }
            }
          }
        }//end of start
        if(data.infusionstatus == 'infusing'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;

            }
          }
        }//end of infusing
        if(data.infusionstatus == 'stop'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'alerted';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;

            }
          }
        }//end of stop
        if(data.infusionstatus == 'Empty'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'closed';
              $scope.inprogresstasks.splice(key,1);

            }
          }
        }//end of empty
        if(data.infusionstatus == 'Block'|| data.infusionstatus == 'Rate_Err'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;

            }


          }

        }


      });


});
 