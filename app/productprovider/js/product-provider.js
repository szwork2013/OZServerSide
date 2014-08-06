var ProductCategoryModel=require("../../productcategory/js/product-category-model");
var ProductProviderModel=require("./productprovider-model");
var SellersAgreementModel = require("./sellersagreement-model");
var BranchPolicyModel = require("./branch-policy-model");
var ProductCatalogModel = require("../../productcatalog/js/product-catalog-model");
var ProviderGroupModel=require("../../providergroup/js/provider-group-model");
var UserModel=require("../../user/js/user-model");
var events = require("events");
var S=require("string");
var logger=require("../../common/js/logger");
var generateId = require('time-uuid');
var SMSTemplateModel=require("../../common/js/sms-template-model");
var __=require("underscore");
var fs=require("fs");
var path=require("path");
var AWS = require('aws-sdk');
var CONFIG=require("config").OrderZapp;
var amazonbucket=CONFIG.amazonbucket;
var exec = require('child_process').exec;
AWS.config.update({accessKeyId:'AKIAJOGXRBMWHVXPSC7Q', secretAccessKey:'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'});
AWS.config.update({region:'ap-southeast-1'});
var s3bucket = new AWS.S3();
var isNumeric = require("isnumeric");
var OrderProcessConfigModel=require('./order-process-config-model');
var ProductProvider = function(productproviderdata) {
  this.productprovider=productproviderdata;
};

var regxemail = /\S+@\S+\.\S+/; 
ProductProvider.prototype = new events.EventEmitter;
module.exports = ProductProvider;
function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}
var _updateProductProviderDetails=function(providerid){
	logger.emit("log","_updateProductProviderDetails")
	ProductProviderModel.findOne({providerid:providerid},{providerid:1,provideremail:1,providername:1,providerbrandname:1,providerlogo:1,providercode:1,_id:0,paymentmode:1},function(err,provider){
		if(err){
			logger.emit("error","Database Issue :_updateProductProviderDetails "+err)
		}else if(!provider){
			logger.emit("error","Provider id is wrong for _updateProductProviderDetails ")
		}else{

			provider.providerlogo=provider.providerlogo.image;
			var setdata={};
			provider=JSON.stringify(provider);
			provider=JSON.parse(provider);

			ProductCatalogModel.update({"provider.providerid":providerid},{$set:{provider:provider}},{multi:true},function(err,productproviderstatus){
				if(err){
					logger.emit("error","Database Issue _updateProductProviderDetails"+err)
				}else if(productproviderstatus==0){
					logger.emit("log","No product exist for that provider "+providerid)
				}else{
					logger.emit("log","All the products for provider updated");
				}
			})
		}
	})
}
var _updateBranchProductsDetails=function(branchid){
	ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},function(err,providerbranch){
		if(err){
			logger.emit("error","Database Issue :_updateProductProviderDetails "+err)
		}else if(providerbranch.length==0){
			logger.emit("error","Branch id is wrong");
		}else{
			var branch=providerbranch[0].branch;
			var branchsetdata={branchid:branch.branchid,branchname:branch.branchname,note:branch.note,location:branch.location,delivery:branch.delivery}
			ProductCatalogModel.update({"branch.branchid":branchid},{$set:{branch:branchsetdata}},{multi:true},function(err,productproviderstatus){
				if(err){
					logger.emit("error","Database Issue _updateProductProviderDetails"+err)
				}else if(productproviderstatus==0){
					logger.emit("error","branchid is wrong for update product")
				}else{
					logger.emit("log","all branch products updated")
				}
			})
		}
	})
}
var _addProductProviderLogo =function(providerid,user,providerlogo,callback){
	fs.readFile(providerlogo.path,function (err, data) {
  		if(err){
  			callback({error:{code:"ED001",message:"Database Issue"}})
  		}else{
  			var ext = path.extname(providerlogo.originalname||'').split('.');
  			ext=ext[ext.length - 1];
  			 var s3filekey=Math.floor((Math.random()*1000)+1)+"."+ext;
		    var bucketFolder;
		    var params;

		    bucketFolder=amazonbucket+"/provider/"+providerid;
  	    params = {
           Bucket: bucketFolder,
           Key:providerid+s3filekey,
           Body: data,
           //ACL: 'public-read-write',
           ContentType: providerlogo.mimetype
        };
        ////////////////////////////////////////////////////////////
        _addProviderLogoToAmazonServer(params,providerid,user,providerlogo,function(err,result){
        	if(err){
        		callback(err)
        	}else{	
        		callback(null,result)
        	}
        });
        ////////////////////////////////////////////////////////////////////////////
  			
  		}
  	});
}
var _addProviderLogoToAmazonServer=function(awsparams,providerid,user,providerlogo,callback){
	s3bucket.putObject(awsparams, function(err, data) {
    if (err) {
      callback({"error":{"message":"s3bucket.putObject:-_addProviderLogoToAmazonServer"+err}})
    } else {
      var params1 = {Bucket: awsparams.Bucket, Key: awsparams.Key,Expires: 60*60*24*365};
      s3bucket.getSignedUrl('getObject',params1, function (err, url) {
        if(err){
          callback({"error":{"message":"_addProviderLogoToAmazonServer:Error in getting getSignedUrl"+err}});
        }else{
          var providerurl={bucket:params1.Bucket,key:params1.Key,image:url};
         ProductProviderModel.findAndModify({providerid:providerid},[],{$set:{providerlogo:providerurl}},{new:false},function(err,provider_logo){
         	if(err){
         		logger.emit('error',"Database Issue  _addProviderLogoToAmazonServer"+err,user.userid)
			    callback({"error":{"code":"ED001","message":"Database Issue"}});
         	}else if(!provider_logo){
         		callback({"error":{"message":"Provider does not exist"}});
         	}else{
			      var providerlogo_object=provider_logo.providerlogo;
          	if(providerlogo_object==undefined){
              logger.emit("log","First time provider logo changed");
          	}else{
          	  var awsdeleteparams={Bucket:providerlogo_object.bucket,Key:providerlogo_object.key};
            	logger.emit("log",awsdeleteparams);
            	s3bucket.deleteObject(awsdeleteparams, function(err, deleteproviderlogostatus) {
              	if (err) {
               	 logger.emit("error","Provoder logo not deleted from amzon s3 bucket "+err,user.userid);
              	}else if(deleteproviderlogostatus){
               	 logger.emit("log","Product logo  delete from Amazon S3");
              	}
            	}) 
            }
            exec("rm -rf "+providerlogo.path);
             console.log("rm -rf "+providerlogo.path);               
                      
              callback(null,{"success":{"message":"Provider Logo Updated Successfully","image":url}})
            }
          })
        }
      });
    }
  }) 
}

