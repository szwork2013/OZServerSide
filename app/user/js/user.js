
var UserModel=require("./user-model");
var OtpModel=require("../../common/js/otp-model");
var productCatalog = require("../../productcatalog/js/product-catalog-model");
var OrderModel = require("../../productorder/js/productorder-model");
var SMSTemplateModel=require("../../common/js/sms-template-model");
var SMSFormatModel=require("../../common/js/sms-format-model");
var events = require("events");
var logger=require("../../common/js/logger");
var commonapi=require("../../common/js/common-api");
var emailtemplateapi=require("../../common/js/email-template-api")
var ApkModel=require("../../common/js/apk-model");
var S=require('string');
var __=require("underscore");
var DeliveryAddressModel=require("../../productorder/js/delivery-address-history-model");
var fs=require("fs");
var path=require("path");
var AWS = require('aws-sdk');
var CONFIG=require("config").OrderZapp;
var amazonbucket=CONFIG.amazonbucket;
var exec = require('child_process').exec;
var gcmapi=require('../../gcm/js/gcm-api')
AWS.config.update(CONFIG.amazon);
AWS.config.update({region:'ap-southeast-1'});
var s3bucket = new AWS.S3();

var User = function(userdata) {
  this.user=userdata;
};
var CountryCodeModel=require("../../common/js/country-code-model");

var regxemail = /\S+@\S+\.\S+/; 
User.prototype = new events.EventEmitter;
module.exports = User;
User.prototype.registerUser = function() {
	var self=this;

		///////////////////////////////////
	_validateRegisterUser(self,this.user);
	 ////////////////////////////////////
};
var _sendOTPToMobileNumber=function(mobileno,otp,tempname,lang,user,callback){
	SMSTemplateModel.findOne({name:tempname,lang:lang},function(err,smstemplatedata){
    if(err){
      callback({"error":{"message":"error in sending SMS message"}})
    }else if(smstemplatedata){
      SMSFormatModel.findOne({name:tempname},function(err,smsformat){
        if(err){
          callback({"error":{"message":"error in sending SMS message"}})
        }else if(smsformat){
          var smstemplate=S(smstemplatedata.template);
          smstemplate=smstemplate.replaceAll("<verifyformat>",smsformat.format);
          smstemplate=smstemplate.replaceAll("<otp>",otp);
          var message=smstemplate.s;
          commonapi.sendMessage(message,mobileno,function(result){
            if(result=="failure"){
              callback({"error":{"message":"error in sending SMS message"}})
            }else{
              callback({"success":{"message":"sent"}})
            }
          }) 
        }else{
          callback({"error":{"message":"SMS format not found "+tempname}})
        }
      })
    }else{
      callback({"error":{"message":"SMS template not found "+tempname}});
    }
  })
}
var verifyMobileNumber=function(otp,callback){
	OtpModel.findOne({otp:otp,status:"active",otptype:"verify"},function(err,otpdata){
		if(err){
			logger.emit("error","Database error:/verifyMobileNumber"+err);
			callback({"error":{"code":"ED001","message":"Database Issue"}}) 	
    } else if(otpdata){
      UserModel.findAndModify({ userid: otpdata._userId},[],{$set: {verified:true,status:"active"}},{new:false},
      	function(err,user){
        if(err){
					logger.emit("error","Database error:/verifyMobileNumber"+err);
			    callback({"error":{"code":"ED001","message":"Database Issue"}}) 						
		    } else if(user){
			    otpdata["status"]="deactive";
			    //change the status of otp to deactive when verify user
          OtpModel.update({otp:otp,status:"active"},{$set:{status:"deactive"}},function(err,otpstatus){
          	if(err){
          		logger.emit("error","Database error:/verifyMobileNumber"+err);
		           callback({"error":{"code":"ED001","message":"Database Issue"}}) 	
          	}else{
          		logger.emit('log',"callint to sendWelcomeSms");
          		/////////////////////////////
              sendWelcomeSms(user,function(result){
              	callback(result);
              })
          		/////////////////////////
          	}
          })
        }else{
       		callback({"error":{"message":"Incorrect User id"}});  	
        }
      })
    }else{
    	callback({"error":{"message":"Incorrect or expired OTP"}}); 
    }
  })
}
var sendWelcomeSms=function(user,callback){
	var templatename;
  var lang=user.preffered_lang;
	if(user.hhusertype=="serviceprovider"){
	  templatename="welcomesp";
	}else{
	  templatename="welcomecm";
  }
	SMSTemplateModel.findOne({name:templatename,lang:user.preffered_lang},function(err,smstemplate){
    if(err){
			logger.emit("error","Database error:/sendWelcomeSms"+err,user.userid);
			callback({"error":{"code":"ED001","message":"Database Issue"}})
    }else if(smstemplate){
  		logger.emit("log",JSON.stringify(smstemplate));
  		var smstemplate=S(smstemplate.template);
  		smstemplate=smstemplate.replaceAll("<name>",user.firstname);
      SMSTemplateModel.findOne({name:"care",lang:user.preffered_lang},function(err,caresmstemplate){
        if(err){
         logger.emit("error","Database error:/sendWelcomeSms"+err);
			   callback({"error":{"code":"ED001","message":"Database Issue"}})
        }else if(!caresmstemplate){
          logger.emit("error","smstemplate for care lang "+user.preffered_lang+" does not exist");
			    callback({"error":{"message":"SMS template Issue"}})
        }else{
          SMSFormatModel.findOne({name:"care"},function(err,careformat){
            if(err){
              logger.emit("error","Database error:/sendWelcomeSms"+err);
			 			 callback({"error":{"code":"ED001","message":"Database Issue"}})
            }else if(!careformat){
              logger.emit("error","smsformat for care does not exist");
			  			callback({"error":{"message":"SmsFormat collection does not exist for care"}})
            }else{

            	
            	var care_template=S(caresmstemplate.template);
              care_template=care_template.replaceAll("<careformat>",careformat.format);
               var mobileno=user.mobileno;
							if(lang!="EN"){
                var split_index=smstemplate.indexOf("\n");
                var message1=smstemplate.substring(0,split_index);

                var message2=smstemplate.substring(split_index+1,smstemplate.length);
                commonapi.sendMessage("  1/3   \n"+message1,mobileno,function(status){
                  commonapi.sendMessage(" 2/3   \n"+message2,mobileno,function(status){
                   commonapi.sendMessage(" 3/3   \n"+care_template,mobileno,function(status){
                    if(user.phonetype="feature"){
                    	if(status=="failure"){
                    		callback({"error":{"message":"Welcome SMS not sent to "+user.mobileno}})
											}else{
												callback({"success":{"message":"User verified Successfully","user":user}});
                    	}
                    }else{
                    	callback({"success":{"message":"User verified Successfully","user":user}});
                    }
                  });//end of sendmessage
                  });//end of sendmessage
                });//end of sendmessage
              }else{
                if(templatename=="welcomesp"){
                  commonapi.sendMessage("1/2   \n"+smstemplate,mobileno,function(status){
                     commonapi.sendMessage("2/2   \n"+care_template,mobileno,function(status){
                       if(status=="failure"){
                       		logger.emit("error","");
			  									callback({"error":{"message":"Welcome SMS not sent to "+user.mobileno}})
                       }else{
                       	callback({"success":{"message":"User Verified Successfully","user":user}});
                       }
                    });//end of sendmessage
                  });//end of sendmessage              commonapi.sendMessage(template+"",mobileno,function(status){
                }else{
                  commonapi.sendMessage(smstemplate+"",mobileno,function(status){
                    if(status=="failure"){
                    	logger.emit("error","Welcome SMS not sent to smartphone user "+user.mobileno);
                    }
                    callback({"success":{"message":"User Verified Successfully","user":user}});
                  }) 
                }
              }
            }
          })
        }
      })
    }else{
    	logger.emit("error","smstemplate for "+templatename+" lang "+user.preffered_lang+" not exist");
			callback({"error":{"message":"SMS template Issue"}})
    }
  })
}
    
