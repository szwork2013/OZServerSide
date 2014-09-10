/*
* Overview: Product Search
* Dated:
* Author: 
* Copyright: Prodonus Software Private Limited and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-1-2014 | xyx | Add a new property
* 
*/

var ProductCatalogModel = require("../../productcatalog/js/product-catalog-model");
var ProductProviderModel = require("../../productprovider/js/productprovider-model");
var discountModel = require("../../discount/js/discount-model");
var events = require("events");
var logger = require("../../common/js/logger");
var S = require("string");
var __=require("underscore");
var UserModel=require("../../user/js/user-model")

var ProductSearch = function(productsearchdata) {
	this.product = productsearchdata;
};

ProductSearch.prototype = new events.EventEmitter;
module.exports = ProductSearch;

ProductSearch.prototype.searchProduct = function(productsearchdata,foodtype){
	console.log("ProductSearch : " + productsearchdata);
	var self=this;
	_validateSearchData(self,productsearchdata,foodtype);
}

var _validateSearchData = function(self,productsearchdata,foodtype){
	var regex = /^[A-Za-z ,]+$/;	
	if(foodtype == undefined){
		foodtype = ["veg","non-veg","both"];
	}else{
		foodtype = [foodtype];
	}
	console.log("foodtype : "+foodtype.length);
	if(!productsearchdata.match(regex)){
		self.emit("failedToSearchProduct",{"error":{"message":"Please enter valid search criteria"}});
	}else if(S(productsearchdata).contains(",")){
		// console.log("productsearchdata "+ productsearchdata);
		// S(productsearchdata).replace(/,\s*$/, "");
		if(S(productsearchdata).charAt(S(productsearchdata).length-1) == ","){
			self.emit("failedToSearchProduct",{"error":{"message":"Please enter valid search criteria"}});
		}else{
			_searchProductProviderArea(self,productsearchdata,foodtype);	
		}		
	}else{
		_searchProduct(self,productsearchdata,foodtype);
	}
}

var _searchProductProviderArea = function(self,productsearchdata,foodtype){
	var prod_name_arr = [];
	var query_match = [];
	var product_or_name_array = [];

	if(S(productsearchdata).contains(",")){
		prod_name_arr=productsearchdata.split(",");
	}else if(S(productsearchdata).contains(" ")){
		prod_name_arr=productsearchdata.split(" ");
	}else{
		prod_name_arr.push(productsearchdata);
	}
	
	for(var i=0;i<prod_name_arr.length;i++){
		product_or_name_array.push(new RegExp('^'+prod_name_arr[i], "i"));
		product_or_name_array.push(new RegExp(prod_name_arr[i].substr(0,prod_name_arr[i].length), "i"));
	}
	// console.log("product_or_name_array : "+product_or_name_array);
	for(var j=0;j<product_or_name_array.length;j++){
		var match_object={$match:{status:"publish",foodtype:{$in:foodtype},$or:[{producttags:product_or_name_array[j]},{categorytags:product_or_name_array[j]},{providertags:product_or_name_array[j]},{locationtags:product_or_name_array[j]}]}}
		query_match.push(match_object);
	}

	// query_match.push({$group:{_id:{branch:"$branch",provider:"$provider"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}}}})
	// query_match.push({$project:{branch:"$_id.branch",provider:"$_id.provider",productcatalog:1,_id:0}});
	
	query_match.push({$group:{_id:{branch:"$branch.branchid",provider:"$provider.providerid"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}},array:{"$addToSet":{branch:"$branch",provider:"$provider"}}}});
	query_match.push({$unwind:"$array"});
	query_match.push({$project:{branch:"$array.branch",provider:"$array.provider",productcatalog:1,branchid:"$array.branch.branchid",_id:0}});
	
	_fetchingResult(self,query_match,5);
}

