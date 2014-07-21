var logger=require("../../common/js/logger");
var LocationRefference = require("./location");
var S=require("string");

exports.manageLocations=function(req,res){ 
	console.log("manageLocations");
	var location = new LocationRefference();
   	location.removeAllListeners("failedManageLocation");
    location.on("failedManageLocation",function(err){
    	if(err.error.code!="ED001"){
    		logger.emit("error", err.error.message); 
      	}      
      // user.removeAllListeners();
      	res.send(err);
    });
    location.removeAllListeners("successfulManageLocation");
    location.on("successfulManageLocation",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
      res.send(result);
    });
    location.manageLocations(); 
}

exports.addLocation=function(req,res){
	var locationdata = req.body.location;
	var location = new LocationRefference(locationdata);
	console.log("locationdata : "+JSON.stringify(locationdata));
   	location.removeAllListeners("failedAddLocationDetails");
    location.on("failedAddLocationDetails",function(err){
    	if(err.error.code!="ED001"){
    		logger.emit("error", err.error.message); 
      	}      
      // user.removeAllListeners();
      	res.send(err);
    });
    location.removeAllListeners("successfulAddLocationDetails");
    location.on("successfulAddLocationDetails",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin == false){
    	location.emit("failedAddLocationDetails",{error:{message:"You are not an admin to do this action"}});
    }else{
    	location.addLocation(req.user); 
    }   
}

exports.updateLocation=function(req,res){
	var locationdata = req.body.location;
	var location = new LocationRefference(locationdata);
	console.log("locationdata : "+JSON.stringify(locationdata));
   	location.removeAllListeners("failedUpdateLocationDetails");
    location.on("failedUpdateLocationDetails",function(err){
    	if(err.error.code!="ED001"){
    		logger.emit("error", err.error.message); 
      	}      
      // user.removeAllListeners();
      	res.send(err);
    });
    location.removeAllListeners("successfulUpdateLocationDetails");
    location.on("successfulUpdateLocationDetails",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin == false){
    	location.emit("failedUpdateLocationDetails",{error:{message:"You are not an admin to do this action"}});
    }else{
    	location.updateLocation(req.user); 
    }   
}

exports.getLocationDetails=function(req,res){ 
	var key = req.query.key;
	var value = req.query.value;
	var location = new LocationRefference();
   	location.removeAllListeners("failedGetLocationDetails");
    location.on("failedGetLocationDetails",function(err){
    	if(err.error.code!="ED001"){
    		logger.emit("error", err.error.message); 
      	}      
      // user.removeAllListeners();
      	res.send(err);
    });
    location.removeAllListeners("successfulGetLocationDetails");
    location.on("successfulGetLocationDetails",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
      res.send(result);
    });
  location.getLocationDetails(req.user,key,value); 
}

exports.getAllAreasByCity=function(req,res){
	var city = req.query.city;
	var location = new LocationRefference();
   	location.removeAllListeners("failedGetAllAreasByCity");
    location.on("failedGetAllAreasByCity",function(err){
    	if(err.error.code!="ED001"){
    		logger.emit("error", err.error.message); 
      	}      
      // user.removeAllListeners();
      	res.send(err);
    });
    location.removeAllListeners("successfulGetAllAreasByCity");
    location.on("successfulGetAllAreasByCity",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
      res.send(result);
    });
  
    if(req.user.isAdmin ==true ||  req.user.usertype == "provider"){
    	location.getAllAreasByCity(req.user,city); 	
    }else{
    	location.emit("failedGetAllAreasByCity",{error:{message:"You are not an authorized to do this action"}});	
    }   
}