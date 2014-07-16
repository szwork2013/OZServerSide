var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');

var discountSchema = mongoose.Schema({
    discountid:{type:String},
    providerid:{type:String,ref:"provider"},
    branchid:{type:String,ref:"branch"},
    discountcode:{type:String},
    description:{type:String},
    percent:{type:Number},//10% discount
    products:[{type:String}],//if contains * then apply to all product
    startdate:{type:Date},
    expirydate:{type:Date},
    status:{type:String,default:"active"},
    createdate:{type:Date,default:Date.now()},
    updatedate:{type:Date},
    updatedby:{userid:String,name:String}
});

discountSchema.pre('save', function(next) {
    var discount = this;
    discount.discountid = generateId();
    next();
});

var Discount = mongoose.model('discounts',discountSchema);
//export the model schema
module.exports = Discount;