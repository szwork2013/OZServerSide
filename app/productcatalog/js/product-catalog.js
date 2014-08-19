var events = require("events");
var logger=require("../../common/js/logger");
var CategoryModel = require("../../productcategory/js/product-category-model");
var ProductProviderModel = require("../../productprovider/js/productprovider-model");
var ProductCatalogModel = require("./product-catalog-model");
var UserModel=require("../../user/js/user-model");
var fs=require("fs");
var path=require("path");
var AWS = require('aws-sdk');
var CONFIG=require("config").OrderZapp;
var amazonbucket=CONFIG.amazonbucket;
var isNumeric = require("isnumeric");
var exec = require('child_process').exec;
AWS.config.update({accessKeyId:'AKIAJOGXRBMWHVXPSC7Q', secretAccessKey:'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'});
AWS.config.update({region:'ap-southeast-1'});
var s3bucket = new AWS.S3();
var S=require("string");
var __=require("underscore")
var ProductLeadTimeModel=require("./product-leadtime-model");

var ProductCatalog = function(productcatalogdata) {
  this.productcatalog=productcatalogdata;
};

ProductCatalog.prototype = new events.EventEmitter;
module.exports = ProductCatalog;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

ProductCatalog.prototype.addProductCatalog = function(branchid,providerid,categoryid,user,productlogo) {
	var self = this;
	console.log("This "+JSON.stringify(this));
	var productcatalog = JSON.parse(self.productcatalog);
	console.log("ProductCatalog : "+ JSON.stringify(productcatalog));
	//////////////////////////////////////////////////
	_validateServiceCatalogData(self,branchid,providerid,categoryid,productcatalog,user,productlogo);
	//////////////////////////////////////////////
};

