var events = require("events");
var logger = require("../../common/js/logger");
var Order = require("./productorder");
var urlencode = require('urlencode');
var S=require("string");
////////////CONSUMER////////////////////////////
exports.createOrder = function(req,res){//Add New Order
  var session_userid = req.user.userid;
  var orderdata = req.body.orderdata;
  var order = new Order(orderdata);
  logger.emit("log","req body"+JSON.stringify(req.body));
  order.removeAllListeners("failedCreateOrder");
    order.on("failedCreateOrder",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulCreateOrder");
    order.on("successfulCreateOrder",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    order.createOrder(req.user);
}

exports.getAllMyOrder = function(req,res){
   var order = new Order();
  var userid=req.user.userid;
  // var providerid=req.params.providerid;
  var criteriastatus=req.query.criteriastatus;
  // var branchid=req.params.branchid;
  // logger.emit("log","getMySubOrders /providerid:"+providerid+" /branchid:"+branchid);
  order.removeAllListeners("failedGetCurrentAndPastOrders");
    order.on("failedGetCurrentAndPastOrders",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulGetCurrentAndPastOrders");
    order.on("successfulGetCurrentAndPastOrders",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    
  order.getCurrentAndPastOrders(userid,criteriastatus);
}

exports.getAllOrderDetailsForBranch = function(req,res){
  var order = new Order();
  var branchid = req.params.branchid;
  var providerid = req.query.providerid;
  var type = req.query.type;
  var userid = req.user.userid;
  order.removeAllListeners("failedGetAllOrdersForAllProviders");
    order.on("failedGetAllOrdersForAllProviders",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulGetAllOrdersForAllProviders");
    order.on("successfulGetAllOrdersForAllProviders",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin==false){
      console.log(req.user.provider[0].providerid+" #$#$ "+providerid);
      var provider_arr = [];
      for(var i=0;i<req.user.provider.length;i++){
        provider_arr.push(req.user.provider[i].providerid);
      }
      if(provider_arr.indexOf(providerid)<0){
        order.emit("failedGetAllOrdersForAllProviders",{"error":{"message":"You are not authorized to get all order details"}});
      }else{
        order.getAllOrderDetailsForBranch(branchid,type,userid);
      }
    }else{
      order.getAllOrderDetailsForBranch(branchid,type,userid);
    }    
}

exports.loadMoreOrders = function(req,res){
  var order = new Order();
  var orderid = req.params.orderid;
  var type = req.query.type;
  var userid = req.user.userid;
  order.removeAllListeners("failedLoadMoreOrders");
    order.on("failedLoadMoreOrders",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulLoadMoreOrders");
    order.on("successfulLoadMoreOrders",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin==false){
      order.emit("failedLoadMoreOrders",{"error":{"message":"You are not authorized to get all order details"}});
    }else{
      order.loadMoreOrders(orderid,userid);
    }    
}

exports.searchSuborder = function(req,res){
  var order = new Order();
  var suborderid = req.params.suborderid;
  var userid = req.user.userid;
  order.removeAllListeners("failedSearchsuborder");
    order.on("failedSearchsuborder",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulSearchsuborder");
    order.on("successfulSearchsuborder",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin==false){
      order.emit("failedSearchsuborder",{"error":{"message":"You are not authorized to search order details"}});
    }else{
      order.searchSuborder(suborderid,userid);
    }    
}

////////////providers/////////
exports.getMySubOrders = function(req,res){
  var order = new Order();
  var userid=req.user.userid;
  var providerid=req.params.providerid;
  var criteriastatus=req.query.criteriastatus;
  var branchid=req.params.branchid;
  logger.emit("log","getMySubOrders /providerid:"+providerid+" /branchid:"+branchid);
  order.removeAllListeners("failedGetMySubOrders");
    order.on("failedGetMySubOrders",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulGetMySubOrders");
    order.on("successfulGetMySubOrders",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    if(req.user.provider.length==0){
      order.emit("failedGetMySubOrders",{"error":{"message":"There is no Product Provider associated with your account"}})
    }else{
        order.getMySubOrders(userid,providerid,branchid,criteriastatus);
    }
    
}
exports.getDeliveryCharges=function(req,res){
  var order = new Order();
  // var userid=req.user.userid;
  var city=req.body.city;
  var area=req.body.area;

  var branchids=req.body.branchids;
  // logger.emit("log","getMySubOrders /providerid:"+providerid+" /branchid:"+branchid);
  order.removeAllListeners("failedGetDeliveryCharges");
    order.on("failedGetDeliveryCharges",function(err){
      logger.emit("error", err.error.message);
      //order.removeAllListeners();
      res.send(err);
    });
    order.removeAllListeners("successfulGetDeliveryCharges");
    order.on("successfulGetDeliveryCharges",function(result){
      logger.emit("info", result.success.message);
      // order.removeAllListeners();
      res.send(result);
    });
    order.getDeliveryCharges(city,area,branchids);
    }
exports.getLatestProductPrices=function(req,res){
   var order = new Order();
  // var userid=req.user.userid;
  var productcart=req.body.productcart;
  order.removeAllListeners("failedGetLatestProductPrices");
  order.on("failedGetLatestProductPrices",function(err){
    logger.emit("error", err.error.message);
    //order.removeAllListeners();
    res.send(err);
  });
  order.removeAllListeners("successfulGetLatestProductPrices");
  order.on("successfulGetLatestProductPrices",function(result){
    logger.emit("info", result.success.message);
     // order.removeAllListeners();
    res.send(result);
  });
  order.getLatestProductPrices(productcart);
}
//confirm ordery by consumer status changed to approved
exports.confirmOrder=function(mobileno,message,callback){
  var order = new Order();
  // var userid=req.user.userid;
  // var productcart=req.body.productcart;
  order.removeAllListeners("failedConfirmOrder");
  order.on("failedConfirmOrder",function(err){
    logger.emit("error", err.error.message);
    //order.removeAllListeners();
    callback(err);
  });
  order.removeAllListeners("successfulConfirmOrder");
  order.on("successfulConfirmOrder",function(result){
    logger.emit("info", result.success.message);
     // order.removeAllListeners();
    callback(null,result);
  });
  order.confirmOrder(mobileno,message);
}
exports.confirmOrderByWeb=function(req,res){
  var order = new Order();
   var userid=req.user.userid;
   var token=req.body.ordertoken;
  // var productcart=req.body.productcart;
  order.removeAllListeners("failedConfirmOrderByWeb");
  order.on("failedConfirmOrderByWeb",function(err){
    logger.emit("error", err.error.message);
    //order.removeAllListeners();
     res.send(err);
  });
  order.removeAllListeners("successfulConfirmOrderByWeb");
  order.on("successfulConfirmOrderByWeb",function(result){
    logger.emit("info", result.success.message);
     // order.removeAllListeners();
    res.send(result);
  });
  order.confirmOrderByWeb(userid,token);
}
//provider
exports.manageOrder=function(req,res){
  var order = new Order();
  var suborderid=req.params.suborderid;
  var action=req.query.action;
  var deliverydate=req.query.deliverydate;
  var remark=req.query.remark;
  order.removeAllListeners("failedManageOrder");
  order.on("failedManageOrder",function(err){
    logger.emit("error", err.error.message);
    //order.removeAllListeners();
    res.send(err);
  });
  order.removeAllListeners("successfulManageOrder");
  order.on("successfulManageOrder",function(result){
    logger.emit("info", result.success.message);
     // order.removeAllListeners();
    res.send(result);
  });
  order.manageOrder(req.user,suborderid,action,deliverydate,remark);
}
exports.suborderpaymentdone=function(req,res){
  var order = new Order();
  var suborderid=req.params.suborderid;
  // var action=req.query.action;
  // var deliverydate=req.query.deliverydate;
  order.removeAllListeners("failedSubOrderPaymentDone");
  order.on("failedSubOrderPaymentDone",function(err){
    logger.emit("error", err.error.message);
    //order.removeAllListeners();
    res.send(err);
  });
  order.removeAllListeners("successfulSubOrderPaymentDone");
  order.on("successfulSubOrderPaymentDone",function(result){
    logger.emit("info", result.success.message);
     // order.removeAllListeners();
    res.send(result);
  });
  order.suborderPaymentDone(req.user,suborderid);
}
exports.generatePayTmCheckSum = function(req,res){//Add New Order
  var session_userid = null;
  var checksumdata = req.body;
  var order = new Order();
  logger.emit("log","req body"+JSON.stringify(req.body));
  order.removeAllListeners("failedgeneratePayTmCheckSum");
    order.on("failedgeneratePayTmCheckSum",function(err){
      logger.emit("error", err.error.message);
      console.log("checksum error"+JSON.stringify(err.error))
      //order.removeAllListeners();
      res.send(JSON.stringify(err.error.generatechecksumresponse));
    });
    order.removeAllListeners("successfulgeneratePayTmCheckSum");
    order.on("successfulgeneratePayTmCheckSum",function(result){
      // logger.emit("info", result.success.message);
      logger.emit("log","generte checksum response"+JSON.stringify(result));
      // order.removeAllListeners();
      res.send(JSON.stringify(result));
    });
    order.generatePayTmCheckSum(session_userid,checksumdata);
}
exports.paytmCallbackUrl = function(req,res){//Add New Order
  // var session_userid = req.user.userid;
  var paytmresponsedata = req.body;
  var order = new Order();
  var htmlresponse="<html><head>";

  htmlresponse+="<meta http-equiv='Content-Type' content='text/html;charset=ISO-8859-1'>";
  htmlresponse+="<title>Paytm</title>";
  htmlresponse+="<script type='javascript'>function response() {return document.getElementById('response').value;}</script></head>";
  htmlresponse+="<body>Redirection back To the app<br>";
  // htmlresponse+="<form name='frm' method='post'><input type='hidden' name='responseField' value='"+responseobject+"'></form></body></html>";    
  logger.emit("log","req body"+JSON.stringify(req.body));
  console.log("req body:"+JSON.stringify(req.body))
  order.removeAllListeners("failedPaytmCallbackUrl");
  order.on("failedPaytmCallbackUrl",function(err){
   console.log("JSON"+JSON.stringify(err.error.responseobject))
  err.error.responseobject=JSON.stringify(err.error.responseobject);
  var responseobject=JSON.stringify(err.error.responseobject);
  responseobject=S(JSON.parse(responseobject));
  responseobject=responseobject.replaceAll('"',"&quot;");
      htmlresponse+="<form name='frm' method='post'><input type='hidden' name='responseField' id='response' value='"+responseobject+"'></form></body></html>";    
      logger.emit("error", err.error.message);
      console.log("paytmCallbackUrl"+JSON.stringify(err.error));
            // order.removeAllListeners();
      logger.emit("log","HTML:err:"+htmlresponse)
      //order.removeAllListeners();
      res.send(htmlresponse);
    });
    order.removeAllListeners("successfulPaytmCallbackUrl");
    order.on("successfulPaytmCallbackUrl",function(result){
      logger.emit("info", result.success.message);
      result.success.responseobject=JSON.stringify(result.success.responseobject);
      var responseobject=JSON.stringify(result.success.responseobject);
      responseobject=S(JSON.parse(responseobject));
      responseobject=responseobject.replaceAll('"',"&quot;");
      htmlresponse+="<form name='frm' method='post'><input type='hidden' name='responseField' id='response' value='"+responseobject+"'></form></body></html>";    
      // order.removeAllListeners();
      logger.emit("log","HTML:success:"+htmlresponse)
      res.send(htmlresponse);
    });
    order.paytmCallbackUrl(paytmresponsedata);
}
exports.getBranchSubOrderStatusWiseCount = function(req,res){//Add New Order
  var session_userid = req.user.userid;
  var providerid=req.params.providerid;
  var branchid = req.params.branchid;
  var order = new Order();
  // logger.emit("log","req body"+JSON.stringify(req.body));
  order.removeAllListeners("failedgetOrderStatusWiseCount");
    order.on("failedgetOrderStatusWiseCount",function(err){
      logger.emit("error", err.error.message);
      console.log("checksum error"+JSON.stringify(err.error))
      //order.removeAllListeners();
      res.send(JSON.stringify(err.error.generatechecksumresponse));
    });
    order.removeAllListeners("successfulGetOrderStatusWiseCount");
    order.on("successfulGetOrderStatusWiseCount",function(result){
      // logger.emit("info", result.success.message);
      logger.emit("log","generte checksum response"+JSON.stringify(result));
      // order.removeAllListeners();
      res.send(JSON.stringify(result));
    });
    order.getBranchSubOrderStatusWiseCount(session_userid,providerid,branchid);
}
exports.getProviderSubOrderStatusWiseCount = function(req,res){//Add New Order
  var session_userid = req.user.userid;
  // var providerid=req.params.providerid;
  var providerid = req.params.providerid;
  var order = new Order();
  // logger.emit("log","req body"+JSON.stringify(req.body));
  order.removeAllListeners("failedgetPrviderOrderStatusWiseCount");
    order.on("failedgetPrviderOrderStatusWiseCount",function(err){
      logger.emit("error", err.error.message);
      console.log("checksum error"+JSON.stringify(err.error))
      //order.removeAllListeners();
      res.send(JSON.stringify(err.error.generatechecksumresponse));
    });
    order.removeAllListeners("successfulGetProviderOrderStatusWiseCount");
    order.on("successfulGetProviderOrderStatusWiseCount",function(result){
      // logger.emit("info", result.success.message);
      // logger.emit("log","generte checksum response"+JSON.stringify(result));
      // order.removeAllListeners();
      res.send(JSON.stringify(result));
    });
    order.getProviderSubOrderStatusWiseCount(session_userid,providerid);
}
// exports.getServiceOrderRequest = function(req,res){
//   var requestid = req.params.requestid;
//   var order = new Order();
//   order.removeAllListeners("failedGetServiceOrder");
//     order.on("failedGetServiceOrder",function(err){
//       logger.emit("error", err.error.message);
//       //order.removeAllListeners();
//       res.send(err);
//     });
//     order.removeAllListeners("successfulGetServiceOrder");
//     order.on("successfulGetServiceOrder",function(result){
//       logger.emit("info", result.success.message);
//       // order.removeAllListeners();
//       res.send(result);
//     });
//     order.getServiceOrderRequest(requestid);
// }

// exports.getAllServiceOrderRequests = function(req,res){
//   var order = new Order();
//   console.log("getAllServiceOrders");
//   order.removeAllListeners("failedGetAllServiceOrders");
//   order.on("failedGetAllServiceOrders",function(err){
//     logger.emit("error", err.error.message);
//     //order.removeAllListeners();
//     res.send(err);
//   });
//   order.removeAllListeners("successfulGetAllServiceOrders");
//   order.on("successfulGetAllServiceOrders",function(result){
//     logger.emit("info", result.success.message);
//     // order.removeAllListeners();
//     res.send(result);
//   });
//   order.getAllServiceOrderRequests();
// }

// exports.updateServiceOrder = function(req,res){
//   var requestid = req.params.requestid;
//   var serviceOrderUpdateData = req.body.serv_ord_update_data;
//   var order = new Order(serviceOrderUpdateData);
//   order.removeAllListeners("failedUpdateServiceOrderRequest");
//     order.on("failedUpdateServiceOrderRequest",function(err){
//       logger.emit("error", err.error.message);
//       //order.removeAllListeners();
//       res.send(err);
//     });
//     order.removeAllListeners("successfulUpdateServiceOrderRequest");
//     order.on("successfulUpdateServiceOrderRequest",function(result){
//       logger.emit("info", result.success.message);
//       // order.removeAllListeners();
//       res.send(result);
//     });
//     order.updateServiceOrder(requestid,req.user);
// }

// exports.changeAppointmentOfServiceOrder = function(req,res){
//   var requestid = req.params.requestid;
//   var serviceOrderUpdateData = req.body.serv_ord_update_data;
//   var order = new Order(serviceOrderUpdateData);
//   order.removeAllListeners("failedUpdateServiceOrderRequest");
//     order.on("failedUpdateServiceOrderRequest",function(err){
//       logger.emit("error", err.error.message);
//       //order.removeAllListeners();
//       res.send(err);
//     });
//     order.removeAllListeners("successfulUpdateServiceOrderRequest");
//     order.on("successfulUpdateServiceOrderRequest",function(result){
//       logger.emit("info", result.success.message);
//       // order.removeAllListeners();
//       res.send(result);
//     });
//     order.changeAppointmentOfServiceOrder(requestid,req.user);
// }

// exports.deleteServiceOrder = function(req,res){
//   var requestid = req.params.requestid;
//   var order = new Order();
//   order.removeAllListeners("failedDeleteServiceOrder");
//     order.on("failedDeleteServiceOrder",function(err){
//       logger.emit("error", err.error.message);
//       //order.removeAllListeners();
//       res.send(err);
//     });
//     order.removeAllListeners("successfulDeleteServiceOrder");
//     order.on("successfulDeleteServiceOrder",function(result){
//       logger.emit("info", result.success.message);
//       // order.removeAllListeners();
//       res.send(result);
//     });
//     order.deleteServiceOrder(requestid);
// }