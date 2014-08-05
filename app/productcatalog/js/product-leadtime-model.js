var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');

var productLeadTimeSchema = mongoose.Schema({
    providerid:{type:String,ref:"providers"},
    branchid:{type:String,ref:"providers"},
    productleadtime:[{productid:String,leadtime:{option:String,value:Number}}]
});

productLeadTimeSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

productLeadTimeSchema.pre('save', function(next) {
  var productleadtime = this;
  // productleadtime.configid=generateId();
  next();
});

var ProductLeadTime = mongoose.model('productleadtimes', productLeadTimeSchema);
//export the model schema
module.exports = ProductLeadTime;