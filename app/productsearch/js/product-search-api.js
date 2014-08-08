var logger=require("../../common/js/logger");
var ProductSearch = require("./product-search");

exports.searchProduct = function(req,res){	
	var productsearchdata = req.params.searchcriteria;
  var foodtype = req.query.foodtype;
	// console.log("Session : "+JSON.stringify(req.user));
	var productsearch = new ProductSearch();
	var sessionuserid;//=req.user.userid;

    productsearch.removeAllListeners("failedToSearchProduct");
    productsearch.on("failedToSearchProduct",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulProductSearch");
    productsearch.on("successfulProductSearch",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });
	productsearch.searchProduct(productsearchdata,foodtype);	
}

exports.randomProductSearch = function(req,res){
  var sessionuserid;//=req.user.userid;
  var productsearch = new ProductSearch();
    productsearch.removeAllListeners("failedRandomProductSearch");
    productsearch.on("failedRandomProductSearch",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulRandomProductSearch");
    productsearch.on("successfulRandomProductSearch",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });
  productsearch.randomProductSearch();
}

exports.loadmoreProvider = function(req,res){
  var branchid = req.query.branchid;
  var productsearch = new ProductSearch();
  var sessionuserid;//=req.user.userid;

    productsearch.removeAllListeners("failedLoadMoreProvider");
    productsearch.on("failedLoadMoreProvider",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulLoadMoreProvider");
    productsearch.on("successfulLoadMoreProvider",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });
  productsearch.loadmoreProvider(branchid);
}

exports.loadmoreProduct = function(req,res){
  var branchid = req.params.branchid;
  var productid = req.query.productid;
  var productsearch = new ProductSearch();
  var sessionuserid;//=req.user.userid;

    productsearch.removeAllListeners("failedLoadMoreProduct");
    productsearch.on("failedLoadMoreProduct",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulLoadMoreProduct");
    productsearch.on("successfulLoadMoreProduct",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });
  productsearch.loadmoreProduct(branchid,productid);
}

exports.searchProvider = function(req,res){
  var providername = req.body.providername;
  console.log("providername " +JSON.stringify(providername));  
  var productsearch = new ProductSearch(providername);
  var sessionuserid = req.user.userid;

    productsearch.removeAllListeners("failedTosearchProvider");
    productsearch.on("failedTosearchProvider",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulsearchProvider");
    productsearch.on("successfulsearchProvider",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });
  if(req.user.isAdmin==false){
    productsearch.emit("failedTosearchProvider",{"error":{"message":"You are not an admin user to search provider"}});
  }else{
    productsearch.searchProvider(); 
  }  
}