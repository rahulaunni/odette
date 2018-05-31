angular.module('homeController',['homeServices'])
.controller('homeCntrl',function ($http,$route,$scope,$rootScope,$interval,$window,$location,$timeout,$mdDialog,$scope,Home,socket,Auth) {
    //redirect user if no station selected
    Auth.getUser().then(function (data) {
      if(!data.data.station){
        $location.path('/selectstation')
      }

    }); 
    var app = this;
    var index = false;
    var drugmed = document.getElementById("drugmed");
    var drughi = document.getElementById("drughi");   
    $scope.openedtasks = [{}];
    $scope.times = [];
    $scope.inprogresstasks=[{}];
    $scope.alertedtasks=[{}];
    var date=new Date();
    var hour=date.getHours();
    var minute = date.getMinutes();
    $scope.currentHour = hour;
    $scope.trunc =Math.floor;
    $scope.noOpenedTasks = false;
    $scope.noInprogressTasks=false;
    $scope.noAlertedTasks = false;
    $scope.pageloaded=false;
    //on page reload get all tasks from db
    Home.getopenedTasks().then(function (data) {
        if(data.data.success){
            $scope.openedtasks = data.data.openedtasks;
            $scope.times = data.data.times;


        }
        else{
          $scope.openedtasks = [{}];
          $scope.noOpenedTasks = true;

        }
       
    });

    //on page reload get all active tasks from db
    Home.getinprogressTasks().then(function (data) {
        if(data.data.success){
            $scope.inprogresstasks = data.data.inprogresstasks;
            for(var key in data.data.inprogresstasks){
            	if(data.data.inprogresstasks[key].type == 'infusion'){
            		$scope.inprogresstasks[key].span = 6;
            	}
            	else{
            		$scope.inprogresstasks[key].span = 4;
            	}
              if(data.data.inprogresstasks[key].status=='start' || data.data.inprogresstasks[key].status=='infusing'){
                $scope.inprogresstasks[key].prgbar = 'md-primary';
              }
              else{
                $scope.inprogresstasks[key].prgbar = 'md-warn';
              }
            	
            }

        }else{
           $scope.inprogresstasks=[{}];
           $scope.noInprogressTasks=true;

        }
    });
    //get alerted
    Home.getalertedTasks().then(function (data) {
        if(data.data.success){
            $scope.alertedtasks = data.data.alertedtasks;
            $scope.pageloaded=true;


        }else{
           $scope.alertedtasks=[];
           $scope.noAlertedTasks = true;
           $scope.pageloaded=true;
        }
    });
   


    //function to change opened task to alerted in front end
    $interval(function () {
        var currentDate=new Date();
        if(currentDate.getMinutes() == 59){
            for(var key in $scope.opeendtasks){
                if($scope.openedtasks[key].time == (currentDate.getHours()))
                {   
                    $scope.openedtasks[key].status = 'alerted';
                    $scope.noAlertedTasks = false;
                    $scope.alertedtasks.push($scope.openedtasks[key]);
                    $scope.openedtasks.splice(key,1);
                }
            }
        }
        else if(currentDate.getMinutes() == 0){ //sync with database
          Home.getopenedTasks().then(function (data) {
              if(data.data.success){
                  $scope.openedtasks = data.data.openedtasks;
                  $scope.times = data.data.times;

              }
              else{
                $scope.openedtasks = [{}];
                $scope.noOpenedTasks = true;

              }
             
          });

          //on page reload get all active tasks from db
          Home.getinprogressTasks().then(function (data) {
              if(data.data.success){
                  $scope.inprogresstasks = data.data.inprogresstasks;
                  for(var key in data.data.inprogresstasks){
                    if(data.data.inprogresstasks[key].type == 'infusion'){
                      $scope.inprogresstasks[key].span = 6;
                    }
                    else{
                      $scope.inprogresstasks[key].span = 4;
                    }
                    
                  }

              }else{
                 $scope.inprogresstasks=[{}];
                 $scope.noInprogressTasks=true;

              }
          });
          //get alerted
          Home.getalertedTasks().then(function (data) {
              if(data.data.success){
                  $scope.alertedtasks = data.data.alertedtasks;

              }else{
                 $scope.alertedtasks=[];
                 $scope.noAlertedTasks = true;

              }
          });
                  }

    },60000)

    //function to show a confirm dialog when user skip a task
    $scope.showSkipConfirm = function(ev,task) {
      var confirm = $mdDialog.confirm({
        onComplete: function afterShowAnimation() {
            var $dialog = angular.element(document.querySelectorAll('[aria-label="skip_task"]'));
            var $actionsSection = $dialog.find('md-dialog-actions');
            var $cancelButton = $actionsSection.children()[0];
            var $confirmButton = $actionsSection.children()[1];
            angular.element($confirmButton).addClass('md-raised md-warn');
            angular.element($cancelButton).addClass('md-raised');
        }
      })
      .title('Would you like to  delete this '+task.type+' ?')
      .textContent('This will remove '+task.type+' permanantly')
      .ariaLabel('skip_task')
      .targetEvent(ev)
      .ok('DELETE')
      .cancel('CANCEL');

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
            var $dialog = angular.element(document.querySelectorAll('[aria-label="done_task"]'));
            //console.log($dialog.html());
            var $actionsSection = $dialog.find('md-dialog-actions');
            //console.log($dialog.find('md-dialog-actions'));
            var $cancelButton = $actionsSection.children()[0];
            var $confirmButton = $actionsSection.children()[1];
            angular.element($confirmButton).addClass('md-raised md-warn')
            angular.element($cancelButton).addClass('md-raised');
        }
      })
      .title('Have you done this task with out dripo ?')
      .textContent('Select yes to add this task to patients infusion history')
      .ariaLabel('done_task')
      .targetEvent(ev)
      .ok('YES')
      .cancel('NO');

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
    	$scope.$apply(function () {
        if(data.infusionstatus == 'start'){
          for(var key in $scope.openedtasks){
            if($scope.openedtasks[key]._id == data.taskid){
              $scope.noInprogressTasks=false;
              $scope.openedtasks[key].status = 'inprogress';
              $scope.openedtasks[key].infusionstatus = data.infusionstatus;
              $scope.openedtasks[key].rate = data.rate;
              $scope.openedtasks[key].infusedVolume = data.infusedVolume;
              $scope.openedtasks[key].timeRemaining = data.timeRemaining;
              $scope.openedtasks[key].totalVolume = data.totalVolume;
              $scope.openedtasks[key].percentage = data.percentage;
              $scope.openedtasks[key].devicecharge = data.deviceCharge;
              $scope.inprogresstasks.unshift($scope.openedtasks[key]);
              $scope.inprogresstasks[0].span=6;
              $scope.openedtasks.splice(key2,1);

            }
            if(key == $scope.openedtasks.length -1){
              for(var key2 in $scope.alertedtasks){
                if($scope.alertedtasks[key2]._id == data.taskid){
                  $scope.noInprogressTasks=false;
                  $scope.alertedtasks[key2].status = 'inprogress';
                  $scope.alertedtasks[key2].infusionstatus = data.infusionstatus;
                  $scope.alertedtasks[key2].rate = data.rate;
                  $scope.alertedtasks[key2].infusedVolume = data.infusedVolume;
                  $scope.alertedtasks[key2].timeRemaining = data.timeRemaining;
                  $scope.alertedtasks[key2].totalVolume = data.totalVolume;
                  $scope.alertedtasks[key2].percentage = data.percentage;
                  $scope.alertedtasks[key2].devicecharge = data.deviceCharge;
                  $scope.inprogresstasks.unshift($scope.alertedtasks[key2]);
                  $scope.inprogresstasks[0].span=6;
                  $scope.alertedtasks.splice(key2,1);


                }
              if(key2 == $scope.alertedtasks.length - 1){
                for(var key3 in $scope.inprogresstasks){
                  if($scope.inprogresstasks[key2]._id == data.taskid){
                    $scope.noInprogressTasks=false;
                    $scope.inprogresstasks[key3].status = 'inprogress';
                    $scope.inprogresstasks[key3].infusionstatus = data.infusionstatus;
                    $scope.inprogresstasks[key3].rate = data.rate;
                    $scope.inprogresstasks[key3].infusedVolume = data.infusedVolume;
                    $scope.inprogresstasks[key3].timeRemaining = data.timeRemaining;
                    $scope.inprogresstasks[key3].totalVolume = data.totalVolume;
                    $scope.inprogresstasks[key3].percentage = data.percentage;
                    $scope.inprogresstasks[key3].devicecharge = data.deviceCharge;
                  }
                }
              }

              }
            }
          }
        }//end of start
        else if(data.infusionstatus == 'infusing'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.inprogresstasks[key].devicecharge = data.deviceCharge;


            }
          }
        }//end of infusing
        else if(data.infusionstatus == 'stop'){
          if(data.percentage<90){
            for(var key in $scope.inprogresstasks){
              if($scope.inprogresstasks[key]._id == data.taskid){
                $scope.inprogresstasks[key].status = 'alerted';
                $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
                $scope.inprogresstasks[key].rate = data.rate;
                $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
                $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
                $scope.inprogresstasks[key].totalVolume = data.totalVolume;
                $scope.inprogresstasks[key].percentage = data.percentage;
                $scope.alertedtasks.unshift($scope.inprogresstasks[key]);
                $scope.inprogresstasks.splice(key,1);
                $scope.noAlertedTasks = false;
                Home.getinprogressTasks().then(function (data) {
                    if(data.data.success){
                        $scope.inprogresstasks = data.data.inprogresstasks;
                        for(var key in data.data.inprogresstasks){
                          if(data.data.inprogresstasks[key].type == 'infusion'){
                            $scope.inprogresstasks[key].span = 6;
                          }
                          else{
                            $scope.inprogresstasks[key].span = 4;
                          }
                          
                        }

                    }else{
                       $scope.inprogresstasks=[{}];
                       $scope.noInprogressTasks=true;

                    }
                });
                //get alerted
                Home.getalertedTasks().then(function (data) {
                    if(data.data.success){
                        $scope.alertedtasks = data.data.alertedtasks;

                    }else{
                       $scope.alertedtasks=[];
                       $scope.noAlertedTasks = true;

                    }
                });
              }
            }
          }
            else{
              for(var key in $scope.inprogresstasks){
                if($scope.inprogresstasks[key]._id == data.taskid){
                  $scope.inprogresstasks[key].status = 'inprogress';
                  $scope.inprogresstasks[key].infusionstatus = 'Empty';
                  $scope.inprogresstasks[key].rate = data.rate;
                  $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
                  $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
                  $scope.inprogresstasks[key].totalVolume = data.totalVolume;
                  $scope.inprogresstasks[key].percentage = data.percentage;
                  $scope.inprogresstasks[key].devicecharge = data.deviceCharge;

                }
              }

            }
         
        }//end of stop
        else if(data.infusionstatus == 'Complete'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.inprogresstasks[key].devicecharge = data.deviceCharge;
              drughi.play();

            }
          }
        }//end of complete

        else if(data.infusionstatus == 'Empty'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.inprogresstasks[key].devicecharge = data.deviceCharge;
              drughi.play();

            }
          }
        }//end of empty
        else if(data.infusionstatus == 'Empty_ACK'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'closed';
              $scope.inprogresstasks.splice(key,1);
              Home.getinprogressTasks().then(function (data) {
                  if(data.data.success){
                      $scope.inprogresstasks = data.data.inprogresstasks;
                      for(var key in data.data.inprogresstasks){
                        if(data.data.inprogresstasks[key].type == 'infusion'){
                          $scope.inprogresstasks[key].span = 6;
                        }
                        else{
                          $scope.inprogresstasks[key].span = 4;
                        }
                        
                      }

                  }else{
                     $scope.inprogresstasks=[{}];
                     $scope.noInprogressTasks=true;

                  }
              });
            }

          }


        }

        else if(data.infusionstatus == 'Block'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.inprogresstasks[key].devicecharge = data.deviceCharge;
              drughi.play();

            }


          }


        }//end of Errors
        else if(data.infusionstatus == 'Rate_Err'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.inprogresstasks[key].devicecharge = data.deviceCharge;
              drugmed.play();

            }


          }

        }
        else if(data.infusionstatus == 'Block_ACK'|| data.infusionstatus == 'Rate_Err_ACK' || data.infusionstatus == 'Complete_ACK'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.inprogresstasks[key].devicecharge = data.deviceCharge;

            }


          }

        }//end of Errors
        else if(data.infusionstatus == 'Device_Disconnected'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'inprogress';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              drughi.play();

            }


          }

          
        }//end of device_disconnected
        else if(data.infusionstatus == 'Connection_Lost'){
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
          
        }//end of device_disconnected

        else if(data.infusionstatus == 'Device_Disconnected_ACK'){
          for(var key in $scope.inprogresstasks){
            if($scope.inprogresstasks[key]._id == data.taskid){
              $scope.inprogresstasks[key].status = 'alerted';
              $scope.inprogresstasks[key].infusionstatus = data.infusionstatus;
              $scope.inprogresstasks[key].rate = data.rate;
              $scope.inprogresstasks[key].infusedVolume = data.infusedVolume;
              $scope.inprogresstasks[key].timeRemaining = data.timeRemaining;
              $scope.inprogresstasks[key].totalVolume = data.totalVolume;
              $scope.inprogresstasks[key].percentage = data.percentage;
              $scope.alertedtasks.unshift($scope.inprogresstasks[key]);
              $scope.inprogresstasks.splice(key,1);
              $scope.noAlertedTasks = false;
              Home.getinprogressTasks().then(function (data) {
                  if(data.data.success){
                      $scope.inprogresstasks = data.data.inprogresstasks;
                      for(var key in data.data.inprogresstasks){
                        if(data.data.inprogresstasks[key].type == 'infusion'){
                          $scope.inprogresstasks[key].span = 6;
                        }
                        else{
                          $scope.inprogresstasks[key].span = 4;
                        }
                        
                      }

                  }else{
                     $scope.inprogresstasks=[{}];
                     $scope.noInprogressTasks=true;

                  }
              });
              //get alerted
              Home.getalertedTasks().then(function (data) {
                  if(data.data.success){
                      $scope.alertedtasks = data.data.alertedtasks;

                  }else{
                     $scope.alertedtasks=[];
                     $scope.noAlertedTasks = true;

                  }
              });
            }
          }
          
        }//end of Device_Disconnected_ACK
      

    });


});



  //acknowledging the alert
  $scope.ackAlert = function(ev,task) { 
    if(task.infusionstatus == 'Empty'){
      socket.emit('publish', {topic:task.topic+'mon',payload:task._id+'-'+'Empty_ACK'+'-'+task.rate+'-'+task.infusedVolume+'-'+task.timeRemaining+'-'+task.totalVolume+'-'+task.devicecharge});
      socket.emit('publish', {topic:task.topic+'staAck',payload:'STA_ACK'});

    }
    else if(task.infusionstatus == 'Device_Disconnected'){
      socket.emit('publish', {topic:task.topic+'mon',payload:task._id+'-'+task.infusionstatus+'_ACK'+'-'+task.rate+'-'+task.infusedVolume+'-'+task.timeRemaining+'-'+task.totalVolume+'-'+task.devicecharge});

    }
    else if(task.infusionstatus == 'Block'){
      console.log(task);
      socket.emit('publish', {topic:task.topic+'mon',payload:task._id+'-'+'Block_ACK'+'-'+task.rate+'-'+task.infusedVolume+'-'+task.timeRemaining+'-'+task.totalVolume+'-'+task.devicecharge});
      socket.emit('publish', {topic:task.topic+'staAck',payload:'STA_ACK'});

    }
    else if(task.infusionstatus == 'Rate_Err'){
      console.log(task);
      socket.emit('publish', {topic:task.topic+'mon',payload:task._id+'-'+'Rate_Err_ACK'+'-'+task.rate+'-'+task.infusedVolume+'-'+task.timeRemaining+'-'+task.totalVolume+'-'+task.devicecharge});
      socket.emit('publish', {topic:task.topic+'staAck',payload:'STA_ACK'});

    }

    else if(task.infusionstatus == 'Complete'){
      socket.emit('publish', {topic:task.topic+'mon',payload:task._id+'-'+task.infusionstatus+'_ACK'+'-'+task.rate+'-'+task.infusedVolume+'-'+task.timeRemaining+'-'+task.totalVolume+'-'+task.devicecharge});
      socket.emit('publish', {topic:task.topic+'staAck',payload:'STA_ACK'});

    }
    

  };



