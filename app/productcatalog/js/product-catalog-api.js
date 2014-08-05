var ProductCatalog=require("./product-catalog");
var logger=require("../../common/js/logger");
var UserModel=require("../../user/js/user-model");
var commonapi=require("../../common/js/common-api");
var S=require("string");

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.addProductCatalog=function(req,res){
  var productcatalogdata = req.body.data;
  var branchid = req.params.branchid;
  var providerid = req.params.providerid;
  var categoryid = req.params.categoryid;
  var productlogo = req.files.logo;
  if(productlogo==undefined){
    productlogo=req.files.file;
  }
  logger.emit("log","req files"+JSON.stringify(productlogo))
  console.log("productcatalogdata 1: "+JSON.stringify(productcatalogdata));
  var productcatalog = new ProductCatalog(productcatalogdata);
   logger.emit("log"," providerid "+providerid+" categoryid "+categoryid );
   productcatalog.removeAllListeners("failedAddProductCatalog");
    productcatalog.on("failedAddProductCatalog",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulAddProductCatalog");
    productcatalog.on("successfulAddProductCatalog",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
     //user.removeAllListeners();
      res.send(result);
    });
    console.log("req. bodyd ata"+req.body.data)
    if(!IsJsonString(productcatalogdata)){
      productcatalog.emit("failedAddProductCatalog",{error:{message:"productcatalog should be json string"}});
    }else{
      if(req.user.usertype!="provider"){
        productcatalog.emit("failedAddProductCatalog",{error:{message:"You are not an provider user to add product details"}});
      }else{
        productcatalog.addProductCatalog(branchid,providerid,categoryid,req.user,productlogo);
      }
    } 
  
}

exports.updateProductCatalog=function(req,res){
  var productcatalogdata = req.body.productcatalog;
  // var branchid = req.params.branchid;
  var providerid = req.params.providerid;
  var productid = req.params.productid;
  var productcatalog = new ProductCatalog(productcatalogdata);
   logger.emit("log","req body updateProductCatalog"+ JSON.stringify(productcatalogdata));
   productcatalog.removeAllListeners("failedUpdateProductCatalog");
    productcatalog.on("failedUpdateProductCatalog",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message);
      }
      
      // //user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulUpdateProductCatalog");
    productcatalog.on("successfulUpdateProductCatalog",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.usertype!="provider"){
      productcatalog.emit("failedUpdateProductCatalog",{error:{message:"You are not an provider user to update product details"}});
    }else{
      productcatalog.updateProductCatalog(providerid,productid,req.user);
    }
}

exports.deleteProductCatalog=function(req,res){
  // var branchid = req.params.branchid;
  var providerid = req.params.providerid;
  var productid = req.params.productid;
  var productcatalog = new ProductCatalog();
   productcatalog.removeAllListeners("failedDeleteProductCatalog");
    productcatalog.on("failedDeleteProductCatalog",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulDeleteProductCatalog");
    productcatalog.on("successfulDeleteProductCatalog",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.usertype!="provider"){
      productcatalog.emit("failedDeleteProductCatalog",{error:{message:"You are not an provider user to delete product"}});
    }else{
      productcatalog.deleteProductCatalog(providerid,productid,req.user);
    }
}

exports.uploadProductLogo=function(req,res){
  var providerid = req.params.providerid;
  var productid = req.params.productid;
  console.log("productid"+productid)
  var productcatalog = new ProductCatalog();
  logger.emit("log","REQ files "+JSON.stringify(req.files));
  var productlogo=req.files.logo;
  if(productlogo==undefined){
    productlogo=req.files.file;
  }
 
  productcatalog.removeAllListeners("failedAddProductLogo");
  productcatalog.on("failedAddProductLogo",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // //user.removeAllListeners();
      res.send(err);
  });
  productcatalog.removeAllListeners("successfulAddProductLogo");
  productcatalog.on("successfulAddProductLogo",function(result){
    res.send(result);
  });
  productcatalog.addProductLogo(providerid,productid,req.user,productlogo);
}

exports.getProductCatalog=function(req,res){
  // var branchid = req.params.branchid;
  var branchid = req.params.branchid;
  var productid = req.params.productid;
  var productcatalog = new ProductCatalog();
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(productcatalogdata));
   productcatalog.removeAllListeners("failedGetProductCatalog");
    productcatalog.on("failedGetProductCatalog",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulGetProductCatalog");
    productcatalog.on("successfulGetProductCatalog",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
  productcatalog.getProductCatalog(branchid,productid);
}

exports.getAllProductCatalog=function(req,res){
  // var branchid = req.params.branchid;
  var branchid = req.params.branchid;
  var providerid = req.params.providerid;
  var productcatalog = new ProductCatalog();
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(productcatalogdata));
   productcatalog.removeAllListeners("failedGetAllProductCatalog");
    productcatalog.on("failedGetAllProductCatalog",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulGetAllProductCatalog");
    productcatalog.on("successfulGetAllProductCatalog",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });
  productcatalog.getAllProductCatalog(branchid,providerid,req.user);
}
exports.changeProductPrice=function(req,res){
  var branchid = req.params.branchid;
  // var productid=req.params.productid;
  var productpricedata=req.body.productpricedata;
  var productcatalog = new ProductCatalog();
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(productcatalogdata));
   productcatalog.removeAllListeners("failedChangeProductPrice");
    productcatalog.on("failedChangeProductPrice",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulChangeProductPrice");
    productcatalog.on("successfulChangeProductPrice",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message);
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedChangeProductPrice',{error:{code:"EA001",message:"You are not a provider to change price details"}});
    }else{
      /////////////////////////////////////////////////////////////////////////////////
       productcatalog.changeProductsPrice(branchid,productpricedata,req.user.userid);
       ////////////////////////////////////////////////////////////////////////////////
    }
}

