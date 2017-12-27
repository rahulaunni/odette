var express = require('express');
var User = require('../models/users');
var Station = require('../models/stations');
var Bed = require('../models/beds');
var Ivset = require('../models/ivsets');
var Dripo = require('../models/dripos');
var Patient = require('../models/patients');
var jwt = require('jsonwebtoken');
var secret = 'lauraiswolverinesdaughter';
var nodemailer = require('nodemailer');
var ObjectId = require('mongodb').ObjectID;

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
	User.findOne({userName:req.body.username}).select('userName _id hospitalName password active').exec(function (err,user) {
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
				var token = jwt.sign({username:user.userName,hospitalname:user.hospitalName,uid:user._id},secret);
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




//middleware to get all the details decoded from the token
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
				User.find({userName:req.decoded.username}).exec(function (err,user) {
					req.decoded.admin = user[0]._admin;
					next();
				});
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
//***routes for local users management starts from here***
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
			if (err) throw err;
			if(!user.length){
				res.json({success:false,message:'Add user and start Managing'});
			}
			else{

				res.json({success:true,message:'User found',users:user});
			}
	});
});

//route to delete an user from database
router.post('/admin/deleteuser', function(req,res){
	User.remove({_id:req.body._id},function (err) {
		if(err){
			console.log(err);
		}
		else{
			res.json({success:true,message:"User removed successfully"});
		}
	})
});

router.put('/admin/savelocalpassword', function(req, res) {
	User.findOne({_id:req.body._id}).select('userName password resetToken').exec(function(err, user) {
		if (err) throw err; // Throw error if cannot connect
		user.password = req.body.password;
		user.save(function(err) {
			if (err) {
				console.log(err);
				res.json({success:false,message:'Failed to connect to database'})
			} else {
				res.json({ success: true, message: 'Your password changed successfully'}); 
			}
		});
	});
});

//***routes for station management starts here***
router.post('/admin/addstation',function (req,res) {
	//to make sure unique station name for each admin
	Station.findOne({stationname: req.body.stationname,username:req.decoded.username}).exec(function(err,station) {
		if (err) throw err;
		if(!station){
				var station = new Station();
				station.stationname = req.body.stationname;
				station.username = req.decoded.username;
				station._user = ObjectId(req.decoded.uid);
				// saving user to database
				station.save(function(err){
					if (err) {
						console.log(err);
						//responding error back to frontend
						res.json({success:false,message:'Data Base error try after sometimes'});
					}
					else{

						res.json({success:true,message:'Station added'});
					}
			});
		}
		else{
			res.json({success:false,message:'You have already added this station name'})
		}

	});

});

//route for fetching all the station details to the admin view
router.post('/admin/viewstation', function(req,res){
	Station.find({username: req.decoded.username}).exec(function(err, station) {	
			if (err) throw err;
			if(!station.length){
				res.json({success:false,message:'Add Stations and Start Managing'});
			}
			
			else{

				res.json({success:true,message:'Station found',stations:station});
			}
	});
});

//route to delete a station from database
router.post('/admin/deletestation', function(req,res){
	Station.remove({_id:req.body._id},function (err) {
		if(err){
			console.log(err);
		}
		else{
			res.json({success:true,message:"Station removed successfully"});
		}
	})
});

router.put('/admin/editstation',function (req,res) {
	Station.findOne({stationname: req.body.stationname,username:req.decoded.username}).exec(function(err,station) {
		if (err) throw err;
		if(!station){
			Station.findOne({_id:req.body._id}).select('stationname').exec(function(err,oldstation) {
			oldstation.stationname=req.body.stationname;
			oldstation.save(function (err) {
				if(err) throw err;
				else{
					res.json({success:true,message:'Station name updated',stations:station});
				}
			});
		});
		}
		else{
			res.json({success:false,message:'You have already added this station name'})
		}

	});
});
//routes for bed management starts from here
router.post('/admin/addbed',function (req,res) {
	var bedArray = [];
	var beds = req.body.bedname;
	var bedArray = beds.split(",");
	var bedObjArray=[{}];

	for (var key in bedArray){
		var bedObj={};
		bedObj.bedname=bedArray[key];
		bedObj.username=req.decoded.username;
		bedObj.stationname=req.body.stationname;
		bedObj._user = ObjectId(req.decoded.uid);
		bedObj.status = 'unoccupied'
		bedObjArray[key] = bedObj;
	}

	Bed.collection.insert(bedObjArray, onInsert);
	    function onInsert(err,docs){
	    	if(err){
	    		console.log(err);
	    		res.json({success:false,message:'Data Base error try after sometimes'});
	    	} 
	    	else{
	    		res.json({success:true,message:'Bed added'});

	    	}
	    }

});

