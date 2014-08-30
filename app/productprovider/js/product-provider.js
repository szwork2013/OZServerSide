var ProductCategoryModel=require("../../productcategory/js/product-category-model");
var ProductProviderModel=require("./productprovider-model");
var GlsPaymentPercentModel = require("./gls-payment-percent-model");
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
AWS.config.update(CONFIG.amazon);
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
			logger.emit("error","Database Error :_updateProductProviderDetails "+err)
		}else if(!provider){
			logger.emit("error","Incorrect Seller id for _updateProductProviderDetails ")
		}else{

			provider.providerlogo=provider.providerlogo.image;
			var setdata={};
			provider=JSON.stringify(provider);
			provider=JSON.parse(provider);

			ProductCatalogModel.update({"provider.providerid":providerid},{$set:{provider:provider}},{multi:true},function(err,productproviderstatus){
				if(err){
					logger.emit("error","Database Issue _updateProductProviderDetails"+err)
				}else if(productproviderstatus==0){
					logger.emit("log","No product exists for that seller "+providerid)
				}else{
					logger.emit("log","All the products for seller updated");
				}
			})
		}
	})
}
var _updateBranchProductsDetails=function(branchid){
	ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},function(err,providerbranch){
		if(err){
			logger.emit("error","Database Error :_updateProductProviderDetails "+err)
		}else if(providerbranch.length==0){
			logger.emit("error","Incorrect Branch id");
		}else{
			var branch=providerbranch[0].branch;
			var branchsetdata={branchid:branch.branchid,branchname:branch.branchname,note:branch.note,location:branch.location,delivery:branch.delivery,contact_supports:branch.contact_supports}
			ProductCatalogModel.update({"branch.branchid":branchid},{$set:{branch:branchsetdata}},{multi:true},function(err,productproviderstatus){
				if(err){
					logger.emit("error","Database Issue _updateProductProviderDetails"+err)
				}else if(productproviderstatus==0){
					logger.emit("error","Incorrect branchid for update product")
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
         		logger.emit('error',"Database Error  _addProviderLogoToAmazonServer"+err,user.userid)
			    callback({"error":{"code":"ED001","message":"Database Error"}});
         	}else if(!provider_logo){
         		callback({"error":{"message":"Seller does not exist"}});
         	}else{
			      var providerlogo_object=provider_logo.providerlogo;
          	if(providerlogo_object==undefined){
              logger.emit("log","First time Seller logo changed");
          	}else{
          	  var awsdeleteparams={Bucket:providerlogo_object.bucket,Key:providerlogo_object.key};
            	logger.emit("log",awsdeleteparams);
            	s3bucket.deleteObject(awsdeleteparams, function(err, deleteproviderlogostatus) {
              	if (err) {
               	 logger.emit("error","Seller logo not deleted from amazon s3 bucket "+err,user.userid);
              	}else if(deleteproviderlogostatus){
               	 logger.emit("log","Product logo deleted from Amazon S3");
              	}
            	}) 
            }
            exec("rm -rf "+providerlogo.path);
             console.log("rm -rf "+providerlogo.path);               
                      
              callback(null,{"success":{"message":"Seller Logo Updated Successfully","image":url}})
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
		self.emit("failedProductProviderAcceptance",{"error":{"message":"Please enter action - accept or reject"}});
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
			logger.emit('error',"Database Error  _validateAcceptProductProviderRequest"+err,userid);
			self.emit("failedProductProviderAcceptance",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			self.emit("failedProductProviderAcceptance",{"error":{"message":"Seller does not exist"}});
		}else{
			if(provider.status == "init"){
				/////////////////////////////////////////////////////////////
		     	_acceptProductProviderRequest(self,providerid,action,userid);
			    /////////////////////////////////////////////////////////////
			}else if(provider.status == action){
				self.emit("failedProductProviderAcceptance",{"error":{"message":"Seller has already "+action+"ed"}});	
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
			logger.emit('error',"Database Error ,function:_acceptProductProviderRequest"+err,userid);
			self.emit("failedProductProviderAcceptance",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(providerupdatestatus==0){
		    self.emit("failedProductProviderAcceptance",{"error":{"message":"Incorrect sellerid"}});
		}else{
			///////////////////////////////////////////
			_successfulProductProviderAcceptance(self,action);
			///////////////////////////////////////////
		}
	})
}
var _successfulProductProviderAcceptance=function(self,action){
	self.emit("successfulProductProviderAcceptance",{"success":{"message":"Seller request "+action+"ed successfully"}});
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
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter providerdata"}})
	}else if(productproviderdata.providername==undefined || productproviderdata.providername==undefined ){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter providername"}})
	}else  if(productproviderdata.providerbrandname==undefined || productproviderdata.providerbrandname==undefined ){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter provider brandname"}})
	}else  if(productproviderdata.provideremail==undefined || productproviderdata.provideremail==undefined ){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter provider email"}})
	}else if(productproviderdata.category==undefined || productproviderdata.category==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter category"}})
	}else if(productproviderdata.category.categoryid==undefined && productproviderdata.category.categoryname==undefined){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"please select category"}})
	}else if(productproviderdata.providerdescription==undefined || productproviderdata.providerdescription==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter providerdescription"}})
	// }else if(productproviderdata.branch==undefined || productproviderdata.branch==""){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please pass branch details"}})
	// }else if(!isArray(productproviderdata.branch)){
	//   self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Branch should be an array"}})
	// }else if(productproviderdata.branch.length==0){
	// 	self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please add atleast one branch details"}});
	// 
    }else if(productproviderdata.orderprocess_configuration==undefined || productproviderdata.orderprocess_configuration==""){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"please enter orderprocess_configuration details"}})
	}else  if(!isArray(productproviderdata.orderprocess_configuration)){
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Process Configuration should be an JSON array"}})
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
		self.emit("failedProductProviderRegistration",{"error":{"code":"AV001","message":"Please enter paymentmode"}})
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
			logger.emit("error","Database Error,fun:_checkCategoryOneLevelCategory"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!productcategory){
			self.emit("failedProductProviderRegistration",{"error":{"message":"Category does not exist"}});	
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
			logger.emit("error","Database Error,fun:_checkCategoryOneLevelCategory"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(providercodedata.length!=0){
			self.emit("failedProductProviderRegistration",{"error":{"message":"Seller code already used"}});
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
			logger.emit("error","Database Error,fun:_checkOrderProcessConfiguration"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Error"}});		
		}else if(orderrefstatus.length==0){
			self.emit("failedProductProviderRegistration",{"error":{"message":"Order Process Configuration Reference data does not exist"}});		
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
					self.emit("failedProductProviderRegistration",{"error":{"message":"Mandatory to select these status "+requireorderdstatus}});		
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
			logger.emit("error","Database Error,fun:_addProductProvider"+err,user.userid);
			self.emit("failedProductProviderRegistration",{"error":{"code":"ED001","message":"Database Error"}});
		}else{
            if(providerlogo!=undefined){
            ///////////////////////////////////////////////////////////////////
	     	_addProductProviderLogo(productprovider.providerid,user,providerlogo,function(err,result){
	     		if(err){
	     			logger.emit("Seller logo not uploaded")
	     		}else{
	     			logger.emit("Seller logo added with Seller details")
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
			logger.emit("error","Database Error");
		}else if(userproviderupdate==0){
			logger.emit("log","Incorrect user id");
		}else{
			logger.emit("info","Seller Details associated with user");
		}
	})
}
var _successfullAddProductProvider=function(self){
	self.emit("successfulProductProviderRegistration",{"success":{"message":"Seller Added Successfully"}});
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
		self.emit("failedAddProviderPolicy",{"error":{"code":"AV001","message":"Please enter policy text"}});
	}else if(type == undefined){
		self.emit("failedAddProviderPolicy",{"error":{"code":"AV001","message":"Please enter policy type"}});
	}else if(["ordering_policy","price_policy","refunds_policy","delivery_policy","cancellation_policy"].indexOf(type)<0){
		self.emit("failedAddProviderPolicy",{"error":{"code":"AV001","message":"type should be ordering_policy or price_policy or refunds_policy or delivery_policy or cancellation_policy"}});
	}else{
		_isValidProviderToAddPolicy(self,providerid,branchid,type,text,user);
	}
}
var _isValidProviderToAddPolicy = function(self,providerid,branchid,type,text,user){
	ProductProviderModel.findOne({providerid:providerid,"branch.branchid":branchid},function(err,provider){
		if(err){
			logger.emit('error',"Database Error  _isValidProviderToAddPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			console.log(provider);
			self.emit("failedAddProviderPolicy",{"error":{"message":"Incorrect seller id or branchid"}});
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
			self.emit("failedAddProviderPolicy",{"error":{"message":"Only authorised user can add seller policy details"}});
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
			logger.emit('error',"Database Error  _checkPolicyAlreadyExist "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
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
			logger.emit('error',"Database Error ,function:_addProviderPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(branchpolicystatus==0){
		    self.emit("failedAddProviderPolicy",{"error":{"message":"Database Error"}});
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
			logger.emit('error',"Database Error ,function:_addProviderPolicy "+err,user.userid);
			self.emit("failedAddProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(branchpolicystatus==0){
		    self.emit("failedAddProviderPolicy",{"error":{"message":"Database Error"}});
		}else{
			///////////////////////////////////
			_successfulAddProviderPolicy(self);
			///////////////////////////////////
		}
	})
}
var _successfulAddProviderPolicy = function(self){
	self.emit("successfulAddProviderPolicy",{"success":{"message":"Seller Policy Added Successfully"}});
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
		self.emit("failedGetProviderPolicy",{"error":{"code":"AV001","message":"Please enter type"}});
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
			logger.emit('error',"Database Error  _isValidProviderToGetPolicy"+err,user.userid);
			self.emit("failedGetProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			self.emit("failedGetProviderPolicy",{"error":{"message":"Incorrect seller id or branchid"}});
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
			logger.emit('error',"Database Error  _isProviderAdminToGetPolicy"+err,user.userid);
			self.emit("failedGetProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedGetProviderPolicy",{"error":{"message":"Only authorized user can get seller policy details"}});
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
			logger.emit('error',"Database Error  _isValidProviderToGetPolicy "+err,user.userid);
			self.emit("failedGetProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
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
	self.emit("successfulGetProviderPolicy",{"success":{"message":"Getting Seller Policy Details Successfully",policy:policy}});
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
		self.emit("failedUpdateProviderPolicy",{"error":{"code":"AV001","message":"Please enter policy text"}});
	}else if(type == undefined){
		self.emit("failedUpdateProviderPolicy",{"error":{"code":"AV001","message":"Please pass policy type"}});
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
			logger.emit('error',"Database Error  _isValidProviderToUpdatePolicy"+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			self.emit("failedUpdateProviderPolicy",{"error":{"message":"Incorrect seller id"}});
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
			logger.emit('error',"Database Error  _isProviderAdminToUpdatePolicy"+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedUpdateProviderPolicy",{"error":{"message":"Only admin user can add seller policy details"}});
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
			logger.emit('error',"Database Error  _checkPolicyAlreadyExistToUpdate "+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!branchpolicy){
			self.emit("failedUpdateProviderPolicy",{"error":{"message":"Incorrect seller id or branchid"}});
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
			logger.emit('error',"Database Error ,function:_addProviderPolicy "+err,user.userid);
			self.emit("failedUpdateProviderPolicy",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(branchpolicystatus==0){
		    self.emit("failedUpdateProviderPolicy",{"error":{"message":"Database Error"}});
		}else{
			///////////////////////////////////
			_successfulUpdateProviderPolicy(self);
			///////////////////////////////////
		}
	})
}
var _successfulUpdateProviderPolicy = function(self){
	self.emit("successfulUpdateProviderPolicy",{"success":{"message":"Seller Policy Updated Successfully"}});
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
		self.emit("failedProductProviderUpdation",{"error":{"code":"AV001","message":"Please enter providerdata"}});	
	}else if(ProductProviderdata.status!=undefined || ProductProviderdata.providerlogo!=undefined || ProductProviderdata.photos!=undefined ||ProductProviderdata.category!=undefined || ProductProviderdata.branch!=undefined){
	    self.emit("failedProductProviderUpdation",{"error":{"code":"ED002","message":"Seller [logo, photos, category and branch details] cannot be changed"}});
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
			self.emit("failedProductProviderUpdation",{"error":{"message":"Only authorized user can update seller details"}});
		}else{
			///////////////////////////////////////////////////////////////////
	     	_updateProductProviderData(self,ProductProviderdata,user,providerid);
		    //////////////////////////////////////////////////////////////////
		}
	})

}
var _updateProductProviderData=function(self,ProductProviderdata,user,providerid){
	ProductProviderModel.findOne({providerid:providerid},{providerid:1,trial:1},function(err,provider){
		if(err){
			logger.emit('error',"Database Error ,function:_updateProductProviderData"+err,user.userid)
			self.emit("failedProductProviderUpdation",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			 self.emit("failedProductProviderUpdation",{"error":{"message":"Incorrect sellerid"}});
		}else{
			var expirydate=new Date();
      expirydate.setDate(expirydate.getDate() + 90);
      provider=JSON.stringify(provider);
      provider=JSON.parse(provider);
			if(provider.trial==undefined){
				console.log("test1");
				ProductProviderdata.trial={startdate:new Date(),expirydate:expirydate};
			}
			console.log("provider"+JSON.stringify(provider))
			ProductProviderModel.update({providerid:providerid},{$set:ProductProviderdata},function(err,spupdatestatus){
				if(err){
					logger.emit('error',"Database Error ,function:_updateProductProviderData"+err,user.userid)
					self.emit("failedProductProviderUpdation",{"error":{"code":"ED001","message":"Database Error"}});
				}else if(spupdatestatus==0){
				    self.emit("failedProductProviderUpdation",{"error":{"message":"Please enter providerid"}});
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
	})
	
}

var _successfulUpdateProductProvider=function(self,ProductProviderdata,user,providerid){
	self.emit("successfulProductProviderUpdation",{"success":{"message":"Seller Updated Successfully"}})
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
			logger.emit('error',"Database Error  _getProductProvider");
			self.emit("failedGetProductProvider",{"error":{"code":"ED001","message":"Database Error"}});	
		}else if(!productprovider){
			self.emit("failedGetProductProvider",{"error":{"message":"Incorrect seller id"}});	
		}else{

			var actionstatus={accepted:"accept",cancelled:"cancel",rejected:"reject",inproduction:"production",factorytostore:"shiptostore",packing:"pack",indelivery:"deliver",storepickup:"pickfromstore",ordercomplete:"done"};
			var orderprocess_configuration=productprovider.orderprocess_configuration;
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
			
				productprovider=JSON.stringify(productprovider);
				productprovider=JSON.parse(productprovider)
				console.log("valid_order_process_configuration"+JSON.stringify(final_order_processconfiguration))
				productprovider.orderprocess_configuration=final_order_processconfiguration;	
			/////////////////////////////////////////////////////
			_successfullGetProductProvider(self,productprovider);
			/////////////////////////////////////////////////////
		}
	})
}
var _successfullGetProductProvider=function(self,productprovider){
	self.emit("successfulGetProductProvider",{"success":{"message":"Getting Seller Details successfully",productprovider:productprovider}})
}
ProductProvider.prototype.getProviderInfo = function(providerid) {
	var self=this;
	/////////////////////////////////////
	_getProviderInfo(self,providerid);
	/////////////////////////////////////
};
var _getProviderInfo=function(self,providerid){
	ProductProviderModel.findOne({providerid:providerid},{providerid:1,providername:1,providerbrandname:1,providerdescription:1,providerlogo:1},function(err,productprovider){
		if(err){
			logger.emit('error',"Database Error  _getProductProvider");
			self.emit("failedGetProviderInfo",{"error":{"code":"ED001","message":"Database Error"}});	
		}else if(!productprovider){
			self.emit("failedGetProviderInfo",{"error":{"message":"Incorrect seller id"}});	
		}else{
			/////////////////////////////////////////////////////
			_successfullGetProvierInfo(self,productprovider);
			/////////////////////////////////////////////////////
		}
	})
}
var _successfullGetProvierInfo=function(self,productprovider){
	self.emit("successfulGetProviderInfo",{"success":{"message":"Getting Seller Info successfully",productprovider:productprovider}})
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
			logger.emit('error',"Database Error  _getAllProductProviders");
			self.emit("failedGetAllProductProviders",{"error":{"code":"ED001","message":"Database Error "+err}});
		}else if(productprovider.length>0){
			/////////////////////////////////////////////////////
			_successfulGetAllProductProviders(self,productprovider);
			/////////////////////////////////////////////////////
		}else{
			self.emit("failedGetAllProductProviders",{"error":{"message":"Seller does not exist"}});	
		}
	})
}
var _successfulGetAllProductProviders=function(self,productprovider){
	self.emit("successfulGetAllProductProviders",{"success":{"message":"Getting All Seller Details Successfully","productprovider":productprovider}});
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
			logger.emit('error',"Database Error  _isAuthorizedUserToDeleteProductProvider"+err,user.userid)
			self.emit("failedProductProviderDeletion",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedProductProviderDeletion",{"error":{"message":"Only authorized user can update seller Details"}});
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
			logger.emit('error',"Database Error  _deleteProductProvider"+err,user.userid)
			self.emit("failedProductProviderDeletion",{"error":{"code":"ED001","message":"Database Error"}});	
		}else if(spdeletestatus==0){
			self.emit("failedProductProviderDeletion",{"error":{"message":"Incorrect seller id"}});	
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
	self.emit("successfulProductProviderDeletion",{"success":{"message":"Deleted Seller Successfully"}});
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
		self.emit("failedAddProductProviderLogo",{"error":{"code":"AV001","message":"Please upload sellerlogo"}});
	}else if(providerlogo.originalFilename==""){
		self.emit("failedAddProductProviderLogo",{"error":{"code":"AV001","message":"Please upload sellerlogo"}});
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
			self.emit("failedAddProductProviderLogo",{"error":{"message":"Only authorized user can update seller details"}});
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
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter branchdata"}});
	}else if(branchdata.branchname==undefined || branchdata.branchname==""){
	 	self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter branchname"}});
	}else if(branchdata.location==undefined || branchdata.location==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter location details"}});
	}else if(branchdata.location.address1==undefined || branchdata.location.address1==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter address1 details"}});
	}else if(branchdata.location.address2==undefined || branchdata.location.address2==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter address2 details"}})
	}else if(branchdata.location.area==undefined || branchdata.location.area==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter area name"}})
	}else if(branchdata.location.city==undefined || branchdata.location.city==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter enter city"}})
	}else if(branchdata.location.state==undefined || branchdata.location.state==""){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please select state"}})
	}else if(branchdata.location.zipcode==undefined || branchdata.location.zipcode==""){
      self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter zipcode"}})
	}else if(branchdata.branchcode==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter branchcode"}})
	} else if(branchdata.contact_supports==undefined){
      self.emit("failedAddBranch",{"error":{"code":"AV001","message":"please enter contact support numbers"}})
	}else if(!isArray(branchdata.contact_supports)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"contact supports should be an JSON array"}})
	} else  if(branchdata.contact_supports.length==0){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please add atleast one contact support number"}})
	} else if(branchdata.delivery==undefined){
	  self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter delivery details for your branch"}})		
	}else if(branchdata.delivery.isprovidehomedelivery==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please select if you provide homedeliveryoptions"}})		
	}else if(branchdata.delivery.isprovidepickup==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Pickup options should be selected"}})		
	}else if(branchdata.note==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter note "}})		
	}else if(branchdata.delivery.isdeliverychargeinpercent==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please select if you provide delivery charge in percent"}})		
	}else if(branchdata.branch_availability==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter branch availibility details"}});
	}else if(branchdata.branch_availability.from==undefined || branchdata.branch_availability.from=="" || !isNumeric(branchdata.branch_availability.from)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter valid FROM time in branch availibility"}});
	}else if(branchdata.branch_availability.to==undefined || !isNumeric(branchdata.branch_availability.to)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please enter valid TO time in branch availibility"}});
	}else if(branchdata.branch_availability.from > branchdata.branch_availability.to){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"branch FROM time should be less than TO time"}});
	}else  if(branchdata.deliverytimingslots==undefined){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please select delivery timing slots"}});
	}else  if(!isArray(branchdata.deliverytimingslots)){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"deliverytimingslots should be JSON array"}});
	}else if(branchdata.deliverytimingslots.length==0){
		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"Please add atleast one delivery slot"}});
	}else{
    	if(branchdata.delivery.isprovidehomedelivery || branchdata.delivery.isprovidepickup){	
          //////////////////////////////////////////////////////////////
		   _isValidProductProvider(self,branchdata,sessionuser,providerid)
		   //////////////////////////////////////////////////////////////	
    	}else{
    		self.emit("failedAddBranch",{"error":{"code":"AV001","message":"You have to select atleast one option, home or pickup"}})			
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
			self.emit("failedAddBranch",{"error":{"message":"Database Error"}})
		}else if(!productprovider){
			self.emit("failedAddBranch",{"error":{"message":"Incorrect or unauthorized seller id"}});
		}else{
			if(productprovider.status == "accept"){
				////////////////////////////////////////////////////
				_checkBranchCodeIsAlreadyExist(self,branchdata,sessionuser,productprovider)
				//////////////////////////////////////////////////
			}else{
				self.emit("failedAddBranch",{"error":{"message":"Your seller account is not yet activated, please contact OrderZapp support team"}});				
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
			self.emit("failedAddBranch",{"error":{"message":"Branch code already in use, please provide another branchcode"}})
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
			self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Database Error"}})
		}else if(providerbranchaddstatus==0){
			self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Incorrect Seller id"}})
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
			self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Database Error"}})
		}else if(userbranchstatus==0){
			self.emit("failedAddBranch",{"error":{"message":"Incorrect User Id"}})
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
		  	logger.emit('error',"Database Error fun:_addAdminGroupToBranch"+err,user.userid);
		  	self.emit("failedAddBranch",{"error":{"code":"ED001","message":"Database Error"}});		
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
		logger.emit('error',"Database Error fun:_getAllMyBranches"+err,user.userid)
		self.emit("failedGetAllMyBranches",{"error":{"code":"ED001","message":"Database Error"}});		
	}else if(userproductproviderbranch.length==0){
		self.emit("failedGetAllMyBranches",{"error":{"message":"Seller does not exists"}});		
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
			  logger.emit('error',"Database Error fun:_getBranchDetailsByProductProvider"+err,user.userid)
		      self.emit("failedGetAllMyBranches",{"error":{"code":"ED001","message":"Database Error"}});			
			}else if(!productprovider){
				console.log("testing 123");
				_getBranchDetailsByProductProvider(self,user,userproductproviderbranch,++value,productproviderbranches);
			}else{
				console.log("abcdetf"+productprovider.providerid);
				ProductProviderModel.find({"provider.providerid":productprovider.providerid,branchid:{$in:userproductproviderbranch[value].branchid}},{productcatalog:0},function(err,spbranch){
					if(err){
						logger.emit('error',"Database Error fun:_getBranchDetailsByProductProvider"+err,user.userid)
		                self.emit("failedGetAllMyBranches",{"error":{"code":"ED001","message":"Database Error"}});			
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
			logger.emit('error',"Database Error fun:_getAllMyProviders"+err,user.userid)
		  self.emit("failedGetAllMyProviders",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(!userprovider){
			self.emit("failedGetAllMyProviders",{"error":{"message":"Incorrect userid"}});			
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
	ProductProviderModel.find({providerid:{$in:providerarray},status:{$ne:"reject"}},{_id:0,providerid:1,providerlogo:1,providername:1,providercode:1,status:1,provideremail:1,providerbrandname:1,providerdescription:1,category:1,deliverytimingsinstructions:1,tax:1,paymentmode:1,orderprocess_configuration:1,trial:1},function(err,providers){
		if(err){
			logger.emit('error',"Database Error fun:_getAllMyProviders"+err)
		  self.emit("failedGetAllMyProviders",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(providers.length==0){
			self.emit("failedGetAllMyProviders",{"error":{"code":"PP001","message":"No seller account exists. Please add a new seller account."}});		
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
	self.emit("successfulGetAllMyProviders",{success:{message:"Getting my seller details successfully","providers":providers}})
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
			logger.emit('error',"Database Error fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedGetAllMyProviderBranches",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(!userprovider){
			self.emit("failedGetAllMyProviderBranches",{"error":{"message":"User does not belong to seller"}});			
		}else{
			
  		////////////////////////////////////////Error
  		_getAllMyProviderBranches(self,providerid);
  		/////////////////////////////////

		}
	})
}
var _getAllMyProviderBranches=function(self,providerid){
	// db.productproviders.aggregate({$unwind:"$branch"},{$project:{branchname:"$branch.branchname",branchid:"$branch.branchid",_id:0}});
	ProductProviderModel.aggregate({$match:{providerid:providerid,"branch.status":{$ne:"deactive"}}},{"$unwind":"$branch"},{$project:{branchname:"$branch.branchname",branchid:"$branch.branchid",branchdescription:"$branch.branchdescription",location:"$branch.location",giftwrapper:"$branch.giftwrapper",delivery:"$branch.delivery",branch_images:"$branch.branch_images",branch_availability:"$branch.branch_availability",deliverytimingslots:"$branch.deliverytimingslots",branchcode:"$branch.branchcode",status:"$branch.status",_id:0,contact_supports:"$branch.contact_supports",note:"$branch.note"}},function(err,providers){
		if(err){
			logger.emit('error',"Database Error fun:_getAllMyProviders"+err,user.userid)
		  self.emit("failedGetAllMyProviderBranches",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(providers.length==0){
			ProductProviderModel.findOne({providerid:providerid,status:{$ne:"deactive"}},{providername:1},function(err,providername){
				if(err){
					logger.emit('error',"Database Issue fun:_getAllMyProviderBranches"+err,user.userid)
				  self.emit("failedGetAllMyProviderBranches",{"error":{"code":"ED001","message":"Database Error"}});			
				}else if(!providername){
					self.emit("failedGetAllMyProviderBranches",{"error":{"message":"Seller does not exist"}});			
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
	self.emit("successfulGetAllMyProviderBranches",{success:{message:"Getting my seller branch details successfully","branches":providers}})
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
			logger.emit('error',"Database Error fun:_getBranch"+err,user.userid)
		  self.emit("failedGetBranch",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(branch.length==0){
			self.emit("failedGetBranch",{"error":{"message":"Branch does not exists"}});			
		}else{
			////////////////////////////////////
			_successfullGetBranch(self,branch[0])
			///////////////////////////////////
		}
	})
}
var _successfullGetBranch=function(self,branch){
	self.emit("successfulGetBranch",{success:{message:"Getting branch details successfully",branch:branch}})
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
			logger.emit('error',"Database Error  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedDeleteBranch",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedDeleteBranch",{"error":{"message":"Only admin is authorized to update seller details"}});
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
			logger.emit('error',"Database Error fun:_deleteBranch"+err,user.userid)
		  self.emit("failedDeleteBranch",{"error":{"code":"ED001","message":"Database Error"}});			
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
		self.emit("failedUpdateBranch",{"error":{code:"AV001",message:"Please enter branchdata"}});
	}else if(branchdata.status!=undefined || branchdata.usergrp!=undefined || branchdata.branch_images!=undefined ){
		self.emit("failedUpdateBranch",{"error":{code:"AV001",message:"You cannot change [status, usergroup, images] details of branch"}});
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
				self.emit("failedUpdateBranch",{"error":{code:"AV001",message:"You have to select atleast one option home or pickup"}});
			}
		}
	
	}
}
var _isAuthorizedUserToUpdateBranch=function(self,user,providerid,branchid,branchdata){
	UserModel.findOne({userid:user.userid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Error  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedUpdateBranch",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedUpdateBranch",{"error":{"message":"Only authorized user can update seller details"}});
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
				logger.emit('error',"Database Error fun:_updateBranch"+err,user.userid)
			  self.emit("failedUpdateBranch",{"error":{"code":"ED001","message":"Database Error"}});			
			}else if(branchupdatestatus==0){
				self.emit("failedUpdateBranch",{"error":{"message":"Branch does not exists"}});			
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
self.emit("successfulUpdateBranch",{success:{message:"Branch updated successfully"}})
}
ProductProvider.prototype.addGroupToBranch = function(sessionuser,providerid,branchid,groupdata) {
	var self=this;
	
	///////////////////////////////////////////////////////////////////////
	_validateBranchGroupData(self,sessionuser,providerid,branchid,groupdata);
	//////////////////////////////////////////////////////////////////////
};
var _validateBranchGroupData=function(self,sessionuser,providerid,branchid,groupdata){
	if(groupdata==undefined){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please enter groupdata"}});
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
				self.emit("failedAddGroupToBranch",{"error":{"message":"User does not belong to seller branch"}});
			}else{
				 if(userproductprovider[0].provider.isOwner!=true){
				 	 self.emit("failedAddGroupToBranch",{"error":{"message":"Only seller can add new user group"}});
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
				logger.emit("error","Database Error: _checkGroupNameAlreadyExist"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Error"}});
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
				logger.emit("error","Database Error: _checkGroupNameAlreadyExist"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Error"}});
			}else if(grpaddstatus==0){
				self.emit("failedAddGroupToBranch",{"error":{"message":"Incorrect Branch id"}});
			}else{
				///////////////////////////////////////
				_successfullGroupAddToBranch(self)
				//////////////////////////////////////
			}
		})
	}
	var _successfullGroupAddToBranch=function(self){
		self.emit("successfulAddGroupToBranch",{success:{message:"New user group added to the branch"}});
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
			logger.emit("error","Database Error: _isAuthorizedUserToAddNewGroup"+err);
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"Database Error"}});
		}else if(userproductprovider.length==0){
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"User does not belong to seller branch"}});
		}else{
		  if(userproductprovider[0].provider.isOwner!=true){
			 	self.emit("failedAddGroupToBranch",{"error":{"message":"Only seller can remove a user group"}});
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
			logger.emit("error","Database Error: _removeGroupFromBranch"+err);
			self.emit("failedRemoveGroupFromBranch",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usergrup){
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"Incorrect groupid"}});
		}else{
			ProductProviderModel.update({"branch.branchid":branchid},{$pull:{"branch.$.usergrp":{groupid:groupid}}},function(err,groupremovestatus){
				if(err){
					logger.emit("error","Database Error: _removeGroupFromBranch"+err);
					self.emit("failedRemoveGroupFromBranch",{"error":{"code":"ED001","message":"Database Error"}});
				}else if(groupremovestatus==0){
					self.emit("failedRemoveGroupFromBranch",{"error":{"message":"Incorrect branchid"}});
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
		self.emit("failedAddMembersToGroup",{error:{message:"please enter invites data"}})
	}else if(invites.grpname==undefined || invites.grpname==""){
		self.emit("failedAddMembersToGroup",{error:{message:"please enter group name"}})
	}else if(!isArray(invites.members)){
		self.emit("failedAddMembersToGroup",{error:{message:"invites should be an JSON array"}})
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
			logger.emit("error","Database Error: _isAuthorizedUserToAddNewGroup"+err);
			self.emit("failedAddMembersToGroup",{"error":{"message":"Database Error"}});
		}else if(userproductprovider.length==0){
			self.emit("failedAddMembersToGroup",{"error":{"message":"User does not belong to seller branch"}});
		}else{
		  if(userproductprovider[0].provider.isOwner!=true){
			 	self.emit("failedAddMembersToGroup",{"error":{"message":"Only seller can add users to group"}});
			}else{
				ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$project:{branchid:"$branch.branchid",branchname:"$branch.branchname",providerid:1,usergrp:"$branch.usergrp"}},function(err,providerbranch){
					if(err){
						logger.emit("error","Database Error: _isAuthorizedUserToAddNewGroup"+err);
		      	self.emit("failedAddMembersToGroup",{"error":{"message":"Database Error"}});
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
    	logger.emit("error","Database Error,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
	  	self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Error"}});
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
          	logger.emit("error","Database Error:fun/_addUserGrpDetailsToServiceProvider"+err)
            self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Error"}});
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
	  		logger.emit("error","Database Error :fun-_sendSMSToInvitees")
	    	self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Error"}});
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
	  				self.emit("failedAddMembersToGroup",{"error":{"code":"ED002","message":"Server setup template Error"}});
	  		}
			})//end of orgmemberonlyinvite
		}else{
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED002","message":"Server setup template Error"}});		
		}
	})
}
var _addProviderProviderBranchDetailsToTheUser=function(self,branch,user){
	// console.log("userid"+user.userid);
	UserModel.update({userid:user.userid},{$push:{provider:{providerid:branch.providerid,branch:branch.branchid,isOwner:false,confirmed:false}}},function(err,providerupdatestatus){
	  if(err){
	 		logger.emit("error","Database Error,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Error"}});
	  }else if(providerupdatestatus==0){
	   	self.emit("failedAddMembersToGroup",{"error":{"message":"Incorrect Userid"}});
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
			logger.emit("error","Database Error _addProductProviderMembersToUserGroupOther"+err);
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Error"}});
    }else if(users.length==0){
    	logger.emit("log","No users find");
		}else{
			var grpmembers=[];
			for(var i=0;i<users.length;i++){
				grpmembers.push(users[i].userid);
			}
			ProductProviderModel.update({"branch.branchid":branch.branchid,"branch.usergrp.groupid":groupid},{$addToSet:{"branch.$.usergrp.$.grpmembers":{$each:grpmembers}}},function(err,addgrpstats){
				if(err){
					logger.emit("error","Database Error _addProviderMembersToUserGroupOther"+err);
					self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Error"}});
				}else if(addgrpstats==1){
					// logger.emit("error","userinvte not added to the serviceproviderlist");
				}else{
					BranchModel.update({branchid:branch.branchid},{$push:{usergrp:{grpname:grpname,grpmembers:grpmembers}}},function(err,newgrpaddstatus){
		   				if(err){
		   					logger.emit("error","Database :_addBranchMembersToUserGroupOther:"+err)
		   					self.emit("failedAddEmployee",{"error":{"code":"ED001","message":"Database Error"}});
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
		self.emit("failedPublishUnpublishBranch",{"error":{code:"AV001",message:"Please enter which action to be performed"}});
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
			logger.emit('error',"Database Error  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Error"}});
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
			logger.emit('error',"Database Error  _isAuthorizedProviderToPublishUnpublishBranch"+err,user.userid);
			self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"Incorrect seller id"}});
		}else{
			console.log("provider : "+JSON.stringify(provider));
			if(provider.status=="init"){
				self.emit("failedPublishUnpublishBranch",{"error":{"message":"You are not able to "+action+" branch until provider was publish"}});
			}else if(provider.status=="accept"){
				////////////////////////////////////////////////////////
		        _publishUnpublishBranch(self,providerid,branchid,action);
		        ////////////////////////////////////////////////////////
			}else{
				self.emit("failedPublishUnpublishBranch",{"error":{"message":"Seller not published, please contact to orderZapp support team"}});
			}
		}
	})
}
var _publishUnpublishBranch=function(self,providerid,branchid,action){
	ProductProviderModel.aggregate({$match:{providerid:providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid,"branch.status":{$ne:"deactive"}}},function(err,branch){
		if(err){
				logger.emit('error',"Database Error  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(branch.length==0){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"Incorrect branchid or seller id"}});
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
			logger.emit('error',"Database Error fun:_publishAndUnpublishBranch"+err,user.userid);
		  self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(branchupdatestatus==0){
			self.emit("failedPublishUnpublishBranch",{"error":{"message":"Branch does not exists"}});			
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
			logger.emit('error',"Database Error fun:_publishAndUnpublishAllProductsOfBranch"+err,user.userid);
		  self.emit("failedPublishUnpublishBranch",{"error":{"code":"ED001","message":"Database Error"}});			
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
			logger.emit('error',"Database Error  _getAllNewProductProviders "+err,user.userid);
			self.emit("failedGetAllNewProviders",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(provider.length==0){
			self.emit("failedGetAllNewProviders",{"error":{"message":"New seller does not exist"}});
		}else{
			_successfulGetAllNewProviders(self,provider);
		}
	})
}
var _successfulGetAllNewProviders=function(self,provider){
  self.emit("successfulGetAllNewProviders",{success:{message:"Getting New Sellers Successfully",provider:provider}});
}

ProductProvider.prototype.manageDeliveryCharges = function(userid,branchid,deliverychargedata) {
	var self = this;
	////////////////////////////////////////
	_validateDeliveryChargeData(self,userid,branchid,deliverychargedata);
	////////////////////////////////////////
};
var _validateDeliveryChargeData=function(self,userid,branchid,deliverychargedata){
	if(deliverychargedata==undefined){
		self.emit("failedManageDeliveryCharges",{error:{code:"AV001",message:"Please enter deliverychargedata"}})
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
			logger.emit('error',"Database Error  _isAuthorizedUserToDeleteBranch"+err,user.userid)
			self.emit("failedManageDeliveryCharges",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedManageDeliveryCharges",{"error":{"message":"Only authorized user can manage delivery charges"}});
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
			logger.emit('error',"Database Error  _checkValueInPercentOrAmount"+err,userid)
			self.emit("failedManageDeliveryCharges",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(branch.length==0){
			self.emit("failedManageDeliveryCharges",{"error":{"message":"Incorrect branchid"}});
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
	var deletedzipcodearray=[];
	var deletareaarray=[];
	for(var i=0;i<deliverychargedata.length;i++){
		if(deliverychargedata[i].value!=undefined && S(deliverychargedata[i].value).isNumeric() && deliverychargedata[i].coverage.area!=undefined && deliverychargedata[i].coverage.city!=undefined  && deliverychargedata[i].coverage.zipcode!=undefined){
				if(deliverychargedata[i].available){//add or update deilvery area and charge//delete
					validated_data.push({value:deliverychargedata[i].value,coverage:{area:deliverychargedata[i].coverage.area.toLowerCase(),city:deliverychargedata[i].coverage.city.toLowerCase(),zipcode:deliverychargedata[i].coverage.zipcode}})
				  coveragearray.push({area:deliverychargedata[i].coverage.area.toLowerCase(),city:deliverychargedata[i].coverage.city.toLowerCase(),zipcode:deliverychargedata[i].coverage.zipcode})	
				}else{//delete
					deletedzipcodearray.push(deliverychargedata[i].coverage.zipcode);
					deletareaarray.push(deliverychargedata[i].coverage.area);
						
				}
		}
	}
	if(validated_data.length==0){
		///////////////////////////////////////
			_removeBranchDeliveryCharges(branchid,deletedzipcodearray,deletareaarray);
			////////////////////////////////////
			//////////////////////////////////////////
	 		_successfullManageDeliveryCharges(self)
			////////////////////////////////////////	
		// self.emit("failedManageDeliveryCharges",{"error":{"message":"Please enter valid deliverychargedata"}});
	}else{
		/////////////////////////////////
		_checkDeliveryChargesAlreadyApplied(self,userid,branchid,validated_data,coveragearray,deletedzipcodearray,deletareaarray)
		////////////////////////////////
	}
}
var _checkDeliveryChargesAlreadyApplied=function(self,userid,branchid,validated_data,coveragearray,deletedzipcodearray,deletareaarray){
	ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$unwind:"$branch.deliverycharge"},{$match:{"branch.deliverycharge.coverage":{$in:coveragearray}}},{$project:{value:"$branch.deliverycharge.value",coverage:"$branch.deliverycharge.coverage",_id:0}},function(err,deliverycharges){
		if(err){
			logger.emit("error","Database Error :_checkDeliveryChargesAlreadyApplied"+err);
			self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Error"}});
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
			///////////////////////////////////////
			_removeBranchDeliveryCharges(branchid,deletedzipcodearray,deletareaarray);
			////////////////////////////////////
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
var _removeBranchDeliveryCharges=function(branchid,deletedzipcodearray,deletareaarray){
	ProductProviderModel.update({"branch.branchid":branchid},{$pull:{"branch.$.deliverycharge":{"coverage.zipcode":{$in:deletedzipcodearray},"coverage.area":{$in:deletareaarray}}}},function(err,deletedeliveryareastatus){
 		if(err){
			logger.emit("error","Database Error :deletareaarray"+err)
			// self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Error"}})		
 		}else if(deletedeliveryareastatus==0){
 			logger.emit("error","Branch id is wrong for _removeBranchDeliveryCharges")
 		}else{
 			logger.emit("info","deliverycharge area removed from branch"+branchid)
 		}
 	})
}

var _addDeliveryCharges=function(self,validappliedareas,alreadyappliedareas,userid,branchid){
	ProductProviderModel.update({"branch.branchid":branchid},{$addToSet:{"branch.$.deliverycharge":{$each:validappliedareas}}},function(err,deliverychargestatus){
		if(err){
			logger.emit("error","Database Error :_addDeliveryCharges"+err)
			self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Error"}})
		}else if(deliverychargestatus==0){
			self.emit("failedManageDeliveryCharges",{error:{message:"Incorrect branchid"}})
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
			logger.emit("error","Database Error :_updateAlreadyAppliedChargesAreas"+err)
			self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Error"}})		
 		}else{
 			++value;
 			_updateAlreadyAppliedChargesAreas(self,branchid,alreadyappliedareas,value)
 		}
 	})
 }else{
 	ProductProviderModel.update({"branch.branchid":branchid},{$push:{"branch.$.deliverycharge":{$each:alreadyappliedareas}}},function(err,updatedeliverychargestatus){
		if(err){
			logger.emit("error","Database Error :_updateAlreadyAppliedChargesAreas"+err)
	    self.emit("failedManageDeliveryCharges",{error:{code:"ED001",message:"Database Error"}})	
		}else if(updatedeliverychargestatus==0){
			self.emit("failedManageDeliveryCharges",{error:{message:"Incorrect Branch id"}})	
		}else{
			//////////////////////////////////////////
	 		_successfullManageDeliveryCharges(self,alreadyappliedareas)
			////////////////////////////////////////	
		}
	})
 }
}
var _successfullManageDeliveryCharges=function(self,alreadyappliedareas){
	self.emit("successfulManageDeliveryCharges",{success:{message:"Delivery Charges Managed Successfully"}})
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
		self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please enter data"}});
	// }else if(agreementdata.data.description==undefined){
	// 	self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please enter description"}});
	}else{
     	if(agreementfile!=undefined){
     		if(agreementfile.originalname==""){
     			self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please upload seller agreement file"}});	
     		}else{
     			//////////////////////////////
			    _isProviderAlreadyExist(self,providerid,agreementdata,user,agreementfile);
		      	////////////////////////////
     		}
     	}else{
     		self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Please upload seller agreement file"}});	
     	}		
	}
}
var _isProviderAlreadyExist = function(self,providerid,agreementdata,user,agreementfile){
	SellersAgreementModel.findOne({providerid:providerid},{providerid:1,agreement:1,_id:0},function(err,sellersagreement){
		if(err){
			logger.emit('error',"Database Error  _isProviderAlreadyExist"+err,user.userid);
			self.emit("failedUploadSellersAgreement",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!sellersagreement){
			//////////////////////////////
			_sellersAgreementUpload(self,providerid,agreementdata,user,agreementfile);
			////////////////////////////
		}else{
			self.emit("failedUploadSellersAgreement",{"error":{"code":"AV001","message":"Sellers Agreement Already exists"}});	
		}
	})
}
var _sellersAgreementUpload=function(self,providerid,agreementdata,user,agreementfile){
	agreementdata.providerid = providerid;
	var sellersagreement=new SellersAgreementModel(agreementdata);
	sellersagreement.save(function(err,sellersagreementdata){
		if(err){
			logger.emit("error","Database Error,fun:_sellersAgreementUpload "+err,user.userid);
			self.emit("failedUploadSellersAgreement",{"error":{"code":"ED001","message":"Database Error"}});
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
  			callback({error:{code:"ED001",message:"Database Error"}});
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
			    callback({"error":{"code":"ED001","message":"Database Error"}});
         	}else if(!seller_agree_file){
         		callback({"error":{"message":"Seller does not exist"}});
         	}else{
			      var sellersagreement_obj = seller_agree_file.agreementfile;
          	if(sellersagreement_obj==undefined){
              logger.emit("log","First time sellers agreement changed");
          	}else{
          	  var awsdeleteparams={Bucket:providerlogo_object.bucket,Key:sellersagreement_obj.key};
            	logger.emit("log",awsdeleteparams);
            	s3bucket.deleteObject(awsdeleteparams, function(err, deletesellaggrestatus) {
              	if (err) {
               	 logger.emit("error","sellers agreement not deleted from amzon s3 bucket "+err,user.userid);
              	}else if(deletesellaggrestatus){
               	 logger.emit("log","sellers agreement deleted from Amazon S3");
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
			logger.emit('error',"Database Error  _getSellersAgreement"+err,user.userid);
			self.emit("failedGetSellersAgreement",{"error":{"code":"ED001","message":"Database Error"}});
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
			self.emit("failedChangeSellersAgreement",{"error":{"message":"Only OrderZapp admin can update sellers agreement details"}});
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
			logger.emit('error',"Database Error fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedGetBranchDeiliveryCharges",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(!userprovider){
			self.emit("failedGetBranchDeiliveryCharges",{"error":{"message":"User does not belong to seller"}});			
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
			logger.emit('error',"Database Error fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedGetBranchDeiliveryCharges",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(branchdeliverycharges==0){
			self.emit("successfulGetBranchDeliveryCharges",{success:{message:"No delivery charge exists for ",branchdeliverycharges:[]}})
		}else{
			///////////////////////////////
			_successfullGetBranchDeliveryCharges(self,branchdeliverycharges)
			/////////////////////////////	
		}
	})
}
var _successfullGetBranchDeliveryCharges=function(self,branchdeliverycharges){
	self.emit("successfulGetBranchDeliveryCharges",{success:{message:"Getting Branch Delivery Charges Successfully",branchdeliverycharges:branchdeliverycharges}})
}
ProductProvider.prototype.deleteDeliveryChargesArea = function(sessionuserid,branchid,deliveryareaids) {
	var self=this;
	if(deliveryareaids==undefined || deliveryareaids==""){
		self.emit("failedDeleteDeliveryChargesArea",{error:{code:"AV001",message:"Please enter deliveryareaids"}})
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
			logger.emit('error',"Database Error fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedDeleteDeliveryChargesArea",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(!userprovider){
			self.emit("failedDeleteDeliveryChargesArea",{"error":{"message":"User does not belong to seller"}});			
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
			logger.emit('error',"Database Error fun:_checkUserHaveProviderBranches"+err,user.userid)
		  self.emit("failedDeleteDeliveryChargesArea",{"error":{"code":"ED001","message":"Database Error"}});			
		}else if(updatedeletedeliverarea==0){
			self.emit("failedDeleteDeliveryChargesArea",{success:{message:"Area and zipcode does not exists"}})
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
			logger.emit('error',"Database Error  _isProivderAdminToAddPickupAddresses"+err,user.userid)
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedAddPickupAddress",{"error":{"message":"Only authorized user can add pickup address"}});
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
			logger.emit('error',"Database Error  _isProvideTrueOrFalse"+err,user.userid)
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!userpp){
			self.emit("failedAddPickupAddress",{"error":{"message":"Only authorized user can add pickup address"}});
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
			logger.emit('error',"Database Error ,function:_addPickupAddresses"+err,user.userid);
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(ppupdatestatus==0){
		    self.emit("failedAddPickupAddress",{"error":{"message":"Incorrect seller id"}});
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
			logger.emit('error',"Database Error ,function:_pushPickupAddresses"+err,user.userid)
			self.emit("failedAddPickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(ppupdatestatus==0){
		    self.emit("failedAddPickupAddress",{"error":{"message":"Incorrect seller id"}});
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
			logger.emit('error',"Database Error  _isProviderAdminToUpdatePickupAddresses"+err,user.userid);
			self.emit("failedUpdatePickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedUpdatePickupAddress",{"error":{"message":"Only authorized user can add pickup address"}});
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
			logger.emit('error',"Database Error ,function:_updatePickupAddresses"+err,user.userid);
			self.emit("failedUpdatePickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(ppupdatestatus==0){
		    self.emit("failedUpdatePickupAddress",{"error":{"message":"Incorrect seller id or addressid"}});
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
			logger.emit('error',"Database Error  _isProivderAdminToGetPickupAddresses"+err,user.userid);
			self.emit("failedGetPickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedGetPickupAddress",{"error":{"message":"Only authorized user can get pickup address"}});
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
			logger.emit('error',"Database ErrorError  _getPickupAddresses"+err);
			self.emit("failedGetPickupAddress",{"error":{"code":"ED001","message":"Database ErrorError"}});
		}else if(doc){
			if(doc == undefined){
				self.emit("failedGetPickupAddress",{"error":{"message":"Pickup addresses does not exists"}});
			}else{
				if(doc.pickupaddresses.addresses == undefined){
					self.emit("failedGetPickupAddress",{"error":{"message":"Pickup addresses does not exists"}});	
				}else if(doc.pickupaddresses.addresses.length>0){
					////////////////////////////////////////////////////////////////
		    		_successfulGetPickupAddress(self,doc.pickupaddresses.addresses);
					////////////////////////////////////////////////////////////////
				}else{
					self.emit("failedGetPickupAddress",{"error":{"message":"Pickup addresses does not exists"}});	
				}
			}
		}else{
			self.emit("failedGetPickupAddress",{"error":{"message":"Incorrect seller id"}});
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
			logger.emit('error',"Database Error  _isProivderAdminToDeletePickupAddresses"+err,user.userid)
			self.emit("failedDeletePickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedDeletePickupAddress",{"error":{"message":"Only authorized user can delete pickup address"}});
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
			logger.emit('error',"Database Error ,function:_deletePickupAddresses"+err,user.userid);
			self.emit("failedDeletePickupAddress",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(addressupdatestatus==0){
		    self.emit("failedDeletePickupAddress",{"error":{"message":"The addressid does not belong to seller"}});
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
			logger.emit('error',"Database Error  _updateIsProvidePickupAddress"+err);
		}else if(doc){
			if(doc.pickupaddresses.addresses.length == 0){
				ProductProviderModel.update({providerid:providerid},{$set:{"pickupaddresses.provide":false}},function(err,addressupdatestatus){
					if(err){
						logger.emit('error',"Database Error ,function:_updateIsProvidePickupAddress"+err,user.userid);
					}else if(addressupdatestatus==0){
					    logger.emit('error',"Database Error"+err,user.userid);
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
		self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"AV001",message:"Please enter product category lead time data"}});
	}else if(!isArray(productcategoryleadtimedata)){
		self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"AV001",message:"product category lead time should be an JSON array"}});
	}else{
			////////////////////////////////////////////////////////////////////////
	_isProivderAdminTomanageProductCategoryLeadTime(self,sessionuserid,providerid,productcategoryleadtimedata);
	////////////////////////////////////////////////////////////////////////
	}
}
var _isProivderAdminTomanageProductCategoryLeadTime = function(self,sessionuserid,providerid,productcategoryleadtimedata){
	UserModel.findOne({userid:sessionuserid,"provider.providerid":providerid,"provider.isOwner":true},function(err,usersp){
		if(err){
			logger.emit('error',"Database Error  _isProivderAdminTomanageProductCategoryLeadTime"+err,user.userid);
			self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!usersp){
			self.emit("failedManageProductCategoryLeadTime",{"error":{"message":"Only authorized user can Manage Product Category Leadtime"}});
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
			logger.emit('error',"Database Error  _validateProductCategoryLeadTime"+err,user.userid);
			self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(!provider){
			self.emit("failedManageProductCategoryLeadTime",{"error":{"message":"Incorrect seller id"}});
		}else{
			ProductCategoryModel.find({"ancestors.categoryid":provider.category.categoryid,level:4},function(err,level4categories){
				if(err){
					logger.emit('error',"Database Error  _validateProductCategoryLeadTime"+err,user.userid);
			    self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
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
						  self.emit("failedManageProductCategoryLeadTime",{error:{message:"Please enter valid lead time data"}})	
						}else{
								////////////////////////////////////
					_manageProductCategoryLeadTimeData(self,sessionuserid,providerid,productcategoryleadtimedata)
					// //////////////////////////////////////`		
					}
			


				}else{
					 self.emit("failedManageProductCategoryLeadTime",{"error":{"message":"No category exists for this seller"}});
				}
			})		
		}
	})
	
}
var _manageProductCategoryLeadTimeData=function(self,sessionuserid,providerid,productcategoryleadtimedata){
	ProductProviderModel.update({providerid:providerid},{$set:{productcategoryleadtime:productcategoryleadtimedata}},function(err,updatecategoryleadtime){
		if(err){
			logger.emit('error',"Database Error  _manageProductCategoryLeadTimeData"+err,user.userid);
			self.emit("failedManageProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(updatecategoryleadtime==0){
			self.emit("failedManageProductCategoryLeadTime",{error:{message:"Incorrect seller id"}})
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
			logger.emit('error',"Database Error  _getProviderCategoryLeadTime"+err,user.userid);
			self.emit("failedGetProviderProductCategoryLeadTime",{"error":{"code":"ED001","message":"Database Error"}});	
		}else if(!provider){
			self.emit("failedGetProviderProductCategoryLeadTime",{"error":{"message":"Incorrect Seller id"}});	
		}else{
			var productcategoryleadtime=provider.productcategoryleadtime;

		}
	})
}

ProductProvider.prototype.updateGlsPaymentPercent = function(providerid,user) {
	var self = this;
	var data = this.productprovider;
	console.log("Data : "+JSON.stringify(data));
	//////////////////////////////////////////////////////////
	_validateGlsPaymentPercentData(self,data,providerid,user);
	//////////////////////////////////////////////////////////
}
var _validateGlsPaymentPercentData = function(self,data,providerid,user){
	if(data == undefined){
		self.emit("failedUpdateGlsPaymentPercent",{"error":{"code":"AV001","message":"Please enter data"}});	
	}else if(data.percent == undefined || !isNumeric(data.percent)){
		self.emit("failedUpdateGlsPaymentPercent",{"error":{"code":"AV001","message":"Please enter valid percentage"}});
	}else if(data.providerid != undefined){
		self.emit("failedUpdateGlsPaymentPercent",{"error":{"code":"AV001","message":"Can't update providerid"}});
	}else{
		// _isValidProviderToUpdateGlsPaymentPercent(self,data,providerid,user);
		_updateGlsPaymentPercent(self,data,providerid,user);
	}
}
// var _isValidProviderToUpdateGlsPaymentPercent = function(self,data,providerid,user){
// 	GlsPaymentPercentModel.findOne({providerid:providerid},function(err,provider){
// 		if(err){
// 			logger.emit('error',"Database Error  _isValidProviderToUpdateGlsPaymentPercent"+err);
// 			self.emit("failedUpdateGlsPaymentPercent",{"error":{"code":"ED001","message":"Database Error"}});
// 		}else if(provider){
// 			_updateGlsPaymentPercent(self,data,providerid,user);
// 		}else{
// 			self.emit("failedUpdateGlsPaymentPercent",{"error":{"message":"Incorrect seller id"}});
// 		}
// 	})
// }
var _updateGlsPaymentPercent=function(self,data,providerid,user){
	GlsPaymentPercentModel.update({providerid:providerid},{$set:{percent:data.percent}},{upsert:true},function(err,percentageupdatestatus){
		if(err){
			logger.emit('error',"Database Error  _updateGlsPaymentPercent"+err,user.userid);
			self.emit("failedUpdateGlsPaymentPercent",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(percentageupdatestatus==0){
			self.emit("failedUpdateGlsPaymentPercent",{"error":{"message":"Incorrect seller id"}});
		}else{
			/////////////////////////////////////////
			_successfulUpdateGlsPaymentPercent(self);
			/////////////////////////////////////////	
		}
	})
}
var _successfulUpdateGlsPaymentPercent=function(self){
	self.emit("successfulUpdateGlsPaymentPercent",{"success":{"message":"Gls Payable Payment Percent Updated Successfully"}});
}

ProductProvider.prototype.getGlsPaymentPercent = function(user) {
	var self = this;
	////////////////////////////////////////////////////
	_getAllProvidersFromProductProviderModel(self,user);
	////////////////////////////////////////////////////
}
var _getAllProvidersFromProductProviderModel = function(self,user){
	ProductProviderModel.find({},{providerid:1,providername:1,_id:0},function(err,productproviders){
		if(err){
			logger.emit('error',"Database Error  _getAllProvidersFromProductProviderModel"+err);
			self.emit("failedGetGlsPaymentPercent",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(productproviders.length>0){
			_getAllProvidersFromGlsPaymentPercentModel(self,productproviders,user);			
		}else{
			self.emit("failedGetGlsPaymentPercent",{"error":{"message":"Provider gls payment percent does not exists"}});	
		}
	})
}
var _getAllProvidersFromGlsPaymentPercentModel = function(self,productproviders,user){
	productproviders=JSON.stringify(productproviders);
	productproviders=JSON.parse(productproviders);
	GlsPaymentPercentModel.find({},{providerid:1,percent:1,_id:0},function(err,providerpercentage){
		if(err){
			logger.emit('error',"Database Error  _getAllProvidersFromProductProviderModel"+err);
			self.emit("failedGetGlsPaymentPercent",{"error":{"code":"ED001","message":"Database Error"}});
		}else if(providerpercentage.length>0){
			// productproviders=JSON.stringify(productproviders);
			// productproviders=JSON.parse(productproviders);
			for(var i=0;i<productproviders.length;i++){
				var percentage = __.find(providerpercentage, function(obj) { return obj.providerid == productproviders[i].providerid });
				console.log("percentage : "+percentage);
				if(percentage == undefined){
					productproviders[i].percent = 0;
				}else{
					productproviders[i].percent = percentage.percent;
				}
			}
		}else{
			// productproviders=JSON.stringify(productproviders);
			// productproviders=JSON.parse(productproviders);
			for(var i=0;i<productproviders.length;i++){
				productproviders[i].percent = 0;
			}
			// self.emit("failedGetGlsPaymentPercent",{"error":{"message":"Provider gls payment percent does not exists"}});	
		}
		_successfulGetGlsPaymentPercent(self,productproviders);
	})
}
var _successfulGetGlsPaymentPercent=function(self,doc){
	self.emit("successfulGetGlsPaymentPercent",{"success":{"message":"Gls Payable Payment Percent Getting Successfully","doc":doc}});
}
