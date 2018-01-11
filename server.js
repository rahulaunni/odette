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
var app = require('express')();
var server = require('http').Server(app);
// var app = express();
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var index = require('./routes/index');
var router = express.Router();
var api = require('./routes/api')(router);
 var port=3000;
var cron = require('node-cron');
var Task = require('./models/tasks');


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


// Just send the index.html for other files to support HTML5Mode
app.all('/*', function(req, res, next) {
    res.sendFile(path.join(__dirname,  'public/app/views', 'index.html'));
});

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
server.listen(process.env.PORT || port, function(){
	console.log("Server started listening in port"+port);
});

//scheduled cron job tasks
//Task 1 : Change status of task from opened to alerted in 59th minute       
cron.schedule('59 * * * *', function(){
	var date = new Date();
	var hour = date.getHours();
 	Task.collection.updateMany({'time':hour,'status':'opened'},{$set:{status:'alerted'}});
});

//MQTT Configuration
var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1883');
//subscribing to topic dripo/ on connect
client.on('connect', function() {
    client.subscribe('dripo/#',{ qos: 1 });

});

client.on('message', function (topic, message) {
  console.log(message.toString());
  client.publish('presence', 'Hello mqtt')
})

//SOCKET.IO Config
var io = require('socket.io')(server);
io.on('connection', function (socket) {
  socket.emit('news', { hello: 'from server' });
  socket.on('reply', function (data) {
    console.log(data);
  });
});



