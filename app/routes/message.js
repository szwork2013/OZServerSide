var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	app.post('/api/message',auth,api.gcmapi.messageTheDevice);//Message To the Device
 
}