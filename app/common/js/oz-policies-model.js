var mongoose = require('./db');

var ozPoliciesSchema = mongoose.Schema(
  {
  	type:{type:String},
  	template:{type:String},
  	createdate:{type:Date},
  	updateddate:{type:Date}
  }
);

var ozPoliciesSchema = mongoose.model('ozpolicies', ozPoliciesSchema);

//export the model
module.exports = ozPoliciesSchema;