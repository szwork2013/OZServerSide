var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");	
 	app.get('/api/searchproduct/:searchcriteria',api.productsearchapi.searchProduct);
 	app.get('/api/loadmoreprovider',api.productsearchapi.loadmoreProvider);
 	app.get('/api/loadmoreproduct/:branchid',api.productsearchapi.loadmoreProduct);
 	app.get('/api/searchproduct',api.productsearchapi.randomProductSearch);

 	app.get('/api/city/provider/service',api.productsearchapi.getCityInWhichProvidersProvidesService);
 	// app.get('/api/searchproduct/city',api.productsearchapi.searchProductByCity);//Product Search By City

 	app.get('/api/provider/:categoryid',api.productsearchapi.getProductProviderByFourthLevelCategory);//List of providers by fourth level category
 	app.get('/api/searchproduct/provider/:providerid/category/:categoryid',api.productsearchapi.getProductsOfProviderByCategory);

 	// Admin access
 	app.post('/api/searchprovider',auth,api.productsearchapi.searchProvider);
}