/*
* Overview: Database Connection 
* Dated:
* Author: Sunil More
* Copyright: Prodonus Software Private Limited and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* export mongoose
* CONFIG moudle it will automically select environment.
 you have to type export NODE_ENV=<enironment name> i.e. file name in config folder
 ex.for Development
 >export NODE_ENV=development
 >node hhapp
 then it select development environment 
*/
 
 var mongoose = require("mongoose");
 var CONFIG = require('config').OrderZapp;
// console.log("dbname:"+CONFIG.dbName+" dbhost"+CONFIG.dbHost);
 mongoose.connect(CONFIG.dbHost, CONFIG.dbName);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo DB Connection error:'));
db.once('open', function callback() {
  console.log('Connected to Mongo Database '+CONFIG.dbName);
});
//export mongoose object
module.exports=mongoose;
