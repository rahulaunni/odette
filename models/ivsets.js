var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Ivset = new Schema({
	ivsetname:String,
	ivsetdpf:Number,
	username: String,
	_user:{ type: Schema.ObjectId, ref: 'User' },
	_station:{ type: Schema.ObjectId, ref: 'Station' },

});

module.exports = mongoose.model('Ivset', Ivset);