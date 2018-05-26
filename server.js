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
var port=4000;
var cron = require('node-cron');
var ObjectId = require('mongodb').ObjectID;
var CryptoJS = require("crypto-js");
var request = require('request');
const url = require('url')
var useragent = require('useragent');
var fs =require('fs');
var md5 = require('md5-file');
const publicIp = require('public-ip');
var os = require('os');
var needle = require('needle');
//Models 
var Task = require('./models/tasks');
var Station = require('./models/stations');
var Dripo = require('./models/dripos');
var Bed = require('./models/beds');
var Medication = require('./models/medications');
var Patient = require('./models/patients');
var Ivset = require('./models/ivsets');
var Infusionhistory = require('./models/infusionhistories');
var Synapse = require('./models/synapselist');
var Analysis = require('./models/analysis');

var ip = require('ip');

//for logging requests
app.use(morgan('dev'));
//for parsing json body
app.use(bodyParser.json({extended : true}));

var serverType;
var ipaddress= ip.address();
if(ipaddress == '13.127.153.164'){
    serverType = "online";
}
else{
    serverType = "local";

}




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


//route for updating device
 app.get('/update_dripo',function(req,res){
    var deviceVersion =  req.query.v;
    var deviceVersionArray = deviceVersion.split('_');
    var version = deviceVersionArray[2];
    var serverfirmwareInfoArray;
    var serverVersion;
    var updatefolder = path.join(__dirname, '/public/dripo_firmware/scotch');
    fs.readdir(updatefolder, function(err, files) {
        if (err){res.sendStatus(304);}
        files.forEach(function(f) {
        serverfirmwareInfoArray = f.split('_');
        serverVersion = serverfirmwareInfoArray[2];
        if(serverVersion != undefined){
            var full_path = path.join(__dirname,'/public/dripo_firmware/scotch/'+'scotch_v_'+serverVersion+'_ino.nodemcu.bin'); 
            if(version < serverVersion){
                fs.readFile(full_path, "binary", function(err, file) {  
                res.writeHeader(200, 
                    {"Content-Type": "application/octet-stream", 
                     "Content-Disposition": "attachment;filename="+path.basename(full_path),
                     "Content-Length": ""+fs.statSync(full_path)["size"],
                 }); 
                res.write(file, "binary");
                console.log("updated");
                   res.end();
                });  

            }
                
            else if(version >= serverVersion){
                console.log("noupdate");
                res.writeHeader(304);  
                res.end();
            }


        }
                          
        });
    });

 });

//route to get public ip and hostname of local servers installed
app.put('/updatelocalip',function (req,res) {
    Synapse.findOne({hostname:req.query.hname}).select('hostname publicip').exec(function(err,synapse) {
        if (err) throw err; // Throw error if cannot connect
        if(synapse){
            synapse.hostname= req.query.hname;
            synapse.publicip= req.query.ip;
            synapse.save(function(err) {
                if (err) {
                    console.log(err);
                    res.json({success:false,message:'Failed'})
                } else {
                    res.json({ success: true, message: 'Success'}); 
                }
            });

        }
        else{
            var nsynapse = new Synapse();
            nsynapse.hostname= req.query.hname;
            nsynapse.publicip= req.query.ip;
            // saving user to database
            nsynapse.save(function(err){
                if (err) {
                    console.log(err);
                    //responding error back to frontend
                    res.json({success:false,message:'Database error'});
                }
                else{

                    res.json({success:true,message:'Success'});
                }
            });
        }
    });
});

//function to send public ip and computer hostname to online server
publicIp.v4().then(ip => {
    var publicip = ip;
    //=> '46.5.21.123'
var hostname=os.hostname();
var request = require('request');
var nested = {
  params: {
    are: 'ok'
  }
}


//sending hostname and publicip to the online server when local server starts
needle.put('http://dripo.care//updatelocalip?ip='+publicip+'&hname='+hostname, nested, function(err, resp) {
    if(err){
        console.log(err);
    }
});

});

//route to manage local synapse details hostname and public ip
app.get('/getsynapsedetails', function(req,res){
        Synapse.find({}).exec(function(err,synapse) {
            if(synapse.length==0){
                res.json({success:false,message:'Nothing to show'});

            }
            else{
                res.json({success:true,synapses:synapse});

            }
        });
});


//save the data from various local servers
app.post('/analysis',function (req,res) {
   res.writeHeader(200);  
   var Data = req.body.data;
    for(var key in req.body.data){
       var infObj = new Analysis();
       infObj.date = Data[key].newdate;
       infObj.infstarttime = Data[key].infstarttime;
       infObj.infendtime = Data[key].infendtime;
       infObj.infdate = Data[key].infdate;
       infObj.inferr = Data[key].inferr;
       infObj.dripoid = Data[key].dripoid;
       infObj.batcharge_start = Data[key].batcharge_start;
       infObj.batcharge_stop = Data[key].batcharge_stop;
       infObj.batcharge_err = Data[key].batcharge_err;
       infObj.hostname = Data[key].hostname;
       infObj.save(function (err,infcb) {
           
           if(err) throw err;
           else{
                   console.log("success");
                   res.end();
                }
           });
    }
})




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
// cron.schedule('59 * * * *', function(){
//     var date = new Date();
//     var hour = date.getHours();
//     var time = Math.abs(hour-12);
//     Task.collection.updateMany({'time':time,'status':{ $in:['closed','skipped']}},{$set:{status:'opened'}});
// });
//Task 3 : Send Task details in every hour in 1st min
cron.schedule('1 * * * *', function(){
    sendTaskDetails();
});

