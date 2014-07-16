var ProductProvider=require("./product-provider");
var logger=require("../../common/js/logger");
var UserModel=require("../../user/js/user-model");
var userapi=require("../../user/js/user");
var OtpModel=require("../../common/js/otp-model");
var commonapi=require("../../common/js/common-api")
var SMSTemplateModel=require("../../common/js/sms-template-model");
var SMSFormatModel=require("../../common/js/sms-format-model");
var S=require("string");

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
exports.addProductProvider=function(req,res){
var  ProductProviderdata = req.body.data;

 var productprovider = new ProductProvider(ProductProviderdata);
 
 var providerlogo=req.files.logo;
 if(providerlogo==undefined){
  providerlogo=req.files.file;
 }
 logger.emit("log",providerlogo);
  logger.emit("log","req body addProductProvider"+JSON.stringify(ProductProviderdata));
 productprovider.removeAllListeners("failedProductProviderRegistration");
  productprovider.on("failedProductProviderRegistration",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulProductProviderRegistration");
  productprovider.on("successfulProductProviderRegistration",function(result){
    // if(err.error.code!="ED001"){
    //  logger.emit("error", err.error.message); 
    // }
    
    // //user.removeAllListeners();
    res.send(result);
  });
  if(!IsJsonString(ProductProviderdata)){
    productprovider.emit("failedProductProviderRegistration",{error:{message:"productprovider should be json string"}})
  }else{
    if(req.user.usertype!="provider"){
      productprovider.emit("failedProductProviderRegistration",{error:{message:"You are not an provider user to add provider details"}});
    }else{
      productprovider.addProductProvider(req.user,providerlogo);
    }
  }
}
exports.acceptrejectProductProvider=function(req,res){
 var providerid = req.params.providerid;
 var action = req.query.action;
 var productprovider = new ProductProvider(); 
  console.log("acceptrejectProductProvider")
 productprovider.removeAllListeners("failedProductProviderAcceptance");
  productprovider.on("failedProductProviderAcceptance",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulProductProviderAcceptance");
  productprovider.on("successfulProductProviderAcceptance",function(result){
    // if(err.error.code!="ED001"){
    //  logger.emit("error", err.error.message); 
    // }    
    // //user.removeAllListeners();
    res.send(result);
  });
    if(req.user.isAdmin==false){
      productprovider.emit("failedProductProviderAcceptance",{error:{message:"You are not an admin user to done this action"}});
    }else{
      productprovider.acceptrejectProductProvider(providerid,action,req.user);
    }
}
exports.addProviderPolicy=function(req,res){
var text = req.body.text;
var type = req.query.type;
var providerid = req.params.providerid;
var branchid = req.params.branchid;
 var productprovider = new ProductProvider(text);
  // logger.emit("log","req body addProviderPolicy"+JSON.stringify(policy));
 productprovider.removeAllListeners("failedAddProviderPolicy");
  productprovider.on("failedAddProviderPolicy",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulAddProviderPolicy");
  productprovider.on("successfulAddProviderPolicy",function(result){
    // if(err.error.code!="ED001"){
    //  logger.emit("error", err.error.message); 
    // }    
    // //user.removeAllListeners();
    res.send(result);
  });
    if(req.user.usertype!="provider"){
      productprovider.emit("failedAddProviderPolicy",{error:{message:"You are not an provider user to add policy details"}});
    }else{
      productprovider.addProviderPolicy(providerid,branchid,type,text,req.user);
    }
}
exports.getProviderPolicy=function(req,res){
  var type = req.query.type;
  var response_type = req.query.response_type;
  var providerid = req.params.providerid;
  var branchid = req.params.branchid;
  var productprovider = new ProductProvider();
  // logger.emit("log","req body addProviderPolicy"+JSON.stringify(policy));
 productprovider.removeAllListeners("failedGetProviderPolicy");
  productprovider.on("failedGetProviderPolicy",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message);
     var result=err; 
     if(response_type == "html"){
      result="<h3>"+err.error.message+"</h3>";
     }
    }    
    // //user.removeAllListeners();
    res.send(result);
  });
  productprovider.removeAllListeners("successfulGetProviderPolicy");
  productprovider.on("successfulGetProviderPolicy",function(result){
    // if(err.error.code!="ED001"){
    //  logger.emit("error", err.error.message); 

    // }
    console.log("result"+JSON.stringify(result))
    
     if(response_type == "html"){
      var resultdata="";
      var policy= JSON.stringify(result.success.policy);
      policy=JSON.parse(policy)
      console.log("policy"+policy);
      for(var i in policy){

        resultdata+=policy[i]+"<br>";
        console.log(i)
      }
     result=resultdata;
     }
       
    // //user.removeAllListeners();
    res.send(result);
  });
    // if(req.user.usertype!="provider"){
    //   productprovider.emit("failedGetProviderPolicy",{error:{message:"You are not an provider user to get policy details"}});
    // }else{
      productprovider.getProviderPolicy(providerid,branchid,type,req.user);
    // }
}
exports.updateProviderPolicy=function(req,res){
  var text = req.body.text;
  var type = req.query.type;
  var providerid = req.params.providerid;
  var branchid = req.params.branchid;
  var productprovider = new ProductProvider(text);
  // logger.emit("log","req body addProviderPolicy"+JSON.stringify(policy));
 productprovider.removeAllListeners("failedUpdateProviderPolicy");
  productprovider.on("failedUpdateProviderPolicy",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulUpdateProviderPolicy");
  productprovider.on("successfulUpdateProviderPolicy",function(result){
    // if(err.error.code!="ED001"){
    //  logger.emit("error", err.error.message); 
    // }    
    // //user.removeAllListeners();
    res.send(result);
  });
    if(req.user.usertype!="provider"){
      productprovider.emit("failedUpdateProviderPolicy",{error:{message:"You are not an provider user to update policy details"}});
    }else{
      productprovider.updateProviderPolicy(providerid,branchid,type,text,req.user);
    }
}
exports.addBranch=function (req,res){
  var providerid=req.params.providerid;
  var branchdata =req.body.branch;
  var productprovider = new ProductProvider(branchdata);
  var sessionuser=req.user;
  logger.emit("log","req body addBranch"+JSON.stringify(req.body));
  productprovider.removeAllListeners("failedAddBranch");
  productprovider.on("failedAddBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);

  })
  productprovider.removeAllListeners("successfulAddBranch");
  productprovider.on("successfulAddBranch",function(result){
    res.send(result);
  });
  
  productprovider.addBranch(branchdata,sessionuser,providerid)
}

