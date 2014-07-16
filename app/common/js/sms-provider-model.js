/*
* Overview: The schema model for SMS Providers.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');

var smsProviderSchema = mongoose.Schema(
  {
  	name:{type:String},
  	url: { type:String },
    parameter:{type:String},
    message:{type:String},
    mnumber:{type:String},
  	active: {type:Boolean}
  }
);

var SMSProviderModel = mongoose.model('smsproviders', smsProviderSchema);

//export the model
module.exports = SMSProviderModel;
