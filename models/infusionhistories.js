var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var infusionhistory= new Schema({
_timetable:[{ type: Schema.ObjectId, ref: 'Timetable'}],
date:String,
infdate: Date,
infstarttime:String,
inftvol:String,
infendtime:String,
inferr:[{errtype:String,errtime:String}]
});



module.exports = mongoose.model('Infusionhistory',infusionhistory);