exports.uploadProviderLogo=function(req,res){
var  providerid = req.params.providerid;
console.log("providerid"+providerid)
 var productprovider = new ProductProvider();
 logger.emit("log","REQ files "+JSON.stringify(req.files));
 var providerlogo=req.files.providerlogo;
 if(providerlogo==undefined){
  providerlogo=req.files.file;
 }
 
 productprovider.removeAllListeners("failedAddProductProviderLogo");
  productprovider.on("failedAddProductProviderLogo",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulAddProductProviderLogo");
  productprovider.on("successfulAddProductProviderLogo",function(result){
   
    res.send(result);
  });
console.log("tessssssss")
    productprovider.addProductProviderLogo(providerid,req.user,providerlogo);
}
exports.updateProductProvider=function(req,res){
 var providerid=req.params.providerid;
 var  ProductProviderdata = req.body.providerdata;
 logger.emit("info","req updateProductProvider data"+JSON.stringify(req.body));
 var productprovider = new ProductProvider(ProductProviderdata);
 // logger.emit("log","req body addProductProvider"+JSON.stringify(ProductProviderdata));
 productprovider.removeAllListeners("failedProductProviderUpdation");
  productprovider.on("failedProductProviderUpdation",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulProductProviderUpdation");
  productprovider.on("successfulProductProviderUpdation",function(result){
    res.send(result);
  });
  productprovider.updateProductProvider(req.user,providerid);
}
//get specific provider details
exports.getProductProvider=function(req,res){
  var providerid=req.params.providerid;
  // logger.emit("info","req updateProductProvider data"+JSON.stringify(req.body));
  var productprovider = new ProductProvider();
  // logger.emit("log","req body addProductProvider"+JSON.stringify(ProductProviderdata));
  productprovider.removeAllListeners("failedGetProductProvider");
  productprovider.on("failedGetProductProvider",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulGetProductProvider");
  productprovider.on("successfulGetProductProvider",function(result){
    res.send(result);
  });
  productprovider.getProductProvider(providerid);
}

exports.getAllProductProviders=function(req,res){
  var productprovider = new ProductProvider();
  productprovider.removeAllListeners("failedGetAllProductProviders");
  productprovider.on("failedGetAllProductProviders",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    res.send(err);
  });
  productprovider.removeAllListeners("successfulGetAllProductProviders");
  productprovider.on("successfulGetAllProductProviders",function(result){
    res.send(result);
  });
  if(req.user.isAdmin==false){
    productprovider.emit("failedGetAllProductProviders",{"error":{"message":"You not an admin user to get provider details"}});
  }else{
    productprovider.getAllProductProviders();
  }  
}

exports.deleteProductProvider=function(req,res){
  var providerid=req.params.providerid;
  logger.emit("info","req updateProductProvider data"+JSON.stringify(req.body));
  var productprovider = new ProductProvider();
  // logger.emit("log","req body addProductProvider"+JSON.stringify(ProductProviderdata));
  productprovider.removeAllListeners("failedProductProviderDeletion");
  productprovider.on("failedProductProviderDeletion",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulProductProviderDeletion");
  productprovider.on("successfulProductProviderDeletion",function(result){
    res.send(result);
  });
  productprovider.deleteProductProvider(req.user,providerid);
}
exports.getAllMyBranches=function(req,res){
  // var serviceid = req.params.serviceid;
  var productprovider = new ProductProvider();
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(servicecatlogdata));
   productprovider.removeAllListeners("failedGetAllMyBranches");
    productprovider.on("failedGetAllMyBranches",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    })
    productprovider.removeAllListeners("successfulGetAllMyBranches");
    productprovider.on("successfulGetAllMyBranches",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.provider.length==0){
      productprovider.emit("failedGetAllMyBranches",{"error":{"message":"There is no Service Provider associated with your account"}})
    }else{
      productprovider.getAllMyBranches(req.user);
    }
    
}
//to see user  specific provider list(only providerid,providername,providerlogo)
exports.getAllMyProviders=function(req,res){
  // var serviceid = req.params.serviceid;
  var productprovider = new ProductProvider();
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(servicecatlogdata));
    productprovider.removeAllListeners("failedGetAllMyProviders");
    productprovider.on("failedGetAllMyProviders",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    })
    productprovider.removeAllListeners("successfulGetAllMyProviders");
    productprovider.on("successfulGetAllMyProviders",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.provider.length==0){
      productprovider.emit("failedGetAllMyProviders",{"error":{"message":"There is no ProductProvider Provider associated with your account"}})
    }else{
      productprovider.getAllMyProviders(req.user);
    }
    
}
//to see provider specific branch list(only branchid,branchname)
exports.getProviderBranches=function(req,res){
  // var serviceid = req.params.serviceid;
  var productprovider = new ProductProvider();
  var providerid=req.params.providerid;
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(servicecatlogdata));
    productprovider.removeAllListeners("failedGetAllMyProviderBranches");
    productprovider.on("failedGetAllMyProviderBranches",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    })
    productprovider.removeAllListeners("successfulGetAllMyProviderBranches");
    productprovider.on("successfulGetAllMyProviderBranches",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.provider.length==0){
      productprovider.emit("failedGetAllMyProviderBranches",{"error":{"message":"There is no ProductProvider Provider associated with your account"}})
    }else{
      productprovider.getAllMyProviderBranches(req.user,providerid);
    }
    
}
exports.getBranch=function(req,res){
  var productprovider = new ProductProvider();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(servicecatlogdata));
    productprovider.removeAllListeners("failedGetBranch");
    productprovider.on("failedGetBranch",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    })
    productprovider.removeAllListeners("successfulGetBranch");
    productprovider.on("successfulGetBranch",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    productprovider.getBranch(providerid,branchid);
}
exports.deleteBranch=function(req,res){
  var productprovider = new ProductProvider();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(servicecatlogdata));
    productprovider.removeAllListeners("failedDeleteBranch");
    productprovider.on("failedDeleteBranch",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    })
    productprovider.removeAllListeners("successfulDeleteBranch");
    productprovider.on("successfulDeleteBranch",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    productprovider.deleteBranch(req.user,providerid,branchid);
}
exports.updateBranch=function(req,res){
  var productprovider = new ProductProvider();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var branchdata=req.body.branch;
  logger.emit("log","req body updateBranch"+ JSON.stringify(req.body));
  productprovider.removeAllListeners("failedUpdateBranch");
  productprovider.on("failedUpdateBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulUpdateBranch");
  productprovider.on("successfulUpdateBranch",function(result){
    res.send(result);
  });  
  productprovider.updateBranch(req.user,providerid,branchid,branchdata);
}
exports.addGroupToBranch=function(req,res){
  var productprovider = new ProductProvider();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var groupdata=req.body.groupdata;
  logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  productprovider.removeAllListeners("failedAddGroupToBranch");
  productprovider.on("failedAddGroupToBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulAddGroupToBranch");
  productprovider.on("successfulAddGroupToBranch",function(result){
    res.send(result);
  });
  if(req.user.usertype=="provider"){
    productprovider.addGroupToBranch(req.user,providerid,branchid,groupdata);
  }else{
    self.emit("failedAddGroupToBranch",{"error":{code:"EA001",message:"You are not an provider to add new group"}});
  } 
}
exports.removeGroupFromBranch=function(req,res){
  var productprovider = new ProductProvider();
  // var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var groupid=req.params.groupid;
  // var groupdata=req.body.groupdata;
  // logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  productprovider.removeAllListeners("failedRemoveGroupFromBranch");
  productprovider.on("failedRemoveGroupFromBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulRemoveGroupFromBranch");
  productprovider.on("successfulRemoveGroupFromBranch",function(result){
    res.send(result);
  });
  if(req.user.usertype=="provider"){
    productprovider.removeGroupFromBranch(req.user,branchid,groupid);
  }else{
    self.emit("failedRemoveGroupFromBranch",{"error":{code:"EA001",message:"You are not an provider to remove group"}});
  } 
}
exports.addMembersToGroup=function(req,res){
  var productprovider = new ProductProvider();
  // var providerid=req.params.providerid;
  var invites=req.body.invites;
  var branchid=req.params.branchid;
  var groupid=req.params.groupid;
  // var groupdata=req.body.groupdata;
  // logger.emit("log","req body addGroupToBranch"+ JSON.stringify(req.body));
  productprovider.removeAllListeners("failedAddMembersToGroup");
  productprovider.on("failedAddMembersToGroup",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulAddMembersToGroup");
  productprovider.on("successfulAddMembersToGroup",function(result){
    res.send(result);
  });
  productprovider.on("sendinvitetospnewuser",function(newuser,template,branch,grpname){
    UserModel.findOne({mobileno:newuser.mobileno},function(err,user){
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
            var tempname="otp";
            _sendOTPToMobileNumber(user.mobileno,otpdata.otp,tempname,user.preffered_lang,function(result){
              if(result.error!=undefined){
                logger.emit("error",result.error.message);
              }else{
                var message=S(template.template);
                message.replaceAll("<providername>",branch.branchname);
                if(user.firstname!=undefined){
                  message.replaceAll("<name>",user.firstname);  
                }
                message.replaceAll("<password>",newuser.password);//temp password
                message.replaceAll("<grpname>",grpname);
                commonapi.sendMessage(message.s,user.mobileno,function(result){
                  if(result=="failure"){
                    logger.emit("log","invite sms not sent to "+user.mobileno); 
                  }else{
                    logger.emit("info","invite sms sent to "+user.mobileno);                    
                  }
                })  
              }
            });
          }
        })       
      }
    })
  });
  productprovider.on("sendinvitetospuser",function(existinguser,template,branch,grpname){
    UserModel.findOne({mobileno:existinguser.mobileno},function(err,user){
      if(err){
        logger.emit("error","Database Issue"+err)
      }else if(!user){
        logger.emit("log","User not found to send invitation sendinvitetospuser");
      }else{
        var message=S(template.template);
        message.replaceAll("<providername>",branch.branchname);
        if(user.firstname!=undefined){
          message.replaceAll("<name>",user.firstname);  
        }
        
        message.replaceAll("<grpname>",grpname);
        commonapi.sendMessage(message.s,user.mobileno,function(result){
          if(result=="failure"){
            logger.emit("log","invite sms not sent to "+user.mobileno); 
          }else{
            logger.emit("info","invite sms sent to "+user.mobileno);                    
          }
        })
      }
    })
  });
  if(req.user.usertype=="provider"){
    productprovider.addMembersToGroup(req.user,branchid,groupid,invites);
  }else{
    self.emit("failedAddMembersToGroup",{"error":{code:"EA001",message:"You are not an provider to add member to group"}});
  } 
}
exports.addEmployee=function(req,res){
  var branchid=req.params.branchid;
  var  usergrp =req.body.usergrp;
  var productprovider = new ProductProvider();
  var sessionuser=req.user;
  
  productprovider.removeAllListeners("failedAddEmployee");
  productprovider.on("failedAddEmployee",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    res.send(err);
  })
  productprovider.removeAllListeners("successfulAddEmployee");
  productprovider.on("successfulAddEmployee",function(result){
    res.send(result);
  });
  // branch.removeAllListeners("sendinvitetospnewuser");
  productprovider.on("sendinvitetospnewuser",function(newuser,template,branch,grpname){
    UserModel.findOne({mobileno:newuser.mobileno},function(err,user){
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
            var tempname="otp";
            _sendOTPToMobileNumber(user.mobileno,otpdata.otp,tempname,user.preffered_lang,function(result){
              if(result.error!=undefined){
                logger.emit("error",result.error.message);
              }else{
                var message=S(template.template);
                message.replaceAll("<providername>",branch.branchname);
                message.replaceAll("<name>",user.firstname);
                message.replaceAll("<password>",newuser.password);//temp password
                message.replaceAll("<grpname>",grpname);
                commonapi.sendMessage(message.s,user.mobileno,function(result){
                  if(result=="failure"){
                    logger.emit("log","invite sms not sent to "+user.mobileno); 
                  }else{
                    logger.emit("info","invite sms sent to "+user.mobileno);                    
                  }
                })  
              }
            });
          }
        })       
      }
    })
  });
  productprovider.on("sendinvitetospuser",function(existinguser,template,branch,grpname){
    UserModel.findOne({mobileno:existinguser.mobileno},function(err,user){
      if(err){
        logger.emit("error","Database Issue"+err)
      }else if(!user){
        logger.emit("log","User not found to send invitation sendinvitetospuser");
      }else{
        var message=S(template.template);
        message.replaceAll("<providername>",branch.branchname);
        message.replaceAll("<name>",user.firstname);
        message.replaceAll("<grpname>",grpname);
        commonapi.sendMessage(message.s,user.mobileno,function(result){
          if(result=="failure"){
            logger.emit("log","invite sms not sent to "+user.mobileno); 
          }else{
            logger.emit("info","invite sms sent to "+user.mobileno);                    
          }
        })
      }
    })
  });
  productprovider.addEmployee(sessionuser,branchid,usergrp);
}