cron.schedule('55 23 * * *', function(){
    sendAnalysis();
});

//MQTT Configuration
var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1883',{clientId:"LauraClient"});
//subscribing to topic dripo/ on connect
client.on('connect', function() {
    client.subscribe('dripo/#',{ qos: 1});

});


//sending infusion and device performance data to online server
function sendAnalysis() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var newdate = day + "/" + month + "/" + year;
    Infusionhistory.find({date:newdate}).exec(function (err,inf) {
        if(err) throw err;
        if(inf.length !=0){
            var options = {
              uri: 'http://dripo.care/analysis',
              method: 'POST',
              json: {
                data:inf
              }
            };

            request(options, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log("success"); 
              }
              else{
                console.log("call function again");
              }
            });
        }

    });
}




// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//New code for sending data to all device while starting a server
sendTaskDetails(); //call the function to fetch all task details and send to all nursing station

function sendTaskDetails() {
    Station.find({}).exec(function (err,station) {
        if(err) console.log(err);
        if(station.length != 0){
            for(var key in station){
                stationid = station[key]._id.toString();
                username = station[key].username;
                var alertedtask =[];
                var noAlertedTask;
                Task.find({_station:ObjectId(station[key]._id),status:'alerted'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,alertedtask) {
                    if(alertedtask.length==0){
                        var noAlertedTask = true;
                    }
                    else{
                        alertedtask = alertedtask;
                        var noAlertedTask = false;

                    }
                var date=new Date();
                var hour=date.getHours();
                var index =-1;
                var skippedtaskArray =[];
                Task.find({_station:ObjectId(station[key]._id),status:'opened'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,task) {
                        if(task.length==0 && noAlertedTask==true){
                            //do something if no task found

                            client.publish('dripo/'+stationid+'/bed',"",{ qos: 1, retain: true});
                            client.publish('dripo/'+stationid+'/task',"",{ qos: 1, retain: true});
                            client.publish('dripo/'+stationid+'/time',"",{ qos: 1, retain: true });
                            client.publish('dripo/'+stationid+'/med',"",{ qos: 1, retain: true });
                            client.publish('dripo/'+stationid+'/vol',"",{ qos: 1, retain: true });
                            client.publish('dripo/'+stationid+'/rate',"",{ qos: 1, retain: true });
                            Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                if(err) throw err;
                                if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                }
                                else{
                                    var pub_dff=[];
                                    for (var key2 in ivset)
                                    {
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');  

                                    }
                                    var pub_df=pub_dff.join('');
                                    client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                }
                            });

                        }
                        else if(task.length==0 && noAlertedTask==false){
                            //function to convert 24 hours time to 12 hours time
                            function tConvert (time) {
                              if (time<12) { 
                                return time+':00 AM';
                            
                              }
                              else if(time ==12){
                                return time+':00 PM';
                              }
                              else{
                                return time-12+':00 PM'
                              }
                            }
                            //function to slice medicine name to 8 characters
                            function sliceMedicinename(med) {
                                var len = med.length;
                                if(len>8){
                                    return med.slice(0,8);
                                }
                                else{
                                    return med;
                                }
                            }
                            var orderedTasks=alertedtask;
                            var pubBed=[];
                            var pubTaskid=[];
                            var pubTime=[];
                            var pubMed=[];
                            var pubVol=[];
                            var pubRate =[];
                            for (var key1 in orderedTasks){
                                pubBed.push(orderedTasks[key1]._bed.bedname); 
                                pubBed.push('&'); 
                                pubTaskid.push(orderedTasks[key1]._id); 
                                pubTaskid.push('&');
                                var timein24=  orderedTasks[key1].time;
                                var timein12=tConvert(timein24);
                                pubTime.push(timein12); 
                                pubTime.push('&'); 
                                var slicedMedname = sliceMedicinename(orderedTasks[key1]._medication.medicinename);
                                pubMed.push(slicedMedname); 
                                pubMed.push('&');
                                pubVol.push(orderedTasks[key1]._medication.medicinevolume); 
                                pubVol.push('&');
                                pubRate.push(orderedTasks[key1]._medication.medicinerate); 
                                pubRate.push('&');

                            }
                            var pub_bed=pubBed.join('');
                            client.publish('dripo/'+stationid+'/bed',pub_bed,{ qos: 1, retain: true});
                            var pub_taskid=pubTaskid.join('');
                            client.publish('dripo/'+stationid+'/task',pub_taskid,{ qos: 1, retain: true});
                            var pub_time=pubTime.join('');
                            client.publish('dripo/'+stationid+'/time',pub_time,{ qos: 1, retain: true });
                            var pub_med=pubMed.join('');
                            client.publish('dripo/'+stationid+'/med',pub_med,{ qos: 1, retain: true });
                            var pub_vol=pubVol.join('');
                            client.publish('dripo/'+stationid+'/vol',pub_vol,{ qos: 1, retain: true });
                            var pub_rate=pubRate.join('');
                            client.publish('dripo/'+stationid+'/rate',pub_rate,{ qos: 1, retain: true });
                            Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                if(err) throw err;
                                if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                }
                                else{
                                    var pub_dff=[];
                                    for (var key2 in ivset)
                                    {
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');  

                                    }
                                    var pub_df=pub_dff.join('');
                                    client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                }
                            });

                        }
                        else if(task.length == 1){
                            //if only one task is found send task
                            //function to convert 24 hours time to 12 hours time
                            function tConvert (time) {
                              if (time<12) { 
                                return time+':00 AM';
                            
                              }
                              else if(time ==12){
                                return time+':00 PM';
                              }
                              else{
                                return time-12+':00 PM'
                              }
                            }
                            //function to slice medicine name to 8 characters
                            function sliceMedicinename(med) {
                                var len = med.length;
                                if(len>8){
                                    return med.slice(0,8);
                                }
                                else{
                                    return med;
                                }
                            }
                            var orderedTasks=[];
                            if(noAlertedTask ==true){
                                var orderedTasks = task;

                            }
                            else{
                                orderedTasks = alertedtask.concat(task);

                            }
                            var pubBed=[];
                            var pubTaskid=[];
                            var pubTime=[];
                            var pubMed=[];
                            var pubVol=[];
                            var pubRate =[];
                            for (var key1 in orderedTasks){
                                pubBed.push(orderedTasks[key1]._bed.bedname); 
                                pubBed.push('&'); 
                                pubTaskid.push(orderedTasks[key1]._id); 
                                pubTaskid.push('&');
                                var timein24=  orderedTasks[key1].time;
                                var timein12=tConvert(timein24);
                                pubTime.push(timein12); 
                                pubTime.push('&'); 
                                var slicedMedname = sliceMedicinename(orderedTasks[key1]._medication.medicinename);
                                pubMed.push(slicedMedname); 
                                pubMed.push('&');
                                pubVol.push(orderedTasks[key1]._medication.medicinevolume); 
                                pubVol.push('&');
                                pubRate.push(orderedTasks[key1]._medication.medicinerate); 
                                pubRate.push('&');

                            }
                            var pub_bed=pubBed.join('');
                            client.publish('dripo/'+stationid+'/bed',pub_bed,{ qos: 1, retain: true});
                            var pub_taskid=pubTaskid.join('');
                            client.publish('dripo/'+stationid+'/task',pub_taskid,{ qos: 1, retain: true});
                            var pub_time=pubTime.join('');
                            client.publish('dripo/'+stationid+'/time',pub_time,{ qos: 1, retain: true });
                            var pub_med=pubMed.join('');
                            client.publish('dripo/'+stationid+'/med',pub_med,{ qos: 1, retain: true });
                            var pub_vol=pubVol.join('');
                            client.publish('dripo/'+stationid+'/vol',pub_vol,{ qos: 1, retain: true });
                            var pub_rate=pubRate.join('');
                            client.publish('dripo/'+stationid+'/rate',pub_rate,{ qos: 1, retain: true });
                            Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                if(err) throw err;
                                if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                }
                                else{
                                    var pub_dff=[];
                                    for (var key2 in ivset)
                                    {
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');  

                                    }
                                    var pub_df=pub_dff.join('');
                                    client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                }
                            });
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
                            //function to convert 24 hours time to 12 hours time
                            function tConvert (time) {
                              if (time<12) { 
                                return time+':00 AM';
                        
                              }
                              else if(time ==12){
                                return time+':00 PM';
                              }
                              else{
                                return time-12+':00 PM'
                              }
                            }
                            //function to slice medicine name to 8 characters
                            function sliceMedicinename(med) {
                                var len = med.length;
                                if(len>8){
                                    return med.slice(0,8);
                                }
                                else{
                                    return med;
                                }
                            }
                            var orderedTasks=[];
                            if(noAlertedTask==true){
                                orderedTasks=taskArray;

                            }
                            else{
                                orderedTasks = alertedtask.concat(taskArray);
                            }
                            var pubBed=[];
                            var pubTaskid=[];
                            var pubTime=[];
                            var pubMed=[];
                            var pubVol=[];
                            var pubRate =[];
                            for (var key1 in orderedTasks){
                                pubBed.push(orderedTasks[key1]._bed.bedname); 
                                pubBed.push('&'); 
                                pubTaskid.push(orderedTasks[key1]._id); 
                                pubTaskid.push('&');
                                var timein24=  orderedTasks[key1].time;
                                var timein12=tConvert(timein24);
                                pubTime.push(timein12); 
                                pubTime.push('&'); 
                                var slicedMedname = sliceMedicinename(orderedTasks[key1]._medication.medicinename);
                                pubMed.push(slicedMedname); 
                                pubMed.push('&');
                                pubVol.push(orderedTasks[key1]._medication.medicinevolume); 
                                pubVol.push('&');
                                pubRate.push(orderedTasks[key1]._medication.medicinerate); 
                                pubRate.push('&');

                            }
                            var pub_bed=pubBed.join('');
                            client.publish('dripo/'+stationid+'/bed',pub_bed,{ qos: 1, retain: true});
                            var pub_taskid=pubTaskid.join('');
                            client.publish('dripo/'+stationid+'/task',pub_taskid,{ qos: 1, retain: true});
                            var pub_time=pubTime.join('');
                            client.publish('dripo/'+stationid+'/time',pub_time,{ qos: 1, retain: true });
                            var pub_med=pubMed.join('');
                            client.publish('dripo/'+stationid+'/med',pub_med,{ qos: 1, retain: true });
                            var pub_vol=pubVol.join('');
                            client.publish('dripo/'+stationid+'/vol',pub_vol,{ qos: 1, retain: true });
                            var pub_rate=pubRate.join('');
                            client.publish('dripo/'+stationid+'/rate',pub_rate,{ qos: 1, retain: true });

                            Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                if(err) throw err;
                                if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                }
                                else{
                                    var pub_dff=[];
                                    for (var key2 in ivset)
                                    {
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');
                                      pub_dff.push(ivset[key2].ivsetdpf); 
                                      pub_dff.push('&');  

                                    }
                                    var pub_df=pub_dff.join('');
                                    client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                }
                            });


                        }
                    }); 

                    
                    });
            }

        }
       
    })
    
}

