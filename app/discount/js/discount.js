
var DiscountModel=require("./discount-model");
var events = require("events");
var logger=require("../../common/js/logger");

var S=require("string");
var ProductProviderModel=require('../../productprovider/js/productprovider-model');
var ProductCatalogModel=require("../../productcatalog/js/product-catalog-model");
var __=require("underscore");
var UserModel=require("../../user/js/user-model");
var Discount = function(discountdata) {
  this.discount=discountdata;
};
function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}
Discount.prototype = new events.EventEmitter;
module.exports = Discount;
var isValidProviderToManageDiscount=function(branchid,userid,callback){
	console.log("userid :dd"+userid+" branchid:"+branchid);
	UserModel.findOne({userid:userid,'provider.branchid':branchid,'provider.isOwner':true},function(err,userprovider){
		if(err){
			callback({error:{code:"ED001",message:"Database Error"}})
		}else if(!userprovider){
			// console.log("userprovider:"+userprovider)
			callback({error:{code:'EA001',message:"You are not authorized"}})
		}else{
			callback(null,"success");
		}
	})
}
var isValidProductsToManageDiscount=function(branchid,productsidsdata,callback){
	ProductCatalogModel.find({"branch.branchid":branchid},{productid:1},function(err,products){
		if(err){
			logger.emit("error","Database Error:isValidProductsToManageDiscount"+err);
			callback({"error":{code:"ED001",message:"Database Error"}})
		}else if(products.length==0){
			callback({error:{message:"No Products added to branch"}})
		}else{
			var productids=[];
			for(var i=0;i<products.length;i++){
				productids.push(products[i].productid);
			}
			var validproductids=__.intersection(productids,productsidsdata);
			
			  productsidsdata=validproductids
			  callback(null,productsidsdata)
			
		}
	})
}
Discount.prototype.addDiscount= function(sessionuserid,providerid,branchid) {
	var self=this;
	var discountdata=self.discount;
	console.log("Discount : "+JSON.stringify(discountdata));
	//////////////////////////////////////////////////
	_validateDiscountData(self,discountdata,sessionuserid,providerid,branchid);
	//////////////////////////////////////////////
};
var _validateDiscountData=function(self,discountdata,userid,providerid,branchid){
	console.log("Discount : "+JSON.stringify(discountdata));
	if(discountdata==undefined){
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please enter discount data"}});
	}else if(discountdata.discountcode==undefined || discountdata.discountcode==""){	
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please enter discountcode"}});
	}else if(discountdata.description==undefined || discountdata.description==""){
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please enter discount description"}});
	}else if(discountdata.percent==undefined || discountdata.percent==""){	
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please enter discount percentage"}});
	}else if(!S(discountdata.percent).isNumeric()){
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Discount percent should be numeric"}});
	// }else if(!isArray(discountdata.products)){
	// 	self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please add products"}});
	// }else if(discountdata.products.length==0){
	// 	self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please add atleast one product"}});
	}else if(discountdata.startdate==undefined || discountdata.startdate==""){
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please enter discount startdate"}});
	}else if(discountdata.expirydate==undefined || discountdata.expirydate==""){
		self.emit("failedAddDiscount",{"error":{"code":"AV001","message":"Please enter discount expirydate"}});
	}else{
		//////////////////////////////////////////////////////////////////////////
		_isValidProviderToAddDiscount(self,discountdata,userid,providerid,branchid)
		///////////////////////////////////////////////////////////////////////////	
	}
}
var _isValidProviderToAddDiscount=function(self,discountdata,userid,providerid,branchid){
	console.log("providerid"+providerid+" branchid"+branchid+" userid"+userid);
	isValidProviderToManageDiscount(branchid,userid,function(err,result){
	  	if(err){
	  		self.emit("failedAddDiscount",err);
	  	}else{
	  		_checkDiscountCodeAlreadyExistForBranchProvider(self,discountdata,userid,providerid,branchid);
	  	}
	})
}

var _checkDiscountCodeAlreadyExistForBranchProvider = function(self,discountdata,userid,providerid,branchid){
	DiscountModel.findOne({providerid:providerid,branchid:branchid,discountcode:discountdata.discountcode.toUpperCase()},function(err,discount){
		if(err){
			logger.emit("error","Database Error:_checkDiscountApplyToProduct "+err,userid);
		  	self.emit("failedAddDiscount",{"error":{"message":"Database Error"}})
		}else if(discount){
			console.log("DISCOUNT : "+JSON.stringify(discount));
			self.emit("failedAddDiscount",{"error":{"message":"Discount code with same percent already exists"}});
		}else{
			console.log("DISCOUNT 1: "+JSON.stringify(discount));
			_addDiscount(self,discountdata,userid,providerid,branchid);
		}
	})
}

