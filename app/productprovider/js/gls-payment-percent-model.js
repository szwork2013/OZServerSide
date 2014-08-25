/*
* Overview: The schema model for Sellers/Provider Payment Percent.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2014
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 25-08-2014 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
// var generateId = require('time-uuid');
 
var glsPaymentPercentSchema = mongoose.Schema({
  providerid:{type:String,ref:"productprovider"},
  // providername:{type:String,ref:"productprovider"},
  percent:{type:Number}
});

glsPaymentPercentSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};
var glspaymentpercent = mongoose.model('glspaymentpercent', glsPaymentPercentSchema);

//export the model schema
module.exports = glspaymentpercent;
