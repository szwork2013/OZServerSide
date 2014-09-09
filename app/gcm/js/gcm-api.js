/*
* Overview: The Message Mondel.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 24-02/2014 | xyx | Add a new property
* 
*/
var GCM = require('gcm').GCM;
var logger=require("../../common/js/logger");
//AIzaSyCAUpsawrb6abG0YAonb1r2HL9DKCZoVUY
var CONFIG = require('config').OrderZapp; 

var gcm = new GCM(CONFIG.gcmapikey);
// var gcm = require('node-gcm');
//Message To Device from server
exports.messageTheDevice = function(req,res){

	console.log("calling to messageTheDevice ");
	console.log(JSON.stringify(req.body));
    // console.log("Request body"+req.body);
    var msgdata=req.body;

    if(msgdata.registration_id==undefined){
      res.send({"error":{"message":"please pass registration_id"}});
    }else if( msgdata.message==undefined){
      res.send({"error":{"message":"please pass message"}});
    }else{
	    console.log("RegiID " + msgdata.registration_id);
	    var message = {
		    registration_id: msgdata.registration_id, // required Device registration id
		    collapse_key: 'do_not_collapse', //demo,Collapse key
		    'data.key1': 'value1',
		    'data.key2': 'value2'
		};
		console.log("GCM " + JSON.stringify(gcm));
	    gcm.send(message, function(err, messageId){
			console.log("Call GCM");
		    if (err) {
		    	// res.send({"error":{"message":"Something has gone wrong! " + err}});
		        console.log("Something has gone wrong!");		        
		    } else {
		        console.log("Sent with message ID: ", messageId);
		        res.send({"success":{"message":"Sent with message ID: " + messageId}});
		    }
		});
		// var message = new gcm.Message();

		// // or with object values
		// // var message = new gcm.Message({
		// //     collapseKey: 'demo',
		// //     delayWhileIdle: true,
		// //     timeToLive: 3,
		// //     data: {
		// //         key1: 'message1',
		// //         key2: 'message2'
		// //     }
		// // });
		// var sender = new gcm.Sender(apiKey);
		// console.log("Sender : "+ JSON.stringify(sender));
		// var registrationIds = [];

		// // OPTIONAL
		// // add new key-value in data object
		// // message.addDataWithKeyValue('key1','message1');
		// // message.addDataWithKeyValue('key2','message2');

		// // or add a data object
		// // message.addDataWithObject({
		// //     key1: 'message1',
		// //     key2: 'message2'
		// // });
		// // // or with backwards compability of previous versions
		// // 	// or with backwards compability of previous versions
		// // message.addData('key1','message1');
		// // message.addData('key2','message2');


		// message.collapseKey = 'demo';
		// message.delayWhileIdle = true;
		// message.timeToLive = 3;
		// // END OPTIONAL

		// // At least one required
		// registrationIds.push(msgdata.registration_id);
		// // registrationIds.push('regId2'); 

		// /**
		//  * Params: message-literal, registrationIds-array, No. of retries, callback-function
		//  **/
		// sender.send(message, registrationIds, 4, function (err, result) {
		// 	if(err){
		// 		console.log("Error " +err);	
		// 	}else{
		// 		console.log("Result : " +result);	
		// 	}
		    
		// });

    }
	
}
exports.sendGCMNotification=function(data,gcmregistrationid,callback){
	var message = {
    registration_id: gcmregistrationid, // required Device registration id
    collapse_key: 'do_not_collapse', //demo,Collapse key
  	data:data
  };

  console.log("____-GCM_______"+JSON.stringify(gcm));
  console.log("____-GCMapikey_______"+CONFIG.gcmapikey)
	gcm.send(message, function(err, messageId){
	  if (err) {
	  	console.log("gcm err"+err)
	  	logger.emit("error","sendGCMNotification:"+err)
    	callback({error:{message:"Error In sending GCM notification"}})
    }else{
    	console.log("messageId"+messageId)
      callback(null,{success:{message:"Successfully send gcm notification to "+gcmregistrationid}})  
    }
    	console.log("messageId"+messageId)
	});
}




