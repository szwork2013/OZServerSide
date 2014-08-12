var events = require("events");
var logger = require("../../common/js/logger");
var CategoryModel = require("./product-category-model");
var ProductProvider = require("../../productprovider/js/productprovider-model");
var ProductCatalogModel = require("../../productcatalog/js/product-catalog-model");
var S=require("string");
var ProductCategory = function(productcategorydata) {
  this.productcategory = productcategorydata;
};

ProductCategory.prototype = new events.EventEmitter;
module.exports = ProductCategory;

ProductCategory.prototype.createProductCategory = function(session_userid) {
	var self=this;
	////////////////////////////////////////////////////////////////
	_validateProductCategoryData(self,this.productcategory,session_userid);
	////////////////////////////////////////////////////////////////
};

var _validateProductCategoryData = function(self,productcategorydata,session_userid){
	console.log("productcategorydata "+ JSON.stringify(productcategorydata)+ " user_id " +session_userid);
	if(productcategorydata == undefined){
		self.emit("failedAddProductCategory",{"error":{"code":"AV001","message":"Please provide categorydata"}});
	}else if(productcategorydata.categoryname == undefined || productcategorydata.categoryname == ""){
		self.emit("failedAddProductCategory",{"error":{"code":"AV001","message":"Please provide categoryname"}});
	}else{
		_checkCategoryNameAlreadyExistOrNot(self,productcategorydata);
	}
}

