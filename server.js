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
var version = '1.0.0';
const simpleGit = require('simple-git');
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
var CryptoJS = require("crypto-js");
var request = require('request');
const url = require('url')

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

//for updating app
app.post('/admin/update',function (req,res) {
    require('simple-git')()
    .pull((err, update) => {
        if(update && update.summary.changes) {
            require('child_process').exec('npm restart');
            res.json({success:true,message:'Updated to New Version'});
        }
        else{
            res.json({success:false,message:'Your system is upto date'})

        }
    })

});

//route to return number of connected devices
app.post('/admin/getconnecteddripos', function(req,res){
    var counter = 0;
    request.get('http://localhost:18083/api/v2/nodes/emq@127.0.0.1/clients',function (req,response) {
        if(response){
            var recObj=JSON.parse(response.body);
            var clients=recObj.result.objects;
            for(var key in clients){
                var index = clients[key].client_id.search("DRIPO")
                if(index != -1){
                    counter = counter +1;
                }

            }
            res.json({success:true,clients:counter});

        }
        else{
            res.json({success:false,clients:counter,message:"mqtt server stopped"});

        }
       
    });
});

//route for updating device
 app.get('/update_dripo',function(req,res){
     console.log(req.headers);
     res.status(200);
     res.sendFile('test.bin',{root:path.join(__dirname,'/public')});

 });

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


//scheduled cron job tasks
//Task 1 : Change status of task from opened to alerted in 59th minute       
cron.schedule('59 * * * *', function(){
	var date = new Date();
	var hour = date.getHours();
 	Task.collection.updateMany({'time':hour,'status':'opened'},{$set:{status:'alerted'}});
});
//Task 2: Change status of task from closed/skipped to opened in 59th minute
cron.schedule('59 * * * *', function(){
    var date = new Date();
    var hour = date.getHours();
    var time = Math.abs(hour-12);
    Task.collection.updateMany({'time':time,'status':{ $in:['closed','skipped']}},{$set:{status:'opened'}});
});
//MQTT Configuration
var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1883');
//subscribing to topic dripo/ on connect
client.on('connect', function() {
    client.subscribe('dripo/#',{ qos: 1});

});

