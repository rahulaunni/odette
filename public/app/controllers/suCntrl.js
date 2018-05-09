angular.module('suController',['suServices'])
.controller('suCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Su) {
	$scope.infos={};
	Su.viewSynapse().then(function (data) {
		if(data.data.success){
			$scope.infos = data.data.synapses;

		}
		else{
			$scope.infos = data.data.message;
		}
		
	})

});