ProductProvider.prototype.acceptrejectProductProvider = function(providerid,action,userid) {
	var self=this;
	 console.log("acceptrejectProductddddddProvider")
	if(action == undefined){
		self.emit("failedProductProviderAcceptance",{"error":{"message":"Please pass action"}});
	}else if(["accept","reject"].indexOf(action)<0){
		self.emit("failedProductProviderAcceptance",{"error":{"message":"action should be accept or reject"}});
	}else{
		/////////////////////////////////////////////////////////////////////
		_validateAcceptProductProviderRequest(self,providerid,action,userid);
		/////////////////////////////////////////////////////////////////////		
	}
};
var _validateAcceptProductProviderRequest = function(self,providerid,action,userid){
	 console.log("acceptrejectProductProvider")
	ProductProviderModel.findOne({providerid:providerid},{status:1,_id:0},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _validateAcceptProductProviderRequest"+err,userid);
			self.emit("failedProductProviderAcceptance",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!provider){
			self.emit("failedProductProviderAcceptance",{"error":{"message":"Provider not exist"}});
		}else{
			if(provider.status == "init"){
				/////////////////////////////////////////////////////////////
		     	_acceptProductProviderRequest(self,providerid,action,userid);
			    /////////////////////////////////////////////////////////////
			}else if(provider.status == action){
				self.emit("failedProductProviderAcceptance",{"error":{"message":"Provider request already "+action+"ed"}});	
			}else{
				/////////////////////////////////////////////////////////////
		     	_acceptProductProviderRequest(self,providerid,action,userid);
			    /////////////////////////////////////////////////////////////
			}
		}
	})
}
var _acceptProductProviderRequest = function(self,providerid,action,userid){
	ProductProviderModel.update({providerid:providerid},{$set:{status:action}},function(err,providerupdatestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_acceptProductProviderRequest"+err,userid);
			self.emit("failedProductProviderAcceptance",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(providerupdatestatus==0){
		    self.emit("failedProductProviderAcceptance",{"error":{"message":"providerid is wrong"}});
		}else{
			///////////////////////////////////////////
			_successfulProductProviderAcceptance(self,action);
			///////////////////////////////////////////
		}
	})
}
var _successfulProductProviderAcceptance=function(self,action){
	self.emit("successfulProductProviderAcceptance",{"success":{"message":"Provider request "+action+"ed sucessfully"}});
}

ProductProvider.prototype.addProductProvider = function(user,providerlogo) {
	var self=this;
	var productproviderdata=JSON.parse(self.productprovider);
	//////////////////////////////////////////////////
	_validateProductProviderData(self,productproviderdata,user,providerlogo);
	//////////////////////////////////////////////
};
var _validateProductProviderData=function(self,productproviderdata,user,providerlogo){
	if(productproviderdata==undefined){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass providerdata"}})
	}else if(productproviderdata.providername==undefined || productproviderdata.providername==undefined ){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass providername"}})
	}else  if(productproviderdata.providerbrandname==undefined || productproviderdata.providerbrandname==undefined ){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter provider brandname"}})
	}else  if(productproviderdata.provideremail==undefined || productproviderdata.provideremail==undefined ){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter provider email"}})
	}else if(productproviderdata.category==undefined || productproviderdata.category==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass category"}})
	}else if(productproviderdata.category.categoryid==undefined && productproviderdata.category.categoryname==undefined){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"please select category"}})
	}else if(productproviderdata.providerdescription==undefined || productproviderdata.providerdescription==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass providerdescription"}})
	// }else if(productproviderdata.branch==undefined || productproviderdata.branch==""){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass branch details"}})
	// }else if(!isArray(productproviderdata.branch)){
	//   self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Branch should be an array"}})
	// }else if(productproviderdata.branch.length==0){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please add atleast one branch details"}});
	// 
    }else if(productproviderdata.orderprocess_configuration==undefined || productproviderdata.orderprocess_configuration==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"please pass orderprocess_configuration details"}})
	}else  if(!isArray(productproviderdata.orderprocess_configuration)){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Process Configuration should be an array"}})
	}else  if(productproviderdata.orderprocess_configuration.length==0){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Process Configuration should not be empty"}})
	}else if(productproviderdata.providercode==undefined || productproviderdata.providercode==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter sellercode"}})
	// }else if(productproviderdata.tax==undefined || productproviderdata.tax==""){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass tax information"}})
	// }else  if(productproviderdata.tax.tino==undefined || productproviderdata.tax.tino==""){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter tino"}})
	// }else if(productproviderdata.tax.servicetaxno==undefined || productproviderdata.tax.servicetaxno==""){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter servicetaxno"}})
	}else if(productproviderdata.paymentmode==undefined || productproviderdata.paymentmode==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass paymentmode"}})
	}else if(providerlogo==undefined){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please upload providerlogo"}})
	}else if(providerlogo.originalname==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please select providerlogo"}})
    }else{
    	productproviderdata.paymentmode.online=true;
     	//////////////////////////////
			_checkCategoryOneLevelCategory(self,productproviderdata,user,providerlogo);
	}	  ////////////////////////////
     
}
var _checkCategoryOneLevelCategory=function(self,productproviderdata,user,providerlogo){
	console.log("categoryid"+productproviderdata.category.categoryid);
	ProductCategoryModel.findOne({categoryid:productproviderdata.category.categoryid},function(err,productcategory){
		if(err){
			logger.emit("error","Database Issue,fun:_checkCategoryOneLevelCategory"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!productcategory){
			self.emit("failedProductProviderRegistration",{"error":{"message":"Category doesn't exist"}});	
		}else{
			if(productcategory.level!=1){
				self.emit("failedProductProviderRegistration",{"error":{"message":"You can only select first level category"}});	
			}else{
				///////////////////////////////////////////////////////////
				_checkProviderCodeAlreadyExist(self,productproviderdata,user,providerlogo)
				///////////////////////////////////////////////////////////
				
			}
		}
	})
}

var _checkProviderCodeAlreadyExist=function(self,productproviderdata,user,providerlogo){
	ProductProviderModel.find({providercode:productproviderdata.providercode},function(err,providercodedata){
		if(err){
			logger.emit("error","Database Issue,fun:_checkCategoryOneLevelCategory"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(providercodedata.length!=0){
			self.emit("failedProductProviderRegistration",{"error":{"message":"Provider code already used"}});
		}else{
				//////////////////////////////////////////////////////////////
			_checkOrderProcessConfiguration(self,productproviderdata,user,providerlogo)
			//////////////////////////////////////////////////////////
		}
	})
}
var _checkOrderProcessConfiguration=function(self,productproviderdata,user,providerlogo){
	OrderProcessConfigModel.find({},function(err,orderrefstatus){
		if(err){
			logger.emit("error","Database Issue,fun:_checkOrderProcessConfiguration"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Issue"}});		
		}else if(orderrefstatus.length==0){
			self.emit("failedProductProviderRegistration",{"error":{"message":"No Order Reference status exist"}});		
		}else{
			var requireorderdstatus=[];
			var allorderstatus=[];
			for(var i=0;i<orderrefstatus.length;i++){
				allorderstatus.push(orderrefstatus[i].order_status)
				if(orderrefstatus[i].require){
					requireorderdstatus.push(orderrefstatus[i].order_status)
				}
			}
			//check provide process configuration status exist in reforder status
			var validorderprocess_configurationstatus=[];
			var orderprocess_configurationstatus=[];
			logger.emit("log","allorderstatus"+JSON.stringify(allorderstatus));
			logger.emit("log","requireorderdstatus"+JSON.stringify(requireorderdstatus));
			logger.emit("log","productproviderdata"+JSON.stringify(productproviderdata.orderprocess_configuration));
			for(var i=0;i<productproviderdata.orderprocess_configuration.length;i++){
				if(allorderstatus.indexOf(productproviderdata.orderprocess_configuration[i].order_status)>=0){
					validorderprocess_configurationstatus.push(productproviderdata.orderprocess_configuration[i])
				}
				orderprocess_configurationstatus.push(productproviderdata.orderprocess_configuration[i].order_status)
			}
			logger.emit("log","validorderprocess_configurationstatus:"+JSON.stringify(validorderprocess_configurationstatus));
			var missingrequirestatus=__.difference(requireorderdstatus,orderprocess_configurationstatus);
			logger.emit("log","missingrequirestatus"+JSON.stringify(missingrequirestatus))
			if(missingrequirestatus.length!=0){
					self.emit("failedProductProviderRegistration",{"error":{"message":"You have to compulsorty select"+requireorderdstatus+"these status"}});		
			}else{
				productproviderdata.orderprocess_configuration=validorderprocess_configurationstatus
				//////////////////////////////////////////////////////////////
			_addProductProvider(self,productproviderdata,user,providerlogo)
			//////////////////////////////////////////////////////////
			}
		}
	})
}
var _addProductProvider=function(self,productproviderdata,user,providerlogo){
	productproviderdata.providerid=generateId();
	productproviderdata.user={userid:user.userid,name:user.firsname};
	var product_provider=new ProductProviderModel(productproviderdata);
	product_provider.save(function(err,productprovider){
		if(err){
			logger.emit("error","Database Issue,fun:_addProductProvider"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
            if(providerlogo!=undefined){
            ///////////////////////////////////////////////////////////////////
	     	_addProductProviderLogo(productprovider.providerid,user,providerlogo,function(err,result){
	     		if(err){
	     			logger.emit("providerlogo not uploaded")
	     		}else{
	     			logger.emit("providerlogo added with provider details")
	     		}
	     	});
            }
			/////////////////////////////////////
			 _successfullAddProductProvider(self);
            ////////////////////////////////////
            ///////////////////////////////////////
            _addProviderDetailsToUser(self,productprovider,user);
            //////////////////////////////
			 // _isContainsUserInviteDetails(self,ProductProvider,user,productproviderdata);
			//////////////////////////////
		}
	})
}
var _addProviderDetailsToUser=function(self,productprovider,user){
	var provider={providerid:productprovider.providerid,isOwner:true};
	UserModel.update({userid:user.userid},{$push:{provider:provider}},function(err,userproviderupdate){
		if(err){
			logger.emit("error","Database Issue");
		}else if(userproviderupdate==0){
			logger.emit("log","userid is wrong");
		}else{
			logger.emit("info","Provider Details associated with user");
		}
	})
}
var _successfullAddProductProvider=function(self){
	self.emit("successfulProductProviderRegistration",{"success":{"message":"Product Provider Added Sucessfully"}});
}

ProductProvider.prototype.addProviderPolicy = function(providerid,branchid,type,text,user) {
	var self=this;
	var text=self.productprovider;
	////////////////////////////////////////////////////////////////////
	_validateAddProviderPolicy(self,providerid,branchid,type,text,user);
	////////////////////////////////////////////////////////////////////
};
var _validateAddProviderPolicy = function(self,providerid,branchid,type,text,user){
	if(text == undefined || text == ""){
		self.emit("failedAddProviderPolicy",{"error":{"code":"AV001","message":"Please enter text"}});
	}else if(type == undefined){
		self.emit("failedAddProviderPolicy",{"error":{"code":"AV001","message":"Please pass type"}});
	}else if(["ordering_policy","price_policy","refunds_policy","delivery_policy","cancellation_policy"].indexOf(type)<0){
		self.emit("failedAddProviderPolicy",{"error":{"code":"AV001","message":"type should be ordering_policy or price_policy or refunds_policy or delivery_policy or cancellation_policy"}});
	}else{
		_isValidProviderToAddPolicy(self,providerid,branchid,type,text,user);
	}
}
var _isValidProviderToAddPolicy = function(self,providerid,branchid,type,text,user){
	ProductProviderModel.findOne({providerid:providerid,"branch.branchid":branchid},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _isValidProviderToAddPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!provider){
			console.log(provider);
			self.emit("failedAddProviderPolicy",{"error":{"message":"providerid or branchid is wrong"}});
		}else{
			//////////////////////////////////////////////////////////////////////////////
	     	_isProviderAdminToAddPolicy(self,providerid,branchid,type,text,user,provider);
		    //////////////////////////////////////////////////////////////////////////////
		}
	})
}
var _isProviderAdminToAddPolicy=function(self,providerid,branchid,type,text,user,provider){
	// console.log("userid "+user.userid+ " providerid : "+providerid);
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,userpp){
		if(err){
			logger.emit('error',"Database Issue  _isProviderAdminToAddPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!userpp){
			self.emit("failedAddProviderPolicy",{"error":{"message":"You are not authorized to add provider policy details"}});
		}else{
			///////////////////////////////////////////////////////////////////////////
	     	_checkPolicyAlreadyExist(self,providerid,branchid,type,text,user,provider);
		    ///////////////////////////////////////////////////////////////////////////
		}
	})
}
var _checkPolicyAlreadyExist = function(self,providerid,branchid,type,text,user){
	BranchPolicyModel.findOne({providerid:providerid,branchid:branchid},{_id:0},function(err,branchpolicy){
		if(err){
			logger.emit('error',"Database Issue  _checkPolicyAlreadyExist "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!branchpolicy){
			//////////////////////////////////////////////////////////
			_addBranchPolicy(self,providerid,branchid,type,text,user);
			//////////////////////////////////////////////////////////
		}else{
			/////////////////////////////////////////////////////////////
	     	_updateBranchPolicy(self,providerid,branchid,type,text,user,branchpolicy);
		    /////////////////////////////////////////////////////////////
		}
	})
}
var _addBranchPolicy=function(self,providerid,branchid,type,text,user){
	console.log("_addProviderPolicy");
	// if(provider.policy==undefined){
	// 	provider.policy={};
	// }
 //    provider.policy[type]=text;
	// var setdata=provider.policy;
	var policydata = {providerid:providerid,branchid:branchid};
	policydata[type] = text;
	console.log("policydata : "+JSON.stringify(policydata));
	var branchPolicy = new BranchPolicyModel(policydata)
	branchPolicy.save(function(err,branchpolicystatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_addProviderPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(branchpolicystatus==0){
		    self.emit("failedAddProviderPolicy",{"error":{"message":"Database Issue"}});
		}else{
			///////////////////////////////////
			_successfulAddProviderPolicy(self);
			///////////////////////////////////
		}
	})
}
var _updateBranchPolicy = function(self,providerid,branchid,type,text,user,branchpolicy){
    var policysetdata={};
    policysetdata[type]=text
	BranchPolicyModel.update({providerid:providerid,branchid:branchid},{$set:policysetdata},function(err,branchpolicystatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_addProviderPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(branchpolicystatus==0){
		    self.emit("failedAddProviderPolicy",{"error":{"message":"Database Issue"}});
		}else{
			///////////////////////////////////
			_successfulAddProviderPolicy(self);
			///////////////////////////////////
		}
	})
}
var _successfulAddProviderPolicy = function(self){
	self.emit("successfulAddProviderPolicy",{"success":{"message":"Provider Policy Added Successfully"}});
}

ProductProvider.prototype.getProviderPolicy = function(providerid,branchid,type,user) {
	var self=this;
	var text=self.productprovider;
	////////////////////////////////////////////////////////
	_validateGetProviderPolicy(self,providerid,branchid,type,user);
	////////////////////////////////////////////////////////	
};
var _validateGetProviderPolicy = function(self,providerid,branchid,type,user){
	if(type == undefined){
		self.emit("failedGetProviderPolicy",{"error":{"code":"AV001","message":"Please pass type"}});
	}else if(["ordering_policy","price_policy","refunds_policy","delivery_policy","cancellation_policy","all"].indexOf(type)<0){
		self.emit("failedGetProviderPolicy",{"error":{"code":"AV001","message":"type should be ordering_policy or price_policy or refunds_policy or delivery_policy or cancellation_policy"}});
	}else{
		// _isValidProviderToGetPolicy(self,providerid,branchid,type,user);
		///////////////////////////////////////////////////////
	    _getProviderPolicy(self,providerid,branchid,type,user);
		///////////////////////////////////////////////////////
	}
}
var _isValidProviderToGetPolicy = function(self,providerid,branchid,type,user){
	// console.log("_isValidProviderToGetPolicy");
	ProductProviderModel.findOne({providerid:providerid,"branch.branchid":branchid},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _isValidProviderToGetPolicy"+err,user.userid);
			self.emit("failedGetProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!provider){
			self.emit("failedGetProviderPolicy",{"error":{"message":"providerid or branchid is wrong"}});
		}else{
			/////////////////////////////////////////////////////////
	     	_isProviderAdminToGetPolicy(self,providerid,branchid,type,user);
		    /////////////////////////////////////////////////////////
		}
	})
}
var _isProviderAdminToGetPolicy=function(self,providerid,branchid,type,user){
	// console.log("_isProviderAdminToGetPolicy");
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProviderAdminToGetPolicy"+err,user.userid);
			self.emit("failedGetProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedGetProviderPolicy",{"error":{"message":"You are not authorized to get provider policy details"}});
		}else{
			///////////////////////////////////////////////////////
	     	_getProviderPolicy(self,providerid,branchid,type,user);
		    ///////////////////////////////////////////////////////
		}
	})
}
var _getProviderPolicy = function(self,providerid,branchid,type,user){
	console.log("_getProviderPolicy");
	BranchPolicyModel.findOne({providerid:providerid,branchid:branchid},{_id:0,__v:0,branchid:0,providerid:0},function(err,branchPolicy){
		if(err){
			logger.emit('error',"Database Issue  _isValidProviderToGetPolicy "+err,user.userid);
			self.emit("failedGetProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!branchPolicy){
			self.emit("failedGetProviderPolicy",{"error":{"code":"AV001","message":"Policy does not exist"}});
		}else{
			if(type=="all"){
			    _successfulGetProviderPolicy(self,branchPolicy);
			}else{
				var obj_arr = Object.keys( branchPolicy );
				var policy = {};
				policy[type]=branchPolicy[type];
				if (JSON.stringify(policy)=="{}"){
			    	self.emit("failedGetProviderPolicy",{"error":{"code":"AV001","message":"Policy does not exist"}});
				}else{
					_successfulGetProviderPolicy(self,policy);
				}
			}
		}
	})
		
	// if(provider.policy==undefined){
	// 	self.emit("failedGetProviderPolicy",{"error":{"message":"Policy does not exist"}});
	// }else{
	//     var text = provider.policy[type];
	//     console.log("text : "+text);
	//     _successfulGetProviderPolicy(self,text);
	// }
}
var _successfulGetProviderPolicy = function(self,policy){
	self.emit("successfulGetProviderPolicy",{"success":{"message":"Getting Provider Policy Details Successfully",policy:policy}});
}

ProductProvider.prototype.updateProviderPolicy = function(providerid,branchid,type,text,user) {
	var self=this;
	var policy=self.productprovider;
	//////////////////////////////////////////////////////////////
	_validateUpdateProviderPolicy(self,providerid,branchid,type,text,user);
	//////////////////////////////////////////////////////////////
};
var _validateUpdateProviderPolicy = function(self,providerid,branchid,type,text,user){
	console.log("text : "+text+" type : "+type);
	if(text == undefined || text == ""){
		self.emit("failedUpdateProviderPolicy",{"error":{"code":"AV001","message":"Please enter text"}});
	}else if(type == undefined){
		self.emit("failedUpdateProviderPolicy",{"error":{"code":"AV001","message":"Please pass type"}});
	}else if(["ordering_policy","price_policy","refunds_policy","delivery_policy","cancellation_policy"].indexOf(type)<0){
		self.emit("failedUpdateProviderPolicy",{"error":{"code":"AV001","message":"type should be ordering_policy or price_policy or refunds_policy or delivery_policy or cancellation_policy"}});
	}else{
		_isValidProviderToUpdatePolicy(self,providerid,branchid,type,text,user);
	}
}
var _isValidProviderToUpdatePolicy = function(self,providerid,branchid,type,text,user){
	// console.log("_isValidProviderToUpdatePolicy");
	ProductProviderModel.findOne({providerid:providerid},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _isValidProviderToUpdatePolicy"+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!provider){
			self.emit("failedUpdateProviderPolicy",{"error":{"message":"providerid is wrong"}});
		}else{
			////////////////////////////////////////////////////////////////////////
	     	_isProviderAdminToUpdatePolicy(self,providerid,branchid,type,text,user);
		    ////////////////////////////////////////////////////////////////////////
		}
	})
}
var _isProviderAdminToUpdatePolicy=function(self,providerid,branchid,type,text,user){
	// console.log("_isProivderAdminToUpdatePolicy");
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProviderAdminToUpdatePolicy"+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedUpdateProviderPolicy",{"error":{"message":"You are not authorized to add provider policy details"}});
		}else{
			///////////////////////////////////////////////////////////////
	     	_checkPolicyAlreadyExistToUpdate(self,providerid,branchid,type,text,user);
		    ///////////////////////////////////////////////////////////////
		}
	})
}
var _checkPolicyAlreadyExistToUpdate = function(self,providerid,branchid,type,text,user){
	BranchPolicyModel.findOne({providerid:providerid,branchid:branchid},function(err,branchpolicy){
		if(err){
			logger.emit('error',"Database Issue  _checkPolicyAlreadyExistToUpdate "+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!branchpolicy){
			self.emit("failedUpdateProviderPolicy",{"error":{"message":"providerid or branchid is wrong"}});
		}else{
			///////////////////////////////////////////////////////////////
	     	_updateBranchPolicyData(self,providerid,branchid,type,text,user);
		    ///////////////////////////////////////////////////////////////
		}
	})
}
var _updateBranchPolicyData=function(self,providerid,branchid,type,text,user){
	// if(provider.policy==undefined){
	// 	provider.policy={};	
	// }
 //    provider.policy[type]=text;
	// var setdata=provider.policy;
	// provider.save(function(err,providerupdatestatus){
	// 	if(err){
	// 		logger.emit('error',"Database Issue ,function:_addProviderPolicy"+err,user.userid);
	// 		self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
	// 	}else if(providerupdatestatus==0){
	// 	    self.emit("failedUpdateProviderPolicy",{"error":{"message":"Database Issue"}});
	// 	}else{
	// 		//////////////////////////////////////
	// 		_successfulUpdateProviderPolicy(self);
	// 		//////////////////////////////////////
	// 	}
	// })
	var policysetdata={};
    policysetdata[type]=text
	BranchPolicyModel.update({providerid:providerid,branchid:branchid},{$set:policysetdata},function(err,branchpolicystatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_addProviderPolicy "+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(branchpolicystatus==0){
		    self.emit("failedUpdateProviderPolicy",{"error":{"message":"Database Issue"}});
		}else{
			///////////////////////////////////
			_successfulUpdateProviderPolicy(self);
			///////////////////////////////////
		}
	})
}
var _successfulUpdateProviderPolicy = function(self){
	self.emit("successfulUpdateProviderPolicy",{"success":{"message":"Provider Policy Updated Successfully"}});
}

