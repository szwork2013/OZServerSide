/*
* Overview:Common api
* Dated:
* Author: Sunil More
* Copyright: Prodonus Software Private Limited and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3-2013 | sunil | sendMessage
*           |sunil  | getNextsequence 
* 18-
*/
var S=require('string');
var request = require("request");
// var SequenceModel=require('./sequence-model');
var SMSProviderModel=require('./sms-provider-model');
var SMSTemplateModel=require('./sms-template-model');
// // var WorkCategoryModel=require('../../workorder/js/work-category-model');
// var UserModel=require('../../user/registration/js/user-model');
// var userapi=require("../../user/registration/js/user-api");
// var workorderapi=require("../../workorder/js/workorder-api");
var lngDetector = new (require('languagedetect'));
var CountryCodeModel=require("./country-code-model");
var StaticTemplateModel = require("./static-template-model");
 var nodemailer = require("nodemailer");
 var logger=require("./logger");
 var orderapi=require("../../productorder/js/productorder-api");
// var SmsLimitModel=require("./sms-limit-model");
// var CareModel=require("./care-model");
// var OtpModel=require("./otp-model");
// var bcrypt = require('bcrypt');
// var SALT_WORK_FACTOR = 10;
// var CONFIG = require('config').OrderZapp;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var punycode=require("punycode");
// var LocationModel=require("./location-model");
 var SMSHistoryModel=require("./sms-history-model");
