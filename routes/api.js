var express = require('express');
var router = express.Router();
var User = require('../models/users')


router.post('/register', function(req,res){
	var user = new User();
	user.userName = req.body.userName;
	user.password = req.body.password;
	user.hospitalName = req.body.hospitalName;
	user.save(function(err){
		if (err) {
			res.send('User already exist');
		}
		else{
			res.send('Account created')
		}
	})

	
})

module.exports = router;