var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var analysis= new Schema({
_task:{ type: Schema.ObjectId, ref: 'Task'},
date:String,
infdate: Date,
infstarttime:String,
inftvol:String,
infendtime:String,
dripoid:String,
hostname:String,
batcharge_start:String,
batcharge_stop:String,
inferr:[{errtype:String,errtime:String}],
lasterr:{errtype:String,errtime:String},
batcharge_err:[{time:String,batcharge:Number}],
});



module.exports = mongoose.model('Analysis',analysis);