//   var StateLangModel=require("./state-lang-model"); 
function trim(stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g,"");
}
function ltrim(stringToTrim) {
	return stringToTrim.replace(/^\s+/,"");
}
function rtrim(stringToTrim) {
	return stringToTrim.replace(/\s+$/,"");
}
// var utf8=require("utf8");
//global method for send Message
exports.getBcryptString=function(password,callback){
	 bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if(err) {
      callback(err);
    }else{
      bcrypt.hash(password+"", salt, function(err, hash) {
        console.log(err);
        if(err) {
          callback(err);
        }else{
          callback(null,hash)  
        }
      });
    }
  });
}
exports.sendMessage=function(message,mnumber,callback){
	SendMessage(message,mnumber,function(result){

		callback(result);
	})
};
exports.loadSMSTemplates=function (req,res) {
	var smstemplates=[{
	
	"lang" : "EN",
	"name" : "otp",
	"template" : "Please enter your One Time Password <otp> to verify your registration with OrderZapp"
},
{
	
	"lang" : "EN",
	"name" : "workorderassign",
	"template" : "Welcome <name>. \nyou are assigned a work,OrderId-:<workorderid>\ncustomer name: <consumername>\nmobile:<mobileno>\ndescription: <description>\naddress:<address>"
},
{
	
	"lang" : "EN",
	"name" : "workordercancel",
	"template" : "Dear subscriber,\nwork is cancelled.Sorry for inconvenience.\nOrderId:<workorderid>\n\nwork description:<description>"
},
{
	
	"lang" : "EN",
	"name" : "workorder",
	"template" : "OrderID-<workorderid>\n Work description:<description> Start Date:<startdate>,Address:<address>,Price:<price>,Completion Time:<completiontime> \n To accept this order\n please type:<workorderformat> \nand send it on 9243007462"
},
{
	
	"lang" : "EN",
	"name" : "register",
	"template" : "To register to OrderZapp ,\nplease type : <registerformat> .\nsend on 9243007462"
},
{
	
	"lang" : "EN",
	"name" : "welcomecm",
	"template" : "Welcome <name> to OrderZapp"
},
{
	
	"lang" : "EN",
	"name" : "zipcode",
	"template" : "You have sent an invalid zipcode. So to re-register with a valid zipcode. \n please type: <registerformat>.\n and send it on 9243007462"
},
{
	
	"lang" : "EN",
	"name" : "care",
	"template" : "For more information or any queries \nplease type: <careformat> and send it on 9243007462 and we'll try to callback as soon as possible."
},
{
	
	"lang" : "EN",
	"name" : "pay",
	"template" : "Please type PAY <scratchcode> and send to 9243007462 to subscribe to OrderZapp"
},
{
	
	"lang" : "EN",
	"name" : "newpassword",
	"template" : "Dear Subscriber, \nYour new password is: <password>. \nPlease login to OrderZapp with given password"
},
{
	
	"name" : "pay",
	"lang" : "HI",
	"template" : "OrderZapp की सदस्यता लेने के लिए \nटाइप करें: <payformat> \nऔर 9243007462 पर भेजें"
},
{
	
	"lang" : "HI",
	"name" : "register",
	"template" : " OrderZapp रजिस्टर करने के लिए,\nटाइप करें: <registerformat>.\nऔर 9243007462 पर भेजें."
},
{
	
	"lang" : "HI",
	"name" : "workorder",
	"template" : "रिय ग्राहक,\nOrderID: <workorderid> \nकार्य विवरण: <description> \nपत्ता:<address>\nPrice:<price>\nकाम करने कि तारिख:<startdate>,completion time:<completiontime> \nइस काम को स्वीकार करने के लिए, \nटाइप करें: <workorderformat> \nऔर 9243007462 पर भेजें."
},
{
	
	"name" : "workorderassign",
	"lang" : "HI",
	"template" : "<name> आपका स्वागत है. आपको एक काम सौंपा जाता है,\nOrderID-: <workorderid> \nग्राहक का नाम: <consumername> \nमोबाइल: <mobileno> \nविवरण:<description>\nपता: <address>"
},
{
	
	"lang" : "HI",
	"name" : "workordercancel",
	"template" : "प्रिय ग्राहक,\nकाम रद्द कर दिया है. असुविधा के लिए खेद है.\n OrderID: <workorderid>\n.\nकार्य विवरण: <description>"
},
{
	
	"name" : "newpassword",
	"lang" : "HI",
	"template" : "प्रिय सब्सक्राइबर,\nआपका नया पासवर्ड है: <password>\nदिए गए पासवर्ड के साथ OrderZapp में लॉग इन करें"
},
{
	
	"lang" : "HI",
	"name" : "zipcode",
	"template" : "आपने एक अवैध zipcode भेज दिया है. इसलिए वैध ज़िपकोड साथ फिर से रजिस्टर करें.\nOrderZapp रजिस्टर करने के लिए,\nटाइप करें: <registerformat>.\nऔर 9243007462 पर भेजें"
},
{
	
	"name" : "newpassword",
	"lang" : "GU",
	"template" : "પ્રિય ઉપભોક્તા,\nતમારો નવો પાસવર્ડ છે: <password>.\nઆપવામાં પાસવર્ડ OrderZapp પ્રવેશ કરો"
},
{
	
	"name" : "zipcode",
	"lang" : "GU",
	"template" : "તમે અમાન્ય zipcode મોકલી છે. તેથી માન્ય zipcode સાથે ફરી રજીસ્ટર કરવાની.OrderZapp રજીસ્ટર કરવા માટે,\nલખો: <registerformat>.\n અને 9243007462 પર મોકલો."
},
{
	
	"lang" : "MR",
	"name" : "workorderassign",
	"template" : "<name> आपले स्वागत आहे.\n आपल्याला एक काम नियुक्त केले जात आहे, OrderId-: <workorderid> \n ग्राहक नाव: <consumername> \n मोबाइल: <mobileno> \nकार्याचे वर्णन: <description> \nपत्ता: <address>"
},
{
	
	"name" : "newpassword",
	"lang" : "MR",
	"template" : "प्रिय ग्राहक,\nआपला नवीन पासवर्ड आहे: <password>.\nदिलेल्या पासवर्डसह OrderZapp लॉगिन करा"
},
{
	
	"name" : "workordercancel",
	"lang" : "MR",
	"template" : "प्रिय ग्राहक\n काम रद्द करण्यात आले आहे ,गैरसोयीबद्दल क्षमस्व.\nOrderid:<workorderid>\nकार्याचे वर्णन:<description>"
},
{
	
	"lang" : "EN",
	"name" : "welcomesp",
	"template" : "Welcome to OrderZapp! You have been registered  with us as <professioncategory>  to receive regular work requests related to your area of expertise. \nLook out for SMS messages regarding work requests. Reply to the SMS if you are available. If customer accepts your availability, you will receive another SMS to start the work. We are committed to give you maximum work through our system.\n For more information contact: \nGiant Leap Systems, \nPh:020-67211800"
},
{
	
	"lang" : "MR",
	"name" : "welcomesp",
	"template" : "OrderZapp मध्ये आपले स्वगत आहे.आपण <professioncategory> म्हणुन आमच्यसोबत रेजिस्टर केलेले आहे,त्यामुळे आपणास काम संबंधित एसएमएस मिळतील.जर तुम्ही उपलब्ध असचाल तर एसएमएस ला रीप्लय द्या.\nकस्टमरने तुमची रिक्वेस्ट स्विकारली तर तुम्हाला काम सुरु करण्यासाठी एसएमएस मिळुन जाईल.OrderZapp च्या माध्यमातुन आम्ही तुम्हाला जास्तीत जास्त काम मिळवुन देण्यासठी प्रयत्नशील असू.अधिक माहितीसाठी संपर्क साधा.\nजाइंट लीप सिस्टम्स,\nफ़ोन:020-67211800"
},
{
	
	"lang" : "HI",
	"name" : "welcomesp",
	"template" : "OrderZapp में आपका स्वागत है. आपने <professioncategory> काम के लिये रेजिस्टर किया है,अब आपको काम संबंधित एसएमएस मिलने लगेगे.आप उपलब्ध है तो एसएमएस को रिप्लाय दिजिये.\nअगर कस्टमर ने आपकि  एसएमएस को स्वीकार किया ,तो आपको काम चालु करने के लिये एसएमएस मिलेगा.OrderZapp के माध्यम से हम आपको अधिकतम काम देने के लिए कोशिश करेगे.\nअधिक जानकारी के लिए संपर्क करें:\n जाइंट लीप सिस्टम्स \nफ़ोन:020-67211800"
},
{
	
	"lang" : "MR",
	"name" : "workorder",
	"template" : "प्रिय ग्राहक \n OrderID:<workorderid> \nकार्याचे वर्णन:<description>\nपत्ता:<address>,\nPrice:<price>,\nकाम करण्याची तारीख:<startdate>,Completion Time:<completiontime> हि और्डर स्विकरण्यासाथी \n टाइप करा:<workorderformat> \n आणि 9243007462 वर पाठवा"
},
{
	
	"name" : "zipcode",
	"lang" : "MR",
	"template" : "आपण अवैध पिनकोड पाठविली आहे. एक वैध पिनकोड सह पुन्हा रेजिस्ट्र करण्यासाठी.\nटाइप करा: <registerformat>.\nआणि 9243007462 वर पाठवा."
},
{
	
	"lang" : "HI",
	"name" : "care",
	"template" : "अधिक जानकारी या किसी भी समस्या के लिए \nटाइप करें: <careformat> और 9243007462 पर भेजें और हम जल्दि हि आपसे संपर्क करने की कोशीश करेगे"
},
{
	
	"lang" : "MR",
	"name" : "care",
	"template" : " अधिक माहिती किंवा कोणत्याही समस्या साठी \nटाइप करा: <careformat> आणि 9243007462 वर पाठवा आणि आम्ही शक्य तितक्या लवकर आपणास कॉल करण्याचा प्रयत्न करु."
},
{
	
	"name" : "productprovidermemberinvite",
	"lang" : "EN",
	"template" : "Welcome to OrderZapp-Sellers. You have been added to the group <groupname> by <providername> of <branchname>.\n Your new password is: <password>.\nPlease reply OTP <otp> to 9243007462 to verify your account."
},
{
	
	"name" : "productprovidermemberremove",
	"lang" : "EN",
	"template" : "You have been removed from the group <groupname> by <providername> of <branchname>."
},
{
	
	"name" : "productprovidermemberremove",
	"lang" : "MR",
	"template" : "You have been removed from the group <groupname> by <providername> of <branchname>."
},
{
	
	"name" : "productprovidermemberremove",
	"lang" : "HI",
	"template" : "You have been removed from the group <groupname> by <providername> of <branchname>."
},
{
	
	"name" : "productprovidermemberonlyinvite",
	"lang" : "EN",
	"template" : "Welcome to OrderZapp-Sellers. You have been added to the group <groupname> by <providername> of <branchname>."
},
{
	
	"name" : "password",
	"template" : "Please enter your verification token <otp> to reset your password.",
	"lang" : "EN"
},
{
	
	"name" : "password",
	"template" : "आपला पासवर्ड रीसेट करण्यासाठी आपला टोकन <otp> टायीप करा.",
	"lang" : "MR"
},
{
	
	"lang" : "EN",
	"name" : "joinproviderrequest",
	"template" : "Your verification token for join as a provider is <otp>"
},
{
	
	"lang" : "EN",
	"name" : "confirmorder",
	"template" : "To Confirm your order \n Order No:<orderno> \n please type:\n Y <otp> and send it on <longcode>"
},
{
	
	"lang" : "GU",
	"name" : "joinproviderrequest",
	"template" : "Your verification token for join as a provider is <otp>"
},
{
	
	"lang" : "MR",
	"name" : "joinproviderrequest",
	"template" : "Your verification token for join as a provider is <otp>"
},
{
	
	"lang" : "HI",
	"name" : "joinproviderrequest",
	"template" : "Your verification token for join as a provider is <otp>"
},
{	
	"lang" : "HI",
	"name" : "confirmorder",
	"template" : "To Confirm your order \n Order No:<orderno> \n please type:\n Y <otp> and send it on <longcode>"
},
{	
	"lang" : "MR",
	"name" : "confirmorder",
	"template" : "To Confirm your order \n Order No:<orderno> \n please type:\n Y <otp> and send it on <longcode>"
},
{	
	"lang" : "GU",
	"name" : "confirmorder",
	"template" : "To Confirm your order \n Order No:<orderno> \n please type:\n Y <otp> and send it on <longcode>"
},
{	
	"lang" : "EN",
	"name" : "ordercancelled",
	"template" : "Unfortunately your sub order has been canceled due to <reason> and hence cannot be shipped.\n Sub Order id : <suborderid> \n Sub Order amt: Rs. <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "HI",
	"name" : "ordercancelled",
	"template" : "Unfortunately your sub order has been canceled due to <reason> and hence cannot be shipped.\n Sub Order id : <suborderid> \n Sub Order amt: Rs. <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "MR",
	"name" : "ordercancelled",
	"template" : "Unfortunately your sub order has been canceled due to <reason> and hence cannot be shipped.\n Sub Order id : <suborderid> \n Sub Order amt: Rs. <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "GU",
	"name" : "ordercancelled",
	"template" : "Unfortunately your sub order has been canceled  due to <reason> and hence cannot be shipped.\n Sub Order id : <suborderid> \n Sub Order amt: Rs. <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "EN",
	"name" : "orderrejected",
	"template" : "Unfortunately your sub order has been rejected due to <reason> and hence cannot be shipped. \n Sub Order id : <suborderid> \n Sub Order amt: <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "HI",
	"name" : "orderrejected",
	"template" : "Unfortunately your sub order has been rejected due to <reason> and hence cannot be shipped. \n Sub Order id : <suborderid> \n Sub Order amt: <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "MR",
	"name" : "orderrejected",
	"template" : "Unfortunately your sub order has been rejected due to <reason> and hence cannot be shipped. \n Sub Order id : <suborderid> \n Sub Order amt: <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "GU",
	"name" : "orderrejected",
	"template" : "Unfortunately your sub order has been rejected due to <reason> and hence cannot be shipped. \n Sub Order id : <suborderid> \n Sub Order amt: <suborder_price> \n Seller- <sellername>"
},
{	
	"lang" : "EN",
	"name" : "orderaccepted",
	"template" : "We have a new delivery date <deliverydate> for your suborder <suborderid>, \n if you DO NOT want to continue the order with new delivery date, \n please cancel the order"
},
{
	"lang" : "HI",
	"name" : "orderaccepted",
	"template" : "We have a new delivery date <deliverydate> for your suborder <suborderid>, \n if you DO NOT want to continue the order with new delivery date, \n please cancel the order"
},
{	
	"lang" : "MR",
	"name" : "orderaccepted",
	"template" : "We have a new delivery date <deliverydate> for your suborder <suborderid>, \n if you DO NOT want to continue the order with new delivery date, \n please cancel the order"
},
{	
	"lang" : "GU",
	"name" : "orderaccepted",
	"template" : "We have a new delivery date <deliverydate> for your suborder <suborderid>, \n if you DO NOT want to continue the order with new delivery date, \n please cancel the order"
}]
for(var i=0;i<smstemplates.length;i++){
		SMSTemplateModel.update({name:smstemplates[i].name,lang:smstemplates[i].lang},{$set:smstemplates[i]},{upsert:true},function(err,langcodeupdatestatus){
			if(err){
				//res.send("error in db ")
				// logger.error("error in db");
			}else if(langcodeupdatestatus==1){
				//res.send("Workcategory uploaed");
				// logger.log("log","subscriptionarray loaded loaded");
				console.log("smstemplates :"+i);
			}else{
				//res.send("");
				// logger.error("log","ssssssss");
			}
		})
	};
	res.send("smstemplates uploaded")
}
exports.LongCodeResponse=function(req,res){
	var mobileno=req.query.mobileno;
	var message=req.query.message;
	var responsetext;
	if(mobileno==undefined || message==undefined){
		responsetext="please pass mobileno and message";
		res.send("please pass mobileno and message")
	}else if(S(message.toLowerCase()).contains("y")){
		orderapi.confirmOrder(mobileno,message.toLowerCase(),function(err,result){
			if(err){
				res.send("You have send  wrong token or there is problem in server,so please resend sms with proper token or regnerate the token for order from application ")
				responsetext=err;
				logger.emit("error",err.error.message)
			}else{
				res.send("Thank you we have started processing your order,Use Order tracking for detailed information")
				responsetext=result;
				logger.emit("log",result.success.message);
			}
		});
	}else{
		res.send("You have send wrong keyword, so please send sms with proper keyword  ")
	}
	
}
//send message by sms server
SendMessage=function(message,mnumber,callback){
	SMSProviderModel.findOne({active:true},function(err,smsprovider){
		if(err){
			logger.error("error in finding smsprovider model");
		} else if(!smsprovider){
			logger.error("SMS Provider does't find");
			
		}else{
			
			var langdetectresult=lngDetector.detect(message,1);
			__addToSMSHistory(mnumber,message);
			var url=smsprovider.url;
			var parameter=smsprovider.parameter;
			var messagekey=smsprovider.message;
			var mnumberkey=smsprovider.mnumber;
			url=url+"?"+parameter+"&"+mnumberkey+"="+mnumber;
			if(langdetectresult[0][0]!="english"){
				url+="&msgType=UC";
			}	
			
			getUnicodeMessage(message,function(err,translatemessage){
				if(err){

				}else{

			if(langdetectresult[0][0]=="english"){
				url+="&"+messagekey+"="+message;
			}else{
				url+="&"+messagekey+"="+translatemessage;
			}
            console.log("url:"+url);
			// console.log("parameter:"+parameter+",messagekey"+messagekey);
			// console.log("url"+url);
			request({ uri:url }, function (error, response, body) {
		  		if(!response){
		  			logger.error("Please Check Your Internet Connection");
		  			callback("failure");
		  			//res.send({"technical":"pleas check Your Internet Connection"});
		  		}else{


			  		if (error && response.statusCode !== 200) {
			  			logger.error('Error sending SMS');
			  		}
		  			console.log(response.body);
		  			var resoponsetext = S(response.body);
		  			if(resoponsetext.contains("Accepted")) {
		  				// logger.log("SMS RESPONSE");
			  			callback("success");
			  		}else if(resoponsetext.contains("Status=0")){
			  			// logger.log("SMS RESPONSE");
			  			callback("success");
			  		} else {
			  			logger.error("SMS RESPONSE");
			  			callback("failure");
			 	 	}
		 	
		}
			})

			   }

		    })

		}
	})
}
var __addToSMSHistory=function(mnumber,message){
	var sms_history=new SMSHistoryModel({mobileno:mnumber,message:message});
	sms_history.save(function(err,smshistory){
		if(err){
			logger.error("Database Issue sms History"+err);
		}else{
			logger.info("recored added to sms History");
		}
	})
}
var getUnicodeMessage=function(message,callback){
	var unicodemessagedata=message;
        console.log("unicodemessage :"+unicodemessagedata);
		var unicodemessage=punycode.ucs2.decode(unicodemessagedata);
		//var unicodedata=utf8.encode(buf).toLowerCase();
        // var buffer=new Buffer(buf,"base64");
         var hexadecimaldeta="";
		 // console.log("unicodemessage"+unicodemessage);
		 for(var i=0;i<unicodemessage.length;i++){
            var decimaldata=unicodemessage[i].toString(16);
            if(decimaldata.length<4){
            	var data0="";
            	for(var j=0;j<(4-decimaldata.length);j++){
            		data0+="0";
            	}
            	decimaldata=data0+decimaldata;
            }
            hexadecimaldeta+=decimaldata;

            // console.log("\n"+unicodemessage[i]);
		 }
		 // console.log("decimaldata"+decimaldata);
		 // var hexadecimaldeta=decimaldata.toString(16);
		 // console.log("hexadecimaldeta"+hexadecimaldeta);
		callback(null,hexadecimaldeta);
}
exports.googleTranslate=function(message,lang,callback){
	var url="https://www.googleapis.com/language/translate/v2?";
	url+="ie=UTF-8&";
	lan=lang.toLowerCase();
	url+="target="+lang+"&"
	url+="q="+message+"&"
	url+="key="+CONFIG.gtranslatekey;

	
	request({ uri:url}, function (error, response, body) {
		if(error){
           callback(error);
		}else if(!response){
		  			logger.error("Please Check Your Internet Connection");
		}else{
			var translatesms=JSON.parse(body).data.translations[0].translatedText;
		    callback(null,translatesms);
		
	

		}
		   	  		// callback(null,"004f00540050002000360034003500350035003300320035002009140930002000390032003400330030003000370034003600320020092a09300020092d0947091c0020092609470902003a00200905092a092809470020092e094b092c093e09070932002009380924094d092f093e092a093f09240020091509300928094700200915094700200932093f090f0020091f093e0907092a00200915093009470902");
	});
		  	

}
//get nextsequence according to collection i.e.workorder,user etc
exports.getNextSequnce=function(name,callback)
{
	console.log("calling to getNextSequnce method");
	SequenceModel.findAndModify(
	            { name: name },
	            [],
	            {$inc: { nextsequence: 1 } },{new:true},function(err,sequencedata){
		            if(err){
		                logger.error(err +" Error: Sequence collection");
		                callback(err);
		            }
		            console.log("sequencedata"+sequencedata)
		            callback(null,sequencedata.nextsequence)

	})
	 
}  // console.log("return sequence data"+ret);
//send smstemplate to user
exports.getAreaAccordingZipcode=function(req,res){
    
	logger.log("req body getAreaAccordingPincode"+JSON.stringify(req.body));
	if(req.body==undefined){
		res.send([]);
	}else if(req.body.zipcode==undefined){
		res.send([]);
	}else{
		LocationModel.findOne({pincode:req.body.zipcode},{subarea:1,area:1},function(err,locationdata){
			if(err){
				res.send({"error":{"message":"Error in db to find subarea according"+req.body.zipcode}})
			}else if(locationdata){
				res.send(locationdata.area)
			}else{
				checkAndSaveZipcodeDetails(req.body.zipcode,function(result){
					if(result.error){
                         res.send([]);
					}else{
						var locationarea=result.success.location.area;
						res.send(locationarea);
					}
				})
				//res.send({"success":{arealist:[]}});
			}
		})
	}	
	
}
exports.getAreaAccordingCity=function(req,res){
	var city=req.body.city.trim();
	console.log("city"+city);
	LocationModel.aggregate({$match:{$or:[{district:{$regex:city,$options:'i'}},{tehsil:{$regex:city,$options:'i'}}]}},{$unwind:"$area"},{$project:{area:1,pincode:1,_id:0}},function(err,locations){
		if(err){
			res.send({"error":{"message":"Error in db to find subarea according"+err}})
		}else if(locations.length==0){
			res.send({"error":{"message":"provided city doesnt exist in database"}})
		}else{
			res.send({"success":{"message":"","Area":locations}})
		}
	})
}
exports.loadlangcodedata=function(req,res){
	var statelangdata=[
	{state:"Maharashtra",lang:"MARATHI",lang_code:"MR"},
	{state:"Gujrat",lang:"GUJRATI",lang_code:"GU"},
	{state:"West Bengal",lang:"BENGALI",lang_code:"BN"},
	{state:"Andhra Pradesh",lang:"TELUGU",lang_code:"TE"},
	{state:"Tamil Nadu",lang:"Tamil",lang_code:"TA"},
	{state:"Karnataka",lang:"Kannada",lang_code:"KN"},
	{state:"Punjab",lang:"Punjabi",lang_code:"PA"}
]


	for(var i=0;i<statelangdata.length;i++){

		StateLangModel.update({lang_code:statelangdata[i].lang_code},{$set:statelangdata[i]},{upsert:true},function(err,langcodeupdatestatus){
			if(err){
				//res.send("error in db ")
				logger.error("error in db");
			}else if(langcodeupdatestatus==1){
				//res.send("Workcategory uploaed");
				logger.log("log","langcode loaded loaded");
			}else{
				//res.send("");
				logger.error("log","ssssssss");
			}
		})
	}
	// res.send("langauge code loaded");
					

}
exports.sendMail = function(message,smtpconfig,callback){
  var smtpTransport = nodemailer.createTransport("SMTP",smtpconfig);

  // message.html="<div width=500 height=100 style='background-color:black'><img src='http://prodonus.com/assets/images/prodonus.png'></img><h2><font color=white>Social Network And Warranty Platform for Products</font></h2></div><br>"+message.html;
  smtpTransport.sendMail(message, 
 	  function (error, success) {
      if(error){
        logger.error("Unable to send via Giantleapsystems: " + error.message);
        callback("failure");
      }else{
        logger.emit("log","email sent");
       callback("success"); 
      }
      //sending succussful then success
      
    });
};


