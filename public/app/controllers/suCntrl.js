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

})

.controller('suAnalysisCntrl',function ($http,$window,$location,$timeout,$mdDialog,$scope,Su) {
	$scope.synapses={}
	$scope.nosynapse = false;
	Su.getHostname().then(function (data) {
		if(data.data.success){
			$scope.synapses = data.data.synapses;
			$scope.nosynapse = false;
		}
		else{
			$scope.synapses = {};
			$scope.nosynapse = true;
		}
	});
	$scope.getData = function (synapse) {
		console.log(synapse);
	}



});