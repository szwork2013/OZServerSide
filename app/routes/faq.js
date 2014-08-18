var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	app.post('/api/faq',auth,api.faqapi.addFAQ);
	app.get('/api/faq',api.faqapi.getAllFAQ);
	app.put('/api/faq/:faqid',auth,api.faqapi.updateFAQ);
	app.delete('/api/faq/:faqid',auth,api.faqapi.deleteFAQ);
	
	
 }