ProductProvider.prototype.updateProductProvider = function(user,providerid) {
	var self=this;
	var ProductProviderdata=self.productprovider;
	//////////////////////////////////////////////////
	_validateUpdateUProductProviderData(self,ProductProviderdata,user,providerid);
	//////////////////////////////////////////////
};
var _validateUpdateUProductProviderData=function(self,ProductProviderdata,user,providerid){
	if(ProductProviderdata==undefined){
		self.emit("failedProductProviderUpdation",{"error":{"code":"AV001","message":"Please pass providerdata"}});	
	}else if(ProductProviderdata.status!=undefined || ProductProviderdata.providerlogo!=undefined || ProductProviderdata.photos!=undefined ||ProductProviderdata.category!=undefined || ProductProviderdata.branch!=undefined){
	    self.emit("failedProductProviderUpdation",{"error":{"code":"ED002","message":"You can not change this information of organization"}});
	}else{
		/////////////////////////////////////////////////
		_isServiceProivderAdminToUpdate(self,ProductProviderdata,user,providerid);
		//////////////////////////////////////////
		
	}
}
var _isServiceProivderAdminToUpdate=function(self,ProductProviderdata,user,providerid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isServiceProivderAdminToUpdate"+err,user.userid)
			self.emit("failedProductProviderUpdation",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedProductProviderUpdation",{"error":{"message":"You are not authorized to update Product Proivder Details"}});
		}else{
			///////////////////////////////////////////////////////////////////
	     	_updateProductProviderData(self,ProductProviderdata,user,providerid);
		    //////////////////////////////////////////////////////////////////
		}
	})

}
var _updateProductProviderData=function(self,ProductProviderdata,user,providerid){
	ProductProviderModel.update({providerid:providerid},{$set:ProductProviderdata},function(err,spupdatestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_updateProductProviderData"+err,user.userid)
			self.emit("failedProductProviderUpdation",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(spupdatestatus==0){
		    self.emit("failedProductProviderUpdation",{"error":{"message":"Please pass providerid"}});
		}else{
			////////////////////////////////////////////
			 _updateProductProviderDetails(providerid)
			///////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////
			_successfulUpdateProductProvider(self,ProductProviderdata,user,providerid);
			///////////////////////////////////////////////////////////////////////
		}
	})
}

var _successfulUpdateProductProvider=function(self,ProductProviderdata,user,providerid){
	self.emit("successfulProductProviderUpdation",{"success":{"message":"Product Provider Updated Successfully"}})
}

ProductProvider.prototype.getProductProvider = function(providerid) {
	var self=this;
	/////////////////////////////////////
	_getProductProvider(self,providerid);
	/////////////////////////////////////
};
var _getProductProvider=function(self,providerid){
	ProductProviderModel.findOne({providerid:providerid},{createdate:0,branch:0},function(err,productprovider){
		if(err){
			logger.emit('error',"Database Issue  _getProductProvider");
			self.emit("failedGetProductProvider",{"error":{"code":"ED001","message":"Database Issue"}});	
		}else if(!productprovider){
			self.emit("failedGetProductProvider",{"error":{"message":"providerid is wrong"}});	
		}else{
			/////////////////////////////////////////////////////
			_successfullGetProductProvider(self,productprovider);
			/////////////////////////////////////////////////////
		}
	})
}
var _successfullGetProductProvider=function(self,productprovider){
	self.emit("successfulGetProductProvider",{"success":{"message":"Provider Details Getting successfully",productprovider:productprovider}})
}

ProductProvider.prototype.getAllProductProviders = function() {
	var self=this;
	//////////////////////////////
	_getAllProductProviders(self);
	//////////////////////////////
};
var _getAllProductProviders=function(self){
	// console.log("getAllProductProviders");
	ProductProviderModel.aggregate([{$unwind:"$branch"},{$match:{"branch.status":"publish"}},{$group:{_id:{providerid:"$providerid",providername:"$providername"},branch:{$addToSet:{branchid:"$branch.branchid",branchname:"$branch.branchname"}}}},{$project:{providerid:"$_id.providerid",providername:"$_id.providername",branches:"$branch",_id:0}}]).exec(function(err,productprovider){
		if(err){
			logger.emit('error',"Database Issue  _getAllProductProviders");
			self.emit("failedGetAllProductProviders",{"error":{"code":"ED001","message":"Database Issue "+err}});
		}else if(productprovider.length>0){
			/////////////////////////////////////////////////////
			_successfulGetAllProductProviders(self,productprovider);
			/////////////////////////////////////////////////////
		}else{
			self.emit("failedGetAllProductProviders",{"error":{"message":"Provider does not exist"}});	
		}
	})
}
var _successfulGetAllProductProviders=function(self,productprovider){
	self.emit("successfulGetAllProductProviders",{"success":{"message":"Getting All Provider Details Successfully","productprovider":productprovider}});
}

ProductProvider.prototype.deleteProductProvider = function(user,providerid) {
	var self=this;
	//////////////////////////////////////////////////////////////
	_isAuthorizedUserToDeleteProductProvider(self,user,providerid);
	//////////////////////////////////////////////////////////////
};

var _isAuthorizedUserToDeleteProductProvider=function(self,user,providerid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteProductProvider"+err,user.userid)
			self.emit("failedProductProviderDeletion",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedProductProviderDeletion",{"error":{"message":"You are not authorized to update Service Proivder Details"}});
		}else{
			///////////////////////////////////////////////////////////////////
	     	_deleteProductProvider(self,user,providerid);
		    //////////////////////////////////////////////////////////////////
		}
	})
}
var _deleteProductProvider=function(self,user,providerid){
	ProductProviderModel.update({providerid:providerid},{$set:{status:"deactive"}},function(err,spdeletestatus){
		if(err){
			logger.emit('error',"Database Issue  _deleteProductProvider"+err,user.userid)
			self.emit("failedProductProviderDeletion",{"error":{"code":"ED001","message":"Database Issue"}});	
		}else if(spdeletestatus==0){
			self.emit("failedProductProviderDeletion",{"error":{"message":"providerid is wrong"}});	
		}else{
			///////////////////////////////////////
			_successfullDeleteProductProvider(self);
			//////////////////////////////////////
			///////////////////////////////////////////////////////////////////////
			_removeProviderDetailslFromUserAndGroupMembers(self,user,providerid);
			/////////////////////////////////////////////////////////////////
		}
	})
}
var _removeProviderDetailslFromUserAndGroupMembers=function(self,user,providerid){
// UserModel.update({userid:user.userid},{$pull})	
  logger.emit("log","_removeProviderDetaislFromUserAndGroupMembers")

/////////////////////////////////////////////////////////
_removeAllBranchAndProductOfProvider(self,user,providerid)
////////////////////////////////////////////////////////
}
var _removeAllBranchAndProductOfProvider=function(self,user,providerid){
	logger.emit("log","_removeAllBranchAndProductOfProvider")
///////////////////////////////////////////////////////////////////////////////////////
_sendNotificationForDeletionOfProductProvider(self,user,providerid);
////////////////////////////////////////////////////////////////////////////////////////
}
var _sendNotificationForDeletionOfProductProvider=function(self,user,providerid){
logger.emit("log","_sendNotificationForDeletionOfProductProvider")
}
var _successfullDeleteProductProvider=function(self){
	self.emit("successfulProductProviderDeletion",{"success":{"message":"Delete Product Provider Successfully"}});
}

ProductProvider.prototype.addProductProviderLogo = function(providerid,user,providerlogo) {
	var self=this;
// console.log("tsssssesddddddddtddddddddddddddddddddd")
	//////////////////////////////
	_validateAddProductProviderLogo(self,providerid,user,providerlogo)
	///////////////////////////
	
};
var _validateAddProductProviderLogo=function(self,providerid,user,providerlogo,providerlogoname){
	if(providerlogo==undefined){
		self.emit("failedAddProductProviderLogo",{"error":{"code":"AV001","message":"Please upload providerlogo"}});
	}else if(providerlogo.originalFilename==""){
		self.emit("failedAddProductProviderLogo",{"error":{"code":"AV001","message":"Please upload providerlogo"}});
	}else if(!S(providerlogo.mimetype).contains("image") ){
		self.emit("failedAddProductProviderLogo",{"error":{"code":"AV001","message":"Please upload only image"}});
	}else{
// console.log("tsssssesddddddddtdd")
		//////////////////////////////////////////////////////////////
	_isAuthorizedUserToAddProductProviderLogo(self,providerid,user,providerlogo,providerlogoname);
	//////////////////////////////////////////////////////////////
	}
}
var _isAuthorizedUserToAddProductProviderLogo=function(self,providerid,user,providerlogo,providerlogoname){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteProductProvider"+err,user.userid)
			self.emit("failedAddProductProviderLogo",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedAddProductProviderLogo",{"error":{"message":"You are not authorized to update Service Proivder Details"}});
		}else{	
			///////////////////////////////////////////////////////////////////
	     	_addProductProviderLogo(providerid,user,providerlogo,function(err,result){
	     		if(err){
	     			self.emit("failedAddProductProviderLogo",err)
	     		}else{
	     			//////////////////////////////
	     			 _updateProductProviderDetails(providerid)
	     			//////////////////////////
	     			self.emit("successfulAddProductProviderLogo",result)
	     		}
	     	});
		    //////////////////////////////////////////////////////////////////
		}
	})
}

ProductProvider.prototype.addBranch = function(branchdata,sessionuser,providerid) {
	var self=this;
	// var branchdata=self.branch;
	//////////////////////////////////////////////////
	_validateBranchData(self,branchdata,sessionuser,providerid);
	//////////////////////////////////////////////
};
var _validateBranchData=function(self,branchdata,sessionuser,providerid){
	var isNumberReg = new RegExp('^[0-9]{1,2}$');
	var reg = /^\(?([0-9]{2})\)?[:]?([0-9]{2})$/; 
	
	if(branchdata==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae pass branchdata"}});
	}else if(branchdata.branchname==undefined || branchdata.branchname==""){
	 	self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae enter branchname"}});
	}else if(branchdata.location==undefined || branchdata.location==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae provide location details"}});
	}else if(branchdata.location.address1==undefined || branchdata.location.address1==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae provide address1 details"}});
	}else if(branchdata.location.address2==undefined || branchdata.location.address2==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae provide address2 details"}})
	}else if(branchdata.location.area==undefined || branchdata.location.area==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae enter area name"}})
	}else if(branchdata.location.city==undefined || branchdata.location.city==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae provide enter city"}})
	}else if(branchdata.location.state==undefined || branchdata.location.state==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae select state"}})
	}else if(branchdata.location.zipcode==undefined || branchdata.location.zipcode==""){
      self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae enter zipcode"}})
	}else if(branchdata.branchcode==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae enter branchcode"}})
	} else if(branchdata.contact_supports==undefined){
      self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pleae pass contact support numbers"}})
	}else if(!isArray(branchdata.contact_supports)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"contact supports should be an array"}})
	} else  if(branchdata.contact_supports.length==0){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please add atleast one contact support number"}})
	} else if(branchdata.delivery==undefined){
	  self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please provide delivery details for your branch"}})		
	}else if(branchdata.delivery.isprovidehomedelivery==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please select you will provide homedeliveryoptions"}})		
	}else if(branchdata.delivery.isprovidepickup==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pickup options should be selected"}})		
	}else if(branchdata.note==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter note "}})		
	}else if(branchdata.delivery.isdeliverychargeinpercent==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please select you provide delivery charge in percent or not "}})		
	}else if(branchdata.branch_availability==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter branch availibility details"}});
	}else if(branchdata.branch_availability.from==undefined || branchdata.branch_availability.from=="" || !isNumeric(branchdata.branch_availability.from)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter valid from time in branch availibility"}});
	}else if(branchdata.branch_availability.to==undefined || !isNumeric(branchdata.branch_availability.to)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter valid to time in branch availibility"}});
	}else if(branchdata.branch_availability.from > branchdata.branch_availability.to){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"branch from time should be less than to time"}});
	}else  if(branchdata.deliverytimingslots==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please select delivery timing slots"}});
	}else  if(!isArray(branchdata.deliverytimingslots)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"deliverytimingslots should be array"}});
	}else{
    	if(branchdata.delivery.isprovidehomedelivery || branchdata.delivery.isprovidepickup){	
          //////////////////////////////////////////////////////////////
		   _isValidProductProvider(self,branchdata,sessionuser,providerid)
		   //////////////////////////////////////////////////////////////	
    	}else{
    		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"You have to select atleast home or pickup option"}})			
    	}
    }  
}
var _validateDeliveryTimingSlotData=function(self,branchdata,sessionuser,providerid){
	logger.emit("log","_validateDeliveryTimingSlotData")
	_isValidProductProvider(self,branchdata,sessionuser,providerid)
}
var _isValidProductProvider=function(self,branchdata,sessionuser,providerid){
	console.log("sessionuser : "+sessionuser.userid+" providerid : "+providerid);
	ProductProviderModel.findOne({"user.userid":sessionuser.userid,providerid:providerid},function(err,productprovider){
		if(err){
			logger.emit("error","Database Error:_isValidServiceProvider"+err,sessionuser.userid);
			self.emit("failedAddBranch",{"error":{"message":"Database Issue"}})
		}else if(!productprovider){
			self.emit("failedAddBranch",{"error":{"message":"providerid is wrong or not authorize "}});
		}else{
			if(productprovider.status == "accept"){
				////////////////////////////////////////////////////
				_checkBranchCodeIsAlreadyExist(self,branchdata,sessionuser,productprovider)
				//////////////////////////////////////////////////
			}else{
				self.emit("failedAddBranch",{"error":{"message":"Your seller account is not yet activated, Please contact OrderZapp support team"}});				
			}
		}
	})
}
var _checkBranchCodeIsAlreadyExist=function(self,branchdata,sessionuser,productprovider){
	ProductProviderModel.findOne({providerid:productprovider.providerid,"branch.branchcode":branchdata.branchcode},function(err,providerbranch){
		if(err){
			logger.emit("error","Database Error:_isValidServiceProvider"+err,sessionuser.userid);
			self.emit("failedAddBranch",{"error":{"message":"Database Issue"}})
		}else if(providerbranch){
			self.emit("failedAddBranch",{"error":{"message":"Branch code already used ,please provider another branchcode"}})
		}else{
			 ///////////////////////////////////////////////////////
			_addBranch(self,branchdata,sessionuser,productprovider);
			//////////////////////////////////////////////////////
		}
	})
}

var _addBranch=function(self,branchdata,sessionuser,productprovider){

	// if(branchdata.delivery_leadtime.format.toLowerCase() == "minutes"){
	// 	branchdata.delivery_leadtime.min = branchdata.delivery_leadtime.time;
	// }else if(branchdata.delivery_leadtime.format.toLowerCase() == "hours"){
	// 	branchdata.delivery_leadtime.min = branchdata.delivery_leadtime.time * 60;
	// }else if(branchdata.delivery_leadtime.format.toLowerCase() == "weeks"){
	// 	branchdata.delivery_leadtime.min = branchdata.delivery_leadtime.time * 7 * 24 * 60;
	// }else if(branchdata.delivery_leadtime.format.toLowerCase() == "days"){
	// 	branchdata.delivery_leadtime.min = branchdata.delivery_leadtime.time * 24 * 60;
	// }else{
	// 	self.emit("failedAddBranch",{"error":{"code":"AV001","message":"delivery leadtime format should be minutes,hours,weeks,days"}});
	// }

	branchdata.branchid=generateId();
	branchdata.status="init";
	branchdata.createdate=new Date();
	ProductProviderModel.update({providerid:productprovider.providerid},{$push:{branch:branchdata}},function(err,providerbranchaddstatus){
		if(err){
			logger.emit("error","Database Error:_addBranch"+err,sessionuser.userid);
			self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Database Issue"}})
		}else if(providerbranchaddstatus==0){
			self.emit("failedAddBranch",{"error":{"code":"ED001","message":"provider id is wrong"}})
		}else{
			/////////////////////////////////////
			_addBranchDetailsToTheUser(self,sessionuser,branchdata,productprovider.providerid)
			////////////////////////////
			////////////////////////////////////////////////////////////////////////
			_addBranchAddressDetailsToPickupAddress(self,sessionuser,branchdata,productprovider);
			////////////////////////////////////////////////////////////////////////
		}
	})
}
var _addBranchDetailsToTheUser=function(self,sessionuser,branch,providerid){
	UserModel.update({userid:sessionuser.userid},{$push:{provider:{providerid:providerid,isOwner:true,branchid:branch.branchid,confirmed:true}}},function(err,userbranchstatus){
		if(err){
			logger.emit("error","Database Error:_addBranchDetailsToTheUser"+err,sessionuser.userid);
			self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Database Issue"}})
		}else if(userbranchstatus==0){
			self.emit("failedAddBranch",{"error":{"message":"Userid is wrong"}})
		}else{
			///////////////////////////
			_addAdminGroupToBranch(self,sessionuser,branch,providerid);
			/////////////////////////////
		}
	})
}
var _addBranchAddressDetailsToPickupAddress=function(self,sessionuser,branch,provider){
	if(provider.pickupaddresses.provide == true){
		branch.location.addressid = "pa"+generateId();
		ProductProviderModel.update({providerid:provider.providerid},{$push:{"pickupaddresses.addresses":branch.location}},function(err,ppupdatestatus){
			if(err){
				logger.emit('error',"Database Issue ,function:_addBranchAddressDetailsToPickupAddress"+err,user.userid)
			}else if(ppupdatestatus==0){
				logger.emit('error',"providerid is wrong");
			}else{
				logger.emit('info',"Branch address added successfully in pickup address");
			}
		})
	}else{
		branch.location.addressid = "pa"+generateId();
		var pickupaddresses = {provide:true,addresses:[branch.location]};
		ProductProviderModel.update({providerid:provider.providerid},{$set:{pickupaddresses:pickupaddresses}},function(err,ppupdatestatus){
			if(err){
				logger.emit('error',"Database Issue ,function:_addBranchAddressDetailsToPickupAddress"+err,user.userid);
			}else if(ppupdatestatus==0){
			    logger.emit('error',"providerid is wrong");
			}else{
				logger.emit('info',"Branch address added successfully in pickup address");
			}
		})
	}
}
var _addAdminGroupToBranch=function(self,sessionuser,branch,providerid){
	  var grpmembers=[];
	  grpmembers.push(sessionuser.userid);
	  var provider_groupdata={providerid:providerid,branchid:branch.branchid,usergrp:[{groupid:generateId(),grpname:"admin",grpmembers:grpmembers,description:"Admin Group"}]};
	  var providergroup=new ProviderGroupModel(provider_groupdata);
	  providergroup.save(function(err,providergroup){
		  if(err){
		  	logger.emit('error',"Database Issue fun:_addAdminGroupToBranch"+err,user.userid);
		  	self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Database Issue"}});		
	  	}else{
	  		//////////////////////////////
	  		// _addBranchCategoryToSearchTags(branch);

	  		////////////////////////////////
	  		/////////////////////////////////
		  	_successfullAddBranch(self);
			  //////////////////////////////////////
	  	}
	  })
}
var _successfullAddBranch=function(self){
	self.emit("successfulAddBranch",{"success":{"message":"Branch Added Successfully"}});
}

