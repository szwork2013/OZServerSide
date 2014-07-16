var events = require("events");
var logger=require("../../common/js/logger");
var TagSearch = require("./tag-search");

exports.addTags=function(req,res){
	var tagnames = req.body.tagnames;
	var tagsearch = new TagSearch(tagnames);
  	tagsearch.removeAllListeners("failedAddTags");
  	tagsearch.on("failedAddTags",function(err){
    	if(err.error.code!="ED001"){
     		logger.emit("error", err.error.message); 
    	}
    	res.send(err);
  	});
  	tagsearch.removeAllListeners("successfulAddTags");
  	tagsearch.on("successfulAddTags",function(result){
    	res.send(result);
  	});
  	if(req.user.isAdmin==false){
    	tagsearch.emit("failedAddTags",{"error":{"message":"You are not an admin user to add tag details"}});
  	}else{
    	tagsearch.addTags(req.user);
  	} 
}
exports.getTags=function(req,res){
	var tagsearch = new TagSearch();
  	tagsearch.removeAllListeners("failedGetTags");
  	tagsearch.on("failedGetTags",function(err){
    	if(err.error.code!="ED001"){
     		logger.emit("error", err.error.message); 
    	}
    	res.send(err);
  	});
  	tagsearch.removeAllListeners("successfulGetTags");
  	tagsearch.on("successfulGetTags",function(result){
    	res.send(result);
  	});
  	if(req.user.isAdmin==false){
    	tagsearch.emit("failedGetTags",{"error":{"message":"You are not an admin user to get tag details"}});
  	}else{
    	tagsearch.getTags(req.user);
  	} 
}
exports.deleteTags=function(req,res){
	var tagname = req.query.tagname;
	var tagsearch = new TagSearch(tagname);
  	tagsearch.removeAllListeners("failedDeleteTags");
  	tagsearch.on("failedDeleteTags",function(err){
    	if(err.error.code!="ED001"){
     		logger.emit("error", err.error.message); 
    	}
    	res.send(err);
  	});
  	tagsearch.removeAllListeners("successfulDeleteTags");
  	tagsearch.on("successfulDeleteTags",function(result){
    	res.send(result);
  	});
  	if(req.user.isAdmin==false){
    	tagsearch.emit("failedDeleteTags",{"error":{"message":"You are not an admin user to delete tags"}});
  	}else{
    	tagsearch.deleteTags(req.user);
  	} 
}