var _checkDiscountApplyToProduct=function(self,discountdata,userid,providerid,branchid){
	DiscountModel.aggregate({$match:{branchid:branchid}},{$unwind:"$products"},{$match:{products:{$in:discountdata.products},startdate:{$gte:new Date(discountdata.startdate)},expirydate:{$lte:new Date(discountdata.expirydate)}}},{$project:{products:1}},function(err,alreadydiscountappliedproducts){
		if(err){
			logger.emit("error","Database Error:_checkDiscountApplyToProduct "+err,userid);
		  	self.emit("failedAddDiscount",{"error":{"message":"Database Error"}})
		}else{
			if(alreadydiscountappliedproducts.length==discountdata.products.length){
				self.emit("failedAddDiscount",{"error":{"message":"Discountcode already applied to the products"}})
			}else{
			 	var alreadyappliedproductids=[]
			 	for(var i=0;i<alreadydiscountappliedproducts.length;i++){
			 		alreadyappliedproductids.push(alreadydiscountappliedproducts[i].products);
			 	}
			 	logger.emit("log","alreadyappliedproductids"+JSON.stringify(alreadydiscountappliedproducts));
			 		logger.emit("log","discountdata"+JSON.stringify(discountdata));
			 	discountdata.products=__.difference(discountdata.products,alreadyappliedproductids);
			 	logger.emit("log","discountdata"+discountdata.products);
			 	//////////////////////////////////////////////////////////
			   _addDiscount(self,discountdata,userid,providerid,branchid,alreadyappliedproductids);
			   /////////////////////////////////////////////////////////
			}
		}
	})
}

var _addDiscount=function(self,discountdata,userid,providerid,branchid){
	discountdata.providerid=providerid;
	discountdata.branchid=branchid;
	discountdata.startdate=new Date(discountdata.startdate);
	discountdata.expirydate=new Date(discountdata.expirydate);
	discountdata.percent=parseInt(discountdata.percent);	
	discountdata.discountcode=discountdata.discountcode.toUpperCase();
	
  var discount_object=new DiscountModel(discountdata);
  discount_object.save(function(err,discount){
  	if(err){
      logger.emit("error","Database Error:_addDiscount"+err,userid);
		self.emit("failedAddDiscount",{"error":{"message":"Database Error"}})
  	}else{
  		//////////////////////////////
  		_successfullAddDiscount(self);
  		//////////////////////////////
  	}
  });
}
var _successfullAddDiscount=function(self,alreadyappliedproductids){
	self.emit("successfulAddDiscount",{success:{message:"Discount Added Successfully",alreadyappliedproductids:alreadyappliedproductids}})
}

Discount.prototype.getDiscountCodes= function(sessionuserid,providerid,branchid) {
	var self=this;
	//////////////////////////////////////////////////////////////////////////
	_isValidProviderToGetDiscountData(self,sessionuserid,providerid,branchid);
	//////////////////////////////////////////////////////////////////////////
};
var _isValidProviderToGetDiscountData=function(self,userid,providerid,branchid){
	console.log("providerid"+providerid+" branchid"+branchid+" userid"+userid);
	isValidProviderToManageDiscount(branchid,userid,function(err,result){
	  	if(err){
	  		self.emit("failedGetDiscountCodes",err);
	  	}else{
	  		_getDiscountCodes(self,userid,providerid,branchid);
	  	}
	})
}
var _getDiscountCodes = function(self,userid,providerid,branchid){
	DiscountModel.find({status:{$ne:"deactive"},providerid:providerid,branchid:branchid},{_id:0,discountid:1,discountcode:1,percent:1,description:1,startdate:1,expirydate:1}).sort({startdate:1}).exec(function(err,discount){
	  	if(err){
	      	logger.emit("error","Database Error:_getDiscountCodes"+err,sessionuser.userid);
			self.emit("failedGetDiscountCodes",{"error":{"message":"Database Error"}})
	  	}else if(discount.length==0){
	      	self.emit("failedGetDiscountCodes",{"error":{"message":"Discount code does not exists"}});
	  	}else{
	  		_successfulGetDiscountCodes(self,discount);
	    }
  	})
}
var _successfulGetDiscountCodes=function(self,discount){
	self.emit("successfulGetDiscountCodes",{success:{message:"Getting Discount Codes Successfully","discountcodes":discount}});
}