exports.holdingProductPrice=function(req,res){
  var branchid = req.params.branchid;
  var productid=req.params.productid;
  var pricedata=req.body.pricedata;
  var productcatalog = new ProductCatalog();
   logger.emit("log","req body holdingProductPrice"+ JSON.stringify(pricedata));
   productcatalog.removeAllListeners("failedHoldProductPrice");
    productcatalog.on("failedHoldProductPrice",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulHoldProductPrice");
    productcatalog.on("successfulHoldProductPrice",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedHoldProductPrice',{error:{code:"EA001",message:"You are not a provider to change price details"}});
    }else{
      /////////////////////////////////////////////////////////////////////////////////
      productcatalog.holdingProductPrice(branchid,productid,pricedata,req.user.userid);
      /////////////////////////////////////////////////////////////////////////////////
    }
}

exports.activateProductPrice=function(req,res){
  var branchid = req.params.branchid;
  var productid = req.params.productid;
  // var action = req.query.action;
  var productcatalog = new ProductCatalog();
   // logger.emit("log","req body addServiceCatalog"+ JSON.stringify(productcatalogdata));
   productcatalog.removeAllListeners("failedActivateProductPrice");
    productcatalog.on("failedActivateProductPrice",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulActivateProductPrice");
    productcatalog.on("successfulActivateProductPrice",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedActivateProductPrice',{error:{code:"EA001",message:"You are not a provider to change price details"}});
    }else{
      /////////////////////////////////////////////////////////////////////////////////
      productcatalog.activateProductPrice(branchid,productid,req.user.userid);
      /////////////////////////////////////////////////////////////////////////////////
    }
}

exports.deactivateProductPrice=function(req,res){
  var branchid = req.params.branchid;
  var productid = req.params.productid;
  var productcatalog = new ProductCatalog();
   productcatalog.removeAllListeners("failedDeactivateProductPrice");
    productcatalog.on("failedDeactivateProductPrice",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }      
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfulDeactivateProductPrice");
    productcatalog.on("successfulDeactivateProductPrice",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    });  
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedDeactivateProductPrice',{error:{code:"EA001",message:"You are not a provider to change price details"}});
    }else{
      //////////////////////////////////////////////////////////////////////////
      productcatalog.deactivateProductPrice(branchid,productid,req.user.userid);
      //////////////////////////////////////////////////////////////////////////
    }
}

exports.publishUnpublishProductCatalog=function(req,res){
  var branchid = req.params.branchid;
  // var productid = req.params.productid;
  var action=req.query.action;
  var productids=req.body.productids;
  var productcatalog = new ProductCatalog();
   productcatalog.removeAllListeners("failedPublishUnpublishProduct");
    productcatalog.on("failedPublishUnpublishProduct",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfullPublishUnpublishCatalog");
    productcatalog.on("successfullPublishUnpublishCatalog",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      // user.removeAllListeners();
      res.send(result);
    });  
  productcatalog.publishUnpublishProductCatalog(branchid,productids,req.user,action);
}
 
exports.manageProductAvailability=function(req,res){
  var providerid = req.params.providerid;
  var productid = req.params.productid;
  var productnotavailable = req.body.productnotavailable;
  var productcatalog = new ProductCatalog(productnotavailable);
   productcatalog.removeAllListeners("failedManageProductAvailability");
    productcatalog.on("failedManageProductAvailability",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfullManageProductAvailability");
    productcatalog.on("successfullManageProductAvailability",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedManageProductAvailability',{error:{code:"EA001",message:"You are not a provider to manage product availability"}});
    }else{
      productcatalog.manageProductAvailability(providerid,productid,req.user);
    }
}
exports.getAllProductUserTags=function(req,res){
 
  var productcatalog = new ProductCatalog();
   productcatalog.removeAllListeners("failedgetAllProductUserTags");
    productcatalog.on("failedgetAllProductUserTags",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfullGetAllProductUserTags");
    productcatalog.on("successfullGetAllProductUserTags",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedgetAllProductUserTags',{error:{code:"EA001",message:"You are not a provider to get Product user tags details"}});
    }else{
      productcatalog.getAllProductUserTags();
    }
}
exports.manageProductLeadTime=function(req,res){
 
  var productcatalog = new ProductCatalog();
  var sessionuserid=req.user.userid;
  var branchid=req.params.branchid;
  var providerid=req.params.providerid;
  var productleadtimedata=req.body.productleadtimedata;
   productcatalog.removeAllListeners("failedManageProductLeadTime");
    productcatalog.on("failedManageProductLeadTime",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfullManageProductLeadTime");
    productcatalog.on("successfullManageProductLeadTime",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.usertype!="provider"){
      productcatalog.emit('failedManageProductLeadTime',{error:{code:"EA001",message:"You are not a provider to get Product user tags details"}});
    }else{
      productcatalog.manageProductLeadTime(sessionuserid,productleadtimedata,providerid,branchid);
    }
}
exports.getProductLeadTime=function(req,res){
 
  var productcatalog = new ProductCatalog();
  var sessionuserid=req.user.userid;
  var branchid=req.params.branchid;
  var providerid=req.params.providerid;
  var category=req.query.category;
 
   productcatalog.removeAllListeners("failedGetProductLeadTime");
    productcatalog.on("failedManageProductLeadTime",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message); 
      }
      // user.removeAllListeners();
      res.send(err);
    });
    productcatalog.removeAllListeners("successfullGetProductLeadTime");
    productcatalog.on("successfullGetProductLeadTime",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      // user.removeAllListeners();
      res.send(result);
    }); 
    
      productcatalog.getProductLeadTime(sessionuserid,providerid,branchid,category);
    
}