//function to update the task details for a particular station
exports.updateTaskdetails = function (stationid) {
     Station.find({_id:ObjectId(stationid)}).exec(function (err,station) {
         if(err) console.log(err);
         if(station.length != 0){
             for(var key in station){
                 stationid = station[key]._id.toString();
                 username = station[key].username;
                 var alertedtask =[];
                 var noAlertedTask;
                 Task.find({_station:ObjectId(station[key]._id),status:'alerted'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,alertedtask) {
                     if(alertedtask.length==0){
                         noAlertedTask = true;
                     }
                     else{
                        noAlertedTask = false;
                         alertedtask = alertedtask;

                     }
                 var date=new Date();
                 var hour=date.getHours();
                 var index =-1;
                 var skippedtaskArray =[];
                 Task.find({_station:ObjectId(station[key]._id),status:'opened'}).sort({time:1}).populate({path:'_bed',model:'Bed'}).populate({path:'_medication',model:'Medication'}).populate({path:'_patient',model:'Patient'}).exec(function(err,task) {
                         if(task.length==0 && noAlertedTask==true){
                             //send null to clear the retained message

                             client.publish('dripo/'+stationid+'/bed',"",{ qos: 1, retain: true});
                             client.publish('dripo/'+stationid+'/task',"",{ qos: 1, retain: true});
                             client.publish('dripo/'+stationid+'/time',"",{ qos: 1, retain: true });
                             client.publish('dripo/'+stationid+'/med',"",{ qos: 1, retain: true });
                             client.publish('dripo/'+stationid+'/vol',"",{ qos: 1, retain: true });
                             client.publish('dripo/'+stationid+'/rate',"",{ qos: 1, retain: true });
                             Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                 if(err) throw err;
                                 if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                 }
                                 else{
                                     var pub_dff=[];
                                     for (var key2 in ivset)
                                     {
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');  

                                     }
                                     var pub_df=pub_dff.join('');
                                     client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                 }
                             });

                         }
                         else if(task.length==0 && noAlertedTask==false){
                             //function to convert 24 hours time to 12 hours time
                             function tConvert (time) {
                               if (time<12) { 
                                 return time+':00 AM';
                             
                               }
                               else if(time ==12){
                                 return time+':00 PM';
                               }
                               else{
                                 return time-12+':00 PM'
                               }
                             }
                             //function to slice medicine name to 8 characters
                             function sliceMedicinename(med) {
                                 var len = med.length;
                                 if(len>8){
                                     return med.slice(0,8);
                                 }
                                 else{
                                     return med;
                                 }
                             }
                             var orderedTasks=alertedtask;
                             var pubBed=[];
                             var pubTaskid=[];
                             var pubTime=[];
                             var pubMed=[];
                             var pubVol=[];
                             var pubRate =[];
                             for (var key1 in orderedTasks){
                                 pubBed.push(orderedTasks[key1]._bed.bedname); 
                                 pubBed.push('&'); 
                                 pubTaskid.push(orderedTasks[key1]._id); 
                                 pubTaskid.push('&');
                                 var timein24=  orderedTasks[key1].time;
                                 var timein12=tConvert(timein24);
                                 pubTime.push(timein12); 
                                 pubTime.push('&'); 
                                 var slicedMedname = sliceMedicinename(orderedTasks[key1]._medication.medicinename);
                                 pubMed.push(slicedMedname); 
                                 pubMed.push('&');
                                 pubVol.push(orderedTasks[key1]._medication.medicinevolume); 
                                 pubVol.push('&');
                                 pubRate.push(orderedTasks[key1]._medication.medicinerate); 
                                 pubRate.push('&');

                             }
                             var pub_bed=pubBed.join('');
                             client.publish('dripo/'+stationid+'/bed',pub_bed,{ qos: 1, retain: true});
                             var pub_taskid=pubTaskid.join('');
                             client.publish('dripo/'+stationid+'/task',pub_taskid,{ qos: 1, retain: true});
                             var pub_time=pubTime.join('');
                             client.publish('dripo/'+stationid+'/time',pub_time,{ qos: 1, retain: true });
                             var pub_med=pubMed.join('');
                             client.publish('dripo/'+stationid+'/med',pub_med,{ qos: 1, retain: true });
                             var pub_vol=pubVol.join('');
                             client.publish('dripo/'+stationid+'/vol',pub_vol,{ qos: 1, retain: true });
                             var pub_rate=pubRate.join('');
                             client.publish('dripo/'+stationid+'/rate',pub_rate,{ qos: 1, retain: true });
                             Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                 if(err) throw err;
                                 if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                 }
                                 else{
                                     var pub_dff=[];
                                     for (var key2 in ivset)
                                     {
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');  

                                     }
                                     var pub_df=pub_dff.join('');
                                     client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                 }
                             });

                         }
                         else if(task.length == 1){
                             //if only one task is found send task
                             //function to convert 24 hours time to 12 hours time
                             function tConvert (time) {
                               if (time<12) { 
                                 return time+':00 AM';
                                
                               }
                               else if(time ==12){
                                 return time+':00 PM';
                               }
                               else{
                                 return time-12+':00 PM'
                               }
                             }
                             //function to slice medicine name to 8 characters
                             function sliceMedicinename(med) {
                                 var len = med.length;
                                 if(len>8){
                                     return med.slice(0,8);
                                 }
                                 else{
                                     return med;
                                 }
                             }
                             var orderedTasks=[];
                             if(noAlertedTask==true){
                                 orderedTasks=task;

                             }
                             else{
                                 orderedTasks = alertedtask.concat(task);
                             }

                             var pubBed=[];
                             var pubTaskid=[];
                             var pubTime=[];
                             var pubMed=[];
                             var pubVol=[];
                             var pubRate =[];
                             for (var key1 in orderedTasks){
                                 pubBed.push(orderedTasks[key1]._bed.bedname); 
                                 pubBed.push('&'); 
                                 pubTaskid.push(orderedTasks[key1]._id); 
                                 pubTaskid.push('&');
                                 var timein24=  orderedTasks[key1].time;
                                 var timein12=tConvert(timein24);
                                 pubTime.push(timein12); 
                                 pubTime.push('&'); 
                                 var slicedMedname = sliceMedicinename(orderedTasks[key1]._medication.medicinename);
                                 pubMed.push(slicedMedname); 
                                 pubMed.push('&');
                                 pubVol.push(orderedTasks[key1]._medication.medicinevolume); 
                                 pubVol.push('&');
                                 pubRate.push(orderedTasks[key1]._medication.medicinerate); 
                                 pubRate.push('&');

                             }
                             var pub_bed=pubBed.join('');
                             client.publish('dripo/'+stationid+'/bed',pub_bed,{ qos: 1, retain: true});
                             var pub_taskid=pubTaskid.join('');
                             client.publish('dripo/'+stationid+'/task',pub_taskid,{ qos: 1, retain: true});
                             var pub_time=pubTime.join('');
                             client.publish('dripo/'+stationid+'/time',pub_time,{ qos: 1, retain: true });
                             var pub_med=pubMed.join('');
                             client.publish('dripo/'+stationid+'/med',pub_med,{ qos: 1, retain: true });
                             var pub_vol=pubVol.join('');
                             client.publish('dripo/'+stationid+'/vol',pub_vol,{ qos: 1, retain: true });
                             var pub_rate=pubRate.join('');
                             client.publish('dripo/'+stationid+'/rate',pub_rate,{ qos: 1, retain: true });
                             Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                 if(err) throw err;
                                 if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                 }
                                 else{
                                     var pub_dff=[];
                                     for (var key2 in ivset)
                                     {
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');  

                                     }
                                     var pub_df=pub_dff.join('');
                                     client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                 }
                             });
                                
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
                             //function to convert 24 hours time to 12 hours time
                             function tConvert (time) {
                               if (time<12) { 
                                 return time+':00 AM';
                            
                               }
                               else if(time ==12){
                                 return time+':00 PM';
                               }
                               else{
                                 return time-12+':00 PM'
                               }
                             }
                             //function to slice medicine name to 8 characters
                             function sliceMedicinename(med) {
                                 var len = med.length;
                                 if(len>8){
                                     return med.slice(0,8);
                                 }
                                 else{
                                     return med;
                                 }
                             }
                             var orderedTasks=[];
                             if(noAlertedTask==true){
                                 orderedTasks=taskArray;

                             }
                             else{
                                 orderedTasks = alertedtask.concat(taskArray);
                             }

                             var pubBed=[];
                             var pubTaskid=[];
                             var pubTime=[];
                             var pubMed=[];
                             var pubVol=[];
                             var pubRate =[];
                             for (var key1 in orderedTasks){
                                 pubBed.push(orderedTasks[key1]._bed.bedname); 
                                 pubBed.push('&'); 
                                 pubTaskid.push(orderedTasks[key1]._id); 
                                 pubTaskid.push('&');
                                 var timein24=  orderedTasks[key1].time;
                                 var timein12=tConvert(timein24);
                                 pubTime.push(timein12); 
                                 pubTime.push('&'); 
                                 var slicedMedname = sliceMedicinename(orderedTasks[key1]._medication.medicinename);
                                 pubMed.push(slicedMedname); 
                                 pubMed.push('&');
                                 pubVol.push(orderedTasks[key1]._medication.medicinevolume); 
                                 pubVol.push('&');
                                 pubRate.push(orderedTasks[key1]._medication.medicinerate); 
                                 pubRate.push('&');

                             }
                             var pub_bed=pubBed.join('');
                             client.publish('dripo/'+stationid+'/bed',pub_bed,{ qos: 1, retain: true});
                             var pub_taskid=pubTaskid.join('');
                             client.publish('dripo/'+stationid+'/task',pub_taskid,{ qos: 1, retain: true});
                             var pub_time=pubTime.join('');
                             client.publish('dripo/'+stationid+'/time',pub_time,{ qos: 1, retain: true });
                             var pub_med=pubMed.join('');
                             client.publish('dripo/'+stationid+'/med',pub_med,{ qos: 1, retain: true });
                             var pub_vol=pubVol.join('');
                             client.publish('dripo/'+stationid+'/vol',pub_vol,{ qos: 1, retain: true });
                             var pub_rate=pubRate.join('');
                             client.publish('dripo/'+stationid+'/rate',pub_rate,{ qos: 1, retain: true });
                             Ivset.find({username:username}).sort({ivsetdpf:1}).exec(function(err,ivset){
                                 if(err) throw err;
                                 if(!ivset.length){
                                    client.publish('dripo/' + stationid+ '/df',"",{ qos: 1, retain: true });
                                 }
                                 else{
                                     var pub_dff=[];
                                     for (var key2 in ivset)
                                     {
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');
                                       pub_dff.push(ivset[key2].ivsetdpf); 
                                       pub_dff.push('&');  

                                     }
                                     var pub_df=pub_dff.join('');
                                     client.publish('dripo/' + stationid+ '/df',pub_df,{ qos: 1, retain: true });

                                 }
                             });


                         }
                     }); 

                        
                     });
             }

         }
     }); 
           
};