var _searchProduct = function(self,productsearchdata,foodtype){
	var prod_name_arr = [];
	var query_match=[];
	var product_or_name_array=[];
	prod_name_arr.push(productsearchdata);

	for(var i=0;i<prod_name_arr.length;i++){
		product_or_name_array.push(new RegExp('^'+prod_name_arr[i], "i"));
		product_or_name_array.push(new RegExp(prod_name_arr[i].substr(0,prod_name_arr[i].length), "i"));
	}

	for(var j=0;j<product_or_name_array.length;j++){
		var match_object={$match:{status:"publish",foodtype:{$in:foodtype},$or:[{producttags:product_or_name_array[j]},{categorytags:product_or_name_array[j]}]}}
		query_match.push(match_object);
	}

	// query_match.push({$group:{_id:{branch:"$branch",provider:"$provider"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}}}});
	// query_match.push({$project:{branch:"$_id.branch",provider:"$_id.provider",productcatalog:1,_id:0}});

	query_match.push({$group:{_id:{branch:"$branch.branchid",provider:"$provider.providerid"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}},array:{"$addToSet":{branch:"$branch",provider:"$provider"}}}});
	query_match.push({$unwind:"$array"});
	query_match.push({$project:{branch:"$array.branch",provider:"$array.provider",productcatalog:1,branchid:"$array.branch.branchid",_id:0}});

	_fetchingResult(self,query_match,5);
}

var _fetchingResult = function(self,query_match,count){
	// console.log("query_match "+JSON.stringify(query_match));
	ProductCatalogModel.aggregate(query_match).exec(function(err,doc){
		if(err){
			self.emit("failedToSearchProduct",{"error":{"code":"ED001","message":"Error in db to search product"+err}});
		}else if(doc.length>0){
			doc =__.uniq(doc,function(test1){
			 	return test1.branchid;
			});
			// query_match.push({$limit:count});
			// ProductCatalogModel.aggregate(query_match).exec(function(err,doc){
			// 	if(err){
			// 		self.emit("failedToSearchProduct",{"error":{"code":"ED001","message":"Error in db to search product"+err}});
			// 	}else if(doc.length == 0){
			// 		self.emit("failedToSearchProduct",{"error":{"message":"No product found for specified criteria"}});
			// 	}else{
			// 		// _successfulProductSearch(self,doc,true);
				if(doc.length>count){
					console.log("###############################################");
					doc.splice(count,doc.length);
			  		_applyLimitToProductCatalog(doc,function(err,result){
				        if(err){
				        	self.emit("failedToSearchProduct",{"error":{"message":+err.error.message}});
				        }else{
				            // _successfulProductSearch(self,result,true);
				            _applyDiscountCodesToProductCatalog(result,function(err,result1){
						        if(err){
						        	self.emit("failedToSearchProduct",{"error":{"message":+err.error.message}});
						        }else{
						            _successfulProductSearch(self,result1,true);
						        }
						    })
				        }
				    })
			  	}else{
			  		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
			  		_applyLimitToProductCatalog(doc,function(err,result){
						if(err){
						   	self.emit("failedToSearchProduct",{"error":{"message":err.error.message}});
						}else{
						    // _successfulProductSearch(self,result,false);
						    _applyDiscountCodesToProductCatalog(result,function(err,result1){
								if(err){
								   	self.emit("failedToSearchProduct",{"error":{"message":err.error.message}});
								}else{
								    _successfulProductSearch(self,result1,false);
							    }
							})
					    }
					})
			  	}
			//   	}
			// });
		}else{
			self.emit("failedToSearchProduct",{"error":{"message":"Product not found"}});
			// doc =__.uniq(doc,function(test1){
			//  	return test1.branchid;
			// });
			// // _successfulProductSearch(self,doc,false);
			// _applyLimitToProductCatalog(doc,function(err,result){
			// 	if(err){
			// 	   	self.emit("failedToSearchProduct",{"error":{"message":err.error.message}});
			// 	}else{
			// 	    // _successfulProductSearch(self,result,false);
			// 	    _applyDiscountCodesToProductCatalog(result,function(err,result1){
			// 			if(err){
			// 			   	self.emit("failedToSearchProduct",{"error":{"message":err.error.message}});
			// 			}else{
			// 			    _successfulProductSearch(self,result1,false);
			// 		    }
			// 		})
			//     }
			// })
	  	}
	});
}

