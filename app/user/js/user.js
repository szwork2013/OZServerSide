
var UserModel=require("./user-model");
var OtpModel=require("../../common/js/otp-model");
var productCatalog = require("../../productcatalog/js/product-catalog-model");
var OrderModel = require("../../productorder/js/productorder-model");
var SMSTemplateModel=require("../../common/js/sms-template-model");
var SMSFormatModel=require("../../common/js/sms-format-model");
var events = require("events");
var logger=require("../../common/js/logger");
var commonapi=require("../../common/js/common-api");
var S=require('string');
var __=require("underscore");
var DeliveryAddressModel=require("../../productorder/js/delivery-address-history-model")
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
var _sendOTPToMobileNumber=function(mobileno,otp,tempname,lang,callback){
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
          callback({"error":{"message":"sms format not found "+tempname}})
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
       		callback({"error":{"message":"Userid is wrong"}});  	
        }
      })
    }else{
    	callback({"error":{"message":"OTP is wrong or expired"}}); 
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
          logger.emit("error","smstemplate for care lang "+user.preffered_lang+" not exist");
			    callback({"error":{"message":"Sms template Issue"}})
        }else{
          SMSFormatModel.findOne({name:"care"},function(err,careformat){
            if(err){
              logger.emit("error","Database error:/sendWelcomeSms"+err);
			 			 callback({"error":{"code":"ED001","message":"Database Issue"}})
            }else if(!careformat){
              logger.emit("error","smsformat for care  not exist");
			  			callback({"error":{"message":"SmsFormat collection not exist for care"}})
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
                    		callback({"error":{"message":"Welcome Sms not sent to "+user.mobileno}})
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
			  									callback({"error":{"message":"Welcome Sms not sent to "+user.mobileno}})
                       }else{
                       	callback({"success":{"message":"User verified Successfully","user":user}});
                       }
                    });//end of sendmessage
                  });//end of sendmessage              commonapi.sendMessage(template+"",mobileno,function(status){
                }else{
                  commonapi.sendMessage(smstemplate+"",mobileno,function(status){
                    if(status=="failure"){
                    	logger.emit("error","Welcome sms not sent to smartphone user "+user.mobileno);
                    }
                    callback({"success":{"message":"User verified Successfully","user":user}});
                  }) 
                }
              }
            }
          })
        }
      })
    }else{
    	logger.emit("error","smstemplate for "+templatename+" lang "+user.preffered_lang+" not exist");
			callback({"error":{"message":"Sms template Issue"}})
    }
  })
}
    
