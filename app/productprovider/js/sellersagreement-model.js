/*
* Overview: The schema model for Sellers/Provider Agreement.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2014
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
 
var sellersAgreementSchema = mongoose.Schema({
  providerid: { type: String, required: true, unique: true },
  description:{type:String},
  agreement:{bucket:String,key:String,image:String},
});

sellersAgreementSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};
var sellersAgreement = mongoose.model('sellersagreement', sellersAgreementSchema);

//export the model schema
module.exports = sellersAgreement;
