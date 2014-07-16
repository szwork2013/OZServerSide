var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var invoiceSchema=mongoose.Schema({
   invoiceno:{type:String,unique:true},
   orderid:{type:String},
   suborderid:{type:String},
   invoicedate:{type:Date},

   invoice:{bucket:{type:String},key:String,image:{type:String}}


})

var Invoice = mongoose.model('invoice',invoiceSchema);

//export the model schema
module.exports = Invoice;