var _validateServiceCatalogData=function(self,branchid,providerid,categoryid,productcatalog,user,productlogo){
	if(productcatalog==undefined){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter productcatalog- JSON FORMAT ERROR"}})
	}else if(productcatalog.productname==undefined || productcatalog.productname==""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter productname"}})
	}else if(productcatalog.price==undefined || productcatalog.price==""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter product price key"}})
	}else if(productcatalog.price.value==undefined || productcatalog.price.value==""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter value in price"}})
	}else if(!isNumber(S(productcatalog.price.value))){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"price should be numeric"}});
	}else if(productcatalog.price.uom==undefined || productcatalog.price.uom==""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter unit of measurement"}})
	}else  if(["kg","no","ltr","lb","gm"].indexOf(productcatalog.price.uom.toLowerCase())<0){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"unit of measurement should be kg,lt,lb,no,gm"}});
	}else if(productcatalog.productdescription==undefined || productcatalog.productdescription==""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter productdescription"}});
	}else if(productcatalog.productcode==undefined || productcatalog.productcode==""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter productcode"}});
	}else if(productcatalog.foodtype==undefined){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter foodtype"}});
	}else if(["veg","non-veg","both"].indexOf(productcatalog.foodtype.toLowerCase())<0){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"foodtype must be veg, non-veg or both"}});
	// }else if(productcatalog.delivery==undefined){
	// 	self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter delivery details"}});
	}else if(productcatalog.leadtime==undefined){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter lead time details"}});
	}else if(productcatalog.leadtime.value == undefined || productcatalog.leadtime.value == ""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter lead time value"}});
	}else if(!Number(productcatalog.leadtime.value)){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Lead time value should be numeric"}});
	}else if(productcatalog.leadtime.option == undefined || productcatalog.leadtime.option == ""){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter lead time option"}});
	}else if(["minutes","hours","days","weeks"].indexOf(productcatalog.leadtime.option.toLowerCase())<0){
		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"option should be minutes, hours, days, weeks"}});
	// }else if(productcatalog.delivery.availability==undefined){
	// 	self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter availability details"}});
	// }else if(productcatalog.delivery.availability.from == undefined || productcatalog.delivery.availability.from == ""){
	// 	self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter availability  from time"}});
	// }else if(productcatalog.delivery.availability.to == undefined || productcatalog.delivery.availability.to == ""){
	// 	self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please enter availability to time"}});
	// }else if(!Number(productcatalog.delivery.availability.from) || !Number(productcatalog.delivery.availability.to)){
	// 	self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"availability time should be numeric"}});
	}else{
		//////////////////////////////////////////////////////////////////////////////////////////
		_validateProductLogo(self,branchid,providerid,categoryid,productcatalog,user,productlogo);
		////////////////////////////////////////////////////////////////////////////////////////	
		// productcatalog.foodtype=productcatalog.foodtype.toLowerCase();
		// productcatalog.price.currency="₹";
		// if(productlogo!=undefined){
  //    		if(productlogo.originalname==""){
  //    			self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please upload product logo"}});	
  //    		}else{
  //    			//////////////////////////////
		//      	_isValidProviderID(self,branchid,providerid,categoryid,productcatalog,user,productlogo);
	 //      		////////////////////////////
  //    		}
  //    	}else{
  //    		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please upload product logo"}});	
  //    	}
	}
}
var _validateProductLogo = function(self,branchid,providerid,categoryid,productcatalog,user,productlogo){
	productcatalog.foodtype=productcatalog.foodtype.toLowerCase();
	productcatalog.price.currency="₹";
	if(productlogo!=undefined){
    	if(productlogo.originalname==""){
    		self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please upload product logo"}});	
    	}else{
    		//////////////////////////////
		    _isValidProviderID(self,branchid,providerid,categoryid,productcatalog,user,productlogo);
	      	///////////////////////////
     	}
    }else{
    	self.emit("failedAddProductCatalog",{"error":{"code":"AV001","message":"Please upload product logo"}});	
    }
}
var _isValidProviderID = function(self,branchid,providerid,categoryid,productcatalog,user,productlogo){
	// console.log("_isValidProviderID : ");
	ProductProviderModel.aggregate([{$unwind:"$branch"},{$match:{status:{$ne:"deactive"},"branch.branchid":branchid,providerid:providerid}}]).exec(function(err,productProvider){
		if(err){
			logger.emit("error","Database Error : _isValidProviderID " + err);
			self.emit("failedAddProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(productProvider.length>0){
			var loc = {address1:productProvider[0].branch.location.address1,address2:productProvider[0].branch.location.address2,address3:productProvider[0].branch.location.address3,area:productProvider[0].branch.location.area,geo:productProvider[0].branch.location.geo,city:productProvider[0].branch.location.city,district:productProvider[0].branch.location.district,state:productProvider[0].branch.location.state,country:productProvider[0].branch.location.country,zipcode:productProvider[0].branch.location.zipcode};
			console.log("productProvider[0].branch @#@# "+JSON.stringify(productProvider[0].branch));
			productcatalog.branch = {branchid:branchid,branchname:productProvider[0].branch.branchname,note:productProvider[0].branch.note,location:loc,contact_supports:productProvider[0].branch.contact_supports};

			if(productProvider[0].providerlogo == undefined){
				productcatalog.provider = {provideremail:productProvider[0].provideremail,providerid:productProvider[0].providerid,providerbrandname:productProvider[0].providerbrandname,providername:productProvider[0].providername,providercode:productProvider[0].providercode,paymentmode:productProvider[0].paymentmode};
			}else{
				productcatalog.provider = {provideremail:productProvider[0].provideremail,providerid:productProvider[0].providerid,providername:productProvider[0].providername,providerbrandname:productProvider[0].providerbrandname,providerlogo:productProvider[0].providerlogo.image,providercode:productProvider[0].providercode,paymentmode:productProvider[0].paymentmode};
			}

			/************Add Tags*************/
			var providertags = [productProvider[0].providername];
			productcatalog.providertags = providertags;

			var producttags_array;
			if(S(productcatalog.productname).contains(" ")){
                producttags_array=productcatalog.productname.split(" ");
				producttags_array.push(productcatalog.productname);
			}else{
				producttags_array=[productcatalog.productname];
			}
			var producttags=producttags_array;
			productcatalog.producttags = producttags;

			var locationtags = [productProvider[0].branch.location.area];
			productcatalog.locationtags = locationtags;
			
			_isValidCategoryID(self,branchid,providerid,categoryid,productcatalog,productProvider[0],user,productlogo);
		}else{
	  		self.emit("failedAddProductCatalog",{"error":{"code":"AD001","message":"Wrong branchid or seller id"}});
	  	}
	});
}

var _isValidCategoryID = function(self,branchid,providerid,categoryid,productcatalog,productProvider,user,productlogo){
	console.log("_isValidCategoryID "+JSON.stringify(productProvider));
	CategoryModel.find({status:{$ne:"deactive"},$or:[{"ancestors.categoryid":productProvider.category.categoryid},{categoryid:productProvider.category.categoryid}]},{categoryid:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _isValidCategoryID " + err);
			self.emit("failedAddProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(doc.length>0){
			var categoryids=[];
			for(var i=0;i<doc.length;i++){
				categoryids.push(doc[i].categoryid);
			}
			if(categoryids.indexOf(categoryid)<0){
				self.emit("failedAddProductCatalog",{"error":{"code":"AD001","message":"Category does not exist for this seller"}});	
			}else{
				_getCategoryDataForProductCatalog(self,branchid,providerid,categoryid,productcatalog,user,productlogo);
			}
		}else{
	  		self.emit("failedAddProductCatalog",{"error":{"code":"AD001","message":"Wrong categoryid"}});
	  	}
	});
}

var _getCategoryDataForProductCatalog = function(self,branchid,providerid,categoryid,productcatalog,user,productlogo){
	// console.log("_getCategoryDataForServiceCatalog");
	CategoryModel.findOne({status:{$ne:"deactive"},categoryid:categoryid},{categoryid:1,categoryname:1,ancestors:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getCategoryDataForProductCatalog " + err);
			self.emit("failedAddProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(doc){
			productcatalog.category = {id:doc.categoryid,categoryname:doc.categoryname,ancestors:doc.ancestors};
			
			var categorytags = [];
			categorytags.push(doc.categoryname);
			for(var i=0;i<doc.ancestors.length;i++){
				if(S(doc.ancestors[i].categoryname).contains(" ")){
	                var categorytags1=doc.ancestors[i].categoryname.split(" ");
					categorytags.push(doc.ancestors[i].categoryname);
					categorytags=categorytags.concat(categorytags1);					
				}else{
					categorytags.push(doc.ancestors[i].categoryname);
				}
			}
			if(S(doc.categoryname).contains(" ")){
	            var categorytags2=doc.categoryname.split(" ");
				categorytags=categorytags.concat(categorytags2);
			}else{
				categorytags.push(doc.categoryname);
			}
			productcatalog.categorytags = categorytags;

			///////////////////////////////////////////////////////////////////////////////////
			_isProductNameIsSame(self,branchid,providerid,productcatalog,doc,user,productlogo);
			///////////////////////////////////////////////////////////////////////////////////
		}else{
	  		self.emit("failedAddProductCatalog",{"error":{"code":"AD001","message":"Wrong categoryid"}});
	  	}
	});
}
var _isProductNameIsSame=function(self,branchid,providerid,productcatalog,doc,user,productlogo){
	ProductCatalogModel.findOne({"branch.branchid":branchid,$or:[{productname:productcatalog.productname},{productname:productcatalog.productname.toLowerCase()}]},function (err,product) {
		if(err){
			logger.emit("error","Database Error : _isProductNameIsSame " + err);
			self.emit("failedAddProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(product){
			if(product.status=="deactive"){
				self.emit("failedAddProductCatalog",{"error":{"message":"Product name with "+productcatalog.productname+" already exists, please publish this product" }});
			}else{
				self.emit("failedAddProductCatalog",{"error":{"message":"Product name already exists" }});		
			}			
		}else{
			/////////////////////////////////////////////////////////////////////////////////
			_addProductCatalog(self,branchid,providerid,productcatalog,doc,user,productlogo);			
			/////////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _addProductCatalog = function(self,branchid,providerid,productcatalog,doc,user,productlogo){
	var productdata = productcatalog;
	console.log("productdata : "+JSON.stringify(productdata));
	productcatalog.createdate = new Date();
	var productcatalog = new ProductCatalogModel(productcatalog);
	productcatalog.save(function(err,prod_catalog){
		if(err){
			logger.emit("error","Database Error:_addProductCatalog"+err,sessionuser.userid);
			self.emit("failedAddProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else{
			if(productlogo!=undefined){
	            ///////////////////////////////////////////////////////////////////
		     	_addProductLogo(providerid,prod_catalog.productid,user,productlogo,function(err,result){
		     		if(err){
		     			logger.emit("error","productlogo not uploaded");
		     		}else{
		     			logger.emit("log","productlogo added with product details");
		     		}
		     	});
            }
            ////////////////////////////////////////////////////////////////////////////////
            _isBranchExistInLeadTimeModel(branchid,providerid,productdata,prod_catalog);
			////////////////////////////////////////////////////////////////////////////////
			_successfullAddProductCatalog(self,prod_catalog);
			/////////////////////////////////////////////////
		}
	})
}
var _isBranchExistInLeadTimeModel=function(branchid,providerid,productcatalog,product){
	ProductLeadTimeModel.findOne({branchid:branchid},function (err,branchdata) {
		if(err){
			logger.emit("error","Database Error : _isBranchExistInLeadTimeModel " + err);
		}else if(branchdata){
			var leadtimeinminutes={"hours":60,"days":24*60,"weeks":7*24*60,"minutes":1};				
			var minutes=leadtimeinminutes[productcatalog.leadtime.option]*productcatalog.leadtime.value;
			var leadtime_obj = {"productid":product.productid,productname:product.productname,"leadtimeinminutes":minutes,"leadtime":{"option":productcatalog.leadtime.option,"value":productcatalog.leadtime.value}};
			// console.log("!!!!!!!!!!!!!!!1 : "+JSON.stringify(leadtime_obj));
			ProductLeadTimeModel.update({branchid:branchid},{$push:{productleadtime:leadtime_obj}},function(err,updateStatus){
				if(err){
				  	logger.emit('error',"Database Error fun:_updateProductCatalog");
			  	}else if(updateStatus==0){
			  		logger.emit('error',"Server Error");		
			  	}else{
			  		logger.emit('info',"product lead time details saved successfully");
			  	}
			});	
		}else{
			//////////////////////////////////////////////////////////////////////////////
			_addProductDetailsToLeadTimeModel(branchid,providerid,productcatalog,product);
			//////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _addProductDetailsToLeadTimeModel = function(branchid,providerid,productcatalog,product){
	var leadtimeinminutes={"hours":60,"days":24*60,"weeks":7*24*60,"minutes":1};				
	var minutes=leadtimeinminutes[productcatalog.leadtime.option]*productcatalog.leadtime.value;
	var leadtime_arr = [];
	leadtime_arr.push({"productid":product.productid,productname:product.productname,"leadtimeinminutes":minutes,"leadtime":{"option":productcatalog.leadtime.option,"value":productcatalog.leadtime.value}});
	var leadtimeobject={providerid:providerid,branchid:branchid,productleadtime:leadtime_arr};
	var productleadtime_object=new ProductLeadTimeModel(leadtimeobject);
	productleadtime_object.save(function(err,productleadtime){
		if(err){
			logger.emit('error',"Database Error  _addProductDetailsToLeadTimeModel");
		}else{
			logger.emit('info',"product lead time details saved successfully");
		}
	})
}

var _successfullAddProductCatalog=function(self,product){
	console.log("Product @@@ "+JSON.stringify(product));
	var product = {productid:product.productid,branchid:product.branch.branchid};
	console.log("Product : "+JSON.stringify(product));
	self.emit("successfulAddProductCatalog",{"success":{"message":"Product Added Sucessfully","product":product}});
}

ProductCatalog.prototype.updateProductCatalog = function(providerid,productid,user){
	var self = this;
	var productcatalog = self.productcatalog;
	/////////////////////////////////////////////////////////////////////////////////////////
	_validateProductCatalogUpdateData(self,providerid,productid,productcatalog,user);
	/////////////////////////////////////////////////////////////////////////////////////////
};

var _validateProductCatalogUpdateData = function(self,providerid,productid,productcatalog,user){
	if(productcatalog==undefined){
		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"Please enter productcatalog"}});
	}else if(productcatalog.productname==undefined || productcatalog.productname==""){
		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"Please enter productname"}});
	}else if(productcatalog.price!=undefined){
		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"You cannot change the price in update product. Use manage price instead."}});
	}else if(productcatalog.leadtime!=undefined){
		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"You cannot change the leadtime in update product. Use manage lead time instead."}});
	}else if(productcatalog.productdescription==undefined || productcatalog.productdescription==""){
		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"Please enter productdescription"}});
	// }else if(productcatalog.productconfiguration!=undefined){
	// 	if(productcatalog.productconfiguration.categoryname == undefined || productcatalog.productconfiguration.categoryname == ""){
	// 		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"please enter categoryname in productconfiguration"}});
	// 	}else if(productcatalog.productconfiguration.categoryid == undefined || productcatalog.productconfiguration.categoryid == ""){
	// 		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"please enter categoryid in productconfiguration"}});
	// 	}else if(!isArray(productcatalog.productconfiguration.configuration)){
	// 		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"configuration should be an array"}});
	// 	}else if(productcatalog.productconfiguration.configuration.length == 0){
	// 		self.emit("failedUpdateProductCatalog",{"error":{"code":"AV001","message":"configuration can not be empty"}});
	// 	}else{

	// 		/////////////////////////////////////////////////////////////////////
	// 		_isAuthorizedUserToUpdateProduct(self,providerid,productid,productcatalog,user);
	// 		/////////////////////////////////////////////////////////////////////
	// 	}
	}else{
		/////////////////////////////////////////////////////////////////////
		_isAuthorizedUserToUpdateProduct(self,providerid,productid,productcatalog,user);
		/////////////////////////////////////////////////////////////////////
	}
}
var _isAuthorizedUserToUpdateProduct=function(self,providerid,productid,productcatalog,user){
	console.log("user.userid : "+user.userid+" providerid : "+providerid);
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Error  _isAuthorizedUserToUpdateProduct "+err,user.userid)
			self.emit("failedUpdateProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedUpdateProductCatalog",{"error":{"message":"You are not authorized to update product details"}});
		}else{
			if(productcatalog.categoryid == undefined){
				/////////////////////////////////////////////////////////////////////
				_updateProductCatalog(self,providerid,productid,productcatalog,user);
				/////////////////////////////////////////////////////////////////////
			}else{
				/////////////////////////////////////////////////////////////////////////////////
				_isValidProviderIDToUpdateProduct(self,providerid,productid,productcatalog,user);
				/////////////////////////////////////////////////////////////////////////////////
			}

		// 	ProductCatalogModel.findOne({productid:productid},{category:1,_id:0}).exec(function(err,product){
		// 		if(err){
		// 			logger.emit("error","Database Error : _isAuthorizedUserToUpdateProduct " + err);
		// 			self.emit("failedUpdateProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		// 		}else if(product){
		// 			if(product.category.id == productcatalog.categoryid){
		// 				console.log("same category");
		// 				/////////////////////////////////////////////////////////////////////
		// 		     	_updateProductCatalog(self,providerid,productid,productcatalog,user);
		// 			    /////////////////////////////////////////////////////////////////////
		// 			}else{
		// 				console.log("different category");
						// /////////////////////////////////////////////////////////////////////////////////
						// _isValidProviderIDToUpdateProduct(self,providerid,productid,productcatalog,user);
						// /////////////////////////////////////////////////////////////////////////////////
		// 			}
		// 		}else{
		// 	  		self.emit("failedUpdateProductCatalog",{"error":{"code":"AD001","message":"Wrong productid"}});
		// 	  	}
		// 	});
		}
	})
}
var _isValidProviderIDToUpdateProduct = function(self,providerid,productid,productcatalog,user){
	console.log("_isValidProviderIDToUpdateProduct : ");
	ProductProviderModel.findOne({providerid:providerid},{category:1}).exec(function(err,productProvider){
		if(err){
			logger.emit("error","Database Error : _isValidProviderIDToUpdateProduct " + err);
			self.emit("failedUpdateProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(productProvider){			
			console.log("ProductProvider "+JSON.stringify(productProvider));
			_isValidCategoryIDToUpdateProduct(self,providerid,productid,productcatalog.categoryid,productcatalog,productProvider,user);
		}else{
	  		self.emit("failedUpdateProductCatalog",{"error":{"code":"AD001","message":"Wrong seller id"}});
	  	}
	});
}
var _isValidCategoryIDToUpdateProduct = function(self,providerid,productid,categoryid,productcatalog,productProvider,user){
	console.log("_isValidCategoryIDToUpdateProduct ");
	CategoryModel.find({status:{$ne:"deactive"},$or:[{"ancestors.categoryid":productProvider.category.categoryid},{categoryid:productProvider.category.categoryid}]},{categoryid:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _isValidCategoryIDToUpdateProduct " + err);
			self.emit("failedUpdateProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(doc.length>0){
			var categoryids=[];
			for(var i=0;i<doc.length;i++){
				categoryids.push(doc[i].categoryid);
			}
			if(categoryids.indexOf(categoryid)<0){
				self.emit("failedUpdateProductCatalog",{"error":{"code":"AD001","message":"Category does not exist for this seller"}});	
			}else{
				_getCategoryDataToUpdateProductCatalog(self,providerid,productid,categoryid,productcatalog,user);
			}
		}else{
	  		self.emit("failedUpdateProductCatalog",{"error":{"code":"AD001","message":"Wrong categoryid"}});
	  	}
	});
}
var _getCategoryDataToUpdateProductCatalog = function(self,providerid,productid,categoryid,productcatalog,user){
	console.log("_getCategoryDataToUpdateProductCatalog");
	CategoryModel.findOne({status:{$ne:"deactive"},categoryid:categoryid},{categoryid:1,categoryname:1,ancestors:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getCategoryDataToUpdateProductCatalog " + err);
			self.emit("failedUpdateProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(doc){
			productcatalog.category = {id:doc.categoryid,categoryname:doc.categoryname,ancestors:doc.ancestors};
			var categorytags = [];
			categorytags.push(doc.categoryname);
			for(var i=0;i<doc.ancestors.length;i++){
				if(S(doc.ancestors[i].categoryname).contains(" ")){
	                var categorytags1=doc.ancestors[i].categoryname.split(" ");
					categorytags.push(doc.ancestors[i].categoryname);
					categorytags=categorytags.concat(categorytags1);					
				}else{
					categorytags.push(doc.ancestors[i].categoryname);
				}
			}
			if(S(doc.categoryname).contains(" ")){
	            var categorytags2=doc.categoryname.split(" ");
				categorytags=categorytags.concat(categorytags2);
			}else{
				categorytags.push(doc.categoryname);
			}
			productcatalog.categorytags = categorytags;
			/////////////////////////////////////////////////////////////////////
			_updateProductCatalog(self,providerid,productid,productcatalog,user);
			/////////////////////////////////////////////////////////////////////
		}else{
	  		self.emit("failedUpdateProductCatalog",{"error":{"code":"AD001","message":"Wrong categoryid"}});
	  	}
	});
}
var _updateProductCatalog = function(self,providerid,productid,productcatalog,user){
	console.log("_updateProductCatalog");
	var producttags_array;
	if(S(productcatalog.productname).contains(" ")){
        producttags_array=productcatalog.productname.split(" ");
		producttags_array.push(productcatalog.productname);
	}else{
		producttags_array=[productcatalog.productname];
	}
	var producttags=producttags_array;
	productcatalog.producttags = producttags;
	console.log("productcatalog " +JSON.stringify(productcatalog));


	ProductCatalogModel.update({productid:productid,"provider.providerid":providerid},{$set:productcatalog},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Error fun:_updateProductCatalog"+err,user.userid);
		  	self.emit("failedUpdateProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});		
	  	}else if(updateStatus==0){
	  		self.emit("failedUpdateProductCatalog",{"error":{"message":"Incorrect productid"}});		
	  	}else{
	  		//////////////////////////////////////
        	_successfullUpdateProductCatalog(self);
	  		/////////////////////////////////////
	  	}
	});
}
var _successfullUpdateProductCatalog = function(self){
	self.emit("successfulUpdateProductCatalog",{"success":{"message":"Product Updated Sucessfully"}});
}

