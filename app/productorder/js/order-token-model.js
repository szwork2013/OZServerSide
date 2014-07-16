/*
* Overview: OTP Model
* Dated:
* Author: Sunil More
* Copyright: Helping Hand and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3-2013 | xyx | Add a new property
* 

Otp model to create One Time Password for mobile verification through SMS
*/
var mongoose = require('../../common/js/db');
var orderTokenSchema = new mongoose.Schema({
    _userId: { type:String,required: true, ref: 'User' },
    otp: { type: String },
    orderid:{type:String},
    createddate: { type: Date, required: true, default: Date.now,expires:"1d"},
    status:{type:String,default:"active"}
});
//This schema methods call before save method for Otm model
orderTokenSchema.pre('save',function (next) {
  var verificationToken = this;
  var otp = Math.floor(Math.random()*100000000);
  verificationToken.otp=otp;
  next();
});

var OrderTokenModel = mongoose.model('ordertokens', orderTokenSchema);
module.exports = OrderTokenModel;