exports.loaddefaultcounrycode=function(req,res){
	var countrycodes=[{test2:"22.27 Billion (114)",country:"Afghanistan",isocode1:"AF / AFG ",code:"93",test:"28,396,000 (43) ",test1:"652,230 (42) "},{test2:"21.81 Billion (116) ",country:"Albania",isocode1:"AL / ALB ",code:"355",test:"3,639,453 (129) ",test1:"28,748 (145) "},{test2:"232.9 Billion (48) ",country:"Algeria",isocode1:"DZ / DZA ",code:"213",test:"34,178,188 (36) ",test1:"2,381,741 (12) "},{test2:"575.3 Million (210) ",country:"American Samoa",isocode1:"AS / ASM ",code:"1 684 ",test:"65,628 (204) ",test1:"199 (215) "},{test2:"3.66 Billion (166) ",country:"Andorra",isocode1:"AD / AND ",code:"376",test:"83,888 (200) ",test1:"468 (197) "},{test2:"110.3 Billion (62) ",country:"Angola",isocode1:"AO / AGO ",code:"244",test:"12,799,293 (69) ",test1:"1,246,700 (24) "},{test2:"108.9 Million (218) ",country:"Anguilla",isocode1:"AI / AIA ",code:"1 264 ",test:"14,436 (219) ",test1:"91 (224) "},{test2:"0 (228) ",country:"Antarctica",isocode1:"AQ / ATA ",code:"672",test:"0 (236) ",test1:"14,000,000 (2) "},{test2:"1.657 Billion (188) ",country:"Antigua and Barbuda",isocode1:"AG / ATG ",code:"1 268 ",test:"85,632 (199) ",test1:"443 (201) "},{test2:"573.9 Billion (23) ",country:"Argentina",isocode1:"AR / ARG ",code:"54",test:"40,913,584 (31) ",test1:"2,780,400 (9) "},{test2:"18.77 Billion (125) ",country:"Armenia",isocode1:"AM / ARM ",code:"374",test:"2,967,004 (137) ",test1:"29,743 (143) "},{test2:"2.258 Billion (180) ",country:"Aruba",isocode1:"AW / ABW ",code:"297",test:"103,065 (194) ",test1:"180 (217) "},{test2:"800.2 Billion (18) ",country:"Australia",isocode1:"AU / AUS ",code:"61",test:"21,262,641 (54) ",test1:"7,741,220 (7) "},{test2:"329.5 Billion (36) ",country:"Austria",isocode1:"AT / AUT ",code:"43",test:"8,210,281 (92) ",test1:"83,871 (114) "},{test2:"77.61 Billion (76) ",country:"Azerbaijan",isocode1:"AZ / AZE ",code:"994",test:"8,238,672 (91) ",test1:"86,600 (113) "},{test2:"9.093 Billion (151) ",country:"Bahamas",isocode1:"BS / BHS ",code:"1 242 ",test:"309,156 (176) ",test1:"13,880 (161) "},{test2:"26.82 Billion (111) ",country:"Bahrain",isocode1:"BH / BHR ",code:"973",test:"727,785 (162) ",test1:"741 (191) "},{test2:"224 Billion (49) ",country:"Bangladesh",isocode1:"BD / BGD ",code:"880",test:"156,050,883 (7) ",test1:"143,998 (95) "},{test2:"5.425 Billion (156) ",country:"Barbados",isocode1:"BB / BRB ",code:"1 246 ",test:"284,589 (180) ",test1:"430 (202) "},{test2:"114.1 Billion (61) ",country:"Belarus",isocode1:"BY / BLR ",code:"375",test:"9,648,533 (86) ",test1:"207,600 (86) "},{test2:"389.3 Billion (29) ",country:"Belgium",isocode1:"BE / BEL ",code:"32",test:"10,414,336 (78) ",test1:"30,528 (141) "},{test2:"2.536 Billion (176) ",country:"Belize",isocode1:"BZ / BLZ ",code:"501",test:"307,899 (177) ",test1:"22,966 (152) "},{test2:"12.83 Billion (138) ",country:"Benin",isocode1:"BJ / BEN ",code:"229",test:"8,791,832 (90) ",test1:"112,622 (102) "},{test2:"4.5 Billion (161) ",country:"Bermuda",isocode1:"BM / BMU ",code:"1 441 ",test:"67,837 (203) ",test1:"54 (226) "},{test2:"3.524 Billion (168) ",country:"Bhutan",isocode1:"BT / BTN ",code:"975",test:"691,141 (163) ",test1:"38,394 (137) "},{test2:"43.27 Billion (91) ",country:"Bolivia",isocode1:"BO / BOL ",code:"591",test:"9,775,246 (84) ",test1:"1,098,581 (29) "},{test2:"29.7 Billion (105) ",country:"Bosnia and Herzegovina",isocode1:"BA / BIH ",code:"387",test:"4,613,414 (119) ",test1:"51,197 (129) "},{test2:"27.06 Billion (110) ",country:"Botswana",isocode1:"BW / BWA ",code:"267",test:"1,990,876 (146) ",test1:"581,730 (48) "},{test2:"1.993 Trillion (9) ",country:"Brazil",isocode1:"BR / BRA ",code:"55",test:"198,739,269 (5) ",test1:"8,514,877 (6) "},{test2:"0 (228) ",country:"British Indian Ocean Territory",isocode1:"IO / IOT ",code:" ",test:"0 (236) ",test1:"54,400 (128) "},{test2:"853.4 Million (205) ",country:"British Virgin Islands",isocode1:"VG / VGB ",code:"1 284 ",test:"24,491 (215) ",test1:"151 (219) "},{test2:"20.25 Billion (121) ",country:"Brunei",isocode1:"BN / BRN ",code:"673",test:"388,190 (175) ",test1:"5,765 (173) "},{test2:"93.75 Billion (67) ",country:"Bulgaria",isocode1:"BG / BGR ",code:"359",test:"7,204,687 (98) ",test1:"110,879 (105) "},{test2:"17.82 Billion (127) ",country:"Burkina Faso",isocode1:"BF / BFA ",code:"226",test:"15,746,232 (61) ",test1:"274,200 (75) "},{test2:"55.13 Billion (86) ",country:"Burma (Myanmar)",isocode1:"MM / MMR ",code:"95",test:"48,137,741 (26) ",test1:"676,578 (41) "},{test2:"3.102 Billion (172) ",country:"Burundi",isocode1:"BI / BDI ",code:"257",test:"8,988,091 (89) ",test1:"27,830 (147) "},{test2:"27.94 Billion (108) ",country:"Cambodia",isocode1:"KH / KHM ",code:"855",test:"14,494,293 (65) ",test1:"181,035 (90) "},{test2:"42.75 Billion (93) ",country:"Cameroon",isocode1:"CM / CMR ",code:"237",test:"18,879,301 (58) ",test1:"475,440 (54) "},{test2:"1.3 Trillion (14) ",country:"Canada",isocode1:"CA / CAN ",code:"1",test:"33,487,208 (37) ",test1:"9,984,670 (3) "},{test2:"1.626 Billion (189) ",country:"Cape Verde",isocode1:"CV / CPV ",code:"238",test:"429,474 (171) ",test1:"4,033 (176) "},{test2:"1.939 Billion (181) ",country:"Cayman Islands",isocode1:"KY / CYM ",code:"1 345 ",test:"49,035 (207) ",test1:"264 (210) "},{test2:"3.198 Billion (170) ",country:"Central African Republic",isocode1:"CF / CAF ",code:"236",test:"4,511,488 (120) ",test1:"622,984 (45) "},{test2:"15.86 Billion (130) ",country:"Chad",isocode1:"TD / TCD ",code:"235",test:"10,329,208 (79) ",test1:"1,284,000 (22) "},{test2:"244.5 Billion (44) ",country:"Chile",isocode1:"CL / CHL ",code:"56",test:"16,601,707 (60) ",test1:"756,102 (39) "},{test2:"7.973 Trillion (2) ",country:"China",isocode1:"CN / CHN ",code:"86",test:"1,338,612,968 (1) ",test1:"9,596,961 (5) "},{test2:"0 (228) ",country:"Christmas Island",isocode1:"CX / CXR ",code:"61",test:"1,402 (231) ",test1:"135 (221) "},{test2:"0 (228) ",country:"Cocos (Keeling) Islands",isocode1:"CC / CCK ",code:"61",test:"596 (234) ",test1:"14 (233) "},{test2:"395.4 Billion (28) ",country:"Colombia",isocode1:"CO / COL ",code:"57",test:"45,644,023 (28) ",test1:"1,138,914 (27) "},{test2:"751.2 Million (207) ",country:"Comoros",isocode1:"KM / COM ",code:"269",test:"752,438 (161) ",test1:"2,235 (180) "},{test2:"183.2 Million (215) ",country:"Cook Islands",isocode1:"CK / COK ",code:"682",test:"11,870 (222) ",test1:"236 (214) "},{test2:"48.32 Billion (88) ",country:"Costa Rica",isocode1:"CR / CRC ",code:"506",test:"4,253,877 (123) ",test1:"51,100 (130) "},{test2:"82.39 Billion (72) ",country:"Croatia",isocode1:"HR / HRV ",code:"385",test:"4,489,409 (121) ",test1:"56,594 (127) "},{test2:"108.2 Billion (63) ",country:"Cuba",isocode1:"CU / CUB ",code:"53",test:"11,451,652 (72) ",test1:"110,860 (106) "},{test2:"22.7 Billion (113) ",country:"Cyprus",isocode1:"CY / CYP ",code:"357",test:"796,740 (159) ",test1:"9,251 (171) "},{test2:"265.2 Billion (42) ",country:"Czech Republic",isocode1:"CZ / CZE ",code:"420",test:"10,211,904 (80) ",test1:"78,867 (116) "},{test2:"20.64 Billion (120) ",country:"Democratic Republic of the Congo",isocode1:"CD / COD ",code:"243",test:"68,692,542 (18) ",test1:"2,344,858 (13) "},{test2:"203.6 Billion (50) ",country:"Denmark",isocode1:"DK / DNK ",code:"45",test:"5,500,510 (110) ",test1:"43,094 (134) "},{test2:"1.885 Billion (183) ",country:"Djibouti",isocode1:"DJ / DJI ",code:"253",test:"516,055 (168) ",test1:"23,200 (151) "},{test2:"719.6 Million (208) ",country:"Dominica",isocode1:"DM / DMA ",code:"1 767 ",test:"72,660 (202) ",test1:"751 (189) "},{test2:"78 Billion (75) ",country:"Dominican Republic",isocode1:"DO / DOM ",code:"1 809 ",test:"9,650,054 (85) ",test1:"48,670 (132) "},{test2:"107.7 Billion (64) ",country:"Ecuador",isocode1:"EC / ECU ",code:"593",test:"14,573,101 (64) ",test1:"283,561 (74) "},{test2:"443.7 Billion (26) ",country:"Egypt",isocode1:"EG / EGY ",code:"20",test:"83,082,869 (15) ",test1:"1,001,450 (31) "},{test2:"43.63 Billion (90) ",country:"El Salvador",isocode1:"SV / SLV ",code:"503",test:"7,185,218 (99) ",test1:"21,041 (154) "},{test2:"22.95 Billion (112) ",country:"Equatorial Guinea",isocode1:"GQ / GNQ ",code:"240",test:"633,441 (165) ",test1:"28,051 (146) "},{test2:"3.945 Billion (165) ",country:"Eritrea",isocode1:"ER / ERI ",code:"291",test:"5,647,168 (109) ",test1:"117,600 (101) "},{test2:"27.41 Billion (109) ",country:"Estonia",isocode1:"EE / EST ",code:"372",test:"1,299,371 (152) ",test1:"45,228 (133) "},{test2:"68.77 Billion (79) ",country:"Ethiopia",isocode1:"ET / ETH ",code:"251",test:"85,237,338 (14) ",test1:"1,104,300 (28) "},{test2:"105.1 Million (219) ",country:"Falkland Islands",isocode1:"FK / FLK ",code:"500",test:"3,140 (227) ",test1:"12,173 (165) "},{test2:"1000 Million (198) ",country:"Faroe Islands",isocode1:"FO / FRO ",code:"298",test:"48,856 (208) ",test1:"1,393 (183) "},{test2:"3.579 Billion (167) ",country:"Fiji",isocode1:"FJ / FJI ",code:"679",test:"944,720 (157) ",test1:"18,274 (157) "},{test2:"193.5 Billion (53) ",country:"Finland",isocode1:"FI / FIN ",code:"358",test:"5,250,275 (113) ",test1:"338,145 (65) "},{test2:"2.128 Trillion (8) ",country:"France",isocode1:"FR / FRA ",code:"33",test:"64,057,792 (21) ",test1:"643,427 (43) "},{test2:"4.718 Billion (160) ",country:"French Polynesia",isocode1:"PF / PYF ",code:"689",test:"287,032 (179) ",test1:"4,167 (175) "},{test2:"21.11 Billion (118) ",country:"Gabon",isocode1:"GA / GAB ",code:"241",test:"1,514,993 (151) ",test1:"267,667 (77) "},{test2:"2.272 Billion (179) ",country:"Gambia",isocode1:"GM / GMB ",code:"220",test:"1,782,893 (148) ",test1:"11,295 (167) "},{test2:"11.95 Billion (141) ",country:"Gaza Strip",isocode1:"/  ",code:"970",test:"1,551,859 (149) ",test1:"360 (205) "},{test2:"21.51 Billion (117) ",country:"Georgia",isocode1:"GE / GEO ",code:"995",test:"4,615,807 (118) ",test1:"69,700 (121) "},{test2:"2.918 Trillion (5) ",country:"Germany",isocode1:"DE / DEU ",code:"49",test:"82,329,758 (16) ",test1:"357,022 (63) "},{test2:"34.2 Billion (99) ",country:"Ghana",isocode1:"GH / GHA ",code:"233",test:"23,832,495 (47) ",test1:"238,533 (82) "},{test2:"1.066 Billion (196) ",country:"Gibraltar",isocode1:"GI / GIB ",code:"350",test:"28,034 (214) ",test1:"7 (235) "},{test2:"343 Billion (33) ",country:"Greece",isocode1:"GR / GRC ",code:"30",test:"10,737,428 (74) ",test1:"131,957 (97) "},{test2:"1.1 Billion (193) ",country:"Greenland",isocode1:"GL / GRL ",code:"299",test:"57,600 (206) ",test1:"2,166,086 (14) "},{test2:"1.161 Billion (192) ",country:"Grenada",isocode1:"GD / GRD ",code:"1 473 ",test:"90,739 (196) ",test1:"344 (206) "},{test2:"2.5 Billion (178) ",country:"Guam",isocode1:"GU / GUM ",code:"1 671 ",test:"160,595 (187) ",test1:"544 (196) "},{test2:"68.58 Billion (80) ",country:"Guatemala",isocode1:"GT / GTM ",code:"502",test:"13,276,517 (68) ",test1:"108,889 (107) "},{test2:"10.6 Billion (146) ",country:"Guinea",isocode1:"GN / GIN ",code:"224",test:"10,057,975 (81) ",test1:"245,857 (79) "},{test2:"904.2 Million (202) ",country:"Guinea-Bissau",isocode1:"GW / GNB ",code:"245",test:"1,533,964 (150) ",test1:"36,125 (138) "},{test2:"2.966 Billion (173) ",country:"Guyana",isocode1:"GY / GUY ",code:"592",test:"772,298 (160) ",test1:"214,969 (85) "},{test2:"11.5 Billion (144) ",country:"Haiti",isocode1:"HT / HTI ",code:"509",test:"9,035,536 (88) ",test1:"27,750 (148) "},{test2:"0 (228) ",country:"Holy See (Vatican City)",isocode1:"VA / VAT ",code:"39",test:"826 (233) ",test1:"0 (238) "},{test2:"33.72 Billion (101) ",country:"Honduras",isocode1:"HN / HND ",code:"504",test:"7,792,854 (93) ",test1:"112,090 (103) "},{test2:"306.6 Billion (39) ",country:"Hong Kong",isocode1:"HK / HKG ",code:"852",test:"7,055,071 (100) ",test1:"1,104 (184) "},{test2:"196.6 Billion (52) ",country:"Hungary",isocode1:"HU / HUN ",code:"36",test:"9,905,596 (82) ",test1:"93,028 (110) "},{test2:"12.71 Billion (139) ",country:"Iceland",isocode1:"IS / IS ",code:"354",test:"306,694 (178) ",test1:"103,000 (108) "},{test2:"3.297 Trillion (4) ",country:"India",isocode1:"IN / IND ",code:"91",test:"1,166,079,217 (2) ",test1:"3,287,263 (8) "},{test2:"914.6 Billion (15) ",country:"Indonesia",isocode1:"ID / IDN ",code:"62",test:"240,271,522 (4) ",test1:"1,904,569 (17) "},{test2:"841.7 Billion (17) ",country:"Iran",isocode1:"IR / IRN ",code:"98",test:"66,429,284 (19) ",test1:"1,648,195 (19) "},{test2:"103.9 Billion (65) ",country:"Iraq",isocode1:"IQ / IRQ ",code:"964",test:"28,945,657 (40) ",test1:"438,317 (59) "},{test2:"188.4 Billion (54) ",country:"Ireland",isocode1:"IE / IRL ",code:"353",test:"4,203,200 (125) ",test1:"70,273 (120) "},{test2:"2.719 Billion (175) ",country:"Isle of Man",isocode1:"IM / IMN ",code:"44",test:"76,512 (201) ",test1:"572 (195) "},{test2:"201.4 Billion (51) ",country:"Israel",isocode1:"IL / ISR ",code:"972",test:"7,233,701 (97) ",test1:"22,072 (153) "},{test2:"1.823 Trillion (10) ",country:"Italy",isocode1:"IT / ITA ",code:"39",test:"58,126,212 (23) ",test1:"301,340 (72) "},{test2:"33.85 Billion (100) ",country:"Ivory Coast",isocode1:"CI / CIV ",code:"225",test:"20,617,068 (56) ",test1:"322,463 (69) "},{test2:"20.91 Billion (119) ",country:"Jamaica",isocode1:"JM / JAM ",code:"1 876 ",test:"2,825,928 (138) ",test1:"10,991 (168) "},{test2:"4.329 Trillion (3) ",country:"Japan",isocode1:"JP / JPN ",code:"81",test:"127,078,679 (10) ",test1:"377,915 (62) "},{test2:"5.1 Billion (158) ",country:"Jersey",isocode1:"JE / JEY ",code:" ",test:"91,626 (195) ",test1:"116 (222) "},{test2:"31.61 Billion (102) ",country:"Jordan",isocode1:"JO / JOR ",code:"962",test:"6,342,948 (104) ",test1:"89,342 (112) "},{test2:"175.8 Billion (56) ",country:"Kazakhstan",isocode1:"KZ / KAZ ",code:"7",test:"15,399,437 (62) ",test1:"2,724,900 (10) "},{test2:"61.51 Billion (83) ",country:"Kenya",isocode1:"KE / KEN ",code:"254",test:"39,002,772 (33) ",test1:"580,367 (49) "},{test2:"579.5 Million (209) ",country:"Kiribati",isocode1:"KI / KIR ",code:"686",test:"112,850 (190) ",test1:"811 (187) "},{test2:"5 Billion (159) ",country:"Kosovo",isocode1:"/  ",code:"381",test:"1,804,838 (147) ",test1:"10,887 (169) "},{test2:"149.1 Billion (57) ",country:"Kuwait",isocode1:"KW / KWT ",code:"965",test:"2,691,158 (139) ",test1:"17,818 (158) "},{test2:"11.61 Billion (143) ",country:"Kyrgyzstan",isocode1:"KG / KGZ ",code:"996",test:"5,431,747 (112) ",test1:"199,951 (87) "},{test2:"13.98 Billion (134) ",country:"Laos",isocode1:"LA / LAO ",code:"856",test:"6,834,942 (102) ",test1:"236,800 (84) "},{test2:"38.86 Billion (97) ",country:"Latvia",isocode1:"LV / LVA ",code:"371",test:"2,231,503 (141) ",test1:"64,589 (124) "},{test2:"44.06 Billion (89) ",country:"Lebanon",isocode1:"LB / LBN ",code:"961",test:"4,017,095 (126) ",test1:"10,400 (170) "},{test2:"3.293 Billion (169) ",country:"Lesotho",isocode1:"LS / LSO ",code:"266",test:"2,130,819 (142) ",test1:"30,355 (142) "},{test2:"1.526 Billion (191) ",country:"Liberia",isocode1:"LR / LBR ",code:"231",test:"3,441,790 (132) ",test1:"111,369 (104) "},{test2:"88.83 Billion (70) ",country:"Libya",isocode1:"LY / LBY ",code:"218",test:"6,310,434 (105) ",test1:"1,759,540 (18) "},{test2:"4.16 Billion (164) ",country:"Liechtenstein",isocode1:"LI / LIE ",code:"423",test:"34,761 (210) ",test1:"160 (218) "},{test2:"63.33 Billion (82) ",country:"Lithuania",isocode1:"LT / LTU ",code:"370",test:"3,555,179 (130) ",test1:"65,300 (123) "},{test2:"39.37 Billion (96) ",country:"Luxembourg",isocode1:"LU / LUX ",code:"352",test:"491,775 (169) ",test1:"2,586 (179) "},{test2:"18.14 Billion (126) ",country:"Macau",isocode1:"MO / MAC ",code:"853",test:"559,846 (167) ",test1:"28 (230) "},{test2:"18.78 Billion (124) ",country:"Macedonia",isocode1:"MK / MKD ",code:"389",test:"2,066,718 (144) ",test1:"25,713 (150) "},{test2:"20.13 Billion (122) ",country:"Madagascar",isocode1:"MG / MDG ",code:"261",test:"20,653,556 (55) ",test1:"587,041 (47) "},{test2:"11.81 Billion (142) ",country:"Malawi",isocode1:"MW / MWI ",code:"265",test:"14,268,711 (66) ",test1:"118,484 (100) "},{test2:"384.3 Billion (30) ",country:"Malaysia",isocode1:"MY / MYS ",code:"60",test:"25,715,819 (46) ",test1:"329,847 (67) "},{test2:"1.716 Billion (185) ",country:"Maldives",isocode1:"MV / MDV ",code:"960",test:"396,334 (174) ",test1:"298 (209) "},{test2:"14.59 Billion (133) ",country:"Mali",isocode1:"ML / MLI ",code:"223",test:"12,666,987 (70) ",test1:"1,240,192 (25) "},{test2:"9.962 Billion (148) ",country:"Malta",isocode1:"MT / MLT ",code:"356",test:"405,165 (173) ",test1:"316 (207) "},{test2:"133.5 Million (217) ",country:"Marshall Islands",isocode1:"MH / MHL ",code:"692",test:"64,522 (205) ",test1:"181 (216) "},{test2:"6.308 Billion (153) ",country:"Mauritania",isocode1:"MR / MRT ",code:"222",test:"3,129,486 (135) ",test1:"1,030,700 (30) "},{test2:"15.27 Billion (132) ",country:"Mauritius",isocode1:"MU / MUS ",code:"230",test:"1,284,264 (153) ",test1:"2,040 (181) "},{test2:"953.6 Million (201) ",country:"Mayotte",isocode1:"YT / MYT ",code:"262",test:"223,765 (183) ",test1:"374 (204) "},{test2:"1.563 Trillion (11) ",country:"Mexico",isocode1:"MX / MEX ",code:"52",test:"111,211,789 (11) ",test1:"1,964,375 (16) "},{test2:"238.1 Million (213) ",country:"Micronesia",isocode1:"FM / FSM ",code:"691",test:"107,434 (192) ",test1:"702 (192) "},{test2:"10.67 Billion (145) ",country:"Moldova",isocode1:"MD / MDA ",code:"373",test:"4,320,748 (122) ",test1:"33,851 (140) "},{test2:"976.3 Million (200) ",country:"Monaco",isocode1:"MC / MCO ",code:"377",test:"32,965 (211) ",test1:"2 (237) "},{test2:"9.476 Billion (150) ",country:"Mongolia",isocode1:"MN / MNG ",code:"976",test:"3,041,142 (136) ",test1:"1,564,116 (20) "},{test2:"6.816 Billion (152) ",country:"Montenegro",isocode1:"ME / MNE ",code:"382",test:"672,180 (164) ",test1:"13,812 (162) "},{test2:"29 Million (223) ",country:"Montserrat",isocode1:"MS / MSR ",code:"1 664 ",test:"5,097 (226) ",test1:"102 (223) "},{test2:"136.6 Billion (58) ",country:"Morocco",isocode1:"MA / MAR ",code:"212",test:"34,859,364 (35) ",test1:"446,550 (58) "},{test2:"18.94 Billion (123) ",country:"Mozambique",isocode1:"MZ / MOZ ",code:"258",test:"21,669,278 (52) ",test1:"799,380 (36) "},{test2:"13.25 Billion (135) ",country:"Namibia",isocode1:"NA / NAM ",code:"264",test:"2,108,665 (143) ",test1:"824,292 (35) "},{test2:"60 Million (221) ",country:"Nauru",isocode1:"NR / NRU ",code:"674",test:"14,019 (220) ",test1:"21 (232) "},{test2:"31.08 Billion (103) ",country:"Nepal",isocode1:"NP / NPL ",code:"977",test:"28,563,377 (42) ",test1:"147,181 (94) "},{test2:"672 Billion (20) ",country:"Netherlands",isocode1:"NL / NLD ",code:"31",test:"16,715,999 (59) ",test1:"41,543 (135) "},{test2:"2.8 Billion (174) ",country:"Netherlands Antilles",isocode1:"AN / ANT ",code:"599",test:"227,049 (182) ",test1:"800 (188) "},{test2:"3.158 Billion (171) ",country:"New Caledonia",isocode1:"NC / NCL ",code:"687",test:"227,436 (181) ",test1:"18,575 (156) "},{test2:"116.7 Billion (60) ",country:"New Zealand",isocode1:"NZ / NZL ",code:"64",test:"4,213,418 (124) ",test1:"267,710 (76) "},{test2:"16.79 Billion (129) ",country:"Nicaragua",isocode1:"NI / NIC ",code:"505",test:"5,891,199 (108) ",test1:"130,370 (98) "},{test2:"10.04 Billion (147) ",country:"Niger",isocode1:"NE / NER ",code:"227",test:"15,306,252 (63) ",test1:"1,267,000 (23) "},{test2:"335.4 Billion (35) ",country:"Nigeria",isocode1:"NG / NGA ",code:"234",test:"149,229,090 (8) ",test1:"923,768 (33) "},{test2:"10.01 Million (226) ",country:"Niue",isocode1:"NU / NIU ",code:"683",test:"1,398 (232) ",test1:"260 (212) "},{test2:"0 (228) ",country:"Norfolk Island",isocode1:"/ NFK ",code:"672",test:"2,141 (228) ",test1:"36 (229) "},{test2:"40 Billion (94) ",country:"North Korea",isocode1:"KP / PRK ",code:"850",test:"22,665,345 (50) ",test1:"120,538 (99) "},{test2:"900 Million (204) ",country:"Northern Mariana Islands",isocode1:"MP / MNP ",code:"1 670 ",test:"88,662 (197) ",test1:"464 (198) "},{test2:"275.4 Billion (40) ",country:"Norway",isocode1:"NO / NOR ",code:"47",test:"4,660,539 (116) ",test1:"323,802 (68) "},{test2:"66.98 Billion (81) ",country:"Oman",isocode1:"OM / OMN ",code:"968",test:"3,418,085 (133) ",test1:"309,500 (71) "},{test2:"427.3 Billion (27) ",country:"Pakistan",isocode1:"PK / PAK ",code:"92",test:"176,242,949 (6) ",test1:"796,095 (37) "},{test2:"164 Million (216) ",country:"Palau",isocode1:"PW / PLW ",code:"680",test:"20,796 (217) ",test1:"459 (199) "},{test2:"38.83 Billion (98) ",country:"Panama",isocode1:"PA / PAN ",code:"507",test:"3,360,474 (134) ",test1:"75,420 (118) "},{test2:"13.21 Billion (136) ",country:"Papua New Guinea",isocode1:"PG / PNG ",code:"675",test:"6,057,263 (106) ",test1:"462,840 (55) "},{test2:"28.89 Billion (107) ",country:"Paraguay",isocode1:"PY / PRY ",code:"595",test:"6,995,655 (101) ",test1:"406,752 (60) "},{test2:"247.3 Billion (43) ",country:"Peru",isocode1:"PE / PER ",code:"51",test:"29,546,963 (39) ",test1:"1,285,216 (21) "},{test2:"317.5 Billion (37) ",country:"Philippines",isocode1:"PH / PHL ",code:"63",test:"97,976,603 (12) ",test1:"300,000 (73) "},{test2:"0 (228) ",country:"Pitcairn Islands",isocode1:"PN / PCN ",code:"870",test:"48 (235) ",test1:"47 (228) "},{test2:"667.9 Billion (21) ",country:"Poland",isocode1:"PL / POL ",code:"48",test:"38,482,919 (34) ",test1:"312,685 (70) "},{test2:"236.5 Billion (47) ",country:"Portugal",isocode1:"PT / PRT ",code:"351",test:"10,707,924 (75) ",test1:"92,090 (111) "},{test2:"70.23 Billion (78) ",country:"Puerto Rico",isocode1:"PR / PRI ",code:"1",test:"3,971,020 (128) ",test1:"13,790 (163) "},{test2:"91.33 Billion (69) ",country:"Qatar",isocode1:"QA / QAT ",code:"974",test:"833,285 (158) ",test1:"11,586 (166) "},{test2:"15.35 Billion (131) ",country:"Republic of the Congo",isocode1:"CG / COG ",code:"242",test:"4,012,809 (127) ",test1:"342,000 (64) "},{test2:"271.4 Billion (41) ",country:"Romania",isocode1:"RO / ROU ",code:"40",test:"22,215,421 (51) ",test1:"238,391 (83) "},{test2:"2.266 Trillion (6) ",country:"Russia",isocode1:"RU / RUS ",code:"7",test:"140,041,247 (9) ",test1:"17,098,242 (1) "},{test2:"9.706 Billion (149) ",country:"Rwanda",isocode1:"RW / RWA ",code:"250",test:"10,473,282 (77) ",test1:"26,338 (149) "},{test2:"0 (228) ",country:"Saint Barthelemy",isocode1:"BL / BLM ",code:"590",test:"7,448 (224) ",test1:"0 (238) "},{test2:"18 Million (224) ",country:"Saint Helena",isocode1:"SH / SHN ",code:"290",test:"7,637 (223) ",test1:"308 (208) "},{test2:"777.7 Million (206) ",country:"Saint Kitts and Nevis",isocode1:"KN / KNA ",code:"1 869 ",test:"40,131 (209) ",test1:"261 (211) "},{test2:"1.778 Billion (184) ",country:"Saint Lucia",isocode1:"LC / LCA ",code:"1 758 ",test:"160,267 (188) ",test1:"616 (194) "},{test2:"0 (228) ",country:"Saint Martin",isocode1:"MF / MAF ",code:"1 599 ",test:"29,820 (213) ",test1:"54 (227) "},{test2:"48.3 Million (222) ",country:"Saint Pierre and Miquelon",isocode1:"PM / SPM ",code:"508",test:"7,051 (225) ",test1:"242 (213) "},{test2:"1.07 Billion (195) ",country:"Saint Vincent and the Grenadines",isocode1:"VC / VCT ",code:"1 784 ",test:"104,574 (193) ",test1:"389 (203) "},{test2:"1.049 Billion (197) ",country:"Samoa",isocode1:"WS / WSM ",code:"685",test:"219,998 (184) ",test1:"2,831 (178) "},{test2:"1.662 Billion (187) ",country:"San Marino",isocode1:"SM / SMR ",code:"378",test:"30,324 (212) ",test1:"61 (225) "},{test2:"276.5 Million (212) ",country:"Sao Tome and Principe",isocode1:"ST / STP ",code:"239",test:"212,679 (186) ",test1:"964 (185) "},{test2:"576.5 Billion (22) ",country:"Saudi Arabia",isocode1:"SA / SAU ",code:"966",test:"28,686,633 (41) ",test1:"2,149,690 (15) "},{test2:"21.98 Billion (115) ",country:"Senegal",isocode1:"SN / SEN ",code:"221",test:"13,711,597 (67) ",test1:"196,722 (88) "},{test2:"80.34 Billion (74) ",country:"Serbia",isocode1:"RS / SRB ",code:"381",test:"7,379,339 (95) ",test1:"77,474 (117) "},{test2:"1.715 Billion (186) ",country:"Seychelles",isocode1:"SC / SYC ",code:"248",test:"87,476 (198) ",test1:"455 (200) "},{test2:"4.285 Billion (162) ",country:"Sierra Leone",isocode1:"SL / SLE ",code:"232",test:"6,440,053 (103) ",test1:"71,740 (119) "},{test2:"237.3 Billion (46) ",country:"Singapore",isocode1:"SG / SGP ",code:"65",test:"4,657,542 (117) ",test1:"697 (193) "},{test2:"119.5 Billion (59) ",country:"Slovakia",isocode1:"SK / SVK ",code:"421",test:"5,463,046 (111) ",test1:"49,035 (131) "},{test2:"59.34 Billion (84) ",country:"Slovenia",isocode1:"SI / SVN ",code:"386",test:"2,005,692 (145) ",test1:"20,273 (155) "},{test2:"1.078 Billion (194) ",country:"Solomon Islands",isocode1:"SB / SLB ",code:"677",test:"595,613 (166) ",test1:"28,896 (144) "},{test2:"5.524 Billion (155) ",country:"Somalia",isocode1:"SO / SOM ",code:"252",test:"9,832,017 (83) ",test1:"637,657 (44) "},{test2:"491 Billion (25) ",country:"South Africa",isocode1:"ZA / ZAF ",code:"27",test:"49,052,489 (24) ",test1:"1,219,090 (26) "},{test2:"1.335 Trillion (13) ",country:"South Korea",isocode1:"KR / KOR ",code:"82",test:"48,508,972 (25) ",test1:"99,720 (109) "},{test2:"1.403 Trillion (12) ",country:"Spain",isocode1:"ES / ESP ",code:"34",test:"40,525,002 (32) ",test1:"505,370 (52) "},{test2:"91.87 Billion (68) ",country:"Sri Lanka",isocode1:"LK / LKA ",code:"94",test:"21,324,791 (53) ",test1:"65,610 (122) "},{test2:"88.08 Billion (71) ",country:"Sudan",isocode1:"SD / SDN ",code:"249",test:"41,087,825 (29) ",test1:"2,505,813 (11) "},{test2:"4.254 Billion (163) ",country:"Suriname",isocode1:"SR / SUR ",code:"597",test:"481,267 (170) ",test1:"163,820 (92) "},{test2:"0 (228) ",country:"Svalbard",isocode1:"SJ / SJM ",code:" ",test:"2,116 (229) ",test1:"62,045 (125) "},{test2:"5.702 Billion (154) ",country:"Swaziland",isocode1:"SZ / SWZ ",code:"268",test:"1,123,913 (156) ",test1:"17,364 (159) "},{test2:"344.3 Billion (32) ",country:"Sweden",isocode1:"SE / SWE ",code:"46",test:"9,059,651 (87) ",test1:"450,295 (56) "},{test2:"316.7 Billion (38) ",country:"Switzerland",isocode1:"CH / CHE ",code:"41",test:"7,604,467 (94) ",test1:"41,277 (136) "},{test2:"98.83 Billion (66) ",country:"Syria",isocode1:"SY / SYR ",code:"963",test:"20,178,485 (57) ",test1:"185,180 (89) "},{test2:"712 Billion (19) ",country:"Taiwan",isocode1:"TW / TWN ",code:"886",test:"22,974,347 (49) ",test1:"35,980 (139) "},{test2:"13.16 Billion (137) ",country:"Tajikistan",isocode1:"TJ / TJK ",code:"992",test:"7,349,145 (96) ",test1:"143,100 (96) "},{test2:"54.25 Billion (87) ",country:"Tanzania",isocode1:"TZ / TZA ",code:"255",test:"41,048,532 (30) ",test1:"947,300 (32) "},{test2:"547.4 Billion (24) ",country:"Thailand",isocode1:"TH / THA ",code:"66",test:"65,905,410 (20) ",test1:"513,120 (51) "},{test2:"2.52 Billion (177) ",country:"Timor-Leste",isocode1:"TL / TLS ",code:"670",test:"1,131,612 (155) ",test1:"14,874 (160) "},{test2:"5.118 Billion (157) ",country:"Togo",isocode1:"TG / TGO ",code:"228",test:"6,019,877 (107) ",test1:"56,785 (126) "},{test2:"1.5 Million (227) ",country:"Tokelau",isocode1:"TK / TKL ",code:"690",test:"1,416 (230) ",test1:"12 (234) "},{test2:"549 Million (211) ",country:"Tonga",isocode1:"TO / TON ",code:"676",test:"120,898 (189) ",test1:"747 (190) "},{test2:"29.01 Billion (106) ",country:"Trinidad and Tobago",isocode1:"TT / TTO ",code:"1 868 ",test:"1,229,953 (154) ",test1:"5,128 (174) "},{test2:"81.71 Billion (73) ",country:"Tunisia",isocode1:"TN / TUN ",code:"216",test:"10,486,339 (76) ",test1:"163,610 (93) "},{test2:"902.7 Billion (16) ",country:"Turkey",isocode1:"TR / TUR ",code:"90",test:"76,805,524 (17) ",test1:"783,562 (38) "},{test2:"29.78 Billion (104) ",country:"Turkmenistan",isocode1:"TM / TKM ",code:"993",test:"4,884,887 (114) ",test1:"488,100 (53) "},{test2:"216 Million (214) ",country:"Turks and Caicos Islands",isocode1:"TC / TCA ",code:"1 649 ",test:"22,942 (216) ",test1:"948 (186) "},{test2:"14.94 Million (225) ",country:"Tuvalu",isocode1:"TV / TUV ",code:"688",test:"12,373 (221) ",test1:"26 (231) "},{test2:"39.38 Billion (95) ",country:"Uganda",isocode1:"UG / UGA ",code:"256",test:"32,369,558 (38) ",test1:"241,038 (81) "},{test2:"339.8 Billion (34) ",country:"Ukraine",isocode1:"UA / UKR ",code:"380",test:"45,700,395 (27) ",test1:"603,550 (46) "},{test2:"184.3 Billion (55) ",country:"United Arab Emirates",isocode1:"AE / ARE ",code:"971",test:"4,798,491 (115) ",test1:"83,600 (115) "},{test2:"2.226 Trillion (7) ",country:"United Kingdom",isocode1:"GB / GBR ",code:"44",test:"61,113,205 (22) ",test1:"243,610 (80) "},{test2:"14.26 Trillion (1) ",country:"United States",isocode1:"US / USA ",code:"1",test:"307,212,123 (3) ",test1:"9,826,675 (4) "},{test2:"43.16 Billion (92) ",country:"Uruguay",isocode1:"UY / URY ",code:"598",test:"3,494,382 (131) ",test1:"176,215 (91) "},{test2:"1.577 Billion (190) ",country:"US Virgin Islands",isocode1:"VI / VIR ",code:"1 340 ",test:"109,825 (191) ",test1:"1,910 (182) "},{test2:"71.67 Billion (77) ",country:"Uzbekistan",isocode1:"UZ / UZB ",code:"998",test:"27,606,007 (44) ",test1:"447,400 (57) "},{test2:"988.5 Million (199) ",country:"Vanuatu",isocode1:"VU / VUT ",code:"678",test:"218,519 (185) ",test1:"12,189 (164) "},{test2:"357.4 Billion (31) ",country:"Venezuela",isocode1:"VE / VEN ",code:"58",test:"26,814,843 (45) ",test1:"912,050 (34) "},{test2:"241.7 Billion (45) ",country:"Vietnam",isocode1:"VN / VNM ",code:"84",test:"86,967,524 (13) ",test1:"331,210 (66) "},{test2:"60 Million (220) ",country:"Wallis and Futuna",isocode1:"WF / WLF ",code:"681",test:"15,289 (218) ",test1:"142 (220) "},{test2:"11.95 Billion (140) ",country:"West Bank",isocode1:"/  ",code:"970",test:"2,461,267 (140) ",test1:"5,860 (172) "},{test2:"900 Million (203) ",country:"Western Sahara",isocode1:"EH / ESH ",code:" ",test:"405,210 (172) ",test1:"266,000 (78) "},{test2:"55.28 Billion (85) ",country:"Yemen",isocode1:"YE / YEM ",code:"967",test:"23,822,783 (48) ",test1:"527,968 (50) "},{test2:"17.5 Billion (128) ",country:"Zambia",isocode1:"ZM / ZMB ",code:"260",test:"11,862,740 (71) ",test1:"752,618 (40) "},{test2:"1.925 Billion (182) ",country:"Zimbabwe",isocode1:"ZW / ZWE ",code:"263",test:"11,392,629 (73) ",test1:"390,757 (61)"}];
	
     for(var i=0;i<countrycodes.length;i++){
     	countrycodes[i].country=countrycodes[i].country.toLowerCase();
		CountryCodeModel.update({code:countrycodes[i].code},{$set:countrycodes[i]},{upsert:true},function(err,countrycodesstatus){
			if(err){
				//res.send("error in db ")
				// logger.error("error in db");
			}else if(countrycodesstatus==1){
				//res.send("Workcategory uploaed");
				// logger.log("log","subscriptionarray loaded loaded");
				console.log("emailtemplate :"+i);
			}else{
				//res.send("");
				// logger.error("log","ssssssss");
			}
		})
	};
	res.send("default country code loaded");
}

