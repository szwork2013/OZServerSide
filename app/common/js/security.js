/*
* Overview: OrderZapp App
* Dated:
* Author: Sunil More
* Copyright: Prodonus Software Private Limited and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/
var app=require("../../../ozapp");
var CONFIG = require("config").OrderZapp;
var MobileDetect = require('mobile-detect');
var __=require("underscore");
auth = function (req, res, next) {
	if (req.isAuthenticated()) {
	  	// console.log("test"+req.user);
	  	return next();
	}
	
	//app.set("userid","");
	// req.session.destroy();
	res.send({"error":{"code":"AL001","message":"Please login to continue this operation"}});
}
module.exports= auth;