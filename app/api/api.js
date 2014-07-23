/*
* Overview: Api for all required api
* Dated:
* Author: Sunil More
* Copyright: GiantLeap Systems private limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/


var orderapi = require("../productorder/js/productorder-api");

var userapi=require("../user/js/user-api");
var productcategoryapi=require("../productcategory/js/product-category-api");
var productsearchapi = require("../productsearch/js/product-search-api");
var commonapi=require('../common/js/common-api');
// var smsserverapi=require("../common/js/sms-server-api");
var tagsearchapi=require("../tagsearch/js/tag-search-api");
var messageapi=require("../message/js/message-api");
// var serviceconapi=require("../serviceconversation/js/service-con-api");
var productproviderapi=require("../productprovider/js/product-provider-api");
// var branchapi=require("../branch/js/branch-api");
var hhiconapi=require("../hhicons/js/hhicon-api");
var productcatalogapi = require("../productcatalog/js/product-catalog-api");
var discountapi=require("../discount/js/discount-api");
var providergroupapi=require("../providergroup/js/provider-group-api");
var invoiceapi=require("../invoice/js/invoice-api");
var productconfigapi = require("../productcatalog/js/product-config-api");
var locationapi = require("../location/js/location-api");
var orderprocessconfig = require("../productprovider/js/order-process-config-api");

//exporting all api to main hhapp
// exports.smsproviderapi = smsproviderapi;
exports.orderapi = orderapi;
exports.userapi=userapi;
exports.productcategoryapi=productcategoryapi;
exports.productsearchapi = productsearchapi;
exports.commonapi=commonapi;
// exports.smsserverapi=smsserverapi;
exports.tagsearchapi=tagsearchapi;
exports.messageapi=messageapi;
// exports.serviceconapi=serviceconapi;
exports.productproviderapi=productproviderapi;
// exports.branchapi=branchapi;

exports.hhiconapi=hhiconapi;
exports.productcatalogapi = productcatalogapi;
exports.discountapi=discountapi;
exports.providergroupapi=providergroupapi;
exports.invoiceapi=invoiceapi;
exports.productconfigapi=productconfigapi;
exports.locationapi = locationapi;
exports.orderprocessconfig = orderprocessconfig;