Discount.prototype.getAllProducts= function(sessionuserid,providerid,branchid) {
	var self=this;
	//////////////////////////////////////////////////////////////////////////
	_isValidProviderToGetAllProducts(self,sessionuserid,providerid,branchid);
	//////////////////////////////////////////////////////////////////////////
};
var _isValidProviderToGetAllProducts=function(self,userid,providerid,branchid){
	console.log("providerid"+providerid+" branchid"+branchid+" userid"+userid);
	isValidProviderToManageDiscount(branchid,userid,function(err,result){
	  	if(err){
	  		self.emit("failedGetAllProducts",err);
	  	}else{
	  		_getAllProducts(self,userid,providerid,branchid);
	  	}
	})
}
var _getAllProducts = function(self,userid,providerid,branchid){
	ProductCatalogModel.find({status:"publish","provider.providerid":providerid,"branch.branchid":branchid},{_id:0,productname:1,productid:1,price:1},function(err,products){
	  	if(err){
	      	logger.emit("error","Database Error:_getAllProducts"+err,sessionuser.userid);
			self.emit("failedGetAllProducts",{"error":{"message":"Database Error"}})
	  	}else if(products.length==0){
	      	self.emit("failedGetAllProducts",{"error":{"message":"Products does not exist"}});
	  	}else{
	  		_successfulGetAllProducts(self,products);
	    }
  	})
}
var _successfulGetAllProducts=function(self,products){
	self.emit("successfulGetAllProducts",{success:{message:"Getting All Products Successfully","products":products}});
}

Discount.prototype.updateDiscount= function(sessionuser,discountid) {
	var self=this;
	var discountdata=self.discount;
	//////////////////////////////////////////////////
	_validateUpdateDiscountData(self,sessionuser,discountdata,discountid);
	//////////////////////////////////////////////
};
var _validateUpdateDiscountData=function(self,sessionuser,discountdata,discountid){
	console.log("discountdata"+JSON.stringify(discountdata));
	discountdata=JSON.stringify(discountdata);
	discountdata=JSON.parse(discountdata);

	if(discountdata==undefined){
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"Please enter discount data"}});
	}else if(discountdata.description==undefined || discountdata.description==""){
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"Please enter discount description"}});
	}else if(discountdata.percent==undefined || discountdata.percent==""){	
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"Please enter discount percent"}});
	}else if(!S(discountdata.percent).isNumeric()){	
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"Discount percent should be numeric"}});
	}else if(discountdata.startdate==undefined || discountdata.startdate==""){
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"Please enter discount startdate"}});
	}else if(discountdata.expirydate==undefined || discountdata.expirydate==""){
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"Please enter discount expirydate"}});
	}else if(discountdata.discountcode != undefined || discountdata.createddate!=undefined || discountdata.status!=undefined  || discountdata.products!=undefined){
		self.emit("failedUpdateDiscount",{"error":{"code":"AV001","message":"You cannot change discount details [discount code, status, createdate, products]"}});
	}else{
		//////////////////////////////////////////////////////////////////////////
		_isValidProviderToUpdateDiscount(self,discountdata,sessionuser,discountid)
		///////////////////////////////////////////////////////////////////////////	
	}
}

var _isValidProviderToUpdateDiscount=function(self,discountdata,sessionuser,discountid){
  DiscountModel.findOne({discountid:discountid},{discountid:1,providerid:1,branchid:1},function(err,discount){
  	if(err){
      logger.emit("error","Database Error:_isValidBranchIdForAddDiscount"+err,sessionuser.userid);
		  self.emit("failedUpdateDiscount",{"error":{"message":"Database Error"}})
  	}else if(!discount){
      self.emit("failedUpdateDiscount",{"error":{"message":"Discount does not exists"}})
  	}else{
  		UserModel.findOne({userid:sessionuser.userid,"provider.providerid":discount.providerid,"provider.isOwner":true},function(err,userprovideradmin){
  			if(err){
  				logger.emit("error","Database Error:_isValidProviderToUpdateDiscount"+err,sessionuser.userid);
		      self.emit("failedUpdateDiscount",{"error":{"message":"Database Error"}})
  			}else if(!userprovideradmin){
  				self.emit("failedUpdateDiscount",{"error":{"message":"Only users with admin role can update discount details"}})
  			}else{
  				//////////////////////////////////////////////////////////
        	_updateDiscount(self,discountid,discountdata,sessionuser);
	        /////////////////////////////////////////////////////////
  			}
  		})
    }
  })
 }
