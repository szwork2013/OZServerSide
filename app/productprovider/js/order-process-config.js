var events = require("events");
var logger=require("../../common/js/logger");
var OrderProcessConfigModel = require("./order-process-config-model");

var OrderProcessConfig = function(orderprocessconfigdata) {
  this.orderprocessconfigdata=orderprocessconfigdata;
};

OrderProcessConfig.prototype = new events.EventEmitter;
module.exports = OrderProcessConfig;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

OrderProcessConfig.prototype.addOrderProcessingStatus = function(user) {
	var self = this;
	var process = this.orderprocessconfigdata;

	/////////////////////////////////////////////////
	_validateOrderProcessingStatus(self,process,user);
	/////////////////////////////////////////////////
};
var _validateOrderProcessingStatus = function(self,process,user){
	if(process == undefined){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter process key"}});
	}else if(process.index == undefined || process.index == ""){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter index key"}});
	}else if(process.order_status == undefined || process.order_status == ""){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter order_status"}});
	}else if(["orderreceived","accepted","inproduction","packing","factorytostore","indelivery","ordercomplete","cancelled","rejected"].indexOf(process.order_status.toLowerCase())<0){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Order Process Configuration should be 'orderreceived','accepted','inproduction','packing','factorytostore','homedelivery','storepickup','ordercomplete','cancelled','rejected' "}});
	}else if(process.require == undefined || process.require == ""){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter require key"}});
	}else if(["true","false"].indexOf(process.require.toLowerCase())<0){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"require key should be true or false"}});
	}else{
		_isValidIndex(self,process,user);
	}
}
var _isValidIndex = function(self,process,user){
	OrderProcessConfigModel.findOne({index:process.index},function(err,index){
		if(err){
			logger.emit("error","Database Issue :_isValidIndex "+err);
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!index){
			_isValidOrderStatus(self,process,user);
		}else{
			if(process.order_status == index.order_status){
				self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Order Process Configuration Already Exists"}});
			}else{
				self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Index key is already used for '"+index.order_status+"' status, please use different index"}});
			}
		}
	})
}
var _isValidOrderStatus = function(self,process,user){
	console.log("_isValidOrderStatus");
	OrderProcessConfigModel.findOne({order_status:process.order_status},function(err,orderstatus){
		if(err){
			logger.emit("error","Database Issue :_isValidOrderStatus "+err);
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!orderstatus){
			_addOrderProcessingStatus(self,process,user);
		}else{
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":""+process.order_status+" already exists with index : "+orderstatus.index}});
		}
	})
}
var _addOrderProcessingStatus = function(self,process,user){
	console.log("Process : "+JSON.stringify(process));
	process.require = process.require.toLowerCase();
	var order_status=new OrderProcessConfigModel(process);
	order_status.save(function(err,orderstatus){
		if(err){
			logger.emit("error","Database Error,fun:_addOrderProcessingStatus"+err,user.userid);
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Error"}});
		}else{          
			///////////////////////////////////////////
			_successfulAddOrderProcessingStatus(self);
            ///////////////////////////////////////////          
		}
	})
}
var _successfulAddOrderProcessingStatus = function(self){
	self.emit("successfulAddOrderProcessingStatus",{"success":{"message":"Order Process Configuration Added Successfully"}});
}Error

OrderProcessConfig.prototype.getOrderProcessingStatus = function(user) {
	var self = this;
	/////////////////////////////////////
	_getOrderProcessingStatus(self,user);
	/////////////////////////////////////
};
var _getOrderProcessingStatus = function(self,user){
	OrderProcessConfigModel.find({},{index:1,order_status:1,require:1,_id:0},function(err,orderstatus){
		if(err){
			logger.emit("error","Database Error :_getOrderProcessingStatus "+err);
			self.emit("failedGetOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(orderstatus.length>0){
			_successfulGetOrderProcessingStatus(self,orderstatus);
		}else{
			self.emit("failedGetOrderProcessingStatus",{"error":{"message":"Order Process Configuration Does Not Exist"}});
		}
	})
}
var _successfulGetOrderProcessingStatus = function(self,orderstatus){
	self.emit("successfulGetOrderProcessingStatus",{"success":{"message":"Getting Order Process Configuration Successfully","orderprocess":orderstatus}});
}

OrderProcessConfig.prototype.deleteOrderProcessingStatus = function(user,index) {
	var self = this;
	//////////////////////////////////////////////
	_deleteOrderProcessingStatus(self,user,index);
	//////////////////////////////////////////////
};
var _deleteOrderProcessingStatus = function(self,user,index){
	OrderProcessConfigModel.remove({index:index},function(err,deletestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_deleteOrderProcessingStatus"+err,user.userid);
			self.emit("failedDeleteOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(deletestatus==0){
		    self.emit("failedDeleteOrderProcessingStatus",{"error":{"message":"Incorrect index key"}});
		}else{
			/////////////////////////////////////////////
			_successfulDeleteOrderProcessingStatus(self);
			/////////////////////////////////////////////
		}
	})
}
var _successfulDeleteOrderProcessingStatus = function(self){
	self.emit("successfulDeleteOrderProcessingStatus",{"success":{"message":"Order Process Configuration Deleted Successfully"}});
}