//route for fetching all the bed details to the admin view
router.post('/admin/viewbed', function(req,res){
	Bed.find({username: req.decoded.username}).exec(function(err, bed) {	
			if (err) throw err;
			if(!bed.length){
				res.json({success:false,message:'Add Beds and Start Managing'});
			}
			
			else{

				res.json({success:true,message:'Bed found',beds:bed});
			}
	});
});

//route to delete a bed from database
router.post('/admin/deletebed', function(req,res){
	Bed.remove({_id: req.body._id},function (err) {
		if(err){
			console.log(err);
		}
		else{
			res.json({success:true,message:"Station removed successfully"});
		}
	})
});

//edit bed route
router.put('/admin/editbed',function (req,res) {
	console.log(req.body);
	Bed.findOne({_id: req.body._id}).select('bedname').exec(function(err,bed) {
		if (err) throw err; // Throw error if cannot connect
		bed.bedname= req.body.bedname;
		bed.save(function(err) {
			if (err) {
				console.log(err);
				res.json({success:false,message:'Failed to connect to database'})
			} else {
				res.json({ success: true, message: 'Bed name updated'}); 
			}
		});
	});
});

//***routes for ivset management strats here***
//route to add a new ivset by admin
router.post('/admin/addivset', function(req,res){
		var ivset = new Ivset();
		ivset.ivsetname = req.body.ivsetname;
		ivset.ivsetdpf = req.body.ivsetdpf;
		ivset.username = req.decoded.username;
		ivset._user = ObjectId(req.decoded.uid)
		// saving user to database
		ivset.save(function(err){
			if (err) {
				console.log(err);
				//responding error back to frontend
				res.json({success:false,message:'Database error'});
			}
			else{

				res.json({success:true,message:'Ivset added'});
			}
	});
});

//route for fetching all the ivset details to the admin view
router.post('/admin/viewivset', function(req,res){
	Ivset.find({username: req.decoded.username}).exec(function(err, ivset) {	
			if (err) throw err;
			if(!ivset.length){
				res.json({success:false,message:'Add Ivset and Start Managing'});
			}
			
			else{

				res.json({success:true,message:'Ivset found',ivsets:ivset});
			}
	});
});

//route to delete a ivset from database
router.post('/admin/deleteivset', function(req,res){
	Ivset.remove({_id:req.body._id},function (err) {
		if(err){
			console.log(err);
		}
		else{
			res.json({success:true,message:"Ivset removed successfully"});
		}
	})
});

//edit ivset route
router.put('/admin/editivset',function (req,res) {
	console.log(req.body);
	Ivset.findOne({_id:req.body._id}).select('ivsetname ivsetdpf').exec(function(err,ivset) {
		console.log(ivset);
		if (err) throw err; // Throw error if cannot connect
		ivset.ivsetname= req.body.ivsetname;
		ivset.ivsetdpf= req.body.ivsetdpf;
		ivset.save(function(err) {
			if (err) {
				console.log(err);
				res.json({success:false,message:'Failed to connect to database'})
			} else {
				res.json({ success: true, message: 'Ivset details updated'}); 
			}
		});
	});
});

//***routes for dripo management starts here***
//routes for adding dripos
router.post('/admin/adddripo',function (req,res) {
	var dripoArray = [];
	var dripos = req.body.dripoid;
	var dripoArray = dripos.split(",");
	var dripoObjArray=[{}];
	for (var key in dripoArray){
		var dripoObj={};
		dripoObj.dripoid=dripoArray[key];
		dripoObj.username=req.decoded.username;
		dripoObj.stationname=req.body.stationname;
		dripoObj._user = ObjectId(req.decoded.uid);
		dripoObjArray[key] = dripoObj;
	}

	Dripo.collection.insert(dripoObjArray, onInsert);
	    function onInsert(err,docs){
	    	if(err){
	    		console.log(err);
	    		res.json({success:false,message:'Data Base error try after sometimes'});
	    	} 
	    	else{
	    		res.json({success:true,message:'Dripo added'});

	    	}
	    }

});

//route for fetching all the dripo details to the admin view
router.post('/admin/viewdripo', function(req,res){
	Dripo.find({username: req.decoded.username}).exec(function(err, dripo) {	
			if (err) throw err;
			if(!dripo.length){
				res.json({success:false,message:'Add Ivset and Start Managing'});
			}
			
			else{

				res.json({success:true,message:'Dripo found',dripos:dripo});
			}
	});
});

//route to delete a dripo from database
router.post('/admin/deletedripo', function(req,res){
	Dripo.remove({_id:req.body._id},function (err) {
		if(err){
			console.log(err);
		}
		else{
			res.json({success:true,message:"Dripo removed successfully"});
		}
	})
});

