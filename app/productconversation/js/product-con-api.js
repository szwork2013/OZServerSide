var ProductConversation = require("./product-con");
var events = require("events");
var logger = require("../../common/js/logger");

exports.addConversation = function(req, res){
  var session_userid = req.user.userid;
	var orderid = req.params.order_id;
	// console.log("orderid " + orderid);
	var massage_data = req.body.conversationdata;
	var service_con = new ServiceConversation(massage_data);
	logger.emit("log","req body addConversation"+JSON.stringify(massage_data));

	service_con.removeAllListeners("failedServiceConAddMsg");
  	service_con.on("failedServiceConAddMsg",function(err){
    
    	logger.emit("error", err.error.message);
    	//service_con.removeAllListeners();
    	res.send(err);
  	});
  	service_con.removeAllListeners("successfulServiceConAddMsg");
  	service_con.on("successfulServiceConAddMsg",function(result){
    	logger.emit("info", result.success.message);
    	//service_con.removeAllListeners();
    	res.send(result);
  	});
  	service_con.addConversation(orderid,session_userid);
}