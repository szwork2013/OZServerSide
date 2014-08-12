var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	// app.post('/api/message',auth,api.messageapi.messageTheDevice);//Message To the Device
	app.post('/api/user/signup',api.userapi.addUser);
	app.post('/api/user/verify',api.userapi.verifyUser);
	app.post('/api/user/signin',api.userapi.signin);
	app.get('/api/loadcountrycode',api.commonapi.loaddefaultcounrycode);
	app.get('/api/user/:userid',auth,api.userapi.getUser);
	app.put('/api/user/:userid',auth,api.userapi.updateUser);
	app.get('/api/isloggedin',api.userapi.isLoggedIn);
	app.post('/api/forgotpassword',api.userapi.forgotPassword);
	app.post('/api/resetpassword',api.userapi.resetPasswordRequest);
	app.post('/api/regenerateverificationtoken',api.userapi.regenerateotp);
	app.get('/api/countrycode',api.userapi.getCountryCodes);
    app.post('/api/verifyproviderrequest',api.userapi.confirmjoinproviderrequest);
    app.get('/api/logout',auth,api.userapi.signOutSessions);
    app.get('/api/productrecommend/:productid',auth,api.userapi.productRecommend);

    //Api's for Admin Screen
    app.get('/api/usersorders/count',auth,api.userapi.userordersCount);
    app.post('/api/statictemplates',auth,api.commonapi.addOZPolicies);
    app.get('/api/statictemplates',api.commonapi.getOZPolicies);
    app.put('/api/statictemplates',auth,api.commonapi.updateOZPolicies);    
    app.get('/api/loadsmstemplates',auth,api.commonapi.loadSMSTemplates)
    app.get('/api/mydeliveryaddresses/:userid',auth,api.userapi.getMyDeliveryAddressHistory);


    app.post("/api/feedback",auth,api.commonapi.giveFeedback)
}