exports.addStaticTemplates = function(req,res){
	var userid = req.user.userid;
	var templatedata = req.body.templatedata;
	if(req.user.isAdmin==false){
    	res.send({"error":{"message":"You are not authorized to add static templates"}});
    }else{
      	_validateAddStaticTemplates(res,templatedata,userid);
    }    
}
var _validateAddStaticTemplates = function(res,templatedata,userid){
	if(templatedata == undefined){
		res.send({"error":{"message":"Please enter templatedata"}});
	}else if(templatedata.type == undefined || templatedata.type == ""){
		res.send({"error":{"message":"Please enter template type"}});
	}else if(["hp","au","pp","tc","sa"].indexOf(templatedata.type.toLowerCase())<0){
		res.send({"error":{"message":"template type must be HP or AU or PP or TC or SA"}});
	}else if(templatedata.template == undefined || templatedata.template == ""){
		res.send({"error":{"message":"Please enter template"}});
	}else{
		_checkStaticTemplateAlreadyExist(res,templatedata,userid);
	}
}
var _checkStaticTemplateAlreadyExist = function(res,templatedata,userid){
	var temp_type = templatedata.type.toLowerCase();
	console.log("temp_type : "+temp_type);
	StaticTemplateModel.findOne({type:temp_type},function(err,templatestatus){
		if(err){
			logger.emit("error","Database Error:_checkStaticTemplateAlreadyExist"+err,userid);
			res.send({"error":{"code":"ED001","message":"Database Issue"}});
		}else if(templatestatus){
			res.send({"error":{"code":"ED001","message":"template already exist"}});
		}else{
			_addStaticTemplates(res,templatedata,userid);
		}		
	})
}
var _addStaticTemplates = function(res,templatedata,userid){
	templatedata.type = templatedata.type.toLowerCase();
	templatedata.createdate = new Date();
	console.log("templatedata : "+JSON.stringify(templatedata));
	var statictemplatemodel = new StaticTemplateModel(templatedata);
	statictemplatemodel.save(function(err,temp){
		if(err){
			logger.emit("error","Database Error:_addStaticTemplates : "+err,userid);
			res.send({"error":{"code":"ED001","message":"Database Issue"}});
		}else{
			///////////////////////////////////
			_successfullAddStaticTemplates(res);
			///////////////////////////////////	
		}
	})
}
var _successfullAddStaticTemplates=function(res){
	res.send({"success":{"message":"Static Template Added successfully"}});
}

