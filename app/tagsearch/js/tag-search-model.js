/*
* Overview: The schema model for Tag Search
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

var searchTagSchema = mongoose.Schema({
	tagnames: [{type:String,unique:true}],
});

// searchTagSchema.pre('save', function(next) {
// 	var searchtag = this;
//   	searchtag.tagid=generateId();
//   	next();
// });

var SearchTagModel = mongoose.model('searchtags', searchTagSchema);
module.exports = SearchTagModel;