var _applyLimitToProductCatalog=function(doc,callback){
	if(doc.length>0){
		for(var i=0;i<doc.length;i++){
			if(doc[i].productcatalog.length>5){
				doc[i].loadmoreproduct = true;
				doc[i].productcatalog.splice(5,doc[i].productcatalog.length);
			}else{
				doc[i].loadmoreproduct = false;
			}
		}
		callback(null,doc);
	}else{
		callback({error:{message:"No product matched specified criteria"}});
	}
}

var _applyDiscountCodesToProductCatalog=function(doc,callback){
	if(doc.length>0){
		var productid_arr = [];
		for(var i=0;i<doc.length;i++){
			for(var j=0;j<doc[i].productcatalog.length;j++){
				productid_arr.push(doc[i].productcatalog[j].productid);
				// if(doc[i].productcatalog[j].category.ancestors.length>0){
				// 	// console.log("Category : "+JSON.stringify(doc[i].productcatalog[j].category.ancestors[0].categoryname));
				// 	if(doc[i].productcatalog[j].category.categoryname == "Pastries"){
				// 		console.log("cake");
				// 		doc[i].productcatalog[j].wizard = "cake";
				// 	}else{
				// 		doc[i].productcatalog[j].wizard = "none";
				// 	}
				// }
				doc[i].productcatalog[j].category = undefined;
			}
		}
		discountModel.aggregate([{$unwind:"$products"},{$match:{status:"active",products:{$in:productid_arr},startdate:{$lte:new Date()},expirydate:{$gte:new Date()}}},{$project:{products:1,discountcode:1,percent:1,_id:0}}]).exec(function(err,discountcodes){
			if(err){
				callback({error:{message:"Error in db to get discount codes"}});
			}else if(discountcodes.length>0){
				console.log("discountcodes : "+JSON.stringify(discountcodes));
				for(var i=0;i<doc.length;i++){
					for(var j=0;j<doc[i].productcatalog.length;j++){
						discount = __.find(discountcodes, function(obj) { return obj.products == doc[i].productcatalog[j].productid });
						if(discount != undefined){
							doc[i].productcatalog[j].discount = {code:discount.discountcode,percent:discount.percent};
						}else{
							doc[i].productcatalog[j].discount = {code:"none",percent:0};
						}
						// for(var k=0;k<discountcodes.length;k++){
						// 	if(doc[i].productcatalog[j].productid == discountcodes[k].products){
								// console.log("yes : "+JSON.stringify(discount));
						// 		doc[i].productcatalog[j].discount = {code:discountcodes[k].discountcode,percent:discountcodes[k].percent};
						// 	}else{
						// 		console.log("none : "+doc[i].productcatalog[j].productid);
						// 		doc[i].productcatalog[j].discount = {code:"none",percent:0};
						// 	}
						// }
					}		
				}
				callback(null,doc);
			}else{
				for(var i=0;i<doc.length;i++){
					for(var j=0;j<doc[i].productcatalog.length;j++){
						doc[i].productcatalog[j].discount = {code:"none",percent:0};
					}		
				}
				callback(null,doc);
		  	}
		  	// callback(null,doc);
		});
	}else{
		callback({error:{message:"No product matched specified criteria"}});
	}
}

var _successfulProductSearch = function(self,doc,boolean){
	logger.emit("log","_successfulProductSearch");
	self.emit("successfulProductSearch", {"success":{"message":"Getting Search Results Successfully","provider":doc,"loadmoreprovider":boolean}});
}