ProductProvider.prototype.getAllMyBranches = function(user) {
	var self = this;
	////////////////////////////////////
	_getAllMyBranches(self,user);
	//////////////////////////////////
};

var _getAllMyBranches=function(self,user){
UserModel.aggregate({$match:{userid:user.userid}},{"$unwind":"$provider"},{$group:{_id:"$provider.providerid",branchid:{"$addToSet":"$provider.branchid"}}},{$project:{providerid:"$_id",branchid:1,_id:0}},function(err,userproductproviderbranch){
	if(err){
		logger.emit('error',"Database Issue fun:_getAllMyBranches"+err,user.userid)
		self.emit("failedGetAllMyBranches",{"error":{"code":"ED001","message":"Database Issue"}});		
	}else if(userproductproviderbranch.length==0){
		self.emit("failedGetAllMyBranches",{"error":{"message":"There is no Product provider exists"}});		
	}else{
		console.log("userproductproviderbranch"+userproductproviderbranch);
		var productproviderbranches=[];
		///////////////////////////////////
       _getBranchDetailsByProductProvider(self,user,userproductproviderbranch,0,productproviderbranches);
		///////////////////////////////////
	}
})
}
var _getBranchDetailsByProductProvider=function(self,user,userproductproviderbranch,value,productproviderbranches){
console.log("ddddddd"+JSON.stringify(userproductproviderbranch));
console.log("value"+value);
	if(value<userproductproviderbranch.length){
		ProductProviderModel.findOne({providerid:userproductproviderbranch[value].providerid,status:"accept"},{providerid:1,providername:1,providerlogo:1,providerdescription:1},function(err,productprovider){
			if(err){
			  logger.emit('error',"Database Issue fun:_getBranchDetailsByProductProvider"+err,user.userid)
		      self.emit("failedGetAllMyBranches",{"error":{"code":"ED001","message":"Database Issue"}});			
			}else if(!productprovider){
				console.log("testing 123");
				_getBranchDetailsByProductProvider(self,user,userproductproviderbranch,++value,productproviderbranches);
			}else{
				console.log("abcdetf"+productprovider.providerid);
				ProductProviderModel.find({"provider.providerid":productprovider.providerid,branchid:{$in:userproductproviderbranch[value].branchid}},{productcatalog:0},function(err,spbranch){
					if(err){
						logger.emit('error',"Database Issue fun:_getBranchDetailsByProductProvider"+err,user.userid)
		                self.emit("failedGetAllMyBranches",{"error":{"code":"ED001","message":"Database Issue"}});			
					}else if(spbranch.length==0){
						_getBranchDetailsByProductProvider(self,user,userproductproviderbranch,++value,productproviderbranches);
					}else{

						var productproviderdata={providerid:productprovider.providerid,providername:productprovider.providername,providerlogo:productprovider.providerlogo};
						productproviderdata.branches=spbranch;
						console.log("testing"+productproviderdata);
						productproviderbranches.push(productproviderdata);
						_getBranchDetailsByProductProvider(self,user,userproductproviderbranch,++value,productproviderbranches);
					}
				})
			}
		})
	}else{
		//////////////////////////////////////////////////////////
		_successFullGetAllMyBranches(self,productproviderbranches);
		//////////////////////////////////////////////////////////
	}
}
var _successFullGetAllMyBranches=function(self,productproviderbranches){
	self.emit("successfulGetAllMyBranches",{"success":{"message":"Getting My Branches Successfully","productproviderbranches":productproviderbranches}})
}
ProductProvider.prototype.getAllMyProviders = function(user) {
	var self = this;
	// console.log("testdd")
	////////////////////////////////////
	_checkUserHaveProvider(self,user);
	//////////////////////////////////
};
var _checkUserHaveProvider=function(self,user){
	console.log("tesddddtdd")
	UserModel.findOne({userid:user.userid},{provider:1},function(err,userprovider){
		if(err){
			logger.emit('error',"Database Issue fun:_getAllMyProviders"+err,user.userid)
		  self.emit("failedGetAllMyProviders",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(!userprovider){
			self.emit("failedGetAllMyProviders",{"error":{"message":"userid is wrong"}});			
		}else{
			var provider=userprovider.provider;
			var providergroup=__.groupBy(provider,"providerid");
  	  var providerarray=[];
  		for (providerid in providergroup ) {
    		providerarray.push(providerid)
  		}
  			// console.log("tsssssesddddddddtdd")
  		////////////////////////////////////////
  		_getAllMyProviders(self,providerarray);
  		/////////////////////////////////

		}
	})
}
var _getAllMyProviders=function(self,providerarray){
    console.log("providerarray"+providerarray)
	ProductProviderModel.find({providerid:{$in:providerarray}},{_id:0,providerid:1,providerlogo:1,providername:1,providercode:1,status:1,provideremail:1,providerbrandname:1,providerdescription:1,category:1,deliverytimingsinstructions:1,tax:1,paymentmode:1,orderprocess_configuration:1},function(err,providers){
		if(err){
			logger.emit('error',"Database Issue fun:_getAllMyProviders"+err)
		  self.emit("failedGetAllMyProviders",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(providers.length==0){
			self.emit("failedGetAllMyProviders",{"error":{"code":"PP001","message":"No provider associated with your account,please add atleast one provider"}});		
		}else{
			providers=JSON.stringify(providers);
				providers=JSON.parse(providers);
			// console.log("tssss55555555555555sesddddddddtdd")
			var actionstatus={accepted:"accept",cancelled:"cancel",rejected:"reject",inproduction:"production",factorytostore:"shiptostore",packing:"pack",indelivery:"deliver",storepickup:"pickfromstore",ordercomplete:"done"};
			for(var i=0;i<providers.length;i++){
					var orderprocess_configuration=providers[i].orderprocess_configuration;
					var givenindexes=[];
					var sequenceorderprocess_configuration=[];
					var negetive_order_process_configuration=[];
          for(var j=0;j<orderprocess_configuration.length;j++){
          	if(orderprocess_configuration[j].index>0){
          		givenindexes.push(orderprocess_configuration[j].index);
          		sequenceorderprocess_configuration.push(orderprocess_configuration[j])
          	}else{
          		negetive_order_process_configuration.push(orderprocess_configuration[j])
          	}
          }
          var positiveindex_orderprocess=[];
          var sortedindex=__.sortBy(givenindexes);
					for(var k=0;k<sortedindex.length;k++){
						if(givenindexes.indexOf(sortedindex[k])>=0){
							positiveindex_orderprocess.push(sequenceorderprocess_configuration[givenindexes.indexOf(sortedindex[k])])
						}
					}
					var final_order_processconfiguration=[]
					for(var k=0;k<positiveindex_orderprocess.length;k++){
		  			var indexvalue=k+1;
						var order_configprocess={index:indexvalue,order_status:positiveindex_orderprocess[k].order_status};
						if(k==(positiveindex_orderprocess.length-1)){
							order_configprocess.action=null;
						}else{
							order_configprocess.action=actionstatus[positiveindex_orderprocess[indexvalue].order_status]
						}
						final_order_processconfiguration.push(order_configprocess)
					}
					for(var l=0;l<negetive_order_process_configuration.length;l++){
						final_order_processconfiguration.push({index:negetive_order_process_configuration[l].index,order_status:negetive_order_process_configuration[l].order_status,action:null})
					}
			
			
				// console.log("valid_order_process_configuration"+JSON.stringify(valid_order_process_configuration))
				providers[i].orderprocess_configuration=final_order_processconfiguration;	
			}
			
			///////////////////////////////////////
			_successfullGetAllMyProvider(self,providers);
			/////////////////////////////////////
		}
	})
}
var _successfullGetAllMyProvider=function(self,providers){
	self.emit("successfulGetAllMyProviders",{success:{message:"Getting my provider details successfully","providers":providers}})
}
ProductProvider.prototype.getAllMyProviderBranches = function(user,providerid) {
	var self = this;
	////////////////////////////////////
	_checkUserHaveProviderBranches(self,user,providerid);
	//////////////////////////////////
};
var _checkUserHaveProviderBranches=function(self,user,providerid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid},{provider:1},function(err,userprovider){
		if(err){
			logger.emit('error',"Database Issue fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedGetAllMyProviderBranches",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(!userprovider){
			self.emit("failedGetAllMyProviderBranches",{"error":{"message":"User does not belong to provider"}});			
		}else{
			
  		////////////////////////////////////////
  		_getAllMyProviderBranches(self,providerid);
  		/////////////////////////////////

		}
	})
}
var _getAllMyProviderBranches=function(self,providerid){
	// db.productproviders.aggregate({$unwind:"$branch"},{$project:{branchname:"$branch.branchname",branchid:"$branch.branchid",_id:0}});
	ProductProviderModel.aggregate({$match:{providerid:providerid,"branch.status":{$ne:"deactive"}}},{"$unwind":"$branch"},{$project:{branchname:"$branch.branchname",branchid:"$branch.branchid",branchdescription:"$branch.branchdescription",location:"$branch.location",giftwrapper:"$branch.giftwrapper",delivery:"$branch.delivery",branch_images:"$branch.branch_images",branch_availability:"$branch.branch_availability",delivery_leadtime:"$branch.delivery_leadtime",branchcode:"$branch.branchcode",status:"$branch.status",_id:0,contact_supports:"$branch.contact_supports",note:"$branch.note"}},function(err,providers){
		if(err){
			logger.emit('error',"Database Issue fun:_getAllMyProviders"+err,user.userid)
		  self.emit("failedGetAllMyProviderBranches",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(providers.length==0){
			ProductProviderModel.findOne({providerid:providerid,status:{$ne:"deactive"}},{providername:1},function(err,providername){
				if(err){
					logger.emit('error',"Database Issue fun:_getAllMyProviderBranches"+err,user.userid)
				  self.emit("failedGetAllMyProviderBranches",{"error":{"code":"ED001","message":"Database Issue"}});			
				}else if(!providername){
					self.emit("failedGetAllMyProviderBranches",{"error":{"message":"provider not exist"}});			
				}else{
					console.log("providername : "+JSON.stringify(providername));				
		  			self.emit("failedGetAllMyProviderBranches",{"error":{"code":"PB001","message":"No branch exists for "+providername.providername+", please add atleast one branch"}});		
				}
			})			
		}else{		  
			///////////////////////////////////////
			_successfullGetAllMyProviderBranch(self,providers);
			/////////////////////////////////////
		}
	})
}
var _successfullGetAllMyProviderBranch=function(self,providers){
	self.emit("successfulGetAllMyProviderBranches",{success:{message:"Getting my Provider Branches details successfully","branches":providers}})
}

ProductProvider.prototype.getBranch = function(providerid,branchid) {
	var self = this;
	////////////////////////////////////////////////////////
	_getBranch(self,providerid,branchid);
	////////////////////////////////////////////////////////
};
var _getBranch=function(self,providerid,branchid){
	ProductProviderModel.aggregate({$match:{providerid:providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$project:{branchid:"$branch.branchid",branchname:"$branch.branchname",location:"$branch.location",branch_images:"$branch.branch_images",branch_availibility:"$branch.branch_availibility",delivery_leadtime:"$branch.delivery_leadtime"}},function(err,branch){
		if(err){
			logger.emit('error',"Database Issue fun:_getBranch"+err,user.userid)
		  self.emit("failedGetBranch",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(branch.length==0){
			self.emit("failedGetBranch",{"error":{"message":"Branch not exists"}});			
		}else{
			////////////////////////////////////
			_successfullGetBranch(self,branch[0])
			///////////////////////////////////
		}
	})
}
var _successfullGetBranch=function(self,branch){
self.emit("successfulGetBranch",{success:{message:"Get Branch details successfully",branch:branch}})
}
ProductProvider.prototype.deleteBranch = function(user,providerid,branchid) {
	var self = this;
	/////////////////////////////////////////////////////////////
	_isAuthorizedUserToDeleteBranch(self,user,providerid,branchid)
	////////////////////////////////////////////////////////////
	
};
var _isAuthorizedUserToDeleteBranch=function(self,user,providerid,branchid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedDeleteBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedDeleteBranch",{"error":{"message":"You are not authorized to update Service Proivder Details"}});
		}else{
			////////////////////////////////////////////////////////
	        _deleteBranch(self,providerid,branchid);
	        ////////////////////////////////////////////////////////
		}
	})
}
var _deleteBranch=function(self,providerid,branchid){
	ProductProviderModel.update({providerid:providerid,"branch.branchid":branchid,"branch.status":"active"},{$set:{"branch.$.status":"deactive"}},function(err,branchdeletestatus){
		if(err){
			logger.emit('error',"Database Issue fun:_deleteBranch"+err,user.userid)
		  self.emit("failedDeleteBranch",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(branchdeletestatus==0){
			self.emit("failedDeleteBranch",{"error":{"message":"Branch already deleted"}});			
		}else{
			////////////////////////////////////
			_successfullDeleteBranch(self)
			///////////////////////////////////
		}
	})
}
var _successfullDeleteBranch=function(self,branch){
	self.emit("successfulDeleteBranch",{success:{message:"Branch deleted successfully",branch:branch}})
}

ProductProvider.prototype.updateBranch = function(user,providerid,branchid,branchdata) {
	var self = this;
	///////////////////////////////////////
	_validateUpdateBranchData(self,user,providerid,branchid,branchdata)
	////////////////////////////////////////	
};
var _validateUpdateBranchData=function(self,user,providerid,branchid,branchdata){
	if(branchdata==undefined){
		self.emit("failedUpdateBranch",{"error":{code:"AV001",message:"Please provide branchdata"}});
	}else if(branchdata.status!=undefined || branchdata.usergrp!=undefined || branchdata.branch_images!=undefined ){
		self.emit("failedUpdateBranch",{"error":{code:"AV001",message:"You can not change these details of branch"}});
	}else{
		if(branchdata.delivery==undefined){
			/////////////////////////////////////////////////////////////
	   		_isAuthorizedUserToUpdateBranch(self,user,providerid,branchid,branchdata)
	    	////////////////////////////////////////////////////////////
		}else{
			if(branchdata.delivery.isprovidehomedelivery || branchdata.delivery.isprovidepickup){
				/////////////////////////////////////////////////////////////
	      _isAuthorizedUserToUpdateBranch(self,user,providerid,branchid,branchdata)
	      ////////////////////////////////////////////////////////////
			}else{
				self.emit("failedUpdateBranch",{"error":{code:"AV001",message:"You have to select atleast home or pickup"}});
			}
		}
	
	}
}
var _isAuthorizedUserToUpdateBranch=function(self,user,providerid,branchid,branchdata){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedUpdateBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedUpdateBranch",{"error":{"message":"You are not authorized to update Service Proivder Details"}});
		}else{
			////////////////////////////////////////////////////////
	        _updateBranch(self,providerid,branchid,branchdata);
	        ////////////////////////////////////////////////////////
		}
	})
}
var _updateBranch=function(self,providerid,branchid,branchdata){
	var branch_object={};
	  for (k in branchdata ) {
    	branch_object["branch.$."+k]=branchdata[k];
    }
    //if he only select pickup then deliverycharges set to be empty
    if(branchdata.delivery.isprovidehomedelivery==false){
    	branch_object["branch.$.deliverycharge"]=[];
    }
    logger.emit("log","test"+JSON.stringify(branch_object));
	  ProductProviderModel.update({providerid:providerid,"branch.branchid":branchid},{$set:branch_object},function(err,branchupdatestatus){
			if(err){
				logger.emit('error',"Database Issue fun:_updateBranch"+err,user.userid)
			  self.emit("failedUpdateBranch",{"error":{"code":"ED001","message":"Database Issue"}});			
			}else if(branchupdatestatus==0){
				self.emit("failedUpdateBranch",{"error":{"message":"Branch not exists"}});			
			}else{

			/////////////////////////////////
			_updateBranchProductsDetails(branchid)
			//////////////////////////////
			////////////////////////////////////
			_successfullUpdateBranch(self)
			///////////////////////////////////
		}
	})
}
var _successfullUpdateBranch=function(self){
self.emit("successfulUpdateBranch",{success:{message:"Branch Updated successfully"}})
}
ProductProvider.prototype.addGroupToBranch = function(sessionuser,providerid,branchid,groupdata) {
	var self=this;
	
	///////////////////////////////////////////////////////////////////////
	_validateBranchGroupData(self,sessionuser,providerid,branchid,groupdata);
	//////////////////////////////////////////////////////////////////////
};
var _validateBranchGroupData=function(self,sessionuser,providerid,branchid,groupdata){
	if(groupdata==undefined){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please provide groupdata"}});
	}else if(groupdata.grpname==undefined || groupdata.grpname==""){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please enter groupname"}});
	}else if(groupdata.description==undefined || groupdata.description==""){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please enter groupdescription"}});
	}else{
		///////////////////////////////////////////////////
		_isAuthorizedUserToAddNewGroup(self,sessionuser,providerid,branchid,groupdata)
		//////////////////////////////////////////////////
	}
}
var _isAuthorizedUserToAddNewGroup=function(self,sessionuser,providerid,branchid,groupdata){
	UserModel.aggregate({"$unwind":"$provider"},{$match:{userid:sessionuser.userid,"provider.providerid":providerid,"provider.branchid":branchid}},function(err,userproductprovider){
			if(err){
				logger.emit("error","Database Issue: _isAuthorizedUserToAddNewGroup"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Issue"}});
			}else if(userproductprovider.length==0){
				self.emit("failedAddGroupToBranch",{"error":{"message":"User not belongs to Product Provider branch"}});
			}else{
				 if(userproductprovider[0].provider.isOwner!=true){
				 	 self.emit("failedAddGroupToBranch",{"error":{"message":"You are not owner of ProductProvider to add new group"}});
				 }else{
				 	///////////////////////////////////////////////////////////////////////////
				 	_checkGroupNameAlreadyExist(self,sessionuser,providerid,branchid,groupdata);
				 	/////////////////////////////////////////////////////////////////////////
				 }
			}
			
		})
	}
	var _checkGroupNameAlreadyExist=function(self,sessionuser,providerid,branchid,groupdata){
		ProductProviderModel.aggregate({$match:{providerid:providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid,"branch.usergrp":{$elemMatch:{grpname:groupdata.grpname.toLowerCase()}}}},function(err,providergroups){
			if(err){
				logger.emit("error","Database Issue: _checkGroupNameAlreadyExist"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Issue"}});
			}else if(providergroups.length!=0){
				self.emit("failedAddGroupToBranch",{"error":{"message":"Group name already exists"}});
			}else{	
				/////////////////////////////////////////////////////////////////
				_addGroupToBranch(self,sessionuser,providerid,branchid,groupdata);
				/////////////////////////////////////////////////////////////////
			}
		})
	}
	var _addGroupToBranch=function(self,sessionuser,providerid,branchid,groupdata){
		groupdata.grpname=groupdata.grpname.toLowerCase();
		groupdata.groupid=generateId();
		ProductProviderModel.update({providerid:providerid,"branch.branchid":branchid},{$push:{"branch.$.usergrp":groupdata}},function(err,grpaddstatus){
			if(err){
				logger.emit("error","Database Issue: _checkGroupNameAlreadyExist"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Issue"}});
			}else if(grpaddstatus==0){
				self.emit("failedAddGroupToBranch",{"error":{"message":"Branch id is wrong"}});
			}else{
				///////////////////////////////////////
				_successfullGroupAddToBranch(self)
				//////////////////////////////////////
			}
		})
	}
	var _successfullGroupAddToBranch=function(self){
		self.emit("successfulAddGroupToBranch",{success:{message:"New group added to the branch"}});
	}
ProductProvider.prototype.removeGroupFromBranch = function(sessionuser,branchid,groupid) {
	var self=this;
	/////////////////////////////////////////////////////////////////
	_isAuthorizeUserToRemoveGroup(self,sessionuser,branchid,groupid)
	////////////////////////////////////////////////////////////////

};
var _isAuthorizeUserToRemoveGroup=function(self,sessionuser,branchid,groupid){
	UserModel.aggregate({"$unwind":"$provider"},{$match:{userid:sessionuser.userid,"provider.branchid":branchid}},function(err,userproductprovider){
		if(err){
			logger.emit("error","Database Issue: _isAuthorizedUserToAddNewGroup"+err);
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"Database Issue"}});
		}else if(userproductprovider.length==0){
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"User not belongs to Product Provider branch"}});
		}else{
		  if(userproductprovider[0].provider.isOwner!=true){
			 	self.emit("failedAddGroupToBranch",{"error":{"message":"You are not owner of ProductProvider to remove group"}});
			}else{
			 /////////////////////////////////////////////
			 _removeGroupFromBranch(self,branchid,groupid)
			 ///////////////////////////////////////////
			}
		}
	})
}
var _removeGroupFromBranch=function(self,branchid,groupid){
	ProductProviderModel.findOne({"branch.branchid":branchid,"branch.usergrp.groupid":groupid},{providerid:1},function(err,usergrup){
		if(err){
			logger.emit("error","Database Issue: _removeGroupFromBranch"+err);
			self.emit("failedRemoveGroupFromBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usergrup){
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"groupid is wrong"}});
		}else{
			ProductProviderModel.update({"branch.branchid":branchid},{$pull:{"branch.$.usergrp":{groupid:groupid}}},function(err,groupremovestatus){
				if(err){
					logger.emit("error","Database Issue: _removeGroupFromBranch"+err);
					self.emit("failedRemoveGroupFromBranch",{"error":{"code":"ED001","message":"Database Issue"}});
				}else if(groupremovestatus==0){
					self.emit("failedRemoveGroupFromBranch",{"error":{"message":"branchid is wrong"}});
				}else{
					///////////////////////////////////////
					_successfullRemoveGroupFromBranch(self)
					///////////////////////////////////////
				}
			})
		}
	})
}
ProductProvider.prototype.addMembersToGroup = function(sessionuser,branchid,groupid,invites){
	var self=this;
	////////////////////////////////////////////////////////////////////////
	_validateGroupMemberData(self,sessionuser,branchid,groupid,invites)
	////////////////////////////////////////////////////////////////////////

};
var _validateGroupMemberData=function(self,sessionuser,branchid,groupid,invites){
	if(invites==undefined){
		self.emit("failedAddMembersToGroup",{error:{message:"please provides invites data"}})
	}else if(invites.grpname==undefined || invites.grpname==""){
		self.emit("failedAddMembersToGroup",{error:{message:"please provides group name"}})
	}else if(!isArray(invites.members)){
		self.emit("failedAddMembersToGroup",{error:{message:"invites should be an array"}})
	}else if(invites.members.length==0){
		self.emit("failedAddMembersToGroup",{error:{message:"please enter atleast one member"}})
	}else{
		console.log("invites"+JSON.stringify(invites));
		////////////////////////////////////////////////////////////////////////////
		_isAuthoRizedUserToAddGroupMember(self,sessionuser,branchid,groupid,invites)
		//////////////////////////////////////////////////////////////////////////
	}
}
var _isAuthoRizedUserToAddGroupMember=function(self,sessionuser,branchid,groupid,invites){
	UserModel.aggregate({"$unwind":"$provider"},{$match:{userid:sessionuser.userid,"provider.branchid":branchid}},function(err,userproductprovider){
		if(err){
			logger.emit("error","Database Issue: _isAuthorizedUserToAddNewGroup"+err);
			self.emit("failedAddMembersToGroup",{"error":{"message":"Database Issue"}});
		}else if(userproductprovider.length==0){
			self.emit("failedAddMembersToGroup",{"error":{"message":"User not belongs to Product Provider branch"}});
		}else{
		  if(userproductprovider[0].provider.isOwner!=true){
			 	self.emit("failedAddMembersToGroup",{"error":{"message":"You are not owner of ProductProvider to add members to group"}});
			}else{
				ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$project:{branchid:"$branch.branchid",branchname:"$branch.branchname",providerid:1,usergrp:"$branch.usergrp"}},function(err,providerbranch){
					if(err){
						logger.emit("error","Database Issue: _isAuthorizedUserToAddNewGroup"+err);
		      	self.emit("failedAddMembersToGroup",{"error":{"message":"Database Issue"}});
					}else if(providerbranch.length==0){
						self.emit("failedAddMembersToGroup",{"error":{"message":"Branch does not exist"}});
					}else{
						console.log("test1");
						var branch=providerbranch[0];
						/////////////////////////////////////////////////////////////////
						_addUserGrpDetailsToServiceBranch(self,branch,sessionuser,invites.members,invites.grpname,groupid)
						////////////////////////////////////////////////////////////////
					}
				})
			 
			}
		}
	})
}
var _addUserGrpDetailsToServiceBranch=function(self,branch,sessionuser,members,grpname,groupid){
	// var members=usergrp.members;
	console.log("members"+members);
  var userinvites=[];
	console.log("memberdetails"+JSON.stringify(members));
	for(var i=0;i<members.length;i++){
		if( S(members[i]).isNumeric() && members[i].length==10 || members[i].length==12){
			if(members[i].length==10){
				members[i]="91"+members[i];
				userinvites.push(members[i]);
			}else{
				userinvites.push(members[i]);
			}
		}
	}

	userinvites=__.unique(userinvites);
	
	UserModel.find({mobileno:{$in:userinvites}},{mobileno:1,username:1}).lean().exec(function(err,user){
    if(err){
    	logger.emit("error","Database Issue,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
	  	self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
    }else{
    	var existingusers=[];
    	 var existingmobileno=[];
      for(var i=0;i<user.length;i++)
      {
        existingmobileno.push(user[i].mobileno);
      }
      for(var i=0;i<user.length;i++){
      	existingusers.push({mobileno:user[i].mobileno,firstname:user[i].firstname});
      }

      var newusers=[];
      for(var i=0;i<userinvites.length;i++){
      	if(existingmobileno.indexOf(userinvites[i])<0){
      		newusers.push({mobileno:userinvites[i]});
      	}
      }
      console.log("newusers"+JSON.stringify(newusers));
      // newusers=__.difference(userinvites,existingusers);
      // console.log("newusers"+JSON.stringify(newusers));
      if(newusers.length>0){
      	var userdata=[];
      	for(var i=0;i<newusers.length;i++)
     		{
			    userdata.push({mobileno:newusers[i].mobileno,password:Math.floor(Math.random()*1000000),hhusertype:"provider",provider:[{providerid:branch.providerid,branchid:branch.branchid,isOwner:false,confirmed:false}]});
      	}
      	console.log("userdata"+JSON.stringify(userdata));
        UserModel.create(userdata,function(err,grpusers){
          if(err){
          	logger.emit("error","Database Issue:fun/_addUserGrpDetailsToServiceProvider"+err)
            self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
          }else if(grpusers){
          	/////////////////////////////////////////////////
            _sendSMSToInvitees(self,branch,grpname,existingusers,userdata,sessionuser,groupid);
            /////////////////////////////////////////////////
          }
        })
      }else{//if the provided mobile number is already registered with prodonus
      /////////////////////////////////////////////////////////////
     	 _sendSMSToInvitees(self,branch,grpname,existingusers,newusers,sessionuser,groupid);
     	////////////////////////////////////////////////////////////
	    }
	  }
  })
}
var _sendSMSToInvitees = function(self,branch,grpname,existingusers,newusers,user,groupid){
		// self.emit("abc",{"message":"test"});
		SMSTemplateModel.findOne({name:"serviceprovidermemberinvite"}).lean().exec(function(err,nespusertemplate){
	  	if(err){
	  		logger.emit("error","Database Issue :fun-_sendSMSToInvitees")
	    	self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
	  	}else if(nespusertemplate){
	  		SMSTemplateModel.findOne({name:"serviceprovidermemberonlyinvite"}).lean().exec(function(err,spusertemplate){
	  			if(err){
	    			 self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Error in db to find invite email templates"}});
	  			}else if(spusertemplate){
	  				for(var i=0;i<newusers.length;i++){
	                 self.emit("sendinvitetospnewuser",newusers[i],nespusertemplate,branch,grpname);
	                }
         		for(var j=0;j<existingusers.length;j++)
                {
            	   self.emit("sendinvitetospuser",existingusers[i],spusertemplate,branch,grpname);
                  }
	            ///////////////////////////////////////
	             _addBranchMembersToUserGroupOther(self,existingusers,newusers,branch,groupid);
	            /////////////////////////////
	            //////////////////////////////////////////////////////////
	           // _addProviderProviderBranchDetailsToTheUser(self,branch,user);
	           //////////////////////////////////////////////////////
	    	}else{
	  				self.emit("failedAddMembersToGroup",{"error":{"code":"ED002","message":"Server setup template issue"}});
	  		}
			})//end of orgmemberonlyinvite
		}else{
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED002","message":"Server setup template issue"}});		
		}
	})
}
var _addProviderProviderBranchDetailsToTheUser=function(self,branch,user){
	// console.log("userid"+user.userid);
	UserModel.update({userid:user.userid},{$push:{provider:{providerid:branch.providerid,branch:branch.branchid,isOwner:false,confirmed:false}}},function(err,providerupdatestatus){
	  if(err){
	 		logger.emit("error","Database Issue,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
	  }else if(providerupdatestatus==0){
	   	self.emit("failedAddMembersToGroup",{"error":{"message":"Userid is wrong"}});
	  }else{
	   logger.emit("info","Added ProductProviderBranch Details To The User")
	  }
	})
}
var _addBranchMembersToUserGroupOther=function(self,existingusers,newusers,branch,groupid){
	var mobilenos=[];

	for(var i=0;i<existingusers.length;i++){
		mobilenos.push(existingusers[i].mobileno)
	}
	for(var i=0;i<newusers.length;i++){
		mobilenos.push(newusers[i].mobileno)	
	}
	console.log("mobidddddddddddlenos"+mobilenos)
	UserModel.find({mobileno:{$in:mobilenos}},function(err,users){
		if(err){
			logger.emit("error","Database Issue _addProductProviderMembersToUserGroupOther"+err);
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(users.length==0){
    	logger.emit("log","No users find");
		}else{
			var grpmembers=[];
			for(var i=0;i<users.length;i++){
				grpmembers.push(users[i].userid);
			}
			ProductProviderModel.update({"branch.branchid":branch.branchid,"branch.usergrp.groupid":groupid},{$addToSet:{"branch.$.usergrp.$.grpmembers":{$each:grpmembers}}},function(err,addgrpstats){
				if(err){
					logger.emit("error","Database Issue _addProviderMembersToUserGroupOther"+err);
					self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
				}else if(addgrpstats==1){
					// logger.emit("error","userinvte not added to the serviceproviderlist");
				}else{
					BranchModel.update({branchid:branch.branchid},{$push:{usergrp:{grpname:grpname,grpmembers:grpmembers}}},function(err,newgrpaddstatus){
		   				if(err){
		   					logger.emit("error","Database :_addBranchMembersToUserGroupOther:"+err)
		   					self.emit("failedAddEmployee",{"error":{"code":"ED001","message":"Database Issue"}});
		   				}else if(newgrpaddstatus==0){
		   					self.emit("failedAddEmployee",{"error":{"code":"AO002","message":"function:_AddUserIntoOrgGroup\nOrgid is Wrong"}});
		   				}else{	
						///////////////////////////////////////
		   				_succesfullAddEmployee(self);
		   				//////////////////////////////////////	
		   				}
		   			})
				}
			})
		}
	})
}


ProductProvider.prototype.publishUnpublishBranch = function(user,providerid,branchid,action) {
	var self = this;
	///////////////////////////////////////
	_validatePublishAndUnpublishBranchData(self,user,providerid,branchid,action)
	/////////////////////////////////////	
};
var _validatePublishAndUnpublishBranchData=function(self,user,providerid,branchid,action){
	if(action==undefined){
		self.emit("failedPublishUnpublishBranch",{"error":{code:"AV001",message:"Please pass which action should be perform"}});
	}else if(["publish","unpublish"].indexOf(action)<0){
		self.emit("failedPublishUnpublishBranch",{"error":{code:"AV001",message:"action should be publish or unpublish"}});
	}else{
		/////////////////////////////////////////////////////////////
	_isAuthorizedUserToPublishUnpublishBranch(self,user,providerid,branchid,action)
	////////////////////////////////////////////////////////////
	}
}
var _isAuthorizedUserToPublishUnpublishBranch=function(self,user,providerid,branchid,action){
	console.log("##################################");
	console.log("user.userid : "+user.userid+" providerid : "+providerid+" branchid : "+branchid);
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"You are not authorized to "+action+" branch"}});
		}else{
			////////////////////////////////////////////////////////
	        _isAuthorizedProviderToPublishUnpublishBranch(self,providerid,branchid,action);
	        ////////////////////////////////////////////////////////
		}
	})
}
var _isAuthorizedProviderToPublishUnpublishBranch=function(self,providerid,branchid,action){
	ProductProviderModel.findOne({providerid:providerid},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedProviderToPublishUnpublishBranch"+err,user.userid);
			self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!provider){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"providerid is wrong"}});
		}else{
			console.log("provider : "+JSON.stringify(provider));
			if(provider.status=="init"){
				self.emit("failedPublishUnpublishBranch",{"error":{"message":"You are not able to "+action+" branch until provider was publish"}});
			}else if(provider.status=="accept"){
				////////////////////////////////////////////////////////
		        _publishUnpublishBranch(self,providerid,branchid,action);
		        ////////////////////////////////////////////////////////
			}else{
				self.emit("failedPublishUnpublishBranch",{"error":{"message":"Provider not published please contact to admin person"}});
			}
		}
	})
}
var _publishUnpublishBranch=function(self,providerid,branchid,action){
	ProductProviderModel.aggregate({$match:{providerid:providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid,"branch.status":{$ne:"deactive"}}},function(err,branch){
		if(err){
				logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(branch.length==0){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"branchid or providerid is wrong"}});
		}else{
			var providerbranch=branch[0].branch;
			if(action=="publish"){
				if(action==providerbranch.status){
					self.emit("failedPublishUnpublishBranch",{"error":{"message":"Branch already published"}});
				}else{
					////////////////////////////////////////
					_publishAndUnpublishBranch(self,providerid,branchid,action)
					//////////////////////////////////////
				}
			}else{
				if(action==providerbranch.status){
					self.emit("failedPublishUnpublishBranch",{"error":{"message":"Branch already unpublished"}});
				}else{
					///////////////////////////////////////////////////////////
					_publishAndUnpublishBranch(self,providerid,branchid,action)
					/////////////////////////////////////////////////////////
				}
			}
		}
	})
}
var _publishAndUnpublishBranch=function(self,providerid,branchid,action){
  	ProductProviderModel.update({providerid:providerid,"branch.branchid":branchid},{$set:{"branch.$.status":action}},function(err,branchupdatestatus){
		if(err){
			logger.emit('error',"Database Issue fun:_publishAndUnpublishBranch"+err,user.userid);
		  self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(branchupdatestatus==0){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"Branch not exists"}});			
		}else{
			////////////////////////////////////////////////////////////////////////
			_publishAndUnpublishAllProductsOfBranch(self,providerid,branchid,action);
			////////////////////////////////////////////////////////////////////////
		}
	})
}
var _publishAndUnpublishAllProductsOfBranch=function(self,providerid,branchid,action){
  	ProductCatalogModel.update({"branch.branchid":branchid},{$set:{status:action}},function(err,productupdatestatus){
		if(err){
			logger.emit('error',"Database Issue fun:_publishAndUnpublishAllProductsOfBranch"+err,user.userid);
		  self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(productupdatestatus==0){
			// self.emit("failedPublishUnpublishBranch",{"error":{"message":"Product not exists"}});
			///////////////////////////////////////////////////
			_successfullPublishAndUnpublishBranch(self,action);
			///////////////////////////////////////////////////
		}else{
			//////////////////////////////////////////////////
			_successfullPublishAndUnpublishBranchProducts(self,action);
			//////////////////////////////////////////////////
		}
	})
}
var _successfullPublishAndUnpublishBranch=function(self,action){
  self.emit("successfulPublishUnpublishBranch",{success:{message:"Branch "+action+"ed successfully",status:action}});
}
var _successfullPublishAndUnpublishBranchProducts=function(self,action){
  self.emit("successfulPublishUnpublishBranch",{success:{message:"Branch and their products "+action+"ed successfully",status:action}});
}

ProductProvider.prototype.getAllNewProductProviders = function(user) {
	var self = this;
	//////////////////////////////////////
	_getAllNewProductProviders(self,user);
	//////////////////////////////////////
};
var _getAllNewProductProviders = function(self,user){
	ProductProviderModel.find({status:{$in:["init","reject"]}},{providerid:1,providername:1,providerdescription:1,user:1,providerlogo:1,status:1,_id:0},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _getAllNewProductProviders "+err,user.userid);
			self.emit("failedGetAllNewProviders",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(provider.length==0){
			self.emit("failedGetAllNewProviders",{"error":{"message":"New provider not exist"}});
		}else{
			_successfulGetAllNewProviders(self,provider);
		}
	})
}
var _successfulGetAllNewProviders=function(self,provider){
  self.emit("successfulGetAllNewProviders",{success:{message:"Getting New Providers Successfully",provider:provider}});
}

ProductProvider.prototype.manageDeliveryCharges = function(userid,branchid,deliverychargedata) {
	var self = this;
	////////////////////////////////////////
	_validateDeliveryChargeData(self,userid,branchid,deliverychargedata);
	////////////////////////////////////////
};
var _validateDeliveryChargeData=function(self,userid,branchid,deliverychargedata){
	if(deliverychargedata==undefined){
		self.emit("failedManageDeliveryCharges",{error:{code:"AV001",message:"Please provide deliverychargedata"}})
	}else if( !isArray(deliverychargedata)){
		self.emit("failedManageDeliveryCharges",{error:{code:"AV001",message:"deliverychargedata should be JSON Array"}})	
	}else if( deliverychargedata.length<=0){
		self.emit("failedManageDeliveryCharges",{error:{code:"AV001",message:"deliverychargedata should not be empty"}})	
	}else{
		////////////////////////////////////////
		_isAuthorizedUserAddDeliveryCharges(self,userid,branchid,deliverychargedata)
		///////////////////////////////////////
	}
}
var _isAuthorizedUserAddDeliveryCharges=function(self,userid,branchid,deliverychargedata){
	
	UserModel.findOne({userid:userid,"provider.branchid":branchid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedManageDeliveryCharges",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedManageDeliveryCharges",{"error":{"message":"You are not authorized to manage delivery charges"}});
		}else{
			/////////////////////////////////////////
			_checkValueInPercentOrAmount(self,userid,branchid,deliverychargedata)
			//////////////////////////////////////
		}
	})
}
var _checkValueInPercentOrAmount=function(self,userid,branchid,deliverychargedata){
	ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},function(err,branch){
		if(err){
			logger.emit('error',"Database Issue  _checkValueInPercentOrAmount"+err,userid)
			self.emit("failedManageDeliveryCharges",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(branch.length==0){
			self.emit("failedManageDeliveryCharges",{"error":{"message":"branchid is wrong"}});
		}else{
			logger.emit("log","braddddnch"+JSON.stringify(branch[0]))
			branch=branch[0].branch;
			var isdeliverychargeinpercent=branch.delivery.isdeliverychargeinpercent;
			////////////////////////////////////////////
			_checkDeliveryChargeData(self,userid,branchid,deliverychargedata,isdeliverychargeinpercent)
			//////////////////////////////////////////
		}
	})
}
var _checkDeliveryChargeData=function(self,userid,branchid,deliverychargedata,isdeliverychargeinpercent){
	var validated_data=[];
	var coveragearray=[];
	for(var i=0;i<deliverychargedata.length;i++){
		if(deliverychargedata[i].value!=undefined && S(deliverychargedata[i].value).isNumeric() && deliverychargedata[i].coverage.area!=undefined && deliverychargedata[i].coverage.city!=undefined  && deliverychargedata[i].coverage.zipcode!=undefined){
				validated_data.push({value:deliverychargedata[i].value,coverage:{area:deliverychargedata[i].coverage.area.toLowerCase(),city:deliverychargedata[i].coverage.city.toLowerCase(),zipcode:deliverychargedata[i].coverage.zipcode}})
				coveragearray.push({area:deliverychargedata[i].coverage.area.toLowerCase(),city:deliverychargedata[i].coverage.city.toLowerCase(),zipcode:deliverychargedata[i].coverage.zipcode})
		}
	}
	if(validated_data.length==0){
		self.emit("failedManageDeliveryCharges",{"error":{"message":"Please pass valid deliverychargedata"}});
	}else{
		/////////////////////////////////
		_checkDeliveryChargesAlreadyApplied(self,userid,branchid,validated_data,coveragearray)
		////////////////////////////////
	}
}
var _checkDeliveryChargesAlreadyApplied=function(self,userid,branchid,validated_data,coveragearray){
	ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$unwind:"$branch.deliverycharge"},{$match:{"branch.deliverycharge.coverage":{$in:coveragearray}}},{$project:{value:"$branch.deliverycharge.value",coverage:"$branch.deliverycharge.coverage",_id:0}},function(err,deliverycharges){
		if(err){
			logger.emit("error","Database Issue :_checkDeliveryChargesAlreadyApplied"+err);
			self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Issue"}});
		}else{
			var validappliedareas=[];
			var alreadyappliedareas=[];
			console.log("deliverycharges"+JSON.stringify(deliverycharges));
			var alreadyaplliedcovergaearray=[];
			for(var j=0;j<deliverycharges.length;j++){
					alreadyaplliedcovergaearray.push(JSON.stringify({area:deliverycharges[j].coverage.area,city:deliverycharges[j].coverage.city,zipcode:deliverycharges[j].coverage.zipcode}))
			}
			// console.log('')

			// var validcoverageareas=__.difference(coveragearray,alreadyaplliedcovergaearray)
		 // console.log("alreadyappliedareas"+JSON.stringify(alreadyappliedareas))
			for(var i=0;i<validated_data.length;i++){
				if(alreadyaplliedcovergaearray.indexOf(JSON.stringify(validated_data[i].coverage))>=0){
					alreadyappliedareas.push(validated_data[i]);
				}else{
					validappliedareas.push(validated_data[i])
				}
			}
			console.log("validappliedareas"+JSON.stringify(validappliedareas))
			// console.log("alreadyappliedareas"+JSON.stringify(alreadyappliedareas))
			if(validappliedareas.length==0){
				///////////////////////////////////
				 _updateAlreadyAppliedChargesAreas(self,branchid,alreadyappliedareas,0)
				/////////////////////////////////
				/////////////////////////////////
				// self.emit("failedManageDeliveryCharges",{error:{message:"Given area provide already applied delivery charges"}})
				/////////////////////////////////////////////////////////////
			}else{
				///////////////////////////////
				_addDeliveryCharges(self,validappliedareas,alreadyappliedareas,userid,branchid)
				//////////////////////////////
			}
		}
	})
}
var _addDeliveryCharges=function(self,validappliedareas,alreadyappliedareas,userid,branchid){
	ProductProviderModel.update({"branch.branchid":branchid},{$addToSet:{"branch.$.deliverycharge":{$each:validappliedareas}}},function(err,deliverychargestatus){
		if(err){
			logger.emit("error","Database Issue :_addDeliveryCharges"+err)
			self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Issue"}})
		}else if(deliverychargestatus==0){
			self.emit("failedManageDeliveryCharges",{error:{message:"branchid is wrong"}})
		}else{
			if(alreadyappliedareas.length==0){
				//////////////////////////////////////////
		 	_successfullManageDeliveryCharges(self,alreadyappliedareas)
			////////////////////////////////////////	
			}else{

				///////////////////////////////////
				 _updateAlreadyAppliedChargesAreas(self,branchid,alreadyappliedareas,0)
				/////////////////////////////////
			}
			
		}
	})
}
var _updateAlreadyAppliedChargesAreas=function(self,branchid,alreadyappliedareas,value){
 if(alreadyappliedareas.length>value){
 	ProductProviderModel.update({"branch.branchid":branchid},{$pull:{"branch.$.deliverycharge":{coverage:alreadyappliedareas[value].coverage}}},function(err,deliveryareastatus){
 		if(err){
			logger.emit("error","Database Issue :_updateAlreadyAppliedChargesAreas"+err)
			self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Issue"}})		
 		}else{
 			++value;
 			_updateAlreadyAppliedChargesAreas(self,branchid,alreadyappliedareas,value)
 		}
 	})
 }else{
 	ProductProviderModel.update({"branch.branchid":branchid},{$push:{"branch.$.deliverycharge":{$each:alreadyappliedareas}}},function(err,updatedeliverychargestatus){
		if(err){
			logger.emit("error","Database Issue :_updateAlreadyAppliedChargesAreas"+err)
	    self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Issue"}})	
		}else if(updatedeliverychargestatus==0){
			self.emit("failedManageDeliveryCharges",{error:{message:"Branch id is wrong"}})	
		}else{
			//////////////////////////////////////////
	 		_successfullManageDeliveryCharges(self,alreadyappliedareas)
			////////////////////////////////////////	
		}
	})
 }
}
var _successfullManageDeliveryCharges=function(self,alreadyappliedareas){
	self.emit("successfulManageDeliveryCharges",{success:{message:"Delivery Charges Manage Successfully"}})
}

