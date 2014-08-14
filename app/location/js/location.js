var events = require("events");
var logger=require("../../common/js/logger");
var S=require("string");
var MongoClient = require('mongodb').MongoClient;
var LocationModel=require("./location-reff-model")
var LocationRefference = function(locationdata) {
  this.locationdata=locationdata;
};

LocationRefference.prototype = new events.EventEmitter;
module.exports = LocationRefference;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

LocationRefference.prototype.manageLocations = function() {
	var self = this;

	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/mydb", function(err, db) {
	  	if(err) {
	    	console.log("Connection Failed To ozpp-dev "+err);
	  	}else{
	  		console.log("Connected Successfully To mydb");
	  // 		var zipcodesModel = db.collection('zipcodes');
	  // 		zipcodesModel.aggregate([{$group:{_id:"$zipcode",area:{$addToSet:"$area"},country:{$addToSet:"$countrycode"},state:{$addToSet:"$state"},city:{$addToSet:"$district"},lati:{$addToSet:"$lat"},longi:{$addToSet:"$longitude"}}}],function(err,doc){
			// 	if(err){
			// 		logger.emit("error","Database Error : manageLocations " + err);
			// 		self.emit("failedManageLocation",{"error":{"code":"ED001","message":"Database Issue"}});
			// 	}else if(doc.length>0){
			// 		var zipcodearray=[];
			// 		for(var i=0;i<doc.length;i++){
			// 			var zipcodearea={country:doc[i].country[0],zipcode:doc[i]._id,state:doc[i].state[0],city:doc[i].city[0],geo:{lati:doc[i].lati[0]+"",longi:doc[i].longi[0]+""},area:doc[i].area}
			// 			zipcodearray.push(zipcodearea)
			// 		}
			// 		LocationModel.create(zipcodearray,function(er,locationdata){
			// 			if(err){
			// 				logger.emit("error","Database Error:manageLocations"+err);
			// 				self.emit("failedManageLocation",{"error":{"code":"ED001","message":"Database Issue"}});
			// 			}else{
			// 				logger.emit("log","Location added");
			// 				self.emit("successfulManageLocation",{"success":{"message":"Location Added Sucessfully"}});
			// 			}
			// 		})
			// 	}else{
		 //  			self.emit("failedManageLocation",{"error":{"code":"AD001","message":"Data does not exists"}});
		 //  		}
			// });
			var things = db.collection('things');

	  		things.aggregate({$group:{_id:"$zipcode",area:{$addToSet:"$location"},country:{$addToSet:"$country"},state:{$addToSet:"$state"},city:{$addToSet:"$city"}}},function(err,doc){
				if(err){
					logger.emit("error","Database Error : manageLocations " + err);
					self.emit("failedManageLocation",{"error":{"code":"ED001","message":"Database Issue"}});
				}else if(doc){
					// for (var i = 0; i < doc.length; i++) {
					// 	console.log(doc[0]._id);
					// 	LocationModel.update({zipcode:doc[i]._id},{$addToSet:{area:{$each:doc[i].area}}},function(err,updateStatus){
					// 		if(err){
					// 		  	logger.emit('error',"Database Issue fun:_updateLocation "+err);
					// 	  	}else if(updateStatus==0){
					// 	  		logger.emit('error',"Server Issue");
					// 	  	}else{
					// 	  		logger.emit('info',"Location updated sucessfully");
					// 	  	}
					// 	});
					// };
					self.emit("successfulManageLocation",{"success":{"message":"Getting Things","doc":doc}});
				}else{
		  			self.emit("failedManageLocation",{"error":{"code":"AD001","message":"Data does not exists"}});
		  		}
			});
	  	}
	});
};

