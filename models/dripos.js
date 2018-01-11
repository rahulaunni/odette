var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Dripo = new Schema({
	dripoid:{type:String, unique:true},
	username: String,
	stationname: String,
	_user:{ type: Schema.ObjectId, ref: 'User' },
	_station:{ type: Schema.ObjectId, ref: 'Station'},
});

module.exports = mongoose.model('Dripo', Dripo);