var Invoice=require("./invoice");
var logger=require("../../common/js/logger");
exports.getInvoiceDetials=function(req,res){
  var sessionuserid=req.user.userid;
  var suborderid=req.params.suborderid;
  var branchid=req.params.branchid;
  var invoice= new Invoice();
  // logger.emit("log",JSON.stringify(discountdata));
  invoice.removeAllListeners("failedGetInvoiceDetails");
  invoice.on("failedGetInvoiceDetails",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  invoice.removeAllListeners("successfulGetInvoiceDetails");
  invoice.on("successfulGetInvoiceDetails",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  
   invoice.getInvoiceDetials(branchid,suborderid);
  
}
exports.createInvoice=function(req,res){
  var sessionuserid=req.user.userid;
  var suborderid=req.params.suborderid;
  var branchid=req.params.branchid;
  var invoice= new Invoice();
  // logger.emit("log",JSON.stringify(discountdata));
  invoice.removeAllListeners("failedCreateInvoice");
  invoice.on("failedCreateInvoice",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  invoice.removeAllListeners("successfulCreateInvoice");
  invoice.on("successfulCreateInvoice",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  invoice.createInvoice(branchid,suborderid,sessionuserid);
  
}