var _updateDiscount=function(self,discountid,discountdata,user){
	// discountdata.providerid=providerid;
	// discountdata.branchid=branchid;
	// discountdata.percent=parseInt(discountdata.percent);
	
	// discountdata.discountcode=discountdata.discountcode.toUpperCase();
	discountdata.updatedby=user.userid;
	discountdata.updatedate=new Date();
	DiscountModel.update({discountid:discountid},{$set:discountdata},function(err,updatediscountstatus){
   	 if(err){
   	 	logger.emit("error","Database Error:_updateDiscount"+err,user.userid);
		  self.emit("failedUpdateDiscount",{"error":{"message":"Database Error"}})
   	 }else if(updatediscountstatus==0){
   	 	self.emit("failedUpdateDiscount",{"error":{"message":"Incorrect Discount id"}})
   	 }else{
   	 	/////////////////////////////////
   	 	_successfullUpdateDiscount(self);
   	 	/////////////////////////////////
   	 }
   })
}
var _successfullUpdateDiscount=function(self){
	self.emit("successfulUpdateDiscount",{success:{message:"Discount Updated Successfully"}});
}

Discount.prototype.manageProductsToDiscountCode= function(sessionuser,discountid,products,branchid) {
	var self=this;
	// var discountdata=self.discount;
	/////////////////////////////////////////////////////////////////////////////////
	_validateAddProductToDiscountCode(self,sessionuser,discountid,products,branchid);
	/////////////////////////////////////////////////////////////////////////////////
};
var _validateAddProductToDiscountCode=function(self,sessionuser,discountid,products,branchid){
	if(products==undefined){
		self.emit("failedAddProductsToDiscountCode",{"error":{"code":"AV001","message":"Please enter products to add"}});
	}else if(!isArray(products)){
		self.emit("failedAddProductsToDiscountCode",{"error":{"code":"AV001","message":"Products should be sent in a JSON array"}});
	}else{
		//////////////////////////////////////////////////////////////////////////////////////
		_isValidBranchIdForAddProductToDiscount(self,sessionuser,discountid,products,branchid);
		//////////////////////////////////////////////////////////////////////////////////////
	}     
}
var _isValidBranchIdForAddProductToDiscount=function(self,sessionuser,discountid,products,branchid){
	isValidProviderToManageDiscount(branchid,sessionuser.userid,function(err,result){
  		if(err){
  			self.emit("failedAddProductsToDiscountCode",err);
  		}else{
  			isValidProductsToManageDiscount(branchid,products,function(err,validproducts){
  				if(err){
  					self.emit("failedAddProductsToDiscountCode",err)
	  			}else{  	
	  			   if(validproducts.length==0){
	  			   	 //////////////////////////////////////////////////////////////////////
					 _addProductsToDiscountCode(self,discountid,sessionuser,validproducts,branchid,[])
					 /////////////////////////////////////////////////////////
	  			   }else{
	  			   	/////////////////////////////////////////////////////////////////////////////////////////////
  				
				    _checkDiscountApplyToProductAddToDiscount(self,discountid,sessionuser,validproducts,branchid);
			   	 	/////////////////////////////////////////////////////////////////////////////////////////////	
	  			   }			
	  				
	  			}
	  		})
	  	}
	})
}
var _checkDiscountApplyToProductAddToDiscount=function(self,discountid,sessionuser,products,branchid){
	DiscountModel.findOne({discountid:discountid},function(err,discount){
		if(err){
			logger.emit("error","Database Error:_checkDiscountApplyToProduct"+err,userid);
		  	self.emit("failedAddProductsToDiscountCode",{"error":{"message":"Database Error"}})
		}else if(!discount){
			self.emit("failedAddProductsToDiscountCode",{"error":{"message":"Incorrect Discount id"}})
		}else{
			DiscountModel.aggregate({$match:{branchid:branchid,discountid:{$ne:discountid}}},{$unwind:"$products"},{$match:{products:{$in:products},$or:[{startdate:{$lte:new Date(discount.startdate)},expirydate:{$gte:new Date(discount.startdate)}},{startdate:{$lte:new Date(discount.expirydate)},expirydate:{$gte:new Date(discount.expirydate)}}]}},{$project:{products:1}},function(err,alreadydiscountappliedproducts){
				if(err){
					logger.emit("error","Database Error:_checkDiscountApplyToProduct"+err);
				  self.emit("failedAddProductsToDiscountCode",{"error":{"message":"Database Error"}})
				}else{
					console.log("alreadydiscountappliedproducts.length : "+alreadydiscountappliedproducts.length +" products.length : "+products.length);
					if(alreadydiscountappliedproducts.length==products.length){
						self.emit("failedAddProductsToDiscountCode",{"error":{"message":"Discount code is already applied to products"}}) 	
					}else{
					 	var alreadyappliedproductids=[];
					 	for(var i=0;i<alreadydiscountappliedproducts.length;i++){
					 		alreadyappliedproductids.push(alreadydiscountappliedproducts[i].products);
					 	}
					 	logger.emit("log","alreadyappliedproductids"+alreadyappliedproductids);
					 		// logger.emit("log","discountdata"+JSON.stringify(discountdata));
					 	products=__.difference(products,alreadyappliedproductids);
					 	// logger.emit("log","discountdata"+discountdata.products);
						////////////////////////////////////////////////////////////////////////////////////////////////////
						_addProductsToDiscountCode(self,discountid,sessionuser,products,branchid,alreadyappliedproductids);
						////////////////////////////////////////////////////////////////////////////////////////////////////
					}
				}
			})
    	}
   })
}
var _addProductsToDiscountCode=function(self,discountid,sessionuser,products,branchid,alreadyappliedproductids){
	DiscountModel.update({discountid:discountid},{$set:{products:products}},function(err,addproductsstatus){
		if(err){
			logger.emit("error","Database Error:_addProductsToDiscountCode"+err,userid);
			self.emit("failedAddProductsToDiscountCode",{"error":{"message":"Database Error"}});
		}else if(addproductsstatus==0){
			self.emit("failedAddProductsToDiscountCode",{"error":{"message":"Incorrect Discount id"}});
		}else{

			//////////////////////////////////////
			_successfullManageProductToDiscountCode(self,alreadyappliedproductids)
			////////////////////////////////////		

		}
	})
}
var _successfullManageProductToDiscountCode=function(self,alreadyappliedproductids){
	self.emit("successfulAddProductsToDiscountCode",{success:{message:"Product managed for Discount successfully",alreadyappliedproductids:alreadyappliedproductids}})
}

