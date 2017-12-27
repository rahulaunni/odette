var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Patient = new Schema({
	patientname:String,
    patientage:Number,
    patientweight:Number,
    patientstatus:String,
    bedname:String,
    doctor:String,
    admittedon:Date,
    dischargedon:Date,
    stationname: String,
    _admin:String,
    _medication:[{ type: Schema.ObjectId, ref: 'Medication'}],
});


module.exports = mongoose.model('Patient', Patient);