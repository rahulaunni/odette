var express = require('express');
var User = require('../models/users');
var jwt = require('jsonwebtoken');
var secret = 'lauraiswolverinesdaughter';
var nodemailer = require('nodemailer');

module.exports = function(router) {

//route to resgister new user
router.post('/register', function(req,res){
	//creater user object by fetching values from req.body
	var user = new User();
	user.hospitalName = req.body.hospitalName;
	user.userName = req.body.email;
	user.password = req.body.password;
	//tempToken is used for verification purpose of email
	user.tempToken = jwt.sign({username:user.userName,hospitalname:user.hospitalName},secret,{expiresIn:'24h'});
	//saving user to database
	user.save(function(err){
		if (err) {
			//responding error back to frontend
			res.json({success:false,message:'User already exist'});
		}
		else{
			//nodemailer config
			var transporter = nodemailer.createTransport({
			  service: 'gmail',
			  auth: {
			    user: 'dripocare@gmail.com', 
			    pass: '3v3lab5.co'
			  }
			});
			//to get the host
			var host=req.get('host');
			//link for the mail for activation of account
			var link="http://"+req.get('host')+"/activate/"+user.tempToken; 
			//activation mail object
			var mailOptions = {
			  from: 'dripocare@gmail.com',
			  to: user.userName,
			  subject: 'Verification Link For Evelabs.care',
			html : "Hello "+user.userName+",<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
			};
			transporter.sendMail(mailOptions, function (err, info) {
			   if(err)
			     console.log(err)
			   else
			     console.log(info);
			});

			res.json({success:true,message:'A verification mail has been sent to your email'});
		}
	});	
});

//user login route
router.post('/login',function (req,res) {
	//finding user from database
	User.findOne({userName:req.body.username}).select('userName hospitalName password active').exec(function (err,user) {
		if(err) throw err;
		//if no user found resond with no user found error message
		if(!user){
			res.json({success:false,message:"No user found"});
		}
		//if user found checking for password match
		else if(user){
			var validPassword = user.comparePassword(req.body.password);
			if (!validPassword){
				res.json({success:false,message:"Wrong password"});
			}
			//if password matches check whether user has an active account
			else if(!user.active){
				res.json({success:false,message:"Account is not yet activated",expired:true});
			}
			else{
				//successful login and passing a token to the user for login
				var token = jwt.sign({username:user.userName,hospitalname:user.hospitalName},secret,{expiresIn:'24h'});
				res.json({success:true,message:"Authentication success",token:token});

			}

		}
		
	});
});

router.post('/resend',function (req,res) {
	User.findOne({userName:req.body.username}).select('userName password active').exec(function (err,user) {
		if(err) throw err;
		if(!user){
			res.json({success:false,message:"No user found"});
		}
		else if(user){
			var validPassword = user.comparePassword(req.body.password);
			if (!validPassword){
				res.json({success:false,message:"Wrong password"});
			}
			else if(user.active){
				res.json({success:false,message:"Account is already active"});
			}
			else{
				res.json({ success: true, user: user });

			}

		}
		
	});
});

// Route to send user a new activation link once credentials have been verified
router.put('/resend', function(req, res) {
	User.findOne({ userName: req.body.username }).select('userName hospitalName tempToken').exec(function(err, user) {
		if (err) throw err; // Throw error if cannot connect
		user.tempToken = jwt.sign({username:user.userName,hospitalname:user.hospitalName},secret,{expiresIn:'24h'});
		user.password = req.body.password;
		// Save user's new token to the database
		user.save(function(err) {
			if (err) {
				console.log(err);
				res.json({success:false,message:'Failed to send activation link, Try after sometime'})
			} else {
				// If user successfully saved to database, create e-mail object
				var transporter = nodemailer.createTransport({
				  service: 'gmail',
				  auth: {
				    user: 'dripocare@gmail.com', 
				    pass: '3v3lab5.co'
				  }
				});
				var host=req.get('host');
				var link="http://"+req.get('host')+"/activate/"+user.tempToken; 
				var mailOptions = {
				  from: 'dripocare@gmail.com',
				  to: user.userName,
				  subject: 'Verification Link For Evelabs.care',
				html : "Hello "+user.userName+",<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
				};
				transporter.sendMail(mailOptions, function (err, info) {
				   if(err)
				     console.log(err)
				   else
				     console.log(info);
				});
				res.json({ success: true, message: 'Activation link has been sent to ' + user.userName + '!' }); // Return success message to controller
			}
		});
	});
});


// Route to send reset link to the user
router.put('/forgotpassword', function(req, res) {
	User.findOne({ userName: req.body.username }).select('userName active resetToken ').exec(function(err, user) {
		if (err) throw err; // Throw error if cannot connect
		if (!user) {
			res.json({ success: false, message: 'Username was not found' }); // Return error if username is not found in database
		} else if (!user.active) {
			res.json({ success: false, message: 'Account has not yet been activated' }); // Return error if account is not yet activated
		} else {
			user.resetToken = jwt.sign({username:user.userName,hospitalname:user.hospitalName},secret,{expiresIn:'24h'}); // Create a token for activating account through e-mail
			// Save token to user in database
			user.save(function(err) {
				console.log(user);
				if (err) {
					res.json({ success: false, message: err }); // Return error if cannot connect
				} else {
					var transporter = nodemailer.createTransport({
					  service: 'gmail',
					  auth: {
					    user: 'dripocare@gmail.com', 
					    pass: '3v3lab5.co'
					  }
					});
					var host=req.get('host');
					var link="http://"+req.get('host')+"/resetpassword/"+user.resetToken; 
					var mailOptions = {
					  from: 'dripocare@gmail.com',
					  to: user.userName,
					  subject: 'Password reset link for Evelabs.care',
					html : "Hello "+user.userName+",<br> Please Click on the link to reset your Evelabs.care account password.<br><a href="+link+">Click here to verify</a>" 
					};
					transporter.sendMail(mailOptions, function (err, info) {
					   if(err)
					     console.log(err)
					   else
					     console.log(info);
					});
					
					res.json({ success: true, message: 'Please check your e-mail for password reset link' }); // Return success message
				}
			});
		}
	});
});

router.get('/resetpassword/:token', function(req, res) {
	User.findOne({ resetToken: req.params.token }, function(err, user) {
		if (err) throw err; // Throw error if cannot login
		var token = req.params.token; // Save the token from URL for verification 

		// Function to verify the user's token
		jwt.verify(token, secret, function(err, decoded) {
			if (err) {
				res.json({ success: false, message: 'Password reset link has expired' }); // Token is expired
			} else if (!user) {
				res.json({ success: false, message: 'Password reset link has expired' }); // Token may be valid but does not match any user in the database
			} else {
				res.json({ success: true, user:user}); // Return success message to controller
			}
		});
	});
	
});

router.put('/savepassword', function(req, res) {
	User.findOne({userName: req.body.username}).select('userName password resetToken').exec(function(err, user) {
		if (err) throw err; // Throw error if cannot connect
		console.log(req.body);
		console.log(user);
		user.password = req.body.password;
		user.resetToken = false;
		user.save(function(err) {
			if (err) {
				console.log(err);
				res.json({success:false,message:'Failed to connect to database'})
			} else {
				// If user successfully saved to database, create e-mail object
				var transporter = nodemailer.createTransport({
				  service: 'gmail',
				  auth: {
				    user: 'dripocare@gmail.com', 
				    pass: '3v3lab5.co'
				  }
				});
				var host=req.get('host');
				var link="http://"+req.get('host')+"/login"; 
				var mailOptions = {
				  from: 'dripocare@gmail.com',
				  to: user.userName,
				  subject: 'Password reset successfull',
				html : "Hello "+user.userName+",<br>You have successfully reset your password <br><a href="+link+">Click here to login</a>" 
				};
				transporter.sendMail(mailOptions, function (err, info) {
				   if(err)
				     console.log(err)
				   else
				     console.log(info);
				});
				res.json({ success: true, message: 'Your password changed successfully'}); 
			}
		});
	});
});

router.put('/activate/:token', function(req, res) {
	User.findOne({ tempToken: req.params.token }, function(err, user) {
		if (err) throw err; // Throw error if cannot login
		var token = req.params.token; // Save the token from URL for verification 

		// Function to verify the user's token
		jwt.verify(token, secret, function(err, decoded) {
			if (err) {
				res.json({ success: false, message: 'Activation link has expired.' }); // Token is expired
			} else if (!user) {
				res.json({ success: false, message: 'Activation link has expired.' }); // Token may be valid but does not match any user in the database
			} else {
				user.tempToken = false; // Remove temporary token
				user.active = true; // Change account status to Activated
				// Mongoose Method to save user into the database
				user.save(function(err) {
					if (err) {
						console.log(err); // If unable to save user, log error info to console/terminal
					} else {
						var transporter = nodemailer.createTransport({
						  service: 'gmail',
						  auth: {
						    user: 'dripocare@gmail.com', 
						    pass: '3v3lab5.co'
						  }
						});
						// If save succeeds, create e-mail object
						var mailOptions = {
							from: 'dripocare@gmail.com',
							to: user.userName,
							subject: 'Evelabs.care Account Activated',
							text: 'Hello ' + user.userName + ', Your account has been successfully activated!',
							html: 'Hello<strong> ' + user.userName + '</strong>,<br><br>Your account has been successfully activated!'
						};

						// Send e-mail object to user
						transporter.sendMail(mailOptions, function (err, info) {
						   if(err)
						     console.log(err)
						   else
						     console.log(info);
						});
						res.json({ success: true, message: 'Account activated!' }); // Return success message to controller
					}
				});
			}
		});
	});
	
});

router.use(function (req,res,next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if(token){
		//verify token
		jwt.verify(token, secret, function(err, decoded) {
			if(err){
				res.json({success:false,message:"Invalid Token"});
			}
			else{
				req.decoded=decoded;
				next();
			}
		});
	}
	else{
		res.json({success:false,message:"No token provided"})
	}
});

router.post('/user',function (req,res) {
	res.send(req.decoded);
});
//Routes after authentication;

//routes for returning permission of user
router.get('/permission',function (req,res) {
	User.findOne({userName:req.decoded.username}).exec(function (err,user) {
		if(err) throw err;
		//if no user found resond with no user found error message
		if(!user){
			res.json({success:false,message:"No user found"});
		}
		else{
			res.json({success:true,permission:user.permission});
		}

		});
});
//route to add a new user by admin
router.post('/admin/adduser', function(req,res){
		var user = new User();
		user.hospitalName = req.decoded.hospitalname;
		user.userName = req.body.username+'@'+req.decoded.hospitalname+'.care';
		user.password = req.body.password;
		user.permission = req.body.permission;
		user.active = true;
		user._admin = req.decoded.username;
		user.tempToken = false;
		// saving user to database
		user.save(function(err){
			if (err) {
				console.log(err);
				//responding error back to frontend
				res.json({success:false,message:'User already exist'});
			}
			else{

				res.json({success:true,message:'User added'});
			}
	});
});
//route for fetching all the user details to the admin view
router.post('/admin/viewuser', function(req,res){
	User.find({_admin: req.decoded.username}).select('userName  permission').exec(function(err, user) {	
			if (err) {
				console.log(err);
				//responding error back to frontend
				res.json({success:false,message:'No users found'});
			}
			else{

				res.json({success:true,message:'User found',users:user});
			}
	});
});

//route to delete an user from database
router.post('/admin/deleteuser', function(req,res){
	User.remove({userName:req.body.userName},function (err) {
		if(err){
			console.log(err);
		}
		else{
			res.json({success:true,message:"User removed successfully"});
		}
	})
});


return router;
}