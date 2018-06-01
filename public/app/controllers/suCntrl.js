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

$scope.noinfs =false;
$scope.infs={};
	$scope.getData = function (synapse) {
		var day = synapse.date.getDate()+'/'+(synapse.date.getMonth()+1)+'/'+synapse.date.getFullYear();
		synapse.day=day;
		Su.getInfdetails(synapse).then(function (data) {
			console.log(data.data);
			if(data.data.success){
				$scope.infs=data.data.infs;
				$scope.noinfs =false;
			}
			else{
				$scope.noinfs =true;

			}
		})
	}

	$scope.toggleView = false;
	$scope.showInfusionDetails = function (id,tv) {
		if(tv == false){
			$scope.toggleView = true;
			var target = angular.element('#'+id);
			target.css('display','block');
		}
		else{
			$scope.toggleView = false;
			var target = angular.element('#'+id);
			target.css('display','none');
		}


	}


});