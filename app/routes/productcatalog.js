var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	app.post('/api/productcatalog/:branchid/:providerid/:categoryid',auth,api.productcatalogapi.addProductCatalog);
 	app.put('/api/productcatalog/:providerid/:productid',auth,api.productcatalogapi.updateProductCatalog);
 	app.delete('/api/productcatalog/:providerid/:productid',auth,api.productcatalogapi.deleteProductCatalog);
 	app.post('/api/productlogo/:providerid/:productid',auth,api.productcatalogapi.uploadProductLogo);
 	app.get('/api/productcatalog/:branchid/:productid',auth,api.productcatalogapi.getProductCatalog);
 	app.get('/api/allproduct/:branchid/:providerid',auth,api.productcatalogapi.getAllProductCatalog);//get all prodcut
 	app.put('/api/productprice/:branchid',auth,api.productcatalogapi.changeProductPrice);
 	app.put('/api/saveprice/:branchid/:productid',auth,api.productcatalogapi.holdingProductPrice);
 	app.put('/api/activateprice/:branchid/:productid',auth,api.productcatalogapi.activateProductPrice);
 	app.put('/api/deactivateprice/:branchid/:productid',auth,api.productcatalogapi.deactivateProductPrice);

 	app.put('/api/publishunpublish/product/:branchid',auth,api.productcatalogapi.publishUnpublishProductCatalog);
 	app.put('/api/productavailability/:providerid/:productid',auth,api.productcatalogapi.manageProductAvailability);
 	app.get('/api/productusertags',auth,api.productcatalogapi.getAllProductUserTags);


 	//Api's for product configuration
 	app.post('/api/productconfig/:categoryid',auth,api.productconfigapi.addProductConfiguration);
 	app.put('/api/productconfig/:categoryid',auth,api.productconfigapi.updateProductConfiguration);
 	app.get('/api/productconfig',auth,api.productconfigapi.getProductConfiguration);
 	app.delete('/api/productconfig/:configid',auth,api.productconfigapi.deleteProductConfiguration); 	
 	app.get('/api/productconfig/:categoryid',auth,api.productconfigapi.getProductConfigurationByCategory);
}