ProductCatalog.prototype.deleteProductCatalog = function(providerid,productid,user){
	var self = this;
	/////////////////////////////////////////////////////////////////
	_isAlreadyDeletedProduct(self,providerid,productid,user);
	/////////////////////////////////////////////////////////////////
};

var _isAlreadyDeletedProduct=function(self,providerid,productid,user){
	ProductCatalogModel.findOne({productid:productid},function (err,product) {
		if(err){
			logger.emit("error","Database Error : _isProductNameIsSame " + err);
			self.emit("failedDeleteProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(product){
			if(product.status=="deactive"){
				self.emit("failedDeleteProductCatalog",{"error":{"message":"You have already deleted this product"}});
			}else{
				/////////////////////////////////////////////////////////////////
				_deleteProductFromProductCatalog(self,providerid,productid,user);
				/////////////////////////////////////////////////////////////////
			}			
		}else{
			/////////////////////////////////////////////////////////////////
			_deleteProductFromProductCatalog(self,providerid,productid,user);
			/////////////////////////////////////////////////////////////////
		}
	})
}

var _deleteProductFromProductCatalog = function(self,providerid,productid,user){
	console.log("providerid"+providerid);
	ProductCatalogModel.update({"provider.providerid":providerid,productid:productid},{$set:{status:"deactive"}},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Error fun:_deleteProductFromProductCatalog"+err,user.userid);
		  	self.emit("failedDeleteProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});		
	  	}else if(updateStatus==0){
	  		self.emit("failedDeleteProductCatalog",{"error":{"message":"Incorrect seller id or product id"}});		
	  	}else{
	  		///////////////////////////////////////
        	_successfullDeleteProductCatalog(self);
	  		///////////////////////////////////////
	  	}
	});
}

var _successfullDeleteProductCatalog = function(self){
	self.emit("successfulDeleteProductCatalog",{"success":{"message":"Product Deleted Sucessfully"}});
}