function getRandomBranchIDs(arr, count) {
	var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
	while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

ProductSearch.prototype.randomProductSearch = function(){
	var self=this;
	_getrandomBranchIDs(self);
}

var _getrandomBranchIDs = function(self){
	ProductCatalogModel.aggregate([{$match:{status:{$ne:"deactive"}}},{$group:{_id:{branchid:"$branch.branchid"}}},{$project:{branchid:"$_id.branchid",_id:0}}]).exec(function(err,doc){
		if(err){
			self.emit("failedRandomProductSearch",{"error":{"code":"ED001","message":"Error in db to search random product"+err}});
		}else if(doc.length==0){
			self.emit("failedRandomProductSearch",{"error":{"message":"Product not found"}});
		}else{
			console.log("Doc : "+JSON.stringify(doc));
			var arr = [];
			for(var i=0;i<doc.length;i++){				
				arr.push(doc[i].branchid);
			}
			console.log("arr : "+arr);
			if(arr.length<5){
				_randomProductSearch(self,arr,false);
			}else{
				var branchids = getRandomBranchIDs(arr,5);
				_randomProductSearch(self,branchids,true);
			}	  		
	  	}
	});
}

var _randomProductSearch = function(self,branchids,boolean){
	console.log("branchids : "+branchids);
	// var query = [{$match:{status:"publish","branch.branchid":{$in:branchids}}},{$group:{_id:{branch:"$branch",provider:"$provider"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}}}},{$project:{branch:"$_id.branch",provider:"$_id.provider",productcatalog:1,_id:0}}];
	var newQuery = [{$match:{status:"publish","branch.branchid":{$in:branchids}}},{$group:{_id:{branch:"$branch.branchid",provider:"$provider.providerid"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}},array:{"$addToSet":{branch:"$branch",provider:"$provider"}}}},{$unwind:"$array"},{$project:{branch:"$array.branch",provider:"$array.provider",productcatalog:1,branchid:"$array.branch.branchid",_id:0}}];
	ProductCatalogModel.aggregate(newQuery).exec(function(err,doc){
		if(err){
			self.emit("failedRandomProductSearch",{"error":{"code":"ED001","message":"Error in db to search random product"+err}});
		}else if(doc.length==0){
			self.emit("failedRandomProductSearch",{"error":{"message":"Product not found"}});
		}else{
			doc =__.uniq(doc,function(test1){
			 	return test1.branchid;
			});
			_applyLimitToProductCatalog(doc,function(err,result){
				if(err){
				   	self.emit("failedRandomProductSearch",{"error":{"message":err.error.message}});
				}else{
					_applyDiscountCodesToProductCatalog(result,function(err,result1){
						if(err){
						   	self.emit("failedRandomProductSearch",{"error":{"message":err.error.message}});
						}else{
						    _successfulRandomProductSearch(self,result1,boolean);
					    }
					});
			    }
			});
	  	}
	});
}

var _successfulRandomProductSearch = function(self,doc,boolean){
	logger.emit("log","_successfulRandomProductSearch");
	self.emit("successfulRandomProductSearch", {"success":{"message":"Getting Search Result Successfully","provider":doc,"loadmoreprovider":boolean}});
}

ProductSearch.prototype.loadmoreProvider = function(branchid){
	var self=this;
	if(branchid == undefined){
		_getAllBranchIds(self,branchid);
	}else{
		_loadmoreProvider(self,branchid);
	}
}

var _getAllBranchIds = function(self,branchid){
	console.log("_getAllBranchIds");
	// {$unwind:"$branch"},{$project:{branchid:"$branch.branchid",createdate:"$branch.createdate",_id:0}},{$sort:{createdate:-1}},{$limit:10},{$project:{branchid:1}}
	ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.status":"publish"}},{$sort:{"branch.createdate":-1}},{$limit:10},{$project:{branchid:"$branch.branchid",_id:0}}).exec(function(err,doc){
		if(err){
			self.emit("failedLoadMoreProvider",{"error":{"code":"ED001","message":"Error in db to find branch id's "+err}});
		}else if(doc.length==0){
			self.emit("failedLoadMoreProvider",{"error":{"message":"No more seller(s) found"}});
		}else{
			var branchid_arr = [];
			for(var i=0;i<doc.length;i++){				
				branchid_arr.push(doc[i].branchid);
			}
			console.log("branchid_arr "+branchid_arr);
			var query_match = [];
			var match_object={$match:{status:"publish","branch.branchid":{$in:branchid_arr}}};
			query_match.push(match_object);

			// query_match.push({$group:{_id:{branch:"$branch",provider:"$provider"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}}}})
			// query_match.push({$project:{branch:"$_id.branch",provider:"$_id.provider",productcatalog:1,_id:0}});
			
			query_match.push({$group:{_id:{branch:"$branch.branchid",provider:"$provider.providerid"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}},array:{"$addToSet":{branch:"$branch",provider:"$provider"}}}});
			query_match.push({$unwind:"$array"});
			query_match.push({$project:{branch:"$array.branch",provider:"$array.provider",productcatalog:1,branchid:"$array.branch.branchid",_id:0}});

			_fetchingResultToLoadMoreProvider(self,query_match);
	  	}
	});
}

