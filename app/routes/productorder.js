var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// app.post('/api/message',auth,api.messageapi.messageTheDevice);//Message To the Device
	////////////////////consumer///////////////////////////////////////
	app.post("/api/createorder",auth,api.orderapi.createOrder);//Create New Service Order Request
	app.get('/api/myorder',auth,api.orderapi.getAllMyOrder);
    app.post('/api/deliverycharge',api.orderapi.getDeliveryCharges);
    app.post('/api/latestproductprice',api.orderapi.getLatestProductPrices);
    app.post('/api/deliverytimeslots',api.orderapi.getDeliveryTimeSlots);
	/////////////////provider////////////////////
	app.get('/api/suborder/:providerid/:branchid',auth,api.orderapi.getMySubOrders);
	app.get("/api/oz",api.commonapi.LongCodeResponse);
	app.get('/api/manageorder/:suborderid',auth,api.orderapi.manageOrder);
	app.get('/api/providerpayment/suborder/:suborderid',auth,api.orderapi.suborderpaymentdone);
	
	// Api's for Admin Screen
	app.get("/api/allorders/:branchid",auth,api.orderapi.getAllOrderDetailsForBranch);//get all order details
	app.get("/api/nextorders/:orderid",auth,api.orderapi.loadMoreOrders);//get all order details
	app.get("/api/searchsuborder/:suborderid",auth,api.orderapi.searchSuborder);//get all order details
	app.post('/api/paytm/generatechecksum',api.orderapi.generatePayTmCheckSum)

	app.post('/api/orderzapp/payment',api.orderapi.paytmCallbackUrl)
	app.get('/api/suborderstatuscount/:providerid/:branchid',auth,api.orderapi.getBranchSubOrderStatusWiseCount)
	app.get('/api/suborderstatuscount/:providerid',auth,api.orderapi.getProviderSubOrderStatusWiseCount)
	
	app.get('/api/invoice/:branchid/:suborderid',auth,api.invoiceapi.createInvoice)
	app.post('/api/confirmorder',auth,api.orderapi.confirmOrderByWeb)
	app.get('/api/paytmconfiguration',auth,api.commonapi.getPayTMConfiguration)
	app.post('/api/cancelorder/:orderid',auth,api.orderapi.cancelOrderByConsumer);
	app.post('/api/orderprint',api.orderapi.OrderPrintToPdf)

	


	// app.get("/api/getallsp",api.orderapi.getAllServiceProviders);//get all service providers
	// app.get("/api/getserviceorder",api.orderapi.getServiceOrder);//get service order

	
	// app.put("/api/serviceorder/:requestid",auth,api.orderapi.updateServiceOrder);//update service order request
	// app.put("/api/appointment/:requestid",auth,api.orderrequestapi.changeAppointmentOfServiceOrder);//change appointment order request
	// app.get("/api/serviceorder/:requestid",auth,api.orderapi.getServiceOrderRequest);//get service order request
	// app.get("/api/allserviceorders",api.orderapi.getAllServiceOrderRequests);//get all service order requests
	// app.delete("/api/serviceorder/:requestid",auth,api.orderrequestapi.deleteServiceOrder);//delete service order
}
