var Discount=require("./discount");
var logger=require("../../common/js/logger");

exports.addDiscount=function(req,res){
  var sessionuserid=req.user.userid;
  var discountdata=req.body.discountdata;
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var discount= new Discount(discountdata);
  logger.emit("log","discountdata "+JSON.stringify(discountdata));
  discount.removeAllListeners("failedAddDiscount");
  discount.on("failedAddDiscount",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulAddDiscount");
  discount.on("successfulAddDiscount",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedAddDiscount",{error:{message:"You are not a seller group user to add discount details"}});
  }else{
    discount.addDiscount(sessionuserid,providerid,branchid);
  }
}
exports.getAllProducts=function(req,res){
  var sessionuserid=req.user.userid;
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var discount= new Discount();
  discount.removeAllListeners("failedGetAllProducts");
  discount.on("failedGetAllProducts",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulGetAllProducts");
  discount.on("successfulGetAllProducts",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedGetAllProducts",{error:{message:"You are not a seller group user to get all product details"}});
  }else{
    discount.getAllProducts(sessionuserid,providerid,branchid);
  }
}
exports.getDiscountCodes=function(req,res){
  var sessionuserid=req.user.userid;
  var providerid=req.params.providerid;
  var branchid=req.params.branchid;
  var discount= new Discount();
  discount.removeAllListeners("failedGetDiscountCodes");
  discount.on("failedGetDiscountCodes",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulGetDiscountCodes");
  discount.on("successfulGetDiscountCodes",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedGetDiscountCodes",{error:{message:"You are not a seller group user to get discount details"}});
  }else{
    discount.getDiscountCodes(sessionuserid,providerid,branchid);
  }
}
exports.updateDiscount=function(req,res){
  var sessionuser=req.user;;
  var discountdata=req.body.discountdata;
  var discountid=req.params.discountid;
  // var branchid=req.params.branchid;
  var discount= new Discount(discountdata);
  logger.emit("log",JSON.stringify(discountdata));
  discount.removeAllListeners("failedUpdateDiscount");
  discount.on("failedUpdateDiscount",function(err){
    logger.emit("error", err.error.message,sessionuser.userid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulUpdateDiscount");
  discount.on("successfulUpdateDiscount",function(result){
    logger.emit("info", result.success.message,sessionuser.userid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedUpdateDiscount",{error:{message:"You are not a seller group user to update discount details"}});
  }else{
    discount.updateDiscount(sessionuser,discountid);
  }
}
exports.manageProductsToDiscountCode=function(req,res){
  var sessionuser=req.user;;
  var products=req.body.products;
  var discountid=req.params.discountid;
  var branchid=req.params.branchid;
  // var branchid=req.params.branchid;
  var discount= new Discount();
  // logger.emit("log",JSON.stringify(discountdata));
  discount.removeAllListeners("failedAddProductsToDiscountCode");
  discount.on("failedAddProductsToDiscountCode",function(err){
    logger.emit("error", err.error.message,sessionuser.userid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulAddProductsToDiscountCode");
  discount.on("successfulAddProductsToDiscountCode",function(result){
    logger.emit("info", result.success.message,sessionuser.userid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedUpdateDiscount",{error:{message:"You are not a seller group user to add products to discount"}});
  }else{
    discount.manageProductsToDiscountCode(sessionuser,discountid,products,branchid);
  }
}
exports.removeProductsFromDiscountCode=function(req,res){
  var sessionuser=req.user;;
  var products=req.body.products;
  var discountid=req.params.discountid;
  var branchid=req.params.branchid;
  // var branchid=req.params.branchid;
  var discount= new Discount();
  // logger.emit("log",JSON.stringify(discountdata));
  discount.removeAllListeners("failedRemoveProductsFromDiscountCode");
  discount.on("failedRemoveProductsFromDiscountCode",function(err){
    logger.emit("error", err.error.message,sessionuser.userid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulRemoveProductsFromDiscountCode");
  discount.on("successfulRemoveProductsFromDiscountCode",function(result){
    logger.emit("info", result.success.message,sessionuser.userid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedRemoveProductsFromDiscountCode",{error:{message:"You are not a seller group user to remove products from discount"}});
  }else{
    discount.removeProductsFromDiscountCode(sessionuser,discountid,products,branchid);
  }
}

exports.getDiscountedProducts=function(req,res){
  var sessionuserid=req.user.userid;
  var discountid=req.params.discountid;
  var branchid=req.params.branchid;
  var discount= new Discount();
  discount.removeAllListeners("failedGetDiscountedProducts");
  discount.on("failedGetDiscountedProducts",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulGetDiscountedProducts");
  discount.on("successfulGetDiscountedProducts",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedGetDiscountedProducts",{error:{message:"You are not a seller group user to get discounted product details"}});
  }else{
    discount.getDiscountedProducts(sessionuserid,branchid,discountid);
  }
}

exports.deleteDiscount=function(req,res){
  var sessionuserid=req.user.userid;
  var providerid = req.params.providerid;
  var branchid = req.params.branchid
  var discountid=req.params.discountid;
  var discount= new Discount();
  discount.removeAllListeners("failedDeleteDiscount");
  discount.on("failedDeleteDiscount",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  discount.removeAllListeners("successfulDeleteDiscount");
  discount.on("successfulDeleteDiscount",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  if(req.user.usertype!="provider"){
    discount.emit("failedDeleteDiscount",{error:{message:"You are not a seller group user to delete discount details"}});
  }else{
    discount.deleteDiscount(sessionuserid,providerid,branchid,discountid);
  }
}