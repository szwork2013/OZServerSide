
var events = require("events");
var HHIconModel=require("./hhicon-model");
var AWS = require('aws-sdk');
var CONFIG=require("config").OrderZapp;
var amazonbucket=CONFIG.amazonbucket;

AWS.config.update({accessKeyId:'AKIAJOGXRBMWHVXPSC7Q', secretAccessKey:'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'});
AWS.config.update({region:'ap-southeast-1'});
var HHIcon = function(icondata) {
  this.hhicon=icondata;
};
HHIcon.prototype = new events.EventEmitter;
module.exports = HHIcon;

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}
HHIcon.prototype.addIcon = function(sessionuser,dirname,file) {
	var self=this;
	var icondata=self.hhicon;
	//////////////////////////////////////////////////
	_validateIconData(self,icondata,sessionuser,__dirname,file);
	//////////////////////////////////////////////
};
var _validateIconData=function(self,icondata,sessionuser,dirname,file){
	if(icondata.iconname==undefined || icondata.iconname==""){
		self.emit("failedAddIcon",{"error":{"code":"AV001","message":"PLEAE PASS ICONNAME"}});
	}else if(icondata.category==undefined || icondata.category==""){	
		self.emit("failedAddIcon",{"error":{"code":"AV001","message":"PLEAE PASS category"}});
	}else if(!isArray(icondata.category)){
		self.emit("failedAddIcon",{"error":{"code":"AV001","message":"CATEGORY SHOULD BE AN ARRAY"}});
	}else if(icondata.category.length==0){
		self.emit("failedAddIcon",{"error":{"code":"AV001","message":"Please pass atleast one category"}});
	}else{
		/////////////////////////////////////
		_addIcon(self,icondata,sessionuser,dirname,file);
		/////////////////////////////////////
	}
}
var _addIcon=function(self,icondata,sessionuser,dirname,file){
	icondata.createdby.userid=sessionuser.userid;
	var hhiconobject=new HHIconModel(icondata);
	hhiconobject.save(function(err,hhicon){
		if(err){
			self.emit("failedAddIcon",{"error":{"code":"ED001","message":"Database Issue"}});	
		}else{
			/////////////////////////////////////
			_uploadIcon(self,sessionuser,dirname,file,hhicon)
			//////////////////////////////////
		}
	})
}
var _uploadIcon=function(self,sessionuser,dirname,file,hhicon){
	var file_name=file.filename;
  var file_buffer=file.filebuffer;
  var file_type=file.filetype;
  var ext = path.extname(fileName||'').split('.');
	ext=ext[ext.length - 1];
  var fileName = dirname + '/tmp/uploads/' + file_name;
	fs.open(fileName, 'a', 0755, function(err, fd) {
	  if (err) {
	  	logger.emit("error","File Open Issue +"+err)
	    self.emit("failedAddIcon",{"error":{"message":"File Read Issue"}})
	  }else{
	    fs.write(fd, file_buffer, null, 'Binary', function(err, written, writebuffer) {
	      if(err){
	       		self.emit("failedAddIcon",{"error":{"message":" function:_readCommentImage \nError in write image "+err}})   
	        }else{
				    var s3filekey=Math.floor((Math.random()*1000)+1)+"."+ext;
				    var bucketFolder;
				    var params;
				    bucketFolder=amazonbucket+"/icons";
		      	 params = {
		             Bucket: bucketFolder,
		             Key:hhicon.iconid,
		             Body: writebuffer,
		             //ACL: 'public-read-write',
		             ContentType: file_type
		          };
		          ////////////////////////////////////////
		          _IconImageUpload(self,hhicon,params,sessionuser);
		          //////////////////////////////////////
	     		}
	     	})
	    }
	  })
	}

var _IconImageUpload=function(self,hhicon,awsparams,sessionuser){
	s3bucket.putObject(awsparams, function(err, data) {
    if (err) {
    	logger.emit("error","S3 bucket putobject issue"+err)
    	self.emit("failedAddIcon",{"error":{"message":"Amazon Upload Issue"}});     
    } else {
      
      var params1 = {Bucket: awsparams.Bucket, Key: awsparams.Key,Expires: 60*60*24*365};
      s3bucket.getSignedUrl('getObject',params1, function (err, url) {
        if(err){
        	logger.emit("error"," _IconImageUpload")
          self.emit("failedAddIcon",{"error":{"message":" Get Signed Url Issue"}}) ;    
        }else{
        	
          var iconimage={bucket:params1.Bucket,key:params1.key,url:url};
          HHIconModel.update({iconid:hhicon.iconid},{$set:{iconimage:iconimage}},function(err,iconimagestatus){
          	if(err){
          		logger.emit("error","Database Issue"+err);
          		self.emit("failedAddIcon",{"error":{"code":"ED001","message":"Database Issue"}});	
          	}else if(iconimagestatus==0){
          		self.emit("failedAddIcon",{"error":{"message":"hhicond id is wrong"}}); 
          	}else{
          		///////////////////////////////////////
          		_successfullHHIcon(self);
          		////////////////////////////////////
          	}
          })
        }
      });
    }
  }) 
}
var _successfullHHIcon=function(self,url){
	self.emit("successfulAddIcon",{"success":{"message":"Helping Icon uploaded successfully","url":url}});
}
HHIcon.prototype.searchIcon = function(iconname) {
	var self=this;
	if(iconname==undefined || iconname==""){
		self.emit("failedSearchIcon",{"error":{"message":"please enter iconname"}})
	}else{
		/////////////////////
		_searchIcon(self,iconname);
		////////////////////
	}	
};
var _searchIcon=function(self,iconname){
	HHIconModel.find({iconname:{$regex:iconname,$options:'i'}},function(err,hhicons){
		if(err){
			logger.emit("error","Database Issue :_searchIcon"+err)
			self.emit("failedSearchIcon",{"error":{"message":"Database Issue"}})
		}else if(hhicons.length==0){
			self.emit("failedSearchIcon",{"error":{"message":"No Icon Finds"}})
		}else{
			////////////////////////////////////////
			_successfullSearchIcon(self,hhicons);
			////////////////////////////////////
		}
	})
}
var _successfullSearchIcon=function(self,hhicons){
	self.emit("successfulSearchIcon",{"success":{"message":"Icons Getting successfully","icons":hhicons}});
}