ProductCatalog.prototype.addProductLogo = function(providerid,productid,user,productlogo) {
	console.log("addProductLogo");
	var self=this;
	//////////////////////////////
	_validateAddProductLogo(self,providerid,productid,user,productlogo);
	///////////////////////////	
};
var _validateAddProductLogo=function(self,providerid,productid,user,productlogo){
	if(productlogo==undefined){
		self.emit("failedAddProductLogo",{"error":{"code":"AV001","message":"Please upload productlogo"}});
	}else if(productlogo.originalname==""){
		self.emit("failedAddProductLogo",{"error":{"code":"AV001","message":"Please upload productlogo"}});
	}else if(!S(productlogo.mimetype).contains("image") ){
		self.emit("failedAddProductLogo",{"error":{"code":"AV001","message":"Please upload only image"}});
	}else{
		//////////////////////////////////////////////////////////////
		_isAuthorizedUserToAddProductLogo(self,providerid,productid,user,productlogo);
		//////////////////////////////////////////////////////////////
	}
}
var _isAuthorizedUserToAddProductLogo=function(self,providerid,productid,user,productlogo){
	console.log("user.userid : "+user.userid+" providerid : "+providerid);
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Error  _isAuthorizedUserToAddProductLogo"+err,user.userid)
			self.emit("failedAddProductLogo",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedAddProductLogo",{"error":{"message":"Only authorized seller user can upload product logo details"}});
		}else{	
			/////////////////////////////////////////////////////////////////////////////
	     	_addProductLogo(providerid,productid,user,productlogo,function(err,result){
	     		if(err){
	     			self.emit("failedAddProductLogo",err);
	     		}else{
	     			self.emit("successfulAddProductLogo",result);
	     		}
	     	});
		    /////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _addProductLogo=function(providerid,productid,user,productlogo,callback){
	fs.readFile(productlogo.path,function (err, data) {
  		if(err){
  			callback({error:{code:"ED001",message:"Database Error"}})
  		}else{
  			var ext = path.extname(productlogo.originalname||'').split('.');
  			ext=ext[ext.length - 1];
  			 var s3filekey=Math.floor((Math.random()*1000)+1)+"."+ext;
		    var bucketFolder;
		    var params;

		    bucketFolder=amazonbucket+"/provider/"+providerid+"/product/"+productid;
      	    params = {
	             Bucket: bucketFolder,
	             Key:providerid+s3filekey,
	             Body: data,
	             //ACL: 'public-read-write',
	             ContentType: productlogo.mimetype
            };
            ////////////////////////////////////////////////////////////
            _addProductLogoToAmazonServer(params,providerid,productid,user,productlogo,function(err,result){
            	if(err){
            		callback(err);
            	}else{
            		callback(null,result);
            	}
            });
            ////////////////////////////////////////////////////////////////////////////
  		}
  	});
}
var _addProductLogoToAmazonServer=function(awsparams,providerid,productid,user,productlogo,callback){
	s3bucket.putObject(awsparams, function(err, data) {
    if (err) {
      callback({"error":{"message":"s3bucket.putObject:-_addProductLogoToAmazonServer"+err}});
    } else {
      var params1 = {Bucket: awsparams.Bucket, Key: awsparams.Key,Expires: 60*60*24*365};
      console.log("params1  : "+JSON.stringify(params1));
      s3bucket.getSignedUrl('getObject',params1, function (err, url) {
        if(err){
        	console.log("getSignedUrl:"+err)
          callback({"error":{"message":"_addProductLogoToAmazonServer:Error in getting getSignedUrl"+err}});
        }else{
          var newprofileurl={bucket:params1.Bucket,key:params1.Key,image:url};
          console.log("providerid "+providerid);

          ProductCatalogModel.findAndModify({productid:productid},[],{$set:{productlogo:newprofileurl}},{new:false},function(err,productlogodata){
            if(err){
              callback({"error":{"code":"EDOO1","message":"_addProductLogoToAmazonServer:Dberror"+err}});
            }else if(productlogodata){
              var plogo=productlogodata.productlogo;
              if(plogo==undefined){
                logger.emit("log","First time logo changed");
              }else{
                var awsdeleteparams={Bucket:plogo.bucket,Key:plogo.key};
                logger.emit("log",awsdeleteparams);
                s3bucket.deleteObject(awsdeleteparams, function(err, deleteuserlogostatus) {
                  if (err) {
                    logger.emit("error","product logo not deleted from amazon s3 bucket "+err,user.userid);
                  }else if(deleteuserlogostatus){
                    logger.emit("log","product logo deleted from Amazon S3");
                  }
                }) 
              }

              exec("rm -rf "+productlogo.path);
              console.log("rm -rf "+productlogo.path);               
                          
              callback(null,{"success":{"message":"Product Logo Updated Successfully","image":newprofileurl,"filename":productlogo.filename}});
            }else{
              callback({"error":{"code":"AU003","message":"Incorrect seller id or product id "+providerid}});
            }
          })
        }
      });
    }
  }) 
}

ProductCatalog.prototype.getProductCatalog = function(branchid,productid) {
	var self=this;
    ////////////////////////////////////////////
    _getProductCatalog(self,branchid,productid);
    ////////////////////////////////////////////	
};

var _getProductCatalog = function(self,branchid,productid){
	ProductCatalogModel.findOne({productid:productid,"branch.branchid":branchid},{productid:1,productname:1,productcode:1,price:1,foodtype:1,status:1,productlogo:1,productdescription:1,category:1,provider:1,branch:1,max_weight:1,min_weight:1,productnotavailable:1,specialinstruction:1,usertags:1,productconfiguration:1,holding_price:1,leadtime:1,_id:0},function(err,product){
		if(err){
			logger.emit("log","_getProductCatalog "+err);
			self.emit("failedGetProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!product){
			self.emit("failedGetProductCatalog",{"error":{"message":"Wrong branchid or productid"}});
		}else{
			///////////////////////////////////////////
			_successfullGetProuctCatalog(self,product);
			///////////////////////////////////////////
		}
	})
}

var _successfullGetProuctCatalog=function(self,product){
	self.emit("successfulGetProductCatalog",{"success":{"message":"Getting Product Information Successfully","proudctcatalog":product}})
}

ProductCatalog.prototype.getAllProductCatalog = function(branchid,providerid,user) {
	var self=this;
    ////////////////////////////////////////////////
    _isValidUserToGetAllProductData(self,branchid,providerid,user);
    ////////////////////////////////////////////////
};
var _isValidUserToGetAllProductData = function(self,branchid,providerid,user){
	UserModel.findOne({userid:user.userid,"provider.branchid":branchid,"provider.isOwner":true}).exec(function(err,userdata){
		if(err){
			logger.emit("log","_isValidUserToGetAllProductData "+err);
			self.emit("failedGetAllProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userdata){
			self.emit("failedGetAllProductCatalog",{"error":{code:"BP001","message":" User in the session does not match seller id"}});
		}else{
			/////////////////////////////////////////////
			_getAllProductCatalog(self,branchid,providerid);
			/////////////////////////////////////////////
		}
	});
}
var _getAllProductCatalog = function(self,branchid,providerid){
	ProductCatalogModel.find({status:{$ne:"deactive"},"provider.providerid":providerid,"branch.branchid":branchid},{productid:1,productname:1,productdescription:1,foodtype:1,category:1,provider:1,branch:1,productlogo:1,productcode:1,price:1,status:1,max_weight:1,min_weight:1,productnotavailable:1,specialinstruction:1,usertags:1,productconfiguration:1,productnotavailable:1,holding_price:1,leadtime:1,_id:0}).sort({createdate:-1}).exec(function(err,product){
		if(err){
			logger.emit("log","_getAllProductCatalog "+err);
			self.emit("failedGetAllProductCatalog",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(product==0){
			self.emit("failedGetAllProductCatalog",{"error":{code:"BP001","message":"Product does not exists"}});
		}else{
			/////////////////////////////////////////////
			_successfulGetAllProductCatalog(self,product);
			/////////////////////////////////////////////
		}
	});
}
var _successfulGetAllProductCatalog=function(self,product){
	self.emit("successfulGetAllProductCatalog",{"success":{"message":"Getting All Product Information Successfully","proudctcatalog":product}})
}

ProductCatalog.prototype.changeProductPrice = function(branchid,productid,pricedata,sessionuserid){
	var self=this;
	///////////////////////////////////////////////////////////////////////////
	_validateProductPriceData(self,branchid,productid,pricedata,sessionuserid);
	///////////////////////////////////////////////////////////////////////////
}
var _validateProductPriceData=function(self,branchid,productid,pricedata,sessionuserid){
	if(pricedata==undefined){
		self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"Please enter pricedata"}});
	}else if(pricedata.newprice==undefined){
		self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"Please enter new price"}});
	}else if(!isNumber(S(pricedata.newprice))){
		self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"New price should be numeric"}});
	}else{
		//////////////////////////////////////////////////////////////////////////////////////
    	_isValidProductProviderToChangePrice(self,branchid,productid,pricedata,sessionuserid);
    	//////////////////////////////////////////////////////////////////////////////////////
	}
}
var _isValidProductProviderToChangePrice=function(self,branchid,productid,pricedata,sessionuserid){
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Error  _isValidProductProviderToChangePrice "+err,sessionuserid);
			self.emit("failedChangeProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedChangeProductPrice",{"error":{"message":"Only authorized seller user can change product price details"}});
		}else{
			//////////////////////////////////////////////////////////////////////////////
	     	_isValidProductToChangePrice(self,branchid,productid,pricedata,sessionuserid);
		    //////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _isValidProductToChangePrice=function(self,branchid,productid,pricedata,sessionuserid){
	ProductCatalogModel.findOne({productid:productid},{price:1,productid:1,branch:1},function(err,product){
		if(err){
			logger.emit('error',"Database Error  _changeProductPrice"+err,sessionuserid);
			self.emit("failedChangeProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!product){
			self.emit("failedChangeProductPrice",{error:{message:"product id is wrong"}});
		}else{
			if(product.branch.branchid!=branchid){
				self.emit("failedChangeProductPrice",{error:{message:"This product does not exists at your branch"}});
			}else{
				////////////////////////////////////////////////////////////////////
				_changeProductPrice(self,productid,pricedata,sessionuserid,product);
				////////////////////////////////////////////////////////////////////
			}		
		}
	})
}
var _changeProductPrice=function(self,productid,pricedata,sessionuserid,product){
	ProductCatalogModel.update({productid:productid},{$set:{"price.value":pricedata.newprice}},function(err,pricechangestatus){
		if(err){
			logger.emit('error',"Database Error  _changeProductPrice"+err,sessionuserid);
			self.emit("failedChangeProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(pricechangestatus==0){
				self.emit("failedChangeProductPrice",{error:{message:"Server Error"}});
		}else{
			ProductCatalogModel.update({productid:productid},{$push:{price_history:{oldprice:product.price.value,newprice:pricedata.newprice,updatedby:sessionuserid}}},function(err,pricechangestatus){
				if(err){
					logger.emit('error',"Database Error  _changeProductPrice"+err,sessionuserid)
					self.emit("failedChangeProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
				}else if(pricechangestatus==0){
					self.emit("failedChangeProductPrice",{error:{message:"Server Error"}});
				}else{
					/////////////////////////////////////
					_successfullProductPriceChange(self);
					/////////////////////////////////////
				}
			})
		}
	})
}
var _successfullProductPriceChange=function(self){
	self.emit("successfulChangeProductPrice",{success:{message:"Product's Price Changed Successfully"}});
}

ProductCatalog.prototype.changeProductsPrice = function(branchid,productpricedata,sessionuserid) {
	var self=this;
	////////////////////////////////////////////////////////////////////////
	_validateProductsPriceData(self,branchid,productpricedata,sessionuserid);
	////////////////////////////////////////////////////////////////////////
}
var _validateProductsPriceData=function(self,branchid,productpricedata,sessionuserid){
	if(productpricedata==undefined){
		self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"Please enter productpricedata"}});
	}else if(!isArray(productpricedata)){
		self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"productpricedata should be JSON array"}});
	// }else if(!S(productpricedata.newprice).isNumeric()){
	// 	self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"New price should be numeric"}});
	}else if(productpricedata.length==0){
		self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"Please pass atleast one object in productpricedata"}});
	}else{
		var productpricedataarr = [];
		console.log("productpricedata : "+JSON.stringify(productpricedata));
		for(var i=0;i<productpricedata.length;i++){
			if(productpricedata[i].productid != "" && productpricedata[i].newprice != undefined && isNumeric(productpricedata[i].newprice)){
				productpricedataarr.push(productpricedata[i]);
			}
		}
		console.log("productpricedata 1 : "+JSON.stringify(productpricedataarr));
		//////////////////////////////////////////////////////////////////////////////////////
    	_isValidProductsProviderToChangePrice(self,branchid,productpricedataarr,sessionuserid);
    	//////////////////////////////////////////////////////////////////////////////////////
	}
}
var _isValidProductsProviderToChangePrice=function(self,branchid,productpricedata,sessionuserid){
	console.log("sessionuserid : "+sessionuserid);
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Error  _isValidProductsProviderToChangePrice "+err,sessionuserid);
			self.emit("failedChangeProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedChangeProductPrice",{"error":{"message":"You are not authorized to change product price details"}});
		}else{
			if(productpricedata.length>0){
	            var initialvalue=0;
	        	/////////////////////////////////////////////////////////////////////////////////////////
	     		_isValidProductsToChangePrice(self,branchid,productpricedata,sessionuserid,initialvalue);
		    	/////////////////////////////////////////////////////////////////////////////////////////
	        }else{
	            self.emit("failedChangeProductPrice",{error:{code:"AV001",message:"Please enter valid productid and price"}});
	        }			
		}
	})
}
var _isValidProductsToChangePrice=function(self,branchid,productpricedata,sessionuserid,initialvalue){
	var productprice=productpricedata[initialvalue];
	if(productpricedata.length>initialvalue){
		ProductCatalogModel.findOne({productid:productprice.productid},{price:1,productid:1,branch:1},function(err,product){
			if(err){
				logger.emit('error',"Database Error  _isValidProductsToChangePrice"+err,sessionuserid);
			}else if(!product){
				logger.emit('error',"product id is wrong");
				_isValidProductsToChangePrice(self,branchid,productpricedata,sessionuserid,++initialvalue);
			}else{
				if(product.branch.branchid!=branchid){
					logger.emit('error',"This product does not exist in your branch");
					_isValidProductsToChangePrice(self,branchid,productpricedata,sessionuserid,++initialvalue);
				}else{
					////////////////////////////////////////////////////////////////////////////////////////////
					_changeProductsPrice(self,branchid,productprice,initialvalue,sessionuserid,productpricedata,product);
					////////////////////////////////////////////////////////////////////////////////////////////
				}
			}		
		})
	}else{
       console.log("all product's price change successfully");
       _successfullProductPriceChange(self);
	}
}
var _changeProductsPrice = function(self,branchid,productprice,initialvalue,sessionuserid,productpricedata,product){
	ProductCatalogModel.update({productid:productprice.productid},{$set:{"price.value":productprice.newprice,"holding_price.status":"init"}},function(err,pricechangestatus){
		if(err){
			logger.emit('error',"Database Error _changeProductsPrice "+err,sessionuserid);
		}else if(pricechangestatus==0){
			logger.emit('error',"Server Error");
		}else{
			ProductCatalogModel.update({productid:productprice.productid},{$push:{price_history:{oldprice:product.price.value,newprice:productprice.newprice,updatedby:sessionuserid,updatedon:new Date()}}},function(err,pricechangestatus){
				if(err){
					logger.emit('error',"Database Error  _changeProductsPrice"+err,sessionuserid);
				}else if(pricechangestatus==0){
					logger.emit('error',"Server Error");
				}else{
					///////////////////////////////////////////////////////////////////////////////////////////
					_isValidProductsToChangePrice(self,branchid,productpricedata,sessionuserid,++initialvalue);
					///////////////////////////////////////////////////////////////////////////////////////////
				}
			})
		}
	})
}