LocationRefference.prototype.getLocationDetails = function(user,key,value) {
	var self = this;
	////////////////////////////////
	_validateKyeValues(self,user,key,value);
	////////////////////////////////
};
var _validateKyeValues = function(self,user,key,value){
	if(key == undefined){
		self.emit("failedGetLocationDetails",{"error":{"code":"AV001","message":"Please enter filter key"}});
	}else if(value == undefined){
		self.emit("failedGetLocationDetails",{"error":{"code":"AV001","message":"Please enter filter value"}});
	}else if(["country","state","city","zipcode","area"].indexOf(key)<0){
		self.emit("failedGetLocationDetails",{"error":{"code":"AV001","message":"Filter key must be country,state,city,zipcode,area"}});
	}else{
		if(key == "country" && value != ""){
			_getAllCountries(self,key,value,user);
		}else if(key == "state" && value != ""){
			_getAllStatesForSpecificCountry(self,key,value,user);
		}else if(key == "city" && value != ""){
			_getAllcityForSpecificState(self,key,value,user);
		}else if(key == "zipcode" && value != ""){
			_getAllZipcodesForSpecificCity(self,key,value,user);
		}else if(key == "area" && value != ""){
			_getAllAreaForSpecificZipcodes(self,key,value,user);
		}else{
			self.emit("failedGetLocationDetails",{"error":{"code":"AV001","message":"Please enter valid filter key and value"}});	
		}
	}
}
var _getAllCountries = function(self,key,value,user){
	LocationModel.distinct("country").exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getAllCountries " + err);
			self.emit("failedGetLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length>0){
			console.log(doc);
			self.emit("successfulGetLocationDetails",{"success":{"message":"Getting All Countries Sucessfully","country":doc}});
		}else{
	  		self.emit("failedGetLocationDetails",{"error":{"code":"AD001","message":"Countries does not exist"}});
	  	}
	});
}
var _getAllStatesForSpecificCountry = function(self,key,value,user){
	LocationModel.aggregate({$match:{country:value}},{$group:{_id:"$country",states:{$addToSet:"$state"}}},{$project:{country:"$_id",states:"$states",_id:0}}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getAllStatesForSpecificCountry " + err);
			self.emit("failedGetLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length>0){
			self.emit("successfulGetLocationDetails",{"success":{"message":"Getting All States For "+value+" Sucessfully","states":doc[0].states}});
		}else{
	  		self.emit("failedGetLocationDetails",{"error":{"code":"AD001","message":"States does not exist for provided country"}});
	  	}
	});
}
var _getAllcityForSpecificState = function(self,key,value,user){	
	LocationModel.aggregate({$match:{state:value}},{$group:{_id:"$state",city:{$addToSet:"$city"}}},{$project:{state:"$_id",city:"$city",_id:0}}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getAllcityForSpecificState " + err);
			self.emit("failedGetLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length>0){
			self.emit("successfulGetLocationDetails",{"success":{"message":"Getting All Cities For "+value+" Sucessfully","city":doc[0].city}});
		}else{
	  		self.emit("failedGetLocationDetails",{"error":{"code":"AD001","message":"Cities does not exist for provided state"}});
	  	}
	});
}
var _getAllZipcodesForSpecificCity = function(self,key,value,user){
	LocationModel.aggregate({$match:{city:value}},{$group:{_id:"$city",zipcode:{$addToSet:"$zipcode"}}}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getAllZipcodesForSpecificCity " + err);
			self.emit("failedGetLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length>0){
			self.emit("successfulGetLocationDetails",{"success":{"message":"Getting All Zipcodes For "+value+" Sucessfully","zipcode":doc[0].zipcode}});
		}else{
	  		self.emit("failedGetLocationDetails",{"error":{"code":"AD001","message":"Zipcodes does not exist for provided city"}});
	  	}
	});
}
var _getAllAreaForSpecificZipcodes = function(self,key,value,user){
	LocationModel.findOne({zipcode:value},{area:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getAllAreaForSpecificZipcodes " + err);
			self.emit("failedGetLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc){
			self.emit("successfulGetLocationDetails",{"success":{"message":"Getting All Areas For "+value+" Sucessfully","area":doc.area}});
		}else{
	  		self.emit("failedGetLocationDetails",{"error":{"code":"AD001","message":"Areas does not exist for provided zipcode"}});
	  	}
	});
}

