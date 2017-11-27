var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/login', function(req,res){
	res.sendFile(path.join(__dirname, '../', 'public/app/views/pages', 'login.html'));
})

module.exports = router;