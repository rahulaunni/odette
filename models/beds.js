var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Bed = new Schema({
	bedname:String,
	username: String,
	stationname: String,
	status:String,
	_user:{ type: Schema.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Bed', Bed);