ProductCatalog.prototype.holdingProductPrice = function(branchid,productid,pricedata,sessionuserid) {
	var self=this;
	//////////////////////////////////////////////////////////////////////////////////
	_validateHoldingProductPriceData(self,branchid,productid,pricedata,sessionuserid);
	//////////////////////////////////////////////////////////////////////////////////
}
var _validateHoldingProductPriceData=function(self,branchid,productid,pricedata,sessionuserid){
	if(pricedata==undefined){
		self.emit("failedHoldProductPrice",{error:{code:"AV001",message:"Please enter pricedata"}});
	}else if(pricedata.newprice==undefined || pricedata.newprice==""){
		self.emit("failedHoldProductPrice",{error:{code:"AV001",message:"Please enter new price"}});
	}else if(!isNumber(pricedata.newprice)){
		self.emit("failedHoldProductPrice",{error:{code:"AV001",message:"New price should be numeric"}});
	}else if(pricedata.uom==undefined || pricedata.uom==""){
		self.emit("failedHoldProductPrice",{"error":{"code":"AV001","message":"Please enter unit of measurement"}});
	// }else if(pricedata.fromdate==undefined || pricedata.fromdate==""){
	// 	self.emit("failedHoldProductPrice",{error:{code:"AV001",message:"Please enter from date"}});
	// }else if(pricedata.todate==undefined || pricedata.todate==""){
	// 	self.emit("failedHoldProductPrice",{error:{code:"AV001",message:"Please enter to date"}});
	}else  if(["kg","no","litre","lb","gm"].indexOf(pricedata.uom.toLowerCase())<0){
		self.emit("failedHoldProductPrice",{"error":{"code":"AV001","message":"unit of measurement should be kg,litre,no,lb,gm"}});
	}else{
		// var fromDate = new Date(pricedata.fromdate);
		// var toDate = new Date(pricedata.todate);

		// if(fromDate == "Invalid Date"){
		// 	self.emit("failedHoldProductPrice",{"error":{"code":"AV001","message":"Invalid fromdate"}});
		// }else if(toDate == "Invalid Date"){
		// 	self.emit("failedHoldProductPrice",{"error":{"code":"AV001","message":"Invalid todate"}});
		// }else{
		// 	pricedata.fromdate = fromDate;
		// 	pricedata.todate = toDate;
			///////////////////////////////////////////////////////////////////////////////////////
	    	_isValidProductProviderToHoldProductPrice(self,branchid,productid,pricedata,sessionuserid);
	    	//////////////////////////////////////////////////////////////////////////////////////
		// }
	}
}
var _isValidProductProviderToHoldProductPrice=function(self,branchid,productid,pricedata,sessionuserid){
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Error  _isValidProductProviderToHoldProductPrice"+err,sessionuserid);
			self.emit("failedHoldProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedHoldProductPrice",{"error":{"message":"Only authorized seller user can save product price details"}});
		}else{
			////////////////////////////////////////////////////////////////////////////
	     	_isValidProductToHoldPrice(self,branchid,productid,pricedata,sessionuserid);
		    ////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _isValidProductToHoldPrice=function(self,branchid,productid,pricedata,sessionuserid){
	ProductCatalogModel.findOne({productid:productid},{price:1,productid:1,branch:1},function(err,product){
		if(err){
			logger.emit('error',"Database Error  _isValidProductToHoldPrice "+err,sessionuserid);
			self.emit("failedHoldProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!product){
			self.emit("failedHoldProductPrice",{error:{message:"Incorrect product id"}});
		}else{
			if(product.branch.branchid!=branchid){
				self.emit("failedHoldProductPrice",{error:{message:"This product does not exist in your branch"}});
			}else{
				//////////////////////////////////////////////////////////////////
				_holdProductPrice(self,productid,pricedata,sessionuserid,product);
				//////////////////////////////////////////////////////////////////
			}		
		}
	})
}
var _holdProductPrice=function(self,productid,pricedata,sessionuserid,product){
	console.log("pricedata "+JSON.stringify(pricedata));
	ProductCatalogModel.update({productid:productid},{$set:{"holding_price.value":pricedata.newprice,"holding_price.currency":"₹","holding_price.uom":pricedata.uom,"holding_price.fromdate":new Date(pricedata.fromdate),"holding_price.todate":new Date(pricedata.todate),"holding_price.status":"init"}},function(err,pricechangestatus){
		if(err){
			logger.emit('error',"Database Error  _holdProductPrice"+err,sessionuserid);
			self.emit("failedHoldProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(pricechangestatus==0){
			self.emit("failedHoldProductPrice",{error:{message:"Server Error"}});
		}else{
			//////////////////////////////////
			_successfulHoldProductPrice(self);
			//////////////////////////////////
		}
	})
}
var _successfulHoldProductPrice=function(self){
	self.emit("successfulHoldProductPrice",{success:{message:"Price Saved Successfully"}});
}

ProductCatalog.prototype.activateProductPrice = function(branchid,productid,sessionuserid){
	var self=this;
	//////////////////////////////////////////////////////////////////////////////////
	_isValidProductProviderToActivateProductPrice(self,branchid,productid,sessionuserid);
	//////////////////////////////////////////////////////////////////////////////////
}
var _isValidProductProviderToActivateProductPrice=function(self,branchid,productid,sessionuserid){
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Error  _isValidProductProviderToActivateProductPrice"+err,sessionuserid);
			self.emit("failedActivateProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedActivateProductPrice",{"error":{"message":"Only authorized seller user can activate product price"}});
		}else{
			///////////////////////////////////////////////////////////////////
	     	_isValidProductToActivatePrice(self,branchid,productid,sessionuserid);
		    //////////////////////////////////////////////////////////////////
		}
	})
}
var _isValidProductToActivatePrice=function(self,branchid,productid,sessionuserid){
	ProductCatalogModel.findOne({productid:productid},{price:1,productid:1,branch:1,holding_price:1},function(err,product){
		if(err){
			logger.emit('error',"Database Error  _isValidProductToActivatePrice"+err,sessionuserid);
			self.emit("failedActivateProductPrice",{"error":{"code":"ED001","message":"Database Error "+err}});
		}else if(!product){
			self.emit("failedActivateProductPrice",{error:{message:"Incorrect product id"}});
		}else{
			if(product.branch.branchid!=branchid){
				self.emit("failedActivateProductPrice",{error:{message:"This product does not exist in your branch"}});
			}else{
				console.log("product.holding_price.st : "+product.holding_price.status);
				if(product.holding_price.status == "active"){
					self.emit("failedActivateProductPrice",{error:{message:"Holding price already activated"}});
				}else{
					////////////////////////////////////////////////////////////
					_activateProductPrice(self,productid,sessionuserid,product);
					////////////////////////////////////////////////////////////
				}
			}		
		}
	})
}
var _activateProductPrice=function(self,productid,sessionuserid,product){
	console.log("product : "+JSON.stringify(product));
	ProductCatalogModel.update({productid:productid},{$set:{"price.value":product.holding_price.value,"price.currency":product.holding_price.currency,"price.uom":product.holding_price.uom,"holding_price.status":"active"}},function(err,priceactivatestatus){
		if(err){
			logger.emit('error',"Database Error  _activateProductPrice "+err,sessionuserid);
			self.emit("failedActivateProductPrice",{"error":{"code":"ED001","message":"Database Error "+err}});
		}else if(priceactivatestatus==0){
			self.emit("failedActivateProductPrice",{error:{message:"Server Error"}});
		}else{
			ProductCatalogModel.update({productid:productid},{$push:{price_history:{oldprice:product.price.value,newprice:product.holding_price.value,updatedby:sessionuserid,updatedon:new Date()}}},function(err,pricehistorystatus){
				if(err){
					logger.emit('error',"Database Error  _activateProductPrice "+err,sessionuserid)
					self.emit("failedActivateProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
				}else if(pricehistorystatus==0){
					self.emit("failedActivateProductPrice",{error:{message:"Server Error"}});
				}else{
					//////////////////////////////////
					_successfulActivateProductPrice(self);
					//////////////////////////////////
				}
			})			
		}
	})
}
var _successfulActivateProductPrice=function(self){
	self.emit("successfulActivateProductPrice",{success:{message:"Holding Price Activated Successfully"}});
}

ProductCatalog.prototype.deactivateProductPrice = function(branchid,productid,sessionuserid){
	var self=this;
	//////////////////////////////////////////////////////////////////////////////////
	_isValidProductProviderToDeactivateProductPrice(self,branchid,productid,sessionuserid);
	//////////////////////////////////////////////////////////////////////////////////
}
var _isValidProductProviderToDeactivateProductPrice=function(self,branchid,productid,sessionuserid){
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Error  _isValidProductProviderToDeactivateProductPrice"+err,sessionuserid);
			self.emit("failedDeactivateProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedDeactivateProductPrice",{"error":{"message":"Only authorized seller user can deactivate product price"}});
		}else{
			///////////////////////////////////////////////////////////////////
	     	_isValidProductToDeactivatePrice(self,branchid,productid,sessionuserid);
		    //////////////////////////////////////////////////////////////////
		}
	})
}
var _isValidProductToDeactivatePrice=function(self,branchid,productid,sessionuserid){
	// var query = {productid:productid},{price:1,productid:1,branch:1,holding_price:1}
	ProductCatalogModel.aggregate({$match:{productid:productid}},{$unwind:"$price_history"},{$sort:{"price_history.updatedon":-1}},{$limit:1},{$project:{productid:1,price:1,branch:1,holding_price:1,price_history:1}},function(err,product){
		if(err){
			logger.emit('error',"Database Error  _isValidProductToDeactivatePrice"+err,sessionuserid);
			self.emit("failedDeactivateProductPrice",{"error":{"code":"ED001","message":"Database Error "+err}});
		}else if(product.length>0){
			console.log(JSON.stringify(product));
			if(product[0].branch.branchid!=branchid){
				self.emit("failedDeactivateProductPrice",{error:{message:"This product does not exist in your branch"}});
			}else{
				console.log("product.holding_price.st : "+product[0].holding_price.status);
				if(product[0].holding_price.status == "deactive"){
					self.emit("failedDeactivateProductPrice",{error:{message:"Holding price already deactivated"}});
				}else if(product[0].holding_price.status == "init"){
					self.emit("failedDeactivateProductPrice",{error:{message:"Only active holding price can be deactivated"}});
				}else{
					console.log("_deactivateProductPrice");
					////////////////////////////////////////////////////////////
					_deactivateProductPrice(self,productid,sessionuserid,product[0]);
					////////////////////////////////////////////////////////////
				}
			}
		}else{
			self.emit("failedDeactivateProductPrice",{error:{message:"Incorrect product id"}});
					
		}
	})
}
var _deactivateProductPrice=function(self,productid,sessionuserid,product){
	console.log("product : "+JSON.stringify(product));
	ProductCatalogModel.update({productid:productid},{$set:{"price.value":product.price_history.oldprice,"holding_price.status":"deactive"}},function(err,priceactivatestatus){
		if(err){
			logger.emit('error',"Database Error  _deactivateProductPrice "+err,sessionuserid);
			self.emit("failedDeactivateProductPrice",{"error":{"code":"ED001","message":"Database Error "+err}});
		}else if(priceactivatestatus==0){
			self.emit("failedDeactivateProductPrice",{error:{message:"Server Error"}});
		}else{
			ProductCatalogModel.update({productid:productid},{$push:{price_history:{oldprice:product.price.value,newprice:product.price_history.oldprice,updatedby:sessionuserid,updatedon:new Date()}}},function(err,pricehistorystatus){
				if(err){
					logger.emit('error',"Database Error  _deactivateProductPrice "+err,sessionuserid)
					self.emit("failedDeactivateProductPrice",{"error":{"code":"ED001","message":"Database Error"}});
				}else if(pricehistorystatus==0){
					self.emit("failedDeactivateProductPrice",{error:{message:"Server Error"}});
				}else{
					//////////////////////////////////
					_successfulDeactivateProductPrice(self);
					//////////////////////////////////
				}
			})			
		}
	})
}
var _successfulDeactivateProductPrice=function(self){
	self.emit("successfulDeactivateProductPrice",{success:{message:"Holding Price Deactivated Successfully"}});
}