exports.publishUnpublishBranch=function(req,res){
  var productprovider = new ProductProvider();
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var action=req.query.action;
 
  productprovider.removeAllListeners("failedPublishUnpublishBranch");
  productprovider.on("failedPublishUnpublishBranch",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulPublishUnpublishBranch");
  productprovider.on("successfulPublishUnpublishBranch",function(result){
    res.send(result);
  });  
  productprovider.publishUnpublishBranch(req.user,providerid,branchid,action);
}

exports.getAllNewProductProviders=function(req,res){
  var productprovider = new ProductProvider();
  productprovider.removeAllListeners("failedGetAllNewProviders");
  productprovider.on("failedGetAllNewProviders",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulGetAllNewProviders");
  productprovider.on("successfulGetAllNewProviders",function(result){
    res.send(result);
  });
  if(req.user.isAdmin == false){
    productprovider.emit("failedAddMembersToGroup",{"error":{code:"EA001",message:"You are not an admin user to done this action"}});
  }else{
    productprovider.getAllNewProductProviders(req.user);
  }
}
exports.manageDeliveryCharges=function(req,res){
  var sessionuserid=req.user.userid;
  var productprovider = new ProductProvider();
  var deliverychargedata=req.body.deliverychargedata;
  var branchid=req.params.branchid;
  productprovider.removeAllListeners("failedManageDeliveryCharges");
  productprovider.on("failedManageDeliveryCharges",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulManageDeliveryCharges");
  productprovider.on("successfulManageDeliveryCharges",function(result){
    res.send(result);
  });
  ///////////////////////////////////////////////////////////////////////// 
  productprovider.manageDeliveryCharges(sessionuserid,branchid,deliverychargedata);
  ///////////////////////////////////////////////////////////////////////////////
}

exports.sellersAgreementUpload=function(req,res){
  var agreementdata = req.body;
  var providerid = req.params.providerid;
  var agreementfile = req.files.agreementfile;
  if(agreementfile==undefined){
    agreementfile=req.files.file;
  }
  logger.emit("log","req body"+JSON.stringify(agreementdata));
  logger.emit("log","req files"+JSON.stringify(agreementfile));
  var productprovider = new ProductProvider(agreementdata);
   productprovider.removeAllListeners("failedUploadSellersAgreement");
    productprovider.on("failedUploadSellersAgreement",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }      
      // user.removeAllListeners();
      res.send(err);
    });
    productprovider.removeAllListeners("successfulUploadSellersAgreement");
    productprovider.on("successfulUploadSellersAgreement",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }      
      res.send(result);
    });
    if(req.user.isAdmin == false){
      productprovider.emit("failedUploadSellersAgreement",{error:{message:"You are not an admin user to upload agreement details"}});
    }else{
      productprovider.sellersAgreementUpload(providerid,req.user,agreementfile);
    }  
}
exports.getSellersAgreement=function(req,res){
    var providerid = req.params.providerid
    var productprovider = new ProductProvider();
    productprovider.removeAllListeners("failedGetSellersAgreement");
    productprovider.on("failedGetSellersAgreement",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }      
      // user.removeAllListeners();
      res.send(err);
    });
    productprovider.removeAllListeners("successfulGetSellersAgreement");
    productprovider.on("successfulGetSellersAgreement",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }      
      res.send(result);
    });
    productprovider.getSellersAgreement(providerid,req.user);
}
exports.changeSellersAgreementFile=function(req,res){
  var  providerid = req.params.providerid;
  console.log("providerid"+providerid);
  var productprovider = new ProductProvider();
  logger.emit("log","REQ files "+JSON.stringify(req.files));
  var agreementfile=req.files.agreementfile;
  if(agreementfile==undefined){
    agreementfile=req.files.file;
  }
 
  productprovider.removeAllListeners("failedChangeSellersAgreement");
  productprovider.on("failedChangeSellersAgreement",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // //user.removeAllListeners();
    res.send(err);
  });
  productprovider.removeAllListeners("successfulChangeSellersAgreement");
  productprovider.on("successfulChangeSellersAgreement",function(result){
   
    res.send(result);
  });
  if(req.user.isAdmin == false){
    productprovider.emit("failedChangeSellersAgreement",{error:{message:"You are not an admin user to change agreement details"}});
  }else{
    productprovider.changeSellersAgreementFile(providerid,req.user,agreementfile);
  }   
}
exports.getBranchDeliveryCharges=function(req,res){
  var sessionuserid=req.user.userid;
  var productprovider = new ProductProvider();
  // var deliverychargedata=req.body.deliverychargedata;
  var branchid=req.params.branchid;
  var zipcode=req.query.zipcode;
  var city=req.query.city;
  productprovider.removeAllListeners("failedGetBranchDeiliveryCharges");
  productprovider.on("failedGetBranchDeiliveryCharges",function(err){
    if(err.error.code!="ED001"){
     logger.emit("error", err.error.message); 
    }
    
    // user.removeAllListeners();
    res.send(err);
  })
  productprovider.removeAllListeners("successfulGetBranchDeliveryCharges");
  productprovider.on("successfulGetBranchDeliveryCharges",function(result){
    res.send(result);
  });
  ///////////////////////////////////////////////////////////////////////// 
   productprovider.GetBranchDeliveryCharges(sessionuserid,branchid,zipcode,city);
  ///////////////////////////////////////////////////////////////////////////////
}
