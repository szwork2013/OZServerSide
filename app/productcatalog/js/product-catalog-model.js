var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var productcatalogSchema = mongoose.Schema({
    productid:{type:String,unique:true},
    productname:{type:String},//defined by service provider
    productcode:{type:String},
    branch:{
      branchid:String,
      branchname:String,
      note:String,
      location:{
          address1:{type:String},
          address2:{type:String},
          address3:{type:String},
          area:{type:String},
          geo:{latitude:String,longitude:String},
          city:{type:String},
          district:{type:String},
          state:{type:String},
          country:{type:String},
          zipcode:{type:String}
      },
      delivery:
      {
          isprovidehomedelivery:{type:Boolean,default:false},
          isprovidepickup:{type:Boolean,default:true},
          isdeliverychargeinpercent:{type:Boolean,default:false}
      }
    },
    provider:{providerid:String,providername:String,providerlogo:String,providercode:String,paymentmode:{cod:{type:Boolean},online:{type:Boolean}}},
    price:{value:{type:Number},currency:{type:String},uom:String},//uom means no,kg,liter
    max_weight:{value:{type:Number,default:1}},
    min_weight:{value:{type:Number,default:1}},
    holding_price:{value:{type:Number},currency:{type:String},uom:String,fromdate:Date,todate:Date,status:String},
    foodtype:{type:String},
    tax:{percent:{type:Number,default:4.5}},
    productlogo:{bucket:String,key:String,image:String},
    createdate:{type:Date},
    productdescription:{type:String},//product description
    usertags:[{type:String}],//tags added by provider
    producttags:[{type:String}],
    categorytags:[{type:String}],
    providertags:[{type:String}],
    locationtags:[{type:String}],
    category:{//generally third level category
      id:{type:String,ref:"productcategory"},
      categoryname:{type:String},
      ancestors:[{
        categoryid:{type:String},
        slug:{type:String},
        categoryname:{type:String}
      }]
    },//it always leaf product category,
    productnotavailable:{from:{type:Date,default:null},to:{type:Date,default:null}},
    status:{type:String,default:"init"},
    price_history:[{oldprice:Number,newprice:Number,updatedby:String,updatedon:Date}],
    specialinstruction:{type:String},
    productconfiguration:{
        categoryid:{type:String,default:"none"},
        categoryname:{type:String,default:"none"},
        configuration:[{prod_configtype:String,prod_configname:String,prod_configprice:{value:Number,uom:String},description:{type:String}}]
    }
})

productcatalogSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

productcatalogSchema.pre('save', function(next) {
  var productcatalog = this;
  productcatalog.productid=generateId();
  next();
});

var ProductCatalog = mongoose.model('productcatalogs', productcatalogSchema);
//export the model schema
module.exports = ProductCatalog;