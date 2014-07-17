
var events = require("events");
var logger = require("../../common/js/logger");
var OrderModel = require("./productorder-model");
var CategoryModel = require("../../productcategory/js/product-category-model");
var ProductProviderModel = require("../../productprovider/js/productprovider-model");
// var BranchModel=require("../../branch/js/branch-model");
var generateId = require('time-uuid');
var UserModel=require("../../user/js/user-model");
var ProductaCtalogModel=require("../../productcatalog/js/product-catalog-model");
var OtpModel=require("../../common/js/otp-model");
var commonapi=require('../../common/js/common-api');
var S=require("string");
var __=require("underscore");
var OrderTokenModel=require("./order-token-model");
var SMSTemplateModel=require("../../common/js/sms-template-model");
var GCM = require('gcm').GCM;
var InvoiceModel=require("../../invoice/js/invoice-model");
var CONFIG=require("config").OrderZapp;
var DeliveryAddressModel=require("./delivery-address-history-model")
var java = require("java");
java.classpath.push("./paytm/");
var logger=require("../../common/js/logger");
//AIzaSyCAUpsawrb6abG0YAonb1r2HL9DKCZoVUY
var apiKey = 'AIzaSyDzp1MHb_0fxjshwFJ5OtStOJszVWX7xx0';
var gcm = new GCM(apiKey);
var exec = require('child_process').exec;
var fs=require("fs");
var amazonbucket=CONFIG.amazonbucket;
var AWS = require('aws-sdk');
AWS.config.update({accessKeyId:'AKIAJOGXRBMWHVXPSC7Q', secretAccessKey:'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'});
AWS.config.update({region:'ap-southeast-1'});
var s3bucket = new AWS.S3();
var Order = function(orderdata) {
  this.order = orderdata;
};
function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}
Order.prototype = new events.EventEmitter;
module.exports = Order;
var _sendOTPToMobileNumber=function(mobileno,otp,tempname,lang,orderno,callback){
	SMSTemplateModel.findOne({name:tempname,lang:lang},function(err,smstemplatedata){
    if(err){
      callback({"error":{"message":"error in sending SMS message"}})
    }else if(smstemplatedata){
      var smstemplate=S(smstemplatedata.template);
      smstemplate=smstemplate.replaceAll("<orderno>",orderno);
      smstemplate=smstemplate.replaceAll("<otp>",otp);
      smstemplate=smstemplate.replaceAll("<longcode>",CONFIG.SMSLongCode);
      var message=smstemplate.s;
      commonapi.sendMessage(message,mobileno,function(result){
        if(result=="failure"){
          callback({"error":{"message":"error in sending SMS message"}})
        }else{
          callback({"success":{"message":" order confirmation messagesent"}})
        }
      })
       
    }else{
      callback({"error":{"message":"SMS template not found "+tempname}});
    }
  })
}
var _sendSMSToUsersMobileNumber=function(mobileno,lang,tempname,suborder,callback){
	SMSTemplateModel.findOne({name:tempname,lang:lang},function(err,smstemplatedata){
    if(err){
      callback({"error":{"message":"error in sending SMS message"}});
    }else if(smstemplatedata){
      var smstemplate=S(smstemplatedata.template);
      console.log("smstemplate"+smstemplate)
      smstemplate=smstemplate.replaceAll("<suborderid>",suborder.suborderid);
      smstemplate=smstemplate.replaceAll("<suborder_price>",suborder.suborder_price);
      smstemplate=smstemplate.replaceAll("<sellername>",suborder.productprovider.providername);
      smstemplate=smstemplate.replaceAll("<deliverydate>",suborder.deliverydate);
       smstemplate=smstemplate.replaceAll("<reason>",suborder.reasontocancelreject);
      var message=smstemplate.s;
      commonapi.sendMessage(message,mobileno,function(result){
        if(result=="failure"){
          callback({"error":{"message":"error in sending SMS"}});
        }else{
          callback({"success":{"message":" Order "+tempname+" messagesent"}});
        }
      });
    }else{
      callback({"error":{"message":"SMS template not found "+tempname}});
    }
  })
}

Order.prototype.createOrder = function(user){
	var self = this;
	var orderdata = this.order;
	//////////////////////////////
	_validateCreateOrderData(self,orderdata,user);
	//////////////////////////////
}

