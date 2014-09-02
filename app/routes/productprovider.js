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

 	app.post('/api/pickupaddress/:providerid',auth,api.productproviderapi.addPickupAddresses);
 	app.put('/api/pickupaddress/:providerid/:addressid',auth,api.productproviderapi.updatePickupAddresses); 	
 	app.get('/api/pickupaddress/:providerid',auth,api.productproviderapi.getPickupAddresses);
 	app.delete('/api/pickupaddress/:providerid/:addressid',auth,api.productproviderapi.deletePickupAddresses);

 	app.post("/api/branchpolicy/:providerid/:branchid",auth,api.productproviderapi.addProviderPolicy);
 	app.get("/api/branchpolicy/:providerid/:branchid",api.productproviderapi.getProviderPolicy);
	app.put("/api/branchpolicy/:providerid/:branchid",auth,api.productproviderapi.updateProviderPolicy);
 	
 	app.post('/api/productprovider/logo/:providerid',auth,api.productproviderapi.uploadProviderLogo);

 	app.post('/api/sellersagreement/:providerid',auth,api.productproviderapi.sellersAgreementUpload);
 	app.get('/api/sellersagreement/:providerid',auth,api.productproviderapi.getSellersAgreement);
 	app.post('/api/sellersagreement/file/:providerid',auth,api.productproviderapi.changeSellersAgreementFile);

 	app.put('/api/glspaymentpercent/:providerid',auth,api.productproviderapi.updateGlsPaymentPercent);
 	app.get('/api/glspaymentpercent',auth,api.productproviderapi.getGlsPaymentPercent);

 	app.post('/api/orderprocessconfig',auth,api.orderprocessconfig.addOrderProcessingStatus);
 	app.get('/api/orderprocessconfig',auth,api.orderprocessconfig.getOrderProcessingStatus);
 	app.delete('/api/orderprocessconfig/:index',auth,api.orderprocessconfig.deleteOrderProcessingStatus);
 	app.post('/api/manageproductcategoryleadtime/:providerid',auth,api.productproviderapi.manageProductCategoryLeadTime)
 	app.get('/api/providerinfo/:providerid',api.productproviderapi.getProviderInfo);

 	app.post('/api/sellerspayable',api.productproviderapi.getSellersPayableInfo); 
}
