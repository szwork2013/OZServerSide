var mongoose = require('../../common/js/db');

var providergroupSchema =  mongoose.Schema({
  providerid:{type:String,ref:"ProductProvider"},
  branchid:{type:String,ref:"Branch"},
  usergrp:[{
  	groupid:{type:String,unique:true},
    grpname:String,//unique for branch
    description:{type:String},
    grpmembers:[{type:String}]
   }]
})
var ProviderGroup = mongoose.model('providergroups', providergroupSchema);

//export the model schema
module.exports = ProviderGroup;
