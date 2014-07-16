var mongoose = require('./db');

var smsTemplateSchema = mongoose.Schema(
  {
  	name:{type:String},
  	template: { type:String },
  	lang:{type:String}
  }
);

var SMSTemplateModel = mongoose.model('smstemplates', smsTemplateSchema);

//export the model
module.exports = SMSTemplateModel;