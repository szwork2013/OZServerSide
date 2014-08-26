/*
* Overview: APK Model
* Dated:
* Author: Dinesh Sawant
* Copyright: OrderZapp and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 25-08-2014 | xyx | Add a new property
* 
*/

var mongoose = require('./db');
var generateId = require('time-uuid');

var apkSchema = new mongoose.Schema({
    version:{type:String},
    description:{type:String},
    apk:{bucket:{type:String},key:String,image:{type:String}}    
});
//This schema methods call before save method for apk model
apkSchema.pre('save',function (next) {
    // var apk = this;
    // apk.apkid=generateId();
    next();
});
apkSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
};
var AplModel = mongoose.model('apk', apkSchema);
module.exports = AplModel;