//to check email validation
var isValidEmail=function(email){

	if(email==undefined){
	 	return {"error":{"code":"AV001","message":"please enter emailid"}};
	}else if(email.trim().length==0){
		return {"error":{"code":"AV001","message":"please enter emailid"}};
	}else if(!regxemail.test(email)){
		return {"error":{"code":"AV001","message":"please enter valid email"}};
 	}else{
 		return {"success":{"message":"Valid email id"}};
 	}
}
//validate user registration data
var _validateRegisterUser = function(self,userdata) {
		//check if user exist in database
		//abc(err,userdata,this)
	if(userdata==undefined){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter userdata"}});
	}else if(userdata.mobileno==undefined){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter mobileno"}});
	} else if(userdata.firstname==undefined){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter firstname"}});
  } else if(userdata.mobileno.trim()==""){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter mobileno"}});
	} else if(S(userdata.mobileno).isNumeric() && userdata.mobileno.length!=10){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Mobile number should be 10 digit numeric"}});
	} else if(userdata.usertype==undefined || userdata.usertype==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please select usertype"}});   
  }else if(["individual","provider"].indexOf(userdata.usertype.toLowerCase())<0){
	  self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"usertype must be individual or seller"}});
	}else if(userdata.password==undefined || userdata.password==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter password"}});   
  }else if(userdata.username==undefined || userdata.username==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"please enter username"}});
  }else if(userdata.email==undefined || userdata.email==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"please enter email"}});
  }else if(isValidEmail(userdata.email).error!=undefined){
    self.emit("failedUserRegistration",isValidEmail(userdata.email));
  }else{
    if(userdata.location){
      if(userdata.location.country){
         CountryCodeModel.findOne({country:userdata.location.country.toLowerCase()},function(err,countrycode){
          if(err){
            logger.emit("error","Database Issue _validateRegisterUser "+err)
            self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
          }else if(!countrycode){
            self.emit("failedUserRegistration",{"error":{"message":"Cuntry does not exists"}});
          }else{
            userdata.countrycode=countrycode.code;
            userdata.mobileno=countrycode.code+userdata.mobileno;
           /////////////////////////////////////////////
           _checkMobileNumberAlreadyExists(self,userdata)
           //////////////////////////////////////////
           
          }
       })
      }else{
        userdata.countrycode="91";
         userdata.mobileno="91"+userdata.mobileno;
        /////////////////////////////////////////////
        _checkMobileNumberAlreadyExists(self,userdata)
        //////////////////////////////////////////
      }
    }else{
      userdata.countrycode="91";
       userdata.mobileno="91"+userdata.mobileno;
        /////////////////////////////////////////////
        _checkMobileNumberAlreadyExists(self,userdata)
        //////////////////////////////////////////
    }
         }
  }


