/*
* Overview: The schema model for Service Categroy
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
var generateId = require('time-uuid');
var productCategorySchema = mongoose.Schema({
	categoryid:{type:String,unique:true},
	categoryname: { type:String ,require:true},
	categorylogo:{type:String},
	parent:{type:String,default:null},//ref to categoryid
	categoryinfo:{type:String},//general info about services
	slug:{type:String},//slug is used to search category
	ancestors:[{
		categoryid:{type:String},
		slug:{type:String},
		categoryname:{type:String}
	}],
	level:{type:Number},
	isleaf:{type:Boolean},
	status:{type:String,default:"active"}
});
productCategorySchema.pre('save', function(next) {
	var productcategory = this;
  	productcategory.slug=productcategory.categoryname.toLowerCase();
  	productcategory.categoryid = generateId();
  	// console.log("productcategory "+productcategory);
  	next();
});
var ServiceCategoryModel = mongoose.model('productcategories', productCategorySchema);
module.exports = ServiceCategoryModel;
