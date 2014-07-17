var events = require("events");
var logger=require("../../common/js/logger");
var OrderStatusReffModel = require("./orderstatus-reff-model");

var OrderStatusReff = function(orderstatusdata) {
  this.orderstatusdata=orderstatusdata;
};

OrderStatusReff.prototype = new events.EventEmitter;
module.exports = OrderStatusReff;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

OrderStatusReff.prototype.addOrderProcessingStatus = function(user) {
	var self = this;
	var process = this.orderstatusdata;

	/////////////////////////////////////////////////
	_validaterderProcessingStatus(self,process,user);
	/////////////////////////////////////////////////
};
var _validaterderProcessingStatus = function(self,process,user){
	if(process == undefined){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter process"}});
	}else if(process.index == undefined || process.index == ""){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter index"}});
	}else if(process.order_status == undefined || process.order_status == ""){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter order_status"}});
	}else if(["orderreceived","accepted","inproduction","packing","factorytostore","homedelivery","storepickup","ordercomplete","cancelled","rejected"].indexOf(process.order_status.toLowerCase())<0){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"order_status should be 'orderreceived','accepted','inproduction','packing','factorytostore','homedelivery','storepickup','ordercomplete','cancelled','rejected' "}});
	}else if(process.require == undefined || process.require == ""){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Please enter require"}});
	}else if(["true","false"].indexOf(process.require.toLowerCase())<0){
		self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"require should be true or false"}});
	}else{
		_isValidIndex(self,process,user);
	}
}
var _isValidIndex = function(self,process,user){
	OrderStatusReffModel.findOne({index:process.index},function(err,index){
		if(err){
			logger.emit("error","Database Issue :_isValidIndex "+err);
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!index){
			_isValidOrderStatus(self,process,user);
		}else{
			if(process.order_status == index.order_status){
				self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"order_status already exists"}});
			}else{
				self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":"Provided index is already used for '"+index.order_status+"' status, please use different index"}});
			}
		}
	})
}
var _isValidOrderStatus = function(self,process,user){
	console.log("_isValidOrderStatus");
	OrderStatusReffModel.findOne({order_status:process.order_status},function(err,orderstatus){
		if(err){
			logger.emit("error","Database Issue :_isValidOrderStatus "+err);
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!orderstatus){
			_addOrderProcessingStatus(self,process,user);
		}else{
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"AV001","message":""+process.order_status+" status already exists with index : "+orderstatus.index}});
		}
	})
}
var _addOrderProcessingStatus = function(self,process,user){
	console.log("Process : "+JSON.stringify(process));
	var order_status=new OrderStatusReffModel(process);
	order_status.save(function(err,orderstatus){
		if(err){
			logger.emit("error","Database Issue,fun:_addOrderProcessingStatus"+err,user.userid);
			self.emit("failedAddOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{          
			///////////////////////////////////////////
			_successfulAddOrderProcessingStatus(self);
            ///////////////////////////////////////////          
		}
	})
}
var _successfulAddOrderProcessingStatus = function(self){
	self.emit("successfulAddOrderProcessingStatus",{"success":{"message":"Order Status Added Successfuly"}});
}

OrderStatusReff.prototype.getOrderProcessingStatus = function(user) {
	var self = this;
	/////////////////////////////////////
	_getOrderProcessingStatus(self,user);
	/////////////////////////////////////
};
var _getOrderProcessingStatus = function(self,user){
	OrderStatusReffModel.find({},{index:1,order_status:1,require:1,_id:0},function(err,orderstatus){
		if(err){
			logger.emit("error","Database Issue :_getOrderProcessingStatus "+err);
			self.emit("failedGetOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(orderstatus.length>0){
			_successfulGetOrderProcessingStatus(self,orderstatus);
		}else{
			self.emit("failedGetOrderProcessingStatus",{"error":{"message":""}});
		}
	})
}
var _successfulGetOrderProcessingStatus = function(self,orderstatus){
	self.emit("successfulGetOrderProcessingStatus",{"success":{"message":"Getting Order Status Information Successfuly","orderprocess":orderstatus}});
}

OrderStatusReff.prototype.deleteOrderProcessingStatus = function(user,index) {
	var self = this;
	//////////////////////////////////////////////
	_deleteOrderProcessingStatus(self,user,index);
	//////////////////////////////////////////////
};
var _deleteOrderProcessingStatus = function(self,user,index){
	OrderStatusReffModel.remove({index:index},function(err,deletestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_deleteOrderProcessingStatus"+err,user.userid);
			self.emit("failedDeleteOrderProcessingStatus",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(deletestatus==0){
		    self.emit("failedDeleteOrderProcessingStatus",{"error":{"message":"Provided index is wrong"}});
		}else{
			/////////////////////////////////////////////
			_successfulDeleteOrderProcessingStatus(self);
			/////////////////////////////////////////////
		}
	})
}
var _successfulDeleteOrderProcessingStatus = function(self){
	self.emit("successfulDeleteOrderProcessingStatus",{"success":{"message":"Order Status Deleted Successfuly"}});
}