var _validateCreateOrderData = function(self,orderdata,user){
	if(orderdata == undefined){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please passs orderdata"}});
	}else if(orderdata.cart== undefined){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please pass cart details"}});
	}else if(orderdata.cart.length == 0){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please add atleast one product into your cart"}});
	}else if(orderdata.billing_address == undefined){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter billing_address details"}});
	}else if(orderdata.billing_address.city == undefined || orderdata.billing_address.city.trim() == ""){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter billing address city"}});
	}else if(orderdata.billing_address.address1 == undefined ||orderdata.billing_address.address1.trim() == ""){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter billing address1"}});
	}else if(orderdata.billing_address.address2 == undefined || orderdata.billing_address.address2.trim() == ""){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter billing address2"}});
	}else if(orderdata.billing_address.area == undefined){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter billing address area"}});
	}else if(orderdata.billing_address.zipcode == undefined){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter zipcode for billing address"}});
	}else  if(orderdata.paymentmode==undefined ||orderdata.paymentmode==""){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please select paymentoptions"}});
	}else if(orderdata.orderinstructions==undefined && !isArray(orderdata.orderinstructions)){
		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please pass order instructions"}});
	// }else if(orderdata.deliverycharges==undefined){
	// 	self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please provide deliverycharges information"}});
	// }else if(!isArray(orderdata.deliverycharges)){
	// 	self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"deliverycharges should not be Array"}});	
	// }else if(orderdata.deliverytypes==undefined){
	// 		self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"please provide deliverytypes"}});	
	// }else if(!isArray(orderdata.deliverytypes)){
	// 	self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"deliverytypes should not be array"}});	
	// }else if(orderdata.deliverytypes.length==0){
	// 	self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"deliverytypes should not be empty"}});	
	// }else{
  }else{ 
		var deliverytypesarray=[];
		// for(var i=0;i<orderdata.deliverytypes.length;i++){
		// 	deliverytypesarray.push(orderdata.deliverytypes[i].deliverytype)
		// }
		if(deliverytypesarray.indexOf("home")<0){
			logger.emit("log","order validated");
		///////////////////////////////////////////
		_validateCartDetails(self,orderdata,user)
		//////////////////////////////////////////
		}else{
			if(orderdata.delivery_address == undefined){
				self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter delivery_address details"}});
			}else if(orderdata.delivery_address.city == undefined || orderdata.delivery_address.city.trim() == ""){
				self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter shipping address city"}});
			}else if(orderdata.delivery_address.address1 == undefined ||orderdata.delivery_address.address1.trim() == ""){
				self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter shipping address1"}});
			}else if(orderdata.delivery_address.address2 == undefined || orderdata.delivery_address.address2.trim() == ""){
				self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter shipping address2"}});
			}else if(orderdata.delivery_address.area == undefined){
				self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter shipping address area"}});
			}else if(orderdata.delivery_address.zipcode == undefined){
				self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Please enter zipcode for shipping address"}});
			}else{
				logger.emit("log","order validated");
				logger.emit("log","orderdata deliverycharges"+JSON.stringify(orderdata));
				///////////////////////////////////////
		 		_validatePreferredDeliveryDate(self,orderdata,user)
		 		/////////////////////////////////////
			}
		}
  }
}
var _validatePreferredDeliveryDate=function(self,orderdata,user){
	if(orderdata.preferred_delivery_date==undefined){
		 ///////////////////////////////////////////
		  _validateCartDetails(self,orderdata,user)
		  //////////////////////////////////////////
	}else{
		var currentdate=new Date();
		currentdate=new Date(currentdate.getFullYear()+"/"+(currentdate.getMonth()+1)+"/"+currentdate.getDate())
		if(new Date(orderdata.preferred_delivery_date)<currentdate){
			self.emit("failedCreateOrder",{"error":{"code":"AV001","message":"Preferred date should be greater or equal to current date"}});
		}else{
			//////////////////////////////////////////
		  	_validateCartDetails(self,orderdata,user);
		  ////////////////////////////////////////////
		}
	}
}
var _validateCartDetails=function(self,orderdata,user){
	var carts=[];
	for(var i=0;i<orderdata.cart.length;i++){
		if(orderdata.cart[i].productid!=undefined && orderdata.cart[i].productid.trim()!="" && orderdata.cart[i].qty!=undefined && orderdata.cart[i].qty.trim()!="" && orderdata.cart[i].productconfiguration!=undefined){
			carts.push(orderdata.cart[i]);
		}
	}
	orderdata.cart=carts;
	logger.emit("log","_validateCartDetails");
	//////////////////////////////////////////
	_validateCartProducts(self,orderdata,user)
	/////////////////////////////////////////
}
var _validateCartProducts=function(self,orderdata,user){
	var productids=[];
	console.log("orderdatatest"+JSON.stringify(orderdata.cart));
	for(var i=0;i<orderdata.cart.length;i++){
		productids.push(orderdata.cart[i].productid);
	}
	console.log("productids"+productids);
	ProductaCtalogModel.find({productid:{$in:productids}},{productid:1},function(err,correctprouctids){
		if(err){
		  logger.emit("error","Database Issue"+err,user.userid)
		 self.emit("failedCreateOrder",{"error":{"code":"ED001","message":"Database Issue"}});	
		}else if(correctprouctids.length==0){
			self.emit("failedCreateOrder",{"error":{"message":"Provided product in cart not exist"}});	
		}else{
			var validproductids=[];
			for(var i=0;i<correctprouctids.length;i++){
				validproductids.push(correctprouctids[i].productid)
			}
			// var validproductids=correctprouctids[0].productids;
			var newcart=[];
			for(var i=0;i<orderdata.cart.length;i++){
				if(validproductids.indexOf(orderdata.cart[i].productid)>=0){
					newcart.push(orderdata.cart[i]);
				}
			}
			orderdata.cart=newcart;
			/////////////////////////////////////////////////////////////////////////
			_ProviderBranchSpecificCartsProducts(self,orderdata,validproductids,user)
			/////////////////////////////////////////////////////////////////////////
		}
	})
}
var _ProviderBranchSpecificCartsProducts=function(self,orderdata,validproductids,user){
	var productidsarray=[];
	for(var i=0;i<orderdata.cart.length;i++){
		productidsarray.push(orderdata.cart[i].productid);
	}

	ProductaCtalogModel.aggregate({$match:{productid:{$in:validproductids}}},{$group:{_id:{branchid:"$branch.branchid",location:"$branch.location",providername:"$provider.providername",providerid:"$provider.providerid",providercode:"$provider.providercode",providerlogo:"$provider.providerlogo",branchname:"$branch.branchname",contact_supports:"$branch.contact_supports"},productcatalog:{$addToSet:{tax:"$tax",productid:"$productid",price:"$price",productname:"$productname",productlogo:"$productlogo",productcode:"$productcode",price:"$price"}}}},function(err,branchproducts){
		if(err){
			logger.emit("error","Database Issue _ProviderBranchSpecificCartsProducts"+err)
			self.emit("failedCreateOrder",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(branchproducts.length==0){
			self.emit("failedCreateOrder",{"error":{"message":"Provided products not exists"}});
		}else{
			var suborders=[];
			var totalorderprice=0;
			for(var i=0;i<branchproducts.length;i++){
				console.log('branchproducts['+i+"]:"+JSON.stringify(branchproducts[i]))
				var product_provider=branchproducts[i]._id;
				// product_provider.providerlogo=branchproducts[i].provider.providerlogo;
				
				var suborder={status:"orderstart",suborderid:"SODR-"+branchproducts[i]._id.providercode+"-"+Math.floor(Math.random()*100000000),productprovider:product_provider};
				var suborderproducts=[];
				var suborderprice=0;
				console.log("branchid::::::::"+product_provider.branchid)
				for(var j=0;j<branchproducts[i].productcatalog.length;j++){
					for(var x=0;x<orderdata.cart.length;x++){
						if(branchproducts[i].productcatalog[j].productid==orderdata.cart[x].productid){
							var indexofproduct=x;
					    var productlogo;
							if(branchproducts[i].productcatalog[j].productlogo!=undefined){
								productlogo=branchproducts[i].productcatalog[j].productlogo.image
							}
							suborderproducts.push({baseprice:branchproducts[i].productcatalog[j].price.value,productconfiguration:orderdata.cart[indexofproduct].productconfiguration,messageonproduct:orderdata.cart[indexofproduct].messageonproduct,tax:branchproducts[i].productcatalog[j].tax.percent,currency:branchproducts[i].productcatalog[j].price.currency,productid:branchproducts[i].productcatalog[j].productid,productname:branchproducts[i].productcatalog[j].productname,productcode:branchproducts[i].productcatalog[j].productcode,productlogo:productlogo,qty:parseFloat(orderdata.cart[indexofproduct].qty),uom:branchproducts[i].productcatalog[j].price.uom,orderprice:parseFloat(orderdata.cart[indexofproduct].orderprice)})
							suborderprice+=parseFloat(orderdata.cart[indexofproduct].orderprice);
						  // console.log("messageonproduct"+orderdata.cart[indexofproduct].messageonproduct)
						}
					}
					
				}
				var delivery_charge=0;
				var dilivery_type="pickup";
				console.log("deliverycharges"+JSON.stringify(orderdata.deliverycharges))
				var deliverytypes=orderdata.deliverytypes;
				var deliverytypebranchids=[]
				if(deliverytypes!=undefined && isArray(deliverytypes)){
					for(var l=0;l<deliverytypes.length;l++){
						deliverytypebranchids.push(deliverytypes[l].branchid);
					}
				}
					if(orderdata.deliverycharges!=undefined && isArray(orderdata.deliverycharges)){
						for(var k=0;k<orderdata.deliverycharges.length;k++){

							if(orderdata.deliverycharges[k].branchid==product_provider.branchid){
								if(deliverytypebranchids.indexOf(orderdata.deliverycharges[k].branchid)>=0){//this condition for check branchid exist in deliverytypes array provided by cart
									dilivery_type=deliverytypes[deliverytypebranchids.indexOf(orderdata.deliverycharges[k].branchid)].deliverytype;
									if(deliverytypes[deliverytypebranchids.indexOf(orderdata.deliverycharges[k].branchid)].deliverytype.toLowerCase()=="home"){
										  if(orderdata.deliverycharges[k].isdeliverychargeinpercent==false){
										  	delivery_charge=parseFloat(orderdata.deliverycharges[k].charge)	
										  }else{
										  	delivery_charge=suborderprice*(parseFloat(orderdata.deliverycharges[k].charge)/100)
										  }
											
									}
								}
							}
						}
					}

				suborderprice+=delivery_charge;
				suborder.deliverycharge=delivery_charge;
				console.log("delivery_charge"+delivery_charge);
				totalorderprice+=suborderprice;
				suborder.products=suborderproducts;
				suborder.sellerpayment={status:"pending",mode:orderdata.paymentmode};
				suborder.buyerpayment={status:"pending",mode:orderdata.paymentmode};
				
				suborder.billing_address=orderdata.billing_address;
				if(dilivery_type=="pickup"){
        	suborder.delivery_address=null;
        }else{
        	suborder.delivery_address=orderdata.delivery_address;	
        }
				suborder.suborder_price=suborderprice;
				suborder.prefdeldtime=orderdata.deliverydate;
		    suborder.deliverytype=dilivery_type;
		    var orderinstructionbranchids=[]
				for(j=0;j<orderdata.orderinstructions.length;j++){
					orderinstructionbranchids.push(orderdata.orderinstructions[j].branchid)
				}
				console.log("branchid"+branchproducts[i]._id.branchid)
				if(orderinstructionbranchids.indexOf(branchproducts[i]._id.branchid)>=0){
					suborder.orderinstructions=orderinstructionbranchids[orderinstructionbranchids.indexOf(branchproducts[i]._id.branchid)].message;
				}else{
					suborder.orderinstructions=null;
				}
				
				console.log("suborder orderinstructions"+suborder.orderinstructions)
				suborders.push(suborder);
				// suborders.status="init";
			}
			var orderobject={preferred_delivery_date:orderdata.preferred_delivery_date,consumer:{userid:user.userid,name:user.firstname+" "+user.lastname,email:user.email,mobileno:user.mobileno},total_order_price:totalorderprice,suborder:suborders,payment:{mode:orderdata.paymentmode,paymentid:generateId()}}
			if(CONFIG.name=="quality"){
				orderobject.status="approved";
			}
			////////////////////////////////,
			_createOrder(self,orderobject,user);
			///////////////////////////////
		}
	})
}
var _createOrder=function(self,orderobject,user){
	// if(orderobject.payment.code.toLowerCase()!="cod"){
	// 	orderobject.status="approved";
	// }
	orderobject.order_placeddate = new Date();
	orderobject.createdate = new Date();
	var order=new OrderModel(orderobject);
	order.save(function(err,orderdata){
		if(err){
			logger.emit("error","Database Issue _createOrder"+err)
			self.emit("failedCreateOrder",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
			
			////////////////////////////////////////
			_successfullCreateOrder(self,orderdata);
			////////////////////////////////////////
			////////////////////////////////////////
			// _createInvoiceForAllSubOrder(orderdata);
			////////////////////////////////////////
			//////////////////////////////////////////////

			///////////////////////////////
			_successfullCreateOrder(self,orderdata)
			////////////////////////////////
			//////////////////////////////////////////////
			// _SubOrderInvoiceCreation(orderdata.suborder,0,orderdata);
			/////////////////////////////////////////////
			///////////////////////////////////////////
			_saveOrderDeliveryAddressHistory(orderobject);
			//////////////////////////////////////////////
			//send an otp to consumer for confiramtion of order through sms
			if(CONFIG.name!="quality"){
				if(orderobject.payment.mode.toLowerCase()=="cod"){
			    ////////////////////////////////////////////////////////////
			 	_sendOrderConfirmationOTPToConsumer(user,orderdata.orderid);
				////////////////////////////////////////////////////////////
		    }	
			}
						
		}
	})
}
var _saveOrderDeliveryAddressHistory=function(order){
	var deliveryaddressarray=[];
	for(var i=0;i<order.suborder.length;i++){
		if(order.suborder[i].delivery_address!=undefined){
			if(order.suborder[i].delivery_address.deliveryaddressid==undefined || order.suborder[i].delivery_address.deliveryaddressid==null || order.suborder[i].delivery_address.deliveryaddressid==""){
			    deliveryaddressarray.push({userid:order.consumer.userid,address:order.suborder[i].delivery_address}); 
		    }
		}	
	}
	DeliveryAddressModel.create(deliveryaddressarray,function(err,deliveryaddresses){
		if(err){
			logger.emit("error","Database Issue");
		}else{
			logger.emit("log","new delivery address saved");
		}
	})
}
var _successfullCreateOrder=function(self,orderobject){
	self.emit("successfulCreateOrder",{success:{message:"Order Created Successfully",order:orderobject}});
}
// var _createInvoiceForAllSubOrder=function(order){
// //     var invoicearray=[];
  	
// //   	for(var i=0;i<order.suborder.length;i++){
// //   	  var inoviceobject={orderid:order.orderid,suborderid:order.suborder[i].suborderid,invoicedate:order.createdate,orderdate:order.createdate,tinno:"taxno",billing_address:order.suborder[i].billing_address,delivery_address:order.suborder[i].delivery_address,deliverytype:deliverytype}
// //   	  var products=[];
// //   	  // console.log("suborder products"+order.suborder[i].products)


// //   	  for(var j=0;j<order.suborder[i].products.length;j++){
// //   	  	var baseprice=order.suborder[i].products[j].orderprice*(1-order.suborder[i].products[j].tax*0.01);
// //   	  	var tax=order.suborder[i].products[j].orderprice*order.suborder[i].products[j].tax*0.01;
// //   	  	var orderprice=order.suborder[i].products[j].orderprice;
// //   	  	var uom=order.suborder[i].products[j].uom;
// //   	  	var qty=order.suborder[i].products[j].qty;
// //   	  	var productname=order.suborder[i].products[j].productname;
// //   	  	var productcode=order.suborder[i].products[j].productcode;
// //   	  	var productprice=orderprice/qty;
// //   	  	console.log("baseprice"+baseprice);
// //   	  	console.log("taxprice"+tax);
// //   	  	var product={productid:order.suborder[i].products[j].productid,orderprice:orderprice,uom:uom,productcode:productcode,productname:productname,baseprice:baseprice,tax:tax,productprice:productprice}
// //   	  	console.log("productsdddd"+product);
// //   	  	products.push(product)
// //   	  }

//   	  for(var j=0;j<order.suborder[i].products.length;j++){
//   	  	var baseprice=order.suborder[i].products[j].orderprice*(1-order.suborder[i].products[j].tax*0.01);
//   	  	var tax=order.suborder[i].products[j].orderprice*order.suborder[i].products[j].tax*0.01;
//   	  	var orderprice=order.suborder[i].products[j].orderprice;
//   	  	var uom=order.suborder[i].products[j].uom;
//   	  	var qty=order.suborder[i].products[j].qty;
//   	  	var productname=order.suborder[i].products[j].productname;
//   	  	var productcode=order.suborder[i].products[j].productcode;
//   	  	var productprice=orderprice/qty;
//   	  	console.log("baseprice"+baseprice);
//   	  	console.log("taxprice"+tax);
//   	  	var product={productid:order.suborder[i].products[j].productid,orderprice:orderprice,uom:uom,productcode:productcode,productname:productname,baseprice:baseprice,tax:tax,productprice:productprice}
//   	  	console.log("productsdddd"+product);
//   	  	products.push(product);
//   	  }
  	  

// //   	  inoviceobject.products=products;
// //   	  console.log("products"+JSON.stringify(products))
// //   	  inoviceobject.taxprice=order.suborder[i].suborder_price*0.1;
// //   	  inoviceobject.baseorderprice=order.suborder[i].suborder_price*0.9;
  	  
// //   	  inoviceobject.productprovider=order.suborder[i].productprovider;
// //   	  inoviceobject.totalprice=order.suborder[i].suborder_price;
// //   	  inoviceobject.payment=order.suborder[i].payment
// //   	  invoicearray.push(inoviceobject);
// //   	}
// //   	logger.emit("log","invoicearray"+JSON.stringify(invoicearray))
// //   	InvoiceModel.create(invoicearray,function(err,invoices){
// //   		if(err){
// //   			logger.emit("error","Database Issue"+err)
// //   		}else {
// //   			logger.emit("invoice created successfully");
// //   		}
// //   	})
// // }
var _SubOrderInvoiceCreation=function(suborders,value,order){
	var suborder=suborders[value];
	console.log('suborder'+JSON.stringify(suborder))
	// console.log("branchid:"+suborder.productprovider.branchid+" providerid:"+suborder.productprovider.providerid);
	if(suborders.length>value){
		ProductProviderModel.aggregate({$match:{providerid:suborder.productprovider.providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":suborder.productprovider.branchid}},function(err,branch){
			if(err){
				logger.emit("error","Database Issue :_SubOrderInvoiceCreation"+err)
			}else if(branch.length==0){
				logger.emit("error","branchid is wrong for _SubOrderInvoiceCreation")
			}else{
				var selleruserid=branch[0].user.userid;
				var branch=branch[0].branch;
				console.log("Branch"+JSON.stringify(branch));
				UserModel.findOne({userid:selleruserid},{email:1},function(err,selleruser){
					if(err){
							logger.emit("error","Database Issue :_SubOrderInvoiceCreation"+err)
					}else if(!selleruser){
						logger.emit("error","give selleruser id wrong")
					}else{

						var contacts=branch.contact_supports;
						var selleremail=selleruser.email;
						console.log("selleruser"+selleruser.email);
						console.log("contact_supports"+contacts)
					
						var inoviceobject={orderid:order.orderid,suborderid:suborder.suborderid,invoicedate:order.createdate,orderdate:order.createdate,tinno:"taxno",billing_address:suborder.billing_address,delivery_address:suborder.delivery_address,deliverytype:suborder.deliverytype}
			  	  var products=[];
			  	  inoviceobject.buyername=null;
			  	  // console.log("suborder products"+order.suborder[i].products)
           var productprovider=JSON.stringify(suborder.productprovider);
           productprovider=JSON.parse(productprovider)
           productprovider.contact_supports=contacts;
           productprovider.email=selleremail;
		  	   for(var j=0;j<suborder.products.length;j++){
		  	  	var baseprice=suborder.products[j].orderprice*(1-suborder.products[j].tax*0.01);
		  	  	var tax=suborder.products[j].orderprice*suborder.products[j].tax*0.01;
		  	  	var orderprice=suborder.products[j].orderprice;
		  	  	var uom=suborder.products[j].uom;
		  	  	var qty=suborder.products[j].qty;
		  	  	var productname=suborder.products[j].productname;
		  	  	var productcode=suborder.products[j].productcode;
		  	  	var productprice=orderprice/qty;
		  	  	console.log("baseprice"+baseprice);
		  	  	console.log("taxprice"+tax);
		  	  	var product={qty:qty,productid:suborder.products[j].productid,orderprice:orderprice,uom:uom,productcode:productcode,productname:productname,baseprice:baseprice,tax:tax,productprice:productprice}
		  	  	console.log("productsdddd"+product);
		  	  	products.push(product)
		  	  }
			  	inoviceobject.products=products;
					console.log("products"+JSON.stringify(products))
					inoviceobject.taxprice=suborder.suborder_price*0.1;
					inoviceobject.baseorderprice=suborder.suborder_price*0.9;
					inoviceobject.productprovider=productprovider;
					inoviceobject.totalprice=suborder.suborder_price;
					inoviceobject.payment=suborder.payment
					var invoice_data=new InvoiceModel(inoviceobject);
					invoice_data.save(function(err,invoice){
						if(err){
							logger.emit("error","Database Issue :_SubOrderInvoiceCreation"+err)
						}else{
							logger.emit("log","New invoice created");
						}
					})
					////////////////////////////////
					_SubOrderInvoiceCreation(suborders,++value,order);
					////////////////////////
					// invoicearray.push(inoviceobject);
				}
			})
		}
	})
}else{
	logger.emit("log","Invoice created for order");
}
}
var _sendOrderConfirmationOTPToConsumer=function(user,orderno){
var ordertoken=new OrderTokenModel({_userId:user.userid,orderid:orderno});
  ordertoken.save(function(err,otpdata){
    if(err){
      logger.emit("error","Database Issue :__sendOrderConfirmationOTPToConsumer"+err);
      // self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(otpdata){
        var tempname="confirmorder";
        // var ="EN"; 
        ////////////////////////
        _sendOTPToMobileNumber(user.mobileno,otpdata.otp,tempname,user.preffered_lang,orderno,function(result){
          if(result.error!=undefined){
            logger.emit("error",result.error.message);
          }else{
           logger.emit("log","confirmation otp send to consumer mobileno");
          }
        });
    }
  })       
}
// var _checkServiceExistOrNot = function(self,serviceOrderRequestData,user){
// 	ProductProviderModel.findOne({"servicecatalog.serviceid":serviceOrderRequestData.service.serviceid,"servicecatalog.servicename":serviceOrderRequestData.service.servicename},function(err,service){
// 		if(err){
// 			logger.emit("error","Error in db to _checkServiceExistOrNot");
// 			self.emit("failedCreateOrder",{"error":{"code":"ED001","message":"Database Issue"}});
// 		} else if(service){
// 			_checkServiceOrderAlreadyCreated(self,serviceOrderRequestData,user);
// 		}else{
// 			self.emit("failedCreateOrder",{"error":{"code":"AD001","message":"Service dose not exist with this serviceid or servicename"}});
// 		}
// 	});
// }

// var _checkServiceOrderAlreadyCreated = function(self,serviceOrderRequestData,user){
// 	OrderModel.findOne({"requestuser.userid":user.userid,"serviceorders.service.serviceid":serviceOrderRequestData.service.serviceid,"serviceorders.appointment.appointment_datetime":serviceOrderRequestData.appointment_datetime},function(err,service){
// 		if(err){
// 			logger.emit("error","Error in db to _checkServiceExistOrNot");
// 			self.emit("failedCreateOrder",{"error":{"code":"ED001","message":"Database Issue"}});
// 		}else if(service){
// 			self.emit("failedCreateOrder",{"error":{"code":"AD001","message":"Service order already created by same user on same appointment"}});
// 		}else{
// 			_createServiceOrder(self,serviceOrderRequestData,user);
// 		}
// 	});
// }

// var _createServiceOrder = function(self,serviceOrderRequestData,user){
// 	var order = [];
// 	for(var i=0;i<serviceOrderRequestData.branchids.length;i++){		
// 		order.push({orderid:generateId(),service:serviceOrderRequestData.service,serviceprovider:serviceOrderRequestData.branchids[i],"appointment.appointment_datetime":serviceOrderRequestData.appointment_datetime,"appointment.requested_by.userid":user.userid,"appointment.requested_by.name":user.username});
// 	}
// 	serviceOrderRequestData.serviceorders = order;
// 	serviceOrderRequestData.requestuser = {userid:user.userid,name:user.username};
// 	var service_order = new OrderModel(serviceOrderRequestData);
// 	service_order.save(function(err,serviceorder){
// 		if(err){
// 	    	logger.emit("error","Database Issue "+err);
// 	      	self.emit("failedCreateOrder",{"error":{"code":"ED001","message":"Database Issue"}});
// 	    }else if(serviceorder){
// 			/////////////////////////////////
// 			_successfullAddServiceOrder(self);
// 			/////////////////////////////////
// 	    }
// 	});
// }

// var _successfullAddServiceOrder = function(self){
// 	logger.emit("log","_successfulAddServiceOrder");
// 	self.emit("successfulAddServiceOrder", {"success":{"message":"Service Order Added Successfully"}});
// }

// Order.prototype.getAllMyOrder = function(userid){
// 	var self = this;
	
// 	//////////////////////////////
// 	_getAllMyOrder(self,userid);
// 	//////////////////////////////
// }
// var _getAllMyOrder=function(self,userid){
// 	OrderModel.find({"consumer.userid":userid}).sort({createdate:-1}).exec(function(err,orders){
// 		if(err){
// 			logger.emit("error","Database Issue _getAllMyOrder"+err);
// 			self.emit("failedGetAllMyOrder",{"error":{"code":"ED001","message":"Database Issue"}});
// 		}else if(orders.length==0){
// 			self.emit("failedGetAllMyOrder",{"error":{"message":"You have not ordered any items"}});
// 		}else{
// 			////////////////////////////////////////
// 			_successfullGetAllMyOrder(self,orders)
// 			////////////////////////////////////////
// 		}
// 	})
// }
// var _successfullGetAllMyOrder=function(self,orders){
// 	self.emit("successfulGetAllMyOrder",{success:{message:"Getting my orders successfully",orders:orders}});
// }

Order.prototype.getAllOrderDetailsForBranch = function(branchid,type,userid){
	var self = this;
	///////////////////////////////////////////////////////////////
	_valdateGetAllOrderDetailsForBranch(self,branchid,type,userid);
	///////////////////////////////////////////////////////////////
}

var _valdateGetAllOrderDetailsForBranch = function(self,branchid,type,userid){
	if(type == undefined){
		self.emit("failedGetAllOrdersForAllProviders",{"error":{"message":"Please pass type"}});
	}else if(["order","product"].indexOf(type.toLowerCase())<0){
		self.emit("failedGetAllOrdersForAllProviders",{"error":{"code":"AV001","message":"type should be order or product"}});
	}else{
		if(type == "order"){
			_getAllOrdersForBranch(self,branchid,userid);
		}else if(type == "product"){
			_getAllProductOrdersForBranch(self,branchid,userid);
		}else{
			self.emit("failedGetAllOrdersForAllProviders",{"error":{"message":"Please pass valid type"}});
		}
	}
}

var _getAllOrdersForBranch=function(self,branchid,userid){
	console.log("_getAllOrdersForBranch");
	//{$group:{_id:{providername:"$suborder.productprovider.providername"},order:{$addToSet:{orderid:"$orderid",total_order_price:"$total_order_price",createdate:"$createdate",status:"$status",order_placeddate:"$order_placeddate",suborder:"$suborder",payment_method:"$payment_method",consumer:"$consumer"}}}},{$project:{providername:"$_id.providername",order:"$order",_id:0}}
	OrderModel.aggregate([{$unwind:"$suborder"},{$match:{"suborder.productprovider.branchid":branchid}},{$sort:{createdate:-1}},{$limit:10}]).exec(function(err,orders){
		if(err){
			self.emit("failedGetAllOrdersForAllProviders",{"error":{"code":"ED001","message":"Database Issue : "+err}});
		}else if(orders.length==0){
			self.emit("failedGetAllOrdersForAllProviders",{"error":{"message":"Order not exist"}});
		}else{
			//////////////////////////////////////////////
			_successfulGetAllOrdersForBranch(self,orders);
			//////////////////////////////////////////////
		}
	});
}

var _getAllProductOrdersForBranch=function(self,branchid,userid){
	console.log("_getAllProductOrdersForBranch");
	OrderModel.aggregate([{$unwind:"$suborder"},{$match:{"suborder.status":"accepted","suborder.productprovider.branchid":branchid}},{$project:{deliverydate:"$suborder.deliverydate",products:"$suborder.products"}},{$unwind:"$products"},{$group:{_id:{deliverydate:"$deliverydate"},products:{$addToSet:{productname:"$products.productname",productcode:"$products.productcode",qty:"$products.qty",uom:"$products.uom",orderprice:"$products.orderprice",currency:"$products.currency"}}}},{$project:{deliverydate:"$_id.deliverydate",products:"$products",_id:0}}]).exec(function(err,products){
		if(err){
			self.emit("failedGetAllOrdersForAllProviders",{"error":{"code":"ED001","message":"Database Issue : "+err}});
		}else if(products.length==0){
			self.emit("failedGetAllOrdersForAllProviders",{"error":{"message":"Product order not exist"}});
		}else{
			//////////////////////////////////////////////////////
			_successfulGetAllProductOrdersForBranch(self,products);
			//////////////////////////////////////////////////////
		}
	});
}

var _successfulGetAllOrdersForBranch=function(self,orders){
	self.emit("successfulGetAllOrdersForAllProviders",{success:{message:"Getting all order details successfully",orders:orders}});
}

var _successfulGetAllProductOrdersForBranch=function(self,products){
	self.emit("successfulGetAllOrdersForAllProviders",{success:{message:"Getting product order details successfully",doc:products}});
}

Order.prototype.loadMoreOrders = function(orderid,userid){
	var self = this;
	/////////////////////////////////////////
	_getDateTimeOfOrder(self,orderid,userid);
	/////////////////////////////////////////
}
var _getDateTimeOfOrder=function(self,orderid,userid){
	console.log("_getDateTimeOfOrder");
	OrderModel.findOne({orderid:orderid},{createdate:1,suborder:1,_id:0}).exec(function(err,order){
		if(err){
			self.emit("failedLoadMoreOrders",{"error":{"code":"ED001","message":"Database Issue : "+err}});
		}else if(!order){
			self.emit("failedLoadMoreOrders",{"error":{"message":"orderid is wrong"}});
		}else{
			////////////////////////////
			_loadMoreOrders(self,orderid,order);
			////////////////////////////
		}
	});
}
var _loadMoreOrders = function(self,orderid,order){	
	OrderModel.aggregate([{$unwind:"$suborder"},{$match:{orderid:{$ne:orderid},"suborder.productprovider.branchid":order.suborder[0].productprovider.branchid}},{$sort:{createdate:-1}},{$match:{createdate:{$lte:order.createdate}}},{$limit:10}]).exec(function(err,orders){
		if(err){
			self.emit("failedLoadMoreOrders",{"error":{"code":"ED001","message":"Database Issue : "+err}});
		}else if(orders.length==0){
			self.emit("failedLoadMoreOrders",{"error":{"message":"No more orders"}});
		}else{
			///////////////////////////////////////
			_successfulLoadMoreOrders(self,orders);
			///////////////////////////////////////
		}
	});
}
var _successfulLoadMoreOrders=function(self,orders){
	self.emit("successfulLoadMoreOrders",{success:{message:"Getting load more order successfully",orders:orders}});
}

Order.prototype.getMySubOrders = function(userid,providerid,branchid,criteriastatus){
	var self = this;	
	//////////////////////////////
	_IsAuthorizedProviderToGetSubOrders(self,userid,providerid,branchid,criteriastatus);
	//////////////////////////////
}
var _IsAuthorizedProviderToGetSubOrders=function(self,userid,providerid,branchid,criteriastatus){
	//provider can see their suborder if provider,branchid,confirmed true
	UserModel.find({userid:userid,"provider.providerid":providerid,"provider.branchid":branchid,"provider.confirmed":true},function(err,userprovider){
		if(err){
			logger.emit("error","Database Issue _IsAuthorizedProviderToGetSubOrders"+err)
			self.emit("failedGetMySubOrders",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!userprovider){
			self.emit("failedGetMySubOrders",{"error":{"message":"Branch details is not associated with user"}});
		}else{
			/////////////////////////////////////////////////
			_criteriawiseSuborders(self,userid,providerid,branchid,criteriastatus)
			////////////////////////////////////////////////////
		}
	})

}
var _criteriawiseSuborders=function(self,userid,providerid,branchid,criteriastatus){
	var query=[];
	if(criteriastatus==undefined){
        query.push({$match:{"suborder.productprovider.providerid":providerid,status:{$ne:"waitforapproval"}}})
				query.push({$unwind:"$suborder"})
				query.push({$match:{"suborder.productprovider.branchid":branchid}})
				query.push({$project:{buyerpayment:"$suborder.buyerpayment",sellerpayment:"$suborder.sellerpayment",orderinstructions:"$suborder.orderinstructions", payment:1,preferred_delivery_date:1,createdate:1,suborderid:"$suborder.suborderid",products:"$suborder.products",suborder_price:"$suborder.suborder_price",billing_address:"$suborder.billing_address",delivery_address:"$suborder.delivery_address",deliverytype:"$suborder.deliverytype",deliverydate:"$suborder.deliverydate",status:"$suborder.status",_id:0,consumer:1}})
				query.push({$sort:{createdate:1}})
		/////////////////////////////////////////////////
		_getMySubOrders(self,userid,providerid,branchid,query)
		////////////////////////////////////////////////////
	}else{
		if(["recieved","approved","packing","delivery","past"].indexOf(criteriastatus)<0){
			self.emit("failedGetMySubOrders",{"error":{"message":"criteriastatus should be approved,packing,delivery"}});
		}else{
			var statusarray={recieved:["orderstart"],past:["ordercomplete","cancelled","rejected"],approved:["accepted"],packing:["inproduction","packing","factorytostore"],delivery:["storepickup","homedelivery"]};
			var query=[];
			if(criteriastatus=="recieved"){
				query.push({$match:{"suborder.productprovider.providerid":providerid,status:{$ne:"waitforapproval"},preferred_delivery_date:{$ne:null}}})
				query.push({$unwind:"$suborder"})
				query.push({$sort:{createdate:1}})
				query.push({$match:{"suborder.productprovider.branchid":branchid,"suborder.status":{$in:statusarray[criteriastatus]}}})
				query.push({$project:{pref_deliverydatetime:{$add:["$preferred_delivery_date",60*60*1000*5.5]},buyerpayment:"$suborder.buyerpayment",sellerpayment:"$suborder.sellerpayment",orderinstructions:"$suborder.orderinstructions", payment:1,preferred_delivery_date:1,createdate:1,suborderid:"$suborder.suborderid",products:"$suborder.products",suborder_price:"$suborder.suborder_price",billing_address:"$suborder.billing_address",delivery_address:"$suborder.delivery_address",deliverytype:"$suborder.deliverytype",deliverydate:"$suborder.deliverydate",status:"$suborder.status",_id:0,consumer:1}})
				query.push({$project:{pref_deliverydatetime:{day:{$dayOfMonth:'$pref_deliverydatetime'},month:{$month:'$pref_deliverydatetime'},year:{$year:'$pref_deliverydatetime'}},buyerpayment:1,sellerpayment:1,orderinstructions:1, payment:1,preferred_delivery_date:1,createdate:1,suborderid:1,products:1,suborder_price:1,billing_address:1,delivery_address:1,deliverytype:1,deliverydate:1,status:1,consumer:1}})
				query.push({$group:{_id:"$pref_deliverydatetime",suborders:{$addToSet:{buyerpayment:"$buyerpayment",sellerpayment:"$sellerpayment",orderinstructions:"$orderinstructions", payment:"$payment",preferred_delivery_date:"$preferred_delivery_date",createdate:"$createdate",suborderid:"$suborderid",products:"$products",suborder_price:"$suborder_price",billing_address:"$billing_address",delivery_address:"$delivery_address",deliverytype:"$deliverytype",deliverydate:"$deliverydate",status:"$status",consumer:"$consumer"}}}})
				query.push({$project:{deliverydatetime:"$_id",suborders:1,_id:0}})
				
				
			 /////////////////////////////////////////////////
			}else if(criteriastatus=="approved"){
				query.push({$match:{"suborder.productprovider.providerid":providerid,status:{$ne:"waitforapproval"}}})
				query.push({$unwind:"$suborder"})
				query.push({$sort:{createdate:1}})
				query.push({$match:{"suborder.productprovider.branchid":branchid,"suborder.status":{$in:statusarray[criteriastatus]}}})
				query.push({$project:{pref_deliverydatetime:{$add:["$suborder.deliverydate",60*60*1000*5.5]},buyerpayment:"$suborder.buyerpayment",sellerpayment:"$suborder.sellerpayment",orderinstructions:"$suborder.orderinstructions", payment:1,preferred_delivery_date:1,createdate:1,suborderid:"$suborder.suborderid",products:"$suborder.products",suborder_price:"$suborder.suborder_price",billing_address:"$suborder.billing_address",delivery_address:"$suborder.delivery_address",deliverytype:"$suborder.deliverytype",deliverydate:"$suborder.deliverydate",status:"$suborder.status",_id:0,consumer:1}})
				query.push({$project:{pref_deliverydatetime:{day:{$dayOfMonth:'$pref_deliverydatetime'},month:{$month:'$pref_deliverydatetime'},year:{$year:'$pref_deliverydatetime'}},buyerpayment:1,sellerpayment:1,orderinstructions:1, payment:1,preferred_delivery_date:1,createdate:1,suborderid:1,products:1,suborder_price:1,billing_address:1,delivery_address:1,deliverytype:1,deliverydate:1,status:1,consumer:1}})
				query.push({$group:{_id:"$deliverydatetime",suborders:{$addToSet:{buyerpayment:"$buyerpayment",sellerpayment:"$sellerpayment",orderinstructions:"$orderinstructions", payment:"$payment",preferred_delivery_date:"$preferred_delivery_date",createdate:"$createdate",suborderid:"$suborderid",products:"$products",suborder_price:"$suborder_price",billing_address:"$billing_address",delivery_address:"$delivery_address",deliverytype:"$deliverytype",deliverydate:"$deliverydate",status:"$status",consumer:"$consumer"}}}})
				query.push({$project:{deliverydatetime:"$_id",suborders:1}})
			}else{
				query.push({$match:{"suborder.productprovider.providerid":providerid,status:{$ne:"waitforapproval"}}})
				query.push({$unwind:"$suborder"})
				query.push({$match:{"suborder.productprovider.branchid":branchid,"suborder.status":{$in:statusarray[criteriastatus]}}})
				query.push({$project:{buyerpayment:"$suborder.buyerpayment",sellerpayment:"$suborder.sellerpayment",orderinstructions:"$suborder.orderinstructions", payment:1,preferred_delivery_date:1,createdate:1,suborderid:"$suborder.suborderid",products:"$suborder.products",suborder_price:"$suborder.suborder_price",billing_address:"$suborder.billing_address",delivery_address:"$suborder.delivery_address",deliverytype:"$suborder.deliverytype",deliverydate:"$suborder.deliverydate",status:"$suborder.status",_id:0,consumer:1}})
				query.push({$sort:{createdate:1}})
			}
		 _getMySubOrders(self,userid,providerid,branchid,query)
		  ////////////////////////////////////////////////////
		}
	}	
}

var _getMySubOrders=function(self,userid,providerid,branchid,query){
	// query=JSON.parse(query)
	console.log("query"+JSON.stringify(query));
	OrderModel.aggregate(query,function(err,suborders){
		if(err){
			logger.emit("error","Database Issue _getMySubOrders"+err,userid)
			self.emit("failedGetMySubOrders",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(suborders.length==0){
			self.emit("failedGetMySubOrders",{"error":{code:"SODR001","message":"No Order exists"}});
		}else{
			///////////////////////////////////////
			_successfullgetMySubOrders(self,suborders)
			////////////////////////////////
		}
	})
} 
var _successfullgetMySubOrders=function(self,suborders){
	self.emit("successfulGetMySubOrders",{success:{message:"Getting  suborders successfully",suborders:suborders}});
}
Order.prototype.getDeliveryCharges = function(city,area,branchdata){
	var self = this;
	///////////////////////////////
	_validateDeliveryChargeData(self,city,area,branchdata);
	/////////////////////////////

}
var _validateDeliveryChargeData=function(self,city,area,branchdatas){
	console.log("branchdatas"+branchdatas)
	if(city==undefined || city==""){
		self.emit("failedGetDeliveryCharges",{"error":{"code":"AV001","message":"please select city"}});
	}else if(area==undefined || area==""){
		self.emit("failedGetDeliveryCharges",{"error":{"code":"AV001","message":"please select area"}});
	}else if(!isArray(branchdatas)){
		self.emit("failedGetDeliveryCharges",{"error":{"code":"AV001","message":"branchids should be json array"}});
	}else if(branchdatas.length==0){
		self.emit("failedGetDeliveryCharges",{"error":{"code":"AV001","message":"branchdatas should not be empty"}});
	}else{
		// branchdatas.area=branchdatas.area.toLowerCase();
		// branchdatas.city=branchdatas.city.toLowerCase();
		city=city.toLowerCase();
		area=area.toLowerCase();
		//////////////////////////////
	  _getDeliveryCharges(self,city,area,branchdatas)
	  //////////////////////////////
	}
}
var _getDeliveryCharges=function(self,city,area,branchids){
	var branchids_array=branchids;

	branchids_array=__.uniq(branchids_array);
	console.log("branchids"+branchids);
   // if(S(branchids).contains(",")){
   // 	branchids_array=branchids.split(",")
   // }else{
   // 	branchids_array.push(branchids)
   // }
	ProductProviderModel.aggregate({$match:{"branch.branchid":{$in:branchids_array}}},{$unwind:"$branch"},{$match:{"branch.branchid":{$in:branchids_array}}},{$unwind:"$branch.deliverycharge"},{$project:{_id:0,branchid:"$branch.branchid",charge:"$branch.deliverycharge.value",coverage:"$branch.deliverycharge.coverage",isdeliverychargeinpercent:"$branch.delivery.isdeliverychargeinpercent"}},{$match:{"coverage.area":area,"coverage.city":city}},function(err,deliverycharges){
		if(err){
          logger.emit("error","Database Issue _getDeliveryCharges"+err)
		  self.emit("failedGetDeliveryCharges",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
			var delivery_charges_array=[];
			var validbranchids=[];
			logger.emit("log",'deliverycharges'+JSON.stringify(deliverycharges))
			for(var i=0;i<deliverycharges.length;i++){
			
				validbranchids.push(deliverycharges[i].branchid);
				deliverycharges[i].delivery=true;
				delivery_charges_array.push(deliverycharges[i])
			}
			var notdeliverybranches=__.difference(branchids,validbranchids)

			ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.branchid":{$in:notdeliverybranches}}},{$project:{_id:0,branchid:"$branch.branchid",providername:1,location:"$branch.location",deliverytimingsinstructions:1}},function(err,branches){
				if(err){
					logger.emit("error","Database Issue _getDeliveryCharges"+err)
		      self.emit("failedGetDeliveryCharges",{"error":{"code":"ED001","message":"Database Issue"}});
				}else{
					if(branches.length!=0){
					  for(var i=0;i<branches.length;i++){
					  	delivery_charges_array.push({branchid:branches[i].branchid,delivery:false})
					  }	
					}
				  	//////////////////////////////////
			        _successfullGetDeliveryCharges(self,delivery_charges_array);
			        //////////////////////////////////
				}
			})
			
		}
	})
}
var _successfullGetDeliveryCharges=function(self,deliverycharges){
	self.emit("successfulGetDeliveryCharges",{success:{message:"",deliverycharge:deliverycharges}})
}
Order.prototype.getLatestProductPrices = function(productcart){
	var self = this;
	if(productcart==undefined){
		self.emit("failedGetLatestProductPrices",{error:{message:"Please pass productcart"}})
	}else if(!isArray(productcart)){
		self.emit("failedGetLatestProductPrices",{error:{message:"productcart should be an Array"}})
	}else{
		///////////////////////////////
			_getLatestProductPrice(self,productcart)
		/////////////////////////////
	}

}
var _getLatestProductPrice=function(self,productcart){
	console.log(productcart)
	ProductaCtalogModel.find({productid:{$in:productcart}},{productid:1,price:1,_id:0},function(err,productprices){
		if(err){
			logger.emit("error","Database Issue _getLatestProductPrice"+err)
		  self.emit("failedGetLatestProductPrices",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(productprices.length==0){
			self.emit("failedGetLatestProductPrices",{error:{message:"Provided product are wrong"}});
		}else{
			///////////////////////////////////////////////////
			_successfullGetLatestProductPrice(self,productprices)
			///////////////////////////////////////////////////
		}

	})
}
var _successfullGetLatestProductPrice=function(self,latestprice){
	self.emit("successfulGetLatestProductPrices",{success:{message:"",latestprice:latestprice}})
}
Order.prototype.confirmOrder = function(mobileno,message){
	var self=this;
	////////////////////////////////////////////////
	_checkMobileNumberIsValidForConfirmOrder(self,mobileno,message)
	////////////////////////////////////////////////
}
var _checkMobileNumberIsValidForConfirmOrder=function(self,mobileno,message){
	UserModel.findOne({mobileno:mobileno},function(err,user){
		if(err){
			logger.emit("error","Database Issue:/_checkMobileNumberIsValidForConfirmOrder "+err)
			self.emit("failedConfirmOrder",{error:{message:"Database Issue"}})
		}else if(!user){
			self.emit("failedConfirmOrder",{error:{message:"mobileno not exists"}});
		}else{
			///////////////////////////////////////
			_checkTokenAssociatedWithOrder(self,user,message)
			//////////////////////////////////
		}
	})
}
var _checkTokenAssociatedWithOrder=function(self,user,message){
	var otp=S(message).toLowerCase().replaceAll("y","").trim();
	console.log("otp for confirm order"+otp);
	OrderTokenModel.findOne({otp:otp,status:"active"},function(err,otpdata){
		if(err){
      logger.emit("error","Database Issue:/_checkMobileNumberIsValidForConfirmOrder "+err)
			self.emit("failedConfirmOrder",{error:{message:"Database Issue"}})
		}else if(!otpdata){
			self.emit("failedConfirmOrder",{error:{message:"Token is Wrong or expired for confirm order"}})
		}else{
			if(otpdata._userId!=user.userid){
				self.emit("failedConfirmOrder",{error:{message:"Verification token should be send by consumer mobileno"}})
			}else{
				otpdata.status="deactive"
				otpdata.save(function(err,otp_data){
					if(err){
					  logger.emit("error","Database Issue:/_checkMobileNumberIsValidForConfirmOrder "+err)
			      self.emit("failedConfirmOrder",{error:{message:"Database Issue"}})
					}else{
						////////////////////////////
						_confirmOrder(self,otpdata);
				    /////////////////////////////////
					}
				})
				
			}
		}
	})
}
var _confirmOrder=function(self,otpdata){
	OrderModel.update({orderid:otpdata.orderid},{$set:{status:"approved"}},function(err,orderupdatestaus){
		if(err){
			logger.emit("error","Database Issue:/_confirmOrder "+err)
			self.emit("failedConfirmOrder",{error:{message:"Database Issue"}})
		}else if(orderupdatestaus==0){
			self.emit("failedConfirmOrder",{error:{message:"Order Number not exists"}})
		}else{
			///////////////////////////////////////
			_successfullConfirmOrder(self)
			//////////////////////////////////////
		}
	})
}
var _successfullConfirmOrder=function(self){
	self.emit("successfulConfirmOrder",{success:{message:"Order Confirmed successfully"}});
}
Order.prototype.confirmOrderByWeb = function(userid,token){
	var self=this;
	////////////////////////////////////////////////
	_checkMobileNumberIsValidForConfirmOrderByWeb(self,userid,token)
	////////////////////////////////////////////////
}
var _checkMobileNumberIsValidForConfirmOrderByWeb=function(self,userid,token){
	UserModel.findOne({userid:userid},function(err,user){
		if(err){
			logger.emit("error","Database Issue:/_checkMobileNumberIsValidForConfirmOrderByWeb "+err)
			self.emit("failedConfirmOrderByWeb",{error:{message:"Database Issue"}})
		}else if(!user){
			self.emit("failedConfirmOrderByWeb",{error:{message:"userid is wrong"}});
		}else{
			///////////////////////////////////////
			_checkTokenAssociatedWithOrderByWeb(self,user,token)
			//////////////////////////////////
		}
	})
}
var _checkTokenAssociatedWithOrderByWeb=function(self,user,token){
	var otp=token;
	console.log("otp for confirm order"+otp);
	OrderTokenModel.findOne({otp:otp,status:"active"},function(err,otpdata){
		if(err){
      logger.emit("error","Database Issue:/_checkTokenAssociatedWithOrderByWeb "+err)
			self.emit("failedConfirmOrderByWeb",{error:{message:"Database Issue"}})
		}else if(!otpdata){
			self.emit("failedConfirmOrderByWeb",{error:{message:"Token is Wrong or expired for confirm order"}})
		}else{
			if(otpdata._userId!=user.userid){
				self.emit("failedConfirmOrderByWeb",{error:{message:"Verification token should be send by consumer mobileno"}})
			}else{
				otpdata.status="deactive"
				otpdata.save(function(err,otp_data){
					if(err){
					  logger.emit("error","Database Issue:/_checkTokenAssociatedWithOrderByWeb "+err)
			      self.emit("failedConfirmOrderByWeb",{error:{message:"Database Issue"}})
					}else{
						////////////////////////////
						_confirmOrderByWeb(self,otpdata);
				    /////////////////////////////////
					}
				})
				
			}
		}
	})
}
var _confirmOrderByWeb=function(self,otpdata){
	OrderModel.update({orderid:otpdata.orderid},{$set:{status:"approved"}},function(err,orderupdatestaus){
		if(err){
			logger.emit("error","Database Issue:/_confirmOrder "+err)
			self.emit("failedConfirmOrderByWeb",{error:{message:"Database Issue"}})
		}else if(orderupdatestaus==0){
			self.emit("failedConfirmOrderByWeb",{error:{message:"Order Number not exists"}})
		}else{
			///////////////////////////////////////
			_successfullConfirmOrderByWeb(self)
			//////////////////////////////////////
		}
	})
}
var _successfullConfirmOrderByWeb=function(self){
	self.emit("successfulConfirmOrderByWeb",{success:{message:"Order Confirmed successfully"}});
}

Order.prototype.manageOrder = function(user,suborderid,action,deliverydate,remark){
	var self=this;
	///////////////////////////////////////////////////////////////
	_validateOrderAction(self,user,suborderid,action,deliverydate,remark);
	///////////////////////////////////////////////////////////////
}
var _validateOrderAction=function(self,user,suborderid,action,deliverydate,remark){
	console.log("action"+action);
	if(["accept","reject","cancel","production","factoytostore","pack","shiptostore","pickfromstore","delivertohome","done"].indexOf(action)<0){
		self.emit("failedManageOrder",{error:{message:"Order Action should be accept,reject,pack,deliver,pickup,cancel,delivered"}})
	}else{
		/////////////////////////////////////////////////////
		_checkSubOrderIsExistOrNot(self,user,suborderid,action,deliverydate,remark)
		///////////////////////////////////////////////////
	}
}
var _checkSubOrderIsExistOrNot=function(self,user,suborderid,action,deliverydate,remark){
	OrderModel.aggregate([{$unwind:"$suborder"},{$match:{"suborder.suborderid":suborderid}}],function(err,suborders){
		if(err){
			logger.emit("error","Database Issue:/_checkSubOffrderIsExistOrNot "+err)
			self.emit("failedManageOrder",{error:{message:"Database Issue"}})
		}else if(suborders.length==0){
			self.emit("failedManageOrder",{error:{message:"suborderid is wrong"}})
		}else{
			var suborder=suborders[0];
			if(action=="accept"){
					if(deliverydate==undefined || deliverydate==""){
						self.emit("failedManageOrder",{error:{message:"please pass deliverydate"}})
					}else{
						// suborder=JSON
						suborder.suborder.deliverydate=new Date(deliverydate);
			 			///////////////////////////////////////////////////
				    _isAuthorizeToManageOrder(self,user,suborder,action)
				    ////////////////////////////////////////////////////
					}
		  }else if(action=="reject" || action=="cancel"){
					if(remark==undefined || remark==""){
						self.emit("failedManageOrder",{error:{message:"please enter remark for cancel or reject order"}})
					}else{
						// suborder=JSON
						suborder.suborder.reasontocancelreject=remark;
			 			///////////////////////////////////////////////////
				    _isAuthorizeToManageOrder(self,user,suborder,action)
				    ////////////////////////////////////////////////////
					}
		  }else{	
		   ///////////////////////////////////////////////////
			 _isAuthorizeToManageOrder(self,user,suborder,action)
			////////////////////////////////////////////////////
		  }
			
		}
	})
}
var _isAuthorizeToManageOrder=function(self,user,order,action){
	
	// suborder=JSON.stringify(suborder);
	// suborder=JSON.parse(suborder);
	// console.log(suborder);;
	UserModel.findOne({userid:user.userid,"provider.providerid":order.suborder.productprovider.providerid},function(err,userprovider){
		if(err){
			logger.emit("error","Database Issue:/_isAuthorizeToManageOrder "+err)
			self.emit("failedManageOrder",{error:{message:"Database Issue"}})
		}else if(!userprovider){
			self.emit("failedManageOrder",{error:{message:"You have not authorize to manageOrder"}})
		}else{
			//////////////////////////////////////
			_checkManageOrderAction(self,user,order.suborder,action,order)
			////////////////////////////////	
		}
	})
}
var _checkManageOrderAction=function(self,user,suborder,action,order){
	console.log("orderid  ddd"+order.orderid)
	if(action=="cancel"){//proivder can cancel suborder any time
		_manageOrder(self,action,user,suborder,"cancelled",order);
	}else if(action=="reject"){
		if(suborder.status=="orderstart" || suborder.status=="accepted"){
			_manageOrder(self,action,user,suborder,"rejected",order);
		}else if(suborder.status=="rejected"){
			self.emit("failedManageOrder",{error:{message:"Sub Order is already rejected"}});
		}else{
			self.emit("failedManageOrder",{error:{message:"You can reject this suborder"}});
		}
	}else{
	  var actionstatus={accept:"accepted",cancel:"cancelled",reject:"rejected",production:"inproduction",shiptostore:"factorytostore",pack:"packing",delivertohome:"homedelivery",pickfromstore:"storepickup",done:"ordercomplete"};
	  var  home_deliverystatus=["orderstart","accepted","inproduction","packing","factorytostore","homedelivery","ordercomplete"];
	  var pickup_deliverystatus=["orderstart","accepted","inproduction","packing","factorytostore","storepickup","ordercomplete"];
	  //ordr type is home
	  var order_staus;
	  if(suborder.deliverytype.toLowerCase()=="home"){
	  	order_staus=home_deliverystatus;
	  }else{
	  	order_staus=pickup_deliverystatus;
	  }
  	 var indexofcurrentstatus=order_staus.indexOf(suborder.status);
    var deliverystatuslength=order_staus.length;
    if(indexofcurrentstatus==deliverystatuslength-1){
    	logger.emit("error","We can not perform any action order is already completed");
    	self.emit("failedManageOrder",{error:{message:"Order is already completed"}})
    }else{
    	indexofcurrentstatus=indexofcurrentstatus+1;
    	console.log("order order_staus"+order_staus[indexofcurrentstatus]);
    	console.log("order ordddder_staus"+actionstatus[action]);
    	
      if(order_staus[indexofcurrentstatus]==actionstatus[action]){
      		/////////////////////////////////
      		_manageOrder(self,action,user,suborder,actionstatus[action],order);
      		//////////////////////////////////
      }else{
      	// logger.emit("error","You can not change status previous status");
      	self.emit("failedManageOrder",{error:{message:"You can not perform this action"}})
      }	
    }
      
    
	  }
}
var _manageOrder=function(self,action,user,suborder,status,order){
	var tracking={status:status,datetime:new Date(),updatedby:user.userid};
	logger.emit("log","tracking object"+tracking);
	// tracking.status
    console.log("remark___________________________-"+suborder.reasontocancelreject)
	var suborderdata={"suborder.$.status":status,"suborder.$.deliverydate":new Date(suborder.deliverydate)}
	if(suborder.reasontocancelreject!=undefined){
		suborderdata["suborder.$.reasontocancelreject"]=suborder.reasontocancelreject
	}
	OrderModel.update({suborder:{$elemMatch:{suborderid:suborder.suborderid}}},{$set:suborderdata},function(err,suborderupdatestatus){
		if(err){
			logger.emit("error","Database Issue:/_manageOrder "+err)
			self.emit("failedManageOrder",{error:{message:"Database Issue"}})
		}else if(suborderupdatestatus==0){
			self.emit("failedManageOrder",{error:{message:"suborderid is wrong"}})
		}else{
			OrderModel.update({suborder:{$elemMatch:{suborderid:suborder.suborderid}}},{$addToSet:{"suborder.$.tracking":tracking}},function(err,suborderupdatestatus){
				if(err){
					logger.emit("error","Database Issue:/_manageOrder "+err);
					self.emit("failedManageOrder",{error:{message:"Database Issue"}});
				}else if(suborderupdatestatus==0){
					self.emit("failedManageOrder",{error:{message:"suborderid is wrong"}});
				}else{
					console.log("actiondddd"+action)
					if(action.toLowerCase()=="pack")
					{
						//////////////////////////////
						 _createInvoiceForSuborder(suborder,user.userid);
						///////////////////////////
					}
					console.log("orderid"+order.orderid)
					if(action.toLowerCase()=="done")
					{
						//////////////////////////////
						 _makeSubOrderPaymentDone(order.orderid,suborder.suborderid);
						///////////////////////////
					}
					////////////////////////////////////
					_sendNotificationToUser(suborder,status);
					///////////////////////////////////
					/////////////////////////////////////
					_successfullManageOrder(self,status);
					/////////////////////////////////////
				}
			})
		}
	})
}

var _successfullManageOrder=function(self,status){
self.emit("successfulManageOrder",{success:{message:"Order "+status+" successfully",status:status}});
}

var _sendNotificationToUser=function(suborder,status){
	OrderModel.findOne({"suborder.suborderid":suborder.suborderid},{consumer:1,preferred_delivery_date:1},function(err,order){
		if(err){
			logger.emit("error","Database Issue"+err)
		}else if(!order){
			logger.emit("error","suborderid is wrong")
		}else{
			UserModel.findOne({userid:order.consumer.userid},{gcmregistrationid:1,mobileno:1,preffered_lang:1,email:1},function(err,user){
				if(err){
					logger.emit("error","Database Issue"+err);
				}else if(!user){
					logger.emit("error","userid is wrong");
				}else{
					if(status == "cancelled" || status == "rejected"){						
						_sendSMSToUsersMobileNumber(user.mobileno,user.preffered_lang,"order"+status,suborder,function(result){
				         	if(result.error!=undefined){
				            	logger.emit("error",result.error.message);
				          	}else{
				           		logger.emit("log","order "+status+" SMS send to consumer mobileno");
				          	}
				        });
					}else if(status == "accepted"){
						var preferred_delivery_date = new Date(order.preferred_delivery_date.getDate());
						var deliverydate = new Date(suborder.deliverydate.getDate());
						if(preferred_delivery_date != deliverydate){
							_sendSMSToUsersMobileNumber(user.mobileno,user.preffered_lang,"order"+status,suborder,function(result){
					         	if(result.error!=undefined){
					            	logger.emit("error",result.error.message);
					          	}else{
					           		logger.emit("log","order "+status+" SMS send to consumer mobileno");
					          	}
					        });
						}
					}
					var gcmregistrationid=user.gcmregistrationid;
					var message = {
			          registration_id: gcmregistrationid, // required Device registration id
			          collapse_key: 'do_not_collapse', //demo,Collapse key
		    			'data.suborderid': suborder.suborderid,
		    			'data.status': status
					};
					console.log("GCM " + JSON.stringify(gcm));
				    gcm.send(message, function(err, messageId){
						console.log("Call GCM");
					    if (err) {
					    	// res.send({"error":{"message":"Something has gone wrong! " + err}});
					        // console.log("Something has gone wrong!");		        
					    } else {
					        console.log("Sent with message ID: ", messageId);
					        // res.send({"success":{"message":"Sent with message ID: " + messageId}});
					    }
					});
				}
			})
		}
	})
}
var _createInvoiceForSuborder=function(suborder,userid){
_checkInvoiceAlreadyCreated(suborder.suborderid,userid)
}
var _checkInvoiceAlreadyCreated=function(suborderid,sessionuserid){
  InvoiceModel.findOne({suborderid:suborderid},function(err,invoice){
    if(err){
      logger.emit(" error","Database Issue:_checkInvoiceAlreadyCreated"+err)
      // self.emit("failedCreateInvoice",{error:{message:"Database Issue",code:"ED001"}})
    }else if(invoice){
      var url=invoice.invoice.image;
      logger.emit("error","Invoice already created for suborder "+suborderid)
      ////////////////////////////
      // self.emit("successfulCreateInvoice",{success:{message:"Invoice Already created",invoice:url}})
      //////////////////////////
    }else{
      /////////////////////////////////////
      _createJSONForInvoice(suborderid,sessionuserid)
     ///////////////////////////////////
    }
  })
}
var _createJSONForInvoice=function(suborderid,sessionuserid){
  OrderModel.aggregate({$match:{"suborder.suborderid":suborderid}},{$unwind:"$suborder"},{$match:{"suborder.suborderid":suborderid}},function(err,suborder){
    if(err){
      logger.emit(" error","Database Issue:_createJSONForInvoice"+err)
      // self.emit("failedCreateInvoice",{error:{message:"Database Issue",code:"ED001"}})
    }else if(suborder.length==0){
    	logger.emit("error","suborderid is wrong")
        // self.emit("failedCreateInvoice",{error:{message:"suborderid is wrong "}})
    }else{
      var order=suborder[0];
      var suborder=suborder[0].suborder;
      
      console.log("suborder"+JSON.stringify(suborder));
      ProductProviderModel.aggregate({$match:{providerid:suborder.productprovider.providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":suborder.productprovider.branchid}},function(err,branch){
        if(err){
          logger.emit("error","Database Issue :_createJSONForInvoice"+err)
        }else if(branch.length==0){
          logger.emit("error","branchid is wrong for _createJSONForInvoice")
        }else{
          var selleruserid=branch[0].user.userid;
          var branch=branch[0].branch;
          console.log("Branch"+JSON.stringify(branch));
          UserModel.findOne({userid:selleruserid},{email:1},function(err,selleruser){
            if(err){
                logger.emit("error","Database Issue :_createJSONForInvoice"+err)
            }else if(!selleruser){
              logger.emit("error","give selleruser id wrong")
            }else{
              var contacts=branch.contact_supports;
              var selleremail=selleruser.email;
              console.log("selleruser"+selleruser.email);
              console.log("contact_supports"+contacts)
              var inoviceobject={orderid:order.orderid,suborderid:suborder.suborderid,invoicedate:order.createdate,orderdate:order.createdate,tinno:"taxno",billing_address:suborder.billing_address,delivery_address:suborder.delivery_address,deliverytype:suborder.deliverytype}
              var products=[];
              inoviceobject.invoiceno=Math.floor(Math.random()*1000000)
              inoviceobject.buyername=null;
              // console.log("suborder products"+order.suborder[i].products)
              var productprovider=JSON.stringify(suborder.productprovider);
              productprovider=JSON.parse(productprovider)
              productprovider.contact_supports=contacts;
              productprovider.email=selleremail;
              for(var j=0;j<suborder.products.length;j++){
                var baseprice=suborder.products[j].orderprice*(1-suborder.products[j].tax*0.01);
                var tax=suborder.products[j].orderprice*suborder.products[j].tax*0.01;
                var orderprice=suborder.products[j].orderprice;
                var uom=suborder.products[j].uom;
                var qty=suborder.products[j].qty;
                var productname=suborder.products[j].productname;
                var productcode=suborder.products[j].productcode;
                var productprice=orderprice/qty;
                var productconfiguration=suborder.products[j].productconfiguration;
                console.log("baseprice"+baseprice);
                console.log("taxprice"+tax);
                var product={qty:qty,productid:suborder.products[j].productid,orderprice:orderprice,uom:uom,productcode:productcode,productname:productname,baseprice:baseprice,tax:tax,productprice:productprice}
                console.log("productsdddd"+product);
                products.push(product)
              }
              inoviceobject.products=products;
              console.log("products"+JSON.stringify(products))
              inoviceobject.taxprice=suborder.suborder_price*0.1;
              inoviceobject.baseorderprice=suborder.suborder_price*0.9;
              inoviceobject.productprovider=productprovider;
              inoviceobject.totalprice=suborder.suborder_price;
              inoviceobject.payment=suborder.payment

              logger.emit("log","invoice:\n"+JSON.stringify(inoviceobject))
              // var invoice_data=new InvoiceModel(inoviceobject);
              _createPDFInvocie(inoviceobject,branch);
              ////////////////////////////////
              // _SubOrderInvoiceCreation(suborders,++value,order);
              ////////////////////////
              // invoicearray.push(inoviceobject);
            }
          })
        }
    })
  }
})
}
var _createPDFInvocie=function(inoviceobject,branch){
  fs.readFile('invoicesample1.html', function (err, data) {
    if(err){
      logger.emit("error","Invoice Sample html Issue:_createPDFInvocie "+err);
      // self.emit("failedCreateInvoice",{error:{message:""}})
    }else{
      var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
     var htmldata=S(data);

     htmldata=htmldata.replaceAll("{{orderid}}",inoviceobject.orderid);
      htmldata=htmldata.replaceAll("{{invoiceno}}",inoviceobject.invoiceno);
     var invoicedate=new Date();
     htmldata=htmldata.replaceAll("{{invoicedate}}",invoicedate.getDate()+"-"+monthNames[invoicedate.getMonth()]+"-"+invoicedate.getFullYear());
     var orderdate=new Date(inoviceobject.orderdate);
     htmldata=htmldata.replaceAll("{{orderdate}}",orderdate.getDate()+"-"+monthNames[orderdate.getMonth()]+"-"+orderdate.getFullYear());
     htmldata=htmldata.replaceAll("{{tino}}",inoviceobject.tinno);
     htmldata=htmldata.replaceAll("{{servicetaxno}}",inoviceobject.servicetaxno);
     htmldata=htmldata.replaceAll("{{sellercontact}}",inoviceobject.productprovider.contact_supports+"");
     htmldata=htmldata.replaceAll("{{selleremail}}",inoviceobject.productprovider.email);
     htmldata=htmldata.replaceAll("{{sellername}}",inoviceobject.productprovider.providername);
      var delivery_addressoject=inoviceobject.delivery_address;
     var delivery_address="";
     for(var i in delivery_addressoject){
      delivery_address+=delivery_addressoject[i]+",<br>";
     }
     htmldata=htmldata.replaceAll("{{deliveryaddress}}",delivery_address);
     htmldata=htmldata.replaceAll("{{totalprice}}",inoviceobject.totalprice);
       // htmldata=htmldata.replaceAll("{{sellercontact}}",inoviceobject.delivery_address);
     var selleraddress="";
     var sellerlocation=JSON.stringify(inoviceobject.productprovider.location);
     sellerlocation=JSON.parse(sellerlocation)
     for(var i in sellerlocation){
      selleraddress+=sellerlocation[i]+",";
     }

     htmldata=htmldata.replaceAll("{{selleraddress}}",selleraddress);
     htmldata=htmldata.replaceAll("{{sellerlogo}}",inoviceobject.productprovider.providerlogo);
     var billing_addressoject=inoviceobject.billing_address;
     var billing_address="";
     for(var i in billing_addressoject){
      billing_address+=billing_addressoject[i]+",<br>";
     }
     htmldata=htmldata.replaceAll("{{billingaddress}}",billing_address);
     htmldata=htmldata.replaceAll("{{buyername}}",inoviceobject.buyername);
     var productsobject=inoviceobject.products;
     var productshtml="";
     for(var i=0;i<productsobject.length;i++){
      var j=i+1;
       productshtml+="<tr>";
       productshtml+="<td><span contenteditable=''>"+j+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].productname+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].qty+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].productprice+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].tax+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].orderprice+"</span></td>";
       productshtml+="<tr>";
       productshtml+="<td></td>";
       productshtml+="<td>Above price includes product configuration Prices</td>";
       var productconfiguration=[{prod_configname:"Photoprint",prod_configprice:{value:10}},{prod_configname:"egg",prod_configprice:{value:20}}]
       var configname="";
       var configvalue="";
       for(var j=0;j<productconfiguration.length;j++){
         configname+=productconfiguration[j].prod_configname+"</br>";
         configvalue+=productconfiguration[j].prod_configprice.value+"</br>"
          
      }
        
      productshtml+="<td>"+configname+"</td>";
      productshtml+="<td>"+configvalue+"</td>";
     
      productshtml+="<td></td>";
       
      productshtml+="<td></td>";
      
       
     }
     htmldata=htmldata.replaceAll("{{products}}",productshtml);
     ////////////////////////////////////////
     _writeHtmlDataToFile(inoviceobject,htmldata.s,branch);
     /////////////////////////////////////        
     console.log("htmldata"+htmldata)

    }
  
  });
}
var _writeHtmlDataToFile=function(inoviceobject,htmldata,branch){
  var filename="test.html";
  var stream = fs.createWriteStream(filename);
  var pdfinvoice=inoviceobject.suborderid+".pdf";
  stream.once('open', function(fd) {
    stream.write(htmldata);
    exec("phantomjs/bin/phantomjs phantomjs/bin/rasterize.js "+filename+" "+pdfinvoice,function(err,out,code){
      if(err){
        // self.emit("failedCreateInvoice",{error:{message:"Invoice Pdf creation issue"}})
        logger.emit("error","Invoice Sample html Issue:_writeHtmlDataToFile "+err);
      }else{
        exec("rm -rf "+filename);
        //////////////////////////////////////////////////
        _saveInvoiceToAmazonServer(inoviceobject,htmldata,pdfinvoice,branch)
        ////////////////////////////////////////////////
      }
    });
  });
}
var _saveInvoiceToAmazonServer=function(inoviceobject,htmldata,pdfinvoice,branch){
  fs.readFile(pdfinvoice,function (err, data) {
    if(err){
       // self.emit("failedCreateInvoice",{error:{message:"Invoice Pdf creation issue"}})
        logger.emit("error","Invoice Sample html Issue:_saveInvoiceToAmazonServer "+err);
    }else{
      var bucketFolder;
      var params;

      bucketFolder=amazonbucket+"/provider/"+inoviceobject.productprovider.providerid+"/branch/"+branch.branchid+"/invoice";
      params = {
         Bucket: bucketFolder,
         Key:inoviceobject.suborderid+pdfinvoice,
         Body: data,
         //ACL: 'public-read-write',
         ContentType:"application/pdf"
      };
      s3bucket.putObject(params, function(err, data) {
        if (err) {
          logger.emit("error","s3bucket.putObject:-_addProviderLogoToAmazonServer")
        } else {
          var params1 = {Bucket: params.Bucket, Key: params.Key,Expires: 60*60*24*365};
          s3bucket.getSignedUrl('getObject',params1, function (err, url) {
            if(err){
              // callback({"error":{"message":"_addProviderLogoToAmazonServer:Error in getting getSignedUrl"+err}});
              console.log("error"+err)
            }else{
              exec("rm -rf "+pdfinvoice)
              console.log("url"+url)
              var invoicedata={bucket:params1.Bucket,key:params1.Key,image:url};
              //////////////////////////
               _saveInvoiceDataIntoCollection(inoviceobject,invoicedata)
              //////////////////////////////
            }
          })
        }
      })
    }
  })
}
var _saveInvoiceDataIntoCollection=function(inoviceobject,invoicedata){
  var inoviceobject={invoiceno:inoviceobject,orderid:inoviceobject.orderid,suborderid:inoviceobject.suborderid,invoicedate:new Date(),invoice:invoicedata};
  var invoice=new InvoiceModel(inoviceobject);
  invoice.save(function(err,invoice){
    if(err){
      console.log("error"+err)
      // self.emit("failedCreateInvoice",{error:{code:"ED001",message:"Database Issue"}})
    }else{
    	///////////////////////////////////
    	_updateSuborderInvoiceStatus(inoviceobject.suborderid)
    	//////////////////////////////////
      logger.emit("log","Invoice Created sucessfully for suborder "+inoviceobject.suborderid)
    }
  })
}
var _updateSuborderInvoiceStatus=function(suborderid){
	OrderModel.update({"suborder.suborderid":suborderid},{$set:{"suborder.$.isinvoicegenerate":true}},function(err,suborderinvoicegeneratestatus){
		if(err){
			logger.emit("error","Database Issue :_updateSuborderInvoiceStatus"+err)
		}else if(suborderinvoicegeneratestatus==0){
			logger.emit("error","suborderid is wrong for _updateSuborderInvoiceStatus")
		}else{
			logger.emit("log","suborder invoice generated updated");
		}
	})
}
Order.prototype.suborderPaymentDone = function(user,suborderid){
	var self=this;
	//////////////////////////////////////////////
	_validateSubOrderPaymentDone(self,user,suborderid)
	/////////////////////////////////////////////
}
var _validateSubOrderPaymentDone=function(self,user,suborderid){
	OrderModel.aggregate([{$unwind:"$suborder"},{$match:{"suborder.suborderid":suborderid}}],function(err,suborders){
		if(err){
			logger.emit("error","Database Issue:/_validateSubOrderPaymentDone "+err)
			self.emit("failedSubOrderPaymentDone",{error:{message:"Database Issue"}})
		}else if(suborders.length==0){
			self.emit("failedSubOrderPaymentDone",{error:{message:"suborderid is wrong"}})
		}else{
			var suborder=suborders[0].suborder;
			UserModel.findOne({userid:user.userid,"provider.providerid":suborder.productprovider.providerid},function(err,userprovider){
				if(err){
					logger.emit("error","Database Issue:/_isAuthorizeToManageOrder "+err)
					self.emit("failedSubOrderPaymentDone",{error:{message:"Database Issue"}})
				}else if(!userprovider){
					self.emit("failedSubOrderPaymentDone",{error:{message:"You have not authorize to manageOrder"}})
				}else{
				  ////////////////////////////////////////
				  _validateSubOrderStatusForPayment(self,user,suborder)
				  /////////////////////////////////////
				}
			})
		}
	})
}
var _validateSubOrderStatusForPayment=function(self,user,suborder){
	if(suborder.buyerpayment.mode=="paytm"){
		self.emit("failedSubOrderPaymentDone",{error:{message:"Payment throudh banking"}})	
	}else if(suborder.sellerpayment.status=="done"){
		self.emit("failedSubOrderPaymentDone",{error:{message:"Payment already made"}})	
	}else{
		////////////////////////////////////////
		_suborderpaymentdone(self,user,suborder);
		//////////////////////////////////////////
	}
}
 var _suborderpaymentdone=function(self,user,suborder){
	var suborderdata={"suborder.$.sellerpayment.status":"done","suborder.$.buyerpayment.status":"done","suborder.$.sellerpayment.paiddate":new Date(),"suborder.$.buyerpayment.paiddate":new Date()}
		OrderModel.update({suborder:{$elemMatch:{suborderid:suborder.suborderid}}},{$set:suborderdata},function(err,suborderupdatestatus){
			if(err){
				logger.emit("error","Database Issue:/_suborderpaymentdone "+err)
				self.emit("failedSubOrderPaymentDone",{error:{message:"Database Issue"}})
			}else if(suborderupdatestatus==0){
				self.emit("failedSubOrderPaymentDone",{error:{message:"suborderid is wrong"}})
			}else{
				//////////////////////////////////////
				_successfullPaymentForSubOrderDone(self)
				/////////////////////////////////////
			}
		})
	}
	var _successfullPaymentForSubOrderDone=function(self){
		self.emit("successfulSubOrderPaymentDone",{success:{message:"Provider Suborder Payment Done"}})
	}

Order.prototype.getCurrentAndPastOrders = function(userid,criteriastatus){
	var self = this;
		
	/////////////////////////////
	_validateGetCurrentAndPastOrders(self,userid,criteriastatus);
	//////////////////////////////
}
var _validateGetCurrentAndPastOrders=function(self,userid,criteriastatus){
	var query;
	if(criteriastatus==undefined){
		query={"consumer.userid":userid};
		//////////////////////////////////
		_getCurrentAndPastOrders(self,query,criteriastatus)
		///////////////////////////////
	}else{
		 if(["past","current"].indexOf(criteriastatus)<0){
			self.emit("failedGetCurrentAndPastOrders",{error:{code:"AV001",message:"criteriastatus should be past and current"}})
		}else{
			if(criteriastatus=="current"){
				query={"consumer.userid":userid,"suborder.status":{$in:["orderstart","accepted","inproduction","packing","factorytostore","storepickup","homedelivery"]}}
			}else{
				query={"consumer.userid":userid,"suborder.status":{$nin:["orderstart","accepted","inproduction","packing","factorytostore","storepickup","homedelivery"]}}	
			}
			///////////////////////////////////
			_getCurrentAndPastOrders(self,query,criteriastatus)
			////////////////////////////////////
		}	
	}
}
var _getCurrentAndPastOrders=function(self,query,criteriastatus){
	
	OrderModel.find(query).sort({createdate:-1}).exec(function(err,orders){
		if(err){
			logger.emit("error","Database Issue _getCurrentAndPastOrders"+err);
			self.emit("failedGetCurrentAndPastOrders",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(orders.length==0){
			self.emit("failedGetCurrentAndPastOrders",{"error":{"message":"You have not any "+criteriastatus+" orders"}});
		}else{
			////////////////////////////////////////
			_successfullGetAllMyOrder(self,orders)
			////////////////////////////////////////
		}
	})
}
var _successfullGetAllMyOrder=function(self,orders){
	self.emit("successfulGetCurrentAndPastOrders",{success:{message:"Getting my orders successfully",orders:orders}});
}

Order.prototype.searchSuborder = function(suborderid,userid){
	var self = this;		
	////////////////////////////////////////
	_searchSuborder(self,suborderid,userid);
	////////////////////////////////////////
}
var _searchSuborder=function(self,suborderid,userid){
	console.log("_searchSuborder");
	// ,{$group:{_id:{providername:"$suborder.productprovider.providername"},order:{$addToSet:{orderid:"$orderid",total_order_price:"$total_order_price",createdate:"$createdate",status:"$status",order_placeddate:"$order_placeddate",suborder:"$suborder",payment_method:"$payment_method",consumer:"$consumer"}}}},{$project:{providername:"$_id.providername",order:"$order",_id:0}}
	OrderModel.aggregate([{$unwind:"$suborder"},{$match:{"suborder.suborderid":suborderid}}]).exec(function(err,orders){
		if(err){
			self.emit("failedSearchsuborder",{"error":{"code":"ED001","message":"Database Issue : "+err}});
		}else if(orders.length==0){
			self.emit("failedSearchsuborder",{"error":{"message":"Order not exist"}});
		}else{
			ProductProviderModel.aggregate([{$unwind:"$branch"},{$match:{providerid:orders[0].suborder.productprovider.providerid,"branch.branchid":orders[0].suborder.productprovider.branchid}},{$project:{branchname:"$branch.branchname",_id:0}}]).exec(function(err,branchname){
				if(err){
					logger.emit("error","Database Issue _getCurrentAndPastOrders"+err);
					self.emit("failedSearchsuborder",{"error":{"code":"ED001","message":"Database Issue"}});
				}else if(branchname.length==0){
					self.emit("failedSearchsuborder",{"error":{"message":"branchid is wrong"}});
				}else{
					orders[0].suborder.productprovider.branchname = branchname[0].branchname;
					///////////////////////////////////////
					_successfulSearchsuborder(self,orders[0]);
					///////////////////////////////////////
				}
			})			
		}
	});
}
var _successfulSearchsuborder=function(self,orders){
	self.emit("successfulSearchsuborder",{success:{message:"Getting Order Successfully",orders:orders}});
}
Order.prototype.generatePayTmCheckSum = function(userid,checksumdata){
	var self = this;		
	////////////////////////////////////////
	_validategeneratePayTmCheckSum(self,userid,checksumdata);
	////////////////////////////////////////
}
var _validategeneratePayTmCheckSum=function(self,userid,checksumdata){
	var generatechecksumresponse={CHECKSUMHASH :null,ORDER_ID :checksumdata.ORDER_ID,payt_STATUS :2};
	
	if(checksumdata==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass checksumdata",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.CHANNEL_ID==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass CHANNEL_ID",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.CUST_ID==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass CUST_ID",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.EMAIL==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass EMAIL",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.INDUSTRY_TYPE_ID==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass INDUSTRY_TYPE_ID",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.MID==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass MID",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.TXN_AMOUNT==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass TXN_AMOUNT",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.THEME==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass THEME",generatechecksumresponse:generatechecksumresponse}})
	}else if(checksumdata.WEBSITE==undefined){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"Please pass WEBSITE",generatechecksumresponse:generatechecksumresponse}})
	}else{
		///////////////////////////////////////
		_validateCheckSumDataForChecksumCreation(self,userid,checksumdata,generatechecksumresponse)
		/////////////////////////////////////
	}
}

