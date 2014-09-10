var logger=require("../../common/js/logger");
var ProductSearch = require("./product-search");

exports.searchProduct = function(req,res){	
	var productsearchdata = req.params.searchcriteria;
  var city = req.query.city;
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
	productsearch.searchProduct(productsearchdata,city);	
}

exports.randomProductSearch = function(req,res){
  var city = req.query.city;
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
  productsearch.randomProductSearch(city);
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
    productsearch.emit("failedTosearchProvider",{"error":{"message":"Only OrderZapp Admin user can search sellers"}});
  }else{
    productsearch.searchProvider(); 
  }  
}

exports.searchProductByCity = function(req,res){
  var city = req.query.city;
  console.log("city " +JSON.stringify(city));  
  var productsearch = new ProductSearch();
  var sessionuserid;// = req.user.userid;

    productsearch.removeAllListeners("failedSearchProductByCity");
    productsearch.on("failedSearchProductByCity",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulSearchProductByCity");
    productsearch.on("successfulSearchProductByCity",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });  
    productsearch.searchProductByCity(city); 
}

exports.getProductProviderByFourthLevelCategory = function(req,res){
  var categoryid = req.params.categoryid;
  console.log("categoryid " +JSON.stringify(categoryid));  
  var productsearch = new ProductSearch();
  var sessionuserid;// = req.user.userid;

    productsearch.removeAllListeners("failedGetProductProviderByFourthLevelCategory");
    productsearch.on("failedGetProductProviderByFourthLevelCategory",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulGetProductProviderByFourthLevelCategory");
    productsearch.on("successfulGetProductProviderByFourthLevelCategory",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });  
    productsearch.getProductProviderByFourthLevelCategory(categoryid); 
}

exports.getProductsOfProviderByCategory = function(req,res){
  var categoryid = req.params.categoryid;
  var providerid = req.params.providerid;
  console.log("categoryid " +categoryid+" providerid "+providerid);  
  var productsearch = new ProductSearch();
  var sessionuserid;// = req.user.userid;

    productsearch.removeAllListeners("failedGetProductsOfProviderByCategory");
    productsearch.on("failedGetProductsOfProviderByCategory",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulGetProductsOfProviderByCategory");
    productsearch.on("successfulGetProductsOfProviderByCategory",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });  
    productsearch.getProductsOfProviderByCategory(categoryid,providerid); 
}

exports.getCityInWhichProvidersProvidesService = function(req,res){
  
  var productsearch = new ProductSearch();
  var sessionuserid;// = req.user.userid;

    productsearch.removeAllListeners("failedGetCityInWhichProvidersProvidesService");
    productsearch.on("failedGetCityInWhichProvidersProvidesService",function(err){
      logger.emit("error", err.error.message,sessionuserid);
      res.send(err);
    });
    productsearch.removeAllListeners("successfulGetCityInWhichProvidersProvidesService");
    productsearch.on("successfulGetCityInWhichProvidersProvidesService",function(doc){
      logger.emit("info", doc.success.message,sessionuserid);
      // console.log("L " + doc.success.doc.length);
      res.send(doc);
    });  
    productsearch.getCityInWhichProvidersProvidesService(); 
}