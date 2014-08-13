var logger=require("../../common/js/logger");
var ProductConfig = require("./product-config");
var S=require("string");

exports.addProductConfiguration=function(req,res){
  var categoryid = req.params.categoryid;
  var productconfigdata = req.body.productconfig;
  var productconfig = new ProductConfig(productconfigdata);
  console.log("productconfig "+JSON.stringify(productconfigdata));
  productconfig.removeAllListeners("failedAddProductConfig");
    productconfig.on("failedAddProductConfig",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message);
      }
      
      // //user.removeAllListeners();
      res.send(err);
    });
    productconfig.removeAllListeners("successfulAddProductConfig");
    productconfig.on("successfulAddProductConfig",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.isAdmin == false){
      productconfig.emit("failedAddProductConfig",{error:{message:"Only a user with admin role can add product config details"}});
    }else{
      productconfig.addProductConfiguration(categoryid,req.user);
    }
}
exports.getProductConfiguration=function(req,res){
  var productconfig = new ProductConfig();
  productconfig.removeAllListeners("failedGetProductConfig");
    productconfig.on("failedGetProductConfig",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message);
      }
      
      // //user.removeAllListeners();
      res.send(err);
    });
    productconfig.removeAllListeners("successfulGetProductConfig");
    productconfig.on("successfulGetProductConfig",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.isAdmin == false){
      productconfig.emit("failedGetProductConfig",{error:{message:"Only a user with admin role can get product config details"}});
    }else{
      productconfig.getProductConfiguration(req.user);
    }
}

exports.getProductConfigurationByCategory=function(req,res){
  var categoryid = req.params.categoryid;
  var productconfig = new ProductConfig();
  productconfig.removeAllListeners("failedGetProductConfigByCategory");
    productconfig.on("failedGetProductConfigByCategory",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message);
      }
      
      // //user.removeAllListeners();
      res.send(err);
    });
    productconfig.removeAllListeners("successfulGetProductConfigByCategory");
    productconfig.on("successfulGetProductConfigByCategory",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.usertype!="provider"){
      productconfig.emit("failedGetProductConfigByCategory",{error:{message:"Only a user with admin role can get product config details"}});
    }else{
      productconfig.getProductConfigurationByCategory(categoryid,req.user);
    }
}

exports.updateProductConfiguration=function(req,res){
  var categoryid = req.params.categoryid;
  var productconfigdata = req.body.productconfig;
  var productconfig = new ProductConfig(productconfigdata);
  console.log("productconfig "+JSON.stringify(productconfigdata));
  productconfig.removeAllListeners("failedUpdateProductConfig");
    productconfig.on("failedUpdateProductConfig",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message);
      }
      
      // //user.removeAllListeners();
      res.send(err);
    });
    productconfig.removeAllListeners("successfulUpdateProductConfig");
    productconfig.on("successfulUpdateProductConfig",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.isAdmin == false){
      productconfig.emit("failedUpdateProductConfig",{error:{message:"Only a user with admin role can update product config details"}});
    }else{
      productconfig.updateProductConfiguration(categoryid,req.user);
    }
}

exports.deleteProductConfiguration=function(req,res){
  var configid = req.params.configid;
  var productconfig = new ProductConfig();
  productconfig.removeAllListeners("failedDeleteProductConfig");
    productconfig.on("failedDeleteProductConfig",function(err){
      if(err.error.code!="ED001"){
       logger.emit("error", err.error.message);
      }
      
      // //user.removeAllListeners();
      res.send(err);
    });
    productconfig.removeAllListeners("successfulDeleteProductConfig");
    productconfig.on("successfulDeleteProductConfig",function(result){
      // if(err.error.code!="ED001"){
      //  logger.emit("error", err.error.message); 
      // }
      
      // user.removeAllListeners();
      res.send(result);
    }); 
    if(req.user.isAdmin == false){
      productconfig.emit("failedDeleteProductConfig",{error:{message:"You are not authorized to do delete product configuration"}});
    }else{
      productconfig.deleteProductConfiguration(configid,req.user);
    }
}