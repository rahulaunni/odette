var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var medication= new Schema({

	medicinename:String,
	medicinerate:Number,
	medicinevolume:Number,
	stationname: String,
	_admin:String,
	_tasks:[{ type: Schema.ObjectId, ref: 'Task'}],

});



module.exports = mongoose.model('Medication',medication);

