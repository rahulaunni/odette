var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Synapse = new Schema({
	hostname:String,
	publicip: String,

});

module.exports = mongoose.model('Synapse', Synapse);