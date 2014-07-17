var logger = require("../../common/js/logger");
var OrderStatusReff = require("./orderstatus-reff");

exports.addOrderProcessingStatus = function(req,res){

  var orderstatusdata = req.body.process;  
  var orderstatusreff = new OrderStatusReff(orderstatusdata);
  console.log("addOrderProcessingStatus : "+JSON.stringify(orderstatusdata));
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
    orderstatusreff.emit("failedAddOrderProcessingStatus",{error:{message:"You are not an admin user to do this action"}});
  }else{
    orderstatusreff.addOrderProcessingStatus(req.user);
  }  
}

exports.getOrderProcessingStatus = function(req,res){
  var orderstatusreff = new OrderStatusReff();
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
    location.emit("failedGetOrderProcessingStatus",{error:{message:"You are not an authorized to do this action"}});  
  } 
}