Discount.prototype.removeProductsFromDiscountCode= function(sessionuser,discountid,products,branchid) {
	var self=this;
	// var discountdata=self.discount;
	//////////////////////////////////////////////////
	_validateRemoveProductFromDiscountCode(self,sessionuser,discountid,products,branchid);
	//////////////////////////////////////////////
};
var _validateRemoveProductFromDiscountCode=function(self,sessionuser,discountid,products,branchid){
	if(products==undefined){
		self.emit("failedRemoveProductsFromDiscountCode",{"error":{"code":"AV001","message":"Please enter products to add"}});
	}else if(!isArray(products)){
		self.emit("failedRemoveProductsFromDiscountCode",{"error":{"code":"AV001","message":"Products should be sent as a JSON array"}});
	}else if(products.length==0){
		self.emit("failedRemoveProductsFromDiscountCode",{"error":{"code":"AV001","message":"Please add atleast one product"}});
	}else{
		///////////////////////////////////////////
		_isValidBranchIdForRemoveProductFromDiscount(self,sessionuser,discountid,products,branchid)
		///////////////////////////////////////////
	}     
}
var _isValidBranchIdForRemoveProductFromDiscount=function(self,sessionuser,discountid,products,branchid){
	 isValidProviderToManageDiscount(branchid,sessionuser.userid,function(err,result){
  	if(err){
  		self.emit("failedRemoveProductsFromDiscountCode",err)
  	}else{
  		isValidProductsToManageDiscount(branchid,products,function(err,validproducts){
  			if(err){
  				self.emit("failedRemoveProductsFromDiscountCode",err)
  			}else{
  				//////////////////////////////////////////////////////////////////////
  				_removeProductFromDiscount(self,sessionuser,discountid,products,branchid)
  				///////////////////////////////////	  				
		    }
  		})
  	}
  })
}
var _removeProductFromDiscount=function(self,sessionuser,discountid,products,branchid){
  DiscountModel.update({discountid:discountid},{$pullAll:{products:products}},function(err,removproductstatus){
  	if(err){
  		logger.emit("error","Database Error _removeProductFromDiscount");
  		self.emit("failedRemoveProductsFromDiscountCode",{error:{code:"ED001",message:"Database Error"}})
  	}else if(removproductstatus==0){
  		self.emit("failedRemoveProductsFromDiscountCode",{error:{message:"Incorrect Discount id"}})
  	}else{
  		//////////////////////////////////
  		_successfullRemoveFromDiscount(self)
  		/////////////////////////////////
  	}
  })
}
var _successfullRemoveFromDiscount=function(self){
	self.emit("successfulRemoveProductsFromDiscountCode",{success:{message:"Successfully removed discounts from products"}});
}

