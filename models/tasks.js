var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var task= new Schema({
_medication:{ type: Schema.ObjectId, ref: 'medication'},
time:Number,
});

module.exports = mongoose.model('Task',task);

