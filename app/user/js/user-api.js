var User=require("./user");
var logger=require('../../common/js/logger');
var passport = require('passport');
var SMSTemplateModel=require("../../common/js/sms-template-model");
var LocalStrategy = require('passport-local').Strategy;
var userModel=require("./user-model");
var S=require("string");
var commonapi=require("../../common/js/common-api");
var CONFIG = require('config').OrderZapp
exports.addUser = function(req,res){
 var  userdata = JSON.stringify(req.body.user);
 var user = new User(JSON.parse(userdata));
 logger.emit("log","req body addUser"+JSON.stringify(userdata));
 user.removeAllListeners("failedUserRegistration");
  user.on("failedUserRegistration",function(err){
    logger.emit("error", err.error.message);
    // //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulUserRegistration");
  user.on("successfulUserRegistration",function(result){
    logger.emit("info", result.success.message);
    // //user.removeAllListeners();
    res.send(result);
  });
  console.log("remote address"+req.connection.remoteAddress) 
  user.registerUser();
}
exports.verifyUser=function(req,res){
 var otp=req.body.otp;
 var user = new User();
 logger.emit("log","req body verifyUser"+JSON.stringify(req.body));
 user.removeAllListeners("failedVerifyUser");
  user.on("failedVerifyUser",function(err){
    
    logger.emit("error", err.error.message);
    // //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulVerifyUser");
  user.on("successfulVerifyUser",function(result){
    logger.emit("info", result.success.message);
    // console.log("userdetails"+JSON.stringify(result.success.user));
    userModel.findOne({userid:result.success.user.userid},function(err,userdata){
      if(err){
        logger.emit("error","Database Issue verifyUser"+err);
        user.emit("failedVerifyUser",{"error":{"code":"ED001","message":"Database Issue"}})
      }else if(!userdata){
        user.emit("failedVerifyUser",{"error":{"message":"User does not exist"}});
      }else{
        console.log("user password"+user.password);
        if(userdata.password==undefined){
          ////////////////////////////////////
          user.emit("sendnewpassword",userdata);
          ////////////////////////////////  
        }
        
       req.logIn(userdata,function(err) {
        if (err){
          logger.emit("error","verifyUser"+err);
          
          user.emit("failedVerifyUser",{"error":{"message":"Signin Issue"}})
        }else{
          // if(userdata.hhusertype=="serviceprovider" && userdata.serviceproviders.length==0){
          //   self.emit("failedVerifyUser",{"error":{"code":"AS001","message":"Please add an srviceprovider details"}});
          // }else{
            res.send(result);
          // }
        }
      }) 
    }
  })
});
  user.removeAllListeners("sendnewpassword");
  user.on("sendnewpassword",function(user){
    var otp = Math.floor(Math.random()*100000000);
    user.password=otp;
    user.save(function(err,userdata){
      if(err){
        logger.emit("error","Database Issue"+err,user.userid)
      }else{
        SMSTemplateModel.findOne({name:"newpassword",lang:user.preffered_lang},function(err,smstemplatedata){
          if(err){
            logger.emit("error","Database Issue"+err,user.userid) 
          }else if(!smstemplatedata){
            logger.emit("error","SMS TEMPLATE for newpassword for lang"+user.preffered_lang+" not found");
          }else{
            var smstemplate=S(smstemplatedata.template);
            smstemplate=smstemplate.replaceAll("<password>",otp);
            var message=smstemplate.s;
            commonapi.sendMessage(message,user.mobileno,function(result){
              if(result=="failure"){
                logger.emit("error","newpassword message not sent to "+user.mobileno); 
              }else{
                logger.emit("info","newpassword message sent to "+user.mobileno);
              }
            }) 
          }
        })
      }
    })
  })
          
       
  user.verifyUser(otp); 
}
exports.signin = function(req, res) {
   if (req.isAuthenticated()){
     // res.send({status:true,sessionid:req.sessionID,userid:req.user.userid});
     req.logout();
    }
    console.log("req date"+req._startTime);
   var  userdata = req.body;
  //req.body=req.body;
  logger.emit("log","req body signin"+JSON.stringify(userdata));
  var user = new User(userdata);
  user.removeAllListeners("failedUserSignin");
  user.on("failedUserSignin",function(err){
    if(err.error.user!=undefined){
      err.error.user.sessionid=req.sessionID;
    }else{
      logger.emit("log","failed signin"+err.error.message);
    }
    logger.emit("error", err.error.message,req.body.email);
    res.send(err);
  });
  //
  user.removeAllListeners("successfulUserSignin");
  user.on("successfulUserSignin",function(result)
  {
    // logger.emit("log","Succesfull Signin")
    console.log("req session"+JSON.stringify(req.session))
    logger.emit("info", result.success.message);
    //user.removeAllListeners();
    // result=JSON.parse(result);
    if(result.success.user.usertype=="provider"){
      //session timout for 2 hours
      req.session.cookie.expires=2*60*60*1000;
    }else{
      //session timout for 15 minutes
       req.session.cookie.expires=15*60*1000;
    }
    console.log("req session"+JSON.stringify(req.session))
    result.success.user.sessionid=req.sessionID;

    // //user.removeAllListeners("successfulUserSigninsuccessfulUserSignin",function(stream){
    //   logger.emit("log"," successfulUserSignin emitter removed");
    // });
    res.send(result);
  });
   user.removeAllListeners("passportauthenticate");
   user.on("passportauthenticate",function(userdata){
    var passportrequest={};
    console.log("userdata"+JSON.stringify(userdata));
    passportrequest.body={mobileno:userdata.mobileno,password:userdata.password}
    passport.authenticate('local', function(err, user_data, info) {
      if (err) { 
        user.emit("failedUserSignin",{"error":{"code":"AP002","message":"Error in passport to authenticate"}});
      } else if (info) {
        user.emit("failedUserSignin",{"error":{"code":info.code,"message":info.message}});
       }else {//valid user
        user_data.password=undefined;
        console.log("req"+req);
        console.log("userdata.usertype"+userdata.usertype);
        console.log("user_data.usertype"+user_data.usertype);
        
         if(userdata.usertype!=undefined && user_data.usertype=="individual"){
           user.emit("failedUserSignin",{"error":{code:"AU001", message: 'Username or password is invalid' }});
         }else{

         
         console.log("session pass data"+user_data);
         req.logIn(user_data,function(err){
          if(err){
            // req.sesion.userid=req.user.userid;
            logger.emit("log","passport sesion problem"+err);
            user.emit("failedUserSignin",{"error":{"code":"AP001","message":"Error in creating session"}});
          }else{
           // userid=userdata.userid;
            ///////////////////////////
            user.signinSession(user_data);
            ///////////////////////////
          }
        });
      }
    }
    })(passportrequest,res);//end of passport authenticate

  });
  //first calling sigin
  user.signin();
 
}
passport.use( new LocalStrategy({ usernameField: 'mobileno', passwordField: 'password'},
  function(mobileno, password, done) {
    userModel.findOne({$or:[{mobileno:mobileno.toLowerCase()},{username:mobileno.toLowerCase()}],status:"active"},{password:1,mobileno:1,username:1,verified:1,isAdmin:1,usertype:1}, function(err, user) {
      if (err){
        console.log("error",err)
       return done(err); 
      }
      if (!user) {//to check user is exist or not
        return done(null, false, {code:"AU001", message: 'User does not exists' }); 
      } else{

        user.comparePassword(password, function(err, isMatch){
          if ( err ){
            return done(err);
          } else if( isMatch ) {   
             if(user.verified==false){
              return done(null,false,{code:"AU003",message:"Please verify or resend otp to mobileno"});   
             }else{
              return done(null, user);  
             }       
            
          }else{
            logger.emit("error","Invalid password",user.userid);
            return done(null, false, {code:"AU002", message: 'Username or password is invalid' });
          }
      });
    }
    });
}));


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  userModel.findById(id, function (err, user) {
    done(err, user);
  });
});
exports.getUser = function(req, res) {
  var userid=req.params.userid;
  var sessionuserid=req.user.userid;
  var user=new User();
  user.removeAllListeners("failedUserGet");
  user.on("failedUserGet",function(err){
    logger.emit("error", err.error.message,req.user.userid);
    //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulUserGet");
  user.on("successfulUserGet",function(result){
    // logger.emit("info", result.success.message,req.user.userid);
    //user.removeAllListeners();
    res.send(result);
  });
  user.getUser(userid);

};
exports.updateUser = function(req, res) {
  var userid=req.params.userid;
  var userdata=req.body.userdata;
  logger.emit("log","update req body"+JSON.stringify(req.body));
  var user = new User(userdata);
  var sessionuserid=req.user.userid;
   user.removeAllListeners("failedUserUpdation");
    user.on("failedUserUpdation",function(err){
      logger.emit("log","failedUserRegistration"+JSON.stringify(err));
      logger.emit("error", err.error.message);
      // //user.removeAllListeners();
      res.send(err);
    });
    user.removeAllListeners("successfulUserUpdation");
    user.on("successfulUserUpdation",function(result){
      logger.emit("info", result.success.message);
      // user.removeAllListeners();
      res.send(result);
    });
    if(sessionuserid==userid){
      user.updateUser(userid);
    }else{
     user.emit("failedUserUpdation",{"error":{"code":"EA001","message":"Only authorized users can perform this action"}})
    }
    
}
exports.isLoggedIn=function(req,res){
    var user=new User();
    user.removeAllListeners("failedIsLoggedIn");
    user.on("failedIsLoggedIn",function(err){
      res.send(err);
    });
    user.removeAllListeners("successfulIsLoggedIn");
    user.on("successfulIsLoggedIn",function(result){
      // logger.emit("info", result.success.message,result.success.user.userid);
      //user.removeAllListeners();
      // result.success.user.sessionid=req.sessionID;
      res.send(result);
    });
    if(req.isAuthenticated()){
      user.emit("successfulIsLoggedIn",{success:{message:"User in session",user:req.user}})
    }else{
       user.emit("failedIsLoggedIn",{"error":{"code":"AL001","message":"Please login to continue"}});
    }
}
exports.forgotPassword = function(req, res) {
  var mobileno=req.body.mobileno;
  var user=new User();
  user.removeAllListeners("failedSendPasswordSetting");
  user.on("failedSendPasswordSetting",function(err){
    logger.emit("error", err.error.message);
      //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulForgotPassword");
  user.on("successfulForgotPassword",function(result){
    logger.emit("info", result.success.message);
    //user.removeAllListeners();
    res.send(result);
  });
  user.sendPasswordSetting(mobileno);

}
exports.resetPasswordRequest = function(req, res) {
  var otp=req.body.otp;
  var user=new User();
  user.removeAllListeners("failedresetPasswordRequest");
  user.on("failedresetPasswordRequest",function(err){
    logger.emit("error", err.error.message);
      //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulresetPasswordRequest");
  user.on("successfulresetPasswordRequest",function(result){
    logger.emit("info", result.success.message);
    //user.removeAllListeners();
    res.send(result);
  });
  user.resetPasswordRequest(otp);

}
exports.regenerateotp=function(req,res){
  var mobileno=req.body.mobileno;
  var user=new User();
  user.removeAllListeners("failedregenerateotp");
  user.on("failedregenerateotp",function(err){
    logger.emit("error", err.error.message);
      //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulregenerateotp");
  user.on("successfulregenerateotp",function(result){
    logger.emit("info", result.success.message);
    //user.removeAllListeners();
    res.send(result);
  });
  user.regenerateotp(mobileno);
}
exports.joinproviderrequest=function(req,res){
  var mobileno=req.body.mobileno;
  var user=new User();
  user.removeAllListeners("failedjoinproviderrequest");
  user.on("failedjoinproviderrequest",function(err){
    logger.emit("error", err.error.message);
      //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfuljoinproviderrequest");
  user.on("successfuljoinproviderrequest",function(result){
    logger.emit("info", result.success.message);
    //user.removeAllListeners();
    res.send(result);
  });
  user.joinproviderrequest(mobileno);
}
exports.confirmjoinproviderrequest=function(req,res){
  var otp=req.body.otp;
  var user=new User();
  user.removeAllListeners("failedconfirmjoinproviderrequest");
  user.on("failedconfirmjoinproviderrequest",function(err){
    logger.emit("error", err.error.message);
      //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulconfirmjoinproviderrequest");
  user.on("successfulconfirmjoinproviderrequest",function(result){
    logger.emit("info", result.success.message);
    console.log("user"+JSON.stringify(result.success.user))
    // var userdata={userid:}
    var userdata=JSON.stringify(result.success.user);
    userdata=JSON.parse(userdata)
    userModel.findOne({userid:result.success.user.userid},function(err,userdata){
      if(err){
        user.emit("failedconfirmjoinproviderrequest",{"error":{"message":"Database Issue",code:"ED001"}})
      }else if(!userdata){
        user.emit("failedconfirmjoinproviderrequest",{"error":{"message":"Incorrect User id"}})
      }else{
        userdata.password=undefined;
        req.logIn(userdata,function(err) {
          if (err){
            logger.emit("error","confirmjoinproviderrequest"+err);
            user.emit("failedconfirmjoinproviderrequest",{"error":{"message":"Signin Error"}})
          }else{
            res.send(result);
          }
      })
    }
    }) 
    //user.removeAllListeners();
    // res.send(result);
  });
  user.confirmjoinproviderrequest(otp);
}
exports.signOutSessions=function(req,res){
    req.logout();
    req.session.destroy();
    res.send({"success":{"message":"You have successfully signed out"}});
}

exports.getCountryCodes = function(req, res) {
  var user=new User();
  user.removeAllListeners("failedGetCountryCode");
  user.on("failedGetCountryCode",function(err){
    logger.emit("error", err.error.message,req.user.userid);
    //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulGetCountryCode");
  user.on("successfulGetCountryCode",function(result){
    // logger.emit("info", result.success.message,req.user.userid);
    //user.removeAllListeners();
    res.send(result);
  });
  user.getCountryCodes();
};

exports.productRecommend = function(req, res) {
  var sessionuserid = req.user.userid;
  var productid = req.params.productid;
  var user=new User();
  user.removeAllListeners("failedProductRecommend");
  user.on("failedProductRecommend",function(err){
    logger.emit("error", err.error.message,req.user.userid);
    //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulProductRecommend");
  user.on("successfulProductRecommend",function(result){
    // logger.emit("info", result.success.message,req.user.userid);
    //user.removeAllListeners();
    res.send(result);
  });
  user.productRecommend(productid,sessionuserid);
};

exports.userordersCount = function(req, res) {
  var sessionuserid = req.user.userid;
  var user=new User();
  user.removeAllListeners("failedGetUserOrdersCount");
  user.on("failedGetUserOrdersCount",function(err){
    logger.emit("error", err.error.message,req.user.userid);
    //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulGetUserOrdersCount");
  user.on("successfulGetUserOrdersCount",function(result){
    // logger.emit("info", result.success.message,req.user.userid);
    //user.removeAllListeners();
    res.send(result);
  });
  if(req.user.isAdmin==false){
      user.emit("failedGetUserOrdersCount",{"error":{"message":"Only authorized users can get user details"}});
    }else{
      user.userordersCount(sessionuserid);
    }  
};
exports.getMyDeliveryAddressHistory = function(req, res) {
  var sessionuserid = req.user.userid;
  var userid=req.params.userid;
  var user=new User();
  user.removeAllListeners("failedGetMyDeliveryAddressHistory");
  user.on("failedGetMyDeliveryAddressHistory",function(err){
    logger.emit("error", err.error.message,req.user.userid);
    //user.removeAllListeners();
    res.send(err);
  });
  user.removeAllListeners("successfulGetMyDeliveryAddressHistory");
  user.on("successfulGetMyDeliveryAddressHistory",function(result){
    // logger.emit("info", result.success.message,req.user.userid);
    //user.removeAllListeners();
    res.send(result);
  });
  if(sessionuserid!=userid){
    user.emit("failedGetMyDeliveryAddressHistory",{error:{code:"EA001",message:"Only authorized users can get delivery address history"}})
  }else{
    ////////////////////////////////////////
    user.getMyDeliveryAddressHistory(userid);
    ////////////////////////////////////////
  }
};