//function fired on recieving a message from device in topic dripo/
client.on('message', function (topic, message) {
    var topicinfoArray = topic.split("/");
    var dripoid = topicinfoArray[1];
    Dripo.find({dripoid:dripoid}).exec(function(err,dripo){
        if(err) throw err;
        if(!dripo.length){
            client.publish('error/' + dripoid ,'Device&Not&Added',function (err) {
                if(err){
                    console.log(err);
                }
            });
            console.log("Access&Denied");
        }
        else{
            var stationid = ObjectId(dripo[0]._station);
            var userid =ObjectId(dripo[0]._user);
            if(topicinfoArray[2]=='bed_req'){
                Bed.find({_station:stationid,status:'occupied'}).exec(function(err,bed){
                    if(err) throw err;
                    if(!bed.length){
                        client.publish('error/' + dripoid ,'No&bed&found',function (err) {
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
                        console.log(pub_bed);


                    }

                });

            }//end of first bed_req
            else if(topicinfoArray[2]== 'med_req'){
                bedid = ObjectId(message.toString());
                Medication.find({_bed:bedid}).exec(function(err,medication){
                    if(err) throw err;
                    if(!medication.length){
                        client.publish('error/' + dripoid ,'No&Medicine&found',function (err) {
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
                            client.publish('error/' + dripoid ,'No&ivset&found',function (err) {
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
                        if(alertedtime.length == 0){
                            Task.find({'_medication':message,'status':'opened'}).sort({time:1}).exec(function(err,time){
                                if(err) throw err;
                                if(time.length != 0){
                                    timeid = time[0]._id;
                                    //formating the messages to publish to device
                                    var rate=medication[0].medicinerate;
                                    var mname=medication[0].medicinename;
                                    var pname=medication[0]._bed._patient.patientname;
                                    var vol=medication[0].medicinevolume - time[0].infusedVolume;
                                    var alert=30;
                                    var pub_rate=timeid+'&'+pname+'&'+mname+'&'+vol+'&'+rate+'&'+alert+'&';
                                    client.publish('dripo/' + dripoid + '/rate2set',pub_rate,{ qos: 1, retain: false });


                                }
                                else{
                                    client.publish('error/' + dripoid ,'No&task&found',function (err) {
                                        if(err){
                                            console.log(err);
                                        }
                                    });

                                }
                              

                            });
                        }
                        else{
                            timeid = alertedtime[0]._id;
                            //formating the messages to publish to device
                            var rate=medication[0].medicinerate;
                            var mname=medication[0].medicinename;
                            var pname=medication[0]._bed._patient.patientname;
                            var vol=medication[0].medicinevolume - alertedtime[0].infusedVolume;
                            var alert=30;
                            var pub_rate=timeid+'&'+pname+'&'+mname+'&'+vol+'&'+rate+'&'+alert+'&';
                            client.publish('dripo/' + dripoid + '/rate2set',pub_rate,{ qos: 1, retain: false });

                        }
                    });             

                });

            }//end of rate_req
           



        }//end of if access granted for dripo

    });

});
//test encryption
// var AESKey = 'B7EE7193E395F5ED016E48FF51FA1180';
// var message = 'Online vannae';
// var iv = CryptoJS.enc.Hex.parse('8F6BC245A46A1C5746D8959D20458FAA');
// var key= CryptoJS.enc.Hex.parse(AESKey);
// // Encrypt
// var ciphertext = CryptoJS.AES.encrypt(message, key , { iv: iv } );
// var ciphertext64 =ciphertext.toString(CryptoJS.enc.base64);
// console.log("Cypher: " ,  ciphertext.toString(CryptoJS.enc.base64) );
// var esp8266_msg  = ciphertext64;
// // The AES encryption/decryption key to be used.
// var bytes  = CryptoJS.AES.decrypt( esp8266_msg, key , { iv: iv} );
// console.log(bytes);
// var plaintext = bytes.toString(CryptoJS.enc.Base64);
// var decoded_b64msg =  new Buffer(plaintext , 'base64').toString('ascii');
// console.log("Decryptedage: ", decoded_b64msg);

//socket.io config
var io = require('socket.io')(server);
io.on('connection', function (socket) {
   // when socket connection publishes a message, forward that message the the mqtt broker
  socket.on('publish', function (data) {
      client.publish(data.topic,data.payload,{ qos: 1, retain: false});
  });

  client.on('message', function (topic, payload, packet) {
    var topicinfoArray = topic.split("/");
    var dripoid = topicinfoArray[1];
    var commonTopic = 'dripo/'+dripoid+'/';
    if(topicinfoArray[2] == 'mon'){
    Dripo.find({dripoid:dripoid}).exec(function(err,dripo){
        if(err) throw err;
        if(!dripo.length){
            client.publish('error/' + dripoid ,'Access Denied',function (err) {
                if(err){
                    console.log(err);
                }
            });
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
                io.emit('dripo',{
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
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status,topic:commonTopic}});
                Infusionhistory.find({_task:taskid,'date':newdate}).exec(function(err,inf){
                    if(inf.length==0){
                    Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{date:newdate,infstarttime:inftime,infdate:infdate,}},{upsert:true});
                    Infusionhistory.find({_task:taskid,'date':newdate}).exec(function(err,newinf){
                        Medication.collection.update({_id:ObjectId(medid)},{$push:{_infusionhistory:newinf[0]._id}},{upsert:true});    

                    });

                    }
                });

            } //end of if status is start
            else if(status == 'infusing'){
                io.emit('dripo',{
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
                    io.emit('dripo',{
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
                    io.emit('dripo',{
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
                    Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:'Empty'}});
                }
            }

            else if(status == 'Empty'){
                io.emit('dripo',{
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
            
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});
              

            }
            else if(status == 'Empty_ACK'){
                io.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':'Empty_ACK',
                    'status':'closed',
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
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'closed',rate:"",infusedVolume:"",timeRemaining:"",totalVolume:"",percentage:"",infusionstatus:status,topic:""}});
                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{infendtime:inftime,inftvol:infusedVolume}},{upsert:true}); 
            }//end of Empty_ACK

            else if(status == 'Rate_Err'|| status=='Block'){
                io.emit('dripo',{
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
                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$push:{inferr:{errtype:status,errtime:inftime}}},{upsert:true}); 

            }//end of error
            else if(status == 'Complete'){
                io.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':'Complete',
                    'status':'inprogress',
                    'taskid':taskid,
                    'rate':rate,
                    'infusedVolume':infusedVolume,
                    'timeRemaining':timeRemaining,
                    'totalVolume':totalVolume,
                    'percentage':percentage
                });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});

            }//end of complete

            else if(status == 'Rate_Err_ACK'|| status=='Block_ACK'){
                io.emit('dripo',{
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
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});


            }//end of error ack
            else if(status == 'Device_Disconnected_ACK'){
                io.emit('dripo',{
                    'topic':topic.toString(),
                    'payload':payload.toString(),
                    'infusionstatus':'Connection_Lost',
                    'status':'inprogress',
                    'taskid':taskid,
                    'rate':rate,
                    'infusedVolume':infusedVolume,
                    'timeRemaining':timeRemaining,
                    'totalVolume':totalVolume,
                    'percentage':percentage
                });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:'Connection_Lost'}});


            }//end of error ack
            else if(status == 'Complete_ACK'){
                io.emit('dripo',{
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
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});

            }


            
        }
    });
    }//end of if mon
    if(topicinfoArray[2] == 'will'){
        var message = payload.toString();
        if(message == 'offline'){
            Task.find({topic:commonTopic}).exec(function(err,task){
                if(task.length != 0){
                    io.emit('dripo',{
                        'topic':topic.toString(),
                        'payload':payload.toString(),
                        'infusionstatus':'Device_Disconnected',
                        'status':'inprogress',
                        'taskid':task[0]._id,
                        'rate':task[0].rate,
                        'infusedVolume':task[0].infusedVolume,
                        'timeRemaining':task[0].timeRemaining,
                        'totalVolume':task[0].totalVolume,
                        'percentage':task[0].percentage
                    });
                    Task.collection.update({_id:task[0]._id},{$set:{infusionstatus:"Device_Disconnected",status:'alerted'}});
                }
               
            });

        }        

    }
  });
});

server.listen(process.env.PORT || port, function(){
    console.log("Server started listening in port"+port);
});




