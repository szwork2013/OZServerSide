var logger = require("../../common/js/logger");
var OrderProcessConfig = require("./order-process-config");

exports.addOrderProcessingStatus = function(req,res){

  var orderprocessconfigdata = req.body.process;  
  var orderstatusreff = new OrderProcessConfig(orderprocessconfigdata);
  console.log("addOrderProcessingStatus : "+JSON.stringify(orderprocessconfigdata));
  orderstatusreff.removeAllListeners("failedAddOrderProcessingStatus");
  orderstatusreff.on("failedAddOrderProcessingStatus",function(err){
    if(err.error.code!="ED001"){
      logger.emit("error", err.error.message); 
    }      
      // user.removeAllListeners();
    res.send(err);
  });
  orderstatusreff.removeAllListeners("successfulAddOrderProcessingStatus");
  orderstatusreff.on("successfulAddOrderProcessingStatus",function(result){
    // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
    res.send(result);
  });  
  if(req.user.isAdmin == "false"){
    orderstatusreff.emit("failedAddOrderProcessingStatus",{error:{message:"Only OrderZapp admin user can perform this action"}});
  }else{
    orderstatusreff.addOrderProcessingStatus(req.user);
  }  
}

exports.getOrderProcessingStatus = function(req,res){
  var orderstatusreff = new OrderProcessConfig();
  orderstatusreff.removeAllListeners("failedGetOrderProcessingStatus");
  orderstatusreff.on("failedGetOrderProcessingStatus",function(err){
    if(err.error.code!="ED001"){
      logger.emit("error", err.error.message); 
    }      
      // user.removeAllListeners();
    res.send(err);
  });
  orderstatusreff.removeAllListeners("successfulGetOrderProcessingStatus");
  orderstatusreff.on("successfulGetOrderProcessingStatus",function(result){
    // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
    res.send(result);
  });  
  if(req.user.isAdmin ==true ||  req.user.usertype == "provider"){
    orderstatusreff.getOrderProcessingStatus(req.user);
  }else{
    location.emit("failedGetOrderProcessingStatus",{error:{message:"Only admin can perform this action"}});  
  } 
}

exports.deleteOrderProcessingStatus = function(req,res){
  var index = req.params.index;
  var orderstatusreff = new OrderProcessConfig();
  orderstatusreff.removeAllListeners("failedDeleteOrderProcessingStatus");
  orderstatusreff.on("failedDeleteOrderProcessingStatus",function(err){
    if(err.error.code!="ED001"){
      logger.emit("error", err.error.message); 
    }      
      // user.removeAllListeners();
    res.send(err);
  });
  orderstatusreff.removeAllListeners("successfulDeleteOrderProcessingStatus");
  orderstatusreff.on("successfulDeleteOrderProcessingStatus",function(result){
    // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
    res.send(result);
  });
  if(req.user.isAdmin == "false"){
    orderstatusreff.emit("failedDeleteOrderProcessingStatus",{error:{message:"Only admin can perform this action"}});
  }else{
    orderstatusreff.deleteOrderProcessingStatus(req.user,index);
  }
}
