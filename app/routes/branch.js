 var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	app.post('/api/branch/:providerid',auth,api.productproviderapi.addBranch);
	app.get('/api/mybranches',auth,api.productproviderapi.getAllMyBranches);
	app.get('/api/branch/:providerid',auth,api.productproviderapi.getProviderBranches);
	app.get('/api/branch/:providerid/:branchid',auth,api.productproviderapi.getBranch);
	app.delete('/api/branch/:providerid/:branchid',auth,api.productproviderapi.deleteBranch);
	app.put('/api/branch/:providerid/:branchid',auth,api.productproviderapi.updateBranch);
 	app.get('/api/hhicons/:iconname',api.hhiconapi.searchIcons);
 	app.get('/api/publishunpublish/branch/:providerid/:branchid',auth,api.productproviderapi.publishUnpublishBranch)
 	app.put('/api/managedeliverycharges/:branchid',auth,api.productproviderapi.manageDeliveryCharges);
 	app.get('/api/branchdeliverycharges/:branchid',auth,api.productproviderapi.getBranchDeliveryCharges)
 	app.delete('/api/branchdeliverycharges/:branchid',auth,api.productproviderapi.deleteDeliveryChargesArea)
 }	

