var events = require("events");
var logger = require("../../common/js/logger");
var ProductConversationModel = require("./product-con-model");
var OrderModel = require("../../productorderrequest/js/productorderrequest-model");

var ServiceConversation = function(servicconversationdata) {
  this.serviceconversation = servicconversationdata;
};


ServiceConversation.prototype = new events.EventEmitter;
module.exports = ServiceConversation;

ServiceConversation.prototype.addConversation = function(orderid,session_userid) {
	var self=this;
	////////////////////////////////////////////////////////////////
	_validateConversationData(self,this.serviceconversation,orderid,session_userid);
	////////////////////////////////////////////////////////////////
};

var _validateConversationData = function(self,conversation_data,orderid,session_userid){
	if(conversation_data == undefined){
		self.emit("failedServiceConAddMsg",{"error":{"code":"AV001","message":"Please enter messagedata"}});
	}else if(conversation_data.massage == undefined){
		self.emit("failedServiceConAddMsg",{"error":{"code":"AV001","message":"Please enter message"}});
	}else if(conversation_data.from == undefined){
		self.emit("failedServiceConAddMsg",{"error":{"code":"AV001","message":"Please enter sender"}});
	}else if(conversation_data.to == undefined){
		self.emit("failedServiceConAddMsg",{"error":{"code":"AV001","message":"Please enter receiver"}});
	}else{
		_checkOrderIdIsValidForConversation(self,orderid,session_userid);
	}
}

var _checkOrderIdIsValidForConversation = function(self,orderid,session_userid){
	OrderModel.findOne({orderid:orderid}).lean().exec(function(err,order){
		if(err){
			logger.emit("error","Database Error : " + err);
			self.emit("failedServiceConAddMsg",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(order){
			self.emit("failedServiceConAddMsg",{"error":{"code":"AU001","message":"Order Already Exists"}});
			// _addConversation(self,conversation_data,orderid);
		}else{
			self.emit("failedServiceConAddMsg",{"error":{"code":"AU001","message":"Incorrect orderid"}});			
		}
	})
	
}

var _addConversation = function(self,conversation_data,orderid){

	conversation_data.order_id = orderid;
	var service_conversation = new ServiceConversationModel(conversation_data);
	service_conversation.save(function(err,conversation){
		if(err){
	    	logger.emit("error","Database Error "+err);
	      	self.emit("failedServiceConAddMsg",{"error":{"code":"ED001","message":"Database Error"}});
	    }else if(conversation){
			/////////////////////////////////
			_successfullAddConversation(self);
			/////////////////////////////////
	    }
	});
}

var _successfullAddConversation = function(self){
	logger.emit("success","__successfullAddConversation");
	self.emit("successfulServiceConAddMsg", {"success":{"message":"Conversation Added Successfully"}});
}