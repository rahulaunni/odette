var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var userSchema = new Schema({
    userName: {type:String, lowercase:true, required:true, unique:true},
    password: {type:String, required:true},
    hospitalName: {type:String, required:true},
    roles: {type:String, enum:['admin','doctor','nurse'], default:['admin']},
    active: {type:Boolean,required:true,default:false},
    tempToken: {type:String,required:true,defualt:false},
    resetToken: {type:String,required:true,default:false}
});

//run this before saving a user collection
userSchema.pre('save', function (next) {
	var user = this;
	if (!user.isModified('password')) return next(); // If password was not changed or is new, ignore middleware
	bcrypt.hash(user.password,10,function (err,hash) {
		if(err) return next(err);
		user.password = hash;
		next();
	})
})

//comparing encrypted password for authentication
userSchema.methods.comparePassword = function (password) {
	return bcrypt.compareSync(password,this.password)
};


module.exports = mongoose.model('user', userSchema);