var _checkMobileNumberAlreadyExists=function(self,userdata){
  UserModel.findOne({mobileno:userdata.mobileno},{usertype:1,mobileno:1,userid:1,preffered_lang:1}).lean().exec(function(err,user){
    if(err){
      logger.emit("error","Database Issue _checkMobileNumberAlreadyExists "+err)
      self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(user){
      if(userdata.usertype=="individual"){
       self.emit("failedUserRegistration",{"error":{"code":"AU001","message":"Mobile Number is already registered with OrderZapp"}});      
      }else if(user.usertype=="provider"){
        self.emit("failedUserRegistration",{"error":{"code":"AU001","message":"Mobile Number is already registered with OrderZapp"}});     
      }else{
        ///////////////////////////////////////
        _createOTPForConfirmProvider(self,user);
        ////////////////////////////////////////////
        // self.emit("failedUserRegistration",{"error":{"code":"PROV001","message":"Do You want become Provider "}});            
      }
      
    }else{
      logger.emit("log","_validated");
      
      ////////////////////////////
      _checkUserNameAlreadyExists(self,userdata);
      ////////////////////////////
      ///////////////////////////
      // _addUser(self,userdata);
      //////////////////////////
    }
  })
}
var _createOTPForConfirmProvider=function(self,user){
  var otpmodel=new OtpModel({_userId:user.userid,otptype:"provider"});
  otpmodel.save(function(err,otpdata){
    if(err){
      logger.emit("error","Database Issue :_createOTPForJoinProviderRequest/errormessage:"+err);
      self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(otpdata){
        var tempname="joinproviderrequest";
        var lang=user.preffered_lang; 
        ////////////////////////////////////////////////////////////////////////
        _sendProviderTokenToMobileNumber(self,user.mobileno,otpdata.otp,tempname,lang)
        ////////////////////////////////////
        
    }
  })       
}
var _sendProviderTokenToMobileNumber=function(self,mobileno,passwordotp,tempname,lang){
  SMSTemplateModel.findOne({name:tempname,lang:lang},function(err,smstemplatedata){
    if(err){
      logger.emit("error","Database Issue")
     self.emit("failedUserRegistration",{"error":{"message":"Database Issue"}})
    }else if(!smstemplatedata){
      logger.emit("error","Template "+tempname+" not found")
      self.emit("failedUserRegistration",{"error":{"message":"Template Issue"}})
    }else{
      var smstemplate=S(smstemplatedata.template);
      smstemplate=smstemplate.replaceAll("<otp>",passwordotp);
      var message=smstemplate.s;
      commonapi.sendMessage(message,mobileno,function(result){
        if(result=="failure"){
          logger.emit("error","sms not sent to "+mobileno)
          self.emit("failedUserRegistration",{"error":{"message":"Server Issue "}}) 
        }else{
         ////////////////////////////////////
         _successfullSignupProivder(self)
         //////////////////////////////////
        }
      }) 
    }
  })
}
var _successfullSignupProivder=function(self){
  self.emit("successfulUserRegistration",{success:{message:"You are an existing buyer, please verify your new seller account with verification token",code:"POTP"}})
}
var _checkUserNameAlreadyExists=function(self,userdata){
  UserModel.findOne({username:userdata.username},{username:1},function(err,usernamecheck){
    if(err){
      logger.emit("error","Database Issue _checkUserNameAlreadyExists "+err)
      self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});  
    }else if(usernamecheck){
      self.emit("failedUserRegistration",{"error":{"message":"Username not available"}});
    }else{
      ///////////////////////////
      _addUser(self,userdata);
      //////////////////////////
    }
  })
}
var _addUser = function(self,userdata) {
		//adding user
		userdata.phonetype="smart";
		var userobject=new UserModel(userdata);
	  userobject.save(function(err,user){
	    if(err){
	    	logger.emit("error","Database Issue"+err);
	      self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
	    }else if(user){  
		    var userid = user.userid;
				///////////////////////////////////
				_createOtp(self,user);		        
				///////////////////////////////////
	     }
	  })
	};

