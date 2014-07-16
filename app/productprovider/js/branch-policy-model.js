/*
* Overview: The schema model for Provider/Branch Policy.
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


var branchPolicySchema = mongoose.Schema(
{
  branchid:{type:String},
  providerid:{type:String},
  ordering_policy:{type:String},
  price_policy:{type:String},
  refunds_policy:{type:String},
  delivery_policy:{type:String},
  cancellation_policy:{type:String}
})
// branchPolicySchema.pre('save', function(next) {
//     var serviceprovider = this;
//     serviceprovider.providererid=generateId();
//     next();
// });

branchPolicySchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};
var BranchPolicy = mongoose.model('branchpolicy', branchPolicySchema);

//export the model schema
module.exports = BranchPolicy;
