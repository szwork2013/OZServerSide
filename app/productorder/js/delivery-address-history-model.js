/*
* Overview: OTP Model
* Dated:
* Author: Sunil More
* Copyright: Helping Hand and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3-2013 | xyx | Add a new property
* 

Otp model to create One Time Password for mobile verification through SMS
*/
var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var deliveryAddressSchema = new mongoose.Schema({
	deliveryaddressid:{type:String,unique:true},
    userid:{type:String},
    address:{
      address1:{type:String},
      address2:{type:String},
      address3:{type:String},
      area:{type:String},
      geo:{ latitude:String, longitude:String },
      city: {type:String },
      district: { type:String },
      state:{ type:String},
      country: { type:String},
      zipcode: {type:String},     
    }
  });
//This schema methods call before save method for Otm model
deliveryAddressSchema.pre('save',function (next) {
  var deliveryaddress = this;
  deliveryaddress.deliveryaddressid=generateId();;
  next();
});

var DeliveryAddressModel = mongoose.model('deliveryaddress', deliveryAddressSchema);
module.exports = DeliveryAddressModel;