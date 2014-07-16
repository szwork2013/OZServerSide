var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');

var productConfigSchema = mongoose.Schema({
    configid:{type:String,unique:true},
    categoryid:{type:String,unique:true},
    categoryname:{type:String},
    configuration:[{prod_configtype:String,prod_configname:String,prod_configprice:{value:Number,uom:String},description:{type:String}}],
    createdate:{type:Date},
    status:{type:String,default:"active"}
});

productConfigSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

productConfigSchema.pre('save', function(next) {
  var productconfig = this;
  productconfig.configid=generateId();
  next();
});

var ProductConfig = mongoose.model('productconfig', productConfigSchema);
//export the model schema
module.exports = ProductConfig;