//function fired on recieving a message from device in topic dripo/
client.on('message', function (topic, message) {
    var topicinfoArray = topic.split("/");
    var dripoid = topicinfoArray[1];
    //to send station id back to requested device
    if(topicinfoArray[1]=='station'){
        var deviceid = message.toString();
        Dripo.find({dripoid:deviceid}).exec(function(err,dripo){
            var stationid=dripo[0]._station.toString();
            client.publish('dripo/' + deviceid+'/station' ,stationid,function (err) {
                if(err){
                    console.log(err);
                }
            });


        });


    }

    Dripo.find({dripoid:dripoid}).exec(function(err,dripo){
        if(err) throw err;
        if(!dripo.length){
            if(topicinfoArray[2] != 'will' && topicinfoArray[1] != 'station' && topicinfoArray[2] != 'bed'
                && topicinfoArray[2] != 'task' && topicinfoArray[2] != 'time' && topicinfoArray[2] != 'med' && topicinfoArray[2] != 'vol'
                 && topicinfoArray[2] != 'rate' && topicinfoArray[2] != 'df'){
                client.publish('error/' + dripoid ,'Device&Not&Added',function (err) {
                    console.log("DEVICE NOT ADDED");
                    if(err){
                        console.log(err);
                    }
                });
            }
           
        }
        else{
            //for testing the device reason for restart
            if(topicinfoArray[2].toString() == 'will'){
                var filePath = path.join(__dirname, '../laura_logs/restart.txt');
                var messageStr = message.toString();
                var messageArray = messageStr.split('-');
                if(messageArray[0] == 'Online'){
                    fs.appendFileSync(filePath,messageArray[1]+'\n', "UTF-8",{'flags': 'a+'});

                }

            }

            //******************************************
            //old req,response device -server communnication code
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
            else if(topicinfoArray[2] == 'med_req'){
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
            if(topicinfoArray[2]=='cretask_req'){
                var msg = message.toString();
                var msgArray = msg.split("-");
                var bedid = ObjectId(msgArray[0]);
                Bed.find({_id:ObjectId(msgArray[0])}).sort({time:1}).exec(function(err,bed){
                    if(err) throw err;
                    if(bed.length != 0){
                        var medicationObj = new Medication();
                        medicationObj.medicinename = 'unknown';
                        medicationObj.medicinerate = 0;
                        medicationObj.medicinevolume = msgArray[2];
                        medicationObj.stationname = bed[0].stationname;
                        medicationObj._bed = ObjectId(msgArray[0]);
                        medicationObj._patient = ObjectId(bed[0]._patient);
                        medicationObj.source = 'dripo';
                        patientid =  ObjectId(bed[0]._patient);
                        console.log(patientid);
                        medicationObj.save(function (err,medcb) {
                            if(err) throw err;
                            else{
                                Patient.collection.update({_id:medcb._patient},{$push:{_medication:medcb._id}},{upsert:true});
                                var timeObj = new Task();
                                timeObj.time=new Date().getHours();
                                timeObj.type='infusion';
                                timeObj.priority = 0;
                                timeObj.status='opened';
                                timeObj.createdat=new Date();
                                timeObj.infusedVolume =0;
                                timeObj._patient=patientid;
                                timeObj._bed=bedid;
                                timeObj._medication=ObjectId(medcb._id);
                                timeObj._station=ObjectId(bed[0]._station);
                                timeObj.save(function (err,timecb) {
                                    if(err) throw err;
                                    else{
                                        Medication.collection.update({_id:ObjectId(medcb._id)},{$push:{_task:timecb._id}},{upsert:true});
                                        var pub_cretask=timecb._id+'&'+medcb._id+'&';
                                        client.publish('dripo/' + dripoid + '/cretaskreply',pub_cretask,{ qos: 1, retain: false });  

                                    }
                                });


                                 
                            }
                        });
                    }

                });




            }

           



        }//end of if access granted for dripo

    });

});

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//Code for monitoring forwarding the live infusion deails to frontend via socketio and updating database
//socket.io config
 var io = require('socket.io')(server);
io.on('connection', function (socket) {
   // when socket connection publishes a message, forward that message the the mqtt broker
  socket.on('publish', function (data) {
      client.publish(data.topic,data.payload,{ qos: 1, retain: false});
  });

});
client.on('message', function (topic, payload, packet) {
    var topicinfoArray = topic.split("/");
    var dripoid = topicinfoArray[1];
    var commonTopic = 'dripo/'+dripoid+'/';
    if(topicinfoArray[2] == 'mon'){
    Dripo.find({dripoid:dripoid}).exec(function(err,dripo){
        if(err) throw err;
        if(!dripo.length){
            if(topicinfoArray[2] != 'will'){
                client.publish('error/' + dripoid ,'Access Denied',function (err) {
                    if(err){
                        console.log(err);
                    }
                });
            }
           
        }
        else{
            var staid = dripo[0]._station;
            var message = payload.toString();
            var messageArray = message.split("-");
            var taskid = messageArray[0];
            var status = messageArray[1];
            var rate = messageArray[2];
            var infusedVolume = messageArray[3];
            var timeRemaining = messageArray[4];
            var totalVolume = messageArray[5];
            var deviceCharge = messageArray[6];
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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge
                });

                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status,topic:commonTopic,devicecharge:deviceCharge}});
                // Medication.collection.update({_id:ObjectId(medid),source:'dripo'},{$set:{medicinerate:rate}},{upsert:true});    
                Infusionhistory.find({_task:taskid,date:newdate}).exec(function(err,inf){
                    if(inf.length==0){
                        console.log("in");
                        var infObj = new Infusionhistory();
                        infObj.date = newdate;
                        infObj.infstarttime = inftime;
                        infObj.infdate = infdate;
                        infObj.inferr = [];
                        infObj._task = ObjectId(taskid);
                        infObj.dripoid = dripoid;
                        infObj.batcharge_start = deviceCharge;
                        infObj.hostname = os.hostname();
                        infObj.save(function (err,infcb) {
                            
                            if(err) throw err;
                            else{
                                Task.findOne({_id:ObjectId(taskid)}).exec(function(err,taskdetails) {
                                    if(err) throw err;
                                    if(taskdetails.length != 0){
                                        Medication.collection.update({_id:ObjectId(taskdetails._medication)},{$push:{_infusionhistory:infcb._id}},{upsert:true});    

                                    }
                                });
                            }
                        });
                        
                    }
                });

                var filePath = path.join(__dirname, '../laura_logs/time4rate2set.txt');
                fs.appendFileSync(filePath,messageArray[3]+"-"+messageArray[7]+'\n', "UTF-8",{'flags': 'a+'});
                var filePath = path.join(__dirname, '../laura_logs/batterycharge.txt');
                fs.appendFileSync(filePath,"Starting Battery check of device "+dripoid+'\n', "UTF-8",{'flags': 'a+'});
                fs.appendFileSync(filePath,inftime+","+messageArray[6]+'\n', "UTF-8",{'flags': 'a+'});
                var stationid = staid.toString();
                exports.updateTaskdetails(stationid);

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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge
                });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status,devicecharge:deviceCharge}});
                var filePath = path.join(__dirname, '../laura_logs/batterycharge.txt');
                fs.appendFileSync(filePath,inftime+","+messageArray[6]+'\n', "UTF-8",{'flags': 'a+'});

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
                if(!taskid){
                    console.log("no task id");
                }

                else{
                    Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'alerted',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status,devicecharge:""}});
                    Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{infendtime:inftime,inftvol:infusedVolume,batcharge_stop:deviceCharge}},{upsert:true}); 

                    var stationid = staid.toString();
                    exports.updateTaskdetails(stationid);

                }
                //for battery check
                var filePath = path.join(__dirname, '../laura_logs/batterycharge.txt');
                fs.appendFileSync(filePath,inftime+","+messageArray[6]+'\n'+"End of infusion"+'\n', "UTF-8",{'flags': 'a+'});

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
                        'percentage':percentage,
                        'deviceCharge':deviceCharge

                    });
                    Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:'Empty'}});
                //for battery check
                var filePath = path.join(__dirname, '../laura_logs/batterycharge.txt');
                fs.appendFileSync(filePath,inftime+","+messageArray[6]+'\n'+"End of infusion"+'\n', "UTF-8",{'flags': 'a+'});

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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge

                });
            
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status,topic:commonTopic}});
              

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
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'closed',rate:"",infusedVolume:"",timeRemaining:"",totalVolume:"",percentage:"",infusionstatus:"",topic:"",devicecharge:"",batcharge_stop:deviceCharge}});
                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{infendtime:inftime,inftvol:infusedVolume}},{upsert:true}); 
           //for battery check
           var filePath = path.join(__dirname, '../laura_logs/batterycharge.txt');
           fs.appendFileSync(filePath,inftime+","+messageArray[6]+'\n'+"End of infusion"+'\n', "UTF-8",{'flags': 'a+'});


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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge

                });
                var infdate= new Date();
                var inftime=(new Date()).getHours()+':'+(new Date()).getMinutes()+':'+(new Date()).getSeconds();
                var dateObj = new Date();
                var month = dateObj.getUTCMonth() + 1; //months from 1-12
                var day = dateObj.getUTCDate();
                var year = dateObj.getUTCFullYear();
                var newdate = day + "/" + month + "/" + year;
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});
                Infusionhistory.find({_task:ObjectId(taskid),date:newdate}).exec(function(err,inf){
                    if(err) throw err;
                    if(inf.length !=0){
                        if(inf[0].inferr.length != 0){
                            console.log("err");
                            // var inferrLength = inf[0].inferr.length-1;
                            var lastTime = inf[0].lasterr.errtime;
                            var lastError = inf[0].lasterr.errtype;
                            var lasttimeInfoArray = lastTime.split(':');
                            var lastMin = lasttimeInfoArray[1];
                            var lastHour = lasttimeInfoArray[0];
                            var presentMin = (new Date()).getMinutes();
                            var presentHour = (new Date()).getHours();
                            Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{lasterr:{errtype:status,errtime:inftime}}},{upsert:true}); 
                            if(presentHour-lastHour !=0 || presentMin - lastMin > 2 || lastError != status){
                                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$push:{inferr:{errtype:status,errtime:inftime}}},{upsert:true}); 
                                Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$push:{batcharge_err:{errtime:inftime,batcharge:deviceCharge}}},{upsert:true}); 


                            }

                        }

                        else{
                            Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$set:{lasterr:{errtype:status,errtime:inftime}}},{upsert:true}); 
                            Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$push:{inferr:{errtype:status,errtime:inftime}}},{upsert:true}); 
                            Infusionhistory.collection.update({_task:ObjectId(taskid),date:newdate},{$push:{batcharge_err:{errtime:inftime,batcharge:deviceCharge}}},{upsert:true}); 


                        }
                    }

                });
                //for battery check
                var filePath = path.join(__dirname, '../laura_logs/batterycharge.txt');
                fs.appendFileSync(filePath,inftime+","+messageArray[6]+'\n', "UTF-8",{'flags': 'a+'});


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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge

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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge

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
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'alerted',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:'Connection_Lost'}});


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
                    'percentage':percentage,
                    'deviceCharge':deviceCharge

                });
                Task.collection.update({_id:ObjectId(taskid)},{$set:{status:'inprogress',rate:rate,infusedVolume:infusedVolume,timeRemaining:timeRemaining,totalVolume:totalVolume,percentage:percentage,infusionstatus:status}});

            }


            
        }


    });
    }//end of if mon

    // if(topicinfoArray[2] == 'will'){
    //     var message = payload.toString();
    //     if(message == 'offline'){
    //         Task.find({topic:commonTopic}).exec(function(err,task){
    //             if(task.length != 0){
    //                 io.emit('dripo',{
    //                     'topic':topic.toString(),
    //                     'payload':payload.toString(),
    //                     'infusionstatus':'Device_Disconnected',
    //                     'status':'inprogress',
    //                     'taskid':task[0]._id,
    //                     'rate':task[0].rate,
    //                     'infusedVolume':task[0].infusedVolume,
    //                     'timeRemaining':task[0].timeRemaining,
    //                     'totalVolume':task[0].totalVolume,
    //                     'percentage':task[0].percentage
    //                 });
    //                 Task.collection.update({_id:task[0]._id},{$set:{infusionstatus:"Device_Disconnected",status:'alerted',devicecharge:""}});
    //             }
               
    //         });

    //     }        

    // }
});


server.listen(process.env.PORT || port, function(){
    console.log("Server started listening in port"+port);
});




