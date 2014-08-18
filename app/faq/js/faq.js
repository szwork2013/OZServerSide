var FAQModel=require("./faq-model");
var events = require("events");
var logger = require("../../common/js/logger");
var FAQ = function(faqdata) {
  this.faqdata=faqdata;
};

FAQ.prototype = new events.EventEmitter;
module.exports = FAQ;
FAQ.prototype.addFAQ= function(sessionuserid) {
	var self=this;
	var faqdata=this.faqdata;
	/////////////////////////////////////
	_validateFAQData(self,faqdata,sessionuserid)
    ///////////////////////////////////
};
var _validateFAQData=function(self,faqdata,sessionuserid){
	if(faqdata==undefined){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please pass FAQDATA"}})
	}else if(faqdata.question==undefined || faqdata.question==""){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please enter question"}})
	}else if(faqdata.answer==undefined || faqdata.answer==""){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please enter answer"}})
	}else if(faqdata.questionheading==undefined || faqdata.questionheading==""){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please select questionheading"}})
	}else{
		/////////////////////////////////////
		_addFAQ(self,faqdata,sessionuserid)
		////////////////////////////////////
	}
}
var _addFAQ=function(self,faqdata,sessionuserid){
	var faqobject=new FAQModel(faqdata);
	faqobject.save(function(err,faq){
		if(err){
			logger.emit("error","Database Error :_addFAQ"+err,sessionuserid);
			self.emit("failedAddFAQ",{error:{code:"ED001",message:"Database Error"}})
		}else{
			/////////////////////////////////////
			_successfulAddFAQ(self);
			////////////////////////////////////
		}
	})
}
var _successfulAddFAQ=function(self){
	self.emit("successfulAddFAQ",{success:{message:"Successfully Added FAQ"}})
}
FAQ.prototype.updateFAQ= function(sessionuserid,faqid) {
	var self=this;
	var faqdata=this.faqdata;
	/////////////////////////////////////
	_validateUpdateFAQData(self,faqdata,sessionuserid,faqid)
    ///////////////////////////////////
};
var _validateUpdateFAQData=function(self,faqdata,sessionuserid,faqid){
	if(faqdata==undefined){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please pass faqdata"}})
	}else if(faqdata.question==undefined || faqdata.question==""){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please enter question"}})
	}else if(faqdata.answer==undefined || faqdata.answer==""){
		self.emit("failedAddFAQ",{error:{code:"AVOO1",message:"Please enter answer"}})
	}else{
		/////////////////////////////
		_updateFAQData(self,faqdata,sessionuserid,faqid)
		/////////////////////////////
	}
}
var _updateFAQData=function(self,faqdata,sessionuserid,faqid){
	var faq_data={question:faqdata.question,answer:faqdata.answer}
	FAQModel.update({faqid:faqid},{$set:faq_data},function(err,updatefaqstatus){
		if(err){
			logger.emit("error","Database Error:_updateFAQData"+err,sessionuserid);
			self.emit("failedUpdateFAQ",{error:{code:"ED001",message:"Database Error"}})
		}else if(updatefaqstatus==0){
			self.emit("failedUpdateFAQ",{error:{message:"Incorrect faqid"}})
		}else{
			////////////////////////////////////////
			_successfullUpdateFAQData(self);
			/////////////////////////////////////
		}		
	})
}
var _successfullUpdateFAQData=function(self){
	self.emit("successfulUpdateFAQ",{success:{message:"Successfully Update Frequently Asked Qustions"}})
}
FAQ.prototype.getAllFAQ= function(sessionuserid,responsetype) {
	var self=this;
	var faqdata=this.faqdata;
	/////////////////////////////////////
	_getAllFAQ(self,sessionuserid,responsetype)
    ///////////////////////////////////
};
var _getAllFAQ=function(self,sessionuserid,responsetype){
	var questionheadings=["Product Related","Order Related"];
	FAQModel.aggregate({$group:{_id:"$questionheading",faqs:{$addToSet:{faqid:"$faqid",question:"$question",answer:"$answer",createdate:"$createdate"}}}},{$project:{heading:"$_id",faqs:1,_id:0}},function(err,faqs){
		if(err){
			logger.emit("error","Database Error:_getAllFAQF"+err,sessionuserid);
			self.emit("failedGetAllFAQ",{error:{message:"Database Error",code:"ED001"}})
		}else if(faqs==0){
			self.emit("failedGetAllFAQ",{error:{message:"No Frequently Asked Qustions",code:""}})
		}else{
			//////////////////////////////////
			_successfullGetAllFAQ(self,faqs);
			//////////////////////////////////
		}
	})
}
var _successfullGetAllFAQ=function(self,faqs){
	self.emit("successfulGetAllFAQ",{success:{message:"Successfully get FAQS",faqs:faqs}})
}
FAQ.prototype.deleteFAQ= function(sessionuserid,faqid) {
	var self=this;
	
	/////////////////////////////////////
	_deleteFAQ(self,sessionuserid,faqid)
    ///////////////////////////////////
};
var _deleteFAQ=function(self,sessionuserid,faqid){
 FAQModel.remove({faqid:faqid},function(err,removestatus){
 	if(err){
 		logger.emit('error',"Database Issue:_deleteFAQ "+err);
 		self.emit("failedDeleteAQ",{error:{code:"ED001",message:"Database Error"}})
 	}else if(removestatus==0){
 		self.emit("failedDeleteAQ",{error:{message:"Incorrect faqid"}})
 	}else{
 		console.log("test");
 		//////////////////////////////
 		_successfullDeleteFAQ(self)
 		///////////////////////////
 	}
 })
}
var _successfullDeleteFAQ=function(self){
	self.emit("successfulDeleteFAQ",{success:{message:"Successfully Delete FAQ"}})
}