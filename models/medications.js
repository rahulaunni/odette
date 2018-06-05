var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var medication= new Schema({

	medicinename:String,
	medicinerate:Number,
	medicinevolume:Number,
	source:String,
	stationname: String,
	_admin:String,
	_task:{ type: Schema.ObjectId, ref: 'Task'},
	_bed:{ type: Schema.ObjectId, ref: 'Bed'},
	_patient:{ type: Schema.ObjectId, ref: 'Patient'},
	_infusionhistory:[{ type: Schema.ObjectId, ref: 'Infusionhistory'}],
});



module.exports = mongoose.model('Medication',medication);

