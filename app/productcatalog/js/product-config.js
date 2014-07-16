var events = require("events");
var logger=require("../../common/js/logger");
var CategoryModel = require("../../productcategory/js/product-category-model");
var ProductConfigModel = require("./product-config-model");
var exec = require('child_process').exec;
var S=require("string");
var __=require("underscore")

var ProductConfig = function(productconfig) {
  this.productconfig=productconfig;
};

ProductConfig.prototype = new events.EventEmitter;
module.exports = ProductConfig;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

ProductConfig.prototype.addProductConfiguration = function(categoryid,user) {
	var self = this;
	var productconfig = self.productconfig;
	console.log("ProductConfig : "+ JSON.stringify(productconfig));
	//////////////////////////////////////////////////////////////////////
	_validateProductConfigurationData(self,categoryid,productconfig,user);
	//////////////////////////////////////////////////////////////////////
}
var _validateProductConfigurationData = function(self,categoryid,productconfig,user){
	if(productconfig == undefined){
		self.emit("failedAddProductConfig",{"error":{"code":"PC001","message":"Please enter product configuration"}});
	}else if(productconfig.categoryname == undefined || productconfig.categoryname == ""){
		self.emit("failedAddProductConfig",{"error":{"code":"PC001","message":"Please enter categoryname"}});
	}else if(productconfig.configuration == undefined){
		self.emit("failedAddProductConfig",{"error":{"code":"PC001","message":"Please enter configuration"}});
	}else if(!isArray(productconfig.configuration)){
		self.emit("failedAddProductConfig",{"error":{"code":"PC001","message":"configuration should be an array"}});
	}else if(productconfig.configuration.length == 0){
		self.emit("failedAddProductConfig",{"error":{"code":"PC001","message":"Please enter atleast one configuration"}});
	}else{
		_isValidCategoryID(self,categoryid,productconfig,user);
	}
}
var _isValidCategoryID = function(self,categoryid,productconfig,user){
	console.log("_isValidCategoryID ");
	CategoryModel.findOne({status:{$ne:"deactive"},categoryid:categoryid},{categoryid:1,categoryname:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _isValidCategoryID " + err);
			self.emit("failedAddProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!doc){
			self.emit("failedAddProductConfig",{"error":{"code":"AD001","message":"Wrong categoryid"}});
		}else{
			if(doc.categoryname == productconfig.categoryname){
				_isConfigurationAlreadyExist(self,categoryid,productconfig,user);
			}else{
				self.emit("failedAddProductConfig",{"error":{"code":"AD001","message":"Provided categoryname is wrong"}});
			}	  		
	  	}
	});
}
var _isConfigurationAlreadyExist = function(self,categoryid,productconfig,user){
	ProductConfigModel.findOne({categoryid:categoryid},function(err,configdata){
		if(err){
			logger.emit('error',"Database Issue  _isConfigurationAlreadyExist "+err,user.userid);
			self.emit("failedAddProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!configdata){
			/////////////////////////////////////////////////////////////
	     	_addProductConfiguration(self,categoryid,productconfig,user);
		    /////////////////////////////////////////////////////////////
		}else{
			self.emit("failedAddProductConfig",{"error":{"message":"Product configuration already exist's for provided category"}});
		}
	})
}
var _addProductConfiguration = function(self,categoryid,productconfig,user){
	console.log("_addProductConfiguration");
	productconfig.categoryid = categoryid;
	productconfig.createdate = new Date();
	var productconfig = new ProductConfigModel(productconfig);
	productconfig.save(function(err,prod_config){
		if(err){
			logger.emit("error","Database Error:_addProductConfiguration"+err,user.userid);
			self.emit("failedAddProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
			//////////////////////////////////////////////
			_successfulAddProductConfig(self,prod_config);
			//////////////////////////////////////////////
		}
	})
}
var _successfulAddProductConfig = function(self){
	self.emit("successfulAddProductConfig",{"success":{"message":"Product Configuration Added Sucessfully"}});
}

ProductConfig.prototype.updateProductConfiguration = function(categoryid,user) {
	var self = this;
	var productconfig = self.productconfig;
	console.log("ProductConfig : "+ JSON.stringify(productconfig));
	//////////////////////////////////////////////////////////////////////
	_validateUpdateProductConfigurationData(self,categoryid,productconfig,user);
	//////////////////////////////////////////////////////////////////////
}
var _validateUpdateProductConfigurationData = function(self,categoryid,productconfig,user){
	if(productconfig == undefined){
		self.emit("failedUpdateProductConfig",{"error":{"code":"PC001","message":"Please enter product configuration"}});
	}else if(productconfig.categoryname != undefined || productconfig.categoryid){
		self.emit("failedUpdateProductConfig",{"error":{"code":"PC001","message":"You can not update categoryname and categoryid"}});
	}else if(productconfig.configuration == undefined){
		self.emit("failedUpdateProductConfig",{"error":{"code":"PC001","message":"Please enter configuration"}});
	}else if(!isArray(productconfig.configuration)){
		self.emit("failedUpdateProductConfig",{"error":{"code":"PC001","message":"configuration should be an array"}});
	// }else if(productconfig.configuration.length == 0){
	// 	self.emit("failedUpdateProductConfig",{"error":{"code":"PC001","message":"Please enter atleast one configuration"}});
	}else{
		_updateProductConfiguration(self,categoryid,productconfig,user);
	}
}
var _updateProductConfiguration = function(self,categoryid,productconfig,user){
	ProductConfigModel.update({categoryid:categoryid},{$set:productconfig},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Issue fun:_updateProductConfiguration"+err,user.userid);
		  	self.emit("failedUpdateProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});		
	  	}else if(updateStatus==0){
	  		self.emit("failedUpdateProductConfig",{"error":{"message":"categoryid is wrong"}});		
	  	}else{
	  		//////////////////////////////////////
        	_successfulUpdateProductConfig(self);
	  		/////////////////////////////////////
	  	}
	});
}
var _successfulUpdateProductConfig = function(self){
	self.emit("successfulUpdateProductConfig",{"success":{"message":"Product Configuration Updated Sucessfully"}});
}

ProductConfig.prototype.getProductConfiguration = function(user) {
	var self = this;
	////////////////////////////////////
	_getProductConfiguration(self,user);
	////////////////////////////////////
}
var _getProductConfiguration = function(self,user){
	ProductConfigModel.find({status:{$ne:"deactive"}},{configid:1,categoryname:1,categoryid:1,configuration:1,_id:0},function(err,configdata){
		if(err){
			logger.emit('error',"Database Issue  _getProductConfiguration "+err,user.userid);
			self.emit("failedGetProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(configdata.length == 0){
			self.emit("failedGetProductConfig",{"error":{"message":"Product Configuration Does Not Exist's"}});
		}else{	
			/////////////////////////////////////////////
	     	_successfulGetProductConfig(self,configdata);
		    /////////////////////////////////////////////
		}
	})
}
var _successfulGetProductConfig = function(self,configdata){
	self.emit("successfulGetProductConfig",{"success":{"message":"Product Configuration Getting Sucessfully",productconfig:configdata}});
}

ProductConfig.prototype.getProductConfigurationByCategory = function(categoryid,user) {
	var self = this;
	/////////////////////////////////////////////////////////
	_getProductConfigurationByCategory(self,categoryid,user);
	/////////////////////////////////////////////////////////
}
var _getProductConfigurationByCategory = function(self,categoryid,user){
	ProductConfigModel.findOne({status:"active",categoryid:categoryid},{categoryname:1,categoryid:1,configuration:1,_id:0},function(err,configdata){
		if(err){
			logger.emit('error',"Database Issue  _getProductConfiguration "+err,user.userid);
			self.emit("failedGetProductConfigByCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!configdata){
			self.emit("failedGetProductConfigByCategory",{"error":{"message":"Product Configuration Does Not Exist's"}});
		}else{	
			///////////////////////////////////////////////////////
	     	_successfulGetProductConfigByCategory(self,configdata);
		    ///////////////////////////////////////////////////////
		}
	})
}
var _successfulGetProductConfigByCategory = function(self,configdata){
	self.emit("successfulGetProductConfigByCategory",{"success":{"message":"Getting Product Configuration Sucessfully",productconfig:configdata}});
}

ProductConfig.prototype.deleteProductConfiguration = function(configid,user) {
	var self = this;
	////////////////////////////////////////////
	_isAlreadyDeletedConfig(self,configid,user);
	////////////////////////////////////////////
}
var _isAlreadyDeletedConfig = function(self,configid,user){
	ProductConfigModel.findOne({status:"active",configid:configid},{categoryid:1,_id:0},function(err,configdata){
		if(err){
			logger.emit('error',"Database Issue  _isAlreadyDeletedConfig "+err,user.userid);
			self.emit("failedDeleteProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!configdata){
			self.emit("failedDeleteProductConfig",{"error":{"message":"Product Configuration Does Not Exist"}});
		}else{	
			ProductConfigModel.update({configid:configid},{$set:{status:"deactive"}},function(err,updateStatus){
				if(err){
				  	logger.emit('error',"Database Issue fun:_isAlreadyDeletedConfig"+err,user.userid);
				  	self.emit("failedDeleteProductConfig",{"error":{"code":"ED001","message":"Database Issue"}});		
			  	}else if(updateStatus==0){
			  		self.emit("failedDeleteProductConfig",{"error":{"message":"configid is wrong"}});		
			  	}else{
			  		//////////////////////////////////////
		        	_successfulDeleteProductConfig(self);
			  		/////////////////////////////////////
			  	}
			});
		}
	})
}
var _successfulDeleteProductConfig = function(self){
	self.emit("successfulDeleteProductConfig",{"success":{"message":"Product Configuration Deleted Sucessfully"}});
}