//to check email validation
var isValidEmail=function(email){

	if(email==undefined){
	 	return {"error":{"code":"AV001","message":"please pass emailid"}};
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
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please provide userdata"}});
	}else if(userdata.mobileno==undefined){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please provide mobileno"}});
	} else if(userdata.firstname==undefined){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter firstname"}});
  } else if(userdata.mobileno.trim()==""){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please provide mobileno"}});
	} else if(S(userdata.mobileno).isNumeric() && userdata.mobileno.length!=12){
		self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Mobile number should be numeric and 10 digit"}});
	} else if(userdata.usertype==undefined || userdata.usertype==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please select usertype"}});   
  }else if(["individual","provider"].indexOf(userdata.usertype.toLowerCase())<0){
	  self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"usertype must be individual or provider"}});
	}else if(userdata.password==undefined || userdata.password==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"Please enter password"}});   
  }else if(userdata.username==undefined || userdata.username==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"please enter username"}});
  }else if(userdata.email==undefined || userdata.email==""){
    self.emit("failedUserRegistration",{"error":{"code":"AV001","message":"please enter emai l"}});
  }else if(isValidEmail(userdata.email).error!=undefined){
    self.emit("failedUserRegistration",isValidEmail(userdata.email));
  }else{
      CountryCodeModel.findOne({country:"india"},function(err,countrycode){
        if(err){
          logger.emit("error","Database Issue _validateRegisterUser "+err)
          self.emit("failedUserRegistration",{"error":{"code":"ED001","message":"Database Issue"}});
        }else if(!countrycode){
          self.emit("failedUserRegistration",{"error":{"message":"Country code not exist for your country"}});
        }else{

          // userdata.mobileno=countrycode.code+userdata.mobileno;
        /////////////////////////////////////////////
        _checkMobileNumberAlreadyExists(self,userdata)
        //////////////////////////////////////////
        }
      })
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
  self.emit("successfulUserRegistration",{success:{message:"You are an existing consumer user,please veify your new provider account with the verification token",code:"POTP"}})
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
        ////////////////////////
        _sendOTPToMobileNumber(user.mobileno,otpdata.otp,tempname,lang,function(result){
          if(result.error!=undefined){
            self.emit("failedUserRegistration",result);
          }else{
            ///////////////////////////
            _successfullUserRegistration(self);
            //////////////////////
          }
        });
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
		self.emit("failedVerifyUser",{"error":{"code":"AV001","message":"please pass otp"}});
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
    self.emit("failedUserSignin",{"error":{"code":"AV001","message":"please provide userdata"}});
  }else if(userdata.mobileno==undefined || userdata.mobileno==""){
    self.emit("failedUserSignin",{"error":{"code":"AV001","message":"please provide Username or Email"}});
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
        self.emit("failedUserGet",{"error":{"code":"AU005","message":"Provided userid is wrong"}});
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
    self.emit("failedUserUpdation",{"error":{"code":"","message":"You can not update the given data"}});  
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
          self.emit("failedUserUpdation",{"error":{"message":"Server Issue please try again"}}); 
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
      self.emit("failedUserUpdation",{"error":{"message":"Server Issue please try again"}}); 
    } else if(user){
      self.emit("failedUserUpdation",{"error":{"message":"Username already exist ,please give another username"}}); 
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

      self.emit("failedUserUpdation",{"error":{"code":"AU005","message":"Provided userid is wrong"}});
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
      self.emit("failedSendPasswordSetting",{"error":{"message":"Mobile Number is not associated with OrderZapp"}});
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
  self.emit("successfulForgotPassword",{success:{message:"Forgot Password Setting send successfully"}});
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
       self.emit("failedresetPasswordRequest",{"error":{"message":"OTP is wrong or expired"}}); 
    }else{
      UserModel.findOne({ userid: otpdata._userId},function(err,user){
        if(err){
          logger.emit("error","Database error:/_resetPasswordRequest"+err);
          self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Issue"}})             
        } else if(!user){
          self.emit("failedresetPasswordRequest",{"error":{"message":"Userid is wrong"}});    
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
      self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Issue"}})             
    }else{
      SMSTemplateModel.findOne({name:"newpassword",lang:user.preffered_lang},function(err,smstemplatedata){
        if(err){
          logger.emit("error","Database error:/_sendNewPassWord"+err);
          self.emit("failedresetPasswordRequest",{"error":{"code":"ED001","message":"Database Issue"}})             
        }else if(!smstemplatedata){
          logger.emit("error","Template newpassword not found")
          self.emit("failedresetPasswordRequest",{"error":{"message":"Template Issue"}})
        }else{
          var smstemplate=S(smstemplatedata.template);
          smstemplate=smstemplate.replaceAll("<password>",otp);
          var message=smstemplate.s;
          commonapi.sendMessage(message,user.mobileno,function(result){
            if(result=="failure"){
              logger.emit("error","newpassword not sent to"+user.mobileno)
              self.emit("failedresetPasswordRequest",{"error":{"message":"Server Issue"}})
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
      self.emit("_regenerateOTP",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(!user){
      self.emit("failedregenerateotp",{"error":{"message":"Mobile Number is not associated with OrderZapp"}});
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
      self.emit("failedregenerateotp",{"error":{"code":"ED001","message":"Database Issue"}});
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
  self.emit("successfulregenerateotp",{"success":{"message":"OTP regnerated and sent successfully"}});
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
       self.emit("failedjoinproviderrequest",{"error":{"message":"Mobile Number is not associated with OrderZapp"}}); 
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
      logger.emit("error","Database Issue :_createOTPForJoinProviderRequest/errormessage:"+err);
      self.emit("failedjoinproviderrequest",{"error":{"code":"ED001","message":"Database Issue"}});
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
      logger.emit("error","Database Issue")
     self.emit("failedjoinproviderrequest",{"error":{"message":"Database Issue"}})
    }else if(!smstemplatedata){
      logger.emit("error","Template "+tempname+" not found")
      self.emit("failedjoinproviderrequest",{"error":{"message":"Template Issue"}})
    }else{
      var smstemplate=S(smstemplatedata.template);
      smstemplate=smstemplate.replaceAll("<otp>",passwordotp);
      var message=smstemplate.s;
      commonapi.sendMessage(message,mobileno,function(result){
        if(result=="failure"){
          logger.emit("error","sms not sent to "+mobileno)
          self.emit("failedjoinproviderrequest",{"error":{"message":"Server Issue "}}) 
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
  self.emit("successfuljoinproviderrequest",{success:{message:"Provider Request Otp sent to your mobile number"}})
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
      self.emit("failedconfirmjoinproviderrequest",{"error":{"code":"ED001","message":"Database Issue"}})   
    } else if(!otpdata){
       self.emit("failedconfirmjoinproviderrequest",{"error":{"message":"OTP is wrong or expired"}}); 
    }else{
      UserModel.findAndModify({ userid: otpdata._userId},[],{$set: {usertype:"provider"}},{new:false},function(err,user){
        if(err){
          logger.emit("error","Database error:/_confirmjoinproviderrequest"+err);
          self.emit("failedconfirmjoinproviderrequest",{"error":{"code":"ED001","message":"Database Issue"}})             
        } else if(!user){
          self.emit("failedconfirmjoinproviderrequest",{"error":{"message":"Userid is wrong"}});    
        }else{
          OtpModel.update({otp:otp,status:"active"},{$set:{status:"deactive"}},function(err,otpstatus){
            if(err){
              logger.emit("error","Database error:/_confirmjoinproviderrequest"+err);
            }else{
              logger.emit("log","otp set to deactive") 
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
  CountryCodeModel.find({},{code:1,country:1,_id:0}).lean().exec(function(err,countrycode){
    if(err){
      self.emit("failedGetCountryCode",{"error":{"code":"ED001","message":"Error in db to find countrycode"}});
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
        self.emit("failedProductRecommend",{"error":{"code":"AU005","message":"productid is wrong"}});
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
      self.emit("failedProductRecommend",{"error":{"code":"AU005","message":"wrong userid"}});      
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
      self.emit("failedGetMyDeliveryAddressHistory",{error:{message:"No Delivery ADdress history exist"}})
    }else{
      ///////////////////////////////////////////
      _successfullGetMYDeliveryAddressHistory(self,deliveryaddresses)
      //////////////////////////////////////////
    }
  })
}
var _successfullGetMYDeliveryAddressHistory=function(self,deliveryaddresses){
  self.emit("successfulGetMyDeliveryAddressHistory",{success:{message:"Getting My Delivery Address History successfully",deliveryaddresses:deliveryaddresses}})
}