var _loadmoreProvider = function(self,branchid){
	console.log("_loadmoreProvider");
	ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$project:{createdate:"$createdate",_id:0}}).exec(function(err,doc){
		if(err){
			self.emit("failedLoadMoreProvider",{"error":{"code":"ED001","message":"Error in db to find branch id's "+err}});
		}else if(doc.length==0){
			self.emit("failedLoadMoreProvider",{"error":{"message":"No more seller(s) found"}});
		}else{
			console.log("DOC ### : "+JSON.stringify(doc));
			var createdate = doc[0].createdate;
			console.log("createdate : "+JSON.stringify(createdate));
			ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.status":"publish","branch.branchid":{$ne:branchid},"branch.createdate":{$lte:createdate}}},{$sort:{"branch.createdate":-1}},{$limit:10},{$project:{branchid:"$branch.branchid",_id:0}}).exec(function(err,branchids){
				if(err){
					self.emit("failedLoadMoreProvider",{"error":{"code":"ED001","message":"Error in db to find branch id's "+err}});
				}else if(branchids.length==0){
					self.emit("failedLoadMoreProvider",{"error":{"message":"No more seller(s) found"}});
				}else{
					var branchid_arr = [];
					for(var i=0;i<branchids.length;i++){				
						branchid_arr.push(branchids[i].branchid);
					}
					console.log("branchid_arr "+branchid_arr);
					var query_match = [];
					var match_object={$match:{status:"publish","branch.branchid":{$in:branchid_arr}}};
					query_match.push(match_object);

					// query_match.push({$group:{_id:{branch:"$branch",provider:"$provider"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}}}})
					// query_match.push({$project:{branch:"$_id.branch",provider:"$_id.provider",productcatalog:1,_id:0}});
					
					query_match.push({$group:{_id:{branch:"$branch.branchid",provider:"$provider.providerid"},productcatalog:{"$addToSet":{productid:"$productid",productname:"$productname",category:"$category",productdescription:"$productdescription",price:"$price",productlogo:"$productlogo",foodtype:"$foodtype",max_weight:"$max_weight",min_weight:"$min_weight",productnotavailable:"$productnotavailable",specialinstruction:"$specialinstruction",productconfiguration:"$productconfiguration"}},array:{"$addToSet":{branch:"$branch",provider:"$provider"}}}});
					query_match.push({$unwind:"$array"});
					query_match.push({$project:{branch:"$array.branch",provider:"$array.provider",productcatalog:1,branchid:"$array.branch.branchid",_id:0}});
					
					_fetchingResultToLoadMoreProvider(self,query_match);
			  	}
			});			
	  	}
	});
}

var _fetchingResultToLoadMoreProvider = function(self,query_match){
	console.log("query_match :"+JSON.stringify(query_match));
	ProductCatalogModel.aggregate(query_match).exec(function(err,doc){
		if(err){
			self.emit("failedLoadMoreProvider",{"error":{"code":"ED001","message":"Error in db to loadmore provider "+err}});
		}else if(doc.length == 0){
			console.log("doc : "+JSON.stringify(doc));
			self.emit("failedLoadMoreProvider",{"error":{"message":"No more seller(s) found"}});
		}else{
			doc =__.uniq(doc,function(test1){
			 	return test1.branchid;
			});
			_applyLimitToProductCatalog(doc,function(err,result){
				if(err){
				   	self.emit("failedLoadMoreProvider",{"error":{"message":"No more seller(s) found"}});
				}else{
					_applyDiscountCodesToProductCatalog(result,function(err,result1){
					    if(err){
					       	self.emit("failedLoadMoreProvider",{"error":{"message":+err.error.message}});
					    }else{
					        _successfulLoadMoreProvider(self,result,true);
					    }
					})					    
				}
			})			
	  	}
	});
}