ProductCatalog.prototype.publishUnpublishProductCatalog = function(branchid,productids,user,action){
	var self = this;
	///////////////////////////////////////
	_validatePublishUnpublishProductCatalog(self,branchid,productids,user,action);
	/////////////////////////////////////	
};
var _validatePublishUnpublishProductCatalog=function(self,branchid,productids,user,action){
	if(action==undefined){
		self.emit("failedPublishUnpublishProduct",{"error":{code:"AV001",message:"Please enter the action to be perform"}});
	}else if(["publish","unpublish"].indexOf(action)<0){
		self.emit("failedPublishUnpublishProduct",{"error":{code:"AV001",message:"action should be publish or unpublish"}});
	}else{
		//////////////////////////////////////////////////////////////////////
		_isBranchPublishToPublishUnpublishProductCatalog(self,branchid,productids,user,action);
		//////////////////////////////////////////////////////////////////////
	}
}
var _isBranchPublishToPublishUnpublishProductCatalog=function(self,branchid,productids,user,action){
	ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.branchid":branchid}},function(err,branch){
		if(err){
			logger.emit('error',"Database Error  _isBranchPublishToPublishUnpublishProductCatalog "+err,user.userid);
			self.emit("failedPublishUnpublishProduct",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(branch.length==0){
			self.emit("failedPublishUnpublishProduct",{"error":{"message":"Branch does not exist"}});
		}else{
			var providerbranch=branch[0].branch;
			if(providerbranch.status == "init"){
				self.emit("failedPublishUnpublishProduct",{"error":{"message":"Only published branch's can publish their products"}});
			}else if(providerbranch.status == "publish"){
				/////////////////////////////////////////////////////////////////////
				_publishUnpublishProductCatalog(self,branchid,productids,user,action);
				/////////////////////////////////////////////////////////////////////
			}else{
				self.emit("failedPublishUnpublishProduct",{"error":{"message":"Branch does not exist"}});	
			}
		}
	})
}
var _publishUnpublishProductCatalog=function(self,branchid,productids,user,action){
  ProductCatalogModel.update({productid:{$in:productids},status:{$ne:"deactive"}},{$set:{"status":action}},{multi:true},function(err,productupdatestatus){
		if(err){
			logger.emit('error',"Database Error fun:_publishUnpublishProductCatalog"+err,user.userid);
		  self.emit("failedPublishUnpublishProduct",{"error":{"code":"ED001","message":"Database Error "+err}});			
		}else if(productupdatestatus==0){
			self.emit("failedPublishUnpublishProduct",{"error":{"message":"Product does not exists"}});			
		}else{
			/////////////////////////////////////////////////
			_successfullPublishUnpublishCatalog(self,action);
			/////////////////////////////////////////////////
		}
	})
}
var _successfullPublishUnpublishCatalog = function(self,action){
  self.emit("successfullPublishUnpublishCatalog",{success:{message:"Product "+action+"ed successfully",status:action}});
}

