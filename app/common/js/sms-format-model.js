/*
* Overview: SMS format
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 
SMS Template Model for getting different template like register,welocme,otp,acceptance to workorder etc.
* 
*/
var mongoose = require('./db');

var smsFormatSchema = mongoose.Schema(
  {
  	name:{type:String},
  	format:{ type:String }
  }
);

var SMSFormatModel = mongoose.model('smsformats', smsFormatSchema);

//export the model
module.exports = SMSFormatModel;
