/*
* Overview: The schema model for Sellers/Provider OrderSatus.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2014
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 16-07-2014 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
 
var orderStatusReffSchema = mongoose.Schema({
  index:{type:Number,unique:true},
  order_status:{type:String,unique:true},
  require:{type:Boolean,default:false}  
});

orderStatusReffSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};
var orderStatus = mongoose.model('orderstatusreff', orderStatusReffSchema);

//export the model schema
module.exports = orderStatus;