/*
* Overview: Location Refference Model
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 
Location Refference Model
* 
*/
var mongoose = require('../../common/js/db');

var locationReffSchema = mongoose.Schema({
  	country:{type:String},
  	state:{type:String},
  	city:{type:String},
  	zipcode:{type:String},
  	area:[],
  	geo:{lati:String,longi:String}
  }
);

var LocationReffModel = mongoose.model('locations', locationReffSchema);

//export the model
module.exports = LocationReffModel;

