var express = require('express');
var app = express();
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var index = require('./routes/index');
var api = require('./routes/api');
var port=3000;

//for logging requests
app.use(morgan('dev'));

//bodyparser
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', index);
app.use('/api', api);

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

//set static folder for Angular stuffs
app.use(express.static(path.join(__dirname, '/public')));



//mongodb configuration
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/lauradb',{ useMongoClient: true }, function(err) {
	if(err){
		console.log("Mongodb connection failed");
	}
	else{
		console.log("Mongodb connection success");
	}
});

       



app.listen(process.env.PORT || port, function(){
	console.log("Server started listening in port"+port);
});