//add task functions and variables
$scope.showAddtask = function(ev) {
  $mdDialog.show({
    contentElement: '#myDialog',
    parent: angular.element(document.body),
    targetEvent: ev,
    clickOutsideToClose: true
  });
};
$scope.tasktimes=[{disp:'12 AM',val:0},{disp:'1 AM',val:1},{disp:'2 AM',val:2},{disp:'3 AM',val:3},{disp:'4 AM',val:4},{disp:'5 AM',val:5},{disp:'6 AM',val:6}
,{disp:'7 AM',val:7},{disp:'8 AM',val:8},{disp:'9 AM',val:9},{disp:'10 AM',val:10},{disp:'11 AM',val:11},{disp:'12 PM',val:12},{disp:'1 PM',val:13},{disp:'2 PM',val:14}
,{disp:'3 PM',val:15},{disp:'4 PM',val:16},{disp:'5 PM',val:17},{disp:'6 PM',val:18},{disp:'7 PM',val:19},{disp:'8 PM',val:20},{disp:'9 PM',val:21},{disp:'10 PM',val:22},{disp:'11 PM',val:23}];

$scope.beds = [];
$scope.nobed=false;
//function called on page load gives all the stations associated with the user to frontend
Home.viewBed().then(function (data) {
  if(data.data.success){
    $scope.beds=data.data.beds;

  }
  else{
    $scope.nobed=true;

  }
});
$scope.cancelAddTask=function () {
  $route.reload('/');
}
$scope.addTask = function (ipdata) {
  Home.addTask(ipdata).then(function (data) {
    if(data.data.success){
      $route.reload('/');
    }
  })

}



