var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var hhiconSchema = mongoose.Schema(
{
    iconid:{type:String},
    iconname:{type:String},
    icondescription:{type:String},
    category:[{type:String}],//category name
    iconimage:{bucket:String,key:String,url:String},
    createdate:{type:Date,default:new Date()},
    createdby:{userid:String,name:String}
 })   

var HHIcon = mongoose.model('hhicons', hhiconSchema);
hhiconSchema.pre('save', function(next) {
    var hhicon = this;
    hhicon.iconid=generateId();
    next();
});
module.exports = HHIcon;