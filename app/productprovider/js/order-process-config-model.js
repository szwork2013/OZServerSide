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
 
var orderProcessConfig = mongoose.Schema({
  index:{type:Number,unique:true},
  order_status:{type:String,unique:true},
  require:{type:Boolean,default:false}  
});

orderProcessConfig.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};
var orderprocessconfiguration = mongoose.model('orderprocessconfig', orderProcessConfig);

//export the model schema
module.exports = orderprocessconfiguration;