ProductProvider.prototype.sellersAgreementUpload = function(providerid,user,agreementfile) {
	var self=this;
	var agreementdata=self.productprovider;
	console.log("agreementdata : "+JSON.stringify(agreementdata));
	//////////////////////////////////////////////////
	_validateSellersAgreementData(self,providerid,agreementdata,user,agreementfile);
	//////////////////////////////////////////////
};
var _validateSellersAgreementData=function(self,providerid,agreementdata,user,agreementfile){
	console.log("agreementdata 11: "+JSON.stringify(agreementdata));
	if(agreementdata==undefined){
		self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please pass data"}});
	// }else if(agreementdata.data.description==undefined){
	// 	self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please enter description"}});
	}else{
     	if(agreementfile!=undefined){
     		if(agreementfile.originalname==""){
     			self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please upload agreement file"}});	
     		}else{
     			//////////////////////////////
			    _isProviderAlreadyExist(self,providerid,agreementdata,user,agreementfile);
		      	////////////////////////////
     		}
     	}else{
     		self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please upload agreement file"}});	
     	}		
	}
}
var _isProviderAlreadyExist = function(self,providerid,agreementdata,user,agreementfile){
	SellersAgreementModel.findOne({providerid:providerid},{providerid:1,agreement:1,_id:0},function(err,sellersagreement){
		if(err){
			logger.emit('error',"Database Issue  _isProviderAlreadyExist"+err,user.userid);
			self.emit("failedUploadSellersAgreement",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!sellersagreement){
			//////////////////////////////
			_sellersAgreementUpload(self,providerid,agreementdata,user,agreementfile);
			////////////////////////////
		}else{
			self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Sellers Agreement Already Exist"}});	
		}
	})
}
var _sellersAgreementUpload=function(self,providerid,agreementdata,user,agreementfile){
	agreementdata.providerid = providerid;
	var sellersagreement=new SellersAgreementModel(agreementdata);
	sellersagreement.save(function(err,sellersagreementdata){
		if(err){
			logger.emit("error","Database Issue,fun:_sellersAgreementUpload "+err,user.userid);
			self.emit("failedUploadSellersAgreement",{"error":{"code":"ED001","message":"Database Issue"}});
		}else{
            if(agreementfile!=undefined){
	            ///////////////////////////////////////////////////////////////////
		     	_addSellersAgreement(sellersagreementdata.providerid,user,agreementfile,function(err,result){
		     		if(err){
		     			logger.emit("agreementfile not uploaded");
		     		}else{
		     			logger.emit("agreementfile added with provider details");
		     		}
		     	});
            }
				/////////////////////////////////////
				 _successfulUploadSellersAgreement(self);
	            ////////////////////////////////////
        }
	})
}
var _successfulUploadSellersAgreement=function(self){
	self.emit("successfulUploadSellersAgreement",{"success":{"message":"Sellers Agreement Uploaded Sucessfully"}});
}

var _addSellersAgreement =function(providerid,user,agreementfile,callback){
	console.log("agreementfile.path : "+JSON.stringify(agreementfile));
	fs.readFile(agreementfile.path,function (err, data) {
  		if(err){
  			callback({error:{code:"ED001",message:"Database Issue"}});
  		}else{
  			var ext = path.extname(agreementfile.originalname || '').split('.');
  			ext=ext[ext.length - 1];
  			 var s3filekey=Math.floor((Math.random()*1000)+1)+"."+ext;
		    var bucketFolder;
		    var params;

		    bucketFolder=amazonbucket+"/provider/sellersagreement/"+providerid;
	  	    params = {
	           Bucket: bucketFolder,
	           Key:providerid+s3filekey,
	           Body: data,
	           //ACL: 'public-read-write',
	           ContentType: agreementfile.mimetype
	        };
	        ///////////////////////////////////////////////////////////////////////////////////////////////
	        _addSellersAgreementToAmazonServer(params,providerid,user,agreementfile,function(err,result){
	        	if(err){
	        		callback(err)
	        	}else{	
	        		callback(null,result)
	        	}
	        });
	        ////////////////////////////////////////////////////////////////////////////////////////////////
	  	}
  	});
}
var _addSellersAgreementToAmazonServer=function(awsparams,providerid,user,agreementfile,callback){
	s3bucket.putObject(awsparams, function(err, data) {
    if (err) {
      callback({"error":{"message":"s3bucket.putObject:-_addSellersAgreementToAmazonServer"+err}});
    } else {
      var params1 = {Bucket: awsparams.Bucket, Key: awsparams.Key,Expires: 60*60*24*365};
      s3bucket.getSignedUrl('getObject',params1, function (err, url) {
        if(err){
          callback({"error":{"message":"_addSellersAgreementToAmazonServer:Error in getting getSignedUrl"+err}});
        }else{
          var sellersagreementurl={bucket:params1.Bucket,key:params1.Key,image:url};
         SellersAgreementModel.findAndModify({providerid:providerid},[],{$set:{agreement:sellersagreementurl}},{new:false},function(err,seller_agree_file){
         	if(err){
         		logger.emit('error',"Database Issue  _addSellersAgreementToAmazonServer"+err,user.userid);
			    callback({"error":{"code":"ED001","message":"Database Issue"}});
         	}else if(!seller_agree_file){
         		callback({"error":{"message":"Provider does not exist"}});
         	}else{
			      var sellersagreement_obj = seller_agree_file.agreementfile;
          	if(sellersagreement_obj==undefined){
              logger.emit("log","First time sellersagreement changed");
          	}else{
          	  var awsdeleteparams={Bucket:providerlogo_object.bucket,Key:sellersagreement_obj.key};
            	logger.emit("log",awsdeleteparams);
            	s3bucket.deleteObject(awsdeleteparams, function(err, deletesellaggrestatus) {
              	if (err) {
               	 logger.emit("error","sellersagreement not deleted from amzon s3 bucket "+err,user.userid);
              	}else if(deletesellaggrestatus){
               	 logger.emit("log","sellersagreement delete from Amazon S3");
              	}
            	}) 
            }
            exec("rm -rf "+"../../../"+agreementfile.path);
             console.log("rm -rf "+"../../../"+agreementfile.path);               
                      
              callback(null,{"success":{"message":"Sellers Agreement Updated Successfully","image":url}});
            }
          })
        }
      });
    }
  })
}

ProductProvider.prototype.getSellersAgreement = function(providerid,user) {
	var self=this;
	///////////////////////////////////////////
	_getSellersAgreement(self,providerid,user);
	///////////////////////////////////////////
};
var _getSellersAgreement = function(self,providerid,user){
	SellersAgreementModel.findOne({providerid:providerid},{providerid:1,agreement:1,_id:0},function(err,sellersagreement){
		if(err){
			logger.emit('error',"Database Issue  _getSellersAgreement"+err,user.userid);
			self.emit("failedGetSellersAgreement",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!sellersagreement){
			self.emit("failedGetSellersAgreement",{"error":{"message":"Sellers Agreement Does Not Exist"}});
		}else{
			//////////////////////////////////////////////////////
			_successfulGetSellersAgreement(self,sellersagreement);
			//////////////////////////////////////////////////////
		}
	})
}
var _successfulGetSellersAgreement=function(self,sellersagreement){
	self.emit("successfulGetSellersAgreement",{"success":{"message":"Getting Sellers Agreement Sucessfully",sellersagreement:sellersagreement}});
}

ProductProvider.prototype.changeSellersAgreementFile = function(providerid,user,agreementfile) {
	var self=this;
	////////////////////////////////////////////////////////////////////
	_validateChangeSellersAgreement(self,providerid,user,agreementfile);
	////////////////////////////////////////////////////////////////////	
};
var _validateChangeSellersAgreement=function(self,providerid,user,agreementfile){
	if(agreementfile==undefined){
		self.emit("failedChangeSellersAgreement",{"error":{"code":"AV001","message":"Please upload agreementfile"}});
	}else if(agreementfile.originalFilename==""){
		self.emit("failedChangeSellersAgreement",{"error":{"code":"AV001","message":"Please upload agreementfile"}});
	}else if(!S(agreementfile.mimetype).contains("image") ){
		self.emit("failedChangeSellersAgreement",{"error":{"code":"AV001","message":"Please upload only image"}});
	}else{
		//////////////////////////////////////////////////////////////////////////////
		_isAuthorizedUserToChangeSellersAgreement(self,providerid,user,agreementfile);
		//////////////////////////////////////////////////////////////////////////////
	}
}
var _isAuthorizedUserToChangeSellersAgreement=function(self,providerid,user,agreementfile){
	UserModel.findOne({userid:user.userid,isAdmin:true},function(err,admin){
		if(err){
			logger.emit('error',"Database Issue  _isAuthorizedUserToChangeSellersAgreement"+err,user.userid);
			self.emit("failedChangeSellersAgreement",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!admin){
			self.emit("failedChangeSellersAgreement",{"error":{"message":"You are not authorized to update sellers agreement details"}});
		}else{
			////////////////////////////////////////////////////////////////////////////
	     	_addSellersAgreement(providerid,user,agreementfile,function(err,result){
	     		if(err){
	     			logger.emit("error"+err);
	     			self.emit("failedChangeSellersAgreement",err);
	     		}else{
	     			//////////////////////////////
	     			// _updateProductProviderDetails(providerid);
	     			//////////////////////////
	     			self.emit("successfulChangeSellersAgreement",result);
	     		}
	     	});
		    ////////////////////////////////////////////////////////////////////////////
		}
	})
}
ProductProvider.prototype.GetBranchDeliveryCharges = function(sessionuserid,branchid,zipcode,city) {
	var self=this;
	
			////////////////////////////////////////////////////////////////////
	   _isAuthorizedUserToGetDeliveryBranch(self,sessionuserid,branchid,zipcode,city);
	    ////////////////////////////////////////////////////////////////////		
		
	}
	

var _isAuthorizedUserToGetDeliveryBranch=function(self,sessionuserid,branchid,zipcode,city){
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid},{provider:1},function(err,userprovider){
		if(err){
			logger.emit('error',"Database Issue fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedGetBranchDeiliveryCharges",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(!userprovider){
			self.emit("failedGetBranchDeiliveryCharges",{"error":{"message":"User does not belong to provider"}});			
		}else{
			
  		////////////////////////////////////////
  		_GetBranchDeliveryCharges(self,sessionuserid,branchid,zipcode,city);
  		/////////////////////////////////

		}
	})
}
var _GetBranchDeliveryCharges=function(self,sessionuserid,branchid,zipcode,city){

	var query;
	if(zipcode==undefined && city==undefined){
		query={$match:{}}
  }
	if(zipcode!=undefined && city!=undefined){
		query={$match:{"coverage.zipcode":zipcode,"coverage.city":city}}
	}
	if(zipcode!=undefined && city==undefined){
		query={$match:{"coverage.zipcode":zipcode}}
	}
	if(zipcode==undefined && city!=undefined){
		query={$match:{"coverage.city":city}}
	}
	
	ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$unwind:"$branch.deliverycharge"},{$project:{value:"$branch.deliverycharge.value",coverage:"$branch.deliverycharge.coverage",id:"$branch.deliverycharge._id",_id:0}},query,function(err,branchdeliverycharges){
		if(err){
			logger.emit('error',"Database Issue fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedGetBranchDeiliveryCharges",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(branchdeliverycharges==0){
			self.emit("successfulGetBranchDeliveryCharges",{success:{message:"No deliverycharge exist for ",branchdeliverycharges:[]}})
		}else{
			///////////////////////////////
			_successfullGetBranchDeliveryCharges(self,branchdeliverycharges)
			/////////////////////////////	
		}
	})
}
var _successfullGetBranchDeliveryCharges=function(self,branchdeliverycharges){
	self.emit("successfulGetBranchDeliveryCharges",{success:{message:"Gettin Branch Delivery Charges Successfully",branchdeliverycharges:branchdeliverycharges}})
}
ProductProvider.prototype.deleteDeliveryChargesArea = function(sessionuserid,branchid,deliveryareaids) {
	var self=this;
	if(deliveryareaids==undefined || deliveryareaids==""){
		self.emit("failedDeleteDeliveryChargesArea",{error:{code:"AV001",message:"Please pass deliveryareaids"}})
	}else if(!isArray(deliveryareaids)){
		self.emit("failedDeleteDeliveryChargesArea",{error:{code:"AV001",message:"deliveryareaids should be an array"}})
	}else if(deliveryareaids.length==0){
		self.emit("failedDeleteDeliveryChargesArea",{error:{code:"AV001",message:"Please passs atleast one delivery area id"}})
	}else {
	////////////////////////////////////////////////////////////////////
	   _isAuthorizedUserToDeleteDeliveryBranch(self,sessionuserid,branchid,deliveryareaids);
	    ////////////////////////////////////////////////////////////////////		
				
	}
}
	
var _isAuthorizedUserToDeleteDeliveryBranch=function(self,sessionuserid,branchid,deliveryareaids){
	UserModel.findOne({userid:sessionuserid,"provider.branchid":branchid},{provider:1},function(err,userprovider){
		if(err){
			logger.emit('error',"Database Issue fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedDeleteDeliveryChargesArea",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(!userprovider){
			self.emit("failedDeleteDeliveryChargesArea",{"error":{"message":"User does not belong to provider"}});			
		}else{
			
  		////////////////////////////////////////
  		_deleteBranchDeliveryCharges(self,sessionuserid,branchid,deliveryareaids);
  		/////////////////////////////////

		}
	})
}
var _deleteBranchDeliveryCharges=function(self,sessionuserid,branchid,deliveryareaids){
	ProductProviderModel.update({"branch.branchid":branchid},{$pull:{"branch.$.deliverycharge":{_id:{$in:deliveryareaids}}}},function(err,updatedeletedeliverarea){
		if(err){
			logger.emit('error',"Database Issue fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedDeleteDeliveryChargesArea",{"error":{"code":"ED001","message":"Database Issue"}});			
		}else if(updatedeletedeliverarea==0){
			self.emit("failedDeleteDeliveryChargesArea",{success:{message:"Given area and zipcode does not exists"}})
		}else{
			///////////////////////////////
			_successfullDeleteBranchDeliveryCharges(self)
			/////////////////////////////	
		}
	})
}
var _successfullDeleteBranchDeliveryCharges=function(self){
	self.emit("successfulDeleteDeliveryChargesArea",{success:{message:"Delete Area from delivery Availibility"}})
}

ProductProvider.prototype.addPickupAddresses = function(user,providerid) {
	var self=this;
	var location=self.productprovider;
	console.log("Loation "+JSON.stringify(location));
	///////////////////////////////////////////////////////////
	_validateAddPickupAddresses(self,location,user,providerid);
	///////////////////////////////////////////////////////////
}

var _validateAddPickupAddresses=function(self,location,user,providerid){
	if(location==undefined){
		self.emit("failedAddPickupAddress",{"error":{"code":"AV001","message":"Please enter location"}});	
	}else if(location.address1 == undefined || location.address1 == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter address1"}});
	}else if(location.address2 == undefined || location.address2 == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter address2"}});
	}else if(location.area == undefined || location.area == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter area"}});
	}else if(location.zipcode == undefined || location.zipcode == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter zipcode"}});
	}else if(location.city == undefined || location.city == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter city"}});
	}else if(location.state == undefined || location.state == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter state"}});
	}else if(location.country == undefined || location.country == ""){
	    self.emit("failedAddPickupAddress",{"error":{"code":"ED002","message":"Please enter country"}});
	}else{
		////////////////////////////////////////////////////////////////////
		_isProivderAdminToAddPickupAddresses(self,location,user,providerid);
		////////////////////////////////////////////////////////////////////		
	}
}

var _isProivderAdminToAddPickupAddresses = function(self,location,user,providerid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProivderAdminToAddPickupAddresses"+err,user.userid)
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedAddPickupAddress",{"error":{"message":"You are not authorized to add pickup address"}});
		}else{
			///////////////////////////////////////////////////
	     	_isProvideTrueOrFalse(self,location,user,providerid);
		    ///////////////////////////////////////////////////
		}
	})
}

var _isProvideTrueOrFalse = function(self,location,user,providerid){
	ProductProviderModel.findOne({providerid:providerid},{pickupaddresses:1,_id:0},function(err,userpp){
		if(err){
			logger.emit('error',"Database Issue  _isProvideTrueOrFalse"+err,user.userid)
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!userpp){
			self.emit("failedAddPickupAddress",{"error":{"message":"You are not authorized to add pickup address"}});
		}else{
			if(userpp.pickupaddresses.provide == true){
				_pushPickupAddresses(self,location,user,providerid);
			}else{
				///////////////////////////////////////////////////
		     	_addPickupAddresses(self,location,user,providerid);
			    ///////////////////////////////////////////////////
			}			
		}
	})
}

var _addPickupAddresses=function(self,location,user,providerid){
	console.log("location : "+JSON.stringify(location));
	location.addressid = "pa"+generateId();
	var pickupaddresses = {provide:true,addresses:[location]}
	ProductProviderModel.update({providerid:providerid},{$set:{pickupaddresses:pickupaddresses}},function(err,ppupdatestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_addPickupAddresses"+err,user.userid);
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(ppupdatestatus==0){
		    self.emit("failedAddPickupAddress",{"error":{"message":"providerid is wrong"}});
		}else{
			//////////////////////////////////
			_successfulAddPickupAddress(self);
			//////////////////////////////////
		}
	})
}

var _pushPickupAddresses=function(self,location,user,providerid){
	location.addressid = "pa"+generateId();
	ProductProviderModel.update({providerid:providerid},{$push:{"pickupaddresses.addresses":location}},function(err,ppupdatestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_pushPickupAddresses"+err,user.userid)
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(ppupdatestatus==0){
		    self.emit("failedAddPickupAddress",{"error":{"message":"providerid is wrong"}});
		}else{
			//////////////////////////////////
			_successfulAddPickupAddress(self);
			//////////////////////////////////
		}
	})
}

var _successfulAddPickupAddress=function(self,ProductProviderdata,user,providerid){
	self.emit("successfulAddPickupAddress",{"success":{"message":"Pickup Address Added Successfully"}});
}

ProductProvider.prototype.updatePickupAddresses = function(user,providerid,addressid) {
	var self=this;
	var location=self.productprovider;
	console.log("Loation "+JSON.stringify(location));
	///////////////////////////////////////////////////////////
	_validateUpdatePickupAddresses(self,location,user,providerid,addressid);
	///////////////////////////////////////////////////////////
}
var _validateUpdatePickupAddresses=function(self,location,user,providerid,addressid){
	if(location==undefined){
		self.emit("failedUpdatePickupAddress",{"error":{"code":"AV001","message":"Please enter location"}});	
	}else if(location.address1 == undefined || location.address1 == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter address1"}});
	}else if(location.address2 == undefined || location.address2 == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter address2"}});
	}else if(location.area == undefined || location.area == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter area"}});
	}else if(location.zipcode == undefined || location.zipcode == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter zipcode"}});
	}else if(location.city == undefined || location.city == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter city"}});
	}else if(location.state == undefined || location.state == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter state"}});
	}else if(location.country == undefined || location.country == ""){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"Please enter country"}});
	}else if(location.addressid != undefined){
	    self.emit("failedUpdatePickupAddress",{"error":{"code":"ED002","message":"You can not update addressid"}});
	}else{
		////////////////////////////////////////////////////////////////////
		_isProviderAdminToUpdatePickupAddresses(self,location,user,providerid,addressid);
		////////////////////////////////////////////////////////////////////		
	}
}
var _isProviderAdminToUpdatePickupAddresses = function(self,location,user,providerid,addressid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProviderAdminToUpdatePickupAddresses"+err,user.userid);
			self.emit("failedUpdatePickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedUpdatePickupAddress",{"error":{"message":"You are not authorized to add pickup address"}});
		}else{
			///////////////////////////////////////////////////
	     	_updatePickupAddresses(self,location,user,providerid,addressid);
		    ///////////////////////////////////////////////////
		}
	})
}
var _updatePickupAddresses=function(self,location,user,providerid,addressid){
	ProductProviderModel.update({providerid:providerid,"pickupaddresses.addresses.addressid":addressid},{$set:{"pickupaddresses.addresses.$.address1":location.address1,"pickupaddresses.addresses.$.address2":location.address2,"pickupaddresses.addresses.$.area":location.area,"pickupaddresses.addresses.$.zipcode":location.zipcode,"pickupaddresses.addresses.$.city":location.city,"pickupaddresses.addresses.$.state":location.state,"pickupaddresses.addresses.$.country":location.country}},function(err,ppupdatestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_updatePickupAddresses"+err,user.userid);
			self.emit("failedUpdatePickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(ppupdatestatus==0){
		    self.emit("failedUpdatePickupAddress",{"error":{"message":"providerid or addressid is wrong"}});
		}else{
			/////////////////////////////////////
			_successfulUpdatePickupAddress(self);
			/////////////////////////////////////
		}
	})
}
var _successfulUpdatePickupAddress=function(self,ProductProviderdata,user,providerid){
	self.emit("successfulUpdatePickupAddress",{"success":{"message":"Pickup Address Updated Successfully"}});
}

