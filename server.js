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
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var index = require('./routes/index');
var router = express.Router();
var api = require('./routes/api')(router);
var port=3000;
var cron = require('node-cron');
var ObjectId = require('mongodb').ObjectID;

//Models 
var Task = require('./models/tasks');
var Station = require('./models/stations');
var Dripo = require('./models/dripos');
var Bed = require('./models/beds');
var Medication = require('./models/medications');
var Ivset = require('./models/ivsets');
var Infusionhistory = require('./models/infusionhistories');

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
    console.log("executed at",date);
 	Task.collection.updateMany({'time':hour,'status':'opened'},{$set:{status:'alerted'}});
});

//MQTT Configuration
var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1883');
//subscribing to topic dripo/ on connect
client.on('connect', function() {
    client.subscribe('dripo/#',{ qos: 1 });

});

//function fired on recieving a message from device in topic dripo/
client.on('message', function (topic, message) {
    var topicinfoArray = topic.split("/");
    var dripoid = topicinfoArray[1];
    Dripo.find({dripoid:dripoid}).exec(function(err,dripo){
        if(err) throw err;
        if(!dripo.length){
            client.publish('error/' + dripoid ,'Access Denied',function (err) {
                if(err){
                    console.log(err);
                }
            });
            console.log("access denied");
        }
        else{
            var stationid = ObjectId(dripo[0]._station);
            var userid =ObjectId(dripo[0]._user);
            if(topicinfoArray[2]=='bed_req'){
                Bed.find({_station:stationid,status:'occupied'}).exec(function(err,bed){
                    if(err) throw err;
                    if(!bed.length){
                        client.publish('error/' + dripoid ,'No bed found',function (err) {
                            if(err){
                                console.log(err);
                            }
                        });
                    }
                    else{
                        var pubBed=[];
                        for (var key in bed)
                        {
                          pubBed.push(bed[key].bedname); 
                          pubBed.push('&'); 
                          pubBed.push(bed[key]._id); 
                          pubBed.push('&');  
                        }
                        var pub_bed=pubBed.join('');
                        client.publish('dripo/' + dripoid + '/bed',pub_bed,{ qos: 1, retain: false });


                    }

                });

            }//end of first bed_req
            else if(topicinfoArray[2]== 'med_req'){
                bedid = ObjectId(message.toString());
                Medication.find({_bed:bedid}).exec(function(err,medication){
                    if(err) throw err;
                    if(!medication.length){
                        client.publish('error/' + dripoid ,'No Medication found',function (err) {
                            if(err){
                                console.log(err);
                            }
                        });
                    }
                    else{
                        var pubMed=[];
                        for (var key in medication)
                        {
                          pubMed.push(medication[key].medicinename); 
                          pubMed.push('&'); 
                          pubMed.push(medication[key]._id); 
                          pubMed.push('&');  
                        }
                        var pub_med=pubMed.join('');
                        client.publish('dripo/' + dripoid + '/med',pub_med,{ qos: 1, retain: false });
                    }
                });


            }//end of med_req
            else if(topicinfoArray[2] == 'req_df'){
                medicineid = ObjectId(message.toString());
                Medication.find({_id:medicineid}).exec(function(err,medication){
                    var mlhr=medication[0].medicinerate;
                    Ivset.find({_user:userid}).sort({ivsetdpf:1}).exec(function(err,ivset){
                        if(err) throw err;
                        if(!ivset.length){
                            client.publish('error/' + dripoid ,'No ivset found',function (err) {
                                if(err){
                                    console.log(err);
                                }
                            });
                        }
                        else{
                            //for sending only relavant dfs the calculations are made based on the device's limitation to detect (upto 300dpm)
                            var df=[];
                            for(var key in ivset)
                            {
                                df[key]=ivset[key].ivsetdpf;
                            }
                            console.log(df);
                            var maxdf=18000/mlhr;
                            var index=0;
                            for(var key1 in df)
                            {
                                if(df[key1]<=maxdf)
                                {
                                    index+=1;
                                }
                            }
                            var rdf=df.slice(0,index);
                            var pub_dff=[];
                            for (var key2 in rdf)
                            {
                              pub_dff.push(rdf[key2]); 
                              pub_dff.push('&'); 
                              pub_dff.push(rdf[key2]); 
                              pub_dff.push('&'); 

                            }
                            var pub_df=pub_dff.join('');
                            client.publish('dripo/' + dripoid + '/df',pub_df,{ qos: 1, retain: false });

                        }
                    });


                });

            }//end of dpf_req
            else if (topicinfoArray[2]== 'rate_req'){
                var timeid;
                Medication.find({'_id':message}).populate({path:'_bed',model:'Bed',populate:{path:'_patient',model:'Patient'}}).exec(function(err,medication){
                    if(err) throw err;
                    Task.find({'_medication':message,'status':'alerted'}).sort({time:1}).exec(function(err,alertedtime){
                        if(err) throw err;
                        if(!alertedtime.length){
                            Task.find({'_medication':message,'status':'opened'}).sort({time:1}).exec(function(err,time){
                                if(err) throw err;
                                timeid = time[0]._id;
                                //formating the messages to publish to device
                                var rate=medication[0].medicinerate;
                                var mname=medication[0].medicinename;
                                var pname=medication[0]._bed._patient.patientname;
                                var vol=medication[0].medicinevolume;
                                var alert=30;
                                var pub_rate=timeid+'&'+pname+'&'+mname+'&'+vol+'&'+rate+'&'+alert+'&';
                                client.publish('dripo/' + dripoid + '/rate2set',pub_rate,{ qos: 1, retain: false });

                            });
                        }
                        else{
                            timeid = alertedtime[0]._id;
                            //formating the messages to publish to device
                            var rate=medication[0].medicinerate;
                            var mname=medication[0].medicinename;
                            var pname=medication[0]._bed._patient.patientname;
                            var vol=medication[0].medicinevolume;
                            var alert=30;
                            var pub_rate=timeid+'&'+pname+'&'+mname+'&'+vol+'&'+rate+'&'+alert+'&';
                            client.publish('dripo/' + dripoid + '/rate2set',pub_rate,{ qos: 1, retain: false });

                        }
                    });             

                });

            }//end of rate_req


        }//end of if access granted for dripo

    });

})