var _validateCheckSumDataForChecksumCreation=function(self,userid,checksumdata,generatechecksumresponse){
	OrderModel.findOne({orderid:checksumdata.ORDER_ID,"consumer.userid":checksumdata.CUST_ID},function(err,order){
		if(err){
			self.emit("failedgeneratePayTmCheckSum",{error:{code:"ED001",message:"Database Issue",generatechecksumresponse:generatechecksumresponse}})
		}else if(!order){
			self.emit("failedgeneratePayTmCheckSum",{error:{message:"Given Orderid is not assocated with customer for checksum creation",generatechecksumresponse:generatechecksumresponse}})
		}else{
			////////////////////////////////////
			_checkForThatOrderPaymentAlreadyDone(self,checksumdata,generatechecksumresponse,order)
			//////////////////////////////////
		}
	})
}
var _checkForThatOrderPaymentAlreadyDone=function(self,checksumdata,generatechecksumresponse,order){
	if(order.payment.STATUS=="TXN_SUCCESS"){
		self.emit("failedgeneratePayTmCheckSum",{error:{message:"For Order :"+order.orderid+" payment has already done",generatechecksumresponse:generatechecksumresponse}})
	}else{
       ///////////////////////////////////
			_generateChecksum(self,checksumdata,generatechecksumresponse)
			//////////////////////////////////
	}
}
var _generateChecksum=function(self,checksumdata,generatechecksumresponse){
	var merchantKey = CONFIG.merchantKey;
  var MID= checksumdata.MID;// Merchant ID (MID) provided by Paytm
  var ORDER_ID=checksumdata.ORDER_ID;// Merchant’s order id
  var CUST_ID=checksumdata.CUST_ID; // Customer ID registered with merchant
  var TXN_AMOUNT=checksumdata.TXN_AMOUNT;
  var CHANNEL_ID=checksumdata.CHANNEL_ID;
  var INDUSTRY_TYPE_ID=checksumdata.INDUSTRY_TYPE_ID; //Provided by Paytm
  var WEBSITE=checksumdata.WEBSITE//Provided by Paytm
  var MOBILE_NO=checksumdata.MOBILE_NO;
  var EMAIL=checksumdata.EMAIL;
  var THEME=checksumdata.THEME
	java.callStaticMethod("PayTm", "generateCheckSum",merchantKey,MID,ORDER_ID,CUST_ID,TXN_AMOUNT,CHANNEL_ID,INDUSTRY_TYPE_ID,WEBSITE,MOBILE_NO,EMAIL,THEME,function(err, results) {
  	if(err) {
  		self.emit("failedgeneratePayTmCheckSum",{error:{message:err,generatechecksumresponse:generatechecksumresponse}})
  	}else{
  		generatechecksumresponse.payt_STATUS=1;
  		generatechecksumresponse.CHECKSUMHASH=results;
  		
  		////////////////////////////////
  		_successfullPayTmCheckSumCreation(self,generatechecksumresponse)
  		////////////////////////////////
		}
	})
}
var _successfullPayTmCheckSumCreation=function(self,checksumobject){
	self.emit("successfulgeneratePayTmCheckSum",checksumobject)
}
Order.prototype.paytmCallbackUrl = function(paytmresponsedata){
	var self = this;
	var responseobject=JSON.stringify(paytmresponsedata);
	responseobject.IS_CHECKSUM_VALID=false;
	
	////////////////////////////////////////
	_validatePaytmCallbackData(self,paytmresponsedata,responseobject);
	////////////////////////////////////////
}
var _validatePaytmCallbackData=function(self,paytmresponsedata,responseobject){
	if(paytmresponsedata==undefined){

		self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass paytm server callback data",responseobject:responseobject}})
	 }else{
	  // if(paytmresponsedata.TXNID==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass TXNID",responseobject:responseobject}})
	// }else if(paytmresponsedata.BANKTXNID==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass BANKTXNID",responseobject:responseobject}})
	// }else if(paytmresponsedata.ORDERID==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass ORDERID",responseobject:responseobject}})
	// }else if(paytmresponsedata.TXNAMOUNT==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass TXNAMOUNT",responseobject:responseobject}})
	// }else if(paytmresponsedata.STATUS==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass STATUS",responseobject:responseobject}})
	// }else if(paytmresponsedata.CURRENCY==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass CURRENCY",responseobject:responseobject}})
	// }else if(paytmresponsedata.GATEWAYNAME==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass GATEWAYNAME",responseobject:responseobject}})
	// }else if(paytmresponsedata.RESPCODE==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass RESPCODE",responseobject:responseobject}})
	// }else if(paytmresponsedata.RESPMSG==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass RESPMSG",responseobject:responseobject}})
	// }else if(paytmresponsedata.BANKNAME==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass BANKNAME",responseobject:responseobject}})
	// }else if(paytmresponsedata.MID==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass MID",responseobject:responseobject}})
	// }else if(paytmresponsedata.PAYMENTMODE==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass PAYMENTMODE",responseobject:responseobject}})
	// }else if(paytmresponsedata.REFUNDAMT==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass REFUNDAMT",responseobject:responseobject}})
	// }else if(paytmresponsedata.TXNDATE==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass TXNDATE",responseobject:responseobject}})
	// }else if(paytmresponsedata.IS_CHECKSUM_VALID==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass IS_CHECKSUM_VALID",responseobject:responseobject}})
	// }else if(paytmresponsedata.CHECKSUMHASH==undefined){
	//  self.emit("failedPaytmCallbackUrl",{error:{message:"Please pass CHECKSUMHASH",responseobject:responseobject}})
	// }else{
		/////////////////////////////////
		_validateCheckSumPayTm(self,paytmresponsedata,responseobject)
		////////////////////////////////
	}
}
var _validateCheckSumPayTm=function(self,paytmresponsedata,responseobject){
	var merchantKey=CONFIG.merchantKey;
	var paytmChecksum=paytmresponsedata.CHECKSUMHASH;
	var MID=paytmresponsedata.MID;
	var TXNID=paytmresponsedata.TXNID;
	var ORDER_ID=paytmresponsedata.ORDERID;
	var BANKTXNID=paytmresponsedata.BANKTXNID;
	var STATUS=paytmresponsedata.STATUS;
	var RESPCODE=paytmresponsedata.RESPCODE;
	var TXNAMOUNT=paytmresponsedata.TXNAMOUNT;
	var responseobject={
	    "TXNID": TXNID,
	    "BANKTXNID": BANKTXNID,
	    "ORDERID": ORDER_ID,
	    "TXNAMOUNT": paytmresponsedata.TXNAMOUNT,
	    "STATUS":STATUS,
	    "CURRENCY": paytmresponsedata.CURRENCY,
	    "GATEWAYNAME": paytmresponsedata.GATEWAYNAME,
	    "RESPCODE": RESPCODE,
	    "RESPMSG": paytmresponsedata.RESPMSG,
	    "BANKNAME": paytmresponsedata.BANKNAME,
	    "MID": MID,
	    "PAYMENTMODE":paytmresponsedata.PAYMENTMODE ,
	    "REFUNDAMT": paytmresponsedata.REFUNDAMT,
	    "TXNDATE":new Date(paytmresponsedata.TXNDATE),
	    "IS_CHECKSUM_VALID": "N"
 		}
 	
	java.callStaticMethod("PayTm", "validateCheckSum",paytmChecksum,merchantKey,MID,TXNID,ORDER_ID,BANKTXNID,STATUS,RESPCODE,TXNAMOUNT, function(err, results) {
  	if(err) {
  		console.log("error"+err)
  		
  		self.emit("failedPaytmCallbackUrl",{error:{message:"CHECKSUMHASH IS NOT VALID",responseobject:responseobject}})
  	}else{
  		if(responseobject.STATUS.toLowerCase()=="txn_success"){
  			logger.emit("log","Payment Successfull");
  			responseobject.IS_CHECKSUM_VALID="Y";
  			/////////////////////////////////////
			 _successfullPaytmCallbackUrl(self,responseobject)
			////////////////////////////////////
 			
  		}else{
  			self.emit("failedPaytmCallbackUrl",{error:{message:"CHECKSUMHASH IS NOT VALID",responseobject:responseobject}})
  		}
 
 	
  	}
  	////////////////////////////////
  		_updateOrderPaymentDatails(self,responseobject)
  		//////////////////////////////// 			

  	 	
	})
}
var _updateOrderPaymentDatails=function(self,responseobject){
	var paymentsetdata={};
	for(i in responseobject){
		paymentsetdata[i]=responseobject[i]
	}
  // paymentsetdata.mode="paytm";
  // paymentsetdata.paymentid=generateId()
	// paymentsetdata.status="approved";//if payment is done order status should set to approved
	console.log(paymentsetdata)
	OrderModel.update({orderid:responseobject.ORDERID},{$set:{status:"approved",payment:paymentsetdata}},function(err,paymentupdatestatus){
		if(err){
			logger.emit("error",{error:{code:"ED001",message:"Database Issueerr"+err,responseobject:responseobject}})
		}else if(paymentupdatestatus==0){
			logger.emit("error",{error:{message:"Order id is wrong",responseobject:responseobject}})
		}else{
			responseobject.IS_CHECKSUM_VALID="Y";
			OrderModel.findOne({orderid:responseobject.ORDERID},function(err,order){
				if(err){
					logger.emit("error","Database Issue")
				}else if(!order){
					logger.emit("error","Order id is wrong")
				}else{
					var suborderids=[];
					for(var i=0;i<order.suborder.length;i++){
						// suborderids.push({order.suborder[i].suborderid});
							//////////////////////////////////
					_makeSubOrderPaymentDone(order.orderid,order.suborder[i].suborderid)
					////////////////////////////////
					}
				}
			})
			/////////////////////////////////////
			// _successfullPaytmCallbackUrl(self,responseobject)
			////////////////////////////////////
		}
	})
}
var _makeSubOrderPaymentDone=function(orderid,suborderid){

	OrderModel.update({orderid:orderid,"suborder.suborderid":suborderid},{$set:{"suborder.$.sellerpayment.status":"done","suborder.$.sellerpayment.paiddate":new Date(),"suborder.$.buyerpayment.status":"done","suborder.$.buyerpayment.paiddate":new Date()}},function(err,suborderpaymentstaus){
		if(err){
			logger.emit("error","Database Issue :_makeSubOrderPaymentDone"+err)
		}else if(suborderpaymentstaus==0){
			logger.emit("error","suborderid is wrong")
		}else{
			logger.emit("log","suborder payment done"+suborderid)
		}
	})
}
var _successfullPaytmCallbackUrl=function(self,responseobject){
	self.emit("successfulPaytmCallbackUrl",{success:{message:"Payment done Successfully",responseobject:responseobject}})
}
Order.prototype.getBranchSubOrderStatusWiseCount = function(userid,providerid,branchid){
	var self = this;	
	//////////////////////////////
	_IsAuthorizedToGetSuborderStatusWiseCount(self,userid,providerid,branchid);
	//////////////////////////////
}
var _IsAuthorizedToGetSuborderStatusWiseCount=function(self,userid,providerid,branchid){
	//provider can see their suborder if provider,branchid,confirmed true
	UserModel.find({userid:userid,"provider.branchid":branchid,"provider.confirmed":true},function(err,userprovider){
		if(err){
			logger.emit("error","Database Issue _IsAuthorizedToGetSuborderStatusWiseCount"+err)
			self.emit("failedgetOrderStatusWiseCount",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!userprovider){
			self.emit("failedgetOrderStatusWiseCount",{"error":{"message":"Branch details is not associated with user"}});
		}else{
			/////////////////////////////////////////////////
			_getSubOrderStatusWiseCount(self,userid,branchid)
			////////////////////////////////////////////////////
		}
	})

}
var _getSubOrderStatusWiseCount=function(self,userid,branchid){
	 OrderModel.aggregate({$match:{status:{$ne:"waitforapproval"},"suborder.productprovider.branchid":branchid}},{$unwind:"$suborder"},{$match:{"suborder.productprovider.branchid":branchid}},{$group:{_id:"$suborder.status",statuscount:{$sum:1}}},{$project:{status:"$_id",statuscount:1}},function(err,statuswisecount){
	 	if(err){
	 		logger.emit("error","Database Issue _getSubOrderStatusWiseCount"+err)
			self.emit("failedgetOrderStatusWiseCount",{"error":{"code":"ED001","message":"Database Issue"}});
	 	}else{
	 		var statusarray={recieved:["orderstart"],past:["ordercomplete","cancelled","rejected"],approved:["accepted"],packing:["inproduction","packing","factorytostore"],delivery:["storepickup","homedelivery"]};
	 		var statuswisecountarray=[];
	 		console.log("teset"+JSON.stringify(statuswisecount))
	 		for(var i in statusarray){
	 			var count=0;
	 			for(var j=0;j<statuswisecount.length;j++){
	 				console.log("statusarray"+statuswisecount[j].status)
					if(statusarray[i].indexOf(statuswisecount[j].status)>=0){
						count+=statuswisecount[j].statuscount;
					}		 
	 			}
	 			statuswisecountarray.push({status:i,statuscount:count})
	 		}
	 		//////////////////////////////////
	 		_successfullGetSubOrderStatusWisecount(self,statuswisecountarray)
	 		////////////////////////////////////
	 	}
	 })
}
var _successfullGetSubOrderStatusWisecount=function(self,statuswisecountarray){
	self.emit("successfulGetOrderStatusWiseCount",{success:{message:"Getting Suborderwisecount sucessfully",statuswisecount:statuswisecountarray}})
}
Order.prototype.getProviderSubOrderStatusWiseCount = function(userid,providerid){
	var self = this;	
	//////////////////////////////
	_IsAuthorizedToGetProviderSuborderStatusWiseCount(self,userid,providerid);
	//////////////////////////////
}
var _IsAuthorizedToGetProviderSuborderStatusWiseCount=function(self,userid,providerid){
	//provider can see their suborder if provider,branchid,confirmed true
	UserModel.find({userid:userid,"provider.providerid":providerid,"provider.confirmed":true},function(err,userprovider){
		if(err){
			logger.emit("error","Database Issue _IsAuthorizedToGetSuborderStatusWiseCount"+err)
			self.emit("failedgetPrviderOrderStatusWiseCount",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!userprovider){
			self.emit("failedgetPrviderOrderStatusWiseCount",{"error":{"message":"Branch details is not associated with user"}});
		}else{
			/////////////////////////////////////////////////
			_getProviderSubOrderStatusWiseCount(self,userid,providerid)
			////////////////////////////////////////////////////
		}
	})

}
var _getProviderSubOrderStatusWiseCount=function(self,userid,providerid){
	 OrderModel.aggregate({$match:{"suborder.productprovider.providerid":providerid,status:{$ne:"waitforapproval"}}},{$unwind:"$suborder"},{$match:{"suborder.productprovider.providerid":providerid}},{$group:{_id:"$suborder.status",statuscount:{$sum:1}}},{$project:{status:"$_id",statuscount:1}},function(err,statuswisecount){
	 	if(err){
	 		logger.emit("error","Database Issue _getSubOrderStatusWiseCount"+err)
			self.emit("failedgetPrviderOrderStatusWiseCount",{"error":{"code":"ED001","message":"Database Issue"}});
	 	}else{
	 		var statusarray={past:["ordercomplete","cancelled","rejected"],recieved:["orderstart"],approved:["accepted"],packing:["inproduction","packing","factorytostore"],delivery:["storepickup","homedelivery"]};
	 		var statuswisecountarray=[];
	 		console.log("teset"+JSON.stringify(statuswisecount))
	 		for(var i in statusarray){
	 			var count=0;
	 			for(var j=0;j<statuswisecount.length;j++){
	 				console.log("statusarray"+statuswisecount[j].status)
					if(statusarray[i].indexOf(statuswisecount[j].status)>=0){
						count+=statuswisecount[j].statuscount;
					}		 
	 			}
	 			statuswisecountarray.push({status:i,statuscount:count})
	 		}
	 		//////////////////////////////////
	 		_successfullGetProvierSubOrderStatusWisecount(self,statuswisecountarray)
	 		////////////////////////////////////
	 	}
	 })
}
var _successfullGetProvierSubOrderStatusWisecount=function(self,statuswisecountarray){
	self.emit("successfulGetProviderOrderStatusWiseCount",{success:{message:"Getting Suborderwisecount sucessfully",statuswisecount:statuswisecountarray}})
}


