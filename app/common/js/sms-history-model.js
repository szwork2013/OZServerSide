/*
* Overview:SMS History Model
* Dated:
* Author: Sunil More
* Copyright: Helping Hand and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3-2013 | xyx | Add a new property
* 

Collection all pincode details like area,tehsil,district,state
*/
var mongoose = require('./db');
var smsHistroySchema = new mongoose.Schema({
    mobileno:{type:String},
    message:{type:String},
    senddate:{type:Date,default:new Date()}
});
//This shcema methods call before save method for Otm model

var SMSHistoryModel = mongoose.model('smshistories', smsHistroySchema);
module.exports = SMSHistoryModel;