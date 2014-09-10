var events = require("events");
var logger = require("../../common/js/logger");
var CategoryModel=require("./product-category-model");
var ProductCategory = require("./product-category");

exports.createProductCategory = function(req, res){
	console.log("createProductCategory");
	var session_userid = req.user.userid;
	var categorydata = req.body.categorydata;
	var product_category = new ProductCategory(categorydata);
	product_category.removeAllListeners("failedAddProductCategory");
    product_category.on("failedAddProductCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulAddProductCategory");
    product_category.on("successfulAddProductCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin == true){
      product_category.createProductCategory(session_userid);
    }else{
      product_category.emit("failedAddProductCategory",{error:{message:"Only admin user can add category"}});
    }
}

exports.addSubCategory = function(req, res){
	console.log("addSubCategory");
	var session_userid;// = req.user.userid;
	var categoryid = req.params.categoryid;
	var subcategory = req.body.subcategory;
	var product_category = new ProductCategory(subcategory);
	product_category.removeAllListeners("failedAddSubCategory");
    product_category.on("failedAddSubCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulAddSubCategory");
    product_category.on("successfulAddSubCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin == true){
      product_category.addSubCategory(categoryid,session_userid);
    }else{
      product_category.emit("failedAddSubCategory",{error:{message:"Only admin user can add subcategory"}});
    }
}

exports.getAllProductCategory = function(req,res){
	console.log("getAllProductCategory");
	var session_userid = req.user.userid;
  var providerid = req.params.providerid;
	var product_category = new ProductCategory();
	product_category.removeAllListeners("failedGetAllProductCategory");
    product_category.on("failedGetAllProductCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulGetAllProductCategory");
    product_category.on("successfulGetAllProductCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    console.log("session_userid "+session_userid);
    product_category.getAllProductCategory(providerid,session_userid);
}

exports.getAllLevelsProductCategory = function(req,res){
  console.log("getAllProductCategory");
  var session_userid = req.user.userid;
  var product_category = new ProductCategory();
  product_category.removeAllListeners("failedGetAllLevelsProductCategory");
    product_category.on("failedGetAllLevelsProductCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulGetAllLevelsProductCategory");
    product_category.on("successfulGetAllLevelsProductCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    console.log("session_userid "+session_userid);
    if(req.user.isAdmin == true){
      product_category.getAllLevelsProductCategory(session_userid);
    }else{
      product_category.emit("failedGetAllLevelsProductCategory",{error:{message:"Only admin user can get category details"}});
    }
}

exports.updateProductCategory = function(req,res){
	var session_userid;// = req.user.userid;
	var categoryid = req.params.categoryid;
	var categorydata = req.body.categorydata;
	var product_category = new ProductCategory(categorydata);
	product_category.removeAllListeners("failedUpdateProductCategory");
    product_category.on("failedUpdateProductCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulUpdateProductCategory");
    product_category.on("successfulUpdateProductCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    if(req.user.isAdmin == true){
      product_category.updateProductCategory(categoryid);
    }else{
      product_category.emit("failedUpdateProductCategory",{error:{message:"Only admin user can update category details"}});
    }
}
exports.getAllLevelOneCategory = function(req,res){
  console.log("getAllLevelOneCategory");
  var session_userid;// = req.user.userid;
  var product_category = new ProductCategory();
  product_category.removeAllListeners("failedGetAllLevelOneCategory");
    product_category.on("failedGetAllLevelOneCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulGetAllLevelOneCategory");
    product_category.on("successfulGetAllLevelOneCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    product_category.getAllLevelOneCategory(session_userid);
}

exports.getLevelFourCategory = function(req,res){
  console.log("getLevelFourCategory");
  var session_userid;// = req.user.userid;
  var product_category = new ProductCategory();
  product_category.removeAllListeners("failedGetLevelFourCategory");
    product_category.on("failedGetLevelFourCategory",function(err){
      logger.emit("error", err.error.message);
      //product_category.removeAllListeners();
      res.send(err);
    });
    product_category.removeAllListeners("successfulGetLevelFourCategory");
    product_category.on("successfulGetLevelFourCategory",function(result){
      logger.emit("info", result.success.message);
      // product_category.removeAllListeners();
      res.send(result);
    });
    product_category.getLevelFourCategory(session_userid);
}