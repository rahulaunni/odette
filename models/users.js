var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var userSchema = new Schema({
    userName: {type:String, lowercase:true, required:true, unique:true},
    password: {type:String, required:true},
    hospitalName: {type:String, required:true},
    roles: {type:String, enum:['admin','doctor','nurse'], default:['admin']},
    active: {type:Boolean,required:true,default:false},
    tempToken: {type:String,required:true}
});

userSchema.pre('save', function (next) {
	var user = this;
	bcrypt.hash(user.password,10,function (err,hash) {
		if(err) return next(err);
		user.password = hash;
		next();
	})
})

userSchema.methods.comparePassword = function (password) {
	return bcrypt.compareSync(password,this.password)
};


module.exports = mongoose.model('user', userSchema);