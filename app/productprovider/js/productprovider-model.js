/*
* Overview: The schema model for Service Provider.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2014
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var usergrpSchema =  mongoose.Schema({
  groupid:{type:String,unique:true},
  grpname:String,
  description:{type:String},
  invites:String,
  grpmembers:[{type:String}]
})

var branchSchema = mongoose.Schema(
{
    branchid:{type:String},
    // provider:{providerid:String,providername:String,providerlogo:String},
    branchname:{type:String},
    branchdescription:{type:String},
    location:{
      address1:{type:String},
      address2:{type:String},
      address3:{type:String},
      area:{type:String},
      geo:{ latitude:String, longitude:String },
      city: {type:String },
      district: { type:String },
      state:{ type:String},
      country: {type:String},
      zipcode: {type:String},     
    },
    branchcode:{type:String},
    giftwrapper:{
      isprovide:{type:Boolean,default:false},
      charge:{type:Number},
    },//also basis on weight .git wrapper charges apply to product
    delivery:
    {
      isprovidehomedelivery:{type:Boolean,default:false},
      isprovidepickup:{type:Boolean,default:false},
      isdeliverychargeinpercent:{type:Boolean,default:false},
      
    },//in this case charge or percent any of this
    //if fixedcharge is true then value means 100 and fiexed charge false means value in percentage
    deliverycharge:[{value:{type:Number},coverage:{area:String,zipcode:String,city:String}}],//if isProvideHomeDelivery is true
    contact_supports:[{type:String}],
    branch_images:[{bucket:{type:String},key:String,image:{type:String}}],
    // productcatalog:[ProductCatalogs],
    // usergrp:[usergrpSchema],
    branch_availibility:{from:{type:Number},to:{type:Number}},//means service available form 9AM to 6 PM
    note:{type:String,default:"none"},
    createdate:{type:Date},
    status:{type:String,default:"init"}//default init,publish,unpublish,and deactive
 })   
var productProviderSchema = mongoose.Schema(
{
    providerid: { type: String, required: true, unique: true },
    user:{userid:{type:String,ref:"users"},name:{type:String}},//is admin
    providername: { type: String, required: true },//
    providerbrandname:{type:String,required:true},
    providercode:{type:String,unique:true},
    brandname:{type:String},
    tax:{tino:String,servicetaxno:String,percent:Number},
    providerlogo:{bucket:{type:String},key:String,image:{type:String}},
    status:{type:String,default:"init"},//default init,accept,reject,deactive
    providerdescription:{type:String},
    createdate:{type:Date,default:new Date()},
    category:{categoryid:{type:String},categoryname:{type:String}},//first level category beauty,spa,pest control,plumbin,carpenting
    rating:[
        {
            by:{type:String,ref:"users"},skill:Number,
            trust:Number,
            ontimedelivery:Number,
            attitude:Number}
        ],
    branch:[branchSchema],
    deliverytimingsinstructions:{type:String,default:null},
    paymentmode:{cod:{type:Boolean,default:false},online:{type:Boolean,default:true}},
    provideremail:{type:String},
    orderprocess_configuration:[{index:Number,order_status:String}],

    pickupaddresses:{
      provide:{type:Boolean,default:false},
      addresses:[
        {
          addressid:{type:String},
          address1:{type:String},
          address2:{type:String},
          area:{type:String},
          zipcode:{type:String},
          city:{type:String},
          state:{type:String},
          country:{type:String}
        }
      ]
    }


        //membership handling
        //loyal customer
        //service provider add regular customer as loyal customer
        //group member for add service provider
});

// serviceProviderSchema.pre('save', function(next) {
//     var serviceprovider = this;
//     serviceprovider.providererid=generateId();
//     next();

// });

productProviderSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
};
var ProductProvider = mongoose.model('productproviders', productProviderSchema);

//export the model schema
module.exports = ProductProvider;
