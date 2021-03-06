var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Bed = new Schema({
	bedname:String,
	username: String,
	stationname: String,
	status:String,
	_patient:{ type: Schema.ObjectId, ref: 'Patient' },
	_user:{ type: Schema.ObjectId, ref: 'User' },
	_station:{ type: Schema.ObjectId, ref: 'Station'},

});

module.exports = mongoose.model('Bed', Bed);