var _successfulLoadMoreProvider = function(self,doc,boolean){
	logger.emit("log","_successfulLoadMoreProvider");
	self.emit("successfulLoadMoreProvider", {"success":{"message":"Getting Load More Provider Successfully","provider":doc,"loadmoreprovider":boolean}});
}

ProductSearch.prototype.loadmoreProduct = function(branchid,productid){
	var self=this;
	_fetchingResultToLoadMoreProduct(self,branchid,productid);
}

var _fetchingResultToLoadMoreProduct = function(self,branchid,productid){
	if(productid==undefined){
		var query_match={status:"publish","branch.branchid":branchid};
		_queryExecution(self,query_match);
	}else{
		ProductCatalogModel.findOne({productid:productid},{_id:1,createdate:1}).exec(function(err,doc){
			if(err){
				self.emit("failedLoadMoreProduct",{"error":{"code":"ED001","message":"Error in db to loadmore product "+err}});
			}else if(doc){
				console.log("Date "+doc.createdate);
				console.log("New "+new Date(doc.createdate));
				var query_match1={status:"publish","branch.branchid":branchid,productid:{$ne:productid},createdate:{$lte:doc.createdate}};
				_queryExecution(self,query_match1);
			}else{
				self.emit("failedLoadMoreProduct",{"error":{"message":"Incorrect productid"}});
			}
		});		
	}
}

var _queryExecution = function(self,query_match){
	ProductCatalogModel.find(query_match,{_id:0,productid:1,productname:1,productdescription:1,category:1,price:1,productlogo:1,foodtype:1,max_weight:1,min_weight:1,productnotavailable:1,specialinstruction:1,productconfiguration:1}).sort({createdate:-1}).limit(15).exec(function(err,productcatalog){
		if(err){
			self.emit("failedLoadMoreProduct",{"error":{"code":"ED001","message":"Error in db to loadmore product "+err}});
		}else if(productcatalog.length == 0){
			self.emit("failedLoadMoreProduct",{"error":{"message":"No more product(s) found"}});
		}else{
			// _successfulLoadMoreProduct(self,productcatalog);
			_loadMoreProductCatalog(self,productcatalog);
	  	}
	});
}

var _loadMoreProductCatalog=function(self,productcatalog){
	var doc = [];
	if(productcatalog.length>12){
		console.log("productcatalog.length @@ : "+productcatalog.length);
		var products = productcatalog.splice(0,12);
		doc.push({productcatalog:products,loadmoreproduct:true});
	}else{
		doc.push({productcatalog:productcatalog,loadmoreproduct:false});
	}
	_applyDiscountCodesToProductCatalog(doc,function(err,result1){
		if(err){
		   	self.emit("failedLoadMoreProduct",{"error":{"message":err.error.message}});
		}else{
		   	_successfulLoadMoreProduct(self,result1);
		}
	})
}

var _successfulLoadMoreProduct = function(self,productcatalog){
	logger.emit("log","_successfulLoadMoreProduct");
	self.emit("successfulLoadMoreProduct", {"success":{"message":"Loading More Product(s) Successfully","provider":productcatalog}});
}

ProductSearch.prototype.searchProvider = function(){
	var self=this;
	var providername = this.product;
	_validateSearchProviderData(self,providername);
}

