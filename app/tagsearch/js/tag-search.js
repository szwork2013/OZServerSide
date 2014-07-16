var events = require("events");
var logger=require("../../common/js/logger");
var TagSearchModel=require("./tag-search-model");

var TagSearch = function(tagsearchdata) {
  this.tagsearchdata = tagsearchdata;
};

TagSearch.prototype = new events.EventEmitter;
module.exports = TagSearch;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

TagSearch.prototype.addTags = function(user){
	var self = this;
	var tagnames = this.tagsearchdata;
	//////////////////////////////
	_validateAddTagsData(self,tagnames,user);
	//////////////////////////////
}
var _validateAddTagsData = function(self,tagnames,user){
	if(tagnames == undefined){
		self.emit("failedAddTags",{"error":{"code":"AV001","message":"Please enter tagnames"}});
	}else if(!isArray(tagnames)){
		self.emit("failedAddTags",{"error":{"code":"AV001","message":"tagnames should be an array"}});
	}else if(tagnames.length == 0){
		self.emit("failedAddTags",{"error":{"code":"AV001","message":"Please enter atleast one tagname"}});
	}else{
		var tag_arr=[];
		for (var i = 0; i < tagnames.length; i++) {
			if(tag_arr.indexOf(tagnames[i].toLowerCase())<0){
				tag_arr.push(tagnames[i].toLowerCase());
			}			
		};
		_checkTagNamesAlreadyExist(self,tag_arr,user);
	}
}
var _checkTagNamesAlreadyExist = function(self,tagnames){
	console.log("tag_arr : "+tagnames)
	TagSearchModel.find({},{tagnames:1}).exec(function(err,tagdata){
		if(err){
			logger.emit("error","Database Error : _checkTagNamesAlreadyExist " + err);
			self.emit("failedAddTags",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(tagdata.length==0){
			// self.emit("failedAddTags",{"error":{"message":"tagnames does not exist"}});
			_addTags(self,tagnames);
		}else{			
			_upadteTags(self,tagnames);
		}
	});
}
var _addTags = function(self,tagnames){
	console.log("_addTags + "+tagnames);
	var tagdata = {tagnames:tagnames};
	var tagnames = new TagSearchModel(tagdata);
	tagnames.save(function(err,prod_catalog){
		if(err){
			logger.emit("error","Database Error:_addTags "+err);
			self.emit("failedAddTags",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
			/////////////////////////
			_successfulAddTags(self);
			/////////////////////////
		}
	})
}
var _upadteTags = function(self,tagnames){
	TagSearchModel.update({},{$addToSet:{tagnames:{$each:tagnames}}},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Issue fun:_upadteTags"+err);
		  	self.emit("failedAddTags",{"error":{"code":"ED001","message":"Database Issue"}});
	  	}else if(updateStatus==0){
	  		self.emit("failedAddTags",{"error":{"message":"Server Issue"}});
	  	}else{
	  		/////////////////////////
        	_successfulAddTags(self);
	  		/////////////////////////
	  	}
	});
}
var _successfulAddTags = function(self){
	self.emit("successfulAddTags",{"success":{"message":"Tags Added Sucessfully"}});
}

TagSearch.prototype.getTags = function(user){
	var self = this;
	////////////////////
	_getTags(self,user);
	////////////////////
}
var _getTags = function(self,user){
	console.log("_getTags");
	TagSearchModel.find({},{tagnames:1,_id:0}).exec(function(err,tagdata){
		if(err){
			logger.emit("error","Database Error : _getTags " + err);
			self.emit("failedGetTags",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(tagdata.length==0){
			self.emit("failedGetTags",{"error":{"message":"tagnames does not exist"}});
		}else{
			_successfulGetTags(self,tagdata[0].tagnames);
		}
	});
}
var _successfulGetTags = function(self,tagnames){
	self.emit("successfulGetTags",{"success":{"message":"Getting Tags Sucessfully",tagnames:tagnames}});
}

TagSearch.prototype.deleteTags = function(user){
	var self = this;
	var tagname = this.tagsearchdata;
	//////////////////////////////
	_validateDeleteTagsData(self,tagname,user);
	//////////////////////////////
}
var _validateDeleteTagsData = function(self,tagname,user){
	if(tagname == undefined || tagname == ""){
		self.emit("failedDeleteTags",{"error":{"code":"AV001","message":"Please enter tagname"}});
	}else{
		//////////////////////////////
		_deleteTags(self,tagname,user);
		//////////////////////////////
	}
}
var _deleteTags = function(self,tagname,user){
	console.log("tagname  22222222222: "+tagname);
	TagSearchModel.update({},{$pull:{tagnames:tagname}},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Issue fun:_deleteTags"+err);
		  	self.emit("failedDeleteTags",{"error":{"code":"ED001","message":"Database Issue"}});
	  	}else if(updateStatus==0){
	  		self.emit("failedDeleteTags",{"error":{"message":"Server Issue"}});
	  	}else{
	  		/////////////////////////
        	_successfulDeleteTags(self);
	  		/////////////////////////
	  	}
	});
}
var _successfulDeleteTags = function(self){
	self.emit("successfulDeleteTags",{"success":{"message":"Tags Removed Sucessfully"}});
}