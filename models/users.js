var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    userName: {type:String, lowercase:true, required:true, unique:true},
    password: {type:String, required:true},
    hospitalName: {type:String, required:true},
    roles: {type:String, enum:['admin','doctor','nurse'], default:['admin']}
});

module.exports = mongoose.model('user', userSchema);