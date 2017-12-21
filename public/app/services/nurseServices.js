angular.module('nurseServices',['authServices'])
.factory('Nurse',function ($http,AuthToken) {
	nurseFactory={};

	nurseFactory.viewStation = function () {
		return $http.post('/api/nurse/viewstation');
	}
	nurseFactory.setStation = function (selectstationData) {
		//updating token with selected station
		return $http.post('/api/nurse/setstation',selectstationData).then(function (data) {
			console.log(data);
		AuthToken.setToken(data.data.token);
		return data;
	});
	}      
	return nurseFactory;
});