ProductCatalog.prototype.manageProductAvailability = function(providerid,productid,user){
	var self = this;
	var productnotavailable = self.productcatalog;
	console.log("productnotavailable : "+JSON.stringify(productnotavailable));
	/////////////////////////////////////////////////////////////////////////////////////
	_validateManageProductAvailability(self,providerid,productid,productnotavailable,user);
	/////////////////////////////////////////////////////////////////////////////////////
};
var _validateManageProductAvailability = function(self,providerid,productid,productnotavailable,user){
	if(productnotavailable == undefined){
		self.emit("failedManageProductAvailability",{"error":{"code":"AV001","message":"Please enter product not available data"}});
	}else if(productnotavailable.from == undefined && productnotavailable.to == undefined){
		_isAuthorizedUserToManageProductAvailability(self,providerid,productid,productnotavailable,user);
		// self.emit("failedManageProductAvailability",{"error":{"code":"AV001","message":"Please pass from date"}});
	// }else if(productnotavailable.to == undefined || productnotavailable.to == ""){
	// 	self.emit("failedManageProductAvailability",{"error":{"code":"AV001","message":"Please pass to date"}});
	}else{
			var from = new Date(productnotavailable.from);
			var to = new Date(productnotavailable.to);
			// from.setDate(from.getDate()+1);
			// to.setDate(to.getDate()+1);

			if(from == "Invalid Date"){
				self.emit("failedManageProductAvailability",{"error":{"code":"AV001","message":"Invalid from date"}});
			}else if(to == "Invalid Date"){
				self.emit("failedManageProductAvailability",{"error":{"code":"AV001","message":"Invalid to date"}});
			}else{
				console.log(from +" "+to);
				_isAuthorizedUserToManageProductAvailability(self,providerid,productid,productnotavailable,user);
			}
	}
}
var _isAuthorizedUserToManageProductAvailability=function(self,providerid,productid,productnotavailable,user){
	console.log("user.userid : "+user.userid+" providerid : "+providerid);
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Error  _isAuthorizedUserToManageProductAvailability "+err,user.userid)
			self.emit("failedManageProductAvailability",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedManageProductAvailability",{"error":{"message":"Only authorized seller user can manage product availability"}});
		}else{	
			/////////////////////////////////////////////////////////////////////////////
	     	_manageProductAvailability(self,providerid,productid,productnotavailable,user);
		    /////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _manageProductAvailability = function(self,providerid,productid,productnotavailable,user){
	console.log("productnotavailable szcd: "+JSON.stringify(productnotavailable));
	ProductCatalogModel.update({productid:productid,"provider.providerid":providerid},{$set:{productnotavailable:productnotavailable}},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Error fun:_manageProductAvailability"+err,user.userid);
		  	self.emit("failedManageProductAvailability",{"error":{"code":"ED001","message":"Database Error"}});		
	  	}else if(updateStatus==0){
	  		self.emit("failedManageProductAvailability",{"error":{"message":"Incorrect seller id or product id"}});		
	  	}else{
	  		////////////////////////////////////////////
        	_successfullManageProductAvailability(self);
	  		////////////////////////////////////////////
	  	}
	});
}
var _successfullManageProductAvailability = function(self){
  self.emit("successfullManageProductAvailability",{success:{message:"You have successfully changed product availability"}});
}

