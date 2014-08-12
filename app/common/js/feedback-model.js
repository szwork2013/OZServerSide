/*
* Overview:  Model
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

var FeedBackFormSchema = mongoose.Schema(
  {
  	userid:{type:String},
  	email:{type:String},
  	mobileno:{type:String},
  	feedbacktext:{type:String},
  	feedbackdate:{type:Date,default:new Date()}
  }
);

var FeedbackModel = mongoose.model('feedbacks', FeedBackFormSchema);

//export the model
module.exports = FeedbackModel;