exports.getStaticTemplate = function(req,res){
	// var userid = req.user.userid;
	var type = req.query.type;
	var result = req.query.result;
   	_validateGetStaticTemplates(res,type,result);
}
var _validateGetStaticTemplates = function (res,type,result) {
	if(type == undefined){
		res.send({"error":{"code":"ED001","message":"Please pass type"}});
	}else if(["hp","au","pp","tc","sa"].indexOf(type.toLowerCase())<0){
		res.send({"error":{"message":"type must be HP or AU or PP or TC or SA"}});
	}else{
		_getStaticTemplate(res,type,result);
	}
}
var _getStaticTemplate = function(res,type,result) {
	var temp_type = type.toLowerCase();
	StaticTemplateModel.findOne({type:temp_type},{type:1,template:1,_id:0},function(err,template){
		if(err){
			logger.emit("error","Database Error:_getStaticTemplate"+err);
			res.send({"error":{"code":"ED001","message":"Database Issue"}});
		}else if(!template){
			res.send({"error":{"code":"AD001","message":"template does not exist"}});
		}else{
			/////////////////////////////////////////////
			_successfullGetStaticTemplates(res,template,result);
			/////////////////////////////////////////////
		}		
	})	
}
var _successfullGetStaticTemplates=function(res,template,result){
	console.log(result);
	if(result==undefined){
		res.send(template.template);
	}else if(result == "json"){
		res.send({"success":{"message":"Getting Result Successfully",template:template}});
	}else{
		res.send({"error":{"code":"AD001","message":"result should be json"}});
	}
}

