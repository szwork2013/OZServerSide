/*
* Overview: Country Code Model
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

var countryCodeSchema = mongoose.Schema(
  {
  	country:{type:String,uppercase: true},
  	isocode1:{type:String},
  	isocode2:{type:String},
  	code:{type:String}
  	
  }
);

var CountryCodeModel = mongoose.model('countrycodes', countryCodeSchema);

//export the model
module.exports = CountryCodeModel;