LocationRefference.prototype.addLocation = function(user) {
	var self = this;
	var locationdata = self.locationdata;
	console.log("addLocation : "+JSON.stringify(locationdata));
	////////////////////////////////
	_validateAddLocationData(self,locationdata,user);
	////////////////////////////////
};
var _validateAddLocationData = function(self,location,user){
	if(location == undefined){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter location"}});
	}else if(location.country == undefined || location.country == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter country"}});
	}else if(location.state == undefined || location.state == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter state"}});
	}else if(location.city == undefined || location.city == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter city"}});
	}else if(location.zipcode == undefined || location.zipcode == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter zipcode"}});
	}else if(location.area == undefined || location.area == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter area"}});
	}else if(!isArray(location.area)){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Area should be sent in a JSON array"}});
	}else if(location.area.length==0){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter atleast one area"}});
	}else if(location.geo == undefined || location.geo == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter geo"}});
	}else if(location.geo.lati == undefined || location.geo.lati == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter latitude"}});
	}else if(location.geo.longi == undefined || location.geo.longi == ""){
		self.emit("failedAddLocationDetails",{"error":{"code":"AV001","message":"Please enter longitude"}});
	}else{
		_checkZipcodeAlreadyExist(self,location,user);
	}
}
var _checkZipcodeAlreadyExist = function(self,location,user){
	LocationModel.findOne({city:location.city,zipcode:location.zipcode}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _checkZipcodeAlreadyExist " + err);
			self.emit("failedAddLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc){
			self.emit("failedAddLocationDetails",{"error":{"message":"Zipcode("+location.zipcode+") already exist for "+location.city+" city"}});
		}else{
			_addLocation(self,location,user);
	  	}
	});
}
var _addLocation = function(self,location,user){
	var locationdata = new LocationModel(location);
	locationdata.save(function(err,prod_catalog){
		if(err){
			logger.emit("error","Database Error:_addLocation"+err,user.userid);
			self.emit("failedAddLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
			///////////////////////////////////////
        	_successfulAddLocationDetails(self);
	  		///////////////////////////////////////
		}
	})	
}
var _successfulAddLocationDetails = function(self){
	self.emit("successfulAddLocationDetails",{"success":{"message":"Location Added Sucessfully"}});
}

LocationRefference.prototype.updateLocation = function(user) {
	var self = this;
	var locationdata = self.locationdata;
	console.log("updateLocation : "+JSON.stringify(locationdata));
	////////////////////////////////////////////////////
	_validateUpdateLocationData(self,locationdata,user);
	////////////////////////////////////////////////////
};
var _validateUpdateLocationData = function(self,location,user){
	if(location == undefined){
		self.emit("failedUpdateLocationDetails",{"error":{"code":"AV001","message":"Please enter location"}});
	}else if(location.zipcode == undefined || location.zipcode == ""){
		self.emit("failedUpdateLocationDetails",{"error":{"code":"AV001","message":"Please enter zipcode"}});
	}else if(location.area == undefined || location.area == ""){
		self.emit("failedUpdateLocationDetails",{"error":{"code":"AV001","message":"Please enter area"}});
	}else if(!isArray(location.area)){
		self.emit("failedUpdateLocationDetails",{"error":{"code":"AV001","message":"Area should be sent in a JSON array"}});
	}else if(location.area.length==0){
		self.emit("failedUpdateLocationDetails",{"error":{"code":"AV001","message":"Please enter atleast one area"}});
	}else{
		_updateLocation(self,location,user);
	}
}
var _updateLocation = function(self,location,user){
	LocationModel.update({zipcode:location.zipcode},{$set:{area:location.area}},function(err,updateStatus){
		if(err){
		  	logger.emit('error',"Database Issue fun:_updateLocation "+err);
		  	self.emit("failedUpdateLocationDetails",{"error":{"code":"ED001","message":"Database Issue"}});
	  	}else if(updateStatus==0){
	  		self.emit("failedUpdateLocationDetails",{"error":{"message":"Wrong zipcode"}});
	  	}else{
	  		///////////////////////////////////////
        	_successfulUpdateLocationDetails(self);
	  		///////////////////////////////////////
	  	}
	});
}
var _successfulUpdateLocationDetails = function(self){
	self.emit("successfulUpdateLocationDetails",{"success":{"message":"Location Updated Sucessfully"}});
}

LocationRefference.prototype.getAllAreasByCity = function(city) {
	var self = this;
	if(city == undefined){
		self.emit("failedGetAllAreasByCity",{"error":{"message":"Please enter city"}});
	}else{
		//////////////////////////////
		_getAllAreasByCity(self,city);
		//////////////////////////////
	}
};
var _getAllAreasByCity = function(self,city){
	LocationModel.aggregate({$unwind:"$area"},{$match:{city:city}},{$group:{_id:"$city",area:{$addToSet:"$area"}}}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : _getAllAreasByCity " + err);
			self.emit("failedGetAllAreasByCity",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length>0){
			self.emit("successfulGetAllAreasByCity",{"success":{"message":"Getting All Areas For "+city+" Successfully","area":doc[0].area}});
		}else{
	  		self.emit("failedGetAllAreasByCity",{"error":{"code":"AD001","message":"Please enter valid city"}});
	  	}
	});
}