Discount.prototype.getDiscountedProducts= function(sessionuserid,branchid,discountid) {
	var self=this;
	////////////////////////////////////////////////////////////////////////////////
	_isValidProviderToGetDiscountedProducts(self,sessionuserid,branchid,discountid);
	////////////////////////////////////////////////////////////////////////////////
};
var _isValidProviderToGetDiscountedProducts=function(self,userid,branchid,discountid){
	isValidProviderToManageDiscount(branchid,userid,function(err,result){
	  	if(err){
	  		self.emit("failedGetDiscountedProducts",err);
	  	}else{
	  		_getDiscountedProductList(self,userid,branchid,discountid);
	  	}
	})
}
var _getDiscountedProductList = function(self,userid,branchid,discountid){
	console.log("");
	DiscountModel.findOne({status:{$ne:"deactive"},discountid:discountid},{_id:0,products:1,percent:1},function(err,discountdata){
	  	if(err){
	      	logger.emit("error","Database Error:_getDiscountedProductList "+err,sessionuser.userid);
			self.emit("failedGetDiscountedProducts",{"error":{"message":"Database Error"}})
	  	}else if(!discountdata){
	      	self.emit("failedGetDiscountedProducts",{"error":{"message":"Incorrect Discount id"}});
	  	}else{
	  		_getDiscountedProductData(self,discountdata);
	    }
  	})
}
var _getDiscountedProductData = function(self,discountdata){
	ProductCatalogModel.find({productid:{$in:discountdata.products}},{_id:0,productid:1,productname:1,price:1},function(err,products){
	  	if(err){
	      	logger.emit("error","Database Error:_getDiscountedProductData "+err,sessionuser.userid);
			self.emit("failedGetDiscountedProducts",{"error":{"message":"Database Error"}})
	  	}else if(products.length==0){
	      	self.emit("failedGetDiscountedProducts",{"error":{"message":"Product does not exist"}});
	  	}else{
	  		products = JSON.stringify(products);
	  		products = JSON.parse(products);
	  		for(var i=0;i<products.length;i++){
	  			products[i].price.discountedprice = products[i].price.value*(1-discountdata.percent/100); 
	  		}
	  		_successfulGetDiscountedProducts(self,products);
	    }
  	})
}

var _successfulGetDiscountedProducts=function(self,products){
	self.emit("successfulGetDiscountedProducts",{success:{message:"Getting Discounted Products Successfully","products":products}});
}

Discount.prototype.deleteDiscount= function(sessionuser,providerid,branchid,discountid) {
	var self=this;
	var discountdata=self.discount;
	//////////////////////////////////////////////////
	_isValidProviderToDeleteDiscount(self,sessionuser,providerid,branchid,discountid);
	//////////////////////////////////////////////
};
var _isValidProviderToDeleteDiscount=function(self,userid,providerid,branchid,discountid){
	isValidProviderToManageDiscount(branchid,userid,function(err,result){
	  	if(err){
	  		self.emit("failedDeleteDiscount",err);
	  	}else{
	  		_deleteDiscount(self,userid,providerid,branchid,discountid);
	  	}
	})
}
var _deleteDiscount = function(self,userid,providerid,branchid,discountid){
	DiscountModel.remove({discountid:discountid},function(err,rmvdiscountstatus){
	  	if(err){
	  		logger.emit("error","Database Error _removeProductFromDiscount");
	  		self.emit("failedDeleteDiscount",{error:{code:"ED001",message:"Database Error"}});
	  	}else if(rmvdiscountstatus==0){
	  		self.emit("failedDeleteDiscount",{error:{message:"Incorrect Discount id"}});
	  	}else{
	  		////////////////////////////////
	  		_successfulDeleteDiscount(self);
	  		////////////////////////////////
	  	}
	})
}
var _successfulDeleteDiscount = function(self){
	self.emit("successfulDeleteDiscount",{success:{message:"Discount Deleted Successfully"}});
}