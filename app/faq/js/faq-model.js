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
var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var questionAnswerSchema = mongoose.Schema(
  {
  	faqid:{type:String,unique:true},
  	questionheading:{type:String},//product,order
  	question:{type:String},
  	answer:{type:String},
  	createdate:{type:Date,default:new Date()}
  }
);
questionAnswerSchema.pre('save', function(next) {
    var faq = this;
    faq.faqid = generateId();
    // console.log("OrderData in pre "+serviceorderrequest);
    next();
});
var FrequentlyAskedQuestionModel = mongoose.model('faqs', questionAnswerSchema);

//export the model
module.exports = FrequentlyAskedQuestionModel;