var _checkCategoryNameAlreadyExistOrNot = function(self,productcategorydata){
	// Check Categoryname already exist or not
	CategoryModel.findOne({status:"active",categoryname:new RegExp('^'+productcategorydata.categoryname, "i")},function(err,c_name){
		if(err){
			logger.emit("error","Error in db to getCategory name");
			self.emit("failedAddProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		} else if(c_name){
			self.emit("failedAddProductCategory",{"error":{"code":"AD001","message":"Category name already exist"}});
		}else{
			// Add New Product Category
			_addNewProductCategory(self,productcategorydata);
		}
	});
}

var _addNewProductCategory = function(self,productcategorydata){
	console.log("_addNewProductCategory");
	productcategorydata.level = 1;
	productcategorydata.isleaf = true;
	var product_category = new CategoryModel(productcategorydata);
	product_category.save(function(err,category){
		if(err){
	    	logger.emit("error","Database Issue "+err);
	      	self.emit("failedAddProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
	    }else if(category){
			/////////////////////////////////////
			_successfullAddProductCategory(self);
			////////////////////////////////////
	    }
	});
}

var _successfullAddProductCategory = function(self){
	logger.emit("success","_successfulAddProductCategory");
	self.emit("successfulAddProductCategory", {"success":{"message":"Product Category Added Successfully"}});
}

ProductCategory.prototype.addSubCategory = function(categoryid,session_userid) {
	var self=this;
	////////////////////////////////////////////////////////////////
	_validateSubCategoryData(self,this.productcategory,categoryid,session_userid);
	////////////////////////////////////////////////////////////////
};

var _validateSubCategoryData = function(self,subcategory,categoryid,session_userid){
	console.log("subcategory "+ JSON.stringify(subcategory)+ " user_id " +session_userid);
	if(subcategory == undefined){
		self.emit("failedAddSubCategory",{"error":{"code":"AV001","message":"Please provide subcategorydata"}});
	}else if(subcategory.categoryname == undefined){
		self.emit("failedAddSubCategory",{"error":{"code":"AV001","message":"Please provide categoryname"}});
	}else{
		_addSubCategory(self,subcategory,categoryid,session_userid);
	}
}

var _addSubCategory = function(self,subcategory,categoryid,session_userid){
	CategoryModel.findOne({status:"active",categoryid:categoryid},function(err,category_data){
		if(err){
			logger.emit("error","Error in db to getCategory");
			self.emit("failedAddSubCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		} else if(category_data){
			_checkSubCategoryNameAlreadyExistOrNot(self,subcategory,category_data);
		}else{
			self.emit("failedAddSubCategory",{"error":{"code":"AV001","message":"Wrong Categoryid"}});
		}
	});	
}

var _checkSubCategoryNameAlreadyExistOrNot = function(self,subcategory,category_data){
	// Check SubCategoryname already exist or not
	CategoryModel.findOne({status:"active",categoryname:new RegExp(subcategory.categoryname, "i")},function(err,c_name){
		if(err){
			logger.emit("error","Error in db to getCategory name");
			self.emit("failedAddSubCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		} else if(c_name){
			self.emit("failedAddSubCategory",{"error":{"code":"AD001","message":"Subcategory name already exist"}});
		}else{
			subcategory.level = category_data.level+1;
			subcategory.isleaf = true;
			subcategory.parent = category_data.categoryid;			
			var anc_data = category_data.ancestors;
			anc_data.push({categoryid:category_data.categoryid,categoryname:category_data.categoryname,slug:category_data.categoryname.toLowerCase()});
			subcategory.ancestors = anc_data;
			var service_category = new CategoryModel(subcategory);
			service_category.save(function(err,category){
				if(err){
			    	logger.emit("error","Database Issue "+err);
			      	self.emit("failedAddSubCategory",{"error":{"code":"ED001","message":"Database Issue"}});
			    }else if(category){
			    	_updateMainCategory(self,category_data);
			    }
			});
		}
	});
}

var _updateMainCategory = function(self,category_data){
	CategoryModel.update({categoryid:category_data.categoryid,categoryname:category_data.categoryname},{$set:{isleaf:false}},function(err,categorystatus){
		if(err){
			logger.emit("error","Database Issue can't update main category "+err);
			self.emit("failedAddSubCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(categorystatus==1){
			_successfulladdSubCategory(self);
		}else{
			self.emit("failedAddSubCategory",{"error":{"code":"AD001","message":"Wrong categoryname or categoryid"}});
		}
	})
}

var _successfulladdSubCategory = function(self){
	logger.emit("success","successfulAddSubCategory");
	self.emit("successfulAddSubCategory", {"success":{"message":"Subcategory Added Successfully"}});
}

ProductCategory.prototype.getAllProductCategory = function(providerid,session_userid) {
	var self=this;
	////////////////////////////////////////////////////////////
	_getProviderLevelOneCategory(self,providerid,session_userid);
	////////////////////////////////////////////////////////////
};
var _getProviderLevelOneCategory = function(self,providerid,session_userid){
	console.log("providerid : "+providerid);
	ProductProvider.findOne({providerid:providerid},{providername:1,category:1,_id:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : " + err);
			self.emit("failedGetAllProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc){
			console.log("doc "+JSON.stringify(doc));
	  		_getAllProductCategory(self,doc,session_userid);			
		}else{
			self.emit("failedGetAllProductCategory",{"error":{"code":"AD001","message":"providerid is wrong"}});
	  	}
	});
}
var _getAllProductCategory = function(self,provider,session_userid){
	// {status:{$ne:"deactive"},parent:provider.category.categoryid},{categoryid:1,categoryname:1,_id:0}
	// {"$unwind":"$ancestors"},{$match:{"ancestors.categoryid":"2shkc9wvj1j"}},{$group:{_id:{level:"$level"},category:{$push:{categoryid:"$categoryid",categoryname:"$categoryname",parent:"$parent"}}}},{$project:{level:"$_id.level",category:"$category",_id:0}}
	CategoryModel.aggregate({"$unwind":"$ancestors"},{$match:{"ancestors.categoryid":provider.category.categoryid}},{$group:{_id:{level:"$level"},category:{$push:{categoryid:"$categoryid",categoryname:"$categoryname",parent:"$parent"}}}},{$project:{level:"$_id.level",category:"$category",_id:0}},{$sort:{level:1}}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : " + err);
			self.emit("failedGetAllProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length==0){
			self.emit("failedGetAllProductCategory",{"error":{"code":"AD001","message":"Product category does not exist for "+provider.providername}});
		}else{
	  		_successfulGetAllProductCategory(self,doc);
	  	}
	});
}
var _successfulGetAllProductCategory = function(self,doc){
	logger.emit("log","successfulGetAllProductCategory");
	self.emit("successfulGetAllProductCategory", {"success":{"message":"Getting All Product Category Successfully","ProductCategory":doc}});
}

ProductCategory.prototype.getAllLevelsProductCategory = function(session_userid) {
	var self=this;
	////////////////////////////////////////////////////////////
	_getAllLevelsProductCategory(self,session_userid);
	////////////////////////////////////////////////////////////
};
var _getAllLevelsProductCategory = function(self,session_userid){
	// {"$unwind":"$ancestors"},{$match:{"ancestors.categoryid":"2shkc9wvj1j"}},{$group:{_id:{level:"$level"},category:{$push:{categoryid:"$categoryid",categoryname:"$categoryname",parent:"$parent"}}}},{$project:{level:"$_id.level",category:"$category",_id:0}}
	CategoryModel.aggregate({$group:{_id:{level:"$level"},category:{$push:{categoryid:"$categoryid",categoryname:"$categoryname",parent:"$parent"}}}},{$project:{level:"$_id.level",category:"$category",_id:0}}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : " + err);
			self.emit("failedGetAllLevelsProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length==0){
			self.emit("failedGetAllLevelsProductCategory",{"error":{"code":"AD001","message":"Product category does not exist"}});
		}else{
	  		_successfulGetAllLevelsProductCategory(self,doc);
	  	}
	});
}
var _successfulGetAllLevelsProductCategory = function(self,doc){
	logger.emit("log","_successfulGetAllLevelsProductCategory");
	self.emit("successfulGetAllLevelsProductCategory", {"success":{"message":"Getting All Product Category Successfully","ProductCategory":doc}});
}

ProductCategory.prototype.updateProductCategory = function(categoryid) {
	var self=this;
	console.log("updateProductCategory");
	////////////////////////////////////////////////////////////////
	_validateUpdateProductCategoryData(self,this.productcategory,categoryid);
	////////////////////////////////////////////////////////////////
};
var _validateUpdateProductCategoryData = function(self,productcategory,categoryid){
	if(productcategory == undefined){
		self.emit("failedUpdateProductCategory",{"error":{"code":"AV001","message":"Please provide categorydata"}});
	}else if(productcategory.categoryname == undefined || productcategory.categoryname == ""){
		self.emit("failedUpdateProductCategory",{"error":{"code":"AV001","message":"Please provide categoryname"}});
	}else if(productcategory.categoryid != undefined){
		self.emit("failedUpdateProductCategory",{"error":{"code":"AV001","message":"Can't update categoryid"}});
	}else{
		_isValidCategory(self,productcategory,categoryid);		
	}
}
var _isValidCategory = function(self,categorydata,categoryid){
	CategoryModel.findOne({categoryid:categoryid},{categoryname:1,_id:0}).exec(function(err,olddata){
		if(err){
			logger.emit("error","Database Error : " + err);
			self.emit("failedUpdateProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(olddata){
			console.log("categorydata "+JSON.stringify(olddata));
			_updateProductCategory(self,categorydata,categoryid,olddata.categoryname);
		}else{
			self.emit("failedUpdateProductCategory",{"error":{"code":"AD001","message":"categoryid is wrong"}});
	  	}
	});
}
var _updateProductCategory = function(self,categorydata,categoryid,oldcategoryname){
	// console.log("CategoryID " + categoryid + " categorydata" + categorydata);
	categorydata.slug = categorydata.categoryname.toLowerCase();
	CategoryModel.update({categoryid:categoryid},{$set:categorydata},function(err,categorystatus){
		if(err){
			logger.emit("error","Database Error on updation product category : " + err);
			self.emit("failedUpdateProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(categorystatus==1){
			CategoryModel.update({"ancestors.categoryid":categoryid},{$set:{"ancestors.$.categoryname":categorydata.categoryname,"ancestors.$.slug":categorydata.categoryname.toLowerCase()}},{multi:true},function(err,subcategorystatus){
				if(err){
					logger.emit("error","Database Error : " + err);
					self.emit("failedUpdateProductCategory",{"error":{"code":"ED001","message":"Database Issue"}});
				}else{
					_updateCategorynameInProductsModel(categoryid,categorydata.categoryname,oldcategoryname);
					_successfulUpdateProductCategory(self);
				}
			})
		}else{
			self.emit("failedUpdateProductCategory",{"error":{"code":"AD001","message":"Wrong categoryid"}});
		}
	})
}
var _updateCategorynameInProductsModel = function(categoryid,newcategoryname,oldcategoryname){
	var categorytags = [];
	categorytags.push(oldcategoryname);
	if(S(oldcategoryname).contains(" ")){
	    categorytags=oldcategoryname.split(" ");
		categorytags.push(oldcategoryname);
	}else{
		categorytags.push(oldcategoryname);
	}
	var newcategorytags = [];
	newcategorytags.push(newcategoryname);
	if(S(newcategoryname).contains(" ")){
	    newcategorytags=newcategoryname.split(" ");
		newcategorytags.push(newcategoryname);
	}else{
		newcategorytags.push(newcategoryname);
	}
	console.log("categorytags : "+categorytags);
	ProductCatalogModel.update({"category.id":categoryid},{$set:{"category.categoryname":newcategoryname},"$pullAll":{"categorytags":categorytags}},{multi:true},function(err,productupdatestatus){
		if(err){
			logger.emit("error","Database Error : " + err);
		}else{			
			console.log("newcategorytags : "+newcategorytags);
			// logger.emit("info","category information updated successfully in products model");
			ProductCatalogModel.update({"category.id":categoryid},{$addToSet:{"categorytags":{$each:newcategorytags}}},{multi:true},function(err,productupdatestatus){
				if(err){
					logger.emit("error","Database Error : " + err);
				}else{
					logger.emit("info","category information updated successfully in products model");
					_updateAncestorsCategorynameInProductsModel(categoryid,newcategoryname,categorytags,newcategorytags);
				}
			})
		}
	})
}
var _updateAncestorsCategorynameInProductsModel = function(categoryid,newcategoryname,categorytags,newcategorytags){
	console.log("categorytags : "+categorytags);
	ProductCatalogModel.update({"category.ancestors.categoryid":categoryid},{$set:{"category.ancestors.$.categoryname":newcategoryname,"category.ancestors.$.slug":newcategoryname.toLowerCase()},"$pullAll":{"categorytags":categorytags}},{multi:true},function(err,productupdatestatus){
		if(err){
			logger.emit("error","Database Error : " + err);
		}else{			
			// logger.emit("info","category information updated successfully in products model");
			ProductCatalogModel.update({"category.ancestors.categoryid":categoryid},{$set:{"category.ancestors.$.categoryname":newcategoryname,"category.ancestors.$.slug":newcategoryname.toLowerCase()},$addToSet:{"categorytags":{$each:newcategorytags}}},{multi:true},function(err,productupdatestatus){
				if(err){
					logger.emit("error","Database Error : " + err);
				}else{
					logger.emit("info","ancestors category information updated successfully in products model");
				}
			})
		}
	})
}
var _successfulUpdateProductCategory = function(self){
	logger.emit("log","successfulUpdateProductCategory");
	self.emit("successfulUpdateProductCategory", {"success":{"message":"Product Category Updated Successfully"}});
}

ProductCategory.prototype.getAllLevelOneCategory = function(session_userid) {
	var self=this;
	////////////////////////////////////////////
	_getAllLevelOneCategory(self,session_userid);
	////////////////////////////////////////////
};

var _getAllLevelOneCategory = function(self,session_userid){
	CategoryModel.find({status:{$ne:"deactive"},level:1},{ancestors:0,status:0,_id:0,__v:0}).exec(function(err,doc){
		if(err){
			logger.emit("error","Database Error : " + err);
			self.emit("failedGetAllLevelOneCategory",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(doc.length==0){
			self.emit("failedGetAllLevelOneCategory",{"error":{"code":"AD001","message":"There is no Level One Category"}});
		}else{
			///////////////////////////////////////////
	  		_successfullGetAllProductCategory(self,doc);
	  		////////////////////////////////////////////
	  	}
	});
}

var _successfullGetAllProductCategory = function(self,doc){
	logger.emit("log","_successfullGetAllProductCategory");
	self.emit("successfulGetAllLevelOneCategory", {"success":{"message":"Getting One Level Category","category":doc}});
}