//socket.io config
var io = require('socket.io')(server);
io.on('connection', function (socket) {
  socket.on('subscribe', function (data) {
      console.log('Subscribing to '+data.topic);
      socket.join(data.topic);
      client.subscribe(data.topic);
  });
   // when socket connection publishes a message, forward that message the the mqtt broker
  socket.on('publish', function (data) {
      console.log('Publishing to '+data.topic);
      client.publish(data.topic,data.payload,{ qos: 1, retain: true });
  });

  client.on('message', function (topic, payload, packet) {
    var topicinfoArray = topic.split("/");
    var dripoid = topicinfoArray[1];
    Dripo.find({dripoid:dripoid}).exec(function(err,dripo){
        if(err) throw err;
        if(!dripo.length){
            client.publish('error/' + dripoid ,'Access Denied',function (err) {
                if(err){
                    console.log(err);
                }
            });
            console.log("access denied");
        }
        else{
            var message = payload.toString();
            var messageArray = message.split("-");
            var medid = messageArray[0];
            var taskid = messageArray[1];
            var status = messageArray[2];
            var rate = messageArray[3];
            var infusedVolume = messageArray[4];
            var timeRemaining = messageArray[5];
            var totalVolume = messageArray[6];
            var percentage = Math.trunc(((infusedVolume/totalVolume)*100));
            var infdate= new Date();
            var inftime=(new Date()).getHours()+':'+(new Date()).getMinutes()+':'+(new Date()).getSeconds();
            var dateObj = new Date();
            var month = dateObj.getUTCMonth() + 1; //months from 1-12
            var day = dateObj.getUTCDate();
            var year = dateObj.getUTCFullYear();
            var newdate = day + "/" + month + "/" + year;
            if(status == 'start'){
                socket.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':'start',
                    'status':'inprogress',
                    'taskid':taskid,
                    'rate':rate,
                    'infusedVolume':infusedVolume,
                    'timeRemaining':timeRemaining,
                    'totalVolume':totalVolume,
                    'percentage':percentage
                });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});
                Infusionhistory.find({_task:taskid,'date':newdate}).exec(function(err,inf){
                    if(inf.length==0){
                        var inf = new Infusionhistory();
                        inf.date= newdate;
                        inf._task = ObjectId(taskid);
                        inf.rate =rate;
                        inf.infstarttime=inftime;
                        inf.infdate=infdate;
                        inf.infusedVolume = infusedVolume;
                        inf.timeRemaining = timeRemaining;
                        inf.totalVolume = totalVolume;
                        inf.percentage = percentage;
                        inf.save(function(err,inf){
                            console.log(inf);
                            if(err) throw err;
                            Medication.collection.update({_id:ObjectId(medid)},{$push:{_infusionhistory:inf._id}},{upsert:false});

                        });
                       
                    }
                });

            } //end of if status is start
            else if(status == 'infusing'){
                socket.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':'infusing',
                    'status':'inprogress',
                    'taskid':taskid,
                    'rate':rate,
                    'infusedVolume':infusedVolume,
                    'timeRemaining':timeRemaining,
                    'totalVolume':totalVolume,
                    'percentage':percentage
                });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});


            }//end of if status is infusing
            else if(status == 'stop'){
                if(percentage<90){
                    socket.emit('dripo',{
                        'topic':topic.toString(),
                        'payload':payload.toString(),
                        'infusionstatus':'stop',
                        'status':'alerted',
                        'taskid':taskid,
                        'rate':rate,
                        'infusedVolume':infusedVolume,
                        'timeRemaining':timeRemaining,
                        'totalVolume':totalVolume,
                        'percentage':percentage
                    });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'alerted',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});

                }
                else{
                    socket.emit('dripo',{
                        'topic':topic.toString(),
                        'payload':payload.toString(),
                        'infusionstatus':'Empty',
                        'status':'inprogress',
                        'taskid':taskid,
                        'rate':rate,
                        'infusedVolume':infusedVolume,
                        'timeRemaining':timeRemaining,
                        'totalVolume':totalVolume,
                        'percentage':percentage
                    });
                    Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'closed',rate:"",infusedVolume:"",timeRemaining:"",totalVolume:"",percentage:"",infusionstatus:'Empty'}});
                    Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{infendtime:inftime,inftvol:infusedVolume}});
                }
            }

            else if(status == 'Empty'){
                socket.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':'Empty',
                    'status':'inprogress',
                    'taskid':taskid,
                    'rate':rate,
                    'infusedVolume':infusedVolume,
                    'timeRemaining':timeRemaining,
                    'totalVolume':totalVolume,
                    'percentage':percentage
                });
                var infdate= new Date();
                var inftime=(new Date()).getHours()+':'+(new Date()).getMinutes()+':'+(new Date()).getSeconds();
                var dateObj = new Date();
                var month = dateObj.getUTCMonth() + 1; //months from 1-12
                var day = dateObj.getUTCDate();
                var year = dateObj.getUTCFullYear();
                var newdate = day + "/" + month + "/" + year;
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'closed',rate:"",infusedVolume:"",timeRemaining:"",totalVolume:"",percentage:"",infusionstatus:status}});
                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{infendtime:inftime,inftvol:infusedVolume}});

            }
            else if(status == 'Rate_Err'|| status=='Block'){
                socket.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':status,
                    'status':'inprogress',
                    'taskid':taskid,
                    'rate':rate,
                    'infusedVolume':infusedVolume,
                    'timeRemaining':timeRemaining,
                    'totalVolume':totalVolume,
                    'percentage':percentage
                });
                var infdate= new Date();
                var inftime=(new Date()).getHours()+':'+(new Date()).getMinutes()+':'+(new Date()).getSeconds();
                var dateObj = new Date();
                var month = dateObj.getUTCMonth() + 1; //months from 1-12
                var day = dateObj.getUTCDate();
                var year = dateObj.getUTCFullYear();
                var newdate = day + "/" + month + "/" + year;
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});
                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$push:{inferr:{errtype:status,errtime:inftime}}});


            }


            
            
        }
    });
  });
});