var _validateSearchProviderData = function(self,providername){
	var letters = /^[A-Za-z ]+$/;
	console.log("######## providername " + JSON.stringify(providername));
	var provider_name_arr=[];
	var query={status:"accept"};
	
	if(providername==undefined || providername==""){
		self.emit("failedTosearchProvider",{"error":{"message":"Please enter seller name"}});
	}else if(!providername.match(letters)){
		self.emit("failedTosearchProvider",{"error":{"message":"Please enter providername  in alphabets only"}});
	}else{
		// var name_arr = [];
		// if(S(providername).contains(",")){
		// 	name_arr=providername.split(",");
		// }else if(S(providername).contains(" ")){
		// 	name_arr=providername.split(" ");
		// }else{
		// 	name_arr.push(providername);
		// }
		
		// for(var i=0;i<name_arr.length;i++){
		// 	provider_name_arr.push(new RegExp('^'+providername[i], "i"));
		// 	provider_name_arr.push(new RegExp(providername[i].substr(0,providername[i].length), "i"));
		// }

		provider_name_arr.push(new RegExp('^'+providername.substr(0,providername.length), "i"));
		query.providername = {$in:provider_name_arr};
		console.log("provider_name_arr "+ provider_name_arr);
		console.log("query "+ JSON.stringify(query));
		ProductProviderModel.find(query,{providerid:1,providername:1,providerlogo:1,user:1,branch:1},function(err,providers){
			if(err){
				self.emit("failedTosearchProvider",{"error":{"code":"ED001","message":"Error in db to search provider "+err}});
			}else if(providers.length==0){
				self.emit("failedTosearchProvider",{"error":{"message":"Seller not found"}});
			}else{
					var resultarray=[];
					var useridsarray=[];
					for(var i=0;i<providers.length;i++){
						useridsarray.push(providers[i].user.userid)
						var result={providerid:providers[i].providerid,providername:providers[i].providername,providerlogo:providers[i].providerlogo,userid:providers[i].user.userid};
						var branches=[];
						for(var j=0;j<providers[i].branch.length;j++){
							branches.push({branchid:providers[i].branch[j].branchid,branchname:providers[i].branch[j].branchname})
						}
						result.branches=branches
						resultarray.push(result)
					};
					UserModel.find({userid:{$in:useridsarray}},{userid:1,firstname:1,mobileno:1},function(err,users){
						if(err){
							self.emit("failedTosearchProvider",{"error":{"code":"ED001","message":"Error in db to search provider "+err}});
						}else if(users.length==0){
							self.emit("failedTosearchProvider",{"error":{"message":"Seller user details not exist"}});
						}else{
							users=JSON.stringify(users);
							users=JSON.parse(users);
							
							for(var i=0;i<resultarray.length;i++){
								var user= __.findWhere(users, {userid:resultarray[i].userid}); 
								resultarray[i].user=user;
								
							};
							//////////////////////////////////
							successfulsearchProvider(self,resultarray);
							//////////////////////////////////
						}
					})
				}
			})
		/***********SEARCH FROM PRODUCTS PROVIDER MODEL**********/
		// ProductProviderModel.aggregate([{$unwind:"$branch"},{$match:query},{$group:{_id:{providerid:"$providerid",providername:"$providername",providerlogo:"$providerlogo"},branch:{$addToSet:{branchid:"$branch.branchid",branchname:"$branch.branchname"}}}},{$project:{providerid:"$_id.providerid",providername:"$_id.providername",providerlogo:"$_id.providerlogo",branches:"$branch",_id:0}}]).exec(function(err,doc){
		// 	if(err){
		// 		self.emit("failedTosearchProvider",{"error":{"code":"ED001","message":"Error in db to search provider "+err}});
		// 	}else if(doc.length==0){
		// 		self.emit("failedTosearchProvider",{"error":{"message":"Seller not found"}});
		// 	}else{
		// 		//////////////////////////////////
		// 		successfulsearchProvider(self,doc);
		// 		//////////////////////////////////
		// 	}
		// });
	}
}

var successfulsearchProvider = function(self,doc){
	logger.emit("log","successfulsearchProvider");
	self.emit("successfulsearchProvider",{"success":{"message":"Getting Seller Details Successfully","provider":doc}});
}