//route for edit dripo
router.put('/admin/editdripo',function (req,res) {
	Dripo.findOne({dripoid: req.body.dripoid,username:req.decoded.username}).exec(function(err,dripo) {
		if (err) throw err;
		if(!dripo){
			Dripo.findOne({_id:req.body._id}).select('stationname dripoid').exec(function(err,olddripo) {
			olddripo.stationname=req.body.stationname;
			olddripo.dripoid = req.body.dripoid;
			olddripo.save(function (err) {
				if(err) throw err;
				else{
					res.json({success:true,message:'Dripo details updated'});
				}
			});
		});
		}
		else{
			res.json({success:false,message:'You have already added this Dripo'})
		}

	});
});

//route to provide all the details needed for admin home page
router.post('/admin/getdetails', function(req,res){
	User.find({_admin:req.decoded.username}).exec(function (err,alluser) {
		if (err)	throw err;
		var totaluser = alluser.length;
		User.find({_admin:req.decoded.username,permission:'nurse'}).exec(function (err,nurseuser) {
			if(err) throw err;
			var totalnurse = nurseuser.length;
			User.find({_admin:req.decoded.username,permission:'doctor'}).exec(function (err,doctoruser) {
				var totaldoctor = doctoruser.length;
				Station.find({username: req.decoded.username}).exec(function(err, station) {
					if (err)	throw err;
					totalstation = station.length;
					Bed.find({username: req.decoded.username}).exec(function(err, bed) {
						totalbed = bed.length;
						Ivset.find({username: req.decoded.username}).exec(function(err, ivset) {
							totalivset = ivset.length;
							Dripo.find({username: req.decoded.username}).exec(function(err, dripo) {
								totaldripo = dripo.length;
								res.json({success:true,totaluser:totaluser,totalnurse:totalnurse,totaldoctor:totaldoctor,
								totalstation:totalstation,totalbed:totalbed,totalivset:totalivset,totaldripo:totaldripo});
							});
						});

						
					});
					
				});
			});

		});

	});

});

//***routes for nurse starts from here***
//route for fetching all the station details for nurse to select station
router.post('/nurse/viewstation', function(req,res){
	Station.find({username: req.decoded.admin}).exec(function(err, station) {	
			if (err) throw err;
			if(!station.length){
				res.json({success:false,message:'No stations found, Contact admin'});
			}
			
			else{

				res.json({success:true,message:'Station found',stations:station});
			}
	});
});
//route to set new token including the user selected station
router.post('/nurse/setstation', function(req,res){
	var token = jwt.sign({username:req.decoded.username,hospitalname:req.decoded.hospitalname,uid:req.decoded.uid,station:req.body.stationname},secret);
	res.json({success:true,message:"token updated",token:token});	
});

//route for fetching all the bed details to nurse while adding patient
router.post('/nurse/viewbed', function(req,res){
	Bed.find({username: req.decoded.admin,stationname:req.decoded.station,status:'unoccupied'}).exec(function(err,bed) {	
		if (err) throw err;
		if(!bed.length){
			res.json({success:false,message:'No bed found, Contact admin'});
		}
			
		else{

			res.json({success:true,message:'Station found',beds:bed});
		}
	});
});

//route for fetching all the doctor accout details to nurse while adding patient
router.post('/nurse/viewdoctor', function(req,res){
	User.find({_admin: req.decoded.admin,permission:'doctor'}).exec(function(err,doctor) {	
		if (err) throw err;
		if(!doctor.length){
			res.json({success:false,message:'No doctor found, Contact admin'});
		}
			
		else{

			res.json({success:true,message:'Doctor found',doctors:doctor});
		}
	});
});

//route for saving patient personal and other detaills, also change the bed status to occupied
router.post('/nurse/addpatient', function(req,res){
	var patient = new Patient();
	patient.patientname= req.body.patientname;
	patient.patientage= req.body.patientage;
	patient.patientweight= req.body.patientweight;
	patient.patientstatus = 'active';
	patient.bedname = req.body.bedname;
	patient.doctor = req.body.doctor;
	patient.admittedon = req.body.admittedon;
	patient.stationname = req.decoded.station;
	patient._admin = req.decoded.admin;
	// saving user to database
	patient.save(function(err){
		if (err) {
			console.log(err);
			//responding error back to frontend
			res.json({success:false,message:'Database error'});
		}
		else{
			Bed.findOne({username: req.decoded.admin,bedname: req.body.bedname,stationname:req.decoded.station}).exec(function(err, bed) {
				if (err) return handleError(err);
				console.log(bed);
				bed.status = 'occupied';
				bed.save(function (err) {
					if(err) throw err;
					else{
						res.json({success:true,message:'Patient added and bed status updated'});
					}
				});

			});
		}
});

});


return router;
}