var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");	
 	app.get('/api/searchproduct/:searchcriteria',api.productsearchapi.searchProduct);
 	app.get('/api/loadmoreprovider',api.productsearchapi.loadmoreProvider);
 	app.get('/api/loadmoreproduct/:branchid',api.productsearchapi.loadmoreProduct);
 	app.get('/api/searchproduct',api.productsearchapi.randomProductSearch);

 	// Admin access
 	app.post('/api/searchprovider',auth,api.productsearchapi.searchProvider);
}