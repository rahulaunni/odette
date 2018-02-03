/*
___      ___    __    __   ______    ____
| |	    / _  \  | |   } ) (      )  / __ \
| |    / /  \ \ | |   } | | ()  /  / /  \ |
| |___||___  | || |___} | |  |\  \ | |__| |
|_____|||   |__||______.) |__  \__\[__  [__]
 Version: 1.0.0 (dev)
  Author: rahuanni@evelabs.co
  company: evelabs.co
 Website: http://evelabs.co

 */

var express = require('express');
var User = require('../models/users');
var Station = require('../models/stations');
var Bed = require('../models/beds');
var Ivset = require('../models/ivsets');
var Dripo = require('../models/dripos');
var Patient = require('../models/patients');
var Medication = require('../models/medications');
var Task = require('../models/tasks');
var jwt = require('jsonwebtoken');
var secret = 'lauraiswolverinesdaughter';
var nodemailer = require('nodemailer');
var ObjectId = require('mongodb').ObjectID;
var ip = require('ip');
var request = require('request');

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

//route to get ip adress to admin panel
router.post('/admin/getip', function(req, res) {
	var ipaddress= ip.address();
	res.json({success:true,ip:ipaddress})

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
		if(user.length == 0){
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
	Station.findOne({stationname: req.body.stationname,username:req.decoded.username}).exec(function(err,station) {
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
		bedObj._station = ObjectId(station._id);
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
	Ivset.findOne({_id:req.body._id}).select('ivsetname ivsetdpf').exec(function(err,ivset) {
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
//route to get all connected dripos
router.post('/admin/getconnecteddriponames',function (req,res) {
	request.get('http://localhost:18083/api/v2/nodes/emq@127.0.0.1/clients',function (req,response) {
		var driponames=[];
		var unregDripos=[];
		if(response){
			var recObj=JSON.parse(response.body);
			var clients=recObj.result.objects;
			for(var key in clients){
				var index = clients[key].client_id.search("DRIPO")
				if(index != -1){
					driponames.push(clients[key].client_id)
				}
			}
		}
		else{
			res.json({success:false,message:'Mqtt Server Stopped'});

		}
	for(var key in driponames){
		Dripo.find({dripoid: driponames[key]}).exec(function(err, dripo) {
			if(dripo.length == 0){
				unregDripos.push(driponames[key]);
				res.json({success:true,driponames:unregDripos});
			}
		});	

	}

	});

});

//routes for adding dripos
router.post('/admin/adddripo',function (req,res) {
	Station.findOne({stationname: req.body.stationname,username:req.decoded.username}).exec(function(err,station) {
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
		dripoObj._station = ObjectId(station._id);
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
	Station.find({username: req.decoded.admin,stationname:req.body.stationname}).exec(function(err, station) {
		var token = jwt.sign({username:req.decoded.username,hospitalname:req.decoded.hospitalname,uid:req.decoded.uid,station:req.body.stationname,stationid:station[0]._id},secret);
		res.json({success:true,message:"token updated",token:token});
	});	
		
});

//route for fetching all the bed details to nurse while adding patient
router.post('/nurse/viewbed', function(req,res){
	Bed.find({username: req.decoded.admin,stationname:req.decoded.station,status:'unoccupied'}).exec(function(err,bed) {	
		if (err) throw err;
		if(!bed.length){
			res.json({success:false,message:'No bed found, Contact admin'});
		}
			
		else{

			res.json({success:true,message:'bed found',beds:bed});
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
	patient.doctorname = req.body.doctorname;
	patient.admittedon = req.body.admittedon;
	patient.stationname = req.decoded.station;
	patient._admin = req.decoded.admin;
	// saving user to database
	patient.save(function(err,patient){
		if (err) {
			console.log(err);
			//responding error back to frontend
			res.json({success:false,message:'Database error'});
		}
		else{
			Bed.findOne({username: req.decoded.admin,bedname: req.body.bedname,stationname:req.decoded.station}).exec(function(err, bed) {
				if (err) return handleError(err);
				bed.status = 'occupied';
				bed._patient = patient._id;
				bed.save(function (err) {
					if(err) throw err;
					else{
						Patient.collection.update({_id:patient._id},{$set:{_bed:bed._id}},{upsert:false});
						res.json({success:true,message:'Patient added and bed status updated',patient:patient,bed:bed});
					}
				});

			});
		}
});

});

router.post('/nurse/addmedication', function(req,res){
	var medicationObjArray=[{}];
	var patientid;
	for (var key in req.body) {
		var medicationObj={};
		medicationObj.medicinename = req.body[key].medicinename;
		medicationObj.medicinerate = req.body[key].medicinerate;
		medicationObj.medicinevolume = req.body[key].medicinevolume;
		medicationObj.stationname = req.decoded.station;
		medicationObj._admin = req.decoded.admin;
		medicationObj._bed = ObjectId(req.body[key].bedid);
		medicationObj._patient = ObjectId(req.body[key].patientid);
		medicationObjArray[key] = medicationObj;
		patientid = ObjectId(req.body[key].patientid);
		bedid = ObjectId(req.body[key].bedid);

	}
	//created an array of object med with all details and inserting it into the database  
	Medication.collection.insert(medicationObjArray, onInsert);
	function onInsert(err,docs){
		if(err) throw err;
		else{
			//update patient collection and insert thr refernce of medicine id
			for (var key in medicationObjArray){
				Patient.collection.update({_id:patientid},{$push:{_medication:medicationObjArray[key]._id}},{upsert:false});
			}
			//docs.ops has the data available and req.body.medications[].time has all the time associated with that medicine
			timeObjArray=[{}];
			var counter=0;
			docs.ops.forEach(function callback(currentValue, index, array) {
			    var timeArray=req.body[index].time;
			    //creating an array of object based on the time data
			    for(var j=0;j<timeArray.length;j++)
			    {
			         var timeObj={};
			         timeObj.time=timeArray[j];
			         timeObj.type='infusion';
			         timeObj.priority = 0;
			         timeObj.status='opened';
			         timeObj.createdat=new Date();
			         timeObj.infusedVolume =0;
			         timeObj._patient=patientid;
			         timeObj._bed=bedid;
			         timeObj._medication=currentValue._id;
			         timeObj._station=ObjectId(req.decoded.stationid);
			         timeObjArray[counter]=timeObj;
			         counter++;
			    }
			                            
			});
			Task.collection.insert(timeObjArray, onInsert);
			function onInsert(err,times) {
				if(err) throw err;
				else{
					for (var key in medicationObjArray) 
					{
					    for (var key2 in timeObjArray)
					    if(medicationObjArray[key]._id===timeObjArray[key2]._medication)
					    Medication.collection.update({_id:medicationObjArray[key]._id},{$push:{_task:timeObjArray[key2]._id}},{upsert:false});
					}

				}
			}
		res.json({success:true,message:"medication added successfully"})

		}//end of adding medication success
	}//end of medication insert function

});

//route for fetching all the patient details to nurse 
router.post('/nurse/viewpatient', function(req,res){
	Patient.find({_admin: req.decoded.admin,stationname:req.decoded.station}).exec(function(err,patient) {	
		if (err) throw err;
		if(!patient.length){
			res.json({success:false,message:'No patient found'});
		}
		else{
			res.json({success:true,message:'Patients found',patients:patient});
		}
	});
});

//route for discharging a patient
router.post('/nurse/dischargepatient', function(req,res){
	Patient.collection.update({_id:ObjectId(req.body._id)},{$set:{patientstatus:'discharged'}},{upsert:false});
	Task.collection.remove({_patient:ObjectId(req.body._id)});
	Medication.collection.remove({_patient:ObjectId(req.body._id)});
	res.json({success:true,message:'Patient discharged'});
});

//route for edit patient 
router.put('/nurse/editpatient',function (req,res) {
	//save updated patient info
	Patient.findOne({_id: req.body._id}).exec(function(err,patient) {
		if (err) throw err; // Throw error if cannot connect
		patient.patientname= req.body.patientname;
		patient.patientage= req.body.patientage;
		patient.patientweight= req.body.patientweight;
		patient.bedname= req.body.bedname;
		patient.doctorname= req.body.doctorname;
		patient.admittedon= req.body.admittedon;
		patient.save(function(err) {
			if (err) {
					console.log(err);
					res.json({success:false,message:'Failed to connect to database'})
				} 
			else {	
					//update bed and medication if there is an bed chanege
					if(req.body.oldbed !== req.body.bedname){
						Bed.findOne({username: req.decoded.admin,bedname: req.body.bedname,stationname:req.decoded.station}).exec(function(err, bed) {
							if (err) return handleError(err);
							bed.status = 'occupied';
							bed._patient = patient._id;
							bed.save(function (err) {
								if(err) throw err;
								else{
									Bed.findOne({username: req.decoded.admin,bedname: req.body.oldbed,stationname:req.decoded.station}).exec(function(err, oldbed) {
										oldbed.status='unoccupied';
										oldbed._patient = null;
										oldbed.save(function (err) {
											if(err) throw err;
											else{
												Task.collection.updateMany({_bed:ObjectId(oldbed._id)},{$set:{_bed:bed._id}},{upsert:false});
												Patient.collection.update({_bed:ObjectId(oldbed._id)},{$set:{_bed:bed._id}},{upsert:false});
												Medication.collection.updateMany({_bed:ObjectId(oldbed._id)},{$set:{_bed:bed._id}},{upsert:false});
												res.json({success:true,message:'Patient details updated'});

											}
										});
				
									});

									}
							});
						});
					}
					else{
						res.json({success:true,message:'Patient details updated with no bed change'})
					}
				
				}
			});
		});
});

//route for retrieve medication data and serve to edit medication page
router.post('/nurse/editmedication', function(req,res){
	var editchoices=[{}];
	Medication.find({_bed:req.body._bed}).populate({path:'_task',model:'Task'}).exec(function (err,medication) {
		for (var key in medication) {
			var editchoicesObj={};
			editchoicesObj.medicineid = medication[key]._id;
			editchoicesObj.patientid = medication[key]._patient;
			editchoicesObj.bedid = medication[key]._bed;
			editchoicesObj.medicinename = medication[key].medicinename;
			editchoicesObj.medicinerate = medication[key].medicinerate;
			editchoicesObj.medicinevolume = medication[key].medicinevolume;
			editchoicesObj.time=[];
			for(var key2 in medication[key]._task){
				if(medication[key]._task[key2].time){
					editchoicesObj.time.push(medication[key]._task[key2].time);
				}
			}
			editchoices[key] = editchoicesObj;
		}
		res.json({success:true,message:'medication details retrieved',medication:editchoices})

	});
});
//route to update medication edits
router.put('/nurse/editmedication', function(req,res){
	var patientid = ObjectId(req.body[0].patientid);
	var bedid = ObjectId(req.body[0].bedid);
	Medication.find({_patient:req.body[0].patientid}).populate({path:'_task',model:'Task'}).exec(function (err,medication) {
		//divide the request body as already existing medicine and new medicine
		newmedicine = [];  
		oldmedicine = [];
		for(var key1 in req.body){
			if(req.body[key1].medicineid == 'new'){
				newmedicine.push(req.body[key1]);
			}
			else{
				oldmedicine.push(req.body[key1]);
			}

		}
		//finding medicine ids for delete
		editmedicineids = [];
		editmedication = [];
		deletemedicineids = [];
		for(lp1=0;lp1<medication.length;lp1++){
			for(lp2=0;lp2<oldmedicine.length;lp2++){
				if(medication[lp1]._id.toString() == oldmedicine[lp2].medicineid){
					editmedicineids.push(medication[lp1]._id)
					editmedication.push(medication[lp1])
					break;
				}
				if(lp2==(oldmedicine.length-1))
				{
				    deletemedicineids.push(medication[lp1]._id);
				}

			}
		}//end of find medicine ids for deletion
		//edit existing medicines
		for(lp1=0;lp1<oldmedicine.length;lp1++){
			Medication.collection.update({_id:ObjectId(oldmedicine[lp1].medicineid)},{$set:
				{medicinename:oldmedicine[lp1].medicinename,
				medicinerate:oldmedicine[lp1].medicinerate,medicinevolume:oldmedicine[lp1].medicinevolume}},{upsert:false});
			if(editmedication[lp1]._task.length != 0 ){
				for(lp2=0;lp2<oldmedicine[lp1].time.length;lp2++){
					for(lp3=0;lp3<editmedication[lp1]._task.length;lp3++){
						if(oldmedicine[lp1].time[lp2] == editmedication[lp1]._task[lp3].time){
							break;
						}
						if(lp3 == (editmedication[lp1]._task.length -1)){		
							//add as new task push to medication
							var task = new Task();
							task.time=oldmedicine[lp1].time[lp2];
							task.type='infusion';
							task.priority = 0;
							task.status='opened';
							task.createdat=new Date();
							task.infusedVolume =0;
							task._patient=patientid;
							task._bed=bedid;
							task._station=ObjectId(req.decoded.stationid);
							task._medication=ObjectId(editmedication[lp1]._id);
							task.save(function(err,task){
								if(err)	throw err;
								else{
									Medication.collection.update({_id:task._medication},{$push:{_task:task._id}},{upsert:false});

								}
							});
				
						}//end of onInsert task

					}
				}

			}
			else{
				for(lp2=0;lp2<oldmedicine[lp1].time.length;lp2++){
					var task = new Task();
					task.time=oldmedicine[lp1].time[lp2];
					task.type='infusion';
					task.priority = 0;
					task.status='opened';
					task.createdat=new Date();
					task.infusedVolume =0;
					task._patient=patientid;
					task._bed=bedid;
					task._station=ObjectId(req.decoded.stationid);
					task._medication=ObjectId(editmedication[lp1]._id);
					task.save(function(err,task){
						if(err)	throw err;
						else{
							Medication.collection.update({_id:task._medication},{$push:{_task:task._id}},{upsert:false});

						}
					});
				}
			}
			if(oldmedicine[lp1].time.length !=0){
				for(lp2=0;lp2<editmedication[lp1]._task.length;lp2++){
					for(lp3=0;lp3<oldmedicine[lp1].time.length;lp3++){
						if(editmedication[lp1]._task[lp2].time == oldmedicine[lp1].time[lp3]) {
							break;
						}
						if(lp3 == (oldmedicine[lp1].time.length -1)){
							timeid = ObjectId(editmedication[lp1]._task[lp2]._id)
							medid = ObjectId(editmedication[lp1]._id)
							// Task.collection.update({_id:timeid},{$set:{status:'deleted'}},{upsert:false});
							Task.collection.remove({_id:timeid},{upsert:false});
							Medication.collection.update({_id:medid},{$pull:{_task:timeid}},{upsert:false});

							
						}

					}
				}
			}
			else{
				for(lp2=0;lp2<editmedication[lp1]._task.length;lp2++){
					timeid = ObjectId(editmedication[lp1]._task[lp2]._id);
					medid = ObjectId(editmedication[lp1]._id);
					Task.collection.remove({_id:timeid},{upsert:false});
					Medication.collection.update({_id:medid},{$pull:{_task:timeid}},{upsert:false});

				}

			}
			

		}//end of edit old medicine details

		//deleteing the medicines
		if(deletemedicineids.length >0){
			for(lp1=0;lp1<deletemedicineids.length;lp1++){
				var medicineid = ObjectId(deletemedicineids[lp1]);
				Patient.collection.update({_id:patientid},{$pull:{_medication:medicineid}},{upsert:false});
				Medication.collection.updateMany({_id:medicineid},{$unset:{_bed:""}},{upsert:false});
				Medication.collection.updateMany({_id:medicineid},{$unset:{_task:""}},{upsert:false});
				// Task.collection.updateMany({_medication:medicineid},{$set:{status:'deleted'}},{upsert:false});
				Task.collection.remove({_medication:medicineid},{upsert:false});

			}
		}
		

		//adding new medicines
		if(newmedicine.length >0){
			var medicationObjArray =[{}];
			for (var key in newmedicine) {
				var medicationObj={};
				medicationObj.medicinename = newmedicine[key].medicinename;
				medicationObj.medicinerate = newmedicine[key].medicinerate;
				medicationObj.medicinevolume = newmedicine[key].medicinevolume;
				medicationObj.stationname = req.decoded.station;
				medicationObj._admin = req.decoded.admin;
				medicationObj._bed = ObjectId(newmedicine[key].bedid);
				medicationObj._patient = ObjectId(newmedicine[key].patientid);
				medicationObjArray[key] = medicationObj;

			}
			//created an array of object med with all details and inserting it into the database  
			Medication.collection.insert(medicationObjArray, onInsert);
			function onInsert(err,docs){
				if(err) throw err;
				else{
					//update patient collection and insert thr refernce of medicine id
					for (var key in medicationObjArray){
						Patient.collection.update({_id:patientid},{$push:{_medication:medicationObjArray[key]._id}},{upsert:false});
					}
					//docs.ops has the data available and req.body.medications[].time has all the time associated with that medicine
					timeObjArray=[{}];
					var counter=0;
					docs.ops.forEach(function callback(currentValue, index, array) {
					    var timeArray=newmedicine[index].time;
					    //creating an array of object based on the time data
					    for(var j=0;j<timeArray.length;j++)
					    {
					         var timeObj={};
					         timeObj.time=timeArray[j];
					         timeObj.type='infusion';
					         timeObj.priority = 0;
					         timeObj.status='opened';
					         timeObj.createdat=new Date();
					         timeObj._patient=patientid;
					         timeObj.infusedVolume =0;
					         timeObj._bed=bedid;
					         timeObj._station=ObjectId(req.decoded.stationid);
					         timeObj._medication=currentValue._id;
					         timeObjArray[counter]=timeObj;
					         counter++;
					    }
					                            
					});
					Task.collection.insert(timeObjArray, onInsert);
					function onInsert(err,times) {
						if(err) throw err;
						else{
							for (var key in medicationObjArray) 
							{
							    for (var key2 in timeObjArray)
							    if(medicationObjArray[key]._id===timeObjArray[key2]._medication)
							    Medication.collection.update({_id:medicationObjArray[key]._id},{$push:{_task:timeObjArray[key2]._id}},{upsert:false});
							}

						}
					}

				}//end of adding medication success

			}//end of medication insert function


		}
		

	res.json({success:true,message:"medication details updated"})	
	});//end of find medication

});

//route to remove all medicines while edit medication
router.post('/nurse/deletemedication', function(req,res){
	var patientid = ObjectId(req.body.patientid);
	Patient.collection.update({_id:patientid},{$unset:{_medication:""}});
	Medication.collection.remove({_patient:patientid});
	Task.collection.updateMany({_patient:patientid},{$set:{status:'closed'}},{upsert:false});
	res.json({success:true,message:"deleted all medicine associated with patient"})
});


/***routes for nurse home page starts here ***/
// route to provide all the tasks associated with a station
router.post('/nurse/getopenedtask', function(req,res){
	var date=new Date();
	var hour=date.getHours();
	var index =-1;
	var skippedtaskArray =[];
	// var stationid = ObjectId(req.decoded.stationid);
	Task.find({_station:ObjectId(req.decoded.stationid),status:'opened'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,task) {
		if(task.length==0){
			res.json({success:false,message:"no tasks found"});

		}
		else if(task.length == 1){
			res.json({success:true,openedtasks:task,times:[task[0].time]})
		}
		//reorder returned task array of object based on present time
		else{
			var nexthour = hour;
			while(nexthour<24){ 
				for(lp1=0;lp1<task.length;lp1++){
					if(task[lp1].time == nexthour){
						index = lp1;
					}
				}

				if(index==-1){
					if(nexthour == 23){
						nexthour = 0;
					}
					else{
						nexthour=nexthour+1;
					}
				}
				else{
					break;
				}
			}
		var prevtaskArray = task.slice(0,index);
		var nexttaskArray = task.slice(index,(task.length));
		var taskArray = nexttaskArray.concat(prevtaskArray);
		var times = [];
		for(var key in taskArray){
			times.push(taskArray[key].time);
		}
		var timesArray=[];
		var n=times.length;
		var count=0;
		for(var c=0;c<n;c++)
		    { 
		        for(var d=0;d<count;d++) 
		        { 
		            if(times[c]==timesArray[d]) 
		                break; 
		        } 
		        if(d==count) 
		        { 
		            timesArray[count] = times[c]; 
		            count++; 
		        } 
		    }


			res.json({success:true,openedtasks:taskArray,times:timesArray})
		}
	});	


});

//route to send all active tasks that is inprogress 
router.post('/nurse/getinprogresstask', function(req,res){
	Task.find({_station:ObjectId(req.decoded.stationid),status:'inprogress'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,inprogresstask) {
			if(inprogresstask.length==0){
				res.json({success:false,message:"no tasks found"});
			}
			else{
				res.json({success:true,inprogresstasks:inprogresstask})

			}
	});

});

//route to send all active tasks that is alerted tasks
router.post('/nurse/getalertedtask', function(req,res){
	Task.find({_station:ObjectId(req.decoded.stationid),status:'alerted'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,alertedtask) {
			if(alertedtask.length==0){
				res.json({success:false,message:"no tasks found"});
			}
			else{
				res.json({success:true,alertedtasks:alertedtask})

			}
	});

});

//route to skip a task 
router.post('/nurse/skiptask', function(req,res){
	Task.collection.update({_id:ObjectId(req.body._id)},{$set:{status:'skipped'}});
	res.json({success:true,message:'task skipped'})
});

//route to close a task 
router.post('/nurse/closetask', function(req,res){
	Task.collection.update({_id:ObjectId(req.body._id)},{$set:{status:'closed'}});
	res.json({success:true,message:'task closed'})
});




return router;
}