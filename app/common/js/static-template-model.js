var mongoose = require('./db');

var staticTemplateSchema = mongoose.Schema(
  {
  	type:{type:String},
  	template:{type:String},
  	createdate:{type:Date},
  	updateddate:{type:Date}
  }
);

var StaticTemplateModel = mongoose.model('statictemplates', staticTemplateSchema);

//export the model
module.exports = StaticTemplateModel;