/*
* Overview: email template
* Dated:
* Author: Sunil More
* Copyright:  GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3-2013 | xyx | Add a new property
* 08-10-2013|Sunil More|adding new model email template
*/

var mongoose = require('./db');

// Verification token model
var emailTemplateSchema = new mongoose.Schema({
  templatetype:{type:String}, 
  subject:{type:String},
  description:{type:String}
  
});



var EmailTemplateModel = mongoose.model('emailtemplates', emailTemplateSchema);
module.exports = EmailTemplateModel;
