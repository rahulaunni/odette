var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Station = new Schema({
	stationname:String,
	username: String,
	_user:{ type: Schema.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Station', Station);