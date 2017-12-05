var express = require('express');
var router = express.Router();
var User = require('../models/users');
var jwt = require('jsonwebtoken');
var secret = 'lauraiswolverinesdaughter';
//http://localhost/api/signup
//USER REGISTRATION ROUTE
router.post('/signup', function(req,res){
	var user = new User();
	user.hospitalName = req.body.hospitalName;
	user.userName = req.body.email;
	user.password = req.body.password;
	user.save(function(err){
		if (err) {
			res.json({success:false,message:'User already exist'});
		}
		else{
			res.json({success:true,message:'A verification mail has been sent to your email'});
		}
	});	
});

//USER LOGIN ROUTE
router.post('/signin',function (req,res) {
	User.findOne({userName:req.body.username}).select('userName password').exec(function (err,user) {
		if(err) throw err;

		if(!user){
			res.json({success:false,message:"No user found"});
		}
		else if(user){
			var validPassword = user.comparePassword(req.body.password);
			if (!validPassword){
				res.json({success:false,message:"Wrong password"});
			}
			else{
				var token = jwt.sign({username:user.userName,hospitalname:user.hospitalName},secret,{expiresIn:'24h'});
				res.json({success:true,message:"Authentication success",token:token});

			}

		}
		
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

module.exports = router;