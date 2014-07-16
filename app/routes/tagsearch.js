var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	app.post('/api/searchtag',auth,api.tagsearchapi.addTags);
	app.get('/api/searchtag',auth,api.tagsearchapi.getTags);
	app.delete('/api/searchtag',auth,api.tagsearchapi.deleteTags);
}