var _createOtp=function(self,user){
	var otpmodel=new OtpModel({_userId:user.userid,otptype:"verify"});
  otpmodel.save(function(err,otpdata){
    if(err){
      logger.emit("error","Database Issue :_createOtp/errormessage:"+err);
      self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(otpdata){
        var tempname="otp";
        var lang="EN"; 
        if(user.countrycode=="91"){//for Indian customer
           ////////////////////////
        _sendOTPToMobileNumber(user.mobileno,otpdata.otp,tempname,lang,user,function(result){
          if(result.error!=undefined){
            self.emit("failedUserRegistration",result);
          }else{
            ///////////////////////////
            _successfullUserRegistration(self);
            //////////////////////
          }
        });
        }else{
          var to=user.email;
          var templatetype="verify";
          var data={email:user.email,otp:otpdata.otp,firstname:user.firstname}
          emailtemplateapi.sendEmailNotification(templatetype,data,to,function(err,result){
            if(err){
              self.emit("failedUserRegistration",err)
            }else{
              var data="Please enter your One Time Password <otp> to verify your registration with OrderZapp";
              data=S(data).replaceAll("<otp>",otpdata.otp);
              data={message1:data.s}
               // data={suborderid:"sunil"};
              
              if(user.gcmregistrationid){
                gcmapi.sendGCMNotification(data,user.gcmregistrationid,function(err,result){
                  if(err){
                    logger.emit("error","err"+err)
                  }else{
                    logger.emit("log",result.success.message);
                  }
                }) 
              }
              ///////////////////////////
             _successfullUserRegistration(self);
             //////////////////////
            }
          })
        } 
      }
  })       
}
var _successfullUserRegistration=function(self){
	self.emit("successfulUserRegistration", {"success":{"message":"User Added Successfully",code:""}});
}
User.prototype.verifyUser = function(otp) {
	var self=this;
  logger.emit("log","test");
	///////////////////////////////////
	_validateverifyUser(self,otp);
	 ////////////////////////////////////
};
var _validateverifyUser=function(self,otp){
	if(otp==undefined){
		self.emit("failedVerifyUser",{"error":{"code":"AV001","message":"please enter otp"}});
	}else if(otp.trim().length==0){
		self.emit("failedVerifyUser",{"error":{"code":"AV001","message":"please enter otp"}});
	}else{
		 logger.emit("log","test1");
		////////////////////////
		_verifyUser(self,otp);
		///////////////////////
	}
}
var _verifyUser=function(self,otp){
	 logger.emit("log","test2");
	verifyMobileNumber(otp,function(result){
		logger.emit("log","test3");
		if(result.error!=undefined){
			self.emit("failedVerifyUser",result);
		}else{//successfull verification
			logger.emit("log",result);
			self.emit("successfulVerifyUser",result);
		}
	})
}
User.prototype.signin = function() {
   var self=this;
   var userdata=self.user;

   /////////////////////////////
  _validateSignin(self,userdata);
  /////////////////////////////
  }
var _validateSignin=function(self,userdata){
  console.log("signin1");
  if(userdata==undefined){
    self.emit("failedUserSignin",{"error":{"code":"AV001","message":"please enter userdata"}});
  }else if(userdata.mobileno==undefined || userdata.mobileno==""){
    self.emit("failedUserSignin",{"error":{"code":"AV001","message":"please enter Username or Email"}});
  }else if(userdata.password==undefined || userdata.password==""){
    self.emit("failedUserSignin",{"error":{"code":"AV001","message":"please enter password"}});
  }else{
    
    
    //_passportauthenticate(self,userdata);
    self.emit("passportauthenticate",userdata);
    ///////////////////////
  }
}
User.prototype.signinSession=function(user){
var self=this;

  UserModel.findOne({mobileno:{$regex:user.mobileno,$options:'i'}},function(err,userdata){
    if(err){
      logger.emit('error',"DatabaseIssue fun:signinSession"+err,user.mobileno);
      self.emit("failedUserSignin",{"error":{"code":"ED001","message":" Db error:signinSession"+err}});
    }else if(!userdata){
      self.emit("failedUserSignin",{"error":{"code":"AV001","message":"please enter password"}});
    }else{
      //////////////////////
      _isUserHaveProductProviderdetais(self,userdata);
      ////////////////////
    }
  })
};
var _isUserHaveProductProviderdetais=function(self,userdata){
  // var provider=[{providerid:"a",branchid:"11"},{providerid:"1",branchid:"12"},{providerid:"1",branchid:"13"},{providerid:"2",branchid:"21"}]
  var a=__.groupBy(userdata.provider,"providerid");
  // console.log("group by data"+JSON.stringify(a));
  var providerarray=[];
  // console.log("group by dddd"+__.keys(a));
  for (k in a ) {
     console.log(k);
     var provider_object={providerid:k,branches:a[k]}
     
     providerarray.push(provider_object)
  }
console.log("provider_array"+JSON.stringify(providerarray))
  // if(userdata.hhusverifyUserertype=="serviceprovider" && userdata.serviceproviders.length==0){
  //   self.emit("failedUserSignin",{"error":{"code":"AS001","message":"Please add an srviceprovider details"}});
  // }else{
    userdata=JSON.stringify(userdata);
    userdata=JSON.parse(userdata);
    userdata.provider=providerarray
      //////////////////////////////////////
      _successfulUserSigin(self,userdata);
      /////////////////////////////////////
  // }
}
var _successfulUserSigin = function(self,user) {
    //validate the user data

    logger.emit("log","successfulUserSignin");
    self.emit("successfulUserSignin",{"success":{"message":"Login Successful","user":user}});
  }
 User.prototype.getUser = function(userid) {
  var self=this;
  _getUser(self,userid);
};
var _getUser=function(self,userid){
  UserModel.findOne({userid:userid,status:"active"},{verified:0,status:0,password:0,payment:0,isAdmin:0}).lean().exec(function(err,user){
    if(err){
      self.emit("failedUserGet",{"error":{"code":"ED001","message":"Error in db to find user"}});
    }else if(user){
      ////////////////////////////////
      _successfulUserGet(self,user);
      //////////////////////////////////
    }else{
        self.emit("failedUserGet",{"error":{"code":"AU005","message":"Incorrect User id"}});
    }
  })
}
var _successfulUserGet=function(self,user){
  logger.emit("log","_successfulUserGet");
  self.emit("successfulUserGet", {"success":{"message":"Getting User details Successfully","user":user}});
}
User.prototype.updateUser = function(userid) {
  var self=this;
  var userdata=this.user;
  if(userdata==undefined){
    self.emit("failedUserUpdation",{"error":{"code":"AV001","message":"Please provide userdata"}}); 
  }else if(userdata.payment!=undefined  ||userdata.verified!=undefined || userdata.status!=undefined || userdata.provider!=undefined){
    self.emit("failedUserUpdation",{"error":{"code":"","message":"You cannot update the user data"}});  
  }else{
    /////////////////////////////////////////
    _isContainsPassword(self,userid,userdata)
    /////////////////////////////////////////
    // //////////////////////////////////
    // _updateUser(self,userid,userdata);
    // //////////////////////////////////
  
  }
};
var _isContainsPassword=function(self,userid,userdata){
  if(userdata.password!=undefined){
    if(userdata.password.length==0){
      self.emit("failedUserUpdation",{"error":{"message":"Password should not be empty"}});  
    }else{
      commonapi.getBcryptString(userdata.password,function(err,newencryptedpasswrod){
        if(err){
          logger.emit("error","Error to encrypt password _updatePassword");
          self.emit("failedUserUpdation",{"error":{"message":"Server error! please try again"}}); 
        }else{
          userdata.password=newencryptedpasswrod;
          ////////////////////////////////////
          _checkUserNameAlreadyExistsForUpdateUser(self,userid,userdata)
          //////////////////////////////////
          /////////////////////////////////
          // _updateUser(self,userid,userdata)
           ////////////////////////////////
        }
      })
    }
  }else{
       ////////////////////////////////////
        _checkUserNameAlreadyExistsForUpdateUser(self,userid,userdata)
      //////////////////////////////////
  }
}
var _checkUserNameAlreadyExistsForUpdateUser=function(self,userid,userdata){
  UserModel.findOne({username:userdata.username,userid:{$ne:userid}},function (err,user) {
    // body...
    if(err){
      logger.emit("error","Error to encrypt password _checkUserNameAlreadyExistsForUpdateUser");
      self.emit("failedUserUpdation",{"error":{"message":"Server error! please try again"}}); 
    } else if(user){
      self.emit("failedUserUpdation",{"error":{"message":"Username already exists, please try another username"}}); 
    }else{
       /////////////////////////////////
        _updateUser(self,userid,userdata)
      ////////////////////////////////
    }
  })
}
var _updateUser=function(self,userid,userdata){
  UserModel.update({userid:userid},{$set:userdata},function(err,userupdatestatus){
    if(err){
      self.emit("failedUserUpdation",{"error":{"code":"ED001","message":"Error in db to update user data"}});
    }else if(userupdatestatus!=1){

      self.emit("failedUserUpdation",{"error":{"code":"AU005","message":"Incorrect Userid"}});
    }else{
      /////////////////////////////
      _successfulUserUpdation(self);
      /////////////////////////////
    }
  })
}
var _successfulUserUpdation = function(self) {
  logger.emit("log","successfulUserUpdation");
  self.emit("successfulUserUpdation", {"success":{"message":"User Updated Successfully"}});
}
User.prototype.sendPasswordSetting = function(mobileno) {
  console.log("mobileno@@@ "+mobileno);
  var self=this; 
  if(mobileno==undefined || mobileno.trim()==""){
    self.emit("failedSendPasswordSetting",{"error":{"code":"AV001","message":"Please enter mobileno"}}); 
  }else if(!S(mobileno).isNumeric()){
    self.emit("failedSendPasswordSetting",{"error":{"code":"AV001","message":"Mobile number should be numeric"}});  
  }else{
    ////////////////////////////////////
    _sendPasswordSetting(self,mobileno)
    /////////////////////////////////////
  }
};
var _sendPasswordSetting=function(self,mobileno){
  UserModel.findOne({mobileno:mobileno},{mobileno:1,userid:1},function(err,user){
    if(err){
      logger.emit("error","sendPasswordSetting"+err)
      self.emit("failedSendPasswordSetting",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(!user){
      self.emit("failedSendPasswordSetting",{"error":{"message":"Mobile Number is no registered with OrderZapp"}});
    }else{
      ////////////////////////////////////////////
      _createOTPForPasswordSettings(self,user)
      ////////////////////////////////////////////
    }
  })
}
var _createOTPForPasswordSettings=function(self,user){
  var otpmodel=new OtpModel({_userId:user.userid,otptype:"password"});
  otpmodel.save(function(err,otpdata){
    if(err){
      logger.emit("error","Database Issue :_createOTPForPasswordSettings"+err);
      self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(otpdata){
        var tempname="password";
        var lang="EN"; 
        //////////////////////////////////////////////////////////////////////
        _sendPasswordOtpToMobileNumber(self,user.mobileno,otpdata.otp,tempname,lang)
        ////////////////////////////////////////////////////////////////////////
          
    }
  }) 
}
var _sendPasswordOtpToMobileNumber=function(self,mobileno,passwordotp,tempname,lang){
  SMSTemplateModel.findOne({name:tempname,lang:lang},function(err,smstemplatedata){
    if(err){
      logger.emit("error","Database Issue")
     self.emit("failedUserRegistration",{"error":{"message":"Database Issue"}})
    }else if(!smstemplatedata){
      logger.emit("error","Template "+tempname+" not found")
      self.emit("failedUserRegistration",{"error":{"message":"Template Issue"}})
    }else{
      var smstemplate=S(smstemplatedata.template);
      smstemplate=smstemplate.replaceAll("<otp>",passwordotp);
      var message=smstemplate.s;
      commonapi.sendMessage(message,mobileno,function(result){
        if(result=="failure"){
          logger.emit("error","sms not sent to "+mobileno)
          self.emit("failedUserRegistration",{"error":{"message":"Server Issue "}}) 
        }else{
         ////////////////////////////////////
         _successfullForgotPasswordSettings(self)
         //////////////////////////////////
        }
      }) 
    }
  })
}
var _successfullForgotPasswordSettings=function(self){
  self.emit("successfulForgotPassword",{success:{message:"Forgot Password Setting Send Successfully"}});
}
User.prototype.resetPasswordRequest = function(otp) {
  var self=this;
 
  if(otp==undefined || otp.trim()==""){
    self.emit("failedresetPasswordRequest",{"error":{"code":"AV001","message":"Please enter otp"}}); 
  }else{
    ////////////////////////////////////
    _resetPasswordRequest(self,otp)
    /////////////////////////////////////
  }
};
var _resetPasswordRequest=function(self,otp){
  OtpModel.findOne({otp:otp,status:"active",otptype:"password"},function(err,otpdata){
    if(err){
      logger.emit("error","Database error:/_resetPasswordRequest"+err);
      self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Issue"}})   
    } else if(!otpdata){
       self.emit("failedresetPasswordRequest",{"error":{"message":"Incorrect or expired OTP"}}); 
    }else{
      UserModel.findOne({ userid: otpdata._userId},function(err,user){
        if(err){
          logger.emit("error","Database error:/_resetPasswordRequest"+err);
          self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Issue"}})             
        } else if(!user){
          self.emit("failedresetPasswordRequest",{"error":{"message":"Incorrect User id"}});    
        }else{
          OtpModel.update({otp:otp,status:"active"},{$set:{status:"deactive"}},function(err,otpstatus){
            if(err){
              logger.emit("error","Database error:/_resetPasswordRequest"+err);
            }else{
              logger.emit("log","otp set to deactive") 
            }
          })
          /////////////////////////////////
          _sendNewPassWord(self,user)
          /////////////////////////////////

        }
      })
    }
  })
}
var _sendNewPassWord=function(self,user){
  var otp = Math.floor(Math.random()*100000000);
  user.password=otp;
  user.save(function(err,userdata){
    if(err){
      logger.emit("error","Database error:/_sendNewPassWord"+err);
      self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Error"}})             
    }else{
      SMSTemplateModel.findOne({name:"newpassword",lang:user.preffered_lang},function(err,smstemplatedata){
        if(err){
          logger.emit("error","Database error:/_sendNewPassWord"+err);
          self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Error"}})             
        }else if(!smstemplatedata){
          logger.emit("error","Template newpassword not found")
          self.emit("failedresetPasswordRequest",{"error":{"message":"Template Error"}})
        }else{
          var smstemplate=S(smstemplatedata.template);
          smstemplate=smstemplate.replaceAll("<password>",otp);
          var message=smstemplate.s;
          commonapi.sendMessage(message,user.mobileno,function(result){
            if(result=="failure"){
              logger.emit("error","newpassword not sent to"+user.mobileno)
              self.emit("failedresetPasswordRequest",{"error":{"message":"Server Error"}})
            }else{
              ////////////////////////////////////
              _successfullNewPassword(self)
              ///////////////////////////////////
            }
          }) 
        }
      })
    }
  })
}
var _successfullNewPassword=function(self){
 self.emit("successfulresetPasswordRequest",{"success":{"message":"Your new password sent successfully to your mobileno"}}) 
}
User.prototype.regenerateotp = function(mobileno) {
  var self=this;
 
 if(mobileno==undefined || mobileno.trim()==""){
    self.emit("failedregenerateotp",{"error":{"code":"AV001","message":"Please enter mobileno"}}); 
  }else if(!S(mobileno).isNumeric()){
    self.emit("failedregenerateotp",{"error":{"code":"AV001","message":"Mobile number should be numeric"}});  
  }else{
    ////////////////////////////////////
    _checkMobileNumberForRegenerateOTP(self,mobileno)
    /////////////////////////////////////
  }
};
var _checkMobileNumberForRegenerateOTP=function(self,mobileno){
  UserModel.findOne({mobileno:mobileno},{mobileno:1,userid:1,preffered_lang:1},function(err,user){
    if(err){
      logger.emit("error","_regenerateOTP"+err)
      self.emit("_regenerateOTP",{"error":{"code":"ED001","message":"Database Error"}});
    }else if(!user){
      self.emit("failedregenerateotp",{"error":{"message":"Mobile Number is not registered with OrderZapp"}});
    }else{
      ////////////////////////////////////////////
      _regenerateotp(self,user)
      ////////////////////////////////////////////
    }
  })
}
var _regenerateotp=function(self,user){
  var otpmodel=new OtpModel({_userId:user.userid,otptype:"verify"});
  otpmodel.save(function(err,otpdata){
    if(err){
      logger.emit("error","Database Issue :_regenerateotp/errormessage:"+err);
      self.emit("failedregenerateotp",{"error":{"code":"ED001","message":"Database Error"}});
    }else if(otpdata){
        var tempname="otp";
        var lang=user.preffered_lang; 
        ////////////////////////
        _sendOTPToMobileNumber(user.mobileno,otpdata.otp,tempname,lang,function(result){
          if(result.error!=undefined){
            self.emit("failedregenerateotp",result);
          }else{
            ///////////////////////////
            _successfullRegenerateOTP(self);
            //////////////////////
          }
        });
    }
  })       
}
var _successfullRegenerateOTP=function(self){
  self.emit("successfulregenerateotp",{"success":{"message":"OTP regenerated and sent successfully"}});
}
User.prototype.joinproviderrequest = function(mobileno) {
  var self=this;
 
 if(mobileno==undefined || mobileno.trim()==""){
    self.emit("failedjoinproviderrequest",{"error":{"code":"AV001","message":"Please enter mobileno"}}); 
  }else if(!S(mobileno).isNumeric()){
    self.emit("failedjoinproviderrequest",{"error":{"code":"AV001","message":"Mobile number should be numeric"}});  
  }else{
    //////////////////////////////////////////////////////
    _checkMobileNumberForJoinProviderRequest(self,mobileno)
    ////////////////////////////////////////////////////
  }
};
var _checkMobileNumberForJoinProviderRequest=function(self,mobileno){
  UserModel.findOne({mobileno:mobileno},{mobileno:1,preffered_lang:1,userid:1}, function(err,user){
    if(err){
      logger.emit("error","Database Issue :_checkMobileNumberForJoinProviderRequest/errormessage:"+err);
      self.emit("failedjoinproviderrequest",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(!user){
       self.emit("failedjoinproviderrequest",{"error":{"message":"Mobile Number is not registered with OrderZapp"}}); 
    }else{
      ///////////////////////////////////////////
      _createOTPForJoinProviderRequest(self,user)
      /////////////////////////////////////////
    }
  })
}
var _createOTPForJoinProviderRequest=function(self,user){
  var otpmodel=new OtpModel({_userId:user.userid,otptype:"provider"});
  otpmodel.save(function(err,otpdata){
    if(err){
      logger.emit("error","Database Error :_createOTPForJoinProviderRequest/errormessage:"+err);
      self.emit("failedjoinproviderrequest",{"error":{"code":"ED001","message":"Database Error"}});
    }else if(otpdata){
        var tempname="joinproviderrequest";
        var lang=user.preffered_lang; 
        ///////////////////////////////
        _sendProviderOtpToMobileNumber(self,user.mobileno,otpdata.otp,tempname,lang)
        ////////////////////////////////////
        
    }
  })       
}
var _sendProviderOtpToMobileNumber=function(self,mobileno,passwordotp,tempname,lang){
  SMSTemplateModel.findOne({name:tempname,lang:lang},function(err,smstemplatedata){
    if(err){
      logger.emit("error","Database Error")
     self.emit("failedjoinproviderrequest",{"error":{"message":"Database Error"}})
    }else if(!smstemplatedata){
      logger.emit("error","Template "+tempname+" not found")
      self.emit("failedjoinproviderrequest",{"error":{"message":"Template Error"}})
    }else{
      var smstemplate=S(smstemplatedata.template);
      smstemplate=smstemplate.replaceAll("<otp>",passwordotp);
      var message=smstemplate.s;
      commonapi.sendMessage(message,mobileno,function(result){
        if(result=="failure"){
          logger.emit("error","SMS not sent to "+mobileno)
          self.emit("failedjoinproviderrequest",{"error":{"message":"Server Error "}}) 
        }else{
         ////////////////////////////////////
         _successfullJoinProviderRequest(self)
         //////////////////////////////////
        }
      }) 
    }
  })
}
var _successfullJoinProviderRequest=function(self){
  self.emit("successfuljoinproviderrequest",{success:{message:"Seller Request OTP sent to your mobile number"}})
}
User.prototype.confirmjoinproviderrequest = function(otp) {
  var self=this;
 
  if(otp==undefined || otp.trim()==""){
    self.emit("failedconfirmjoinproviderrequest",{"error":{"code":"AV001","message":"Please enter otp"}}); 
  }else{
    ////////////////////////////////////
    _confirmjoinproviderrequest(self,otp)
    /////////////////////////////////////
  }
};
var _confirmjoinproviderrequest=function(self,otp){
  OtpModel.findOne({otp:otp,status:"active",otptype:"provider"},function(err,otpdata){
    if(err){
      logger.emit("error","Database error:/_confirmjoinproviderrequest"+err);
      self.emit("failedconfirmjoinproviderrequest",{"error":{"code":"ED001","message":"Database Error"}})   
    } else if(!otpdata){
       self.emit("failedconfirmjoinproviderrequest",{"error":{"message":"Incorrect or expired OTP"}}); 
    }else{
      UserModel.findAndModify({ userid: otpdata._userId},[],{$set: {usertype:"provider"}},{new:false},function(err,user){
        if(err){
          logger.emit("error","Database error:/_confirmjoinproviderrequest"+err);
          self.emit("failedconfirmjoinproviderrequest",{"error":{"code":"ED001","message":"Database Error"}})             
        } else if(!user){
          self.emit("failedconfirmjoinproviderrequest",{"error":{"message":"Incorrect Userid"}});    
        }else{
          OtpModel.update({otp:otp,status:"active"},{$set:{status:"deactive"}},function(err,otpstatus){
            if(err){
              logger.emit("error","Database error:/_confirmjoinproviderrequest"+err);
            }else{
              logger.emit("log","OTP set to deactive") 
            }
          })
          /////////////////////////////////
          _successfullconfirmjoinproviderrequest(self,user)
          /////////////////////////////////

        }
      })
    }
  })
}
var _successfullconfirmjoinproviderrequest=function(self,user){
 self.emit("successfulconfirmjoinproviderrequest",{success:{message:"You are ready to become provider,Pleae signin with this application and add provider details",user:user}}) 
}

User.prototype.getCountryCodes = function() {
  var self=this;
  _getCountryCodes(self);
};

var _getCountryCodes=function(self){
  CountryCodeModel.find({},{country:1,code:1,isocode1:1,_id:0}).sort({country:1}).lean().exec(function(err,countrycode){
    if(err){
      logger.emit("error","Database Issue:"+err)
      self.emit("failedGetCountryCode",{"error":{"code":"ED001","message":"Error in Database"}});
    }else if(countrycode){
      ////////////////////////////////
      _successfulGetCountryCode(self,countrycode);
      //////////////////////////////////
    }else{
        self.emit("failedGetCountryCode",{"error":{"code":"AU005","message":"Country code does not exist"}});
    }
  })
}

var _successfulGetCountryCode=function(self,countrycode){
  logger.emit("log","_successfulGetCountryCode");
  self.emit("successfulGetCountryCode", {"success":{"message":"Getting Country Code Details Successfully","countrycode":countrycode}});
}

User.prototype.productRecommend = function(productid,userid) {
  var self=this;
  _isValidProduct(self,productid,userid);
};

var _isValidProduct = function(self,productid,userid){
  productCatalog.findOne({status:"active",productid:productid}).lean().exec(function(err,product){
    if(err){
      self.emit("failedProductRecommend",{"error":{"code":"ED001","message":"Error in db to find product"}});
    }else if(product){
      console.log("Product : "+JSON.stringify(product));
      ///////////////////////////////////////
      _checkAlreadyRecommendedByUser(self,product,userid);
      //////////////////////////////////////
    }else{
        self.emit("failedProductRecommend",{"error":{"code":"AU005","message":"Incorrect productid"}});
    }
  })
}

var _checkAlreadyRecommendedByUser = function(self,product,userid){
  UserModel.findOne({userid:userid,"products_recommends.productid":product.productid}).lean().exec(function(err,product){
    if(err){
      self.emit("failedProductRecommend",{"error":{"code":"ED001","message":"Error in db to find product"}});
    }else if(product){
      self.emit("failedProductRecommend",{"error":{"code":"AU005","message":"You have already recommended this product"}});
    }else{
      ///////////////////////////////////////
      _productRecommend(self,product,userid);
      //////////////////////////////////////        
    }
  })
}

var _productRecommend = function(self,product,userid){
  var product_recommend = {productid:product.productid,providerid:product.provider.providerid,branchid:product.branch.branchid};
  console.log("productRecommend : "+JSON.stringify(product_recommend));
  UserModel.update({userid:userid},{$push:{products_recommends:product_recommend}}).lean().exec(function(err,user){
    if(err){
      self.emit("failedProductRecommend",{"error":{"code":"ED001","message":"Error in db to update user"}});
    }else if(user!=1){
      self.emit("failedProductRecommend",{"error":{"code":"AU005","message":"Incorrect userid"}});      
    }else{
      ////////////////////////////////
      _successfulProductRecommend(self);
      //////////////////////////////////  
    }
  })
}

var _successfulProductRecommend=function(self){
  logger.emit("log","_successfulProductRecommend");
  self.emit("successfulProductRecommend", {"success":{"message":"Product Recommended Successfully"}});
}

User.prototype.userordersCount = function(userid) {
  var self=this;
  _usersCount(self);
};
var _usersCount = function(self){
  var obj = {};
  UserModel.count().exec(function(err,user){
    if(err){
      logger.emit("error","Error in db to get user count "+err);
      self.emit("failedGetUserOrdersCount",{"error":{"code":"ED001","message":"Error in db to get user count"}});
    // }else if(!user){
    //   self.emit("failedGetUserOrdersCount",{"error":{"code":"AU005","message":"Users not exist"}});
    }else{
      obj = {users:user};
      _ordersCount(self,obj);
    }   
  })  
}
var _ordersCount = function(self,obj){
  OrderModel.count().exec(function(err,orders){
    if(err){
      logger.emit("error","Error in db to get user count "+err);
      self.emit("failedGetUserOrdersCount",{"error":{"code":"ED001","message":"Error in db to get orders count"}});
    // }else if(!orders){
    //     self.emit("failedGetUserOrdersCount",{"error":{"code":"AU005","message":"Orders not exist"}});
    }else{
      obj.orders = orders;
      ////////////////////////////////////////
      _successfulGetUserOrdersCount(self,obj);
      ////////////////////////////////////////
    }
  })
}
var _successfulGetUserOrdersCount=function(self,count){
  logger.emit("log","_successfulGetUserOrdersCount");
  self.emit("successfulGetUserOrdersCount", {"success":{"message":"Getting Users & Orders Counts Successfully",count:count}});
}

User.prototype.getMyDeliveryAddressHistory = function(userid) {
  var self=this;
  _getMyDeliveryAddressHistory(self,userid);
};
var _getMyDeliveryAddressHistory=function(self,userid){
  DeliveryAddressModel.find({userid:userid},{_id:0,userid:0,__v:0},function(err,deliveryaddresses){
    if(err){
      self.emit("failedGetMyDeliveryAddressHistory",{error:{message:"Database Issue",code:"ED001"}})
    }else if(deliveryaddresses.length==0){
      self.emit("failedGetMyDeliveryAddressHistory",{error:{message:"No Delivery Address history exists"}})
    }else{
      ///////////////////////////////////////////
      _successfullGetMYDeliveryAddressHistory(self,deliveryaddresses)
      //////////////////////////////////////////
    }
  })
}
var _successfullGetMYDeliveryAddressHistory=function(self,deliveryaddresses){
  self.emit("successfulGetMyDeliveryAddressHistory",{success:{message:"Getting My Delivery Address History Successfully",deliveryaddresses:deliveryaddresses}})
}

User.prototype.uploadAPK = function(user,apk){
  var self=this;
  var data = this.user;
  console.log("apk "+JSON.stringify(apk));
  //////////////////////////////////
  _validateUploadApkData(self,data,apk,user);
  //////////////////////////////////
};
var _validateUploadApkData=function(self,data,apk,user){
  if(data == undefined){
    self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please enter data"}});
  }else if(data.version == undefined || data.version == ""){
    self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please enter version"}});
  }else if(data.description == undefined || data.description == ""){
    self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please enter description"}});
  }else if(apk==undefined){
    self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please upload apk"}});
  }else if(apk.originalFilename==""){
    self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please upload apk"}});
  // }else if(!S(apk.mimetype).contains("application/vnd.android.package-archive")){
  //   self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please upload apk file only"}});
  }else if(!S(apk.extension).contains("apk")){
    self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Please upload apk file only"}});
  }else{
    if(apk!=undefined){
      //////////////////////////////////////////////////////////////////////////////
      _uploadAPK(data,user,apk,function(err,result){
        if(err){
          console.log("Apk not uploaded : "+err);
          logger.emit("Apk not uploaded");
          self.emit("failedUploadApk",{"error":{"code":"AV001","message":"Apk not uploaded"}});
        }else{
          console.log("Apk uploaded with version details");
          logger.emit("Apk uploaded with version details");
          _successfulUploadApk(self);
        }
      });
      ///////////////////////////////////////////////////////////////////////////////
    }
  }
}
var _uploadAPK = function(data,user,apk,callback){
  console.log("_uploadAPK");
  fs.readFile(apk.path,function (err, data) {
      if(err){
        callback({error:{code:"ED001",message:"Database Issue"}});
      }else{
        var ext = path.extname(apk.originalname||'').split('.');
        ext=ext[ext.length - 1];
        var s3filekey=Math.floor((Math.random()*1000)+1)+"."+ext;
        var bucketFolder;
        var params;
        bucketFolder=amazonbucket+"/apk";
        params = {
           Bucket: bucketFolder,
           Key:"order-zapp-buyers.apk",
           Body: data,
           ACL: 'public-read',
           ContentType: apk.mimetype
        };
        //////////////////////////////////////////////////////////////////////////
        _addApkToAmazonServer(data,params,user,apk,function(err,result){
          if(err){
            callback(err);
          }else{  
            callback(null,result);
          }
        });
        ////////////////////////////////////////////////////////////////////////////
      }
    });
}
var _addApkToAmazonServer=function(data,awsparams,user,apk,callback){
  console.log("_addApkToAmazonServer");
  s3bucket.putObject(awsparams, function(err, data) {
    if (err) {
      callback({"error":{"message":"s3bucket.putObject:-_addApkToAmazonServer"+err}});
    } else {
      var params1 = {Bucket: awsparams.Bucket, Key: awsparams.Key,Expires: 60*60*24*365};
      console.log("params1 : "+JSON.stringify(params1))
      s3bucket.getSignedUrl('getObject',params1, function (err, url) {
        console.log("getobject "+JSON.stringify(url));
        if(err){
          callback({"error":{"message":"_addApkToAmazonServer:Error in getting getSignedUrl"+err}});
        }else{
          var providerurl = {bucket:params1.Bucket,key:params1.Key,image:url};
         ApkModel.findAndModify({"apk.key":"order-zapp-buyers"},[],{$set:{apk:providerurl}},{new:false},function(err,oz_apk){
          // console.log("oz_apk : "+JSON.stringify(oz_apk));
          if(err){
            logger.emit('error',"Database Error  _addApkToAmazonServer"+err,user.userid)
            callback({"error":{"code":"ED001","message":"Database Error"}});
          }else if(!oz_apk){
            // console.log("data : "+data);
            // callback({"error":{"message":"apk does not exist"}});
            data.apk = providerurl;
            var apk_obj = new ApkModel(data);
            apk_obj.save(function(err,apkdata){
              if(err){
                logger.emit("error","Database Error :_createOTPForJoinProviderRequest/errormessage:"+err);
                self.emit("failedjoinproviderrequest",{"error":{"code":"ED001","message":"Database Error"}});
              }else if(apkdata){                  
                callback(null,{"success":{"message":"Apk Uploaded Successfully","image":url}}); 
              }
            }) 
          }else{
            console.log("data : "+JSON.stringify(data));
            var apk_obj=oz_apk.apk;
            if(apk_obj==undefined){
              logger.emit("log","Apk changed");
            }else{
              var awsdeleteparams={Bucket:apk_obj.bucket,Key:apk_obj.key};
              logger.emit("log",awsdeleteparams);
              // s3bucket.deleteObject(awsdeleteparams, function(err, deleteproviderlogostatus) {
              //   if (err) {
              //    logger.emit("error","Apk not deleted from amazon s3 bucket "+err,user.userid);
              //   }else if(deleteproviderlogostatus){
              //    logger.emit("log","Apk deleted from Amazon S3");
              //   }
              // }) 
            }
            exec("rm -rf "+apk.path);
            console.log("rm -rf "+apk.path);               
                      
              callback(null,{"success":{"message":"Apk Uploaded Successfully","image":url}});
            }
          })
        }
      });
    }
  }) 
}
var _successfulUploadApk = function(self){
  self.emit("successfulUploadApk",{"success":{"message":"Apk Added Successfully"}});
}