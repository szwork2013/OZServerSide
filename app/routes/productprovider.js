var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	app.post('/api/productprovider',auth,api.productproviderapi.addProductProvider);
    app.put('/api/productprovider/:providerid',auth,api.productproviderapi.updateProductProvider);
    app.delete('/api/productprovider/:providerid',auth,api.productproviderapi.deleteProductProvider);
 	app.get('/api/productprovider/:providerid',auth,api.productproviderapi.getProductProvider);
 	app.get("/api/myproviders",auth,api.productproviderapi.getAllMyProviders);
 	app.get("/api/allproductprovider",auth,api.productproviderapi.getAllProductProviders);
 	app.get("/api/newproviders",auth,api.productproviderapi.getAllNewProductProviders);
 	app.get("/api/acceptreject/:providerid",auth,api.productproviderapi.acceptrejectProductProvider);

 	app.post("/api/branchpolicy/:providerid/:branchid",auth,api.productproviderapi.addProviderPolicy);
 	app.get("/api/branchpolicy/:providerid/:branchid",api.productproviderapi.getProviderPolicy);
	app.put("/api/branchpolicy/:providerid/:branchid",auth,api.productproviderapi.updateProviderPolicy);
 	
 	app.post('/api/productprovider/logo/:providerid',auth,api.productproviderapi.uploadProviderLogo);

 	app.post('/api/sellersagreement/:providerid',auth,api.productproviderapi.sellersAgreementUpload);
 	app.get('/api/sellersagreement/:providerid',auth,api.productproviderapi.getSellersAgreement);
 	app.post('/api/sellersagreement/file/:providerid',auth,api.productproviderapi.changeSellersAgreementFile);
}