exports.updateStaticTemplates = function(req,res){
	var userid = req.user.userid;
	var type = req.query.type;
	var templatedata = req.body.templatedata;
	if(req.user.isAdmin==false){
    	res.send({"error":{"message":"You are not authorized to update static templates"}});
    }else{
    	if(type == undefined){
    		res.send({"error":{"message":"Please pass type"}});
    	}else{
    		_validateUpdateStaticTemplates(res,type,templatedata,userid);	
    	}      	
    }    
}
var _validateUpdateStaticTemplates = function(res,type,templatedata,userid){
	if(templatedata == undefined){
		res.send({"error":{"message":"Please enter templatedata"}});
	}else if(templatedata.type != undefined){	
		res.send({"error":{"message":"Can't update template type"}});
	}else if(templatedata.template == undefined || templatedata.template == ""){
		res.send({"error":{"message":"Please enter template"}});
	}else{
		_updateStaticTemplates(res,type,templatedata,userid);
	}
}
var _updateStaticTemplates = function(res,type,templatedata,userid){
	templatedata.updateddate = new Date();
	StaticTemplateModel.update({type:type.toLowerCase()},{$set:templatedata},function(err,templatestatus){
		if(err){
			logger.emit("error","Database Issue "+err);
			res.send({"error":{"message":"Database Issue"}});
		}else if(templatestatus==0){
			res.send({"error":{"message":"type is wrong"}});
		}else{
			res.send({"success":{"message":"Template type updated successfully"}});
		}
	})
}
exports.sendMail = function(message,smtpconfig,callback){
  var smtpTransport = nodemailer.createTransport("SMTP",smtpconfig);

  message.html="<div width=500 height=100 style='background-color:black'><img width=200 height=100 src='http://ec2-54-255-211-121.ap-southeast-1.compute.amazonaws.com/assets/images/orderzapp.png'></img><h2><font color=white>Reach. Share. Know. </font></h2></div><br>"+message.html;
  smtpTransport.sendMail(message, 
 	  function (error, success) {
      if(error){
        logger.error("Unable to send via Prodonus: " + error.message);
        callback("failure");
      }else{
        logger.emit("log","email sent");
       callback("success"); 
      }
      //sending succussful then success
    });
};
