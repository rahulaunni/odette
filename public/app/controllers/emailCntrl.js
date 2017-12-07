angular.module('emailController',['userServices'])
.controller('emailCntrl',function ($routeParams,$timeout,$location,User) {

	var app = this;

	User.activateAccount($routeParams.token).then(function(data) {
		app.successMsg = false;
		app.errorMsg = false;
		if(data.data.success){
			app.successMsg = data.data.message;
			$timeout(function () {
				$location.path('/login')
			},3000);
		}
		else{
			app.errorMsg = data.data.message;

		}

	})

})

.controller('resendCntrl', function(User,$timeout,$location) {
	app=this;

	app.checkCredentials = function (loginData) {
		app.loader=true;
		app.successMsg = false;
		app.errorMsg = false;
		User.checkCredentials(app.loginData).then(function (data) {
			if(data.data.success){
				// Custom function that sends activation link
				User.resendLink(app.loginData).then(function(data) {
				    // Check if sending of link is successful
				    if (data.data.success) {
				    	app.loader=false;
				        app.successMsg = data.data.message; // If successful, grab message from JSON object
				    } else {
				    	app.loader=false;
				        app.errorMsg = data.data.message; // If not successful, grab message from JSON object
				    }
				});

				$timeout(function () {
					$location.path('/login')
				},3000);

			}
			else{
				app.errorMsg = data.data.message;
				app.loader=false;

			}

		});
	};

})

// Controller: passwordCtrl is used to send a password reset link to the user
.controller('passwordCntrl', function(User) {

    app = this;

    // Function to send reset link to e-mail associated with username
    this.sendPassword = function(resetData) {
        app.errorMsg = false; // Clear errorMsg
        app.successMsg = false; // Clear errorMsg
        app.loader = true; // Start loading icon
        // Runs function to send reset link to e-mail associated with username
        User.sendPassword(this.resetData).then(function(data) {
            app.loader = false; // Stop loading icon
            // Check if reset link was sent
            if (data.data.success) {
                app.successMsg = data.data.message; // Grab success message from JSON object
            } else {
                app.errorMsg = data.data.message; // Grab error message from JSON object
            }
        });

     }   
})

.controller('passwordrstCntrl',function (User) {
	// body...
});