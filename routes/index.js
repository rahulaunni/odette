var express = require('express');
var router = express.Router();
var path = require('path');

//route to load the main page index.html
router.get('/', function(req,res){
	res.sendFile(path.join(__dirname, '../', 'public/app/views', 'index.html'));
});

// router.get('*', function(req, res) {
// 	res.sendFile(path.join(__dirname, '../', 'public/app/views', 'index.html'));
// });

module.exports = router;