ProductCatalog.prototype.getAllProductUserTags = function(){
	var self = this;	
	/////////////////////////////////////////////////////////////////////////////////////
	_getAllProductUserTags(self);
	/////////////////////////////////////////////////////////////////////////////////////
};
var _getAllProductUserTags=function(self){
	ProductCatalogModel.find({status:"publish"},{usertags:1,_id:0},function(err,productusertags){
		if(err){
			logger.emit("error","Database Error _getAllCategoryTags "+err)
			self.emit("failedGetAllCategoryTags",{"error":{"message":"Database Error"}})
		}else{
			var productusertagsarray=["eggless","egg"]
			for(var i=0;i<productusertags.length;i++){
				if(productusertags[i].usertags!=undefined){
					productusertagsarray=__.union(productusertags[i].usertags,productusertagsarray);	
				}
				
			}
			///////////////////////////////////
			_successfullGetAllProductUserTags(self,productusertagsarray);
			///////////////////////////////////
		}
	})
}
var _successfullGetAllProductUserTags=function(self,productusertags){
	self.emit("successfullGetAllProductUserTags",{success:{message:"Getting User Product Tags Successfully",productusertags:productusertags}})
}
ProductCatalog.prototype.manageProductLeadTime = function(sessionuserid,productleadtimedata,providerid,branchid){
	var self = this;	
	/////////////////////////////////////////////////////////////////////////////////////
	_validateProductLeadTime(self,sessionuserid,productleadtimedata,providerid,branchid);
	/////////////////////////////////////////////////////////////////////////////////////
};
var _validateProductLeadTime=function(self,sessionuserid,productleadtimedata,providerid,branchid){
	console.log("branchid::::"+branchid)
	if(productleadtimedata==undefined){
		self.emit("failedManageProductLeadTime",{error:{message:"Please enter product lead time data"}})
	}else if(!isArray(productleadtimedata)){
		self.emit("failedManageProductLeadTime",{error:{message:"Productleadtimedata should be JSON array"}})
	}else if(productleadtimedata.length==0){
		self.emit("failedManageProductLeadTime",{error:{message:"Productleadtimedata should not be empty"}})
	}else{
		console.log("productleadtimedata"+JSON.stringify(productleadtimedata));
	  var validproductleadtimedata=[];
	  var productids=[];
	  var leadtimeoptions=["minutes","hours","weeks","days"];
		for(var i=0;i<productleadtimedata.length;i++){
			if(productleadtimedata[i].productid!=undefined && productleadtimedata[i].leadtime){
				if(productleadtimedata[i].leadtime.option && productleadtimedata[i].leadtime.value){
					if(leadtimeoptions.indexOf(productleadtimedata[i].leadtime.option)>=0 && S(productleadtimedata[i].leadtime.value).isNumeric()){
						productids.push(productleadtimedata[i].productid);
				    validproductleadtimedata.push(productleadtimedata[i])			
					}
				}
			}
		}
		if(validproductleadtimedata.length==0){
			self.emit("failedManageProductLeadTime",{error:{message:"Please enter valid productleadtime data"}})
		}else{
			/////////////////////////////////////////////////
			_isValidProviderToManageProductLeadTime(self,sessionuserid,validproductleadtimedata,providerid,branchid)
			/////////////////////////////////////////
		}	
	}
	
	}
	var _isValidProviderToManageProductLeadTime=function(self,sessionuserid,validproductleadtimedata,providerid,branchid){
		UserModel.findOne({userid:sessionuserid,"provider.providerid":providerid,"provider.branchid":branchid,"provider.isOwner":true},function(err,userpp){
			if(err){
				logger.emit('error',"Database Error  _isValidProviderToManageProductLeadTime "+err,sessionuserid)
				self.emit("failedManageProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
			}else if(!userpp){
				self.emit("failedManageProductLeadTime",{"error":{"message":"Only authorized seller user can manage products lead time"}});
			}else{	
				/////////////////////////////////////////////////////////////////////////////
		     	_manageProductLeadTimeData(self,sessionuserid,validproductleadtimedata,providerid,branchid);
			  /////////////////////////////////////////////////////////////////////////////
			}
		})
	}
	var _manageProductLeadTimeData=function(self,sessionuserid,productleadtimedata,providerid,branchid){
		console.log("branchid"+branchid)
		ProductCatalogModel.find({"branch.branchid":branchid},{productid:1},function(err,products){
			if(err){
					logger.emit('error',"Database Error  _manageProductLeadTimeData "+err,sessionuserid)
				self.emit("failedManageProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
			}else if(products.length==0){
				self.emit("failedManageProductLeadTime",{"error":{"message":"This product does not exist in the branch"}});
			}else{
				var branchproductids=[];
				for(var i=0;i<products.length;i++){
					branchproductids.push(products[i].productid)
				}
				console.log("branchproductids"+branchproductids)
				//check v
				var validbranchproductleadtimedata=[];
				var validproductids=[];
				var leadtimeinminutes={"hours":60,"days":24*60,"weeks":7*24*60,"minutes":1}
				console.log("productleadtimedata"+JSON.stringify(productleadtimedata))
				for(var j=0;j<productleadtimedata.length;j++){
					console.log(productleadtimedata[j].productid+"ddd")
					if(branchproductids.indexOf(productleadtimedata[j].productid)>=0){
						productleadtimedata[j].leadtimeinminutes=leadtimeinminutes[productleadtimedata[j].leadtime.option]*productleadtimedata[j].leadtime.value;
						branchproductids.splice(branchproductids.indexOf(productleadtimedata[j].productid),1)
						validbranchproductleadtimedata.push(productleadtimedata[j]);
							validproductids.push(productleadtimedata[j].productid)
					}
				}
					console.log("validbranchproductleadtimedata"+JSON.stringify(validbranchproductleadtimedata))
				if(validbranchproductleadtimedata.length==0){
					self.emit("failedManageProductLeadTime",{error:{message:"Please enter your branch products leadtime"}})
				}else{
					ProductLeadTimeModel.update({branchid:branchid},{$pull:{productleadtime:{productid:{$in:validproductids}}}},function(err,pullleadtimestatus){
						if(err){
							logger.emit('error',"Database Error  _manageProductLeadTimeData "+err,sessionuserid)
					    self.emit("failedManageProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
						}else if(pullleadtimestatus==0){
							///////////////////////////////////////
							_addNewLeadTimeData(self,sessionuserid,providerid,branchid,validbranchproductleadtimedata)
							////////////////////////////////////
						}else{
							ProductLeadTimeModel.update({branchid:branchid},{$push:{productleadtime:{$each:validbranchproductleadtimedata}}},function(err,pushleadtimestatus){
								if(err){
									logger.emit('error',"Database Error  _manageProductLeadTimeData "+err,sessionuserid)
					      self.emit("failedManageProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
								}else if(pushleadtimestatus==0){
									self.emit("failedManageProductLeadTime",{"error":{"message":"Incorrect branch id"}});
								}else{
									///////////////////////////////////
									_successfulManageProductLeadTime(self)
									///////////////////////////////////
								}
							})
						}
					})
				}
			}
		})
	}
	var _addNewLeadTimeData=function(self,sessionuserid,providerid,branchid,validbranchproductleadtimedata){
		var leadtimeobject={providerid:providerid,branchid:branchid,productleadtime:validbranchproductleadtimedata}
		var productleadtime_object=new ProductLeadTimeModel(leadtimeobject);
		productleadtime_object.save(function(err,productleadtime){
			if(err){
					logger.emit('error',"Database Error  _addNewLeadTimeData "+err,sessionuserid)
					self.emit("failedManageProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
			}else{
				//////////////////////////////////
				_successfulManageProductLeadTime(self)
				//////////////////////////
			}
		})
	}
	var _successfulManageProductLeadTime=function(self){
		self.emit("successfullManageProductLeadTime",{success:{message:"Successfully Managed Products lead time"}})
	}

ProductCatalog.prototype.getProductLeadTime = function(sessionuserid,providerid,branchid,category){
	var self = this;	
	/////////////////////////////////////////////////////////////////////////////////////
	_getProductLeadTime(self,sessionuserid,providerid,branchid,category);
	/////////////////////////////////////////////////////////////////////////////////////
};
var _getProductLeadTime=function(self,sessionuserid,providerid,branchid,category){
	var query=[];
	if(category==undefined){
		///////////////////////////////
		_getAllProductLeadTime(self,providerid,branchid);
		///////////////////////////////
		
	}else{
		////////////////////////////////
		_getProductLeadTimeByCategory(self,providerid,branchid)
		///////////////////////////////
	}
	
}
var _getProductLeadTimeByCategory=function(self,providerid,branchid){
	ProductCatalogModel.aggregate({$match:{"branch.branchid":branchid}},{$group:{_id:{categoryid:"$category.id",categoryname:"$category.categoryname"},products:{$addToSet:{productid:"$productid",productname:"$productname"}}}},{$project:{category:"$_id",products:1,_id:0}},function(err,categorywiseproducts){
		if(err){
			logger.emit('error',"Database Error  _getProductLeadTime "+err,sessionuserid)
			self.emit("failedGetProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(categorywiseproducts.length==0){
			self.emit("failedGetProductLeadTime",{error:{message:"Product"}});
		}else{
			ProductLeadTimeModel.findOne({branchid:branchid},function(err,productleadtime){
				if(err){
					logger.emit('error',"Database Error  _getProductLeadTime "+err,sessionuserid)
			    self.emit("failedGetProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
				}else{
				     var leadtimeproductids=[];
				     if(productleadtime){
				     	var productleadtimedata=productleadtime.productleadtime;
					    for(var i=0;i<productleadtimedata.length;i++){
						    leadtimeproductids.push(productleadtimedata[i].productid);
					    }	
				     } 
					console.log("categorywiseproducts"+JSON.stringify(categorywiseproducts))
					var result=[];
					for(var j=0;j<categorywiseproducts.length;j++){
						var resultdata={category:categorywiseproducts[j].category};
						var productsleadtimearray=[];
						for(var k=0;k<categorywiseproducts[j].products.length;k++){
							if(leadtimeproductids.indexOf(categorywiseproducts[j].products[k].productid)>=0){
								var index=leadtimeproductids.indexOf(categorywiseproducts[j].products[k].productid);
								productleadtimedata[index].productname=categorywiseproducts[j].products[k].productname
								productsleadtimearray.push(productleadtimedata[index]);
							}else{

								var leadtime_data={productid:categorywiseproducts[j].products[k].productid,productname:categorywiseproducts[j].products[k].productname,leadtime:null}
								productsleadtimearray.push(leadtime_data)
							}
						}
						resultdata.productleadtime=productsleadtimearray;
						result.push(resultdata)
					}
					/////////////////////////////////////////
					_successfulGetProductLeadTime(self,result)
					////////////////////////////////////////

				}
			})
		}
	})
}
var _getAllProductLeadTime=function(self,providerid,branchid){
	var query=[];
	query.push({$match:{branchid:branchid}});
	query.push({$unwind:"$productleadtime"});
	query.push({$project:{productid:"$productleadtime.productid",productname:"$productleadtime.productname",leadtime:"$productleadtime.leadtime",_id:0}})
	ProductLeadTimeModel.aggregate(query,function(err,productleadtime){
		if(err){
			logger.emit('error',"Database Error  _getProductLeadTime "+err,sessionuserid)
			 self.emit("failedGetProductLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(productleadtime.length==0){
			self.emit("failedGetProductLeadTime",{"error":{"message":"Incorrect branch id"}});
		}else{
			////////////////////////////////////////////////////
			_successfulGetProductLeadTime(self,productleadtime)
			///////////////////////////////////////////////////
		}
	})
}
var _successfulGetProductLeadTime=function(self,result){
	self.emit("successfullGetProductLeadTime",{success:{message:"Getting Product lead time Successfully",productleadtime:result}})
}