ProductProvider.prototype.getPickupAddresses = function(user,providerid) {
	var self=this;
	//////////////////////////////////////////
	_getPickupAddresses(self,user,providerid);
	//////////////////////////////////////////
}
var _isProivderAdminToGetPickupAddresses = function(self,user,providerid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProivderAdminToGetPickupAddresses"+err,user.userid);
			self.emit("failedGetPickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedGetPickupAddress",{"error":{"message":"You are not authorized to get pickup address"}});
		}else{
			//////////////////////////////////////////
	     	_getPickupAddresses(self,user,providerid);
		    //////////////////////////////////////////
		}
	})
}
var _getPickupAddresses = function(self,user,providerid){
	ProductProviderModel.findOne({providerid:providerid},{pickupaddresses:1,_id:0},function(err,doc){
		if(err){
			logger.emit('error',"Database Issue  _getPickupAddresses"+err);
			self.emit("failedGetPickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc){
			if(doc == undefined){
				self.emit("failedGetPickupAddress",{"error":{"message":"Pickup addresses not exists"}});
			}else{
				if(doc.pickupaddresses.addresses == undefined){
					self.emit("failedGetPickupAddress",{"error":{"message":"Pickup addresses not exists"}});	
				}else if(doc.pickupaddresses.addresses.length>0){
					////////////////////////////////////////////////////////////////
		    		_successfulGetPickupAddress(self,doc.pickupaddresses.addresses);
					////////////////////////////////////////////////////////////////
				}else{
					self.emit("failedGetPickupAddress",{"error":{"message":"pickup address not exists"}});	
				}
			}
		}else{
			self.emit("failedGetPickupAddress",{"error":{"message":"providerid is wrong"}});
		}
	})
}
var _successfulGetPickupAddress=function(self,doc){
	self.emit("successfulGetPickupAddress",{"success":{"message":"Getting Pickup Address Successfully","addresses":doc}});
}

ProductProvider.prototype.deletePickupAddresses = function(user,providerid,addressid) {
	var self=this;
	////////////////////////////////////////////////////////////////////////
	_isProivderAdminToDeletePickupAddresses(self,user,providerid,addressid);
	////////////////////////////////////////////////////////////////////////
}
var _isProivderAdminToDeletePickupAddresses = function(self,user,providerid,addressid){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProivderAdminToDeletePickupAddresses"+err,user.userid)
			self.emit("failedDeletePickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedDeletePickupAddress",{"error":{"message":"You are not authorized to delete pickup address"}});
		}else{
			///////////////////////////////////////////////////////
	     	_deletePickupAddresses(self,user,providerid,addressid);
		    ///////////////////////////////////////////////////////
		}
	})
}
var _deletePickupAddresses=function(self,user,providerid,addressid){
	console.log("providerid : "+providerid+" addressid : "+addressid);
	ProductProviderModel.update({providerid:providerid,"pickupaddresses.addresses.addressid":addressid},{$pull:{"pickupaddresses.addresses":{addressid:addressid}}},function(err,addressupdatestatus){
		if(err){
			logger.emit('error',"Database Issue ,function:_deletePickupAddresses"+err,user.userid);
			self.emit("failedDeletePickupAddress",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(addressupdatestatus==0){
		    self.emit("failedDeletePickupAddress",{"error":{"message":"Provided addressid is not belongs with this provider"}});
		}else{			
			/////////////////////////////////////
			_successfulDeletePickupAddress(self);
			/////////////////////////////////////
			////////////////////////////////////////////////////
			_updateIsProvidePickupAddress(self,user,providerid);
			////////////////////////////////////////////////////
		}
	})
}
var _updateIsProvidePickupAddress = function(self,user,providerid){
	ProductProviderModel.findOne({providerid:providerid},{pickupaddresses:1,_id:0},function(err,doc){
		if(err){
			logger.emit('error',"Database Issue  _updateIsProvidePickupAddress"+err);
		}else if(doc){
			if(doc.pickupaddresses.addresses.length == 0){
				ProductProviderModel.update({providerid:providerid},{$set:{"pickupaddresses.provide":false}},function(err,addressupdatestatus){
					if(err){
						logger.emit('error',"Database Issue ,function:_updateIsProvidePickupAddress"+err,user.userid);
					}else if(addressupdatestatus==0){
					    logger.emit('error',"Database Issue"+err,user.userid);
					}else{			
						logger.emit('info',"Pickup Address Deleted Successfully");
					}
				})
			}
		}
	})
}
var _successfulDeletePickupAddress=function(self){
	self.emit("successfulDeletePickupAddress",{"success":{"message":"Pickup Address Deleted Successfully"}});
}
ProductProvider.prototype.manageProductCategoryLeadTime = function(sessionuserid,providerid,productcategoryleadtimedata) {
	var self=this;
	
	if(productcategoryleadtimedata==undefined){
		self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"AV001",message:"Please pass product category lead time data"}});
	}else if(!isArray(productcategoryleadtimedata)){
		self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"AV001",message:"product category lead time should be an array"}});
	}else{
			////////////////////////////////////////////////////////////////////////
	_isProivderAdminTomanageProductCategoryLeadTime(self,sessionuserid,providerid,productcategoryleadtimedata);
	////////////////////////////////////////////////////////////////////////
	}
}
var _isProivderAdminTomanageProductCategoryLeadTime = function(self,sessionuserid,providerid,productcategoryleadtimedata){
	UserModel.findOne({userid:sessionuserid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Issue  _isProivderAdminTomanageProductCategoryLeadTime"+err,user.userid);
			self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!usersp){
			self.emit("failedManageProductCategoryLeadTime",{"error":{"message":"You are not authorized Manage Product Category Leadtime"}});
		}else{
			///////////////////////////////////////////////////
	     	_validateProductCategoryLeadTime(self,sessionuserid,providerid,productcategoryleadtimedata);
		    ///////////////////////////////////////////////////
		}
	})
}
var _validateProductCategoryLeadTime=function(self,sessionuserid,providerid,productcategoryleadtimedata){
	ProductProviderModel.findOne({providerid:providerid},{category:1},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _validateProductCategoryLeadTime"+err,user.userid);
			self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!provider){
			self.emit("failedManageProductCategoryLeadTime",{"error":{"message":"Providerid is wrong"}});
		}else{
			ProductCategoryModel.find({"ancestors.categoryid":provider.category.categoryid,level:4},function(err,level4categories){
				if(err){
					logger.emit('error',"Database Issue  _validateProductCategoryLeadTime"+err,user.userid);
			    self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Issue"}});
				}else if(level4categories.length!=0){
					///valid leadtimedata
					var level4categoryids=[];
					for(var j=0;j<level4categories.length;j++){
						level4categoryids.push(level4categories[j].categoryid)
					}
					var leadtimecalc={week:7*24*60,days:24*60,hours:60,sec:1/60,min:1}
					var validproductcategoryleadtimedata=[];
					for(var i=0;i<productcategoryleadtimedata.length;i++){
						if(level4categoryids.indexOf(productcategoryleadtimedata[i].categoryid)>=0){
							if(productcategoryleadtimedata[i].categoryid!=undefined && productcategoryleadtimedata[i].leadtime!=undefined){
								if(leadtimecalc[productcategoryleadtimedata[i].leadtime.format]){
									var inminutes=leadtimecalc[productcategoryleadtimedata[i].leadtime.format]*productcategoryleadtimedata[i].leadtime.value;
								  productcategoryleadtimedata[i].leadinminute=inminutes;
								  console.log("leadinminute"+inminutes)
								  validproductcategoryleadtimedata.push(productcategoryleadtimedata[i])	
								}
								
						  }	
					  }
					}
						if(validproductcategoryleadtimedata.length==0){
						  self.emit("failedManageProductCategoryLeadTime",{error:{message:"Please provide valid lead time data"}})	
						}else{
								////////////////////////////////////
					_manageProductCategoryLeadTimeData(self,sessionuserid,providerid,productcategoryleadtimedata)
					// //////////////////////////////////////`		
					}
			


				}else{
					 self.emit("failedManageProductCategoryLeadTime",{"error":{"message":"No category exists for this provider"}});
				}
			})		
		}
	})
	
}
var _manageProductCategoryLeadTimeData=function(self,sessionuserid,providerid,productcategoryleadtimedata){
	ProductProviderModel.update({providerid:providerid},{$set:{productcategoryleadtime:productcategoryleadtimedata}},function(err,updatecategoryleadtime){
		if(err){
			logger.emit('error',"Database Issue  _manageProductCategoryLeadTimeData"+err,user.userid);
			self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(updatecategoryleadtime==0){
			self.emit("failedManageProductCategoryLeadTime",{error:{message:"Provider id is wrong"}})
		}else{
		//////////////////////////////////////////////
		_successfulManageCategoryLeadTimeData(self)
		/////////////////////////////////////////////	
		}
	})
}
var _successfulManageCategoryLeadTimeData=function(self){
	self.emit("successfulManageProductCategoryLeadTime",{success:{message:"Product Category Lead Time Managed Successfully"}})
}
ProductProvider.prototype.getProviderProductCategoryLeadTime = function(sessionuserid,providerid) {
	var self=this;
	
	/////////////////////////////
	_getProviderCategoryLeadTime(self,providerid)
	/////////////////////////////
}
var _getProviderCategoryLeadTime=function(self,providerid){
	ProductProviderModel.findOne({providerid:providerid},{productcategoryleadtime:1},function(err,provider){
		if(err){
			logger.emit('error',"Database Issue  _getProviderCategoryLeadTime"+err,user.userid);
			self.emit("failedGetProviderProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Issue"}});	
		}else if(!provider){
			self.emit("failedGetProviderProductCategoryLeadTime",{"error":{"message":"providerid is wrong"}});	
		}else{
			var productcategoryleadtime=provider.productcategoryleadtime;

		}
	})
}
