var ProviderGroup=require("./provider-group");
var logger=require("../../common/js/logger");
var UserModel=require("../../user/js/user-model");
// var userapi=require("../../user/js/user");
var OtpModel=require("../../common/js/otp-model");
var commonapi=require("../../common/js/common-api")
var SMSTemplateModel=require("../../common/js/sms-template-model");
var SMSFormatModel=require("../../common/js/sms-format-model");
var S=require("string");
// var CONFI=require("confi");
var CONFIG = require('config').OrderZapp
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
exports.addGroupToBranch=function(req,res){
  var providergroup = new ProviderGroup();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var groupdata=req.body.groupdata;
  logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  providergroup.removeAllListeners("failedAddGroupToBranch");
  providergroup.on("failedAddGroupToBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  providergroup.removeAllListeners("successfulAddGroupToBranch");
  providergroup.on("successfulAddGroupToBranch",function(result){
    res.send(result);
  });
  if(req.user.usertype=="provider"){
    providergroup.addGroupToBranch(req.user,providerid,branchid,groupdata);
  }else{
    providergroup.emit("failedAddGroupToBranch",{"error":{code:"EA001",message:"Only a provider can add new user group"}});
  } 
}
exports.removeGroupFromBranch=function(req,res){
  var providergroup = new ProviderGroup();
  // var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var groupid=req.params.groupid;
  // var groupdata=req.body.groupdata;
  // logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  providergroup.removeAllListeners("failedRemoveGroupFromBranch");
  providergroup.on("failedRemoveGroupFromBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  providergroup.removeAllListeners("successfulRemoveGroupFromBranch");
  providergroup.on("successfulRemoveGroupFromBranch",function(result){
    res.send(result);
  });
  if(req.user.usertype=="provider"){
    providergroup.removeGroupFromBranch(req.user,branchid,groupid);
  }else{
    providergroup.emit("failedRemoveGroupFromBranch",{"error":{code:"EA001",message:"Only a provider can remove group"}});
  } 
}
exports.addMembersToGroup=function(req,res){
  var providergroup = new ProviderGroup();
  // var providerid=req.params.providerid;
  var invites=req.body.invites;
  var branchid=req.params.branchid;
  var groupid=req.params.groupid;
  // var groupdata=req.body.groupdata;
  // logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  providergroup.removeAllListeners("failedAddMembersToGroup");
  providergroup.on("failedAddMembersToGroup",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  providergroup.removeAllListeners("successfulAddMembersToGroup");
  providergroup.on("successfulAddMembersToGroup",function(result){
    res.send(result);
  });
  providergroup.removeAllListeners("sendinvitetospnewuser");
  providergroup.on("sendinvitetospnewuser",function(newuser,template,branch,grpname){
    UserModel.findOne({mobileno:newuser.mobileno},{userid:1,mobileno:1,email:1,firstname:1},function(err,user){
      if(err){
        logger.emit("error","Database Issue"+err)
      }else if(!user){
        logger.emit("log","User not found to send invitation sendinvitetospnewuser");
      }else{
        var otpmodel=new OtpModel({_userId:user.userid});
        otpmodel.save(function(err,otpdata){
          if(err){
            logger.emit("error","Database Issue :_createOtp/errormessage:"+err);
          }else if(otpdata){
            // var tempname="otp";
            var message=S(template.template);
            message=message.replaceAll("<otp>",otpdata.otp);
            message=message.replaceAll("<providername>",branch.providername);
            message=message.replaceAll("<branchname>",branch.branchname);
            if(user.firstname!=undefined){
             message=message.replaceAll("<name>",user.firstname);  
            }
            message=message.replaceAll("<password>",newuser.password);//temp password
            message=message.replaceAll("<groupname>",grpname);
            var emailmessage = {
              from: "OrderZapp  <noreply@orderzapp.com>", // sender address
              to: newuser.email, // list of receivers
              subject:"You hav been added to the group"+grpname+" for "+branch.branchname, // Subject line
              html: " Your account has been created on OrderZapp.<br>Your password is:"+newuser.password+". You can login anytime using the mobile number and password" // html body
            };
            commonapi.sendMail(emailmessage,CONFIG.smtp_general, function (result){
              if(result=="failure"){
                logger.emit("error","Branch members invite not sent to "+message.to);
              }else{
                logger.emit("log","Branch members invite sent successfully to"+message.to);
              }
            });
            commonapi.sendMessage(message.s,user.mobileno,function(result){
              if(result=="failure"){
                logger.emit("log","invite SMS not sent to "+user.mobileno); 
              }else{
                logger.emit("info","invite SMS sent to "+user.mobileno);                    
              }
            })  
          }
        })       
      }
    })
  });
   providergroup.removeAllListeners("sendinvitetospuser");
   providergroup.on("sendinvitetospuser",function(existinguser,template,branch,grpname){
    UserModel.findOne({mobileno:existinguser.mobileno},function(err,user){
      if(err){
        logger.emit("error","Database Issue"+err)
      }else if(!user){
        logger.emit("log","User not found to send invitation sendinvitetospuser");
      }else{
        var message=S(template.template);
        // console.log("message"+message);
        // console.log("branch"+branch.providername);
        console.log("message"+message)
        console.log("branch"+JSON.stringify(branch));
       message=message.replaceAll("<providername>",branch.providername);
        message=message.replaceAll("<branchname>",branch.branchname);
       message= message.replaceAll("<groupname>",grpname);
        if(user.firstname!=undefined){
         message= message.replaceAll("<name>",user.firstname);  
        }
        
        
        console.log("messddage"+message);
        var emailmessage = {
              from: "OrderZapp  <orderzapp@giantleapsystems.com>", // sender address
              to: user.email, // list of receivers
              subject:"You have been added to the group "+grpname+" for "+branch.branchname, // Subject line
              html: "" // html body
            };
            commonapi.sendMail(emailmessage,CONFIG.smtp_general, function (result){
              if(result=="failure"){
                logger.emit("error","Branch members inivte not sent to "+message.to);
              }else{
                logger.emit("log","Branch members invite sent successfully to"+message.to);
              }
            });
        commonapi.sendMessage(message.s,user.mobileno,function(result){
          if(result=="failure"){
            logger.emit("log","invite SMS not sent to "+user.mobileno); 
          }else{
            logger.emit("info","invite SMS sent to "+user.mobileno);                    
          }
        })
      }
    })
  });
  if(req.user.usertype=="provider"){
    providergroup.addMembersToGroup(req.user,branchid,groupid,invites);
  }else{
    providergroup.emit("failedAddMembersToGroup",{"error":{code:"EA001",message:"Only seller can add member to user group"}});
  } 
}
exports.getMyGroupMembers=function(req,res){
   var providergroup = new ProviderGroup();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  // var groupid=req.params.groupid;
  // var groupdata=req.body.groupdata;
  console.log("providerid:"+providerid+"  branchid:"+branchid)
  // logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  providergroup.removeAllListeners("failedGetMyGroupMembers");
  providergroup.on("failedGetMyGroupMembers",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  providergroup.removeAllListeners("successfulGetMyGroupMembers");
  providergroup.on("successfulGetMyGroupMembers",function(result){
    res.send(result);
  });
  if(req.user.usertype=="provider"){
    providergroup.getMyGroupMembers(req.user,providerid,branchid);
  }else{
    providergroup.emit("failedGetMyGroupMembers",{"error":{code:"EA001",message:"Only seller can get group user details"}});
  } 
}
exports.removeMemberFromGroup=function(req,res){
   var providergroup = new ProviderGroup();
  // var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var memberid=req.params.memberid;
  var groupid=req.params.groupid;
  // var groupid=req.params.groupid;
  // var groupdata=req.body.groupdata;
  // logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  providergroup.removeAllListeners("failedRemoveMemberFromGroup");
  providergroup.on("failedRemoveMemberFromGroup",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  providergroup.removeAllListeners("successfulRemoveMemberFromGroup");
  providergroup.on("successfulRemoveMemberFromGroup",function(result){
    res.send(result);
  });
  providergroup.removeAllListeners("sendsmsnotificationforremovingmember");
  providergroup.on("sendsmsnotificationforremovingmember",function(user,branch,groupdata,smstemplate){
    smstemplate=S(smstemplate);
    smstemplate=smstemplate.replaceAll("<groupname>",groupdata.grpname);
    smstemplate=smstemplate.replaceAll("<providername>",branch.branchname);
    commonapi.sendMessage(smstemplate.s,user.mobileno,function(result){
      if(result=="failure"){
        logger.emit("log","remove member notification sms not sent to "+user.mobileno); 
      }else{
        logger.emit("info","remove member notificationsms sent to "+user.mobileno);                    
      }
    })
  });
    providergroup.removeAllListeners("sendemailnotificationforremovingmember");
  providergroup.on("sendemailnotificationforremovingmember",function(user,branch,groupdata,emailtemplate){
    emailtemplate=S(emailtemplate);
    emailtemplate=emailtemplate.replaceAll("<groupname>",groupdata.grpname);
    emailtemplate=emailtemplate.replaceAll("<branchname>",branch.branchname);
    var emailmessage = {
          from: "OrderZapp  <orderzapp@giantleapsystems.com>", // sender address
          to: user.email, // list of receivers
          subject:emailtemplate.s, // Subject line
          html: "" // html body
    };
    commonapi.sendMail(emailmessage,CONFIG.smtp_general, function (result){
      if(result=="failure"){
        logger.emit("error","Branch members remove notification not sent to "+emailmessage.to);
      }else{
        logger.emit("log","Branch members remove notification sent successfully to"+emailmessage.to);
      }
     });
  });
  if(req.user.usertype=="provider"){
    providergroup.removeMemberFromGroup(req.user,branchid,groupid,memberid);
  }else{
    providergroup.emit("failedRemoveMemberFromGroup",{"error":{code:"EA001",message:"Only seller can remove user group from branch"}});
  } 
}
exports.updateGroupBranch=function(req,res){
  var providergroup = new ProviderGroup();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var groupdata=req.body.groupdata;
  var groupid=req.params.groupid;
  logger.emit("log","req body updateGroupBranch"+ JSON.stringify(req.body));
  providergroup.removeAllListeners("failedUpdateGroupBranch");
  providergroup.on("failedUpdateGroupBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  providergroup.removeAllListeners("successfulUpdateGroupBranch");
  providergroup.on("successfulUpdateGroupBranch",function(result){
    res.send(result);
  });
  if(req.user.usertype=="provider"){
    providergroup.updateGroupBranch(req.user,providerid,branchid,groupdata,groupid);
  }else{
    providergroup.emit("failedUpdateGroupBranch",{"error":{code:"EA001",message:"Only seller can update user group details"}});
  } 
}