//show task details on click
$scope.showDetails= function(ev,task) {
              $mdDialog.show ({
                locals: { task: task},
                targetEvent: ev,
                 clickOutsideToClose: true,
                 scope: $scope,        
                 preserveScope: true,           
                 template:
           '      <md-dialog layout="column" layout-align="center center">'+
'                  <div class="md-subhead">Type :{{task.type}}</div>'+
'                  <div class="md-subhead">Time :{{task.timeampm}}</div>'+
'                  <md-divider></md-divider>'+
'                  <div class="md-headline">Patient Details</div>'+
'                  <div class="md-subhead">Patient :{{task._patient.patientname}}</div>'+
'                  <div class="md-subhead">Age :{{task._patient.patientage}}</div> '+
'                  <div class="md-subhead">Weight :{{task._patient.patientweight}}</div> '+
'                  <md-divider></md-divider>'+
'                  <div class="md-headline">Medication Details</div>'+
'                  <div class="md-subhead">Medication :{{task._medication.medicinename}}</div>'+
'                  <div class="md-subhead">Rate :{{task._medication.medicinerate}} ml/hr</div> '+
'                  <div class="md-subhead">Volume :{{task._medication.medicinevolume}} ml</div> '+
'              </md-dialog> ',
                 controller: function DialogController($scope, $mdDialog,task) {
                  $scope.task = task;
                    $scope.closeDialog = function() {
                       $mdDialog.hide();
                    }
                 }
             })

           };




});
 