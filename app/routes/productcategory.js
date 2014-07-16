var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	app.get('/api/productcategory',auth,api.productcategoryapi.getAllLevelsProductCategory);
	app.get('/api/levelonecategory',auth,api.productcategoryapi.getAllLevelOneCategory);
	app.post('/api/createproductcategory',auth,api.productcategoryapi.createProductCategory);// add category
	app.post('/api/createproductcategory/:categoryid',auth,api.productcategoryapi.addSubCategory);//Add Subcategory into existing category
	app.get('/api/allproductcategories/:providerid',auth,api.productcategoryapi.getAllProductCategory); //Get All product Category	
	app.put('/api/updatepc/:categoryid',auth,api.productcategoryapi.updateProductCategory); //Update product Category
}