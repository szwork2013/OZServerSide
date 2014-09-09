var EmailTemplateModel=require('./email-template-model');
var CONFIG = require('config').OrderZapp;
var S=require("string");
var commonapi=require("./common-api");
var logger=require("./logger");
exports.getAllEmailTemplate=function(req,res){
	EmailTemplateModel.find({},{_id:0,__v:0},function(err,emailtemplate){
		if(err){
			logger.error("error in gettin email templates");
		}
		else{
			res.send(emailtemplate);
		}
	})
};
exports.loadEmailTemplate=function(req,res){
	var emailtemplatedata=[ 
		{
			templatetype: "verify",
			subject: "OrderZapp Account Activation",
			description: "Thank you for Registering to OrderZapp!<br> To activate your account, please copy and paste this verification token:<b><otp></b> in Your OrderZapp Mobile App."
		},
		{
			templatetype: "welcome",
			subject: "Welcome To OrderZapp",
			description: "Hi <firstname>,<br> Welcome to OrderZapp! "
		},
		{
			templatetype: "invoice",
			subject: "Invocie of Suborder: <suborderid>",
			description: "Dear <firstname>,<br> We are happy to inform you that your Suborder : <suborderid> has been successfully delivered. You can view/print your order invoice by clicking on this <a href='<invoiceurl>'>link</a>.<br><br>From OrderZapp.<br>www.order-zapp.com"
		}

		]


     for(var i=0;i<emailtemplatedata.length;i++){
		EmailTemplateModel.update({templatetype:emailtemplatedata[i].templatetype},{$set:emailtemplatedata[i]},{upsert:true},function(err,langcodeupdatestatus){
			if(err){
				//res.send("error in db ")
				// logger.error("error in db");
			}else if(langcodeupdatestatus==1){
				//res.send("Workcategory uploaed");
				// logger.log("log","subscriptionarray loaded loaded");
				console.log("emailtemplate :"+i);
			}else{
				//res.send("");
				// logger.error("log","ssssssss");
			}
		})
	};
	res.send("default email template loads");
}
exports.sendEmailNotification = function(templatetype,data,to,callback){
  EmailTemplateModel.findOne({templatetype:templatetype},function(err,emailtemplate){
  	if(err){
  		logger.emit("error","function:sendEmailNotification:"+err)
  		callback({error:{code:"ED001",message:"Error in Database"}})
  	}else if(!emailtemplate){
  		callback({error:{message:"Email Template not exist for "+templatetype}})
  	}else{
  		var subject=S(emailtemplate.subject);
  		data=JSON.stringify(data);
  		data=JSON.parse(data);
  		var html=S(emailtemplate.description);
  		//replace all in subject
  		subject=subject.replaceAll("<suborderid>",data.suborderid);



  		//replace all in html
  		html=html.replaceAll("<otp>",data.otp);
  		html=html.replaceAll("<firstname>",data.firstname);
  		html=html.replaceAll("<suborderid>",data.suborderid);
  		html=html.replaceAll("<invoiceurl>",data.invoiceurl);
  		
			var emailmessage = {
        from: "OrderZapp  <noreply@orderzapp.com>", // sender address
        to: to, // list of receivers
        subject:subject.s, // Subject line
        html: html.s
      };
      commonapi.sendMail(emailmessage,CONFIG.smtp_general, function (result){
        if(result=="failure"){
        	callback({error:{message:"Email Server Issue"}})
          logger.emit("error","Order(suborderid:"+suborder.suborderid+") creation notification not sent to "+emailmessage.to);
        }else{
        	callback(null,{success:{message:"Email sent successfully to "+to}})
          logger.emit("log","Email sent successfully to "+to);
        }
      });
  	}
  })
};


//first time
