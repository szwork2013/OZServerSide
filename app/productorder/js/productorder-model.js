/*
* Overview: The schema for Order
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
var suborderSchema=mongoose.Schema({
   suborderid:{type:String},
  
   orderinstructions:{type:String},//conusmer gave special instruction for suborder
   products:[{baseprice:{type:Number},productid:{type:String},productlogo:{type:String},orderprice:{type:Number},qty:{type:Number},uom:{type:String},productname:{type:String},productcode:String,productlogo:{type:String},currency:{type:String},messageonproduct:{type:String},tax:Number,productconfiguration:[{prod_configtype:String,prod_configname:String,data:{type:Object},prod_configprice:{value:Number,uom:String}}]}],
   //message on product if it is cake
   productprovider:{providerid:{type:String,ref:"Productprovider"},branchid:{type:String,ref:"Branch"},providerbrandname:String,providername:{type:String},provideremail:String,location:{type:Object},providerlogo:{type:String},contact_supports:[{type:String}]},
   deliverycharge:{type:Number},
   suborder_price:{type:Number},
   prefdeldtime:{type:Date},
   prefdeltimeslot:{from:Number,to:Number},
   billing_address:{
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
    },
    delivery_address:{
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
    },
    pickup_address:{
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
    },
    sellerpayment:{
        status:{type:String,default:"pending"},
        paiddate:{type:Date}
   },
    buyerpayment:{
      status:{type:String,default:"pending"},
      mode:{type:String},
      paiddate:{type:Date}
    },
    glspayment:{
      status:{type:String,default:"pending"},//not for cod
      paymentdate:{type:Date}
    },
    tracking:[{status:String,datetime:Date,updatedby:String}],//eg.[{accept:true,datetime:},{accept:pack,datetime:},{accept:pickup,datetime:}]
    deliverydate:{type:Date},//when provider accept then provider will define when order will be delivered
    deliverytimeslot:{from:Number,to:Number},
    deliverytype:{type:String},//home or pickup if delivery type is pickup then no shipping_address
    status:{type:String},//accept,pick and pick up,delivery if suborder type is home,pickup for pickup order,delivered
    isinvoicegenerate:{type:Boolean,default:false},
    reasontocancelreject:{type:String}
})
var orderSchema = mongoose.Schema({
    orderid:{type:String},
    consumer:{userid:String,name:String,mobileno:String,email:String},
    payment:{//payment by consumer
      paymentid:String,
      mode:{type:String},//COD,credite card,emi
      TXNID: String,
      BANKTXNID: String,
      ORDERID: String,
      TXNAMOUNT: String,
      STATUS: String,
      TXNTYPE:String,
      CURRENCY: String,
      GATEWAYNAME: String,
      RESPCODE: String,
      RESPMSG: String,
      BANKNAME: String,
      MID: String,
      PAYMENTMODE: String,
      REFUNDAMT:String,
      TXNDATE: Date,
      IS_CHECKSUM_VALID: String
    },
    preferred_delivery_date:{type:Date},
    suborder:[suborderSchema],
    order_placeddate:{type:Date},
    order_paiddate:{type:Date},
    total_order_price:{type:Number},
    status:{type:String,default:"waitforapproval"},//when conusumer confirm order by otp it will set to approved 
    createdate:{type:Date}
});




//get all my order accoriding service
orderSchema.pre('save', function(next) {
    var productorder = this;
    productorder.orderid = "ODR-"+Math.floor(Math.random()*100000000);
    // console.log("OrderData in pre "+serviceorderrequest);
    next();
});

var ProductOrder = mongoose.model('productorders',orderSchema);

//export the model schema
module.exports = ProductOrder;
